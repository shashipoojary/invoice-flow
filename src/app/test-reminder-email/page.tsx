'use client';

import { useState } from 'react';
import { Mail, Send, Eye, Loader2 } from 'lucide-react';

const reminderTypes = [
  { value: 'friendly', label: 'Friendly (1 day)', days: 1 },
  { value: 'polite', label: 'Polite (3 days)', days: 3 },
  { value: 'firm', label: 'Firm (7 days)', days: 7 },
  { value: 'urgent', label: 'Urgent (14 days)', days: 14 },
];

export default function TestReminderEmail() {
  const [selectedType, setSelectedType] = useState('friendly');
  const [testEmail, setTestEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showPreview, setShowPreview] = useState(true);

  // Mock data for preview
  const mockInvoice = {
    invoice_number: 'INV-2024-001',
    total: 2484.00,
    due_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    public_token: 'test-token-123',
    clients: {
      name: 'John Smith',
      email: 'john.smith@example.com',
    },
  };

  const mockBusinessSettings = {
    business_name: 'Your Business Name',
    business_email: 'billing@yourbusiness.com',
    payment_notes: 'Payment can be made via PayPal, bank transfer, or check.',
  };

  const getGreeting = () => {
    switch (selectedType) {
      case 'friendly':
        return `Hi ${mockInvoice.clients.name},`;
      case 'polite':
        return `Dear ${mockInvoice.clients.name},`;
      case 'firm':
        return `Hello ${mockInvoice.clients.name},`;
      case 'urgent':
        return `${mockInvoice.clients.name},`;
      default:
        return `Dear ${mockInvoice.clients.name},`;
    }
  };

  const getMessage = () => {
    const overdueDays: number = 5;
    switch (selectedType) {
      case 'friendly':
        return `This is a friendly reminder that invoice <strong>#${mockInvoice.invoice_number}</strong> for <strong>$${mockInvoice.total.toLocaleString()}</strong> is now due.`;
      case 'polite':
        return `This is a reminder that invoice <strong>#${mockInvoice.invoice_number}</strong> for <strong>$${mockInvoice.total.toLocaleString()}</strong> is ${overdueDays} day${overdueDays !== 1 ? 's' : ''} overdue.`;
      case 'firm':
        return `Invoice <strong>#${mockInvoice.invoice_number}</strong> for <strong>$${mockInvoice.total.toLocaleString()}</strong> is ${overdueDays} days overdue. Immediate payment is required.`;
      case 'urgent':
        return `URGENT: Invoice <strong>#${mockInvoice.invoice_number}</strong> for <strong>$${mockInvoice.total.toLocaleString()}</strong> is ${overdueDays} days overdue. Payment required immediately.`;
      default:
        return `This is a reminder regarding invoice #${mockInvoice.invoice_number}.`;
    }
  };

  const getClosing = () => {
    switch (selectedType) {
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

    const overdueDaysNum = Math.max(0, Math.floor((new Date().getTime() - new Date(mockInvoice.due_date).getTime()) / (1000 * 60 * 60 * 24)));
    const overdueDays: number = overdueDaysNum;

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
                      ${mockBusinessSettings.business_name}
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
                          <p style="margin:0 0 8px 0;padding:0;color:#666666;font-size:12px;letter-spacing:0.3px;text-transform:uppercase;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Invoice #${mockInvoice.invoice_number}</p>
                          <p class="amount" style="margin:0;padding:0;color:#000000;font-size:36px;font-weight:700;letter-spacing:-1px;line-height:1;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">$${mockInvoice.total.toLocaleString()}</p>
                        </td>
                        <td align="right" valign="top">
                          ${overdueDays > 0 ? `
                          <p style="margin:0;padding:0;color:#d32f2f;font-size:13px;font-weight:500;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${overdueDays} day${overdueDays !== 1 ? 's' : ''} overdue</p>
                          ` : `
                          <p style="margin:0;padding:0;color:#666666;font-size:13px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Due ${new Date(mockInvoice.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
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
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')}/invoice/${mockInvoice.public_token}" style="height:48px;v-text-anchor:middle;width:240px;" arcsize="0%" stroke="f" fillcolor="#000000">
                    <w:anchorlock/>
                    <center style="color:#ffffff;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;font-weight:500;">View Invoice</center>
                    </v:roundrect>
                    <![endif]-->
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')}/invoice/${mockInvoice.public_token}" 
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

          ${mockBusinessSettings.payment_notes ? `
          <!-- Payment Info -->
          <tr>
            <td class="pad" style="padding:0 40px 32px;">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="border-top:1px solid #e8e8e8;padding-top:24px;">
                <tr>
                  <td>
                    <p style="margin:0 0 8px 0;padding:0;color:#000000;font-size:13px;font-weight:500;letter-spacing:0.2px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Payment Details</p>
                    <p style="margin:0;padding:0;color:#666666;font-size:14px;line-height:1.6;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                      ${mockBusinessSettings.payment_notes}
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
                ${mockBusinessSettings.business_email ? mockBusinessSettings.business_email : ''}
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

  const handleTestSend = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      setSendResult({ success: false, message: 'Please enter a valid email address' });
      return;
    }

    setIsSending(true);
    setSendResult(null);

    try {
      const response = await fetch('/api/reminders/test-send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testEmail,
          reminderType: selectedType,
          invoice: mockInvoice,
          businessSettings: mockBusinessSettings,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSendResult({ success: true, message: `Test email sent successfully to ${testEmail}!` });
        setTestEmail('');
      } else {
        setSendResult({ success: false, message: data.error || 'Failed to send test email' });
      }
    } catch (error) {
      setSendResult({ success: false, message: 'Error sending test email. Please try again.' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Test Reminder Email</h1>
          <p className="text-gray-600">Preview and test send reminder emails with different types</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Controls */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Settings</h2>
            
            {/* Reminder Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reminder Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
              >
                {reminderTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Test Email Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Email Address
              </label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="your-email@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter your email to receive a test reminder
              </p>
            </div>

            {/* Send Button */}
            <button
              onClick={handleTestSend}
              disabled={isSending || !testEmail}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Test Email
                </>
              )}
            </button>

            {/* Result Message */}
            {sendResult && (
              <div className={`mt-4 p-4 rounded-lg ${
                sendResult.success 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <p className={`text-sm ${
                  sendResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {sendResult.message}
                </p>
              </div>
            )}

            {/* Toggle Preview */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Eye className="w-4 h-4" />
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </button>
            </div>
          </div>

          {/* Email Preview */}
          {showPreview && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Email Preview</h2>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {reminderTypes.find(t => t.value === selectedType)?.label}
                </span>
              </div>
              
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <iframe
                  srcDoc={emailHtml}
                  className="w-full h-[600px] border-0"
                  title="Email Preview"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

