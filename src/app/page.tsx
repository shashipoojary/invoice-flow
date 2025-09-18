'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new dashboard
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}
