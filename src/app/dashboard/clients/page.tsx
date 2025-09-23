'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Users, UserPlus, Edit, Trash2, Mail, Phone, Building2, MapPin, Calendar,
  Eye, X, Loader2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import ToastContainer from '@/components/Toast';
import ModernSidebar from '@/components/ModernSidebar';
import ClientModal from '@/components/ClientModal';
import ConfirmationModal from '@/components/ConfirmationModal';
import { Client } from '@/types';

export default function ClientsPage() {
  const { user, loading, getAuthHeaders } = useAuth();
  const { toasts, removeToast, showSuccess, showError } = useToast();
  
  // State
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [showEditClient, setShowEditClient] = useState(false);
  const [showViewClient, setShowViewClient] = useState(false);
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

  // Dark mode toggle
  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      localStorage.setItem('darkMode', newMode.toString());
      return newMode;
    });
  }, []);

  // Create invoice handler
  const handleCreateInvoice = useCallback(() => {
    // This will be handled by navigation to the invoices page
    console.log('Create invoice clicked');
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
            const clientsResponse = await fetch('/api/clients', { headers });
            const clientsData = await clientsResponse.json();
            setClients(clientsData.clients || []);
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
  const ClientCard = useCallback(({ client, isDarkMode, handleViewClient, handleEditClient, handleDeleteClient, isDeleting }: {
    client: Client;
    isDarkMode: boolean;
    handleViewClient: (client: Client) => void;
    handleEditClient: (client: Client) => void;
    handleDeleteClient: (client: Client) => void;
    isDeleting: string | null;
  }) => (
    <div className={`rounded-lg p-4 transition-all duration-300 hover:scale-[1.02] ${isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white/70 border border-gray-200'} backdrop-blur-sm ${isDeleting === client.id ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-indigo-500/20' : 'bg-indigo-50'}`}>
          <Building2 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => handleViewClient(client)}
            disabled={isDeleting === client.id}
            className={`p-3 sm:p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors min-h-[44px] sm:min-h-auto touch-manipulation ${
              isDeleting === client.id
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
            }`}
            aria-label={`View ${client.name}`}
          >
            <Eye className="h-5 w-5 sm:h-4 sm:w-4" />
          </button>
          <button 
            onClick={() => handleEditClient(client)}
            disabled={isDeleting === client.id}
            className={`p-3 sm:p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors min-h-[44px] sm:min-h-auto touch-manipulation ${
              isDeleting === client.id
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
            }`}
            aria-label={`Edit ${client.name}`}
          >
            <Edit className="h-5 w-5 sm:h-4 sm:w-4" />
          </button>
          <button 
            onClick={() => handleDeleteClient(client)}
            disabled={isDeleting === client.id}
            className={`p-3 sm:p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors min-h-[44px] sm:min-h-auto touch-manipulation ${
              isDeleting === client.id 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-red-50 dark:hover:bg-red-900/20'
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
      
      <h3 className="font-heading text-lg font-semibold mb-2" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
        {client.name}
      </h3>
      {client.company && (
        <p className="text-sm mb-1" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
          {client.company}
        </p>
      )}
      <p className="text-sm mb-4" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
        {client.email}
      </p>
      
      <div className="flex items-center justify-between">
        <div className="text-sm" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
          Added {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : 'Recently'}
        </div>
        <div className="text-sm" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
          Client
        </div>
      </div>
    </div>
  ), []);

  // Load dark mode preference
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(savedDarkMode);
    
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Load data on mount - prevent infinite loop with hasLoadedData flag
  useEffect(() => {
    if (user && !loading && !hasLoadedData) {
      setHasLoadedData(true); // Set flag immediately to prevent re-runs
      
      const loadData = async () => {
        setIsLoading(true);
        try {
          // Call getAuthHeaders directly in each fetch to avoid dependency issues
          const headers = await getAuthHeaders();
          
          // Fetch clients
          const response = await fetch('/api/clients', { headers });
          const data = await response.json();
          setClients(data.clients || []);
        } catch (error) {
          console.error('Error loading clients:', error);
          setClients([]);
        } finally {
          setIsLoading(false);
        }
      };
      loadData();
    }
  }, [user, loading, hasLoadedData]); // Include hasLoadedData to prevent re-runs

  if (loading || isLoading) {
    return (
      <div className={`min-h-screen transition-colors duration-200 ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`min-h-screen transition-colors duration-200 ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Please log in to access the clients</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
      <div className="flex h-screen">
        <ModernSidebar 
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
          onCreateInvoice={handleCreateInvoice}
        />
        
        <main className="flex-1 lg:ml-0 overflow-y-auto scroll-smooth custom-scrollbar">
          <div className="pt-16 lg:pt-4 p-4 sm:p-6 lg:p-8">
            {/* Clients Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-heading text-xl sm:text-2xl font-semibold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                    Clients
                  </h2>
                </div>
                <button
                  onClick={() => setShowCreateClient(true)}
                  className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Client</span>
                </button>
              </div>
                
              {/* Client List */}
              {clients.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {clients.map((client) => (
                    <ClientCard
                      key={client.id}
                      client={client}
                      isDarkMode={isDarkMode}
                      handleViewClient={handleViewClient}
                      handleEditClient={handleEditClient}
                      handleDeleteClient={handleDeleteClient}
                      isDeleting={isDeleting}
                    />
                  ))}
                </div>
              ) : (
                <div className={`rounded-lg p-12 text-center ${isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white/70 border border-gray-200'} backdrop-blur-sm`}>
                  <div className={`inline-flex items-center justify-center w-20 h-20 rounded-xl mb-6 ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                    <Users className="h-10 w-10 text-gray-500 dark:text-gray-400" />
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-3" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>
                    No clients found
                  </h3>
                  <p className="text-sm mb-8 max-w-md mx-auto" style={{color: isDarkMode ? '#e5e7eb' : '#374151'}}>
                    Start building your client base by adding your first client. 
                    You can add contact information, company details, and more.
                  </p>
                  
                  <button
                    onClick={() => setShowCreateClient(true)}
                    className="flex items-center justify-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium mx-auto"
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
          isDarkMode={isDarkMode}
          onSuccess={() => {
            setShowCreateClient(false);
            // Refresh data after successful client creation
            if (user && !loading) {
              const loadData = async () => {
                try {
                  const headers = await getAuthHeaders();
                  const response = await fetch('/api/clients', { headers });
                  const data = await response.json();
                  setClients(data.clients || []);
                } catch (error) {
                  console.error('Error refreshing clients:', error);
                }
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
          isDarkMode={isDarkMode}
          editingClient={selectedClient}
          onSuccess={() => {
            setShowEditClient(false);
            setSelectedClient(null);
            // Refresh data after successful client update
            if (user && !loading) {
              const loadData = async () => {
                try {
                  const headers = await getAuthHeaders();
                  const response = await fetch('/api/clients', { headers });
                  const data = await response.json();
                  setClients(data.clients || []);
                } catch (error) {
                  console.error('Error refreshing clients:', error);
                }
              };
              loadData();
            }
          }}
        />
      )}

      {/* View Client Modal */}
      {showViewClient && selectedClient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50">
          <div className={`rounded-xl sm:rounded-2xl p-2 sm:p-4 max-w-2xl w-full shadow-2xl border max-h-[95vh] sm:max-h-[90vh] overflow-y-auto scroll-smooth custom-scrollbar ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-base sm:text-xl font-bold" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}}>Client Details</h2>
              <button
                onClick={() => {
                  setShowViewClient(false);
                  setSelectedClient(null);
                }}
                className={`p-1 sm:p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
              >
                <X className={`h-4 w-4 sm:h-5 sm:w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </button>
            </div>
            
            {/* Client Details */}
            <div className={`w-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} overflow-hidden`}>
              {/* Header */}
              <div className="p-3 sm:p-6 border-b border-gray-200">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-indigo-500/20' : 'bg-indigo-50'}`}>
                    <Users className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-2xl font-bold text-gray-900">
                      {selectedClient.name}
                    </h3>
                    {selectedClient.company && (
                      <p className="text-sm sm:text-base text-gray-600">
                        {selectedClient.company}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Contact Information */}
              <div className="p-3 sm:p-6 space-y-4">
                <div>
                  <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">Contact Information</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-sm sm:text-base text-gray-600">{selectedClient.email}</span>
                    </div>
                    {selectedClient.phone && (
                      <div className="flex items-center space-x-3">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="text-sm sm:text-base text-gray-600">{selectedClient.phone}</span>
                      </div>
                    )}
                    {selectedClient.address && (
                      <div className="flex items-start space-x-3">
                        <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm sm:text-base text-gray-600">{selectedClient.address}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Additional Info */}
                <div>
                  <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">Additional Information</h4>
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm sm:text-base text-gray-600">
                      Client since {new Date(selectedClient.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
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
