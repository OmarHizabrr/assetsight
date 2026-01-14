'use client';

import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef, useEffect, useId, useRef, useState } from 'react';

type InputElementProps = InputHTMLAttributes<HTMLInputElement>;
type TextareaElementProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

interface InputProps extends Omit<InputElementProps & TextareaElementProps, 'onFocus' | 'onBlur' | 'size'> {
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
  size?: 'small' | 'medium' | 'large';
  variant?: 'outlined' | 'filled';
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
      size = 'medium',
      variant = 'outlined',
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || `input-${generatedId}`;
    const hasError = !!error;
    const isPassword = type === 'password' || showPasswordToggle;
    const hasRightElement = rightIcon || showPasswordToggle;
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(false);

    // Determine if we should use textarea. Use it only when multiline is explicitly needed.
    // Rendering a textarea for normal single-line fields can lead to odd input behavior.
    const useTextarea = (rows ?? 1) > 1;

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

    // Size variants - محسّن من DawamWeb
    const sizeStyles = {
      small: 'px-3 py-2 text-sm min-h-[32px]',
      medium: 'px-3.5 py-2.5 text-base min-h-[38px]',
      large: 'px-4 py-3 text-base min-h-[44px]',
    };

    // Variant styles - مستوحى من Ant Design و DawamWeb
    const variantBaseStyles = variant === 'filled'
      ? 'rounded-lg border-2 border-transparent'
      : 'rounded-lg border-2';

    const baseStyles = `block w-full ${variantBaseStyles} ${sizeStyles[size]} font-medium material-transition focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed min-w-0 resize-none`;

    const inputStyles = hasError
      ? variant === 'filled'
        ? 'bg-error-50 dark:!bg-slate-600/70 text-error-900 dark:!text-slate-50 placeholder-error-400 dark:!placeholder-slate-300 hover:bg-error-100 dark:hover:!bg-slate-600/80 focus:bg-white dark:focus:!bg-slate-600/90 focus:border-error-500 focus:ring-4 focus:ring-error-100 dark:focus:ring-error-900/30'
        : 'border-error-400 text-error-900 dark:!text-slate-50 placeholder-error-400 bg-white dark:!bg-slate-600/70 hover:border-error-500 hover:bg-error-50/30 dark:hover:!bg-slate-600/80 focus:border-error-500 focus:bg-white dark:focus:!bg-slate-600/90 focus:ring-4 focus:ring-error-100 dark:focus:ring-error-900/30'
      : variant === 'filled'
        ? 'bg-slate-50 dark:!bg-slate-600/70 text-slate-800 dark:!text-slate-50 placeholder-slate-400 dark:!placeholder-slate-300 hover:bg-slate-100 dark:hover:!bg-slate-600/80 focus:bg-white dark:focus:!bg-slate-600/90 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-500/30'
        : 'border-slate-300 dark:!border-slate-500 text-slate-800 dark:!text-slate-50 placeholder-slate-400 dark:!placeholder-slate-300 bg-white dark:!bg-slate-600/70 hover:border-slate-400 dark:hover:!border-slate-400 hover:bg-slate-50/50 dark:hover:!bg-slate-600/80 focus:border-primary-500 dark:focus:!border-primary-400 focus:bg-white dark:focus:!bg-slate-600/90 focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-500/30';

    // Adjust padding based on required asterisk and icons
    const paddingLeft = props.required && !leftIcon ? 'pl-8' : (leftIcon ? 'pl-11' : '');
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
      borderRadius: '0.75rem',
    };

    // Track value changes for floating label effect
    useEffect(() => {
      const element = useTextarea ? textareaRef.current : inputRef.current;
      if (element) {
        const checkValue = () => {
          setHasValue(!!element.value);
        };
        checkValue();
        element.addEventListener('input', checkValue);
        return () => element.removeEventListener('input', checkValue);
      }
    }, [useTextarea, props.value]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setIsFocused(true);
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setIsFocused(false);
      props.onBlur?.(e);
    };

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2.5 material-transition"
            aria-required={props.required}
          >
            <span className="bg-gradient-to-r from-slate-800 to-slate-700 dark:from-slate-100 dark:to-slate-200 bg-clip-text text-transparent">{label}</span>
            {props.required && (
              <span className="text-error-500 font-black ml-1" aria-label="حقل مطلوب">*</span>
            )}
          </label>
        )}
        <div className="relative group">
          {/* Premium Glow effect on focus */}
          {variant === 'outlined' && (
            <div
              className={`absolute -inset-0.5 rounded-lg opacity-0 group-focus-within:opacity-100 material-transition blur-sm -z-10`}
              style={{
                background: hasError
                  ? 'linear-gradient(135deg, rgba(234, 84, 85, 0.3) 0%, rgba(234, 84, 85, 0.1) 100%)'
                  : 'linear-gradient(135deg, rgba(115, 103, 240, 0.3) 0%, rgba(115, 103, 240, 0.1) 100%)',
                transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          )}

          {/* Required asterisk - positioned inside the field on the left side (RTL) */}
          {props.required && (
            <span
              className={`absolute top-1/2 transform -translate-y-1/2 text-error-500 text-lg font-bold z-30 pointer-events-none ${leftIcon ? 'left-10' : 'left-2.5'
                }`}
              style={{
                lineHeight: 1,
                display: 'block',
              }}
              aria-hidden="true"
            >
              *
            </span>
          )}


          {leftIcon && (
            <div
              className={`absolute left-3.5 top-1/2 transform -translate-y-1/2 pointer-events-none z-20 material-transition ${isFocused ? 'text-primary-500' : hasError ? 'text-error-500' : 'text-slate-400'
                }`}
            >
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
              aria-invalid={hasError}
              aria-describedby={hasError ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
              aria-required={props.required}
              style={{
                ...commonStyle,
                ...props.style,
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
              aria-invalid={hasError}
              aria-describedby={hasError ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
              aria-required={props.required}
              style={{
                ...commonStyle,
                ...props.style,
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
              className="absolute right-3 top-1/2 transform -translate-y-1/2 z-10 p-1.5 rounded-md text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-slate-700/60 active:bg-primary-100 dark:active:bg-slate-700/80 material-transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/20 active:scale-95"
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
            <div
              className={`absolute right-3.5 top-1/2 transform -translate-y-1/2 z-10 material-transition ${isFocused ? 'text-primary-500' : hasError ? 'text-error-500' : 'text-slate-400'
                }`}
            >
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p
            id={`${inputId}-error`}
            role="alert"
            className="mt-1 text-xs text-error-600 animate-fade-in flex items-center gap-1 error-message"
            aria-live="polite"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </p>
        )}
        {helperText && !error && (
          <p
            id={`${inputId}-helper`}
            className="mt-1 text-xs text-secondary-500 animate-fade-in flex items-center gap-1"
            aria-live="polite"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>{helperText}</span>
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
export type { InputProps };

