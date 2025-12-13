'use client';

import { useEffect } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  centered?: boolean;
  footer?: React.ReactNode;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  centered = false,
          footer,
}: ModalProps) {
  // Auto-generate footer if not provided but form is present
  // const hasForm = typeof children === 'object' && children !== null && 'props' in children && (children as any).props?.onSubmit;
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

  const sizes = {
    sm: { maxWidth: '420px', width: '90vw', minHeight: 'auto' },
    md: { maxWidth: '500px', width: '85vw', minHeight: 'auto' },
    lg: { maxWidth: '750px', width: '90vw', minHeight: 'auto' },
    xl: { maxWidth: '900px', width: '92vw', minHeight: 'auto' },
    full: { maxWidth: '95vw', width: '95vw', minHeight: 'auto' },
  };

  const modalDialogClass = `modal-dialog modal-dialog-centered`;

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
      aria-labelledby="modal-title"
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
          background: 'linear-gradient(135deg, rgba(75, 70, 92, 0.7) 0%, rgba(115, 103, 240, 0.5) 50%, rgba(75, 70, 92, 0.7) 100%)',
          backdropFilter: 'blur(8px)',
        }}
      />

      {/* Modal Dialog */}
      <div 
        className={`${modalDialogClass} animate-scale-in`} 
        role="document" 
        onClick={(e) => e.stopPropagation()}
        style={{
          zIndex: 10000,
          position: 'relative',
          maxWidth: sizes[size].maxWidth,
          width: sizes[size].width,
          margin: '1.75rem auto',
          display: 'flex',
          alignItems: 'center',
          minHeight: 'calc(100vh - 3.5rem)',
        }}
      >
        <div 
          className="modal-content"
          style={{
            backgroundColor: 'white',
            borderRadius: '1.5rem',
            border: '2px solid rgba(115, 103, 240, 0.2)',
            boxShadow: '0 25px 80px rgba(0, 0, 0, 0.35), 0 10px 30px rgba(115, 103, 240, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
            overflow: 'hidden',
            overflowY: 'hidden', // Prevent scrolling on modal-content, only body scrolls
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '92vh',
            height: 'auto',
            minHeight: 'min-content',
            backdropFilter: 'blur(20px)',
            position: 'relative',
            width: '100%',
          }}
        >
          {/* Decorative gradient overlay */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '200px',
              background: 'radial-gradient(circle at 50% 0%, rgba(115, 103, 240, 0.05) 0%, transparent 70%)',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
          {/* Modal Header */}
          <div 
            className="modal-header"
            style={{
              background: 'linear-gradient(135deg, #7367f0 0%, #5e52d5 40%, #4a3fd0 70%, #3c35a8 100%)',
              padding: '1.25rem 1.75rem',
              borderBottom: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
              flexShrink: 0,
              zIndex: 1,
              boxShadow: '0 4px 20px rgba(115, 103, 240, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
            }}
          >
            {/* Decorative Pattern */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
                pointerEvents: 'none',
              }}
            />
            <h5 
              className="modal-title" 
              id="modal-title" 
              style={{ 
                color: 'white', 
                fontWeight: 700, 
                fontSize: '1.5rem',
                margin: 0,
                position: 'relative',
                zIndex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <div
                style={{
                  width: '3px',
                  height: '2rem',
                  background: 'rgba(255, 255, 255, 0.3)',
                  borderRadius: '2px',
                }}
              />
              {title}
            </h5>
            {showCloseButton && (
              <button
                type="button"
                className="material-transition"
                onClick={onClose}
                aria-label="إغلاق"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '2.5rem',
                  height: '2.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'white',
                  position: 'relative',
                  zIndex: 1,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                  e.currentTarget.style.transform = 'scale(1.1) rotate(90deg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                }}
              >
                <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M.293.293a1 1 0 0 1 1.414 0L8 6.586 14.293.293a1 1 0 1 1 1.414 1.414L9.414 8l6.293 6.293a1 1 0 0 1-1.414 1.414L8 9.414l-6.293 6.293a1 1 0 0 1-1.414-1.414L6.586 8 .293 1.707a1 1 0 0 1 0-1.414z" />
                </svg>
              </button>
            )}
          </div>

          {/* Modal Body - Scrollable Content */}
          <div 
            className="modal-body"
            style={{ 
              color: '#6f6b7d',
              padding: '1.75rem',
              overflowY: 'auto',
              overflowX: 'hidden',
              flex: '1 1 auto',
              background: 'linear-gradient(to bottom, #fafafa 0%, #ffffff 50%, #fafafa 100%)',
              minHeight: 0,
              position: 'relative',
              zIndex: 1,
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'thin',
              scrollbarColor: '#7367f0 #f8f7fa',
              // Body takes remaining space, footer is outside scroll
              flexGrow: 1,
              flexShrink: 1,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', minHeight: 'min-content' }}>
              {children}
            </div>
          </div>

          {/* Modal Footer - Fixed at Bottom, Outside Scroll Area */}
          {footer && (
            <div 
              className="modal-footer"
              style={{
                padding: '1.5rem 1.75rem',
                borderTop: '2px solid rgba(240, 239, 242, 0.8)',
                background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.98) 0%, rgba(250, 250, 250, 0.95) 100%)',
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: '1rem',
                flexShrink: 0,
                flexGrow: 0,
                flexBasis: 'auto',
                position: 'sticky',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 20,
                backdropFilter: 'blur(10px)',
                boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
                width: '100%',
                marginTop: 'auto', // Push footer to bottom
              }}
            >
              {footer}
            </div>
          )}
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

