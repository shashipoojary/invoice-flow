'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Loader2, Building2, Mail, Phone, MapPin, Globe, Upload, X, Image as ImageIcon, CreditCard, Info, AlertCircle } from 'lucide-react';
import { optimizeLogo, validateLogoFile } from '@/lib/logo-optimizer';

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
    website: '',
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
  const totalSteps = 3; // Business Info, Contact Details, Payment Methods

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
      setStep(3);
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
          website: formData.website,
          logo: logoUrl || '',
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
      case 2: return 'Contact Details';
      case 3: return 'Payment Methods';
      default: return 'Setup';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 1: return 'Let\'s start with your basic business information. This will appear on all your invoices.';
      case 2: return 'Add your contact details so clients can reach you easily.';
      case 3: return 'Set up payment methods to get paid faster. You can add multiple options for your clients.';
      default: return '';
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6">
      <div className="flex flex-col lg:flex-row w-full max-w-6xl bg-white overflow-hidden">
        {/* Left Panel - Desktop Only */}
        <div className="flex-1 relative overflow-hidden lg:block hidden bg-gray-50">
          <div className="absolute top-6 left-6 z-10">
            <button
              onClick={() => router.push('/')}
              className="w-10 h-10 bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-all shadow-md cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          <div className="flex items-center justify-center h-full p-8">
            <div className="w-full max-w-lg">
              {/* Modern Illustration */}
              <div className="relative">
                {/* Background Elements */}
                <div className="absolute inset-0">
                  <div className="w-32 h-32 bg-indigo-100 rounded-full absolute -top-8 -right-8 opacity-60"></div>
                  <div className="w-24 h-24 bg-purple-100 rounded-full absolute -bottom-4 -left-4 opacity-40"></div>
                  <div className="w-16 h-16 bg-blue-100 rounded-full absolute top-1/2 -right-2 opacity-50"></div>
                </div>

                {/* Main Illustration */}
                <div className="relative z-10">
                  {/* Setup/Onboarding Illustration */}
                  <div className="bg-white shadow-lg p-6 mb-6 transform rotate-2">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-8 h-8 bg-indigo-100 flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div className="text-xs text-gray-500">Step {step}/{totalSteps}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-2 bg-indigo-200 rounded w-2/3"></div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Progress</span>
                        <span className="font-semibold text-gray-900">{Math.round((step / totalSteps) * 100)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Success Checkmark */}
                  <div className="bg-emerald-50 p-4 transform -rotate-1">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium text-emerald-900">Almost Done!</div>
                        <div className="text-sm text-emerald-700">Complete setup to get started</div>
                      </div>
                    </div>
                  </div>

                  {/* Floating Elements */}
                  <div className="absolute -top-4 -right-4 w-6 h-6 bg-indigo-400 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                    </svg>
                  </div>

                  <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center">
                    <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Brand Text */}
              <div className="text-center mt-8">
                <h2 className="font-heading text-2xl font-semibold text-gray-900 mb-2">FlowInvoicer</h2>
                <p className="text-gray-600">Create • Send • Get Paid</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex-1 p-6 lg:p-16 flex flex-col justify-center max-w-lg mx-auto w-full">
          {/* Back Button - Mobile Only */}
          <div className="mb-6 lg:hidden">
            <button
              onClick={() => router.push('/')}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span className="text-sm font-medium">Back</span>
            </button>
          </div>

          {/* Main Content */}
          <div className="w-full">
            {/* Welcome Message */}
            <div className="text-center mb-10">
              <div className="text-sm text-indigo-600 font-medium mb-3">Welcome to FlowInvoicer</div>
              <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-semibold text-gray-900 mb-4 tracking-tight">
                {getStepTitle()}
              </h1>
              <p className="text-base text-gray-600 leading-relaxed">
                {getStepDescription()}
              </p>
            </div>

            {/* Progress Indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Step {step} of {totalSteps}</span>
                <span className="text-sm text-gray-500">{Math.round((step / totalSteps) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-2 transition-all duration-300 rounded-full"
                  style={{ width: `${(step / totalSteps) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Disclaimer Banner */}
            <div className="mb-6 bg-gray-50 border-l-4 border-indigo-600 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-1.5">
                IMPORTANT INFORMATION
              </p>
              <p className="text-sm font-medium text-gray-900">
                All information you provide here will be saved to your account settings and can be updated anytime from the Settings page.
                {step === 3 && ' Payment methods are optional - add as many as you accept. This information will appear on your invoices.'}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 text-sm mb-6 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={step < totalSteps ? (e) => { e.preventDefault(); handleNext(); } : handleSubmit} className="space-y-8">
              {/* Step 1: Business Information */}
              {step === 1 && (
                <>
                  {/* Logo Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Logo
                      <span className="ml-2 text-xs text-gray-500 font-normal">(Optional)</span>
                    </label>
                    <div className="flex items-center gap-4 mb-4">
                      {logoPreview ? (
                        <div className="relative">
                          <img
                            src={logoPreview}
                            alt="Logo preview"
                            className="w-20 h-20 object-contain bg-gray-50"
                          />
                          <button
                            type="button"
                            onClick={handleRemoveLogo}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer shadow-md"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-20 h-20 flex items-center justify-center bg-gray-50">
                          <ImageIcon className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <label
                          htmlFor="logo-upload"
                          className={`flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 cursor-pointer hover:bg-gray-200 transition-all text-sm ${isUploadingLogo ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                        className="w-full pl-12 pr-4 py-4 text-base bg-gray-50 focus:ring-1 focus:ring-indigo-400 focus:bg-white outline-none transition-all"
                        required
                      />
                    </div>
                    <p className="mt-2 text-xs text-gray-500">This will appear on all your invoices</p>
                  </div>

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
                        className="w-full pl-12 pr-4 py-4 text-base bg-gray-50 focus:ring-1 focus:ring-indigo-400 focus:bg-white outline-none transition-all"
                      />
                    </div>
                    <p className="mt-2 text-xs text-gray-500">We'll use your account email if left empty</p>
                  </div>
                </>
              )}

              {/* Step 2: Contact Details */}
              {step === 2 && (
                <>
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
                        className="w-full pl-12 pr-4 py-4 text-base bg-gray-50 focus:ring-1 focus:ring-indigo-400 focus:bg-white outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
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
                        className="w-full pl-12 pr-4 py-4 text-base bg-gray-50 focus:ring-1 focus:ring-indigo-400 focus:bg-white outline-none transition-all resize-none"
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-gray-500">
                      Don't include email or phone number here - we have dedicated fields for those below.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                      Website
                      <span className="ml-2 text-xs text-gray-500 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Globe className="w-5 h-5 text-gray-400" />
                      </div>
                      <input
                        type="url"
                        id="website"
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        placeholder="https://yourwebsite.com"
                        className="w-full pl-12 pr-4 py-4 text-base bg-gray-50 focus:ring-1 focus:ring-indigo-400 focus:bg-white outline-none transition-all"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Step 3: Payment Methods */}
              {step === 3 && (
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
                          className="w-full pl-12 pr-4 py-4 text-base bg-gray-50 focus:ring-1 focus:ring-indigo-400 focus:bg-white outline-none transition-all"
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
                        className="w-full px-4 py-4 text-base bg-gray-50 focus:ring-1 focus:ring-indigo-400 focus:bg-white outline-none transition-all"
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
                        className="w-full px-4 py-4 text-base bg-gray-50 focus:ring-1 focus:ring-indigo-400 focus:bg-white outline-none transition-all"
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
                        className="w-full px-4 py-4 text-base bg-gray-50 focus:ring-1 focus:ring-indigo-400 focus:bg-white outline-none transition-all"
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
                        className="w-full px-4 py-4 text-base bg-gray-50 focus:ring-1 focus:ring-indigo-400 focus:bg-white outline-none transition-all"
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
                        className="w-full px-4 py-4 text-base bg-gray-50 focus:ring-1 focus:ring-indigo-400 focus:bg-white outline-none transition-all"
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
                        className="w-full px-4 py-4 text-base bg-gray-50 focus:ring-1 focus:ring-indigo-400 focus:bg-white outline-none transition-all"
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
                        className="w-full px-4 py-4 text-base bg-gray-50 focus:ring-1 focus:ring-indigo-400 focus:bg-white outline-none transition-all"
                      />
                    </div>

                    <div className="sm:col-span-2">
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
                        className="w-full px-4 py-4 text-base bg-gray-50 focus:ring-1 focus:ring-indigo-400 focus:bg-white outline-none transition-all"
                      />
                    </div>

                    <div className="sm:col-span-2">
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
                        className="w-full px-4 py-4 text-base bg-gray-50 focus:ring-1 focus:ring-indigo-400 focus:bg-white outline-none transition-all resize-none"
                      />
                    </div>
                  </div>
                </>
              )}

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 bg-gray-100 text-gray-700 py-4 px-6 text-base font-medium hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className={`${step > 1 ? 'flex-1' : 'w-full'} bg-indigo-600 text-white py-4 px-6 text-base font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
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
                          website: formData.website,
                          logo: logoUrl || '',
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
                  className="text-indigo-600 hover:text-indigo-700 font-medium text-sm cursor-pointer disabled:opacity-50"
                >
                  Skip payment methods for now
                </button>
              </div>
            )}
          </form>
          </div>
        </div>
      </div>
    </div>
  );
}
