import React, { useMemo } from 'react';
import { Send, Edit, X, FileText, AlertCircle } from 'lucide-react';
import type { Invoice } from '@/types';

interface SendInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onSend: () => void;
  invoiceNumber: string;
  invoice?: Invoice | null;
  isLoading?: boolean;
}

const SendInvoiceModal: React.FC<SendInvoiceModalProps> = ({
  isOpen,
  onClose,
  onEdit,
  onSend,
  invoiceNumber,
  invoice,
  isLoading = false
}) => {
  // Calculate warnings for overdue and passed reminder dates
  const warnings = useMemo(() => {
    const defaultWarnings = {
      isOverdue: false,
      overdueDays: 0,
      passedReminders: [] as Array<{ type: string; date: Date; days: number }>
    };

    if (!invoice) return defaultWarnings;

    const warnings = {
      isOverdue: false,
      overdueDays: 0,
      passedReminders: [] as Array<{ type: string; date: Date; days: number }>
    };

    // Check if due date has passed
    if (invoice.dueDate) {
      const today = new Date();
      const dueDate = new Date(invoice.dueDate);
      const todayStart = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
      const dueDateStart = new Date(Date.UTC(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()));
      
      const diffDays = Math.round((dueDateStart.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        warnings.isOverdue = true;
        warnings.overdueDays = Math.abs(diffDays);
      }
    }

    // Check if reminder dates have passed
    if (invoice.reminders?.enabled && invoice.dueDate) {
      const today = new Date();
      const dueDate = new Date(invoice.dueDate);
      const todayStart = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
      const dueDateStart = new Date(Date.UTC(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()));

      // Use the same base date logic as the reminder scheduling function
      // For "Due on Receipt", base date would be when sent (updatedAt), but for draft we use dueDate
      let baseDate = dueDateStart;
      
      // Parse payment terms to determine smart reminder schedule
      const paymentTerms = invoice.paymentTerms;
      const paymentTerm = paymentTerms?.terms || 'Net 30';

      if (invoice.reminders.useSystemDefaults) {
        // Smart reminder system - matches the actual scheduling logic
        let smartSchedule: Array<{ type: string; days: number }> = [];
        
        if (paymentTerm === 'Due on Receipt') {
          smartSchedule = [
            { type: 'friendly', days: 1 },
            { type: 'polite', days: 3 },
            { type: 'firm', days: 7 },
            { type: 'urgent', days: 14 }
          ];
        } else if (paymentTerm === 'Net 15') {
          smartSchedule = [
            { type: 'friendly', days: -7 },
            { type: 'polite', days: -3 },
            { type: 'firm', days: 1 },
            { type: 'urgent', days: 7 }
          ];
        } else if (paymentTerm === 'Net 30') {
          smartSchedule = [
            { type: 'friendly', days: -14 },
            { type: 'polite', days: -7 },
            { type: 'firm', days: 1 },
            { type: 'urgent', days: 7 }
          ];
        } else if (paymentTerm === '2/10 Net 30') {
          smartSchedule = [
            { type: 'friendly', days: -2 },
            { type: 'polite', days: 1 },
            { type: 'firm', days: 7 },
            { type: 'urgent', days: 14 }
          ];
        } else {
          // Default: Extract days from payment term or use Net 30 schedule
          const daysMatch = paymentTerm.match(/(\d+)/);
          const netDays = daysMatch ? parseInt(daysMatch[1]) : 30;
          
          if (netDays <= 15) {
            smartSchedule = [
              { type: 'friendly', days: -7 },
              { type: 'polite', days: -3 },
              { type: 'firm', days: 1 },
              { type: 'urgent', days: 7 }
            ];
          } else {
            smartSchedule = [
              { type: 'friendly', days: -14 },
              { type: 'polite', days: -7 },
              { type: 'firm', days: 1 },
              { type: 'urgent', days: 7 }
            ];
          }
        }
        
        smartSchedule.forEach((reminder) => {
          const reminderDate = new Date(baseDate);
          reminderDate.setUTCDate(reminderDate.getUTCDate() + reminder.days);
          
          if (reminderDate < todayStart) {
            warnings.passedReminders.push({
              type: reminder.type,
              date: reminderDate,
              days: reminder.days
            });
          }
        });
      } else if (invoice.reminders.customRules) {
        // Custom reminder rules
        invoice.reminders.customRules.forEach((rule) => {
          if (rule.enabled) {
            let reminderDate: Date;
            
            if (rule.type === 'before') {
              reminderDate = new Date(baseDate);
              reminderDate.setUTCDate(reminderDate.getUTCDate() - rule.days);
            } else {
              // 'after'
              reminderDate = new Date(baseDate);
              reminderDate.setUTCDate(reminderDate.getUTCDate() + rule.days);
            }
            
            if (reminderDate < todayStart) {
              warnings.passedReminders.push({
                type: rule.type === 'before' ? 'before due' : 'after due',
                date: reminderDate,
                days: rule.days
              });
            }
          }
        });
      }
    }

    return warnings;
  }, [invoice]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white shadow-2xl border border-gray-200 max-w-md w-full mx-4 transform transition-all duration-300 scale-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-blue-50">
              <Send className="h-6 w-6 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Send Invoice
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            disabled={isLoading}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 bg-white space-y-4">
          <p className="text-gray-600 leading-relaxed">
            {invoice?.status === 'paid' ? (
              <>
                You&apos;re about to send a receipt for invoice <span className="font-semibold text-gray-900">{invoiceNumber}</span> to your client. This invoice is already marked as paid and will be sent as a confirmation/receipt.
              </>
            ) : (
              <>
                You&apos;re about to send invoice <span className="font-semibold text-gray-900">{invoiceNumber}</span> to your client. Would you like to edit it first or send it now?
              </>
            )}
          </p>

          {/* Warnings */}
          {(warnings.isOverdue || warnings.passedReminders.length > 0) && (
            <div className="space-y-3 pt-2 border-t border-gray-200">
              {warnings.isOverdue && (
                <div className="px-4 py-3 bg-amber-50 border-l-4 border-amber-500">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-900">
                        Due Date Has Passed
                      </p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        This invoice is {warnings.overdueDays} day{warnings.overdueDays !== 1 ? 's' : ''} overdue. Consider updating the due date before sending.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {warnings.passedReminders.length > 0 && (
                <div className="px-4 py-3 bg-indigo-50 border-l-4 border-indigo-500">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-indigo-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-indigo-900">
                        Reminder Dates Have Passed
                      </p>
                      <p className="text-xs text-indigo-700 mt-0.5">
                        {warnings.passedReminders.length} scheduled reminder{warnings.passedReminders.length !== 1 ? 's' : ''} {warnings.passedReminders.length === 1 ? 'date has' : 'dates have'} already passed. Reminders will be rescheduled based on the current date when sent.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-white">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Cancel
          </button>
          {invoice?.status !== 'paid' && (
            <button
              onClick={onEdit}
              disabled={isLoading}
              className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center space-x-2"
            >
              <Edit className="h-4 w-4" />
              <span>Edit</span>
            </button>
          )}
          <button
            onClick={onSend}
            disabled={isLoading}
            className="px-6 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>{invoice?.status === 'paid' ? 'Send Receipt' : 'Send'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendInvoiceModal;

