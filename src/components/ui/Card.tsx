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
  const baseStyles = 'rounded-lg material-transition';
  
  const variants = {
    default: 'bg-white shadow-elevation-2',
    elevated: 'bg-white shadow-elevation-4',
    outlined: 'bg-white border border-secondary-300 shadow-elevation-0',
    flat: 'bg-white shadow-elevation-0',
  };

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const hoverStyles = hover
    ? 'hover:shadow-elevation-8 hover:-translate-y-1 cursor-pointer material-transition'
    : '';

  const combinedClassName = `
    ${baseStyles}
    ${variants[variant]}
    ${paddings[padding]}
    ${hoverStyles}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className={combinedClassName} {...props}>
      {children}
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
    <div className={`px-6 py-5 ${className}`} {...props}>
      {(title || subtitle || action) && (
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {title && (
              <h3 className="text-2xl font-medium text-secondary-900 mb-1.5">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-secondary-600 font-normal leading-relaxed">{subtitle}</p>
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

