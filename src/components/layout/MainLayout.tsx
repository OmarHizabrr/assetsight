'use client';

import { hasPermission } from "@/components/auth/ProtectedRoute";
import { MaterialIcon } from "@/components/icons/MaterialIcon";
import { ProfileModal } from "@/components/profile/ProfileModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const isOpeningProfileRef = useRef(false);

  // إغلاق القائمة المنسدلة عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // إذا كنا نفتح البروفايل، لا نغلق القائمة
      if (isOpeningProfileRef.current) {
        return;
      }
      
      const target = event.target as Node;
      // التحقق من أن النقر ليس داخل القائمة المنسدلة
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(target)) {
        setIsProfileDropdownOpen(false);
      }
    };

    if (isProfileDropdownOpen) {
      // استخدام click بدون capture لتجنب إغلاق القائمة قبل النقر على الأزرار
      // زيادة timeout لإعطاء الوقت للأزرار للاستجابة
      const timeoutId = setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [isProfileDropdownOpen]);

  const allMenuItems = [
    { href: '/', label: 'الرئيسية', icon: 'home' },
    { href: '/admin/departments', label: 'الإدارات', icon: 'business' },
    { href: '/admin/offices', label: 'المكاتب', icon: 'meeting_room' },
    { href: '/admin/asset-types', label: 'أنواع الأصول', icon: 'category' },
    { href: '/admin/asset-statuses', label: 'حالات الأصول', icon: 'assessment' },
    { href: '/admin/asset-names', label: 'أسماء الأصول', icon: 'label' },
    { href: '/admin/categories', label: 'الفئات', icon: 'folder' },
    { href: '/admin/users', label: 'المستخدمون', icon: 'people' },
    { href: '/admin/permissions', label: 'الصلاحيات', icon: 'settings' },
    { href: '/admin/assets', label: 'الأصول', icon: 'inventory' },
    { href: '/admin/inventory', label: 'الجرد', icon: 'checklist' },
    { href: '/admin/reports', label: 'التقارير', icon: 'bar_chart' },
  ];

  // تصفية عناصر القائمة حسب الصلاحيات
  const menuItems = useMemo(() => {
    // الصفحة الرئيسية متاحة للجميع
    if (!user) {
      return allMenuItems.filter(item => item.href === '/');
    }
    
    return allMenuItems.filter(item => {
      // الصفحة الرئيسية متاحة للجميع
      if (item.href === '/') return true;
      
      // التحقق من الصلاحيات
      return hasPermission(user, item.href);
    });
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f8f7fa' }}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50 flex-shrink-0" style={{ borderColor: '#dbdade' }}>
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-full text-gray-600 hover:bg-gradient-to-br hover:from-primary-50 hover:to-primary-100 hover:text-primary-600 material-transition"
                aria-label="فتح القائمة"
              >
                <MaterialIcon name="menu" size="xl" />
              </button>
              <Link href="/" className="flex items-center gap-3 hover:opacity-90 material-transition group">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#7367f0' }}>
                  <svg width="20" height="14" viewBox="0 0 32 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M0.00172773 0V6.85398C0.00172773 6.85398 -0.133178 9.01207 1.98092 10.8388L13.6912 21.9964L19.7809 21.9181L18.8042 9.88248L16.4951 7.17289L9.23799 0H0.00172773Z"
                      fill="white"
                    />
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M7.77295 16.3566L23.6563 0H32V6.88383C32 6.88383 31.8262 9.17836 30.6591 10.4057L19.7824 22H13.6938L7.77295 16.3566Z"
                      fill="white"
                    />
                  </svg>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold" style={{ color: '#5d596c' }}>AssetSight</h1>
              </Link>
            </div>
            {user && (
              <div className="flex items-center gap-3 relative">
                {/* زر البروفايل للشاشات الكبيرة */}
                <div className="hidden sm:block relative" ref={profileDropdownRef}>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsProfileDropdownOpen(!isProfileDropdownOpen);
                    }}
                    className={`flex items-center gap-3 px-3 py-2 rounded-full bg-white border material-transition cursor-pointer group shadow-sm hover:shadow-md ${
                      isProfileDropdownOpen 
                        ? 'border-primary-500 bg-primary-50 shadow-md' 
                        : 'border-slate-200 hover:border-primary-300 hover:bg-slate-50'
                    }`}
                    title="القائمة الشخصية"
                    style={{ borderWidth: '1px' }}
                  >
                    {/* صورة البروفايل */}
                    {user.get('imageUrl') || user.get('photoURL') ? (
                      <div className="relative w-9 h-9 rounded-full overflow-hidden border border-slate-200 shadow-sm">
                        <Image
                          src={user.get('imageUrl') || user.get('photoURL')}
                          alt={user.get('full_name') || user.get('username')}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-sm">
                        <MaterialIcon name="person" className="text-white" size="sm" />
                      </div>
                    )}

                    {/* معلومات المستخدم */}
                    <div className="flex flex-col items-start min-w-0">
                      <span className={`text-sm font-semibold truncate max-w-[120px] ${
                        isProfileDropdownOpen ? 'text-primary-700' : 'text-slate-800'
                      }`}>
                        {user.get('full_name') || user.get('username')}
                      </span>
                      <span className={`text-xs truncate max-w-[120px] ${
                        isProfileDropdownOpen ? 'text-primary-600' : 'text-slate-500'
                      }`}>
                        {user.get('role') || 'مستخدم'}
                      </span>
                    </div>

                    {/* أيقونة السهم */}
                    <MaterialIcon 
                      name="arrow_drop_down" 
                      className={`material-transition ${
                        isProfileDropdownOpen 
                          ? 'text-primary-600 rotate-180' 
                          : 'text-slate-400'
                      }`} 
                      size="sm" 
                    />
                  </button>

                  {/* القائمة المنسدلة */}
                  {isProfileDropdownOpen && (
                    <div className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-scale-in" style={{ zIndex: 9999 }}>
                      {/* رأس القائمة */}
                      <div className="px-4 py-4 bg-gradient-to-br from-primary-600 to-primary-700 border-b border-primary-500/30">
                        <div className="flex items-center gap-3">
                          {user.get('imageUrl') || user.get('photoURL') ? (
                            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm">
                              <Image
                                src={user.get('imageUrl') || user.get('photoURL')}
                                alt={user.get('full_name') || user.get('username')}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shadow-sm border-2 border-white/30">
                              <MaterialIcon name="person" className="text-white" size="lg" />
                            </div>
                          )}
                          <div className="flex flex-col items-start flex-1 min-w-0">
                            <span className="text-sm font-bold text-white truncate w-full">
                              {user.get('full_name') || user.get('username')}
                            </span>
                            <span className="text-xs text-white/90 truncate w-full">
                              {user.get('email') || user.get('role') || 'مستخدم'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* قائمة الخيارات */}
                      <div className="py-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Opening profile modal, current state:', isProfileModalOpen);
                            isOpeningProfileRef.current = true;
                            setIsProfileModalOpen(true);
                            console.log('Profile modal state set to true');
                            // إغلاق القائمة بعد فتح الـ modal
                            setTimeout(() => {
                              setIsProfileDropdownOpen(false);
                              isOpeningProfileRef.current = false;
                            }, 100);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-right text-sm font-medium text-slate-700 hover:bg-primary-50 hover:text-primary-700 material-transition cursor-pointer rounded-lg mx-1"
                        >
                          <MaterialIcon name="person" className="text-primary-600" size="md" />
                          <span className="flex-1">عرض البروفايل</span>
                        </button>
                        
                        <div className="mx-2 my-1 h-px bg-slate-200"></div>
                        
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsProfileDropdownOpen(false);
                            setIsLogoutConfirmOpen(true);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-right text-sm font-medium text-error-600 hover:bg-error-50 material-transition cursor-pointer rounded-lg mx-1"
                        >
                          <MaterialIcon name="logout" className="text-error-600" size="md" />
                          <span className="flex-1">تسجيل الخروج</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* زر البروفايل للشاشات الصغيرة */}
                <div className="sm:hidden relative" ref={profileDropdownRef}>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsProfileDropdownOpen(!isProfileDropdownOpen);
                    }}
                    className={`p-2 rounded-full bg-white border material-transition cursor-pointer shadow-sm hover:shadow-md ${
                      isProfileDropdownOpen 
                        ? 'border-primary-500 bg-primary-50' 
                        : 'border-slate-200 hover:border-primary-300 hover:bg-slate-50'
                    }`}
                    title="القائمة الشخصية"
                    style={{ borderWidth: '1px' }}
                  >
                    {user.get('imageUrl') || user.get('photoURL') ? (
                      <div className="relative w-9 h-9 rounded-full overflow-hidden border border-slate-200 shadow-sm">
                        <Image
                          src={user.get('imageUrl') || user.get('photoURL')}
                          alt={user.get('full_name') || user.get('username')}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-sm">
                        <MaterialIcon name="person" className="text-white" size="sm" />
                      </div>
                    )}
                  </button>

                  {/* القائمة المنسدلة للشاشات الصغيرة */}
                  {isProfileDropdownOpen && (
                    <div className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-scale-in" style={{ zIndex: 9999 }}>
                      {/* رأس القائمة */}
                      <div className="px-4 py-4 bg-gradient-to-br from-primary-600 to-primary-700 border-b border-primary-500/30">
                        <div className="flex items-center gap-3">
                          {user.get('imageUrl') || user.get('photoURL') ? (
                            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm">
                              <Image
                                src={user.get('imageUrl') || user.get('photoURL')}
                                alt={user.get('full_name') || user.get('username')}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shadow-sm border-2 border-white/30">
                              <MaterialIcon name="person" className="text-white" size="lg" />
                            </div>
                          )}
                          <div className="flex flex-col items-start flex-1 min-w-0">
                            <span className="text-sm font-bold text-white truncate w-full">
                              {user.get('full_name') || user.get('username')}
                            </span>
                            <span className="text-xs text-white/90 truncate w-full">
                              {user.get('email') || user.get('role') || 'مستخدم'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* قائمة الخيارات */}
                      <div className="py-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Opening profile modal, current state:', isProfileModalOpen);
                            isOpeningProfileRef.current = true;
                            setIsProfileModalOpen(true);
                            console.log('Profile modal state set to true');
                            // إغلاق القائمة بعد فتح الـ modal
                            setTimeout(() => {
                              setIsProfileDropdownOpen(false);
                              isOpeningProfileRef.current = false;
                            }, 100);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-right text-sm font-medium text-slate-700 hover:bg-primary-50 hover:text-primary-700 material-transition cursor-pointer rounded-lg mx-1"
                        >
                          <MaterialIcon name="person" className="text-primary-600" size="md" />
                          <span className="flex-1">عرض البروفايل</span>
                        </button>
                        
                        <div className="mx-2 my-1 h-px bg-slate-200"></div>
                        
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsProfileDropdownOpen(false);
                            setIsLogoutConfirmOpen(true);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-right text-sm font-medium text-error-600 hover:bg-error-50 material-transition cursor-pointer rounded-lg mx-1"
                        >
                          <MaterialIcon name="logout" className="text-error-600" size="md" />
                          <span className="flex-1">تسجيل الخروج</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed lg:static top-16 lg:top-0 left-0 z-40 w-64 bg-white shadow-sm border-r transform material-transition lg:transition-none h-[calc(100vh-4rem)] lg:h-screen overflow-y-auto`}
          style={{ borderColor: '#dbdade' }}
        >
          <nav className="h-full py-4">
            <ul className="space-y-1.5 px-3">
              {menuItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl material-transition text-sm font-medium relative group ${
                      pathname === item.href
                        ? 'text-primary-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-primary-600'
                    }`}
                    style={pathname === item.href ? { 
                      backgroundColor: '#eae8fd',
                      color: '#7367f0'
                    } : {}}
                    onClick={() => setSidebarOpen(false)}
                  >
                    {pathname === item.href && (
                      <div className="absolute right-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ backgroundColor: '#7367f0' }}></div>
                    )}
                    <MaterialIcon 
                      name={item.icon} 
                      className={`material-transition ${
                        pathname === item.href 
                          ? 'text-primary-600' 
                          : 'text-gray-500 group-hover:text-primary-500'
                      }`}
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
            className="fixed inset-0 bg-black/40 z-30 lg:hidden animate-fade-in"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto" style={{ background: '#f8f7fa' }}>
          <div className="min-h-full">
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8 lg:py-10">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto flex-shrink-0 shadow-sm" style={{ borderColor: '#dbdade' }}>
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: '#7367f0', borderRadius: '0.5rem' }}>
                <MaterialIcon name="dashboard" className="text-white" size="sm" />
              </div>
              <span className="font-semibold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">AssetSight</span>
              <span className="text-gray-400">© {new Date().getFullYear()}</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>نظام إدارة الأصول</span>
              <span className="hidden sm:inline text-gray-300">•</span>
              <span className="hidden sm:inline">جميع الحقوق محفوظة</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => {
          console.log('Closing profile modal');
          setIsProfileModalOpen(false);
        }}
      />

      {/* Logout Confirm Modal */}
      <ConfirmModal
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirm={() => {
          setIsLogoutConfirmOpen(false);
          logout();
          // استخدام window.location.href لإعادة تحميل كاملة للتأكد من مسح جميع البيانات
          setTimeout(() => {
            window.location.href = '/login';
          }, 50);
        }}
        title="تأكيد تسجيل الخروج"
        message="هل أنت متأكد من تسجيل الخروج؟"
        confirmText="تسجيل الخروج"
        cancelText="إلغاء"
        variant="warning"
      />
    </div>
  );
}

