'use client';

import React, { useState } from 'react';
import { Mail, Settings, Clock } from 'lucide-react';
import ReminderSettings from './ReminderSettings';

interface InvoiceReminderIntegrationProps {
  invoice: any;
  businessSettings: any;
  isDarkMode: boolean;
  onInvoiceUpdate: (updatedInvoice: any) => void;
}

const InvoiceReminderIntegration: React.FC<InvoiceReminderIntegrationProps> = ({
  invoice,
  businessSettings,
  isDarkMode,
  onInvoiceUpdate
}) => {
  const [showReminderSettings, setShowReminderSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveReminderSettings = async (reminderSettings: any) => {
    setIsLoading(true);
    try {
      // Update the invoice with new reminder settings
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reminderSettings
        })
      });

      if (response.ok) {
        const updatedInvoice = await response.json();
        onInvoiceUpdate(updatedInvoice);
        setShowReminderSettings(false);
      } else {
        console.error('Failed to save reminder settings');
      }
    } catch (error) {
      console.error('Error saving reminder settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getReminderStatus = () => {
    if (!invoice.reminderSettings?.enabled) {
      return { status: 'disabled', text: 'Reminders disabled', color: 'gray' };
    }

    const dueDate = new Date(invoice.dueDate);
    const currentDate = new Date();
    const overdueDays = Math.ceil((currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

    if (overdueDays > 14) {
      return { status: 'urgent', text: 'Urgent reminders active', color: 'red' };
    } else if (overdueDays > 7) {
      return { status: 'firm', text: 'Firm reminders active', color: 'orange' };
    } else if (overdueDays > 3) {
      return { status: 'polite', text: 'Polite reminders active', color: 'yellow' };
    } else if (overdueDays > 0) {
      return { status: 'friendly', text: 'Friendly reminders active', color: 'blue' };
    } else {
      return { status: 'pending', text: 'Reminders scheduled', color: 'green' };
    }
  };

  const reminderStatus = getReminderStatus();

  return (
    <div className="space-y-4">
      {/* Reminder Status Card */}
      <div className={`p-4 rounded-lg border ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              reminderStatus.color === 'red' ? 'bg-red-100 text-red-600' :
              reminderStatus.color === 'orange' ? 'bg-orange-100 text-orange-600' :
              reminderStatus.color === 'yellow' ? 'bg-yellow-100 text-yellow-600' :
              reminderStatus.color === 'blue' ? 'bg-blue-100 text-blue-600' :
              reminderStatus.color === 'green' ? 'bg-green-100 text-green-600' :
              'bg-gray-100 text-gray-600'
            }`}>
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                Payment Reminders
              </h3>
              <p className="text-sm" style={{color: isDarkMode ? '#9ca3af' : '#6b7280'}}>
                {reminderStatus.text}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowReminderSettings(!showReminderSettings)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isDarkMode 
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Settings className="h-4 w-4" />
            <span>Configure</span>
          </button>
        </div>
      </div>

      {/* Reminder Settings */}
      {showReminderSettings && (
        <ReminderSettings
          invoice={invoice}
          businessSettings={businessSettings}
          onSave={handleSaveReminderSettings}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Quick Actions */}
      <div className="flex space-x-3">
        <button
          onClick={() => setShowReminderSettings(true)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isDarkMode 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <Mail className="h-4 w-4" />
          <span>Setup Reminders</span>
        </button>
        
        {invoice.reminderSettings?.enabled && (
          <button
            onClick={async () => {
              // Send test reminder
              try {
                const response = await fetch('/api/reminders/send', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    invoiceId: invoice.id,
                    reminderType: 'friendly',
                    overdueDays: 0
                  })
                });
                
                if (response.ok) {
                  alert('Test reminder sent successfully!');
                } else {
                  alert('Failed to send test reminder');
                }
              } catch (error) {
                console.error('Error sending test reminder:', error);
                alert('Error sending test reminder');
              }
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isDarkMode 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Send Test</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default InvoiceReminderIntegration;
