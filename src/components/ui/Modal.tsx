'use client';

import { useEffect } from "react";
import { CloseIcon } from "../icons";
import { Button } from "./Button";

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
    sm: 'sm:max-w-md',
    md: 'sm:max-w-lg',
    lg: 'sm:max-w-2xl',
    xl: 'sm:max-w-4xl',
    full: 'sm:max-w-full sm:mx-4',
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 transition-opacity bg-secondary-900/60 backdrop-blur-sm animate-fade-in"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal Panel */}
        <div className={`inline-block align-bottom bg-white rounded-2xl text-right overflow-hidden shadow-large transform transition-all animate-scale-in sm:my-8 sm:align-middle sm:w-full ${sizes[size]}`}>
          <div className="bg-white px-6 pt-6 pb-4 sm:p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3
                id="modal-title"
                className="text-xl font-semibold text-secondary-900"
              >
                {title}
              </h3>
              {showCloseButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-secondary-400 hover:text-secondary-600 -mr-2"
                  aria-label="إغلاق"
                >
                  <CloseIcon className="w-5 h-5" />
                </Button>
              )}
            </div>

            {/* Content */}
            <div className="text-secondary-700">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

