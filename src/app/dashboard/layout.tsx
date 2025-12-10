'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { DataProvider } from '@/contexts/DataContext';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const checkAuthAndOnboarding = async () => {
      setIsChecking(true);
      
      try {
        // Get session first
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          router.replace('/auth');
          return;
        }

        // Check if user has completed onboarding
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
        } else {
          // If API fails, assume new user and send to onboarding
          router.replace('/onboarding');
          return;
        }

        // All checks passed, allow rendering
        setShouldRender(true);
      } catch (error) {
        console.error('Error checking auth/onboarding:', error);
        router.replace('/auth');
      } finally {
        setIsChecking(false);
      }
    };

    checkAuthAndOnboarding();
  }, [router]);

  // Show loading while checking - prevent any content flash
  if (isChecking || !shouldRender) {
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
