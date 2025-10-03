'use client';

import { useState } from 'react';
import { Bell, Send, CheckCircle, AlertCircle } from 'lucide-react';

export default function TestAutoReminders() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    result?: {
      success: boolean;
      message: string;
      summary: {
        totalFound: number;
        processed: number;
        success: number;
        errors: number;
      };
      results?: Array<{
        invoiceNumber: string;
        clientName: string;
        status: string;
        emailId?: string;
      }>;
    };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testAutoReminders = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/reminders/trigger-auto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to trigger auto reminders');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full mb-4">
              <Bell className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Auto Reminders Test
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Test the automated reminder system for invoices with auto reminders enabled
            </p>
          </div>

          <div className="space-y-6">
            {/* How it works */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
                🤖 How Auto Reminders Work
              </h3>
              <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                <p>• <strong>Per-Invoice Control:</strong> Auto reminders are configured individually for each invoice</p>
                <p>• <strong>Smart Filtering:</strong> Only invoices with auto reminders enabled will receive automated emails</p>
                <p>• <strong>Automatic Schedule:</strong> Daily at 9:00 AM, the system checks for overdue invoices</p>
                <p>• <strong>Progressive Reminders:</strong> First → Second → Final (max 3 reminders per invoice)</p>
                <p>• <strong>Anti-Spam:</strong> 24-hour gaps between reminders to respect client inboxes</p>
              </div>
            </div>

            {/* Test Button */}
            <div className="text-center">
              <button
                onClick={testAutoReminders}
                disabled={loading}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <Send className="h-5 w-5" />
                )}
                <span>{loading ? 'Testing...' : 'Test Auto Reminders'}</span>
              </button>
            </div>

            {/* Results */}
            {result && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                  <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                    Test Results
                  </h3>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-800 dark:text-green-200">Status:</span>
                    <span className="font-medium text-green-900 dark:text-green-100">{result.success ? 'Success' : 'Failed'}</span>
                  </div>
                  
                  {result.result?.summary && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-green-800 dark:text-green-200">Total Found:</span>
                        <span className="font-medium text-green-900 dark:text-green-100">{result.result.summary.totalFound}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-800 dark:text-green-200">Processed:</span>
                        <span className="font-medium text-green-900 dark:text-green-100">{result.result.summary.processed}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-800 dark:text-green-200">Emails Sent:</span>
                        <span className="font-medium text-green-900 dark:text-green-100">{result.result.summary.success}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-800 dark:text-green-200">Errors:</span>
                        <span className="font-medium text-green-900 dark:text-green-100">{result.result.summary.errors}</span>
                      </div>
                    </>
                  )}
                </div>

                {result.result?.results && result.result.results.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">Invoice Details:</h4>
                    <div className="space-y-2">
                      {result.result.results.map((invoice, index: number) => (
                        <div key={index} className="text-xs bg-green-100 dark:bg-green-800/30 rounded p-2">
                          <div className="font-medium">#{invoice.invoiceNumber}</div>
                          <div>Client: {invoice.clientName}</div>
                          <div>Status: {invoice.status}</div>
                          {invoice.emailId && <div>Email ID: {invoice.emailId}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">
                    Error
                  </h3>
                </div>
                <p className="text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                📋 How to Enable Auto Reminders
              </h3>
              <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <p>1. <strong>Create a Detailed Invoice:</strong> Go to Dashboard → &quot;Detailed Invoice&quot;</p>
                <p>2. <strong>Configure Settings:</strong> In Step 3 (Settings), find &quot;Auto Reminders&quot;</p>
                <p>3. <strong>Enable Toggle:</strong> Turn on the &quot;Auto Reminders&quot; switch</p>
                <p>4. <strong>Choose Mode:</strong> Select &quot;Smart&quot; (system defaults) or &quot;Custom&quot; (your rules)</p>
                <p>5. <strong>Create Invoice:</strong> Complete the invoice creation process</p>
                <p>6. <strong>Send Invoice:</strong> Mark the invoice as &quot;Sent&quot; to activate auto reminders</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
