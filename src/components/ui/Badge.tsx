'use client';

import { HTMLAttributes } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'accent' | 'outline';
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
  const baseStyles = 'inline-flex items-center font-bold rounded-xl shadow-md material-transition hover:shadow-lg hover:scale-105';
  
  const variants = {
    primary: 'bg-gradient-to-r from-primary-500 to-primary-600 text-white border-2 border-primary-400 shadow-primary-500/30',
    secondary: 'bg-gradient-to-r from-slate-500 to-slate-600 text-white border-2 border-slate-400 shadow-slate-500/30',
    success: 'bg-gradient-to-r from-success-500 to-success-600 text-white border-2 border-success-400 shadow-success-500/30',
    warning: 'bg-gradient-to-r from-warning-500 to-warning-600 text-white border-2 border-warning-400 shadow-warning-500/30',
    error: 'bg-gradient-to-r from-error-500 to-error-600 text-white border-2 border-error-400 shadow-error-500/30',
    accent: 'bg-gradient-to-r from-accent-500 to-accent-600 text-white border-2 border-accent-400 shadow-accent-500/30',
    outline: 'bg-transparent text-slate-700 border-2 border-slate-300 hover:border-primary-400 hover:text-primary-700 shadow-sm',
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
    <span className={`${combinedClassName} relative overflow-hidden group`} {...props}>
      <span className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 material-transition"></span>
      <span className="relative z-10 flex items-center gap-1.5">
        {dot && (
          <span
            className={`rounded-full ${dotSizes[size]} bg-white/80 shadow-sm animate-pulse`}
          />
        )}
        {children}
      </span>
    </span>
  );
}

