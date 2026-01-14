'use client';

import { useDarkMode } from "@/hooks/useDarkMode";
import { Children, Fragment, cloneElement, isValidElement, useEffect, useRef, useState, type ReactElement } from "react";
import { createPortal } from "react-dom";

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
  draggable?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'lg',
  showCloseButton = true,
  centered = false,
  footer,
  customWidth,
  customMaxWidth,
  draggable = true,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const userInteractedRef = useRef(false);
  const { isDark: isDarkMode } = useDarkMode();

  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const dragStateRef = useRef({
    isDragging: false,
    startClientX: 0,
    startClientY: 0,
    startX: 0,
    startY: 0,
  });

  const renderResponsiveFooter = (node: React.ReactNode): React.ReactNode => {
    return Children.map(node, (child) => {
      if (!isValidElement(child)) return child;

      const element = child as ReactElement<any>;

      if (element.type === Fragment) {
        return <>{renderResponsiveFooter(element.props.children)}</>;
      }

      const existingClassName = element.props?.className || '';
      const responsiveWidthClass = 'w-full';

      return cloneElement(element, {
        className: `${existingClassName} ${responsiveWidthClass}`.trim(),
      });
    });
  };

  // Focus management
  useEffect(() => {
    let listenersAttached = false;
    const markUserInteracted = (event: Event) => {
      const target = event.target as Node | null;
      const dialogEl = dialogRef.current;
      if (!target || !dialogEl) return;
      if (dialogEl.contains(target)) {
        userInteractedRef.current = true;
      }
    };

    if (isOpen) {
      // Save current active element
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Reset interaction flag on open
      userInteractedRef.current = false;

      // Lock body scroll
      document.body.style.overflow = 'hidden';

      // If user interacts with the modal quickly, don't run deferred auto-focus.
      document.addEventListener('mousedown', markUserInteracted, true);
      document.addEventListener('touchstart', markUserInteracted, true);
      document.addEventListener('keydown', markUserInteracted, true);
      listenersAttached = true;

      // Focus management after render:
      // - If user already focused something inside the modal (e.g. clicked an input), do not steal focus.
      // - Otherwise, focus the first focusable control to prevent "first key" being dropped.
      setTimeout(() => {
        if (userInteractedRef.current) return;
        const dialog = modalRef.current?.querySelector('[role="dialog"]') as HTMLElement | null;
        if (!dialog) return;

        const active = document.activeElement as HTMLElement | null;
        const focusAlreadyInside = !!active && dialog.contains(active);
        if (focusAlreadyInside) return;

        const firstFocusable = dialog.querySelector(
          'input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) as HTMLElement | null;

        (firstFocusable || dialog).focus();
      }, 0);

      // Reset drag position on open
      setDragOffset({ x: 0, y: 0 });
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
      if (listenersAttached) {
        document.removeEventListener('mousedown', markUserInteracted, true);
        document.removeEventListener('touchstart', markUserInteracted, true);
        document.removeEventListener('keydown', markUserInteracted, true);
      }
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
    sm: { maxWidth: 'min(500px, calc(100vw - 2rem))', width: 'calc(100vw - 2rem)', minHeight: 'auto' },
    md: { maxWidth: 'min(800px, calc(100vw - 2rem))', width: 'calc(100vw - 2rem)', minHeight: 'auto' },
    lg: { maxWidth: 'min(1200px, calc(100vw - 2rem))', width: 'calc(100vw - 2rem)', minHeight: 'auto' },
    xl: { maxWidth: 'min(1400px, calc(100vw - 2rem))', width: 'calc(100vw - 2rem)', minHeight: 'auto' },
    full: { maxWidth: 'min(1800px, calc(100vw - 2rem))', width: 'calc(100vw - 2rem)', minHeight: 'auto' },
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
        ref={dialogRef}
        className={`${modalDialogClass} ${isOpen ? 'animate-scale-in' : ''}`}
        role="document"
        onClick={(e) => e.stopPropagation()}
        style={{
          zIndex: 10000,
          position: 'relative',
          maxWidth: customMaxWidth ? (typeof customMaxWidth === 'number' ? `${customMaxWidth}px` : customMaxWidth) : sizes[size].maxWidth,
          width: customWidth === 'auto' ? 'fit-content' : (customWidth ? (typeof customWidth === 'number' ? `${customWidth}px` : customWidth) : sizes[size].width),
          margin: '1rem auto',
          display: 'flex',
          alignItems: 'center',
          minHeight: 'calc(100vh - 2rem)',
          animation: isOpen ? 'scale-in 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
          minWidth: customWidth === 'auto' ? 'min-content' : 0,
          transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0)`,
          willChange: draggable ? 'transform' : undefined,
        }}
      >
        <div
          className="modal-content modal-content-enhanced"
          style={{
            backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.95)' : 'white',
            borderRadius: '1.5rem',
            border: isDarkMode ? '2px solid rgba(115, 103, 240, 0.4)' : '2px solid rgba(115, 103, 240, 0.2)',
            boxShadow: 'var(--shadow-modal)',
            overflow: 'visible',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 'calc(100vh - 2rem)',
            height: 'auto',
            minHeight: 'min-content',
            backdropFilter: 'blur(20px)',
            position: 'relative',
            width: customWidth === 'auto' ? 'fit-content' : '100%',
            minWidth: customWidth === 'auto' ? 'min-content' : 0,
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
          }}
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
            onMouseDown={(e) => {
              if (!draggable) return;
              // Only left click
              if (e.button !== 0) return;
              // Avoid dragging when clicking interactive elements inside header
              const target = e.target as HTMLElement;
              if (target.closest('button, a, input, textarea, select, [role="button"]')) return;
              if (!dialogRef.current) return;

              const rect = dialogRef.current.getBoundingClientRect();
              dragStateRef.current = {
                isDragging: true,
                startClientX: e.clientX,
                startClientY: e.clientY,
                startX: dragOffset.x,
                startY: dragOffset.y,
              };

              // Prevent text selection while dragging
              e.preventDefault();

              const handleMove = (ev: MouseEvent) => {
                if (!dragStateRef.current.isDragging || !dialogRef.current) return;

                const dx = ev.clientX - dragStateRef.current.startClientX;
                const dy = ev.clientY - dragStateRef.current.startClientY;

                const nextX = dragStateRef.current.startX + dx;
                const nextY = dragStateRef.current.startY + dy;

                const dialogRect = dialogRef.current.getBoundingClientRect();
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;

                // Constrain within viewport with small padding
                const padding = 8;
                const minX = -dialogRect.left + padding;
                const maxX = viewportWidth - (dialogRect.right) - padding;
                const minY = -dialogRect.top + padding;
                const maxY = viewportHeight - (dialogRect.bottom) - padding;

                setDragOffset({
                  x: Math.min(Math.max(nextX, dragOffset.x + minX), dragOffset.x + maxX),
                  y: Math.min(Math.max(nextY, dragOffset.y + minY), dragOffset.y + maxY),
                });
              };

              const handleUp = () => {
                dragStateRef.current.isDragging = false;
                document.removeEventListener('mousemove', handleMove);
                document.removeEventListener('mouseup', handleUp);
              };

              document.addEventListener('mousemove', handleMove);
              document.addEventListener('mouseup', handleUp);
            }}
            onTouchStart={(e) => {
              if (!draggable) return;
              const touch = e.touches[0];
              if (!touch) return;
              const target = e.target as HTMLElement;
              if (target.closest('button, a, input, textarea, select, [role="button"]')) return;
              if (!dialogRef.current) return;

              dragStateRef.current = {
                isDragging: true,
                startClientX: touch.clientX,
                startClientY: touch.clientY,
                startX: dragOffset.x,
                startY: dragOffset.y,
              };

              const handleMove = (ev: TouchEvent) => {
                const t = ev.touches[0];
                if (!t || !dragStateRef.current.isDragging || !dialogRef.current) return;

                const dx = t.clientX - dragStateRef.current.startClientX;
                const dy = t.clientY - dragStateRef.current.startClientY;

                const nextX = dragStateRef.current.startX + dx;
                const nextY = dragStateRef.current.startY + dy;

                const dialogRect = dialogRef.current.getBoundingClientRect();
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;

                const padding = 8;
                const minX = -dialogRect.left + padding;
                const maxX = viewportWidth - (dialogRect.right) - padding;
                const minY = -dialogRect.top + padding;
                const maxY = viewportHeight - (dialogRect.bottom) - padding;

                setDragOffset({
                  x: Math.min(Math.max(nextX, dragOffset.x + minX), dragOffset.x + maxX),
                  y: Math.min(Math.max(nextY, dragOffset.y + minY), dragOffset.y + maxY),
                });
              };

              const handleEnd = () => {
                dragStateRef.current.isDragging = false;
                document.removeEventListener('touchmove', handleMove);
                document.removeEventListener('touchend', handleEnd);
                document.removeEventListener('touchcancel', handleEnd);
              };

              document.addEventListener('touchmove', handleMove, { passive: true });
              document.addEventListener('touchend', handleEnd);
              document.addEventListener('touchcancel', handleEnd);
            }}
            style={{
              background: 'linear-gradient(135deg, #7367f0 0%, #5e52d5 40%, #4a3fd0 70%, #3c35a8 100%)',
              padding: '1rem 1.5rem',
              borderBottom: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
              flexShrink: 0,
              zIndex: 1,
              boxShadow: '0 4px 20px rgba(115, 103, 240, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
              cursor: draggable ? 'move' : undefined,
              userSelect: draggable ? 'none' : undefined,
              touchAction: draggable ? 'none' : undefined,
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
                  fontSize: '1.25rem',
                  margin: 0,
                  position: 'relative',
                  zIndex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
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
              padding: '1.25rem 1.5rem',
              overflowY: 'auto',
              overflowX: 'auto',
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
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              whiteSpace: 'normal',
            }}
          >
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              minHeight: 'min-content',
              width: '100%',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              whiteSpace: 'normal'
            }}>
              {children}
            </div>
          </div>

          {/* Modal Footer - Fixed at Bottom, Outside Scroll Area */}
          {footer && (
            <div
              className="modal-footer"
              style={{
                padding: '1rem 1.5rem',
                borderTop: isDarkMode
                  ? '2px solid rgba(71, 85, 105, 0.6)'
                  : '2px solid rgba(240, 239, 242, 0.8)',
                background: isDarkMode
                  ? 'linear-gradient(to bottom, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.95) 100%)'
                  : 'linear-gradient(to bottom, rgba(255, 255, 255, 0.98) 0%, rgba(250, 250, 250, 0.95) 100%)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                alignItems: 'stretch',
                gap: '0.75rem',
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
              {renderResponsiveFooter(footer)}
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

