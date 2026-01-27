'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Save, Upload, Building2, CreditCard, Globe } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { CURRENCIES } from '@/lib/currency'
import CustomDropdown from '@/components/CustomDropdown'

interface FreelancerSettings {
  businessName: string
  logo: string
  address: string
  email: string
  phone: string
  website: string
  paypalEmail: string
  cashappId: string
  venmoId: string
  googlePayUpi: string
  applePayId: string
  bankAccount: string
  bankIfscSwift: string
  bankIban: string
  stripeAccount: string
  paymentNotes: string
  baseCurrency: string
}

export default function SettingsPage() {
  const { user, loading: authLoading, getAuthHeaders } = useAuth()
  const router = useRouter()
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<FreelancerSettings>({
    businessName: '',
    logo: '',
    address: '',
    email: '',
    phone: '',
    website: '',
    paypalEmail: '',
    cashappId: '',
    venmoId: '',
    googlePayUpi: '',
    applePayId: '',
    bankAccount: '',
    bankIfscSwift: '',
    bankIban: '',
    stripeAccount: '',
    paymentNotes: '',
    baseCurrency: 'USD'
  })

  useEffect(() => {
    // Check if we're in the browser
    if (typeof window === 'undefined') return

    // Check dark mode - use same key as main app
    const savedTheme = localStorage.getItem('theme')
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = savedTheme === 'dark' || (!savedTheme && systemPrefersDark)
    
    setIsDarkMode(isDark)
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }

    // Load saved settings from API
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/settings', {
        headers
      })
      const data = await response.json()
      
      if (data.settings) {
        setSettings({
          businessName: data.settings.businessName || '',
          logo: data.settings.logo || '',
          address: data.settings.address || '',
          email: data.settings.businessEmail || '',
          phone: data.settings.businessPhone || '',
          website: data.settings.website || '',
          paypalEmail: data.settings.paypalEmail || '',
          cashappId: data.settings.cashappId || '',
          venmoId: data.settings.venmoId || '',
          googlePayUpi: data.settings.googlePayUpi || '',
          applePayId: data.settings.applePayId || '',
          bankAccount: data.settings.bankAccount || '',
          bankIfscSwift: data.settings.bankIfscSwift || '',
          bankIban: data.settings.bankIban || '',
          stripeAccount: data.settings.stripeAccount || '',
          paymentNotes: data.settings.paymentNotes || '',
          baseCurrency: data.settings.baseCurrency || 'USD'
        })
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      // Fallback to localStorage for offline support
      try {
        const savedSettings = localStorage.getItem('freelancerSettings')
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings))
        }
      } catch (localError) {
        console.error('Error loading local settings:', localError)
      }
    }
  }

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth')
    }
  }, [user, authLoading, router])

  const handleSave = async () => {
    setSaving(true)
    try {
      const headers = await getAuthHeaders()
      
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          businessName: settings.businessName,
          businessEmail: settings.email,
          businessPhone: settings.phone,
          address: settings.address,
          website: settings.website,
          logo: settings.logo,
          paypalEmail: settings.paypalEmail,
          cashappId: settings.cashappId,
          venmoId: settings.venmoId,
          googlePayUpi: settings.googlePayUpi,
          applePayId: settings.applePayId,
          bankAccount: settings.bankAccount,
          bankIfscSwift: settings.bankIfscSwift,
          bankIban: settings.bankIban,
          stripeAccount: settings.stripeAccount,
          paymentNotes: settings.paymentNotes,
          baseCurrency: settings.baseCurrency
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        // Also save to localStorage as backup
        if (typeof window !== 'undefined') {
          localStorage.setItem('freelancerSettings', JSON.stringify(settings))
        }
        alert('Settings saved successfully!')
      } else {
        throw new Error(data.error || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Error saving settings: ' + (error as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setSettings(prev => ({ ...prev, logo: e.target?.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Please sign in to access settings</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDarkMode ? 'bg-black' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-md border-b transition-all duration-200 ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18 md:h-20">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                ← Back
              </button>
              <h1 className="text-xl font-semibold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                Settings
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Business Information */}
          <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-slate-800/50 border border-slate-700' : 'bg-white/70 border border-slate-200'} backdrop-blur-sm`}>
            <div className="flex items-center space-x-3 mb-6">
              <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                Business Information
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                  Business Name *
                </label>
                <input
                  type="text"
                  value={settings.businessName}
                  onChange={(e) => setSettings(prev => ({ ...prev, businessName: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                  placeholder="Your Business Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                  Email *
                </label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={settings.phone}
                  onChange={(e) => setSettings(prev => ({ ...prev, phone: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                  Website
                </label>
                <input
                  type="url"
                  value={settings.website}
                  onChange={(e) => setSettings(prev => ({ ...prev, website: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                  placeholder="https://yourwebsite.com"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                  Address
                </label>
                <textarea
                  value={settings.address}
                  onChange={(e) => setSettings(prev => ({ ...prev, address: e.target.value }))}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                  placeholder="Your business address"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                  Logo
                </label>
                <div className="flex items-center space-x-4">
                  {settings.logo && (
                    <div className="w-16 h-16 object-contain rounded-lg border flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                      <span className="text-xs text-gray-500">Logo</span>
                    </div>
                  )}
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <div className={`flex items-center space-x-2 px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                      <Upload className="h-4 w-4" />
                      <span className="text-sm">Upload Logo</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Currency Settings */}
          <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-slate-800/50 border border-slate-700' : 'bg-white/70 border border-slate-200'} backdrop-blur-sm`}>
            <div className="flex items-center space-x-3 mb-6">
              <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
                <Globe className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                  Currency Settings
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Set your base currency for metrics and reporting. This affects how revenue is calculated across your dashboard.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                  Base Currency *
                </label>
                <CustomDropdown
                  value={settings.baseCurrency || 'USD'}
                  onChange={(value) => setSettings(prev => ({ ...prev, baseCurrency: value }))}
                  options={CURRENCIES.map((currency) => ({
                    value: currency.code,
                    label: `${currency.code} - ${currency.name} (${currency.symbol})`
                  }))}
                  placeholder="Select base currency"
                  isDarkMode={isDarkMode}
                  searchable={true}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  All dashboard metrics will be converted to this currency
                </p>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-slate-800/50 border border-slate-700' : 'bg-white/70 border border-slate-200'} backdrop-blur-sm`}>
            <div className="flex items-center space-x-3 mb-6">
              <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-green-500/20' : 'bg-green-100'}`}>
                <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-lg font-semibold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                Payment Details
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                  PayPal Email
                </label>
                <input
                  type="email"
                  value={settings.paypalEmail}
                  onChange={(e) => setSettings(prev => ({ ...prev, paypalEmail: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                  placeholder="your@paypal.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                  CashApp ID
                </label>
                <input
                  type="text"
                  value={settings.cashappId}
                  onChange={(e) => setSettings(prev => ({ ...prev, cashappId: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                  placeholder="$yourcashapp"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                  Venmo ID
                </label>
                <input
                  type="text"
                  value={settings.venmoId}
                  onChange={(e) => setSettings(prev => ({ ...prev, venmoId: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                  placeholder="@yourvenmo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                  Apple Pay ID
                </label>
                <input
                  type="text"
                  value={settings.applePayId}
                  onChange={(e) => setSettings(prev => ({ ...prev, applePayId: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                  placeholder="Apple Pay ID or phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                  Google Pay / UPI ID
                </label>
                <input
                  type="text"
                  value={settings.googlePayUpi}
                  onChange={(e) => setSettings(prev => ({ ...prev, googlePayUpi: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                  placeholder="your@upi or phone number"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                  Bank Account Details
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{color: isDarkMode ? '#9ca3af' : '#6b7280'}}>
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={settings.bankAccount}
                      onChange={(e) => setSettings(prev => ({ ...prev, bankAccount: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                      placeholder="Account number"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{color: isDarkMode ? '#9ca3af' : '#6b7280'}}>
                      IFSC / SWIFT Code
                    </label>
                    <input
                      type="text"
                      value={settings.bankIfscSwift}
                      onChange={(e) => setSettings(prev => ({ ...prev, bankIfscSwift: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                      placeholder="IFSC or SWIFT code"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                  IBAN (International)
                </label>
                <input
                  type="text"
                  value={settings.bankIban}
                  onChange={(e) => setSettings(prev => ({ ...prev, bankIban: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                  placeholder="IBAN number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                  Stripe Account
                </label>
                <input
                  type="text"
                  value={settings.stripeAccount}
                  onChange={(e) => setSettings(prev => ({ ...prev, stripeAccount: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                  placeholder="Stripe account ID or email"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                  Additional Payment Methods
                </label>
                <textarea
                  value={settings.paymentNotes}
                  onChange={(e) => setSettings(prev => ({ ...prev, paymentNotes: e.target.value }))}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                  placeholder="Wise, Revolut, Zelle, or other payment methods not listed above..."
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
