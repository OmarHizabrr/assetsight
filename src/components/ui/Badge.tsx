'use client';

import { HTMLAttributes } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
}

export function Badge({
  children,
  variant = 'primary',
  size = 'md',
  dot = false,
  className = '',
  ...props
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center font-medium rounded-md';
  
  const variants = {
    primary: 'bg-primary-50 text-primary-700 border border-primary-200',
    secondary: 'bg-secondary-50 text-secondary-700 border border-secondary-200',
    success: 'bg-success-50 text-success-700 border border-success-200',
    warning: 'bg-warning-50 text-warning-700 border border-warning-200',
    error: 'bg-error-50 text-error-700 border border-error-200',
    accent: 'bg-accent-50 text-accent-700 border border-accent-200',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-3 py-1 text-sm gap-1.5',
    lg: 'px-4 py-1.5 text-base gap-2',
  };

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  const combinedClassName = `
    ${baseStyles}
    ${variants[variant]}
    ${sizes[size]}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <span className={combinedClassName} {...props}>
      {dot && (
        <span
          className={`rounded-full ${dotSizes[size]} ${variants[variant].replace('bg-', 'bg-').replace('-100', '-500')}`}
        />
      )}
      {children}
    </span>
  );
}

