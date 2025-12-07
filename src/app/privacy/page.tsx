'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Footer from '@/components/Footer';

export default function PrivacyPage() {



  return (
    <div className="min-h-screen transition-colors duration-200 bg-gradient-to-b from-white to-gray-50">
      {/* Main Content */}
      <main className="pt-4">
        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <Link 
              href="/" 
              className="inline-flex items-center text-sm font-medium mb-8 transition-colors hover:opacity-80"
              style={{color: '#6b7280'}}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
            
            <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-semibold mb-8 text-gray-900 tracking-tight">
              Privacy Policy
            </h1>
            
            <p className="text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed" style={{color: '#374151'}}>
              Your privacy is important to us. This policy explains how we collect, use, and protect your information.
            </p>
            
            <p className="text-sm mt-4" style={{color: '#6b7280'}}>
              Last updated: December 2024
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-lg max-w-none" style={{color: '#374151'}}>
              
              <h2 className="font-heading text-xl sm:text-2xl font-semibold mb-6 text-gray-900">
                Information We Collect
              </h2>
              
              <p className="text-lg leading-relaxed mb-6">
                We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support.
              </p>
              
              <h3 className="font-heading text-lg font-semibold mb-4 text-gray-900">
                Account Information
              </h3>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>Name and email address</li>
                <li>Business information (company name, address, phone number)</li>
                <li>Payment information (processed securely through third-party providers)</li>
                <li>Profile settings and preferences</li>
              </ul>
              
              <h3 className="font-heading text-lg font-semibold mb-4 text-gray-900">
                Usage Information
              </h3>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>How you use our services and features</li>
                <li>Invoice and client data you create</li>
                <li>Communication logs and support requests</li>
                <li>Device and browser information</li>
              </ul>

              <h2 className="font-heading text-xl sm:text-2xl font-semibold mb-6 mt-12 text-gray-900">
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

              <h2 className="font-heading text-xl sm:text-2xl font-semibold mb-6 mt-12 text-gray-900">
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

              <h2 className="font-heading text-xl sm:text-2xl font-semibold mb-6 mt-12 text-gray-900">
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

              <h2 className="font-heading text-xl sm:text-2xl font-semibold mb-6 mt-12 text-gray-900">
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

              <h2 className="font-heading text-xl sm:text-2xl font-semibold mb-6 mt-12 text-gray-900">
                Cookies and Tracking
              </h2>
              
              <p className="text-lg leading-relaxed mb-6">
                We use cookies and similar technologies to improve your experience, analyze usage, and provide personalized content. You can control cookie settings through your browser preferences.
              </p>

              <h2 className="font-heading text-xl sm:text-2xl font-semibold mb-6 mt-12 text-gray-900">
                Changes to This Policy
              </h2>
              
              <p className="text-lg leading-relaxed mb-6">
                We may update this privacy policy from time to time. We will notify you of any material changes by email or through our service. Your continued use of our services after such changes constitutes acceptance of the updated policy.
              </p>

              <h2 className="font-heading text-xl sm:text-2xl font-semibold mb-6 mt-12 text-gray-900">
                Contact Us
              </h2>
              
              <p className="text-lg leading-relaxed mb-6">
                If you have any questions about this privacy policy or our data practices, please contact us at:
              </p>
              
              <div className={`p-6 rounded-lg border ${
                false 
                  ? 'bg-gray-900/50 border-gray-800' 
                  : 'bg-white border-gray-200'
              }`}>
                <p className="text-sm" style={{color: '#6b7280'}}>
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
      <Footer />
    </div>
  );
}
