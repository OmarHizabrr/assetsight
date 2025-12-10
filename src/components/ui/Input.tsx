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

    const baseStyles = 'block w-full rounded-md border-b-2 border-t-0 border-l-0 border-r-0 border-secondary-300 bg-transparent px-0 py-2 text-sm material-transition focus:outline-none focus:ring-0 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const inputStyles = hasError
      ? 'border-error-500 text-error-900 placeholder-error-400 focus:border-error-600'
      : 'text-secondary-900 placeholder-secondary-400';

    const combinedInputClassName = `
      ${baseStyles}
      ${inputStyles}
      ${leftIcon ? 'pr-10' : ''}
      ${rightIcon ? 'pl-10' : ''}
      ${className}
    `.trim().replace(/\s+/g, ' ');

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        <div className="relative pt-6">
          {label && (
            <label
              htmlFor={inputId}
              className="block text-xs font-medium text-secondary-600 absolute top-0 right-0 pointer-events-none material-transition"
            >
              {label}
              {props.required && <span className="text-error-500 mr-1">*</span>}
            </label>
          )}
          {leftIcon && (
            <div className="absolute right-0 bottom-2 text-secondary-500 pointer-events-none z-10">
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
            <div className="absolute left-0 bottom-2 text-secondary-500 pointer-events-none z-10">
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

