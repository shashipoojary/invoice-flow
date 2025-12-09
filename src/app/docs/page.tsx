'use client';

import { ArrowLeft, FileText, Zap, Users, Settings, Mail, CreditCard, Bell, Download, Eye, Plus, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import Footer from '@/components/Footer';

export default function DocsPage() {
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
              Documentation
            </h1>
            
            <p className="text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed" style={{color: '#374151'}}>
              Everything you need to know about using FlowInvoicer to manage your invoicing and get paid faster.
            </p>
          </div>
        </section>

        {/* Quick Start Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-semibold mb-8 text-gray-900 tracking-tight">
              Quick Start
            </h2>
            
            <div className="space-y-6">
              <div className="p-6 rounded-lg border bg-white border-gray-200">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-700">
                    1
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-semibold mb-2 text-gray-900">
                      Create Your Account
                    </h3>
                    <p className="text-base leading-relaxed" style={{color: '#6b7280'}}>
                      Sign up with your email address. No credit card required to get started.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-lg border bg-white border-gray-200">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-700">
                    2
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-semibold mb-2 text-gray-900">
                      Complete Onboarding
                    </h3>
                    <p className="text-base leading-relaxed" style={{color: '#6b7280'}}>
                      Add your business information, logo, and payment methods. This information will appear on all your invoices.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-lg border bg-white border-gray-200">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-700">
                    3
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-semibold mb-2 text-gray-900">
                      Create Your First Invoice
                    </h3>
                    <p className="text-base leading-relaxed" style={{color: '#6b7280'}}>
                      Choose between Fast Invoice (60-second) or Detailed Invoice. Add client details, services, and send.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Guide */}
        <section className="py-20 px-4 sm:px-6 lg:px-8" style={{backgroundColor: '#f8f9fa'}}>
          <div className="max-w-6xl mx-auto">
            <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-semibold mb-12 text-gray-900 tracking-tight">
              Features Guide
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-lg border bg-white border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Plus className="w-5 h-5 text-gray-700" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-gray-900">
                    Creating Invoices
                  </h3>
                </div>
                <p className="text-sm leading-relaxed mb-4" style={{color: '#6b7280'}}>
                  Use Fast Invoice for quick 60-second invoicing, or Detailed Invoice for comprehensive billing with multiple items, discounts, and taxes.
                </p>
                <ul className="space-y-2 text-sm" style={{color: '#6b7280'}}>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                    <span>Select client or add new one</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                    <span>Add services and amounts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                    <span>Choose invoice template</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                    <span>Send directly or save as draft</span>
                  </li>
                </ul>
              </div>

              <div className="p-6 rounded-lg border bg-white border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-gray-700" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-gray-900">
                    Client Management
                  </h3>
                </div>
                <p className="text-sm leading-relaxed mb-4" style={{color: '#6b7280'}}>
                  Organize all your clients in one place. Add contact information, company details, and payment preferences.
                </p>
                <ul className="space-y-2 text-sm" style={{color: '#6b7280'}}>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                    <span>Add client details and contact info</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                    <span>View invoice history per client</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                    <span>Edit or remove clients anytime</span>
                  </li>
                </ul>
              </div>

              <div className="p-6 rounded-lg border bg-white border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-gray-700" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-gray-900">
                    Automated Reminders
                  </h3>
                </div>
                <p className="text-sm leading-relaxed mb-4" style={{color: '#6b7280'}}>
                  Set up automatic payment reminders to ensure you get paid on time. Choose from friendly, polite, firm, or urgent reminder types.
                </p>
                <ul className="space-y-2 text-sm" style={{color: '#6b7280'}}>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                    <span>Configure reminder schedules</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                    <span>View reminder history</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                    <span>Manual reminder sending</span>
                  </li>
                </ul>
              </div>

              <div className="p-6 rounded-lg border bg-white border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Download className="w-5 h-5 text-gray-700" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-gray-900">
                    PDF Generation
                  </h3>
                </div>
                <p className="text-sm leading-relaxed mb-4" style={{color: '#6b7280'}}>
                  Generate professional PDF invoices instantly. Choose from multiple templates and customize colors to match your brand.
                </p>
                <ul className="space-y-2 text-sm" style={{color: '#6b7280'}}>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                    <span>Multiple professional templates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                    <span>Download PDF anytime</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                    <span>Receipt generation for paid invoices</span>
                  </li>
                </ul>
              </div>

              <div className="p-6 rounded-lg border bg-white border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-gray-700" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-gray-900">
                    Email Delivery
                  </h3>
                </div>
                <p className="text-sm leading-relaxed mb-4" style={{color: '#6b7280'}}>
                  Send invoices directly to clients via email. PDF attachments are automatically included with professional email templates.
                </p>
                <ul className="space-y-2 text-sm" style={{color: '#6b7280'}}>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                    <span>Professional email templates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                    <span>PDF attachment included</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                    <span>Track email delivery status</span>
                  </li>
                </ul>
              </div>

              <div className="p-6 rounded-lg border bg-white border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-gray-700" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-gray-900">
                    Settings & Customization
                  </h3>
                </div>
                <p className="text-sm leading-relaxed mb-4" style={{color: '#6b7280'}}>
                  Customize your business profile, payment methods, logo, and invoice preferences to match your brand.
                </p>
                <ul className="space-y-2 text-sm" style={{color: '#6b7280'}}>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                    <span>Upload business logo</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                    <span>Configure payment methods</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                    <span>Set default invoice settings</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Best Practices */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-semibold mb-8 text-gray-900 tracking-tight">
              Best Practices
            </h2>

            <div className="space-y-6">
              <div className="p-6 rounded-lg border bg-white border-gray-200">
                <h3 className="font-heading text-lg font-semibold mb-3 text-gray-900">
                  Payment Terms
                </h3>
                <p className="text-sm leading-relaxed mb-3" style={{color: '#6b7280'}}>
                  Set clear payment terms on your invoices. Common options include &quot;Due on Receipt&quot;, &quot;Net 15&quot;, &quot;Net 30&quot;, or custom terms. Clear terms help set expectations and improve cash flow.
                </p>
                <p className="text-sm leading-relaxed" style={{color: '#6b7280'}}>
                  For &quot;Due on Receipt&quot; invoices, reminders are sent immediately after the due date to encourage quick payment.
                </p>
              </div>

              <div className="p-6 rounded-lg border bg-white border-gray-200">
                <h3 className="font-heading text-lg font-semibold mb-3 text-gray-900">
                  Reminder Strategy
                </h3>
                <p className="text-sm leading-relaxed mb-3" style={{color: '#6b7280'}}>
                  Use automated reminders to follow up on unpaid invoices. Start with friendly reminders and escalate to firm or urgent if needed. The system automatically tracks overdue days and adjusts reminder tone accordingly.
                </p>
                <p className="text-sm leading-relaxed" style={{color: '#6b7280'}}>
                  Review your reminder history regularly to understand which clients respond best to different reminder types.
                </p>
              </div>

              <div className="p-6 rounded-lg border bg-white border-gray-200">
                <h3 className="font-heading text-lg font-semibold mb-3 text-gray-900">
                  Invoice Templates
                </h3>
                <p className="text-sm leading-relaxed mb-3" style={{color: '#6b7280'}}>
                  Choose the template that best represents your brand. Minimal templates work well for modern businesses, while detailed templates provide comprehensive breakdowns for complex projects.
                </p>
                <p className="text-sm leading-relaxed" style={{color: '#6b7280'}}>
                  Customize colors to match your brand identity. Your logo and business information will automatically appear on all invoices.
                </p>
              </div>

              <div className="p-6 rounded-lg border bg-white border-gray-200">
                <h3 className="font-heading text-lg font-semibold mb-3 text-gray-900">
                  Client Portal
                </h3>
                <p className="text-sm leading-relaxed mb-3" style={{color: '#6b7280'}}>
                  Each invoice includes a unique public link that clients can access to view and download invoices. Share this link directly or let clients access it from the email you send.
                </p>
                <p className="text-sm leading-relaxed" style={{color: '#6b7280'}}>
                  Once an invoice is marked as paid, clients can download a receipt PDF for their records.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8" style={{backgroundColor: '#f8f9fa'}}>
          <div className="max-w-4xl mx-auto">
            <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-semibold mb-12 text-gray-900 tracking-tight">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div className="p-6 rounded-lg border bg-white border-gray-200">
                <h3 className="font-heading text-lg font-semibold mb-2 text-gray-900">
                  How do I add payment methods?
                </h3>
                <p className="text-sm leading-relaxed" style={{color: '#6b7280'}}>
                  Go to Settings and add your payment methods including PayPal, Cash App, Venmo, bank details, or other payment options. These will appear on your invoices automatically.
                </p>
              </div>

              <div className="p-6 rounded-lg border bg-white border-gray-200">
                <h3 className="font-heading text-lg font-semibold mb-2 text-gray-900">
                  Can I edit invoices after sending?
                </h3>
                <p className="text-sm leading-relaxed" style={{color: '#6b7280'}}>
                  Yes, you can edit draft invoices anytime. For sent invoices, you can update details and resend. The system maintains a complete history of all changes.
                </p>
              </div>

              <div className="p-6 rounded-lg border bg-white border-gray-200">
                <h3 className="font-heading text-lg font-semibold mb-2 text-gray-900">
                  How do automated reminders work?
                </h3>
                <p className="text-sm leading-relaxed" style={{color: '#6b7280'}}>
                  Automated reminders are sent based on your invoice due dates and payment terms. You can configure reminder schedules in invoice settings, and the system will automatically send reminders before and after due dates.
                </p>
              </div>

              <div className="p-6 rounded-lg border bg-white border-gray-200">
                <h3 className="font-heading text-lg font-semibold mb-2 text-gray-900">
                  Is my data secure?
                </h3>
                <p className="text-sm leading-relaxed" style={{color: '#6b7280'}}>
                  Yes, all data is encrypted and stored securely. We use industry-standard security practices and never share your information with third parties. Your invoices and client data remain private and protected.
                </p>
              </div>

              <div className="p-6 rounded-lg border bg-white border-gray-200">
                <h3 className="font-heading text-lg font-semibold mb-2 text-gray-900">
                  Can I export my invoices?
                </h3>
                <p className="text-sm leading-relaxed" style={{color: '#6b7280'}}>
                  Yes, you can download any invoice as a PDF. Paid invoices also include a downloadable receipt. All PDFs are generated instantly and include your branding.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-semibold mb-6 text-gray-900 tracking-tight">
              Need More Help?
            </h2>
            <p className="text-lg mb-8" style={{color: '#374151'}}>
              Can&apos;t find what you&apos;re looking for? Contact our support team.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="px-8 py-4 rounded-lg text-sm font-medium transition-colors bg-black text-white hover:bg-gray-800"
              >
                Contact Support
              </Link>
              <Link
                href="/dashboard"
                className="px-8 py-4 rounded-lg text-sm font-medium transition-colors border"
                style={{
                  color: '#6b7280',
                  borderColor: '#d1d5db'
                }}
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

