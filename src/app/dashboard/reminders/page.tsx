'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Mail, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Search, 
  RefreshCw,
  Send,
  Eye
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import ToastContainer from '@/components/Toast';
import ModernSidebar from '@/components/ModernSidebar';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ReminderHistory {
  id: string;
  invoice_id: string;
  reminder_type: 'friendly' | 'polite' | 'firm' | 'urgent';
  overdue_days: number;
  sent_at: string;
  email_id: string;
  invoice: {
    invoice_number: string;
    total: number;
    due_date: string;
    status: string;
    clients: {
      name: string;
      email: string;
      company: string;
    };
  };
}

export default function ReminderHistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const { toasts, removeToast, showSuccess, showError } = useToast();
  const [reminders, setReminders] = useState<ReminderHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');




  const fetchReminderHistory = async () => {
    try {
      console.log('Starting to fetch reminder history...');
      setLoading(true);
      
      if (!user?.id) {
        console.log('No user ID, setting empty reminders');
        setReminders([]);
        return;
      }

      // Fetch reminder history
      const { data: reminderData, error: reminderError } = await supabase
        .from('invoice_reminders')
        .select(`
          *,
          invoices (
            invoice_number,
            total,
            due_date,
            status,
            clients (
              name,
              email,
              company
            )
          )
        `)
        .eq('invoices.user_id', user.id)
        .order('sent_at', { ascending: false });

      if (reminderError) {
        if (reminderError.code === 'PGRST205' || reminderError.message?.includes('Could not find the table')) {
          console.log('Reminders table not found - this is expected if migration hasn\'t been run yet');
          setReminders([]);
          return;
        }
        console.error('Error fetching reminders:', reminderError);
        return;
      }

      console.log('Fetched reminders:', reminderData);
      setReminders(reminderData || []);

    } catch (error) {
      console.error('Error fetching reminder history:', error);
      setReminders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchReminderHistory();
    }
  }, [user?.id]);

  const filteredReminders = reminders.filter(reminder => {
    const matchesSearch = 
      reminder.invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reminder.invoice.clients.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reminder.invoice.clients.email.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const getReminderTypeColor = (type: string) => {
    switch (type) {
      case 'friendly': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'polite': return 'bg-green-100 text-green-800 border-green-200';
      case 'firm': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'sent': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const sendManualReminder = async (invoiceId: string, reminderType: string) => {
    try {
      const response = await fetch('/api/reminders/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId,
          reminderType,
          overdueDays: 0
        })
      });

      if (response.ok) {
        alert('Reminder sent successfully!');
        fetchReminderHistory(); // Refresh data
      } else {
        alert('Failed to send reminder');
      }
    } catch (error) {
      console.error('Error sending reminder:', error);
      alert('Error sending reminder');
    }
  };


  if (authLoading) {
    return (
      <div className={`min-h-screen transition-colors duration-200 ${'bg-white'}`}>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`min-h-screen transition-colors duration-200 ${'bg-white'}`}>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Please log in to access reminders</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-200 ${'bg-white'}`}>
      <div className="flex h-screen">
        <ModernSidebar 
          isDarkMode={false} 
          onToggleDarkMode={() => {}}
          onCreateInvoice={() => {}} // Not needed for reminders page
        />
        
        <main className="flex-1 lg:ml-0 overflow-y-auto scroll-smooth custom-scrollbar">
          <div className="pt-16 lg:pt-4 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xl sm:text-2xl font-semibold" style={{color: '#1f2937'}}>
              Reminder History
            </h2>
             <button
               onClick={fetchReminderHistory}
               className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
             >
               <RefreshCw className="h-4 w-4" />
               <span>Refresh</span>
             </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md w-full">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${'text-gray-500'}`} />
            <input
              type="text"
              placeholder="Search reminders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border text-sm border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg p-6 bg-white/70 border border-gray-200 backdrop-blur-sm">
                <div className="animate-pulse">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
                      <div>
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32 mb-2"></div>
                        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                      <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReminders.map((reminder) => (
              <div key={reminder.id} className="rounded-xl p-4 sm:p-6 bg-white/70 border border-gray-200 backdrop-blur-sm hover:shadow-lg transition-all duration-200">
                {/* Mobile Layout */}
                <div className="block sm:hidden">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100">
                        <Mail className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {reminder.invoice.invoice_number}
                        </div>
                         <div className="text-xs font-semibold text-green-600">
                           ${reminder.invoice.total.toLocaleString()}
                         </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getReminderTypeColor(reminder.reminder_type)}`}>
                        {reminder.reminder_type}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600">Client:</span>
                      <span className="text-xs text-gray-600">{reminder.invoice.clients.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600">Status:</span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(reminder.invoice.status)}`}>
                        {reminder.invoice.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600">Sent:</span>
                      <span className="text-xs text-gray-600">
                        {new Date(reminder.sent_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => sendManualReminder(reminder.invoice_id, reminder.reminder_type)}
                        className="p-2 rounded-lg transition-colors bg-blue-600 text-white hover:bg-blue-700"
                        title="Send again"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => window.open(`/invoice/${reminder.invoice_id}`, '_blank')}
                        className="p-2 rounded-lg transition-colors bg-gray-200 text-gray-600 hover:bg-gray-300"
                        title="View invoice"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden sm:block">
                  <div className="grid grid-cols-12 gap-6 items-center">
                    {/* Left Section - Reminder Info */}
                    <div className="col-span-5 flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-100">
                        <Mail className="h-6 w-6 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="font-semibold text-base" style={{color: '#1f2937'}}>
                            {reminder.invoice.invoice_number}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getReminderTypeColor(reminder.reminder_type)}`}>
                            {reminder.reminder_type}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm">
                          <span className={'text-gray-500'}>
                            {reminder.invoice.clients.name}
                          </span>
                          <span className={'text-gray-500'}>
                            {reminder.invoice.clients.email}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Middle Section - Amount & Status */}
                    <div className="col-span-4 flex items-center justify-center">
                      <div className="text-center">
                         <div className="text-lg font-semibold mb-1 text-green-600">
                           ${reminder.invoice.total.toLocaleString()}
                         </div>
                        <div className="flex items-center justify-center space-x-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(reminder.invoice.status)}`}>
                            {reminder.invoice.status}
                          </span>
                        </div>
                        <div className={`text-xs mt-1 ${'text-gray-500'}`}>
                          Sent: {new Date(reminder.sent_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {/* Right Section - Actions */}
                    <div className="col-span-3 flex items-center justify-end space-x-2">
                      <button
                        onClick={() => sendManualReminder(reminder.invoice_id, reminder.reminder_type)}
                        className="p-2 rounded-lg transition-colors bg-blue-600 text-white hover:bg-blue-700"
                        title="Send again"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => window.open(`/invoice/${reminder.invoice_id}`, '_blank')}
                        className="p-2 rounded-lg transition-colors bg-gray-200 text-gray-600 hover:bg-gray-300"
                        title="View invoice"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {filteredReminders.length === 0 && !loading && (
              <div className="rounded-lg p-6 bg-white/70 border border-gray-200 backdrop-blur-sm">
                <div className="text-center py-12">
                  <Mail className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No reminders found
                  </h3>
                  <p className={`mt-1 text-sm ${'text-gray-500'}`}>
                    {searchTerm ? 'Try adjusting your search terms.' : 'No automated reminders have been sent yet.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
          </div>
        </main>
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
