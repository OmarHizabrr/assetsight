'use client';

import { MaterialIcon } from '@/components/icons/MaterialIcon';
import { usePathname } from 'next/navigation';
import { Children, Fragment, cloneElement, isValidElement, type ReactElement } from 'react';

export interface AdminPageHeaderProps {
    title: string;
    subtitle?: string;
    iconName: string;
    count?: number;
    countIconName?: string;
    actions?: React.ReactNode;
    showOpenInNewTab?: boolean;
    className?: string;
}

export function AdminPageHeader({
    title,
    subtitle,
    iconName,
    count,
    countIconName,
    actions,
    showOpenInNewTab = true,
    className = '',
}: AdminPageHeaderProps) {
    const pathname = usePathname();

    const renderResponsiveActions = (node: React.ReactNode): React.ReactNode => {
        return Children.map(node, (child) => {
            if (!isValidElement(child)) return child;

            const element = child as ReactElement<any>;

            // Handle fragments by recursively mapping their children
            if (element.type === Fragment) {
                return <>{renderResponsiveActions(element.props.children)}</>;
            }

            const existingClassName = element.props?.className || '';
            const responsiveWidthClass = 'w-full';

            return cloneElement(element, {
                className: `${existingClassName} ${responsiveWidthClass}`.trim(),
            });
        });
    };

    return (
        <div className={`mb-10 relative animate-fade-in-down ${className}`.trim()}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-500/10 to-accent-500/10 rounded-full blur-3xl -z-10 animate-pulse-soft"></div>
            <div
                className="absolute top-10 left-10 w-48 h-48 bg-gradient-to-br from-success-500/5 to-warning-500/5 rounded-full blur-3xl -z-10 animate-pulse-soft"
                style={{ animationDelay: '0.5s' }}
            ></div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-6">
                <div className="space-y-3 min-w-0">
                    <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 flex items-center justify-center shadow-2xl shadow-primary-500/40 overflow-hidden group hover:scale-110 material-transition animate-float flex-shrink-0">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-transparent opacity-0 group-hover:opacity-100 material-transition"></div>
                            <MaterialIcon name={iconName} className="text-white relative z-10 group-hover:scale-110 material-transition" size="3xl" />
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-white/20 rounded-full blur-sm animate-pulse-soft"></div>
                            <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-white/10 rounded-full blur-sm animate-pulse-soft" style={{ animationDelay: '0.3s' }}></div>
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2 min-w-0">
                                <h1 className="text-4xl sm:text-5xl font-black text-gradient-primary truncate">{title}</h1>

                                {typeof count === 'number' && (
                                    <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-primary-50 dark:bg-primary-900/20 rounded-full border border-primary-200 dark:border-primary-700/40 animate-fade-in flex-shrink-0">
                                        <MaterialIcon name={countIconName || iconName} className="text-primary-600 dark:text-primary-300" size="sm" />
                                        <span className="text-xs font-semibold text-primary-700 dark:text-primary-200">{count}</span>
                                    </div>
                                )}

                                {showOpenInNewTab && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!pathname) return;
                                            window.open(pathname, '_blank', 'noopener,noreferrer');
                                        }}
                                        className="hidden sm:inline-flex items-center justify-center w-10 h-10 rounded-xl material-transition shadow-sm hover:shadow-md hover:scale-[1.03] active:scale-95 border bg-white/80 hover:bg-primary-50 text-slate-600 hover:text-primary-600 border-slate-200/60 dark:bg-slate-900/60 dark:hover:bg-slate-900 dark:text-slate-200 dark:hover:text-primary-300 dark:border-slate-700/60"
                                        aria-label="فتح الصفحة الحالية في تبويب جديد"
                                        title="فتح الصفحة الحالية في تبويب جديد"
                                    >
                                        <MaterialIcon name="open_in_new" size="md" className="relative z-10" />
                                    </button>
                                )}
                            </div>

                            {subtitle && (
                                <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg font-semibold flex items-center gap-2 animate-fade-in">
                                    <MaterialIcon name="info" className="text-slate-400" size="sm" />
                                    <span className="truncate">{subtitle}</span>
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {actions && (
                    <div className="flex flex-col gap-3 w-full animate-fade-in-left">
                        {renderResponsiveActions(actions)}
                    </div>
                )}
            </div>

            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-500/5 to-accent-500/5 rounded-full blur-3xl -z-10"></div>
        </div>
    );
}
