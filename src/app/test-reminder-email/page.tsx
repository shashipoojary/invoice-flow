'use client';

import { useState } from 'react';
import { Mail, Send, Eye, Loader2 } from 'lucide-react';
import { getReminderEmailTemplate } from '@/lib/reminder-email-templates';

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
  const [isSendingAll, setIsSendingAll] = useState(false);
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
    business_phone: '+1 (555) 123-4567',
    payment_notes: 'Payment can be made via PayPal, bank transfer, or check.',
  };

  // Calculate overdue days
  const overdueDaysNum = Math.max(0, Math.floor((new Date().getTime() - new Date(mockInvoice.due_date).getTime()) / (1000 * 60 * 60 * 24)));
  const overdueDays: number = overdueDaysNum;

  // Get email template using the actual function
  const emailTemplate = getReminderEmailTemplate(
    {
      invoiceNumber: mockInvoice.invoice_number,
      total: mockInvoice.total,
      dueDate: mockInvoice.due_date,
      publicToken: mockInvoice.public_token,
      client: {
        name: mockInvoice.clients.name,
        email: mockInvoice.clients.email
      }
    },
    {
      businessName: mockBusinessSettings.business_name,
      email: mockBusinessSettings.business_email,
      phone: mockBusinessSettings.business_phone || '',
      website: '',
      logo: '',
      tagline: '',
      paymentNotes: mockBusinessSettings.payment_notes || ''
    },
    selectedType as 'friendly' | 'polite' | 'firm' | 'urgent',
    overdueDays
  );

  const emailHtml = emailTemplate.html;

  const handleTestSend = async (reminderType?: string) => {
    const typeToSend = reminderType || selectedType;
    
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
          reminderType: typeToSend,
          invoice: mockInvoice,
          businessSettings: mockBusinessSettings,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSendResult({ success: true, message: `Test email (${reminderTypes.find(t => t.value === typeToSend)?.label}) sent successfully to ${testEmail}!` });
        if (!reminderType) {
          setTestEmail('');
        }
      } else {
        setSendResult({ success: false, message: data.error || 'Failed to send test email' });
      }
    } catch (error) {
      setSendResult({ success: false, message: 'Error sending test email. Please try again.' });
    } finally {
      setIsSending(false);
    }
  };

  const handleSendAll = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      setSendResult({ success: false, message: 'Please enter a valid email address' });
      return;
    }

    setIsSendingAll(true);
    setSendResult(null);

    const results: string[] = [];
    
    for (const type of reminderTypes) {
      try {
        const response = await fetch('/api/reminders/test-send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: testEmail,
            reminderType: type.value,
            invoice: mockInvoice,
            businessSettings: mockBusinessSettings,
          }),
        });

        const data = await response.json();
        if (data.success) {
          results.push(`✓ ${type.label}`);
        } else {
          results.push(`✗ ${type.label}: ${data.error || 'Failed'}`);
        }
        
        // Small delay between sends
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        results.push(`✗ ${type.label}: Error`);
      }
    }

    setIsSendingAll(false);
    setSendResult({ 
      success: results.every(r => r.startsWith('✓')), 
      message: `All emails sent:\n${results.join('\n')}` 
    });
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
              onClick={() => handleTestSend()}
              disabled={isSending || isSendingAll || !testEmail}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium mb-3"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Test Email ({reminderTypes.find(t => t.value === selectedType)?.label})
                </>
              )}
            </button>

            {/* Send All Button */}
            <button
              onClick={handleSendAll}
              disabled={isSending || isSendingAll || !testEmail}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSendingAll ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending All 4 Types...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  Send All 4 Reminder Types
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

