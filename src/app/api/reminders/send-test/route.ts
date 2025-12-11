import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { getReminderEmailTemplate } from '@/lib/reminder-email-templates';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { invoiceId } = await request.json();
    
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

    // Get invoice details with user settings
    const { data: invoice, error: invoiceError } = await supabase
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

    // Check if invoice is overdue
    const dueDate = new Date(invoice.due_date);
    const today = new Date();
    const isOverdue = today > dueDate;
    const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

    if (!isOverdue) {
      return NextResponse.json({ error: 'Invoice is not overdue yet' }, { status: 400 });
    }

    // Get user settings for payment methods and business info
    const { data: userData } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', invoice.user_id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User settings not found' }, { status: 404 });
    }

    // Map user_settings to business settings format
    const businessSettings = {
      businessName: userData.business_name,
      businessEmail: userData.business_email,
      businessPhone: userData.business_phone,
      address: userData.business_address,
      logo: userData.logo || userData.logo_url,
      bankAccount: userData.bank_account,
      bankIfscSwift: userData.bank_ifsc_swift,
      bankIban: userData.bank_iban,
      paypalEmail: userData.paypal_email,
      cashappId: userData.cashapp_id,
      venmoId: userData.venmo_id,
      googlePayUpi: userData.google_pay_upi,
      applePayId: userData.apple_pay_id,
      stripeAccount: userData.stripe_account,
      paymentNotes: userData.payment_notes
    };

    // Determine reminder type based on settings - map to 4-tone system
    const reminderCount = invoice.reminder_count || 0;
    let reminderType: 'friendly' | 'polite' | 'firm' | 'urgent' = 'friendly';
    
    if (reminderSettings.useSystemDefaults) {
      // Use system defaults - determine type by count
      if (reminderCount >= 2) {
        reminderType = 'urgent';
      } else if (reminderCount >= 1) {
        reminderType = 'firm';
      } else {
        reminderType = 'polite';
      }
    } else {
      // Use custom rules - handle both before and after due date
      const customRules = reminderSettings.customRules || reminderSettings.rules || [];
      const enabledRules = customRules.filter((rule: any) => rule.enabled);
      
      if (enabledRules.length > 0) {
        let matchingRule = null;
        
        if (daysOverdue < 0) {
          // Invoice is not yet due - check for "before" reminders
          const daysUntilDue = Math.abs(daysOverdue);
          const beforeRules = enabledRules.filter((rule: any) => rule.type === 'before');
          matchingRule = beforeRules
            .sort((a: any, b: any) => a.days - b.days) // Sort by days ascending (closest first)
            .find((rule: any) => daysUntilDue <= rule.days);
        } else {
          // Invoice is overdue - check for "after" reminders
          const afterRules = enabledRules.filter((rule: any) => rule.type === 'after');
          matchingRule = afterRules
            .sort((a: any, b: any) => b.days - a.days) // Sort by days descending (highest first)
            .find((rule: any) => daysOverdue >= rule.days);
        }
        
        if (matchingRule) {
          // Map custom rule type to 4-tone system
          const ruleType = matchingRule.tone || matchingRule.type || 'friendly';
          if (['friendly', 'polite', 'firm', 'urgent'].includes(ruleType)) {
            reminderType = ruleType as 'friendly' | 'polite' | 'firm' | 'urgent';
          } else {
            // Default mapping for old types
            reminderType = 'polite';
          }
        }
      }
    }

    // Transform invoice data to match template structure
    const templateInvoice = {
      invoiceNumber: invoice.invoice_number,
      total: invoice.total,
      dueDate: invoice.due_date,
      publicToken: invoice.public_token,
      client: {
        name: invoice.clients?.[0]?.name || 'Valued Customer',
        email: invoice.clients?.[0]?.email || ''
      }
    };

    // Transform business settings to match template structure
    const templateBusinessSettings = {
      businessName: businessSettings.businessName || 'FlowInvoicer',
      email: businessSettings.businessEmail || '',
      phone: businessSettings.businessPhone || '',
      website: '',
      logo: businessSettings.logo || '',
      tagline: '',
      paymentNotes: businessSettings.paymentNotes || ''
    };

    // Get reminder email template using the new template function
    const reminderTemplate = getReminderEmailTemplate(
      templateInvoice,
      templateBusinessSettings,
      reminderType,
      daysOverdue,
      baseUrl
    );

    const emailHtml = reminderTemplate.html;

    // Send email using Resend with the new template
    const emailResult = await resend.emails.send({
      from: 'FlowInvoicer <onboarding@resend.dev>',
      to: invoice.clients?.[0]?.email || '',
      subject: reminderTemplate.subject,
      html: emailHtml,
    });

    if (emailResult.error) {
      console.error('Email sending failed:', emailResult.error);
      return NextResponse.json({ 
        error: 'Failed to send reminder email', 
        details: emailResult.error.message || emailResult.error,
        hasApiKey: !!process.env.RESEND_API_KEY
      }, { status: 500 });
    }

    // Update invoice with reminder count
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        reminder_count: (invoice.reminder_count || 0) + 1,
        last_reminder_sent: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId);

    if (updateError) {
      console.error('Failed to update reminder count:', updateError);
      // Don't fail the request if we can't update the count
    }

    return NextResponse.json({
      success: true,
      message: 'Reminder sent successfully',
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoice_number,
        clientName: invoice.clients?.[0]?.name || 'Unknown',
        clientEmail: invoice.clients?.[0]?.email || 'No email',
        daysOverdue,
        total: invoice.total
      },
      reminderType: reminderType,
      emailId: emailResult.data?.id
    });

  } catch (error) {
    console.error('Error in send-test:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
