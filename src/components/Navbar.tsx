'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleGetStarted = () => {
    window.location.href = '/auth';
  };

  const handleViewDemo = () => {
    window.location.href = '/dashboard';
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 max-w-6xl mx-auto left-1/2 transform -translate-x-1/2 rounded-lg mt-4 bg-white/95 backdrop-blur-md border border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex justify-between items-center h-12">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link href="/" className="flex items-center">
              <div className="relative w-28 h-7 sm:w-32 sm:h-8 md:w-36 md:h-9 lg:w-40 lg:h-10">
                <Image
                  src="/logo-main-black.png"
                  alt="InvoiceFlow Logo"
                  width={208}
                  height={52}
                  className="w-full h-full object-contain"
                />
              </div>
            </Link>
          </div>

          {/* Tablet/Desktop Navigation */}
          <div className="hidden sm:flex items-center space-x-4 lg:space-x-8">
            <Link href="/" className="text-xs sm:text-sm font-medium transition-colors hover:opacity-80" style={{color: '#6b7280'}}>
              Home
            </Link>
            <Link href="/about" className="text-xs sm:text-sm font-medium transition-colors hover:opacity-80" style={{color: '#6b7280'}}>
              About
            </Link>
            <Link href="/contact" className="text-xs sm:text-sm font-medium transition-colors hover:opacity-80" style={{color: '#6b7280'}}>
              Contact
            </Link>
          </div>

          {/* Tablet/Desktop Actions */}
          <div className="hidden sm:flex items-center space-x-2 lg:space-x-3">
            <button
              onClick={handleViewDemo}
              className="text-xs sm:text-sm font-medium transition-colors px-3 py-2 sm:px-4 rounded-lg hover:opacity-80"
              style={{color: '#6b7280'}}
            >
              View Demo
            </button>
            <button
              onClick={handleGetStarted}
              className="px-4 py-2 sm:px-6 rounded-lg text-xs sm:text-sm font-medium transition-colors bg-black text-white hover:bg-gray-800"
            >
              Get Started
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="sm:hidden flex items-center space-x-1">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 rounded-md transition-colors bg-gray-100 text-gray-600 hover:bg-gray-200"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="sm:hidden border-t border-gray-200 animate-in slide-in-from-top-2 duration-300">
            <div className="px-4 pt-3 pb-4 space-y-1">
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2.5 text-sm font-medium rounded-md transition-colors"
                style={{color: '#6b7280'}}
              >
                Home
              </Link>
              <Link
                href="/about"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2.5 text-sm font-medium rounded-md transition-colors"
                style={{color: '#6b7280'}}
              >
                About
              </Link>
              <Link
                href="/contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2.5 text-sm font-medium rounded-md transition-colors"
                style={{color: '#6b7280'}}
              >
                Contact
              </Link>
              <div className="pt-3 pb-2 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    handleViewDemo();
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2.5 text-sm font-medium rounded-md transition-colors mb-2"
                  style={{color: '#6b7280'}}
                >
                  View Demo
                </button>
                <button
                  onClick={() => {
                    handleGetStarted();
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2.5 text-sm font-medium rounded-md transition-colors bg-black text-white hover:bg-gray-800"
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
