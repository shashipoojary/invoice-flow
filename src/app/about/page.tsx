'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Users, Target, Shield, Zap } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function AboutPage() {
  // Always start with false on server to match SSR
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Sync state with localStorage on mount (client-only)
  useEffect(() => {
    const storedDarkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(storedDarkMode);
    
    // Ensure the dark class is in sync
    if (storedDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Show content after React loads
    document.body.classList.add('loaded');
  }, []);


  // Handle scroll for navbar with throttling and hysteresis
  useEffect(() => {
    let ticking = false;
    let lastScrollTop = 0;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          
          // Hysteresis: different thresholds for expanding vs collapsing
          if (scrollTop > lastScrollTop && scrollTop > 100) {
            // Scrolling down - collapse
            setIsScrolled(true);
          } else if (scrollTop < lastScrollTop && scrollTop < 50) {
            // Scrolling up - expand
            setIsScrolled(false);
          }
          
          lastScrollTop = scrollTop;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      localStorage.setItem('darkMode', newMode.toString());
      // Sync with html element
      if (newMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return newMode;
    });
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
      {/* Navigation */}
      <Navbar isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} isScrolled={isScrolled} />

      {/* Main Content */}
      <main className="pt-24">
        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <Link 
              href="/" 
              className="inline-flex items-center text-sm font-medium mb-8 transition-colors hover:opacity-80"
              style={{color: isDarkMode ? '#9ca3af' : '#6b7280'}}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
            
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold mb-8" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
              About InvoiceFlow
            </h1>
            
            <p className="text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
              We&apos;re building the future of invoicing for freelancers, designers, and contractors who deserve to get paid faster and more reliably.
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8" style={{backgroundColor: isDarkMode ? '#0a0a0a' : '#f8f9fa'}}>
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-8" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                  Our Mission
                </h2>
                <p className="text-lg leading-relaxed mb-6" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                  We believe that getting paid shouldn&apos;t be complicated. Too many talented professionals struggle with late payments, forgotten invoices, and complex billing systems.
                </p>
                <p className="text-lg leading-relaxed" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                  InvoiceFlow exists to change that. We&apos;re creating tools that make invoicing simple, automated, and effective—so you can focus on what you do best.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className={`p-6 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-900/50 border-gray-800' 
                    : 'bg-white border-gray-200'
                }`}>
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{
                    backgroundColor: isDarkMode ? '#1a1a1a' : '#f8f9fa',
                    border: `1px solid ${isDarkMode ? '#333' : '#e5e7eb'}`
                  }}>
                    <Target className="w-6 h-6" style={{color: isDarkMode ? '#9ca3af' : '#6b7280'}} />
                  </div>
                  <h3 className="font-heading text-lg font-bold mb-2" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                    Focus
                  </h3>
                  <p className="text-sm" style={{color: isDarkMode ? '#9ca3af' : '#6b7280'}}>
                    On your work, not paperwork
                  </p>
                </div>
                
                <div className={`p-6 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-900/50 border-gray-800' 
                    : 'bg-white border-gray-200'
                }`}>
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{
                    backgroundColor: isDarkMode ? '#1a1a1a' : '#f8f9fa',
                    border: `1px solid ${isDarkMode ? '#333' : '#e5e7eb'}`
                  }}>
                    <Zap className="w-6 h-6" style={{color: isDarkMode ? '#9ca3af' : '#6b7280'}} />
                  </div>
                  <h3 className="font-heading text-lg font-bold mb-2" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                    Speed
                  </h3>
                  <p className="text-sm" style={{color: isDarkMode ? '#9ca3af' : '#6b7280'}}>
                    Get paid faster with automation
                  </p>
                </div>
                
                <div className={`p-6 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-900/50 border-gray-800' 
                    : 'bg-white border-gray-200'
                }`}>
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{
                    backgroundColor: isDarkMode ? '#1a1a1a' : '#f8f9fa',
                    border: `1px solid ${isDarkMode ? '#333' : '#e5e7eb'}`
                  }}>
                    <Shield className="w-6 h-6" style={{color: isDarkMode ? '#9ca3af' : '#6b7280'}} />
                  </div>
                  <h3 className="font-heading text-lg font-bold mb-2" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                    Security
                  </h3>
                  <p className="text-sm" style={{color: isDarkMode ? '#9ca3af' : '#6b7280'}}>
                    Your data is always protected
                  </p>
                </div>
                
                <div className={`p-6 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-900/50 border-gray-800' 
                    : 'bg-white border-gray-200'
                }`}>
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{
                    backgroundColor: isDarkMode ? '#1a1a1a' : '#f8f9fa',
                    border: `1px solid ${isDarkMode ? '#333' : '#e5e7eb'}`
                  }}>
                    <Users className="w-6 h-6" style={{color: isDarkMode ? '#9ca3af' : '#6b7280'}} />
                  </div>
                  <h3 className="font-heading text-lg font-bold mb-2" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                    Community
                  </h3>
                  <p className="text-sm" style={{color: isDarkMode ? '#9ca3af' : '#6b7280'}}>
                    Built for freelancers, by freelancers
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-6" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                Our Story
              </h2>
            </div>
            
            <div className="prose prose-lg max-w-none" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
              <p className="text-lg leading-relaxed mb-6">
                InvoiceFlow was born from frustration. As freelancers ourselves, we experienced the same pain points you face: late payments, forgotten invoices, and time-consuming billing processes.
              </p>
              
              <p className="text-lg leading-relaxed mb-6">
                We realized that existing invoicing tools were either too complex for solo professionals or too basic to handle real business needs. They lacked the automation and intelligence that modern freelancers need to get paid consistently.
              </p>
              
              <p className="text-lg leading-relaxed mb-6">
                So we built InvoiceFlow from the ground up, focusing on three core principles: simplicity, automation, and reliability. Every feature is designed to save you time and help you get paid faster.
              </p>
              
              <p className="text-lg leading-relaxed">
                Today, thousands of freelancers, designers, and contractors trust InvoiceFlow to handle their invoicing needs. We&apos;re proud to be part of their success stories.
              </p>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8" style={{backgroundColor: isDarkMode ? '#0a0a0a' : '#f8f9fa'}}>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-6" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                Our Values
              </h2>
              <p className="text-lg max-w-2xl mx-auto" style={{color: isDarkMode ? '#94a3b8' : '#64748b'}}>
                The principles that guide everything we do
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className={`p-8 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-900/50 border-gray-800' 
                  : 'bg-white border-gray-200'
              }`}>
                <h3 className="font-heading text-xl font-bold mb-4" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                  Simplicity First
                </h3>
                <p className="text-sm leading-relaxed" style={{color: isDarkMode ? '#9ca3af' : '#6b7280'}}>
                  We believe powerful tools should be easy to use. Every feature is designed with simplicity in mind, so you can focus on your work, not learning new software.
                </p>
              </div>

              <div className={`p-8 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-900/50 border-gray-800' 
                  : 'bg-white border-gray-200'
              }`}>
                <h3 className="font-heading text-xl font-bold mb-4" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                  Reliability Matters
                </h3>
                <p className="text-sm leading-relaxed" style={{color: isDarkMode ? '#9ca3af' : '#6b7280'}}>
                  Your business depends on getting paid. We&apos;ve built InvoiceFlow with enterprise-grade reliability, so you can trust it to work when you need it most.
                </p>
              </div>

              <div className={`p-8 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-900/50 border-gray-800' 
                  : 'bg-white border-gray-200'
              }`}>
                <h3 className="font-heading text-xl font-bold mb-4" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                  Privacy Protected
                </h3>
                <p className="text-sm leading-relaxed" style={{color: isDarkMode ? '#9ca3af' : '#6b7280'}}>
                  Your data is yours. We never sell your information, and we use industry-standard encryption to keep your business data secure and private.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-6" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
              Ready to get started?
            </h2>
            <p className="text-lg mb-8" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
              Join thousands of freelancers who are already getting paid faster with InvoiceFlow.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className={`px-8 py-4 rounded-lg text-sm font-medium transition-colors ${
                  isDarkMode 
                    ? 'bg-white text-black hover:bg-gray-200' 
                    : 'bg-black text-white hover:bg-gray-800'
                }`}
              >
                Get Started Free
              </Link>
              <Link
                href="/contact"
                className="px-8 py-4 rounded-lg text-sm font-medium transition-colors border"
                style={{
                  color: isDarkMode ? '#9ca3af' : '#6b7280',
                  borderColor: isDarkMode ? '#374151' : '#d1d5db'
                }}
              >
                Contact Us
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer isDarkMode={isDarkMode} />
    </div>
  );
}
