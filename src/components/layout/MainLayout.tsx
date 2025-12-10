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
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <header className="bg-white shadow-elevation-2 border-b border-secondary-200 sticky top-0 z-40 backdrop-blur-sm bg-white/95">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-md text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 material-transition ripple"
                aria-label="فتح القائمة"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <Link href="/" className="flex items-center gap-2 hover:opacity-80 material-transition">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-medium text-primary-600">AssetSight</h1>
              </Link>
            </div>
            {user && (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary-100">
                  <UserIcon className="w-4 h-4 text-secondary-700" />
                  <span className="text-xs sm:text-sm font-medium text-secondary-800 truncate max-w-[120px] sm:max-w-none">
                    {user.get('full_name') || user.get('username')}
                  </span>
                </div>
                <Button
                  onClick={logout}
                  variant="error"
                  size="sm"
                  leftIcon={<LogoutIcon className="w-4 h-4" />}
                  className="text-xs sm:text-sm"
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
          } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 sm:w-72 bg-white/95 backdrop-blur-md shadow-elevation-4 border-r border-secondary-200/50 transform material-transition lg:transition-none`}
        >
          <nav className="h-full overflow-y-auto py-6">
            <ul className="space-y-2 px-3">
              {menuItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg material-transition text-sm font-medium ripple ${
                      pathname === item.href
                        ? 'bg-primary-600 text-white shadow-elevation-2'
                        : 'text-secondary-700 hover:bg-primary-50 hover:text-primary-700'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="flex-shrink-0">
                      {typeof item.icon === 'string' ? (
                        <span className="text-lg">{item.icon}</span>
                      ) : (
                        <span className="w-5 h-5">{item.icon}</span>
                      )}
                    </span>
                    <span className="truncate">{item.label}</span>
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
        <main className="flex-1 lg:mr-64 xl:mr-72 min-h-[calc(100vh-4rem)] w-full bg-gradient-to-br from-secondary-50 via-white to-secondary-50">
          <div className="h-full w-full">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8 lg:py-10">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

