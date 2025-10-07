'use client';

import { useState } from 'react';
import { generateDetailedPDF } from '@/lib/detailed-pdf-generator';

export default function TestTemplate4Page() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const mockInvoice = {
    id: '1',
    invoiceNumber: 'INV-2024-001',
    clientId: 'client-1',
    client: {
      id: 'client-1',
      name: 'John Smith',
      email: 'john@example.com',
      company: 'Smith Enterprises',
      phone: '+1 (555) 123-4567',
      address: '123 Business St, Suite 100, New York, NY 10001',
      createdAt: '2024-01-01'
    },
    items: [
      {
        id: '1',
        description: 'Web Development Services',
        rate: 150,
        amount: 1500
      },
      {
        id: '2',
        description: 'UI/UX Design',
        rate: 100,
        amount: 800
      },
      {
        id: '3',
        description: 'Project Management',
        rate: 75,
        amount: 375
      }
    ],
    subtotal: 2675,
    discount: 150, // Added discount for testing
    taxRate: 8.5,
    taxAmount: 214.63, // Recalculated with discount
    total: 2739.63, // Recalculated total
    status: 'sent' as const,
    type: 'detailed' as const,
    dueDate: '2024-02-15',
    createdAt: '2024-01-15',
    notes: 'Please contact us if you have any questions about this invoice.',
    clientName: 'John Smith',
    clientEmail: 'john@example.com',
    clientCompany: 'Smith Enterprises',
    clientAddress: '123 Business St, Suite 100, New York, NY 10001',
    issueDate: '2024-01-15',
    paymentTerms: {
      enabled: true,
      terms: 'Payment due within 30 days of invoice date. Late payments may incur additional fees.'
    },
    lateFees: {
      enabled: true,
      type: 'percentage' as const,
      amount: 1.5,
      gracePeriod: 5
    },
    reminders: {
      enabled: true,
      useSystemDefaults: false,
      rules: [
        {
          id: '1',
          type: 'before' as const,
          days: 7,
          enabled: true
        },
        {
          id: '2',
          type: 'after' as const,
          days: 3,
          enabled: true
        }
      ]
    },
    theme: {
      primaryColor: '#7C3AED',
      secondaryColor: '#A855F7',
      accentColor: '#C084FC'
    }
  };

  const mockBusinessSettings = {
    businessName: 'Creative Design Studio',
    logo: '', // No logo for testing
    address: '456 Design Ave, Creative District, San Francisco, CA 94102',
    businessEmail: 'hello@creativedesign.com',
    businessPhone: '+1 (555) 987-6543',
    paypalEmail: 'payments@creativedesign.com',
    cashappId: '$creativedesign',
    venmoId: '@creativedesign',
    googlePayUpi: 'creativedesign@upi',
    applePayId: 'creativedesign@apple',
    bankAccount: '1234567890',
    bankIfscSwift: 'CHASUS33',
    bankIban: 'US64SVBKUS6S3300958879',
    stripeAccount: 'acct_creativedesign',
    paymentNotes: 'Thank you for choosing our services!'
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const pdfBytes = await generateDetailedPDF(
        mockInvoice,
        mockBusinessSettings,
        4, // Template 4 (Modern)
        '#7C3AED', // Primary color
        '#A855F7'  // Secondary color
      );
      
      const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Template 4 - Modern Design Test (Updated)
          </h1>
          <p className="text-gray-600 mb-6">
            Test the updated Modern template with full dynamic features, advanced calculations, and geometric design
          </p>
          
          <button
            onClick={generatePDF}
            disabled={isGenerating}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {isGenerating ? 'Generating PDF...' : 'Generate Template 4 PDF'}
          </button>
        </div>

        {pdfUrl && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              PDF Preview - Template 4 (Modern)
            </h2>
            <div className="border rounded-lg overflow-hidden">
              <iframe
                src={pdfUrl}
                width="100%"
                height="800px"
                className="border-0"
                title="Template 4 PDF Preview"
              />
            </div>
            <div className="mt-4 flex gap-4">
              <a
                href={pdfUrl}
                download="template-4-modern-invoice.pdf"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Download PDF
              </a>
              <button
                onClick={() => {
                  URL.revokeObjectURL(pdfUrl);
                  setPdfUrl(null);
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Clear Preview
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
