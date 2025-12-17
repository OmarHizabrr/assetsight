'use client';

import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef, useEffect, useId, useRef, useState } from 'react';

type InputElementProps = InputHTMLAttributes<HTMLInputElement>;
type TextareaElementProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

interface InputV2Props extends Omit<InputElementProps & TextareaElementProps, 'onFocus' | 'onBlur'> {
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
  variant?: 'outlined' | 'filled' | 'standard';
  floatingLabel?: boolean;
  onFocus?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const InputV2 = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputV2Props>(
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
      variant = 'outlined',
      floatingLabel = true,
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

    // Auto-resize functionality
    useEffect(() => {
      if (!useTextarea) return;
      const textarea = textareaRef.current;
      if (!textarea) return;

      const adjustHeight = () => {
        textarea.style.height = 'auto';
        const lineHeightPx = 24;
        const paddingTop = variant === 'outlined' ? 14 : 12;
        const paddingBottom = variant === 'outlined' ? 14 : 12;
        const borderWidth = variant === 'outlined' ? 2 : 0;
        const totalPadding = paddingTop + paddingBottom + borderWidth;
        const scrollHeight = textarea.scrollHeight;
        const minHeight = rows ? `${rows * lineHeightPx + totalPadding}px` : `${lineHeightPx + totalPadding}px`;
        const calculatedMinHeight = parseInt(minHeight);
        const newHeight = Math.max(scrollHeight, calculatedMinHeight);
        textarea.style.height = `${newHeight}px`;
      };

      setTimeout(adjustHeight, 0);
      textarea.addEventListener('input', adjustHeight);
      window.addEventListener('resize', adjustHeight);
      
      return () => {
        textarea.removeEventListener('input', adjustHeight);
        window.removeEventListener('resize', adjustHeight);
      };
    }, [rows, useTextarea, variant]);

    // Track value changes
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

    // Variant styles
    const variantStyles = {
      outlined: {
        base: 'border-2 rounded-xl bg-white',
        normal: 'border-slate-300 hover:border-primary-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-100',
        error: 'border-error-400 hover:border-error-500 focus:border-error-500 focus:ring-4 focus:ring-error-100',
        padding: floatingLabel && label ? 'pt-6 pb-2' : 'py-3',
      },
      filled: {
        base: 'border-b-2 rounded-t-xl bg-slate-50',
        normal: 'border-slate-300 hover:bg-slate-100 hover:border-primary-400 focus:border-primary-500 focus:ring-0 focus:bg-white',
        error: 'border-error-400 hover:border-error-500 focus:border-error-500 focus:ring-0',
        padding: floatingLabel && label ? 'pt-7 pb-2' : 'py-3.5',
      },
      standard: {
        base: 'border-b-2 rounded-none bg-transparent',
        normal: 'border-slate-300 hover:border-primary-400 focus:border-primary-500 focus:ring-0',
        error: 'border-error-400 hover:border-error-500 focus:border-error-500 focus:ring-0',
        padding: floatingLabel && label ? 'pt-5 pb-1' : 'py-2',
      },
    };

    const currentVariant = variantStyles[variant];
    const baseStyles = `
      block w-full px-4 text-base font-medium transition-all duration-300 
      focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed
      ${currentVariant.base}
      ${hasError ? currentVariant.error : currentVariant.normal}
      ${currentVariant.padding}
    `.trim().replace(/\s+/g, ' ');

    const paddingLeft = leftIcon ? 'pl-12' : '';
    const paddingRight = hasRightElement ? 'pr-12' : '';

    const combinedInputClassName = `
      ${baseStyles}
      ${paddingLeft}
      ${paddingRight}
      ${className}
    `.trim().replace(/\s+/g, ' ');

    const labelPosition = floatingLabel && (isFocused || hasValue || props.placeholder)
      ? 'top-2 text-xs'
      : floatingLabel
      ? 'top-1/2 -translate-y-1/2 text-base'
      : '';

    const labelColor = hasError
      ? 'text-error-600'
      : isFocused
      ? 'text-primary-600'
      : 'text-slate-600';

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        <div className="relative group">
          {/* Floating Label */}
          {label && floatingLabel && (
            <label
              htmlFor={inputId}
              className={`
                absolute right-4 pointer-events-none transition-all duration-300 font-semibold
                ${labelPosition}
                ${labelColor}
                ${leftIcon && 'right-12'}
              `.trim().replace(/\s+/g, ' ')}
              style={{
                transformOrigin: 'right top',
              }}
            >
              {label}
              {props.required && (
                <span className="text-error-500 mr-1">*</span>
              )}
            </label>
          )}

          {/* Static Label */}
          {label && !floatingLabel && (
            <label
              htmlFor={inputId}
              className="block text-sm font-bold text-slate-700 mb-2.5"
            >
              {label}
              {props.required && (
                <span className="text-error-500 mr-1">*</span>
              )}
            </label>
          )}

          {/* Premium Glow Effect */}
          {variant === 'outlined' && (
            <div 
              className={`
                absolute -inset-1 rounded-xl opacity-0 group-focus-within:opacity-100 
                transition-opacity duration-300 blur-lg -z-10
              `}
              style={{ 
                background: hasError 
                  ? 'radial-gradient(circle, rgba(234, 84, 85, 0.3) 0%, transparent 70%)'
                  : 'radial-gradient(circle, rgba(115, 103, 240, 0.3) 0%, transparent 70%)',
              }}
            />
          )}
          
          {/* Left Icon */}
          {leftIcon && (
            <div className={`
              absolute left-4 pointer-events-none z-20 transition-all duration-300
              ${floatingLabel && label ? 'top-1/2 -translate-y-1/2' : 'top-1/2 -translate-y-1/2'}
              ${isFocused ? 'text-primary-500' : 'text-slate-400'}
            `.trim().replace(/\s+/g, ' ')}>
              {leftIcon}
            </div>
          )}
          
          {/* Input/Textarea */}
          {useTextarea ? (
            <textarea
              ref={textareaRef}
              id={inputId}
              className={combinedInputClassName}
              rows={rows}
              aria-invalid={hasError}
              aria-describedby={hasError ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
              aria-required={props.required}
              onFocus={handleFocus}
              onBlur={handleBlur}
              {...(props as TextareaElementProps)}
            />
          ) : (
            <input
              ref={inputRef}
              id={inputId}
              className={combinedInputClassName}
              type={showPasswordToggle && isPasswordVisible ? 'text' : type}
              aria-invalid={hasError}
              aria-describedby={hasError ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
              aria-required={props.required}
              onFocus={handleFocus}
              onBlur={handleBlur}
              {...(props as InputElementProps)}
            />
          )}
          
          {/* Password Toggle */}
          {showPasswordToggle && onTogglePassword && (
            <button
              type="button"
              onClick={onTogglePassword}
              className={`
                absolute left-3 z-10 p-2 rounded-lg transition-all duration-200
                ${floatingLabel && label ? 'top-1/2 -translate-y-1/2' : 'top-1/2 -translate-y-1/2'}
                ${isFocused || hasValue ? 'text-slate-600 hover:text-primary-600' : 'text-slate-400 hover:text-slate-600'}
                hover:bg-slate-100 active:bg-slate-200 active:scale-95
              `.trim().replace(/\s+/g, ' ')}
              tabIndex={-1}
              aria-label={isPasswordVisible ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
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

          {/* Right Icon */}
          {rightIcon && !showPasswordToggle && (
            <div className={`
              absolute left-4 pointer-events-none z-10 transition-all duration-300
              ${floatingLabel && label ? 'top-1/2 -translate-y-1/2' : 'top-1/2 -translate-y-1/2'}
              ${isFocused ? 'text-primary-500' : 'text-slate-400'}
            `.trim().replace(/\s+/g, ' ')}>
              {rightIcon}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <p 
            id={`${inputId}-error`}
            role="alert"
            className="mt-2 text-xs text-error-600 flex items-center gap-1.5 animate-fade-in font-medium"
            aria-live="polite"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </p>
        )}

        {/* Helper Text */}
        {helperText && !error && (
          <p 
            id={`${inputId}-helper`}
            className="mt-2 text-xs text-slate-500 flex items-center gap-1.5 animate-fade-in"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>{helperText}</span>
          </p>
        )}
      </div>
    );
  }
);

InputV2.displayName = 'InputV2';

export { InputV2 };
export type { InputV2Props };

