'use client';

import { SelectHTMLAttributes, forwardRef } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: { value: string; label: string }[];
  fullWidth?: boolean;
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
      ...props
    },
    ref
  ) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error;

    const baseStyles = 'block w-full rounded-full border-2 bg-white px-4 py-3.5 pr-12 text-sm font-medium material-transition focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer shadow-sm';
    
    const selectStyles = hasError
      ? 'border-error-300 text-error-900 placeholder-error-400 focus:border-error-500 focus:ring-error-500/20 bg-gradient-to-r from-error-50 to-error-50/70 shadow-error-200/50'
      : 'border-slate-200 text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:bg-white focus:shadow-lg focus:shadow-primary-500/15 hover:border-slate-300';

    const combinedSelectClassName = `
      ${baseStyles}
      ${selectStyles}
      ${className}
    `.trim().replace(/\s+/g, ' ');

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-bold text-slate-800 mb-2.5"
          >
            {label}
            {props.required && <span className="text-error-500 mr-1">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={combinedSelectClassName}
            style={{
              paddingRight: '2.75rem',
              paddingLeft: '1rem',
            }}
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
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none z-10">
            <svg 
              className={`w-5 h-5 transition-colors material-transition ${hasError ? 'text-error-500' : 'text-slate-500'}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
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

Select.displayName = 'Select';

export { Select };
export type { SelectProps };

