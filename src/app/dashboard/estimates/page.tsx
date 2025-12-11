'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Plus, FileText, Clock, CheckCircle, AlertCircle, X,
  Eye, Send, Edit, Trash2, Search, Filter, ClipboardCheck
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useSettings } from '@/contexts/SettingsContext';
import ToastContainer from '@/components/Toast';
import ModernSidebar from '@/components/ModernSidebar';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Estimate } from '@/types';

const EstimateModal = dynamic(() => import('@/components/EstimateModal'), {
  loading: () => <div className="flex items-center justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
});

const ConfirmationModal = dynamic(() => import('@/components/ConfirmationModal'), {
  loading: () => null
});

function EstimatesContent(): React.JSX.Element {
  const { user, loading, getAuthHeaders } = useAuth();
  const { toasts, removeToast, showSuccess, showError } = useToast();
  const { settings } = useSettings();
  
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [isLoadingEstimates, setIsLoadingEstimates] = useState(true);
  const [showCreateEstimate, setShowCreateEstimate] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  // Session check
  useEffect(() => {
    const checkSession = async () => {
      if (!loading) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session && !user) {
          window.location.href = '/auth';
        }
      }
    };
    checkSession();
  }, [user, loading]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch estimates
  const fetchEstimates = useCallback(async () => {
    try {
      setIsLoadingEstimates(true);
      const headers = await getAuthHeaders();
      const response = await fetch('/api/estimates', {
        headers
      });
      
      if (response.ok) {
        const data = await response.json();
        setEstimates(data.estimates || []);
      } else {
        showError('Error', 'Failed to load estimates');
      }
    } catch (error) {
      console.error('Error fetching estimates:', error);
      showError('Error', 'Failed to load estimates');
    } finally {
      setIsLoadingEstimates(false);
    }
  }, [getAuthHeaders, showError]);

  useEffect(() => {
    if (user) {
      fetchEstimates();
    }
  }, [user, fetchEstimates]);

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

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'approved':
        return { backgroundColor: '#dcfce7', color: '#166534', borderColor: '#bbf7d0' };
      case 'rejected':
        return { backgroundColor: '#fef2f2', color: '#dc2626', borderColor: '#fecaca' };
      case 'sent':
        return { backgroundColor: '#dbeafe', color: '#1e40af', borderColor: '#bfdbfe' };
      case 'converted':
        return { backgroundColor: '#f3f4f6', color: '#6b7280', borderColor: '#e5e7eb' };
      case 'expired':
        return { backgroundColor: '#fef3c7', color: '#92400e', borderColor: '#fde68a' };
      default:
        return { backgroundColor: '#f3f4f6', color: '#374151', borderColor: '#e5e7eb' };
    }
  };

  if (loading || isLoadingEstimates) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <ModernSidebar onCreateInvoice={() => {}} />
      
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Estimates</h1>
                <p className="text-sm text-gray-500 mt-1">Manage your estimates and track client approvals</p>
              </div>
              <button
                onClick={() => setShowCreateEstimate(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Create Estimate</span>
              </button>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search estimates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="converted">Converted</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>

          {/* Estimates List */}
          {filteredEstimates.length === 0 ? (
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
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Estimate</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredEstimates.map((estimate) => (
                <div
                  key={estimate.id}
                  className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {estimate.estimateNumber}
                        </h3>
                        <span
                          className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium border"
                          style={getStatusStyle(estimate.status)}
                        >
                          {getStatusIcon(estimate.status)}
                          <span className="capitalize">{estimate.status}</span>
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        {estimate.client?.name || 'Unknown Client'}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                        <span>Issue Date: {new Date(estimate.issueDate || estimate.createdAt).toLocaleDateString()}</span>
                        {estimate.expiryDate && (
                          <span>Expires: {new Date(estimate.expiryDate).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          ${estimate.total.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">Total</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                          title="View Estimate"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {estimate.status === 'approved' && (
                          <button
                            className="p-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Convert to Invoice"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <EstimateModal
        isOpen={showCreateEstimate}
        onClose={() => setShowCreateEstimate(false)}
        onSuccess={() => {
          setShowCreateEstimate(false);
          fetchEstimates();
          showSuccess('Estimate Created', 'Your estimate has been created successfully.');
        }}
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

