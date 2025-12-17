'use client';

import { ButtonHTMLAttributes, forwardRef, useEffect, useRef, useState } from 'react';

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
    const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const rippleIdRef = useRef(0);

    // Combine refs
    useEffect(() => {
      if (typeof ref === 'function') {
        ref(buttonRef.current);
      } else if (ref) {
        (ref as any).current = buttonRef.current;
      }
    }, [ref]);

    // Enhanced Ripple Effect
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || isLoading) return;
      
      const button = buttonRef.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const newRipple = {
        id: rippleIdRef.current++,
        x,
        y,
      };

      setRipples((prev) => [...prev, newRipple]);

      // Remove ripple after animation
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
      }, 600);

      // Call original onClick if provided
      if (props.onClick) {
        props.onClick(e);
      }
    };

    const baseStyles = 'inline-flex items-center justify-center font-bold rounded-lg material-transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed normal-case relative overflow-hidden group gpu-accelerated';
    
    const variants = {
      primary: 'text-white hover:shadow-button-hover hover:scale-[1.02] focus:ring-primary-500 active:scale-[0.98] hover:brightness-110',
      secondary: 'text-white hover:shadow-xl hover:shadow-gray-500/30 hover:scale-[1.02] focus:ring-gray-500 active:scale-[0.98] hover:brightness-110',
      success: 'text-white hover:shadow-success hover:scale-[1.02] focus:ring-success-500 active:scale-[0.98] hover:brightness-110',
      warning: 'text-white hover:shadow-warning hover:scale-[1.02] focus:ring-warning-500 active:scale-[0.98] hover:brightness-110',
      error: 'text-white hover:shadow-error hover:scale-[1.02] focus:ring-error-500 active:scale-[0.98] hover:brightness-110',
      outline: 'border-2 border-primary-500 text-primary-600 hover:bg-primary-50 hover:border-primary-600 hover:shadow-lg hover:shadow-primary-500/20 hover:scale-[1.02] focus:ring-primary-500 bg-white active:scale-[0.98]',
      ghost: 'text-primary-600 hover:bg-primary-50 hover:shadow-md hover:shadow-primary-500/10 hover:scale-[1.02] focus:ring-primary-500 bg-transparent active:scale-[0.98]',
    };

    // Size variants - مطابق لـ DawamWeb
    const sizes = {
      xs: 'px-3 py-1.5 text-xs gap-1.5 min-h-[28px]',
      sm: 'px-4 py-2 text-sm gap-2 min-h-[32px]',
      md: 'px-5 py-2.5 text-sm gap-2 min-h-[38px]',
      lg: 'px-6 py-3 text-base gap-2.5 min-h-[44px]',
      xl: 'px-8 py-3.5 text-base gap-3 min-h-[50px]',
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
    
    // Enhanced hover overlay effects - مستوحى من DawamWeb
    const hoverOverlay = variant !== 'outline' && variant !== 'ghost' ? (
      <>
        {/* Shine effect on hover - تأثير اللمعان */}
        <span 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 material-transition rounded-lg transform -translate-x-full group-hover:translate-x-full" 
          style={{ transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
          aria-hidden="true"
        />
        {/* Brightness overlay */}
        <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 material-transition rounded-lg" aria-hidden="true" />
        {/* Glow effect - subtle */}
        <span className="absolute -inset-0.5 bg-primary-500/0 group-hover:bg-primary-500/20 rounded-lg blur-md opacity-0 group-hover:opacity-100 material-transition -z-10" aria-hidden="true" />
      </>
    ) : variant === 'outline' ? (
      <>
        {/* Outline hover glow */}
        <span className="absolute -inset-0.5 bg-primary-500/0 group-hover:bg-primary-500/10 rounded-lg blur-sm opacity-0 group-hover:opacity-100 material-transition -z-10" aria-hidden="true" />
      </>
    ) : null;

    // Ripple effects
    const rippleElements = ripples.map((ripple) => (
      <span
        key={ripple.id}
        className="absolute rounded-full bg-white/40 pointer-events-none animate-pulse-soft"
        style={{
          left: ripple.x - 10,
          top: ripple.y - 10,
          width: 20,
          height: 20,
          animation: 'pulse-soft 0.6s ease-out',
          transform: 'scale(0)',
          animationFillMode: 'forwards',
        }}
      />
    ));
    
    const combinedClassName = `
      ${baseStyles}
      ${variantStyles}
      ${sizes[size]}
      ${fullWidth ? 'w-full' : ''}
      ${className}
    `.trim().replace(/\s+/g, ' ');

    return (
      <button
        ref={buttonRef}
        className={combinedClassName}
        style={buttonStyle}
        disabled={disabled || isLoading}
        onClick={handleClick}
        aria-busy={isLoading}
        aria-disabled={disabled || isLoading}
        aria-label={props['aria-label'] || (typeof children === 'string' ? children : undefined)}
        {...props}
      >
        {hoverOverlay}
        {rippleElements}
        
        {/* Loading State with Enhanced Animation */}
        {isLoading ? (
          <span className="relative z-10 flex items-center gap-2 animate-fade-in">
            <svg
              className={`animate-spin ${iconSizes[size]} text-white`}
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
            <span className="animate-pulse-soft">جاري التحميل...</span>
          </span>
        ) : (
          <span className="relative z-10 flex items-center gap-2">
            {leftIcon && (
              <span className={`${iconSizes[size]} flex items-center justify-center material-transition group-hover:scale-110`}>
                {leftIcon}
              </span>
            )}
            <span className="material-transition">{children}</span>
            {rightIcon && (
              <span className={`${iconSizes[size]} flex items-center justify-center material-transition group-hover:scale-110`}>
                {rightIcon}
              </span>
            )}
          </span>
        )}
        
        {/* Disabled Overlay */}
        {(disabled || isLoading) && (
          <span className="absolute inset-0 bg-white/20 rounded-full cursor-not-allowed" />
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
export type { ButtonProps };

