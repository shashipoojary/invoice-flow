'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  CheckCircle, 
  Zap, 
  Shield, 
  ArrowRight,
  Play,
  Smartphone,
  BarChart3,
  Bell,
  Settings,
  Menu,
  X
} from 'lucide-react';
import Image from 'next/image';

export default function LandingPage() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeFaqCategory, setActiveFaqCategory] = useState('General');

  useEffect(() => {
    setIsVisible(true);
    // Check for saved dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      setIsDarkMode(JSON.parse(savedDarkMode));
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      localStorage.setItem('darkMode', newMode.toString());
      return newMode;
    });
  };

  const handleGetStarted = () => {
    router.push('/auth');
  };

  const handleViewDemo = () => {
    router.push('/dashboard');
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-200 ${
        isDarkMode 
          ? 'bg-black/80 border-b border-gray-800' 
          : 'bg-white/80 border-b border-gray-200'
      } backdrop-blur-md`}>
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0 -ml-2 sm:ml-0">
              <div className="w-40 h-10 sm:w-44 sm:h-11 lg:w-52 lg:h-13 relative">
                <Image
                  src={isDarkMode ? '/logo-main-white.png' : '/logo-main-black.png'}
                  alt="InvoiceFlow Logo"
                  width={208}
                  height={52}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-sm font-medium transition-colors hover:opacity-80" style={{color: isDarkMode ? '#9ca3af' : '#6b7280'}}>
                Features
              </a>
              <a href="#pricing" className="text-sm font-medium transition-colors hover:opacity-80" style={{color: isDarkMode ? '#9ca3af' : '#6b7280'}}>
                Pricing
              </a>
              <a href="#about" className="text-sm font-medium transition-colors hover:opacity-80" style={{color: isDarkMode ? '#9ca3af' : '#6b7280'}}>
                About
              </a>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-3">
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={handleViewDemo}
                className="text-sm font-medium transition-colors px-4 py-2 rounded-lg hover:opacity-80"
                style={{color: isDarkMode ? '#9ca3af' : '#6b7280'}}
              >
                View Demo
              </button>
              <button
                onClick={handleGetStarted}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDarkMode 
                    ? 'bg-white text-black hover:bg-gray-200' 
                    : 'bg-black text-white hover:bg-gray-800'
                }`}
              >
                Get Started
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-2">
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className={`md:hidden border-t ${
              isDarkMode ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <div className="px-2 pt-2 pb-3 space-y-1">
                <a
                  href="#features"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 text-base font-medium rounded-md transition-colors"
                  style={{color: isDarkMode ? '#9ca3af' : '#6b7280'}}
                >
                  Features
                </a>
                <a
                  href="#pricing"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 text-base font-medium rounded-md transition-colors"
                  style={{color: isDarkMode ? '#9ca3af' : '#6b7280'}}
                >
                  Pricing
                </a>
                <a
                  href="#about"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 text-base font-medium rounded-md transition-colors"
                  style={{color: isDarkMode ? '#9ca3af' : '#6b7280'}}
                >
                  About
                </a>
                <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      handleViewDemo();
                      setIsMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 text-base font-medium rounded-md transition-colors mb-2"
                    style={{color: isDarkMode ? '#9ca3af' : '#6b7280'}}
                  >
                    View Demo
                  </button>
                  <button
                    onClick={() => {
                      handleGetStarted();
                      setIsMobileMenuOpen(false);
                    }}
                    className={`block w-full text-left px-3 py-2 text-base font-medium rounded-md transition-colors ${
                      isDarkMode 
                        ? 'bg-white text-black hover:bg-gray-200' 
                        : 'bg-black text-white hover:bg-gray-800'
                    }`}
                  >
                    Get Started
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
      <div className="text-center">
            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <h1 className="font-heading text-4xl sm:text-6xl lg:text-7xl font-bold mb-8 leading-tight" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                The Fastest Way to
                <span className="text-indigo-600"> Get Paid</span>
              </h1>
              <p className="text-sm sm:text-lg lg:text-xl mb-12 max-w-4xl mx-auto leading-relaxed" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                Create professional invoices in 60 seconds. Send automated reminders. Get paid faster.
              </p>
              
               {/* CTA Buttons */}
               <div className="flex flex-row gap-2 sm:gap-4 justify-center mb-2 sm:mb-4">
                 <button
                   onClick={handleGetStarted}
                   className={`group flex items-center justify-center space-x-2 px-4 py-3 sm:px-8 sm:py-4 rounded-lg text-sm sm:text-base font-semibold transition-all duration-200 hover:scale-105 w-[calc(50%-0.25rem)] sm:w-auto ${
                     isDarkMode 
                       ? 'bg-white text-black hover:bg-gray-100 shadow-lg' 
                       : 'bg-black text-white hover:bg-gray-800 shadow-lg'
                   }`}
                 >
                   <span className="hidden sm:inline">Start Creating Invoices</span>
                   <span className="sm:hidden">Start Creating</span>
                   <ArrowRight className="w-4 h-4 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
                 </button>
                 <button
                   onClick={handleViewDemo}
                   className={`group flex items-center justify-center space-x-2 px-4 py-3 sm:px-8 sm:py-4 rounded-lg text-sm sm:text-base font-semibold transition-all duration-200 hover:scale-105 border-2 w-[calc(50%-0.25rem)] sm:w-auto ${
                     isDarkMode 
                       ? 'border-gray-600 text-gray-300 hover:bg-gray-800 hover:border-gray-500' 
                       : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                   }`}
                 >
                   <Play className="w-4 h-4 sm:w-4 sm:h-4 group-hover:scale-110 transition-transform" />
                   <span className="hidden sm:inline">View Demo</span>
                   <span className="sm:hidden">Demo</span>
                 </button>
               </div>

            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Screenshot Section */}
      <section className="pt-1 pb-4 sm:pt-2 sm:pb-6 px-4 sm:px-6 lg:px-8" style={{backgroundColor: isDarkMode ? '#0d1117' : '#ffffff'}}>
        <div className="max-w-7xl mx-auto">
          <div className="w-full flex justify-center">
            <div className="relative max-w-5xl w-full">
              {/* Indigo glow effect - positioned relative to image */}
              <div className="absolute inset-0 rounded-2xl opacity-40 blur-3xl" style={{
                background: isDarkMode 
                  ? 'radial-gradient(ellipse at center, #6366f1, #8b5cf6, #06b6d4, #3b82f6)' 
                  : 'radial-gradient(ellipse at center, #818cf8, #a78bfa, #22d3ee, #60a5fa)',
                transform: 'scale(1.1)',
                zIndex: 1
              }}></div>
              
              {/* Secondary indigo glow */}
              <div className="absolute inset-0 rounded-2xl opacity-30 blur-2xl" style={{
                background: isDarkMode 
                  ? 'linear-gradient(45deg, #6366f1, #8b5cf6, #06b6d4, #3b82f6)' 
                  : 'linear-gradient(45deg, #818cf8, #a78bfa, #22d3ee, #60a5fa)',
                transform: 'scale(1.05)',
                zIndex: 2
              }}></div>
              
              {/* Tertiary glow for depth */}
              <div className="absolute inset-0 rounded-2xl opacity-20 blur-xl" style={{
                background: isDarkMode 
                  ? 'conic-gradient(from 0deg, #6366f1, #8b5cf6, #06b6d4, #3b82f6, #6366f1)' 
                  : 'conic-gradient(from 0deg, #818cf8, #a78bfa, #22d3ee, #60a5fa, #818cf8)',
                transform: 'scale(1.02)',
                zIndex: 3
              }}></div>
              
              <div className={`relative z-10 rounded-lg overflow-hidden border ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`} style={{
                boxShadow: isDarkMode 
                  ? '0 8px 32px rgba(0, 0, 0, 0.3)' 
                  : '0 8px 32px rgba(0, 0, 0, 0.1)'
              }}>
                <Image
                  src="/dashboard-screenshot.png"
                  alt="InvoiceFlow Dashboard Screenshot"
                  width={1200}
                  height={800}
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Introduction Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" style={{backgroundColor: isDarkMode ? '#0d1117' : '#ffffff'}}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-heading text-4xl sm:text-5xl font-bold mb-6" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                Your invoicing doesn&apos;t stand a chance
              </h2>
              <p className="text-lg mb-8" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                Delegate invoice management to InvoiceFlow and let your automated system create, send, and track payments in the background.
              </p>
              <a href="#" className="text-indigo-600 hover:text-indigo-500 font-semibold">
                Discover InvoiceFlow automation →
              </a>
            </div>
            <div className="space-y-8">
              <div className="flex items-start">
                <div className="flex flex-col items-center mr-6">
                  <div className="w-3 h-3 rounded-full border-2 border-gray-400 mb-2"></div>
                  <div className="w-px h-16 bg-gray-300"></div>
                </div>
                <div>
                  <h3 className="font-heading text-lg font-semibold mb-3" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                    Handles your invoices.
                  </h3>
                  <p style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                    When you create invoices, InvoiceFlow plans, sends, tracks, and follows up—using automated reminders to ensure payment and deliver ready-to-pay invoices.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex flex-col items-center mr-6">
                  <div className="w-3 h-3 rounded-full border-2 border-gray-400 mb-2"></div>
                  <div className="w-px h-16 bg-gray-300"></div>
                </div>
                <div>
                  <h3 className="font-heading text-lg font-semibold mb-3" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                    Works like a professional.
                  </h3>
                  <p style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                    InvoiceFlow integrates with your business data to draw on client information and payment history—working like an experienced accountant from day one.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex flex-col items-center mr-6">
                  <div className="w-3 h-3 rounded-full border-2 border-gray-400"></div>
                </div>
                <div>
                  <h3 className="font-heading text-lg font-semibold mb-3" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                    Human and automation in the loop.
                  </h3>
                  <p style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                    Customize to guide InvoiceFlow, review invoices before sending, or take over manually in your dashboard.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8" style={{backgroundColor: isDarkMode ? '#0d1117' : '#ffffff'}}>
        <div className="max-w-7xl mx-auto">
          {/* Section 1: Create Invoice */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
            <div className="order-2 lg:order-1">
              <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-6" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                Create invoices in 60 seconds
              </h2>
              <p className="text-lg mb-8" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                Add client details, items, and amounts. Choose from professional templates and send instantly.
              </p>
              <a href="#" className="text-indigo-600 hover:text-indigo-500 font-semibold">
                Try invoice creation →
              </a>
            </div>
            <div className="order-1 lg:order-2">
              <div className="relative">
                {/* Subtle bottom glow effect - like GitHub Copilot */}
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-4/5 h-12 rounded-full opacity-50 blur-xl" style={{
                  background: isDarkMode 
                    ? 'linear-gradient(90deg, #3b82f6, #2563eb, #1d4ed8)' 
                    : 'linear-gradient(90deg, #60a5fa, #3b82f6, #2563eb)',
                  zIndex: 1
                }}></div>
                
                <div className={`relative z-10 rounded-lg overflow-hidden border ${
                  isDarkMode ? 'border-gray-700' : 'border-gray-200'
                }`} style={{
                  boxShadow: isDarkMode 
                    ? '0 8px 32px rgba(0, 0, 0, 0.3)' 
                    : '0 8px 32px rgba(0, 0, 0, 0.1)'
                }}>
                  <Image 
                    src="/invoice-creation-screenshot.png" 
                    alt="Invoice Creation Interface"
                    width={800}
                    height={400}
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Automated Reminders */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
            <div className="order-1">
              <div className="relative">
                {/* Subtle bottom glow effect - like GitHub Copilot */}
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-4/5 h-12 rounded-full opacity-50 blur-xl" style={{
                  background: isDarkMode 
                    ? 'linear-gradient(90deg, #3b82f6, #2563eb, #1d4ed8)' 
                    : 'linear-gradient(90deg, #60a5fa, #3b82f6, #2563eb)',
                  zIndex: 1
                }}></div>
                
                <div className={`relative z-10 rounded-lg overflow-hidden border ${
                  isDarkMode ? 'border-gray-700' : 'border-gray-200'
                }`} style={{
                  boxShadow: isDarkMode 
                    ? '0 8px 32px rgba(0, 0, 0, 0.3)' 
                    : '0 8px 32px rgba(0, 0, 0, 0.1)'
                }}>
                  <Image 
                    src="/reminders-dashboard-screenshot.png" 
                    alt="Reminders Dashboard Interface"
                    width={800}
                    height={400}
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            </div>
            <div className="order-2">
              <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-6" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                Smart automated reminders
              </h2>
              <p className="text-lg mb-8" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                Set up custom reminder schedules. Get paid faster with automated follow-ups that actually work.
              </p>
              <a href="#" className="text-indigo-600 hover:text-indigo-500 font-semibold">
                Discover reminders →
              </a>
            </div>
          </div>

          {/* Section 3: Track Everything */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-6" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                Track everything in one place
              </h2>
              <p className="text-lg mb-8" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                Monitor payments, overdue invoices, and client activity. Get insights that help you get paid faster.
              </p>
              <a href="#" className="text-indigo-600 hover:text-indigo-500 font-semibold">
                View dashboard →
              </a>
            </div>
            <div className="order-1 lg:order-2">
              <div className="relative">
                {/* Subtle bottom glow effect - like GitHub Copilot */}
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-4/5 h-12 rounded-full opacity-50 blur-xl" style={{
                  background: isDarkMode 
                    ? 'linear-gradient(90deg, #3b82f6, #2563eb, #1d4ed8)' 
                    : 'linear-gradient(90deg, #60a5fa, #3b82f6, #2563eb)',
                  zIndex: 1
                }}></div>
                
                <div className={`relative z-10 rounded-lg overflow-hidden border ${
                  isDarkMode ? 'border-gray-700' : 'border-gray-200'
                }`} style={{
                  boxShadow: isDarkMode 
                    ? '0 8px 32px rgba(0, 0, 0, 0.3)' 
                    : '0 8px 32px rgba(0, 0, 0, 0.1)'
                }}>
                  <Image 
                    src="/analytics-dashboard-screenshot.png" 
                    alt="Analytics Dashboard Interface"
                    width={800}
                    height={400}
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Additional Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8" style={{backgroundColor: isDarkMode ? '#111111' : '#f8f9fa'}}>
        <div className="max-w-7xl mx-auto">
          {/* Section 4: Professional Templates */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
            <div className="order-1">
              <div className="relative">
                {/* Subtle bottom glow effect - like GitHub Copilot */}
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-4/5 h-12 rounded-full opacity-50 blur-xl" style={{
                  background: isDarkMode 
                    ? 'linear-gradient(90deg, #3b82f6, #2563eb, #1d4ed8)' 
                    : 'linear-gradient(90deg, #60a5fa, #3b82f6, #2563eb)',
                  zIndex: 1
                }}></div>
                
                <div className={`relative z-10 rounded-lg overflow-hidden border ${
                  isDarkMode ? 'border-gray-700' : 'border-gray-200'
                }`} style={{
                  boxShadow: isDarkMode 
                    ? '0 8px 32px rgba(0, 0, 0, 0.3)' 
                    : '0 8px 32px rgba(0, 0, 0, 0.1)'
                }}>
                  <Image 
                    src="/template-selection-screenshot.png" 
                    alt="Template Selection Interface"
                    width={800}
                    height={400}
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            </div>
            <div className="order-2">
              <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-6" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                Beautiful professional templates
              </h2>
              <p className="text-lg mb-8" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                Choose from multiple professional invoice templates. Customize colors, fonts, and layout to match your brand.
              </p>
              <a href="#" className="text-indigo-600 hover:text-indigo-500 font-semibold">
                Explore templates →
              </a>
            </div>
          </div>

          {/* Section 5: Client Management */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
            <div className="order-2 lg:order-1">
              <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-6" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                Smart client management
              </h2>
              <p className="text-lg mb-8" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                Store client information, payment history, and communication logs. Never lose track of important details.
              </p>
              <a href="#" className="text-indigo-600 hover:text-indigo-500 font-semibold">
                Manage clients →
              </a>
            </div>
            <div className="order-1 lg:order-2">
              <div className="relative">
                {/* Subtle bottom glow effect - like GitHub Copilot */}
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-4/5 h-12 rounded-full opacity-50 blur-xl" style={{
                  background: isDarkMode 
                    ? 'linear-gradient(90deg, #3b82f6, #2563eb, #1d4ed8)' 
                    : 'linear-gradient(90deg, #60a5fa, #3b82f6, #2563eb)',
                  zIndex: 1
                }}></div>
                
                <div className={`relative z-10 rounded-lg overflow-hidden border ${
                  isDarkMode ? 'border-gray-700' : 'border-gray-200'
                }`} style={{
                  boxShadow: isDarkMode 
                    ? '0 8px 32px rgba(0, 0, 0, 0.3)' 
                    : '0 8px 32px rgba(0, 0, 0, 0.1)'
                }}>
                  <Image 
                    src="/client-management-screenshot.png" 
                    alt="Client Management Interface"
                    width={800}
                    height={400}
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 6: Payment Status Management */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-1">
              <div className="relative">
                {/* Subtle bottom glow effect - like GitHub Copilot */}
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-4/5 h-12 rounded-full opacity-50 blur-xl" style={{
                  background: isDarkMode 
                    ? 'linear-gradient(90deg, #3b82f6, #2563eb, #1d4ed8)' 
                    : 'linear-gradient(90deg, #60a5fa, #3b82f6, #2563eb)',
                  zIndex: 1
                }}></div>
                
                <div className={`relative z-10 rounded-lg overflow-hidden border ${
                  isDarkMode ? 'border-gray-700' : 'border-gray-200'
                }`} style={{
                  boxShadow: isDarkMode 
                    ? '0 8px 32px rgba(0, 0, 0, 0.3)' 
                    : '0 8px 32px rgba(0, 0, 0, 0.1)'
                }}>
                  <Image 
                    src="/payment-status-screenshot.png" 
                    alt="Payment Status Management Interface"
                    width={800}
                    height={400}
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            </div>
            <div className="order-2">
              <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-6" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                Easy payment status management
              </h2>
              <p className="text-lg mb-8" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                Track when clients view invoices and manually mark payments as received. Get clear visibility into payment status and overdue amounts.
              </p>
              <a href="#" className="text-indigo-600 hover:text-indigo-500 font-semibold">
                Manage payments →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 px-4 sm:px-6 lg:px-8" style={{backgroundColor: isDarkMode ? '#111111' : '#f8f9fa'}}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
              Simple Pricing
            </h2>
            <p className="text-xl" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
              Choose the plan that works for your business
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <div className={`p-8 rounded-lg border transition-all duration-200 hover:scale-[1.02] flex flex-col ${
              isDarkMode 
                ? 'bg-gray-800/50 border-gray-700 hover:border-gray-600' 
                : 'bg-white border-gray-200 hover:border-gray-300'
            } backdrop-blur-sm`}>
              <div className="text-center mb-8">
                <h3 className="font-heading text-2xl font-semibold mb-2" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>Free</h3>
                <div className="text-4xl font-bold mb-2" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>$0</div>
                <p className="text-sm" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>Perfect for getting started</p>
              </div>
              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>Up to 5 invoices per month</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>Basic templates</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>1 client only</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>Email support</span>
                </li>
              </ul>
              <button
                onClick={handleGetStarted}
                className={`w-full py-3 rounded-lg font-medium transition-colors ${
                  isDarkMode 
                    ? 'bg-white text-black hover:bg-gray-200' 
                    : 'bg-black text-white hover:bg-gray-800'
                }`}
              >
                Get Started Free
              </button>
            </div>

            {/* Pay Per Invoice Plan */}
            <div className={`p-8 rounded-lg border transition-all duration-200 hover:scale-[1.02] flex flex-col ${
              isDarkMode 
                ? 'bg-gray-800/50 border-gray-700 hover:border-gray-600' 
                : 'bg-white border-gray-200 hover:border-gray-300'
            } backdrop-blur-sm`}>
              <div className="text-center mb-8">
                <h3 className="font-heading text-2xl font-semibold mb-2" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>Pay Per Invoice</h3>
                <div className="text-4xl font-bold mb-2" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>$2</div>
                <p className="text-sm" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>per invoice sent</p>
              </div>
              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>Pay only when you send</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>All professional templates</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>1 client only</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>Basic automated reminders</span>
                </li>
              </ul>
              <button
                onClick={handleGetStarted}
                className={`w-full py-3 rounded-lg font-medium transition-colors ${
                  isDarkMode 
                    ? 'bg-white text-black hover:bg-gray-200' 
                    : 'bg-black text-white hover:bg-gray-800'
                }`}
              >
                Start Paying Per Invoice
              </button>
            </div>

            {/* Pro Plan */}
            <div className={`p-8 rounded-lg border-2 border-indigo-600 relative transition-all duration-200 hover:scale-[1.02] flex flex-col ${
              isDarkMode 
                ? 'bg-gray-800/50' 
                : 'bg-white'
            } backdrop-blur-sm`}>
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-semibold">Most Popular</span>
              </div>
              <div className="text-center mb-8">
                <h3 className="font-heading text-2xl font-semibold mb-2" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>Pro</h3>
                <div className="text-4xl font-bold mb-2" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>$19</div>
                <p className="text-sm" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>per month</p>
              </div>
              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>Unlimited invoices</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>Unlimited clients</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>All professional templates</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>Advanced automated reminders</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>Priority support</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>Analytics dashboard</span>
                </li>
              </ul>
              <button
                onClick={handleGetStarted}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium transition-colors"
              >
                Start Pro Trial
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8" style={{backgroundColor: isDarkMode ? '#0d1117' : '#ffffff'}}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
              Frequently Asked Questions
            </h2>
            <p className="text-lg" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
              Everything you need to know about InvoiceFlow
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className={`sticky top-8 space-y-2 ${
                isDarkMode 
                  ? 'bg-gray-800/50 border-gray-700' 
                  : 'bg-white border-gray-200'
              } rounded-lg border p-4 backdrop-blur-sm`}>
                <button 
                  onClick={() => setActiveFaqCategory('General')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeFaqCategory === 'General'
                      ? (isDarkMode 
                          ? 'bg-gray-700 text-white' 
                          : 'bg-gray-100 text-gray-900')
                      : (isDarkMode 
                          ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100')
                  }`}
                >
                  General
                </button>
                <button 
                  onClick={() => setActiveFaqCategory('Plans & Pricing')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeFaqCategory === 'Plans & Pricing'
                      ? (isDarkMode 
                          ? 'bg-gray-700 text-white' 
                          : 'bg-gray-100 text-gray-900')
                      : (isDarkMode 
                          ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100')
                  }`}
                >
                  Plans & Pricing
                </button>
                <button 
                  onClick={() => setActiveFaqCategory('Features')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeFaqCategory === 'Features'
                      ? (isDarkMode 
                          ? 'bg-gray-700 text-white' 
                          : 'bg-gray-100 text-gray-900')
                      : (isDarkMode 
                          ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100')
                  }`}
                >
                  Features
                </button>
                <button 
                  onClick={() => setActiveFaqCategory('Security')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeFaqCategory === 'Security'
                      ? (isDarkMode 
                          ? 'bg-gray-700 text-white' 
                          : 'bg-gray-100 text-gray-900')
                      : (isDarkMode 
                          ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100')
                  }`}
                >
                  Security
                </button>
              </div>
            </div>

            {/* FAQ Content */}
            <div className="lg:col-span-3">
              <div className="space-y-4">
                {/* General Category Questions */}
                {activeFaqCategory === 'General' && (
                  <div className="space-y-4">
                    <div className={`rounded-lg border transition-all duration-200 ${
                      isDarkMode 
                        ? 'bg-gray-800/50 border-gray-700 hover:border-gray-600' 
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    } backdrop-blur-sm`}>
                      <button className="w-full px-6 py-4 text-left flex items-center justify-between">
                        <h3 className="font-heading text-lg font-semibold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                          What is InvoiceFlow?
                        </h3>
                        <span className="text-2xl font-light" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>+</span>
                      </button>
                      <div className="px-6 pb-4">
                        <p className="text-sm leading-relaxed" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                          InvoiceFlow is a professional invoicing platform designed for freelancers, designers, and contractors. Create beautiful invoices, send automated reminders, and get paid faster with our streamlined workflow.
                        </p>
                      </div>
                    </div>

                    <div className={`rounded-lg border transition-all duration-200 ${
                      isDarkMode 
                        ? 'bg-gray-800/50 border-gray-700 hover:border-gray-600' 
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    } backdrop-blur-sm`}>
                      <button className="w-full px-6 py-4 text-left flex items-center justify-between">
                        <h3 className="font-heading text-lg font-semibold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                          Who can use InvoiceFlow?
                        </h3>
                        <span className="text-2xl font-light" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>+</span>
                      </button>
                      <div className="px-6 pb-4">
                        <p className="text-sm leading-relaxed" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                          InvoiceFlow is perfect for freelancers, designers, contractors, consultants, agencies, and any business that needs to send professional invoices. Whether you&apos;re just starting out or managing hundreds of clients.
                        </p>
                      </div>
                    </div>

                    <div className={`rounded-lg border transition-all duration-200 ${
                      isDarkMode 
                        ? 'bg-gray-800/50 border-gray-700 hover:border-gray-600' 
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    } backdrop-blur-sm`}>
                      <button className="w-full px-6 py-4 text-left flex items-center justify-between">
                        <h3 className="font-heading text-lg font-semibold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                          How do I get started?
                        </h3>
                        <span className="text-2xl font-light" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>+</span>
                      </button>
                      <div className="px-6 pb-4">
                        <p className="text-sm leading-relaxed" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                          Simply sign up for a free account, add your business information, and start creating your first invoice. No credit card required for the free plan. You can upgrade anytime when you need more features.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Plans & Pricing Category Questions */}
                {activeFaqCategory === 'Plans & Pricing' && (
                  <div className="space-y-4">
                    <div className={`rounded-lg border transition-all duration-200 ${
                      isDarkMode 
                        ? 'bg-gray-800/50 border-gray-700 hover:border-gray-600' 
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    } backdrop-blur-sm`}>
                      <button className="w-full px-6 py-4 text-left flex items-center justify-between">
                        <h3 className="font-heading text-lg font-semibold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                          How does the free plan work?
                        </h3>
                        <span className="text-2xl font-light" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>+</span>
                      </button>
                      <div className="px-6 pb-4">
                        <p className="text-sm leading-relaxed" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                          The free plan allows you to create up to 5 invoices per month with basic templates. Perfect for freelancers just getting started. You can upgrade anytime when you need more features.
                        </p>
                      </div>
                    </div>

                    <div className={`rounded-lg border transition-all duration-200 ${
                      isDarkMode 
                        ? 'bg-gray-800/50 border-gray-700 hover:border-gray-600' 
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    } backdrop-blur-sm`}>
                      <button className="w-full px-6 py-4 text-left flex items-center justify-between">
                        <h3 className="font-heading text-lg font-semibold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                          What&apos;s the difference between Pay Per Invoice and Pro?
                        </h3>
                        <span className="text-2xl font-light" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>+</span>
                      </button>
                      <div className="px-6 pb-4">
                        <p className="text-sm leading-relaxed" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                          Pay Per Invoice is perfect if you send invoices occasionally - you only pay $2 when you actually send an invoice. Pro is better for regular users with unlimited invoices and clients for $19/month.
                        </p>
                      </div>
                    </div>

                    <div className={`rounded-lg border transition-all duration-200 ${
                      isDarkMode 
                        ? 'bg-gray-800/50 border-gray-700 hover:border-gray-600' 
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    } backdrop-blur-sm`}>
                      <button className="w-full px-6 py-4 text-left flex items-center justify-between">
                        <h3 className="font-heading text-lg font-semibold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                          Can I cancel anytime?
                        </h3>
                        <span className="text-2xl font-light" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>+</span>
                      </button>
                      <div className="px-6 pb-4">
                        <p className="text-sm leading-relaxed" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                          Yes, you can cancel your subscription anytime with no cancellation fees. Your data remains accessible for 30 days after cancellation. You can always reactivate your account if you change your mind.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Features Category Questions */}
                {activeFaqCategory === 'Features' && (
                  <div className="space-y-4">
                    <div className={`rounded-lg border transition-all duration-200 ${
                      isDarkMode 
                        ? 'bg-gray-800/50 border-gray-700 hover:border-gray-600' 
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    } backdrop-blur-sm`}>
                      <button className="w-full px-6 py-4 text-left flex items-center justify-between">
                        <h3 className="font-heading text-lg font-semibold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                          How do automated reminders work?
                        </h3>
                        <span className="text-2xl font-light" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>+</span>
                      </button>
                      <div className="px-6 pb-4">
                        <p className="text-sm leading-relaxed" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                          You can set up custom reminder schedules for each invoice. Choose from friendly, polite, firm, or urgent reminder types. Set reminders before due dates or after overdue periods to maximize your chances of getting paid.
                        </p>
                      </div>
                    </div>

                    <div className={`rounded-lg border transition-all duration-200 ${
                      isDarkMode 
                        ? 'bg-gray-800/50 border-gray-700 hover:border-gray-600' 
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    } backdrop-blur-sm`}>
                      <button className="w-full px-6 py-4 text-left flex items-center justify-between">
                        <h3 className="font-heading text-lg font-semibold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                          Can I customize invoice templates?
                        </h3>
                        <span className="text-2xl font-light" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>+</span>
                      </button>
                      <div className="px-6 pb-4">
                        <p className="text-sm leading-relaxed" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                          Yes! All plans include professional templates that you can customize with your branding, colors, and company information. Pro users get access to all premium templates and advanced customization options.
                        </p>
                      </div>
                    </div>

                    <div className={`rounded-lg border transition-all duration-200 ${
                      isDarkMode 
                        ? 'bg-gray-800/50 border-gray-700 hover:border-gray-600' 
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    } backdrop-blur-sm`}>
                      <button className="w-full px-6 py-4 text-left flex items-center justify-between">
                        <h3 className="font-heading text-lg font-semibold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                          What payment methods do you support?
                        </h3>
                        <span className="text-2xl font-light" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>+</span>
                      </button>
                      <div className="px-6 pb-4">
                        <p className="text-sm leading-relaxed" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                          Clients can pay through their preferred methods like PayPal, Venmo, bank transfers, or checks. You track payment status manually and mark invoices as paid when you receive payment.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Security Category Questions */}
                {activeFaqCategory === 'Security' && (
                  <div className="space-y-4">
                    <div className={`rounded-lg border transition-all duration-200 ${
                      isDarkMode 
                        ? 'bg-gray-800/50 border-gray-700 hover:border-gray-600' 
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    } backdrop-blur-sm`}>
                      <button className="w-full px-6 py-4 text-left flex items-center justify-between">
                        <h3 className="font-heading text-lg font-semibold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                          Is my data secure?
                        </h3>
                        <span className="text-2xl font-light" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>+</span>
                      </button>
                      <div className="px-6 pb-4">
                        <p className="text-sm leading-relaxed" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                          Absolutely. We use enterprise-grade security with encrypted data storage and transmission. Your client information and business data are never shared with third parties. We&apos;re fully GDPR compliant.
                        </p>
                      </div>
                    </div>

                    <div className={`rounded-lg border transition-all duration-200 ${
                      isDarkMode 
                        ? 'bg-gray-800/50 border-gray-700 hover:border-gray-600' 
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    } backdrop-blur-sm`}>
                      <button className="w-full px-6 py-4 text-left flex items-center justify-between">
                        <h3 className="font-heading text-lg font-semibold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                          Where is my data stored?
                        </h3>
                        <span className="text-2xl font-light" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>+</span>
                      </button>
                      <div className="px-6 pb-4">
                        <p className="text-sm leading-relaxed" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                          Your data is stored on secure, encrypted servers with 99.9% uptime. We use industry-standard security practices and regular backups to ensure your information is always safe and accessible.
                        </p>
                      </div>
                    </div>

                    <div className={`rounded-lg border transition-all duration-200 ${
                      isDarkMode 
                        ? 'bg-gray-800/50 border-gray-700 hover:border-gray-600' 
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    } backdrop-blur-sm`}>
                      <button className="w-full px-6 py-4 text-left flex items-center justify-between">
                        <h3 className="font-heading text-lg font-semibold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                          Can I export my data?
                        </h3>
                        <span className="text-2xl font-light" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>+</span>
                      </button>
                      <div className="px-6 pb-4">
                        <p className="text-sm leading-relaxed" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                          Yes, you can export all your invoices, client data, and business information at any time. We provide CSV and PDF export options so you always have access to your data.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-6" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
            Ready to Get Paid Faster?
          </h2>
          <p className="text-xl mb-8" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
            Join thousands of freelancers who are already getting paid faster with InvoiceFlow.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleGetStarted}
              className={`px-8 py-4 rounded-lg text-lg font-medium transition-colors ${
                isDarkMode 
                  ? 'bg-white text-black hover:bg-gray-200' 
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              Start Creating Invoices
            </button>
            <button
              onClick={handleViewDemo}
              className={`px-8 py-4 rounded-lg text-lg font-medium transition-colors border ${
                isDarkMode 
                  ? 'border-gray-700 text-gray-300 hover:bg-gray-800' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              View Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-12 px-4 sm:px-6 lg:px-8 border-t ${
        isDarkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="w-40 h-10 sm:w-44 sm:h-11 lg:w-52 lg:h-13 relative">
                  <Image
                    src={isDarkMode ? '/logo-main-white.png' : '/logo-main-black.png'}
                    alt="InvoiceFlow Logo"
                    width={208}
                    height={52}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <p style={{color: isDarkMode ? '#9ca3af' : '#6b7280'}}>
                The fastest way for freelancers to get paid.
              </p>
            </div>
            <div>
              <h3 className="font-heading text-lg font-semibold mb-4" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>Product</h3>
              <ul className="space-y-2" style={{color: isDarkMode ? '#9ca3af' : '#6b7280'}}>
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Templates</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-heading text-lg font-semibold mb-4" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>Support</h3>
              <ul className="space-y-2" style={{color: isDarkMode ? '#9ca3af' : '#6b7280'}}>
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-heading text-lg font-semibold mb-4" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>Company</h3>
              <ul className="space-y-2" style={{color: isDarkMode ? '#9ca3af' : '#6b7280'}}>
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>
          <div className={`border-t mt-8 pt-8 text-center ${
            isDarkMode ? 'border-gray-800' : 'border-gray-200'
          }`} style={{color: isDarkMode ? '#9ca3af' : '#6b7280'}}>
            <p>&copy; 2024 InvoiceFlow. All rights reserved.</p>
      </div>
        </div>
      </footer>
    </div>
  );
}