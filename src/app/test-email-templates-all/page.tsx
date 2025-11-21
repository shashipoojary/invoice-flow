'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import ToastContainer from '@/components/Toast';
import ModernSidebar from '@/components/ModernSidebar';
import { FileText, Sparkles, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TestEmailTemplatesAllPage() {
  const { user, loading: authLoading, getAuthHeaders } = useAuth();
  const { toasts, removeToast, showSuccess, showError } = useToast();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [createdInvoices, setCreatedInvoices] = useState<Array<{ id: string; invoice_number: string; template: string; theme: any }>>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);

  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = savedTheme === 'dark' || (!savedTheme && systemPrefersDark);
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const createTestInvoice = async (templateNumber: number, templateName: string, pdfTemplate: number) => {
    try {
      setIsCreating(true);
      
      const headers = await getAuthHeaders();
      
      // Get today's date
      const today = new Date();
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30); // Due in 30 days
      
      // Sample client data
      const clientData = {
        name: 'John Doe',
        email: user?.email || 'test@example.com',
        company: 'Acme Corporation',
        phone: '+1 (555) 123-4567',
        address: '123 Business Street, Suite 100, City, State 12345'
      };
      
      // Sample invoice items
      const items = [
        { description: 'Web Development Services', rate: 1500, line_total: 1500 },
        { description: 'UI/UX Design', rate: 800, line_total: 800 },
        { description: 'Consulting Hours', rate: 250, line_total: 250 }
      ];
      
      // Theme colors based on template
      const themes = {
        1: { // Minimal
          template: pdfTemplate,
          primary_color: '#5C2D91',
          secondary_color: '#8B5CF6',
          accent_color: '#8b5cf6'
        },
        2: { // Modern
          template: pdfTemplate,
          primary_color: '#7C3AED',
          secondary_color: '#A855F7',
          accent_color: '#A855F7'
        },
        3: { // Creative
          template: pdfTemplate,
          primary_color: '#8B5CF6',
          secondary_color: '#F59E0B',
          accent_color: '#EC4899'
        }
      };
      
      const payload = {
        client_data: clientData,
        items: items,
        invoice_number: `TEST-${templateName.toUpperCase()}-${Date.now().toString().slice(-6)}`,
        issue_date: today.toISOString().split('T')[0],
        due_date: dueDate.toISOString().split('T')[0],
        discount: 0,
        notes: `This is a test invoice for ${templateName} template. Created for testing email templates.`,
        billing_choice: 'per_invoice',
        type: 'detailed',
        status: 'draft', // Set as draft so user can manually send
        payment_terms: {
          enabled: true,
          terms: 'Net 30'
        },
        late_fees: {
          enabled: true,
          type: 'fixed',
          amount: 25,
          gracePeriod: 7
        },
        reminderSettings: {
          enabled: true,
          useSystemDefaults: false,
          rules: [
            { id: '1', type: 'before', days: 7, enabled: true },
            { id: '2', type: 'before', days: 3, enabled: true },
            { id: '3', type: 'after', days: 1, enabled: true }
          ]
        },
        theme: themes[templateNumber as keyof typeof themes]
      };
      
      const response = await fetch('/api/invoices/create', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      
      if (response.ok && result.invoice) {
        setCreatedInvoices(prev => [...prev, {
          id: result.invoice.id,
          invoice_number: result.invoice.invoice_number,
          template: templateName,
          theme: themes[templateNumber as keyof typeof themes]
        }]);
        showSuccess(`${templateName} template invoice created successfully!`);
      } else {
        throw new Error(result.error || 'Failed to create invoice');
      }
    } catch (error: any) {
      console.error(`Error creating ${templateName} invoice:`, error);
      showError(`Failed to create ${templateName} template invoice: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };
  
  const createAllTemplates = async () => {
    setCreatedInvoices([]);
    
    // Create Minimal template (Template 1 -> PDF Template 6)
    await createTestInvoice(1, 'Minimal', 6);
    
    // Wait a bit between creates
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Create Modern template (Template 2 -> PDF Template 4)
    await createTestInvoice(2, 'Modern', 4);
    
    // Wait a bit between creates
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Create Creative template (Template 3 -> PDF Template 5)
    await createTestInvoice(3, 'Creative', 5);
  };
  
  const goToInvoices = () => {
    router.push('/dashboard/invoices');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Please log in to access this page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ModernSidebar 
        isDarkMode={false}
        onToggleDarkMode={() => {}}
        onCreateInvoice={() => {}}
      />
      <div className="lg:pl-64">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className={`rounded-xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-8`}>
            <div className="flex items-center space-x-3 mb-6">
              <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-indigo-500/20' : 'bg-indigo-50'}`}>
                <Sparkles className={`h-6 w-6 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Test Email Templates
                </h1>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Create draft invoices for all templates to test email designs
                </p>
              </div>
            </div>

            <div className={`p-6 rounded-lg mb-6 ${isDarkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
              <p className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                <strong>How it works:</strong> This will create 3 draft invoices (Minimal, Modern, Creative) with sample data. 
                You can then go to the Invoices page and manually send each one to test the email templates.
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <button
                onClick={createAllTemplates}
                disabled={isCreating}
                className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-all ${
                  isCreating
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg'
                } flex items-center justify-center space-x-2`}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Creating invoices...</span>
                  </>
                ) : (
                  <>
                    <FileText className="h-5 w-5" />
                    <span>Create All Template Invoices (Draft)</span>
                  </>
                )}
              </button>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => createTestInvoice(1, 'Minimal', 6)}
                  disabled={isCreating}
                  className={`py-3 px-4 rounded-lg font-medium transition-all ${
                    isCreating
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : `${isDarkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`
                  }`}
                >
                  Create Minimal Template
                </button>
                <button
                  onClick={() => createTestInvoice(2, 'Modern', 4)}
                  disabled={isCreating}
                  className={`py-3 px-4 rounded-lg font-medium transition-all ${
                    isCreating
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : `${isDarkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`
                  }`}
                >
                  Create Modern Template
                </button>
                <button
                  onClick={() => createTestInvoice(3, 'Creative', 5)}
                  disabled={isCreating}
                  className={`py-3 px-4 rounded-lg font-medium transition-all ${
                    isCreating
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : `${isDarkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`
                  }`}
                >
                  Create Creative Template
                </button>
              </div>
            </div>

            {createdInvoices.length > 0 && (
              <div className={`mt-8 p-6 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-green-50'} border ${isDarkMode ? 'border-green-800' : 'border-green-200'}`}>
                <h3 className={`text-lg font-semibold mb-4 flex items-center space-x-2 ${isDarkMode ? 'text-green-300' : 'text-green-800'}`}>
                  <CheckCircle className="h-5 w-5" />
                  <span>Created Invoices ({createdInvoices.length})</span>
                </h3>
                <div className="space-y-2 mb-4">
                  {createdInvoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {invoice.template} Template
                          </p>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Invoice: {invoice.invoice_number}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                          Draft
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={goToInvoices}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                    isDarkMode
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  Go to Invoices Page to Send
                </button>
              </div>
            )}

            <div className={`mt-8 p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/30' : 'bg-gray-50'}`}>
              <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Sample Data Included:
              </h4>
              <ul className={`text-sm space-y-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <li>• Client: John Doe (Acme Corporation)</li>
                <li>• Email: {user?.email || 'Your email'}</li>
                <li>• 3 Invoice Items (Web Development, UI/UX Design, Consulting)</li>
                <li>• Payment Terms: Net 30</li>
                <li>• Late Fees: $25 fixed, 7 days grace period</li>
                <li>• Auto Reminders: 7 days before, 3 days before, 1 day after</li>
                <li>• Status: Draft (ready to send manually)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

