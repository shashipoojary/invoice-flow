'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Mail, Settings, CheckCircle, AlertCircle } from 'lucide-react';
import { getReminderSchedule } from '@/lib/reminder-email-templates';

interface ReminderSettingsProps {
  invoice: any;
  businessSettings: any;
  onSave: (settings: any) => void;
  isDarkMode: boolean;
}

const ReminderSettings: React.FC<ReminderSettingsProps> = ({
  invoice,
  businessSettings,
  onSave,
  isDarkMode
}) => {
  const [reminderSettings, setReminderSettings] = useState({
    enabled: true,
    useSystemDefaults: true,
    customRules: [] as any[]
  });

  const [isLoading, setIsLoading] = useState(false);
  const [previewType, setPreviewType] = useState<'friendly' | 'polite' | 'firm' | 'urgent'>('friendly');

  const reminderSchedule = getReminderSchedule();

  useEffect(() => {
    // Load existing reminder settings if available
    if (invoice.reminderSettings) {
      setReminderSettings(invoice.reminderSettings);
    }
  }, [invoice.reminderSettings]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave(reminderSettings);
    } catch (error) {
      console.error('Error saving reminder settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleReminder = (index: number) => {
    const newRules = [...reminderSettings.customRules];
    newRules[index] = {
      ...newRules[index],
      enabled: !newRules[index]?.enabled
    };
    setReminderSettings({
      ...reminderSettings,
      customRules: newRules
    });
  };

  const getReminderStatus = (days: number) => {
    const dueDate = new Date(invoice.dueDate);
    const currentDate = new Date();
    const overdueDays = Math.ceil((currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (overdueDays >= days) {
      return 'overdue';
    } else if (overdueDays >= days - 1) {
      return 'due-soon';
    }
    return 'pending';
  };

  return (
    <div className={`p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
      <div className="flex items-center space-x-3 mb-6">
        <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
          <Mail className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
            Auto Reminders
          </h3>
          <p className="text-sm" style={{color: isDarkMode ? '#9ca3af' : '#6b7280'}}>
            Set up automated payment reminders for this invoice
          </p>
        </div>
      </div>

      {/* Enable/Disable Toggle */}
      <div className="mb-6">
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={reminderSettings.enabled}
            onChange={(e) => setReminderSettings({
              ...reminderSettings,
              enabled: e.target.checked
            })}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm font-medium" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
            Enable automatic payment reminders
          </span>
        </label>
      </div>

      {reminderSettings.enabled && (
        <>
          {/* System Defaults vs Custom */}
          <div className="mb-6">
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="reminderType"
                  checked={reminderSettings.useSystemDefaults}
                  onChange={() => setReminderSettings({
                    ...reminderSettings,
                    useSystemDefaults: true
                  })}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                  Use system defaults
                </span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="reminderType"
                  checked={!reminderSettings.useSystemDefaults}
                  onChange={() => setReminderSettings({
                    ...reminderSettings,
                    useSystemDefaults: false
                  })}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                  Custom schedule
                </span>
              </label>
            </div>
          </div>

          {/* Reminder Schedule */}
          <div className="space-y-4 mb-6">
            {reminderSchedule.map((reminder, index) => {
              const status = getReminderStatus(reminder.days);
              return (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-gray-700/50 border-gray-600' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        status === 'overdue' ? 'bg-red-100 text-red-600' :
                        status === 'due-soon' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {status === 'overdue' ? <AlertCircle className="h-4 w-4" /> :
                         status === 'due-soon' ? <Clock className="h-4 w-4" /> :
                         <CheckCircle className="h-4 w-4" />}
                      </div>
                      <div>
                        <h4 className="font-medium" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                          {reminder.name}
                        </h4>
                        <p className="text-sm" style={{color: isDarkMode ? '#9ca3af' : '#6b7280'}}>
                          {reminder.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        status === 'overdue' ? 'bg-red-100 text-red-800' :
                        status === 'due-soon' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {status === 'overdue' ? 'Overdue' :
                         status === 'due-soon' ? 'Due Soon' :
                         'Pending'}
                      </span>
                      {!reminderSettings.useSystemDefaults && (
                        <button
                          onClick={() => toggleReminder(index)}
                          className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                            reminderSettings.customRules[index]?.enabled
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : isDarkMode
                                ? 'border-gray-600'
                                : 'border-gray-300'
                          }`}
                        >
                          {reminderSettings.customRules[index]?.enabled && (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Preview Section */}
          <div className="mb-6">
            <h4 className="font-medium mb-3" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
              Preview Email Templates
            </h4>
            <div className="flex space-x-2 mb-4">
              {reminderSchedule.map((reminder) => (
                <button
                  key={reminder.type}
                  onClick={() => setPreviewType(reminder.type)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    previewType === reminder.type
                      ? 'bg-blue-600 text-white'
                      : isDarkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {reminder.name}
                </button>
              ))}
            </div>
            <div className={`p-4 rounded-lg border ${
              isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="text-sm" style={{color: isDarkMode ? '#9ca3af' : '#6b7280'}}>
                <strong>Subject:</strong> {previewType === 'friendly' ? 'Just a friendly reminder about invoice #' + invoice.invoiceNumber :
                  previewType === 'polite' ? 'Payment reminder for invoice #' + invoice.invoiceNumber :
                  previewType === 'firm' ? 'Overdue payment notice - Invoice #' + invoice.invoiceNumber :
                  'URGENT: Payment required - Invoice #' + invoice.invoiceNumber}
              </div>
              <div className="text-sm mt-2" style={{color: isDarkMode ? '#9ca3af' : '#6b7280'}}>
                <strong>Style:</strong> {previewType === 'friendly' ? 'Friendly and casual' :
                  previewType === 'polite' ? 'Professional and polite' :
                  previewType === 'firm' ? 'Direct and firm' :
                  'Urgent and demanding'}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Save Button */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={handleSave}
          disabled={isLoading}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            isLoading
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isLoading ? 'Saving...' : 'Save Reminder Settings'}
        </button>
      </div>
    </div>
  );
};

export default ReminderSettings;
