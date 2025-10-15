'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function PrivacyPage() {
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
              Privacy Policy
            </h1>
            
            <p className="text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
              Your privacy is important to us. This policy explains how we collect, use, and protect your information.
            </p>
            
            <p className="text-sm mt-4" style={{color: isDarkMode ? '#9ca3af' : '#6b7280'}}>
              Last updated: December 2024
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-lg max-w-none" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
              
              <h2 className="font-heading text-2xl font-bold mb-6" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                Information We Collect
              </h2>
              
              <p className="text-lg leading-relaxed mb-6">
                We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support.
              </p>
              
              <h3 className="font-heading text-xl font-bold mb-4" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                Account Information
              </h3>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>Name and email address</li>
                <li>Business information (company name, address, phone number)</li>
                <li>Payment information (processed securely through third-party providers)</li>
                <li>Profile settings and preferences</li>
              </ul>
              
              <h3 className="font-heading text-xl font-bold mb-4" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                Usage Information
              </h3>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>How you use our services and features</li>
                <li>Invoice and client data you create</li>
                <li>Communication logs and support requests</li>
                <li>Device and browser information</li>
              </ul>

              <h2 className="font-heading text-2xl font-bold mb-6 mt-12" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                How We Use Your Information
              </h2>
              
              <p className="text-lg leading-relaxed mb-6">
                We use the information we collect to provide, maintain, and improve our services:
              </p>
              
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>Process and deliver your invoices</li>
                <li>Send automated reminders and notifications</li>
                <li>Provide customer support</li>
                <li>Improve our services and develop new features</li>
                <li>Communicate with you about your account</li>
                <li>Ensure security and prevent fraud</li>
              </ul>

              <h2 className="font-heading text-2xl font-bold mb-6 mt-12" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                Information Sharing
              </h2>
              
              <p className="text-lg leading-relaxed mb-6">
                We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
              </p>
              
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>With your explicit consent</li>
                <li>To comply with legal obligations</li>
                <li>To protect our rights and prevent fraud</li>
                <li>With service providers who assist in our operations (under strict confidentiality agreements)</li>
              </ul>

              <h2 className="font-heading text-2xl font-bold mb-6 mt-12" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                Data Security
              </h2>
              
              <p className="text-lg leading-relaxed mb-6">
                We implement industry-standard security measures to protect your information:
              </p>
              
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>Encryption in transit and at rest</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication</li>
                <li>Secure data centers and infrastructure</li>
              </ul>

              <h2 className="font-heading text-2xl font-bold mb-6 mt-12" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                Your Rights
              </h2>
              
              <p className="text-lg leading-relaxed mb-6">
                You have the right to:
              </p>
              
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>Access your personal information</li>
                <li>Correct inaccurate data</li>
                <li>Delete your account and data</li>
                <li>Export your data</li>
                <li>Opt out of marketing communications</li>
              </ul>

              <h2 className="font-heading text-2xl font-bold mb-6 mt-12" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                Cookies and Tracking
              </h2>
              
              <p className="text-lg leading-relaxed mb-6">
                We use cookies and similar technologies to improve your experience, analyze usage, and provide personalized content. You can control cookie settings through your browser preferences.
              </p>

              <h2 className="font-heading text-2xl font-bold mb-6 mt-12" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                Changes to This Policy
              </h2>
              
              <p className="text-lg leading-relaxed mb-6">
                We may update this privacy policy from time to time. We will notify you of any material changes by email or through our service. Your continued use of our services after such changes constitutes acceptance of the updated policy.
              </p>

              <h2 className="font-heading text-2xl font-bold mb-6 mt-12" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                Contact Us
              </h2>
              
              <p className="text-lg leading-relaxed mb-6">
                If you have any questions about this privacy policy or our data practices, please contact us at:
              </p>
              
              <div className={`p-6 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-900/50 border-gray-800' 
                  : 'bg-white border-gray-200'
              }`}>
                <p className="text-sm" style={{color: isDarkMode ? '#9ca3af' : '#6b7280'}}>
                  Email: privacy@invoiceflow.com<br />
                  Address: [Your Business Address]<br />
                  Phone: [Your Phone Number]
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer isDarkMode={isDarkMode} />
    </div>
  );
}
