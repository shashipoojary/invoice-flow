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
          icon: <CheckCircle className="h-5 w-5 text-white" />,
          bgColor: 'bg-green-600 dark:bg-green-700',
          borderColor: 'border-green-700 dark:border-green-600',
          iconBg: 'bg-green-700 dark:bg-green-800',
          titleColor: 'text-white',
          messageColor: 'text-green-100'
        };
      case 'error':
        return {
          icon: <XCircle className="h-5 w-5 text-white" />,
          bgColor: 'bg-red-600 dark:bg-red-700',
          borderColor: 'border-red-700 dark:border-red-600',
          iconBg: 'bg-red-700 dark:bg-red-800',
          titleColor: 'text-white',
          messageColor: 'text-red-100'
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="h-5 w-5 text-white" />,
          bgColor: 'bg-amber-600 dark:bg-amber-700',
          borderColor: 'border-amber-700 dark:border-amber-600',
          iconBg: 'bg-amber-700 dark:bg-amber-800',
          titleColor: 'text-white',
          messageColor: 'text-amber-100'
        };
      case 'info':
        return {
          icon: <Info className="h-5 w-5 text-white" />,
          bgColor: 'bg-blue-600 dark:bg-blue-700',
          borderColor: 'border-blue-700 dark:border-blue-600',
          iconBg: 'bg-blue-700 dark:bg-blue-800',
          titleColor: 'text-white',
          messageColor: 'text-blue-100'
        };
      default:
        return {
          icon: <Info className="h-5 w-5 text-white" />,
          bgColor: 'bg-blue-600 dark:bg-blue-700',
          borderColor: 'border-blue-700 dark:border-blue-600',
          iconBg: 'bg-blue-700 dark:bg-blue-800',
          titleColor: 'text-white',
          messageColor: 'text-blue-100'
        };
    }
  };

  const styles = getToastStyles();

  return (
    <div className={`relative flex items-start space-x-3 p-4 sm:p-4 rounded-lg border shadow-xl transition-all duration-300 transform ${styles.bgColor} ${styles.borderColor} animate-in slide-in-from-top-full sm:slide-in-from-right-full`}>
      <div className={`flex-shrink-0 p-2 rounded-full ${styles.iconBg}`}>
        {styles.icon}
      </div>
      
      <div className="flex-1 min-w-0 pr-2">
        <h4 className={`text-sm sm:text-base font-semibold ${styles.titleColor} leading-tight`}>
          {toast.title}
        </h4>
        {toast.message && (
          <p className={`mt-1 text-sm sm:text-sm ${styles.messageColor} leading-relaxed`}>
            {toast.message}
          </p>
        )}
      </div>
      
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 p-2 hover:bg-black/20 rounded-full transition-colors touch-manipulation min-w-[32px] min-h-[32px] flex items-center justify-center"
        aria-label="Close notification"
      >
        <X className="h-4 w-4 text-white/80 hover:text-white" />
      </button>
    </div>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 space-y-3 pointer-events-none">
      <div className="space-y-3 pointer-events-auto">
        {toasts.map((toast) => (
          <ToastComponent
            key={toast.id}
            toast={toast}
            onRemove={onRemove}
          />
        ))}
      </div>
    </div>
  );
};

export default ToastContainer;
