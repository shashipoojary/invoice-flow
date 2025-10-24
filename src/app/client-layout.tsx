'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Handle browser extension attributes that cause hydration mismatches
    const body = document.body;
    if (body) {
      // Remove Grammarly attributes that cause hydration issues
      body.removeAttribute('data-new-gr-c-s-check-loaded');
      body.removeAttribute('data-gr-ext-installed');
      
      // Remove other common extension attributes
      body.removeAttribute('data-grammarly-shadow-root');
      body.removeAttribute('data-gramm');
      
      // Remove any other extension attributes that might cause issues
      const attributes = body.getAttributeNames();
      attributes.forEach(attr => {
        if (attr.startsWith('data-grammarly') || 
            attr.startsWith('data-new-gr') || 
            attr.startsWith('data-gr-ext')) {
          body.removeAttribute(attr);
        }
      });
    }
    
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null;
  }

  return (
    <>
      <Navbar />
      {children}
    </>
  );
}

