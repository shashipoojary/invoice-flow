'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  CheckCircle, 
  Zap, 
  Shield, 
  ArrowRight,
  ArrowLeft,
  Play,
  Smartphone,
  BarChart3,
  Bell,
  Settings,
  Users,
  User,
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
  AlertCircle,
  Hash,
  Layout,
  PenTool,
  Trash2,
  Phone,
  MapPin,
  ChevronDown
} from 'lucide-react';
import Image from 'next/image';
import Footer from '@/components/Footer';
import { AvatarCircles } from '@/components/AvatarCircles';

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
    <>
      <style jsx global>{`
        /* Modern Animated Design Keyframes */
        @keyframes floatUp {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        
        @keyframes floatUpSlow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.15); }
          50% { box-shadow: 0 0 40px rgba(99, 102, 241, 0.3); }
        }
        
        @keyframes slideIn {
          0% { opacity: 0; transform: translateX(-20px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes scaleIn {
          0% { opacity: 0; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }
        
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
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
                {/* Avatar Circles */}
                <div className="flex items-center justify-center gap-3 mb-3">
                  <AvatarCircles
                    avatarUrls={[
                      'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
                      'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
                      'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
                      'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
                      'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
                    ]}
                    numPeople={995}
                  />
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
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl sm:text-5xl font-bold mb-4 text-gray-900">
              How it works
            </h2>
              </div>

          {/* Main Flow - Modern Animated Design */}
          <div className="space-y-24">
            {/* Step 1 - Create Invoice */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
              <div className="lg:col-span-5 lg:pr-8">
                <div className="inline-block mb-4">
                  <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Step 01</span>
                </div>
                <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                  Create Invoice
              </h3>
                <p className="text-lg text-gray-600 leading-relaxed mb-6">
                  Select your client, add line items, and choose a template. Your invoice is ready in seconds.
                </p>
                <div className="bg-gray-100 border-l-4 border-gray-400 p-5">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-gray-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900 mb-1">Professional Templates</p>
                      <p className="text-xs text-gray-700 leading-relaxed">
                        Choose from multiple beautiful invoice templates. Customize colors, add your logo, and brand your invoices to match your business.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-7">
                <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-md p-6 sm:p-10" style={{ minHeight: '420px' }}>
                  {/* Cal.com Inspired Floating UI Mockup */}
                  <div className="relative h-full flex items-center justify-center">
                    
                    {/* Main Invoice Form Card */}
                    <div className="relative bg-white rounded-md shadow-2xl shadow-gray-200/60 p-6 w-full max-w-[300px] border border-gray-100">
                      {/* Form Header */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-200">
                            <FileText className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">New Invoice</div>
                            <div className="text-xs text-gray-400">#INV-001234</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Client Field */}
                      <div className="mb-5">
                        <div className="text-xs font-medium text-gray-500 mb-2">Client</div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white text-sm font-bold shadow-md">AC</div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">Acme Corp</div>
                            <div className="text-xs text-gray-500">john@acme.com</div>
                          </div>
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                      
                      {/* Line Items */}
                      <div className="mb-5">
                        <div className="text-xs font-medium text-gray-500 mb-2">Items</div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-700">Web Design</span>
                            <span className="text-sm font-semibold text-gray-900">$2,500</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-700">Development</span>
                            <span className="text-sm font-semibold text-gray-900">$1,500</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Total */}
                      <div className="flex items-center justify-between py-4 border-t border-gray-100 mb-5">
                        <span className="text-sm text-gray-500">Total</span>
                        <span className="text-2xl font-bold text-gray-900">$4,000</span>
                      </div>
                      
                      {/* Create Button */}
                      <button className="w-full py-3 bg-gray-900 text-white text-sm font-medium rounded-xl flex items-center justify-center gap-2 hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/20">
                        Create Invoice
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                    
                    {/* Floating Success Badge - Top Right */}
                    <div className="absolute top-4 right-4 sm:top-8 sm:right-8 bg-white rounded-full px-4 py-2.5 shadow-xl shadow-gray-200/50 flex items-center gap-2 border border-gray-100">
                      <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">Invoice Created</span>
                    </div>
                    
                    {/* Floating Template Selector - Bottom Left */}
                    <div className="absolute bottom-4 left-4 sm:bottom-8 sm:left-8 bg-white rounded-2xl p-4 shadow-xl shadow-gray-200/50 border border-gray-100">
                      <div className="text-xs font-medium text-gray-500 mb-3">Template</div>
                      <div className="flex gap-2">
                        <div className="w-12 h-14 rounded-lg bg-gray-100 border-2 border-transparent hover:border-violet-400 cursor-pointer transition-colors"></div>
                        <div className="w-12 h-14 rounded-lg bg-violet-50 border-2 border-violet-500 relative">
                          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-violet-500 rounded-full flex items-center justify-center shadow-md">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        </div>
                        <div className="w-12 h-14 rounded-lg bg-gray-100 border-2 border-transparent hover:border-violet-400 cursor-pointer transition-colors"></div>
                      </div>
                    </div>
                    
                    {/* Floating Date Picker - Top Left */}
                    <div className="absolute top-4 left-4 sm:top-8 sm:left-8 bg-white rounded-xl px-4 py-2.5 shadow-xl shadow-gray-200/50 hidden sm:flex items-center gap-2 border border-gray-100">
                      <Calendar className="h-4 w-4 text-violet-600" />
                      <span className="text-sm font-medium text-gray-700">Jan 15, 2024</span>
                    </div>
                    
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 - Send Automatically */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
              <div className="lg:col-span-7 order-2 lg:order-1">
                <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-md p-6 sm:p-10" style={{ minHeight: '420px' }}>
                  {/* Cal.com Inspired Email UI */}
                  <div className="relative h-full flex items-center justify-center">
                    
                    {/* Main Email Preview Card */}
                    <div className="relative bg-white rounded-md shadow-2xl shadow-gray-200/60 p-6 w-full max-w-[300px] border border-gray-100">
                      {/* Email Header */}
                      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-blue-200">AC</div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-gray-900">Acme Corporation</div>
                          <div className="text-xs text-gray-500">john@acme.com</div>
                        </div>
                      </div>
                      
                      {/* Email Subject */}
                      <div className="mb-5">
                        <div className="text-sm font-semibold text-gray-900 mb-2">Invoice #INV-001234</div>
                        <div className="text-sm text-gray-500 leading-relaxed">Hi John, Please find attached your invoice for $4,000. Payment is due by Jan 29, 2024.</div>
                      </div>
                      
                      {/* Attachment */}
                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 mb-5">
                        <div className="w-11 h-11 rounded-lg bg-red-100 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-red-500" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">Invoice_001234.pdf</div>
                          <div className="text-xs text-gray-500">245 KB</div>
                        </div>
                        <Download className="h-5 w-5 text-gray-400" />
                      </div>
                      
                      {/* Send Status */}
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Sent automatically</span>
                        <span className="text-gray-400">2 min ago</span>
                      </div>
                    </div>
                    
                    {/* Floating Sent Badge - Top Right */}
                    <div className="absolute top-4 right-4 sm:top-8 sm:right-8 bg-white rounded-full px-4 py-2.5 shadow-xl shadow-gray-200/50 flex items-center gap-2 border border-gray-100">
                      <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                        <Send className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">Sent</span>
                    </div>
                    
                    {/* Floating Delivery Status - Bottom Right */}
                    <div className="absolute bottom-4 right-4 sm:bottom-8 sm:right-8 bg-white rounded-2xl p-4 shadow-xl shadow-gray-200/50 border border-gray-100">
                      <div className="text-xs font-medium text-gray-500 mb-2">Delivery</div>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-sm font-medium text-gray-700">Delivered</span>
                      </div>
                    </div>
                    
                    {/* Floating Schedule - Bottom Left */}
                    <div className="absolute bottom-4 left-4 sm:bottom-8 sm:left-8 bg-white rounded-xl px-4 py-2.5 shadow-xl shadow-gray-200/50 hidden sm:flex items-center gap-2 border border-gray-100">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">Auto-sent</span>
                    </div>
                    
                  </div>
                </div>
              </div>
              <div className="lg:col-span-5 lg:pl-8 order-1 lg:order-2">
                <div className="inline-block mb-4">
                  <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Step 02</span>
                </div>
                <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                  Send Automatically
                </h3>
                <p className="text-lg text-gray-600 leading-relaxed mb-6">
                  Your invoice is sent via email with a PDF attachment. No manual work required.
                </p>
                <div className="bg-gray-100 border-l-4 border-gray-400 p-5">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-gray-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900 mb-1">PDF Attached Automatically</p>
                      <p className="text-xs text-gray-700 leading-relaxed">
                        Every invoice is automatically converted to a professional PDF and attached to the email. Your clients receive a polished, ready-to-pay invoice.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 - Track & Remind */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
              <div className="lg:col-span-5 lg:pr-8">
                <div className="inline-block mb-4">
                  <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Step 03</span>
                </div>
                <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                  Track & Remind
                </h3>
                <p className="text-lg text-gray-600 leading-relaxed mb-6">
                  See when clients view your invoices. Automated reminders are sent based on your schedule.
                </p>
                <div className="bg-gray-100 border-l-4 border-gray-400 p-5">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-gray-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900 mb-1">Automated Reminders</p>
                      <p className="text-xs text-gray-700 leading-relaxed">
                        Set up custom reminder schedules. Our system automatically sends friendly reminders when invoices are due or overdue, so you don&apos;t have to chase payments.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-7">
                <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-md p-6 sm:p-10" style={{ minHeight: '420px' }}>
                  {/* Cal.com Inspired Activity UI */}
                  <div className="relative h-full flex items-center justify-center">
                    
                    {/* Main Activity Card */}
                    <div className="relative bg-white rounded-md shadow-2xl shadow-gray-200/60 p-6 w-full max-w-[300px] border border-gray-100">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
                        <div className="text-sm font-semibold text-gray-900">Activity</div>
                        <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-md">INV-001234</div>
                      </div>
                      
                      {/* Timeline */}
                      <div className="space-y-5">
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shadow-sm">
                              <Eye className="h-4 w-4 text-emerald-600" />
                            </div>
                            <div className="w-0.5 h-10 bg-gradient-to-b from-gray-200 to-transparent mt-2"></div>
                          </div>
                          <div className="flex-1 pt-2">
                            <div className="text-sm font-medium text-gray-900">Invoice Viewed</div>
                            <div className="text-xs text-gray-500 mt-0.5">Today, 2:30 PM</div>
                          </div>
                        </div>
                        
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shadow-sm">
                              <Bell className="h-4 w-4 text-amber-600" />
                            </div>
                            <div className="w-0.5 h-10 bg-gradient-to-b from-gray-200 to-transparent mt-2"></div>
                          </div>
                          <div className="flex-1 pt-2">
                            <div className="text-sm font-medium text-gray-900">Reminder Sent</div>
                            <div className="text-xs text-gray-500 mt-0.5">Yesterday</div>
                          </div>
                        </div>
                        
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shadow-sm">
                              <Send className="h-4 w-4 text-blue-600" />
                            </div>
                          </div>
                          <div className="flex-1 pt-2">
                            <div className="text-sm font-medium text-gray-900">Invoice Sent</div>
                            <div className="text-xs text-gray-500 mt-0.5">Jan 10, 2024</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Floating Reminder Card - Top Right */}
                    <div className="absolute top-4 right-4 sm:top-8 sm:right-8 bg-white rounded-2xl p-4 shadow-xl shadow-gray-200/50 max-w-[180px] border border-gray-100">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-200">
                          <Bell className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">Reminder scheduled</div>
                          <div className="text-xs text-gray-500 mt-0.5">In 3 days</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Floating Auto-Reminder Toggle - Bottom Right */}
                    <div className="absolute bottom-4 right-4 sm:bottom-8 sm:right-8 bg-white rounded-xl p-4 shadow-xl shadow-gray-200/50 border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-6 bg-emerald-500 rounded-full relative shadow-inner">
                          <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-md"></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700">Auto-remind</span>
                      </div>
                    </div>
                    
                    {/* Floating View Count - Bottom Left */}
                    <div className="absolute bottom-4 left-4 sm:bottom-8 sm:left-8 bg-white rounded-xl px-4 py-2.5 shadow-xl shadow-gray-200/50 hidden sm:flex items-center gap-2 border border-gray-100">
                      <Eye className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm font-medium text-gray-700">Viewed 3 times</span>
                    </div>
                    
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4 - Get Paid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
              <div className="lg:col-span-7 order-2 lg:order-1">
                <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-md p-6 sm:p-10" style={{ minHeight: '420px' }}>
                  {/* Cal.com Inspired Payment UI */}
                  <div className="relative h-full flex items-center justify-center">
                    
                    {/* Main Payment Card */}
                    <div className="relative bg-white rounded-md shadow-2xl shadow-gray-200/60 p-6 w-full max-w-[300px] border border-gray-100">
                      {/* Success Header */}
                      <div className="text-center mb-6">
                        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-100">
                          <CheckCircle className="h-8 w-8 text-emerald-600" />
                        </div>
                        <div className="text-base font-semibold text-gray-900">Payment Received</div>
                        <div className="text-sm text-gray-500">Invoice #INV-001234</div>
                      </div>
                      
                      {/* Amount */}
                      <div className="text-center py-5 px-4 bg-gray-50 rounded-xl mb-5">
                        <div className="text-3xl font-bold text-gray-900">$4,000</div>
                        <div className="text-sm text-gray-500 mt-1">Deposited to your account</div>
                      </div>
                      
                      {/* Payment Details */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Method</span>
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-bold" style={{ color: '#003087' }}>Pay</span>
                            <span className="text-sm font-bold" style={{ color: '#009CDE' }}>Pal</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Date</span>
                          <span className="text-sm font-medium text-gray-900">Jan 15, 2024</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Status</span>
                          <span className="text-xs px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium">Completed</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Floating Payment Methods - Top Right */}
                    <div className="absolute top-4 right-4 sm:top-8 sm:right-8 bg-white rounded-2xl p-4 shadow-xl shadow-gray-200/50 border border-gray-100">
                      <div className="text-xs font-medium text-gray-500 mb-3">Accepted</div>
                      <div className="flex flex-wrap gap-2">
                        {/* PayPal */}
                        <div className="px-2 py-1.5 rounded bg-white border border-gray-200 flex items-center">
                          <span className="text-[10px] font-bold" style={{ color: '#003087' }}>Pay</span>
                          <span className="text-[10px] font-bold" style={{ color: '#009CDE' }}>Pal</span>
                        </div>
                        {/* Stripe */}
                        <div className="px-2 py-1.5 rounded bg-white border border-gray-200 flex items-center">
                          <span className="text-[10px] font-bold text-purple-600">Stripe</span>
                        </div>
                        {/* Venmo */}
                        <div className="px-2 py-1.5 rounded bg-white border border-gray-200 flex items-center">
                          <span className="text-[10px] font-bold text-blue-500">Venmo</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Floating No Fees Badge - Top Left */}
                    <div className="absolute top-4 left-4 sm:top-8 sm:left-8 bg-white rounded-full px-4 py-2.5 shadow-xl shadow-gray-200/50 hidden sm:flex items-center gap-2 border border-gray-100">
                      <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">No fees</span>
                    </div>
                    
                    {/* Floating Balance Card - Bottom Left */}
                    <div className="absolute bottom-4 left-4 sm:bottom-8 sm:left-8 bg-white rounded-2xl p-4 shadow-xl shadow-gray-200/50 border border-gray-100">
                      <div className="text-xs font-medium text-gray-500 mb-1">This month</div>
                      <div className="text-xl font-bold text-gray-900">$12,450</div>
                    </div>
                    
                  </div>
                </div>
              </div>
              <div className="lg:col-span-5 lg:pl-8 order-1 lg:order-2">
                <div className="inline-block mb-4">
                  <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Step 04</span>
                </div>
                <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                  Get Paid Faster
                </h3>
                <p className="text-lg text-gray-600 leading-relaxed mb-6">
                  Clients pay through their preferred method. Payments go directly to your account — no fees, no hidden charges.
                </p>
                <div className="bg-gray-100 border-l-4 border-gray-400 p-5">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-gray-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900 mb-1">No Transaction Fees</p>
                      <p className="text-xs text-gray-700 leading-relaxed">
                        Unlike other invoicing tools, we don&apos;t charge per transaction. Clients pay you directly — you keep 100%.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Features - Modern Animated Style */}
          <div className="mt-32 pt-16 border-t border-gray-100">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Everything you need</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">Powerful features to help you manage invoices, clients, and payments efficiently.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
              {/* Feature 1 - Templates */}
              <div className="group">
                <div className="relative mb-8 rounded-md overflow-hidden bg-gray-50 border border-gray-200 p-6 sm:p-8" style={{ minHeight: '280px' }}>
                  {/* Template cards floating */}
                  <div className="relative z-10 flex flex-col items-center justify-center h-full space-y-4">
                    {/* Main template card */}
                    <div 
                      className="w-full max-w-[200px] bg-white rounded-xl shadow-xl border border-gray-100 p-4 transform transition-all duration-500 group-hover:scale-105"
                      style={{ animation: 'floatUp 4s ease-in-out infinite', animationDelay: '0s' }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
                          <FileText className="h-4 w-4 text-white" />
                        </div>
                        <div className="w-5 h-5 rounded-full bg-gray-900 flex items-center justify-center" style={{ animation: 'scaleIn 0.5s ease-out forwards', animationDelay: '1s' }}>
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-2 w-3/4 bg-gray-200 rounded-full"></div>
                        <div className="h-2 w-1/2 bg-gray-100 rounded-full"></div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-500">Minimal</span>
                          <span className="text-xs font-semibold text-gray-900">Selected</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Secondary cards */}
                    <div className="flex gap-3">
                      <div 
                        className="w-16 h-20 bg-white/80 backdrop-blur rounded-lg shadow-lg border border-gray-100 p-2"
                        style={{ animation: 'floatUp 4s ease-in-out infinite', animationDelay: '0.5s' }}
                      >
                        <div className="w-4 h-4 rounded bg-gray-200 mb-2"></div>
                        <div className="space-y-1">
                          <div className="h-1 w-full bg-gray-200 rounded"></div>
                          <div className="h-1 w-2/3 bg-gray-100 rounded"></div>
                        </div>
                      </div>
                      <div 
                        className="w-16 h-20 bg-white/80 backdrop-blur rounded-lg shadow-lg border border-gray-100 p-2"
                        style={{ animation: 'floatUp 4s ease-in-out infinite', animationDelay: '1s' }}
                      >
                        <div className="w-4 h-4 rounded bg-gray-200 mb-2"></div>
                        <div className="space-y-1">
                          <div className="h-1 w-full bg-gray-200 rounded"></div>
                          <div className="h-1 w-2/3 bg-gray-100 rounded"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">Professional Templates</h4>
                <p className="text-gray-600 leading-relaxed">Choose from multiple professional invoice templates. Customize colors, fonts, and layout to match your brand.</p>
              </div>

              {/* Feature 2 - Client Management */}
              <div className="group">
                <div className="relative mb-8 rounded-md overflow-hidden bg-gray-50 border border-gray-200 p-6 sm:p-8" style={{ minHeight: '280px' }}>
                  {/* Client cards stack */}
                  <div className="relative z-10 flex flex-col items-center justify-center h-full">
                    {/* Stacked client cards */}
                    <div className="relative w-full max-w-[220px]">
                      {/* Background card 2 */}
                      <div 
                        className="absolute top-4 left-2 right-2 h-20 bg-white/60 backdrop-blur rounded-xl shadow-lg"
                        style={{ animation: 'floatUp 4s ease-in-out infinite', animationDelay: '0.8s' }}
                      ></div>
                      {/* Background card 1 */}
                      <div 
                        className="absolute top-2 left-1 right-1 h-20 bg-white/80 backdrop-blur rounded-xl shadow-lg"
                        style={{ animation: 'floatUp 4s ease-in-out infinite', animationDelay: '0.4s' }}
                      ></div>
                      {/* Main card */}
                      <div 
                        className="relative bg-white rounded-xl shadow-xl border border-gray-100 p-4 transform transition-all duration-500 group-hover:scale-105"
                        style={{ animation: 'floatUp 4s ease-in-out infinite' }}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center">
                            <User className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="h-3 w-24 bg-gray-800 rounded-full mb-1"></div>
                            <div className="h-2 w-20 bg-gray-300 rounded-full"></div>
                          </div>
                        </div>
                        <div className="space-y-2 pl-1">
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3 text-gray-400" />
                            <div className="h-2 w-28 bg-gray-200 rounded-full"></div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <div className="h-2 w-20 bg-gray-200 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Add client button */}
                    <div 
                      className="mt-4 flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-lg border border-gray-100"
                      style={{ animation: 'fadeInUp 0.5s ease-out forwards', animationDelay: '1.5s', opacity: 0 }}
                    >
                      <Plus className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Add Client</span>
                    </div>
                  </div>
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">Client Management</h4>
                <p className="text-gray-600 leading-relaxed">Store client information, payment history, and communication logs. Never lose track of important details.</p>
              </div>

              {/* Feature 3 - Reminders */}
              <div className="group">
                <div className="relative mb-8 rounded-md overflow-hidden bg-gray-50 border border-gray-200 p-6 sm:p-8" style={{ minHeight: '280px' }}>
                  {/* Reminder notification style */}
                  <div className="relative z-10 flex flex-col items-center justify-center h-full space-y-3">
                    {/* Bell icon */}
                    <div 
                      className="w-14 h-14 rounded-2xl bg-gray-900 flex items-center justify-center shadow-lg mb-2"
                      style={{ animation: 'floatUp 4s ease-in-out infinite' }}
                    >
                      <Bell className="h-7 w-7 text-white" />
                    </div>
                    
                    {/* Reminder cards */}
                    <div className="w-full max-w-[220px] space-y-2">
                      <div 
                        className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl shadow-lg border border-gray-100 transform transition-all duration-500 group-hover:translate-x-1"
                        style={{ animation: 'slideIn 0.5s ease-out forwards', animationDelay: '0.3s', opacity: 0, transform: 'translateX(-20px)' }}
                      >
                        <div className="w-2 h-2 rounded-full bg-gray-900"></div>
                        <div className="flex-1">
                          <div className="h-2 w-20 bg-gray-800 rounded-full mb-1"></div>
                          <div className="h-1.5 w-16 bg-gray-300 rounded-full"></div>
                        </div>
                        <CheckCircle className="h-4 w-4 text-gray-600" />
                      </div>
                      
                      <div 
                        className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl shadow-lg border border-gray-100 transform transition-all duration-500 group-hover:translate-x-1"
                        style={{ animation: 'slideIn 0.5s ease-out forwards', animationDelay: '0.6s', opacity: 0, transform: 'translateX(-20px)' }}
                      >
                        <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                        <div className="flex-1">
                          <div className="h-2 w-24 bg-gray-800 rounded-full mb-1"></div>
                          <div className="h-1.5 w-14 bg-gray-300 rounded-full"></div>
                        </div>
                        <Clock className="h-4 w-4 text-gray-600" />
                      </div>
                      
                      <div 
                        className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl shadow-lg border border-gray-100 transform transition-all duration-500 group-hover:translate-x-1"
                        style={{ animation: 'slideIn 0.5s ease-out forwards', animationDelay: '0.9s', opacity: 0, transform: 'translateX(-20px)' }}
                      >
                        <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                        <div className="flex-1">
                          <div className="h-2 w-18 bg-gray-800 rounded-full mb-1"></div>
                          <div className="h-1.5 w-12 bg-gray-300 rounded-full"></div>
                        </div>
                        <Send className="h-4 w-4 text-gray-600" />
                      </div>
                    </div>
                  </div>
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">Automated Reminders</h4>
                <p className="text-gray-600 leading-relaxed">Automatically send friendly, polite, and urgent reminders based on your schedule. Never chase payments manually.</p>
              </div>

              {/* Feature 4 - Professional Email Templates */}
              <div className="group">
                <div className="relative mb-8 rounded-md overflow-hidden bg-gray-50 border border-gray-200 p-6 sm:p-8" style={{ minHeight: '280px' }}>
                  {/* Email template preview */}
                  <div className="relative z-10 flex flex-col items-center justify-center h-full">
                    {/* Email card */}
                    <div 
                      className="w-full max-w-[240px] bg-white rounded-xl shadow-xl border border-gray-100 p-4 transform transition-all duration-500 group-hover:scale-105"
                      style={{ animation: 'floatUp 4s ease-in-out infinite' }}
                    >
                      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
                        <Mail className="h-4 w-4 text-gray-600" />
                        <div className="flex-1">
                          <div className="h-2 w-32 bg-gray-800 rounded-full mb-1"></div>
                          <div className="h-1.5 w-24 bg-gray-300 rounded-full"></div>
                        </div>
                      </div>
                      <div className="space-y-2 mb-3">
                        <div className="h-2 w-full bg-gray-200 rounded-full"></div>
                        <div className="h-2 w-3/4 bg-gray-100 rounded-full"></div>
                        <div className="h-2 w-5/6 bg-gray-200 rounded-full"></div>
                      </div>
                      <div className="pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <div className="h-2 w-16 bg-gray-300 rounded-full"></div>
                          <div className="h-2 w-12 bg-gray-800 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Template variants */}
                    <div className="flex gap-2 mt-4">
                      <div 
                        className="w-12 h-16 bg-white/80 backdrop-blur rounded-lg shadow-lg border border-gray-100"
                        style={{ animation: 'floatUp 4s ease-in-out infinite', animationDelay: '0.5s' }}
                      ></div>
                      <div 
                        className="w-12 h-16 bg-white/80 backdrop-blur rounded-lg shadow-lg border border-gray-100"
                        style={{ animation: 'floatUp 4s ease-in-out infinite', animationDelay: '1s' }}
                      ></div>
                    </div>
                  </div>
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">Professional Email Templates</h4>
                <p className="text-gray-600 leading-relaxed">Beautiful, responsive email templates for invoices and reminders. Fully customizable and optimized for all email clients.</p>
              </div>

              {/* Feature 5 - Reminder Templates */}
              <div className="group">
                <div className="relative mb-8 rounded-md overflow-hidden bg-gray-50 border border-gray-200 p-6 sm:p-8" style={{ minHeight: '280px' }}>
                  {/* Reminder template cards */}
                  <div className="relative z-10 flex flex-col items-center justify-center h-full space-y-3">
                    {/* Main reminder card */}
                    <div 
                      className="w-full max-w-[220px] bg-white rounded-xl shadow-xl border border-gray-100 p-4 transform transition-all duration-500 group-hover:scale-105"
                      style={{ animation: 'floatUp 4s ease-in-out infinite' }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Bell className="h-4 w-4 text-gray-600" />
                        <div className="h-2 w-20 bg-gray-800 rounded-full"></div>
                      </div>
                      <div className="space-y-2 mb-3">
                        <div className="h-1.5 w-full bg-gray-200 rounded-full"></div>
                        <div className="h-1.5 w-4/5 bg-gray-100 rounded-full"></div>
                        <div className="h-1.5 w-3/4 bg-gray-200 rounded-full"></div>
                      </div>
                      <div className="pt-2 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <div className="h-2 w-12 bg-gray-300 rounded-full"></div>
                          <div className="h-2 w-16 bg-gray-800 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Reminder type badges */}
                    <div className="flex gap-2">
                      <div 
                        className="px-3 py-1.5 bg-white rounded-lg shadow-lg border border-gray-100"
                        style={{ animation: 'fadeInUp 0.5s ease-out forwards', animationDelay: '0.8s', opacity: 0 }}
                      >
                        <div className="h-2 w-12 bg-gray-800 rounded-full"></div>
                      </div>
                      <div 
                        className="px-3 py-1.5 bg-white rounded-lg shadow-lg border border-gray-100"
                        style={{ animation: 'fadeInUp 0.5s ease-out forwards', animationDelay: '1s', opacity: 0 }}
                      >
                        <div className="h-2 w-14 bg-gray-800 rounded-full"></div>
                      </div>
                      <div 
                        className="px-3 py-1.5 bg-white rounded-lg shadow-lg border border-gray-100"
                        style={{ animation: 'fadeInUp 0.5s ease-out forwards', animationDelay: '1.2s', opacity: 0 }}
                      >
                        <div className="h-2 w-10 bg-gray-800 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">Reminder Templates</h4>
                <p className="text-gray-600 leading-relaxed">Multiple reminder templates with different tones - friendly, polite, and urgent. Customize messages to match your communication style.</p>
              </div>

              {/* Feature 6 - Online Invoice Portal */}
              <div className="group">
                <div className="relative mb-8 rounded-md overflow-hidden bg-gray-50 border border-gray-200 p-6 sm:p-8" style={{ minHeight: '280px' }}>
                  {/* Client invoice portal */}
                  <div className="relative z-10 flex flex-col items-center justify-center h-full">
                    {/* Invoice status card */}
                    <div 
                      className="w-full max-w-[240px] bg-white rounded-xl shadow-xl border border-gray-100 p-4 transform transition-all duration-500 group-hover:scale-105"
                      style={{ animation: 'floatUp 4s ease-in-out infinite' }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="h-2 w-20 bg-gray-800 rounded-full"></div>
                        <div className="h-5 w-16 bg-gray-900 rounded-full"></div>
                      </div>
                      
                      {/* Status badges */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                          <div className="h-2 w-16 bg-gray-300 rounded-full"></div>
                          <div className="ml-auto h-2 w-12 bg-emerald-100 rounded-full"></div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                          <div className="h-2 w-18 bg-gray-300 rounded-full"></div>
                          <div className="ml-auto h-2 w-10 bg-amber-100 rounded-full"></div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <div className="h-2 w-14 bg-gray-300 rounded-full"></div>
                          <div className="ml-auto h-2 w-8 bg-blue-100 rounded-full"></div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                          <div className="h-2 w-12 bg-gray-300 rounded-full"></div>
                          <div className="ml-auto h-2 w-10 bg-gray-100 rounded-full"></div>
                        </div>
                      </div>
                      
                      {/* Total */}
                      <div className="pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <div className="h-2 w-12 bg-gray-300 rounded-full"></div>
                          <div className="h-3 w-20 bg-gray-800 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Real-time indicator */}
                    <div 
                      className="mt-4 flex items-center gap-2 px-3 py-1.5 bg-white rounded-full shadow-lg border border-gray-100"
                      style={{ animation: 'fadeInUp 0.5s ease-out forwards', animationDelay: '1s', opacity: 0 }}
                    >
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      <div className="h-2 w-16 bg-gray-800 rounded-full"></div>
                    </div>
                  </div>
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">Online Invoice Portal</h4>
                <p className="text-gray-600 leading-relaxed">Clients can view invoices online with real-time status updates. Track sent, viewed, overdue, and paid status all in one place.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Template Showcase Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading text-2xl sm:text-4xl font-bold mb-4 text-gray-900">
              Professional Invoice Templates
            </h2>
            <p className="text-base text-gray-600 max-w-2xl mx-auto">
              Choose from beautifully designed templates. Customize colors, fonts, and layout to match your brand.
            </p>
          </div>
          
          {/* Template Grid - Exact PDF Replicas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            
            {/* Template 1 - Minimal (Exact PDF Match - INV-0035) */}
            <div className="group">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden transform transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1 border border-gray-200 flex flex-col" style={{ aspectRatio: '8.5/11' }}>
                {/* Header - Business Info Left, INVOICE Right */}
                <div className="flex justify-between items-start p-3 sm:p-4">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">Tech Physics</h3>
                    <p className="text-[6px] sm:text-[7px] text-gray-500 leading-tight mt-0.5">2-192 hebri House beejadi koteshwara road</p>
                    <p className="text-[6px] sm:text-[7px] text-gray-500">kundapura taluk Udupi 576222</p>
                    <p className="text-[6px] sm:text-[7px] text-gray-500">+91 8762597688</p>
                    <p className="text-[6px] sm:text-[7px] text-violet-600">Techphysic@gmail.com</p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-base sm:text-lg font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent tracking-wide">INVOICE</h2>
                    <div className="inline-block bg-gray-800 text-white text-[6px] sm:text-[7px] px-1.5 py-0.5 rounded mt-1">#INV-0035</div>
                    <p className="text-[5px] sm:text-[6px] text-gray-400 mt-1">Issue: November 21, 2025</p>
                    <p className="text-[5px] sm:text-[6px] text-gray-400">Due: December 21, 2025</p>
                  </div>
                </div>
                
                {/* Divider Line */}
                <div className="mx-3 sm:mx-4 border-t border-gray-300"></div>
                
                {/* Bill To */}
                <div className="px-3 sm:px-4 py-2 sm:py-3">
                  <p className="text-[7px] sm:text-[8px] font-medium text-violet-600 mb-1">Bill To</p>
                  <p className="text-[8px] sm:text-[9px] font-semibold text-gray-900">Shashi</p>
                  <p className="text-[6px] sm:text-[7px] text-gray-600">shashikanthpoojary61@gmail.com</p>
                  <p className="text-[6px] sm:text-[7px] text-gray-600">+918762597688</p>
                  <p className="text-[6px] sm:text-[7px] text-gray-600">Tech Physics</p>
                  <p className="text-[6px] sm:text-[7px] text-gray-600">2-192 hebri House beejadi, Kundapura , Udupi Karnataka</p>
                </div>
                
                {/* Items Table - Simple with underlines */}
                <div className="px-3 sm:px-4 py-2 flex-1">
                  <div className="border-b border-gray-300 pb-1 mb-2">
                    <div className="grid grid-cols-12 text-[6px] sm:text-[7px] font-medium text-violet-600">
                      <span className="col-span-5">Description</span>
                      <span className="col-span-2 text-center">Qty</span>
                      <span className="col-span-2 text-center">Rate</span>
                      <span className="col-span-3 text-right">Amount</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="grid grid-cols-12 text-[6px] sm:text-[7px] border-b border-gray-100 pb-1">
                      <span className="col-span-5 text-gray-900">Web Development Services</span>
                      <span className="col-span-2 text-center text-violet-600">1</span>
                      <span className="col-span-2 text-center text-gray-500">$0.00</span>
                      <span className="col-span-3 text-right text-violet-600">$1,500.00</span>
                    </div>
                    <div className="grid grid-cols-12 text-[6px] sm:text-[7px] border-b border-gray-100 pb-1">
                      <span className="col-span-5 text-gray-900">UI/UX Design</span>
                      <span className="col-span-2 text-center text-violet-600">1</span>
                      <span className="col-span-2 text-center text-gray-500">$0.00</span>
                      <span className="col-span-3 text-right text-violet-600">$800.00</span>
                    </div>
                    <div className="grid grid-cols-12 text-[6px] sm:text-[7px] border-b border-gray-100 pb-1">
                      <span className="col-span-5 text-gray-900">Consulting Hours</span>
                      <span className="col-span-2 text-center text-violet-600">1</span>
                      <span className="col-span-2 text-center text-gray-500">$0.00</span>
                      <span className="col-span-3 text-right text-violet-600">$250.00</span>
                    </div>
                  </div>
                  
                  {/* Totals - Right aligned */}
                  <div className="flex justify-end mt-3">
                    <div className="text-right w-32">
                      <div className="flex justify-between text-[6px] sm:text-[7px] mb-1 border-t border-gray-200 pt-1">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="text-violet-600">$2,550.00</span>
                      </div>
                      <div className="flex justify-between text-[7px] sm:text-[8px] font-bold border-t border-gray-300 pt-1">
                        <span className="text-gray-900">Total:</span>
                        <span className="text-violet-600">$2,550.00</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Bottom Divider */}
                <div className="mx-3 sm:mx-4 border-t border-gray-300"></div>
                
                {/* Footer */}
                <div className="px-3 sm:px-4 py-2">
                  <p className="text-[6px] sm:text-[7px] font-medium text-violet-600">Payment Terms:</p>
                  <p className="text-[5px] sm:text-[6px] text-gray-600 mb-1">Net 30</p>
                  <p className="text-[6px] sm:text-[7px] font-medium text-violet-600">Notes:</p>
                  <p className="text-[5px] sm:text-[6px] text-gray-600">This is a test invoice for Minimal template. Created for testing email templates.</p>
                </div>
              </div>
              <div className="text-center mt-4">
                <h3 className="font-bold text-gray-900">Minimal</h3>
                <p className="text-sm text-gray-500">Clean & Simple</p>
              </div>
            </div>

            {/* Template 2 - Modern (Exact PDF Match - INV-0036) */}
            <div className="group">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden transform transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1 border border-gray-200 flex flex-col" style={{ aspectRatio: '8.5/11' }}>
                {/* Purple Header Banner */}
                <div className="bg-[#7C3AED] text-white p-3 sm:p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold">Tech Physics</h3>
                      <p className="text-[5px] sm:text-[6px] opacity-90 leading-tight mt-0.5">2-192 hebri House beejadi koteshwara road kundapura taluk Udupi 576222</p>
                      <p className="text-[5px] sm:text-[6px] opacity-90">+91 8762597688</p>
                      <p className="text-[5px] sm:text-[6px] opacity-90">Techphysic@gmail.com</p>
                    </div>
                    <div className="text-right">
                      <h2 className="text-base sm:text-lg font-bold tracking-wide">INVOICE</h2>
                    </div>
                  </div>
                </div>
                
                {/* Invoice Details Box - Float Right */}
                <div className="px-3 sm:px-4 py-2 relative">
                  <div className="border-2 border-violet-500 rounded p-2 absolute right-3 sm:right-4 top-2 w-28 sm:w-32">
                    <p className="text-[6px] sm:text-[7px] font-bold text-violet-600 uppercase">Invoice Details</p>
                    <p className="text-[7px] sm:text-[8px] font-semibold text-gray-900">#INV-0036</p>
                    <p className="text-[5px] sm:text-[6px] text-orange-500">November 21, 2025</p>
                    <p className="text-[5px] sm:text-[6px] text-gray-400">Due: December 21, 2025</p>
                  </div>
                  
                  {/* Bill To */}
                  <div className="pt-1">
                    <p className="text-[7px] sm:text-[8px] font-bold text-violet-600 mb-1">BILL TO</p>
                    <p className="text-[8px] sm:text-[9px] font-semibold text-gray-900">Shashi</p>
                    <p className="text-[6px] sm:text-[7px] text-gray-600">shashikanthpoojary61@gmail.com</p>
                    <p className="text-[6px] sm:text-[7px] text-gray-600">+918762597688</p>
                    <p className="text-[6px] sm:text-[7px] text-gray-600">Tech Physics</p>
                    <p className="text-[6px] sm:text-[7px] text-gray-600">2-192 hebri House beejadi, Kundapura , Udupi Karnataka</p>
                  </div>
                </div>
                
                {/* Items Table - Purple Header */}
                <div className="px-3 sm:px-4 py-2 flex-1">
                  <div className="bg-[#7C3AED] text-white">
                    <div className="grid grid-cols-12 text-[5px] sm:text-[6px] font-medium p-1.5 uppercase">
                      <span className="col-span-5">Description</span>
                      <span className="col-span-2 text-center">Qty</span>
                      <span className="col-span-2 text-center">Rate</span>
                      <span className="col-span-3 text-right">Amount</span>
                    </div>
                  </div>
                  <div className="border border-t-0 border-gray-200">
                    <div className="grid grid-cols-12 text-[6px] sm:text-[7px] p-1.5 border-b border-gray-100">
                      <span className="col-span-5 text-gray-900">Web Development Services</span>
                      <span className="col-span-2 text-center">1</span>
                      <span className="col-span-2 text-center text-gray-500">$0.00</span>
                      <span className="col-span-3 text-right">$1,500.00</span>
                    </div>
                    <div className="grid grid-cols-12 text-[6px] sm:text-[7px] p-1.5 bg-gray-50 border-b border-gray-100">
                      <span className="col-span-5 text-gray-900">UI/UX Design</span>
                      <span className="col-span-2 text-center">1</span>
                      <span className="col-span-2 text-center text-gray-500">$0.00</span>
                      <span className="col-span-3 text-right">$800.00</span>
                    </div>
                    <div className="grid grid-cols-12 text-[6px] sm:text-[7px] p-1.5">
                      <span className="col-span-5 text-gray-900">Consulting Hours</span>
                      <span className="col-span-2 text-center">1</span>
                      <span className="col-span-2 text-center text-gray-500">$0.00</span>
                      <span className="col-span-3 text-right">$250.00</span>
                    </div>
                  </div>
                  
                  {/* Totals Box - Purple Border */}
                  <div className="flex justify-end mt-3">
                    <div className="border-2 border-violet-500 rounded p-2 w-28 sm:w-32">
                      <div className="flex justify-between text-[5px] sm:text-[6px] mb-1">
                        <span className="text-gray-600 uppercase">Subtotal</span>
                        <span className="text-violet-600">$2,550.00</span>
                      </div>
                      <div className="flex justify-between text-[7px] sm:text-[8px] font-bold border-t border-violet-200 pt-1">
                        <span className="text-gray-900 uppercase">Total</span>
                        <span className="text-violet-600">$2,550.00</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Footer */}
                <div className="px-3 sm:px-4 py-2 border-t border-gray-200">
                  <p className="text-[6px] sm:text-[7px] font-medium text-gray-900">Payment Terms:</p>
                  <p className="text-[5px] sm:text-[6px] text-gray-600 mb-1">Net 30</p>
                  <p className="text-[6px] sm:text-[7px] font-medium text-gray-900">Notes:</p>
                  <p className="text-[5px] sm:text-[6px] text-violet-600">This is a test invoice for Modern template. Created for testing email templates.</p>
                </div>
              </div>
              <div className="text-center mt-4">
                <h3 className="font-bold text-gray-900">Modern</h3>
                <p className="text-sm text-gray-500">Sleek & Professional</p>
              </div>
            </div>

            {/* Template 3 - Creative (Gray Theme - INV-0037) */}
            <div className="group">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden transform transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1 border border-gray-200 flex flex-col" style={{ aspectRatio: '8.5/11' }}>
                {/* Gray Header Banner */}
                <div className="bg-gray-800 text-white p-3 sm:p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold">Tech Physics</h3>
                      <p className="text-[5px] sm:text-[6px] opacity-90 leading-tight mt-0.5">2-192 hebri House beejadi koteshwara road kundapura taluk Udupi 576222</p>
                      <p className="text-[5px] sm:text-[6px] opacity-90">+91 8762597688</p>
                      <p className="text-[5px] sm:text-[6px] opacity-90">Techphysic@gmail.com</p>
                    </div>
                    <div className="text-right">
                      <h2 className="text-base sm:text-lg font-bold tracking-wide">INVOICE</h2>
                    </div>
                  </div>
                </div>
                
                {/* Invoice Details Box on Right + Bill To on Left (side by side) */}
                <div className="px-3 sm:px-4 py-3 flex justify-between items-start">
                  {/* Bill To - Left Side */}
                  <div className="flex-1">
                    <p className="text-[7px] sm:text-[8px] font-bold text-gray-700 mb-1">BILL TO</p>
                    <p className="text-[8px] sm:text-[9px] font-semibold text-gray-900">Shashi</p>
                    <p className="text-[6px] sm:text-[7px] text-gray-600">shashikanthpoojary61@gmail.com</p>
                    <p className="text-[6px] sm:text-[7px] text-gray-600">+918762597688</p>
                    <p className="text-[6px] sm:text-[7px] text-gray-600">Tech Physics</p>
                    <p className="text-[6px] sm:text-[7px] text-gray-600">2-192 hebri House beejadi, Kundapura , Udupi Karnataka</p>
                  </div>
                  
                  {/* Invoice Details Box - Right Side */}
                  <div className="border border-gray-300 p-2 w-28 sm:w-32 ml-2">
                    <p className="text-[5px] sm:text-[6px] text-gray-400">Invoice #</p>
                    <p className="text-[7px] sm:text-[8px] font-semibold text-gray-800">INV-0037</p>
                    <p className="text-[5px] sm:text-[6px] text-gray-400 mt-1">Date:</p>
                    <p className="text-[6px] sm:text-[7px] font-medium text-gray-700">November 21, 2025</p>
                    <p className="text-[5px] sm:text-[6px] text-gray-400 mt-1">Due:</p>
                    <p className="text-[6px] sm:text-[7px] font-medium text-gray-700">December 21, 2025</p>
                  </div>
                </div>
                
                {/* Items Table - Gray Header */}
                <div className="px-3 sm:px-4 py-2 flex-1">
                  <div className="bg-gray-700 text-white">
                    <div className="grid grid-cols-12 text-[5px] sm:text-[6px] font-medium p-1.5 uppercase">
                      <span className="col-span-5">Description</span>
                      <span className="col-span-2 text-center">Qty</span>
                      <span className="col-span-2 text-center">Rate</span>
                      <span className="col-span-3 text-right">Amount</span>
                    </div>
                  </div>
                  <div className="border-x border-b border-gray-200">
                    <div className="grid grid-cols-12 text-[6px] sm:text-[7px] p-1.5 border-b border-gray-100">
                      <span className="col-span-5 text-gray-900">Web Development Services</span>
                      <span className="col-span-2 text-center text-gray-700">1</span>
                      <span className="col-span-2 text-center text-gray-500">$0.00</span>
                      <span className="col-span-3 text-right text-gray-900 font-medium">$1,500.00</span>
                    </div>
                    <div className="grid grid-cols-12 text-[6px] sm:text-[7px] p-1.5 bg-gray-50 border-b border-gray-100">
                      <span className="col-span-5 text-gray-900">UI/UX Design</span>
                      <span className="col-span-2 text-center text-gray-700">1</span>
                      <span className="col-span-2 text-center text-gray-500">$0.00</span>
                      <span className="col-span-3 text-right text-gray-900 font-medium">$800.00</span>
                    </div>
                    <div className="grid grid-cols-12 text-[6px] sm:text-[7px] p-1.5">
                      <span className="col-span-5 text-gray-900">Consulting Hours</span>
                      <span className="col-span-2 text-center text-gray-700">1</span>
                      <span className="col-span-2 text-center text-gray-500">$0.00</span>
                      <span className="col-span-3 text-right text-gray-900 font-medium">$250.00</span>
                    </div>
                  </div>
                  
                  {/* Totals Box - Right aligned */}
                  <div className="flex justify-end mt-3">
                    <div className="border border-gray-200 p-2 w-32 sm:w-36">
                      <div className="flex justify-between text-[6px] sm:text-[7px] mb-1">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="text-gray-900">$2,550.00</span>
                      </div>
                      <div className="flex justify-between text-[7px] sm:text-[8px] font-bold border-t border-gray-200 pt-1 mt-1">
                        <span className="text-gray-800">Total</span>
                        <span className="text-gray-900">$2,550.00</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Footer - Two Columns: Payment Terms Left, Notes Right */}
                <div className="px-3 sm:px-4 py-2 mt-auto">
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="text-[6px] sm:text-[7px] font-medium text-gray-700">Payment Terms</p>
                      <p className="text-[5px] sm:text-[6px] text-gray-600">Net 30</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[6px] sm:text-[7px] font-medium text-gray-500">Notes</p>
                      <p className="text-[5px] sm:text-[6px] text-gray-600">This is a test invoice for</p>
                      <p className="text-[5px] sm:text-[6px] text-gray-600">Creative template. Created for</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-center mt-4">
                <h3 className="font-bold text-gray-900">Creative</h3>
                <p className="text-sm text-gray-500">Bold & Dynamic</p>
              </div>
            </div>
          </div>
          
          {/* Color Customization Note */}
          <div className="text-center mt-10">
            <p className="text-sm text-gray-500">
              <span className="inline-flex items-center gap-2">
                <Zap className="w-4 h-4 text-violet-500" />
                All templates support custom colors to match your brand
              </span>
            </p>
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
            <div className="rounded-md border-2 border-gray-200 bg-white p-6 sm:p-8 hover:border-gray-300 transition-all duration-200">
              <div className="text-center">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Free</h3>
                <div className="mb-6">
                  <span className="text-4xl sm:text-5xl font-bold text-gray-900">$0</span>
                  <span className="text-gray-600 text-lg">/forever</span>
              </div>
                <p className="text-sm text-gray-600 mb-6">Perfect for getting started</p>
              <button
                onClick={handleGetStarted}
                  className="w-full px-6 py-3 text-sm sm:text-base font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-md hover:bg-gray-50 transition-colors mb-6"
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
            <div className="rounded-md border-2 border-[#a855f7] bg-white p-6 sm:p-8 hover:border-[#9333ea] transition-all duration-200 relative">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <span className="bg-[#a855f7] text-white text-xs font-semibold px-3 py-1 rounded-md">POPULAR</span>
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
                  className="w-full px-6 py-3 text-sm sm:text-base font-medium text-white bg-[#a855f7] rounded-md hover:bg-[#9333ea] transition-colors mb-6"
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
            <div className="rounded-md border-2 border-gray-200 bg-white p-6 sm:p-8 hover:border-gray-300 transition-all duration-200">
              <div className="text-center">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Pay Per Invoice</h3>
                <div className="mb-6">
                  <span className="text-4xl sm:text-5xl font-bold text-gray-900">$0.50</span>
                  <span className="text-gray-600 text-lg">/invoice</span>
                </div>
                <p className="text-sm text-gray-600 mb-6">Pay only for what you use</p>
              <button
                onClick={handleGetStarted}
                  className="w-full px-6 py-3 text-sm sm:text-base font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-md hover:bg-gray-50 transition-colors mb-6"
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
    </>
  );
}
