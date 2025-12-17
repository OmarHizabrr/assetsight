'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  helperText?: string;
  fullWidth?: boolean;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      helperText,
      fullWidth = false,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        <div className="flex items-start gap-3">
          <div className="flex items-center h-5">
            <input
              ref={ref}
              id={checkboxId}
              type="checkbox"
              className={`h-5 w-5 rounded-lg border-2 border-slate-300 text-primary-600 focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 material-transition cursor-pointer accent-primary-600 shadow-md hover:shadow-lg hover:border-primary-400 hover:scale-110 ${className}`}
              {...props}
            />
          </div>
          {label && (
            <div className="flex-1">
              <label
                htmlFor={checkboxId}
                className="text-sm font-medium text-slate-700 cursor-pointer"
              >
                {label}
                {props.required && <span className="text-error-500 mr-1">*</span>}
              </label>
              {helperText && (
                <p className="mt-1 text-xs text-secondary-500">{helperText}</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };

