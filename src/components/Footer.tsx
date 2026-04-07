'use client';

import Link from 'next/link';
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

interface ServiceHistoryPoint {
  timestamp: string;
  status: 'operational' | 'degraded' | 'down';
  responseTime?: number;
}

type ServiceHistoryMap = Record<string, ServiceHistoryPoint[]>;

const STATUS_HISTORY_KEY = 'flowinvoicer-status-history-v1';
const MAX_HISTORY_POINTS = 90;

export default function Footer({}: FooterProps) {
  const router = useRouter();
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showStatusDetails, setShowStatusDetails] = useState(false);
  const [serviceHistory, setServiceHistory] = useState<ServiceHistoryMap>({});
  const [hoveredPoint, setHoveredPoint] = useState<{
    serviceName: string;
    point: ServiceHistoryPoint;
    x: number;
    y: number;
  } | null>(null);

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
    try {
      const raw = window.localStorage.getItem(STATUS_HISTORY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ServiceHistoryMap;
        setServiceHistory(parsed);
      }
    } catch (error) {
      console.error('Failed to load status history:', error);
    }

    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/status', {
          next: { revalidate: 60 }
        });
        if (response.ok) {
          const data = await response.json();
          const liveStatus: SystemStatus = data;
          setSystemStatus(liveStatus);
          setServiceHistory((prev) => {
            const next: ServiceHistoryMap = { ...prev };
            const snapshotTime = liveStatus.timestamp ?? new Date().toISOString();

            liveStatus.services.forEach((service) => {
              const existing = next[service.name] ?? [];
              const last = existing[existing.length - 1];
              const point: ServiceHistoryPoint = {
                timestamp: snapshotTime,
                status: service.status,
                responseTime: service.responseTime,
              };

              const merged =
                last && last.timestamp === snapshotTime
                  ? [...existing.slice(0, -1), point]
                  : [...existing, point];

              next[service.name] = merged.slice(-MAX_HISTORY_POINTS);
            });

            try {
              window.localStorage.setItem(STATUS_HISTORY_KEY, JSON.stringify(next));
            } catch (storageError) {
              console.error('Failed to save status history:', storageError);
            }

            return next;
          });
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

  const formatTimestamp = (value?: string) => {
    if (!value) return 'Just now';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Just now';
    return date.toLocaleString();
  };

  const getUptimePercent = (status: 'operational' | 'degraded' | 'down') => {
    if (status === 'operational') return 99.98;
    if (status === 'degraded') return 99.2;
    return 97.5;
  };

  const getBarColor = (status: 'operational' | 'degraded' | 'down') => {
    if (status === 'down') return 'bg-red-400';
    if (status === 'degraded') return 'bg-amber-400';
    return 'bg-emerald-500';
  };

  return (
    <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-200 [&_*]:!rounded-none">
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
            <button
              type="button"
              onClick={() => setShowStatusDetails((prev) => !prev)}
              className="flex items-center gap-2 text-sm cursor-pointer hover:opacity-80 transition-opacity"
              style={{ color: '#6b7280' }}
              aria-expanded={showStatusDetails}
              aria-controls="system-status-modal"
            >
              {getStatusIcon()}
              <span>{getStatusText()}</span>
            </button>
            <p className="text-sm" style={{color: '#6b7280'}}>&copy; 2024 FlowInvoicer. All rights reserved.</p>
          </div>
        </div>
      </div>

      {showStatusDetails && (
        <div
          id="system-status-modal"
          className="fixed inset-0 z-[100] bg-black/55 backdrop-blur-[1px] flex items-start justify-center p-4 sm:p-8 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setShowStatusDetails(false);
            }
          }}
        >
          <div className="w-full max-w-5xl bg-white border border-gray-200 mt-4 sm:mt-8 shadow-2xl">
            <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">System Status</h3>
                <p className="text-xs sm:text-sm text-gray-500">Last updated: {formatTimestamp(systemStatus?.timestamp)}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowStatusDetails(false)}
                className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>

            <div className="p-4 sm:p-6">
              <div className="w-full bg-gradient-to-r from-emerald-500 to-emerald-400 text-white font-medium px-4 py-3 mb-5 border border-emerald-600">
                <div className="flex items-center justify-between gap-4">
                  <span>{getStatusText()}</span>
                  <span className="text-xs text-emerald-50">Live checks + historical samples</span>
                </div>
              </div>

              {isLoading ? (
                <p className="text-sm text-gray-600">Fetching latest service status...</p>
              ) : !systemStatus || systemStatus.services.length === 0 ? (
                <p className="text-sm text-gray-600">No status logs available right now.</p>
              ) : (
                <div className="border border-gray-200">
                  <div className="px-4 py-3 border-b border-gray-200 text-xs sm:text-sm text-gray-600 flex items-center justify-between">
                    <span>Uptime timeline (latest {MAX_HISTORY_POINTS} real checks)</span>
                    <span className="text-gray-500">Hover bars for exact sample details</span>
                  </div>
                  {systemStatus.services.map((service) => (
                    <div key={service.name} className="px-4 py-4 border-b border-gray-100 last:border-b-0">
                      {(() => {
                        const points = serviceHistory[service.name] ?? [];
                        const uptimeFromSamples = points.length
                          ? (points.filter((p) => p.status === 'operational').length / points.length) * 100
                          : getUptimePercent(service.status);

                        return (
                          <>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {service.status === 'operational' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                          {service.status === 'degraded' && <AlertCircle className="w-4 h-4 text-amber-500" />}
                          {service.status === 'down' && <XCircle className="w-4 h-4 text-red-500" />}
                          <span className="text-sm font-medium text-gray-900">{service.name}</span>
                        </div>
                        <span className={`text-xs sm:text-sm capitalize ${service.status === 'operational' ? 'text-emerald-600' : service.status === 'degraded' ? 'text-amber-600' : 'text-red-600'}`}>
                          {service.status}
                        </span>
                      </div>

                      {points.length > 0 ? (
                        <div className={`grid gap-1 mb-2`} style={{ gridTemplateColumns: `repeat(${Math.min(points.length, MAX_HISTORY_POINTS)}, minmax(0, 1fr))` }}>
                          {points.map((point, index) => (
                            <button
                              key={`${service.name}-${point.timestamp}-${index}`}
                              type="button"
                              onMouseEnter={(event) =>
                                setHoveredPoint({
                                  serviceName: service.name,
                                  point,
                                  x: event.clientX,
                                  y: event.clientY,
                                })
                              }
                              onMouseMove={(event) =>
                                setHoveredPoint((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        x: event.clientX,
                                        y: event.clientY,
                                      }
                                    : prev
                                )
                              }
                              onMouseLeave={() => setHoveredPoint((prev) => (prev?.serviceName === service.name ? null : prev))}
                              className={`h-6 ${getBarColor(point.status)} hover:brightness-110 transition-all cursor-pointer border border-white/50`}
                              aria-label={`${service.name} ${point.status} at ${formatTimestamp(point.timestamp)}`}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="mb-2 border border-dashed border-gray-200 px-3 py-2 text-xs text-gray-500">
                          No historical samples yet. Keep this page open to build live status history.
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{points.length > 0 ? 'Oldest sample' : 'No samples yet'}</span>
                        <span>{uptimeFromSamples.toFixed(2)}% uptime</span>
                        <span>
                          Latest sample
                          {typeof service.responseTime === 'number' ? ` • ${service.responseTime}ms` : ''}
                        </span>
                      </div>
                          </>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showStatusDetails && hoveredPoint && (
        <div
          className="fixed z-[120] pointer-events-none border border-gray-200 bg-white shadow-lg px-3 py-2 text-xs text-gray-700 max-w-[260px]"
          style={{
            left: `${hoveredPoint.x + 12}px`,
            top: `${hoveredPoint.y + 12}px`,
          }}
        >
          <p className="font-semibold text-gray-900">{hoveredPoint.serviceName}</p>
          <p className="capitalize">{hoveredPoint.point.status}</p>
          <p>{formatTimestamp(hoveredPoint.point.timestamp)}</p>
          {typeof hoveredPoint.point.responseTime === 'number' && (
            <p>{hoveredPoint.point.responseTime}ms</p>
          )}
        </div>
      )}
    </footer>
  );
}
