'use client';

import { SelectHTMLAttributes, forwardRef, useState } from 'react';

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  options: { value: string; label: string }[];
  fullWidth?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'outlined' | 'filled';
  leftIcon?: React.ReactNode;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      options,
      fullWidth = true,
      className = '',
      id,
      size = 'medium',
      variant = 'outlined',
      leftIcon,
      ...props
    },
    ref
  ) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error;
    const [isFocused, setIsFocused] = useState(false);

    // Size variants - محسّن من Input Component
    const sizeStyles = {
      small: 'px-3 py-2 text-sm min-h-[32px]',
      medium: 'px-3.5 py-2.5 text-base min-h-[38px]',
      large: 'px-4 py-3 text-base min-h-[44px]',
    };

    // Variant styles - مستوحى من Input
    const variantBaseStyles = variant === 'filled'
      ? 'rounded-lg border-2 border-transparent'
      : 'rounded-lg border-2';

    const baseStyles = `block w-full ${variantBaseStyles} ${sizeStyles[size]} font-medium material-transition focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer`;
    
    const selectStyles = hasError
      ? variant === 'filled'
        ? 'bg-error-50 text-error-900 hover:bg-error-100 focus:bg-white focus:border-error-500 focus:ring-4 focus:ring-error-100'
        : 'border-error-400 text-error-900 bg-white hover:border-error-500 hover:bg-error-50/30 focus:border-error-500 focus:bg-white focus:ring-4 focus:ring-error-100'
      : variant === 'filled'
        ? 'bg-slate-50 text-slate-800 hover:bg-slate-100 focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100'
        : 'border-slate-300 text-slate-800 bg-white hover:border-slate-400 hover:bg-slate-50/50 focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-100';

    // Adjust padding for icon
    const paddingLeft = leftIcon ? 'pl-11' : '';
    const paddingRight = size === 'small' ? 'pr-9' : size === 'large' ? 'pr-11' : 'pr-10';

    const combinedSelectClassName = `
      ${baseStyles}
      ${selectStyles}
      ${paddingLeft}
      ${paddingRight}
      ${className}
    `.trim().replace(/\s+/g, ' ');

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-bold text-slate-700 mb-2.5 material-transition"
          >
            <span className="bg-gradient-to-r from-slate-800 to-slate-700 bg-clip-text text-transparent">
            {label}
            </span>
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
          
          {/* Left Icon */}
          {leftIcon && (
            <div 
              className={`absolute left-3.5 top-1/2 transform -translate-y-1/2 pointer-events-none z-20 material-transition ${
                isFocused ? 'text-primary-500' : hasError ? 'text-error-500' : 'text-slate-400'
              }`}
            >
              {leftIcon}
            </div>
          )}
          
          <select
            ref={ref}
            id={selectId}
            className={combinedSelectClassName}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            aria-invalid={hasError}
            aria-describedby={hasError ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
            aria-required={props.required}
            {...props}
          >
            <option value="">اختر...</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          {/* أيقونة السهم المخصصة */}
          <div className={`absolute right-3.5 top-1/2 transform -translate-y-1/2 pointer-events-none z-10 material-transition ${
            isFocused ? 'text-primary-500' : hasError ? 'text-error-500' : 'text-slate-400'
          }`}>
            <svg 
              className="w-5 h-5 material-transition" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        
        {/* Error Message */}
        {error && (
          <p 
            id={`${selectId}-error`}
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
            id={`${selectId}-helper`}
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

Select.displayName = 'Select';

export { Select };
export type { SelectProps };

