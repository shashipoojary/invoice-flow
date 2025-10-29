'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, Send, CheckCircle, X } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface OverdueInvoice {
  invoiceId: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  daysOverdue: number;
  reminderType: string;
  total: number;
}

interface ReminderManagerProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export default function ReminderManager({ isOpen, onClose, userId }: ReminderManagerProps) {
  const [overdueInvoices, setOverdueInvoices] = useState<OverdueInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingReminders, setSendingReminders] = useState<string[]>([]);
  const [debugInfo, setDebugInfo] = useState<{
    debug?: {
      totalInvoices: number;
      userId: string;
      invoices?: Array<{
        invoiceNumber: string;
        status: string;
        dueDate: string;
        isOverdue: boolean;
      }>;
    };
    overdueCount?: number;
  } | null>(null);
  const { showSuccess, showError } = useToast();

  const fetchOverdueInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/reminders/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();
      if (data.success) {
        setOverdueInvoices(data.overdueInvoices);
        // Log debug info to console for troubleshooting
        if (data.debug) {
          console.log('Reminder Debug Info:', data.debug);
        }
      } else {
        showError('Failed to fetch overdue invoices');
      }
    } catch (error) {
      console.error('Error fetching overdue invoices:', error);
      showError('Error fetching overdue invoices');
    } finally {
      setLoading(false);
    }
  }, [userId, showError]);

  useEffect(() => {
    if (isOpen && userId) {
      fetchOverdueInvoices();
    }
  }, [isOpen, userId, fetchOverdueInvoices]);

  const fetchDebugInfo = async () => {
    try {
      const response = await fetch('/api/reminders/debug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();
      if (data.success) {
        setDebugInfo(data);
        console.log('Debug Info:', data);
      } else {
        showError('Failed to fetch debug info');
      }
    } catch (error) {
      console.error('Error fetching debug info:', error);
      showError('Error fetching debug info');
    }
  };

  const sendReminder = async (invoiceId: string, reminderType: string) => {
    setSendingReminders(prev => [...prev, invoiceId]);
    try {
      const response = await fetch('/api/reminders/send-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceId,
          reminderType
        }),
      });

      const data = await response.json();
      if (data.success) {
        showSuccess(`Reminder sent successfully for invoice ${data.invoiceNumber || invoiceId}`);
        // Refresh the list
        fetchOverdueInvoices();
      } else {
        showError(data.error || 'Failed to send reminder');
      }
    } catch (error) {
      console.error('Error sending reminder:', error);
      showError('Error sending reminder');
    } finally {
      setSendingReminders(prev => prev.filter(id => id !== invoiceId));
    }
  };

  const sendAllReminders = async () => {
    setSendingReminders(overdueInvoices.map(inv => inv.invoiceId));
    let successCount = 0;
    let errorCount = 0;

    for (const invoice of overdueInvoices) {
      try {
        const response = await fetch('/api/reminders/send-test', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            invoiceId: invoice.invoiceId,
            reminderType: invoice.reminderType
          }),
        });

        const data = await response.json();
        if (data.success) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch {
        errorCount++;
      }
    }

    setSendingReminders([]);
    
    if (successCount > 0) {
      showSuccess(`Successfully sent ${successCount} reminders`);
    }
    if (errorCount > 0) {
      showError(`Failed to send ${errorCount} reminders`);
    }

    // Refresh the list
    fetchOverdueInvoices();
  };

  const triggerAutoReminders = async () => {
    setSendingReminders(['auto']);
    try {
      const response = await fetch('/api/reminders/trigger-auto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to trigger auto reminders');
      }

      console.log('Auto reminders triggered successfully:', result);
      showSuccess(`Auto reminders completed! ${result.result?.summary?.success || 0} emails sent successfully.`);
      // Refresh the overdue invoices list
      await fetchOverdueInvoices();
    } catch (error) {
      console.error('Error triggering auto reminders:', error);
      showError(`Failed to trigger auto reminders: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSendingReminders([]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Bell className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Auto Reminders
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage overdue invoice reminders
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchDebugInfo}
              className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            >
              Debug
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : overdueInvoices.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Overdue Invoices
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                All your invoices are up to date!
              </p>
              
              {/* Auto Reminder Info */}
              <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  🤖 Automated Reminder System
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                  Your reminders are automatically sent daily at 9:00 AM for overdue invoices.
                </p>
                <div className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                  <p>• <strong>First Reminder:</strong> Sent when invoice becomes overdue</p>
                  <p>• <strong>Second Reminder:</strong> Sent 24+ hours after first reminder</p>
                  <p>• <strong>Final Notice:</strong> Sent 24+ hours after second reminder</p>
                  <p>• <strong>Max 3 reminders</strong> per invoice to avoid spam</p>
                </div>
                <button
                  onClick={triggerAutoReminders}
                  disabled={sendingReminders.includes('auto')}
                  className="mt-3 flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm mx-auto cursor-pointer"
                >
                  {sendingReminders.includes('auto') ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  ) : (
                    <Bell className="h-3 w-3" />
                  )}
                  <span>Test Auto System</span>
                </button>
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500">
                <p>Note: Only invoices with status &quot;sent&quot; and past due date are shown.</p>
                <p>Check the browser console for debug information.</p>
                {debugInfo && (
                  <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-left">
                    <p><strong>Debug Info:</strong></p>
                    <p>Total Invoices: {debugInfo.debug?.totalInvoices || 0}</p>
                    <p>Overdue Count: {debugInfo.overdueCount || 0}</p>
                    <p>User ID: {debugInfo.debug?.userId}</p>
                    {debugInfo.debug?.invoices && debugInfo.debug.invoices.length > 0 && (
                      <div className="mt-2">
                        <p><strong>All Invoices:</strong></p>
                        {debugInfo.debug.invoices.slice(0, 3).map((invoice, index: number) => (
                          <div key={index} className="text-xs">
                            #{invoice.invoiceNumber} - {invoice.status} - Due: {new Date(invoice.dueDate).toLocaleDateString()} 
                            {invoice.isOverdue && <span className="text-red-500"> (OVERDUE)</span>}
                          </div>
                        ))}
                        {debugInfo.debug.invoices.length > 3 && <p>... and {debugInfo.debug.invoices.length - 3} more</p>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-purple-900 dark:text-purple-100">
                      {overdueInvoices.length} Overdue Invoices
                    </h3>
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      Ready to send reminders
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={triggerAutoReminders}
                      disabled={sendingReminders.includes('auto')}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      {sendingReminders.includes('auto') ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Bell className="h-4 w-4" />
                      )}
                      <span>Auto Send All</span>
                    </button>
                    <button
                      onClick={sendAllReminders}
                      disabled={sendingReminders.length > 0}
                      className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      <Send className="h-4 w-4" />
                      <span>Send All Manual</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Invoice List */}
              <div className="space-y-4">
                {overdueInvoices.map((invoice) => (
                  <div
                    key={invoice.invoiceId}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            Invoice #{invoice.invoiceNumber}
                          </h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            invoice.reminderType === 'first' 
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                              : invoice.reminderType === 'second'
                              ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                            {invoice.reminderType === 'first' ? 'First Reminder' :
                             invoice.reminderType === 'second' ? 'Second Reminder' : 'Final Notice'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Client:</span>
                            <p className="font-medium text-gray-900 dark:text-white">{invoice.clientName}</p>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Amount:</span>
                            <p className="font-medium text-gray-900 dark:text-white">${invoice.total.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Days Overdue:</span>
                            <p className="font-medium text-red-600 dark:text-red-400">{invoice.daysOverdue} days</p>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Email:</span>
                            <p className="font-medium text-gray-900 dark:text-white truncate">{invoice.clientEmail}</p>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4">
                        <button
                          onClick={() => sendReminder(invoice.invoiceId, invoice.reminderType)}
                          disabled={sendingReminders.includes(invoice.invoiceId)}
                          className="flex items-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                          {sendingReminders.includes(invoice.invoiceId) ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                          <span>Send</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
