'use client';

import { useState } from 'react';
import { generateDetailedPDF } from '@/lib/detailed-pdf-generator';

export default function TestTemplate5Page() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const mockInvoice = {
    id: '1',
    invoiceNumber: 'CREATIVE-2024-001',
    clientId: 'client-1',
    client: {
      id: 'client-1',
      name: 'Alex Martinez',
      email: 'alex@designstudio.com',
      company: 'Design Studio Co.',
      phone: '+1 (555) 987-6543',
      address: '456 Creative Ave, Design District, Los Angeles, CA 90210',
      createdAt: '2024-01-01'
    },
    items: [
      {
        id: '1',
        description: 'Logo Design & Brand Identity',
        rate: 150,
        amount: 1200
      },
      {
        id: '2',
        description: 'Website UI/UX Design',
        rate: 120,
        amount: 1800
      },
      {
        id: '3',
        description: 'Social Media Graphics Package',
        rate: 80,
        amount: 640
      },
      {
        id: '4',
        description: 'Print Design - Business Cards',
        rate: 60,
        amount: 300
      }
    ],
    subtotal: 3940,
    discount: 200, // Added discount for testing
    taxRate: 8.5,
    taxAmount: 317.9, // Recalculated with discount
    total: 4057.9, // Recalculated total
    status: 'pending' as const,
    type: 'detailed' as const,
    dueDate: '2024-02-25',
    createdAt: '2024-01-25',
    notes: 'Thank you for choosing our creative services! Looking forward to bringing your vision to life.',
    clientName: 'Alex Martinez',
    clientEmail: 'alex@designstudio.com',
    clientCompany: 'Design Studio Co.',
    clientAddress: '456 Creative Ave, Design District, Los Angeles, CA 90210',
    issueDate: '2024-01-25',
    paymentTerms: {
      enabled: true,
      terms: 'Payment due within 15 days. Creative work begins upon payment confirmation.'
    },
    lateFees: {
      enabled: true,
      type: 'percentage' as const,
      amount: 2.5,
      gracePeriod: 5
    },
    reminders: {
      enabled: true,
      useSystemDefaults: false,
      rules: [
        {
          id: '1',
          type: 'before' as const,
          days: 3,
          enabled: true
        },
        {
          id: '2',
          type: 'after' as const,
          days: 2,
          enabled: true
        }
      ]
    },
    theme: {
      primaryColor: '#8B5CF6',
      secondaryColor: '#F59E0B',
      accentColor: '#EC4899'
    }
  };

  const mockBusinessSettings = {
    businessName: 'Creative Design Studio',
    logo: '', // No logo for testing
    address: '789 Art District, Creative Quarter, San Francisco, CA 94102',
    businessEmail: 'hello@creativedesign.studio',
    businessPhone: '+1 (555) 123-4567',
    paypalEmail: 'payments@creativedesign.studio',
    cashappId: '$creativedesign',
    venmoId: '@creativedesign',
    googlePayUpi: 'creativedesign@upi',
    applePayId: 'creativedesign@apple',
    bankAccount: '1234567890',
    bankIfscSwift: 'CHASE',
    bankIban: 'US64CHASUS6S3300958879',
    stripeAccount: 'acct_creativedesign',
    paymentNotes: 'Thank you for choosing our creative services! Let\'s create something amazing together.'
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const pdfBytes = await generateDetailedPDF(
        mockInvoice,
        mockBusinessSettings,
        5, // Template 5 (Creative Design)
        '#8B5CF6', // Primary color (Purple)
        '#F59E0B'  // Secondary color (Orange)
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
            Template 5 - Creative Design Test (NEW)
          </h1>
          <p className="text-gray-600 mb-6">
            Test the NEW Creative template designed specifically for graphic designers and freelancers - artistic, bold, and dynamic
          </p>
          
          <button
            onClick={generatePDF}
            disabled={isGenerating}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {isGenerating ? 'Generating Creative PDF...' : 'Generate Creative Template PDF'}
          </button>
        </div>

        {pdfUrl && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              PDF Preview - Template 5 (Creative Design)
            </h2>
            <div className="border rounded-lg overflow-hidden">
              <iframe
                src={pdfUrl}
                width="100%"
                height="800px"
                className="border-0"
                title="Template 5 PDF Preview"
              />
            </div>
            <div className="mt-4 flex gap-4">
              <a
                href={pdfUrl}
                download="template-5-creative-design-invoice.pdf"
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
