'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Plus, FileText, Clock, CheckCircle, AlertCircle, X,
  Eye, Send, Edit, Trash2, Search, Filter, ClipboardCheck, Loader2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useSettings } from '@/contexts/SettingsContext';
import { useData } from '@/contexts/DataContext';
import { useRouter } from 'next/navigation';
import ToastContainer from '@/components/Toast';
import ModernSidebar from '@/components/ModernSidebar';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import { Estimate } from '@/types';

const EstimateModal = dynamic(() => import('@/components/EstimateModal'), {
  loading: () => <div className="flex items-center justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
});

const SendEstimateModal = dynamic(() => import('@/components/SendEstimateModal'), {
  loading: () => null
});

function EstimatesContent(): React.JSX.Element {
  const { user, loading, getAuthHeaders } = useAuth();
  const { toasts, removeToast, showSuccess, showError } = useToast();
  const { settings } = useSettings();
  const { refreshInvoices } = useData();
  const router = useRouter();
  
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [isLoadingEstimates, setIsLoadingEstimates] = useState(true);
  const [showCreateEstimate, setShowCreateEstimate] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterAppliedManually, setFilterAppliedManually] = useState(false);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [loadingActions, setLoadingActions] = useState<{[key: string]: boolean}>({});
  const [selectedEstimate, setSelectedEstimate] = useState<Estimate | null>(null);
  const [showEstimateModal, setShowEstimateModal] = useState(false);
  const [sendEstimateModal, setSendEstimateModal] = useState<{
    isOpen: boolean;
    estimate: Estimate | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    estimate: null,
    isLoading: false
  });
  
  // Handle session expiration - wait for potential refresh from visibility handlers
  useEffect(() => {
    const handleSessionCheck = async () => {
      if (!user && !loading) {
        // Wait a moment for visibility/focus handlers to refresh session
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Check one more time before redirecting
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          window.location.href = '/auth?message=session_expired';
        }
      }
    };

    if (!user && !loading) {
      handleSessionCheck();
    }
  }, [user, loading]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load estimates only once when user is available - prevent infinite loop
  useEffect(() => {
    if (!user || loading || hasLoadedData) return;

    let isMounted = true;

    const fetchEstimates = async () => {
      try {
        setIsLoadingEstimates(true);
        const headers = await getAuthHeaders();
        const response = await fetch('/api/estimates', {
          headers
        });
        
        if (!isMounted) return;
        
        if (response.ok) {
          const data = await response.json();
          setEstimates(data.estimates || []);
          setHasLoadedData(true);
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('Failed to load estimates:', errorData);
          showError('Error', errorData.error || 'Failed to load estimates');
          // Still mark as loaded even on error to prevent infinite retry
          setHasLoadedData(true);
        }
      } catch (error) {
        if (!isMounted) return;
        console.error('Error fetching estimates:', error);
        showError('Error', 'Failed to load estimates');
        // Still mark as loaded even on error to prevent infinite retry
        setHasLoadedData(true);
      } finally {
        if (isMounted) {
          setIsLoadingEstimates(false);
        }
      }
    };

    fetchEstimates();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, loading]);

  // Filter estimates
  const filteredEstimates = useMemo(() => {
    let filtered = estimates;

    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase().trim();
      filtered = filtered.filter(estimate => {
        const clientName = estimate.client?.name?.toLowerCase() || '';
        const estimateNumber = estimate.estimateNumber?.toLowerCase() || '';
        const amount = estimate.total?.toString() || '';
        
        return clientName.includes(query) || 
               estimateNumber.includes(query) || 
               amount.includes(query);
      });
    }

    if (statusFilter) {
      filtered = filtered.filter(estimate => estimate.status === statusFilter);
    }

    return filtered;
  }, [estimates, debouncedSearchQuery, statusFilter]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-3 w-3" />;
      case 'rejected':
        return <X className="h-3 w-3" />;
      case 'sent':
        return <Send className="h-3 w-3" />;
      case 'converted':
        return <FileText className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-emerald-600';
      case 'rejected':
        return 'text-red-600';
      case 'sent':
        return 'text-orange-500';
      case 'converted':
        return 'text-gray-600';
      case 'expired':
        return 'text-yellow-600';
      case 'draft':
      default:
        return 'text-gray-600';
    }
  };

  // Handle view estimate - open side panel
  const handleViewEstimate = useCallback((estimate: Estimate) => {
    setSelectedEstimate(estimate);
    setShowEstimateModal(true);
  }, []);

  const closeEstimateModal = useCallback(() => {
    setShowEstimateModal(false);
    setSelectedEstimate(null);
  }, []);

  // Handle send estimate
  const handleSendEstimate = useCallback((estimate: Estimate) => {
    if (estimate.status === 'draft') {
      setSendEstimateModal({
        isOpen: true,
        estimate,
        isLoading: false
      });
    } else {
      performSendEstimate(estimate);
    }
  }, []);

  const performSendEstimate = useCallback(async (estimate: Estimate) => {
    const actionKey = `send-${estimate.id}`;
    setLoadingActions(prev => ({ ...prev, [actionKey]: true }));
    setSendEstimateModal(prev => ({ ...prev, isLoading: true }));

    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/estimates/send', {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ estimateId: estimate.id })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.emailSent !== false) {
          showSuccess('Estimate Sent', 'Your estimate has been sent successfully.');
        } else if (data.success && data.emailSent === false) {
          showError('Email Failed', data.error || 'Estimate status updated but email failed to send. Please check your email configuration.');
        } else {
          showError('Send Failed', data.error || 'Failed to send estimate. Please try again.');
        }
        setSendEstimateModal({ isOpen: false, estimate: null, isLoading: false });
        // Refresh estimates
        setHasLoadedData(false);
        const refreshResponse = await fetch('/api/estimates', { headers });
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          setEstimates(refreshData.estimates || []);
          setHasLoadedData(true);
        } else {
          setHasLoadedData(true);
        }
        // Refresh entire page including sidebar
        router.refresh();
      } else {
        const contentType = response.headers.get('content-type');
        let error = null;
        if (contentType && contentType.includes('application/json')) {
          try {
            const text = await response.text();
            error = text ? JSON.parse(text) : null;
          } catch (e) {
            console.error('Error parsing error response:', e);
          }
        }
        showError('Send Failed', error?.error || `Failed to send estimate (${response.status}). Please try again.`);
        setSendEstimateModal(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Error sending estimate:', error);
      showError('Send Failed', 'Failed to send estimate. Please try again.');
      setSendEstimateModal(prev => ({ ...prev, isLoading: false }));
    } finally {
      setLoadingActions(prev => {
        const newState = { ...prev };
        delete newState[actionKey];
        return newState;
      });
    }
  }, [getAuthHeaders, showSuccess, showError, router]);

  // Handle convert to invoice
  const handleConvertToInvoice = useCallback(async (estimate: Estimate) => {
    if (estimate.status !== 'approved') {
      showError('Error', 'Only approved estimates can be converted to invoices');
      return;
    }

    const actionKey = `convert-${estimate.id}`;
    setLoadingActions(prev => ({ ...prev, [actionKey]: true }));
    
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/estimates/${estimate.id}/convert`, {
        method: 'POST',
        headers
      });
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        let data = null;
        if (contentType && contentType.includes('application/json')) {
          try {
            const text = await response.text();
            data = text ? JSON.parse(text) : null;
          } catch (e) {
            console.error('Error parsing convert response:', e);
          }
        }
        showSuccess('Estimate Converted', `The estimate has been converted to invoice ${data?.invoice?.invoiceNumber || ''} successfully.`);
        // Refresh estimates
        setHasLoadedData(false); // Reset to allow refresh
        const refreshResponse = await fetch('/api/estimates', { headers });
        if (refreshResponse.ok) {
          try {
            const refreshText = await refreshResponse.text();
            const refreshData = refreshText ? JSON.parse(refreshText) : null;
            setEstimates(refreshData?.estimates || []);
            setHasLoadedData(true);
          } catch (e) {
            console.error('Error parsing refresh response:', e);
            setHasLoadedData(true);
          }
        } else {
          setHasLoadedData(true);
        }
        // Refresh invoices list so the new invoice appears immediately
        try {
          await refreshInvoices();
        } catch (e) {
          console.error('Error refreshing invoices:', e);
        }
        // Refresh entire page including sidebar (after a short delay to ensure data is saved)
        setTimeout(() => {
          router.refresh();
        }, 500);
      } else {
        const error = await response.json();
        showError('Error', error.error || 'Failed to convert estimate');
      }
    } catch (error) {
      console.error('Error converting estimate:', error);
      showError('Error', 'Failed to convert estimate');
    } finally {
      setLoadingActions(prev => {
        const newState = { ...prev };
        delete newState[actionKey];
        return newState;
      });
    }
  }, [getAuthHeaders, showSuccess, showError, router]);

  // Only show loading spinner if user is not authenticated yet
  if (loading && !user) {
    return (
      <div className="min-h-screen transition-colors duration-200 bg-white">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (!user && !loading) {
    // Show loading while checking session (layout will handle redirect)
    return (
      <div className="min-h-screen transition-colors duration-200 bg-white">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  // Don't show full-screen loading - show skeleton loading instead

  return (
    <div className="min-h-screen transition-colors duration-200 bg-white">
      <div className="flex h-screen">
        <ModernSidebar onCreateInvoice={() => {}} />
        
        <main className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar">
          <div className="pt-16 lg:pt-4 p-4 sm:p-6 lg:p-8">
            {/* Estimates Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <h2 className="font-heading text-xl sm:text-2xl font-semibold" style={{color: '#1f2937'}}>
                    Estimates
                  </h2>
                </div>
                {user ? (
                  <button
                    onClick={() => setShowCreateEstimate(true)}
                    className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create Estimate</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setShowCreateEstimate(true)}
                    className="flex items-center space-x-1 sm:space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium cursor-pointer"
                  >
                    <span>Sign In</span>
                  </button>
                )}
              </div>

              {/* Search and Filter Section */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Search Bar */}
                  <div className="flex-1">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        placeholder="Search by client name, estimate number, or amount..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 text-sm transition-colors"
                      />
                    </div>
                  </div>

                  {/* Filter Button */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium cursor-pointer"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                      Filter
                    </button>

                    {/* Clear Filters */}
                    {(searchQuery || (statusFilter && filterAppliedManually)) && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setStatusFilter('');
                          setFilterAppliedManually(false);
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm font-medium cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter Options */}
                {showFilters && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          setStatusFilter('');
                          setFilterAppliedManually(true);
                        }}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center justify-center cursor-pointer ${
                          !statusFilter 
                            ? 'bg-gray-900 text-white' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => {
                          setStatusFilter('draft');
                          setFilterAppliedManually(true);
                        }}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center justify-center cursor-pointer ${
                          statusFilter === 'draft' 
                            ? 'bg-gray-100 text-gray-800 border border-gray-200' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Draft
                      </button>
                      <button
                        onClick={() => {
                          setStatusFilter('sent');
                          setFilterAppliedManually(true);
                        }}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center justify-center cursor-pointer ${
                          statusFilter === 'sent' 
                            ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Sent
                      </button>
                      <button
                        onClick={() => {
                          setStatusFilter('approved');
                          setFilterAppliedManually(true);
                        }}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center justify-center cursor-pointer ${
                          statusFilter === 'approved' 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Approved
                      </button>
                      <button
                        onClick={() => {
                          setStatusFilter('rejected');
                          setFilterAppliedManually(true);
                        }}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center justify-center cursor-pointer ${
                          statusFilter === 'rejected' 
                            ? 'bg-red-100 text-red-800 border border-red-200' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Rejected
                      </button>
                      <button
                        onClick={() => {
                          setStatusFilter('converted');
                          setFilterAppliedManually(true);
                        }}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center justify-center cursor-pointer ${
                          statusFilter === 'converted' 
                            ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Converted
                      </button>
                      <button
                        onClick={() => {
                          setStatusFilter('expired');
                          setFilterAppliedManually(true);
                        }}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center justify-center cursor-pointer ${
                          statusFilter === 'expired' 
                            ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Expired
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Estimates List */}
              {isLoadingEstimates ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6">
                      <div className="animate-pulse">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-300 rounded-lg"></div>
                            <div>
                              <div className="h-4 bg-gray-300 rounded w-32 mb-2"></div>
                              <div className="h-3 bg-gray-300 rounded w-24"></div>
                            </div>
                          </div>
                          <div className="h-6 bg-gray-300 rounded w-16"></div>
                        </div>
                        <div className="h-3 bg-gray-300 rounded w-full mb-2"></div>
                        <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                        <div className="flex items-center justify-between mt-4">
                          <div className="h-6 bg-gray-300 rounded w-20"></div>
                          <div className="flex space-x-2">
                            <div className="h-8 w-8 bg-gray-300 rounded"></div>
                            <div className="h-8 w-8 bg-gray-300 rounded"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredEstimates.length === 0 ? (
                <div className="text-center py-12">
                  <ClipboardCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No estimates found</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {estimates.length === 0 
                      ? "Get started by creating your first estimate"
                      : "Try adjusting your search or filter criteria"
                    }
                  </p>
                  {estimates.length === 0 && (
                    <button
                      onClick={() => setShowCreateEstimate(true)}
                      className="inline-flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Create Estimate</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredEstimates.map((estimate) => (
                    <div
                      key={estimate.id}
                      className="rounded-lg border transition-all duration-200 hover:shadow-sm bg-white border-gray-200 hover:bg-gray-50/50"
                    >
                      {/* Mobile */}
                      <div className="block sm:hidden p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100">
                                <ClipboardCheck className="h-4 w-4 text-gray-700" />
                              </div>
                              <div>
                                <div className="font-medium text-sm" style={{ color: '#1f2937' }}>{estimate.estimateNumber}</div>
                                <div className="text-xs" style={{ color: '#6b7280' }}>{estimate.client?.name || 'Unknown Client'}</div>
                              </div>
                            </div>
                            <div className="text-right min-h-[56px] flex flex-col items-end">
                              <div className="font-semibold text-base text-gray-900">
                                ${estimate.total.toLocaleString()}
                              </div>
                              <div className="mt-0.5 mb-1 min-h-[14px] sm:min-h-[16px]"></div>
                              <div className="text-xs" style={{ color: '#6b7280' }}>{new Date(estimate.issueDate || estimate.createdAt).toLocaleDateString()}</div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium ${getStatusColor(estimate.status)}`}
                              >
                                {getStatusIcon(estimate.status)}
                                <span className="capitalize">{estimate.status}</span>
                              </span>
                            </div>

                            <div className="flex items-center space-x-2">
                              <button 
                                onClick={() => handleViewEstimate(estimate)} 
                                className="p-1.5 rounded-md transition-colors hover:bg-gray-100 cursor-pointer" 
                                title="View"
                              >
                                <Eye className="h-4 w-4 text-gray-700" />
                              </button>
                              {estimate.status === 'draft' && (
                                <button 
                                  onClick={() => handleSendEstimate(estimate)}
                                  disabled={loadingActions[`send-${estimate.id}`]}
                                  className={`p-1.5 rounded-md transition-colors hover:bg-gray-100 cursor-pointer ${
                                    loadingActions[`send-${estimate.id}`] ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                                  title="Send"
                                >
                                  {loadingActions[`send-${estimate.id}`] ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                  ) : (
                                    <Send className="h-4 w-4 text-gray-700" />
                                  )}
                                </button>
                              )}
                              {estimate.status === 'approved' && (
                                <button 
                                  onClick={() => handleConvertToInvoice(estimate)}
                                  disabled={loadingActions[`convert-${estimate.id}`]}
                                  className={`p-1.5 rounded-md transition-colors hover:bg-gray-100 cursor-pointer ${
                                    loadingActions[`convert-${estimate.id}`] ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                                  title="Convert to Invoice"
                                >
                                  {loadingActions[`convert-${estimate.id}`] ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                  ) : (
                                    <FileText className="h-4 w-4 text-gray-700" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Desktop */}
                      <div className="hidden sm:block p-4 sm:p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 flex-1">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100">
                              <ClipboardCheck className="h-5 w-5 text-gray-700" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-3 mb-1">
                                <div className="font-medium text-sm" style={{ color: '#1f2937' }}>{estimate.estimateNumber}</div>
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium ${getStatusColor(estimate.status)}`}
                                >
                                  {getStatusIcon(estimate.status)}
                                  <span className="capitalize">{estimate.status}</span>
                                </span>
                              </div>
                              <div className="text-xs" style={{ color: '#6b7280' }}>{estimate.client?.name || 'Unknown Client'}</div>
                              <div className="text-xs mt-1" style={{ color: '#6b7280' }}>
                                Issue: {new Date(estimate.issueDate || estimate.createdAt).toLocaleDateString()}
                                {estimate.expiryDate && ` • Expires: ${new Date(estimate.expiryDate).toLocaleDateString()}`}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-6">
                            <div className="text-right min-w-[100px]">
                              <div className="font-semibold text-base text-gray-900">
                                ${estimate.total.toLocaleString()}
                              </div>
                              <div className="text-xs mt-0.5" style={{ color: '#6b7280' }}>Total</div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button 
                                onClick={() => handleViewEstimate(estimate)} 
                                className="p-1.5 rounded-md transition-colors hover:bg-gray-100 cursor-pointer" 
                                title="View"
                              >
                                <Eye className="h-4 w-4 text-gray-700" />
                              </button>
                              {estimate.status === 'draft' && (
                                <button 
                                  onClick={() => handleSendEstimate(estimate)}
                                  disabled={loadingActions[`send-${estimate.id}`]}
                                  className={`p-1.5 rounded-md transition-colors hover:bg-gray-100 cursor-pointer ${
                                    loadingActions[`send-${estimate.id}`] ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                                  title="Send"
                                >
                                  {loadingActions[`send-${estimate.id}`] ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                  ) : (
                                    <Send className="h-4 w-4 text-gray-700" />
                                  )}
                                </button>
                              )}
                              {estimate.status === 'approved' && (
                                <button 
                                  onClick={() => handleConvertToInvoice(estimate)}
                                  disabled={loadingActions[`convert-${estimate.id}`]}
                                  className={`p-1.5 rounded-md transition-colors hover:bg-gray-100 cursor-pointer ${
                                    loadingActions[`convert-${estimate.id}`] ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                                  title="Convert to Invoice"
                                >
                                  {loadingActions[`convert-${estimate.id}`] ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                  ) : (
                                    <FileText className="h-4 w-4 text-gray-700" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      <EstimateModal
        isOpen={showCreateEstimate}
        onClose={() => setShowCreateEstimate(false)}
        onSuccess={async () => {
          setShowCreateEstimate(false);
          showSuccess('Estimate Created', 'Your estimate has been created successfully.');
          // Refresh estimates
          try {
            setIsLoadingEstimates(true);
            setHasLoadedData(false); // Reset to allow refresh
            const headers = await getAuthHeaders();
            const response = await fetch('/api/estimates', {
              headers
            });
            if (response.ok) {
              try {
                const text = await response.text();
                const data = text ? JSON.parse(text) : null;
                setEstimates(data?.estimates || []);
                setHasLoadedData(true);
              } catch (e) {
                console.error('Error parsing refresh response:', e);
                setHasLoadedData(true);
              }
            } else {
              setHasLoadedData(true);
            }
          } catch (error) {
            console.error('Error refreshing estimates:', error);
            setHasLoadedData(true); // Mark as loaded even on error
          } finally {
            setIsLoadingEstimates(false);
          }
          // Refresh entire page including sidebar
          router.refresh();
        }}
      />

      {/* Sliding Modal for Estimate Details */}
      {showEstimateModal && selectedEstimate && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 backdrop-blur-sm bg-white/20 transition-all duration-300"
            onClick={closeEstimateModal}
          />
          
          {/* Sliding Panel - 75% width on mobile, fixed width on desktop */}
          <div className="absolute right-0 top-0 h-full w-3/4 sm:w-full sm:max-w-md bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Estimate Details</h3>
                <button
                  onClick={closeEstimateModal}
                  className="p-2 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <div className="space-y-6">
                  {/* Estimate Number & Status */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-500">Estimate Number</h4>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium ${getStatusColor(selectedEstimate.status)}`}
                      >
                        {getStatusIcon(selectedEstimate.status)}
                        <span className="capitalize">{selectedEstimate.status}</span>
                      </span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">{selectedEstimate.estimateNumber}</p>
                  </div>

                  {/* Client Info */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Client</h4>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="font-medium text-gray-900">{selectedEstimate.client?.name || selectedEstimate.clientName || 'Unknown Client'}</p>
                      {selectedEstimate.client?.email && (
                        <p className="text-sm text-gray-600 mt-1">{selectedEstimate.client.email}</p>
                      )}
                      {selectedEstimate.client?.company && (
                        <p className="text-sm text-gray-600">{selectedEstimate.client.company}</p>
                      )}
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Issue Date</h4>
                      <p className="text-sm text-gray-900">
                        {new Date(selectedEstimate.issueDate || selectedEstimate.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {selectedEstimate.expiryDate && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Expires</h4>
                        <p className="text-sm text-gray-900">
                          {new Date(selectedEstimate.expiryDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Rejection Reason */}
                  {selectedEstimate.status === 'rejected' && selectedEstimate.rejectionReason && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200">
                      <h4 className="text-sm font-medium text-red-800 mb-1">Rejection Reason</h4>
                      <p className="text-sm text-red-700">{selectedEstimate.rejectionReason}</p>
                    </div>
                  )}

                  {/* Items */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-3">Items</h4>
                    <div className="space-y-2">
                      {selectedEstimate.items?.map((item, index) => {
                        const qty = (item as any).qty || 1;
                        const rate = item.rate || 0;
                        const amount = (item as any).amount || (rate * qty);
                        return (
                          <div key={item.id || index} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{item.description}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Qty: {qty} × ${rate.toFixed(2)}
                              </p>
                            </div>
                            <p className="text-sm font-semibold text-gray-900 ml-4">
                              ${typeof amount === 'number' ? amount.toFixed(2) : parseFloat(amount.toString()).toFixed(2)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="border-t border-gray-200 pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium text-gray-900">${selectedEstimate.subtotal.toFixed(2)}</span>
                    </div>
                    {selectedEstimate.discount && selectedEstimate.discount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Discount:</span>
                        <span className="font-medium text-gray-900">-${selectedEstimate.discount.toFixed(2)}</span>
                      </div>
                    )}
                    {selectedEstimate.taxAmount && selectedEstimate.taxAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tax:</span>
                        <span className="font-medium text-gray-900">${selectedEstimate.taxAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="text-base font-semibold text-gray-900">Total:</span>
                      <span className="text-lg font-bold text-indigo-600">${selectedEstimate.total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedEstimate.notes && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Notes</h4>
                      <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{selectedEstimate.notes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={closeEstimateModal}
                      className="w-full sm:flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-indigo-400 cursor-pointer transition-colors"
                    >
                      Close
                    </button>
                    {(selectedEstimate as any).public_token && (
                      <button
                        onClick={() => {
                          const token = (selectedEstimate as any).public_token;
                          window.open(`/estimate/${encodeURIComponent(token)}`, '_blank');
                        }}
                        className="w-full sm:flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-indigo-400 cursor-pointer transition-colors"
                      >
                        View Public Page
                      </button>
                    )}
                    {selectedEstimate.status === 'approved' && (
                      <button
                        onClick={() => {
                          closeEstimateModal();
                          handleConvertToInvoice(selectedEstimate);
                        }}
                        disabled={loadingActions[`convert-${selectedEstimate.id}`]}
                        className="w-full sm:flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-green-400 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      >
                        {loadingActions[`convert-${selectedEstimate.id}`] ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Converting...</span>
                          </>
                        ) : (
                          <>
                            <FileText className="h-4 w-4" />
                            <span>Convert to Invoice</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Estimate Modal */}
      <SendEstimateModal
        isOpen={sendEstimateModal.isOpen}
        onClose={() => setSendEstimateModal({ isOpen: false, estimate: null, isLoading: false })}
        onEdit={() => {
          if (sendEstimateModal.estimate) {
            // For now, just close and show message - edit functionality can be added later
            showError('Edit', 'Edit functionality coming soon. Please create a new estimate.');
            setSendEstimateModal({ isOpen: false, estimate: null, isLoading: false });
          }
        }}
        onSend={() => {
          if (sendEstimateModal.estimate) {
            performSendEstimate(sendEstimateModal.estimate);
          }
        }}
        estimateNumber={sendEstimateModal.estimate?.estimateNumber || ''}
        isLoading={sendEstimateModal.isLoading}
      />

      <ToastContainer
        toasts={toasts}
        onRemove={removeToast}
      />
    </div>
  );
}

export default function EstimatesPage() {
  return <EstimatesContent />;
}

