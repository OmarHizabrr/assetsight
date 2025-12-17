'use client';

import { HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
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
  const baseStyles = 'rounded-2xl material-transition backdrop-blur-sm relative overflow-hidden gpu-accelerated';
  
  // تحسين Variants مع استخدام متغيرات Design Tokens + Dark Mode
  const variants = {
    default: 'bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:shadow-xl hover:border-primary-200 dark:hover:border-primary-700 hover:scale-[1.005]',
    elevated: 'bg-white dark:bg-slate-800/50 shadow-xl border border-slate-200 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-700 hover:scale-[1.005]',
    outlined: 'bg-white dark:bg-slate-800/50 border-2 border-slate-300 dark:border-slate-600 hover:border-primary-400 dark:hover:border-primary-600 hover:shadow-lg hover:scale-[1.005]',
    flat: 'bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:shadow-md hover:scale-[1.002]',
  };

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const hoverStyles = hover
    ? 'hover:shadow-2xl hover:shadow-primary-500/10 hover:scale-[1.01] cursor-pointer material-transition hover:border-primary-300 animate-fade-in group'
    : 'group';

  // Build className consistently to avoid hydration issues
  const classParts = [
    baseStyles,
    variants[variant],
    paddings[padding],
    hoverStyles,
    className
  ].filter(Boolean);
  
  const combinedClassName = classParts.join(' ').trim().replace(/\s+/g, ' ');
  
  return (
    <div 
      className={combinedClassName} 
      {...props} 
      suppressHydrationWarning
    >
      {/* Enhanced gradient overlay on hover - مستوحى من DawamWeb */}
      {hover && (
        <>
          <div 
            className="absolute inset-0 bg-gradient-to-br from-primary-500/0 via-primary-500/0 to-primary-500/5 opacity-0 group-hover:opacity-100 material-transition pointer-events-none rounded-2xl" 
            aria-hidden="true" 
            suppressHydrationWarning
          />
          {/* Glow effect on hover */}
          <div 
            className="absolute -inset-0.5 bg-primary-500/0 group-hover:bg-primary-500/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 material-transition pointer-events-none -z-10" 
            aria-hidden="true" 
            suppressHydrationWarning
          />
        </>
      )}
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
    <div 
      className={`px-6 py-5 border-b border-slate-200 dark:border-slate-700 relative overflow-hidden animate-fade-in ${className}`} 
      {...props}
    >
      {/* Enhanced decorative accent line - مستوحى من Vuexy */}
      <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-primary-500 via-primary-600 to-primary-500 opacity-0 group-hover:opacity-100 material-transition" aria-hidden="true" />
      {/* Subtle shine effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 material-transition pointer-events-none" aria-hidden="true" />
      {(title || subtitle || action) && (
        <div className="flex items-start justify-between gap-4 relative z-10">
          <div className="flex-1 min-w-0">
            {title && (
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1.5 material-transition">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">{subtitle}</p>
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
  
  // Remove padding classes from className if padding prop is provided to avoid conflicts
  const cleanClassName = paddingClass 
    ? className.replace(/\b(p-\d+|px-\d+|py-\d+|pt-\d+|pb-\d+|pl-\d+|pr-\d+)\b/g, '').trim()
    : className.trim();
  
  // Combine classes properly to avoid hydration issues - always return consistent structure
  const classParts = [paddingClass, cleanClassName].filter(Boolean);
  const combinedClassName = classParts.length > 0 
    ? classParts.join(' ').trim().replace(/\s+/g, ' ')
    : '';

  return (
    <div className={combinedClassName || undefined} {...props} suppressHydrationWarning>
      {children}
    </div>
  );
}

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

export function CardFooter({ children, className = '', ...props }: CardFooterProps) {
  return (
    <div className={`mt-4 pt-4 border-t border-secondary-300 dark:border-slate-700 ${className}`} {...props}>
      {children}
    </div>
  );
}

