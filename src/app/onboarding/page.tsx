'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Loader2, Building2, Mail, Phone, MapPin, Globe } from 'lucide-react';

export default function OnboardingPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    businessName: '',
    businessEmail: '',
    businessPhone: '',
    businessAddress: '',
    website: '',
  });

  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated and hasn't completed onboarding
    const checkAuthAndOnboarding = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth');
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
          if (data.settings?.business_name) {
            // Already completed onboarding, redirect to dashboard
            router.push('/dashboard');
            return;
          }
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      }
    };
    checkAuthAndOnboarding();
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.businessName.trim()) {
        setError('Business name is required');
        return;
      }
      setStep(2);
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

      // Save to user_settings
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

  return (
    <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6">
      <div className="flex flex-col lg:flex-row w-full max-w-6xl bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Left Panel - Desktop Only */}
        <div className="flex-1 relative overflow-hidden lg:block hidden bg-gray-50">
          <div className="absolute top-6 left-6 z-10">
            <button
              onClick={() => router.push('/')}
              className="w-10 h-10 bg-white/80 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-white transition-all shadow-md cursor-pointer"
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
                  {/* Business Setup Illustration */}
                  <div className="bg-white rounded-lg shadow-lg p-6 mb-6 transform rotate-2">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div className="text-xs text-gray-500">Setup</div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-2 bg-gray-200 rounded w-2/3"></div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Step {step} of 2</span>
                        <span className="font-semibold text-gray-900">50%</span>
                      </div>
                    </div>
                  </div>

                  {/* Success Preview */}
                  <div className="bg-emerald-50 rounded-lg p-4 transform -rotate-1">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium text-emerald-900">Almost there!</div>
                        <div className="text-sm text-emerald-700">Complete your profile</div>
                      </div>
                    </div>
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
                {step === 1 ? 'Let\'s set up your business' : 'Complete your profile'}
              </h1>
              <p className="text-base text-gray-600 leading-relaxed">
                {step === 1
                  ? 'We just need a few details to get you started.'
                  : 'Add your contact information to personalize your invoices.'
                }
              </p>
            </div>

            {/* Progress Indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Step {step} of 2</span>
                <span className="text-sm text-gray-500">{step === 1 ? 'Business Info' : 'Contact Details'}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(step / 2) * 100}%` }}
                ></div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-6">
                {error}
              </div>
            )}

            <form onSubmit={step === 1 ? (e) => { e.preventDefault(); handleNext(); } : handleSubmit} className="space-y-6">
              {/* Step 1: Business Information */}
              {step === 1 && (
                <>
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
                        className="w-full pl-12 pr-4 py-4 text-base border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all"
                        required
                      />
                    </div>
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
                        className="w-full pl-12 pr-4 py-4 text-base border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">We'll use your account email if left empty</p>
                  </div>
                </>
              )}

              {/* Step 2: Contact Details */}
              {step === 2 && (
                <>
                  <div>
                    <label htmlFor="businessPhone" className="block text-sm font-medium text-gray-700 mb-2">
                      Business Phone
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
                        className="w-full pl-12 pr-4 py-4 text-base border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="businessAddress" className="block text-sm font-medium text-gray-700 mb-2">
                      Business Address
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
                        rows={3}
                        className="w-full pl-12 pr-4 py-4 text-base border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all resize-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                      Website
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
                        className="w-full pl-12 pr-4 py-4 text-base border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-4 pt-4">
                {step === 2 && (
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setError('');
                    }}
                    className="flex-1 bg-gray-100 text-gray-700 py-4 px-6 text-base rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    Back
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className={`${step === 2 ? 'flex-1' : 'w-full'} bg-indigo-600 text-white py-4 px-6 text-base rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    step === 1 ? 'Continue' : 'Complete Setup'
                  )}
                </button>
              </div>

              {/* Skip Option */}
              {step === 2 && (
                <div className="text-center">
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

                        // Save minimal data (just business name from step 1)
                        const response = await fetch('/api/settings', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session.access_token}`,
                          },
                          body: JSON.stringify({
                            businessName: formData.businessName || 'My Business',
                            businessEmail: formData.businessEmail || session.user.email || '',
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
                    className="text-gray-500 hover:text-gray-700 text-sm font-medium cursor-pointer disabled:opacity-50"
                  >
                    Skip for now
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

