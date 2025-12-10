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
  const baseStyles = 'rounded-xl transition-all duration-200';
  
  const variants = {
    default: 'bg-white shadow-soft border border-secondary-100',
    elevated: 'bg-white shadow-medium border border-secondary-100',
    outlined: 'bg-white border-2 border-secondary-200',
    flat: 'bg-secondary-50',
  };

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const hoverStyles = hover
    ? 'hover:shadow-medium hover:-translate-y-0.5 cursor-pointer'
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
    <div className={`mb-4 ${className}`} {...props}>
      {(title || subtitle || action) && (
        <div className="flex items-start justify-between mb-2">
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-secondary-900 mb-1">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-secondary-500">{subtitle}</p>
            )}
          </div>
          {action && <div>{action}</div>}
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
    <div className={`mt-4 pt-4 border-t border-secondary-200 ${className}`} {...props}>
      {children}
    </div>
  );
}

