'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Footer from '@/components/Footer';

export default function TermsPage() {



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
            
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold mb-8" style={{color: '#1f2937'}}>
              Terms of Service
            </h1>
            
            <p className="text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed" style={{color: '#374151'}}>
              These terms govern your use of FlowInvoicer and our services.
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
              
              <h2 className="font-heading text-2xl font-bold mb-6" style={{color: '#1f2937'}}>
                Acceptance of Terms
              </h2>
              
              <p className="text-lg leading-relaxed mb-6">
                By accessing or using FlowInvoicer, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using this service.
              </p>

              <h2 className="font-heading text-2xl font-bold mb-6 mt-12" style={{color: '#1f2937'}}>
                Description of Service
              </h2>
              
              <p className="text-lg leading-relaxed mb-6">
                FlowInvoicer provides online invoicing and payment tracking services for freelancers, designers, and contractors. Our service includes:
              </p>
              
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>Invoice creation and management</li>
                <li>Client management tools</li>
                <li>Automated payment reminders</li>
                <li>Payment tracking and reporting</li>
                <li>Template customization</li>
              </ul>

              <h2 className="font-heading text-2xl font-bold mb-6 mt-12" style={{color: '#1f2937'}}>
                User Accounts
              </h2>
              
              <p className="text-lg leading-relaxed mb-6">
                To use our service, you must create an account and provide accurate, complete information. You are responsible for:
              </p>
              
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized use</li>
                <li>Ensuring your account information remains current and accurate</li>
              </ul>

              <h2 className="font-heading text-2xl font-bold mb-6 mt-12" style={{color: '#1f2937'}}>
                Acceptable Use
              </h2>
              
              <p className="text-lg leading-relaxed mb-6">
                You agree to use our service only for lawful purposes and in accordance with these terms. You may not:
              </p>
              
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>Use the service for any illegal or unauthorized purpose</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt the service or servers</li>
                <li>Transmit any harmful or malicious code</li>
                <li>Violate any applicable laws or regulations</li>
              </ul>

              <h2 className="font-heading text-2xl font-bold mb-6 mt-12" style={{color: '#1f2937'}}>
                Payment Terms
              </h2>
              
              <p className="text-lg leading-relaxed mb-6">
                Our service offers both free and paid plans. For paid subscriptions:
              </p>
              
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>Fees are charged in advance on a recurring basis</li>
                <li>All fees are non-refundable unless otherwise stated</li>
                <li>We may change our pricing with 30 days notice</li>
                <li>You can cancel your subscription at any time</li>
                <li>Payment processing is handled by secure third-party providers</li>
              </ul>

              <h2 className="font-heading text-2xl font-bold mb-6 mt-12" style={{color: '#1f2937'}}>
                Data and Privacy
              </h2>
              
              <p className="text-lg leading-relaxed mb-6">
                Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your information. By using our service, you consent to our data practices as described in our Privacy Policy.
              </p>

              <h2 className="font-heading text-2xl font-bold mb-6 mt-12" style={{color: '#1f2937'}}>
                Intellectual Property
              </h2>
              
              <p className="text-lg leading-relaxed mb-6">
                The FlowInvoicer service and its original content, features, and functionality are owned by FlowInvoicer and are protected by international copyright, trademark, and other intellectual property laws.
              </p>

              <h2 className="font-heading text-2xl font-bold mb-6 mt-12" style={{color: '#1f2937'}}>
                Service Availability
              </h2>
              
              <p className="text-lg leading-relaxed mb-6">
                We strive to maintain high service availability, but we do not guarantee uninterrupted access. We may temporarily suspend the service for maintenance, updates, or other reasons. We are not liable for any downtime or service interruptions.
              </p>

              <h2 className="font-heading text-2xl font-bold mb-6 mt-12" style={{color: '#1f2937'}}>
                Limitation of Liability
              </h2>
              
              <p className="text-lg leading-relaxed mb-6">
                To the maximum extent permitted by law, FlowInvoicer shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
              </p>

              <h2 className="font-heading text-2xl font-bold mb-6 mt-12" style={{color: '#1f2937'}}>
                Termination
              </h2>
              
              <p className="text-lg leading-relaxed mb-6">
                We may terminate or suspend your account immediately, without prior notice, for any reason, including breach of these terms. Upon termination, your right to use the service will cease immediately.
              </p>

              <h2 className="font-heading text-2xl font-bold mb-6 mt-12" style={{color: '#1f2937'}}>
                Changes to Terms
              </h2>
              
              <p className="text-lg leading-relaxed mb-6">
                We reserve the right to modify these terms at any time. We will notify users of any material changes via email or through our service. Your continued use of the service after such modifications constitutes acceptance of the updated terms.
              </p>

              <h2 className="font-heading text-2xl font-bold mb-6 mt-12" style={{color: '#1f2937'}}>
                Governing Law
              </h2>
              
              <p className="text-lg leading-relaxed mb-6">
                These terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], without regard to conflict of law principles.
              </p>

              <h2 className="font-heading text-2xl font-bold mb-6 mt-12" style={{color: '#1f2937'}}>
                Contact Information
              </h2>
              
              <p className="text-lg leading-relaxed mb-6">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              
              <div className={`p-6 rounded-lg border ${
                false 
                  ? 'bg-gray-900/50 border-gray-800' 
                  : 'bg-white border-gray-200'
              }`}>
                <p className="text-sm" style={{color: '#6b7280'}}>
                  Email: legal@invoiceflow.com<br />
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
