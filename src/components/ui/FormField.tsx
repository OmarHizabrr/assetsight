'use client';

import { MaterialIcon } from "@/components/icons/MaterialIcon";
import { ReactNode } from "react";

export interface FormFieldProps {
  label?: string;
  error?: string;
  required?: boolean;
  helperText?: string;
  success?: boolean;
  successMessage?: string;
  children: ReactNode;
  htmlFor?: string;
  fullWidth?: boolean;
}

/**
 * FormField - مكون موحد لحقول النماذج
 * يوفر labels, error messages, success states, helper text
 */
export function FormField({
  label,
  error,
  required,
  helperText,
  success,
  successMessage,
  children,
  htmlFor,
  fullWidth = true,
}: FormFieldProps) {
  const hasError = !!error;
  const hasSuccess = success && !hasError;

  return (
    <div className={`form-field ${fullWidth ? 'w-full' : ''}`}>
      {/* Label */}
      {label && (
        <label
          htmlFor={htmlFor}
          className={`block text-sm font-semibold mb-2 material-transition ${
            hasError
              ? 'text-error-700'
              : hasSuccess
              ? 'text-success-700'
              : 'text-slate-700'
          }`}
        >
          {label}
          {required && (
            <span className="text-error-500 mr-1" aria-label="required">
              *
            </span>
          )}
        </label>
      )}

      {/* Input Field */}
      <div className="relative">
        {children}
      </div>

      {/* Error Message */}
      {hasError && (
        <div
          className="mt-2 flex items-start gap-2 text-sm text-error-700 animate-fade-in"
          role="alert"
          aria-live="polite"
        >
          <MaterialIcon
            name="error"
            className="text-error-500 flex-shrink-0 mt-0.5"
            size="sm"
          />
          <span className="flex-1">{error}</span>
        </div>
      )}

      {/* Success Message */}
      {hasSuccess && successMessage && (
        <div
          className="mt-2 flex items-start gap-2 text-sm text-success-700 animate-fade-in"
          role="status"
          aria-live="polite"
        >
          <MaterialIcon
            name="check_circle"
            className="text-success-500 flex-shrink-0 mt-0.5"
            size="sm"
          />
          <span className="flex-1">{successMessage}</span>
        </div>
      )}

      {/* Helper Text */}
      {!hasError && !hasSuccess && helperText && (
        <div className="mt-2 flex items-start gap-2 text-sm text-slate-500">
          <MaterialIcon
            name="info"
            className="text-slate-400 flex-shrink-0 mt-0.5"
            size="sm"
          />
          <span className="flex-1">{helperText}</span>
        </div>
      )}
    </div>
  );
}

/**
 * FormGroup - لتجميع عدة حقول
 */
export interface FormGroupProps {
  title?: string;
  description?: string;
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
}

export function FormGroup({
  title,
  description,
  children,
  columns = 1,
}: FormGroupProps) {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className="form-group space-y-4">
      {/* Group Header */}
      {(title || description) && (
        <div className="border-b-2 border-slate-200 pb-3">
          {title && (
            <h3 className="text-lg font-bold text-slate-900 mb-1">{title}</h3>
          )}
          {description && (
            <p className="text-sm text-slate-600">{description}</p>
          )}
        </div>
      )}

      {/* Group Content */}
      <div className={`grid ${gridClasses[columns]} gap-4`}>{children}</div>
    </div>
  );
}

/**
 * FormActions - لأزرار الإجراءات
 */
export interface FormActionsProps {
  children: ReactNode;
  align?: 'left' | 'center' | 'right';
  sticky?: boolean;
}

export function FormActions({
  children,
  align = 'right',
  sticky = false,
}: FormActionsProps) {
  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  };

  return (
    <div
      className={`form-actions flex flex-wrap items-center gap-3 pt-6 mt-6 border-t-2 border-slate-200 ${
        alignClasses[align]
      } ${
        sticky
          ? 'sticky bottom-0 bg-white/95 backdrop-blur-sm shadow-lg p-4 -mx-4 -mb-4 rounded-b-xl z-10'
          : ''
      }`}
    >
      {children}
    </div>
  );
}

