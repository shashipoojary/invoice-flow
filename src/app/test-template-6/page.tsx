'use client';

import { useState } from 'react';
import { generateDetailedPDF } from '@/lib/detailed-pdf-generator';

export default function TestTemplate6Page() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const mockInvoice = {
    id: '1',
    invoiceNumber: 'INV-2024-003',
    clientId: 'client-1',
    client: {
      id: 'client-1',
      name: 'Michael Chen',
      email: 'michael@startup.io',
      company: 'Startup Innovations',
      phone: '+1 (555) 456-7890',
      address: '555 Startup Ave, Innovation Center, Boston, MA 02101',
      createdAt: '2024-01-01'
    },
    items: [
      {
        id: '1',
        description: 'Consulting Services',
        rate: 300,
        amount: 1800
      },
      {
        id: '2',
        description: 'Strategic Planning',
        rate: 250,
        amount: 1250
      },
      {
        id: '3',
        description: 'Market Research',
        rate: 150,
        amount: 600
      }
    ],
    subtotal: 3650,
    discount: 200, // Added discount for testing
    taxRate: 6.25,
    taxAmount: 215.63, // Recalculated with discount
    total: 3665.63, // Recalculated total
    status: 'sent' as const,
    type: 'detailed' as const,
    dueDate: '2024-02-25',
    createdAt: '2024-01-25',
    notes: 'Please contact us if you have any questions about this invoice.',
    clientName: 'Michael Chen',
    clientEmail: 'michael@startup.io',
    clientCompany: 'Startup Innovations',
    clientAddress: '555 Startup Ave, Innovation Center, Boston, MA 02101',
    issueDate: '2024-01-25',
    paymentTerms: {
      enabled: true,
      terms: 'Payment due within 15 days. Late payments may incur additional fees. Contact us for payment plans.'
    },
    lateFees: {
      enabled: true,
      type: 'fixed' as const,
      amount: 25.00, // Fixed late fee amount for testing
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
        }
      ]
    },
    theme: {
      primaryColor: '#1F2937',
      secondaryColor: '#374151',
      accentColor: '#6B7280'
    }
  };

  const mockBusinessSettings = {
    businessName: 'Minimal Consulting',
    logo: '', // No logo for testing
    address: '999 Minimal Way, Simplicity District, Portland, OR 97201',
    businessEmail: 'hello@minimal.com',
    businessPhone: '+1 (555) 567-8901',
    paypalEmail: 'payments@minimal.com',
    cashappId: '$minimal',
    venmoId: '@minimal',
    googlePayUpi: 'minimal@upi',
    applePayId: 'minimal@apple',
    bankAccount: '1122334455',
    bankIfscSwift: 'USAAUS33',
    bankIban: 'US64USAAUS6S3300958879',
    stripeAccount: 'acct_minimal',
    paymentNotes: 'Thank you for choosing minimal solutions.'
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const pdfBytes = await generateDetailedPDF(
        mockInvoice,
        mockBusinessSettings,
        6, // Template 6 (Minimal)
        '#1F2937', // Primary color
        '#374151'  // Secondary color
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
            Fast Invoice - Template 6 (Minimal) Test
          </h1>
          <p className="text-gray-600 mb-6">
            Test the finalized Fast Invoice template with minimal design and full customization support
          </p>
          
          <button
            onClick={generatePDF}
            disabled={isGenerating}
            className="bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {isGenerating ? 'Generating PDF...' : 'Generate Template 6 PDF'}
          </button>
        </div>

        {pdfUrl && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              PDF Preview - Template 6 (Minimal)
            </h2>
            <div className="border rounded-lg overflow-hidden">
              <iframe
                src={pdfUrl}
                width="100%"
                height="800px"
                className="border-0"
                title="Template 6 PDF Preview"
              />
            </div>
            <div className="mt-4 flex gap-4">
              <a
                href={pdfUrl}
                download="template-6-minimal-invoice.pdf"
                className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg font-medium transition-colors"
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
