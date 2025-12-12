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
  ChevronDown,
  Sparkles,
  Minus,
  ClipboardCheck
} from 'lucide-react';
import Image from 'next/image';
import dynamic from 'next/dynamic';

// Lazy load components that are below the fold
const Footer = dynamic(() => import('@/components/Footer'), {
  loading: () => null, // Footer can load silently
});

const AvatarCircles = dynamic(() => import('@/components/AvatarCircles').then(mod => ({ default: mod.AvatarCircles })), {
  loading: () => null, // AvatarCircles can load silently
});

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
      <div className="min-h-screen transition-colors duration-200 bg-white overflow-x-hidden">
      {/* Hero Section */}
      <section className="pt-12 sm:pt-16 lg:pt-20 pb-12 sm:pb-16 lg:pb-20 px-4 sm:px-6 lg:px-8 relative bg-white" ref={heroRef}>
        <div className="max-w-7xl mx-auto">
          {/* Hero Content */}
          <div className="max-w-3xl mx-auto text-center mb-8 sm:mb-10 lg:mb-8">
            <h1 ref={headingRef} className="font-heading text-4xl sm:text-5xl lg:text-6xl font-semibold mb-4 sm:mb-6 text-gray-900 tracking-tight leading-[1.1] sm:leading-[1.1] lg:leading-[1.05]">
                Create invoices in seconds.<br className="hidden sm:block" />
                Get <span className="text-[#a855f7]">paid</span> faster.
              </h1>
            <p className="text-sm sm:text-lg text-gray-500 sm:text-gray-600 mb-8 leading-relaxed max-w-xl mx-auto">
              <span className="block mb-1">Professional invoicing for freelancers and small businesses.</span>
              <span className="block">No fees, no hassle.</span>
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
                <Image
                src="/dashboard-screenshot.png?v=2"
                alt="FlowInvoicer Dashboard"
                  width={1200}
                  height={800}
                className="w-full h-auto block"
                priority
                quality={85}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1200px"
                />
              </div>
            
            {/* Mobile Image */}
            <div className="relative z-10 rounded-lg overflow-hidden border border-gray-200 shadow-2xl bg-white block md:hidden">
              <Image
                src="/dashboard-screenshot-mobile.png"
                alt="FlowInvoicer Dashboard"
                width={600}
                height={800}
                className="w-full h-auto block"
                priority
                quality={85}
                sizes="100vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-8 sm:mb-16">
                <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-semibold mb-3 sm:mb-6 text-gray-900 tracking-tight">
              Get paid faster
                </h2>
            <p className="text-sm sm:text-lg max-w-2xl mx-auto text-gray-600 px-4 sm:px-0">
              Professional invoicing tools designed for freelancers, designers, and contractors.
                </p>
            </div>

          {/* Features Grid */}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-6 lg:gap-8 font-sans">
            {/* Feature 1 - Professional Templates */}
            <div className="group p-3 sm:p-6 lg:p-8 rounded-md sm:rounded-lg border border-gray-200 bg-white hover:border-gray-300 hover:shadow-md transition-all duration-200">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-2 sm:mb-5 transition-transform duration-200 group-hover:scale-105" style={{
                backgroundColor: '#f8f9fa',
                border: '1px solid #e5e7eb'
              }}>
                <FileText className="w-4 h-4 sm:w-6 sm:h-6 text-gray-600" />
                </div>
              <h3 className="font-heading text-sm sm:text-xl font-semibold mb-1.5 sm:mb-3 text-gray-900 leading-tight sm:leading-normal">
                Professional Templates
                  </h3>
              <p className="text-[11px] sm:text-sm leading-relaxed text-gray-600">
                Choose from multiple professional invoice templates. Customize colors, fonts, and layout to match your brand.
                  </p>
              </div>
              
            {/* Feature 2 - Client Management */}
            <div className="group p-3 sm:p-6 lg:p-8 rounded-md sm:rounded-lg border border-gray-200 bg-white hover:border-gray-300 hover:shadow-md transition-all duration-200">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-2 sm:mb-5 transition-transform duration-200 group-hover:scale-105" style={{
                backgroundColor: '#f8f9fa',
                border: '1px solid #e5e7eb'
              }}>
                <Users className="w-4 h-4 sm:w-6 sm:h-6 text-gray-600" />
                </div>
              <h3 className="font-heading text-sm sm:text-xl font-semibold mb-1.5 sm:mb-3 text-gray-900 leading-tight sm:leading-normal">
                Client Management
                  </h3>
              <p className="text-[11px] sm:text-sm leading-relaxed text-gray-600">
                Store client information, payment history, and communication logs. Never lose track of important details.
                  </p>
              </div>
              
            {/* Feature 3 - Payment Tracking */}
            <div className="group p-3 sm:p-6 lg:p-8 rounded-md sm:rounded-lg border border-gray-200 bg-white hover:border-gray-300 hover:shadow-md transition-all duration-200">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-2 sm:mb-5 transition-transform duration-200 group-hover:scale-105" style={{
                backgroundColor: '#f8f9fa',
                border: '1px solid #e5e7eb'
              }}>
                <BarChart3 className="w-4 h-4 sm:w-6 sm:h-6 text-gray-600" />
                </div>
              <h3 className="font-heading text-sm sm:text-xl font-semibold mb-1.5 sm:mb-3 text-gray-900 leading-tight sm:leading-normal">
                Payment Tracking
                  </h3>
              <p className="text-[11px] sm:text-sm leading-relaxed text-gray-600">
                Track when clients view invoices and manually mark payments as received. Get clear visibility into payment status.
                  </p>
                </div>

            {/* Feature 4 - Automated Reminders */}
            <div className="group p-3 sm:p-6 lg:p-8 rounded-md sm:rounded-lg border border-gray-200 bg-white hover:border-gray-300 hover:shadow-md transition-all duration-200">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-2 sm:mb-5 transition-transform duration-200 group-hover:scale-105" style={{
                backgroundColor: '#f8f9fa',
                border: '1px solid #e5e7eb'
              }}>
                <Bell className="w-4 h-4 sm:w-6 sm:h-6 text-gray-600" />
              </div>
              <h3 className="font-heading text-sm sm:text-xl font-semibold mb-1.5 sm:mb-3 text-gray-900 leading-tight sm:leading-normal">
                Automated Reminders
              </h3>
              <p className="text-[11px] sm:text-sm leading-relaxed text-gray-600">
                Set up custom reminder schedules for each invoice. Choose from friendly, polite, firm, or urgent reminder types.
            </p>
          </div>

            {/* Feature 5 - Late Fees */}
            <div className="group p-3 sm:p-6 lg:p-8 rounded-md sm:rounded-lg border border-gray-200 bg-white hover:border-gray-300 hover:shadow-md transition-all duration-200">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-2 sm:mb-5 transition-transform duration-200 group-hover:scale-105" style={{
                backgroundColor: '#f8f9fa',
                border: '1px solid #e5e7eb'
              }}>
                <Zap className="w-4 h-4 sm:w-6 sm:h-6 text-gray-600" />
              </div>
              <h3 className="font-heading text-sm sm:text-xl font-semibold mb-1.5 sm:mb-3 text-gray-900 leading-tight sm:leading-normal">
                Late Fee Management
              </h3>
              <p className="text-[11px] sm:text-sm leading-relaxed text-gray-600">
                Automatically calculate and apply late fees. Set fixed amounts or percentages with grace periods.
              </p>
            </div>

            {/* Feature 6 - Multiple Payment Methods */}
            <div className="group p-3 sm:p-6 lg:p-8 rounded-md sm:rounded-lg border border-gray-200 bg-white hover:border-gray-300 hover:shadow-md transition-all duration-200">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-2 sm:mb-5 transition-transform duration-200 group-hover:scale-105" style={{
                backgroundColor: '#f8f9fa',
                border: '1px solid #e5e7eb'
              }}>
                <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6 text-gray-600" />
              </div>
              <h3 className="font-heading text-sm sm:text-xl font-semibold mb-1.5 sm:mb-3 text-gray-900 leading-tight sm:leading-normal">
                Multiple Payment Methods
              </h3>
              <p className="text-[11px] sm:text-sm leading-relaxed text-gray-600">
                Support PayPal, Stripe, Cash App, Venmo, Google Pay, Apple Pay, and bank transfers.
              </p>
            </div>

            {/* Feature 7 - PDF Generation */}
            <div className="group p-3 sm:p-6 lg:p-8 rounded-md sm:rounded-lg border border-gray-200 bg-white hover:border-gray-300 hover:shadow-md transition-all duration-200">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-2 sm:mb-5 transition-transform duration-200 group-hover:scale-105" style={{
                backgroundColor: '#f8f9fa',
                border: '1px solid #e5e7eb'
              }}>
                <FileText className="w-4 h-4 sm:w-6 sm:h-6 text-gray-600" />
              </div>
              <h3 className="font-heading text-sm sm:text-xl font-semibold mb-1.5 sm:mb-3 text-gray-900 leading-tight sm:leading-normal">
                PDF Generation
              </h3>
              <p className="text-[11px] sm:text-sm leading-relaxed text-gray-600">
                Generate professional PDF invoices instantly. Download and share with clients or print for your records.
              </p>
            </div>

            {/* Feature 8 - Analytics Dashboard */}
            <div className="group p-3 sm:p-6 lg:p-8 rounded-md sm:rounded-lg border border-gray-200 bg-white hover:border-gray-300 hover:shadow-md transition-all duration-200">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-2 sm:mb-5 transition-transform duration-200 group-hover:scale-105" style={{
                backgroundColor: '#f8f9fa',
                border: '1px solid #e5e7eb'
              }}>
                <BarChart3 className="w-4 h-4 sm:w-6 sm:h-6 text-gray-600" />
              </div>
              <h3 className="font-heading text-sm sm:text-xl font-semibold mb-1.5 sm:mb-3 text-gray-900 leading-tight sm:leading-normal">
                Analytics Dashboard
              </h3>
              <p className="text-[11px] sm:text-sm leading-relaxed text-gray-600">
                Track revenue, pending payments, overdue invoices, and late fees. Get insights into your business performance.
              </p>
            </div>

            {/* Feature 9 - Secure & Reliable */}
            <div className="group p-3 sm:p-6 lg:p-8 rounded-md sm:rounded-lg border border-gray-200 bg-white hover:border-gray-300 hover:shadow-md transition-all duration-200 col-span-2 md:col-span-1">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-2 sm:mb-5 transition-transform duration-200 group-hover:scale-105" style={{
                backgroundColor: '#f8f9fa',
                border: '1px solid #e5e7eb'
              }}>
                <Shield className="w-4 h-4 sm:w-6 sm:h-6 text-gray-600" />
              </div>
              <h3 className="font-heading text-sm sm:text-xl font-bold mb-1.5 sm:mb-3 text-gray-900 leading-tight sm:leading-normal">
                Secure & Reliable
              </h3>
              <p className="text-[11px] sm:text-sm leading-relaxed text-gray-600">
                Enterprise-grade security with encrypted data storage and transmission. Your data is never shared with third parties.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-semibold mb-4 text-gray-900 tracking-tight">
              Loved by Creators &amp; Entrepreneurs
            </h2>
          </div>

          {/* Mobile: CSS Marquee Animation, Desktop: Static Grid */}
          {/* Desktop Grid */}
          <div className="hidden sm:grid sm:grid-cols-3 gap-6 lg:gap-8">
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

          {/* Mobile Marquee - Infinite Horizontal Scroll */}
          <div className="sm:hidden overflow-hidden">
            <div 
              className="flex gap-4 animate-marquee"
              style={{
                animation: 'marquee 25s linear infinite',
                width: 'max-content'
              }}
            >
              {/* Reddit Review */}
              <div className="bg-white rounded-xl border border-gray-100 p-5 w-[85vw] max-w-[320px] flex-shrink-0">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm text-gray-900">u/freelancer_pro</span>
                    <p className="text-xs text-gray-500">r/freelance • 2d</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mb-2">
                  Switched to FlowInvoicer last month and it&apos;s been a game changer. The automated reminders actually work!
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>▲ 247</span>
                  <span>•</span>
                  <span>12 comments</span>
                </div>
              </div>

              {/* Indie Hackers Review */}
              <div className="bg-white rounded-xl border border-gray-100 p-5 w-[85vw] max-w-[320px] flex-shrink-0">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">IH</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm text-gray-900">Sarah Chen</span>
                    <p className="text-xs text-gray-500">Indie Hackers</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mb-2">
                  As a solo designer, invoicing was taking too much time. FlowInvoicer&apos;s templates are beautiful!
                </p>
                <div className="text-xs text-gray-500">Making $5k/mo</div>
              </div>

              {/* X.com Review */}
              <div className="bg-white rounded-xl border border-gray-100 p-5 w-[85vw] max-w-[320px] flex-shrink-0">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-sm text-gray-900">Alex Martinez</span>
                      <CheckCircle className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                    <p className="text-xs text-gray-500">@techconsultant • 5h</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mb-2">
                  Finally found an invoicing tool that doesn&apos;t nickel and dime you. The monthly plan is a steal at $9!
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>89</span>
                  <span>12</span>
                  <span>5</span>
                </div>
              </div>

              {/* Reddit Review 2 */}
              <div className="bg-white rounded-xl border border-gray-100 p-5 w-[85vw] max-w-[320px] flex-shrink-0">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm text-gray-900">u/agency_owner</span>
                    <p className="text-xs text-gray-500">r/entrepreneur • 1w</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mb-2">
                  The analytics dashboard is exactly what I needed. Can see all my revenue at a glance!
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>▲ 156</span>
                  <span>•</span>
                  <span>8 comments</span>
                </div>
              </div>

              {/* X.com Review 2 */}
              <div className="bg-white rounded-xl border border-gray-100 p-5 w-[85vw] max-w-[320px] flex-shrink-0">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-sm text-gray-900">Mike Johnson</span>
                      <CheckCircle className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                    <p className="text-xs text-gray-500">@webdev_mike • 1d</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mb-2">
                  Best invoicing tool for freelancers. Clean UI, fast, and my payment rate improved by 40%!
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>124</span>
                  <span>23</span>
                  <span>8</span>
                </div>
              </div>

              {/* Duplicate cards for seamless loop */}
              {/* Reddit Review */}
              <div className="bg-white rounded-xl border border-gray-100 p-5 w-[85vw] max-w-[320px] flex-shrink-0">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm text-gray-900">u/freelancer_pro</span>
                    <p className="text-xs text-gray-500">r/freelance • 2d</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mb-2">
                  Switched to FlowInvoicer last month and it&apos;s been a game changer. The automated reminders actually work!
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>▲ 247</span>
                  <span>•</span>
                  <span>12 comments</span>
                </div>
              </div>

              {/* Indie Hackers Review */}
              <div className="bg-white rounded-xl border border-gray-100 p-5 w-[85vw] max-w-[320px] flex-shrink-0">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">IH</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm text-gray-900">Sarah Chen</span>
                    <p className="text-xs text-gray-500">Indie Hackers</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mb-2">
                  As a solo designer, invoicing was taking too much time. FlowInvoicer&apos;s templates are beautiful!
                </p>
                <div className="text-xs text-gray-500">Making $5k/mo</div>
              </div>
            </div>
          </div>

          {/* Desktop Additional Reviews Row */}
          <div className="hidden sm:grid sm:grid-cols-2 gap-6 lg:gap-8 mt-8 max-w-4xl mx-auto">
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

      {/* How It Works Section */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 sm:mb-24">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold mb-4 text-gray-900 tracking-tight" style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
              How it works
            </h2>
          </div>

          {/* Main Flow - Modern Animated Design */}
          <div className="space-y-24">
            {/* Step 1 - Create Estimate */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              {/* Left Content */}
              <div className="lg:col-span-5 order-2 lg:order-1 lg:sticky lg:top-24">
                <div className="mb-3">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Step 01</span>
                </div>
                <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-gray-900 mb-4 leading-tight tracking-tight" style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
                  Create Estimate
                </h3>
                <p className="text-lg text-gray-600 leading-relaxed mb-8" style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
                  Start with a professional estimate. Send it to your client for approval. They can approve or reject it, then convert to invoice.
                </p>
                
                {/* Feature Cards - GitHub Copilot Style */}
                <div className="space-y-4">
                  <div className="group p-5 bg-white border border-gray-100 rounded-xl hover:border-violet-200 hover:shadow-md transition-all duration-200">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-100 transition-colors">
                        <Send className="w-5 h-5 text-violet-500" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-gray-800 mb-1.5">Send Estimate</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          Create detailed estimates with itemized services, discounts, and taxes. Send via email for client review.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="group p-5 bg-white border border-gray-100 rounded-xl hover:border-green-200 hover:shadow-md transition-all duration-200">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0 group-hover:bg-green-100 transition-colors">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-gray-800 mb-1.5">Client Approval</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          Clients can approve or reject estimates directly from the email link. You&apos;re notified instantly when they take action.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="group p-5 bg-white border border-gray-100 rounded-xl hover:border-indigo-200 hover:shadow-md transition-all duration-200">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100 transition-colors">
                        <FileText className="w-5 h-5 text-indigo-500" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-gray-800 mb-1.5">Convert to Invoice</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          Once approved, convert your estimate to an invoice with one click. All details are automatically transferred.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Visual - Placeholder for future mockup */}
              <div className="lg:col-span-7 order-1 lg:order-2 relative px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-10">
                {/* Placeholder space for visual mockup */}
              </div>
            </div>

            {/* Step 2 - Setup Invoice */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              {/* Left Content */}
              <div className="lg:col-span-5 order-2 lg:order-1 lg:sticky lg:top-24">
                <div className="mb-3">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Step 02</span>
                </div>
                <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-gray-900 mb-4 leading-tight tracking-tight" style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
                  Setup Invoice
                </h3>
                <p className="text-lg text-gray-600 leading-relaxed mb-8" style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
                  Edit converted invoices or create new ones. Choose from 3 professional templates, customize colors, add late fees, and send when ready.
                </p>
                
                {/* Feature Cards - GitHub Copilot Style */}
                <div className="space-y-4">
                  <div className="group p-5 bg-white border border-gray-100 rounded-xl hover:border-violet-200 hover:shadow-md transition-all duration-200">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-100 transition-colors">
                        <Palette className="w-5 h-5 text-violet-500" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-gray-800 mb-1.5">3 Professional Templates</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          Choose from Minimal, Modern, or Creative templates. Customize colors, fonts, and layout to match your brand.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="group p-5 bg-white border border-gray-100 rounded-xl hover:border-amber-200 hover:shadow-md transition-all duration-200">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-100 transition-colors">
                        <DollarSign className="w-5 h-5 text-amber-500" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-gray-800 mb-1.5">Add Late Fees</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          Configure automatic late fees that apply when invoices become overdue. Set percentage or fixed amounts.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="group p-5 bg-white border border-gray-100 rounded-xl hover:border-green-200 hover:shadow-md transition-all duration-200">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0 group-hover:bg-green-100 transition-colors">
                        <Send className="w-5 h-5 text-green-500" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-gray-800 mb-1.5">Ready to Send</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          Once your invoice is set up, send it to your client via email with a professional PDF attachment.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Visual - Placeholder for future mockup */}
              <div className="lg:col-span-7 order-1 lg:order-2 relative px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-10">
                {/* Placeholder space for visual mockup */}
              </div>
            </div>

            {/* Step 3 - Track & Remind */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              {/* Left Content */}
              <div className="lg:col-span-5 order-2 lg:order-1 lg:sticky lg:top-24">
                <div className="mb-3">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Step 03</span>
                </div>
                <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-gray-900 mb-4 leading-tight tracking-tight" style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
                  Track & Remind
                </h3>
                <p className="text-lg text-gray-600 leading-relaxed mb-8" style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
                  When invoice is sent, track client activity and engagement. Set up automated reminders that send based on your schedule.
                </p>
                
                {/* Feature Cards - GitHub Copilot Style */}
                <div className="space-y-4">
                  <div className="group p-5 bg-white border border-gray-100 rounded-xl hover:border-emerald-200 hover:shadow-md transition-all duration-200">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-100 transition-colors">
                        <Eye className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-gray-800 mb-1.5">Invoice Activity</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          Track when clients view your invoices. See exactly who opened what and when in the activity log.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="group p-5 bg-white border border-gray-100 rounded-xl hover:border-amber-200 hover:shadow-md transition-all duration-200">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-100 transition-colors">
                        <Bell className="w-5 h-5 text-amber-500" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-gray-800 mb-1.5">Auto Reminders</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          Set up custom reminder schedules. Our system automatically sends friendly reminders when invoices are due or overdue.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Visual - Placeholder for future mockup */}
              <div className="lg:col-span-7 order-1 lg:order-2 relative px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-10">
                {/* Placeholder space for visual mockup */}
              </div>
            </div>

            {/* Step 4 - Get Paid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              {/* Left Content */}
              <div className="lg:col-span-5 order-2 lg:order-1 lg:sticky lg:top-24">
                <div className="mb-3">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Step 04</span>
                </div>
                <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-gray-900 mb-4 leading-tight tracking-tight" style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
                  Get Paid
                </h3>
                <p className="text-lg text-gray-600 leading-relaxed mb-8" style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
                  Clients pay using your added payment methods directly to your account. No middle man, no extra charges. Mark as paid to complete the invoice process.
                </p>
                
                {/* Feature Cards - GitHub Copilot Style */}
                <div className="space-y-4">
                  <div className="group p-5 bg-white border border-gray-100 rounded-xl hover:border-blue-200 hover:shadow-md transition-all duration-200">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                        <CreditCard className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-gray-800 mb-1.5">Direct Payment</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          Clients pay through their preferred method (PayPal, Venmo, Bank Transfer, etc.). Payments go directly to your account.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="group p-5 bg-white border border-gray-100 rounded-xl hover:border-emerald-200 hover:shadow-md transition-all duration-200">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-100 transition-colors">
                        <DollarSign className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-gray-800 mb-1.5">No Extra Charges</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          No middle man, no transaction fees. Clients pay you directly — you keep 100% of what you earn.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="group p-5 bg-white border border-gray-100 rounded-xl hover:border-green-200 hover:shadow-md transition-all duration-200">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0 group-hover:bg-green-100 transition-colors">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-gray-800 mb-1.5">Mark as Paid</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          Once payment is received, mark the invoice as paid to complete the process. Generate receipts for your records.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Visual - Placeholder for future mockup */}
              <div className="lg:col-span-7 order-1 lg:order-2 relative px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-10">
                {/* Placeholder space for visual mockup */}
              </div>
            </div>
          </div>

          {/* Everything You Need - Dashboard Screenshot Style */}
          <div className="mt-24 sm:mt-32 lg:mt-40 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              
              {/* Header */}
              <div className="text-center mb-12 sm:mb-16">
                <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-semibold text-gray-900 mb-3 tracking-tight">Everything you need</h2>
                <p className="text-base text-gray-500 max-w-xl mx-auto">All the tools to create, send, and track invoices and estimates.</p>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
                
                {/* Feature 1 - Invoice Management */}
                <div>
                  <div className="mb-4 sm:mb-5">
                    <h3 className="font-heading text-lg sm:text-xl font-semibold text-gray-900 mb-2">Invoice Management</h3>
                    <p className="text-sm text-gray-600">Create and manage professional invoices with status tracking.</p>
                  </div>
                  
                  {/* Exact Dashboard Invoice Card Screenshot */}
                  <div className="rounded-lg border transition-all duration-200 hover:shadow-sm bg-white border-gray-200 hover:bg-gray-50/50">
                    <div className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100">
                              <FileText className="h-4 w-4 text-gray-700" />
                            </div>
                            <div>
                              <div className="font-medium text-sm" style={{ color: '#1f2937' }}>INV-001</div>
                              <div className="text-xs" style={{ color: '#6b7280' }}>Acme Corporation</div>
                            </div>
                          </div>
                          <div className="text-right min-h-[56px] flex flex-col items-end">
                            <div className="font-semibold text-base text-emerald-600">$2,500</div>
                            <div className="mt-0.5 mb-1 min-h-[14px] sm:min-h-[16px]"></div>
                            <div className="text-xs" style={{ color: '#6b7280' }}>Dec 15, 2024</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-emerald-600">
                              <CheckCircle className="h-3 w-3" />
                              <span className="capitalize">Paid</span>
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <button className="p-1.5 rounded-md transition-colors hover:bg-gray-100">
                              <Eye className="h-4 w-4 text-gray-700" />
                            </button>
                            <button className="p-1.5 rounded-md transition-colors hover:bg-gray-100">
                              <Download className="h-4 w-4 text-gray-700" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature 2 - Client Database */}
                <div>
                  <div className="mb-4 sm:mb-5">
                    <h3 className="font-heading text-lg sm:text-xl font-semibold text-gray-900 mb-2">Client Database</h3>
                    <p className="text-sm text-gray-600">Store and organize all your client information.</p>
                  </div>
                  
                  {/* Exact Dashboard Client Card Screenshot */}
                  <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Users className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">Acme Corporation</h3>
                          <p className="text-xs sm:text-sm text-gray-500 truncate">contact@acme.com</p>
                        </div>
                      </div>
                      <div className="flex space-x-1 sm:space-x-2 flex-shrink-0 ml-2">
                        <button className="p-1.5 sm:p-2 text-gray-400 hover:text-indigo-600 transition-colors cursor-pointer" title="View Details">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-600 transition-colors cursor-pointer" title="Edit Client">
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center text-xs sm:text-sm text-gray-600">
                        <Building2 className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate">Technology Solutions Inc.</span>
                      </div>
                      <div className="flex items-center text-xs sm:text-sm text-gray-600">
                        <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate">contact@acme.com</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature 3 - Auto Reminders */}
                <div>
                  <div className="mb-4 sm:mb-5">
                    <h3 className="font-heading text-lg sm:text-xl font-semibold text-gray-900 mb-2">Automated Reminders</h3>
                    <p className="text-sm text-gray-600">Schedule automatic payment reminders for overdue invoices.</p>
                  </div>
                  
                  {/* Reminder History Card - Exact Dashboard Match */}
                  <div className="rounded-lg border transition-all duration-200 hover:shadow-sm bg-white border-gray-200 hover:bg-gray-50/50">
                    <div className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100">
                              <Mail className="h-4 w-4 text-gray-700" />
                            </div>
                            <div>
                              <div className="font-medium text-sm" style={{ color: '#1f2937' }}>INV-001</div>
                              <div className="text-xs" style={{ color: '#6b7280' }}>Acme Corporation</div>
                            </div>
                          </div>
                          <div className="text-right min-h-[56px] flex flex-col items-end">
                            <div className="font-semibold text-base text-green-600">$2,500</div>
                            <div className="mt-0.5 mb-1 min-h-[14px] sm:min-h-[16px]"></div>
                            <div className="text-xs" style={{ color: '#6b7280' }}>Dec 15, 2024</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600">
                              <span className="capitalize">Friendly</span>
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600">
                              <span className="capitalize">Sent</span>
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <button className="p-1.5 rounded-md transition-colors hover:bg-gray-100">
                              <Eye className="h-4 w-4 text-gray-700" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature 4 - Email Delivery */}
                <div>
                  <div className="mb-4 sm:mb-5">
                    <h3 className="font-heading text-lg sm:text-xl font-semibold text-gray-900 mb-2">Email Delivery</h3>
                    <p className="text-sm text-gray-600">Send invoices via email with automatic PDF attachment.</p>
                  </div>
                  
                  {/* Email Success Message - Simple Design */}
                  <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-start gap-2 sm:gap-3 mb-3 sm:mb-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs sm:text-sm font-semibold text-gray-900 mb-1">Invoice sent successfully</div>
                        <div className="text-xs text-gray-600 break-words">To: client@acme.com</div>
                        <div className="text-xs text-gray-500 mt-0.5">Dec 8, 2024 at 10:30 AM</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 sm:p-2.5 bg-gray-50 rounded">
                      <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span className="text-xs font-medium text-gray-700 truncate flex-1">invoice-001.pdf</span>
                      <span className="text-xs text-gray-400 flex-shrink-0">142 KB</span>
                    </div>
                  </div>
                </div>

                {/* Feature 5 - Client Portal */}
                <div>
                  <div className="mb-4 sm:mb-5">
                    <h3 className="font-heading text-lg sm:text-xl font-semibold text-gray-900 mb-2">Client Portal</h3>
                    <p className="text-sm text-gray-600">Clients view and download invoices from their portal.</p>
                  </div>
                  
                  {/* Portal Screenshot */}
                  <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow duration-200">
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-gray-200">
                        <div>
                          <div className="text-xs text-gray-500 mb-1 sm:mb-1.5">Invoice Number</div>
                          <div className="text-sm font-semibold text-gray-900">INV-001</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500 mb-1 sm:mb-1.5">Amount Due</div>
                          <div className="text-base sm:text-lg font-bold text-gray-900">$2,500.00</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between py-1 sm:py-2">
                        <div>
                          <div className="text-xs text-gray-500 mb-1 sm:mb-1.5">Status</div>
                          <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 text-xs font-medium text-orange-600 bg-orange-50 rounded-md border border-orange-100">
                            <Send className="h-3 w-3 flex-shrink-0" />
                            <span className="whitespace-nowrap">Pending</span>
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500 mb-1 sm:mb-1.5">Due Date</div>
                          <div className="text-xs sm:text-sm font-medium text-gray-900 whitespace-nowrap">Dec 15, 2024</div>
                        </div>
                      </div>
                      <div className="pt-3 sm:pt-4 border-t border-gray-200 flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <button className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-gray-300 text-gray-700 text-xs sm:text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm">
                          <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="whitespace-nowrap">Download PDF</span>
                        </button>
                        <button className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-900 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors shadow-sm whitespace-nowrap">
                          View Invoice
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature 6 - Activity Tracking */}
                <div>
                  <div className="mb-4 sm:mb-5">
                    <h3 className="font-heading text-lg sm:text-xl font-semibold text-gray-900 mb-2">Activity Tracking</h3>
                    <p className="text-sm text-gray-600">Track when clients view invoices and payments are received.</p>
                  </div>
                  
                  {/* Activity Timeline - Exact Dashboard Match (No borders on items) */}
                  <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 hover:shadow-md transition-shadow duration-200">
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                          <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </div>
                        <div className="flex-1 pt-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-gray-900">Invoice sent.</p>
                          <p className="text-xs text-gray-600 mt-0.5 break-words">Sent to client@acme.com</p>
                          <p className="text-xs text-gray-500 mt-1">2h ago</p>
                        </div>
                      </div>
                      <div className="flex gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                          <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </div>
                        <div className="flex-1 pt-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-gray-900">Invoice viewed by customer.</p>
                          <p className="text-xs text-gray-500 mt-1">1h ago</p>
                        </div>
                      </div>
                      <div className="flex gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </div>
                        <div className="flex-1 pt-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-gray-900">Payment received: $2,500.</p>
                          <p className="text-xs text-gray-600 mt-0.5">Via bank transfer</p>
                          <p className="text-xs text-gray-500 mt-1">Just now</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature 7 - Estimate Management */}
                <div>
                  <div className="mb-4 sm:mb-5">
                    <h3 className="font-heading text-lg sm:text-xl font-semibold text-gray-900 mb-2">Estimate Management</h3>
                    <p className="text-sm text-gray-600">Create professional estimates and convert them to invoices when approved.</p>
                  </div>
                  
                  {/* Exact Dashboard Estimate Card Screenshot */}
                  <div className="rounded-lg border transition-all duration-200 hover:shadow-sm bg-white border-gray-200 hover:bg-gray-50/50">
                    <div className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100">
                              <ClipboardCheck className="h-4 w-4 text-gray-600" />
                            </div>
                            <div>
                              <div className="font-medium text-sm" style={{ color: '#1f2937' }}>EST-001</div>
                              <div className="text-xs" style={{ color: '#6b7280' }}>Acme Corporation</div>
                            </div>
                          </div>
                          <div className="text-right min-h-[56px] flex flex-col items-end">
                            <div className="font-semibold text-base text-gray-900">$2,500</div>
                            <div className="mt-0.5 mb-1 min-h-[14px] sm:min-h-[16px]"></div>
                            <div className="text-xs" style={{ color: '#6b7280' }}>Dec 15, 2024</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-orange-500">
                              <span className="capitalize">Sent</span>
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <button className="p-1.5 rounded-md transition-colors hover:bg-gray-100">
                              <Eye className="h-4 w-4 text-gray-600" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Template Showcase Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-semibold mb-4 text-gray-900 tracking-tight">
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
            <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-semibold mb-4 text-gray-900 tracking-tight">
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
                <h3 className="font-heading text-xl sm:text-2xl font-semibold text-gray-900 mb-2">Free</h3>
                <div className="mb-6">
                  <span className="font-heading text-4xl sm:text-5xl font-semibold text-gray-900">$0</span>
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
                <h3 className="font-heading text-xl sm:text-2xl font-semibold text-gray-900 mb-2">Monthly</h3>
                <div className="mb-6">
                  <span className="font-heading text-4xl sm:text-5xl font-semibold text-gray-900">$9</span>
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
                <h3 className="font-heading text-xl sm:text-2xl font-semibold text-gray-900 mb-2">Pay Per Invoice</h3>
                <div className="mb-6">
                  <span className="font-heading text-4xl sm:text-5xl font-semibold text-gray-900">$0.50</span>
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

      {/* FAQ Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-semibold mb-4 text-gray-900 tracking-tight">
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

                    <div className="rounded-lg border transition-all duration-200 bg-white border-gray-200 hover:border-gray-300 backdrop-blur-sm">
                      <button className="w-full px-6 py-4 text-left flex items-center justify-between">
                        <h3 className="font-heading text-lg font-semibold text-gray-900">
                          How do estimates work?
                        </h3>
                        <span className="text-2xl font-light text-gray-600">+</span>
                      </button>
                      <div className="px-6 pb-4">
                        <p className="text-sm leading-relaxed text-gray-600">
                          Create professional estimates for your clients with itemized services, discounts, and taxes. Send estimates via email, and clients can approve or reject them directly. Once approved, you can convert estimates to invoices with one click. Estimates have expiry dates and can be edited while in draft status.
                        </p>
                      </div>
                    </div>

                    <div className="rounded-lg border transition-all duration-200 bg-white border-gray-200 hover:border-gray-300 backdrop-blur-sm">
                      <button className="w-full px-6 py-4 text-left flex items-center justify-between">
                        <h3 className="font-heading text-lg font-semibold text-gray-900">
                          Can clients approve or reject estimates?
                        </h3>
                        <span className="text-2xl font-light text-gray-600">+</span>
                      </button>
                      <div className="px-6 pb-4">
                        <p className="text-sm leading-relaxed text-gray-600">
                          Yes! When you send an estimate, clients receive a link to view it. They can approve the estimate, which notifies you in your dashboard, or reject it with an optional reason. Once approved, you can convert the estimate to an invoice instantly.
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
          <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-gray-900 mb-3">
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




