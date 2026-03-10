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
        
        @keyframes slideInFromBottom {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes scaleIn {
          0% { opacity: 0; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
        
        .animate-card-1 {
          animation: slideInFromBottom 0.6s ease-out 0.1s both;
        }
        
        .animate-card-2 {
          animation: slideInFromBottom 0.6s ease-out 0.2s both;
        }
        
        .animate-card-3 {
          animation: slideInFromBottom 0.6s ease-out 0.3s both;
        }
        
        .animate-card-4 {
          animation: slideInFromBottom 0.6s ease-out 0.4s both;
        }
        
        .animate-card-5 {
          animation: slideInFromBottom 0.6s ease-out 0.5s both;
        }
        
        .animate-card-6 {
          animation: slideInFromBottom 0.6s ease-out 0.6s both;
        }
        
        .animate-card-7 {
          animation: slideInFromBottom 0.6s ease-out 0.7s both;
        }
        
        .animate-card-8 {
          animation: slideInFromBottom 0.6s ease-out 0.8s both;
        }
        
        .mockup-hover {
          transition: all 0.3s ease;
        }
        
        .mockup-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
      `}</style>
      <div className="min-h-screen transition-colors duration-200 bg-white overflow-x-hidden">
      {/* Hero Section */}
      <section className="pt-4 pb-12 sm:pb-16 lg:pb-20 px-4 sm:px-6 lg:px-8 relative bg-white" ref={heroRef}>
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
                className="inline-flex items-center justify-center px-4 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-medium text-white bg-black hover:bg-gray-800 transition-colors"
                >
                Get started free
                <ArrowRight className="ml-2 w-4 h-4" />
                </button>
                <button
                  onClick={handleViewDemo}
                className="inline-flex items-center justify-center px-4 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
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
            <div className="absolute inset-0 opacity-30 blur-3xl" style={{
              background: 'radial-gradient(ellipse at center, #a855f7, #9333ea, #7c3aed)',
                transform: 'scale(1.1)',
              zIndex: 0
              }}></div>
            <div className="absolute inset-0 opacity-20 blur-2xl" style={{
              background: 'radial-gradient(ellipse at 30% 70%, #a855f7, #9333ea)',
                transform: 'scale(1.05)',
              zIndex: 1
              }}></div>
              
            {/* Desktop Image */}
            <div className="relative z-10 overflow-hidden border border-gray-200 shadow-2xl bg-white hidden md:block">
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
            <div className="relative z-10 overflow-hidden border border-gray-200 shadow-2xl bg-white block md:hidden">
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
            <div className="group p-3 sm:p-6 lg:p-8 border border-gray-200 bg-white hover:border-gray-300 hover:shadow-md transition-all duration-200">
              <div className="w-8 h-8 sm:w-12 sm:h-12 flex items-center justify-center mb-2 sm:mb-5 transition-transform duration-200 group-hover:scale-105" style={{
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
            <div className="group p-3 sm:p-6 lg:p-8 border border-gray-200 bg-white hover:border-gray-300 hover:shadow-md transition-all duration-200">
              <div className="w-8 h-8 sm:w-12 sm:h-12 flex items-center justify-center mb-2 sm:mb-5 transition-transform duration-200 group-hover:scale-105" style={{
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
            <div className="group p-3 sm:p-6 lg:p-8 border border-gray-200 bg-white hover:border-gray-300 hover:shadow-md transition-all duration-200">
              <div className="w-8 h-8 sm:w-12 sm:h-12 flex items-center justify-center mb-2 sm:mb-5 transition-transform duration-200 group-hover:scale-105" style={{
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
            <div className="group p-3 sm:p-6 lg:p-8 border border-gray-200 bg-white hover:border-gray-300 hover:shadow-md transition-all duration-200">
              <div className="w-8 h-8 sm:w-12 sm:h-12 flex items-center justify-center mb-2 sm:mb-5 transition-transform duration-200 group-hover:scale-105" style={{
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
            <div className="group p-3 sm:p-6 lg:p-8 border border-gray-200 bg-white hover:border-gray-300 hover:shadow-md transition-all duration-200">
              <div className="w-8 h-8 sm:w-12 sm:h-12 flex items-center justify-center mb-2 sm:mb-5 transition-transform duration-200 group-hover:scale-105" style={{
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
            <div className="group p-3 sm:p-6 lg:p-8 border border-gray-200 bg-white hover:border-gray-300 hover:shadow-md transition-all duration-200">
              <div className="w-8 h-8 sm:w-12 sm:h-12 flex items-center justify-center mb-2 sm:mb-5 transition-transform duration-200 group-hover:scale-105" style={{
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
            <div className="group p-3 sm:p-6 lg:p-8 border border-gray-200 bg-white hover:border-gray-300 hover:shadow-md transition-all duration-200">
              <div className="w-8 h-8 sm:w-12 sm:h-12 flex items-center justify-center mb-2 sm:mb-5 transition-transform duration-200 group-hover:scale-105" style={{
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
            <div className="group p-3 sm:p-6 lg:p-8 border border-gray-200 bg-white hover:border-gray-300 hover:shadow-md transition-all duration-200">
              <div className="w-8 h-8 sm:w-12 sm:h-12 flex items-center justify-center mb-2 sm:mb-5 transition-transform duration-200 group-hover:scale-105" style={{
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
            <div className="group p-3 sm:p-6 lg:p-8 border border-gray-200 bg-white hover:border-gray-300 hover:shadow-md transition-all duration-200 col-span-2 md:col-span-1">
              <div className="w-8 h-8 sm:w-12 sm:h-12 flex items-center justify-center mb-2 sm:mb-5 transition-transform duration-200 group-hover:scale-105" style={{
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
            <div className="bg-white border border-gray-100 p-6 hover:border-gray-200 transition-colors">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 bg-orange-500 flex items-center justify-center flex-shrink-0">
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
            <div className="bg-white border border-gray-100 p-6 hover:border-gray-200 transition-colors">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 bg-indigo-600 flex items-center justify-center flex-shrink-0">
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
            <div className="bg-white border border-gray-100 p-6 hover:border-gray-200 transition-colors">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 bg-black flex items-center justify-center flex-shrink-0">
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
              <div className="bg-white border border-gray-100 p-5 w-[85vw] max-w-[320px] flex-shrink-0">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 bg-orange-500 flex items-center justify-center flex-shrink-0">
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
              <div className="bg-white border border-gray-100 p-5 w-[85vw] max-w-[320px] flex-shrink-0">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 bg-indigo-600 flex items-center justify-center flex-shrink-0">
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
              <div className="bg-white border border-gray-100 p-5 w-[85vw] max-w-[320px] flex-shrink-0">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 bg-black flex items-center justify-center flex-shrink-0">
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
              <div className="bg-white border border-gray-100 p-5 w-[85vw] max-w-[320px] flex-shrink-0">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 bg-orange-500 flex items-center justify-center flex-shrink-0">
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
              <div className="bg-white border border-gray-100 p-5 w-[85vw] max-w-[320px] flex-shrink-0">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 bg-black flex items-center justify-center flex-shrink-0">
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
              <div className="bg-white border border-gray-100 p-5 w-[85vw] max-w-[320px] flex-shrink-0">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 bg-orange-500 flex items-center justify-center flex-shrink-0">
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
              <div className="bg-white border border-gray-100 p-5 w-[85vw] max-w-[320px] flex-shrink-0">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 bg-indigo-600 flex items-center justify-center flex-shrink-0">
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
            <div className="bg-white border border-gray-100 p-6 hover:border-gray-200 transition-colors">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 bg-orange-500 flex items-center justify-center flex-shrink-0">
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
            <div className="bg-white border border-gray-100 p-6 hover:border-gray-200 transition-colors">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 bg-black flex items-center justify-center flex-shrink-0">
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
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-gray-900 tracking-tight" style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
              How it works
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              Simple steps to create invoices, manage clients, and get paid.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            
            {/* Step 1 - Create Invoice */}
            <div className="group animate-card-1">
              <h3 className="text-xl sm:text-2xl font-bold mb-3 text-gray-900" style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
                Create Invoice
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-6">
                Create quick invoices in 60 seconds or detailed invoices with line items, discounts, and taxes.
              </p>
              
              {/* Mockup - Invoice Card Draft */}
              <div className="border transition-all duration-300 hover:shadow-lg bg-white border-gray-200 hover:bg-gray-50/50 mockup-hover">
                <div className="p-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 flex items-center justify-center bg-gray-100">
                          <FileText className="h-3.5 w-3.5 text-gray-600" />
                        </div>
                        <div>
                          <div className="font-medium text-sm" style={{ color: '#1f2937' }}>INV-001</div>
                          <div className="text-xs" style={{ color: '#6b7280' }}>Acme Corporation</div>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <div className="font-semibold text-base text-gray-600">$2,500</div>
                        <div className="mt-0 mb-0.5 min-h-[12px]"></div>
                        <div className="text-xs" style={{ color: '#6b7280' }}>Dec 15, 2024</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600">
                          <Clock className="h-3 w-3" />
                          <span className="capitalize">Draft</span>
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button className="p-1.5 transition-colors hover:bg-gray-100 cursor-pointer">
                          <Edit className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 - Send Invoice */}
            <div className="group animate-card-2">
              <h3 className="text-xl sm:text-2xl font-bold mb-3 text-gray-900" style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
                Send Invoice
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-6">
                Send invoices via email with PDF attachment. Clients receive a secure link to view and download.
              </p>
              
              {/* Mockup - Invoice Card Sent */}
              <div className="border transition-all duration-300 hover:shadow-lg bg-white border-gray-200 hover:bg-gray-50/50 mockup-hover">
                <div className="p-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 flex items-center justify-center bg-gray-100">
                          <FileText className="h-3.5 w-3.5 text-gray-600" />
                        </div>
                        <div>
                          <div className="font-medium text-sm" style={{ color: '#1f2937' }}>INV-001</div>
                          <div className="text-xs" style={{ color: '#6b7280' }}>Acme Corporation</div>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <div className="font-semibold text-base text-gray-900">$2,500</div>
                        <div className="mt-0 mb-0.5 min-h-[12px]"></div>
                        <div className="text-xs" style={{ color: '#6b7280' }}>Dec 15, 2024</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-orange-500">
                          <Send className="h-3 w-3" />
                          <span className="capitalize">Sent</span>
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button className="p-1.5 transition-colors hover:bg-gray-100 cursor-pointer">
                          <Eye className="h-4 w-4 text-gray-600" />
                        </button>
                        <button className="p-1.5 transition-colors hover:bg-gray-100 cursor-pointer">
                          <Download className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 - Track Activity */}
            <div className="group animate-card-3">
              <h3 className="text-xl sm:text-2xl font-bold mb-3 text-gray-900" style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
                Track Activity
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-6">
                See when clients view your invoices. View complete activity timeline for each invoice.
              </p>
              
              {/* Mockup - Activity Timeline */}
              <div className="border transition-all duration-300 hover:shadow-lg bg-white border-gray-200 mockup-hover">
                <div className="p-3 sm:p-6">
                  <div className="mb-3 sm:mb-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1 sm:mb-2">Invoice</h4>
                    <p className="text-sm font-medium text-gray-900 break-words">INV-001 • Acme Corporation</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-3 sm:mb-4">Activity Timeline</h4>
                    <ul className="pl-1 sm:pl-2">
                      <li className="relative grid grid-cols-[20px_1fr] gap-2 sm:gap-3 pb-4 sm:pb-5">
                        <div className="absolute bottom-0 w-px bg-gray-200 z-0 left-[10px] top-[16px]"></div>
                        <div className="relative z-10 flex items-center justify-center h-5 w-5 mt-0.5">
                          <Send className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="py-0.5">
                          <div className="text-sm text-gray-900 leading-5 break-words">Invoice sent via email</div>
                          <div className="text-xs text-gray-500 leading-4">2024-12-15 14:30 UTC</div>
                        </div>
                      </li>
                      <li className="relative grid grid-cols-[20px_1fr] gap-2 sm:gap-3 pb-4 sm:pb-5">
                        <div className="relative z-10 flex items-center justify-center h-5 w-5 mt-0.5">
                          <Eye className="h-4 w-4 text-indigo-600" />
                        </div>
                        <div className="py-0.5">
                          <div className="text-sm text-gray-900 leading-5 break-words">Invoice opened by client</div>
                          <div className="text-xs text-gray-500 leading-4">2024-12-15 15:45 UTC</div>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4 - Set Reminders */}
            <div className="group animate-card-4">
              <h3 className="text-xl sm:text-2xl font-bold mb-3 text-gray-900" style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
                Set Reminders
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-6">
                Set up automated email reminders that send based on your schedule. Remind clients about unpaid invoices.
              </p>
              
              {/* Mockup - Reminder Card */}
              <div className="border transition-all duration-300 hover:shadow-lg bg-white border-gray-200 hover:bg-gray-50/50 mockup-hover">
                <div className="p-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 flex items-center justify-center bg-gray-100">
                          <Bell className="h-3.5 w-3.5 text-gray-600" />
                        </div>
                        <div>
                          <div className="font-medium text-sm" style={{ color: '#1f2937' }}>INV-001</div>
                          <div className="text-xs" style={{ color: '#6b7280' }}>Reminder scheduled</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs" style={{ color: '#6b7280' }}>Dec 20, 2024</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-amber-600">
                          <Mail className="h-3 w-3" />
                          <span className="capitalize">Scheduled</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 5 - Get Paid */}
            <div className="group animate-card-5">
              <h3 className="text-xl sm:text-2xl font-bold mb-3 text-gray-900" style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
                Get Paid
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-6">
                Mark invoices as paid when you receive payment. Add payment methods to invoices for client convenience.
              </p>
              
              {/* Mockup - Paid Invoice Card */}
              <div className="border transition-all duration-300 hover:shadow-lg bg-white border-gray-200 hover:bg-gray-50/50 mockup-hover">
                <div className="p-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 flex items-center justify-center bg-gray-100">
                          <FileText className="h-3.5 w-3.5 text-gray-600" />
                        </div>
                        <div>
                          <div className="font-medium text-sm" style={{ color: '#1f2937' }}>INV-001</div>
                          <div className="text-xs" style={{ color: '#6b7280' }}>Acme Corporation</div>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <div className="font-semibold text-base text-emerald-600">$2,500</div>
                        <div className="mt-0 mb-0.5 min-h-[12px]"></div>
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
                        <button className="p-1.5 transition-colors hover:bg-gray-100 cursor-pointer">
                          <Eye className="h-4 w-4 text-gray-600" />
                        </button>
                        <button className="p-1.5 transition-colors hover:bg-gray-100 cursor-pointer">
                          <Download className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 6 - Create Estimate */}
            <div className="group animate-card-6">
              <h3 className="text-xl sm:text-2xl font-bold mb-3 text-gray-900" style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
                Create Estimate
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-6">
                Send estimates to clients for approval. Convert approved estimates to invoices with one click.
              </p>
              
              {/* Mockup - Estimate Card */}
              <div className="border transition-all duration-300 hover:shadow-lg bg-white border-gray-200 hover:bg-gray-50/50 mockup-hover">
                <div className="p-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 flex items-center justify-center bg-gray-100">
                          <ClipboardCheck className="h-3.5 w-3.5 text-gray-700" />
                        </div>
                        <div>
                          <div className="font-medium text-sm" style={{ color: '#1f2937' }}>EST-001</div>
                          <div className="text-xs" style={{ color: '#6b7280' }}>Acme Corporation</div>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <div className="font-semibold text-base text-gray-900">$2,500</div>
                        <div className="mt-0 mb-0.5 min-h-[12px]"></div>
                        <div className="text-xs" style={{ color: '#6b7280' }}>Dec 15, 2024</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-orange-500">
                          <Send className="h-3 w-3" />
                          <span className="capitalize">Sent</span>
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button className="p-1.5 transition-colors hover:bg-gray-100 cursor-pointer">
                          <Eye className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 7 - Estimate Approval */}
            <div className="group animate-card-7">
              <h3 className="text-xl sm:text-2xl font-bold mb-3 text-gray-900" style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
                Estimate Approval
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-6">
                Clients approve or reject estimates from the email link. Approved estimates can be converted to invoices.
              </p>
              
              {/* Mockup - Approved Estimate Card */}
              <div className="border transition-all duration-300 hover:shadow-lg bg-white border-gray-200 hover:bg-gray-50/50 mockup-hover">
                <div className="p-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 flex items-center justify-center bg-gray-100">
                          <ClipboardCheck className="h-3.5 w-3.5 text-gray-700" />
                        </div>
                        <div>
                          <div className="font-medium text-sm" style={{ color: '#1f2937' }}>EST-001</div>
                          <div className="text-xs" style={{ color: '#6b7280' }}>Acme Corporation</div>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <div className="font-semibold text-base text-gray-900">$2,500</div>
                        <div className="mt-0 mb-0.5 min-h-[12px]"></div>
                        <div className="text-xs" style={{ color: '#6b7280' }}>Dec 15, 2024</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-emerald-600">
                          <CheckCircle className="h-3 w-3" />
                          <span className="capitalize">Approved</span>
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button className="p-1.5 transition-colors hover:bg-gray-100 cursor-pointer">
                          <FileText className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 8 - Manage Clients */}
            <div className="group animate-card-8">
              <h3 className="text-xl sm:text-2xl font-bold mb-3 text-gray-900" style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
                Manage Clients
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-6">
                Store client information and quickly select them when creating invoices or estimates.
              </p>
              
              {/* Mockup - Client Card */}
              <div className="border transition-all duration-300 hover:shadow-lg bg-white border-gray-200 hover:bg-gray-50/50 mockup-hover">
                <div className="p-3">
                  <div className="flex items-center space-x-2.5 mb-3">
                    <div className="w-8 h-8 flex items-center justify-center bg-gray-100">
                      <Users className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <div className="font-medium text-sm" style={{ color: '#1f2937' }}>John Smith</div>
                      <div className="text-xs" style={{ color: '#6b7280' }}>Smith Industries</div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-600">john.smith@example.com</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-600">+1 (555) 987-6543</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-600">Los Angeles, CA</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Template Showcase Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-gray-900 tracking-tight" style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
              Professional Invoice Templates
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              Choose from beautifully designed templates. Customize colors to match your brand.
            </p>
          </div>
          
          {/* Template Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            
            {/* Template 1 - Minimal */}
            <div className="group">
              <div className="bg-white shadow-lg overflow-hidden transform transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1 border border-gray-200 flex flex-col" style={{ aspectRatio: '8.5/11' }}>
                {/* Header - Business Info Left, INVOICE Right */}
                <div className="flex justify-between items-start p-4 sm:p-5">
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-violet-600">Acme Corporation</h3>
                    <p className="text-[8px] sm:text-[9px] text-gray-500 leading-tight mt-1">123 Business Street</p>
                    <p className="text-[8px] sm:text-[9px] text-gray-500">New York, NY 10001</p>
                    <p className="text-[8px] sm:text-[9px] text-gray-500">+1 (555) 123-4567</p>
                    <p className="text-[8px] sm:text-[9px] text-violet-600">contact@acmecorp.com</p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-base sm:text-lg font-semibold text-violet-600 tracking-wide">INVOICE</h2>
                    <div className="inline-block bg-gray-900 text-white text-[7px] sm:text-[8px] px-2 py-1 mt-1.5">#INV-001</div>
                    <p className="text-[6px] sm:text-[7px] text-gray-500 mt-1.5">Issue: Nov 21, 2024</p>
                    <p className="text-[6px] sm:text-[7px] text-gray-500">Due: Dec 21, 2024</p>
                  </div>
                </div>
                
                {/* Divider Line */}
                <div className="mx-4 sm:mx-5 border-t border-gray-300"></div>
                
                {/* Bill To */}
                <div className="px-4 sm:px-5 py-3">
                  <p className="text-[8px] sm:text-[9px] font-medium text-violet-600 mb-1.5">Bill To</p>
                  <p className="text-[9px] sm:text-[10px] font-semibold text-gray-900">John Smith</p>
                  <p className="text-[7px] sm:text-[8px] text-gray-600">john.smith@example.com</p>
                  <p className="text-[7px] sm:text-[8px] text-gray-600">+1 (555) 987-6543</p>
                  <p className="text-[7px] sm:text-[8px] text-gray-600">Smith Industries</p>
                  <p className="text-[7px] sm:text-[8px] text-gray-600">456 Client Avenue, Los Angeles, CA 90001</p>
                </div>
                
                {/* Items Table */}
                <div className="px-4 sm:px-5 py-2 flex-1">
                  <div className="border-b border-gray-300 pb-1.5 mb-2">
                    <div className="grid grid-cols-12 text-[7px] sm:text-[8px] font-medium text-violet-600">
                      <span className="col-span-5">Description</span>
                      <span className="col-span-2 text-center">Qty</span>
                      <span className="col-span-2 text-center">Rate</span>
                      <span className="col-span-3 text-right">Amount</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="grid grid-cols-12 text-[7px] sm:text-[8px] border-b border-gray-100 pb-1.5">
                      <span className="col-span-5 text-gray-900">Web Development Services</span>
                      <span className="col-span-2 text-center text-gray-700">1</span>
                      <span className="col-span-2 text-center text-gray-500">$0.00</span>
                      <span className="col-span-3 text-right text-violet-600">$1,500.00</span>
                    </div>
                    <div className="grid grid-cols-12 text-[7px] sm:text-[8px] border-b border-gray-100 pb-1.5">
                      <span className="col-span-5 text-gray-900">UI/UX Design</span>
                      <span className="col-span-2 text-center text-gray-700">1</span>
                      <span className="col-span-2 text-center text-gray-500">$0.00</span>
                      <span className="col-span-3 text-right text-violet-600">$800.00</span>
                    </div>
                    <div className="grid grid-cols-12 text-[7px] sm:text-[8px] border-b border-gray-100 pb-1.5">
                      <span className="col-span-5 text-gray-900">Consulting Hours</span>
                      <span className="col-span-2 text-center text-gray-700">1</span>
                      <span className="col-span-2 text-center text-gray-500">$0.00</span>
                      <span className="col-span-3 text-right text-violet-600">$250.00</span>
                    </div>
                  </div>
                  
                  {/* Totals */}
                  <div className="flex justify-end mt-4">
                    <div className="text-right w-36">
                      <div className="flex justify-between text-[7px] sm:text-[8px] mb-1 border-t border-gray-200 pt-1">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="text-violet-600">$2,550.00</span>
                      </div>
                      <div className="flex justify-between text-[8px] sm:text-[9px] font-bold border-t border-gray-300 pt-1">
                        <span className="text-gray-900">Total:</span>
                        <span className="text-violet-600">$2,550.00</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Footer */}
                <div className="px-4 sm:px-5 py-2 border-t border-gray-300">
                  <p className="text-[7px] sm:text-[8px] font-medium text-violet-600">Payment Terms:</p>
                  <p className="text-[6px] sm:text-[7px] text-gray-600 mb-1.5">Net 30</p>
                  <p className="text-[7px] sm:text-[8px] font-medium text-violet-600">Notes:</p>
                  <p className="text-[6px] sm:text-[7px] text-gray-600">Thank you for your business.</p>
                </div>
              </div>
              <div className="text-center mt-4">
                <h3 className="text-lg font-bold text-gray-900">Minimal</h3>
                <p className="text-sm text-gray-500">Clean & Simple</p>
              </div>
            </div>

            {/* Template 2 - Modern */}
            <div className="group">
              <div className="bg-white shadow-lg overflow-hidden transform transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1 border border-gray-200 flex flex-col" style={{ aspectRatio: '8.5/11' }}>
                {/* Purple Header Banner */}
                <div className="bg-[#7C3AED] text-white p-4 sm:p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold">Acme Corporation</h3>
                      <p className="text-[7px] sm:text-[8px] opacity-90 leading-tight mt-1">123 Business Street</p>
                      <p className="text-[7px] sm:text-[8px] opacity-90">New York, NY 10001</p>
                      <p className="text-[7px] sm:text-[8px] opacity-90">+1 (555) 123-4567</p>
                      <p className="text-[7px] sm:text-[8px] opacity-90">contact@acmecorp.com</p>
                    </div>
                    <div className="text-right">
                      <h2 className="text-lg sm:text-xl font-bold tracking-wide">INVOICE</h2>
                    </div>
                  </div>
                </div>
                
                {/* Invoice Details Box + Bill To */}
                <div className="px-4 sm:px-5 py-3 relative">
                  <div className="border-2 border-violet-500 p-2.5 absolute right-4 sm:right-5 top-3 w-32 sm:w-36 bg-white">
                    <p className="text-[7px] sm:text-[8px] font-bold text-violet-600 uppercase">Invoice Details</p>
                    <p className="text-[8px] sm:text-[9px] font-semibold text-gray-900">#INV-002</p>
                    <p className="text-[6px] sm:text-[7px] text-orange-500 mt-1">Nov 21, 2024</p>
                    <p className="text-[6px] sm:text-[7px] text-gray-500">Due: Dec 21, 2024</p>
                  </div>
                  
                  {/* Bill To */}
                  <div className="pt-1 pr-36 sm:pr-40">
                    <p className="text-[8px] sm:text-[9px] font-bold text-violet-600 mb-1.5">BILL TO</p>
                    <p className="text-[9px] sm:text-[10px] font-semibold text-gray-900">John Smith</p>
                    <p className="text-[7px] sm:text-[8px] text-gray-600">john.smith@example.com</p>
                    <p className="text-[7px] sm:text-[8px] text-gray-600">+1 (555) 987-6543</p>
                    <p className="text-[7px] sm:text-[8px] text-gray-600">Smith Industries</p>
                    <p className="text-[7px] sm:text-[8px] text-gray-600">456 Client Avenue, Los Angeles, CA 90001</p>
                  </div>
                </div>
                
                {/* Items Table - Purple Header */}
                <div className="px-4 sm:px-5 py-2 flex-1">
                  <div className="bg-[#7C3AED] text-white">
                    <div className="grid grid-cols-12 text-[7px] sm:text-[8px] font-medium p-2 uppercase">
                      <span className="col-span-5">Description</span>
                      <span className="col-span-2 text-center">Qty</span>
                      <span className="col-span-2 text-center">Rate</span>
                      <span className="col-span-3 text-right">Amount</span>
                    </div>
                  </div>
                  <div className="border border-t-0 border-gray-200">
                    <div className="grid grid-cols-12 text-[7px] sm:text-[8px] p-2 border-b border-gray-100">
                      <span className="col-span-5 text-gray-900">Web Development Services</span>
                      <span className="col-span-2 text-center text-gray-700">1</span>
                      <span className="col-span-2 text-center text-gray-500">$0.00</span>
                      <span className="col-span-3 text-right text-gray-900">$1,500.00</span>
                    </div>
                    <div className="grid grid-cols-12 text-[7px] sm:text-[8px] p-2 bg-gray-50 border-b border-gray-100">
                      <span className="col-span-5 text-gray-900">UI/UX Design</span>
                      <span className="col-span-2 text-center text-gray-700">1</span>
                      <span className="col-span-2 text-center text-gray-500">$0.00</span>
                      <span className="col-span-3 text-right text-gray-900">$800.00</span>
                    </div>
                    <div className="grid grid-cols-12 text-[7px] sm:text-[8px] p-2">
                      <span className="col-span-5 text-gray-900">Consulting Hours</span>
                      <span className="col-span-2 text-center text-gray-700">1</span>
                      <span className="col-span-2 text-center text-gray-500">$0.00</span>
                      <span className="col-span-3 text-right text-gray-900">$250.00</span>
                    </div>
                  </div>
                  
                  {/* Totals Box */}
                  <div className="flex justify-end mt-4">
                    <div className="border-2 border-violet-500 p-2.5 w-36 bg-white">
                      <div className="flex justify-between text-[7px] sm:text-[8px] mb-1">
                        <span className="text-gray-600 uppercase">Subtotal</span>
                        <span className="text-violet-600">$2,550.00</span>
                      </div>
                      <div className="flex justify-between text-[8px] sm:text-[9px] font-bold border-t border-violet-200 pt-1">
                        <span className="text-gray-900 uppercase">Total</span>
                        <span className="text-violet-600">$2,550.00</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Footer */}
                <div className="px-4 sm:px-5 py-2 border-t border-gray-200">
                  <p className="text-[7px] sm:text-[8px] font-medium text-gray-900">Payment Terms:</p>
                  <p className="text-[6px] sm:text-[7px] text-gray-600 mb-1.5">Net 30</p>
                  <p className="text-[7px] sm:text-[8px] font-medium text-gray-900">Notes:</p>
                  <p className="text-[6px] sm:text-[7px] text-gray-600">Thank you for your business.</p>
                </div>
              </div>
              <div className="text-center mt-4">
                <h3 className="text-lg font-bold text-gray-900">Modern</h3>
                <p className="text-sm text-gray-500">Sleek & Professional</p>
              </div>
            </div>

            {/* Template 3 - Creative */}
            <div className="group">
              <div className="bg-white shadow-lg overflow-hidden transform transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1 border border-gray-200 flex flex-col" style={{ aspectRatio: '8.5/11' }}>
                {/* Gray Header Banner */}
                <div className="bg-gray-800 text-white p-4 sm:p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold">Acme Corporation</h3>
                      <p className="text-[7px] sm:text-[8px] opacity-90 leading-tight mt-1">123 Business Street</p>
                      <p className="text-[7px] sm:text-[8px] opacity-90">New York, NY 10001</p>
                      <p className="text-[7px] sm:text-[8px] opacity-90">+1 (555) 123-4567</p>
                      <p className="text-[7px] sm:text-[8px] opacity-90">contact@acmecorp.com</p>
                    </div>
                    <div className="text-right">
                      <h2 className="text-lg sm:text-xl font-bold tracking-wide">INVOICE</h2>
                    </div>
                  </div>
                </div>
                
                {/* Bill To + Invoice Details */}
                <div className="px-4 sm:px-5 py-3 flex justify-between items-start">
                  {/* Bill To - Left Side */}
                  <div className="flex-1">
                    <p className="text-[8px] sm:text-[9px] font-bold text-gray-700 mb-1.5">BILL TO</p>
                    <p className="text-[9px] sm:text-[10px] font-semibold text-gray-900">John Smith</p>
                    <p className="text-[7px] sm:text-[8px] text-gray-600">john.smith@example.com</p>
                    <p className="text-[7px] sm:text-[8px] text-gray-600">+1 (555) 987-6543</p>
                    <p className="text-[7px] sm:text-[8px] text-gray-600">Smith Industries</p>
                    <p className="text-[7px] sm:text-[8px] text-gray-600">456 Client Avenue, Los Angeles, CA 90001</p>
                  </div>
                  
                  {/* Invoice Details Box - Right Side */}
                  <div className="border border-gray-300 p-2.5 w-32 sm:w-36 ml-3 bg-white">
                    <p className="text-[6px] sm:text-[7px] text-gray-500">Invoice #</p>
                    <p className="text-[8px] sm:text-[9px] font-semibold text-gray-800">INV-003</p>
                    <p className="text-[6px] sm:text-[7px] text-gray-500 mt-1">Date:</p>
                    <p className="text-[7px] sm:text-[8px] font-medium text-gray-700">Nov 21, 2024</p>
                    <p className="text-[6px] sm:text-[7px] text-gray-500 mt-1">Due:</p>
                    <p className="text-[7px] sm:text-[8px] font-medium text-gray-700">Dec 21, 2024</p>
                  </div>
                </div>
                
                {/* Items Table - Gray Header */}
                <div className="px-4 sm:px-5 py-2 flex-1">
                  <div className="bg-gray-700 text-white">
                    <div className="grid grid-cols-12 text-[7px] sm:text-[8px] font-medium p-2 uppercase">
                      <span className="col-span-5">Description</span>
                      <span className="col-span-2 text-center">Qty</span>
                      <span className="col-span-2 text-center">Rate</span>
                      <span className="col-span-3 text-right">Amount</span>
                    </div>
                  </div>
                  <div className="border-x border-b border-gray-200">
                    <div className="grid grid-cols-12 text-[7px] sm:text-[8px] p-2 border-b border-gray-100">
                      <span className="col-span-5 text-gray-900">Web Development Services</span>
                      <span className="col-span-2 text-center text-gray-700">1</span>
                      <span className="col-span-2 text-center text-gray-500">$0.00</span>
                      <span className="col-span-3 text-right text-gray-900 font-medium">$1,500.00</span>
                    </div>
                    <div className="grid grid-cols-12 text-[7px] sm:text-[8px] p-2 bg-gray-50 border-b border-gray-100">
                      <span className="col-span-5 text-gray-900">UI/UX Design</span>
                      <span className="col-span-2 text-center text-gray-700">1</span>
                      <span className="col-span-2 text-center text-gray-500">$0.00</span>
                      <span className="col-span-3 text-right text-gray-900 font-medium">$800.00</span>
                    </div>
                    <div className="grid grid-cols-12 text-[7px] sm:text-[8px] p-2">
                      <span className="col-span-5 text-gray-900">Consulting Hours</span>
                      <span className="col-span-2 text-center text-gray-700">1</span>
                      <span className="col-span-2 text-center text-gray-500">$0.00</span>
                      <span className="col-span-3 text-right text-gray-900 font-medium">$250.00</span>
                    </div>
                  </div>
                  
                  {/* Totals Box */}
                  <div className="flex justify-end mt-4">
                    <div className="border border-gray-200 p-2.5 w-36 bg-white">
                      <div className="flex justify-between text-[7px] sm:text-[8px] mb-1">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="text-gray-900">$2,550.00</span>
                      </div>
                      <div className="flex justify-between text-[8px] sm:text-[9px] font-bold border-t border-gray-200 pt-1">
                        <span className="text-gray-800">Total</span>
                        <span className="text-gray-900">$2,550.00</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Footer */}
                <div className="px-4 sm:px-5 py-2 border-t border-gray-200">
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="text-[7px] sm:text-[8px] font-medium text-gray-700">Payment Terms</p>
                      <p className="text-[6px] sm:text-[7px] text-gray-600">Net 30</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[7px] sm:text-[8px] font-medium text-gray-500">Notes</p>
                      <p className="text-[6px] sm:text-[7px] text-gray-600">Thank you for your business.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-center mt-4">
                <h3 className="text-lg font-bold text-gray-900">Creative</h3>
                <p className="text-sm text-gray-500">Bold & Dynamic</p>
              </div>
            </div>
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
            <div className="border-2 border-gray-200 bg-white p-6 sm:p-8 hover:border-gray-300 transition-all duration-200">
              <div className="text-center">
                <h3 className="font-heading text-xl sm:text-2xl font-semibold text-gray-900 mb-2">Free</h3>
                <div className="mb-6">
                  <span className="font-heading text-4xl sm:text-5xl font-semibold text-gray-900">$0</span>
                  <span className="text-gray-600 text-lg">/forever</span>
              </div>
                <p className="text-sm text-gray-600 mb-6">Perfect for getting started</p>
              <button
                onClick={handleGetStarted}
                  className="w-full px-6 py-3 text-sm sm:text-base font-medium text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 transition-colors mb-6"
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
            <div className="border-2 border-[#a855f7] bg-white p-6 sm:p-8 hover:border-[#9333ea] transition-all duration-200 relative">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <span className="bg-[#a855f7] text-white text-xs font-semibold px-3 py-1">POPULAR</span>
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
                  className="w-full px-6 py-3 text-sm sm:text-base font-medium text-white bg-[#a855f7] hover:bg-[#9333ea] transition-colors mb-6"
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
            <div className="border-2 border-gray-200 bg-white p-6 sm:p-8 hover:border-gray-300 transition-all duration-200">
              <div className="text-center">
                <h3 className="font-heading text-xl sm:text-2xl font-semibold text-gray-900 mb-2">Pay Per Invoice</h3>
                <div className="mb-6">
                  <span className="font-heading text-4xl sm:text-5xl font-semibold text-gray-900">$0.50</span>
                  <span className="text-gray-600 text-lg">/invoice</span>
                </div>
                <p className="text-sm text-gray-600 mb-6">Pay only for what you use</p>
              <button
                onClick={handleGetStarted}
                  className="w-full px-6 py-3 text-sm sm:text-base font-medium text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 transition-colors mb-6"
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
              <div className="sticky top-8 space-y-2 bg-white border-gray-200 border p-4 backdrop-blur-sm">
                <button 
                  onClick={() => setActiveFaqCategory('General')}
                  className={`w-full text-left px-4 py-3 transition-colors cursor-pointer ${
                    activeFaqCategory === 'General'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  General
                </button>
                <button 
                  onClick={() => setActiveFaqCategory('Plans & Pricing')}
                  className={`w-full text-left px-4 py-3 transition-colors cursor-pointer ${
                    activeFaqCategory === 'Plans & Pricing'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Plans & Pricing
                </button>
                <button 
                  onClick={() => setActiveFaqCategory('Features')}
                  className={`w-full text-left px-4 py-3 transition-colors cursor-pointer ${
                    activeFaqCategory === 'Features'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Features
                </button>
                <button 
                  onClick={() => setActiveFaqCategory('Security')}
                  className={`w-full text-left px-4 py-3 transition-colors cursor-pointer ${
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
                    <div className="border transition-all duration-200 bg-white border-gray-200 hover:border-gray-300 backdrop-blur-sm">
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

                    <div className="border transition-all duration-200 bg-white border-gray-200 hover:border-gray-300 backdrop-blur-sm">
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

                    <div className="border transition-all duration-200 bg-white border-gray-200 hover:border-gray-300 backdrop-blur-sm">
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
                    <div className="border transition-all duration-200 bg-white border-gray-200 hover:border-gray-300 backdrop-blur-sm">
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

                    <div className="border transition-all duration-200 bg-white border-gray-200 hover:border-gray-300 backdrop-blur-sm">
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

                    <div className="border transition-all duration-200 bg-white border-gray-200 hover:border-gray-300 backdrop-blur-sm">
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
                    <div className="border transition-all duration-200 bg-white border-gray-200 hover:border-gray-300 backdrop-blur-sm">
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

                    <div className="border transition-all duration-200 bg-white border-gray-200 hover:border-gray-300 backdrop-blur-sm">
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

                    <div className="border transition-all duration-200 bg-white border-gray-200 hover:border-gray-300 backdrop-blur-sm">
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

                    <div className="border transition-all duration-200 bg-white border-gray-200 hover:border-gray-300 backdrop-blur-sm">
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

                    <div className="border transition-all duration-200 bg-white border-gray-200 hover:border-gray-300 backdrop-blur-sm">
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
                    <div className="border transition-all duration-200 bg-white border-gray-200 hover:border-gray-300 backdrop-blur-sm">
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

                    <div className="border transition-all duration-200 bg-white border-gray-200 hover:border-gray-300 backdrop-blur-sm">
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

                    <div className="border transition-all duration-200 bg-white border-gray-200 hover:border-gray-300 backdrop-blur-sm">
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
            className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-black hover:bg-gray-800 transition-colors"
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






