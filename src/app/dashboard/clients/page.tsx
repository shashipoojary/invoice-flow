'use client';

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { 
  Plus, Users, UserPlus, Edit, Trash2, Mail, Phone, Building2, MapPin, Calendar,
  Eye, X, Loader2, Sparkles, FilePlus
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useData } from '@/contexts/DataContext';
import ToastContainer from '@/components/Toast';
import ModernSidebar from '@/components/ModernSidebar';
import { Client } from '@/types';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';

// Lazy load heavy components
const ClientModal = dynamic(() => import('@/components/ClientModal'), {
  loading: () => <div className="flex items-center justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
});

const ConfirmationModal = dynamic(() => import('@/components/ConfirmationModal'), {
  loading: () => null
});

const QuickInvoiceModal = dynamic(() => import('@/components/QuickInvoiceModal'), {
  loading: () => <div className="flex items-center justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
});

const FastInvoiceModal = dynamic(() => import('@/components/FastInvoiceModal'), {
  loading: () => <div className="flex items-center justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
});

// Memoized client card component for better performance
const ClientCard = memo(({ client, onView, onEdit, onDelete, isDeleting }: {
  client: Client;
  onView: (client: Client) => void;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  isDeleting: string | null;
}) => {
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  return (
    <div className="bg-white border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
            <Users className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
            <p className="text-sm text-gray-500">{client.email}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onView(client)}
            className="p-2 text-gray-400 hover:text-indigo-600 transition-colors cursor-pointer"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(client)}
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors cursor-pointer"
            title="Edit Client"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(client)}
            disabled={isDeleting === client.id}
            className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            title="Delete Client"
          >
            {isDeleting === client.id ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
      
      <div className="space-y-2">
        {client.company && (
          <div className="flex items-center text-sm text-gray-600">
            <Building2 className="w-4 h-4 mr-2" />
            <span>{client.company}</span>
          </div>
        )}
        {client.phone && (
          <div className="flex items-center text-sm text-gray-600">
            <Phone className="w-4 h-4 mr-2" />
            <span>{client.phone}</span>
          </div>
        )}
        {client.address && (
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="w-4 h-4 mr-2" />
            <span className="truncate">{client.address}</span>
          </div>
        )}
        <div className="flex items-center text-sm text-gray-500">
          <Calendar className="w-4 h-4 mr-2" />
          <span>Added {formatDate((client as any).createdAt || (client as any).created_at)}</span>
        </div>
      </div>
    </div>
  );
});

ClientCard.displayName = 'ClientCard';

