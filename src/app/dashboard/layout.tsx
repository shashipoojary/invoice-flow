'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { DataProvider } from '@/contexts/DataContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (authLoading) return;
      
      if (!user) {
        router.replace('/auth');
        return;
      }

      try {
        // Check if user has completed onboarding (has business_name in user_settings)
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.replace('/auth');
          return;
        }

        const response = await fetch('/api/settings', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          // If no businessName is set, redirect to onboarding (first-time user)
          if (!data.settings?.businessName || data.settings?.businessName.trim() === '') {
            router.replace('/onboarding');
            return;
          }
        }
      } catch (error) {
        console.error('Error checking onboarding:', error);
      } finally {
        setCheckingOnboarding(false);
      }
    };

    checkOnboarding();
  }, [user, authLoading, router]);

  // Show loading while checking auth and onboarding
  if (authLoading || checkingOnboarding) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <SettingsProvider>
      <DataProvider>
        {children}
      </DataProvider>
    </SettingsProvider>
  );
}
