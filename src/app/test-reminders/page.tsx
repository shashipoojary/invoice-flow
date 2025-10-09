'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function TestRemindersPage() {
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = useState<{
    totalInvoices?: number;
    userId?: string;
    invoices?: Array<{
      invoiceNumber: string;
      status: string;
      dueDate: string;
      isOverdue: boolean;
      daysOverdue?: number;
      reminderCount?: number;
      clientName?: string;
    }>;
    overdueCount?: number;
    success?: boolean;
    debug?: {
      userId: string;
      totalInvoices: number;
      today: string;
      invoices?: Array<{
        invoiceNumber: string;
        status: string;
        dueDate: string;
        isOverdue: boolean;
        daysOverdue?: number;
        reminderCount?: number;
        clientName?: string;
      }>;
    };
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const testReminders = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/reminders/debug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await response.json();
      setDebugInfo(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const testTrigger = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/reminders/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await response.json();
      console.log('Trigger Response:', data);
      setDebugInfo(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Test Reminders System
        </h1>

        <div className="space-y-4 mb-8">
          <button
            onClick={testReminders}
            disabled={loading || !user}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Test Debug API'}
          </button>
          
          <button
            onClick={testTrigger}
            disabled={loading || !user}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 ml-4"
          >
            {loading ? 'Loading...' : 'Test Trigger API'}
          </button>
        </div>

        {!user && (
          <div className="p-4 bg-yellow-100 border border-yellow-400 rounded-lg">
            <p className="text-yellow-800">Please log in to test the reminders system.</p>
          </div>
        )}

        {debugInfo && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Debug Information
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Response:</h3>
                <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg overflow-auto text-sm">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </div>

              {debugInfo.debug && (
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Summary:</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>User ID:</strong> {debugInfo.debug.userId}</p>
                      <p><strong>Total Invoices:</strong> {debugInfo.debug.totalInvoices}</p>
                      <p><strong>Today:</strong> {new Date(debugInfo.debug.today).toLocaleString()}</p>
                    </div>
                    <div>
                      <p><strong>Overdue Count:</strong> {debugInfo.overdueCount || 0}</p>
                      <p><strong>Success:</strong> {debugInfo.success ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                </div>
              )}

              {debugInfo.debug?.invoices && debugInfo.debug.invoices.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">All Invoices:</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-2">Invoice #</th>
                          <th className="text-left py-2">Status</th>
                          <th className="text-left py-2">Due Date</th>
                          <th className="text-left py-2">Overdue</th>
                          <th className="text-left py-2">Days Overdue</th>
                          <th className="text-left py-2">Reminders</th>
                          <th className="text-left py-2">Client</th>
                        </tr>
                      </thead>
                      <tbody>
                        {debugInfo.debug.invoices.map((invoice, index: number) => (
                          <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                            <td className="py-2">{invoice.invoiceNumber}</td>
                            <td className="py-2">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                invoice.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                                invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                                invoice.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {invoice.status}
                              </span>
                            </td>
                            <td className="py-2">{new Date(invoice.dueDate).toLocaleDateString()}</td>
                            <td className="py-2">
                              {invoice.isOverdue ? (
                                <span className="text-red-600 font-medium">Yes</span>
                              ) : (
                                <span className="text-green-600">No</span>
                              )}
                            </td>
                            <td className="py-2">{invoice.daysOverdue}</td>
                            <td className="py-2">{invoice.reminderCount}</td>
                            <td className="py-2">{invoice.clientName}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
