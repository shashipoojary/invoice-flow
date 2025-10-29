'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Invoice, Client } from '@/types';

interface DataContextType {
  // Invoices
  invoices: Invoice[];
  isLoadingInvoices: boolean;
  invoicesError: string | null;
  refreshInvoices: () => Promise<void>;
  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (invoice: Invoice) => void;
  deleteInvoice: (invoiceId: string) => void;
  
  // Clients
  clients: Client[];
  isLoadingClients: boolean;
  clientsError: string | null;
  refreshClients: () => Promise<void>;
  addClient: (client: Client) => void;
  updateClient: (client: Client) => void;
  deleteClient: (clientId: string) => void;
  
  // Global loading state
  isLoading: boolean;
  lastUpdated: Date | null;
  clearData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const { user, getAuthHeaders } = useAuth();
  
  // Invoices state
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  const [invoicesError, setInvoicesError] = useState<string | null>(null);
  
  // Clients state
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [clientsError, setClientsError] = useState<string | null>(null);
  
  // Global state
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [lastFetched, setLastFetched] = useState<{ invoices: number; clients: number }>({ invoices: 0, clients: 0 });

  const loadInvoices = useCallback(async (force = false) => {
    if (!user || isLoadingInvoices) return;
    
    // Cache for 30 seconds to prevent unnecessary API calls
    const now = Date.now();
    if (!force && now - lastFetched.invoices < 30000) {
      return;
    }
    
    setIsLoadingInvoices(true);
    setInvoicesError(null);
    
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/invoices', {
        headers,
        cache: 'no-store'
      });
      
      if (response.ok) {
        const data = await response.json();
        setInvoices(Array.isArray(data.invoices) ? data.invoices : []);
        setLastFetched(prev => ({ ...prev, invoices: now }));
      } else {
        throw new Error('Failed to fetch invoices');
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setInvoicesError('Failed to load invoices');
    } finally {
      setIsLoadingInvoices(false);
    }
  }, [user, getAuthHeaders, isLoadingInvoices, lastFetched.invoices]);

  const loadClients = useCallback(async (force = false) => {
    if (!user || isLoadingClients) return;
    
    // Cache for 30 seconds to prevent unnecessary API calls
    const now = Date.now();
    if (!force && now - lastFetched.clients < 30000) {
      return;
    }
    
    setIsLoadingClients(true);
    setClientsError(null);
    
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/clients', {
        headers,
        cache: 'no-store'
      });
      
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients || []);
        setLastFetched(prev => ({ ...prev, clients: now }));
      } else {
        throw new Error('Failed to fetch clients');
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      setClientsError('Failed to load clients');
    } finally {
      setIsLoadingClients(false);
    }
  }, [user, getAuthHeaders, isLoadingClients, lastFetched.clients]);

  const loadAllData = useCallback(async () => {
    if (!user || hasLoaded) return;
    
    setHasLoaded(true);
    
    try {
      // Load both invoices and clients in parallel
      await Promise.allSettled([
        loadInvoices(),
        loadClients()
      ]);
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, [user, hasLoaded, loadInvoices, loadClients]);

  const refreshInvoices = useCallback(async () => {
    await loadInvoices();
    setLastUpdated(new Date());
  }, [loadInvoices]);

  const refreshClients = useCallback(async () => {
    await loadClients();
    setLastUpdated(new Date());
  }, [loadClients]);

  const addInvoice = useCallback((newInvoice: Invoice) => {
    setInvoices(prev => {
      // Check if invoice already exists to prevent duplicates
      const exists = prev.some(invoice => invoice.id === newInvoice.id);
      if (exists) {
        return prev; // Don't add if already exists
      }
      return [newInvoice, ...prev];
    });
  }, []);

  const updateInvoice = useCallback((updatedInvoice: Invoice) => {
    setInvoices(prev => 
      prev.map(invoice => 
        invoice.id === updatedInvoice.id ? { ...updatedInvoice } : invoice
      )
    );
  }, []);

  const deleteInvoice = useCallback((invoiceId: string) => {
    setInvoices(prev => prev.filter(invoice => invoice.id !== invoiceId));
  }, []);

  const updateClient = useCallback((updatedClient: Client) => {
    setClients(prev => 
      prev.map(client => 
        client.id === updatedClient.id ? updatedClient : client
      )
    );
  }, []);

  const deleteClient = useCallback((clientId: string) => {
    setClients(prev => prev.filter(client => client.id !== clientId));
  }, []);

  const addClient = useCallback((newClient: Client) => {
    setClients(prev => {
      // Check if client already exists to prevent duplicates
      const exists = prev.some(client => client.id === newClient.id);
      if (exists) {
        return prev; // Don't add if already exists
      }
      return [newClient, ...prev];
    });
  }, []);

  const clearData = useCallback(() => {
    setInvoices([]);
    setClients([]);
    setLastUpdated(new Date());
  }, []);

  // Load data when user is available
  useEffect(() => {
    if (user && !hasLoaded) {
      loadAllData();
    }
  }, [user, hasLoaded, loadAllData]);

  const isLoading = isLoadingInvoices || isLoadingClients;

  const value: DataContextType = {
    invoices,
    isLoadingInvoices,
    invoicesError,
    refreshInvoices,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    clients,
    isLoadingClients,
    clientsError,
    refreshClients,
    addClient,
    updateClient,
    deleteClient,
    isLoading,
    lastUpdated,
    clearData
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
