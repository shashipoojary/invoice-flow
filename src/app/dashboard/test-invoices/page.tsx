'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import ToastContainer from '@/components/Toast';
import ModernSidebar from '@/components/ModernSidebar';
import { CURRENCIES } from '@/lib/currency';
import { Loader2, CheckCircle, XCircle, Sparkles, FileText } from 'lucide-react';

interface CreatedInvoice {
  currency: string;
  invoiceId: string;
  invoiceNumber: string;
  status: 'success' | 'error';
  error?: string;
}

export default function TestInvoicesPage() {
  const { user, loading: authLoading, getAuthHeaders } = useAuth();
  const { toasts, removeToast, showSuccess, showError } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [createdInvoices, setCreatedInvoices] = useState<CreatedInvoice[]>([]);
  const [testClientId, setTestClientId] = useState<string | null>(null);

  // Create or get test client
  const ensureTestClient = async (): Promise<string> => {
    if (testClientId) return testClientId;

    try {
      const headers = await getAuthHeaders();
      
      // First, try to find existing test client
      const searchResponse = await fetch('/api/clients', {
        headers
      });
      
      if (searchResponse.ok) {
        const clients = await searchResponse.json();
        const testClient = clients.find((c: any) => 
          c.name === 'Test Client' || c.email === 'test@example.com'
        );
        
        if (testClient) {
          setTestClientId(testClient.id);
          return testClient.id;
        }
      }

      // Create new test client
      const createResponse = await fetch('/api/clients', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Client',
          email: 'test@example.com',
          company: 'Test Company'
        })
      });

      if (createResponse.ok) {
        const result = await createResponse.json();
        if (result.client && result.client.id) {
          setTestClientId(result.client.id);
          return result.client.id;
        }
      }

      throw new Error('Failed to create test client');
    } catch (error: any) {
      console.error('Error ensuring test client:', error);
      throw error;
    }
  };

  const createInvoicesInAllCurrencies = async () => {
    if (isCreating) return;

    try {
      setIsCreating(true);
      setCreatedInvoices([]);

      // Ensure test client exists
      const clientId = await ensureTestClient();
      
      const headers = await getAuthHeaders();
      const results: CreatedInvoice[] = [];

      // Create invoices in all currencies
      for (const currency of CURRENCIES) {
        try {
          // Create invoice with test data
          const invoiceData = {
            client_id: clientId,
            items: [
              {
                description: `Test Invoice Item - ${currency.code}`,
                rate: 1000, // Base amount
                qty: 1,
                line_total: 1000
              }
            ],
            currency: currency.code,
            exchange_rate: null, // Will be auto-fetched if different from base
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
            notes: `Test invoice in ${currency.code} (${currency.name})`,
            type: 'fast',
            status: 'draft'
          };

          const response = await fetch('/api/invoices/create', {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify(invoiceData)
          });

          if (response.ok) {
            const result = await response.json();
            results.push({
              currency: currency.code,
              invoiceId: result.invoice?.id || 'unknown',
              invoiceNumber: result.invoice?.invoice_number || 'unknown',
              status: 'success'
            });
          } else {
            const errorData = await response.json();
            results.push({
              currency: currency.code,
              invoiceId: '',
              invoiceNumber: '',
              status: 'error',
              error: errorData.error || 'Failed to create invoice'
            });
          }
        } catch (error: any) {
          results.push({
            currency: currency.code,
            invoiceId: '',
            invoiceNumber: '',
            status: 'error',
            error: error.message || 'Unknown error'
          });
        }

        // Update UI progressively
        setCreatedInvoices([...results]);
        
        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Show summary
      const successCount = results.filter(r => r.status === 'success').length;
      const errorCount = results.filter(r => r.status === 'error').length;

      if (errorCount === 0) {
        showSuccess(
          'All invoices created successfully!',
          `Created ${successCount} invoices in different currencies.`
        );
      } else {
        showError(
          'Some invoices failed to create',
          `Success: ${successCount}, Failed: ${errorCount}`
        );
      }
    } catch (error: any) {
      console.error('Error creating test invoices:', error);
      showError('Failed to create test invoices', error.message || 'Unknown error');
    } finally {
      setIsCreating(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-center h-screen">
          <p className="text-gray-600">Please log in to access this page.</p>
        </div>
      </div>
    );
  }

  const successCount = createdInvoices.filter(i => i.status === 'success').length;
  const errorCount = createdInvoices.filter(i => i.status === 'error').length;
  const totalCount = CURRENCIES.length;

  return (
    <div className="min-h-screen bg-white">
      <div className="flex h-screen">
        <ModernSidebar onCreateInvoice={() => {}} />
        
        <main className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar">
          <div className="pt-16 lg:pt-4 p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="mb-6">
              <h2 className="font-heading text-xl sm:text-2xl font-semibold" style={{color: '#1f2937'}}>
                Test Invoices - Multi-Currency
              </h2>
              <p className="text-sm text-gray-600 mt-2">
                Create test invoices in all available currencies with one click
              </p>
            </div>

            {/* Action Button */}
            <div className="mb-6">
              <button
                onClick={createInvoicesInAllCurrencies}
                disabled={isCreating}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                  isCreating
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'
                }`}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Creating invoices...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    <span>Create Invoices in All Currencies</span>
                  </>
                )}
              </button>
            </div>

            {/* Progress */}
            {isCreating && (
              <div className="mb-6">
                <div className="bg-gray-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Progress: {createdInvoices.length} / {totalCount}
                    </span>
                    <span className="text-sm text-gray-600">
                      {successCount} success, {errorCount} failed
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(createdInvoices.length / totalCount) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* Results */}
            {createdInvoices.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Created Invoices ({successCount} / {totalCount})
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {createdInvoices.map((invoice, index) => {
                    const currencyInfo = CURRENCIES.find(c => c.code === invoice.currency);
                    return (
                      <div
                        key={index}
                        className={`border rounded-lg p-4 ${
                          invoice.status === 'success'
                            ? 'border-green-200 bg-green-50'
                            : 'border-red-200 bg-red-50'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {invoice.status === 'success' ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-600" />
                            )}
                            <div>
                              <div className="font-medium text-gray-900">
                                {currencyInfo?.code || invoice.currency}
                              </div>
                              <div className="text-xs text-gray-600">
                                {currencyInfo?.name || ''}
                              </div>
                            </div>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${
                            invoice.status === 'success'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {invoice.status === 'success' ? 'Success' : 'Failed'}
                          </span>
                        </div>
                        
                        {invoice.status === 'success' ? (
                          <div className="mt-2 text-sm text-gray-700">
                            <div className="font-medium">{invoice.invoiceNumber}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              Symbol: {currencyInfo?.symbol || 'N/A'}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2 text-sm text-red-700">
                            <div className="text-xs">{invoice.error || 'Unknown error'}</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Instructions */}
            {createdInvoices.length === 0 && !isCreating && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-start space-x-3">
                  <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-2">How to use:</h4>
                    <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                      <li>Click the button above to create test invoices in all {CURRENCIES.length} currencies</li>
                      <li>Each invoice will have a test client and sample data</li>
                      <li>You can then test currency display, exchange rates, and formatting</li>
                      <li>All invoices are created as drafts, so you can edit them if needed</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

