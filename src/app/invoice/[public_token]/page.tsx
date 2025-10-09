'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Download, AlertCircle } from 'lucide-react'
import InvoiceTemplateRenderer from '@/components/InvoiceTemplateRenderer'

interface InvoiceItem {
  id: string
  description: string
  rate: number
  amount: number
}

interface Invoice {
  id: string
  invoiceNumber: string
  issueDate: string
  dueDate: string
  clientName: string
  clientEmail: string
  clientCompany?: string
  clientAddress?: string
  items: InvoiceItem[]
  subtotal: number
  discount: number
  taxAmount: number
  total: number
  lateFees: number
  totalWithLateFees: number
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'due today'
  isOverdue: boolean
  daysOverdue: number
  notes?: string
  theme?: {
    template?: number
    primary_color?: string
    secondary_color?: string
    accent_color?: string
  }
  type?: string
  freelancerSettings?: {
    businessName: string
    logo: string
    address: string
    email: string
    phone: string
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
  }
}

export default function PublicInvoicePage() {
  const params = useParams()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadInvoice = async () => {
      try {
        const response = await fetch(`/api/invoices/public/${params.public_token}`)
        
        if (response.ok) {
          const data = await response.json()
          setInvoice(data.invoice)
        } else {
          setError('Invoice not found')
        }
      } catch (error) {
        console.error('Error loading invoice:', error)
        setError('Error loading invoice')
      } finally {
        setLoading(false)
      }
    }

    loadInvoice()
  }, [params.public_token])


  const handleDownloadPDF = () => {
    // This will be implemented with react-pdf
    alert('PDF download will be implemented')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invoice...</p>
        </div>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invoice Not Found</h1>
          <p className="text-gray-600">The invoice you&apos;re looking for doesn&apos;t exist or has been removed.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Use the template renderer to show the correct template design */}
      <InvoiceTemplateRenderer invoice={invoice} />
      
      {/* Download PDF Button - Fixed at bottom */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-lg"
        >
          <Download className="h-4 w-4" />
          <span>Download PDF</span>
        </button>
      </div>
    </div>
  )
}