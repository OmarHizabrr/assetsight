'use client';

import { MaterialIcon } from "@/components/icons/MaterialIcon";
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
    { href: '/', label: 'الرئيسية', icon: 'home' },
    { href: '/admin/departments', label: 'الإدارات', icon: 'business' },
    { href: '/admin/offices', label: 'المكاتب', icon: 'meeting_room' },
    { href: '/admin/asset-types', label: 'أنواع الأصول', icon: 'category' },
    { href: '/admin/asset-statuses', label: 'حالات الأصول', icon: 'assessment' },
    { href: '/admin/asset-names', label: 'أسماء الأصول', icon: 'label' },
    { href: '/admin/categories', label: 'الفئات', icon: 'folder' },
    { href: '/admin/users', label: 'المستخدمون', icon: 'people' },
    { href: '/admin/assets', label: 'الأصول', icon: 'inventory' },
    { href: '/admin/inventory', label: 'الجرد', icon: 'checklist' },
    { href: '/admin/reports', label: 'التقارير', icon: 'bar_chart' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Vuetify Style */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-64">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-full text-gray-600 hover:bg-gray-100 material-transition"
                aria-label="فتح القائمة"
              >
                <MaterialIcon name="menu" size="2xl" />
              </button>
              <Link href="/" className="flex items-center gap-3 hover:opacity-90 material-transition">
                <div className="w-10 h-10 rounded-lg bg-primary-600 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">A</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-medium text-gray-900">AssetSight</h1>
              </Link>
            </div>
            {user && (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-lg bg-gray-100">
                  <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center">
                    <MaterialIcon name="person" className="text-white" size="sm" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 truncate max-w-[140px]">
                    {user.get('full_name') || user.get('username')}
                  </span>
                </div>
                <Button
                  onClick={logout}
                  variant="error"
                  size="md"
                  className="normal-case"
                >
                  <MaterialIcon name="logout" className="text-lg mr-1" size="lg" />
                  <span className="hidden sm:inline">تسجيل الخروج</span>
                  <span className="sm:hidden">خروج</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Vuetify Navigation Drawer Style */}
        <aside
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg border-r border-gray-200 transform material-transition lg:transition-none`}
        >
          <nav className="h-full overflow-y-auto py-4">
            <ul className="space-y-1 px-2">
              {menuItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg material-transition text-sm font-medium relative ${
                      pathname === item.href
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    {pathname === item.href && (
                      <div className="absolute right-0 top-0 bottom-0 w-1 bg-primary-600 rounded-l-full"></div>
                    )}
                    <MaterialIcon 
                      name={item.icon} 
                      className={pathname === item.href ? 'text-primary-600' : 'text-gray-500'}
                      size="xl" 
                    />
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
            className="fixed inset-0 bg-black/40 z-40 lg:hidden animate-fade-in"
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

