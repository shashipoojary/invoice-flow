'use client';

import { useState, useEffect } from 'react';
import { getEmailTemplate } from '@/lib/email-templates';

export default function TestEmailTemplates() {
  const [selectedTemplate, setSelectedTemplate] = useState(6);
  const [emailHtml, setEmailHtml] = useState('');

  // Test if the function is imported correctly
  console.log('getEmailTemplate function:', typeof getEmailTemplate);

  // Mock data for testing - create fresh object each time
  const getMockInvoice = () => ({
    invoice_number: 'INV-0013',
    total: 1250.00,
    due_date: '2024-02-15',
    issue_date: '2024-01-15',
    notes: 'Thank you for choosing our services. Please review the attached invoice and let us know if you have any questions.',
    clients: {
      name: 'John Smith',
      email: 'john.smith@example.com',
      company: 'Acme Corporation'
    },
    invoice_items: [
      { description: 'Web Development Services', line_total: 1000.00 },
      { description: 'UI/UX Design', line_total: 250.00 }
    ],
    theme: {
      template: selectedTemplate,
      primary_color: selectedTemplate === 4 ? '#7C3AED' : selectedTemplate === 5 ? '#8B5CF6' : '#5C2D91',
      secondary_color: selectedTemplate === 4 ? '#A855F7' : selectedTemplate === 5 ? '#F59E0B' : '#8B5CF6',
      accent_color: selectedTemplate === 5 ? '#EC4899' : undefined
    }
  });

  const mockBusinessSettings = {
    businessName: 'Silver Oak Creative',
    businessEmail: 'payments@silveroakcreative.example.com',
    businessPhone: '+1 (646) 555-0198',
    address: '123 Creative Street, Design City, DC 12345',
    paypalEmail: 'payments@silveroakcreative.example.com',
    cashappId: 'SilverOakCreative',
    venmoId: 'SilverOakCreative',
    googlePayUpi: 'SilverOakCreative@ybl',
    applePayId: '+1 (646) 555-0198',
    bankAccount: 'Chase Bank Account Name: SilverOak Creative LLC',
    bankIfscSwift: 'Routing (ABA): 021000021 SWIFT: CHASUS33',
    bankIban: 'IBAN: US64CHAS0210000219876543210',
    stripeAccount: 'Processed securely via Stripe',
    paymentNotes: 'Contact us for alternative payment methods'
  };

  const generateEmail = () => {
    try {
      console.log('Generating email for template:', selectedTemplate);
      const publicUrl = 'https://invoice-flow-vert.vercel.app/invoice/INV-0013';
      const mockInvoice = getMockInvoice();
      console.log('Mock invoice theme:', mockInvoice.theme);
      const html = getEmailTemplate(selectedTemplate, mockInvoice, mockBusinessSettings, publicUrl);
      console.log('Generated HTML length:', html.length);
      setEmailHtml(html);
    } catch (error) {
      console.error('Error generating email:', error);
      setEmailHtml('<p>Error generating email template</p>');
    }
  };

  // Auto-generate email when template changes
  useEffect(() => {
    generateEmail();
  }, [selectedTemplate]);

  const templateNames = {
    4: 'Modern',
    5: 'Creative', 
    6: 'Fast Invoice'
  };

  const templateDescriptions = {
    4: 'Sleek, professional design with gradient headers and modern layout',
    5: 'Artistic, dynamic design with creative elements and bold colors',
    6: 'Clean, minimal design like Google/Wave with simple layout'
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Email Template Preview
          </h1>
          <p className="text-lg text-gray-600">
            Test the new email templates for different invoice designs
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Template Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Select Template
              </h2>
              
              <div className="space-y-4">
                {Object.entries(templateNames).map(([id, name]) => (
                  <div key={id} className="border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md"
                       onClick={() => setSelectedTemplate(Number(id))}
                       style={{ 
                         borderColor: selectedTemplate === Number(id) ? '#3B82F6' : '#E5E7EB',
                         backgroundColor: selectedTemplate === Number(id) ? '#EFF6FF' : 'white'
                       }}>
                    <h3 className="font-semibold text-gray-900">{name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {templateDescriptions[Number(id) as keyof typeof templateDescriptions]}
                    </p>
                    <div className="mt-2 flex space-x-2">
                      <div className="w-4 h-4 rounded-full" 
                           style={{ backgroundColor: Number(id) === 4 ? '#7C3AED' : Number(id) === 5 ? '#8B5CF6' : '#5C2D91' }}></div>
                      <div className="w-4 h-4 rounded-full" 
                           style={{ backgroundColor: Number(id) === 4 ? '#A855F7' : Number(id) === 5 ? '#F59E0B' : '#8B5CF6' }}></div>
                      {Number(id) === 5 && (
                        <div className="w-4 h-4 rounded-full" 
                             style={{ backgroundColor: '#EC4899' }}></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  console.log('Button clicked!');
                  generateEmail();
                }}
                className="w-full mt-6 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Generate Email Preview
              </button>
            </div>
          </div>

          {/* Email Preview */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Email Preview - {templateNames[selectedTemplate as keyof typeof templateNames]}
              </h2>
              
              {emailHtml ? (
                <div className="border rounded-lg overflow-hidden">
                  <iframe
                    srcDoc={emailHtml}
                    className="w-full h-[800px] border-0"
                    title="Email Preview"
                  />
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                  <div className="text-gray-500">
                    <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <p className="text-lg font-medium">No email preview generated</p>
                    <p className="text-sm">Select a template and click "Generate Email Preview" to see the email design</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Template Features */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Template Features
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Clean & Professional</h3>
              <p className="text-sm text-gray-600">Google/Wave-inspired designs with clean layouts and professional typography</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Payment Methods</h3>
              <p className="text-sm text-gray-600">Comprehensive payment options including PayPal, Cash App, Venmo, and more</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Template-Specific</h3>
              <p className="text-sm text-gray-600">Each template matches its corresponding PDF design with appropriate styling</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
