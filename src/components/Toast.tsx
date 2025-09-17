import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const ToastComponent: React.FC<ToastProps> = ({ toast, onRemove }) => {
  const duration = toast.duration || 5000;

  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, duration, onRemove]);

  const getToastStyles = () => {
    switch (toast.type) {
      case 'success':
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-500" />,
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800',
          iconBg: 'bg-green-100 dark:bg-green-900/40'
        };
      case 'error':
        return {
          icon: <XCircle className="h-5 w-5 text-red-500" />,
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
          iconBg: 'bg-red-100 dark:bg-red-900/40'
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
          iconBg: 'bg-yellow-100 dark:bg-yellow-900/40'
        };
      case 'info':
        return {
          icon: <Info className="h-5 w-5 text-blue-500" />,
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          iconBg: 'bg-blue-100 dark:bg-blue-900/40'
        };
      default:
        return {
          icon: <Info className="h-5 w-5 text-blue-500" />,
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          iconBg: 'bg-blue-100 dark:bg-blue-900/40'
        };
    }
  };

  const styles = getToastStyles();

  return (
    <div className={`relative flex items-start space-x-3 p-4 rounded-lg border shadow-lg backdrop-blur-sm transition-all duration-300 transform ${styles.bgColor} ${styles.borderColor} animate-in slide-in-from-right-full`}>
      <div className={`flex-shrink-0 p-1 rounded-full ${styles.iconBg}`}>
        {styles.icon}
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
          {toast.title}
        </h4>
        {toast.message && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            {toast.message}
          </p>
        )}
      </div>
      
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
      >
        <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      </button>
    </div>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <ToastComponent
          key={toast.id}
          toast={toast}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
};

export default ToastContainer;
