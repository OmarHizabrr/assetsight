'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'outline' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-full material-transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed normal-case text-sm';
    
    const variants = {
      primary: 'text-white font-medium hover:opacity-90 focus:ring-primary-500',
      secondary: 'text-white font-medium hover:opacity-90 focus:ring-gray-500',
      success: 'text-white font-medium hover:opacity-90 focus:ring-success-500',
      warning: 'text-white font-medium hover:opacity-90 focus:ring-warning-500',
      error: 'text-white font-medium hover:opacity-90 focus:ring-error-500',
      outline: 'border border-primary-500 text-primary-600 font-medium hover:bg-primary-50 focus:ring-primary-500 bg-white',
      ghost: 'text-primary-600 font-medium hover:bg-primary-50 focus:ring-primary-500 bg-transparent',
    };

    const sizes = {
      xs: 'px-3 py-1.5 text-xs gap-1.5 min-h-[28px]',
      sm: 'px-4 py-2 text-sm gap-2 min-h-[32px]',
      md: 'px-5 py-2.5 text-sm gap-2 min-h-[36px]',
      lg: 'px-6 py-3 text-base gap-2.5 min-h-[40px]',
      xl: 'px-7 py-3.5 text-base gap-3 min-h-[48px]',
    };

    const iconSizes = {
      xs: 'w-3 h-3',
      sm: 'w-4 h-4',
      md: 'w-4 h-4',
      lg: 'w-5 h-5',
      xl: 'w-5 h-5',
    };

    // Ensure variant styles are applied correctly
    const variantStyles = variants[variant] || variants.primary;
    
    // Vuexy color styles
    const colorStyles = {
      primary: { backgroundColor: '#7367f0', borderColor: '#7367f0' },
      secondary: { backgroundColor: '#a8aaae', borderColor: '#a8aaae' },
      success: { backgroundColor: '#28c76f', borderColor: '#28c76f' },
      warning: { backgroundColor: '#ff9f43', borderColor: '#ff9f43' },
      error: { backgroundColor: '#ea5455', borderColor: '#ea5455' },
      outline: {},
      ghost: {},
    };
    
    const buttonStyle = colorStyles[variant] || colorStyles.primary;
    
    const combinedClassName = `
      ${baseStyles}
      ${variantStyles}
      ${sizes[size]}
      ${fullWidth ? 'w-full' : ''}
      ${className}
    `.trim().replace(/\s+/g, ' ');

    return (
      <button
        ref={ref}
        className={combinedClassName}
        style={buttonStyle}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className={`animate-spin ${iconSizes[size]}`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>جاري التحميل...</span>
          </>
        ) : (
          <>
            {leftIcon && (
              <span className={iconSizes[size]}>
                {leftIcon}
              </span>
            )}
            <span>{children}</span>
            {rightIcon && (
              <span className={iconSizes[size]}>
                {rightIcon}
              </span>
            )}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
export type { ButtonProps };

