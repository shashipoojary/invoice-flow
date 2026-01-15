import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { Resend } from 'resend';
import { getReminderEmailTemplate } from '@/lib/reminder-email-templates';
import { canEnableReminder } from '@/lib/subscription-validator';
import { getBaseUrl } from '@/lib/get-base-url';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request (you can add authentication here)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Starting automated reminder cron job...');

    // Get all scheduled reminders that are due to be sent today
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // CRITICAL: Exclude draft invoices - they should never have reminders sent
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
          public_token,
          reminder_count,
          last_reminder_sent,
          user_id,
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
      .eq('invoices.status', 'sent')
      .neq('invoices.status', 'draft')
      .gte('sent_at', todayStart.toISOString())
      .lt('sent_at', todayEnd.toISOString());

    if (remindersError) {
      console.error('Error fetching scheduled reminders:', remindersError);
      return NextResponse.json({ error: 'Failed to fetch scheduled reminders' }, { status: 500 });
    }

    if (!scheduledReminders || scheduledReminders.length === 0) {
      console.log('✅ No scheduled reminders found for today');
      return NextResponse.json({ message: 'No scheduled reminders found for today' });
    }

    console.log(`📊 Found ${scheduledReminders.length} scheduled reminders to send today`);

    let remindersSent = 0;
    let errors = 0;

    // Helper function to delay execution (respects Resend rate limit: 2 requests per second)
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    for (const reminder of scheduledReminders) {
      try {
        const invoice = reminder.invoices;
        
        // CRITICAL: Validate invoice exists and has user_id for proper data isolation
        if (!invoice) {
          console.log(`⏭️ Skipping reminder ${reminder.id} - invoice not found`);
          await supabaseAdmin
            .from('invoice_reminders')
            .update({
              reminder_status: 'failed',
              failure_reason: 'Invoice not found'
            })
            .eq('id', reminder.id);
          errors++;
          continue;
        }
        
        if (!invoice.user_id) {
          console.log(`⏭️ Skipping reminder ${reminder.id} - invoice missing user_id (data isolation check)`);
          await supabaseAdmin
            .from('invoice_reminders')
            .update({
              reminder_status: 'failed',
              failure_reason: 'Invoice missing user_id'
            })
            .eq('id', reminder.id);
          errors++;
          continue;
        }
        
        console.log(`📧 Processing scheduled reminder for ${invoice.invoice_number} (${reminder.reminder_type}) - User: ${invoice.user_id}`);
        
        // CRITICAL: Check subscription reminder limit BEFORE sending
        // Free plan users are limited to 4 reminders per month (global limit)
        const reminderLimitCheck = await canEnableReminder(invoice.user_id);
        if (!reminderLimitCheck.allowed) {
          console.log(`⏭️ Skipping reminder ${reminder.id} - subscription limit reached: ${reminderLimitCheck.reason}`);
          await supabaseAdmin
            .from('invoice_reminders')
            .update({
              reminder_status: 'failed',
              failure_reason: reminderLimitCheck.reason || 'Subscription reminder limit reached'
            })
            .eq('id', reminder.id);
          errors++;
          continue;
        }
        
        // Calculate overdue days for this specific invoice
        const overdueDays = Math.max(0, Math.floor((new Date().getTime() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24)));
        
        // Send the reminder email
        const emailResult = await sendReminderEmail(invoice, reminder.reminder_type, overdueDays);
        
        if (emailResult.success) {
          // Update the reminder status to sent
          const { error: updateError } = await supabaseAdmin
            .from('invoice_reminders')
            .update({
              reminder_status: 'sent',
              email_id: emailResult.emailId,
              sent_at: new Date().toISOString()
            })
            .eq('id', reminder.id);

          if (updateError) {
            console.error(`Error updating reminder status for ${invoice.invoice_number}:`, updateError);
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

          remindersSent++;
          console.log(`✅ Reminder sent for ${invoice.invoice_number}`);
          
          // Rate limiting: Wait 600ms between email sends to respect Resend's free plan limit of 2 requests/second
          // Free plan: max 2 requests/second = minimum 500ms between requests
          // Using 600ms to be safe and avoid hitting the limit
          // Note: This can be reduced if upgrading to a paid Resend plan with higher limits
          await delay(600);
        } else {
          // Mark as failed with helpful error message
          const failureReason = emailResult.failureReason || (emailResult.error as any)?.message || 'Email sending failed';
          
          await supabaseAdmin
            .from('invoice_reminders')
            .update({
              reminder_status: 'failed',
              failure_reason: failureReason,
              updated_at: new Date().toISOString()
            })
            .eq('id', reminder.id);

          console.error(`❌ Failed to send reminder for ${invoice.invoice_number}:`, {
            error: emailResult.error,
            failureReason,
            isDomainError: emailResult.isDomainError,
            isRateLimitError: emailResult.isRateLimitError,
            isSendingToOwnEmail: emailResult.isSendingToOwnEmail
          });
          errors++;
        }

      } catch (error) {
        console.error(`Error processing reminder for ${reminder.invoices.invoice_number}:`, error);
        
        // Mark as failed
        await supabaseAdmin
          .from('invoice_reminders')
          .update({
            reminder_status: 'failed',
            failure_reason: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('id', reminder.id);
        
        errors++;
      }
    }

    const result = {
      message: 'Automated reminder cron job completed',
      scheduledRemindersFound: scheduledReminders.length,
      remindersSent,
      errors
    };

    console.log('✅ Automated reminder cron job completed:', result);
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in automated reminder cron job:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function sendReminderEmail(invoice: any, reminderType: string, overdueDays: number) {
  try {
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
    
    console.log('Auto reminder email check:', {
      userEmail,
      recipientEmail,
      isSendingToOwnEmail,
      invoiceNumber: invoice.invoice_number
    });

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

    // Overdue days is passed as parameter (calculated in calling function for consistency)
    // This ensures consistent calculation across all reminder routes

    // Transform invoice data to match template structure
    const templateInvoice = {
      invoiceNumber: invoice.invoice_number,
      total: invoice.total,
      dueDate: invoice.due_date,
      publicToken: invoice.public_token,
      client: {
        name: invoice.clients?.name || 'Valued Customer',
        email: invoice.clients?.email || recipientEmail
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

    // Get base URL for email links using utility function
    const baseUrl = getBaseUrl();

    // Get reminder email template
    const reminderTemplate = getReminderEmailTemplate(
      templateInvoice,
      templateBusinessSettings,
      reminderType as 'friendly' | 'polite' | 'firm' | 'urgent',
      overdueDays,
      baseUrl
    );

    // Determine the from address: use email_from_address if available, otherwise use default
    // email_from_address is a verified domain email (e.g., noreply@yourdomain.com)
    // If not set, use Resend free plan default (only works for test emails to own email)
    const fromEmail = businessSettings.email_from_address || 'onboarding@resend.dev';
    const fromAddress = `${businessSettings.business_name || 'FlowInvoicer'} <${fromEmail}>`;

    // Send email using Resend with proper template
    const emailResult = await resend.emails.send({
      from: fromAddress,
      to: recipientEmail,
      subject: reminderTemplate.subject,
      html: reminderTemplate.html,
    });

    if (emailResult.error) {
      const errorMessage = emailResult.error.message || '';
      
      // Check for free plan limitations
      const isDomainError = errorMessage.includes('domain is not verified') || 
                           errorMessage.includes('verify your domain') ||
                           errorMessage.includes('only send testing emails to your own email');
      const isRateLimitError = errorMessage.includes('Too many requests') || 
                              errorMessage.includes('rate limit') ||
                              errorMessage.includes('2 requests per second');
      
      // Provide helpful error messages for free plan issues
      let failureReason = errorMessage;
      if (isDomainError && !isSendingToOwnEmail) {
        failureReason = 'Free plan restriction: Can only send to your own email. Verify domain at resend.com/domains to send to clients.';
      } else if (isDomainError && isSendingToOwnEmail) {
        failureReason = `Email sending failed: ${errorMessage}. If sending to own email, check Resend API key configuration.`;
      } else if (isRateLimitError) {
        failureReason = 'Rate limit exceeded (Free plan: 2 requests/second). Please wait and try again.';
      }
      
      console.error('Email sending failed:', {
        errorMessage,
        recipientEmail,
        userEmail,
        isSendingToOwnEmail,
        fromAddress,
        failureReason
      });
      
      return { 
        success: false, 
        error: emailResult.error,
        failureReason,
        isDomainError,
        isRateLimitError,
        isSendingToOwnEmail
      };
    }

    return { success: true, emailId: emailResult.data?.id };

  } catch (error) {
    console.error('Error sending reminder email:', error);
    return { success: false, error };
  }
}
