'use client';

import { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  User, Mail, Phone, Building, MapPin, Calendar, Shield, CreditCard, 
  Trash2, AlertTriangle, Eye, EyeOff, Save, X, CheckCircle, Settings,
  Bell, Lock, Key, Download, Upload, Edit, LogOut, RotateCcw, Loader2,
  Sparkles, FileText
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useData } from '@/contexts/DataContext';
import ToastContainer from '@/components/Toast';
import ModernSidebar from '@/components/ModernSidebar';
import dynamic from 'next/dynamic';

// Lazy load heavy components
const ConfirmationModal = dynamic(() => import('@/components/ConfirmationModal'), {
  loading: () => null
});

const FastInvoiceModal = dynamic(() => import('@/components/FastInvoiceModal'), {
  loading: () => null
});

const QuickInvoiceModal = dynamic(() => import('@/components/QuickInvoiceModal'), {
  loading: () => null
});

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  createdAt: string;
  lastLogin: string;
  subscription: {
    plan: 'free' | 'pro' | 'enterprise';
    status: 'active' | 'cancelled' | 'expired';
    nextBilling?: string;
  };
}

// Memoized profile info section
const ProfileInfoSection = memo(({ profile, isEditing, formData, onFormChange, onSave, onCancel }: {
  profile: UserProfile | null;
  isEditing: boolean;
  formData: any;
  onFormChange: (field: string, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) => {
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  if (!profile) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
        {!isEditing ? (
          <button
            onClick={() => {/* Handle edit */}}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>
        ) : (
          <div className="flex space-x-3">
            <button
              onClick={onSave}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
            <button
              onClick={onCancel}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-700 text-sm font-medium transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
          {isEditing ? (
            <input
              type="text"
              value={formData.name}
              onChange={(e) => onFormChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
            />
          ) : (
            <p className="text-gray-900">{profile.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          {isEditing ? (
            <input
              type="email"
              value={formData.email}
              onChange={(e) => onFormChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
            />
          ) : (
            <p className="text-gray-900">{profile.email}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
          {isEditing ? (
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => onFormChange('phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
            />
          ) : (
            <p className="text-gray-900">{profile.phone || 'Not provided'}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
          {isEditing ? (
            <input
              type="text"
              value={formData.company}
              onChange={(e) => onFormChange('company', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
            />
          ) : (
            <p className="text-gray-900">{profile.company || 'Not provided'}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
          {isEditing ? (
            <textarea
              value={formData.address}
              onChange={(e) => onFormChange('address', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors resize-none"
            />
          ) : (
            <p className="text-gray-900">{profile.address || 'Not provided'}</p>
          )}
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>Member since {formatDate(profile.createdAt)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>Last login {formatDate(profile.lastLogin)}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

ProfileInfoSection.displayName = 'ProfileInfoSection';

export default function ProfilePage() {
  const { user, loading, getAuthHeaders } = useAuth();
  const { toasts, removeToast, showSuccess, showError } = useToast();
  const { refreshInvoices, refreshClients, clearData } = useData();
  const router = useRouter();
  const pathname = usePathname();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteProgressModal, setShowDeleteProgressModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showFormatModal, setShowFormatModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingProgress, setIsDeletingProgress] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  
  // Invoice modal states
  const [showInvoiceTypeSelection, setShowInvoiceTypeSelection] = useState(false);
  const [showFastInvoice, setShowFastInvoice] = useState(false);
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  
  // Create invoice handler
  const handleCreateInvoice = useCallback(() => {
    setShowInvoiceTypeSelection(true);
  }, []);

  // Handle invoice type selection
  const handleSelectFastInvoice = useCallback(() => {
    setShowInvoiceTypeSelection(false);
    setSelectedInvoice(null);
    setShowFastInvoice(true);
  }, []);

  const handleSelectDetailedInvoice = useCallback(() => {
    setShowInvoiceTypeSelection(false);
    setSelectedInvoice(null);
    setShowCreateInvoice(true);
  }, []);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Load profile data
  const loadProfile = useCallback(async () => {
    if (!user || loading) return;
    
    try {
      setIsLoading(true);
      const headers = await getAuthHeaders();
      const response = await fetch('/api/profile', {
        headers
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setFormData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          company: data.company || '',
          address: data.address || ''
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      showError('Failed to load profile data');
    } finally {
      setIsLoading(false);
      setHasLoadedData(true);
    }
  }, [user, loading, getAuthHeaders, showError]);

  // Load data on mount - prevent infinite loop with hasLoadedData flag
  useEffect(() => {
    if (user && !loading && !hasLoadedData) {
      setHasLoadedData(true); // Set flag immediately to prevent re-runs
      loadProfile();
    }
  }, [user, loading, hasLoadedData, loadProfile]);

  // Update profile
  const handleUpdateProfile = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        showSuccess('Profile updated successfully');
        setIsEditing(false);
        loadProfile();
      } else {
        const data = await response.json();
        showError(data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showError('Failed to update profile');
    }
  };

  // Change password
  const handleChangePassword = async () => {
    if (passwordData.new !== passwordData.confirm) {
      showError('New passwords do not match');
      return;
    }

    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/profile/password', {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: passwordData.current,
          newPassword: passwordData.new
        })
      });

      if (response.ok) {
        showSuccess('Password updated successfully');
        setShowPasswordModal(false);
        setPasswordData({ current: '', new: '', confirm: '' });
      } else {
        const data = await response.json();
        showError(data.error || 'Failed to update password');
      }
    } catch (error) {
      console.error('Error updating password:', error);
      showError('Failed to update password');
    }
  };

  // Delete progress (keep account, delete all data)
  const handleDeleteProgress = async () => {
    try {
      setIsDeletingProgress(true);
      const headers = await getAuthHeaders();
      const response = await fetch('/api/profile/delete-progress', {
        method: 'DELETE',
        headers
      });

      if (response.ok) {
        showSuccess('All data deleted successfully. Your account is now fresh!');
        // Clear and refresh global data to show empty state immediately
        try {
          clearData();
          await Promise.all([
            refreshInvoices(),
            refreshClients()
          ]);
        } catch {}
        // Ensure any server components revalidate
        router.refresh();
        setShowDeleteProgressModal(false);
      } else {
        const data = await response.json();
        showError(data.error || 'Failed to delete progress');
      }
    } catch (error) {
      console.error('Error deleting progress:', error);
      showError('Failed to delete progress');
    } finally {
      setIsDeletingProgress(false);
      setShowDeleteProgressModal(false);
    }
  };

  // Delete account (complete account deletion)
  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      const headers = await getAuthHeaders();
      const response = await fetch('/api/profile/delete', {
        method: 'DELETE',
        headers
      });

      if (response.ok) {
        showSuccess('Account deleted successfully');
        router.push('/auth');
      } else {
        const data = await response.json();
        showError(data.error || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      showError('Failed to delete account');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // Export data
  const handleExportData = async () => {
    try {
      setIsExporting(true);
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/profile/export?format=${selectedFormat}`, { headers });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Set filename based on format
        const format = selectedFormat.toUpperCase();
        const date = new Date().toISOString().split('T')[0];
        a.download = `business-report-${date}.${selectedFormat}`;
        
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showSuccess(`Data exported successfully as ${format}`);
        setShowFormatModal(false);
        setShowExportModal(false);
      } else {
        showError('Failed to export data');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      showError('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  // Show format selection
  const handleShowFormatSelection = () => {
    setShowFormatModal(true);
  };

  // Only show loading spinner if user is not authenticated yet
  if (loading && !user) {
    return (
      <div className="min-h-screen transition-colors duration-200 bg-white">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (!user && !loading) {
    // Redirect to auth page with session expired feedback
    window.location.href = '/auth?message=session_expired';
    return null;
  }


  return (
    <div className="min-h-screen transition-colors duration-200 bg-white">
      <div className="flex h-screen">
        <ModernSidebar 
          isDarkMode={false}
          onToggleDarkMode={() => {}}
          onCreateInvoice={handleCreateInvoice}
        />
        
        <main className="flex-1 lg:ml-0 overflow-y-auto scroll-smooth custom-scrollbar">
          <div className="pt-16 lg:pt-4 p-4 sm:p-6 lg:p-8">
            {/* Profile Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-xl sm:text-2xl font-semibold" style={{color: '#1f2937'}}>
                  Profile Settings
                </h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Information */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="font-heading text-xl font-semibold" style={{color: '#1f2937'}}>
                        Personal Information
                      </h2>
                      {!isEditing ? (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setIsEditing(false)}
                            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 transition-colors cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                            <span>Cancel</span>
                          </button>
                          <button
                            onClick={handleUpdateProfile}
                            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer"
                          >
                            <Save className="w-4 h-4" />
                            <span>Save</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Full Name
                          </label>
                          {isEditing ? (
                            <input
                              type="text"
                              value={formData.name}
                              onChange={(e) => setFormData({...formData, name: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
                            />
                          ) : (
                            <p className="text-gray-900">{profile?.name || 'Not provided'}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address
                          </label>
                          {isEditing ? (
                            <input
                              type="email"
                              value={formData.email}
                              onChange={(e) => setFormData({...formData, email: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
                            />
                          ) : (
                            <p className="text-gray-900">{profile?.email || 'Not provided'}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number
                          </label>
                          {isEditing ? (
                            <input
                              type="tel"
                              value={formData.phone}
                              onChange={(e) => setFormData({...formData, phone: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
                            />
                          ) : (
                            <p className="text-gray-900">{profile?.phone || 'Not provided'}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Company
                          </label>
                          {isEditing ? (
                            <input
                              type="text"
                              value={formData.company}
                              onChange={(e) => setFormData({...formData, company: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
                            />
                          ) : (
                            <p className="text-gray-900">{profile?.company || 'Not provided'}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Address
                        </label>
                        {isEditing ? (
                          <textarea
                            value={formData.address}
                            onChange={(e) => setFormData({...formData, address: e.target.value})}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
                          />
                        ) : (
                          <p className="text-gray-900">{profile?.address || 'Not provided'}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Security - Moved from right column */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="font-heading text-lg font-semibold mb-4" style={{color: '#1f2937'}}>
                      Security
                    </h3>
                    <div className="space-y-3">
                      <button
                        onClick={() => setShowPasswordModal(true)}
                        className="w-full flex items-center space-x-3 p-3 text-left hover:bg-blue-50 rounded-lg transition-colors text-blue-600 cursor-pointer"
                      >
                        <Lock className="w-5 h-5" />
                        <div>
                          <p className="font-medium">Change Password</p>
                          <p className="text-sm text-blue-500">Update your account password</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Data Management - Moved from right column */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="font-heading text-lg font-semibold mb-4" style={{color: '#1f2937'}}>
                      Data Management
                    </h3>
                    <div className="space-y-3">
                      <button
                        onClick={handleShowFormatSelection}
                        className="w-full flex items-center space-x-3 p-3 text-left hover:bg-green-50 rounded-lg transition-colors text-green-600 cursor-pointer"
                      >
                        <Download className="w-5 h-5" />
                        <div>
                          <p className="font-medium">Export Data</p>
                          <p className="text-sm text-green-500">Download in your preferred format</p>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Account Actions */}
                <div className="space-y-6">
                  {/* Subscription */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="font-heading text-lg font-semibold mb-4" style={{color: '#1f2937'}}>
                      Subscription
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 capitalize">
                            {profile?.subscription?.plan || 'Free'} Plan
                          </p>
                          <p className="text-sm text-gray-500">
                            {profile?.subscription?.status === 'active' ? 'Active' : 'Inactive'}
                          </p>
                        </div>
                        <button
                          onClick={() => setShowSubscriptionModal(true)}
                          className="text-indigo-600 hover:text-indigo-700 text-sm font-medium cursor-pointer"
                        >
                          Manage
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="bg-white rounded-lg border border-red-200 p-6">
                    <h3 className="font-heading text-lg font-semibold mb-4" style={{color: '#dc2626'}}>
                      Danger Zone
                    </h3>
                    <div className="space-y-3">
                      <button
                        onClick={() => setShowDeleteProgressModal(true)}
                        className="w-full flex items-center space-x-3 p-3 text-left hover:bg-orange-50 rounded-lg transition-colors text-orange-600 cursor-pointer"
                      >
                        <RotateCcw className="w-5 h-5" />
                        <div>
                          <p className="font-medium">Delete Progress</p>
                          <p className="text-sm text-orange-500">Keep account but delete all data</p>
                        </div>
                      </button>
                      <button
                        onClick={() => setShowDeleteModal(true)}
                        className="w-full flex items-center space-x-3 p-3 text-left hover:bg-red-50 rounded-lg transition-colors text-red-600 cursor-pointer"
                      >
                        <Trash2 className="w-5 h-5" />
                        <div>
                          <p className="font-medium">Delete Account</p>
                          <p className="text-sm text-red-500">Permanently delete your account</p>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      
      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading text-lg font-semibold" style={{color: '#1f2937'}}>
                Change Password
              </h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordData.current}
                    onChange={(e) => setPasswordData({...passwordData, current: e.target.value})}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                  >
                    {showPasswords.current ? (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordData.new}
                    onChange={(e) => setPasswordData({...passwordData, new: e.target.value})}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                  >
                    {showPasswords.new ? (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordData.confirm}
                    onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                  >
                    {showPasswords.confirm ? (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Progress Modal */}
      {showDeleteProgressModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                <RotateCcw className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold text-gray-900">
                  Delete Progress
                </h3>
                <p className="text-sm text-gray-500">
                  Keep account but delete all data
                </p>
              </div>
            </div>

            <p className="text-gray-700 mb-6">
              This will delete all your invoices, clients, and settings but keep your account. You can start fresh with a clean slate.
            </p>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowDeleteProgressModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProgress}
                disabled={isDeletingProgress}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isDeletingProgress ? 'Deleting...' : 'Delete Progress'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold text-gray-900">
                  Delete Account
                </h3>
                <p className="text-sm text-gray-500">
                  This action cannot be undone
                </p>
              </div>
            </div>

            <p className="text-gray-700 mb-6">
              Are you sure you want to delete your account? This will permanently remove all your data including invoices, clients, and settings.
            </p>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Modal */}
      {showSubscriptionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading text-lg font-semibold" style={{color: '#1f2937'}}>
                Subscription Management
              </h3>
              <button
                onClick={() => setShowSubscriptionModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Free Plan</h4>
                <p className="text-sm text-gray-500 mb-4">Basic features for getting started</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Up to 5 invoices</li>
                  <li>• Basic templates</li>
                  <li>• Email support</li>
                </ul>
              </div>

              <div className="border border-indigo-200 rounded-lg p-4 bg-indigo-50">
                <h4 className="font-semibold text-gray-900 mb-2">Pro Plan</h4>
                <p className="text-sm text-gray-500 mb-4">Advanced features for professionals</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Unlimited invoices</li>
                  <li>• Custom templates</li>
                  <li>• Priority support</li>
                  <li>• Advanced analytics</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowSubscriptionModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  showSuccess('Subscription management coming soon!');
                  setShowSubscriptionModal(false);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer"
              >
                Upgrade Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Format Selection Modal */}
      {showFormatModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading text-lg font-semibold" style={{color: '#1f2937'}}>
                Choose Export Format
              </h3>
              <button
                onClick={() => setShowFormatModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-gray-700 mb-6">
              Select your preferred file format for the business report:
            </p>
            
            <div className="space-y-3 mb-6">
              <label className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="csv"
                  checked={selectedFormat === 'csv'}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="w-4 h-4 text-indigo-600"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-green-600 font-bold text-sm">CSV</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">CSV (Excel Compatible)</p>
                      <p className="text-sm text-gray-500">Best for spreadsheets and accounting software</p>
                    </div>
                  </div>
                </div>
              </label>


              <label className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="pdf"
                  checked={selectedFormat === 'pdf'}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="w-4 h-4 text-indigo-600"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <span className="text-red-600 font-bold text-xs">PDF</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">PDF Report</p>
                      <p className="text-sm text-gray-500">Professional formatted report for printing</p>
                    </div>
                  </div>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="json"
                  checked={selectedFormat === 'json'}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="w-4 h-4 text-indigo-600"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <span className="text-yellow-600 font-bold text-xs">JSON</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">JSON Data</p>
                      <p className="text-sm text-gray-500">Raw data for developers and integrations</p>
                    </div>
                  </div>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowFormatModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExportData}
                disabled={isExporting}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isExporting ? 'Exporting...' : 'Export Data'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Data Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading text-lg font-semibold" style={{color: '#1f2937'}}>
                Export Data
              </h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-gray-700 mb-6">
              Download a comprehensive business financial report that includes:
            </p>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Tax-Ready Invoice Details</p>
                  <p className="text-sm text-gray-600">Complete invoice breakdown with tax calculations</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Payment Reconciliation</p>
                  <p className="text-sm text-gray-600">Outstanding amounts and payment tracking</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Client Analysis</p>
                  <p className="text-sm text-gray-600">Revenue per client and business insights</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Executive Summary</p>
                  <p className="text-sm text-gray-600">Key business metrics and performance indicators</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Excel-Compatible Format</p>
                  <p className="text-sm text-gray-600">CSV format ready for accounting software</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExportData}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer"
              >
                Export Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Type Selection Modal */}
      {showInvoiceTypeSelection && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-md w-full p-6">
            <div className="text-center mb-6">
              <h3 className="font-heading text-xl font-semibold mb-2" style={{color: '#1f2937'}}>
                Choose Invoice Type
              </h3>
              <p className="text-gray-600 text-sm">
                Select the type of invoice you want to create
              </p>
            </div>
            
            <div className="space-y-3">
              {/* Fast Invoice Option */}
              <button
                onClick={handleSelectFastInvoice}
                className="w-full p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200 group cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="text-left flex-1">
                    <h4 className="font-medium text-gray-900">Fast Invoice</h4>
                    <p className="text-sm text-gray-500">Quick invoice with minimal details</p>
                  </div>
                  <div className="text-indigo-600 group-hover:text-indigo-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>

              {/* Detailed Invoice Option */}
              <button
                onClick={handleSelectDetailedInvoice}
                className="w-full p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200 group cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                    <FileText className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="text-left flex-1">
                    <h4 className="font-medium text-gray-900">Detailed Invoice</h4>
                    <p className="text-sm text-gray-500">Complete invoice with all details and customization</p>
                  </div>
                  <div className="text-indigo-600 group-hover:text-indigo-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            </div>

            {/* Cancel Button */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowInvoiceTypeSelection(false)}
                className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fast Invoice Modal */}
      {showFastInvoice && (
        <FastInvoiceModal
          isOpen={showFastInvoice}
          onClose={() => {
            setShowFastInvoice(false);
            setSelectedInvoice(null);
          }}
          user={user!}
          onSuccess={() => {
            setShowFastInvoice(false);
            setSelectedInvoice(null);
            showSuccess('Invoice created successfully!');
          }}
          getAuthHeaders={getAuthHeaders}
          isDarkMode={false}
          editingInvoice={selectedInvoice}
          showSuccess={showSuccess}
          showError={showError}
          showWarning={showError}
        />
      )}

      {/* Detailed Invoice Modal */}
      {showCreateInvoice && (
        <QuickInvoiceModal
          isOpen={showCreateInvoice}
          onClose={() => {
            setShowCreateInvoice(false);
            setSelectedInvoice(null);
          }}
          onSuccess={() => {
            setShowCreateInvoice(false);
            setSelectedInvoice(null);
            showSuccess('Invoice created successfully!');
          }}
          getAuthHeaders={getAuthHeaders}
          isDarkMode={false}
          editingInvoice={selectedInvoice}
          showSuccess={showSuccess}
          showError={showError}
          showWarning={showError}
        />
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
