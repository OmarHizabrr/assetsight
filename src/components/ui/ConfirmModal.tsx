'use client';

import { MaterialIcon } from "@/components/icons/MaterialIcon";
import { useEffect } from "react";
import { Button } from "./Button";

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

  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: 'warning',
      iconColor: '#ea5455',
      iconBg: '#ffebee',
      titleColor: '#ea5455',
      confirmBg: '#ea5455',
    },
    warning: {
      icon: 'warning',
      iconColor: '#ff9f43',
      iconBg: '#fff4e6',
      titleColor: '#ff9f43',
      confirmBg: '#ff9f43',
    },
    info: {
      icon: 'info',
      iconColor: '#7367f0',
      iconBg: '#eae8fd',
      titleColor: '#7367f0',
      confirmBg: '#7367f0',
    },
  };

  const style = variantStyles[variant];

  const modalDialogClass = 'modal-dialog modal-dialog-centered';

  return (
    <div
      className={`modal fade ${isOpen ? 'show' : ''}`}
      style={{ display: isOpen ? 'block' : 'none' }}
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
      />

      {/* Modal Dialog */}
      <div className={modalDialogClass} role="document" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content" style={{ maxWidth: '500px' }}>
          {/* Modal Body */}
          <div className="modal-body" style={{ padding: '2rem', textAlign: 'center' }}>
            {/* Icon */}
            <div
              style={{
                width: '5rem',
                height: '5rem',
                borderRadius: '50%',
                backgroundColor: style.iconBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
              }}
            >
              <MaterialIcon
                name={style.icon}
                size="3xl"
                style={{ color: style.iconColor }}
              />
            </div>

            {/* Title */}
            {title && (
              <h5
                className="modal-title"
                style={{
                  color: style.titleColor,
                  fontWeight: 600,
                  fontSize: '1.25rem',
                  marginBottom: '1rem',
                }}
              >
                {title}
              </h5>
            )}

            {/* Message */}
            <p
              style={{
                color: '#6f6b7d',
                fontSize: '0.9375rem',
                lineHeight: '1.6',
                marginBottom: '2rem',
              }}
            >
              {message}
            </p>

            {/* Buttons */}
            <div
              className="modal-footer"
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '0.75rem',
                padding: 0,
                borderTop: 'none',
                background: 'transparent',
              }}
            >
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                size="lg"
                style={{
                  minWidth: '120px',
                }}
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
                style={{
                  minWidth: '120px',
                }}
              >
                {confirmText}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

