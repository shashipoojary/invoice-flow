'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { AlertCircle, Loader2, CheckCircle, X as XIcon } from 'lucide-react'

interface EstimateItem {
  id: string
  description: string
  rate: number
  qty: number
  amount: number
}

interface Estimate {
  id: string
  estimateNumber: string
  issueDate: string
  expiryDate?: string
  clientName: string
  clientEmail: string
  clientCompany?: string
  clientPhone?: string
  clientAddress?: string
  items: EstimateItem[]
  subtotal: number
  discount: number
  taxAmount: number
  total: number
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'expired' | 'converted'
  approvalStatus: 'pending' | 'approved' | 'rejected'
  rejectionReason?: string
  isExpired: boolean
  notes?: string
  theme?: {
    primary_color?: string
    secondary_color?: string
    accent_color?: string
  }
  paymentTerms?: {
    enabled: boolean
    terms: string
  }
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

export default function PublicEstimatePage() {
  const params = useParams()
  const [estimate, setEstimate] = useState<Estimate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  const handleApprove = async () => {
    if (!estimate || actionLoading) return

    setActionLoading(true)
    setActionMessage(null)

    try {
      const response = await fetch(`/api/estimates/${estimate.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        const result = await response.json()
        setActionMessage({ type: 'success', text: result.message || 'Estimate approved successfully!' })
        // Reload estimate to get updated status
        const reloadResponse = await fetch(`/api/estimates/public/${params.public_token}`)
        if (reloadResponse.ok) {
          const reloadData = await reloadResponse.json()
          setEstimate(reloadData.estimate)
        } else {
          // Fallback: update estimate status locally
          setEstimate(prev => prev ? { ...prev, status: 'approved', approvalStatus: 'approved' } : null)
        }
      } else {
        const error = await response.json()
        setActionMessage({ type: 'error', text: error.error || 'Failed to approve estimate' })
      }
    } catch (error) {
      console.error('Error approving estimate:', error)
      setActionMessage({ type: 'error', text: 'Failed to approve estimate' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleRejectClick = () => {
    setShowRejectModal(true)
  }

  const handleReject = async () => {
    if (!estimate || actionLoading || !rejectionReason.trim()) return

    setActionLoading(true)
    setActionMessage(null)

    try {
      const response = await fetch(`/api/estimates/${estimate.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReason.trim() })
      })

      if (response.ok) {
        const result = await response.json()
        setActionMessage({ type: 'success', text: result.message || 'Estimate rejected successfully.' })
        setShowRejectModal(false)
        setRejectionReason('')
        // Reload estimate to get updated status and rejection reason
        const reloadResponse = await fetch(`/api/estimates/public/${params.public_token}`)
        if (reloadResponse.ok) {
          const reloadData = await reloadResponse.json()
          setEstimate(reloadData.estimate)
        } else {
          // Fallback: update estimate status locally
          setEstimate(prev => prev ? { ...prev, status: 'rejected', approvalStatus: 'rejected', rejectionReason: rejectionReason.trim() } : null)
        }
      } else {
        const error = await response.json()
        setActionMessage({ type: 'error', text: error.error || 'Failed to reject estimate' })
      }
    } catch (error) {
      console.error('Error rejecting estimate:', error)
      setActionMessage({ type: 'error', text: 'Failed to reject estimate' })
    } finally {
      setActionLoading(false)
    }
  }

  useEffect(() => {
    const loadEstimate = async () => {
      try {
        const response = await fetch(`/api/estimates/public/${params.public_token}`)
        
      if (response.ok) {
        const data = await response.json()
        setEstimate(data.estimate)
        
        // Log view event
        if (data.estimate?.id) {
          fetch('/api/estimates/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estimateId: data.estimate.id, type: 'viewed' })
          }).catch(() => {})
        }

        // Check for action parameter from email links
        const urlParams = new URLSearchParams(window.location.search)
        const action = urlParams.get('action')
        if (action === 'approve' && data.estimate?.approvalStatus === 'pending' && data.estimate?.status === 'sent') {
          // Auto-approve when coming from email link
          setTimeout(() => {
            handleApprove()
          }, 500)
        } else if (action === 'reject' && data.estimate?.approvalStatus === 'pending' && data.estimate?.status === 'sent') {
          // Show reject modal when coming from email link
          setTimeout(() => {
            setShowRejectModal(true)
          }, 500)
        }
        } else {
          setError('Estimate not found')
        }
      } catch (error) {
        console.error('Error loading estimate:', error)
        setError('Error loading estimate')
      } finally {
        setLoading(false)
      }
    }

    loadEstimate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.public_token])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading estimate...</p>
        </div>
      </div>
    )
  }

  if (error || !estimate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Estimate Not Found</h1>
          <p className="text-gray-600">The estimate you&apos;re looking for doesn&apos;t exist or has been removed.</p>
        </div>
      </div>
    )
  }

  const canApproveReject = estimate.approvalStatus === 'pending' && estimate.status === 'sent' && !estimate.isExpired && !actionLoading

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:py-12 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white border border-gray-200">
        {/* Header */}
        <div className="px-6 py-8 sm:px-10 sm:py-10 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row items-start justify-between mb-8 gap-6">
            <div className="flex-1 w-full sm:w-auto">
              <div className="text-lg sm:text-xl font-normal text-gray-900 mb-1" style={{ color: '#1F2937', letterSpacing: 0 }}>
                {estimate.freelancerSettings?.businessName || 'Business'}
              </div>
              {estimate.freelancerSettings?.address && (
                <div className="text-sm text-gray-500 mt-1">{estimate.freelancerSettings.address}</div>
              )}
              {estimate.freelancerSettings?.phone && (
                <div className="text-sm text-gray-500 mt-1">{estimate.freelancerSettings.phone}</div>
              )}
              {estimate.freelancerSettings?.email && (
                <div className="text-sm text-gray-500 mt-1">{estimate.freelancerSettings.email}</div>
              )}
            </div>
            <div className="text-left sm:text-right flex-1 w-full sm:w-auto sm:pl-6">
              <div className="text-lg sm:text-xl font-normal text-gray-900 mb-3" style={{ color: '#1F2937', letterSpacing: 0 }}>
                ESTIMATE
              </div>
              <div className="text-sm font-bold text-black mb-2">#{estimate.estimateNumber}</div>
              <div className="text-xs text-gray-500 mb-1">
                Issue: {new Date(estimate.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              {estimate.expiryDate && (
                <div className="text-xs text-gray-500 mb-4">
                  Valid Until: {new Date(estimate.expiryDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              )}
              <div className="text-2xl sm:text-3xl font-bold text-orange-500 mt-4" style={{ color: '#FF6B35', letterSpacing: '-0.5px' }}>
                ${estimate.total.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Action Message */}
          {actionMessage && (
            <div className={`mb-6 p-3 border ${
              actionMessage.type === 'success' ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800'
            }`}>
              <p className="text-sm">{actionMessage.text}</p>
            </div>
          )}

          {/* Action Buttons */}
          {canApproveReject && (
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-green-600 text-white hover:bg-green-700 transition-colors font-normal text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ borderRadius: 0 }}
              >
                {actionLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Approve Estimate
                  </span>
                )}
              </button>
              <button
                onClick={handleRejectClick}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white hover:bg-red-700 transition-colors font-normal text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ borderRadius: 0 }}
              >
                <span className="flex items-center justify-center gap-2">
                  <XIcon className="h-4 w-4" />
                  Reject Estimate
                </span>
              </button>
            </div>
          )}

          {/* Rejection Modal */}
          {showRejectModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white border border-gray-200 max-w-md w-full p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Estimate</h3>
                <p className="text-sm text-gray-600 mb-4">Please provide a reason for rejecting this estimate.</p>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter rejection reason..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none text-sm"
                  style={{ borderRadius: 0 }}
                />
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowRejectModal(false)
                      setRejectionReason('')
                    }}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-normal text-sm cursor-pointer disabled:opacity-50"
                    style={{ borderRadius: 0 }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={actionLoading || !rejectionReason.trim()}
                    className="flex-1 px-4 py-2 bg-red-600 text-white hover:bg-red-700 transition-colors font-normal text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ borderRadius: 0 }}
                  >
                    {actionLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      'Reject Estimate'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {estimate.isExpired && (
            <div className="mt-6 p-3 border border-yellow-200 bg-yellow-50">
              <p className="text-sm text-yellow-800">This estimate has expired.</p>
            </div>
          )}

          {estimate.status === 'approved' && (
            <div className="mt-6 p-3 border border-green-200 bg-green-50">
              <p className="text-sm text-green-800">This estimate has been approved.</p>
            </div>
          )}

          {estimate.status === 'rejected' && (
            <div className="mt-6 p-3 border border-red-200 bg-red-50">
              <p className="text-sm font-medium text-red-800 mb-2">This estimate has been rejected.</p>
              {estimate.rejectionReason && (
                <p className="text-sm text-red-700 mt-2">
                  <strong>Reason:</strong> {estimate.rejectionReason}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-6 py-8 sm:px-10 sm:py-10">
          {/* Bill To */}
          <div className="mb-8 pb-6 border-b border-gray-200">
            <div className="text-sm font-normal text-gray-900 mb-4" style={{ color: '#1F2937' }}>
              Bill To
            </div>
            <div className="text-sm text-black">{estimate.clientName}</div>
            {estimate.clientCompany && (
              <div className="text-sm text-gray-600 mt-1">{estimate.clientCompany}</div>
            )}
            {estimate.clientEmail && (
              <div className="text-sm text-gray-600 mt-1">{estimate.clientEmail}</div>
            )}
            {estimate.clientPhone && (
              <div className="text-sm text-gray-600 mt-1">{estimate.clientPhone}</div>
            )}
            {estimate.clientAddress && (
              <div className="text-sm text-gray-600 mt-1">{estimate.clientAddress}</div>
            )}
          </div>

          {/* Items */}
          {estimate.items.length > 0 && (
            <div className="mb-8 pb-6 border-b border-gray-200">
              <div className="text-sm font-normal text-gray-900 mb-4" style={{ color: '#1F2937' }}>
                Items
              </div>
              <div className="space-y-3">
                {estimate.items.map((item, index) => (
                  <div key={item.id || index} className="flex justify-between text-sm">
                    <div className="text-black flex-1">{item.description}</div>
                    <div className="text-black text-right ml-4" style={{ minWidth: '100px' }}>
                      ${item.amount.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="mb-8 pb-6 border-b border-gray-200">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-900" style={{ color: '#1F2937' }}>Subtotal</span>
              <span className="text-black">${estimate.subtotal.toFixed(2)}</span>
            </div>
            {estimate.discount > 0 && (
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-900" style={{ color: '#1F2937' }}>Discount</span>
                <span className="text-black">-${estimate.discount.toFixed(2)}</span>
              </div>
            )}
            {estimate.taxAmount > 0 && (
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-900" style={{ color: '#1F2937' }}>Tax</span>
                <span className="text-black">${estimate.taxAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm pt-2 mt-2 border-t border-gray-200">
              <span className="font-bold text-black">Total</span>
              <span className="font-bold text-black">${estimate.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Notes */}
          {estimate.notes && (
            <div className="mb-8 pb-6 border-b border-gray-200">
              <div className="text-sm text-black whitespace-pre-wrap">{estimate.notes}</div>
            </div>
          )}

          {/* Footer */}
          <div className="text-sm text-gray-600">
            <p className="mb-2">Thank you for your business!</p>
            <p>If you have any questions about this estimate, please don&apos;t hesitate to contact us.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

