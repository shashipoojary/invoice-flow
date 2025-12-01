import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

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

    // Get greeting and message based on reminder type
    const getGreeting = () => {
      switch (reminderType) {
        case 'friendly':
          return `Hi ${invoice.clients?.name || 'there'},`;
        case 'polite':
          return `Dear ${invoice.clients?.name || 'Valued Customer'},`;
        case 'firm':
          return `Hello ${invoice.clients?.name || 'Valued Customer'},`;
        case 'urgent':
          return `${invoice.clients?.name || 'Valued Customer'},`;
        default:
          return `Dear ${invoice.clients?.name || 'Valued Customer'},`;
      }
    };

    const getMessage = () => {
      const overdueDays = Math.max(0, Math.floor((new Date().getTime() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24)));
      
      switch (reminderType) {
        case 'friendly':
          return `This is a friendly reminder that invoice <strong>#${invoice.invoice_number}</strong> for <strong>$${invoice.total.toLocaleString()}</strong> is now due.`;
        case 'polite':
          return `This is a reminder that invoice <strong>#${invoice.invoice_number}</strong> for <strong>$${invoice.total.toLocaleString()}</strong> is ${overdueDays} day${overdueDays !== 1 ? 's' : ''} overdue.`;
        case 'firm':
          return `Invoice <strong>#${invoice.invoice_number}</strong> for <strong>$${invoice.total.toLocaleString()}</strong> is ${overdueDays} days overdue. Immediate payment is required.`;
        case 'urgent':
          return `URGENT: Invoice <strong>#${invoice.invoice_number}</strong> for <strong>$${invoice.total.toLocaleString()}</strong> is ${overdueDays} days overdue. Payment required immediately.`;
        default:
          return `This is a reminder regarding invoice #${invoice.invoice_number}.`;
      }
    };

    const getClosing = () => {
      switch (reminderType) {
        case 'friendly':
          return `Thank you for your prompt attention.`;
        case 'polite':
          return `We appreciate your immediate attention to this matter.`;
        case 'firm':
          return `We require immediate payment to resolve this matter.`;
        case 'urgent':
          return `This matter requires immediate attention.`;
        default:
          return `Thank you for your attention.`;
      }
    };

    const overdueDays = Math.max(0, Math.floor((new Date().getTime() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24)));

    // Create minimal, clean, professional reminder email
  const emailHtml = `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Payment Reminder</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    body, table, td, p, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    @media (prefers-color-scheme: dark) {
      .dark-bg { background-color: #0a0a0a !important; }
      .dark-text { color: #f5f5f5 !important; }
      .dark-border { border-color: #2a2a2a !important; }
    }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .pad { padding: 20px !important; }
      .amount { font-size: 28px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;width:100%;background-color:#ffffff;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="560" border="0" cellpadding="0" cellspacing="0" class="container" style="max-width:560px;width:100%;background-color:#ffffff;">
          
          <!-- Top accent line -->
          <tr>
            <td style="height:3px;background:linear-gradient(90deg, #000000 0%, #333333 100%);"></td>
          </tr>
          
          <!-- Header -->
          <tr>
            <td class="pad" style="padding:40px 40px 24px;">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0;padding:0;color:#000000;font-size:20px;font-weight:600;letter-spacing:-0.3px;line-height:1.3;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                      ${businessSettings.business_name || 'Invoice Reminder'}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Invoice amount highlight -->
          <tr>
            <td class="pad" style="padding:0 40px 32px;">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:24px;background-color:#fafafa;border:1px solid #e8e8e8;">
                    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <p style="margin:0 0 8px 0;padding:0;color:#666666;font-size:12px;letter-spacing:0.3px;text-transform:uppercase;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Invoice #${invoice.invoice_number}</p>
                          <p class="amount" style="margin:0;padding:0;color:#000000;font-size:36px;font-weight:700;letter-spacing:-1px;line-height:1;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">$${invoice.total.toLocaleString()}</p>
                        </td>
                        <td align="right" valign="top">
                          ${overdueDays > 0 ? `
                          <p style="margin:0;padding:0;color:#d32f2f;font-size:13px;font-weight:500;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${overdueDays} day${overdueDays !== 1 ? 's' : ''} overdue</p>
                          ` : `
                          <p style="margin:0;padding:0;color:#666666;font-size:13px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Due ${new Date(invoice.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                          `}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td class="pad" style="padding:0 40px;">
              <p style="margin:0 0 12px 0;padding:0;color:#000000;font-size:16px;line-height:1.6;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                ${getGreeting()}
              </p>
              <p style="margin:0 0 32px 0;padding:0;color:#333333;font-size:15px;line-height:1.7;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                ${getMessage()}
              </p>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td class="pad" style="padding:0 40px 32px;">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${process.env.NEXT_PUBLIC_APP_URL || 'https://invoice-flow-vert.vercel.app'}/invoice/${invoice.public_token}" style="height:48px;v-text-anchor:middle;width:240px;" arcsize="0%" stroke="f" fillcolor="#000000">
                    <w:anchorlock/>
                    <center style="color:#ffffff;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;font-weight:500;">View Invoice</center>
                    </v:roundrect>
                    <![endif]-->
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://invoice-flow-vert.vercel.app'}/invoice/${invoice.public_token}" 
                       style="display:inline-block;width:240px;background-color:#000000;color:#ffffff;text-decoration:none;padding:14px 0;text-align:center;font-size:15px;font-weight:500;letter-spacing:0.2px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;mso-hide:all;">
                      View Invoice
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Closing -->
          <tr>
            <td class="pad" style="padding:0 40px 24px;">
              <p style="margin:0;padding:0;color:#333333;font-size:15px;line-height:1.6;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                ${getClosing()}
              </p>
            </td>
          </tr>

          ${businessSettings.payment_notes ? `
          <!-- Payment Info -->
          <tr>
            <td class="pad" style="padding:0 40px 32px;">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="border-top:1px solid #e8e8e8;padding-top:24px;">
                <tr>
                  <td>
                    <p style="margin:0 0 8px 0;padding:0;color:#000000;font-size:13px;font-weight:500;letter-spacing:0.2px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Payment Details</p>
                    <p style="margin:0;padding:0;color:#666666;font-size:14px;line-height:1.6;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                      ${businessSettings.payment_notes}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- Footer -->
          <tr>
            <td class="pad" style="padding:32px 40px;border-top:1px solid #f0f0f0;">
              <p style="margin:0 0 4px 0;padding:0;color:#999999;font-size:12px;line-height:1.5;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                ${businessSettings.business_email ? businessSettings.business_email : ''}
              </p>
              <p style="margin:0;padding:0;color:#999999;font-size:11px;line-height:1.5;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                Automated reminder
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Get subject based on reminder type
    const getSubject = () => {
      switch (reminderType) {
        case 'friendly':
          return `Test: Payment Reminder - Invoice #${invoice.invoice_number}`;
        case 'polite':
          return `Test: Payment Reminder - Invoice #${invoice.invoice_number}`;
        case 'firm':
          return `Test: Overdue Payment Notice - Invoice #${invoice.invoice_number}`;
        case 'urgent':
          return `Test: URGENT Payment Required - Invoice #${invoice.invoice_number}`;
        default:
          return `Test: Payment Reminder - Invoice #${invoice.invoice_number}`;
      }
    };

    // Send test email
    const emailResult = await resend.emails.send({
      from: `${businessSettings.business_name || 'FlowInvoicer'} <onboarding@resend.dev>`,
      to: email,
      subject: getSubject(),
      html: emailHtml,
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
