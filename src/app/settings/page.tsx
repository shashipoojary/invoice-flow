'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Save, Upload, Building2, CreditCard, Mail, MapPin, User } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface FreelancerSettings {
  businessName: string
  logo: string
  address: string
  email: string
  paypalEmail: string
  venmoId: string
  googlePayUpi: string
  bankAccount: string
  bankIfscSwift: string
  bankIban: string
  paymentNotes: string
}

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<FreelancerSettings>({
    businessName: '',
    logo: '',
    address: '',
    email: '',
    paypalEmail: '',
    venmoId: '',
    googlePayUpi: '',
    bankAccount: '',
    bankIfscSwift: '',
    bankIban: '',
    paymentNotes: ''
  })

  useEffect(() => {
    // Check dark mode
    const isDark = localStorage.getItem('darkMode') === 'true' || 
                   (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setIsDarkMode(isDark)
    if (isDark) {
      document.documentElement.classList.add('dark')
    }

    // Load saved settings
    const savedSettings = localStorage.getItem('freelancerSettings')
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }
  }, [])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
    }
  }, [user, authLoading, router])

  const handleSave = async () => {
    setSaving(true)
    try {
      localStorage.setItem('freelancerSettings', JSON.stringify(settings))
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      alert('Settings saved successfully!')
    } catch (error) {
      alert('Error saving settings')
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
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
          <div className={`rounded-2xl p-6 ${isDarkMode ? 'bg-slate-800/50 border border-slate-700' : 'bg-white/70 border border-slate-200'} backdrop-blur-sm`}>
            <div className="flex items-center space-x-3 mb-6">
              <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                Business Information
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                  Business Name *
                </label>
                <input
                  type="text"
                  value={settings.businessName}
                  onChange={(e) => setSettings(prev => ({ ...prev, businessName: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
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
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                  placeholder="your@email.com"
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
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                  placeholder="Your business address"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                  Logo
                </label>
                <div className="flex items-center space-x-4">
                  {settings.logo && (
                    <img src={settings.logo} alt="Logo" className="w-16 h-16 object-contain rounded-lg border" />
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

          {/* Payment Details */}
          <div className={`rounded-2xl p-6 ${isDarkMode ? 'bg-slate-800/50 border border-slate-700' : 'bg-white/70 border border-slate-200'} backdrop-blur-sm`}>
            <div className="flex items-center space-x-3 mb-6">
              <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-green-500/20' : 'bg-green-100'}`}>
                <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-lg font-semibold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                Payment Details
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                  PayPal Email
                </label>
                <input
                  type="email"
                  value={settings.paypalEmail}
                  onChange={(e) => setSettings(prev => ({ ...prev, paypalEmail: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                  placeholder="your@paypal.com"
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
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                  placeholder="@yourvenmo"
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
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                  placeholder="your@upi or phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                  Bank Account Number
                </label>
                <input
                  type="text"
                  value={settings.bankAccount}
                  onChange={(e) => setSettings(prev => ({ ...prev, bankAccount: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                  placeholder="Account number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                  IFSC / SWIFT Code
                </label>
                <input
                  type="text"
                  value={settings.bankIfscSwift}
                  onChange={(e) => setSettings(prev => ({ ...prev, bankIfscSwift: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                  placeholder="IFSC or SWIFT code"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                  IBAN (International)
                </label>
                <input
                  type="text"
                  value={settings.bankIban}
                  onChange={(e) => setSettings(prev => ({ ...prev, bankIban: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                  placeholder="IBAN number"
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
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'}`}
                  placeholder="Wise, Revolut, CashApp, or other payment methods..."
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
