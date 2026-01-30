'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Loader2, Building2, Mail, Phone, MapPin, Globe, Upload, X, Image as ImageIcon, CreditCard, Info, AlertCircle } from 'lucide-react';
import { optimizeLogo, validateLogoFile } from '@/lib/logo-optimizer';
import { CURRENCIES } from '@/lib/currency';
import CustomDropdown from '@/components/CustomDropdown';

export default function OnboardingPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [formData, setFormData] = useState({
    // Business Information
    businessName: '',
    businessEmail: '',
    businessPhone: '',
    businessAddress: '',
    taxId: '',
    baseCurrency: 'USD',
    // Tax Registration
    isTaxRegistered: false,
    // Payment Methods
    paypalEmail: '',
    cashappId: '',
    venmoId: '',
    googlePayUpi: '',
    applePayId: '',
    stripeAccount: '',
    bankAccount: '',
    bankIfscSwift: '',
    bankIban: '',
    paymentNotes: '',
  });

  const router = useRouter();
  const totalSteps = 4; // Business Info, Tax Registration, Contact Details, Payment Methods

  useEffect(() => {
    // Check if user is authenticated and hasn't completed onboarding
    const checkAuthAndOnboarding = async () => {
      setCheckingAuth(true);
      
      // Small delay to ensure session is fully established
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/auth');
        return;
      }

      // Check if onboarding is already completed
      try {
        const response = await fetch('/api/settings', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          // Check both businessName and business_name for compatibility
          const businessName = data.settings?.businessName || data.settings?.business_name;
          if (businessName && businessName.trim() !== '') {
            // Already completed onboarding, redirect to dashboard immediately
            router.replace('/dashboard');
            return;
          }
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      } finally {
        setCheckingAuth(false);
      }
    };
    checkAuthAndOnboarding();
  }, [router]);

  // Show loading screen while checking - prevents flash
  if (checkingAuth) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateLogoFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Please select a valid image file.');
      return;
    }

    setIsUploadingLogo(true);
    setError('');

    try {
      // Optimize the logo on the frontend
      const optimizedLogo = await optimizeLogo(file, 200, 200, 0.8);
      
      // Show preview
      setLogoPreview(optimizedLogo.dataUrl);
      
      // Convert dataUrl back to File for upload
      const dataResponse = await fetch(optimizedLogo.dataUrl);
      const blob = await dataResponse.blob();
      const optimizedFile = new File([blob], file.name, { type: blob.type });
      
      // Create form data for file upload
      const formDataUpload = new FormData();
      formDataUpload.append('logo', optimizedFile);

      // Get auth headers
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Upload file to server
      const response = await fetch('/api/upload-logo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formDataUpload
      });

      const data = await response.json();

      if (response.ok) {
        setLogoUrl(data.logoUrl);
      } else {
        throw new Error(data.error || 'Failed to upload logo');
      }
    } catch (error: any) {
      console.error('Logo upload error:', error);
      setError(error.message || 'Failed to upload logo. Please try again.');
      setLogoPreview(null);
    } finally {
      setIsUploadingLogo(false);
      // Reset the input so the same file can be selected again
      e.target.value = '';
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    setLogoUrl('');
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.businessName.trim()) {
        setError('Business name is required');
        return;
      }
      setStep(2);
      setError('');
    } else if (step === 2) {
      // Tax registration step - validate taxId if isTaxRegistered is true
      if (formData.isTaxRegistered && !formData.taxId.trim()) {
        setError('Tax ID / GST Number is required when you are tax-registered');
        return;
      }
      setStep(3);
      setError('');
    } else if (step === 3) {
      setStep(4);
      setError('');
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Save all data to user_settings
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          businessName: formData.businessName,
          businessEmail: formData.businessEmail || session.user.email || '',
          businessPhone: formData.businessPhone,
          address: formData.businessAddress,
          taxId: formData.taxId,
          isTaxRegistered: formData.isTaxRegistered,
          logo: logoUrl || '',
          baseCurrency: formData.baseCurrency,
          paypalEmail: formData.paypalEmail,
          cashappId: formData.cashappId,
          venmoId: formData.venmoId,
          googlePayUpi: formData.googlePayUpi,
          applePayId: formData.applePayId,
          stripeAccount: formData.stripeAccount,
          bankAccount: formData.bankAccount,
          bankIfscSwift: formData.bankIfscSwift,
          bankIban: formData.bankIban,
          paymentNotes: formData.paymentNotes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save settings');
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error: any) {
      setError(error.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return 'Business Information';
      case 2: return 'Tax Registration';
      case 3: return 'Contact Details';
      case 4: return 'Payment Methods';
      default: return 'Setup';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 1: return 'Let\'s start with your basic business information. This will appear on all your invoices.';
      case 2: return 'Tell us if you are registered to charge tax. This helps us configure your invoice settings correctly.';
      case 3: return 'Add your contact details so clients can reach you easily.';
      case 4: return 'Set up payment methods to get paid faster. You can add multiple options for your clients.';
      default: return '';
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Header - Clean and Responsive */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4 sm:py-5">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 font-medium hidden sm:inline">Step {step} of {totalSteps}</span>
              <div className="w-24 h-1.5 bg-gray-200 overflow-hidden">
                <div
                  className="bg-indigo-600 h-1.5 transition-all duration-300"
                  style={{ width: `${(step / totalSteps) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area - Scrollable */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {/* Welcome Message - Matching Auth Page */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="text-sm text-indigo-600 font-medium mb-3">Welcome to FlowInvoicer</div>
          <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-semibold text-gray-900 mb-4 tracking-tight">
            {getStepTitle()}
          </h1>
          <p className="text-base text-gray-600 leading-relaxed">
            {getStepDescription()}
          </p>
        </div>

        {/* Disclaimer Banner */}
        <div className="mb-6 bg-gray-50 border-l-4 border-indigo-600 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500 mb-1.5">
            IMPORTANT INFORMATION
          </p>
          <p className="text-sm font-medium text-gray-900">
            All information you provide here will be saved to your account settings and can be updated anytime from the Settings page. 
            {step === 4 && ' Payment methods are optional - add as many as you accept. This information will appear on your invoices.'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 text-sm mb-6 flex items-start space-x-2 border-l-4 border-red-600">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={step < totalSteps ? (e) => { e.preventDefault(); handleNext(); } : handleSubmit} className="space-y-8">
              {/* Step 1: Business Information */}
              {step === 1 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Logo Upload - Full Width */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Logo
                      <span className="ml-2 text-xs text-gray-500 font-normal">(Optional)</span>
                    </label>
                    <div className="flex items-center gap-3">
                      {logoPreview ? (
                        <div className="relative">
                          <img
                            src={logoPreview}
                            alt="Logo preview"
                            className="w-16 h-16 object-contain bg-gray-50 border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={handleRemoveLogo}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white flex items-center justify-center hover:bg-red-600 active:bg-red-700 active:scale-90 transition-all cursor-pointer shadow-sm touch-manipulation"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-16 h-16 flex items-center justify-center bg-gray-50 border border-gray-200">
                          <ImageIcon className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <label
                          htmlFor="logo-upload"
                          className={`flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 cursor-pointer hover:bg-gray-200 active:bg-gray-300 active:scale-95 transition-all text-sm font-medium touch-manipulation ${isUploadingLogo ? 'opacity-50 cursor-not-allowed active:scale-100' : ''}`}
                        >
                          {isUploadingLogo ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                              <span className="text-sm text-gray-700">Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-700">
                                {logoPreview ? 'Change' : 'Upload Logo'}
                              </span>
                            </>
                          )}
                        </label>
                        <input
                          type="file"
                          id="logo-upload"
                          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                          onChange={handleLogoUpload}
                          disabled={isUploadingLogo}
                          className="hidden"
                        />
                        <p className="mt-2 text-xs text-gray-500">PNG, JPG, GIF or WebP (max 5MB)</p>
                      </div>
                    </div>
                  </div>

                  {/* Business Name */}
                  <div>
                    <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-2">
                      Business Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Building2 className="w-5 h-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="businessName"
                        name="businessName"
                        value={formData.businessName}
                        onChange={handleInputChange}
                        placeholder="Your Business Name"
                        className="w-full pl-12 pr-4 py-4 text-base bg-gray-50 border border-gray-200 focus:ring-1 focus:ring-indigo-400 focus:bg-white outline-none transition-all active:bg-gray-100 touch-manipulation"
                        required
                      />
                    </div>
                    <p className="mt-2 text-xs text-gray-500">This will appear on all your invoices</p>
                  </div>

                  {/* Business Email */}
                  <div>
                    <label htmlFor="businessEmail" className="block text-sm font-medium text-gray-700 mb-2">
                      Business Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="w-5 h-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        id="businessEmail"
                        name="businessEmail"
                        value={formData.businessEmail}
                        onChange={handleInputChange}
                        placeholder="business@example.com"
                        className="w-full pl-12 pr-4 py-4 text-base bg-gray-50 border border-gray-200 focus:ring-1 focus:ring-indigo-400 focus:bg-white outline-none transition-all active:bg-gray-100 touch-manipulation"
                      />
                    </div>
                    <p className="mt-2 text-xs text-gray-500">We'll use your account email if left empty</p>
                  </div>

                  {/* Base Currency */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Base Currency <span className="text-red-500">*</span>
                    </label>
                    <CustomDropdown
                      value={formData.baseCurrency}
                      onChange={(value) => setFormData(prev => ({ ...prev, baseCurrency: value }))}
                      options={CURRENCIES.map((currency) => ({
                        value: currency.code,
                        label: `${currency.code} - ${currency.name} (${currency.symbol})`
                      }))}
                      placeholder="Select base currency"
                      isDarkMode={false}
                      searchable={true}
                      className="w-full"
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      All dashboard metrics will be converted to this currency. You can change this after creating your first invoice.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 2: Tax Registration */}
              {step === 2 && (
                <>
                  <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-6">
                    <div className="flex items-start">
                      <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-blue-900 mb-1">
                          Tax Registration Information
                        </p>
                        <p className="text-xs text-blue-700">
                          This helps us configure your invoice settings correctly. If you're not registered to charge tax, you can use our Fast Invoice feature.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      Are you registered to charge tax (VAT / GST / Sales Tax)?
                      <span className="ml-2 text-red-500">*</span>
                    </label>
                    <div className="space-y-3">
                      <label className="flex items-center p-4 border-2 cursor-pointer transition-all hover:bg-gray-50"
                        style={{
                          borderColor: formData.isTaxRegistered ? '#4F46E5' : '#E5E7EB',
                          backgroundColor: formData.isTaxRegistered ? '#EEF2FF' : 'transparent'
                        }}>
                        <input
                          type="radio"
                          name="isTaxRegistered"
                          checked={formData.isTaxRegistered === true}
                          onChange={() => setFormData(prev => ({ ...prev, isTaxRegistered: true }))}
                          className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <span className="ml-3 text-sm font-medium text-gray-900">Yes, I am registered to charge tax</span>
                      </label>
                      <label className="flex items-center p-4 border-2 cursor-pointer transition-all hover:bg-gray-50"
                        style={{
                          borderColor: formData.isTaxRegistered === false ? '#4F46E5' : '#E5E7EB',
                          backgroundColor: formData.isTaxRegistered === false ? '#EEF2FF' : 'transparent'
                        }}>
                        <input
                          type="radio"
                          name="isTaxRegistered"
                          checked={formData.isTaxRegistered === false}
                          onChange={() => setFormData(prev => ({ ...prev, isTaxRegistered: false, taxId: '' }))}
                          className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <span className="ml-3 text-sm font-medium text-gray-900">No, I am not registered to charge tax</span>
                      </label>
                    </div>
                  </div>

                  {formData.isTaxRegistered && (
                    <div className="mt-6">
                      <label htmlFor="taxId" className="block text-sm font-medium text-gray-700 mb-2">
                        Tax ID / GST Number
                        <span className="ml-2 text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Building2 className="w-5 h-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          id="taxId"
                          name="taxId"
                          value={formData.taxId}
                          onChange={handleInputChange}
                          placeholder="Enter your Tax ID or GST Number"
                          required={formData.isTaxRegistered}
                          className="w-full pl-12 pr-4 py-4 text-base bg-gray-50 border border-gray-200 focus:ring-1 focus:ring-indigo-400 focus:bg-white outline-none transition-all active:bg-gray-100 touch-manipulation"
                        />
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        This will appear on your invoices when required by law.
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Step 3: Contact Details */}
              {step === 3 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="businessPhone" className="block text-sm font-medium text-gray-700 mb-2">
                      Business Phone
                      <span className="ml-2 text-xs text-gray-500 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Phone className="w-5 h-5 text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        id="businessPhone"
                        name="businessPhone"
                        value={formData.businessPhone}
                        onChange={handleInputChange}
                        placeholder="+1 (555) 123-4567"
                        className="w-full pl-12 pr-4 py-4 text-base bg-gray-50 border border-gray-200 focus:ring-1 focus:ring-indigo-400 focus:bg-white outline-none transition-all active:bg-gray-100 touch-manipulation"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="businessAddress" className="block text-sm font-medium text-gray-700 mb-2">
                      Business Address
                      <span className="ml-2 text-xs text-gray-500 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute top-4 left-4 flex items-start pointer-events-none">
                        <MapPin className="w-5 h-5 text-gray-400" />
                      </div>
                      <textarea
                        id="businessAddress"
                        name="businessAddress"
                        value={formData.businessAddress}
                        onChange={handleInputChange}
                        placeholder="123 Business St, City, State 12345"
                        rows={4}
                        className="w-full pl-12 pr-4 py-4 text-base bg-gray-50 border border-gray-200 focus:ring-1 focus:ring-indigo-400 focus:bg-white outline-none transition-all resize-none active:bg-gray-100 touch-manipulation"
                      />
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      Don't include email or phone number here - we have dedicated fields for those.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 4: Payment Methods */}
              {step === 4 && (
                <>
                  <div className="bg-gray-50 border-l-4 border-indigo-600 p-4 mb-6">
                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-1.5">
                      PAYMENT METHODS
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                          All payment methods are optional. Add the ones you accept. This information will appear on your invoices to help clients pay you faster. 
                          You can always update these later in Settings.
                        </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="paypalEmail" className="block text-sm font-medium text-gray-700 mb-2">
                        PayPal Email
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <CreditCard className="w-5 h-5 text-gray-400" />
                        </div>
                        <input
                          type="email"
                          id="paypalEmail"
                          name="paypalEmail"
                          value={formData.paypalEmail}
                          onChange={handleInputChange}
                          placeholder="paypal@example.com"
                          className="w-full pl-12 pr-4 py-4 text-base bg-gray-50 border border-gray-200 focus:ring-1 focus:ring-indigo-400 focus:bg-white outline-none transition-all active:bg-gray-100 touch-manipulation"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="cashappId" className="block text-sm font-medium text-gray-700 mb-2">
                        Cash App ID
                      </label>
                      <input
                        type="text"
                        id="cashappId"
                        name="cashappId"
                        value={formData.cashappId}
                        onChange={handleInputChange}
                        placeholder="$yourcashappid"
                        className="w-full px-4 py-4 text-base bg-gray-50 border border-gray-200 focus:ring-1 focus:ring-indigo-400 focus:bg-white outline-none transition-all active:bg-gray-100 touch-manipulation"
                      />
                    </div>

                    <div>
                      <label htmlFor="venmoId" className="block text-sm font-medium text-gray-700 mb-2">
                        Venmo ID
                      </label>
                      <input
                        type="text"
                        id="venmoId"
                        name="venmoId"
                        value={formData.venmoId}
                        onChange={handleInputChange}
                        placeholder="@yourvenmoid"
                        className="w-full px-4 py-4 text-base bg-gray-50 border border-gray-200 focus:ring-1 focus:ring-indigo-400 focus:bg-white outline-none transition-all active:bg-gray-100 touch-manipulation"
                      />
                    </div>

                    <div>
                      <label htmlFor="googlePayUpi" className="block text-sm font-medium text-gray-700 mb-2">
                        Google Pay UPI
                      </label>
                      <input
                        type="text"
                        id="googlePayUpi"
                        name="googlePayUpi"
                        value={formData.googlePayUpi}
                        onChange={handleInputChange}
                        placeholder="yourname@paytm"
                        className="w-full px-4 py-4 text-base bg-gray-50 border border-gray-200 focus:ring-1 focus:ring-indigo-400 focus:bg-white outline-none transition-all active:bg-gray-100 touch-manipulation"
                      />
                    </div>

                    <div>
                      <label htmlFor="applePayId" className="block text-sm font-medium text-gray-700 mb-2">
                        Apple Pay ID
                      </label>
                      <input
                        type="text"
                        id="applePayId"
                        name="applePayId"
                        value={formData.applePayId}
                        onChange={handleInputChange}
                        placeholder="your-apple-pay-id"
                        className="w-full px-4 py-4 text-base bg-gray-50 border border-gray-200 focus:ring-1 focus:ring-indigo-400 focus:bg-white outline-none transition-all active:bg-gray-100 touch-manipulation"
                      />
                    </div>

                    <div>
                      <label htmlFor="stripeAccount" className="block text-sm font-medium text-gray-700 mb-2">
                        Stripe Account
                      </label>
                      <input
                        type="text"
                        id="stripeAccount"
                        name="stripeAccount"
                        value={formData.stripeAccount}
                        onChange={handleInputChange}
                        placeholder="acct_xxxxxxxxx"
                        className="w-full px-4 py-4 text-base bg-gray-50 border border-gray-200 focus:ring-1 focus:ring-indigo-400 focus:bg-white outline-none transition-all active:bg-gray-100 touch-manipulation"
                      />
                    </div>

                    <div>
                      <label htmlFor="bankAccount" className="block text-sm font-medium text-gray-700 mb-2">
                        Bank Account Number
                      </label>
                      <input
                        type="text"
                        id="bankAccount"
                        name="bankAccount"
                        value={formData.bankAccount}
                        onChange={handleInputChange}
                        placeholder="Account Number"
                        className="w-full px-4 py-4 text-base bg-gray-50 border border-gray-200 focus:ring-1 focus:ring-indigo-400 focus:bg-white outline-none transition-all active:bg-gray-100 touch-manipulation"
                      />
                    </div>

                    <div>
                      <label htmlFor="bankIfscSwift" className="block text-sm font-medium text-gray-700 mb-2">
                        Bank IFSC/SWIFT
                      </label>
                      <input
                        type="text"
                        id="bankIfscSwift"
                        name="bankIfscSwift"
                        value={formData.bankIfscSwift}
                        onChange={handleInputChange}
                        placeholder="IFSC/SWIFT Code"
                        className="w-full px-4 py-4 text-base bg-gray-50 border border-gray-200 focus:ring-1 focus:ring-indigo-400 focus:bg-white outline-none transition-all active:bg-gray-100 touch-manipulation"
                      />
                    </div>

                    <div className="sm:col-span-2 lg:col-span-3">
                      <label htmlFor="bankIban" className="block text-sm font-medium text-gray-700 mb-2">
                        Bank IBAN
                      </label>
                      <input
                        type="text"
                        id="bankIban"
                        name="bankIban"
                        value={formData.bankIban}
                        onChange={handleInputChange}
                        placeholder="IBAN Number"
                        className="w-full px-4 py-4 text-base bg-gray-50 border border-gray-200 focus:ring-1 focus:ring-indigo-400 focus:bg-white outline-none transition-all active:bg-gray-100 touch-manipulation"
                      />
                    </div>

                    <div className="sm:col-span-2 lg:col-span-3">
                      <label htmlFor="paymentNotes" className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Notes
                        <span className="ml-2 text-xs text-gray-500 font-normal">(Optional)</span>
                      </label>
                      <textarea
                        id="paymentNotes"
                        name="paymentNotes"
                        value={formData.paymentNotes}
                        onChange={handleInputChange}
                        placeholder="e.g., Please include invoice number in payment notes, Wire transfers take 2-3 business days..."
                        rows={4}
                        className="w-full px-4 py-4 text-base bg-gray-50 border border-gray-200 focus:ring-1 focus:ring-indigo-400 focus:bg-white outline-none transition-all resize-none active:bg-gray-100 touch-manipulation"
                      />
                    </div>
                  </div>
                </>
              )}

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-gray-200">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
              className="flex-1 bg-white text-gray-700 py-3 px-6 text-sm font-medium hover:bg-gray-50 active:bg-gray-100 transition-all cursor-pointer touch-manipulation border border-gray-300"
              >
                Back
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
            className={`${step > 1 ? 'flex-1' : 'w-full'} bg-indigo-600 text-white py-3 px-6 text-sm font-semibold hover:bg-indigo-700 active:bg-indigo-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center touch-manipulation shadow-sm hover:shadow-md`}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                step < totalSteps ? 'Continue' : 'Complete Setup'
              )}
            </button>
          </div>

        {/* Skip Option - Only on last step */}
        {step === totalSteps && (
          <div className="text-center mt-6">
              <button
                type="button"
                onClick={async () => {
                  setLoading(true);
                  setError('');

                  try {
                    // Get current session
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session) {
                      throw new Error('Not authenticated');
                    }

                    // Save all data (even if some fields are empty)
                    const response = await fetch('/api/settings', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`,
                      },
                      body: JSON.stringify({
                        businessName: formData.businessName || 'My Business',
                        businessEmail: formData.businessEmail || session.user.email || '',
                        businessPhone: formData.businessPhone,
                        address: formData.businessAddress,
                        taxId: formData.taxId,
                        isTaxRegistered: formData.isTaxRegistered,
                        logo: logoUrl || '',
                        baseCurrency: formData.baseCurrency,
                        paypalEmail: formData.paypalEmail,
                        cashappId: formData.cashappId,
                        venmoId: formData.venmoId,
                        googlePayUpi: formData.googlePayUpi,
                        applePayId: formData.applePayId,
                        stripeAccount: formData.stripeAccount,
                        bankAccount: formData.bankAccount,
                        bankIfscSwift: formData.bankIfscSwift,
                        bankIban: formData.bankIban,
                        paymentNotes: formData.paymentNotes,
                      }),
                    });

                    if (!response.ok) {
                      const errorData = await response.json();
                      throw new Error(errorData.error || 'Failed to save settings');
                    }

                    // Redirect to dashboard
                    router.push('/dashboard');
                  } catch (error: any) {
                    setError(error.message || 'Something went wrong. Please try again.');
                    setLoading(false);
                  }
                }}
                disabled={loading}
              className="text-indigo-600 hover:text-indigo-700 active:text-indigo-800 active:scale-95 font-medium text-sm cursor-pointer disabled:opacity-50 disabled:active:scale-100 transition-all touch-manipulation"
              >
                Skip payment methods for now
              </button>
          </div>
        )}
      </form>
      </div>
    </div>
  );
}
