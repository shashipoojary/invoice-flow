'use client';

import { useState, useEffect, useCallback, useMemo, useRef, useTransition } from 'react';
import Image from 'next/image';
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
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface ModernSidebarProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onCreateInvoice: () => void;
}

const ModernSidebar = ({ 
  isDarkMode, 
  onToggleDarkMode, 
  onCreateInvoice 
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
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  // Refs for performance optimization
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const animationFrameRef = useRef<number | null>(null);
  const lastClickTime = useRef<number>(0);

  // Auto-collapse on mobile and handle resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(true);
        setIsMobileOpen(false); // Close mobile menu on resize
      } else {
        setIsMobileOpen(false); // Always close mobile menu on desktop
        // Restore saved collapse state on desktop
        const savedCollapsed = localStorage.getItem('sidebarCollapsed');
        if (savedCollapsed !== null) {
          const shouldCollapse = JSON.parse(savedCollapsed);
          setIsCollapsed(shouldCollapse);
        }
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
      localStorage.removeItem('theme');
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
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    // Save to localStorage only on desktop
    if (window.innerWidth >= 1024) {
      localStorage.setItem('sidebarCollapsed', JSON.stringify(newCollapsed));
    }
  };

  const sidebarContent = (
    <div className={`h-full flex flex-col transition-all duration-300 ease-in-out ${
      isDarkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'
    } ${isCollapsed ? 'w-16' : 'w-80'}`}>
      
      {/* Header */}
      <div className={`flex items-center transition-all duration-300 ease-in-out ${isCollapsed ? 'justify-center p-4' : 'justify-between p-6'} border-b ${
        isDarkMode ? 'border-gray-800' : 'border-gray-200'
      }`}>
        {!isCollapsed ? (
          <div className="flex items-center justify-center w-full">
        <Image
          src="/logo-main-black.png"
          alt="FlowInvoicer Logo"
          width={420}
          height={140}
          className="h-40 w-auto max-w-full"
        />
          </div>
        ) : (
          <button
            onClick={handleToggleCollapse}
            className="flex items-center justify-center w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors bg-transparent border-none outline-none overflow-hidden cursor-pointer"
            style={{ backgroundColor: 'transparent' }}
          >
        <Image
          src="/sidebar-logo.png"
          alt="FlowInvoicer Sidebar Logo - Collapsed"
          width={400}
          height={160}
          className="w-20 h-20 object-contain"
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none'
          }}
        />
          </button>
        )}

        {/* Collapse Toggle - Desktop Only */}
        {!isCollapsed && (
          <button
            onClick={handleToggleCollapse}
            className={`hidden lg:flex items-center justify-center w-8 h-8 rounded-lg transition-colors cursor-pointer ${
              isDarkMode 
                ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-300' 
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Quick Actions */}
      {!isCollapsed && (
        <div className="px-6 py-4 transition-all duration-300 ease-in-out">
          <button
            onClick={() => {
              onCreateInvoice();
              // Close mobile menu when creating invoice
              if (window.innerWidth < 1024) {
                setIsMobileOpen(false);
              }
            }}
            className={`w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-lg transition-colors text-sm font-medium cursor-pointer ${
              isDarkMode 
                ? 'bg-white text-black hover:bg-gray-200' 
                : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Create Invoice</span>
          </button>
        </div>
      )}

      {isCollapsed && (
        <div className="px-3 py-4 transition-all duration-300 ease-in-out">
          <button
            onClick={() => {
              onCreateInvoice();
              // Close mobile menu when creating invoice
              if (window.innerWidth < 1024) {
                setIsMobileOpen(false);
              }
            }}
            className={`w-full flex items-center justify-center p-3 rounded-lg transition-colors cursor-pointer ${
              isDarkMode 
                ? 'bg-white text-black hover:bg-gray-200' 
                : 'bg-black text-white hover:bg-gray-800'
            }`}
            title="Create Invoice"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      )}

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
                className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3' : 'space-x-3 px-3 py-3'} rounded-lg group disabled:opacity-50 disabled:cursor-wait transition-colors duration-200 cursor-pointer ${
                  isActive
                    ? isDarkMode
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-100 text-black'
                    : isDarkMode
                    ? 'text-gray-200 hover:text-white hover:bg-gray-800'
                    : 'text-gray-800 hover:text-black hover:bg-gray-50'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                  {isNavigating ? (
                    <Loader2 className="w-4 h-4 loading-spinner" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                
                {!isCollapsed && (
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm">{item.label}</div>
                    <div className={`text-xs ${
                      isActive 
                        ? isDarkMode ? 'text-gray-200' : 'text-gray-700'
                        : isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {item.description}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* User Profile & Actions */}
      <div className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'p-3' : 'p-6'} border-t ${
        isDarkMode ? 'border-gray-800' : 'border-gray-200'
      }`}>
        {!isCollapsed ? (
          <div className="space-y-4">
            {/* Profile Button */}
            <button
              ref={(el) => {
                if (el) {
                  buttonRefs.current.set('/dashboard/profile', el);
                }
              }}
              data-route="/dashboard/profile"
              onClick={() => handleNavigation('/dashboard/profile')}
              disabled={isPending}
              className={`w-full flex items-center space-x-3 p-3 rounded-lg border transition-colors duration-200 cursor-pointer ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' 
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isDarkMode 
                  ? 'bg-white' 
                  : 'bg-indigo-600'
              }`}>
                <User className={`w-5 h-5 ${
                  isDarkMode 
                    ? 'text-indigo-600' 
                    : 'text-white'
                }`} />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className={`font-medium text-sm truncate ${
                  isDarkMode 
                    ? 'text-white' 
                    : 'text-gray-900'
                }`}>
                  {user?.name || 'User'}
                </div>
                <div className={`text-xs truncate ${
                  isDarkMode 
                    ? 'text-gray-300' 
                    : 'text-gray-600'
                }`}>
                  View Profile
                </div>
              </div>
            </button>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onToggleDarkMode}
                className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-lg text-sm font-medium border transition-colors duration-200 cursor-pointer ${
                  isDarkMode 
                    ? 'bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700' 
                    : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Theme</span>
              </button>
              
              <button
                onClick={handleSignOut}
                disabled={isLoggingOut}
                className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-lg text-sm font-medium border disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer ${
                  isDarkMode 
                    ? 'text-red-400 bg-red-900/20 border-red-800 hover:bg-red-900/30' 
                    : 'text-red-600 bg-white border-red-200 hover:bg-red-50'
                }`}
              >
                {isLoggingOut ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4" />
                )}
                <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 transition-all duration-300 ease-in-out">
            <button
              onClick={onToggleDarkMode}
              className={`w-full flex items-center justify-center p-3 rounded-lg border transition-colors duration-200 cursor-pointer ${
                isDarkMode 
                  ? 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700' 
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
              title="Toggle Theme"
            >
              <Settings className="w-5 h-5" />
            </button>
            
            <button
              onClick={handleSignOut}
              className={`w-full flex items-center justify-center p-3 rounded-lg border transition-colors duration-200 cursor-pointer ${
                isDarkMode 
                  ? 'text-red-400 bg-red-900/20 border-red-800 hover:bg-red-900/30' 
                  : 'text-red-600 bg-white border-red-200 hover:bg-red-50'
              }`}
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
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

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className={`lg:hidden fixed top-4 left-4 z-50 p-3 rounded-xl shadow-lg border transition-all duration-150 ease-out hover:scale-105 active:scale-95 cursor-pointer ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' 
            : 'bg-white border-gray-200 hover:bg-gray-50'
        }`}
      >
        <Menu className={`w-5 h-5 ${
          isDarkMode 
            ? 'text-gray-300' 
            : 'text-gray-700'
        }`} />
      </button>

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full z-50 transition-all duration-300 ease-in-out lg:relative lg:z-auto ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {sidebarContent}
      </div>

      {/* Mobile Close Button */}
      {isMobileOpen && (
        <button
          onClick={() => setIsMobileOpen(false)}
          className={`lg:hidden fixed top-4 right-4 z-50 p-3 rounded-xl shadow-lg border transition-colors cursor-pointer ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' 
              : 'bg-white border-gray-200 hover:bg-gray-50'
          }`}
        >
          <X className={`w-5 h-5 ${
            isDarkMode 
              ? 'text-gray-300' 
              : 'text-gray-700'
          }`} />
        </button>
      )}
    </>
  );
};

export default ModernSidebar;
