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
}

interface SettingsContextType {
  settings: BusinessSettings;
  isLoadingSettings: boolean;
  error: string | null;
  refreshSettings: () => Promise<void>;
  updateSettings: (newSettings: Partial<BusinessSettings>) => void;
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
  paymentNotes: ''
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

  const loadSettings = useCallback(async () => {
    if (!user || hasLoaded || isLoadingSettings) return;

    setIsLoadingSettings(true);
    setError(null);
    
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/settings', {
        headers,
        cache: 'force-cache' // Use cache for better performance
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
    await loadSettings();
  }, [loadSettings]);

  const updateSettings = useCallback((newSettings: Partial<BusinessSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
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
    updateSettings
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
