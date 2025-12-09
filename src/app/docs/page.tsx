'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { ArrowLeft, FileText, Zap, Users, Settings, Mail, CreditCard, Bell, Download, Eye, Plus, CheckCircle, Search, Menu, X, ChevronRight, BookOpen, Code, HelpCircle, Rocket, Shield, BarChart3, Palette } from 'lucide-react';
import Link from 'next/link';
import Footer from '@/components/Footer';

interface DocSection {
  id: string;
  title: string;
  icon: any;
  subsections: Array<{
    id: string;
    title: string;
    content: React.ReactNode;
  }>;
}

export default function DocsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const docSections: DocSection[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: Rocket,
      subsections: [
        {
          id: 'quick-start',
          title: 'Quick Start Guide',
          content: (
            <div className="space-y-6">
              <div>
                <h3 className="font-heading text-xl font-semibold mb-4 text-gray-900">Create Your Account</h3>
                <p className="text-base leading-relaxed mb-4" style={{color: '#6b7280'}}>
                  Sign up with your email address. No credit card required to get started. Your account is ready to use immediately.
                </p>
              </div>
              <div>
                <h3 className="font-heading text-xl font-semibold mb-4 text-gray-900">Complete Onboarding</h3>
                <p className="text-base leading-relaxed mb-4" style={{color: '#6b7280'}}>
                  After signing up, you&apos;ll be guided through a simple onboarding process where you&apos;ll add:
                </p>
                <ul className="space-y-2 ml-6 mb-4" style={{color: '#6b7280'}}>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-400 mt-1">•</span>
                    <span>Business name and contact information</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-400 mt-1">•</span>
                    <span>Business logo (optional)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-400 mt-1">•</span>
                    <span>Payment methods you accept</span>
                  </li>
                </ul>
                <p className="text-base leading-relaxed" style={{color: '#6b7280'}}>
                  All information can be updated later in Settings. This information will appear on all your invoices automatically.
                </p>
              </div>
              <div>
                <h3 className="font-heading text-xl font-semibold mb-4 text-gray-900">Create Your First Invoice</h3>
                <p className="text-base leading-relaxed mb-4" style={{color: '#6b7280'}}>
                  Click &quot;Create Invoice&quot; in the sidebar. You can choose between:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="p-4 rounded-lg border bg-white border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2">Fast Invoice</h4>
                    <p className="text-sm" style={{color: '#6b7280'}}>Perfect for quick billing. Create and send in 60 seconds.</p>
                  </div>
                  <div className="p-4 rounded-lg border bg-white border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2">Detailed Invoice</h4>
                    <p className="text-sm" style={{color: '#6b7280'}}>Comprehensive invoicing with multiple items, discounts, and taxes.</p>
                  </div>
                </div>
              </div>
            </div>
          )
        },
        {
          id: 'account-setup',
          title: 'Account Setup',
          content: (
            <div className="space-y-6">
              <div>
                <h3 className="font-heading text-xl font-semibold mb-4 text-gray-900">Business Information</h3>
                <p className="text-base leading-relaxed mb-4" style={{color: '#6b7280'}}>
                  Your business information appears on every invoice. Make sure it&apos;s accurate and up to date.
                </p>
                <div className="p-4 rounded-lg border bg-gray-50 border-gray-200 mb-4">
                  <p className="text-sm font-medium text-gray-900 mb-2">Required Fields:</p>
                  <ul className="space-y-1 text-sm" style={{color: '#6b7280'}}>
                    <li>• Business Name</li>
                    <li>• Business Email</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg border bg-gray-50 border-gray-200">
                  <p className="text-sm font-medium text-gray-900 mb-2">Optional Fields:</p>
                  <ul className="space-y-1 text-sm" style={{color: '#6b7280'}}>
                    <li>• Business Phone</li>
                    <li>• Business Address</li>
                    <li>• Website</li>
                    <li>• Logo</li>
                  </ul>
                </div>
              </div>
              <div>
                <h3 className="font-heading text-xl font-semibold mb-4 text-gray-900">Payment Methods</h3>
                <p className="text-base leading-relaxed mb-4" style={{color: '#6b7280'}}>
                  Add the payment methods you accept. These will appear on your invoices, making it easy for clients to pay you.
                </p>
                <p className="text-sm leading-relaxed" style={{color: '#6b7280'}}>
                  Supported methods include PayPal, Cash App, Venmo, Google Pay, Apple Pay, Stripe, and bank transfers. You can add as many or as few as you need.
                </p>
              </div>
            </div>
          )
        }
      ]
    },
    {
      id: 'invoices',
      title: 'Invoices',
      icon: FileText,
      subsections: [
        {
          id: 'creating-invoices',
          title: 'Creating Invoices',
          content: (
            <div className="space-y-6">
              <div>
                <h3 className="font-heading text-xl font-semibold mb-4 text-gray-900">Fast Invoice</h3>
                <p className="text-base leading-relaxed mb-4" style={{color: '#6b7280'}}>
                  Perfect for simple, quick billing. Ideal when you need to invoice a client immediately.
                </p>
                <div className="p-4 rounded-lg border bg-gray-50 border-gray-200 mb-4">
                  <p className="text-sm font-medium text-gray-900 mb-2">Steps:</p>
                  <ol className="space-y-2 text-sm ml-4" style={{color: '#6b7280'}}>
                    <li>1. Select or add client</li>
                    <li>2. Enter service description and amount</li>
                    <li>3. Choose due date</li>
                    <li>4. Send immediately or save as draft</li>
                  </ol>
                </div>
              </div>
              <div>
                <h3 className="font-heading text-xl font-semibold mb-4 text-gray-900">Detailed Invoice</h3>
                <p className="text-base leading-relaxed mb-4" style={{color: '#6b7280'}}>
                  For comprehensive billing with multiple line items, discounts, taxes, and custom settings.
                </p>
                <div className="p-4 rounded-lg border bg-gray-50 border-gray-200 mb-4">
                  <p className="text-sm font-medium text-gray-900 mb-2">Features:</p>
                  <ul className="space-y-2 text-sm ml-4" style={{color: '#6b7280'}}>
                    <li>• Multiple line items with descriptions</li>
                    <li>• Discounts (percentage or fixed amount)</li>
                    <li>• Tax calculations</li>
                    <li>• Payment terms configuration</li>
                    <li>• Late fees setup</li>
                    <li>• Automated reminder scheduling</li>
                    <li>• Custom notes and terms</li>
                  </ul>
                </div>
              </div>
              <div>
                <h3 className="font-heading text-xl font-semibold mb-4 text-gray-900">Invoice Templates</h3>
                <p className="text-base leading-relaxed mb-4" style={{color: '#6b7280'}}>
                  Choose from professional templates that match your brand. Each template can be customized with your brand colors.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg border bg-white border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2">Minimal</h4>
                    <p className="text-sm" style={{color: '#6b7280'}}>Clean and simple design</p>
                  </div>
                  <div className="p-4 rounded-lg border bg-white border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2">Modern</h4>
                    <p className="text-sm" style={{color: '#6b7280'}}>Contemporary professional style</p>
                  </div>
                  <div className="p-4 rounded-lg border bg-white border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2">Creative</h4>
                    <p className="text-sm" style={{color: '#6b7280'}}>Bold and distinctive</p>
                  </div>
                </div>
              </div>
            </div>
          )
        },
        {
          id: 'managing-invoices',
          title: 'Managing Invoices',
          content: (
            <div className="space-y-6">
              <div>
                <h3 className="font-heading text-xl font-semibold mb-4 text-gray-900">Invoice Status</h3>
                <p className="text-base leading-relaxed mb-4" style={{color: '#6b7280'}}>
                  Track your invoices through different statuses:
                </p>
                <div className="space-y-3">
                  <div className="p-4 rounded-lg border bg-white border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                      <span className="font-semibold text-gray-900">Draft</span>
                    </div>
                    <p className="text-sm ml-5" style={{color: '#6b7280'}}>Invoice created but not sent</p>
                  </div>
                  <div className="p-4 rounded-lg border bg-white border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="font-semibold text-gray-900">Pending</span>
                    </div>
                    <p className="text-sm ml-5" style={{color: '#6b7280'}}>Invoice sent, awaiting payment</p>
                  </div>
                  <div className="p-4 rounded-lg border bg-white border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <span className="font-semibold text-gray-900">Paid</span>
                    </div>
                    <p className="text-sm ml-5" style={{color: '#6b7280'}}>Payment received</p>
                  </div>
                  <div className="p-4 rounded-lg border bg-white border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <span className="font-semibold text-gray-900">Overdue</span>
                    </div>
                    <p className="text-sm ml-5" style={{color: '#6b7280'}}>Payment past due date</p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-heading text-xl font-semibold mb-4 text-gray-900">Editing Invoices</h3>
                <p className="text-base leading-relaxed mb-4" style={{color: '#6b7280'}}>
                  You can edit invoices at any time. Draft invoices can be modified freely. For sent invoices, you can update details and resend to clients.
                </p>
                <p className="text-sm leading-relaxed" style={{color: '#6b7280'}}>
                  All changes are tracked in the invoice history, so you always know what was modified and when.
                </p>
              </div>
              <div>
                <h3 className="font-heading text-xl font-semibold mb-4 text-gray-900">Marking as Paid</h3>
                <p className="text-base leading-relaxed mb-4" style={{color: '#6b7280'}}>
                  When a client pays, mark the invoice as paid. This will:
                </p>
                <ul className="space-y-2 ml-6 text-sm" style={{color: '#6b7280'}}>
                  <li>• Update invoice status to &quot;Paid&quot;</li>
                  <li>• Stop automated reminders</li>
                  <li>• Enable receipt download for the client</li>
                  <li>• Update your revenue statistics</li>
                </ul>
              </div>
            </div>
          )
        },
        {
          id: 'invoice-templates',
          title: 'Invoice Templates',
          content: (
            <div className="space-y-6">
              <div>
                <h3 className="font-heading text-xl font-semibold mb-4 text-gray-900">Template Selection</h3>
                <p className="text-base leading-relaxed mb-4" style={{color: '#6b7280'}}>
                  Choose a template that best represents your brand. Each template offers different layouts and styling options.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 rounded-lg border bg-white border-gray-200">
                    <h4 className="font-semibold text-lg text-gray-900 mb-3">Minimal Template</h4>
                    <p className="text-sm leading-relaxed mb-4" style={{color: '#6b7280'}}>
                      Clean, simple design perfect for modern businesses. Focuses on clarity and readability.
                    </p>
                    <div className="text-xs" style={{color: '#9ca3af'}}>Best for: Professional services, consulting</div>
                  </div>
                  <div className="p-6 rounded-lg border bg-white border-gray-200">
                    <h4 className="font-semibold text-lg text-gray-900 mb-3">Modern Template</h4>
                    <p className="text-sm leading-relaxed mb-4" style={{color: '#6b7280'}}>
                      Contemporary design with structured layout. Great for detailed project billing.
                    </p>
                    <div className="text-xs" style={{color: '#9ca3af'}}>Best for: Agencies, project-based work</div>
                  </div>
                  <div className="p-6 rounded-lg border bg-white border-gray-200">
                    <h4 className="font-semibold text-lg text-gray-900 mb-3">Creative Template</h4>
                    <p className="text-sm leading-relaxed mb-4" style={{color: '#6b7280'}}>
                      Bold and distinctive design. Perfect for creative professionals and designers.
                    </p>
                    <div className="text-xs" style={{color: '#9ca3af'}}>Best for: Designers, creatives, artists</div>
                  </div>
                  <div className="p-6 rounded-lg border bg-white border-gray-200">
                    <h4 className="font-semibold text-lg text-gray-900 mb-3">Fast Invoice Template</h4>
                    <p className="text-sm leading-relaxed mb-4" style={{color: '#6b7280'}}>
                      Streamlined template optimized for quick invoicing. Fixed professional design.
                    </p>
                    <div className="text-xs" style={{color: '#9ca3af'}}>Best for: Quick billing, simple services</div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-heading text-xl font-semibold mb-4 text-gray-900">Customization</h3>
                <p className="text-base leading-relaxed mb-4" style={{color: '#6b7280'}}>
                  Customize your invoices with:
                </p>
                <ul className="space-y-2 ml-6 text-sm" style={{color: '#6b7280'}}>
                  <li>• Brand colors (primary and secondary)</li>
                  <li>• Business logo</li>
                  <li>• Custom payment terms</li>
                  <li>• Notes and additional information</li>
                </ul>
              </div>
            </div>
          )
        }
      ]
    },
    {
      id: 'clients',
      title: 'Client Management',
      icon: Users,
      subsections: [
        {
          id: 'adding-clients',
          title: 'Adding Clients',
          content: (
            <div className="space-y-6">
              <div>
                <h3 className="font-heading text-xl font-semibold mb-4 text-gray-900">Client Information</h3>
                <p className="text-base leading-relaxed mb-4" style={{color: '#6b7280'}}>
                  Add clients with their contact information. This makes creating invoices faster and ensures consistency.
                </p>
                <div className="p-4 rounded-lg border bg-gray-50 border-gray-200 mb-4">
                  <p className="text-sm font-medium text-gray-900 mb-2">Required Information:</p>
                  <ul className="space-y-1 text-sm" style={{color: '#6b7280'}}>
                    <li>• Client Name</li>
                    <li>• Email Address</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg border bg-gray-50 border-gray-200">
                  <p className="text-sm font-medium text-gray-900 mb-2">Optional Information:</p>
                  <ul className="space-y-1 text-sm" style={{color: '#6b7280'}}>
                    <li>• Company Name</li>
                    <li>• Phone Number</li>
                    <li>• Address</li>
                  </ul>
                </div>
              </div>
              <div>
                <h3 className="font-heading text-xl font-semibold mb-4 text-gray-900">Quick Add During Invoice Creation</h3>
                <p className="text-base leading-relaxed mb-4" style={{color: '#6b7280'}}>
                  You can also add clients on-the-fly when creating an invoice. Simply enter a new email address, and you&apos;ll be prompted to add the client details.
                </p>
              </div>
            </div>
          )
        },
        {
          id: 'managing-clients',
          title: 'Managing Clients',
          content: (
            <div className="space-y-6">
              <div>
                <h3 className="font-heading text-xl font-semibold mb-4 text-gray-900">Client List</h3>
                <p className="text-base leading-relaxed mb-4" style={{color: '#6b7280'}}>
                  View all your clients in one place. See invoice history, total revenue, and payment status for each client.
                </p>
              </div>
              <div>
                <h3 className="font-heading text-xl font-semibold mb-4 text-gray-900">Editing Clients</h3>
                <p className="text-base leading-relaxed mb-4" style={{color: '#6b7280'}}>
                  Update client information anytime. Changes will apply to future invoices automatically.
                </p>
              </div>
              <div>
                <h3 className="font-heading text-xl font-semibold mb-4 text-gray-900">Client Search</h3>
                <p className="text-base leading-relaxed mb-4" style={{color: '#6b7280'}}>
                  Use the search bar to quickly find clients by name, email, or company name.
                </p>
              </div>
            </div>
          )
        }
      ]
    },
    {
      id: 'reminders',
      title: 'Automated Reminders',
      icon: Bell,
      subsections: [
        {
          id: 'reminder-setup',
          title: 'Setting Up Reminders',
          content: (
            <div className="space-y-6">
              <div>
                <h3 className="font-heading text-xl font-semibold mb-4 text-gray-900">Reminder Types</h3>
                <p className="text-base leading-relaxed mb-4" style={{color: '#6b7280'}}>
                  Choose from four reminder types, each with a different tone:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border bg-white border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2">Friendly</h4>
                    <p className="text-sm" style={{color: '#6b7280'}}>Warm and casual tone. Great for regular clients.</p>
                  </div>
                  <div className="p-4 rounded-lg border bg-white border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2">Polite</h4>
                    <p className="text-sm" style={{color: '#6b7280'}}>Professional and courteous. Standard business communication.</p>
                  </div>
                  <div className="p-4 rounded-lg border bg-white border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2">Firm</h4>
                    <p className="text-sm" style={{color: '#6b7280'}}>Direct and business-like. For overdue invoices.</p>
                  </div>
                  <div className="p-4 rounded-lg border bg-white border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2">Urgent</h4>
                    <p className="text-sm" style={{color: '#6b7280'}}>Strong and immediate. For significantly overdue payments.</p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-heading text-xl font-semibold mb-4 text-gray-900">Reminder Schedule</h3>
                <p className="text-base leading-relaxed mb-4" style={{color: '#6b7280'}}>
                  Configure when reminders are sent:
                </p>
                <ul className="space-y-2 ml-6 text-sm" style={{color: '#6b7280'}}>
                  <li>• Before due date (e.g., 3 days before)</li>
                  <li>• On due date</li>
                  <li>• After due date (e.g., 7 days overdue)</li>
                  <li>• Multiple reminders at different intervals</li>
                </ul>
              </div>
              <div>
                <h3 className="font-heading text-xl font-semibold mb-4 text-gray-900">Default Settings</h3>
                <p className="text-base leading-relaxed mb-4" style={{color: '#6b7280'}}>
                  You can set default reminder preferences in invoice settings. These will apply to all new invoices, but you can customize per invoice as needed.
                </p>
              </div>
            </div>
          )
        },
        {
          id: 'reminder-history',
          title: 'Reminder History',
          content: (
            <div className="space-y-6">
              <div>
                <h3 className="font-heading text-xl font-semibold mb-4 text-gray-900">Tracking Reminders</h3>
                <p className="text-base leading-relaxed mb-4" style={{color: '#6b7280'}}>
                  View all reminders sent to clients in the Reminder History page. You can see:
                </p>
                <ul className="space-y-2 ml-6 text-sm" style={{color: '#6b7280'}}>
                  <li>• When reminders were sent</li>
                  <li>• Reminder type used</li>
                  <li>• Delivery status (sent, delivered, failed)</li>
                  <li>• Associated invoice details</li>
                </ul>
              </div>
              <div>
                <h3 className="font-heading text-xl font-semibold mb-4 text-gray-900">Manual Reminders</h3>
                <p className="text-base leading-relaxed mb-4" style={{color: '#6b7280'}}>
                  Send reminders manually at any time. Useful for following up on specific invoices or testing reminder templates.
                </p>
              </div>
              <div>
                <h3 className="font-heading text-xl font-semibold mb-4 text-gray-900">Filtering & Search</h3>
                <p className="text-base leading-relaxed mb-4" style={{color: '#6b7280'}}>
                  Use filters to find specific reminders by status, type, or date range. Search by invoice number or client name.
                </p>
              </div>
            </div>
          )
        }
      ]
    },
    {
      id: 'payments',
      title: 'Payments & Receipts',
      icon: CreditCard,
      subsections: [
        {
          id: 'payment-methods',
          title: 'Payment Methods',
          content: (
            <div className="space-y-6">
              <div>
                <h3 className="font-heading text-xl font-semibold mb-4 text-gray-900">Supported Payment Methods</h3>
                <p className="text-base leading-relaxed mb-4" style={{color: '#6b7280'}}>
                  Add any combination of payment methods you accept:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border bg-white border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2">Digital Wallets</h4>
                    <ul className="text-sm space-y-1" style={{color: '#6b7280'}}>
                      <li>• PayPal</li>
                      <li>• Cash App</li>
                      <li>• Venmo</li>
                      <li>• Google Pay</li>
                      <li>• Apple Pay</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg border bg-white border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2">Bank & Cards</h4>
                    <ul className="text-sm space-y-1" style={{color: '#6b7280'}}>
                      <li>• Bank Transfer</li>
                      <li>• Stripe (Credit/Debit)</li>
                      <li>• Custom payment notes</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-heading text-xl font-semibold mb-4 text-gray-900">Adding Payment Methods</h3>
                <p className="text-base leading-relaxed mb-4" style={{color: '#6b7280'}}>
                  Go to Settings → Payment Methods to add your payment information. This will appear on all invoices automatically, making it easy for clients to pay you.
                </p>
              </div>
            </div>
          )
        },
        {
          id: 'receipts',
          title: 'Receipts',
          content: (
            <div className="space-y-6">
              <div>
                <h3 className="font-heading text-xl font-semibold mb-4 text-gray-900">Downloading Receipts</h3>
                <p className="text-base leading-relaxed mb-4" style={{color: '#6b7280'}}>
                  Once an invoice is marked as paid, clients can download a receipt PDF from the public invoice page. Receipts include:
                </p>
                <ul className="space-y-2 ml-6 text-sm" style={{color: '#6b7280'}}>
                  <li>• Payment confirmation</li>
                  <li>• Invoice details</li>
                  <li>• Payment date</li>
                  <li>• Amount paid</li>
                  <li>• Business information</li>
                </ul>
              </div>
              <div>
                <h3 className="font-heading text-xl font-semibold mb-4 text-gray-900">Receipt Design</h3>
                <p className="text-base leading-relaxed mb-4" style={{color: '#6b7280'}}>
                  Receipts use a clean, minimal design that matches your invoice style. Professional and suitable for client records.
                </p>
              </div>
            </div>
          )
        }
      ]
    },
    {
      id: 'settings',
      title: 'Settings & Customization',
      icon: Settings,
      subsections: [
        {
          id: 'business-settings',
          title: 'Business Settings',
          content: (
            <div className="space-y-6">
              <div>
                <h3 className="font-heading text-xl font-semibold mb-4 text-gray-900">Updating Business Information</h3>
                <p className="text-base leading-relaxed mb-4" style={{color: '#6b7280'}}>
                  Update your business details anytime in Settings. Changes will apply to all new invoices. Existing invoices remain unchanged.
                </p>
              </div>
              <div>
                <h3 className="font-heading text-xl font-semibold mb-4 text-gray-900">Logo Upload</h3>
                <p className="text-base leading-relaxed mb-4" style={{color: '#6b7280'}}>
                  Upload your business logo to appear on invoices. Supported formats: PNG, JPG, SVG. Logo is automatically optimized for best quality and file size.
                </p>
                <p className="text-sm leading-relaxed" style={{color: '#6b7280'}}>
                  Recommended size: 200x200px or larger. Square logos work best.
                </p>
              </div>
            </div>
          )
        },
        {
          id: 'invoice-settings',
          title: 'Invoice Defaults',
          content: (
            <div className="space-y-6">
              <div>
                <h3 className="font-heading text-xl font-semibold mb-4 text-gray-900">Default Payment Terms</h3>
                <p className="text-base leading-relaxed mb-4" style={{color: '#6b7280'}}>
                  Set default payment terms that will be used for new invoices. You can override these per invoice if needed.
                </p>
              </div>
              <div>
                <h3 className="font-heading text-xl font-semibold mb-4 text-gray-900">Default Reminder Settings</h3>
                <p className="text-base leading-relaxed mb-4" style={{color: '#6b7280'}}>
                  Configure default reminder schedules and types. These will be applied to new invoices automatically.
                </p>
              </div>
              <div>
                <h3 className="font-heading text-xl font-semibold mb-4 text-gray-900">Template Preferences</h3>
                <p className="text-base leading-relaxed mb-4" style={{color: '#6b7280'}}>
                  Choose your preferred invoice template and brand colors. These will be used as defaults when creating new invoices.
                </p>
              </div>
            </div>
          )
        }
      ]
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      icon: HelpCircle,
      subsections: [
        {
          id: 'common-issues',
          title: 'Common Issues',
          content: (
            <div className="space-y-6">
              <div>
                <h3 className="font-heading text-xl font-semibold mb-4 text-gray-900">Emails Not Sending</h3>
                <p className="text-base leading-relaxed mb-4" style={{color: '#6b7280'}}>
                  If emails aren&apos;t being sent, check:
                </p>
                <ul className="space-y-2 ml-6 text-sm" style={{color: '#6b7280'}}>
                  <li>• Client email address is correct</li>
                  <li>• Check spam/junk folder</li>
                  <li>• Verify email service status in footer</li>
                  <li>• Try sending a test reminder</li>
                </ul>
              </div>
              <div>
                <h3 className="font-heading text-xl font-semibold mb-4 text-gray-900">PDF Not Generating</h3>
                <p className="text-base leading-relaxed mb-4" style={{color: '#6b7280'}}>
                  If PDF download fails:
                </p>
                <ul className="space-y-2 ml-6 text-sm" style={{color: '#6b7280'}}>
                  <li>• Refresh the page and try again</li>
                  <li>• Check browser compatibility</li>
                  <li>• Ensure invoice has valid data</li>
                </ul>
              </div>
              <div>
                <h3 className="font-heading text-xl font-semibold mb-4 text-gray-900">Reminders Not Working</h3>
                <p className="text-base leading-relaxed mb-4" style={{color: '#6b7280'}}>
                  If automated reminders aren&apos;t sending:
                </p>
                <ul className="space-y-2 ml-6 text-sm" style={{color: '#6b7280'}}>
                  <li>• Verify reminder settings are enabled</li>
                  <li>• Check invoice due dates are set correctly</li>
                  <li>• Review reminder history for delivery status</li>
                  <li>• Ensure client email is valid</li>
                </ul>
              </div>
            </div>
          )
        },
        {
          id: 'faq',
          title: 'Frequently Asked Questions',
          content: (
            <div className="space-y-6">
              <div className="p-6 rounded-lg border bg-white border-gray-200">
                <h3 className="font-heading text-lg font-semibold mb-3 text-gray-900">
                  Can I edit invoices after sending?
                </h3>
                <p className="text-sm leading-relaxed" style={{color: '#6b7280'}}>
                  Yes, you can edit invoices at any time. Draft invoices can be modified freely. For sent invoices, you can update details and resend to clients. All changes are tracked in invoice history.
                </p>
              </div>
              <div className="p-6 rounded-lg border bg-white border-gray-200">
                <h3 className="font-heading text-lg font-semibold mb-3 text-gray-900">
                  How do I change my business logo?
                </h3>
                <p className="text-sm leading-relaxed" style={{color: '#6b7280'}}>
                  Go to Settings → Business Information → Logo Upload. Upload a new logo to replace the existing one. The new logo will appear on all future invoices.
                </p>
              </div>
              <div className="p-6 rounded-lg border bg-white border-gray-200">
                <h3 className="font-heading text-lg font-semibold mb-3 text-gray-900">
                  Can I customize invoice colors?
                </h3>
                <p className="text-sm leading-relaxed" style={{color: '#6b7280'}}>
                  Yes, when creating a Detailed Invoice, you can choose primary and secondary colors that match your brand. These colors will be used throughout the invoice template.
                </p>
              </div>
              <div className="p-6 rounded-lg border bg-white border-gray-200">
                <h3 className="font-heading text-lg font-semibold mb-3 text-gray-900">
                  How do automated reminders work?
                </h3>
                <p className="text-sm leading-relaxed" style={{color: '#6b7280'}}>
                  Automated reminders are sent based on your invoice due dates and payment terms. You configure reminder schedules in invoice settings, and the system automatically sends reminders before and after due dates based on your preferences.
                </p>
              </div>
              <div className="p-6 rounded-lg border bg-white border-gray-200">
                <h3 className="font-heading text-lg font-semibold mb-3 text-gray-900">
                  Is my data secure?
                </h3>
                <p className="text-sm leading-relaxed" style={{color: '#6b7280'}}>
                  Yes, all data is encrypted and stored securely. We use industry-standard security practices and never share your information with third parties. Your invoices and client data remain private and protected.
                </p>
              </div>
              <div className="p-6 rounded-lg border bg-white border-gray-200">
                <h3 className="font-heading text-lg font-semibold mb-3 text-gray-900">
                  Can clients pay directly through FlowInvoicer?
                </h3>
                <p className="text-sm leading-relaxed" style={{color: '#6b7280'}}>
                  Currently, FlowInvoicer displays your payment methods on invoices. Clients pay you directly using those methods. We provide payment information and make it easy for clients to know how to pay you.
                </p>
              </div>
            </div>
          )
        }
      ]
    }
  ];

  // Filter sections based on search
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return docSections;
    
    const query = searchQuery.toLowerCase();
    return docSections.map(section => ({
      ...section,
      subsections: section.subsections.filter(sub => 
        sub.title.toLowerCase().includes(query) ||
        JSON.stringify(sub.content).toLowerCase().includes(query)
      )
    })).filter(section => section.subsections.length > 0);
  }, [searchQuery]);

  const [selectedSubsection, setSelectedSubsection] = useState<string>(
    docSections[0].subsections[0].id
  );

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (sidebarOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [sidebarOpen]);

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [sidebarOpen]);

  // Auto-expand section containing current subsection
  useEffect(() => {
    if (selectedSubsection) {
      for (const section of docSections) {
        if (section.subsections.some(sub => sub.id === selectedSubsection)) {
          setActiveSection(section.id);
          break;
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubsection]);

  const currentContent = useMemo(() => {
    for (const section of docSections) {
      const subsection = section.subsections.find(sub => sub.id === selectedSubsection);
      if (subsection) return subsection.content;
    }
    return null;
  }, [selectedSubsection]);

  const handleSubsectionClick = (subsectionId: string) => {
    setSelectedSubsection(subsectionId);
    setSidebarOpen(false);
    // Focus management for accessibility
    setTimeout(() => {
      const mainContent = document.querySelector('main');
      if (mainContent) {
        const firstHeading = mainContent.querySelector('h1, h2, h3');
        if (firstHeading) {
          (firstHeading as HTMLElement).focus();
        }
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setSidebarOpen(false);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Close menu"
        />
      )}

      <div className="flex relative">
        {/* Sidebar Navigation */}
        <aside 
          ref={sidebarRef}
          id="docs-sidebar"
          className={`fixed lg:sticky top-16 h-[calc(100vh-4rem)] w-72 lg:w-64 border-r border-gray-200 bg-white overflow-y-auto z-50 lg:z-20 transition-transform duration-300 ease-in-out will-change-transform shadow-lg lg:shadow-none ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
          aria-label="Documentation navigation"
        >
          <div className="p-4 lg:p-6">
            {/* Mobile Close Button */}
            <div className="lg:hidden flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Documentation</h2>
              <button
                onClick={() => {
                  setSidebarOpen(false);
                  menuButtonRef.current?.focus();
                }}
                className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search documentation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
            </div>

            {/* Navigation */}
            <nav className="space-y-1">
              {filteredSections.map((section) => {
                const Icon = section.icon;
                const isOpen = activeSection === section.id;
                
                return (
                  <div key={section.id}>
                    <button
                      onClick={() => setActiveSection(isOpen ? null : section.id)}
                      className="w-full flex items-center justify-between px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 rounded-lg transition-colors touch-manipulation focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
                      aria-expanded={isOpen}
                      aria-controls={`section-${section.id}`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="text-left">{section.title}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
                    </button>
                    <div
                      id={`section-${section.id}`}
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <div className="ml-7 mt-1 space-y-1">
                        {section.subsections.map((subsection) => (
                          <button
                            key={subsection.id}
                            onClick={() => handleSubsectionClick(subsection.id)}
                            className={`w-full text-left px-3 py-2.5 text-sm rounded-lg transition-colors touch-manipulation focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 ${
                              selectedSubsection === subsection.id
                                ? 'bg-gray-100 text-gray-900 font-medium'
                                : 'text-gray-600 hover:bg-gray-50 active:bg-gray-100'
                            }`}
                            aria-current={selectedSubsection === subsection.id ? 'page' : undefined}
                          >
                            {subsection.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 w-full lg:w-auto">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 lg:pl-12 py-6 sm:py-8">
            {/* Mobile Menu Button - Top of Content */}
            <div className="lg:hidden mb-4">
              <button
                ref={menuButtonRef}
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
                aria-label={sidebarOpen ? 'Close documentation menu' : 'Open documentation menu'}
                aria-expanded={sidebarOpen}
                aria-controls="docs-sidebar"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                <span>{sidebarOpen ? 'Close' : 'Menu'}</span>
              </button>
            </div>

            {/* Breadcrumb */}
            <div className="mb-6">
              <Link 
                href="/" 
                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-3 touch-manipulation"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
              <h1 className="font-heading text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-900 tracking-tight">
                {docSections.find(s => s.subsections.some(sub => sub.id === selectedSubsection))?.subsections.find(sub => sub.id === selectedSubsection)?.title || 'Documentation'}
              </h1>
            </div>

            {/* Content */}
            <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none prose-headings:font-heading prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-gray-900 prose-a:underline prose-strong:text-gray-900">
              {currentContent}
            </div>

            {/* Navigation Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Need more help?</p>
                  <Link href="/contact" className="text-sm font-medium text-gray-900 hover:underline">
                    Contact Support →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
