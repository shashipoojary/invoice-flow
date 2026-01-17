import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { Resend } from 'resend';
import { getReminderEmailTemplate } from '@/lib/reminder-email-templates';
import { canEnableReminder } from '@/lib/subscription-validator';
import { enqueueBackgroundJob } from '@/lib/queue-helper';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { invoiceId, reminderType = 'friendly' } = await request.json();
    
    // Get base URL for invoice links
    const getBaseUrl = () => {
      if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
      if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
      const host = request.headers.get('x-forwarded-host');
      const proto = request.headers.get('x-forwarded-proto') || 'https';
      if (host) return `${proto}://${host}`;
      return '';
    };
    const baseUrl = getBaseUrl();

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    // Get invoice details with reminder settings and late fees settings
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .select(`
        id,
        invoice_number,
        due_date,
        status,
        total,
        public_token,
        reminder_count,
        last_reminder_sent,
        reminder_settings,
        late_fees,
        clients (
          name,
          email,
          company,
          phone,
          address
        ),
        user_id
      `)
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Extract and validate client email
    // Supabase returns clients as an object (not array) when using .single()
    // Handle both array and object cases for type safety
    const clients = Array.isArray(invoice.clients) ? invoice.clients[0] : invoice.clients;
    const clientEmail = clients?.email;
    const clientName = clients?.name || 'Valued Customer';
    
    if (!clientEmail || typeof clientEmail !== 'string') {
      return NextResponse.json({ 
        error: 'Client email is required and must be valid',
        details: 'The invoice must have a valid client email address'
      }, { status: 400 });
    }

    // Validate email format (define regex once)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clientEmail.trim())) {
      return NextResponse.json({ 
        error: 'Invalid email format',
        details: 'The client email address is not in a valid format'
      }, { status: 400 });
    }

    // Check if auto reminders are enabled for this invoice
    let reminderSettings = null;
    try {
      reminderSettings = invoice.reminder_settings ? JSON.parse(invoice.reminder_settings) : null;
    } catch {
      console.log(`⚠️ Invalid reminder settings for invoice ${invoice.invoice_number}`);
    }

    // Check if auto reminders are enabled
    if (!reminderSettings || !reminderSettings.enabled) {
      return NextResponse.json({ error: 'Auto reminders are not enabled for this invoice' }, { status: 400 });
    }

    // Check if invoice is already paid
    if (invoice.status === 'paid') {
      return NextResponse.json({ 
        error: 'Invoice is already paid',
        details: 'Cannot send reminders for invoices that are already marked as paid'
      }, { status: 400 });
    }

    // Check if invoice is fully paid via partial payments
    const { data: payments } = await supabaseAdmin
      .from('invoice_payments')
      .select('amount')
      .eq('invoice_id', invoice.id);

    if (payments && payments.length > 0) {
      const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
      if (totalPaid >= invoice.total) {
        return NextResponse.json({ 
          error: 'Invoice is fully paid',
          details: `Invoice is fully paid via partial payments ($${totalPaid.toFixed(2)} of $${invoice.total.toFixed(2)}). Cannot send reminders for fully paid invoices.`
        }, { status: 400 });
      }
    }

    // CRITICAL: Check subscription reminder limit BEFORE sending
    // Free plan users are limited to 1 reminder per invoice
    const reminderLimitCheck = await canEnableReminder(invoice.user_id, invoice.id);
    if (!reminderLimitCheck.allowed) {
      return NextResponse.json({ 
        error: reminderLimitCheck.reason || 'Reminder limit reached',
        limitReached: true,
        limitType: reminderLimitCheck.limitType
      }, { status: 403 });
    }

    // Check if invoice is overdue
    const dueDate = new Date(invoice.due_date);
    const today = new Date();
    const isOverdue = today > dueDate;
    let daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (!isOverdue) {
      return NextResponse.json({ error: 'Invoice is not overdue yet' }, { status: 400 });
    }

    // Try to enqueue job if queue is enabled
    // Feature flag: ENABLE_ASYNC_QUEUE must be 'true' to use queue
    const useQueue = process.env.ENABLE_ASYNC_QUEUE === 'true';

    if (useQueue) {
      const queueResult = await enqueueBackgroundJob(
        'send_reminder',
        {
          invoiceId: invoice.id,
          reminderType,
          daysOverdue,
          clientEmail: (invoice.clients as any)?.email || '',
          clientName: (invoice.clients as any)?.name || '',
        },
        {
          retries: 3,
          deduplicationId: `send_reminder_${invoice.id}_${reminderType}_${Date.now()}`,
        }
      );

      if (queueResult.queued) {
        // Update invoice reminder count IMMEDIATELY for better UX
        // This ensures UI updates right away, even though email sends in background
        await supabaseAdmin
          .from('invoices')
          .update({
            reminder_count: (invoice.reminder_count || 0) + 1,
            last_reminder_sent: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', invoice.id);

        // Job queued successfully, return immediately
        console.log(`✅ Reminder for invoice ${invoice.invoice_number} queued (jobId: ${queueResult.jobId})`);
        return NextResponse.json({
          success: true,
          queued: true,
          jobId: queueResult.jobId,
          message: 'Reminder queued for sending',
          totalPayable: invoice.total, // Include for consistency
        });
      }

      // Queue failed, log and fall through to sync processing
      console.warn('Queue failed, falling back to synchronous processing:', queueResult.error);
    }

    // Get user email to verify if sending to own email (for free plan check)
    // Query auth.users table via RPC or direct query to get user email
    let userEmail = '';
    try {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(invoice.user_id);
      userEmail = authUser?.user?.email?.toLowerCase() || '';
    } catch (error) {
      console.error('Error fetching user email:', error);
      // Try alternative: get from user_settings business_email
      const { data: settingsData } = await supabaseAdmin
        .from('user_settings')
        .select('business_email')
        .eq('user_id', invoice.user_id)
        .single();
      userEmail = settingsData?.business_email?.toLowerCase() || '';
    }
    
    const recipientEmail = clientEmail.trim().toLowerCase();
    const isSendingToOwnEmail = userEmail && recipientEmail === userEmail;
    
    console.log('Email recipient check:', {
      userEmail,
      recipientEmail,
      isSendingToOwnEmail,
      emailMatch: userEmail === recipientEmail
    });

    // Get ALL user business settings from user_settings table (properly isolated per user)
    const { data: userSettings, error: settingsError } = await supabaseAdmin
      .from('user_settings')
      .select('business_name, business_email, business_phone, business_address, website, payment_notes, paypal_email, cashapp_id, venmo_id, google_pay_upi, apple_pay_id, bank_account, bank_ifsc_swift, bank_iban, stripe_account')
      .eq('user_id', invoice.user_id)
      .single();

    if (settingsError) {
      console.error('Error fetching user settings:', settingsError);
    }

    // Use Resend free plan default email address
    const fromAddress = `${userSettings?.business_name || 'FlowInvoicer'} <onboarding@resend.dev>`;

    // Use userSettings as businessSettings (all business details are in user_settings table)
    const businessSettings: {
      business_name?: string;
      business_email?: string;
      business_phone?: string;
      business_address?: string;
      website?: string;
      payment_notes?: string;
      paypal_email?: string;
      cashapp_id?: string;
      venmo_id?: string;
      google_pay_upi?: string;
      apple_pay_id?: string;
      bank_account?: string;
      bank_ifsc_swift?: string;
      bank_iban?: string;
      stripe_account?: string;
    } = userSettings || {};

    // Fetch partial payments to calculate remaining balance for late fee calculations
    // IMPORTANT: For "sent" invoices, do NOT use partial payments - use original total
    // Only "pending" or "scheduled" invoices should consider partial payments
    let totalPaid = 0;
    let remainingBalance = invoice.total;
    
    // Only consider partial payments if invoice is NOT "sent" (i.e., it's pending/scheduled)
    if (invoice.status !== 'sent' && invoice.status !== 'cancelled') {
      const { data: paymentRecords } = await supabaseAdmin
        .from('invoice_payments')
        .select('amount')
        .eq('invoice_id', invoice.id);
      
      if (paymentRecords && paymentRecords.length > 0) {
        totalPaid = paymentRecords.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
        remainingBalance = Math.max(0, invoice.total - totalPaid);
      }
    }
    
    // Calculate current total including late fees (same logic as public invoice page)
    const currentDate = new Date();
    const dueDateForCalc = new Date(invoice.due_date);
    const todayStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    const dueDateStart = new Date(dueDateForCalc.getFullYear(), dueDateForCalc.getMonth(), dueDateForCalc.getDate());
    
    const isOverdueCalc = dueDateStart < todayStart && invoice.status !== 'paid';
    
    // ALWAYS calculate daysOverdue if invoice is overdue (regardless of late fees settings)
    if (isOverdueCalc && invoice.status !== 'paid') {
      daysOverdue = Math.round((todayStart.getTime() - dueDateStart.getTime()) / (1000 * 60 * 60 * 24));
    } else {
      daysOverdue = 0;
    }
    
    // Calculate base amount
    // For "sent" invoices: use original total (ignore partial payments)
    // For "pending"/"scheduled" invoices: use remaining balance (consider partial payments)
    const baseAmount = (invoice.status === 'sent' || invoice.status === 'cancelled') ? invoice.total : remainingBalance;
    
    let lateFeesAmount = 0;
    let totalPayable = baseAmount;
    
    // Parse late fees settings
    let lateFeesSettings = null;
    if (invoice.late_fees) {
      try {
        lateFeesSettings = typeof invoice.late_fees === 'string' ? JSON.parse(invoice.late_fees) : invoice.late_fees;
      } catch (e) {
        console.log('Failed to parse late_fees JSON:', e);
        lateFeesSettings = null;
      }
    }
    
    // Calculate late fees if invoice is overdue and late fees are enabled
    // IMPORTANT: For percentage-based late fees, calculate on remaining balance (after partial payments)
    if (isOverdueCalc && invoice.status !== 'paid' && lateFeesSettings && lateFeesSettings.enabled) {
      const gracePeriod = lateFeesSettings.gracePeriod || 0;
      const chargeableDays = Math.max(0, daysOverdue - gracePeriod);
      
      if (chargeableDays > 0) {
        if (lateFeesSettings.type === 'percentage') {
          // Calculate late fee on remaining balance (after partial payments)
          lateFeesAmount = baseAmount * ((lateFeesSettings.amount || 0) / 100);
        } else if (lateFeesSettings.type === 'fixed') {
          lateFeesAmount = lateFeesSettings.amount || 0;
        }
        totalPayable = baseAmount + lateFeesAmount;
      }
    }

    // Transform invoice data to match template structure
    const templateInvoice = {
      invoiceNumber: invoice.invoice_number,
      total: totalPayable, // Use totalPayable which includes late fees
      baseTotal: baseAmount, // Base amount (remaining balance after partial payments, before late fees)
      originalTotal: invoice.total, // Original invoice total (before partial payments)
      lateFees: lateFeesAmount, // Late fees amount
      hasLateFees: lateFeesAmount > 0, // Whether late fees apply
      totalPaid: totalPaid, // Total paid via partial payments
      remainingBalance: baseAmount, // Remaining balance (before late fees)
      dueDate: invoice.due_date,
      publicToken: invoice.public_token,
      client: {
        name: clientName,
        email: clientEmail
      }
    };

    // Transform business settings to match template structure
    const templateBusinessSettings = {
      businessName: businessSettings?.business_name || 'FlowInvoicer',
      email: businessSettings?.business_email || '',
      phone: businessSettings?.business_phone || '',
      website: businessSettings?.website || '',
      logo: '', // Logo not currently used in reminder template
      tagline: '',
      paymentNotes: businessSettings?.payment_notes || ''
    };

    // Get reminder email template using the new template function
    const reminderTemplate = getReminderEmailTemplate(
      templateInvoice,
      templateBusinessSettings,
      reminderType as 'friendly' | 'polite' | 'firm' | 'urgent',
      daysOverdue,
      baseUrl
    );

    // Use the new reminder email template
    const emailHtml = reminderTemplate.html;

    // Format email for Resend - use simple email format (not "Name <email>") for better compatibility
    // Resend free plan works best with plain email addresses
    // Extract clean email address (remove any "Name <email>" formatting)
    let cleanEmail = clientEmail.trim();
    
    // Extract email if it's in "Name <email>" format
    if (cleanEmail.includes('<') && cleanEmail.includes('>')) {
      const emailMatch = cleanEmail.match(/<([^>]+)>/);
      if (emailMatch && emailMatch[1]) {
        cleanEmail = emailMatch[1].trim();
      }
    }
    
    // Validate clean email format
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json({ 
        error: 'Invalid email format', 
        details: 'The recipient email address is not in a valid format. Please check the client email address.'
      }, { status: 400 });
    }
    
    // Use plain email address (Resend prefers this for free plan)
    // We'll pass just the email string, not "Name <email>" format
    const formattedEmail = cleanEmail;

    // Send email using Resend with the new template
    const emailResult = await resend.emails.send({
      from: fromAddress,
      to: formattedEmail,
      subject: reminderTemplate.subject,
      html: emailHtml,
    });

    if (emailResult.error) {
      console.error('Email sending failed:', emailResult.error);
      
      // Check error type and provide helpful messages for free plan users
      const errorMessage = emailResult.error.message || '';
      const isDomainError = errorMessage.includes('domain is not verified') || 
                           errorMessage.includes('verify your domain') ||
                           errorMessage.includes('only send testing emails to your own email');
      const isRateLimitError = errorMessage.includes('Too many requests') || 
                              errorMessage.includes('rate limit') ||
                              errorMessage.includes('2 requests per second');
      
      // If we're sending to own email but still getting domain error, it might be a different issue
      // Log the full error for debugging
      console.error('Email error details:', {
        errorMessage,
        recipientEmail,
        userEmail,
        isSendingToOwnEmail,
        fromAddress
      });
      
      // Determine failure reason with helpful messages for free plan
      let failureReason = errorMessage;
      if (isDomainError && !isSendingToOwnEmail) {
        failureReason = 'Free plan restriction: Can only send to your own email. Verify domain at resend.com/domains to send to clients.';
      } else if (isDomainError && isSendingToOwnEmail) {
        // This shouldn't happen if sending to own email - might be a different issue
        failureReason = `Email sending failed: ${errorMessage}. If you're sending to your own email, check Resend API key configuration.`;
      } else if (isRateLimitError) {
        failureReason = 'Rate limit exceeded. Free plan allows 2 requests/second. Please wait and try again.';
      }
      
      // Try to find existing failed reminder for this invoice+type
      const { data: existingReminders, error: findError } = await supabaseAdmin
        .from('invoice_reminders')
        .select('id')
        .eq('invoice_id', invoice.id)
        .eq('reminder_type', reminderType)
        .eq('reminder_status', 'failed')
        .order('created_at', { ascending: false })
        .limit(1);

      const existingReminder = existingReminders && existingReminders.length > 0 ? existingReminders[0] : null;

      if (existingReminder) {
        // Update existing failed reminder instead of creating a new one
        await supabaseAdmin
          .from('invoice_reminders')
          .update({
            overdue_days: daysOverdue,
            sent_at: new Date().toISOString(),
            failure_reason: failureReason,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingReminder.id);
      } else {
        // No existing failed reminder, create a new one
        await supabaseAdmin
        .from('invoice_reminders')
        .insert({
          invoice_id: invoice.id,
          reminder_type: reminderType,
          overdue_days: daysOverdue,
          email_id: null,
          reminder_status: 'failed',
            failure_reason: failureReason
          });
      }

      // Return appropriate error response based on error type
      if (isDomainError && !isSendingToOwnEmail) {
        // Only show domain error if NOT sending to own email
        return NextResponse.json({ 
          error: 'Free Plan Limitation', 
          details: 'Email sending is handled by FlowInvoicer. Please contact support if you encounter any issues.',
          requiresDomainVerification: true,
          isFreePlan: true
        }, { status: 422 });
      } else if (isDomainError && isSendingToOwnEmail) {
        // Unexpected error when sending to own email - show actual error
        return NextResponse.json({ 
          error: 'Email Configuration Issue', 
          details: `Email sending failed even though sending to your own email. Error: ${errorMessage}. Please check your Resend API key configuration or contact support.`,
          originalError: errorMessage,
          recipientEmail,
          userEmail
        }, { status: 500 });
      }
      
      if (isRateLimitError) {
        return NextResponse.json({ 
          error: 'Rate Limit Exceeded', 
          details: 'Resend free plan has a rate limit of 2 requests per second. Please wait a moment and try again, or upgrade your Resend plan for higher limits.',
          isRateLimit: true,
          retryAfter: 1
        }, { status: 429 });
      }

      // Generic error - reminder already recorded above
      return NextResponse.json({ 
        error: 'Failed to send reminder email', 
        details: errorMessage || 'Email sending failed',
        hasApiKey: !!process.env.RESEND_API_KEY,
        suggestion: 'Free plan limitations: 1) Can only send to your own email, 2) Rate limit is 2 requests/second'
      }, { status: 500 });
    }

    // Success - record the reminder
    const emailData = emailResult.data;

    // Check if there's an existing scheduled reminder for this invoice+type and update it instead of creating a new one
    const { data: existingScheduledReminders } = await supabaseAdmin
      .from('invoice_reminders')
      .select('id')
      .eq('invoice_id', invoice.id)
      .eq('reminder_type', reminderType)
      .eq('reminder_status', 'scheduled')
      .order('created_at', { ascending: false })
      .limit(1);

    const existingScheduledReminder = existingScheduledReminders && existingScheduledReminders.length > 0 ? existingScheduledReminders[0] : null;

    let reminderUpdated = false;
    let reminderId: string | null = null;

    if (existingScheduledReminder) {
      // Update existing scheduled reminder to sent
      const { error: updateError, data: updateData } = await supabaseAdmin
        .from('invoice_reminders')
        .update({
          reminder_status: 'sent',
          email_id: emailData?.id || null,
          sent_at: new Date().toISOString(),
          overdue_days: daysOverdue,
          failure_reason: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingScheduledReminder.id)
        .select('id')
        .single();

      if (updateError) {
        console.error('Error updating scheduled reminder:', updateError);
        // Continue to try other methods
      } else if (updateData) {
        reminderUpdated = true;
        reminderId = updateData.id;
        console.log(`✅ Updated scheduled reminder ${updateData.id} to sent status`);
      }
    }

    // If scheduled update failed or didn't exist, check for failed reminder
    if (!reminderUpdated) {
      const { data: existingFailedReminders, error: failedQueryError } = await supabaseAdmin
        .from('invoice_reminders')
        .select('id')
        .eq('invoice_id', invoice.id)
        .eq('reminder_type', reminderType)
        .eq('reminder_status', 'failed')
        .order('created_at', { ascending: false })
        .limit(1);

      if (failedQueryError) {
        console.error('Error querying failed reminders:', failedQueryError);
      }

      const existingFailedReminder = existingFailedReminders && existingFailedReminders.length > 0 ? existingFailedReminders[0] : null;

      if (existingFailedReminder) {
        // Update existing failed reminder to sent
        const { error: updateError, data: updateData } = await supabaseAdmin
          .from('invoice_reminders')
          .update({
            reminder_status: 'sent',
            email_id: emailData?.id || null,
            sent_at: new Date().toISOString(),
            overdue_days: daysOverdue,
            failure_reason: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingFailedReminder.id)
          .select('id')
          .single();

        if (updateError) {
          console.error('Error updating failed reminder:', updateError);
          // Continue to create new record
        } else if (updateData) {
          reminderUpdated = true;
          reminderId = updateData.id;
          console.log(`✅ Updated failed reminder ${updateData.id} to sent status`);
        }
      }
    }

    // If no existing reminder was found or updated, create a new sent reminder record
    if (!reminderUpdated) {
      const { error: insertError, data: insertData } = await supabaseAdmin
      .from('invoice_reminders')
      .insert({
        invoice_id: invoice.id,
        reminder_type: reminderType,
          reminder_status: 'sent',
          email_id: emailData?.id || null,
          sent_at: new Date().toISOString(),
        overdue_days: daysOverdue,
          failure_reason: null
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('Error creating sent reminder record:', insertError);
        // Log but don't fail the request since email was sent successfully
      } else if (insertData) {
        reminderId = insertData.id;
        console.log(`✅ Created new sent reminder record ${insertData.id}`);
      }
    }

    // Verify the reminder was actually saved with sent status
    if (reminderId) {
      const { data: verifyData, error: verifyError } = await supabaseAdmin
        .from('invoice_reminders')
        .select('id, reminder_status')
        .eq('id', reminderId)
      .single();

      if (verifyError || !verifyData || verifyData.reminder_status !== 'sent') {
        console.error('⚠️ WARNING: Reminder status verification failed:', {
          reminderId,
          verifyError,
          verifyData,
          expectedStatus: 'sent',
          actualStatus: verifyData?.reminder_status
        });
      } else {
        console.log(`✅ Verified reminder ${reminderId} is saved with 'sent' status`);
      }
    }

    // CRITICAL: Check limit one more time right before updating invoice count
    // This prevents race conditions where multiple reminders are sent simultaneously
    const finalLimitCheck = await canEnableReminder(invoice.user_id, invoice.id);
    if (!finalLimitCheck.allowed) {
      // Limit was reached by another reminder sent in parallel
      // Mark reminder as cancelled (email was sent but we're not counting it)
      if (reminderId) {
        await supabaseAdmin
          .from('invoice_reminders')
          .update({
            reminder_status: 'cancelled',
            failure_reason: 'Limit reached - this invoice already has 1 reminder'
          })
          .eq('id', reminderId);
      }
      return NextResponse.json({ 
        error: finalLimitCheck.reason || 'Reminder limit reached',
        limitReached: true,
        limitType: finalLimitCheck.limitType
      }, { status: 403 });
    }

    // Update invoice reminder count
    await supabaseAdmin
      .from('invoices')
      .update({
        reminder_count: (invoice.reminder_count || 0) + 1,
        last_reminder_sent: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', invoice.id);

    return NextResponse.json({ 
      success: true, 
      message: 'Reminder sent successfully',
      emailId: emailData?.id,
      totalPayable
    });
  } catch (error) {
    console.error('Error sending reminder:', error);
    return NextResponse.json({ 
      error: 'Failed to send reminder', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
