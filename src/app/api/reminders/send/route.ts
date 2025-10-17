import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getReminderEmailTemplate } from '@/lib/reminder-email-templates';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { invoiceId, reminderType, overdueDays } = await request.json();

    if (!invoiceId || !reminderType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        clients (
          name,
          email,
          company,
          phone,
          address
        )
      `)
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Fetch business settings from user_settings
    const { data: userSettings, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', invoice.user_id)
      .single();

    if (settingsError || !userSettings) {
      return NextResponse.json({ error: 'User settings not found' }, { status: 404 });
    }

    // Map user_settings to business settings format
    const businessSettings = {
      businessName: userSettings.business_name,
      businessEmail: userSettings.business_email,
      businessPhone: userSettings.business_phone,
      address: userSettings.business_address,
      logo: userSettings.logo || userSettings.logo_url,
      bankAccount: userSettings.bank_account,
      bankIfscSwift: userSettings.bank_ifsc_swift,
      bankIban: userSettings.bank_iban,
      paypalEmail: userSettings.paypal_email,
      cashappId: userSettings.cashapp_id,
      venmoId: userSettings.venmo_id,
      googlePayUpi: userSettings.google_pay_upi,
      applePayId: userSettings.apple_pay_id,
      stripeAccount: userSettings.stripe_account,
      paymentNotes: userSettings.payment_notes
    };

    // Generate email template
    const emailTemplate = getReminderEmailTemplate(
      invoice,
      businessSettings,
      reminderType,
      overdueDays || 0
    );

    // Send email
    const { data, error } = await resend.emails.send({
      from: `${businessSettings.businessName} <${businessSettings.businessEmail || 'noreply@invoiceflow.com'}>`,
      to: [invoice.clients.email],
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    });

    if (error) {
      console.error('Error sending reminder email:', error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    // Log the reminder in database
    await supabase
      .from('invoice_reminders')
      .insert({
        invoice_id: invoiceId,
        reminder_type: reminderType,
        overdue_days: overdueDays || 0,
        sent_at: new Date().toISOString(),
        email_id: data?.id
      });

    return NextResponse.json({ 
      success: true, 
      message: 'Reminder sent successfully',
      emailId: data?.id
    });

  } catch (error) {
    console.error('Error in reminder API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}