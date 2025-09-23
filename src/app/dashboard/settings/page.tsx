'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Save, Building2, Upload, CreditCard, 
  Loader2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import ToastContainer from '@/components/Toast';
import ModernSidebar from '@/components/ModernSidebar';
import { FreelancerSettings } from '@/types';

export default function SettingsPage() {
  const { user, loading, getAuthHeaders } = useAuth();
  const { toasts, removeToast, showSuccess, showError } = useToast();
  
  // State
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [settings, setSettings] = useState<FreelancerSettings>({
    businessName: '',
    businessEmail: '',
    businessPhone: '',
    address: '',
    website: '',
    logo: '',
    paypalEmail: '',
    cashappId: '',
    venmoId: '',
    googlePayUpi: '',
    applePayId: '',
    bankAccount: '',
    bankIfscSwift: '',
    bankIban: '',
    stripeAccount: '',
    paymentNotes: ''
  });

  // Dark mode toggle
  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      localStorage.setItem('darkMode', newMode.toString());
      return newMode;
    });
  }, []);

  // Create invoice handler
  const handleCreateInvoice = useCallback(() => {
    // This will be handled by navigation to the invoices page
    console.log('Create invoice clicked');
  }, []);

  // Load dark mode preference
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(savedDarkMode);
    
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Load settings data - more aggressive loading
  useEffect(() => {
    if (!hasLoadedData) {
      setHasLoadedData(true);
      // Load settings immediately without waiting for user/loading states
      loadSettings();
    }
  }, [hasLoadedData]);

  const loadSettings = async () => {
    try {
      setIsLoadingSettings(true);
      const headers = await getAuthHeaders();
      
      const response = await fetch('/api/settings', { headers });
      const data = await response.json();
      
      if (response.ok && data.settings) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      showError('Failed to load settings');
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const headers = await getAuthHeaders();
      
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers,
        body: JSON.stringify(settings)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showSuccess('Settings saved successfully!');
        // Also save to localStorage as backup
        if (typeof window !== 'undefined') {
          localStorage.setItem('freelancerSettings', JSON.stringify(settings));
        }
      } else {
        throw new Error(data.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showError('Error saving settings: ' + (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSettings(prev => ({ ...prev, logo: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setSettings(prev => ({ ...prev, logo: '' }));
  };

  if (false && (loading || isLoadingSettings)) {
    return (
      <div className={`min-h-screen transition-colors duration-200 ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (false && !user) {
    return (
      <div className={`min-h-screen transition-colors duration-200 ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Please log in to access settings</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
      <div className="flex h-screen">
        <ModernSidebar 
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
          onCreateInvoice={handleCreateInvoice}
        />
        
        <main className="flex-1 lg:ml-0 overflow-y-auto scroll-smooth custom-scrollbar">
          <div className="pt-16 lg:pt-4 p-4 sm:p-6 lg:p-8">
            {/* Settings Section */}
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-heading text-xl sm:text-2xl font-semibold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                    Settings
                  </h2>
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span>{saving ? 'Saving...' : 'Save Settings'}</span>
                </button>
              </div>

              {/* Business Information */}
              <div className={`rounded-lg p-4 sm:p-6 ${isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white/70 border border-gray-200'} backdrop-blur-sm`}>
                <div className="flex items-center space-x-3 mb-6">
                  <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                    <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                    Business Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                      Business Name *
                    </label>
                    <input
                      type="text"
                      value={settings.businessName}
                      onChange={(e) => setSettings(prev => ({ ...prev, businessName: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                      placeholder="Your Business Name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                      Business Email *
                    </label>
                    <input
                      type="email"
                      value={settings.businessEmail}
                      onChange={(e) => setSettings(prev => ({ ...prev, businessEmail: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                      placeholder="business@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={settings.businessPhone}
                      onChange={(e) => setSettings(prev => ({ ...prev, businessPhone: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                      Website
                    </label>
                    <input
                      type="url"
                      value={settings.website}
                      onChange={(e) => setSettings(prev => ({ ...prev, website: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                      placeholder="https://yourwebsite.com"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                      Business Address
                    </label>
                    <textarea
                      value={settings.address}
                      onChange={(e) => setSettings(prev => ({ ...prev, address: e.target.value }))}
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors resize-none ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                      placeholder="123 Business St, City, State 12345"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                      Business Logo
                    </label>
                    
                    {/* Logo Preview */}
                    {settings.logo && (
                      <div className="mb-4 p-4 border rounded-lg" style={{borderColor: isDarkMode ? '#374151' : '#e5e7eb'}}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                            Current Logo
                          </span>
                          <button
                            type="button"
                            onClick={handleRemoveLogo}
                            className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="flex items-center space-x-3">
                          <img
                            src={settings.logo}
                            alt="Logo preview"
                            className="w-16 h-16 object-contain border rounded-lg"
                            style={{borderColor: isDarkMode ? '#374151' : '#e5e7eb'}}
                          />
                          <div>
                            <p className="text-sm font-medium" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                              Logo uploaded successfully
                            </p>
                            <p className="text-xs" style={{color: isDarkMode ? '#9ca3af' : '#6b7280'}}>
                              This will appear on your invoices
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Upload Button */}
                    <div className="flex items-center space-x-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label
                        htmlFor="logo-upload"
                        className="cursor-pointer"
                      >
                        <div className={`flex items-center space-x-2 px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                          <Upload className="h-4 w-4" />
                          <span className="text-sm">{settings.logo ? 'Change Logo' : 'Upload Logo'}</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className={`rounded-lg p-4 sm:p-6 ${isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white/70 border border-gray-200'} backdrop-blur-sm`}>
                <div className="flex items-center space-x-3 mb-6">
                  <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-green-500/20' : 'bg-green-100'}`}>
                    <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                    Payment Methods
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                      PayPal Email
                    </label>
                    <input
                      type="email"
                      value={settings.paypalEmail}
                      onChange={(e) => setSettings(prev => ({ ...prev, paypalEmail: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                      placeholder="paypal@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                      Cash App ID
                    </label>
                    <input
                      type="text"
                      value={settings.cashappId}
                      onChange={(e) => setSettings(prev => ({ ...prev, cashappId: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                      placeholder="$yourcashappid"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                      Venmo ID
                    </label>
                    <input
                      type="text"
                      value={settings.venmoId}
                      onChange={(e) => setSettings(prev => ({ ...prev, venmoId: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                      placeholder="@yourvenmoid"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                      Google Pay UPI
                    </label>
                    <input
                      type="text"
                      value={settings.googlePayUpi}
                      onChange={(e) => setSettings(prev => ({ ...prev, googlePayUpi: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                      placeholder="yourname@paytm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                      Apple Pay ID
                    </label>
                    <input
                      type="text"
                      value={settings.applePayId}
                      onChange={(e) => setSettings(prev => ({ ...prev, applePayId: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                      placeholder="your-apple-pay-id"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                      Stripe Account
                    </label>
                    <input
                      type="text"
                      value={settings.stripeAccount}
                      onChange={(e) => setSettings(prev => ({ ...prev, stripeAccount: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                      placeholder="acct_xxxxxxxxx"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                      Bank Account
                    </label>
                    <input
                      type="text"
                      value={settings.bankAccount}
                      onChange={(e) => setSettings(prev => ({ ...prev, bankAccount: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                      placeholder="Account Number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                      Bank IFSC/SWIFT
                    </label>
                    <input
                      type="text"
                      value={settings.bankIfscSwift}
                      onChange={(e) => setSettings(prev => ({ ...prev, bankIfscSwift: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                      placeholder="IFSC/SWIFT Code"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                      Bank IBAN
                    </label>
                    <input
                      type="text"
                      value={settings.bankIban}
                      onChange={(e) => setSettings(prev => ({ ...prev, bankIban: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                      placeholder="IBAN Number"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                      Payment Notes
                    </label>
                    <textarea
                      value={settings.paymentNotes}
                      onChange={(e) => setSettings(prev => ({ ...prev, paymentNotes: e.target.value }))}
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors resize-none ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                      placeholder="Additional payment instructions or notes..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      
      <ToastContainer
        toasts={toasts}
        onRemove={removeToast}
      />
    </div>
  );
}
