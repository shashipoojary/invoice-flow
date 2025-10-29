'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Eye, EyeOff, ArrowLeft, Loader2, X, AlertCircle } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    agreeToTerms: false,
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    const message = searchParams.get('message');
    if (message === 'session_expired') {
      setSessionExpired(true);
      // Clear the URL parameter after showing the message
      router.replace('/auth');
    }
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (error) throw error;
        router.push('/dashboard');
      } else {
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              name: `${formData.firstName} ${formData.lastName}`,
            },
          },
        });
        if (error) throw error;
        router.push('/dashboard');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
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
                  {/* Document/Invoice Illustration */}
                  <div className="bg-white rounded-lg shadow-lg p-6 mb-6 transform rotate-2">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="text-xs text-gray-500">INV-001</div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-2 bg-gray-200 rounded w-2/3"></div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total</span>
                        <span className="font-semibold text-gray-900">$2,500</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Success */}
                  <div className="bg-emerald-50 rounded-lg p-4 transform -rotate-1">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium text-emerald-900">Payment Received</div>
                        <div className="text-sm text-emerald-700">$2,500.00</div>
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
                     <h2 className="font-heading text-2xl font-bold text-gray-900 mb-2">FlowInvoicer</h2>
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
              <div className="text-sm text-indigo-600 font-medium mb-3">Welcome</div>
              <h1 className="font-heading text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                {isLogin ? 'Welcome back!' : 'Sign in or create an account'}
              </h1>
              <p className="text-base text-gray-600 leading-relaxed">
                {isLogin
                  ? "We found an account with this email. Please enter your password."
                  : "Your everyday invoicing is here! Please enter your email address to start."
                }
              </p>
                </div>

            {/* Session Expired Message */}
            {sessionExpired && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm mb-6 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Your session has expired. Please sign in again to continue.</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="my.account@email.com"
                  className="w-full px-4 py-4 text-base border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all"
                  required
                />
                {formData.email && (
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, email: '' }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                )}
              </div>
            </div>

            {/* Password Field - Only show for login */}
            {isLogin && (
            <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 pr-12 text-base border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5 text-gray-500" />
                    ) : (
                      <Eye className="w-5 h-5 text-gray-500" />
                    )}
                </button>
              </div>
            </div>
            )}

            {/* Name Fields - Only show for signup */}
            {!isLogin && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="John"
                    className="w-full px-4 py-4 text-base border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all"
                    required={!isLogin}
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Doe"
                    className="w-full px-4 py-4 text-base border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            {/* Password Field for Signup */}
            {!isLogin && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Create a password"
                    className="w-full px-4 py-3 pr-12 text-base border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5 text-gray-500" />
                    ) : (
                      <Eye className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Terms Checkbox - Only show for signup */}
            {!isLogin && (
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="agreeToTerms"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  required={!isLogin}
                />
                <label htmlFor="agreeToTerms" className="text-sm text-gray-600">
                  By creating an account, I agree to{' '}
                  <button type="button" className="text-indigo-600 font-medium hover:underline">
                    Terms of Service
                  </button>
                  {' '}and{' '}
                  <button type="button" className="text-indigo-600 font-medium hover:underline">
                    Privacy Policy
                  </button>
                </label>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-4 px-6 text-base rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Continue'
              )}
            </button>

            {/* Forgot Password Link - Only show for login */}
            {isLogin && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => router.push('/auth/forgot-password')}
                  className="text-indigo-600 hover:text-indigo-700 font-medium text-sm cursor-pointer"
                >
                  Forgot your password?
                </button>
              </div>
            )}

            {/* Toggle between login/signup */}
            <div className="text-center mt-8">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
          </div>
          </form>
          </div>
        </div>
      </div>
    </div>
  );
}