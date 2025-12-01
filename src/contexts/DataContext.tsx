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
  hasInitiallyLoaded: boolean; // True after first successful load
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
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
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
        setHasInitiallyLoaded(true); // Mark as loaded after first successful fetch
      } else if (response.status === 401) {
        // Authentication or connection issue
        const errorText = await response.text().catch(() => '');
        if (errorText.includes('ENOTFOUND') || errorText.includes('fetch failed')) {
          setInvoicesError('Cannot connect to Supabase. Please check your Supabase project status and environment variables.');
        } else {
          setInvoicesError('Authentication failed. Please sign in again.');
        }
        setHasInitiallyLoaded(true);
      } else {
        throw new Error(`Failed to fetch invoices: ${response.status}`);
      }
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
      if (error?.message?.includes('fetch failed') || error?.code === 'ENOTFOUND') {
        setInvoicesError('Cannot connect to Supabase. Your project may be paused. Check your Supabase dashboard.');
      } else {
        setInvoicesError('Failed to load invoices. Please try again.');
      }
      setHasInitiallyLoaded(true); // Mark as loaded even on error to prevent empty state flash
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
      } else if (response.status === 401) {
        // Authentication or connection issue
        const errorText = await response.text().catch(() => '');
        if (errorText.includes('ENOTFOUND') || errorText.includes('fetch failed')) {
          setClientsError('Cannot connect to Supabase. Please check your Supabase project status and environment variables.');
        } else {
          setClientsError('Authentication failed. Please sign in again.');
        }
      } else {
        throw new Error(`Failed to fetch clients: ${response.status}`);
      }
    } catch (error: any) {
      console.error('Error fetching clients:', error);
      if (error?.message?.includes('fetch failed') || error?.code === 'ENOTFOUND') {
        setClientsError('Cannot connect to Supabase. Your project may be paused. Check your Supabase dashboard.');
      } else {
        setClientsError('Failed to load clients. Please try again.');
      }
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
    await loadInvoices(true);
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
    setInvoices(prev => {
      const statusRank: Record<string, number> = { paid: 3, sent: 2, pending: 2, overdue: 2, draft: 1 };
      const next = prev.map(existing => {
        if (existing.id !== updatedInvoice.id) return existing;

        const incomingStatus = (updatedInvoice as any).status || (existing as any).status;
        const currentStatus = (existing as any).status;
        const chosenStatus = (statusRank[incomingStatus] || 0) >= (statusRank[currentStatus] || 0)
          ? incomingStatus
          : currentStatus;

        const merged = { ...existing, ...updatedInvoice } as any;
        if (chosenStatus) merged.status = chosenStatus;
        return merged as Invoice;
      });
      // Move the updated invoice to the front so it appears as the first card
      const id = updatedInvoice.id;
      const updated = next.find(i => i.id === id);
      if (updated) {
        return [updated, ...next.filter(i => i.id !== id)];
      }
      return next;
    });
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
    hasInitiallyLoaded,
    clearData
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
