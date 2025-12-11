'use client';

import { HomeIcon, LogoutIcon, UserIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { href: '/', label: 'الرئيسية', icon: <HomeIcon className="w-5 h-5" /> },
    { href: '/admin/departments', label: 'الإدارات', icon: '🏢' },
    { href: '/admin/offices', label: 'المكاتب', icon: '🚪' },
    { href: '/admin/asset-types', label: 'أنواع الأصول', icon: '📦' },
    { href: '/admin/asset-statuses', label: 'حالات الأصول', icon: '📊' },
    { href: '/admin/asset-names', label: 'أسماء الأصول', icon: '🏷️' },
    { href: '/admin/categories', label: 'الفئات', icon: '📁' },
    { href: '/admin/users', label: 'المستخدمون', icon: <UserIcon className="w-5 h-5" /> },
    { href: '/admin/assets', label: 'الأصول', icon: '💼' },
    { href: '/admin/inventory', label: 'الجرد', icon: '📋' },
    { href: '/admin/reports', label: 'التقارير', icon: '📈' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl shadow-lg border-b border-slate-200/60 sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 material-transition ripple"
                aria-label="فتح القائمة"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <Link href="/" className="flex items-center gap-3 hover:opacity-90 material-transition group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30 group-hover:shadow-xl group-hover:shadow-primary-500/40 material-transition">
                  <span className="text-white font-bold text-lg">A</span>
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">AssetSight</h1>
              </Link>
            </div>
            {user && (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-slate-100 to-slate-50 border border-slate-200 shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-md">
                    <UserIcon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-slate-800 truncate max-w-[140px]">
                    {user.get('full_name') || user.get('username')}
                  </span>
                </div>
                <Button
                  onClick={logout}
                  variant="error"
                  size="md"
                  leftIcon={<LogoutIcon className="w-4 h-4" />}
                  className="shadow-lg shadow-error-500/20 hover:shadow-xl hover:shadow-error-500/30"
                >
                  <span className="hidden sm:inline">تسجيل الخروج</span>
                  <span className="sm:hidden">خروج</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white/90 backdrop-blur-2xl shadow-2xl border-r border-slate-200/60 transform material-transition lg:transition-none`}
        >
          <nav className="h-full overflow-y-auto py-6 px-4">
            <ul className="space-y-1.5">
              {menuItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-4 px-4 py-3.5 rounded-xl material-transition text-sm font-bold ripple relative overflow-hidden group ${
                      pathname === item.href
                        ? 'bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 text-white shadow-xl shadow-primary-500/50 scale-[1.02]'
                        : 'text-slate-700 hover:bg-gradient-to-r hover:from-primary-50 hover:via-blue-50/50 hover:to-primary-50 hover:text-primary-700 hover:shadow-lg hover:shadow-primary-500/20'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    {pathname === item.href && (
                      <div className="absolute right-0 top-0 bottom-0 w-1 bg-white rounded-l-full"></div>
                    )}
                    <span className={`flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl ${
                      pathname === item.href ? 'bg-white/30 shadow-lg' : 'bg-slate-100 group-hover:bg-primary-100 group-hover:shadow-md'
                    } material-transition`}>
                      {typeof item.icon === 'string' ? (
                        <span className="text-xl">{item.icon}</span>
                      ) : (
                        <span className="w-5 h-5">{item.icon}</span>
                      )}
                    </span>
                    <span className="truncate flex-1">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-secondary-900/60 z-40 lg:hidden animate-fade-in"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 lg:mr-72 min-h-[calc(100vh-5rem)] w-full">
          <div className="h-full w-full">
            <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-8 lg:py-10">
            {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

