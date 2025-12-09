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
  Minus
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
  const [invoiceStep, setInvoiceStep] = useState(1); // 1: client, 2: services, 3: settings, 4: review, 5: created
  const [emailStep, setEmailStep] = useState(1); // 1: preparing, 2: sending, 3: sent, 4: delivered
  const [activityStep, setActivityStep] = useState(1); // 1: sent, 2: viewed, 3: reminder
  const [paymentStep, setPaymentStep] = useState(1); // 1: invoice sent, 2: client receives, 3: client copies, 4: client pays externally

  // Optimize: Combine all animations into a single useEffect to reduce re-renders
  useEffect(() => {
    setIsVisible(true);
    
    // Animate invoice creation steps
    const invoiceSteps = [1, 2, 3, 4, 5];
    let invoiceIndex = 0;
    const invoiceInterval = setInterval(() => {
      invoiceIndex = (invoiceIndex + 1) % invoiceSteps.length;
      setInvoiceStep(invoiceSteps[invoiceIndex]);
    }, 3000);
    
    // Animate email sending steps
    const emailSteps = [1, 2, 3, 4];
    let emailIndex = 0;
    const emailInterval = setInterval(() => {
      emailIndex = (emailIndex + 1) % emailSteps.length;
      setEmailStep(emailSteps[emailIndex]);
    }, 2500);
    
    // Animate activity tracking steps
    const activitySteps = [1, 2, 3];
    let activityIndex = 0;
    const activityInterval = setInterval(() => {
      activityIndex = (activityIndex + 1) % activitySteps.length;
      setActivityStep(activitySteps[activityIndex]);
    }, 3000);
    
    // Animate payment flow steps
    const paymentSteps = [1, 2, 3, 4];
    let paymentIndex = 0;
    const paymentInterval = setInterval(() => {
      paymentIndex = (paymentIndex + 1) % paymentSteps.length;
      setPaymentStep(paymentSteps[paymentIndex]);
    }, 3000);
    
    return () => {
      clearInterval(invoiceInterval);
      clearInterval(emailInterval);
      clearInterval(activityInterval);
      clearInterval(paymentInterval);
    };
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
            {/* Step 1 - Create Invoice - GitHub Copilot Style Design */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              {/* Left Content */}
              <div className="lg:col-span-5 order-2 lg:order-1 lg:sticky lg:top-24">
                <div className="mb-3">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Step 01</span>
                </div>
                <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-gray-900 mb-4 leading-tight tracking-tight" style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
                  Create Invoice
              </h3>
            <p className="text-lg text-gray-600 leading-relaxed mb-8" style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
                  Select your client, add line items, and choose a template. Your invoice is ready in seconds.
                </p>
                
                {/* Feature Cards - GitHub Copilot Style */}
                <div className="space-y-4">
                  <div className="group p-5 bg-white border border-gray-100 rounded-xl hover:border-violet-200 hover:shadow-md transition-all duration-200">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-100 transition-colors">
                        <Palette className="w-5 h-5 text-violet-500" />
            </div>
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-gray-800 mb-1.5">Professional Templates</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          Choose from multiple invoice templates. Customize colors, add your logo, and brand your invoices.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="group p-5 bg-white border border-gray-100 rounded-xl hover:border-blue-200 hover:shadow-md transition-all duration-200">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                        <Zap className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-gray-800 mb-1.5">Fast & Simple</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          Create invoices in under 30 seconds. Select client, add items, choose template—done.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Visual - Animated Invoice Modal - Clean Design */}
              <div className="lg:col-span-7 order-1 lg:order-2 relative px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-10">
                {/* Directional Glow Effect - Bottom Center */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-32 rounded-2xl opacity-[0.12] blur-3xl" style={{
                  background: 'radial-gradient(ellipse at center, #a855f7, #9333ea, transparent)',
                  zIndex: 0
                }}></div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-24 rounded-2xl opacity-[0.08] blur-2xl" style={{
                  background: 'radial-gradient(ellipse at center, #a855f7, transparent)',
                  zIndex: 1
                }}></div>
                
                <div className="relative z-10 bg-white rounded-xl sm:rounded-2xl shadow-lg max-w-lg w-full mx-auto overflow-hidden border border-gray-200">
                  {/* Modal Header - Refined Design */}
                  <div className="flex items-center justify-between p-3 sm:p-4 lg:p-5 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 rounded-lg bg-indigo-50/50 shadow-sm">
                        <Sparkles className="h-5 w-5 text-indigo-500" />
                      </div>
                      <div>
                        <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                          Detailed Invoice
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-500">
                          Create professional invoices with auto reminders
                        </p>
                      </div>
                    </div>
                    <button className="transition-colors p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Step Indicator - Refined Design */}
                  <div className="px-3 sm:px-4 lg:px-5 py-2.5 sm:py-3 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center justify-center space-x-1 sm:space-x-3">
                      {[
                        { step: 1, label: 'Client', icon: User },
                        { step: 2, label: 'Services', icon: FileText },
                        { step: 3, label: 'Settings', icon: Settings },
                        { step: 4, label: 'Review', icon: CheckCircle }
                      ].map(({ step, label, icon: Icon }) => {
                        const isActive = invoiceStep === step;
                        const isCompleted = invoiceStep > step;
                        return (
                          <div key={step} className="flex items-center flex-shrink-0">
                            <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-500 ${
                              isActive || isCompleted
                                ? 'bg-indigo-500 text-white'
                                : 'bg-gray-200 text-gray-500'
                            }`}>
                              {isCompleted ? (
                                <CheckCircle className="h-3 w-3" />
                              ) : (
                                <Icon className="h-3 w-3" />
                              )}
                            </div>
                            <span className={`ml-1 sm:ml-2 text-xs font-medium hidden xs:inline transition-colors ${
                              isActive || isCompleted ? 'text-indigo-500' : 'text-gray-500'
                            }`}>
                              {label}
                            </span>
                            {step < 4 && (
                              <div className={`w-2 sm:w-6 h-0.5 mx-1 sm:mx-3 transition-colors duration-500 ${
                                isCompleted ? 'bg-indigo-500' : 'bg-gray-200'
                              }`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Form Content - One Step at a Time - Fixed Height */}
                  <div className="px-3 sm:px-4 lg:px-5 pb-3 sm:pb-4 lg:pb-5 h-[380px] sm:h-[400px] lg:h-[420px] overflow-hidden relative bg-white">
                    {/* Fade gradient overlay at bottom */}
                    <div className="absolute bottom-16 left-0 right-0 h-12 bg-gradient-to-t from-white via-white/95 to-transparent pointer-events-none z-10"></div>
                    {/* Step 1: Client Selection - Full Page */}
                    {invoiceStep === 1 && (
                      <div className="absolute inset-x-0 top-0 bottom-0 px-4 sm:px-5 pt-4 pb-20 flex flex-col animate-[fadeIn_0.5s_ease-in]">
                        <div className="flex-1 overflow-y-auto scrollbar-hide">
                          <div className="text-center mb-4">
                            <h3 className="text-sm font-semibold mb-1.5 text-gray-900">Client & Invoice Details</h3>
                            <p className="text-xs text-gray-500">Select client and set basic information</p>
                          </div>

                          {/* Client Selection */}
                          <div className="p-4 mb-4">
                            <h4 className="text-sm font-semibold mb-2 flex items-center text-gray-700">
                              <User className="h-4 w-4 mr-2 text-indigo-500" />
                              Select Client
                            </h4>

                            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50/50 border border-gray-100 animate-[slideInLeft_0.5s_ease-in]">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-indigo-50">
                                  <User className="h-4 w-4 text-indigo-500" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">Acme Corporation</p>
                                  <p className="text-xs text-gray-500">john@acme.com</p>
                                </div>
                              </div>
                              <button className="text-xs font-medium px-3 py-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                                Change
                              </button>
                            </div>
                          </div>

                          {/* Invoice Details */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div>
                              <div className="relative">
                                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                  type="text"
                                  value="INV-001234"
                                  readOnly
                                  className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50/50 text-gray-600"
                                />
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                  <div className="w-2 h-2 rounded-full bg-green-500" title="Auto-generated"></div>
                                </div>
                              </div>
                              <p className="text-xs mt-1 text-gray-500">Auto-generated</p>
                            </div>

                            <div>
                              <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                  type="date"
                                  value="2024-01-15"
                                  className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900"
                                />
                              </div>
                              <p className="text-xs mt-1 text-gray-500">Issue Date</p>
                            </div>

                            <div>
                              <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                  type="date"
                                  value="2024-01-29"
                                  className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900"
                                />
                              </div>
                              <p className="text-xs mt-1 text-gray-500">Due Date</p>
                            </div>
                          </div>
                        </div>

                        {/* Next Button - Fixed at bottom */}
                        <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-5 pt-3 pb-4 border-t border-gray-100 bg-white">
                          <button className="w-full sm:w-auto sm:ml-auto bg-indigo-500 text-white py-2.5 px-6 rounded-lg hover:bg-indigo-600 transition-colors font-medium flex items-center justify-center space-x-2 text-sm shadow-sm">
                            <span>Next</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Services - Full Page */}
                    {invoiceStep === 2 && (
                      <div className="absolute inset-x-0 top-0 bottom-0 px-4 sm:px-5 pt-4 pb-20 flex flex-col animate-[fadeIn_0.5s_ease-in]">
                        <div className="flex-1 overflow-y-auto scrollbar-hide">
                          <div className="text-center mb-4">
                            <h3 className="text-sm sm:text-base font-semibold mb-1 text-gray-900">Services & Amount</h3>
                            <p className="text-xs text-gray-500">Add the services you provided and their amounts</p>
                          </div>

                          {/* Services List */}
                          <div className="space-y-2 mb-3">
                            {/* Service 1 */}
                            <div className="p-3 border border-gray-100 rounded-lg bg-gray-50/30 animate-[slideInLeft_0.5s_ease-in]">
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="sm:col-span-2">
                                  <label className="block text-xs font-medium mb-1 text-gray-600">
                                    Service Description *
                                  </label>
                                  <input
                                    type="text"
                                    value="Website Development"
                                    readOnly
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium mb-1 text-gray-600">
                                    Amount ($)
                                  </label>
                                  <input
                                    type="text"
                                    value="2,500"
                                    readOnly
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Service 2 */}
                            <div className="p-3 border border-gray-100 rounded-lg bg-gray-50/30 animate-[slideInLeft_0.5s_ease-in]">
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="sm:col-span-2">
                                  <label className="block text-xs font-medium mb-1 text-gray-600">
                                    Service Description *
                                  </label>
                                  <input
                                    type="text"
                                    value="UI/UX Design"
                                    readOnly
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium mb-1 text-gray-600">
                                    Amount ($)
                                  </label>
                                  <input
                                    type="text"
                                    value="1,500"
                                    readOnly
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Total */}
                          <div className="flex items-center justify-between py-3 border-t border-gray-100">
                            <span className="text-sm text-gray-500">Total</span>
                            <span className="text-xl font-bold text-gray-900">$4,000</span>
                          </div>
                        </div>

                        {/* Next Button - Fixed at bottom */}
                        <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-5 pt-3 pb-4 border-t border-gray-100 bg-white">
                          <button className="w-full sm:w-auto sm:ml-auto bg-indigo-500 text-white py-2.5 px-6 rounded-lg hover:bg-indigo-600 transition-colors font-medium flex items-center justify-center space-x-2 text-sm shadow-sm">
                            <span>Next</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 3: Settings/Template - Full Page */}
                    {invoiceStep === 3 && (
                      <div className="absolute inset-x-0 top-0 bottom-0 px-4 sm:px-5 pt-4 pb-20 flex flex-col animate-[fadeIn_0.5s_ease-in]">
                        <div className="flex-1 overflow-y-auto scrollbar-hide">
                          <div className="text-center mb-3">
                            <h3 className="text-xs sm:text-sm font-semibold mb-1 text-gray-900">Invoice Settings</h3>
                            <p className="text-xs text-gray-500">Configure template and colors</p>
                          </div>

                          {/* Template Selection */}
                          <div className="mb-3">
                            <h4 className="text-xs font-semibold mb-1.5 flex items-center text-gray-700">
                              <Layout className="h-3.5 w-3.5 mr-1.5 text-indigo-500" />
                              Select Template
                            </h4>
                            <div className="grid grid-cols-3 gap-2">
                              {/* Template 1: Minimal */}
                              <div className="p-1.5 border border-gray-100 rounded-lg bg-white cursor-pointer hover:border-gray-200 transition-colors">
                                <div className="w-full h-10 rounded border border-gray-100 bg-gray-50/50 mb-1 flex items-center justify-center">
                                  <FileText className="h-3.5 w-3.5 text-gray-400" />
                                </div>
                                <h5 className="text-xs font-semibold text-gray-900 mb-0.5">Minimal</h5>
                                <p className="text-[10px] text-gray-500 leading-tight">Clean</p>
                              </div>

                              {/* Template 2: Modern - Selected */}
                              <div className="p-1.5 border-2 border-indigo-500 rounded-lg bg-indigo-50/50 cursor-pointer relative">
                                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-indigo-500 rounded-full flex items-center justify-center">
                                  <Check className="h-2 w-2 text-white" />
                                </div>
                                <div className="w-full h-10 rounded border border-indigo-100 bg-white mb-1 flex items-center justify-center">
                                  <Layout className="h-3.5 w-3.5 text-indigo-500" />
                                </div>
                                <h5 className="text-xs font-semibold text-gray-900 mb-0.5">Modern</h5>
                                <p className="text-[10px] text-gray-500 leading-tight">Sleek</p>
                              </div>

                              {/* Template 3: Creative */}
                              <div className="p-1.5 border border-gray-100 rounded-lg bg-white cursor-pointer hover:border-gray-200 transition-colors">
                                <div className="w-full h-10 rounded border border-gray-100 bg-gray-50/50 mb-1 flex items-center justify-center">
                                  <PenTool className="h-3.5 w-3.5 text-gray-400" />
                                </div>
                                <h5 className="text-xs font-semibold text-gray-900 mb-0.5">Creative</h5>
                                <p className="text-[10px] text-gray-500 leading-tight">Bold</p>
                              </div>
                            </div>
                          </div>

                          {/* Color Customization */}
                          <div className="mb-3">
                            <h4 className="text-xs font-semibold mb-1.5 flex items-center text-gray-700">
                              <Palette className="h-3.5 w-3.5 mr-1.5 text-indigo-500" />
                              Customize Colors
                            </h4>
                            <div className="space-y-1.5">
                              {/* Primary & Secondary Colors - Side by Side */}
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Primary</label>
                                  <div className="flex items-center gap-1">
                                    <div className="w-7 h-7 rounded border border-gray-200 flex-shrink-0" style={{ backgroundColor: '#7C3AED' }}>
                                    </div>
                                    <input
                                      type="text"
                                      value="#7C3AED"
                                      readOnly
                                      className="flex-1 px-1.5 py-1 text-xs border border-gray-200 rounded bg-white text-gray-900"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Secondary</label>
                                  <div className="flex items-center gap-1">
                                    <div className="w-7 h-7 rounded border border-gray-200 flex-shrink-0" style={{ backgroundColor: '#A855F7' }}>
                                    </div>
                                    <input
                                      type="text"
                                      value="#A855F7"
                                      readOnly
                                      className="flex-1 px-1.5 py-1 text-xs border border-gray-200 rounded bg-white text-gray-900"
                                    />
                                  </div>
                                </div>
                              </div>
                              {/* Color Presets */}
                              <div>
                                <label className="block text-[10px] font-medium text-gray-600 mb-1">Presets</label>
                                <div className="flex flex-wrap gap-1">
                                  {[
                                    { name: 'Purple', primary: '#5C2D91', secondary: '#8B5CF6' },
                                    { name: 'Blue', primary: '#1E40AF', secondary: '#3B82F6' },
                                    { name: 'Green', primary: '#059669', secondary: '#10B981' },
                                    { name: 'Indigo', primary: '#4338CA', secondary: '#6366F1' }
                                  ].map((preset) => (
                                    <div key={preset.name} className="flex items-center gap-0.5 px-1 py-0.5 border border-gray-100 rounded hover:border-gray-200 cursor-pointer transition-colors bg-white">
                                      <div className="flex gap-0.5">
                                        <div className="w-2.5 h-2.5 rounded-full border border-gray-200" style={{ backgroundColor: preset.primary }}></div>
                                        <div className="w-2.5 h-2.5 rounded-full border border-gray-200" style={{ backgroundColor: preset.secondary }}></div>
                                      </div>
                                      <span className="text-[10px] text-gray-600">{preset.name}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Next Button - Fixed at bottom */}
                        <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-5 pt-3 pb-4 border-t border-gray-100 bg-white">
                          <button className="w-full sm:w-auto sm:ml-auto bg-indigo-500 text-white py-2.5 px-6 rounded-lg hover:bg-indigo-600 transition-colors font-medium flex items-center justify-center space-x-2 text-sm shadow-sm">
                            <span>Next</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 4: Review/Create - Full Page */}
                    {invoiceStep === 4 && (
                      <div className="absolute inset-x-0 top-0 bottom-0 px-4 sm:px-5 pt-4 pb-20 flex flex-col animate-[fadeIn_0.5s_ease-in]">
                        <div className="flex-1 overflow-y-auto scrollbar-hide">
                          <div className="text-center mb-5">
                            <h3 className="text-sm font-semibold mb-1 text-gray-900">Review & Create</h3>
                            <p className="text-xs text-gray-500">Review your invoice details before creating</p>
                          </div>

                          {/* Summary */}
                          <div className="space-y-3 mb-4">
                            <div className="p-3 border border-gray-100 rounded-lg bg-gray-50/30">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-gray-700">Client</span>
                              </div>
                              <p className="text-sm text-gray-800">Acme Corporation</p>
                              <p className="text-xs text-gray-500">john@acme.com</p>
                            </div>

                            <div className="p-3 border border-gray-100 rounded-lg bg-gray-50/30">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-gray-700">Services</span>
                              </div>
                              <div className="space-y-1.5">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Website Development</span>
                                  <span className="text-gray-900 font-medium">$2,500</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">UI/UX Design</span>
                                  <span className="text-gray-900 font-medium">$1,500</span>
                                </div>
                              </div>
                              <div className="flex justify-between pt-2 mt-2 border-t border-gray-100">
                                <span className="text-sm font-semibold text-gray-900">Total</span>
                                <span className="text-lg font-bold text-gray-900">$4,000</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Create Button - Fixed at bottom */}
                        <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-5 pt-3 pb-4 border-t border-gray-100 bg-white">
                          <button className="w-full sm:w-auto sm:ml-auto bg-indigo-500 text-white py-2.5 px-6 rounded-lg hover:bg-indigo-600 transition-colors font-medium flex items-center justify-center space-x-2 text-sm shadow-sm">
                            <span>Create Invoice</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 5: Success - Full Page */}
                    {invoiceStep === 5 && (
                      <div className="absolute inset-x-0 top-0 px-4 sm:px-5 pt-6 pb-4 text-center animate-[fadeIn_0.5s_ease-in]">
                        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                          <CheckCircle className="h-8 w-8 text-green-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Invoice Created!</h3>
                        <p className="text-sm text-gray-500 mb-6">Your invoice has been created successfully</p>
                        <div className="p-4 border border-gray-100 rounded-lg bg-gray-50/30 inline-block">
                          <p className="text-sm font-medium text-gray-900">Invoice #INV-001234</p>
                          <p className="text-xs text-gray-500 mt-1">Ready to send</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 - Send Automatically - GitHub Copilot Style Design */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              {/* Left Content */}
              <div className="lg:col-span-5 order-2 lg:order-1 lg:sticky lg:top-24">
                <div className="mb-3">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Step 02</span>
                </div>
                <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-gray-900 mb-4 leading-tight tracking-tight" style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
                  Send Automatically
                </h3>
                <p className="text-lg text-gray-600 leading-relaxed mb-8" style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
                  Your invoice is sent via email with a PDF attachment. No manual work required.
                </p>
                
                {/* Feature Cards - GitHub Copilot Style */}
                <div className="space-y-4">
                  <div className="group p-5 bg-white border border-gray-100 rounded-xl hover:border-green-200 hover:shadow-md transition-all duration-200">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0 group-hover:bg-green-100 transition-colors">
                        <Send className="w-5 h-5 text-green-500" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-gray-800 mb-1.5">Auto-Send Email</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          Invoices are automatically sent to clients via email. No manual sending required—just create and it&apos;s delivered.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="group p-5 bg-white border border-gray-100 rounded-xl hover:border-blue-200 hover:shadow-md transition-all duration-200">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                        <FileText className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-gray-800 mb-1.5">PDF Attached</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          Every invoice is automatically converted to a professional PDF and attached to the email. Your clients receive a polished, ready-to-pay invoice.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Visual - Email Preview Mockup - Clean Design */}
              <div className="lg:col-span-7 order-1 lg:order-2 relative px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-10">
                {/* Directional Glow Effect - Bottom Center */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-32 rounded-2xl opacity-[0.12] blur-3xl" style={{
                  background: 'radial-gradient(ellipse at center, #a855f7, #9333ea, transparent)',
                  zIndex: 0
                }}></div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-24 rounded-2xl opacity-[0.08] blur-2xl" style={{
                  background: 'radial-gradient(ellipse at center, #a855f7, transparent)',
                  zIndex: 1
                }}></div>
                
                <div className="relative z-10 bg-white rounded-xl sm:rounded-2xl shadow-lg max-w-lg w-full mx-auto overflow-hidden border border-gray-200 h-[380px] sm:h-[400px] lg:h-[420px]">
                  {/* Email Preview Card - Clean Minimal Design */}
                  <div className="p-4 sm:p-5 h-full overflow-y-auto scrollbar-hide">
                    {/* From Header - Minimal */}
                    <div className={`mb-4 pb-3 border-b border-gray-100 transition-all duration-500 ${
                      emailStep >= 1 ? 'opacity-100' : 'opacity-0'
                    }`}>
                      <div className="text-xs text-gray-500 mb-1">From</div>
                      <div className="text-sm font-medium text-gray-900">Acme Corporation &lt;john@acme.com&gt;</div>
                    </div>
                    
                    {/* Subject - Minimal */}
                    <div className={`mb-3 transition-all duration-500 ${
                      emailStep >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                    }`}>
                      <div className="text-xs text-gray-500 mb-1">Subject</div>
                      <div className="text-sm font-medium text-gray-900">Invoice #INV-001234</div>
                    </div>
                    
                    {/* Message Preview - Minimal */}
                    <div className={`mb-4 transition-all duration-500 ${
                      emailStep >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                    }`}>
                      <div className="text-xs text-gray-600 leading-relaxed">
                        Hi John,<br />
                        Please find attached your invoice for $4,000.<br />
                        Payment is due by Jan 29, 2024.
                      </div>
                    </div>
                    
                    {/* Attachment - Clean Minimal */}
                    <div className={`flex items-center gap-2 p-2.5 bg-gray-50/30 rounded-md border border-gray-100 mb-4 transition-all duration-500 ${
                      emailStep >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                    }`}>
                      <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-gray-900 truncate">Invoice_001234.pdf</div>
                        <div className="text-[10px] text-gray-500">245 KB</div>
                      </div>
                    </div>
                    
                    {/* Status - Minimal */}
                    <div className={`flex items-center justify-between pt-3 border-t border-gray-100 transition-all duration-500 ${
                      emailStep >= 3 ? 'opacity-100' : 'opacity-0'
                    }`}>
                      <div className="flex items-center gap-1.5">
                        {emailStep === 3 && (
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                        )}
                        {emailStep === 4 && (
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                        )}
                        <span className="text-xs text-gray-600">
                          {emailStep === 3 && 'Sent'}
                          {emailStep === 4 && 'Delivered'}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-500">
                        {emailStep === 3 && 'Just now'}
                        {emailStep === 4 && '2 min ago'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Auto-sent Badge - Minimal */}
                  <div className={`absolute top-2.5 right-2.5 bg-white rounded-md px-2 py-1 shadow-sm border border-gray-100 flex items-center gap-1.5 transition-all duration-500 ${
                    emailStep >= 3 ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                  }`}>
                    <div className={`w-3 h-3 rounded-full flex items-center justify-center transition-colors duration-300 ${
                      emailStep === 3 ? 'bg-blue-500' : 'bg-green-500'
                    }`}>
                      {emailStep === 3 ? (
                        <Send className="h-1.5 w-1.5 text-white" />
                      ) : (
                        <CheckCircle className="h-1.5 w-1.5 text-white" />
                      )}
                    </div>
                    <span className="text-[10px] font-medium text-gray-700">
                      {emailStep === 3 ? 'Sending' : 'Auto-sent'}
                    </span>
                  </div>
                  
                  {/* Sending Animation - Minimal */}
                  {emailStep === 2 && (
                    <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center animate-[fadeIn_0.3s_ease-in]">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                          <Send className="h-4 w-4 text-blue-500" />
                        </div>
                        <span className="text-xs font-medium text-gray-600">Sending...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Step 3 - Track & Remind - GitHub Copilot Style Design */}
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
                  See when clients view your invoices. Automated reminders are sent based on your schedule.
                </p>
                
                {/* Feature Cards - GitHub Copilot Style */}
                <div className="space-y-4">
                  <div className="group p-5 bg-white border border-gray-100 rounded-xl hover:border-emerald-200 hover:shadow-md transition-all duration-200">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-100 transition-colors">
                        <Eye className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-gray-800 mb-1.5">Track Views</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          See exactly when clients open and view your invoices. Know who&apos;s seen what and when.
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

              {/* Right Visual - Activity Tracking Mockup - Clean Design */}
              <div className="lg:col-span-7 order-1 lg:order-2 relative px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-10">
                {/* Directional Glow Effect - Bottom Center */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-32 rounded-2xl opacity-[0.12] blur-3xl" style={{
                  background: 'radial-gradient(ellipse at center, #a855f7, #9333ea, transparent)',
                  zIndex: 0
                }}></div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-24 rounded-2xl opacity-[0.08] blur-2xl" style={{
                  background: 'radial-gradient(ellipse at center, #a855f7, transparent)',
                  zIndex: 1
                }}></div>
                
                <div className="relative z-10 bg-white rounded-xl sm:rounded-2xl shadow-lg max-w-lg w-full mx-auto overflow-hidden border border-gray-200 h-[380px] sm:h-[400px] lg:h-[420px]">
                  {/* Activity Card - Clean Minimal Design */}
                  <div className="p-4 sm:p-5 h-full overflow-y-auto scrollbar-hide">
                    {/* Header - Minimal */}
                    <div className="mb-4 pb-3 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-gray-900">Activity</div>
                        <div className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded">INV-001234</div>
                      </div>
                    </div>
                    
                    {/* Timeline - Animated */}
                    <div className="space-y-4">
                      {/* Invoice Sent */}
                      <div className={`flex gap-3 transition-all duration-500 ${
                        activityStep >= 1 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
                      }`}>
                        <div className="flex flex-col items-center flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                            <Send className="h-3.5 w-3.5 text-blue-500" />
                          </div>
                          {activityStep >= 2 && (
                            <div className="w-0.5 h-6 bg-gray-100 mt-2"></div>
                          )}
                        </div>
                        <div className="flex-1 pt-1">
                          <div className="text-sm font-medium text-gray-900">Invoice Sent</div>
                          <div className="text-xs text-gray-500 mt-0.5">Jan 10, 2024</div>
                        </div>
                      </div>
                      
                      {/* Invoice Viewed */}
                      {activityStep >= 2 && (
                        <div className={`flex gap-3 transition-all duration-500 ${
                          activityStep >= 2 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
                        }`}>
                          <div className="flex flex-col items-center flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                              <Eye className="h-3.5 w-3.5 text-emerald-500" />
                            </div>
                            {activityStep >= 3 && (
                              <div className="w-0.5 h-6 bg-gray-100 mt-2"></div>
                            )}
                          </div>
                          <div className="flex-1 pt-1">
                            <div className="text-sm font-medium text-gray-900">Invoice Viewed</div>
                            <div className="text-xs text-gray-500 mt-0.5">Today, 2:30 PM</div>
                          </div>
                        </div>
                      )}
                      
                      {/* Reminder Sent */}
                      {activityStep >= 3 && (
                        <div className={`flex gap-3 transition-all duration-500 ${
                          activityStep >= 3 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
                        }`}>
                          <div className="flex flex-col items-center flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
                              <Bell className="h-3.5 w-3.5 text-amber-500" />
                            </div>
                          </div>
                          <div className="flex-1 pt-1">
                            <div className="text-sm font-medium text-gray-900">Reminder Sent</div>
                            <div className="text-xs text-gray-500 mt-0.5">Just now</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Auto-remind Badge - Minimal */}
                  <div className="absolute top-2.5 right-2.5 bg-white rounded-md px-2 py-1 shadow-sm border border-gray-100 flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                    <span className="text-[10px] font-medium text-gray-700">Auto-remind</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4 - Get Paid - GitHub Copilot Style Design */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              {/* Left Content */}
              <div className="lg:col-span-5 order-2 lg:order-1 lg:sticky lg:top-24">
                <div className="mb-3">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Step 04</span>
                </div>
                <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-gray-900 mb-4 leading-tight tracking-tight" style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
                  Get Paid Faster
                </h3>
                <p className="text-lg text-gray-600 leading-relaxed mb-8" style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
                  Clients pay through their preferred method. Payments go directly to your account — no fees, no hidden charges.
                </p>
                
                {/* Feature Cards - GitHub Copilot Style */}
                <div className="space-y-4">
                  <div className="group p-5 bg-white border border-gray-100 rounded-xl hover:border-emerald-200 hover:shadow-md transition-all duration-200">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-100 transition-colors">
                        <CreditCard className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-gray-800 mb-1.5">Multiple Payment Methods</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          Accept payments via PayPal, Stripe, Venmo, and more. Clients choose their preferred method.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="group p-5 bg-white border border-gray-100 rounded-xl hover:border-blue-200 hover:shadow-md transition-all duration-200">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                        <DollarSign className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-gray-800 mb-1.5">No Transaction Fees</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          Unlike other invoicing tools, we don&apos;t charge per transaction. Clients pay you directly — you keep 100%.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Visual - Payment Mockup - Clean Design */}
              <div className="lg:col-span-7 order-1 lg:order-2 relative px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-10">
                {/* Directional Glow Effect - Bottom Center */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-32 rounded-2xl opacity-[0.12] blur-3xl" style={{
                  background: 'radial-gradient(ellipse at center, #a855f7, #9333ea, transparent)',
                  zIndex: 0
                }}></div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-24 rounded-2xl opacity-[0.08] blur-2xl" style={{
                  background: 'radial-gradient(ellipse at center, #a855f7, transparent)',
                  zIndex: 1
                }}></div>
                
                <div className="relative z-10 bg-white rounded-xl sm:rounded-2xl shadow-lg max-w-lg w-full mx-auto overflow-hidden border border-gray-200 h-[380px] sm:h-[400px] lg:h-[420px]">
                  <div className="h-full overflow-y-auto scrollbar-hide">
                    {/* Step 1: Invoice Sent with Payment Details */}
                    {paymentStep === 1 && (
                      <div className="p-4 sm:p-5 animate-[fadeIn_0.5s_ease-in]">
                      <div className="mb-4 pb-3 border-b border-gray-100">
                        <div className="text-sm font-semibold text-gray-900 mb-1">Invoice Sent</div>
                        <div className="text-xs text-gray-500">#INV-001234 • $4,000</div>
                      </div>
                      <div className="text-xs text-gray-600 mb-3">Payment Methods Included:</div>
                      <div className="space-y-2">
                        <div className="p-2 bg-gray-50/30 rounded border border-gray-100">
                          <div className="flex items-center gap-2 mb-1">
                            <CreditCard className="h-3 w-3 text-blue-500" />
                            <span className="text-xs font-medium text-gray-900">PayPal</span>
                          </div>
                          <p className="text-xs text-gray-600 pl-5">paypal@example.com</p>
                        </div>
                        <div className="p-2 bg-gray-50/30 rounded border border-gray-100">
                          <div className="flex items-center gap-2 mb-1">
                            <DollarSign className="h-3 w-3 text-blue-500" />
                            <span className="text-xs font-medium text-gray-900">Venmo</span>
                          </div>
                          <p className="text-xs text-gray-600 pl-5">@yourvenmoid</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Client Receives Invoice Email */}
                  {paymentStep === 2 && (
                    <div className="p-4 sm:p-5 animate-[fadeIn_0.5s_ease-in]">
                      <div className="mb-3 pb-3 border-b border-gray-100">
                        <div className="text-xs text-gray-500 mb-1">Client Email</div>
                        <div className="text-sm font-semibold text-gray-900">Invoice #INV-001234</div>
                      </div>
                      <div className="text-xs text-gray-600 mb-3">Payment Methods:</div>
                      <div className="space-y-2">
                        <div className="p-2.5 bg-gray-50/30 rounded-md border border-gray-100">
                          <div className="flex items-center gap-2 mb-1">
                            <CreditCard className="h-3 w-3 text-blue-500" />
                            <span className="text-xs font-semibold text-gray-900">PayPal</span>
                          </div>
                          <p className="text-xs text-gray-600 pl-5 break-all">paypal@example.com</p>
                        </div>
                        <div className="p-2.5 bg-gray-50/30 rounded-md border border-gray-100">
                          <div className="flex items-center gap-2 mb-1">
                            <DollarSign className="h-3 w-3 text-blue-500" />
                            <span className="text-xs font-semibold text-gray-900">Venmo</span>
                          </div>
                          <p className="text-xs text-gray-600 pl-5">@yourvenmoid</p>
                        </div>
                        <div className="p-2.5 bg-gray-50/30 rounded-md border border-gray-100">
                          <div className="flex items-center gap-2 mb-1">
                            <Building2 className="h-3 w-3 text-gray-500" />
                            <span className="text-xs font-semibold text-gray-900">Bank Transfer</span>
                          </div>
                          <p className="text-xs text-gray-600 pl-5">Account: 1234 5678 9012</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Client Copies Payment Details */}
                  {paymentStep === 3 && (
                    <div className="p-4 sm:p-5 animate-[fadeIn_0.5s_ease-in]">
                      <div className="mb-3 pb-3 border-b border-gray-100">
                        <div className="text-xs text-gray-500 mb-1">Client View</div>
                        <div className="text-sm font-semibold text-gray-900">Selecting Payment Method</div>
                      </div>
                      <div className="space-y-2">
                        <div className="p-2.5 bg-blue-50/50 rounded-md border-2 border-blue-200">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-3 w-3 text-blue-500" />
                              <span className="text-xs font-semibold text-gray-900">PayPal</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-blue-600">
                              <span>Copied</span>
                              <CheckCircle className="h-3 w-3" />
                            </div>
                          </div>
                          <p className="text-xs text-gray-700 pl-5 break-all font-medium">paypal@example.com</p>
                        </div>
                        <div className="p-2.5 bg-gray-50/30 rounded-md border border-gray-100 opacity-50">
                          <div className="flex items-center gap-2 mb-1">
                            <DollarSign className="h-3 w-3 text-gray-400" />
                            <span className="text-xs font-semibold text-gray-500">Venmo</span>
                          </div>
                          <p className="text-xs text-gray-400 pl-5">@yourvenmoid</p>
                        </div>
                        <div className="p-2.5 bg-gray-50/30 rounded-md border border-gray-100 opacity-50">
                          <div className="flex items-center gap-2 mb-1">
                            <Building2 className="h-3 w-3 text-gray-400" />
                            <span className="text-xs font-semibold text-gray-500">Bank Transfer</span>
                          </div>
                          <p className="text-xs text-gray-400 pl-5">Account: 1234 5678 9012</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="text-[10px] text-gray-500">Client copied PayPal details</div>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Client Pays Externally */}
                  {paymentStep === 4 && (
                    <div className="p-4 sm:p-5 animate-[fadeIn_0.5s_ease-in]">
                      <div className="mb-4 pb-3 border-b border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">Payment Completed</div>
                            <div className="text-xs text-gray-500">Paid via PayPal</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Paid Status - Prominent */}
                      <div className="mb-4 p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            <span className="text-xs font-semibold text-emerald-700">PAID</span>
                          </div>
                          <span className="text-xs font-bold text-gray-900">$4,000</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Amount</span>
                          <span className="font-semibold text-gray-900">$4,000</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Method</span>
                          <span className="text-gray-700">PayPal</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Date</span>
                          <span className="text-gray-700">Jan 15, 2024</span>
                        </div>
                        <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100">
                          <span className="text-gray-500">Status</span>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-medium">Paid</span>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-gray-100">
                        <div className="text-[10px] text-gray-500">Client paid directly to your PayPal account</div>
                        <div className="text-[10px] text-gray-500 mt-1">No FlowInvoice intervention</div>
                      </div>
                    </div>
                  )}
                  </div>
                  
                  {/* Status Badge */}
                  <div className="absolute top-2.5 right-2.5 bg-white rounded-md px-2 py-1 shadow-sm border border-gray-100 flex items-center gap-1.5 z-10">
                    <div className={`w-2.5 h-2.5 rounded-full ${
                      paymentStep === 1 ? 'bg-blue-500' :
                      paymentStep === 2 ? 'bg-yellow-500' :
                      paymentStep === 3 ? 'bg-blue-500' :
                      'bg-emerald-500'
                    }`}></div>
                    <span className="text-[10px] font-medium text-gray-700">
                      {paymentStep === 1 && 'Sent'}
                      {paymentStep === 2 && 'Received'}
                      {paymentStep === 3 && 'Copying'}
                      {paymentStep === 4 && 'Paid'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Everything You Need - Dashboard Screenshot Style */}
          <div className="mt-24 sm:mt-32 lg:mt-40 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              
              {/* Header */}
              <div className="text-center mb-12 sm:mb-16">
                <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-semibold text-gray-900 mb-3 tracking-tight">Everything you need</h2>
                <p className="text-base text-gray-500 max-w-xl mx-auto">All the tools to create, send, and track invoices.</p>
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




