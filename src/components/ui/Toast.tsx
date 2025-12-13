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

  const variantStyles = {
    success: {
      bg: 'bg-gradient-to-br from-green-50 to-emerald-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: 'text-green-600',
      iconBg: 'bg-green-100',
      iconName: 'check_circle' as const,
    },
    error: {
      bg: 'bg-gradient-to-br from-red-50 to-rose-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: 'text-red-600',
      iconBg: 'bg-red-100',
      iconName: 'error' as const,
    },
    warning: {
      bg: 'bg-gradient-to-br from-yellow-50 to-amber-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: 'text-yellow-600',
      iconBg: 'bg-yellow-100',
      iconName: 'warning' as const,
    },
    info: {
      bg: 'bg-gradient-to-br from-blue-50 to-cyan-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: 'text-blue-600',
      iconBg: 'bg-blue-100',
      iconName: 'info' as const,
    },
  };

  const styles = variantStyles[toast.variant];

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border-2 shadow-lg backdrop-blur-sm min-w-[320px] max-w-[420px] material-transition ${
        styles.bg
      } ${styles.border} ${
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
      {/* Icon */}
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-full ${styles.iconBg} flex items-center justify-center shadow-sm`}
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
        className={`flex-shrink-0 w-6 h-6 rounded-full ${styles.iconBg} flex items-center justify-center hover:scale-110 active:scale-95 material-transition ${styles.icon}`}
        aria-label="إغلاق"
      >
        <MaterialIcon name="close" size="sm" />
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

