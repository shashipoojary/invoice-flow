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
  Users
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
      <section className="pt-8 sm:pt-12 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 relative bg-gradient-to-b from-white to-gray-50" ref={heroRef}>
        <div className="max-w-7xl mx-auto">
      <div className="text-center">
            <div>
              <h1 ref={headingRef} className="font-heading text-3xl sm:text-5xl lg:text-7xl font-bold mb-6 sm:mb-8 leading-tight text-gray-900">
                The Fastest Way to
                <span className="text-indigo-600"> Get Paid</span>
              </h1>
              <p className="text-base sm:text-lg lg:text-xl mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed text-gray-600">
                Create professional invoices in 60 seconds. Send automated reminders. Get paid faster.
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <button
                  onClick={handleGetStarted}
                  className="group flex items-center justify-center space-x-2 px-6 py-3 sm:px-8 sm:py-4 rounded-lg text-base sm:text-base font-semibold transition-all duration-200 hover:scale-105 w-full sm:w-auto bg-black text-white hover:bg-gray-800 shadow-lg cursor-pointer"
                >
                  <span>Start Creating Invoices</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={handleViewDemo}
                  className="group flex items-center justify-center space-x-2 px-6 py-3 sm:px-8 sm:py-4 rounded-lg text-base sm:text-base font-semibold transition-all duration-200 hover:scale-105 border-2 w-full sm:w-auto border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 cursor-pointer"
                >
                  <Play className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>View Demo</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Screenshot Section */}
      <section className="pt-1 pb-4 sm:pt-2 sm:pb-6 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="w-full flex justify-center">
            <div className="relative max-w-5xl w-full">
              {/* Indigo glow effect - positioned relative to image */}
              <div className="absolute inset-0 rounded-2xl opacity-40 blur-3xl" style={{
                background: 'radial-gradient(ellipse at center, #818cf8, #a78bfa, #22d3ee, #60a5fa)',
                transform: 'scale(1.1)',
                zIndex: 1
              }}></div>
              
              {/* Secondary indigo glow */}
              <div className="absolute inset-0 rounded-2xl opacity-30 blur-2xl" style={{
                background: 'linear-gradient(45deg, #818cf8, #a78bfa, #22d3ee, #60a5fa)',
                transform: 'scale(1.05)',
                zIndex: 2
              }}></div>
              
              {/* Tertiary glow for depth */}
              <div className="absolute inset-0 rounded-2xl opacity-20 blur-xl" style={{
                background: 'conic-gradient(from 0deg, #818cf8, #a78bfa, #22d3ee, #60a5fa, #818cf8)',
                transform: 'scale(1.02)',
                zIndex: 3
              }}></div>
              
              <div className="relative z-10 rounded-lg overflow-hidden border border-gray-200" style={{
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
              }}>
                <Image
                  src="/dashboard-screenshot.png"
                  alt="FlowInvoicer Dashboard Screenshot"
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
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
                <h2 className="font-heading text-4xl sm:text-5xl font-bold mb-6 text-gray-900">
                  Your invoicing doesn&apos;t stand a chance
                </h2>
                <p className="text-lg mb-8 text-gray-600">
                  Delegate invoice management to FlowInvoicer and let your automated system create, send, and track payments in the background.
                </p>
                <a href="#" className="text-indigo-600 hover:text-indigo-500 font-semibold">
                  Discover FlowInvoicer automation →
                </a>
            </div>
            <div className="space-y-8">
              <div className="flex items-start">
                <div className="flex flex-col items-center mr-6">
                  <div className="w-3 h-3 rounded-full border-2 border-gray-400 mb-2"></div>
                  <div className="w-px h-16 bg-gray-300"></div>
                </div>
                <div>
                  <h3 className="font-heading text-lg font-semibold mb-3 text-gray-900">
                    Handles your invoices.
                  </h3>
                  <p className="text-gray-600">
                    When you create invoices, FlowInvoicer plans, sends, tracks, and follows up—using automated reminders to ensure payment and deliver ready-to-pay invoices.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex flex-col items-center mr-6">
                  <div className="w-3 h-3 rounded-full border-2 border-gray-400 mb-2"></div>
                  <div className="w-px h-16 bg-gray-300"></div>
                </div>
                <div>
                  <h3 className="font-heading text-lg font-semibold mb-3 text-gray-900">
                    Works like a professional.
                  </h3>
                  <p className="text-gray-600">
                    FlowInvoicer integrates with your business data to draw on client information and payment history—working like an experienced accountant from day one.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex flex-col items-center mr-6">
                  <div className="w-3 h-3 rounded-full border-2 border-gray-400"></div>
                </div>
                <div>
                  <h3 className="font-heading text-lg font-semibold mb-3 text-gray-900">
                    Human and automation in the loop.
                  </h3>
                  <p className="text-gray-600">
                    Customize to guide FlowInvoicer, review invoices before sending, or take over manually in your dashboard.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* Simple Clean Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-20">
            <h2 className="font-heading text-4xl sm:text-5xl font-bold mb-6 text-gray-900">
              Everything you need to get paid
            </h2>
            <p className="text-lg max-w-2xl mx-auto text-gray-600">
              Professional invoicing tools designed for freelancers, designers, and contractors.
            </p>
          </div>

          {/* Features Grid - Simple 3x2 Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-lg border transition-all duration-300 hover:border-opacity-60 bg-white border-gray-200 hover:border-gray-400">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-6" style={{
                backgroundColor: '#f8f9fa',
                border: '1px solid #e5e7eb'
              }}>
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="font-heading text-xl font-bold mb-4 text-gray-900">
                Professional Templates
              </h3>
              <p className="text-sm leading-relaxed text-gray-600">
                Choose from multiple professional invoice templates. Customize colors, fonts, and layout to match your brand.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-lg border transition-all duration-300 hover:border-opacity-60 bg-white border-gray-200 hover:border-gray-400">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-6" style={{
                backgroundColor: '#f8f9fa',
                border: '1px solid #e5e7eb'
              }}>
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="font-heading text-xl font-bold mb-4 text-gray-900">
                Client Management
              </h3>
              <p className="text-sm leading-relaxed text-gray-600">
                Store client information, payment history, and communication logs. Never lose track of important details.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-lg border transition-all duration-300 hover:border-opacity-60 bg-white border-gray-200 hover:border-gray-400">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-6" style={{
                backgroundColor: '#f8f9fa',
                border: '1px solid #e5e7eb'
              }}>
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="font-heading text-xl font-bold mb-4 text-gray-900">
                Payment Tracking
              </h3>
              <p className="text-sm leading-relaxed text-gray-600">
                Track when clients view invoices and manually mark payments as received. Get clear visibility into payment status.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 rounded-lg border transition-all duration-300 hover:border-opacity-60 bg-white border-gray-200 hover:border-gray-400">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-6" style={{
                backgroundColor: '#f8f9fa',
                border: '1px solid #e5e7eb'
              }}>
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-heading text-xl font-bold mb-4 text-gray-900">
                Automated Reminders
              </h3>
              <p className="text-sm leading-relaxed text-gray-600">
                Set up custom reminder schedules for each invoice. Choose from friendly, polite, firm, or urgent reminder types.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-8 rounded-lg border transition-all duration-300 hover:border-opacity-60 bg-white border-gray-200 hover:border-gray-400">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-6" style={{
                backgroundColor: '#f8f9fa',
                border: '1px solid #e5e7eb'
              }}>
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="font-heading text-xl font-bold mb-4 text-gray-900">
                Secure & Reliable
              </h3>
              <p className="text-sm leading-relaxed text-gray-600">
                Enterprise-grade security with encrypted data storage and transmission. Your data is never shared with third parties.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-8 rounded-lg border transition-all duration-300 hover:border-opacity-60 bg-white border-gray-200 hover:border-gray-400">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-6" style={{
                backgroundColor: '#f8f9fa',
                border: '1px solid #e5e7eb'
              }}>
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <h3 className="font-heading text-xl font-bold mb-4 text-gray-900">
                Easy Customization
              </h3>
              <p className="text-sm leading-relaxed text-gray-600">
                Customize your invoices with your branding, colors, and company information. Make every invoice uniquely yours.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4 text-gray-900">
              Simple Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that works for your business
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <div className="p-8 rounded-lg border transition-all duration-200 hover:scale-[1.02] flex flex-col bg-white border-gray-200 hover:border-gray-300 backdrop-blur-sm">
              <div className="text-center mb-8">
                <h3 className="font-heading text-2xl font-semibold mb-2 text-gray-900">Free</h3>
                <div className="text-4xl font-bold mb-2 text-gray-900">$0</div>
                <p className="text-sm text-gray-600">Perfect for getting started</p>
              </div>
              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-600">Up to 5 invoices per month</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-600">Basic templates</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-600">1 client only</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-600">Email support</span>
                </li>
              </ul>
              <button
                onClick={handleGetStarted}
                className="w-full py-3 rounded-lg font-medium transition-colors bg-black text-white hover:bg-gray-800 cursor-pointer"
              >
                Get Started Free
              </button>
            </div>

            {/* Pay Per Invoice Plan */}
            <div className="p-8 rounded-lg border transition-all duration-200 hover:scale-[1.02] flex flex-col bg-white border-gray-200 hover:border-gray-300 backdrop-blur-sm">
              <div className="text-center mb-8">
                <h3 className="font-heading text-2xl font-semibold mb-2 text-gray-900">Pay Per Invoice</h3>
                <div className="text-4xl font-bold mb-2 text-gray-900">$2</div>
                <p className="text-sm text-gray-600">per invoice sent</p>
              </div>
              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-600">Pay only when you send</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-600">All professional templates</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-600">1 client only</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-600">Basic automated reminders</span>
                </li>
              </ul>
              <button
                onClick={handleGetStarted}
                className="w-full py-3 rounded-lg font-medium transition-colors bg-black text-white hover:bg-gray-800 cursor-pointer"
              >
                Start Paying Per Invoice
              </button>
            </div>

            {/* Pro Plan */}
            <div className="p-8 rounded-lg border-2 border-indigo-600 relative transition-all duration-200 hover:scale-[1.02] flex flex-col bg-white backdrop-blur-sm">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-semibold">Most Popular</span>
              </div>
              <div className="text-center mb-8">
                <h3 className="font-heading text-2xl font-semibold mb-2 text-gray-900">Pro</h3>
                <div className="text-4xl font-bold mb-2 text-gray-900">$19</div>
                <p className="text-sm text-gray-600">per month</p>
              </div>
              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-600">Unlimited invoices</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-600">Unlimited clients</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-600">All professional templates</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-600">Advanced automated reminders</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-600">Priority support</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-600">Analytics dashboard</span>
                </li>
              </ul>
              <button
                onClick={handleGetStarted}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium transition-colors cursor-pointer"
              >
                Start Pro Trial
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4 text-gray-900">
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

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-6 text-gray-900">
            Ready to Get Paid Faster?
          </h2>
          <p className="text-xl mb-8 text-gray-600">
            Join thousands of freelancers who are already getting paid faster with FlowInvoicer.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleGetStarted}
              className="px-8 py-4 rounded-lg text-lg font-medium transition-colors bg-black text-white hover:bg-gray-800 cursor-pointer"
            >
              Start Creating Invoices
            </button>
            <button
              onClick={handleViewDemo}
              className="px-8 py-4 rounded-lg text-lg font-medium transition-colors border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              View Demo
            </button>
      </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