export default function ClientsPage() {
  const { user, loading, getAuthHeaders } = useAuth();
  const { toasts, removeToast, showSuccess, showError } = useToast();
  const { clients, isLoadingClients, updateClient, deleteClient, invoices } = useData();
  
  // Local state for UI
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [showEditClient, setShowEditClient] = useState(false);
  const [showViewClient, setShowViewClient] = useState(false);
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [showFastInvoice, setShowFastInvoice] = useState(false);
  const [showInvoiceTypeSelection, setShowInvoiceTypeSelection] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'danger' as 'danger' | 'warning' | 'info',
    onConfirm: () => {},
    isLoading: false
  });



  // Create invoice handler
  const handleCreateInvoice = useCallback(() => {
    // Show the invoice type selection modal
    setShowInvoiceTypeSelection(true);
  }, []);

  // Handle invoice type selection
  const handleSelectFastInvoice = useCallback(() => {
    setShowInvoiceTypeSelection(false);
    setShowFastInvoice(true);
  }, []);

  const handleSelectDetailedInvoice = useCallback(() => {
    setShowInvoiceTypeSelection(false);
    setShowCreateInvoice(true);
  }, []);


  // Client handler functions
  const handleViewClient = useCallback((client: Client) => {
    setSelectedClient(client);
    setShowViewClient(true);
  }, []);

  const handleEditClient = useCallback((client: Client) => {
    setSelectedClient(client);
    setShowEditClient(true);
  }, []);

  const handleDeleteClient = useCallback((client: Client) => {
    setConfirmationModal({
      isOpen: true,
      title: 'Delete Client',
      message: `Are you sure you want to delete "${client.name}"? This action cannot be undone and will also remove all associated invoices.`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmationModal(prev => ({ ...prev, isOpen: false, isLoading: true }));
        setIsDeleting(client.id);
        
        try {
          const headers = await getAuthHeaders();
          const response = await fetch(`/api/clients/${client.id}`, {
            method: 'DELETE',
            headers,
          });

          if (response.ok) {
            showSuccess('Client deleted successfully');
            // Refresh clients data
            // Data is now managed globally, no need to refresh manually
          } else {
            showError('Failed to delete client');
          }
        } catch (error) {
          console.error('Error deleting client:', error);
          showError('Failed to delete client');
        } finally {
          setIsDeleting(null);
          setConfirmationModal(prev => ({ ...prev, isLoading: false }));
        }
      },
      isLoading: false
    });
  }, [getAuthHeaders, showSuccess, showError]);

  // Memoized Client Card Component
  const ClientCard = useCallback(({ client, handleViewClient, handleEditClient, handleDeleteClient, isDeleting }: {
    client: Client;
    handleViewClient: (client: Client) => void;
    handleEditClient: (client: Client) => void;
    handleDeleteClient: (client: Client) => void;
    isDeleting: string | null;
  }) => (
    <div className={`p-4 transition-all duration-300 hover:scale-[1.02] bg-white/70 border border-gray-200 backdrop-blur-sm ${isDeleting === client.id ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-xl bg-indigo-50">
          <Building2 className="h-6 w-6 text-indigo-600" />
        </div>
        <div className="flex space-x-2">
          <button 
            data-testid={`client-${client.id}-view`}
            onClick={() => handleViewClient(client)}
            disabled={isDeleting === client.id}
            className={`p-3 sm:p-2 text-gray-400 hover:text-gray-600 transition-colors min-h-[44px] sm:min-h-auto touch-manipulation ${
              isDeleting === client.id
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-gray-50 cursor-pointer'
            }`}
            aria-label={`View ${client.name}`}
          >
            <Eye className="h-5 w-5 sm:h-4 sm:w-4" />
          </button>
          <button 
            data-testid={`client-${client.id}-edit`}
            onClick={() => handleEditClient(client)}
            disabled={isDeleting === client.id}
            className={`p-3 sm:p-2 text-gray-400 hover:text-gray-600 transition-colors min-h-[44px] sm:min-h-auto touch-manipulation ${
              isDeleting === client.id
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-gray-50 cursor-pointer'
            }`}
            aria-label={`Edit ${client.name}`}
          >
            <Edit className="h-5 w-5 sm:h-4 sm:w-4" />
          </button>
          <button 
            data-testid={`client-${client.id}-delete`}
            onClick={() => handleDeleteClient(client)}
            disabled={isDeleting === client.id}
            className={`p-3 sm:p-2 text-gray-400 hover:text-red-600 transition-colors min-h-[44px] sm:min-h-auto touch-manipulation ${
              isDeleting === client.id 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-red-50 cursor-pointer'
            }`}
            aria-label={`Delete ${client.name}`}
          >
            {isDeleting === client.id ? (
              <Loader2 className="h-5 w-5 sm:h-4 sm:w-4 animate-spin" />
            ) : (
              <Trash2 className="h-5 w-5 sm:h-4 sm:w-4" />
            )}
          </button>
        </div>
      </div>
      
      <h3 className="font-heading text-lg font-semibold mb-2" style={{color: '#1f2937'}}>
        {client.name}
      </h3>
      {client.company && (
        <p className="text-sm mb-1" style={{color: '#374151'}}>
          {client.company}
        </p>
      )}
      <p className="text-sm mb-4" style={{color: '#374151'}}>
        {client.email}
      </p>
      
      <div className="flex items-center justify-between">
        <div className="text-sm" style={{color: '#374151'}}>
          Added {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : 'Recently'}
        </div>
        <div className="text-sm" style={{color: '#374151'}}>
          Client
        </div>
      </div>
    </div>
  ), []);


  // Data loading is now handled by DataContext
  useEffect(() => {
    if (user && !loading) {
      setHasLoadedData(true);
    }
  }, [user, loading]);

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

  return (
    <div className="min-h-screen transition-colors duration-200 bg-white">
      <div className="flex h-screen">
        <ModernSidebar 
          onCreateInvoice={handleCreateInvoice}
        />
        
        <main className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar">
          <div className="pt-16 lg:pt-4 p-4 sm:p-6 lg:p-8">
            {/* Clients Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-heading text-xl sm:text-2xl font-semibold" style={{color: '#1f2937'}}>
                    Clients
                  </h2>
                </div>
                <button
                  data-testid="add-client-button"
                  onClick={() => setShowCreateClient(true)}
                  className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Client</span>
                </button>
              </div>
                
              {/* Client List */}
              {isLoadingClients ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="p-6 bg-white/70 border border-gray-200 backdrop-blur-sm">
                      <div className="animate-pulse">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                          <div>
                            <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
                            <div className="h-3 bg-gray-300 rounded w-32"></div>
                          </div>
                        </div>
                        <div className="h-3 bg-gray-300 rounded w-full mb-2"></div>
                        <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : clients.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {clients.map((client) => (
                    <ClientCard
                      key={client.id}
                      client={client}
                      handleViewClient={handleViewClient}
                      handleEditClient={handleEditClient}
                      handleDeleteClient={handleDeleteClient}
                      isDeleting={isDeleting}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center bg-white/70 border border-gray-200 backdrop-blur-sm">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-xl mb-6 bg-gray-100">
                    <Users className="h-10 w-10 text-gray-500" />
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-3" style={{color: '#1f2937'}}>
                    No clients found
                  </h3>
                  <p className="text-sm mb-8 max-w-md mx-auto" style={{color: '#374151'}}>
                    Start building your client base by adding your first client. 
                    You can add contact information, company details, and more.
                  </p>
                  
                  <button
                    data-testid="add-first-client-button"
                    onClick={() => setShowCreateClient(true)}
                    className="flex items-center justify-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium mx-auto cursor-pointer"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Add Your First Client</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      
      <ToastContainer
        toasts={toasts}
        onRemove={removeToast}
      />

      {/* Create Client Modal */}
      {showCreateClient && (
        <ClientModal
          isOpen={showCreateClient}
          onClose={() => setShowCreateClient(false)}
          getAuthHeaders={getAuthHeaders}
          onSuccess={() => {
            setShowCreateClient(false);
            // Refresh data after successful client creation
            if (user && !loading) {
              const loadData = async () => {
                // Data is now managed globally, no need to refresh manually
              };
              loadData();
            }
          }}
        />
      )}

      {/* Edit Client Modal */}
      {showEditClient && selectedClient && (
        <ClientModal
          isOpen={showEditClient}
          onClose={() => {
            setShowEditClient(false);
            setSelectedClient(null);
          }}
          getAuthHeaders={getAuthHeaders}
          editingClient={selectedClient}
          onSuccess={() => {
            setShowEditClient(false);
            setSelectedClient(null);
            // Refresh data after successful client update
            if (user && !loading) {
              const loadData = async () => {
                // Data is now managed globally, no need to refresh manually
              };
              loadData();
            }
          }}
        />
      )}

      {/* View Client Modal */}
      {showViewClient && selectedClient && (() => {
        // Calculate client statistics
        const clientInvoices = invoices?.filter(inv => inv.clientId === selectedClient.id) || [];
        const totalInvoices = clientInvoices.length;
        const paidInvoices = clientInvoices.filter(inv => inv.status === 'paid').length;
        const pendingInvoices = clientInvoices.filter(inv => inv.status === 'sent' || inv.status === 'pending').length;
        const totalAmount = clientInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
        const recentInvoices = clientInvoices.slice(0, 5).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50">
            <div className="p-4 sm:p-6 max-w-2xl w-full shadow-2xl border max-h-[95vh] sm:max-h-[90vh] overflow-y-auto scroll-smooth custom-scrollbar bg-white border-gray-200">
              {/* Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Client Details</h2>
                <button
                  onClick={() => {
                    setShowViewClient(false);
                    setSelectedClient(null);
                  }}
                  className="p-1.5 rounded-lg transition-colors hover:bg-gray-100 cursor-pointer"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Client Name */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    {selectedClient.name}
                  </h3>
                  {selectedClient.company && (
                    <p className="text-sm text-gray-600">
                      {selectedClient.company}
                    </p>
                  )}
                </div>

                {/* Contact Information */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <a href={`mailto:${selectedClient.email}`} className="text-gray-900 hover:text-gray-700">
                      {selectedClient.email}
                    </a>
                  </div>
                  {selectedClient.phone && (
                    <div className="flex items-center space-x-3 text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <a href={`tel:${selectedClient.phone}`} className="text-gray-900 hover:text-gray-700">
                        {selectedClient.phone}
                      </a>
                    </div>
                  )}
                  {selectedClient.address && (
                    <div className="flex items-start space-x-3 text-sm">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-900">{selectedClient.address}</span>
                    </div>
                  )}
                </div>

                {/* Statistics */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-semibold text-gray-900">{totalInvoices}</p>
                      <p className="text-xs text-gray-500 mt-1">Invoices</p>
                    </div>
                    <div>
                      <p className="text-2xl font-semibold text-gray-900">{paidInvoices}</p>
                      <p className="text-xs text-gray-500 mt-1">Paid</p>
                    </div>
                    <div>
                      <p className="text-2xl font-semibold text-gray-900">{pendingInvoices}</p>
                      <p className="text-xs text-gray-500 mt-1">Pending</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200 text-center">
                    <p className="text-sm text-gray-500">Total Amount</p>
                    <p className="text-xl font-semibold text-gray-900 mt-1">${totalAmount.toLocaleString()}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      setShowViewClient(false);
                      setSelectedClient(null);
                      handleCreateInvoice();
                    }}
                    className="flex items-center justify-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium cursor-pointer"
                  >
                    <FilePlus className="h-4 w-4" />
                    <span>Create Invoice</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowViewClient(false);
                      handleEditClient(selectedClient);
                    }}
                    className="flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowViewClient(false);
                      handleDeleteClient(selectedClient);
                    }}
                    className="flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </button>
                </div>

                {/* Recent Invoices */}
                {recentInvoices.length > 0 && (
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Invoices</h4>
                    <div className="space-y-1">
                      {recentInvoices.map((invoice) => (
                        <div key={invoice.id} className="flex items-center justify-between py-2 text-sm border-b border-gray-100 last:border-0">
                          <div className="flex items-center space-x-3">
                            <span className="text-gray-900 font-medium">#{invoice.invoiceNumber}</span>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                              invoice.status === 'sent' || invoice.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                              invoice.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {invoice.status}
                            </span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-500">
                              {new Date(invoice.dueDate).toLocaleDateString()}
                            </span>
                          </div>
                          <span className="text-gray-900 font-medium">${invoice.total.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Invoice Type Selection Modal */}
      {showInvoiceTypeSelection && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white shadow-2xl border border-gray-200 max-w-md w-full p-6">
            <div className="text-center mb-6">
              <h3 className="font-heading text-xl font-semibold mb-2" style={{color: '#1f2937'}}>
                Choose Invoice Type
              </h3>
              <p className="text-gray-600 text-sm">
                Select the type of invoice you want to create
              </p>
            </div>
                  
            <div className="space-y-3">
              {/* Fast Invoice Option */}
              <button
                onClick={handleSelectFastInvoice}
                className="w-full p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200 group cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="text-left flex-1">
                    <h4 className="font-medium text-gray-900">Fast Invoice</h4>
                    <p className="text-sm text-gray-500">Quick invoice with minimal details</p>
                  </div>
                  <div className="text-indigo-600 group-hover:text-indigo-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>

              {/* Detailed Invoice Option */}
              <button
                onClick={handleSelectDetailedInvoice}
                className="w-full p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200 group cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                    <FilePlus className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="text-left flex-1">
                    <h4 className="font-medium text-gray-900">Detailed Invoice</h4>
                    <p className="text-sm text-gray-500">Full customization and advanced features</p>
                  </div>
                  <div className="text-indigo-600 group-hover:text-indigo-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            </div>

            <button
              onClick={() => setShowInvoiceTypeSelection(false)}
              className="mt-6 w-full px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Fast Invoice Modal */}
      {showFastInvoice && (
        <FastInvoiceModal
          isOpen={showFastInvoice}
          onClose={() => {
            setShowFastInvoice(false);
            setSelectedClient(null);
          }}
          user={user!}
          clients={clients}
          onSuccess={() => {
            setShowFastInvoice(false);
            setSelectedClient(null);
            showSuccess('Invoice created successfully');
          }}
          getAuthHeaders={getAuthHeaders}
          showSuccess={showSuccess}
          showError={showError}
          showWarning={showError}
        />
      )}

      {/* Create Invoice Modal */}
      {showCreateInvoice && (
        <QuickInvoiceModal
          isOpen={showCreateInvoice}
          onClose={() => {
            setShowCreateInvoice(false);
            setSelectedClient(null);
          }}
          getAuthHeaders={getAuthHeaders}
          clients={clients}
          onSuccess={() => {
            setShowCreateInvoice(false);
            setSelectedClient(null);
            showSuccess('Invoice created successfully');
          }}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() => setConfirmationModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmationModal.onConfirm}
        title={confirmationModal.title}
        message={confirmationModal.message}
        type={confirmationModal.type}
        isLoading={confirmationModal.isLoading}
        confirmText="Delete Client"
        cancelText="Cancel"
      />
    </div>
  );
}
