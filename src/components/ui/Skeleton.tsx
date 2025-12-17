'use client';

import { HTMLAttributes } from 'react';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  animation = 'wave',
  className = '',
  style,
  ...props
}: SkeletonProps) {
  const baseStyles = 'bg-slate-200 overflow-hidden relative';
  
  const variantStyles = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-lg',
  };

  const animationStyles = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };

  const defaultSizes = {
    text: { width: '100%', height: '1em' },
    circular: { width: '40px', height: '40px' },
    rectangular: { width: '100%', height: '100px' },
    rounded: { width: '100%', height: '100px' },
  };

  const finalWidth = width || defaultSizes[variant].width;
  const finalHeight = height || defaultSizes[variant].height;

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${animationStyles[animation]} ${className}`}
      style={{
        width: typeof finalWidth === 'number' ? `${finalWidth}px` : finalWidth,
        height: typeof finalHeight === 'number' ? `${finalHeight}px` : finalHeight,
        ...style,
      }}
      aria-busy="true"
      aria-live="polite"
      role="status"
      {...props}
    >
      {/* Shimmer effect */}
      {animation === 'wave' && (
        <div
          className="absolute inset-0"
          style={{
            background: 'var(--gradient-shimmer)',
            backgroundSize: '1000px 100%',
            animation: 'shimmer 2s infinite linear',
          }}
        />
      )}
      <span className="sr-only">جاري التحميل...</span>
    </div>
  );
}

// Skeleton Components المخصصة

export function SkeletonText({ lines = 3, ...props }: { lines?: number } & Omit<SkeletonProps, 'variant'>) {
  return (
    <div className="space-y-2" role="status" aria-label="جاري تحميل النص">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          variant="text"
          width={index === lines - 1 ? '80%' : '100%'}
          {...props}
        />
      ))}
    </div>
  );
}

export function SkeletonCard(props: Omit<SkeletonProps, 'variant'>) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-card space-y-4" role="status" aria-label="جاري تحميل البطاقة">
      <Skeleton variant="rectangular" height="200px" {...props} />
      <Skeleton variant="text" width="60%" />
      <SkeletonText lines={2} />
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden" role="status" aria-label="جاري تحميل الجدول">
      {/* Table Header */}
      <div className="bg-slate-50 p-4 border-b border-slate-200">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={`header-${index}`} variant="text" height="20px" />
          ))}
        </div>
      </div>
      
      {/* Table Rows */}
      <div className="divide-y divide-slate-200">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="p-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton key={`cell-${rowIndex}-${colIndex}`} variant="text" height="16px" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonAvatar({ size = 40 }: { size?: number }) {
  return (
    <Skeleton 
      variant="circular" 
      width={size} 
      height={size} 
      aria-label="جاري تحميل الصورة الشخصية"
    />
  );
}

export function SkeletonButton({ width = '120px', ...props }: { width?: string | number } & Omit<SkeletonProps, 'variant'>) {
  return (
    <Skeleton 
      variant="rounded" 
      width={width} 
      height="38px" 
      aria-label="جاري تحميل الزر"
      {...props} 
    />
  );
}

export function SkeletonForm({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-6" role="status" aria-label="جاري تحميل النموذج">
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton variant="text" width="30%" height="16px" />
          <Skeleton variant="rounded" height="38px" />
        </div>
      ))}
      <div className="flex gap-3 pt-4">
        <SkeletonButton width="120px" />
        <SkeletonButton width="100px" />
      </div>
    </div>
  );
}

export function SkeletonPage() {
  return (
    <div className="space-y-6 p-6" role="status" aria-label="جاري تحميل الصفحة">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton variant="text" width="40%" height="32px" />
          <Skeleton variant="text" width="60%" height="16px" />
        </div>
        <SkeletonButton width="140px" />
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-white rounded-2xl p-6 shadow-card space-y-3">
            <Skeleton variant="circular" width={48} height={48} />
            <Skeleton variant="text" width="70%" />
            <Skeleton variant="text" width="50%" height="24px" />
          </div>
        ))}
      </div>
      
      {/* Main Content */}
      <SkeletonTable rows={8} columns={5} />
    </div>
  );
}

