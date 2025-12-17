'use client';

import { MaterialIcon } from "@/components/icons/MaterialIcon";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

function ToastItem({ toast, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => {
      setIsVisible(true);
    });

    // Auto close after duration
    const timer = setTimeout(() => {
      handleClose();
    }, toast.duration || 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(toast.id);
    }, 300);
  };

  // استخدام Design Tokens للألوان
  const variantStyles = {
    success: {
      bg: 'bg-gradient-to-br from-success-50 to-success-100/80',
      border: 'border-success-200',
      text: 'text-success-800',
      icon: 'text-success-600',
      iconBg: 'bg-success-100',
      shadow: 'shadow-success',
      iconName: 'check_circle' as const,
    },
    error: {
      bg: 'bg-gradient-to-br from-error-50 to-error-100/80',
      border: 'border-error-200',
      text: 'text-error-800',
      icon: 'text-error-600',
      iconBg: 'bg-error-100',
      shadow: 'shadow-error',
      iconName: 'error' as const,
    },
    warning: {
      bg: 'bg-gradient-to-br from-warning-50 to-warning-100/80',
      border: 'border-warning-200',
      text: 'text-warning-800',
      icon: 'text-warning-600',
      iconBg: 'bg-warning-100',
      shadow: 'shadow-warning',
      iconName: 'warning' as const,
    },
    info: {
      bg: 'bg-gradient-to-br from-info-50 to-info-100/80',
      border: 'border-info-200',
      text: 'text-info-800',
      icon: 'text-info-600',
      iconBg: 'bg-info-100',
      shadow: 'shadow-info',
      iconName: 'info' as const,
    },
  };

  const styles = variantStyles[toast.variant];

  const roleMap = {
    success: 'status',
    error: 'alert',
    warning: 'alert',
    info: 'status',
  };

  return (
    <div
      role={roleMap[toast.variant]}
      aria-live={toast.variant === 'error' || toast.variant === 'warning' ? 'assertive' : 'polite'}
      aria-atomic="true"
      className={`relative flex items-start gap-3 p-4 rounded-xl border-2 backdrop-blur-sm min-w-[320px] max-w-[420px] material-transition overflow-hidden ${
        styles.bg
      } ${styles.border} ${styles.shadow} ${
        isVisible && !isExiting
          ? 'animate-slide-in-up opacity-100 translate-y-0'
          : isExiting
          ? 'opacity-0 translate-y-[-10px]'
          : 'opacity-0 translate-y-[-10px]'
      }`}
      style={{
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Progress bar */}
      <div 
        className={`absolute bottom-0 left-0 right-0 h-1 ${styles.iconBg} origin-left`}
        style={{
          animation: `progress ${toast.duration || 5000}ms linear forwards`,
        }}
      />
      
      {/* Shine effect */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%)',
          animation: 'shine 3s ease-in-out infinite',
        }}
        aria-hidden="true"
      />
      {/* Icon */}
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-full ${styles.iconBg} flex items-center justify-center shadow-sm`}
        aria-hidden="true"
      >
        <MaterialIcon name={styles.iconName} className={styles.icon} size="md" />
      </div>

      {/* Message */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${styles.text} leading-relaxed`}>
          {toast.message}
        </p>
      </div>

      {/* Close Button */}
      <button
        onClick={handleClose}
        className={`flex-shrink-0 w-8 h-8 min-w-[32px] min-h-[32px] rounded-full ${styles.iconBg} flex items-center justify-center hover:scale-110 active:scale-95 material-transition ${styles.icon}`}
        aria-label={`إغلاق إشعار ${toast.variant === 'success' ? 'نجاح' : toast.variant === 'error' ? 'خطأ' : toast.variant === 'warning' ? 'تحذير' : 'معلومات'}`}
      >
        <MaterialIcon name="close" size="sm" aria-hidden="true" />
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onClose }: { toasts: Toast[]; onClose: (id: string) => void }) {
  if (typeof window === 'undefined' || toasts.length === 0) return null;

  return createPortal(
    <div
      className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[10001] flex flex-col gap-3 items-center pointer-events-none"
      style={{ maxWidth: 'calc(100vw - 2rem)' }}
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onClose={onClose} />
        </div>
      ))}
    </div>,
    document.body
  );
}

