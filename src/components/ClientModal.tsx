'use client';

import { useState } from 'react';
import { UserPlus, X, User, Mail, Phone, Building2, MapPin, Loader2 } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  email: string;
  company: string;
  phone?: string;
  address?: string;
  createdAt: string;
}

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  getAuthHeaders: () => Promise<{ [key: string]: string }>;
  isDarkMode?: boolean;
  editingClient?: Client | null;
}

export default function ClientModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  getAuthHeaders,
  isDarkMode = false,
  editingClient = null
}: ClientModalProps) {
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    address: ''
  });
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [isUpdatingClient, setIsUpdatingClient] = useState(false);

  // Reset form when modal opens/closes or editing client changes
  useState(() => {
    if (isOpen) {
      if (editingClient) {
        setNewClient({
          name: editingClient.name || '',
          email: editingClient.email || '',
          company: editingClient.company || '',
          phone: editingClient.phone || '',
          address: editingClient.address || ''
        });
      } else {
        setNewClient({
          name: '',
          email: '',
          company: '',
          phone: '',
          address: ''
        });
      }
    }
  });

  const handleCreateClient = async () => {
    if (!newClient.name.trim() || !newClient.email.trim()) {
      return;
    }

    setIsCreatingClient(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newClient),
      });

      if (response.ok) {
        onSuccess();
        onClose();
        setNewClient({
          name: '',
          email: '',
          company: '',
          phone: '',
          address: ''
        });
      }
    } catch (error) {
      console.error('Error creating client:', error);
    } finally {
      setIsCreatingClient(false);
    }
  };

  const handleUpdateClient = async () => {
    if (!newClient.name.trim() || !newClient.email.trim() || !editingClient) {
      return;
    }

    setIsUpdatingClient(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/clients/${editingClient.id}`, {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newClient),
      });

      if (response.ok) {
        onSuccess();
        onClose();
        setNewClient({
          name: '',
          email: '',
          company: '',
          phone: '',
          address: ''
        });
      }
    } catch (error) {
      console.error('Error updating client:', error);
    } finally {
      setIsUpdatingClient(false);
    }
  };

  const handleClose = () => {
    setNewClient({
      name: '',
      email: '',
      company: '',
      phone: '',
      address: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50">
      <div className={`rounded-2xl shadow-2xl border max-w-lg w-full ${
        isDarkMode 
          ? 'bg-gray-900/95 border-gray-700' 
          : 'bg-white/95 border-gray-200'
      } backdrop-blur-sm`}>
        {/* Header */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${
                isDarkMode 
                  ? 'bg-indigo-500/20' 
                  : 'bg-indigo-50'
              }`}>
                <UserPlus className={`h-5 w-5 ${
                  isDarkMode 
                    ? 'text-indigo-400' 
                    : 'text-indigo-600'
                }`} />
              </div>
              <div>
                <h2 className={`text-lg font-semibold ${
                  isDarkMode 
                    ? 'text-white' 
                    : 'text-gray-900'
                }`}>
                  {editingClient ? 'Edit Client' : 'Add New Client'}
                </h2>
                <p className={`text-sm ${
                  isDarkMode 
                    ? 'text-gray-400' 
                    : 'text-gray-500'
                }`}>
                  {editingClient ? 'Update client information' : 'Add a new client to your list'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className={`transition-colors p-1.5 rounded-lg ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* Form */}
        <div className="px-6 pb-6">
          <div className="space-y-5">
            {/* Required Fields */}
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Client Name *
                </label>
                <div className="relative">
                  <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`} />
                  <input
                    type="text"
                    value={newClient.name}
                    onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                    className={`w-full pl-10 pr-4 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                      isDarkMode 
                        ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-500' 
                        : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                    }`}
                    placeholder="Enter client name"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`} />
                  <input
                    type="email"
                    value={newClient.email}
                    onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                    className={`w-full pl-10 pr-4 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                      isDarkMode 
                        ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-500' 
                        : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                    }`}
                    placeholder="client@example.com"
                    required
                  />
                </div>
              </div>
              
              {/* Optional Fields */}
              <div className={`p-5 rounded-lg border ${
                isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
              }`}>
                <h3 className={`text-sm font-semibold mb-4 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Additional Information (Optional)
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Mobile Number
                    </label>
                    <div className="relative">
                      <Phone className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                        isDarkMode ? 'text-gray-500' : 'text-gray-400'
                      }`} />
                      <input
                        type="tel"
                        value={newClient.phone || ''}
                        onChange={(e) => setNewClient(prev => ({ ...prev, phone: e.target.value }))}
                        className={`w-full pl-10 pr-4 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                          isDarkMode 
                            ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-500' 
                            : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                        }`}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Company
                    </label>
                    <div className="relative">
                      <Building2 className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                        isDarkMode ? 'text-gray-500' : 'text-gray-400'
                      }`} />
                      <input
                        type="text"
                        value={newClient.company || ''}
                        onChange={(e) => setNewClient(prev => ({ ...prev, company: e.target.value }))}
                        className={`w-full pl-10 pr-4 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                          isDarkMode 
                            ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-500' 
                            : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                        }`}
                        placeholder="Company name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Address
                    </label>
                    <div className="relative">
                      <MapPin className={`absolute left-3 top-3 h-4 w-4 ${
                        isDarkMode ? 'text-gray-500' : 'text-gray-400'
                      }`} />
                      <textarea
                        value={newClient.address || ''}
                        onChange={(e) => setNewClient(prev => ({ ...prev, address: e.target.value }))}
                        className={`w-full pl-10 pr-4 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none ${
                          isDarkMode 
                            ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-500' 
                            : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                        }`}
                        placeholder="Client address"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6">
                <button
                  onClick={handleClose}
                  className={`flex-1 py-3 px-6 rounded-lg transition-colors font-medium text-sm ${
                    isDarkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Cancel
                </button>
                <button 
                  onClick={editingClient ? handleUpdateClient : handleCreateClient}
                  disabled={isCreatingClient || isUpdatingClient}
                  className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center space-x-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {(isCreatingClient || isUpdatingClient) ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  <span>
                    {isCreatingClient ? 'Adding Client...' : 
                     isUpdatingClient ? 'Updating Client...' :
                     editingClient ? 'Update Client' : 'Add Client'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
