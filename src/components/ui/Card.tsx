'use client';

import { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export function Card({
  children,
  variant = 'default',
  padding = 'md',
  hover = false,
  className = '',
  ...props
}: CardProps) {
  const baseStyles = 'rounded-2xl material-transition backdrop-blur-sm relative overflow-hidden';
  
  const variants = {
    default: 'bg-white/95 shadow-lg border border-slate-200/60 hover:shadow-xl hover:border-primary-200/50 hover:scale-[1.01]',
    elevated: 'bg-white/95 shadow-xl border border-slate-200/60 hover:shadow-2xl hover:border-primary-200/50 hover:scale-[1.01]',
    outlined: 'bg-white/95 border-2 border-slate-300 hover:border-primary-300 hover:shadow-lg hover:scale-[1.01]',
    flat: 'bg-white/95 hover:shadow-md hover:scale-[1.005]',
  };

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const hoverStyles = hover
    ? 'hover:shadow-2xl hover:shadow-primary-500/10 hover:scale-[1.02] cursor-pointer material-transition hover:border-primary-200/50 hover:bg-gradient-to-br hover:from-white hover:to-primary-50/20'
    : '';

  const combinedClassName = `
    ${baseStyles}
    ${variants[variant]}
    ${paddings[padding]}
    ${hoverStyles}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  const borderColor = variant === 'outlined' ? '#dbdade' : '#dbdade';
  
  return (
    <div className={combinedClassName} style={{ borderColor }} {...props}>
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/0 via-primary-500/0 to-primary-500/0 group-hover:from-primary-500/5 group-hover:via-primary-500/0 group-hover:to-primary-500/5 material-transition pointer-events-none rounded-2xl"></div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function CardHeader({
  title,
  subtitle,
  action,
  className = '',
  children,
  ...props
}: CardHeaderProps) {
  return (
    <div className={`px-6 py-5 border-b border-slate-200/60 bg-gradient-to-br from-slate-50/60 via-white to-slate-50/40 backdrop-blur-sm relative overflow-hidden ${className}`} {...props}>
      {/* Decorative accent line */}
      <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-primary-500 via-primary-600 to-primary-500 opacity-0 group-hover:opacity-100 material-transition"></div>
      {(title || subtitle || action) && (
        <div className="flex items-start justify-between gap-4 relative z-10">
          <div className="flex-1 min-w-0">
            {title && (
              <h3 className="text-2xl font-bold text-slate-800 mb-2 bg-gradient-to-r from-slate-900 via-primary-700 to-slate-900 bg-clip-text text-transparent material-transition">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-slate-600 font-medium leading-relaxed">{subtitle}</p>
            )}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function CardBody({ children, className = '', padding, ...props }: CardBodyProps) {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const paddingClass = padding ? paddings[padding] : '';

  return (
    <div className={`${paddingClass} ${className}`} {...props}>
      {children}
    </div>
  );
}

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

export function CardFooter({ children, className = '', ...props }: CardFooterProps) {
  return (
    <div className={`mt-4 pt-4 border-t border-secondary-300 ${className}`} {...props}>
      {children}
    </div>
  );
}

