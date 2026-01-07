'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Loader2, Mail, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;
      setSuccess(true);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row w-full max-w-6xl bg-white overflow-hidden">
          {/* Left Panel - Desktop Only */}
          <div className="flex-1 relative overflow-hidden lg:block hidden bg-gray-50">
            <div className="absolute top-6 left-6 z-10">
              <button
                onClick={() => router.push('/auth')}
                className="w-10 h-10 bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-all shadow-md"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            <div className="flex items-center justify-center h-full p-8">
              <div className="w-full max-w-lg">
                {/* Success Illustration */}
                <div className="relative">
                  {/* Background Elements */}
                  <div className="absolute inset-0">
                    <div className="w-32 h-32 bg-green-100 absolute -top-8 -right-8 opacity-60"></div>
                    <div className="w-24 h-24 bg-emerald-100 absolute -bottom-4 -left-4 opacity-40"></div>
                    <div className="w-16 h-16 bg-indigo-100 absolute top-1/2 -right-2 opacity-50"></div>
                  </div>

                  {/* Main Illustration */}
                  <div className="relative z-10">
                    {/* Email Sent Illustration */}
                    <div className="bg-white shadow-lg p-6 mb-6 transform rotate-2">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-8 h-8 bg-indigo-100 flex items-center justify-center">
                          <Mail className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div className="text-xs text-gray-500">Reset Link</div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-2 bg-gray-200 w-3/4"></div>
                        <div className="h-2 bg-gray-200 w-1/2"></div>
                        <div className="h-2 bg-gray-200 w-2/3"></div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Status</span>
                          <span className="font-semibold text-green-600">Sent</span>
                        </div>
                      </div>
                    </div>

                    {/* Success Notification */}
                    <div className="bg-green-50 p-4 transform -rotate-1">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-500 flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-green-900">Email Sent</div>
                          <div className="text-sm text-green-700">Check your inbox</div>
                        </div>
                      </div>
                    </div>

                    {/* Floating Elements */}
                    <div className="absolute -top-4 -right-4 w-6 h-6 bg-green-400 flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>

                    <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-indigo-500 flex items-center justify-center">
                      <Mail className="w-2 h-2 text-white" />
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
                onClick={() => router.push('/auth')}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                <span className="text-sm font-medium">Back</span>
              </button>
            </div>

            {/* Main Content */}
            <div className="w-full">
              {/* Success Message */}
              <div className="text-center mb-10">
                <div className="w-16 h-16 bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <div className="text-sm text-green-600 font-medium mb-3">Email Sent</div>
                <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-semibold text-gray-900 mb-4 tracking-tight">
                  Check your inbox
                </h1>
                <p className="text-base text-gray-600 leading-relaxed">
                  We&apos;ve sent a password reset link to <strong>{email}</strong>. 
                  Please check your email and click the link to reset your password.
                </p>
              </div>

              <div className="space-y-6">
                <button
                  onClick={() => router.push('/auth')}
                  className="w-full bg-indigo-600 text-white py-4 px-6 text-base font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back to Sign In
                </button>

                <div className="text-center">
                  <button
                    onClick={() => {
                      setSuccess(false);
                      setEmail('');
                    }}
                    className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                  >
                    Try a different email
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6">
      <div className="flex flex-col lg:flex-row w-full max-w-6xl bg-white overflow-hidden">
        {/* Left Panel - Desktop Only */}
        <div className="flex-1 relative overflow-hidden lg:block hidden bg-gray-50">
          <div className="absolute top-6 left-6 z-10">
            <button
              onClick={() => router.push('/auth')}
              className="w-10 h-10 bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-all shadow-md"
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
                  <div className="w-32 h-32 bg-indigo-100 absolute -top-8 -right-8 opacity-60"></div>
                  <div className="w-24 h-24 bg-purple-100 absolute -bottom-4 -left-4 opacity-40"></div>
                  <div className="w-16 h-16 bg-blue-100 absolute top-1/2 -right-2 opacity-50"></div>
                </div>

                {/* Main Illustration */}
                <div className="relative z-10">
                  {/* Email Illustration */}
                  <div className="bg-white shadow-lg p-6 mb-6 transform rotate-2">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-8 h-8 bg-indigo-100 flex items-center justify-center">
                        <Mail className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div className="text-xs text-gray-500">Reset Link</div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-gray-200 w-3/4"></div>
                      <div className="h-2 bg-gray-200 w-1/2"></div>
                      <div className="h-2 bg-gray-200 w-2/3"></div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Status</span>
                        <span className="font-semibold text-orange-500">Pending</span>
                      </div>
                    </div>
                  </div>

                  {/* Email Icon */}
                  <div className="bg-indigo-50 p-4 transform -rotate-1">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-indigo-500 flex items-center justify-center">
                        <Mail className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-indigo-900">Password Reset</div>
                        <div className="text-sm text-indigo-700">We&apos;ll send you a link</div>
                      </div>
                    </div>
                  </div>

                  {/* Floating Elements */}
                  <div className="absolute -top-4 -right-4 w-6 h-6 bg-indigo-400 flex items-center justify-center">
                    <Mail className="w-3 h-3 text-white" />
                  </div>

                  <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-indigo-500 flex items-center justify-center">
                    <Mail className="w-2 h-2 text-white" />
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
              onClick={() => router.push('/auth')}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span className="text-sm font-medium">Back</span>
            </button>
          </div>

          {/* Main Content */}
          <div className="w-full">
            {/* Welcome Message */}
            <div className="text-center mb-10">
              <div className="text-sm text-indigo-600 font-medium mb-3">Forgot Password</div>
              <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-semibold text-gray-900 mb-4 tracking-tight">
                Reset your password
              </h1>
              <p className="text-base text-gray-600 leading-relaxed">
                Enter your email address and we&apos;ll send you a link to reset your password.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 text-sm">
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full px-4 py-4 text-base bg-gray-50 focus:ring-1 focus:ring-indigo-400 focus:bg-white outline-none transition-all"
                    required
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Mail className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-4 px-6 text-base font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Send Reset Link'
                )}
              </button>

              {/* Back to Sign In */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => router.push('/auth')}
                  className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
