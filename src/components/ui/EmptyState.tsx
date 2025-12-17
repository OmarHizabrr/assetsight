'use client';

import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'search' | 'error' | 'success';
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  secondaryAction,
  size = 'md',
  variant = 'default',
}: EmptyStateProps) {
  const sizes = {
    sm: {
      container: 'py-8 px-6',
      icon: 'w-16 h-16',
      title: 'text-lg',
      description: 'text-sm',
    },
    md: {
      container: 'py-12 px-8',
      icon: 'w-20 h-20',
      title: 'text-xl',
      description: 'text-base',
    },
    lg: {
      container: 'py-16 px-10',
      icon: 'w-24 h-24',
      title: 'text-2xl',
      description: 'text-lg',
    },
  };

  const variantStyles = {
    default: {
      iconBg: 'bg-gradient-to-br from-slate-100 to-slate-200',
      iconColor: 'text-slate-500',
    },
    search: {
      iconBg: 'bg-gradient-to-br from-primary-100 to-primary-200',
      iconColor: 'text-primary-600',
    },
    error: {
      iconBg: 'bg-gradient-to-br from-error-100 to-error-200',
      iconColor: 'text-error-600',
    },
    success: {
      iconBg: 'bg-gradient-to-br from-success-100 to-success-200',
      iconColor: 'text-success-600',
    },
  };

  const defaultIcons = {
    default: (
      <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
    ),
    search: (
      <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    error: (
      <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    success: (
      <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  const currentSize = sizes[size];
  const currentVariant = variantStyles[variant];
  const displayIcon = icon || defaultIcons[variant];

  return (
    <div 
      className={`flex flex-col items-center justify-center ${currentSize.container} text-center animate-fade-in`}
      role="status"
      aria-live="polite"
    >
      {/* Icon Container */}
      <div 
        className={`
          ${currentSize.icon} 
          ${currentVariant.iconBg} 
          ${currentVariant.iconColor}
          rounded-full 
          flex items-center justify-center 
          mb-6 
          material-transition
          shadow-md
          hover:scale-110
          p-4
        `}
      >
        {displayIcon}
      </div>

      {/* Title */}
      <h3 className={`${currentSize.title} font-bold text-slate-800 mb-3`}>
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className={`${currentSize.description} text-slate-600 max-w-md mb-6 leading-relaxed`}>
          {description}
        </p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center mt-2">
          {action && (
            <Button
              variant="primary"
              size="md"
              onClick={action.onClick}
              leftIcon={action.icon}
              className="min-w-[140px]"
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="ghost"
              size="md"
              onClick={secondaryAction.onClick}
              className="min-w-[140px]"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Specialized Empty States

export function NoDataEmptyState({ onRefresh }: { onRefresh?: () => void }) {
  return (
    <EmptyState
      variant="default"
      title="لا توجد بيانات"
      description="لم يتم العثور على أي بيانات لعرضها حالياً"
      action={onRefresh ? {
        label: 'تحديث',
        onClick: onRefresh,
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        ),
      } : undefined}
    />
  );
}

export function NoSearchResultsEmptyState({ query, onClearSearch }: { query?: string; onClearSearch?: () => void }) {
  return (
    <EmptyState
      variant="search"
      title="لا توجد نتائج"
      description={query ? `لم نتمكن من العثور على نتائج تطابق "${query}"` : 'لم نتمكن من العثور على أي نتائج'}
      action={onClearSearch ? {
        label: 'مسح البحث',
        onClick: onClearSearch,
      } : undefined}
    />
  );
}

export function ErrorEmptyState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <EmptyState
      variant="error"
      title="حدث خطأ"
      description={message || 'عذراً، حدث خطأ أثناء تحميل البيانات'}
      action={onRetry ? {
        label: 'إعادة المحاولة',
        onClick: onRetry,
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        ),
      } : undefined}
    />
  );
}

export function SuccessEmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <EmptyState
      variant="success"
      title={title}
      description={description}
    />
  );
}

export function NoItemsEmptyState({ 
  entityName, 
  onAdd 
}: { 
  entityName: string; 
  onAdd?: () => void;
}) {
  return (
    <EmptyState
      variant="default"
      title={`لا توجد ${entityName}`}
      description={`لم يتم إضافة أي ${entityName} حتى الآن. ابدأ بإضافة ${entityName} جديد.`}
      action={onAdd ? {
        label: `إضافة ${entityName}`,
        onClick: onAdd,
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        ),
      } : undefined}
    />
  );
}

