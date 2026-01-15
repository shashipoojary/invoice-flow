import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { Resend } from 'resend';
import { getReminderEmailTemplate } from '@/lib/reminder-email-templates';
import { canEnableReminder } from '@/lib/subscription-validator';

// Initialize Resend only if API key exists
let resend: Resend | null = null;
try {
  if (process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
} catch (error) {
  console.error('Failed to initialize Resend:', error);
}

// Shared processing logic for both GET (cron) and POST (manual)
async function processReminders(request: NextRequest) {
  try {
    // Log environment for debugging
    console.log('🚀 Auto-send reminders cron job started');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Timestamp:', new Date().toISOString());
    
    // Check if email service is configured
    if (!process.env.RESEND_API_KEY || !resend) {
      console.error('❌ RESEND_API_KEY not configured - cannot send reminder emails');
      return NextResponse.json({ 
        error: 'Email service not configured',
        message: 'RESEND_API_KEY is required to send reminder emails'
      }, { status: 500 });
    }
    
    // Verify cron job authorization
    // Vercel cron jobs automatically include the x-vercel-cron header
    const cronTrigger = request.headers.get('x-vercel-cron');
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // Allow if called by Vercel cron (x-vercel-cron header present)
    // OR if authorization header matches CRON_SECRET (for manual testing)
    // If CRON_SECRET is not set, allow all (development mode)
    if (!cronTrigger && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.log('❌ Unauthorized request - missing cron trigger or invalid secret');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (cronTrigger) {
      console.log('✅ Authorized: Vercel cron job detected');
    } else if (authHeader) {
      console.log('✅ Authorized: Manual trigger with secret');
    } else {
      console.log('⚠️ No authorization header - proceeding in development mode');
    }

    // Get all scheduled reminders that are due to be sent
    // Query reminders where sent_at is less than or equal to now
    const now = new Date().toISOString();
    console.log('📅 Looking for reminders scheduled before:', now);
    
    // Fetch scheduled reminders with invoice and client data
    // Data isolation: Each reminder is linked to an invoice via invoice_id
    // Each invoice has user_id, ensuring proper isolation when fetching user settings
    // CRITICAL: Exclude draft and paid invoices - they should never have reminders sent
    const { data: scheduledReminders, error: remindersError } = await supabaseAdmin
      .from('invoice_reminders')
      .select(`
        *,
        invoices!inner (
          id,
          invoice_number,
          due_date,
          status,
          total,
          late_fees,
          public_token,
          user_id,
          reminder_count,
          last_reminder_sent,
          clients (
            name,
            email,
            company,
            phone,
            address
          )
        )
      `)
      .eq('reminder_status', 'scheduled')
      .neq('invoices.status', 'draft')
      .neq('invoices.status', 'paid')
      .lte('sent_at', now);

    // Filter out reminders for invoices that are fully paid via partial payments
    // IMPORTANT: Only check partial payments for "pending"/"scheduled" invoices
    // "Sent" invoices should NOT be affected by partial payments
    const validReminders = [];
    for (const reminder of (scheduledReminders || [])) {
      const invoice = reminder.invoices;
      
      // Only check partial payments if invoice is NOT "sent" (i.e., it's pending/scheduled)
      // "Sent" invoices should use original total regardless of partial payments
      if (invoice.status !== 'sent' && invoice.status !== 'cancelled') {
        const { data: payments } = await supabaseAdmin
          .from('invoice_payments')
          .select('amount')
          .eq('invoice_id', invoice.id);
        
        if (payments && payments.length > 0) {
          const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
          // If fully paid via partial payments, skip this reminder
          if (totalPaid >= invoice.total) {
            // Mark reminder as cancelled (not failed) since invoice is fully paid
            await supabaseAdmin
              .from('invoice_reminders')
              .update({
                reminder_status: 'cancelled',
                failure_reason: 'Invoice fully paid via partial payments - reminders cancelled'
              })
              .eq('id', reminder.id);
            
            // Update invoice status to paid if not already
            if (invoice.status !== 'paid') {
              await supabaseAdmin
                .from('invoices')
                .update({ status: 'paid', updated_at: new Date().toISOString() })
                .eq('id', invoice.id);
              
              // Log paid event
              try {
                await supabaseAdmin.from('invoice_events').insert({ 
                  invoice_id: invoice.id, 
                  type: 'paid' 
                });
              } catch {}
            }
            continue; // Skip this reminder
          }
        }
      }
      
      validReminders.push(reminder);
    }

    if (remindersError) {
      console.error('❌ Error fetching scheduled reminders:', remindersError);
      return NextResponse.json({ error: 'Failed to fetch scheduled reminders' }, { status: 500 });
    }

    if (validReminders.length === 0) {
      console.log('✅ No scheduled reminders found to send (after filtering fully paid invoices)');
      return NextResponse.json({ 
        message: 'No scheduled reminders found to send',
        summary: { totalFound: 0, processed: 0, success: 0, errors: 0 }
      });
    }

    console.log(`📧 Found ${scheduledReminders.length} scheduled reminder(s) to process, ${validReminders.length} valid after filtering`);

    const sentReminders = [];
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    // Helper function to delay execution (respects Resend rate limit: 2 requests per second)
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Use validReminders (pre-filtered to exclude fully paid invoices) instead of scheduledReminders
    for (const reminder of validReminders) {
      const invoice = reminder.invoices;
      
      // Skip if invoice doesn't exist or is null
      if (!invoice) {
        console.log(`⏭️ Skipping reminder ${reminder.id} - invoice not found`);
        await supabaseAdmin
          .from('invoice_reminders')
          .update({
            reminder_status: 'failed',
            failure_reason: 'Invoice not found'
          })
          .eq('id', reminder.id);
        skippedCount++;
        continue;
      }
      
      // CRITICAL: Validate user_id exists for proper data isolation
      if (!invoice.user_id) {
        console.log(`⏭️ Skipping reminder ${reminder.id} - invoice missing user_id (data isolation check)`);
        await supabaseAdmin
          .from('invoice_reminders')
          .update({
            reminder_status: 'failed',
            failure_reason: 'Invoice missing user_id'
          })
          .eq('id', reminder.id);
        skippedCount++;
        continue;
      }
      
      // Skip if invoice is paid (always skip paid invoices)
      if (invoice.status === 'paid') {
        console.log(`⏭️ Skipping reminder for invoice ${invoice.invoice_number} - invoice is already paid`);
        // Update reminder status to cancelled (not failed) since invoice is paid
        await supabaseAdmin
          .from('invoice_reminders')
          .update({
            reminder_status: 'cancelled',
            failure_reason: 'Invoice already paid - reminders cancelled'
          })
          .eq('id', reminder.id);
        skippedCount++;
        continue;
      }
      
      // Skip if invoice is not in 'sent' or 'pending' status (both can receive reminders)
      if (invoice.status !== 'sent' && invoice.status !== 'pending') {
        console.log(`⏭️ Skipping reminder for invoice ${invoice.invoice_number} - status is ${invoice.status}`);
        skippedCount++;
        continue;
      }
      
      // Note: Partial payment check is already done in the pre-filter (validReminders),
      // so we don't need to check again here. Payment data will be fetched in sendReminderEmail
      // for accurate late fee calculation on remaining balance.
      
      // Skip if client email is missing
      if (!invoice.clients || !invoice.clients.email) {
        console.log(`⏭️ Skipping reminder for invoice ${invoice.invoice_number} - client email missing`);
        await supabaseAdmin
          .from('invoice_reminders')
          .update({
            reminder_status: 'failed',
            failure_reason: 'Client email missing'
          })
          .eq('id', reminder.id);
        errorCount++;
        continue;
      }

      try {
        // Double-check reminder is still scheduled before processing (prevent race conditions)
        const { data: currentReminder } = await supabaseAdmin
          .from('invoice_reminders')
          .select('reminder_status')
          .eq('id', reminder.id)
          .single();
        
        if (currentReminder?.reminder_status !== 'scheduled') {
          console.log(`⏭️ Skipping reminder ${reminder.id} - already processed (status: ${currentReminder?.reminder_status})`);
          skippedCount++;
          continue;
        }
        
        // CRITICAL: Check subscription reminder limit BEFORE sending
        // Free plan users are limited to 1 reminder per invoice
        // Check AFTER verifying reminder is still scheduled to prevent race conditions
        const reminderLimitCheck = await canEnableReminder(invoice.user_id, invoice.id);
        if (!reminderLimitCheck.allowed) {
          console.log(`⏭️ Skipping reminder for invoice ${invoice.invoice_number} - subscription limit reached: ${reminderLimitCheck.reason}`);
          await supabaseAdmin
            .from('invoice_reminders')
            .update({
              reminder_status: 'cancelled',
              failure_reason: reminderLimitCheck.reason || 'Free plan reminder limit reached (1 per invoice). Please upgrade for unlimited reminders.'
            })
            .eq('id', reminder.id);
          skippedCount++;
          continue;
        }
        
        console.log(`📤 Sending ${reminder.reminder_type} reminder for invoice ${invoice.invoice_number} to ${invoice.clients.email}`);
        
        // Fetch partial payments to calculate remaining balance for late fee calculations
        let totalPaid = 0;
        let remainingBalance = invoice.total;
        const { data: payments } = await supabaseAdmin
          .from('invoice_payments')
          .select('amount')
          .eq('invoice_id', invoice.id);
        
        if (payments && payments.length > 0) {
          totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
          remainingBalance = Math.max(0, invoice.total - totalPaid);
        }
        
        // Send the reminder email (pass payment data for accurate late fee calculation)
        const emailResult = await sendReminderEmail(invoice, reminder.reminder_type, reminder.overdue_days, { totalPaid, remainingBalance });
        
        console.log(`✅ Email sent successfully - ID: ${emailResult.id}`);
        
        const now = new Date().toISOString();
        
        // CRITICAL: Check limit AGAIN after sending but before marking as sent
        // This prevents race conditions where multiple reminders check limit simultaneously
        const finalLimitCheck = await canEnableReminder(invoice.user_id, invoice.id);
        if (!finalLimitCheck.allowed) {
          // Limit was reached by another reminder sent in parallel
          // Mark this one as cancelled (email was sent but we're not counting it)
          console.log(`⚠️ Limit reached after sending - marking reminder ${reminder.id} as cancelled`);
          await supabaseAdmin
            .from('invoice_reminders')
            .update({
              reminder_status: 'cancelled',
              failure_reason: 'Limit reached - this invoice already has 1 reminder',
              sent_at: now,
              email_id: emailResult.id || null
            })
            .eq('id', reminder.id);
          skippedCount++;
          continue;
        }
        
        // Update reminder status to sent with actual sent timestamp
        const { error: updateError } = await supabaseAdmin
          .from('invoice_reminders')
          .update({
            reminder_status: 'sent',
            email_id: emailResult.id || null,
            sent_at: now // Update to actual sent time
          })
          .eq('id', reminder.id);
        
        if (updateError) {
          console.error(`❌ Failed to update reminder ${reminder.id} status:`, updateError);
        } else {
          console.log(`✅ Updated reminder ${reminder.id} status to 'sent'`);
          
          // Also update invoice reminder count and last reminder sent date
          await supabaseAdmin
            .from('invoices')
            .update({
              reminder_count: ((invoice.reminder_count || 0) + 1),
              last_reminder_sent: now,
              updated_at: now
            })
            .eq('id', invoice.id);
        }

        sentReminders.push({
          invoiceNumber: invoice.invoice_number,
          clientName: invoice.clients.name,
          status: 'sent',
          emailId: emailResult.id
        });

        successCount++;
        console.log(`✅ Successfully sent ${reminder.reminder_type} reminder for invoice ${invoice.invoice_number}`);
        
        // Rate limiting: Wait 600ms between email sends to respect Resend's free plan limit of 2 requests/second
        // Free plan: max 2 requests/second = minimum 500ms between requests
        // Using 600ms to be safe and avoid hitting the limit
        // Note: This can be reduced if upgrading to a paid Resend plan with higher limits
        await delay(600);
      } catch (error) {
        console.error(`❌ Failed to send reminder for invoice ${invoice.invoice_number}:`, error);
        
        // Extract error message and check for rate limit or domain errors
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        let failureReason = errorMsg;
        
        // Provide helpful messages for common free plan issues
        if (errorMsg.includes('Too many requests') || errorMsg.includes('rate limit') || errorMsg.includes('2 requests per second')) {
          failureReason = 'Rate limit exceeded (Free plan: 2 requests/second). Please wait and try again.';
        } else if (errorMsg.includes('only send testing emails to your own email')) {
          failureReason = 'Free plan restriction: Can only send to your own email. Verify domain at resend.com/domains to send to clients.';
        }
        
        // Update reminder status to failed
        await supabaseAdmin
          .from('invoice_reminders')
          .update({
            reminder_status: 'failed',
            failure_reason: failureReason
          })
          .eq('id', reminder.id);

        sentReminders.push({
          invoiceNumber: invoice.invoice_number,
          clientName: invoice.clients.name,
          status: 'failed'
        });

        errorCount++;
      }
    }

    const summary = {
      totalFound: scheduledReminders.length,
      processed: sentReminders.length,
      success: successCount,
      errors: errorCount,
      skipped: skippedCount
    };

    console.log(`📊 Reminder processing complete:`, JSON.stringify(summary, null, 2));
    console.log('🏁 Auto-send reminders cron job finished');

    return NextResponse.json({
      success: true,
      message: `Processed ${sentReminders.length} scheduled reminders`,
      summary,
      results: sentReminders
    });

  } catch (error) {
    console.error('❌ Auto-send reminders error:', error);
    return NextResponse.json(
      { error: 'Failed to process scheduled reminders', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Function to send reminder email
async function sendReminderEmail(invoice: any, reminderType: string, overdueDays: number, paymentData?: { totalPaid: number; remainingBalance: number }) {
  if (!resend) {
    throw new Error('Resend client not initialized - RESEND_API_KEY missing');
  }
  
  // Validate client email
  const clientEmail = invoice.clients?.email;
  if (!clientEmail || typeof clientEmail !== 'string') {
    throw new Error('Client email is required and must be valid');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const cleanEmail = clientEmail.trim().toLowerCase();
  if (!emailRegex.test(cleanEmail)) {
    throw new Error('Invalid email format');
  }

  // Get user email to verify if sending to own email (for free plan check)
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
  
  const recipientEmail = cleanEmail;
  const isSendingToOwnEmail = userEmail && recipientEmail === userEmail;
  
  console.log('Auto-send reminder email check:', {
    userEmail,
    recipientEmail,
    isSendingToOwnEmail,
    invoiceNumber: invoice.invoice_number
  });

  // Sanitize inputs for display
  const clientName = invoice.clients?.name || 'Valued Customer';
  const invoiceNumber = invoice.invoice_number || 'N/A';
  const invoiceTotal = typeof invoice.total === 'number' ? invoice.total.toFixed(2) : '0.00';
  const dueDate = invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A';
  
  // Fetch partial payments if not provided
  // IMPORTANT: For "sent" invoices, do NOT use partial payments - use original total
  // Only "pending" or "scheduled" invoices should consider partial payments
  let totalPaid = paymentData?.totalPaid || 0;
  let remainingBalance = paymentData?.remainingBalance || (invoice.total || 0);
  
  // Only consider partial payments if invoice is NOT "sent" (i.e., it's pending/scheduled)
  if (invoice.status !== 'sent' && invoice.status !== 'cancelled') {
    if (!paymentData) {
      const { data: payments } = await supabaseAdmin
        .from('invoice_payments')
        .select('amount')
        .eq('invoice_id', invoice.id);
      
      if (payments && payments.length > 0) {
        totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
        remainingBalance = Math.max(0, (invoice.total || 0) - totalPaid);
      }
    }
  } else {
    // For "sent" invoices, ignore partial payments and use original total
    totalPaid = 0;
    remainingBalance = invoice.total || 0;
  }
  
  // Calculate base amount
  // For "sent" invoices: use original total (ignore partial payments)
  // For "pending"/"scheduled" invoices: use remaining balance (consider partial payments)
  const baseAmount = (invoice.status === 'sent' || invoice.status === 'cancelled') ? (invoice.total || 0) : remainingBalance;
  
  // Calculate late fees if invoice is overdue (same logic as manual send route and public page)
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
  if (overdueDays > 0 && invoice.status !== 'paid' && lateFeesSettings && lateFeesSettings.enabled) {
    const gracePeriod = lateFeesSettings.gracePeriod || 0;
    const chargeableDays = Math.max(0, overdueDays - gracePeriod);
    
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
  
  // Get ALL user business settings from user_settings table (properly isolated per user)
  // This ensures complete data isolation - each user only gets their own settings
  let businessSettings: any = {};
  try {
    const { data: userSettings, error: settingsError } = await supabaseAdmin
      .from('user_settings')
      .select('business_name, business_email, business_phone, business_address, website, logo, logo_url, email_from_address, payment_notes, paypal_email, cashapp_id, venmo_id, google_pay_upi, apple_pay_id, bank_account, bank_ifsc_swift, bank_iban, stripe_account')
      .eq('user_id', invoice.user_id) // CRITICAL: Proper data isolation - only fetch settings for this specific user
      .single();
    
    if (settingsError) {
      console.error('Error fetching user settings:', settingsError);
      // Fall back to defaults if settings not found
      businessSettings = {
        business_name: 'FlowInvoicer',
        business_email: '',
        business_phone: '',
        logo: null,
        email_from_address: null
      };
    } else if (userSettings) {
      businessSettings = userSettings;
    } else {
      // No settings found, use defaults
      businessSettings = {
        business_name: 'FlowInvoicer',
        business_email: '',
        business_phone: '',
        logo: null,
        email_from_address: null
      };
    }
  } catch (error) {
    console.error('Error fetching user settings:', error);
    // Fall back to defaults on error
    businessSettings = {
      business_name: 'FlowInvoicer',
      business_email: '',
      business_phone: '',
      logo: null,
      email_from_address: null
    };
  }
  
  // Determine from address: use email_from_address if available, otherwise use default
  // email_from_address is a verified domain email (e.g., noreply@yourdomain.com)
  // If not set, use Resend free plan default (only works for test emails to own email)
  const fromEmail = businessSettings.email_from_address || 'onboarding@resend.dev';
  const fromAddress = `${businessSettings.business_name || 'FlowInvoicer'} <${fromEmail}>`;
  
  // Transform invoice data to match template structure
  const templateInvoice = {
    invoiceNumber: invoice.invoice_number,
    total: totalPayable, // Use totalPayable which includes late fees
    baseTotal: baseAmount, // Base amount (remaining balance after partial payments, before late fees)
    originalTotal: invoice.total || 0, // Original invoice total (before partial payments)
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

  // Transform business settings to match template structure with ALL fields
  // Use logo_url as fallback if logo is null/empty
  const logoUrl = businessSettings.logo || businessSettings.logo_url || '';
  const templateBusinessSettings = {
    businessName: businessSettings.business_name || 'FlowInvoicer',
    email: businessSettings.business_email || '',
    phone: businessSettings.business_phone || '',
    website: businessSettings.website || '',
    logo: logoUrl,
    tagline: '', // Tagline not currently in user_settings, but template supports it
    paymentNotes: businessSettings.payment_notes || ''
  };

  // Get reminder email template
  const reminderTemplate = getReminderEmailTemplate(
    templateInvoice,
    templateBusinessSettings,
    reminderType as 'friendly' | 'polite' | 'firm' | 'urgent',
    overdueDays
  );

  // Send email using Resend with proper template
  const { data, error } = await resend.emails.send({
    from: fromAddress,
    to: recipientEmail,
    subject: reminderTemplate.subject,
    html: reminderTemplate.html
  });

  if (error) {
    const errorMessage = error.message || '';
    
    // Check for free plan limitations
    const isDomainError = errorMessage.includes('domain is not verified') || 
                         errorMessage.includes('verify your domain') ||
                         errorMessage.includes('only send testing emails to your own email');
    const isRateLimitError = errorMessage.includes('Too many requests') || 
                            errorMessage.includes('rate limit') ||
                            errorMessage.includes('2 requests per second');
    
    // Provide helpful error messages for free plan issues
    let enhancedErrorMessage = errorMessage;
    if (isDomainError && !isSendingToOwnEmail) {
      enhancedErrorMessage = 'Free plan restriction: Can only send to your own email. Verify domain at resend.com/domains to send to clients.';
    } else if (isDomainError && isSendingToOwnEmail) {
      enhancedErrorMessage = `Email sending failed: ${errorMessage}. If sending to own email, check Resend API key configuration.`;
    } else if (isRateLimitError) {
      enhancedErrorMessage = 'Rate limit exceeded (Free plan: 2 requests/second). Please wait and try again.';
    }
    
    console.error('Auto-send email error:', {
      errorMessage,
      enhancedErrorMessage,
      recipientEmail,
      userEmail,
      isSendingToOwnEmail,
      fromAddress,
      isDomainError,
      isRateLimitError
    });
    
    throw new Error(enhancedErrorMessage);
  }

  return data;
}

// Vercel cron jobs call GET by default, so we need to process reminders in GET
export async function GET(request: NextRequest) {
  // Use the same processing logic as POST
  return await processReminders(request);
}

// POST handler for manual testing (also calls the shared processing logic)
export async function POST(request: NextRequest) {
  return await processReminders(request);
}
