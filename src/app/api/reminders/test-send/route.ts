import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getReminderEmailTemplate } from '@/lib/reminder-email-templates';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email, reminderType, invoice, businessSettings } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email address is required' }, { status: 400 });
    }

    if (!reminderType || !invoice || !businessSettings) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const overdueDays = Math.max(0, Math.floor((new Date().getTime() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24)));

    // Use the actual reminder template function
    const template = getReminderEmailTemplate(
      {
        invoiceNumber: invoice.invoice_number,
        total: invoice.total,
        dueDate: invoice.due_date,
        publicToken: invoice.public_token || '',
        client: {
          name: invoice.clients?.name || 'Valued Customer',
          email: invoice.clients?.email || email
        }
      },
      {
        businessName: businessSettings.business_name || businessSettings.businessName || 'FlowInvoicer',
        email: businessSettings.business_email || businessSettings.email || 'contact@company.com',
        phone: businessSettings.business_phone || businessSettings.phone || '',
        logo: businessSettings.logo || '',
        tagline: businessSettings.tagline || '',
        paymentNotes: businessSettings.payment_notes || ''
      },
      reminderType as 'friendly' | 'polite' | 'firm' | 'urgent',
      overdueDays
    );

    // Send test email using the actual template
    const emailResult = await resend.emails.send({
      from: `${businessSettings.business_name || businessSettings.businessName || 'FlowInvoicer'} <onboarding@resend.dev>`,
      to: email,
      subject: `[TEST] ${template.subject}`,
      html: template.html,
    });

    if (emailResult.error) {
      console.error('Email sending failed:', emailResult.error);
      return NextResponse.json(
        { 
          success: false, 
          error: emailResult.error.message || 'Failed to send email' 
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      emailId: emailResult.data?.id,
    });

  } catch (error: any) {
    console.error('Test send error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
