'use client';

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useDarkMode } from "@/hooks/useDarkMode";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string | React.ReactNode;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  centered?: boolean;
  footer?: React.ReactNode;
  customWidth?: string | number;
  customMaxWidth?: string | number;
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
  customWidth,
  customMaxWidth,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const { isDark: isDarkMode } = useDarkMode();

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Save current active element
      previousActiveElement.current = document.activeElement as HTMLElement;
      
      // Lock body scroll
      document.body.style.overflow = 'hidden';
      
      // Focus modal after a short delay to ensure it's rendered
      setTimeout(() => {
        const modalElement = modalRef.current?.querySelector('[role="dialog"]') as HTMLElement;
        if (modalElement) {
          modalElement.focus();
        }
      }, 100);
    } else {
      // Restore body scroll
      document.body.style.overflow = 'unset';
      
      // Restore focus to previous element
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    const handleTab = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      const modal = modalRef.current?.querySelector('[role="dialog"]') as HTMLElement;
      if (!modal) return;
      
      const focusableElements = modal.querySelectorAll(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
      
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('keydown', handleTab);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleTab);
    };
  }, [isOpen, onClose]);

  // تحسين Sizes ليكون responsive - مستوحى من DawamWeb
  const sizes = {
    sm: { maxWidth: '400px', width: '90vw', minHeight: 'auto' },
    md: { maxWidth: '600px', width: '92vw', minHeight: 'auto' },
    lg: { maxWidth: '900px', width: '95vw', minHeight: 'auto' },
    xl: { maxWidth: '1200px', width: '96vw', minHeight: 'auto' },
    full: { maxWidth: '1600px', width: '98vw', minHeight: 'auto' },
  };

  const modalDialogClass = `modal-dialog modal-dialog-centered`;

  const modalContent = (
    <div
      ref={modalRef}
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
      aria-describedby="modal-description"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Backdrop */}
      <div
        className={`modal-backdrop fade ${isOpen ? 'show animate-fade-in' : ''}`}
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
          backdropFilter: 'blur(12px) saturate(180%)',
          WebkitBackdropFilter: 'blur(12px) saturate(180%)',
        }}
      />

      {/* Modal Dialog */}
      <div 
        className={`${modalDialogClass} ${isOpen ? 'animate-scale-in' : ''}`} 
        role="document" 
        onClick={(e) => e.stopPropagation()}
        style={{
          zIndex: 10000,
          position: 'relative',
          maxWidth: customMaxWidth ? (typeof customMaxWidth === 'number' ? `${customMaxWidth}px` : customMaxWidth) : sizes[size].maxWidth,
          width: customWidth === 'auto' ? 'fit-content' : (customWidth ? (typeof customWidth === 'number' ? `${customWidth}px` : customWidth) : sizes[size].width),
          margin: '1.75rem auto',
          display: 'flex',
          alignItems: 'center',
          minHeight: 'calc(100vh - 3.5rem)',
          animation: isOpen ? 'scale-in 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
          minWidth: customWidth === 'auto' ? 'min-content' : 0,
        }}
      >
        <div 
          className="modal-content"
          style={{
            backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.95)' : 'white',
            borderRadius: '1.5rem',
            border: isDarkMode ? '2px solid rgba(115, 103, 240, 0.4)' : '2px solid rgba(115, 103, 240, 0.2)',
            boxShadow: 'var(--shadow-modal)',
            overflow: 'hidden',
            overflowY: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '92vh',
            height: 'auto',
            minHeight: 'min-content',
            backdropFilter: 'blur(20px)',
            position: 'relative',
            width: customWidth === 'auto' ? 'fit-content' : '100%',
            minWidth: customWidth === 'auto' ? 'min-content' : 0,
          }}
          className="modal-content-enhanced"
        >
          {/* Enhanced decorative gradient overlay */}
          <div
            className="animate-fade-in"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '200px',
              background: isDarkMode
                ? 'radial-gradient(circle at 50% 0%, rgba(115, 103, 240, 0.15) 0%, rgba(115, 103, 240, 0.08) 50%, transparent 70%)'
                : 'radial-gradient(circle at 50% 0%, rgba(115, 103, 240, 0.08) 0%, rgba(115, 103, 240, 0.03) 50%, transparent 70%)',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
          {/* Subtle shine effect */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '100%',
              background: isDarkMode
                ? 'linear-gradient(135deg, rgba(71, 85, 105, 0.1) 0%, transparent 50%)'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
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
            {typeof title === 'string' ? (
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
                  aria-hidden="true"
                />
                {title}
              </h5>
            ) : (
              <div 
                className="modal-title" 
                id="modal-title" 
                style={{ 
                  margin: 0,
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {title}
              </div>
            )}
            <div id="modal-description" className="sr-only">
              {typeof title === 'string' ? title : 'Modal'}
            </div>
            {showCloseButton && (
              <button
                type="button"
                className="material-transition"
                onClick={onClose}
                aria-label="إغلاق النافذة المنبثقة"
                aria-keyshortcuts="Escape"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '2.5rem',
                  height: '2.5rem',
                  minWidth: '2.5rem',
                  minHeight: '2.5rem',
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
                <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path d="M.293.293a1 1 0 0 1 1.414 0L8 6.586 14.293.293a1 1 0 1 1 1.414 1.414L9.414 8l6.293 6.293a1 1 0 0 1-1.414 1.414L8 9.414l-6.293 6.293a1 1 0 0 1-1.414-1.414L6.586 8 .293 1.707a1 1 0 0 1 0-1.414z" />
                </svg>
              </button>
            )}
          </div>

          {/* Modal Body - Scrollable Content */}
          <div 
            className="modal-body"
            style={{ 
              color: isDarkMode ? 'rgb(226, 232, 240)' : '#6f6b7d',
              padding: '1.75rem',
              overflowY: 'auto',
              overflowX: 'hidden',
              flex: '1 1 auto',
              background: isDarkMode 
                ? 'linear-gradient(to bottom, rgba(15, 23, 42, 0.4) 0%, rgba(30, 41, 59, 0.3) 50%, rgba(15, 23, 42, 0.4) 100%)'
                : 'linear-gradient(to bottom, #fafafa 0%, #ffffff 50%, #fafafa 100%)',
              minHeight: 0,
              position: 'relative',
              zIndex: 1,
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'thin',
              scrollbarColor: isDarkMode ? '#7367f0 #1e293b' : '#7367f0 #f8f7fa',
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
                borderTop: isDarkMode 
                  ? '2px solid rgba(71, 85, 105, 0.6)' 
                  : '2px solid rgba(240, 239, 242, 0.8)',
                background: isDarkMode
                  ? 'linear-gradient(to bottom, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.95) 100%)'
                  : 'linear-gradient(to bottom, rgba(255, 255, 255, 0.98) 0%, rgba(250, 250, 250, 0.95) 100%)',
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
                boxShadow: isDarkMode
                  ? '0 -4px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(71, 85, 105, 0.3)'
                  : '0 -4px 20px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
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

