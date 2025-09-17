'use client';

import { useState, useEffect } from 'react';
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
  Plus
} from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';

interface ModernSidebarProps {
  activeTab: 'dashboard' | 'invoices' | 'clients' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'invoices' | 'clients' | 'settings') => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onCreateInvoice: () => void;
}

const ModernSidebar = ({ 
  activeTab, 
  setActiveTab, 
  isDarkMode, 
  onToggleDarkMode, 
  onCreateInvoice 
}: ModernSidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user, signOut } = useAuth();

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
          setIsCollapsed(JSON.parse(savedCollapsed));
        }
      }
    };
    
    // Set initial state
    if (window.innerWidth < 1024) {
      setIsCollapsed(true);
    } else {
      // Load saved collapse state on desktop
      const savedCollapsed = localStorage.getItem('sidebarCollapsed');
      if (savedCollapsed !== null) {
        setIsCollapsed(JSON.parse(savedCollapsed));
      }
    }
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Overview & Analytics'
    },
    {
      id: 'invoices',
      label: 'Invoices',
      icon: FileText,
      description: 'Manage Invoices'
    },
    {
      id: 'clients',
      label: 'Clients',
      icon: Users,
      description: 'Client Management'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      description: 'Account & Preferences'
    }
  ];

  const handleSignOut = async () => {
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
    }
  };

  const handleToggleCollapse = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    // Save to localStorage only on desktop
    if (window.innerWidth >= 1024) {
      localStorage.setItem('sidebarCollapsed', JSON.stringify(newCollapsed));
    }
  };

  const sidebarContent = (
    <div className={`h-full flex flex-col transition-all duration-300 ${
      isDarkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'
    } ${isCollapsed ? 'w-16' : 'w-80'}`}>
      
      {/* Header */}
      <div className={`flex items-center ${isCollapsed ? 'justify-center p-4' : 'justify-between p-6'} border-b ${
        isDarkMode ? 'border-gray-800' : 'border-gray-200'
      }`}>
        {!isCollapsed ? (
          <div className="flex items-center justify-center w-full">
            <Image
              src={isDarkMode ? "/logowhite.png" : "/logoblack.png"}
              alt="InvoiceFlow Logo"
              width={360}
              height={140}
              className="h-36 w-auto max-w-full"
            />
          </div>
        ) : (
          <button
            onClick={handleToggleCollapse}
            className="flex items-center justify-center w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Image
              src={isDarkMode ? "/logowhite.png" : "/logoblack.png"}
              alt="InvoiceFlow Logo"
              width={32}
              height={32}
              className="w-8 h-8"
            />
          </button>
        )}

        {/* Collapse Toggle - Desktop Only */}
        {!isCollapsed && (
          <button
            onClick={handleToggleCollapse}
            className={`hidden lg:flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
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
        <div className="px-6 py-4">
          <button
            onClick={() => {
              onCreateInvoice();
              // Close mobile menu when creating invoice
              if (window.innerWidth < 1024) {
                setIsMobileOpen(false);
              }
            }}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>Create Invoice</span>
          </button>
        </div>
      )}

      {isCollapsed && (
        <div className="px-3 py-4">
          <button
            onClick={() => {
              onCreateInvoice();
              // Close mobile menu when creating invoice
              if (window.innerWidth < 1024) {
                setIsMobileOpen(false);
              }
            }}
            className={`w-full flex items-center justify-center p-4 rounded-lg transition-colors ${
              isDarkMode 
                ? 'bg-white text-black hover:bg-gray-200' 
                : 'bg-black text-white hover:bg-gray-800'
            }`}
            title="Create Invoice"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className={`flex-1 ${isCollapsed ? 'px-3 py-4' : 'px-6 py-4'}`}>
        <div className="space-y-3">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as 'dashboard' | 'invoices' | 'clients' | 'settings');
                  // Close mobile menu when navigating
                  if (window.innerWidth < 1024) {
                    setIsMobileOpen(false);
                  }
                }}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3' : 'space-x-3 px-3 py-3'} rounded-lg transition-colors group ${
                  isActive
                    ? isDarkMode
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-100 text-black'
                    : isDarkMode
                    ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                    : 'text-gray-600 hover:text-black hover:bg-gray-50'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                
                {!isCollapsed && (
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm">{item.label}</div>
                    <div className={`text-xs ${
                      isActive 
                        ? isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        : isDarkMode ? 'text-gray-500' : 'text-gray-500'
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
      <div className={`${isCollapsed ? 'p-3' : 'p-6'} border-t ${
        isDarkMode ? 'border-gray-800' : 'border-gray-200'
      }`}>
        {!isCollapsed ? (
          <div className="space-y-4">
            {/* User Info */}
            <div className={`flex items-center space-x-3 p-3 rounded-lg border ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
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
              <div className="flex-1 min-w-0">
                <div className={`font-medium text-sm truncate ${
                  isDarkMode 
                    ? 'text-white' 
                    : 'text-gray-900'
                }`}>
                  {user?.name || 'User'}
                </div>
                <div className={`text-xs truncate ${
                  isDarkMode 
                    ? 'text-gray-400' 
                    : 'text-gray-500'
                }`}>
                  {user?.email?.split('@')[0]}@...
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onToggleDarkMode}
                className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                  isDarkMode 
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border-gray-700' 
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Theme</span>
              </button>
              
              <button
                onClick={handleSignOut}
                className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                  isDarkMode 
                    ? 'text-red-400 bg-red-900/20 hover:bg-red-900/30 border-red-800' 
                    : 'text-red-600 bg-white hover:bg-red-50 border-red-200'
                }`}
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={onToggleDarkMode}
              className={`w-full flex items-center justify-center p-3 rounded-lg transition-colors border ${
                isDarkMode 
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border-gray-700' 
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200'
              }`}
              title="Toggle Theme"
            >
              <Settings className="w-5 h-5" />
            </button>
            
            <button
              onClick={handleSignOut}
              className={`w-full flex items-center justify-center p-3 rounded-lg transition-colors border ${
                isDarkMode 
                  ? 'text-red-400 bg-red-900/20 hover:bg-red-900/30 border-red-800' 
                  : 'text-red-600 bg-white hover:bg-red-50 border-red-200'
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
        className={`lg:hidden fixed top-4 left-4 z-50 p-3 rounded-xl shadow-lg border transition-colors ${
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
      <div className={`fixed left-0 top-0 h-full z-50 transition-transform duration-300 lg:relative lg:z-auto ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {sidebarContent}
      </div>

      {/* Mobile Close Button */}
      {isMobileOpen && (
        <button
          onClick={() => setIsMobileOpen(false)}
          className={`lg:hidden fixed top-4 right-4 z-50 p-3 rounded-xl shadow-lg border transition-colors ${
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
