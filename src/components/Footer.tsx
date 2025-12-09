'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, AlertCircle, XCircle, Loader2 } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface FooterProps {}

interface SystemStatus {
  status: 'operational' | 'degraded' | 'down';
  services: Array<{
    name: string;
    status: 'operational' | 'degraded' | 'down';
    responseTime?: number;
  }>;
  timestamp?: string;
}

export default function Footer({}: FooterProps) {
  const router = useRouter();
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleNavigation = (path: string) => {
    if (path === 'features') {
      if (window.location.pathname === '/') {
        setTimeout(() => {
          const featuresSection = document.getElementById('features');
          if (featuresSection) {
            featuresSection.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      } else {
        router.push('/');
        setTimeout(() => {
          const featuresSection = document.getElementById('features');
          if (featuresSection) {
            featuresSection.scrollIntoView({ behavior: 'smooth' });
          }
        }, 300);
      }
    } else if (path === 'pricing') {
      if (window.location.pathname === '/') {
        setTimeout(() => {
          const pricingSection = document.getElementById('pricing');
          if (pricingSection) {
            pricingSection.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      } else {
        router.push('/');
        setTimeout(() => {
          const pricingSection = document.getElementById('pricing');
          if (pricingSection) {
            pricingSection.scrollIntoView({ behavior: 'smooth' });
          }
        }, 300);
      }
    }
  };

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/status', {
          next: { revalidate: 60 }
        });
        if (response.ok) {
          const data = await response.json();
          setSystemStatus(data);
        }
      } catch (error) {
        console.error('Failed to fetch system status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
    // Refresh every 60 seconds
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    if (isLoading) {
      return <Loader2 className="w-3 h-3 animate-spin text-gray-400" />;
    }
    if (!systemStatus) {
      return <XCircle className="w-3 h-3 text-gray-400" />;
    }
    switch (systemStatus.status) {
      case 'operational':
        return <CheckCircle2 className="w-3 h-3 text-emerald-500" />;
      case 'degraded':
        return <AlertCircle className="w-3 h-3 text-amber-500" />;
      case 'down':
        return <XCircle className="w-3 h-3 text-red-500" />;
      default:
        return <XCircle className="w-3 h-3 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    if (isLoading) return 'Checking status...';
    if (!systemStatus) return 'Status unavailable';
    switch (systemStatus.status) {
      case 'operational':
        return 'All systems operational';
      case 'degraded':
        return 'Some systems degraded';
      case 'down':
        return 'Some systems down';
      default:
        return 'Status unknown';
    }
  };

  return (
    <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-200">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="mb-4">
              <div className="mb-3">
                <span className="text-2xl font-bold tracking-tight">
                  <span className="text-gray-900">Flow</span>
                  <span className="text-violet-600">Invoice</span>
                </span>
              </div>
              <p className="text-sm leading-relaxed" style={{color: '#6b7280', marginLeft: '0'}}>
                The fastest way for freelancers to get paid.
              </p>
            </div>
          </div>
          <div>
            <h3 className="font-heading text-lg font-semibold mb-4" style={{color: '#1f2937'}}>Product</h3>
            <ul className="space-y-2" style={{color: '#6b7280'}}>
              <li>
                <button 
                  onClick={() => handleNavigation('features')}
                  className="transition-colors hover:opacity-80 text-left cursor-pointer"
                >
                  Features
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNavigation('pricing')}
                  className="transition-colors hover:opacity-80 text-left cursor-pointer"
                >
                  Pricing
                </button>
              </li>
              <li><Link href="/docs" className="transition-colors hover:opacity-80">Documentation</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-heading text-lg font-semibold mb-4" style={{color: '#1f2937'}}>Support</h3>
            <ul className="space-y-2" style={{color: '#6b7280'}}>
              <li><Link href="/contact" className="transition-colors hover:opacity-80">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-heading text-lg font-semibold mb-4" style={{color: '#1f2937'}}>Company</h3>
            <ul className="space-y-2" style={{color: '#6b7280'}}>
              <li><Link href="/about" className="transition-colors hover:opacity-80">About</Link></li>
              <li><Link href="/privacy" className="transition-colors hover:opacity-80">Privacy</Link></li>
              <li><Link href="/terms" className="transition-colors hover:opacity-80">Terms</Link></li>
            </ul>
          </div>
        </div>
        
        {/* System Status Indicator */}
        <div className="border-t mt-8 pt-6 border-gray-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm" style={{color: '#6b7280'}}>
              {getStatusIcon()}
              <span>{getStatusText()}</span>
            </div>
            <p className="text-sm" style={{color: '#6b7280'}}>&copy; 2024 FlowInvoicer. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
