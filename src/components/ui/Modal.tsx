'use client';

import { MaterialIcon } from "@/components/icons/MaterialIcon";
import { useEffect } from "react";
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
      <div className="flex items-center justify-center min-h-screen px-3 sm:px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 material-transition bg-secondary-900/60 animate-fade-in"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal Panel */}
        <div className={`inline-block align-bottom bg-white rounded-2xl text-right overflow-hidden shadow-elevation-24 transform material-transition animate-scale-in sm:my-8 sm:align-middle w-full border border-slate-200/60 ${sizes[size]}`}>
          <div className="bg-gradient-to-br from-white via-slate-50/30 to-white px-4 pt-4 pb-4 sm:px-6 sm:pt-6 sm:pb-4 lg:p-8 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 sm:mb-6 sticky top-0 bg-gradient-to-r from-white to-slate-50/50 backdrop-blur-sm pb-3 -mx-4 sm:-mx-6 px-4 sm:px-6 z-10 border-b-2 border-slate-200/60">
              <h3
                id="modal-title"
                className="text-xl sm:text-2xl font-black bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent pr-2"
              >
                {title}
              </h3>
              {showCloseButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-secondary-500 hover:text-secondary-700 hover:bg-secondary-100 -mr-2 flex-shrink-0"
                  aria-label="إغلاق"
                >
                  <MaterialIcon name="close" size="lg" />
                </Button>
              )}
            </div>

            {/* Content */}
            <div className="text-secondary-800 text-sm sm:text-base">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

