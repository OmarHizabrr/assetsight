'use client';

import { TextareaHTMLAttributes, forwardRef } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = true,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error;

    const baseStyles = 'block w-full rounded-xl border-2 bg-white px-4 py-3 text-sm font-medium material-transition focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed resize-none';
    
    const textareaStyles = hasError
      ? 'border-error-400 text-error-900 placeholder-error-400 focus:border-error-500 focus:ring-error-500/20 bg-error-50/50'
      : 'border-slate-200 text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:bg-white shadow-sm focus:shadow-md';

    const combinedTextareaClassName = `
      ${baseStyles}
      ${textareaStyles}
      ${className}
    `.trim().replace(/\s+/g, ' ');

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-semibold text-slate-700 mb-2"
          >
            {label}
            {props.required && <span className="text-error-500 mr-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={combinedTextareaClassName}
          placeholder={props.placeholder}
          {...props}
        />
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

Textarea.displayName = 'Textarea';

export { Textarea };
export type { TextareaProps };

