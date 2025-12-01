'use client';

import { useState, useEffect, useRef } from 'react';
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
  Users,
  Send,
  Clock,
  DollarSign,
  Server,
  Eye,
  AlertTriangle,
  CreditCard,
  Building2,
  Calendar,
  X,
  Plus,
  Receipt,
  Timer,
  Download,
  Palette,
  Check,
  Edit,
  Mail,
  Search,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import Image from 'next/image';
import Footer from '@/components/Footer';

export default function LandingPage() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [activeFaqCategory, setActiveFaqCategory] = useState('General');
  const heroRef = useRef<HTMLDivElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);




  const handleGetStarted = () => {
    router.push('/auth');
  };

  const handleViewDemo = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen transition-colors duration-200 bg-white">
      {/* Hero Section */}
      <section className="pt-12 sm:pt-16 lg:pt-20 pb-12 sm:pb-16 lg:pb-20 px-4 sm:px-6 lg:px-8 relative bg-white" ref={heroRef}>
        <div className="max-w-7xl mx-auto">
          {/* Hero Content */}
          <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16">
            <h1 ref={headingRef} className="text-3xl sm:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 text-gray-900 tracking-tight">
                Create invoices in seconds.<br className="hidden sm:block" /> Get <span className="text-[#a855f7]">paid</span> faster.
              </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed">
              Professional invoicing for freelancers and small businesses. No fees, no hassle.
              </p>
              
              {/* CTA Buttons */}
            <div className="flex flex-row gap-2 sm:gap-3 justify-center mb-8 sm:mb-12">
                <button
                  onClick={handleGetStarted}
                className="inline-flex items-center justify-center px-4 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-colors"
                >
                Get started free
                <ArrowRight className="ml-2 w-4 h-4" />
                </button>
                <button
                  onClick={handleViewDemo}
                className="inline-flex items-center justify-center px-4 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                View demo
                </button>
              </div>

              {/* User Profiles Section - Social Proof */}
              <div className="flex flex-col items-center justify-center text-center mb-8 sm:mb-12">
                {/* Minimal Avatar Stack */}
                <div className="flex items-center justify-center gap-3 mb-3">
                  <div className="flex -space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 border border-gray-300"></div>
                    <div className="w-8 h-8 rounded-full bg-gray-300 border border-gray-300"></div>
                    <div className="w-8 h-8 rounded-full bg-gray-400 border border-gray-300"></div>
                    <div className="w-8 h-8 rounded-full bg-gray-500 border border-gray-300"></div>
                    <div className="w-8 h-8 rounded-full bg-gray-600 border border-gray-300"></div>
            </div>
          </div>
                
                {/* Minimal Stats */}
                <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
                  <span><span className="font-medium text-gray-900">1,000+</span> users</span>
                  <span className="text-gray-300">•</span>
                  <span><span className="font-medium text-gray-900">10K+</span> invoices</span>
        </div>
              </div>
            </div>
          
          {/* Dashboard Screenshot */}
          <div className="relative max-w-6xl mx-auto">
            {/* Glow effect layers - Purple theme */}
            <div className="absolute inset-0 rounded-2xl opacity-30 blur-3xl" style={{
              background: 'radial-gradient(ellipse at center, #a855f7, #9333ea, #7c3aed)',
                transform: 'scale(1.1)',
              zIndex: 0
              }}></div>
            <div className="absolute inset-0 rounded-2xl opacity-20 blur-2xl" style={{
              background: 'radial-gradient(ellipse at 30% 70%, #a855f7, #9333ea)',
                transform: 'scale(1.05)',
              zIndex: 1
              }}></div>
              
            {/* Desktop Image */}
            <div className="relative z-10 rounded-lg overflow-hidden border border-gray-200 shadow-2xl bg-white hidden md:block">
              <img
                src="/dashboard-screenshot.png?v=2"
                alt="FlowInvoicer Dashboard"
                className="w-full h-auto block"
                style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
                loading="eager"
                decoding="async"
                key="dashboard-screenshot"
              />
            </div>
            
            {/* Mobile Image */}
            <div className="relative z-10 rounded-lg overflow-hidden border border-gray-200 shadow-2xl bg-white block md:hidden">
              <img
                src="/dashboard-screenshot-mobile.png"
                alt="FlowInvoicer Dashboard"
                className="w-full h-auto block"
                style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
                loading="eager"
                decoding="async"
                key="dashboard-screenshot-mobile"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
                <h2 className="font-heading text-3xl sm:text-5xl font-bold mb-6 text-gray-900">
              Everything you need to get paid
                </h2>
            <p className="text-lg max-w-2xl mx-auto text-gray-600">
              Professional invoicing tools designed for freelancers, designers, and contractors.
                </p>
            </div>

          {/* Features Grid */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-8">
            {/* Feature 1 - Professional Templates */}
            <div className="group p-4 sm:p-6 lg:p-8 rounded-lg border border-gray-200 bg-white hover:border-gray-300 hover:shadow-md transition-all duration-200">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-3 sm:mb-5 transition-transform duration-200 group-hover:scale-105" style={{
                backgroundColor: '#f8f9fa',
                border: '1px solid #e5e7eb'
              }}>
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                </div>
              <h3 className="font-heading text-base sm:text-xl font-bold mb-2 sm:mb-3 text-gray-900">
                Professional Templates
                  </h3>
              <p className="text-xs sm:text-sm leading-relaxed text-gray-600">
                Choose from multiple professional invoice templates. Customize colors, fonts, and layout to match your brand.
                  </p>
              </div>
              
            {/* Feature 2 - Client Management */}
            <div className="group p-4 sm:p-6 lg:p-8 rounded-lg border border-gray-200 bg-white hover:border-gray-300 hover:shadow-md transition-all duration-200">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-3 sm:mb-5 transition-transform duration-200 group-hover:scale-105" style={{
                backgroundColor: '#f8f9fa',
                border: '1px solid #e5e7eb'
              }}>
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                </div>
              <h3 className="font-heading text-base sm:text-xl font-bold mb-2 sm:mb-3 text-gray-900">
                Client Management
                  </h3>
              <p className="text-xs sm:text-sm leading-relaxed text-gray-600">
                Store client information, payment history, and communication logs. Never lose track of important details.
                  </p>
              </div>
              
            {/* Feature 3 - Payment Tracking */}
            <div className="group p-4 sm:p-6 lg:p-8 rounded-lg border border-gray-200 bg-white hover:border-gray-300 hover:shadow-md transition-all duration-200">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-3 sm:mb-5 transition-transform duration-200 group-hover:scale-105" style={{
                backgroundColor: '#f8f9fa',
                border: '1px solid #e5e7eb'
              }}>
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                </div>
              <h3 className="font-heading text-base sm:text-xl font-bold mb-2 sm:mb-3 text-gray-900">
                Payment Tracking
                  </h3>
              <p className="text-xs sm:text-sm leading-relaxed text-gray-600">
                Track when clients view invoices and manually mark payments as received. Get clear visibility into payment status.
                  </p>
                </div>

            {/* Feature 4 - Automated Reminders */}
            <div className="group p-4 sm:p-6 lg:p-8 rounded-lg border border-gray-200 bg-white hover:border-gray-300 hover:shadow-md transition-all duration-200">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-3 sm:mb-5 transition-transform duration-200 group-hover:scale-105" style={{
                backgroundColor: '#f8f9fa',
                border: '1px solid #e5e7eb'
              }}>
                <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
              </div>
              <h3 className="font-heading text-base sm:text-xl font-bold mb-2 sm:mb-3 text-gray-900">
                Automated Reminders
              </h3>
              <p className="text-xs sm:text-sm leading-relaxed text-gray-600">
                Set up custom reminder schedules for each invoice. Choose from friendly, polite, firm, or urgent reminder types.
              </p>
            </div>

            {/* Feature 5 - Late Fees */}
            <div className="group p-4 sm:p-6 lg:p-8 rounded-lg border border-gray-200 bg-white hover:border-gray-300 hover:shadow-md transition-all duration-200">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-3 sm:mb-5 transition-transform duration-200 group-hover:scale-105" style={{
                backgroundColor: '#f8f9fa',
                border: '1px solid #e5e7eb'
              }}>
                <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                </div>
              <h3 className="font-heading text-base sm:text-xl font-bold mb-2 sm:mb-3 text-gray-900">
                Late Fee Management
                  </h3>
              <p className="text-xs sm:text-sm leading-relaxed text-gray-600">
                Automatically calculate and apply late fees. Set fixed amounts or percentages with grace periods.
            </p>
          </div>

            {/* Feature 6 - Multiple Payment Methods */}
            <div className="group p-4 sm:p-6 lg:p-8 rounded-lg border border-gray-200 bg-white hover:border-gray-300 hover:shadow-md transition-all duration-200">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-3 sm:mb-5 transition-transform duration-200 group-hover:scale-105" style={{
                backgroundColor: '#f8f9fa',
                border: '1px solid #e5e7eb'
              }}>
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
              </div>
              <h3 className="font-heading text-base sm:text-xl font-bold mb-2 sm:mb-3 text-gray-900">
                Multiple Payment Methods
              </h3>
              <p className="text-xs sm:text-sm leading-relaxed text-gray-600">
                Support PayPal, Stripe, Cash App, Venmo, Google Pay, Apple Pay, and bank transfers.
              </p>
            </div>

            {/* Feature 7 - PDF Generation */}
            <div className="group p-4 sm:p-6 lg:p-8 rounded-lg border border-gray-200 bg-white hover:border-gray-300 hover:shadow-md transition-all duration-200">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-3 sm:mb-5 transition-transform duration-200 group-hover:scale-105" style={{
                backgroundColor: '#f8f9fa',
                border: '1px solid #e5e7eb'
              }}>
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
              </div>
              <h3 className="font-heading text-base sm:text-xl font-bold mb-2 sm:mb-3 text-gray-900">
                PDF Generation
              </h3>
              <p className="text-xs sm:text-sm leading-relaxed text-gray-600">
                Generate professional PDF invoices instantly. Download and share with clients or print for your records.
              </p>
            </div>

            {/* Feature 8 - Analytics Dashboard */}
            <div className="group p-4 sm:p-6 lg:p-8 rounded-lg border border-gray-200 bg-white hover:border-gray-300 hover:shadow-md transition-all duration-200">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-3 sm:mb-5 transition-transform duration-200 group-hover:scale-105" style={{
                backgroundColor: '#f8f9fa',
                border: '1px solid #e5e7eb'
              }}>
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
              </div>
              <h3 className="font-heading text-base sm:text-xl font-bold mb-2 sm:mb-3 text-gray-900">
                Analytics Dashboard
              </h3>
              <p className="text-xs sm:text-sm leading-relaxed text-gray-600">
                Track revenue, pending payments, overdue invoices, and late fees. Get insights into your business performance.
              </p>
            </div>

            {/* Feature 9 - Secure & Reliable */}
            <div className="group p-4 sm:p-6 lg:p-8 rounded-lg border border-gray-200 bg-white hover:border-gray-300 hover:shadow-md transition-all duration-200">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-3 sm:mb-5 transition-transform duration-200 group-hover:scale-105" style={{
                backgroundColor: '#f8f9fa',
                border: '1px solid #e5e7eb'
              }}>
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
              </div>
              <h3 className="font-heading text-base sm:text-xl font-bold mb-2 sm:mb-3 text-gray-900">
                Secure & Reliable
              </h3>
              <p className="text-xs sm:text-sm leading-relaxed text-gray-600">
                Enterprise-grade security with encrypted data storage and transmission. Your data is never shared with third parties.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold mb-4 text-gray-900">
              How it works
            </h2>
          </div>

          {/* Step 1 - Create Invoice */}
          <div className="mb-12 sm:mb-16 lg:mb-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              {/* Visual Background */}
              <div className="order-2 lg:order-1">
                <div className="relative max-w-md mx-auto">
                  {/* Background glow effect - one side only with purple theme color */}
                  <div className="absolute bottom-0 right-0 w-1/2 h-1/2 rounded-2xl opacity-50 blur-3xl" style={{
                    background: 'radial-gradient(ellipse at bottom right, #a855f7, #9333ea, #7c3aed, transparent)',
                    zIndex: 0
                  }}></div>
                  <div className="absolute bottom-0 right-0 w-1/3 h-1/3 rounded-2xl opacity-40 blur-2xl" style={{
                    background: 'radial-gradient(ellipse at bottom right, #a855f7, #9333ea, transparent)',
                    zIndex: 0
                  }}></div>
                  
                  {/* Image container matching hero style */}
                  <div className="relative z-10 rounded-lg overflow-hidden shadow-2xl">
                    <img
                      src="/how-it-works-create-invoice.png"
                      alt="Create Invoice"
                      className="w-full h-auto block"
                    />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="order-1 lg:order-2">
                <h3 className="text-xl sm:text-3xl font-bold mb-4 text-gray-900">
                  Create Invoice
                </h3>
                <p className="text-base text-gray-600 leading-relaxed">
                  Select your client, add line items, and choose a template. Your invoice is ready in seconds.
                </p>
              </div>
            </div>
          </div>

          {/* Step 2 - Send Automatically */}
          <div className="mb-12 sm:mb-16 lg:mb-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              {/* Content */}
              <div>
                <h3 className="text-xl sm:text-3xl font-bold mb-4 text-gray-900">
                  Send Automatically
                </h3>
                <p className="text-base text-gray-600 leading-relaxed">
                  Your invoice is sent via email with a PDF attachment. No manual work required.
              </p>
            </div>

              {/* Visual Background */}
              <div>
                <div className="relative max-w-md mx-auto">
                  {/* Background glow effect - one side only with purple theme color */}
                  <div className="absolute bottom-0 right-0 w-1/2 h-1/2 rounded-2xl opacity-50 blur-3xl" style={{
                    background: 'radial-gradient(ellipse at bottom right, #a855f7, #9333ea, #7c3aed, transparent)',
                    zIndex: 0
                  }}></div>
                  <div className="absolute bottom-0 right-0 w-1/3 h-1/3 rounded-2xl opacity-40 blur-2xl" style={{
                    background: 'radial-gradient(ellipse at bottom right, #a855f7, #9333ea, transparent)',
                    zIndex: 0
                  }}></div>
                  
                  {/* Image container matching hero style */}
                  <div className="relative z-10 rounded-lg overflow-hidden shadow-2xl">
                    <img
                      src="/how-it-works-send-automatically.png"
                      alt="Send Automatically"
                      className="w-full h-auto block"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 - Track & Remind */}
          <div className="mb-12 sm:mb-16 lg:mb-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              {/* Visual Background */}
              <div className="order-2 lg:order-1">
                <div className="relative max-w-md mx-auto">
                  {/* Background glow effect - one side only with purple theme color */}
                  <div className="absolute bottom-0 right-0 w-1/2 h-1/2 rounded-2xl opacity-50 blur-3xl" style={{
                    background: 'radial-gradient(ellipse at bottom right, #a855f7, #9333ea, #7c3aed, transparent)',
                    zIndex: 0
                  }}></div>
                  <div className="absolute bottom-0 right-0 w-1/3 h-1/3 rounded-2xl opacity-40 blur-2xl" style={{
                    background: 'radial-gradient(ellipse at bottom right, #a855f7, #9333ea, transparent)',
                    zIndex: 0
                  }}></div>
                  
                  {/* Image container matching hero style */}
                  <div className="relative z-10 rounded-lg overflow-hidden shadow-2xl">
                    <img
                      src="/how-it-works-track-remind.png"
                      alt="Track & Remind"
                      className="w-full h-auto block"
                    />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="order-1 lg:order-2">
                <h3 className="text-xl sm:text-3xl font-bold mb-4 text-gray-900">
                  Track & Remind
                </h3>
                <p className="text-base text-gray-600 leading-relaxed">
                  See when clients view your invoices. Automated reminders are sent based on your schedule.
                </p>
              </div>
            </div>
          </div>

          {/* Step 4 - Get Paid */}
          <div className="mb-12 sm:mb-16 lg:mb-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              {/* Content */}
              <div>
                <h3 className="text-xl sm:text-3xl font-bold mb-4 text-gray-900">
                  Get Paid Faster
                </h3>
                <p className="text-base text-gray-600 leading-relaxed mb-6">
                  Clients pay through their preferred method. Payments go directly to your account — no fees, no hidden charges.
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-900 mb-1">Save on Payment Fees</p>
                      <p className="text-xs text-amber-800 leading-relaxed">
                        Other invoicing tools charge per transaction (2-3%) AND additional fees when money is transferred. 
                        With FlowInvoicer, clients pay you directly — no double fees, no hidden charges.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visual Background */}
              <div>
                <div className="relative max-w-md mx-auto">
                  {/* Background glow effect - one side only with purple theme color */}
                  <div className="absolute bottom-0 right-0 w-1/2 h-1/2 rounded-2xl opacity-50 blur-3xl" style={{
                    background: 'radial-gradient(ellipse at bottom right, #a855f7, #9333ea, #7c3aed, transparent)',
                    zIndex: 0
                  }}></div>
                  <div className="absolute bottom-0 right-0 w-1/3 h-1/3 rounded-2xl opacity-40 blur-2xl" style={{
                    background: 'radial-gradient(ellipse at bottom right, #a855f7, #9333ea, transparent)',
                    zIndex: 0
                  }}></div>
                  
                  {/* Image container matching hero style */}
                  <div className="relative z-10 rounded-lg overflow-hidden shadow-2xl">
                    <img
                      src="/how-it-works-get-paid.png"
                      alt="Get Paid Faster"
                      className="w-full h-auto block"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 5 - Professional Templates */}
          <div className="mb-12 sm:mb-16 lg:mb-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              {/* Visual Background */}
              <div className="order-2 lg:order-1">
                <div className="relative max-w-md mx-auto">
                  {/* Background glow effect - one side only with purple theme color */}
                  <div className="absolute bottom-0 right-0 w-1/2 h-1/2 rounded-2xl opacity-50 blur-3xl" style={{
                    background: 'radial-gradient(ellipse at bottom right, #a855f7, #9333ea, #7c3aed, transparent)',
                    zIndex: 0
                  }}></div>
                  <div className="absolute bottom-0 right-0 w-1/3 h-1/3 rounded-2xl opacity-40 blur-2xl" style={{
                    background: 'radial-gradient(ellipse at bottom right, #a855f7, #9333ea, transparent)',
                    zIndex: 0
                  }}></div>
                  
                  {/* Image container matching hero style */}
                  <div className="relative z-10 rounded-lg overflow-hidden shadow-2xl">
                    <img
                      src="/how-it-works-templates.png"
                      alt="Professional Templates"
                      className="w-full h-auto block"
                    />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="order-1 lg:order-2">
                <h3 className="text-xl sm:text-3xl font-bold mb-4 text-gray-900">
                  Professional Templates
                </h3>
                <p className="text-base text-gray-600 leading-relaxed">
                  Choose from multiple professional invoice templates. Customize colors, fonts, and layout to match your brand.
                </p>
              </div>
            </div>
          </div>

          {/* Step 6 - Client Management */}
          <div className="mb-12 sm:mb-16 lg:mb-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              {/* Content */}
              <div>
                <h3 className="text-xl sm:text-3xl font-bold mb-4 text-gray-900">
                  Client Management
                </h3>
                <p className="text-base text-gray-600 leading-relaxed">
                  Store client information, payment history, and communication logs. Never lose track of important details.
                </p>
              </div>

              {/* Visual Background */}
              <div>
                <div className="relative max-w-md mx-auto">
                  {/* Background glow effect - one side only with purple theme color */}
                  <div className="absolute bottom-0 right-0 w-1/2 h-1/2 rounded-2xl opacity-50 blur-3xl" style={{
                    background: 'radial-gradient(ellipse at bottom right, #a855f7, #9333ea, #7c3aed, transparent)',
                    zIndex: 0
                  }}></div>
                  <div className="absolute bottom-0 right-0 w-1/3 h-1/3 rounded-2xl opacity-40 blur-2xl" style={{
                    background: 'radial-gradient(ellipse at bottom right, #a855f7, #9333ea, transparent)',
                    zIndex: 0
                  }}></div>
                  
                  {/* Image container matching hero style */}
                  <div className="relative z-10 rounded-lg overflow-hidden shadow-2xl">
                    <img
                      src="/how-it-works-client-management.png"
                      alt="Client Management"
                      className="w-full h-auto block"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 7 - Automated Reminders */}
          <div className="mb-12 sm:mb-16 lg:mb-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              {/* Visual Background */}
              <div className="order-2 lg:order-1">
                <div className="relative max-w-md mx-auto">
                  {/* Background glow effect - one side only with purple theme color */}
                  <div className="absolute bottom-0 right-0 w-1/2 h-1/2 rounded-2xl opacity-50 blur-3xl" style={{
                    background: 'radial-gradient(ellipse at bottom right, #a855f7, #9333ea, #7c3aed, transparent)',
                    zIndex: 0
                  }}></div>
                  <div className="absolute bottom-0 right-0 w-1/3 h-1/3 rounded-2xl opacity-40 blur-2xl" style={{
                    background: 'radial-gradient(ellipse at bottom right, #a855f7, #9333ea, transparent)',
                    zIndex: 0
                  }}></div>
                  
                  {/* Image container matching hero style */}
                  <div className="relative z-10 rounded-lg overflow-hidden shadow-2xl">
                    <img
                      src="/how-it-works-reminders.png"
                      alt="Automated Reminders"
                      className="w-full h-auto block"
                    />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="order-1 lg:order-2">
                <h3 className="text-xl sm:text-3xl font-bold mb-4 text-gray-900">
                Automated Reminders
              </h3>
                <p className="text-base text-gray-600 leading-relaxed">
                  Automatically send friendly, polite, and urgent reminders based on your schedule. Never chase payments manually.
              </p>
              </div>
            </div>
            </div>

          {/* Step 8 - Late Fee Management */}
          <div className="mb-12 sm:mb-16 lg:mb-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              {/* Content */}
              <div>
                <h3 className="text-xl sm:text-3xl font-bold mb-4 text-gray-900">
                  Late Fee Management
                </h3>
                <p className="text-base text-gray-600 leading-relaxed">
                  Automatically calculate and apply late fees. Set fixed amounts or percentages with grace periods.
                </p>
              </div>

              {/* Visual Background */}
              <div>
                <div className="relative max-w-md mx-auto">
                  {/* Background glow effect - one side only with purple theme color */}
                  <div className="absolute bottom-0 right-0 w-1/2 h-1/2 rounded-2xl opacity-50 blur-3xl" style={{
                    background: 'radial-gradient(ellipse at bottom right, #a855f7, #9333ea, #7c3aed, transparent)',
                    zIndex: 0
                  }}></div>
                  <div className="absolute bottom-0 right-0 w-1/3 h-1/3 rounded-2xl opacity-40 blur-2xl" style={{
                    background: 'radial-gradient(ellipse at bottom right, #a855f7, #9333ea, transparent)',
                    zIndex: 0
                  }}></div>
                  
                  {/* Image container matching hero style */}
                  <div className="relative z-10 rounded-lg overflow-hidden shadow-2xl">
                    <img
                      src="/how-it-works-late-fees.png"
                      alt="Late Fee Management"
                      className="w-full h-auto block"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 9 - PDF Generation */}
          <div className="mb-12 sm:mb-16 lg:mb-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              {/* Visual Background */}
              <div className="order-2 lg:order-1">
                <div className="relative max-w-md mx-auto">
                  {/* Background glow effect - one side only with purple theme color */}
                  <div className="absolute bottom-0 right-0 w-1/2 h-1/2 rounded-2xl opacity-50 blur-3xl" style={{
                    background: 'radial-gradient(ellipse at bottom right, #a855f7, #9333ea, #7c3aed, transparent)',
                    zIndex: 0
                  }}></div>
                  <div className="absolute bottom-0 right-0 w-1/3 h-1/3 rounded-2xl opacity-40 blur-2xl" style={{
                    background: 'radial-gradient(ellipse at bottom right, #a855f7, #9333ea, transparent)',
                    zIndex: 0
                  }}></div>
                  
                  {/* Image container matching hero style */}
                  <div className="relative z-10 rounded-lg overflow-hidden shadow-2xl">
                    <img
                      src="/how-it-works-pdf-generation.png"
                      alt="PDF Generation"
                      className="w-full h-auto block"
                    />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="order-1 lg:order-2">
                <h3 className="text-xl sm:text-3xl font-bold mb-4 text-gray-900">
                  PDF Generation
                </h3>
                <p className="text-base text-gray-600 leading-relaxed">
                  Every invoice is automatically formatted as a clean, professional PDF ready to share.
                </p>
              </div>
            </div>
          </div>

          {/* Step 10 - Analytics Dashboard */}
          <div className="mb-12 sm:mb-16 lg:mb-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              {/* Content */}
              <div>
                <h3 className="text-xl sm:text-3xl font-bold mb-4 text-gray-900">
                  Analytics Dashboard
                </h3>
                <p className="text-base text-gray-600 leading-relaxed">
                  Track revenue, pending payments, overdue invoices, and late fees. Get insights into your business performance.
                </p>
              </div>

              {/* Visual Background */}
              <div>
                <div className="relative max-w-md mx-auto">
                  {/* Background glow effect - one side only with purple theme color */}
                  <div className="absolute bottom-0 right-0 w-1/2 h-1/2 rounded-2xl opacity-50 blur-3xl" style={{
                    background: 'radial-gradient(ellipse at bottom right, #a855f7, #9333ea, #7c3aed, transparent)',
                    zIndex: 0
                  }}></div>
                  <div className="absolute bottom-0 right-0 w-1/3 h-1/3 rounded-2xl opacity-40 blur-2xl" style={{
                    background: 'radial-gradient(ellipse at bottom right, #a855f7, #9333ea, transparent)',
                    zIndex: 0
                  }}></div>
                  
                  {/* Image container matching hero style */}
                  <div className="relative z-10 rounded-lg overflow-hidden shadow-2xl">
                    <img
                      src="/how-it-works-analytics.png"
                      alt="Analytics Dashboard"
                      className="w-full h-auto block"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Cards - Bottom Section */}
          <div className="mt-12 sm:mt-16 lg:mt-20 pt-12 sm:pt-16 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {/* Card 1 */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{
                backgroundColor: '#f8f9fa',
                border: '1px solid #e5e7eb'
              }}>
                  <Server className="w-6 h-6 text-gray-600" />
              </div>
                <h4 className="font-heading text-lg font-bold mb-2 text-gray-900">
                Secure & Reliable
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  All client data and payment history stored securely with enterprise-grade encryption.
              </p>
            </div>

              {/* Card 2 */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{
                backgroundColor: '#f8f9fa',
                border: '1px solid #e5e7eb'
              }}>
                  <Bell className="w-6 h-6 text-gray-600" />
              </div>
                <h4 className="font-heading text-lg font-bold mb-2 text-gray-900">
                  Automated Reminders
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Smart reminder scheduling with multiple tone options to ensure timely payments without being pushy.
              </p>
            </div>

              {/* Card 3 */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #e5e7eb'
                }}>
                  <BarChart3 className="w-6 h-6 text-gray-600" />
                </div>
                <h4 className="font-heading text-lg font-bold mb-2 text-gray-900">
                  Real-time Analytics
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Track revenue, pending payments, overdue invoices, and late fees with detailed insights.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Template Showcase Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading text-2xl sm:text-4xl font-bold mb-4 text-gray-900">
              Professional Invoice Templates
            </h2>
            <p className="text-base text-gray-600 max-w-2xl mx-auto">
              Choose from beautifully designed templates. Customize colors, fonts, and layout to match your brand.
            </p>
          </div>
          
          {/* Template Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {/* Template 1 - Minimal */}
            <div className="group relative flex items-center justify-center">
              <div className="aspect-[4/5] bg-white relative overflow-visible flex items-center justify-center w-full">
                <div className="relative border border-black inline-block">
                  <Image
                    src="/template-minimal.png"
                    alt="Minimal Invoice Template"
                    width={800}
                    height={1000}
                    className="block"
                    style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
                  />
              </div>
              </div>
            </div>

            {/* Template 2 - Modern */}
            <div className="group relative flex items-center justify-center">
              <div className="aspect-[4/5] bg-white relative overflow-visible flex items-center justify-center w-full">
                <div className="relative border border-black inline-block">
                  <Image
                    src="/template-modern.png"
                    alt="Modern Invoice Template"
                    width={800}
                    height={1000}
                    className="block"
                    style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
                  />
              </div>
              </div>
            </div>

            {/* Template 3 - Creative */}
            <div className="group relative flex items-center justify-center">
              <div className="aspect-[4/5] bg-white relative overflow-visible flex items-center justify-center w-full">
                <div className="relative border border-black inline-block">
                  <Image
                    src="/template-creative.png"
                    alt="Creative Invoice Template"
                    width={800}
                    height={1000}
                    className="block"
                    style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
                  />
              </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold mb-4 text-gray-900">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose the plan that works best for your business. No hidden fees, cancel anytime.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <div className="rounded-2xl border-2 border-gray-200 bg-white p-6 sm:p-8 hover:border-gray-300 transition-all duration-200">
              <div className="text-center">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Free</h3>
                <div className="mb-6">
                  <span className="text-4xl sm:text-5xl font-bold text-gray-900">$0</span>
                  <span className="text-gray-600 text-lg">/forever</span>
              </div>
                <p className="text-sm text-gray-600 mb-6">Perfect for getting started</p>
              <button
                onClick={handleGetStarted}
                  className="w-full px-6 py-3 text-sm sm:text-base font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors mb-6"
              >
                  Get Started
              </button>
              </div>
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="ml-3 text-sm text-gray-700">Up to 5 invoices per month</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="ml-3 text-sm text-gray-700">Basic invoice templates</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="ml-3 text-sm text-gray-700">Client management</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="ml-3 text-sm text-gray-700">PDF generation</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="ml-3 text-sm text-gray-700">Email reminders (limited)</span>
                </div>
              </div>
            </div>

            {/* Monthly Subscription Plan - POPULAR */}
            <div className="rounded-2xl border-2 border-[#a855f7] bg-white p-6 sm:p-8 hover:border-[#9333ea] transition-all duration-200 relative">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <span className="bg-[#a855f7] text-white text-xs font-semibold px-3 py-1 rounded-full">POPULAR</span>
              </div>
              <div className="text-center mt-2">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Monthly</h3>
                <div className="mb-6">
                  <span className="text-4xl sm:text-5xl font-bold text-gray-900">$9</span>
                  <span className="text-gray-600 text-lg">/month</span>
                </div>
                <p className="text-sm text-gray-600 mb-6">Best for regular users</p>
              <button
                onClick={handleGetStarted}
                  className="w-full px-6 py-3 text-sm sm:text-base font-medium text-white bg-[#a855f7] rounded-lg hover:bg-[#9333ea] transition-colors mb-6"
              >
                  Get Started
              </button>
            </div>
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="ml-3 text-sm text-gray-700">Unlimited invoices</span>
              </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="ml-3 text-sm text-gray-700">All premium templates</span>
              </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="ml-3 text-sm text-gray-700">Advanced client management</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="ml-3 text-sm text-gray-700">Automated email reminders</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="ml-3 text-sm text-gray-700">Late fee management</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="ml-3 text-sm text-gray-700">Analytics dashboard</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="ml-3 text-sm text-gray-700">Priority support</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="ml-3 text-sm text-gray-700 font-semibold">Save up to 50% vs pay-per-invoice</span>
                </div>
              </div>
            </div>

            {/* Pay Per Invoice Plan */}
            <div className="rounded-2xl border-2 border-gray-200 bg-white p-6 sm:p-8 hover:border-gray-300 transition-all duration-200">
              <div className="text-center">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Pay Per Invoice</h3>
                <div className="mb-6">
                  <span className="text-4xl sm:text-5xl font-bold text-gray-900">$0.50</span>
                  <span className="text-gray-600 text-lg">/invoice</span>
                </div>
                <p className="text-sm text-gray-600 mb-6">Pay only for what you use</p>
              <button
                onClick={handleGetStarted}
                  className="w-full px-6 py-3 text-sm sm:text-base font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors mb-6"
              >
                  Get Started
              </button>
            </div>
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="ml-3 text-sm text-gray-700">Pay only for invoices sent ($0.50 each)</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="ml-3 text-sm text-gray-700">All premium templates</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="ml-3 text-sm text-gray-700">Advanced client management</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="ml-3 text-sm text-gray-700">Automated email reminders</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="ml-3 text-sm text-gray-700">Late fee management</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="ml-3 text-sm text-gray-700">Analytics dashboard</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="ml-3 text-sm text-gray-700">Priority support</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="ml-3 text-sm text-gray-700">No monthly commitment</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Note */}
          <div className="mt-12 text-center">
            <p className="text-sm text-gray-600">
              All plans include secure payment processing. No credit card required for free plan.
            </p>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold mb-4 text-gray-900">
              Loved by Creators & Entrepreneurs
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {/* Reddit Review */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 hover:border-gray-200 transition-colors">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-gray-900 truncate">u/freelancer_pro</span>
                  </div>
                  <span className="text-xs text-gray-500">r/freelance • 2d</span>
                </div>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed mb-3">
                Switched to FlowInvoicer last month and it&apos;s been a game changer. The automated reminders actually work, and clients are paying faster. The free tier is generous too.
              </p>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>▲ 247</span>
                <span>•</span>
                <span>12 comments</span>
              </div>
            </div>

            {/* Indie Hackers Review */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 hover:border-gray-200 transition-colors">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">IH</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-gray-900 truncate">Sarah Chen</span>
                  </div>
                  <span className="text-xs text-gray-500">Indie Hackers</span>
                </div>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed mb-3">
                As a solo designer, invoicing was taking too much time. FlowInvoicer&apos;s templates are beautiful and the pay-per-invoice model is perfect for my variable workload. Highly recommend!
              </p>
              <div className="text-xs text-gray-500">
                Making $5k/mo
              </div>
            </div>

            {/* X.com Review */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 hover:border-gray-200 transition-colors">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-gray-900 truncate">Alex Martinez</span>
                    <CheckCircle className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                  </div>
                  <span className="text-xs text-gray-500">@techconsultant • 5h</span>
                </div>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed mb-3">
                Finally found an invoicing tool that doesn&apos;t nickel and dime you. The monthly plan is a steal at $9. My clients love the professional templates. 10/10 would recommend.
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>89</span>
                <span>12</span>
                <span>5</span>
              </div>
            </div>
          </div>

          {/* Additional Reviews Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mt-8 max-w-4xl mx-auto">
            {/* Reddit Review 2 */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 hover:border-gray-200 transition-colors">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-gray-900 truncate">u/agency_owner</span>
                  </div>
                  <span className="text-xs text-gray-500">r/entrepreneur • 1w</span>
                </div>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed mb-3">
                The analytics dashboard is exactly what I needed. Can see all my revenue at a glance. Late fee automation has saved me hours of manual follow-ups.
              </p>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>▲ 156</span>
                <span>•</span>
                <span>8 comments</span>
              </div>
            </div>

            {/* X.com Review 2 */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 hover:border-gray-200 transition-colors">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-gray-900 truncate">Mike Johnson</span>
                    <CheckCircle className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                  </div>
                  <span className="text-xs text-gray-500">@webdev_mike • 1d</span>
                </div>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed mb-3">
                Best invoicing tool for freelancers. Clean UI, fast, and the reminder system actually works. My payment rate improved by 40% since switching.
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>124</span>
                <span>23</span>
                <span>8</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-heading text-2xl sm:text-4xl font-bold mb-4 text-gray-900">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600">
              Everything you need to know about FlowInvoicer
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 space-y-2 bg-white border-gray-200 rounded-lg border p-4 backdrop-blur-sm">
                <button 
                  onClick={() => setActiveFaqCategory('General')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors cursor-pointer ${
                    activeFaqCategory === 'General'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  General
                </button>
                <button 
                  onClick={() => setActiveFaqCategory('Plans & Pricing')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors cursor-pointer ${
                    activeFaqCategory === 'Plans & Pricing'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Plans & Pricing
                </button>
                <button 
                  onClick={() => setActiveFaqCategory('Features')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors cursor-pointer ${
                    activeFaqCategory === 'Features'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Features
                </button>
                <button 
                  onClick={() => setActiveFaqCategory('Security')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors cursor-pointer ${
                    activeFaqCategory === 'Security'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
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
                    <div className="rounded-lg border transition-all duration-200 bg-white border-gray-200 hover:border-gray-300 backdrop-blur-sm">
                      <button className="w-full px-6 py-4 text-left flex items-center justify-between">
                        <h3 className="font-heading text-lg font-semibold text-gray-900">
                          What is FlowInvoicer?
                        </h3>
                        <span className="text-2xl font-light text-gray-600">+</span>
                      </button>
                      <div className="px-6 pb-4">
                        <p className="text-sm leading-relaxed text-gray-600">
                          FlowInvoicer is a professional invoicing platform designed for freelancers, designers, and contractors. Create beautiful invoices, send automated reminders, and get paid faster with our streamlined workflow.
                        </p>
                      </div>
                    </div>

                    <div className="rounded-lg border transition-all duration-200 bg-white border-gray-200 hover:border-gray-300 backdrop-blur-sm">
                      <button className="w-full px-6 py-4 text-left flex items-center justify-between">
                        <h3 className="font-heading text-lg font-semibold text-gray-900">
                          Who can use FlowInvoicer?
                        </h3>
                        <span className="text-2xl font-light text-gray-600">+</span>
                      </button>
                      <div className="px-6 pb-4">
                        <p className="text-sm leading-relaxed text-gray-600">
                          FlowInvoicer is perfect for freelancers, designers, contractors, consultants, agencies, and any business that needs to send professional invoices. Whether you&apos;re just starting out or managing hundreds of clients.
                        </p>
                      </div>
                    </div>

                    <div className="rounded-lg border transition-all duration-200 bg-white border-gray-200 hover:border-gray-300 backdrop-blur-sm">
                      <button className="w-full px-6 py-4 text-left flex items-center justify-between">
                        <h3 className="font-heading text-lg font-semibold text-gray-900">
                          How do I get started?
                        </h3>
                        <span className="text-2xl font-light text-gray-600">+</span>
                      </button>
                      <div className="px-6 pb-4">
                        <p className="text-sm leading-relaxed text-gray-600">
                          Simply sign up for a free account, add your business information, and start creating your first invoice. No credit card required for the free plan. You can upgrade anytime when you need more features.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Plans & Pricing Category Questions */}
                {activeFaqCategory === 'Plans & Pricing' && (
                  <div className="space-y-4">
                    <div className="rounded-lg border transition-all duration-200 bg-white border-gray-200 hover:border-gray-300 backdrop-blur-sm">
                      <button className="w-full px-6 py-4 text-left flex items-center justify-between">
                        <h3 className="font-heading text-lg font-semibold text-gray-900">
                          How does the free plan work?
                        </h3>
                        <span className="text-2xl font-light text-gray-600">+</span>
                      </button>
                      <div className="px-6 pb-4">
                        <p className="text-sm leading-relaxed text-gray-600">
                          The free plan allows you to create up to 5 invoices per month with basic templates. Perfect for freelancers just getting started. You can upgrade anytime when you need more features.
                        </p>
                      </div>
                    </div>

                    <div className="rounded-lg border transition-all duration-200 bg-white border-gray-200 hover:border-gray-300 backdrop-blur-sm">
                      <button className="w-full px-6 py-4 text-left flex items-center justify-between">
                        <h3 className="font-heading text-lg font-semibold text-gray-900">
                          What&apos;s the difference between Pay Per Invoice and Pro?
                        </h3>
                        <span className="text-2xl font-light text-gray-600">+</span>
                      </button>
                      <div className="px-6 pb-4">
                        <p className="text-sm leading-relaxed text-gray-600">
                          Pay Per Invoice is perfect if you send invoices occasionally - you only pay $2 when you actually send an invoice. Pro is better for regular users with unlimited invoices and clients for $19/month.
                        </p>
                      </div>
                    </div>

                    <div className="rounded-lg border transition-all duration-200 bg-white border-gray-200 hover:border-gray-300 backdrop-blur-sm">
                      <button className="w-full px-6 py-4 text-left flex items-center justify-between">
                        <h3 className="font-heading text-lg font-semibold text-gray-900">
                          Can I cancel anytime?
                        </h3>
                        <span className="text-2xl font-light text-gray-600">+</span>
                      </button>
                      <div className="px-6 pb-4">
                        <p className="text-sm leading-relaxed text-gray-600">
                          Yes, you can cancel your subscription anytime with no cancellation fees. Your data remains accessible for 30 days after cancellation. You can always reactivate your account if you change your mind.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Features Category Questions */}
                {activeFaqCategory === 'Features' && (
                  <div className="space-y-4">
                    <div className="rounded-lg border transition-all duration-200 bg-white border-gray-200 hover:border-gray-300 backdrop-blur-sm">
                      <button className="w-full px-6 py-4 text-left flex items-center justify-between">
                        <h3 className="font-heading text-lg font-semibold text-gray-900">
                          How do automated reminders work?
                        </h3>
                        <span className="text-2xl font-light text-gray-600">+</span>
                      </button>
                      <div className="px-6 pb-4">
                        <p className="text-sm leading-relaxed text-gray-600">
                          You can set up custom reminder schedules for each invoice. Choose from friendly, polite, firm, or urgent reminder types. Set reminders before due dates or after overdue periods to maximize your chances of getting paid.
                        </p>
                      </div>
                    </div>

                    <div className="rounded-lg border transition-all duration-200 bg-white border-gray-200 hover:border-gray-300 backdrop-blur-sm">
                      <button className="w-full px-6 py-4 text-left flex items-center justify-between">
                        <h3 className="font-heading text-lg font-semibold text-gray-900">
                          Can I customize invoice templates?
                        </h3>
                        <span className="text-2xl font-light text-gray-600">+</span>
                      </button>
                      <div className="px-6 pb-4">
                        <p className="text-sm leading-relaxed text-gray-600">
                          Yes! All plans include professional templates that you can customize with your branding, colors, and company information. Pro users get access to all premium templates and advanced customization options.
                        </p>
                      </div>
                    </div>

                    <div className="rounded-lg border transition-all duration-200 bg-white border-gray-200 hover:border-gray-300 backdrop-blur-sm">
                      <button className="w-full px-6 py-4 text-left flex items-center justify-between">
                        <h3 className="font-heading text-lg font-semibold text-gray-900">
                          What payment methods do you support?
                        </h3>
                        <span className="text-2xl font-light text-gray-600">+</span>
                      </button>
                      <div className="px-6 pb-4">
                        <p className="text-sm leading-relaxed text-gray-600">
                          Clients can pay through their preferred methods like PayPal, Venmo, bank transfers, or checks. You track payment status manually and mark invoices as paid when you receive payment.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Security Category Questions */}
                {activeFaqCategory === 'Security' && (
                  <div className="space-y-4">
                    <div className="rounded-lg border transition-all duration-200 bg-white border-gray-200 hover:border-gray-300 backdrop-blur-sm">
                      <button className="w-full px-6 py-4 text-left flex items-center justify-between">
                        <h3 className="font-heading text-lg font-semibold text-gray-900">
                          Is my data secure?
                        </h3>
                        <span className="text-2xl font-light text-gray-600">+</span>
                      </button>
                      <div className="px-6 pb-4">
                        <p className="text-sm leading-relaxed text-gray-600">
                          Absolutely. We use enterprise-grade security with encrypted data storage and transmission. Your client information and business data are never shared with third parties. We&apos;re fully GDPR compliant.
                        </p>
                      </div>
                    </div>

                    <div className="rounded-lg border transition-all duration-200 bg-white border-gray-200 hover:border-gray-300 backdrop-blur-sm">
                      <button className="w-full px-6 py-4 text-left flex items-center justify-between">
                        <h3 className="font-heading text-lg font-semibold text-gray-900">
                          Where is my data stored?
                        </h3>
                        <span className="text-2xl font-light text-gray-600">+</span>
                      </button>
                      <div className="px-6 pb-4">
                        <p className="text-sm leading-relaxed text-gray-600">
                          Your data is stored on secure, encrypted servers with 99.9% uptime. We use industry-standard security practices and regular backups to ensure your information is always safe and accessible.
                        </p>
                      </div>
                    </div>

                    <div className="rounded-lg border transition-all duration-200 bg-white border-gray-200 hover:border-gray-300 backdrop-blur-sm">
                      <button className="w-full px-6 py-4 text-left flex items-center justify-between">
                        <h3 className="font-heading text-lg font-semibold text-gray-900">
                          Can I export my data?
                        </h3>
                        <span className="text-2xl font-light text-gray-600">+</span>
                      </button>
                      <div className="px-6 pb-4">
                        <p className="text-sm leading-relaxed text-gray-600">
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

      {/* Final CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white border-t border-gray-200">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Start invoicing today
          </h2>
          <p className="text-base text-gray-600 mb-8">
            No credit card required
          </p>
            <button
              onClick={handleGetStarted}
            className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-colors"
          >
            Get started free
            <ArrowRight className="ml-2 w-4 h-4" />
            </button>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
