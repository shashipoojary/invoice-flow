'use client';

import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
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

  // Auto-collapse on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(true);
      }
    };
    
    handleResize();
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
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const sidebarContent = (
    <div className={`h-full flex flex-col transition-all duration-300 ${
      isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
    } ${isCollapsed ? 'w-16' : 'w-80'}`}>
      
      {/* Header */}
      <div className={`flex items-center ${isCollapsed ? 'justify-center p-4' : 'justify-between p-6'} border-b ${
        isDarkMode ? 'border-slate-800' : 'border-slate-200'
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
            onClick={() => setIsCollapsed(false)}
            className="flex items-center justify-center w-full p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hidden lg:flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
              isDarkMode 
                ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-300' 
                : 'hover:bg-slate-100 text-slate-500 hover:text-slate-700'
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
            onClick={onCreateInvoice}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>Create Invoice</span>
          </button>
        </div>
      )}

      {isCollapsed && (
        <div className="px-4 py-4">
          <button
            onClick={onCreateInvoice}
            className="w-full flex items-center justify-center p-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className={`flex-1 ${isCollapsed ? 'px-2 py-4' : 'px-6 py-4'}`}>
        <div className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as 'dashboard' | 'invoices' | 'clients' | 'settings')}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2 py-3' : 'space-x-3 px-3 py-3'} rounded-lg transition-colors group ${
                  isActive
                    ? isDarkMode
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-900'
                    : isDarkMode
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
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
                        ? isDarkMode ? 'text-slate-300' : 'text-slate-600'
                        : isDarkMode ? 'text-slate-500' : 'text-slate-500'
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
      <div className={`${isCollapsed ? 'p-2' : 'p-6'} border-t ${
        isDarkMode ? 'border-slate-800' : 'border-slate-200'
      }`}>
        {!isCollapsed ? (
          <div className="space-y-4">
            {/* User Info */}
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
              <div className="w-10 h-10 bg-slate-900 dark:bg-white rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white dark:text-slate-900" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-slate-900 dark:text-white truncate">
                  {user?.name || 'User'}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {user?.email?.split('@')[0]}@...
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onToggleDarkMode}
                className="flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <Settings className="w-4 h-4" />
                <span>Theme</span>
              </button>
              
              <button
                onClick={handleSignOut}
                className="flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-red-600 bg-red-50 hover:bg-red-100"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <button
              onClick={onToggleDarkMode}
              className="w-full flex items-center justify-center p-2 rounded-lg transition-colors bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              title="Toggle Theme"
            >
              <Settings className="w-4 h-4" />
            </button>
            
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center p-2 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
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
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700"
      >
        <Menu className="w-5 h-5" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}} />
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
          className="lg:hidden fixed top-4 right-4 z-50 p-2 rounded-lg bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700"
        >
          <X className="w-5 h-5" style={{color: isDarkMode ? '#f3f4f6' : '#1f2937'}} />
        </button>
      )}
    </>
  );
};

export default ModernSidebar;
