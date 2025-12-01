'use client';

import Link from 'next/link';
import Image from 'next/image';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface FooterProps {}

export default function Footer({}: FooterProps) {
  return (
    <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-200">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="mb-4">
              <div className="mb-3">
                <span className="text-2xl font-bold tracking-tight">
                  <span className="text-gray-900">Flow</span>
                  <span className="text-violet-600">Invoice</span>
                </span>
              </div>
              <p className="text-sm leading-relaxed" style={{color: '#6b7280', marginLeft: '0'}}>
                The fastest way for freelancers to get paid.
              </p>
            </div>
          </div>
          <div>
            <h3 className="font-heading text-lg font-semibold mb-4" style={{color: '#1f2937'}}>Product</h3>
            <ul className="space-y-2" style={{color: '#6b7280'}}>
              <li><a href="#features" className="transition-colors hover:opacity-80">Features</a></li>
              <li><a href="#pricing" className="transition-colors hover:opacity-80">Pricing</a></li>
              <li><a href="#" className="transition-colors hover:opacity-80">Templates</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-heading text-lg font-semibold mb-4" style={{color: '#1f2937'}}>Support</h3>
            <ul className="space-y-2" style={{color: '#6b7280'}}>
              <li><a href="/contact" className="transition-colors hover:opacity-80">Contact</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-heading text-lg font-semibold mb-4" style={{color: '#1f2937'}}>Company</h3>
            <ul className="space-y-2" style={{color: '#6b7280'}}>
              <li><a href="/about" className="transition-colors hover:opacity-80">About</a></li>
              <li><a href="/privacy" className="transition-colors hover:opacity-80">Privacy</a></li>
              <li><a href="/terms" className="transition-colors hover:opacity-80">Terms</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t mt-8 pt-8 text-center border-gray-200" style={{color: '#6b7280'}}>
          <p>&copy; 2024 FlowInvoicer. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
