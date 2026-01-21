'use client';

import { useState, useEffect, useCallback, useMemo, useRef, useTransition } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  ChevronLeft, 
  Menu,
  X,
  User,
  LogOut,
  Plus,
  Loader2,
  Mail,
  ClipboardCheck,
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface ModernSidebarProps {
  onCreateInvoice: () => void;
  onTransitionStart?: () => void;
  onTransitionEnd?: () => void;
}

const ModernSidebar = ({ 
  onCreateInvoice,
  onTransitionStart,
  onTransitionEnd
}: ModernSidebarProps) => {
  // Initialize collapsed state from localStorage immediately to prevent flash
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    if (window.innerWidth < 1024) return true; // Auto-collapse on mobile
    const savedCollapsed = localStorage.getItem('sidebarCollapsed');
    return savedCollapsed !== null ? JSON.parse(savedCollapsed) : false;
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= 1024;
  });
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  // Refs for performance optimization
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const animationFrameRef = useRef<number | null>(null);
  const lastClickTime = useRef<number>(0);

  // Auto-collapse on mobile and handle resize
  useEffect(() => {
    // Track actual window dimensions to distinguish real resize from layout changes
    let lastWindowWidth = window.innerWidth;
    let lastWindowHeight = window.innerHeight;
    let resizeTimeout: NodeJS.Timeout | null = null;
    let isTransitioning = false;
    
    // Track when sidebar transitions start/end to ignore resize events during transitions
    let transitionCount = 0;
    const handleTransitionStart = () => {
      transitionCount++;
      if (transitionCount === 1) {
        isTransitioning = true;
        // Only log once per transition cycle
        console.log('🚫 Resize handler: Sidebar transition started - ignoring resize events');
      }
    };
    
    const handleTransitionEnd = () => {
      transitionCount--;
      if (transitionCount === 0) {
        // Delay clearing the flag to catch any resize events that fire right after transition
        setTimeout(() => {
          isTransitioning = false;
          // Only log once per transition cycle
          console.log('✅ Resize handler: Sidebar transition ended - resuming resize handling');
        }, 100);
      }
    };
    
    const handleResize = () => {
      const timestamp = performance.now();
      const currentWindowWidth = window.innerWidth;
      const currentWindowHeight = window.innerHeight;
      
      // Ignore resize events during sidebar transitions
      if (isTransitioning) {
        console.log('🟡 RESIZE EVENT IGNORED (sidebar transitioning):', {
          timestamp: `${timestamp.toFixed(2)}ms`,
          windowWidth: currentWindowWidth,
          windowHeight: currentWindowHeight,
          reason: 'Sidebar animation in progress'
        });
        return;
      }
      
      // Use a threshold to account for sub-pixel differences (browser rounding)
      const widthDiff = Math.abs(currentWindowWidth - lastWindowWidth);
      const heightDiff = Math.abs(currentWindowHeight - lastWindowHeight);
      const threshold = 1; // Ignore changes less than 1px (sub-pixel differences)
      
      // Only proceed if window size actually changed significantly
      if (widthDiff < threshold && heightDiff < threshold) {
        console.log('🟡 RESIZE EVENT IGNORED (layout change, not window resize):', {
          timestamp: `${timestamp.toFixed(2)}ms`,
          windowWidth: currentWindowWidth,
          windowHeight: currentWindowHeight,
          widthDiff,
          heightDiff,
          reason: 'Dimensions unchanged - likely layout recalculation'
        });
        return;
      }
      
      // Debounce resize handler to prevent multiple rapid fires
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      
      resizeTimeout = setTimeout(() => {
        console.group('🟠 WINDOW RESIZE EVENT');
        console.log('📐 Window Size Change:', {
          timestamp: `${timestamp.toFixed(2)}ms`,
          from: { width: lastWindowWidth, height: lastWindowHeight },
          to: { width: currentWindowWidth, height: currentWindowHeight },
          delta: {
            width: currentWindowWidth - lastWindowWidth,
            height: currentWindowHeight - lastWindowHeight
          }
        });
        
        // Update tracked dimensions
        lastWindowWidth = currentWindowWidth;
        lastWindowHeight = currentWindowHeight;
        
        const isDesktopNow = currentWindowWidth >= 1024;
        console.log('💻 Desktop Check:', {
          isDesktop: isDesktopNow,
          threshold: 1024,
          currentWidth: currentWindowWidth
        });
        
        // Only update state if it actually changed
        setIsDesktop(prev => {
          if (prev !== isDesktopNow) {
            return isDesktopNow;
          }
          return prev;
        });
        
        if (!isDesktopNow) {
          console.log('📱 Mobile Mode - Collapsing sidebar');
          setIsCollapsed(true);
          setIsMobileOpen(false); // Close mobile menu on resize
        } else {
          setIsMobileOpen(false); // Always close mobile menu on desktop
          // Restore saved collapse state on desktop - but only if state would change
          const savedCollapsed = localStorage.getItem('sidebarCollapsed');
          if (savedCollapsed !== null) {
            const shouldCollapse = JSON.parse(savedCollapsed);
            console.log('💾 Restoring saved collapse state:', shouldCollapse);
            setIsCollapsed((prev: boolean) => {
              if (prev !== shouldCollapse) {
                return shouldCollapse;
              }
              return prev;
            });
          }
        }
        console.groupEnd();
      }, 150); // Debounce resize handler
    };
    
    // Set initial desktop state
    console.log('🚀 ModernSidebar: Initializing resize handler');
    handleResize();
    
    window.addEventListener('resize', handleResize, { passive: true });
    
    // Listen for sidebar transition events - use a ref to track the actual sidebar element
    // We'll set this up in a separate effect to avoid querying DOM during render
    let sidebarElementRef: HTMLElement | null = null;
    const setupTransitionListeners = () => {
      sidebarElementRef = document.querySelector('[data-sidebar-element]') as HTMLElement;
      if (sidebarElementRef) {
        // Only listen to 'width' property transitions to avoid child element noise
        const filteredTransitionStart = (e: TransitionEvent) => {
          if (e.propertyName === 'width' && e.target === sidebarElementRef) {
            handleTransitionStart();
          }
        };
        const filteredTransitionEnd = (e: TransitionEvent) => {
          if (e.propertyName === 'width' && e.target === sidebarElementRef) {
            handleTransitionEnd();
          }
        };
        sidebarElementRef.addEventListener('transitionstart', filteredTransitionStart);
        sidebarElementRef.addEventListener('transitionend', filteredTransitionEnd);
        
        return () => {
          if (sidebarElementRef) {
            sidebarElementRef.removeEventListener('transitionstart', filteredTransitionStart);
            sidebarElementRef.removeEventListener('transitionend', filteredTransitionEnd);
          }
        };
      }
      return () => {};
    };
    
    // Setup listeners after a brief delay to ensure DOM is ready
    const cleanupListeners = setupTransitionListeners();
    
    return () => {
      console.log('🧹 ModernSidebar: Cleaning up resize handler');
      window.removeEventListener('resize', handleResize);
      if (resizeTimeout) clearTimeout(resizeTimeout);
      cleanupListeners();
    };
  }, []); // Empty deps - only run on mount for resize listener

  // Memoized navigation items for better performance
  const navigationItems = useMemo(() => [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Overview & Analytics',
      route: '/dashboard'
    },
    {
      id: 'invoices',
      label: 'Invoices',
      icon: FileText,
      description: 'Manage Invoices',
      route: '/dashboard/invoices'
    },
    {
      id: 'estimates',
      label: 'Estimates',
      icon: ClipboardCheck,
      description: 'Manage Estimates',
      route: '/dashboard/estimates'
    },
    {
      id: 'reminders',
      label: 'Reminders',
      icon: Mail,
      description: 'Reminder History',
      route: '/dashboard/reminders'
    },
    {
      id: 'clients',
      label: 'Clients',
      icon: Users,
      description: 'Client Management',
      route: '/dashboard/clients'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      description: 'Preferences',
      route: '/dashboard/settings'
    },
  ], []);

  // Ultra-fast navigation handler with advanced optimizations
  const handleNavigation = useCallback((route: string) => {
    const now = Date.now();
    
    // Debounce rapid clicks (prevent spam clicking)
    if (now - lastClickTime.current < 100) {
      return;
    }
    lastClickTime.current = now;
    
    // Cancel any pending animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    // Use React 18's startTransition for non-blocking updates
    startTransition(() => {
      setNavigatingTo(route);
    });
    
    // Get button reference for instant feedback
    const button = buttonRefs.current.get(route);
    if (button) {
      // Simple visual feedback without scaling
      animationFrameRef.current = requestAnimationFrame(() => {
        button.classList.add('opacity-75', 'transition-none');
        
        // Remove classes after animation
        setTimeout(() => {
          button.classList.remove('opacity-75', 'transition-none');
        }, 150);
      });
    }
    
    // Preload route for instant navigation
    router.prefetch(route);
    
    // Navigate with priority
    router.push(route, { scroll: false });
    
    // Close mobile menu if open
    if (window.innerWidth < 1024) {
      setIsMobileOpen(false);
    }
    
    // Clear loading state after navigation
    setTimeout(() => {
      setNavigatingTo(null);
    }, 200);
  }, [router, startTransition]);

  // Removed mouse and touch event handlers to prevent hover issues

  // Memory optimization and cleanup
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      // Clear button refs to prevent memory leaks
      buttonRefs.current.clear();
    };
  }, []);

  // NOTE: Avoid prefetching all routes on mount to prevent blocking LCP
  // Prefetch happens on hover only (below) and during navigation

  const handleSignOut = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      const result = await signOut();
      if (result.error) {
        console.error('Sign out error:', result.error.message);
        // Still proceed with logout even if there's an error
      }
      // Clear any local state
      localStorage.removeItem('sidebarCollapsed');
      // Force page reload to ensure clean state
      window.location.href = '/auth';
    } catch (error) {
      console.error('Error signing out:', error);
      // Force logout even on error
      window.location.href = '/auth';
    } finally {
      setIsLoggingOut(false);
    }
  }, [signOut]);

  const handleToggleCollapse = () => {
    const timestamp = performance.now();
    const action = !isCollapsed ? 'EXPANDING' : 'COLLAPSING';
    const newCollapsed = !isCollapsed;
    
    console.group(`🔵 SIDEBAR ${action} - ${new Date().toISOString()}`);
    console.log('📊 Initial State:', {
      isCollapsed,
      isDesktop,
      isMobileOpen,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      timestamp: `${timestamp.toFixed(2)}ms`
    });
    console.log('🔄 State Change:', {
      from: isCollapsed ? 'collapsed (64px)' : 'expanded (320px)',
      to: newCollapsed ? 'collapsed (64px)' : 'expanded (320px)',
      widthChange: newCollapsed ? '-256px' : '+256px'
    });
    
    // Track before state update
    const beforeUpdate = performance.now();
    console.log('⏱️ Before setIsCollapsed:', `${beforeUpdate.toFixed(2)}ms`);
    
    // Use startTransition to mark this as non-urgent, preventing it from blocking the animation
    startTransition(() => {
      setIsCollapsed(newCollapsed);
    });
    
    // Save to localStorage only on desktop (synchronously, but it's fast)
    if (window.innerWidth >= 1024) {
      const storageStart = performance.now();
      localStorage.setItem('sidebarCollapsed', JSON.stringify(newCollapsed));
      const storageEnd = performance.now();
      console.log('💾 localStorage update:', {
        duration: `${(storageEnd - storageStart).toFixed(2)}ms`,
        value: newCollapsed
      });
    }
    
    // Track after state update
    requestAnimationFrame(() => {
      const afterUpdate = performance.now();
      console.log('⏱️ After setIsCollapsed (RAF):', `${afterUpdate.toFixed(2)}ms`);
      console.log('⏱️ Total time to RAF:', `${(afterUpdate - timestamp).toFixed(2)}ms`);
    });
    
    // Track animation completion
    setTimeout(() => {
      const animationEnd = performance.now();
      console.log('✅ Animation should be complete:', {
        duration: `${(animationEnd - timestamp).toFixed(2)}ms`,
        expectedDuration: '300ms',
        actualDuration: `${(animationEnd - timestamp).toFixed(2)}ms`
      });
      console.groupEnd();
    }, 300);
  };

  const sidebarContent = (
    <div className="h-full flex flex-col transition-all duration-300 ease-in-out bg-white border-gray-200 w-full">
      
      {/* Header */}
      <div className={`flex items-center transition-all duration-300 ease-in-out h-16 border-b border-gray-200 ${isCollapsed ? 'justify-center px-4' : 'justify-between px-6'}`}>
        {!isCollapsed ? (
          <div className="flex items-center justify-center w-full">
            <span className="text-2xl font-bold tracking-tight">
              <span className="text-gray-900">Flow</span>
              <span className="text-violet-600">Invoice</span>
            </span>
          </div>
        ) : (
          <button
            onClick={handleToggleCollapse}
            className="flex items-center justify-center w-full p-2 hover:bg-gray-100 transition-colors bg-transparent border-none outline-none overflow-hidden cursor-pointer"
            style={{ backgroundColor: 'transparent' }}
          >
            <span className="text-lg font-bold tracking-tight">
              <span className="text-gray-900">F</span>
              <span className="text-violet-600">i</span>
            </span>
          </button>
        )}

        {/* Collapse Toggle - Desktop Only */}
        {!isCollapsed && (
          <button
            onClick={handleToggleCollapse}
            className="hidden lg:flex items-center justify-center w-8 h-8 transition-colors cursor-pointer hover:bg-gray-100 text-gray-500 hover:text-gray-700"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Quick Actions - Always rendered to maintain height */}
      <div className={`transition-all duration-300 ease-in-out h-20 flex items-center ${isCollapsed ? 'px-3' : 'px-6'}`}>
        <button
          onClick={() => {
            onCreateInvoice();
            // Close mobile menu when creating invoice
            if (window.innerWidth < 1024) {
              setIsMobileOpen(false);
            }
          }}
          className={`w-full flex items-center justify-center transition-all duration-300 ease-in-out cursor-pointer bg-black text-white hover:bg-gray-800 overflow-hidden ${
            isCollapsed 
              ? 'p-3' 
              : 'px-6 py-3 space-x-2'
          }`}
          title={isCollapsed ? 'Create Invoice' : undefined}
        >
          <Plus className={`flex-shrink-0 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-5 h-5' : 'w-4 h-4'}`} />
          <span className={`transition-all duration-300 ease-in-out whitespace-nowrap ${
            isCollapsed 
              ? 'opacity-0 w-0 overflow-hidden' 
              : 'opacity-100 text-sm font-medium'
          }`}>
            Create Invoice
          </span>
        </button>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 transition-all duration-300 ease-in-out ${isCollapsed ? 'px-3 py-4' : 'px-6 py-4'}`}>
        <div className="space-y-3">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.route;
            
            const isNavigating = navigatingTo === item.route;
            
            return (
              <button
                key={item.id}
                ref={(el) => {
                  if (el) {
                    buttonRefs.current.set(item.route, el);
                  }
                }}
                data-route={item.route}
                onClick={() => handleNavigation(item.route)}
                disabled={isNavigating || isPending}
                className={`w-full flex items-center h-14 ${isCollapsed ? 'justify-center px-3' : 'space-x-3 px-3'} group transition-colors duration-200 cursor-pointer relative overflow-hidden ${
                  isActive
                    ? 'bg-gray-100 text-black'
                    : 'text-gray-800 hover:text-black hover:bg-gray-50'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                {/* Clean minimal loading - just subtle background and spinner */}
                {(isNavigating || isPending) && (
                  <div className="absolute inset-0 bg-gray-50/50"></div>
                )}
                <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center relative z-10">
                  {isNavigating ? (
                    <Loader2 className="w-4 h-4 animate-spin text-gray-700" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                
                <div className={`flex-1 text-left transition-all duration-300 relative z-10 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
                  <div className="font-medium text-sm whitespace-nowrap">{item.label}</div>
                  <div className={`text-xs whitespace-nowrap ${
                    isActive 
                      ? 'text-gray-700'
                      : 'text-gray-600'
                  }`}>
                    {item.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </nav>

      {/* User Profile & Actions */}
      <div className={`transition-all duration-300 ease-in-out border-t border-gray-200 ${isCollapsed ? 'p-3' : 'p-6'}`}>
        <div className="space-y-4">
          {/* Profile Button - Always rendered, text visibility controlled */}
          <button
            ref={(el) => {
              if (el) {
                buttonRefs.current.set('/dashboard/profile', el);
              }
            }}
            data-route="/dashboard/profile"
            onClick={() => handleNavigation('/dashboard/profile')}
            disabled={isPending}
            className={`w-full flex items-center h-14 border transition-colors duration-200 cursor-pointer bg-white border-gray-200 hover:bg-gray-50 ${isCollapsed ? 'justify-center px-2.5' : 'space-x-3 px-3'}`}
            title={isCollapsed ? (user?.name || 'View Profile') : undefined}
          >
            <div className={`rounded-full flex items-center justify-center bg-indigo-600 flex-shrink-0 ${isCollapsed ? 'w-8 h-8' : 'w-10 h-10'}`}>
              <User className={`text-white ${isCollapsed ? 'w-4 h-4' : 'w-5 h-5'}`} />
            </div>
            <div className={`flex-1 min-w-0 text-left transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
              <div className="font-medium text-sm truncate text-gray-900">
                {user?.name || 'User'}
              </div>
              <div className="text-xs truncate text-gray-600">
                View Profile
              </div>
            </div>
          </button>

          {/* Logout Button - Always rendered, text visibility controlled */}
          <button
            onClick={handleSignOut}
            disabled={isLoggingOut}
            className={`flex items-center justify-center border disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer text-red-600 bg-white border-red-200 hover:bg-red-50 ${isCollapsed ? 'w-full h-10 px-2.5' : 'w-full space-x-2 px-6 py-3'}`}
            title={isCollapsed ? 'Logout' : undefined}
          >
            {isLoggingOut ? (
              <Loader2 className={`animate-spin ${isCollapsed ? 'w-5 h-5' : 'w-4 h-4'}`} />
            ) : (
              <LogOut className={isCollapsed ? 'w-5 h-5' : 'w-4 h-4'} />
            )}
            {!isCollapsed && (
              <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Menu Button - Only render on mobile to prevent layout shift */}
      {!isDesktop && (
        <button
          onClick={() => setIsMobileOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-50 p-3 shadow-lg border transition-all duration-150 ease-out hover:scale-105 active:scale-95 cursor-pointer bg-white border-gray-200 hover:bg-gray-50"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 text-gray-700" />
        </button>
      )}

      {/* Sidebar - Always fixed, overlays content */}
      <div 
        data-sidebar-element="true"
        className={`fixed left-0 top-0 h-full z-50 transition-all duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{
          width: isCollapsed ? '64px' : '320px',
          willChange: 'width', // Hint to browser to optimize for width changes
        }}
        onTransitionStart={(e) => {
          // Only handle width transitions on the sidebar element itself, not children
          if (e.propertyName === 'width' && e.target === e.currentTarget) {
            // Dispatch custom event for resize handler to listen to
            e.currentTarget.dispatchEvent(new CustomEvent('transitionstart', { bubbles: true }));
            // Notify parent component
            onTransitionStart?.();
            console.log('🎬 SIDEBAR TRANSITION START:', {
              property: e.propertyName,
              width: window.getComputedStyle(e.currentTarget).width,
              timestamp: `${performance.now().toFixed(2)}ms`
            });
          }
        }}
        onTransitionEnd={(e) => {
          // Only handle width transitions on the sidebar element itself, not children
          if (e.propertyName === 'width' && e.target === e.currentTarget) {
            // Dispatch custom event for resize handler to listen to
            e.currentTarget.dispatchEvent(new CustomEvent('transitionend', { bubbles: true }));
            // Notify parent component
            onTransitionEnd?.();
            console.log('🏁 SIDEBAR TRANSITION END:', {
              property: e.propertyName,
              elapsedTime: e.elapsedTime,
              width: window.getComputedStyle(e.currentTarget).width,
              timestamp: `${performance.now().toFixed(2)}ms`
            });
          }
        }}
      >
        {sidebarContent}
      </div>
      
      {/* Spacer for desktop to maintain layout - matches sidebar width exactly */}
      {/* Only render on desktop to prevent any mobile layout shift */}
      {isDesktop && (
        <div 
          className="hidden lg:block transition-all duration-300 ease-in-out flex-shrink-0"
          style={{
            width: isCollapsed ? '64px' : '320px',
            minWidth: isCollapsed ? '64px' : '320px',
            maxWidth: isCollapsed ? '64px' : '320px',
            willChange: 'width', // Hint to browser to optimize for width changes
          }}
          onTransitionStart={(e) => {
            // Only handle width transitions on the spacer element itself, not children
            if (e.propertyName === 'width' && e.target === e.currentTarget) {
              console.log('🎬 SPACER TRANSITION START:', {
                property: e.propertyName,
                width: window.getComputedStyle(e.currentTarget).width,
                timestamp: `${performance.now().toFixed(2)}ms`
              });
            }
          }}
          onTransitionEnd={(e) => {
            // Only handle width transitions on the spacer element itself, not children
            if (e.propertyName === 'width' && e.target === e.currentTarget) {
              console.log('🏁 SPACER TRANSITION END:', {
                property: e.propertyName,
                elapsedTime: e.elapsedTime,
                width: window.getComputedStyle(e.currentTarget).width,
                timestamp: `${performance.now().toFixed(2)}ms`
              });
            }
          }}
        />
      )}

      {/* Mobile Close Button */}
      {isMobileOpen && (
        <button
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden fixed top-4 right-4 z-50 p-3 shadow-lg border transition-colors cursor-pointer bg-white border-gray-200 hover:bg-gray-50"
        >
          <X className="w-5 h-5 text-gray-700" />
        </button>
      )}
    </>
  );
};

export default ModernSidebar;
