'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Mail, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Search, 
  RefreshCw,
  Send,
  Eye,
  X
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import ToastContainer from '@/components/Toast';
import ModernSidebar from '@/components/ModernSidebar';
import { supabase } from '@/lib/supabase';

interface ReminderHistory {
  id: string;
  invoice_id: string;
  reminder_type: 'friendly' | 'polite' | 'firm' | 'urgent';
  overdue_days: number;
  sent_at: string;
  email_id: string;
  reminder_status: 'sent' | 'failed' | 'scheduled' | 'delivered' | 'bounced';
  failure_reason?: string;
  created_at?: string;
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
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedReminder, setSelectedReminder] = useState<ReminderHistory | null>(null);
  const [showReminderModal, setShowReminderModal] = useState(false);




  const fetchReminderHistory = async () => {
    try {
      setLoading(true);
      
      if (!user?.id) {
        setReminders([]);
        return;
      }


      // Fetch reminder history from database
      // First get all reminders for user's invoices
      const { data: userInvoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('id')
        .eq('user_id', user.id);
      
      if (invoicesError) {
        console.error('Error fetching user invoices:', invoicesError);
        setReminders([]);
        return;
      }
      
      if (!userInvoices || userInvoices.length === 0) {
        console.log('No invoices found for user');
        setReminders([]);
        return;
      }
      
      const invoiceIds = userInvoices.map(inv => inv.id);
      console.log(`Fetching reminders for ${invoiceIds.length} invoices`);
      
      // Handle large arrays by chunking if needed (Supabase .in() has limits)
      // For now, we'll query all at once but add error handling
      let reminderData: any[] = [];
      let reminderError: any = null;
      
      // If invoiceIds is very large, we might need to chunk it
      // For most use cases, this should be fine
      if (invoiceIds.length > 0) {
        const { data, error } = await supabase
          .from('invoice_reminders')
          .select(`
            *,
            invoices (
              invoice_number,
              total,
              due_date,
              status,
              user_id,
              clients (
                name,
                email,
                company
              )
            )
          `)
          .in('invoice_id', invoiceIds)
          .order('sent_at', { ascending: false });
        
        reminderData = data || [];
        reminderError = error;
      }

      if (reminderError) {
        if (reminderError.code === 'PGRST205' || reminderError.message?.includes('Could not find the table')) {
          setReminders([]);
          return;
        }
        console.error('Error fetching reminders:', reminderError);
        setReminders([]);
        return;
      }

      if (reminderData && reminderData.length > 0) {
        console.log(`Found ${reminderData.length} reminder(s) in database`);
        
        // Filter out reminders with null invoices (in case of orphaned reminders)
        const validReminders = reminderData.filter(reminder => reminder.invoices && reminder.invoices.invoice_number);
        console.log(`After filtering, ${validReminders.length} valid reminder(s)`);
        
        
        const formattedReminders: ReminderHistory[] = validReminders.map(reminder => {
          // Handle old reminders that might not have reminder_status set
          // Default to 'sent' for backward compatibility
          let reminderStatus: 'sent' | 'failed' | 'scheduled' | 'delivered' | 'bounced' = reminder.reminder_status || 'sent';
          
          // If status is null/undefined, check if it has an email_id to determine if it was sent
          if (!reminder.reminder_status) {
            reminderStatus = reminder.email_id ? 'sent' : 'scheduled';
          }
          
          // Safety check for clients data
          const clientsData = reminder.invoices.clients || {};
          
          return {
            id: reminder.id,
            invoice_id: reminder.invoice_id,
            reminder_type: reminder.reminder_type || 'friendly',
            overdue_days: reminder.overdue_days || 0,
            sent_at: reminder.sent_at || reminder.created_at || new Date().toISOString(),
            email_id: reminder.email_id || null,
            reminder_status: reminderStatus,
            failure_reason: reminder.failure_reason || null,
            created_at: reminder.created_at || new Date().toISOString(),
            invoice: {
              invoice_number: reminder.invoices.invoice_number,
              total: reminder.invoices.total || 0,
              due_date: reminder.invoices.due_date,
              status: reminder.invoices.status || 'sent',
              clients: {
                name: clientsData.name || 'N/A',
                email: clientsData.email || 'N/A',
                company: clientsData.company || null
              }
            }
          };
        });
        
        console.log(`Formatted ${formattedReminders.length} reminder(s) for display`);
        setReminders(formattedReminders);
      } else {
        console.log('No reminder data found');
        setReminders([]);
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

  // Debounced search term for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Optimized filtering and sorting with useMemo and debounced search
  const filteredReminders = useMemo(() => {
    if (!reminders || reminders.length === 0) {
      return [];
    }
    
    return reminders.filter(reminder => {
      // Safety check for invoice data
      if (!reminder.invoice || !reminder.invoice.invoice_number) {
        return false;
      }
      
      const matchesSearch = 
        reminder.invoice.invoice_number.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        (reminder.invoice.clients?.name || '').toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        (reminder.invoice.clients?.email || '').toLowerCase().includes(debouncedSearchTerm.toLowerCase());

      if (!matchesSearch) return false;

      // Show ALL reminders regardless of status
      // - Scheduled reminders (past, present, future) - so users can see what's pending
      // - Sent/failed/delivered/bounced reminders (all time) - complete history
      return true;
    }).sort((a, b) => {
      // Sort by status priority: sent/failed/delivered/bounced first, then scheduled
      const statusPriority: Record<string, number> = { 
        'sent': 1, 
        'delivered': 1, 
        'failed': 1, 
        'bounced': 1, 
        'scheduled': 2 
      };
      const aPriority = statusPriority[a.reminder_status] || 3;
      const bPriority = statusPriority[b.reminder_status] || 3;
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // Within same status, sort by date (newest first for sent/failed, earliest first for scheduled)
      if (a.reminder_status === 'scheduled' && b.reminder_status === 'scheduled') {
        return new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime();
      }
      
      // For sent/failed/delivered/bounced, show newest first
      return new Date(b.sent_at || b.created_at || 0).getTime() - new Date(a.sent_at || a.created_at || 0).getTime();
    });
  }, [reminders, debouncedSearchTerm]);

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

  const handleViewReminder = (reminder: ReminderHistory) => {
    setSelectedReminder(reminder);
    setShowReminderModal(true);
  };

  const closeReminderModal = () => {
    setShowReminderModal(false);
    setSelectedReminder(null);
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

  if (!user && !loading) {
    // Redirect to auth page with session expired feedback
    window.location.href = '/auth?message=session_expired';
    return null;
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
              History
            </h2>
             <button
               onClick={fetchReminderHistory}
               className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium cursor-pointer"
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
              className="w-full pl-10 pr-4 py-2 rounded-lg border text-sm border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
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
                            className="p-1.5 rounded-md transition-colors hover:bg-gray-100 cursor-pointer"
                            title="Send again"
                          >
                            <Send className="h-4 w-4 text-gray-600" />
                          </button>
                        )}
                        <button
                          onClick={() => handleViewReminder(reminder)}
                          className="p-1.5 rounded-md transition-colors hover:bg-gray-100 cursor-pointer"
                          title="View reminder details"
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
                          className="p-1.5 rounded-md transition-colors hover:bg-gray-100 cursor-pointer"
                          title="Send again"
                        >
                          <Send className="h-4 w-4 text-gray-600" />
                        </button>
                      )}
                      <button
                        onClick={() => handleViewReminder(reminder)}
                        className="p-1.5 rounded-md transition-colors hover:bg-gray-100"
                        title="View reminder details"
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
                      {searchTerm ? 'Try adjusting your search terms.' : 'No reminders found. Sent/failed/delivered/bounced reminders (all time) and all scheduled reminders will appear here.'}
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

      {/* Sliding Modal for Reminder Details */}
      {showReminderModal && selectedReminder && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 backdrop-blur-sm bg-white/20 transition-all duration-300"
            onClick={closeReminderModal}
          />
          
          {/* Sliding Panel - 75% width on mobile, fixed width on desktop */}
          <div className="absolute right-0 top-0 h-full w-3/4 sm:w-full sm:max-w-md bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Reminder Details</h3>
                <button
                  onClick={closeReminderModal}
                  className="p-2 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <div className="space-y-4 sm:space-y-6">
                  {/* Invoice Info */}
                  <div>
                    <h4 className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Invoice Information</h4>
                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                        <span className="text-xs sm:text-sm text-gray-600">Invoice Number:</span>
                        <span className="text-xs sm:text-sm font-medium text-gray-900 break-words">{selectedReminder.invoice.invoice_number}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                        <span className="text-xs sm:text-sm text-gray-600">Amount:</span>
                        <span className="text-xs sm:text-sm font-medium text-green-600 break-words">${selectedReminder.invoice.total.toLocaleString()}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                        <span className="text-xs sm:text-sm text-gray-600">Due Date:</span>
                        <span className="text-xs sm:text-sm font-medium text-gray-900 break-words">{new Date(selectedReminder.invoice.due_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                        <span className="text-xs sm:text-sm text-gray-600">Status:</span>
                        <span className={`text-xs sm:text-sm font-medium capitalize break-words ${
                          selectedReminder.invoice.status === 'paid' ? 'text-green-600' :
                          selectedReminder.invoice.status === 'sent' ? 'text-blue-600' :
                          selectedReminder.invoice.status === 'overdue' ? 'text-red-600' :
                          'text-gray-600'
                        }`}>
                          {selectedReminder.invoice.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Client Info */}
                  <div>
                    <h4 className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Client Information</h4>
                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                        <span className="text-xs sm:text-sm text-gray-600">Name:</span>
                        <span className="text-xs sm:text-sm font-medium text-gray-900 break-words">{selectedReminder.invoice.clients.name}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                        <span className="text-xs sm:text-sm text-gray-600">Email:</span>
                        <span className="text-xs sm:text-sm font-medium text-gray-900 break-words break-all">{selectedReminder.invoice.clients.email}</span>
                      </div>
                      {selectedReminder.invoice.clients.company && (
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                          <span className="text-xs sm:text-sm text-gray-600">Company:</span>
                          <span className="text-xs sm:text-sm font-medium text-gray-900 break-words">{selectedReminder.invoice.clients.company}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Reminder Info */}
                  <div>
                    <h4 className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Reminder Information</h4>
                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                        <span className="text-xs sm:text-sm text-gray-600">Type:</span>
                        <span className={`text-xs sm:text-sm font-medium capitalize break-words ${
                          selectedReminder.reminder_type === 'friendly' ? 'text-blue-600' :
                          selectedReminder.reminder_type === 'polite' ? 'text-emerald-600' :
                          selectedReminder.reminder_type === 'firm' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {selectedReminder.reminder_type}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                        <span className="text-xs sm:text-sm text-gray-600">Status:</span>
                        <span className={`text-xs sm:text-sm font-medium capitalize break-words ${getReminderStatusColor(selectedReminder.reminder_status)}`}>
                          {selectedReminder.reminder_status}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                        <span className="text-xs sm:text-sm text-gray-600">Scheduled/Sent:</span>
                        <span className="text-xs sm:text-sm font-medium text-gray-900 break-words">
                          {new Date(selectedReminder.sent_at).toLocaleString()}
                        </span>
                      </div>
                      {selectedReminder.overdue_days !== 0 && (
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                          <span className="text-xs sm:text-sm text-gray-600">Overdue Days:</span>
                          <span className="text-xs sm:text-sm font-medium text-gray-900 break-words">{selectedReminder.overdue_days}</span>
                        </div>
                      )}
                      {selectedReminder.failure_reason && (
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                          <span className="text-xs sm:text-sm text-gray-600">Failure Reason:</span>
                          <span className="text-xs sm:text-sm font-medium text-red-600 break-words">{selectedReminder.failure_reason}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Footer */}
              <div className="p-4 sm:p-6 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:space-x-0">
                  <button
                    onClick={closeReminderModal}
                    className="w-full sm:flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-indigo-400 cursor-pointer transition-colors"
                  >
                    Close
                  </button>
                  {selectedReminder.reminder_status === 'failed' && (
                    <button
                      onClick={() => {
                        sendManualReminder(selectedReminder.invoice_id, selectedReminder.reminder_type);
                        closeReminderModal();
                      }}
                      className="w-full sm:flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-indigo-400 cursor-pointer transition-colors"
                    >
                      Send Again
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

