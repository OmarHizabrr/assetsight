'use client';

import { MaterialIcon } from "@/components/icons/MaterialIcon";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "./Button";
import { useDarkMode } from "@/hooks/useDarkMode";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  variant = 'danger',
  loading = false,
}: ConfirmModalProps) {
  const { isDark } = useDarkMode();
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const variantStyles = {
    danger: {
      icon: 'warning',
      iconColor: isDark ? '#f87171' : '#ea5455',
      iconBg: isDark ? 'rgba(239, 68, 68, 0.2)' : '#ffebee',
      titleColor: isDark ? '#f87171' : '#ea5455',
      confirmBg: '#ea5455',
    },
    warning: {
      icon: 'warning',
      iconColor: isDark ? '#fbbf24' : '#ff9f43',
      iconBg: isDark ? 'rgba(251, 191, 36, 0.2)' : '#fff4e6',
      titleColor: isDark ? '#fbbf24' : '#ff9f43',
      confirmBg: '#ff9f43',
    },
    info: {
      icon: 'info',
      iconColor: isDark ? '#a78bfa' : '#7367f0',
      iconBg: isDark ? 'rgba(115, 103, 240, 0.2)' : '#eae8fd',
      titleColor: isDark ? '#a78bfa' : '#7367f0',
      confirmBg: '#7367f0',
    },
  };

  const style = variantStyles[variant];

  const modalDialogClass = 'modal-dialog modal-dialog-centered';

  const modalContent = (
    <div
      className={`modal fade ${isOpen ? 'show' : ''}`}
      style={{ 
        display: isOpen ? 'block' : 'none',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        width: '100vw',
        height: '100vh',
        overflow: 'auto',
      }}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Backdrop */}
      <div
        className="modal-backdrop fade show"
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9998,
          width: '100vw',
          height: '100vh',
          backgroundColor: isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(8px)',
        }}
      />

      {/* Modal Dialog */}
      <div 
        className={modalDialogClass} 
        role="document" 
        onClick={(e) => e.stopPropagation()}
        style={{
          zIndex: 10000,
          position: 'relative',
        }}
      >
        <div 
          className="modal-content animate-scale-in" 
          style={{ 
            maxWidth: '600px',
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'white',
            borderRadius: '1.5rem',
            border: isDark 
              ? '2px solid rgba(71, 85, 105, 0.6)' 
              : '2px solid rgba(115, 103, 240, 0.2)',
            boxShadow: isDark
              ? '0 25px 80px rgba(0, 0, 0, 0.5), 0 10px 30px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(71, 85, 105, 0.3)'
              : '0 25px 80px rgba(0, 0, 0, 0.35), 0 10px 30px rgba(115, 103, 240, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '92vh',
            height: 'auto',
            minHeight: 'min-content',
            backdropFilter: 'blur(20px)',
            position: 'relative',
            width: '100%',
            overflowY: 'hidden', // Prevent scrolling on modal-content, only body scrolls
          }}
        >
          {/* Modal Body - Scrollable Content */}
          <div 
            className="modal-body" 
            style={{ 
              padding: '2.5rem', 
              textAlign: 'center',
              overflowY: 'auto',
              overflowX: 'hidden',
              flex: '1 1 auto',
              background: isDark
                ? 'linear-gradient(to bottom, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 50%, rgba(15, 23, 42, 0.95) 100%)'
                : 'linear-gradient(to bottom, #fafafa 0%, #ffffff 50%, #fafafa 100%)',
              minHeight: 0,
              position: 'relative',
              zIndex: 1,
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'thin',
              scrollbarColor: isDark ? '#7367f0 #1e293b' : '#7367f0 #f8f7fa',
              flexGrow: 1,
              flexShrink: 1,
            }}
          >
            {/* Icon */}
            <div
              className="animate-scale-in"
              style={{
                width: '6rem',
                height: '6rem',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${style.iconBg} 0%, ${style.iconBg}dd 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                boxShadow: `0 8px 24px ${style.iconColor}40`,
                border: `3px solid ${style.iconColor}20`,
              }}
            >
              <div style={{ color: style.iconColor }} className="animate-pulse">
                <MaterialIcon
                  name={style.icon}
                  size="3xl"
                />
              </div>
            </div>

            {/* Title */}
            {title && (
              <h5
                className="modal-title"
                style={{
                  color: style.titleColor,
                  fontWeight: 700,
                  fontSize: '1.5rem',
                  marginBottom: '1rem',
                }}
              >
                {title}
              </h5>
            )}

            {/* Message */}
            <p
              className="font-medium"
              style={{
                color: isDark ? 'rgb(226, 232, 240)' : '#4b465c',
                fontSize: '1rem',
                lineHeight: '1.7',
                marginBottom: 0,
              }}
            >
              {message}
            </p>
          </div>

          {/* Modal Footer - Fixed at Bottom, Outside Scroll Area */}
          <div
            className="modal-footer"
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '1rem',
              padding: '1.5rem 1.75rem',
              borderTop: isDark 
                ? '2px solid rgba(71, 85, 105, 0.6)' 
                : '2px solid rgba(240, 239, 242, 0.8)',
              background: isDark
                ? 'linear-gradient(to bottom, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.95) 100%)'
                : 'linear-gradient(to bottom, rgba(255, 255, 255, 0.98) 0%, rgba(250, 250, 250, 0.95) 100%)',
              flexShrink: 0,
              flexGrow: 0,
              flexBasis: 'auto',
              position: 'sticky',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 20,
              backdropFilter: 'blur(10px)',
              boxShadow: isDark
                ? '0 -4px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(71, 85, 105, 0.3)'
                : '0 -4px 20px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
              width: '100%',
              marginTop: 'auto', // Push footer to bottom
            }}
          >
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              size="lg"
              className="w-full sm:w-auto font-bold"
            >
              {cancelText}
            </Button>
            <Button
              type="button"
              variant={variant === 'danger' ? 'error' : variant === 'warning' ? 'warning' : 'primary'}
              onClick={onConfirm}
              isLoading={loading}
              disabled={loading}
              size="lg"
              className="w-full sm:w-auto font-bold shadow-xl shadow-primary-500/30"
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  // استخدام Portal لعرض الـ Modal مباشرة في body
  if (typeof window !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return null;
}

