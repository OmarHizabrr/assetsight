'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
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
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error;

    const baseStyles = 'block w-full rounded-full border-2 bg-white px-4 py-3.5 text-sm font-medium material-transition focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm';
    
    const inputStyles = hasError
      ? 'border-error-300 text-error-900 placeholder-error-400 focus:border-error-500 focus:ring-error-500/20 bg-gradient-to-r from-error-50 to-error-50/70 shadow-error-200/50'
      : 'border-slate-200 text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:bg-white focus:shadow-lg focus:shadow-primary-500/15 hover:border-slate-300';

    const combinedInputClassName = `
      ${baseStyles}
      ${inputStyles}
      ${leftIcon ? 'pr-12' : ''}
      ${rightIcon ? 'pl-12' : ''}
      ${className}
    `.trim().replace(/\s+/g, ' ');

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-bold text-slate-800 mb-2.5"
          >
            {label}
            {props.required && <span className="text-error-500 mr-1">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none z-10">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={combinedInputClassName}
            placeholder={props.placeholder}
            {...props}
          />
          {rightIcon && (
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
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

