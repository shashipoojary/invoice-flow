'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import Image from 'next/image';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleGetStarted = () => {
    router.push('/auth');
  };

  const handleViewDemo = () => {
    router.push('/dashboard');
  };

  const handleLogoClick = () => {
    router.push('/');
  };

  // Don't show navbar on auth pages
  if (pathname.startsWith('/auth') || pathname.startsWith('/dashboard')) {
    return null;
  }

  return (
    <nav
      data-state={isMobileMenuOpen && 'active'}
      className="fixed left-0 w-full z-20 px-2"
    >
      <div className="mx-auto mt-2 max-w-6xl px-6 lg:px-12 bg-white border-b border-gray-100">
        <div className="relative flex flex-wrap items-center justify-between gap-6 lg:gap-0 py-3">
          <div className="flex w-full justify-between lg:w-auto">
            {/* Logo */}
            <div className="flex items-center cursor-pointer" onClick={handleLogoClick}>
              <div className="relative w-48 h-16 sm:w-56 lg:w-64 flex items-center justify-start overflow-hidden">
                <Image
                  src="/logo-main-black.png"
                  alt="FlowInvoicer Logo"
                  width={420}
                  height={140}
                  className="h-full w-auto object-contain scale-150 origin-center"
                />
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? 'Close Menu' : 'Open Menu'}
              className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
            >
              <Menu className={`m-auto size-6 duration-200 ${isMobileMenuOpen ? 'rotate-180 scale-0 opacity-0' : ''}`} />
              <X className={`absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200 ${isMobileMenuOpen ? 'rotate-0 scale-100 opacity-100' : ''}`} />
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <div className="absolute inset-0 m-auto hidden size-fit lg:block">
            <ul className="flex gap-8 text-sm">
              <li>
                <a href="#features" className="text-gray-600 hover:text-gray-900 block duration-150 font-medium">
                  <span>Features</span>
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-gray-600 hover:text-gray-900 block duration-150 font-medium">
                  <span>Pricing</span>
                </a>
              </li>
              <li>
                <a href="#about" className="text-gray-600 hover:text-gray-900 block duration-150 font-medium">
                  <span>About</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Desktop Action Buttons */}
          <div className="absolute right-0 top-1/2 hidden -translate-y-1/2 lg:block">
            <div className="flex items-center gap-4">
              <button
                onClick={handleViewDemo}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                View Demo
              </button>
              <button
                onClick={handleGetStarted}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
              >
                Get Started
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="absolute top-full left-0 right-0 bg-white border-0 lg:border border-gray-100 shadow-lg md:hidden">
              <div className="px-4 py-6 space-y-1">
                <a
                  href="#features"
                  className="block py-3 text-base font-medium text-gray-900 hover:text-indigo-600"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Features
                </a>
                <a
                  href="#pricing"
                  className="block py-3 text-base font-medium text-gray-900 hover:text-indigo-600"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Pricing
                </a>
                <a
                  href="#about"
                  className="block py-3 text-base font-medium text-gray-900 hover:text-indigo-600"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  About
                </a>
                <div className="pt-4 space-y-2">
                  <button
                    onClick={() => {
                      handleViewDemo();
                      setIsMobileMenuOpen(false);
                    }}
                    className="block w-full py-3 px-4 text-base font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    View Demo
                  </button>
                  <button
                    onClick={() => {
                      handleGetStarted();
                      setIsMobileMenuOpen(false);
                    }}
                    className="block w-full py-3 px-4 text-base font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800"
                  >
                    Get Started
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}