'use client';

import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef, useEffect, useId, useRef } from 'react';

type InputElementProps = InputHTMLAttributes<HTMLInputElement>;
type TextareaElementProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

interface InputProps extends Omit<InputElementProps & TextareaElementProps, 'onFocus' | 'onBlur'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  showPasswordToggle?: boolean;
  onTogglePassword?: () => void;
  isPasswordVisible?: boolean;
  type?: string;
  rows?: number;
  onFocus?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      fullWidth = true,
      className = '',
      id,
      showPasswordToggle = false,
      onTogglePassword,
      isPasswordVisible = false,
      type = 'text',
      rows = 1,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || `input-${generatedId}`;
    const hasError = !!error;
    const isPassword = type === 'password' || showPasswordToggle;
    const hasRightElement = rightIcon || showPasswordToggle;
    
    // Determine if we should use textarea (for text fields) or input (for special types)
    const useTextarea = !type || ['text', 'email', 'tel', 'url', 'search', 'password'].includes(type);
    
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const actualRef = useTextarea ? textareaRef : inputRef;
    
    // Forward ref
    useEffect(() => {
      if (typeof ref === 'function') {
        ref(useTextarea ? textareaRef.current : inputRef.current);
      } else if (ref) {
        (ref as any).current = useTextarea ? textareaRef.current : inputRef.current;
      }
    }, [ref, useTextarea]);

    // Auto-resize functionality - only for textarea fields
    useEffect(() => {
      if (!useTextarea) return;

      const textarea = textareaRef.current;
      if (!textarea) return;

      const adjustHeight = () => {
        textarea.style.height = 'auto';
        const lineHeightPx = 16; // 1rem = 16px with line-height: 1
        const paddingTop = 10;
        const paddingBottom = 10;
        const borderWidth = 4;
        const totalPadding = paddingTop + paddingBottom + borderWidth;
        
        const scrollHeight = textarea.scrollHeight;
        const minHeight = rows ? `${rows * lineHeightPx + totalPadding}px` : `${lineHeightPx + totalPadding}px`;
        const calculatedMinHeight = parseInt(minHeight);
        
        const newHeight = Math.max(scrollHeight, calculatedMinHeight);
        textarea.style.height = `${newHeight}px`;
        textarea.style.lineHeight = '1';
      };

      setTimeout(() => {
        adjustHeight();
      }, 0);
      
      textarea.addEventListener('input', adjustHeight);
      textarea.addEventListener('paste', () => {
        setTimeout(adjustHeight, 0);
      });
      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          setTimeout(adjustHeight, 0);
        }
      });
      window.addEventListener('resize', adjustHeight);
      
      const observer = new MutationObserver(() => {
        adjustHeight();
      });
      observer.observe(textarea, { 
        attributes: true, 
        attributeFilter: ['value', 'data-value'],
        childList: true,
        characterData: true,
      });
      
      let lastValue = textarea.value;
      const checkValueChange = () => {
        const currentValue = textarea.value;
        if (currentValue !== lastValue) {
          lastValue = currentValue;
          setTimeout(adjustHeight, 0);
        }
      };
      
      const valueCheckInterval = setInterval(checkValueChange, 100);

      return () => {
        textarea.removeEventListener('input', adjustHeight);
        textarea.removeEventListener('paste', adjustHeight);
        textarea.removeEventListener('keydown', adjustHeight);
        window.removeEventListener('resize', adjustHeight);
        observer.disconnect();
        if (valueCheckInterval) {
          clearInterval(valueCheckInterval);
        }
      };
    }, [rows, useTextarea]);

    const baseStyles = 'block w-full rounded-xl border-2 bg-white px-3.5 py-2.5 text-base font-medium material-transition focus:outline-none focus:ring-2 focus:ring-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-300 backdrop-blur-sm min-w-0 resize-none';
    
    const inputStyles = hasError
      ? 'border-error-400 text-error-900 placeholder-error-400 focus:border-error-500 focus:ring-error-500/30 bg-gradient-to-r from-error-50 to-error-50/70 shadow-error-200/50 hover:border-error-500 hover:shadow-error-500/20 focus:scale-[1.01]'
      : 'border-slate-300 text-slate-800 placeholder-slate-400 focus:border-primary-500 focus:bg-white focus:shadow-xl focus:shadow-primary-500/25 hover:border-primary-400 hover:shadow-lg hover:scale-[1.005] hover:bg-gradient-to-br hover:from-white hover:to-slate-50/50 focus:scale-[1.01] focus:ring-4 focus:ring-primary-500/15';

    // Adjust padding based on required asterisk and icons
    // If required, add padding on the left (RTL) to make room for asterisk
    const paddingLeft = props.required && !leftIcon ? 'pl-8' : (leftIcon ? 'pl-12' : '');
    const paddingRight = hasRightElement ? 'pr-11' : '';

    const combinedInputClassName = `
      ${baseStyles}
      ${inputStyles}
      ${paddingLeft}
      ${paddingRight}
      ${className}
    `.trim().replace(/\s+/g, ' ');

    const commonStyle = {
      width: '100%',
      minWidth: 0,
      maxWidth: '100%',
      boxSizing: 'border-box' as const,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      lineHeight: 1,
      paddingTop: '0.625rem',
      paddingBottom: '0.625rem',
      borderRadius: '0.75rem', // rounded-xl - ensure elegant rounded corners
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const element = e.target as HTMLInputElement | HTMLTextAreaElement;
      element.style.transform = 'scale(1.01) translateZ(0)';
      element.style.boxShadow = '0 8px 24px rgba(115, 103, 240, 0.25), 0 0 0 4px rgba(115, 103, 240, 0.1)';
      element.style.borderColor = '#7367f0';
      element.style.borderRadius = '0.75rem'; // rounded-xl
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const element = e.target as HTMLInputElement | HTMLTextAreaElement;
      element.style.transform = 'scale(1) translateZ(0)';
      element.style.boxShadow = '';
      element.style.borderRadius = '0.75rem'; // rounded-xl
      if (!hasError) {
        element.style.borderColor = '';
      }
      props.onBlur?.(e);
    };

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-bold text-slate-700 mb-2.5 material-transition"
          >
            <span className="bg-gradient-to-r from-slate-800 to-slate-700 bg-clip-text text-transparent">{label}</span>
          </label>
        )}
        <div className="relative group">
          {/* Required asterisk - positioned inside the field on the left side (RTL) */}
          {props.required && (
            <span 
              className={`absolute top-1/2 transform -translate-y-1/2 text-error-500 text-xl font-black animate-pulse-glow z-30 pointer-events-none ${
                leftIcon ? 'left-12' : 'left-2.5'
              }`}
              style={{
                lineHeight: 1,
                display: 'block',
                textShadow: '0 0 2px rgba(239, 68, 68, 0.3)',
                fontWeight: 900,
              }}
            >
              *
            </span>
          )}
          {/* Reflection effect on focus - Premium shine */}
          <div 
            className="absolute inset-0 rounded-xl pointer-events-none opacity-0 group-focus-within:opacity-100 material-transition" 
            style={{ 
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)',
              transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          ></div>
          
          {/* Premium Glow effect */}
          <div 
            className="absolute -inset-1 rounded-xl opacity-0 group-focus-within:opacity-100 material-transition blur-md -z-10" 
            style={{ 
              background: 'radial-gradient(circle, rgba(115, 103, 240, 0.4) 0%, rgba(115, 103, 240, 0.2) 50%, transparent 100%)',
              transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          ></div>
          
          {/* Border glow */}
          <div 
            className="absolute inset-0 rounded-xl opacity-0 group-focus-within:opacity-100 material-transition pointer-events-none" 
            style={{ 
              border: '2px solid transparent',
              background: 'linear-gradient(white, white) padding-box, linear-gradient(135deg, rgba(115, 103, 240, 0.5), rgba(212, 70, 239, 0.3)) border-box',
              transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              borderRadius: '0.75rem', // rounded-xl - ensure elegant rounded corners
            }}
          ></div>
          
          {leftIcon && (
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none z-20 group-focus-within:text-primary-500 material-transition">
              {leftIcon}
            </div>
          )}
          
          {useTextarea ? (
            <textarea
              ref={textareaRef}
              id={inputId}
              className={combinedInputClassName}
              placeholder={props.placeholder}
              rows={rows}
              style={{
                ...commonStyle,
                transition: 'height 0.2s cubic-bezier(0.4, 0, 0.2, 1), all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                minHeight: rows ? `${rows * 16 + 24}px` : '40px',
                height: 'auto',
                overflow: 'hidden',
                overflowY: 'hidden',
                wordWrap: 'break-word',
                whiteSpace: 'pre-wrap',
                resize: 'none',
                borderRadius: '0.75rem', // rounded-xl - ensure elegant rounded corners always
              }}
              onFocus={handleFocus}
              onBlur={handleBlur}
              {...(props as TextareaElementProps)}
            />
          ) : (
            <input
              ref={inputRef}
              id={inputId}
              className={combinedInputClassName}
              placeholder={props.placeholder}
              type={showPasswordToggle && isPasswordVisible ? 'text' : type}
              style={{
                ...commonStyle,
                borderRadius: '0.75rem', // rounded-xl - ensure elegant rounded corners always
              }}
              onFocus={handleFocus}
              onBlur={handleBlur}
              {...(props as InputElementProps)}
            />
          )}
          
          {showPasswordToggle && onTogglePassword && (
            <button
              type="button"
              onClick={onTogglePassword}
              className="absolute right-2.5 top-1/2 transform -translate-y-1/2 z-10 p-1.5 rounded-md text-slate-400 hover:text-slate-600 active:text-primary-600 hover:bg-slate-100/50 active:bg-slate-100 material-transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/20 active:scale-95 transition-all duration-200"
              tabIndex={-1}
              aria-label={isPasswordVisible ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
            >
              <svg
                className="w-5 h-5 transition-all duration-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                strokeWidth={2}
              >
                {isPasswordVisible ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                ) : (
                  <>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </>
                )}
              </svg>
            </button>
          )}
          {rightIcon && !showPasswordToggle && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1 text-xs text-error-600 animate-fade-in">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-xs text-secondary-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
export type { InputProps };

