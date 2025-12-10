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

    const baseStyles = 'block w-full rounded-md border-b-2 border-t-0 border-l-0 border-r-0 border-secondary-300 bg-transparent px-0 py-2 text-sm material-transition focus:outline-none focus:ring-0 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed appearance-none bg-no-repeat bg-right pr-10';
    
    const selectStyles = hasError
      ? 'border-error-500 text-error-900 focus:border-error-600'
      : 'text-secondary-900';

    const combinedSelectClassName = `
      ${baseStyles}
      ${selectStyles}
      ${className}
    `.trim().replace(/\s+/g, ' ');

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        <div className="relative pt-6">
          {label && (
            <label
              htmlFor={selectId}
              className="block text-xs font-medium text-secondary-600 absolute top-0 right-0 pointer-events-none material-transition"
            >
              {label}
              {props.required && <span className="text-error-500 mr-1">*</span>}
            </label>
          )}
          <select
            ref={ref}
            id={selectId}
            className={combinedSelectClassName}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 0.5rem center',
              backgroundSize: '1.5em 1.5em',
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

