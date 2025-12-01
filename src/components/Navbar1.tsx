"use client" 

import * as React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Menu, X, ChevronDown } from "lucide-react"
import { useRouter } from "next/navigation"

const Navbar1 = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const router = useRouter()

  const toggleMenu = () => setIsOpen(!isOpen)

  const handleNavigation = (path: string) => {
    setIsOpen(false)
    if (path === 'home') {
      router.push('/')
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }, 100)
    } else if (path === 'about') {
      router.push('/about')
    } else if (path === 'contact') {
      router.push('/contact')
    } else if (path === 'privacy') {
      router.push('/privacy')
    } else if (path === 'terms') {
      router.push('/terms')
    } else if (path === 'features') {
      if (window.location.pathname === '/') {
        setTimeout(() => {
          const featuresSection = document.getElementById('features')
          if (featuresSection) {
            featuresSection.scrollIntoView({ behavior: 'smooth' })
          }
        }, 100)
      } else {
        router.push('/')
        setTimeout(() => {
          const featuresSection = document.getElementById('features')
          if (featuresSection) {
            featuresSection.scrollIntoView({ behavior: 'smooth' })
          }
        }, 300)
      }
    } else if (path === 'pricing') {
      if (window.location.pathname === '/') {
        setTimeout(() => {
          const pricingSection = document.getElementById('pricing')
          if (pricingSection) {
            pricingSection.scrollIntoView({ behavior: 'smooth' })
          }
        }, 100)
      } else {
        router.push('/')
        setTimeout(() => {
          const pricingSection = document.getElementById('pricing')
          if (pricingSection) {
            pricingSection.scrollIntoView({ behavior: 'smooth' })
          }
        }, 300)
      }
    }
  }

  const handleGetStarted = () => {
    setIsOpen(false)
    router.push('/auth')
  }

  const handleSignIn = () => {
    setIsOpen(false)
    router.push('/auth')
  }

  return (
    <nav className="w-full bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            className="flex items-center cursor-pointer"
            onClick={() => router.push('/')}
          >
            <span className="text-xl font-bold tracking-tight">
              <span className="text-gray-900">Flow</span>
              <span className="text-violet-600">Invoice</span>
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            <a 
              href="#"
              onClick={(e) => {
                e.preventDefault()
                handleNavigation('features')
              }}
              className="text-sm text-gray-700 hover:text-gray-900 transition-colors"
            >
              Features
            </a>

            <a 
              href="#"
              onClick={(e) => {
                e.preventDefault()
                handleNavigation('about')
              }}
              className="text-sm text-gray-700 hover:text-gray-900 transition-colors"
            >
              About
            </a>
            
            {/* Resources Dropdown */}
            <div className="relative group">
              <button className="flex items-center text-sm text-gray-700 hover:text-gray-900 transition-colors">
                Resources
                <ChevronDown className="w-4 h-4 ml-1" />
              </button>
              <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none group-hover:pointer-events-auto">
                <div className="w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <a 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      handleNavigation('privacy')
                    }}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Privacy Policy
                  </a>
                  <a 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      handleNavigation('terms')
                    }}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Terms of Service
                  </a>
                </div>
              </div>
            </div>

            <a 
              href="#"
              onClick={(e) => {
                e.preventDefault()
                handleNavigation('pricing')
              }}
              className="text-sm text-gray-700 hover:text-gray-900 transition-colors"
            >
              Pricing
            </a>

            <a 
              href="#"
              onClick={(e) => {
                e.preventDefault()
                handleNavigation('contact')
              }}
              className="text-sm text-gray-700 hover:text-gray-900 transition-colors"
            >
              Support
            </a>

          </div>

          {/* Desktop CTA Button */}
          <div className="hidden lg:flex items-center space-x-4">
            <a 
              href="#"
              onClick={(e) => {
                e.preventDefault()
                handleSignIn()
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-lg transition-colors"
            >
              Sign up
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="lg:hidden flex items-center p-2 text-gray-700 hover:text-gray-900" 
            onClick={toggleMenu}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-white z-50 lg:hidden"
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className="flex flex-col h-full">
              {/* Mobile Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <div className="flex items-center">
                  <span className="text-xl font-bold tracking-tight">
                    <span className="text-gray-900">Flow</span>
                    <span className="text-violet-600">Invoice</span>
                  </span>
                </div>
                <button
                  onClick={toggleMenu}
                  className="p-2 text-gray-700 hover:text-gray-900"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Mobile Navigation */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-1">
                <a 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    handleNavigation('features')
                  }}
                  className="block py-3 text-base text-gray-900 font-medium"
                >
                  Features
                </a>
                <a 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    handleNavigation('about')
                  }}
                  className="block py-3 text-base text-gray-900 font-medium"
                >
                  About
                </a>
                <a 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    handleNavigation('pricing')
                  }}
                  className="block py-3 text-base text-gray-900 font-medium"
                >
                  Pricing
                </a>
                <a 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    handleNavigation('contact')
                  }}
                  className="block py-3 text-base text-gray-900 font-medium"
                >
                  Support
                </a>
                <div className="pt-2 pb-2 border-t border-gray-200 mt-2">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2">Resources</div>
                  <a 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      handleNavigation('privacy')
                    }}
                    className="block py-2 px-3 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Privacy Policy
                  </a>
                  <a 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      handleNavigation('terms')
                    }}
                    className="block py-2 px-3 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Terms of Service
                  </a>
                </div>
              </div>

              {/* Mobile CTA Button */}
              <div className="px-6 py-6 border-t border-gray-200">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    handleSignIn()
                  }}
                  className="block w-full px-4 py-3 text-base font-medium text-center text-white bg-black hover:bg-gray-800 rounded-lg transition-colors"
                >
                  Sign up
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

export { Navbar1 }
