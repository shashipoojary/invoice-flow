'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Download, AlertCircle, Receipt, Loader2 } from 'lucide-react'
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
  clientPhone?: string
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
  const [downloadingReceipt, setDownloadingReceipt] = useState(false)

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

  // Log public view when invoice is loaded
  useEffect(() => {
    const logView = async () => {
      try {
        if (!invoice?.id) return
        await fetch('/api/invoices/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ invoiceId: (invoice as any).id, type: 'viewed_by_customer' })
        })
      } catch {}
    }
    logView()
  }, [invoice?.id])


  const handleDownloadReceipt = async () => {
    if (!invoice || invoice.status !== 'paid' || downloadingReceipt) {
      return;
    }

    setDownloadingReceipt(true);

    try {
      // Get the public token from params (already decoded by Next.js)
      const publicToken = params.public_token as string;
      console.log('Download Receipt - Token from params:', publicToken);
      
      // Create URL with properly encoded token
      const url = new URL('/api/invoices/receipt', window.location.origin);
      url.searchParams.set('public_token', publicToken);
      
      console.log('Download Receipt - Request URL:', url.toString());
      
      const response = await fetch(url.toString());
      
      if (response.ok) {
        const blob = await response.blob();
        
        // Check if response is actually a PDF
        if (blob.type !== 'application/pdf') {
          const text = await blob.text();
          const errorData = JSON.parse(text);
          console.error('Receipt API Error:', errorData);
          alert(`Failed to download receipt: ${errorData.error || errorData.details || 'Unknown error'}`);
          return;
        }
        
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `receipt-${invoice.invoiceNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);

        // Log receipt download event
        if (invoice?.id) {
          fetch('/api/invoices/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ invoiceId: (invoice as any).id, type: 'receipt_downloaded_by_customer' })
          }).catch(() => {});
        }
      } else {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        console.error('Receipt API Error Response:', errorData);
        alert(`Failed to download receipt: ${errorData.error || errorData.details || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error downloading receipt:', error);
      alert(`Failed to download receipt: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setDownloadingReceipt(false);
    }
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
      
      {/* Download Receipt Button - Only show when invoice is paid */}
      {invoice.status === 'paid' && (
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={handleDownloadReceipt}
            disabled={downloadingReceipt}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {downloadingReceipt ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Downloading...</span>
              </>
            ) : (
              <>
                <Receipt className="h-4 w-4" />
                <span>Download Receipt</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}