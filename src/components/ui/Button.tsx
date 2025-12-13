'use client';

import { ButtonHTMLAttributes, forwardRef, memo } from 'react';

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
    const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-full material-transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed normal-case relative overflow-hidden group backdrop-blur-sm';
    
    const variants = {
      primary: 'text-white font-bold hover:shadow-primary-lg hover:scale-[1.02] focus:ring-primary-500 active:scale-[0.98] hover:brightness-110',
      secondary: 'text-white font-bold hover:shadow-xl hover:shadow-gray-500/30 hover:scale-[1.02] focus:ring-gray-500 active:scale-[0.98] hover:brightness-110',
      success: 'text-white font-bold hover:shadow-success hover:scale-[1.02] focus:ring-success-500 active:scale-[0.98] hover:brightness-110',
      warning: 'text-white font-bold hover:shadow-warning hover:scale-[1.02] focus:ring-warning-500 active:scale-[0.98] hover:brightness-110',
      error: 'text-white font-bold hover:shadow-error hover:scale-[1.02] focus:ring-error-500 active:scale-[0.98] hover:brightness-110',
      outline: 'border-2 border-primary-500 text-primary-600 font-bold hover:bg-primary-50 hover:border-primary-600 hover:shadow-lg hover:shadow-primary-500/20 hover:scale-[1.02] focus:ring-primary-500 bg-white active:scale-[0.98] hover:backdrop-blur-sm',
      ghost: 'text-primary-600 font-bold hover:bg-primary-50 hover:shadow-md hover:shadow-primary-500/10 hover:scale-[1.02] focus:ring-primary-500 bg-transparent active:scale-[0.98]',
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
    
    // Premium color styles with enhanced gradients
    const colorStyles = {
      primary: { 
        background: 'linear-gradient(135deg, #7367f0 0%, #5e52d5 50%, #4a3fd0 100%)',
        borderColor: '#7367f0',
        boxShadow: '0 8px 24px rgba(115, 103, 240, 0.35), 0 4px 12px rgba(115, 103, 240, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
      },
      secondary: { 
        background: 'linear-gradient(135deg, #a8aaae 0%, #8e9095 50%, #75777c 100%)',
        borderColor: '#a8aaae',
        boxShadow: '0 8px 24px rgba(168, 170, 174, 0.35), 0 4px 12px rgba(168, 170, 174, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
      },
      success: { 
        background: 'linear-gradient(135deg, #28c76f 0%, #20b85a 50%, #1aa049 100%)',
        borderColor: '#28c76f',
        boxShadow: '0 8px 24px rgba(40, 199, 111, 0.35), 0 4px 12px rgba(40, 199, 111, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
      },
      warning: { 
        background: 'linear-gradient(135deg, #ff9f43 0%, #ff8c1a 50%, #ff7a00 100%)',
        borderColor: '#ff9f43',
        boxShadow: '0 8px 24px rgba(255, 159, 67, 0.35), 0 4px 12px rgba(255, 159, 67, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
      },
      error: { 
        background: 'linear-gradient(135deg, #ea5455 0%, #e63939 50%, #d32f2f 100%)',
        borderColor: '#ea5455',
        boxShadow: '0 8px 24px rgba(234, 84, 85, 0.35), 0 4px 12px rgba(234, 84, 85, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
      },
      outline: {},
      ghost: {},
    };
    
    const buttonStyle = colorStyles[variant] || colorStyles.primary;
    
    // Add premium hover overlay effect with shine
    const hoverOverlay = variant !== 'outline' && variant !== 'ghost' ? (
      <>
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 material-transition rounded-full transform -translate-x-full group-hover:translate-x-full" style={{ transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }}></span>
        <span className="absolute inset-0 bg-white/15 opacity-0 group-hover:opacity-100 material-transition rounded-full"></span>
      </>
    ) : null;
    
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
        {hoverOverlay}
        {isLoading ? (
          <span className="relative z-10 flex items-center gap-2">
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
          </span>
        ) : (
          <span className="relative z-10 flex items-center gap-2">
            {leftIcon && (
              <span className={`${iconSizes[size]} flex items-center justify-center`}>
                {leftIcon}
              </span>
            )}
            <span>{children}</span>
            {rightIcon && (
              <span className={`${iconSizes[size]} flex items-center justify-center`}>
                {rightIcon}
              </span>
            )}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
export type { ButtonProps };

