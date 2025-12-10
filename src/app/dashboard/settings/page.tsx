'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { 
  Save, Building2, Upload, CreditCard, 
  Loader2, Trash2, Sparkles, FilePlus
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useSettings } from '@/contexts/SettingsContext';
import ToastContainer from '@/components/Toast';
import ModernSidebar from '@/components/ModernSidebar';
import LazyLogo from '@/components/LazyLogo';
import ConfirmationModal from '@/components/ConfirmationModal';
import { FreelancerSettings, Client } from '@/types';
import { optimizeLogo, validateLogoFile } from '@/lib/logo-optimizer';
import dynamic from 'next/dynamic';

// Lazy load heavy components
const QuickInvoiceModal = dynamic(() => import('@/components/QuickInvoiceModal'), {
  loading: () => <div className="flex items-center justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
});

const FastInvoiceModal = dynamic(() => import('@/components/FastInvoiceModal'), {
  loading: () => <div className="flex items-center justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
});

// Memoized components for better performance
const BusinessInfoSection = memo(({ settings, updateSettings, isLoadingSettings }: {
  settings: any;
  updateSettings: (settings: any) => void;
  isLoadingSettings: boolean;
}) => {
  const handleInputChange = useCallback((field: string, value: string) => {
    updateSettings({ ...settings, [field]: value });
  }, [settings, updateSettings]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-3" style={{color: '#374151'}}>
            Business Name
          </label>
          <input
            type="text"
            value={settings.businessName}
            onChange={(e) => handleInputChange('businessName', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors border-gray-300 bg-white text-black"
            placeholder="Your Business Name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-3" style={{color: '#374151'}}>
            Business Email
          </label>
          <input
            type="email"
            value={settings.businessEmail}
            onChange={(e) => handleInputChange('businessEmail', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors border-gray-300 bg-white text-black"
            placeholder="business@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-3" style={{color: '#374151'}}>
            Business Phone
          </label>
          <input
            type="tel"
            value={settings.businessPhone}
            onChange={(e) => handleInputChange('businessPhone', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors border-gray-300 bg-white text-black"
            placeholder="+1 (555) 123-4567"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-3" style={{color: '#374151'}}>
            Website
          </label>
          <input
            type="url"
            value={settings.website}
            onChange={(e) => handleInputChange('website', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors border-gray-300 bg-white text-black"
            placeholder="https://yourwebsite.com"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-3" style={{color: '#374151'}}>
          Business Address
        </label>
        <textarea
          value={settings.address}
          onChange={(e) => handleInputChange('address', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors resize-none border-gray-300 bg-white text-black"
          placeholder="123 Business St, City, State 12345"
        />
        <p className="mt-1.5 text-xs text-gray-500">
          Don't include email or phone number here - we have dedicated fields for those below.
        </p>
      </div>
    </div>
  );
});

BusinessInfoSection.displayName = 'BusinessInfoSection';

export default function SettingsPage() {
  const { user, loading, getAuthHeaders } = useAuth();
  const { toasts, removeToast, showSuccess, showError } = useToast();
  const { settings, isLoadingSettings, error, updateSettings, refreshSettings } = useSettings();
  
  // Local state for UI
  const [saving, setSaving] = useState(false);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [showFastInvoice, setShowFastInvoice] = useState(false);
  const [showInvoiceTypeSelection, setShowInvoiceTypeSelection] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isRemovingLogo, setIsRemovingLogo] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'danger' as 'danger' | 'warning' | 'info',
    onConfirm: () => {},
    isLoading: false
  });

  // Create invoice handler
  const handleCreateInvoice = useCallback(() => {
    // Show the invoice type selection modal
    setShowInvoiceTypeSelection(true);
  }, []);

  // Handle invoice type selection
  const handleSelectFastInvoice = useCallback(() => {
    setShowInvoiceTypeSelection(false);
    setShowFastInvoice(true);
  }, []);

  const handleSelectDetailedInvoice = useCallback(() => {
    setShowInvoiceTypeSelection(false);
    setShowCreateInvoice(true);
  }, []);

  // Load dark mode preference
  // Dark mode useEffect (removed)

  // Load settings data
  useEffect(() => {
    if (user && !loading && !hasLoadedData) {
      setHasLoadedData(true);
      loadClients();
    }
  }, [user, loading, hasLoadedData]);

  const loadClients = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/clients', { headers, cache: 'no-store' });
      const data = await response.json();
      setClients(data.clients || []);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  // Settings loading is now handled by SettingsContext
  useEffect(() => {
    if (user && !loading) {
      setHasLoadedData(true);
    }
  }, [user, loading]);

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
        // Update global settings context
        updateSettings(settings);
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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateLogoFile(file);
    if (!validation.valid) {
      showError('Invalid File', validation.error || 'Please select a valid image file.');
      return;
    }

    setIsUploadingLogo(true);

    try {
      // Optimize the logo on the frontend (browser environment)
      const optimizedLogo = await optimizeLogo(file, 200, 200, 0.8);
      
      // Convert dataUrl back to File for upload
      const dataResponse = await fetch(optimizedLogo.dataUrl);
      const blob = await dataResponse.blob();
      const optimizedFile = new File([blob], file.name, { type: blob.type });
      
      // Create form data for file upload
      const formData = new FormData();
      formData.append('logo', optimizedFile);

      // Get auth headers (but exclude Content-Type for FormData)
      const authHeaders = await getAuthHeaders();
      const { 'Content-Type': _, ...headersWithoutContentType } = authHeaders;
      
      // Upload file to server
      const response = await fetch('/api/upload-logo', {
        method: 'POST',
        headers: headersWithoutContentType, // Don't set Content-Type, let browser set it for FormData
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        // Update settings with the new logo URL
        updateSettings({ ...settings, logo: data.logoUrl });
        
        // Show success message
        const fileSize = (file.size / 1024).toFixed(1);
        showSuccess(
          'Logo Uploaded Successfully', 
          `Logo uploaded and optimized! File size: ${fileSize}KB. Your settings have been saved automatically.`
        );
      } else {
        throw new Error(data.error || 'Failed to upload logo');
      }
    } catch (error) {
      console.error('Logo upload error:', error);
      showError('Upload Failed', 'Failed to upload the logo file. Please try again.');
    } finally {
      setIsUploadingLogo(false);
      // Reset the input so the same file can be selected again
      e.target.value = '';
    }
  };

  const handleRemoveLogo = () => {
    setConfirmationModal({
      isOpen: true,
      title: 'Remove Logo',
      message: 'Are you sure you want to remove your business logo? This action cannot be undone.',
      type: 'warning',
      onConfirm: async () => {
        setConfirmationModal(prev => ({ ...prev, isOpen: false, isLoading: true }));
        setIsRemovingLogo(true);
        
        try {
          // Get auth headers
          const headers = await getAuthHeaders();
          
          // Call the delete API
          const response = await fetch('/api/upload-logo', {
            method: 'DELETE',
            headers
          });

          const data = await response.json();

          if (response.ok) {
            // Update settings to remove logo
            updateSettings({ ...settings, logo: '' });
            showSuccess('Logo Removed', 'Logo has been removed successfully.');
            
            // Clear any file input values
            const fileInputs = document.querySelectorAll('input[type="file"]');
            fileInputs.forEach(input => {
              if (input.id === 'logo-upload') {
                (input as HTMLInputElement).value = '';
              }
            });
          } else {
            throw new Error(data.error || 'Failed to remove logo');
          }
        } catch (error) {
          console.error('Logo removal error:', error);
          showError('Removal Failed', 'Failed to remove the logo. Please try again.');
        } finally {
          setConfirmationModal(prev => ({ ...prev, isLoading: false }));
          setIsRemovingLogo(false);
        }
      },
      isLoading: false
    });
  };



  // Only show loading spinner if user is not authenticated yet
  if (loading && !user) {
    return (
      <div className="min-h-screen transition-colors duration-200 bg-white">
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
    <div className="min-h-screen transition-colors duration-200 bg-white">
      <div className="flex h-screen">
        <ModernSidebar 
          onCreateInvoice={handleCreateInvoice}
        />
        
        <main className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar">
          <div className="pt-16 lg:pt-4 p-4 sm:p-6 lg:p-8">
            {/* Settings Section */}
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-heading text-xl sm:text-2xl font-semibold" style={{color: '#1f2937'}}>
                    Settings
                  </h2>
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
              {isLoadingSettings ? (
                <div className={`rounded-lg p-4 sm:p-6 bg-white/70 border border-gray-200 backdrop-blur-sm`}>
                  <div className="animate-pulse">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-9 h-9 bg-gray-300 rounded-lg"></div>
                      <div className="h-6 bg-gray-300 rounded w-48"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i}>
                          <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
                          <div className="h-10 bg-gray-300 rounded w-full"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`rounded-lg p-4 sm:p-6 bg-white/70 border border-gray-200 backdrop-blur-sm`}>
                <div className="flex items-center space-x-3 mb-6">
                  <div className={`p-2 rounded-lg bg-blue-100`}>
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold" style={{color: '#1f2937'}}>
                    Business Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{color: '#374151'}}>
                      Business Name *
                    </label>
                    <input
                      type="text"
                      value={settings.businessName}
                      onChange={(e) => updateSettings({ ...settings, businessName: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors border-gray-300 bg-white text-black`}
                      placeholder="Your Business Name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{color: '#374151'}}>
                      Business Email *
                    </label>
                    <input
                      type="email"
                      value={settings.businessEmail}
                      onChange={(e) => updateSettings({ ...settings, businessEmail: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors border-gray-300 bg-white text-black`}
                      placeholder="business@example.com"
                    />
                  </div>


                  <div>
                    <label className="block text-sm font-medium mb-2" style={{color: '#374151'}}>
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={settings.businessPhone}
                      onChange={(e) => updateSettings({ ...settings, businessPhone: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors border-gray-300 bg-white text-black`}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{color: '#374151'}}>
                      Website
                    </label>
                    <input
                      type="url"
                      value={settings.website}
                      onChange={(e) => updateSettings({ ...settings, website: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors border-gray-300 bg-white text-black`}
                      placeholder="https://yourwebsite.com"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2" style={{color: '#374151'}}>
                      Business Address
                    </label>
                    <textarea
                      value={settings.address}
                      onChange={(e) => updateSettings({ ...settings, address: e.target.value })}
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors resize-none border-gray-300 bg-white text-black`}
                      placeholder="123 Business St, City, State 12345"
                    />
                    <p className="mt-1.5 text-xs text-gray-500">
                      Don't include email or phone number here - we have dedicated fields for those below.
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-3" style={{color: '#374151'}}>
                      Business Logo
                    </label>
                    
                    {/* Minimal Logo Section */}
                    <div className="space-y-4">
                      {settings.logo && settings.logo.trim() !== '' ? (
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-white border border-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                              <LazyLogo 
                                src={settings.logo} 
                                alt="Logo" 
                                className="w-full h-full object-contain"
                                width={48}
                                height={48}
                              />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Current logo</p>
                              <p className="text-xs text-gray-500">Appears on invoices</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleLogoUpload}
                              className="hidden"
                              id="logo-upload"
                            />
                            <label
                              htmlFor="logo-upload"
                              className={`cursor-pointer ${isUploadingLogo ? 'pointer-events-none opacity-50' : ''}`}
                            >
                              <div className="w-9 h-9 bg-indigo-100 hover:bg-indigo-200 rounded-lg flex items-center justify-center transition-colors">
                                {isUploadingLogo ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                                ) : (
                                  <Upload className="h-4 w-4 text-indigo-600" />
                                )}
                              </div>
                            </label>
                            <button
                              type="button"
                              onClick={handleRemoveLogo}
                              disabled={isRemovingLogo}
                              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                                isRemovingLogo 
                                  ? 'opacity-50 cursor-not-allowed bg-gray-100'
                                  : 'bg-red-100 hover:bg-red-200 cursor-pointer'
                              }`}
                            >
                              {isRemovingLogo ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                              ) : (
                                <Trash2 className="h-4 w-4 text-red-600" />
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="border border-dashed border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
                          <div className="flex items-center justify-center space-x-4">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Upload className="h-5 w-5 text-gray-400" />
                            </div>
                            <div className="flex-1">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleLogoUpload}
                                className="hidden"
                                id="logo-upload"
                              />
                              <label
                                htmlFor="logo-upload"
                                className={`cursor-pointer ${isUploadingLogo ? 'pointer-events-none opacity-50' : ''}`}
                              >
                                <span className="text-sm text-gray-600 hover:text-gray-800">
                                  {isUploadingLogo ? 'Uploading...' : 'Click to upload logo'}
                                </span>
                              </label>
                              <p className="text-xs text-gray-500 mt-1">PNG, JPG, or GIF up to 5MB</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              )}

              {/* Payment Methods */}
              {isLoadingSettings ? (
                <div className={`rounded-lg p-4 sm:p-6 bg-white/70 border border-gray-200 backdrop-blur-sm`}>
                  <div className="animate-pulse">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-9 h-9 bg-gray-300 rounded-lg"></div>
                      <div className="h-6 bg-gray-300 rounded w-40"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                        <div key={i}>
                          <div className="h-4 bg-gray-300 rounded w-32 mb-2"></div>
                          <div className="h-10 bg-gray-300 rounded w-full"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
              <div className={`rounded-lg p-4 sm:p-6 bg-white/70 border border-gray-200 backdrop-blur-sm`}>
                <div className="flex items-center space-x-3 mb-6">
                  <div className={`p-2 rounded-lg bg-green-100`}>
                    <CreditCard className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold" style={{color: '#1f2937'}}>
                    Payment Methods
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{color: '#374151'}}>
                      PayPal Email
                    </label>
                    <input
                      type="email"
                      value={settings.paypalEmail}
                      onChange={(e) => updateSettings({ ...settings, paypalEmail: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors border-gray-300 bg-white text-black`}
                      placeholder="paypal@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{color: '#374151'}}>
                      Cash App ID
                    </label>
                    <input
                      type="text"
                      value={settings.cashappId}
                      onChange={(e) => updateSettings({ ...settings, cashappId: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors border-gray-300 bg-white text-black`}
                      placeholder="$yourcashappid"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{color: '#374151'}}>
                      Venmo ID
                    </label>
                    <input
                      type="text"
                      value={settings.venmoId}
                      onChange={(e) => updateSettings({ ...settings, venmoId: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors border-gray-300 bg-white text-black`}
                      placeholder="@yourvenmoid"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{color: '#374151'}}>
                      Google Pay UPI
                    </label>
                    <input
                      type="text"
                      value={settings.googlePayUpi}
                      onChange={(e) => updateSettings({ ...settings, googlePayUpi: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors border-gray-300 bg-white text-black`}
                      placeholder="yourname@paytm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{color: '#374151'}}>
                      Apple Pay ID
                    </label>
                    <input
                      type="text"
                      value={settings.applePayId}
                      onChange={(e) => updateSettings({ ...settings, applePayId: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors border-gray-300 bg-white text-black`}
                      placeholder="your-apple-pay-id"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{color: '#374151'}}>
                      Stripe Account
                    </label>
                    <input
                      type="text"
                      value={settings.stripeAccount}
                      onChange={(e) => updateSettings({ ...settings, stripeAccount: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors border-gray-300 bg-white text-black`}
                      placeholder="acct_xxxxxxxxx"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{color: '#374151'}}>
                      Bank Account
                    </label>
                    <input
                      type="text"
                      value={settings.bankAccount}
                      onChange={(e) => updateSettings({ ...settings, bankAccount: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors border-gray-300 bg-white text-black`}
                      placeholder="Account Number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{color: '#374151'}}>
                      Bank IFSC/SWIFT
                    </label>
                    <input
                      type="text"
                      value={settings.bankIfscSwift}
                      onChange={(e) => updateSettings({ ...settings, bankIfscSwift: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors border-gray-300 bg-white text-black`}
                      placeholder="IFSC/SWIFT Code"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{color: '#374151'}}>
                      Bank IBAN
                    </label>
                    <input
                      type="text"
                      value={settings.bankIban}
                      onChange={(e) => updateSettings({ ...settings, bankIban: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors border-gray-300 bg-white text-black`}
                      placeholder="IBAN Number"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2" style={{color: '#374151'}}>
                      Payment Notes
                    </label>
                    <textarea
                      value={settings.paymentNotes}
                      onChange={(e) => updateSettings({ ...settings, paymentNotes: e.target.value })}
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors resize-none border-gray-300 bg-white text-black`}
                      placeholder="Additional payment instructions or notes..."
                    />
                  </div>
                </div>
              </div>
              )}

            </div>
          </div>
        </main>
      </div>
      
      <ToastContainer
        toasts={toasts}
        onRemove={removeToast}
      />

      {/* Invoice Type Selection Modal */}
      {showInvoiceTypeSelection && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-md w-full p-6">
            <div className="text-center mb-6">
              <h3 className="font-heading text-xl font-semibold mb-2" style={{color: '#1f2937'}}>
                Choose Invoice Type
              </h3>
              <p className="text-gray-600 text-sm">
                Select the type of invoice you want to create
              </p>
            </div>
                  
            <div className="space-y-3">
              {/* Fast Invoice Option */}
              <button
                onClick={handleSelectFastInvoice}
                className="w-full p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200 group cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="text-left flex-1">
                    <h4 className="font-medium text-gray-900">Fast Invoice</h4>
                    <p className="text-sm text-gray-500">Quick invoice with minimal details</p>
                  </div>
                  <div className="text-indigo-600 group-hover:text-indigo-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>

              {/* Detailed Invoice Option */}
              <button
                onClick={handleSelectDetailedInvoice}
                className="w-full p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200 group cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                    <FilePlus className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="text-left flex-1">
                    <h4 className="font-medium text-gray-900">Detailed Invoice</h4>
                    <p className="text-sm text-gray-500">Full customization and advanced features</p>
                  </div>
                  <div className="text-indigo-600 group-hover:text-indigo-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            </div>

            <button
              onClick={() => setShowInvoiceTypeSelection(false)}
              className="mt-6 w-full px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Fast Invoice Modal */}
      {showFastInvoice && (
        <FastInvoiceModal
          isOpen={showFastInvoice}
          onClose={() => setShowFastInvoice(false)}
          user={user!}
          onSuccess={() => {
            setShowFastInvoice(false);
            showSuccess('Invoice created successfully');
          }}
          getAuthHeaders={getAuthHeaders}
          showSuccess={showSuccess}
          showError={showError}
          showWarning={showError}
        />
      )}

      {/* Create Invoice Modal */}
      {showCreateInvoice && (
        <QuickInvoiceModal
          isOpen={showCreateInvoice}
          onClose={() => setShowCreateInvoice(false)}
          getAuthHeaders={getAuthHeaders}
          clients={clients}
          onSuccess={() => {
            setShowCreateInvoice(false);
            showSuccess('Invoice created successfully');
          }}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() => setConfirmationModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmationModal.onConfirm}
        title={confirmationModal.title}
        message={confirmationModal.message}
        type={confirmationModal.type}
        isLoading={confirmationModal.isLoading}
        confirmText="Remove Logo"
        cancelText="Cancel"
      />
    </div>
  );
}

