'use client';

import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { href: '/', label: 'الرئيسية', icon: '🏠' },
    { href: '/admin/departments', label: 'الإدارات', icon: '🏢' },
    { href: '/admin/offices', label: 'المكاتب', icon: '🚪' },
    { href: '/admin/asset-types', label: 'أنواع الأصول', icon: '📦' },
    { href: '/admin/asset-statuses', label: 'حالات الأصول', icon: '📊' },
    { href: '/admin/asset-names', label: 'أسماء الأصول', icon: '🏷️' },
    { href: '/admin/categories', label: 'الفئات', icon: '📁' },
    { href: '/admin/users', label: 'المستخدمون', icon: '👥' },
    { href: '/admin/assets', label: 'الأصول', icon: '💼' },
    { href: '/admin/inventory', label: 'الجرد', icon: '📋' },
    { href: '/admin/reports', label: 'التقارير', icon: '📈' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <Link href="/" className="ml-4 lg:ml-0 flex items-center">
                <h1 className="text-2xl font-bold text-primary-600">AssetSight</h1>
              </Link>
            </div>
            {user && (
              <div className="flex items-center space-x-4 space-x-reverse">
                <span className="text-sm text-gray-700">{user.get('full_name')}</span>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  تسجيل الخروج
                </button>
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
          } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:transition-none`}
        >
          <nav className="h-full overflow-y-auto py-4">
            <ul className="space-y-2 px-4">
              {menuItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                      pathname === item.href
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="ml-3">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 lg:mr-64">
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

