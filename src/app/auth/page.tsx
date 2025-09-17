'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import Image from 'next/image';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const { signIn, signUp } = useAuth();
  const router = useRouter();

  // Dark mode initialization
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Basic validation
    if (!formData.email || !formData.password) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    if (!isLogin && !formData.name) {
      setError('Please enter your full name');
      setLoading(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      let result;
      if (isLogin) {
        result = await signIn(formData.email, formData.password);
      } else {
        result = await signUp(formData.email, formData.password, formData.name);
      }
      
      if (result.error) {
        setError(result.error.message || 'Authentication failed');
        return;
      }
      
      // Success - redirect to dashboard
      router.push('/');
    } catch (err: unknown) {
      console.error('Auth error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-200 ${
      isDarkMode 
        ? 'bg-black' 
        : 'bg-gradient-to-br from-gray-50 to-gray-100'
    }`} suppressHydrationWarning>
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 mb-6">
            <Image
              src={isDarkMode ? "/logowhite.png" : "/logoblack.png"}
              alt="InvoiceFlow Logo"
              width={96}
              height={96}
              className="w-24 h-24"
            />
          </div>
          <p className={`text-lg ${
            isDarkMode 
              ? 'text-gray-300' 
              : 'text-gray-600'
          }`}>The fastest way for freelancers to get paid</p>
        </div>

        {/* Auth Card */}
        <div className={`shadow-2xl p-8 rounded-xl ${
          isDarkMode 
            ? 'bg-gray-900' 
            : 'bg-white'
        }`}>
          {/* Toggle */}
          <div className={`flex p-1 mb-8 rounded-lg ${
            isDarkMode 
              ? 'bg-gray-800' 
              : 'bg-gray-100'
          }`}>
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                isLogin 
                  ? isDarkMode
                    ? 'bg-gray-700 text-white shadow-sm'
                    : 'bg-white text-gray-900 shadow-sm'
                  : isDarkMode
                    ? 'text-gray-400 hover:text-gray-200'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                !isLogin 
                  ? isDarkMode
                    ? 'bg-gray-700 text-white shadow-sm'
                    : 'bg-white text-gray-900 shadow-sm'
                  : isDarkMode
                    ? 'text-gray-400 hover:text-gray-200'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label htmlFor="name" className={`block text-sm font-medium mb-3 ${
                  isDarkMode 
                    ? 'text-gray-300' 
                    : 'text-gray-700'
                }`}>
                  Full Name
                </label>
                <div className="relative">
                  <User className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                    isDarkMode 
                      ? 'text-gray-400' 
                      : 'text-gray-400'
                  }`} />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required={!isLogin}
                    className={`w-full pl-12 pr-4 py-4 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                      isDarkMode 
                        ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-400' 
                        : 'border-gray-200 bg-white text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="Enter your full name"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className={`block text-sm font-medium mb-3 ${
                isDarkMode 
                  ? 'text-gray-300' 
                  : 'text-gray-700'
              }`}>
                Email Address
              </label>
              <div className="relative">
                <Mail className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                  isDarkMode 
                    ? 'text-gray-400' 
                    : 'text-gray-400'
                }`} />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className={`w-full pl-12 pr-4 py-4 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                    isDarkMode 
                      ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-400' 
                      : 'border-gray-200 bg-white text-gray-900 placeholder-gray-500'
                  }`}
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className={`block text-sm font-medium mb-3 ${
                isDarkMode 
                  ? 'text-gray-300' 
                  : 'text-gray-700'
              }`}>
                Password
              </label>
              <div className="relative">
                <Lock className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                  isDarkMode 
                    ? 'text-gray-400' 
                    : 'text-gray-400'
                }`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className={`w-full pl-12 pr-12 py-4 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                    isDarkMode 
                      ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-400' 
                      : 'border-gray-200 bg-white text-gray-900 placeholder-gray-500'
                  }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-4 top-1/2 transform -translate-y-1/2 transition-colors ${
                    isDarkMode 
                      ? 'text-gray-400 hover:text-gray-200' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className={`border p-4 rounded-lg ${
                isDarkMode 
                  ? 'bg-red-900/20 border-red-800' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <p className={`text-sm ${
                  isDarkMode 
                    ? 'text-red-400' 
                    : 'text-red-600'
                }`}>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-6 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm font-medium ${
                isDarkMode 
                  ? 'bg-white text-black hover:bg-gray-200' 
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className={`text-sm ${
              isDarkMode 
                ? 'text-gray-400' 
                : 'text-gray-600'
            }`}>
              {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className={`font-medium transition-colors ${
                  isDarkMode 
                    ? 'text-indigo-400 hover:text-indigo-300' 
                    : 'text-indigo-600 hover:text-indigo-700'
                }`}
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 text-center">
          <p className={`text-sm mb-4 ${
            isDarkMode 
              ? 'text-gray-500' 
              : 'text-gray-500'
          }`}>Trusted by freelancers worldwide</p>
          <div className={`flex justify-center space-x-8 text-xs ${
            isDarkMode 
              ? 'text-gray-500' 
              : 'text-gray-400'
          }`}>
            <span>✓ 60-second invoicing</span>
            <span>✓ Professional templates</span>
            <span>✓ Secure payments</span>
          </div>
        </div>
      </div>
    </div>
  );
}
