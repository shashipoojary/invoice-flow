'use client';

import { useState, useEffect } from 'react';
import { Menu, X, Settings } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface NavbarProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  isScrolled?: boolean;
}

export default function Navbar({ isDarkMode, toggleDarkMode, isScrolled = false }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [internalIsScrolled, setInternalIsScrolled] = useState(false);

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
            setInternalIsScrolled(true);
          } else if (scrollTop < lastScrollTop && scrollTop < 50) {
            // Scrolling up - expand
            setInternalIsScrolled(false);
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

  // Use external isScrolled prop if provided, otherwise use internal state
  const currentIsScrolled = isScrolled !== undefined ? isScrolled : internalIsScrolled;

  const handleGetStarted = () => {
    window.location.href = '/auth';
  };

  const handleViewDemo = () => {
    window.location.href = '/dashboard';
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-out ${
      currentIsScrolled 
        ? `max-w-6xl mx-auto left-1/2 transform -translate-x-1/2 rounded-2xl mt-4 ${
            isDarkMode 
              ? 'bg-gray-900/95 backdrop-blur-xl border border-gray-800 shadow-2xl' 
              : 'bg-white/95 backdrop-blur-xl border border-gray-200 shadow-2xl'
          }`
        : `${
            isDarkMode 
              ? 'bg-black/95 border-b border-gray-800' 
              : 'bg-white/95 border-b border-gray-200'
          } backdrop-blur-md`
    }`} style={{
      willChange: currentIsScrolled ? 'transform, width, height' : 'auto'
    }}>
      <div className={`px-4 sm:px-6 lg:px-8 transition-all duration-300 ease-out ${
        currentIsScrolled ? 'py-3' : 'py-4'
      }`}>
        <div className={`flex justify-between items-center transition-all duration-300 ease-out ${
          currentIsScrolled ? 'h-12' : 'h-16'
        }`}>
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link href="/" className="flex items-center">
              <div className={`relative transition-all duration-300 ease-out ${
                currentIsScrolled 
                  ? 'w-28 h-7 sm:w-32 sm:h-8 md:w-36 md:h-9 lg:w-40 lg:h-10' 
                  : 'w-32 h-8 sm:w-36 sm:h-9 md:w-40 md:h-10 lg:w-44 lg:h-11'
              }`}>
                <Image
                  src={isDarkMode ? '/logo-main-white.png' : '/logo-main-black.png'}
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
            <Link href="/" className="text-xs sm:text-sm font-medium transition-colors hover:opacity-80" style={{color: isDarkMode ? '#9ca3af' : '#6b7280'}}>
              Home
            </Link>
            <Link href="/about" className="text-xs sm:text-sm font-medium transition-colors hover:opacity-80" style={{color: isDarkMode ? '#9ca3af' : '#6b7280'}}>
              About
            </Link>
            <Link href="/contact" className="text-xs sm:text-sm font-medium transition-colors hover:opacity-80" style={{color: isDarkMode ? '#9ca3af' : '#6b7280'}}>
              Contact
            </Link>
          </div>

          {/* Tablet/Desktop Actions */}
          <div className="hidden sm:flex items-center space-x-2 lg:space-x-3">
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode 
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={handleViewDemo}
              className="text-xs sm:text-sm font-medium transition-colors px-3 py-2 sm:px-4 rounded-lg hover:opacity-80"
              style={{color: isDarkMode ? '#9ca3af' : '#6b7280'}}
            >
              View Demo
            </button>
            <button
              onClick={handleGetStarted}
              className={`px-4 py-2 sm:px-6 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                isDarkMode 
                  ? 'bg-white text-black hover:bg-gray-200' 
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              Get Started
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="sm:hidden flex items-center space-x-1">
            <button
              onClick={toggleDarkMode}
              className={`p-1.5 rounded-md transition-colors ${
                isDarkMode 
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`p-1.5 rounded-md transition-colors ${
                isDarkMode 
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className={`sm:hidden border-t ${
            isDarkMode ? 'border-gray-800' : 'border-gray-200'
          }`}>
            <div className="px-4 pt-3 pb-4 space-y-1">
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2.5 text-sm font-medium rounded-md transition-colors"
                style={{color: isDarkMode ? '#9ca3af' : '#6b7280'}}
              >
                Home
              </Link>
              <Link
                href="/about"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2.5 text-sm font-medium rounded-md transition-colors"
                style={{color: isDarkMode ? '#9ca3af' : '#6b7280'}}
              >
                About
              </Link>
              <Link
                href="/contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2.5 text-sm font-medium rounded-md transition-colors"
                style={{color: isDarkMode ? '#9ca3af' : '#6b7280'}}
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
                  style={{color: isDarkMode ? '#9ca3af' : '#6b7280'}}
                >
                  View Demo
                </button>
                <button
                  onClick={() => {
                    handleGetStarted();
                    setIsMobileMenuOpen(false);
                  }}
                  className={`block w-full text-left px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                    isDarkMode 
                      ? 'bg-white text-black hover:bg-gray-200' 
                      : 'bg-black text-white hover:bg-gray-800'
                  }`}
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
