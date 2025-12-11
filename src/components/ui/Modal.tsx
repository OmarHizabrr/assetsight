'use client';

import { MaterialIcon } from "@/components/icons/MaterialIcon";
import { useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
}: ModalProps) {
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

  const sizes = {
    sm: 'sm:max-w-lg',
    md: 'sm:max-w-2xl',
    lg: 'sm:max-w-4xl',
    xl: 'sm:max-w-6xl',
    full: 'sm:max-w-full sm:mx-4',
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="flex items-center justify-center min-h-screen px-3 sm:px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 material-transition bg-secondary-900/60 animate-fade-in"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal Panel */}
        <div className={`inline-block align-bottom bg-white rounded-2xl text-right overflow-hidden shadow-elevation-24 transform material-transition animate-scale-in sm:my-8 sm:align-middle w-full border border-gray-200 ${sizes[size]}`}>
          <div className="bg-white px-6 pt-6 pb-6 sm:px-8 sm:pt-8 sm:pb-8 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 pb-5 border-b border-gray-200">
              <h3
                id="modal-title"
                className="text-2xl sm:text-3xl font-semibold text-gray-900"
              >
                {title}
              </h3>
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 material-transition flex-shrink-0"
                  aria-label="إغلاق"
                >
                  <MaterialIcon name="close" size="lg" />
                </button>
              )}
            </div>

            {/* Content */}
            <div className="text-gray-700 text-sm sm:text-base">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

