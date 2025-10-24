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
  reminder_status: 'sent' | 'failed' | 'scheduled' | 'delivered' | 'bounced';
  failure_reason?: string;
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


      // Fetch reminder history from database
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

      if (reminderData) {
        const formattedReminders: ReminderHistory[] = reminderData.map(reminder => ({
          id: reminder.id,
          invoice_id: reminder.invoice_id,
          reminder_type: reminder.reminder_type,
          overdue_days: reminder.overdue_days,
          sent_at: reminder.sent_at,
          email_id: reminder.email_id,
          reminder_status: reminder.reminder_status || 'sent',
          failure_reason: reminder.failure_reason,
          invoice: {
            invoice_number: reminder.invoices.invoice_number,
            total: reminder.invoices.total,
            due_date: reminder.invoices.due_date,
            status: reminder.invoices.status,
            clients: reminder.invoices.clients
          }
        }));
        
        setReminders(formattedReminders);
      }

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
      case 'polite': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'firm': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'sent': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getReminderStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'text-emerald-600';
      case 'sent': return 'text-blue-600';
      case 'scheduled': return 'text-yellow-600';
      case 'failed': return 'text-red-600';
      case 'bounced': return 'text-orange-600';
      default: return 'text-gray-600';
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
              Automated Reminder History - v2.0
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
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="animate-pulse">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-300 rounded-lg"></div>
                      <div>
                        <div className="h-4 bg-gray-300 rounded w-24 mb-1"></div>
                        <div className="h-3 bg-gray-300 rounded w-16"></div>
                      </div>
                    </div>
                    <div className="h-6 bg-gray-300 rounded w-16"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-300 rounded w-20"></div>
                    <div className="h-3 bg-gray-300 rounded w-24"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReminders.map((reminder) => (
              <div key={reminder.id} className="rounded-lg border transition-all duration-200 hover:shadow-sm bg-white border-gray-200 hover:bg-gray-50/50">
                {/* Mobile Layout */}
                <div className="block sm:hidden p-4">
                  <div className="space-y-3">
                    {/* Top Row: Invoice Info + Amount */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100">
                          <Mail className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <div className="font-medium text-sm" style={{color: '#1f2937'}}>
                            {reminder.invoice.invoice_number}
                          </div>
                          <div className="text-xs" style={{color: '#6b7280'}}>
                            {reminder.invoice.clients.name}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-base text-green-600">
                          ${reminder.invoice.total.toLocaleString()}
                        </div>
                        <div className="text-xs" style={{color: '#6b7280'}}>
                          {new Date(reminder.sent_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    {/* Bottom Row: Reminder Type, Status & Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className={`text-xs font-medium ${
                          reminder.reminder_type === 'friendly' ? 'text-blue-600' :
                          reminder.reminder_type === 'polite' ? 'text-emerald-600' :
                          reminder.reminder_type === 'firm' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          <span className="capitalize">{reminder.reminder_type}</span>
                        </span>
                        <span className={`text-xs font-medium ${getReminderStatusColor(reminder.reminder_status)}`}>
                          <span className="capitalize">{reminder.reminder_status}</span>
                        </span>
                        {reminder.failure_reason && (
                          <span className="text-xs font-medium text-red-600" title={reminder.failure_reason}>
                            ⚠️ {reminder.failure_reason}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        {reminder.reminder_status === 'failed' && (
                          <button
                            onClick={() => sendManualReminder(reminder.invoice_id, reminder.reminder_type)}
                            className="p-1.5 rounded-md transition-colors hover:bg-gray-100"
                            title="Send again"
                          >
                            <Send className="h-4 w-4 text-gray-600" />
                          </button>
                        )}
                        <button
                          onClick={() => window.open(`/invoice/${reminder.invoice_id}`, '_blank')}
                          className="p-1.5 rounded-md transition-colors hover:bg-gray-100"
                          title="View invoice"
                        >
                          <Eye className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden sm:block p-4">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Invoice Info - 3 columns */}
                    <div className="col-span-3 flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100">
                        <Mail className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <div className="font-medium text-sm" style={{color: '#1f2937'}}>
                          {reminder.invoice.invoice_number}
                        </div>
                        <div className="text-xs" style={{color: '#6b7280'}}>
                          {reminder.invoice.clients.name}
                        </div>
                      </div>
                    </div>
                    
                    {/* Amount - 2 columns */}
                    <div className="col-span-2 text-center">
                      <div className="font-semibold text-base text-green-600">
                        ${reminder.invoice.total.toLocaleString()}
                      </div>
                      <div className="text-xs" style={{color: '#6b7280'}}>
                        {new Date(reminder.sent_at).toLocaleDateString()}
                      </div>
                    </div>
                    
                    {/* Reminder Type - 2 columns */}
                    <div className="col-span-2 text-center">
                      <span className={`text-xs font-medium ${
                        reminder.reminder_type === 'friendly' ? 'text-blue-600' :
                        reminder.reminder_type === 'polite' ? 'text-emerald-600' :
                        reminder.reminder_type === 'firm' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        <span className="capitalize">{reminder.reminder_type}</span>
                      </span>
                    </div>
                    
                    {/* Status & Reasons - 3 columns */}
                    <div className="col-span-3 flex items-center space-x-2 flex-wrap">
                      <span className={`text-xs font-medium ${getReminderStatusColor(reminder.reminder_status)}`}>
                        <span className="capitalize">{reminder.reminder_status}</span>
                      </span>
                      {reminder.failure_reason && (
                        <span className="text-xs font-medium text-red-600" title={reminder.failure_reason}>
                          ⚠️ {reminder.failure_reason}
                        </span>
                      )}
                    </div>
                    
                    {/* Actions - 2 columns */}
                    <div className="col-span-2 flex items-center justify-end space-x-1">
                      {reminder.reminder_status === 'failed' && (
                        <button
                          onClick={() => sendManualReminder(reminder.invoice_id, reminder.reminder_type)}
                          className="p-1.5 rounded-md transition-colors hover:bg-gray-100"
                          title="Send again"
                        >
                          <Send className="h-4 w-4 text-gray-600" />
                        </button>
                      )}
                      <button
                        onClick={() => window.open(`/invoice/${reminder.invoice_id}`, '_blank')}
                        className="p-1.5 rounded-md transition-colors hover:bg-gray-100"
                        title="View invoice"
                      >
                        <Eye className="h-4 w-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {filteredReminders.length === 0 && !loading && (
              <div className="col-span-full">
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                  <div className="text-center py-12">
                    <Mail className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      No reminders found
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchTerm ? 'Try adjusting your search terms.' : 'No automated reminders have been sent yet.'}
                    </p>
                  </div>
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

