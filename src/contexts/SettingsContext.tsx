'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface BusinessSettings {
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  website: string;
  address: string;
  logo: string;
  paypalEmail: string;
  cashappId: string;
  venmoId: string;
  googlePayUpi: string;
  applePayId: string;
  bankAccount: string;
  bankIfscSwift: string;
  bankIban: string;
  stripeAccount: string;
  paymentNotes: string;
  baseCurrency: string;
}

interface SettingsContextType {
  settings: BusinessSettings;
  isLoadingSettings: boolean;
  error: string | null;
  refreshSettings: () => Promise<void>;
  updateSettings: (newSettings: Partial<BusinessSettings>) => void;
  clearSettings: () => void;
}

const defaultSettings: BusinessSettings = {
  businessName: '',
  businessEmail: '',
  businessPhone: '',
  website: '',
  address: '',
  logo: '',
  paypalEmail: '',
  cashappId: '',
  venmoId: '',
  googlePayUpi: '',
  applePayId: '',
  bankAccount: '',
  bankIfscSwift: '',
  bankIban: '',
  stripeAccount: '',
  paymentNotes: '',
  baseCurrency: 'USD'
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const { user, getAuthHeaders } = useAuth();
  const [settings, setSettings] = useState<BusinessSettings>(defaultSettings);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const loadSettings = useCallback(async (force = false) => {
    if (!user || (!force && (hasLoaded || isLoadingSettings))) return;

    setIsLoadingSettings(true);
    setError(null);
    
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/settings?noCache=1&_=${Date.now()}` , {
        headers,
        cache: 'no-store'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setSettings(data.settings);
          setHasLoaded(true);
        }
      } else {
        throw new Error('Failed to fetch settings');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setError('Failed to load settings');
    } finally {
      setIsLoadingSettings(false);
    }
  }, [user, getAuthHeaders, hasLoaded, isLoadingSettings]);

  const refreshSettings = useCallback(async () => {
    setHasLoaded(false);
    await loadSettings(true);
  }, [loadSettings]);

  const updateSettings = useCallback((newSettings: Partial<BusinessSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const clearSettings = useCallback(() => {
    setSettings(defaultSettings);
    setHasLoaded(false);
  }, []);

  // Load settings when user is available
  useEffect(() => {
    if (user && !hasLoaded) {
      loadSettings();
    }
  }, [user, hasLoaded, loadSettings]);

  const value: SettingsContextType = {
    settings,
    isLoadingSettings,
    error,
    refreshSettings,
    updateSettings,
    clearSettings
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
