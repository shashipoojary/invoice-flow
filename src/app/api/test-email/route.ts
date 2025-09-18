import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ 
        error: 'RESEND_API_KEY not found in environment variables',
        configured: false
      }, { status: 400 });
    }

    const { testEmail } = await request.json();

    if (!testEmail) {
      return NextResponse.json({ 
        error: 'Test email address is required' 
      }, { status: 400 });
    }

    // Send test email
    const { data, error } = await resend.emails.send({
      from: 'InvoiceFlow <onboarding@resend.dev>',
      to: [testEmail],
      subject: 'Test Email from InvoiceFlow',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #3b82f6;">🎉 Email Test Successful!</h2>
          <p>This is a test email from InvoiceFlow to verify that your Resend API key is working correctly.</p>
          <p>If you received this email, your email service is properly configured and ready to send invoices to clients.</p>
          <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>✅ Resend API Key:</strong> Configured</p>
            <p><strong>📧 From Domain:</strong> onboarding@resend.dev (Free Plan)</p>
            <p><strong>⏰ Sent:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            You can now send professional invoices to your clients with PDF attachments!
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend test email error:', error);
      return NextResponse.json({ 
        error: 'Failed to send test email',
        details: error.message,
        configured: true
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Test email sent successfully',
      emailId: data?.id,
      configured: true
    });

  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    configured: !!process.env.RESEND_API_KEY,
    message: process.env.RESEND_API_KEY 
      ? 'Resend API key is configured' 
      : 'RESEND_API_KEY not found in environment variables'
  });
}
