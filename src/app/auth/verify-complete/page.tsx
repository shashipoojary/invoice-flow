'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function VerifyCompletePage() {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(true);

  useEffect(() => {
    const checkAndRedirect = async () => {
      try {
        // Wait a moment for session to be fully established
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          router.replace('/auth');
          return;
        }

        // Check if user has completed onboarding
        try {
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
            } else {
              // Already completed onboarding, go to dashboard
              router.replace('/dashboard');
              return;
            }
          } else {
            // If API fails, assume new user and send to onboarding
            router.replace('/onboarding');
            return;
          }
        } catch (error) {
          console.error('Error checking onboarding:', error);
          // If we can't check, assume new user and send to onboarding
          router.replace('/onboarding');
          return;
        }
      } catch (error) {
        console.error('Error in verification:', error);
        router.replace('/auth');
      }
    };

    checkAndRedirect();
  }, [router]);

  // Always show loading - never show content before redirect
  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-gray-600">Verifying your email...</p>
      </div>
    </div>
  );
}

