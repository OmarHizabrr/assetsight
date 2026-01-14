'use client';

import { MaterialIcon } from "@/components/icons/MaterialIcon";
import { useDarkMode } from "@/hooks/useDarkMode";

interface ThemeToggleProps {
  variant?: 'icon' | 'button';
  size?: 'sm' | 'md' | 'lg';
}

export function ThemeToggle({ variant = 'icon', size = 'md' }: ThemeToggleProps) {
  const { theme, isDark, toggleTheme } = useDarkMode();

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
  };

  const getIcon = () => {
    if (theme === 'system') return 'brightness_auto';
    return isDark ? 'dark_mode' : 'light_mode';
  };

  const getLabel = () => {
    if (theme === 'system') return 'تلقائي';
    return isDark ? 'داكن' : 'فاتح';
  };

  if (variant === 'button') {
    return (
      <button
        onClick={toggleTheme}
        className={`${sizeClasses[size]} flex items-center gap-2 px-3 py-2 rounded-xl shadow-sm hover:shadow-lg material-transition group relative overflow-hidden border hover:border-primary-500/20 ${isDark
            ? 'bg-slate-900/70 hover:bg-slate-900 border-slate-700/60'
            : 'bg-white/80 hover:bg-white border-slate-200/60'
          }`}
        title={`تبديل المظهر (الحالي: ${getLabel()})`}
        aria-label={`تبديل المظهر. الوضع الحالي: ${getLabel()}`}
      >
        {/* Hover gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/0 via-primary-500/0 to-primary-500/0 group-hover:from-primary-500/5 group-hover:via-primary-500/0 group-hover:to-primary-500/5 material-transition" />

        {/* Icon Container */}
        <div
          className={`w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center material-transition relative z-10 ${isDark
              ? 'from-slate-800 to-slate-700 group-hover:from-primary-900/40 group-hover:to-primary-800/40'
              : 'from-slate-100 to-slate-200 group-hover:from-primary-100 group-hover:to-primary-200'
            }`}
        >
          <MaterialIcon
            name={getIcon()}
            className={`${isDark ? 'text-slate-200' : 'text-slate-600'} group-hover:text-primary-700 material-transition`}
            size="sm"
          />
        </div>

        {/* Label */}
        <span className={`text-sm font-semibold group-hover:text-primary-700 material-transition relative z-10 ${isDark ? 'text-slate-100' : 'text-slate-700'}`}>
          {getLabel()}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={`${sizeClasses[size]} rounded-xl shadow-sm hover:shadow-lg material-transition group relative overflow-hidden flex items-center justify-center border hover:border-primary-500/20 ${isDark
          ? 'bg-slate-900/70 hover:bg-slate-900 border-slate-700/60'
          : 'bg-white/80 hover:bg-white border-slate-200/60'
        }`}
      title={`تبديل المظهر (الحالي: ${getLabel()})`}
      aria-label={`تبديل المظهر. الوضع الحالي: ${getLabel()}`}
    >
      {/* Hover gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/0 via-primary-500/0 to-primary-500/0 group-hover:from-primary-500/5 group-hover:via-primary-500/0 group-hover:to-primary-500/5 material-transition" />

      {/* Icon with gradient background */}
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        <div
          className={`w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center material-transition ${isDark
              ? 'from-slate-800 to-slate-700 group-hover:from-primary-900/40 group-hover:to-primary-800/40'
              : 'from-slate-100 to-slate-200 group-hover:from-primary-100 group-hover:to-primary-200'
            }`}
        >
          <MaterialIcon
            name={getIcon()}
            className={`${isDark ? 'text-slate-200' : 'text-slate-600'} group-hover:text-primary-700 material-transition`}
            size="sm"
          />
        </div>
      </div>
    </button>
  );
}

