'use client';

import logoText from "@/assets/images/logos/logo-text.png";
import miscMaskLight from "@/assets/images/pages/misc-mask-light.png";
import { MaterialIcon } from "@/components/icons/MaterialIcon";
import { ProfileModal } from "@/components/profile/ProfileModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useAuth } from "@/contexts/AuthContext";
import { firestoreApi } from "@/lib/FirestoreApi";
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
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);

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
    { href: '/admin/currencies', label: 'العملات', icon: 'attach_money' },
    { href: '/admin/users', label: 'المستخدمون', icon: 'people' },
    { href: '/admin/permissions', label: 'الصلاحيات', icon: 'settings' },
    { href: '/admin/assets', label: 'الأصول', icon: 'inventory' },
    { href: '/admin/inventory', label: 'الجرد', icon: 'checklist' },
    { href: '/admin/reports', label: 'التقارير', icon: 'bar_chart' },
  ];

  // دالة لتطبيع المسار (إزالة الشرطة المائلة في النهاية)
  const normalizePath = (path: string): string => {
    if (!path || path === '/') return '/';
    return path.replace(/\/+$/, ''); // إزالة جميع الشرطات المائلة في النهاية
  };

  // تحميل صلاحيات المستخدم من subcollection
  useEffect(() => {
    const loadUserPermissions = async () => {
      if (!user) {
        setUserPermissions([]);
        return;
      }

      const role = user.get('role');
      // المدير لديه صلاحية على جميع الصفحات
      if (role === 'مدير') {
        setUserPermissions(allMenuItems.map(item => normalizePath(item.href)));
        return;
      }

      const userId = user.get('id');
      if (!userId) {
        setUserPermissions([]);
        return;
      }

      try {
        setPermissionsLoading(true);
        const subCollectionRef = firestoreApi.getSubCollection("powers", userId, "powers");
        const permissionDocs = await firestoreApi.getDocuments(subCollectionRef);
        const pagePaths = permissionDocs
          .map(doc => {
            const data = doc.data();
            const canView = data.can_view === 1 || data.can_view === true;
            if (canView) {
              return normalizePath(data.page_path || '');
            }
            return null;
          })
          .filter(path => path !== null && path !== undefined) as string[];
        
        setUserPermissions(pagePaths);
        console.log("Loaded user permissions for sidebar:", pagePaths);
      } catch (error) {
        console.error("Error loading user permissions for sidebar:", error);
        setUserPermissions([]);
      } finally {
        setPermissionsLoading(false);
      }
    };

    loadUserPermissions();
  }, [user]);

  // تصفية عناصر القائمة حسب الصلاحيات
  const menuItems = useMemo(() => {
    // الصفحة الرئيسية متاحة للجميع
    if (!user) {
      return allMenuItems.filter(item => item.href === '/');
    }
    
    const role = user.get('role');
    // المدير لديه صلاحية على جميع الصفحات
    if (role === 'مدير') {
      return allMenuItems;
    }
    
    return allMenuItems.filter(item => {
      // الصفحة الرئيسية متاحة للجميع
      if (item.href === '/') return true;
      
      // تطبيع المسار قبل المقارنة
      const normalizedItemPath = normalizePath(item.href);
      return userPermissions.includes(normalizedItemPath);
    });
  }, [user, userPermissions]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f8f7fa' }}>
      {/* Header - Professional Design with Advanced Effects */}
      <header 
        className="sticky top-0 z-50 flex-shrink-0 relative" 
        style={{ 
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          backgroundColor: 'rgba(255, 255, 255, 0.72)',
          borderBottom: '1px solid rgba(226, 232, 240, 0.6)',
          boxShadow: '0 1px 0 0 rgba(255, 255, 255, 0.5) inset, 0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        }}
      >
        {/* Subtle gradient overlay */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-50"
          style={{
            background: 'linear-gradient(to bottom, rgba(115, 103, 240, 0.03) 0%, transparent 100%)',
          }}
        />
        
        <div className="px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex justify-between items-center" style={{ minHeight: '4.75rem' }}>
            {/* Left Section - Logo & Menu */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Mobile Menu Button - Enhanced */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2.5 rounded-xl text-slate-600 hover:bg-gradient-to-br hover:from-primary-50 hover:to-primary-100/50 hover:text-primary-600 active:scale-95 material-transition relative group"
                aria-label="فتح القائمة"
                style={{
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                {/* Ripple effect */}
                <div className="absolute inset-0 rounded-xl bg-primary-500/0 group-active:bg-primary-500/20 group-active:scale-150 material-transition pointer-events-none" style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                <MaterialIcon name="menu" size="xl" className="relative z-10" />
              </button>
              
              {/* Logo - Natural Size with Original Colors */}
              <Link 
                href="/" 
                className="flex items-center gap-3 hover:opacity-90 material-transition group relative"
              >
                {/* Glow effect on hover */}
                <div className="absolute -inset-1 bg-gradient-to-r from-primary-500/0 via-primary-500/0 to-primary-500/0 group-hover:from-primary-500/20 group-hover:via-primary-500/10 group-hover:to-primary-500/20 rounded-2xl blur-md material-transition opacity-0 group-hover:opacity-100" />
                
                <div 
                  className="relative rounded-2xl overflow-hidden flex items-center justify-center shadow-lg ring-2 ring-primary-500/10 group-hover:ring-primary-500/20 group-hover:scale-105 material-transition bg-white/90 backdrop-blur-sm p-1.5" 
                  style={{ 
                    boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(115, 103, 240, 0.08)',
                    height: '3.5rem', // Fixed height to match header
                  }}
                >
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 material-transition rounded-2xl" />
                  <img
                    src={typeof logoText === 'string' ? logoText : logoText.src}
                    alt="AssetSight Logo"
                    className="relative z-10"
                    style={{
                      height: '100%',
                      width: 'auto',
                      maxHeight: '3.5rem',
                      filter: 'none',
                      display: 'block',
                      objectFit: 'contain',
                    }}
                  />
                </div>
                <div className="hidden sm:block relative z-10">
                  <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary-600 via-primary-700 to-accent-600 bg-clip-text text-transparent group-hover:from-primary-500 group-hover:via-primary-600 group-hover:to-accent-500 material-transition">
                    AssetSight
                  </h1>
                  <p className="text-xs text-slate-500 font-medium -mt-0.5 group-hover:text-slate-600 material-transition">نظام إدارة الأصول</p>
                </div>
              </Link>
            </div>
            {/* Right Section - User Profile */}
            {user && (
              <div className="flex items-center gap-2 sm:gap-3 relative">
                {/* Profile Button - Desktop */}
                <div className="hidden sm:block relative" ref={profileDropdownRef}>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsProfileDropdownOpen(!isProfileDropdownOpen);
                    }}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl material-transition cursor-pointer group relative overflow-hidden ${
                      isProfileDropdownOpen 
                        ? 'bg-gradient-to-r from-primary-50 to-primary-100/50 shadow-lg ring-2 ring-primary-500/20' 
                        : 'bg-white/80 hover:bg-white shadow-sm hover:shadow-lg hover:ring-2 hover:ring-primary-500/10'
                    }`}
                    title="القائمة الشخصية"
                    style={{
                      border: isProfileDropdownOpen ? '1px solid rgba(115, 103, 240, 0.25)' : '1px solid rgba(226, 232, 240, 0.6)',
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                    }}
                  >
                    {/* Hover gradient overlay */}
                    {!isProfileDropdownOpen && (
                      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/0 via-primary-500/0 to-primary-500/0 group-hover:from-primary-500/5 group-hover:via-primary-500/0 group-hover:to-primary-500/5 material-transition rounded-xl" />
                    )}
                    {/* Profile Image - Enhanced */}
                    <div className="relative z-10">
                      {user.get('imageUrl') || user.get('photoURL') ? (
                        <div className="relative w-11 h-11 rounded-xl overflow-hidden ring-2 ring-white/80 shadow-lg group-hover:ring-primary-200/50 material-transition">
                          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-transparent opacity-0 group-hover:opacity-100 material-transition" />
                          <Image
                            src={user.get('imageUrl') || user.get('photoURL')}
                            alt={user.get('full_name') || user.get('username')}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 flex items-center justify-center shadow-lg ring-2 ring-white/80 group-hover:ring-primary-200/50 group-hover:scale-105 material-transition">
                          <MaterialIcon name="person" className="text-white" size="md" />
                        </div>
                      )}
                    </div>

                    {/* User Info - Enhanced */}
                    <div className="flex flex-col items-start min-w-0 max-w-[170px] relative z-10">
                      <span className={`text-sm font-bold truncate w-full text-right material-transition ${
                        isProfileDropdownOpen ? 'text-primary-700' : 'text-slate-900 group-hover:text-primary-700'
                      }`}>
                        {user.get('full_name') || user.get('username')}
                      </span>
                      <span className={`text-xs truncate w-full text-right font-semibold material-transition ${
                        isProfileDropdownOpen ? 'text-primary-600' : 'text-slate-500 group-hover:text-primary-600'
                      }`}>
                        {user.get('role') || 'مستخدم'}
                      </span>
                    </div>

                    {/* Dropdown Arrow - Enhanced */}
                    <MaterialIcon 
                      name="arrow_drop_down" 
                      className={`material-transition transition-all duration-300 relative z-10 ${
                        isProfileDropdownOpen 
                          ? 'text-primary-600 rotate-180 scale-110' 
                          : 'text-slate-400 group-hover:text-primary-600 group-hover:scale-110'
                      }`} 
                      size="sm" 
                    />
                  </button>

                  {/* القائمة المنسدلة - تصميم احترافي جديد */}
                  {isProfileDropdownOpen && (
                    <div 
                      className="absolute left-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border-2 border-slate-200/60 overflow-hidden animate-scale-in backdrop-blur-xl" 
                      style={{ 
                        zIndex: 9999, 
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(115, 103, 240, 0.1)',
                        background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.98), rgba(250, 250, 252, 0.98))',
                      }}
                    >
                      {/* رأس القائمة - تصميم أنيق */}
                      <div className="px-6 py-5 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 relative overflow-hidden">
                        {/* Decorative pattern */}
                        <div className="absolute inset-0 opacity-10" style={{
                          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.3) 0%, transparent 50%)',
                        }}></div>
                        
                        <div className="flex items-center gap-4 relative z-10">
                          {user.get('imageUrl') || user.get('photoURL') ? (
                            <div className="relative w-14 h-14 rounded-2xl overflow-hidden border-3 border-white/30 shadow-xl ring-4 ring-white/20">
                              <Image
                                src={user.get('imageUrl') || user.get('photoURL')}
                                alt={user.get('full_name') || user.get('username')}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl ring-4 ring-white/20 border-3 border-white/30">
                              <MaterialIcon name="person" className="text-white" size="xl" />
                            </div>
                          )}
                          <div className="flex flex-col items-start flex-1 min-w-0">
                            <span className="text-base font-bold text-white truncate w-full drop-shadow-sm">
                              {user.get('full_name') || user.get('username')}
                            </span>
                            <span className="text-sm text-white/90 truncate w-full font-medium mt-0.5">
                              {user.get('role') || 'مستخدم'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* قائمة الخيارات - تصميم موحد وأنيق */}
                      <div className="py-3 px-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            isOpeningProfileRef.current = true;
                            setIsProfileModalOpen(true);
                            setTimeout(() => {
                              setIsProfileDropdownOpen(false);
                              isOpeningProfileRef.current = false;
                            }, 100);
                          }}
                          className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-right text-sm font-semibold text-slate-700 hover:bg-gradient-to-l hover:from-primary-50 hover:to-transparent hover:text-primary-700 material-transition cursor-pointer rounded-xl mx-1.5 group relative overflow-hidden"
                        >
                          {/* Hover effect background */}
                          <div className="absolute inset-0 bg-gradient-to-l from-primary-50/0 to-primary-50/100 opacity-0 group-hover:opacity-100 material-transition rounded-xl"></div>
                          
                          <div className="flex items-center gap-3 flex-1 relative z-10">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 group-hover:from-primary-200 group-hover:to-primary-300 flex items-center justify-center material-transition shadow-sm group-hover:shadow-md">
                              <MaterialIcon name="person" className="text-primary-600 group-hover:text-primary-700" size="md" />
                            </div>
                            <span className="flex-1 text-right font-semibold">عرض البروفايل</span>
                          </div>
                        </button>
                        
                        {/* Separator - أنيق */}
                        <div className="mx-4 my-2 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
                        
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsProfileDropdownOpen(false);
                            setIsLogoutConfirmOpen(true);
                          }}
                          className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-right text-sm font-semibold text-slate-700 hover:bg-gradient-to-l hover:from-error-50 hover:to-transparent hover:text-error-700 material-transition cursor-pointer rounded-xl mx-1.5 group relative overflow-hidden"
                        >
                          {/* Hover effect background */}
                          <div className="absolute inset-0 bg-gradient-to-l from-error-50/0 to-error-50/100 opacity-0 group-hover:opacity-100 material-transition rounded-xl"></div>
                          
                          <div className="flex items-center gap-3 flex-1 relative z-10">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-error-100 to-error-200 group-hover:from-error-200 group-hover:to-error-300 flex items-center justify-center material-transition shadow-sm group-hover:shadow-md">
                              <MaterialIcon name="logout" className="text-error-600 group-hover:text-error-700" size="md" />
                            </div>
                            <span className="flex-1 text-right font-semibold">تسجيل الخروج</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Profile Button - Mobile */}
                <div className="sm:hidden relative" ref={profileDropdownRef}>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsProfileDropdownOpen(!isProfileDropdownOpen);
                    }}
                    className={`p-2 rounded-xl material-transition cursor-pointer ${
                      isProfileDropdownOpen 
                        ? 'bg-primary-50 shadow-md ring-2 ring-primary-500/20' 
                        : 'bg-white hover:bg-slate-50 shadow-sm hover:shadow-md'
                    }`}
                    title="القائمة الشخصية"
                    style={{
                      border: isProfileDropdownOpen ? '1px solid rgba(115, 103, 240, 0.2)' : '1px solid rgba(226, 232, 240, 0.8)',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    {user.get('imageUrl') || user.get('photoURL') ? (
                      <div className="relative w-10 h-10 rounded-xl overflow-hidden ring-2 ring-white shadow-md">
                        <Image
                          src={user.get('imageUrl') || user.get('photoURL')}
                          alt={user.get('full_name') || user.get('username')}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 flex items-center justify-center shadow-md ring-2 ring-white">
                        <MaterialIcon name="person" className="text-white" size="md" />
                      </div>
                    )}
                  </button>

                  {/* القائمة المنسدلة للشاشات الصغيرة - نفس التصميم الاحترافي */}
                  {isProfileDropdownOpen && (
                    <div 
                      className="absolute left-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border-2 border-slate-200/60 overflow-hidden animate-scale-in backdrop-blur-xl" 
                      style={{ 
                        zIndex: 9999, 
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(115, 103, 240, 0.1)',
                        background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.98), rgba(250, 250, 252, 0.98))',
                      }}
                    >
                      {/* رأس القائمة - تصميم أنيق */}
                      <div className="px-6 py-5 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 relative overflow-hidden">
                        {/* Decorative pattern */}
                        <div className="absolute inset-0 opacity-10" style={{
                          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.3) 0%, transparent 50%)',
                        }}></div>
                        
                        <div className="flex items-center gap-4 relative z-10">
                          {user.get('imageUrl') || user.get('photoURL') ? (
                            <div className="relative w-14 h-14 rounded-2xl overflow-hidden border-3 border-white/30 shadow-xl ring-4 ring-white/20">
                              <Image
                                src={user.get('imageUrl') || user.get('photoURL')}
                                alt={user.get('full_name') || user.get('username')}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl ring-4 ring-white/20 border-3 border-white/30">
                              <MaterialIcon name="person" className="text-white" size="xl" />
                            </div>
                          )}
                          <div className="flex flex-col items-start flex-1 min-w-0">
                            <span className="text-base font-bold text-white truncate w-full drop-shadow-sm">
                              {user.get('full_name') || user.get('username')}
                            </span>
                            <span className="text-sm text-white/90 truncate w-full font-medium mt-0.5">
                              {user.get('role') || 'مستخدم'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* قائمة الخيارات - تصميم موحد وأنيق */}
                      <div className="py-3 px-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            isOpeningProfileRef.current = true;
                            setIsProfileModalOpen(true);
                            setTimeout(() => {
                              setIsProfileDropdownOpen(false);
                              isOpeningProfileRef.current = false;
                            }, 100);
                          }}
                          className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-right text-sm font-semibold text-slate-700 hover:bg-gradient-to-l hover:from-primary-50 hover:to-transparent hover:text-primary-700 material-transition cursor-pointer rounded-xl mx-1.5 group relative overflow-hidden"
                        >
                          {/* Hover effect background */}
                          <div className="absolute inset-0 bg-gradient-to-l from-primary-50/0 to-primary-50/100 opacity-0 group-hover:opacity-100 material-transition rounded-xl"></div>
                          
                          <div className="flex items-center gap-3 flex-1 relative z-10">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 group-hover:from-primary-200 group-hover:to-primary-300 flex items-center justify-center material-transition shadow-sm group-hover:shadow-md">
                              <MaterialIcon name="person" className="text-primary-600 group-hover:text-primary-700" size="md" />
                            </div>
                            <span className="flex-1 text-right font-semibold">عرض البروفايل</span>
                          </div>
                        </button>
                        
                        {/* Separator - أنيق */}
                        <div className="mx-4 my-2 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
                        
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsProfileDropdownOpen(false);
                            setIsLogoutConfirmOpen(true);
                          }}
                          className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-right text-sm font-semibold text-slate-700 hover:bg-gradient-to-l hover:from-error-50 hover:to-transparent hover:text-error-700 material-transition cursor-pointer rounded-xl mx-1.5 group relative overflow-hidden"
                        >
                          {/* Hover effect background */}
                          <div className="absolute inset-0 bg-gradient-to-l from-error-50/0 to-error-50/100 opacity-0 group-hover:opacity-100 material-transition rounded-xl"></div>
                          
                          <div className="flex items-center gap-3 flex-1 relative z-10">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-error-100 to-error-200 group-hover:from-error-200 group-hover:to-error-300 flex items-center justify-center material-transition shadow-sm group-hover:shadow-md">
                              <MaterialIcon name="logout" className="text-error-600 group-hover:text-error-700" size="md" />
                            </div>
                            <span className="flex-1 text-right font-semibold">تسجيل الخروج</span>
                          </div>
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
          } lg:translate-x-0 fixed lg:static top-[4.75rem] lg:top-0 left-0 z-40 w-64 transform material-transition lg:transition-none h-[calc(100vh-4.75rem)] lg:h-screen overflow-y-auto relative`}
          style={{ 
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            backgroundColor: 'rgba(255, 255, 255, 0.75)',
            borderRight: '1px solid rgba(226, 232, 240, 0.6)',
            boxShadow: '2px 0 8px 0 rgba(0, 0, 0, 0.04), 1px 0 0 0 rgba(255, 255, 255, 0.5) inset',
          }}
        >
          {/* Subtle gradient overlay */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              background: 'linear-gradient(to bottom, rgba(115, 103, 240, 0.02) 0%, transparent 50%, rgba(115, 103, 240, 0.02) 100%)',
            }}
          />
          
          <nav className="h-full py-5 relative z-10">
            <ul className="space-y-1.5 px-3">
              {menuItems.map((item, index) => (
                <li key={item.href} style={{ animationDelay: `${index * 30}ms` }}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3.5 px-4 py-3 rounded-xl material-transition text-sm font-semibold relative group overflow-hidden ${
                      pathname === item.href
                        ? 'text-primary-700 bg-gradient-to-r from-primary-50 via-primary-100/70 to-primary-50 shadow-lg shadow-primary-500/15 ring-1 ring-primary-500/20'
                        : 'text-slate-700 hover:bg-gradient-to-r hover:from-slate-50/80 hover:via-primary-50/40 hover:to-slate-50/80 hover:text-primary-700 hover:shadow-md hover:ring-1 hover:ring-primary-500/10'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                    style={{
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    {/* Active indicator with enhanced gradient */}
                    {pathname === item.href && (
                      <div className="absolute right-0 top-0 bottom-0 w-1.5 rounded-l-xl bg-gradient-to-b from-primary-500 via-primary-600 to-primary-500 shadow-xl shadow-primary-500/60"></div>
                    )}
                    
                    {/* Hover gradient overlay - Enhanced */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-500/0 via-primary-500/0 to-primary-500/0 group-hover:from-primary-500/8 group-hover:via-primary-500/0 group-hover:to-primary-500/8 material-transition rounded-xl"></div>
                    
                    {/* Icon Container - Enhanced */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center material-transition relative z-10 ${
                      pathname === item.href 
                        ? 'bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white shadow-xl shadow-primary-500/40 scale-110 ring-2 ring-primary-500/30' 
                        : 'bg-slate-100/80 text-slate-600 group-hover:bg-gradient-to-br group-hover:from-primary-100 group-hover:via-primary-200 group-hover:to-primary-100 group-hover:text-primary-700 group-hover:scale-110 group-hover:shadow-lg group-hover:ring-1 group-hover:ring-primary-500/20'
                    }`}
                    style={{
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                    >
                      {/* Icon shine effect */}
                      {pathname === item.href && (
                        <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent rounded-xl" />
                      )}
                      <MaterialIcon 
                        name={item.icon} 
                        className="material-transition relative z-10"
                        size="md" 
                      />
                    </div>
                    
                    {/* Label - Enhanced */}
                    <span className={`truncate flex-1 relative z-10 material-transition ${
                      pathname === item.href 
                        ? 'font-bold text-primary-800' 
                        : 'font-semibold group-hover:font-bold'
                    }`}>
                      {item.label}
                    </span>
                    
                    {/* Active glow effect */}
                    {pathname === item.href && (
                      <div className="absolute inset-0 rounded-xl bg-primary-500/10 blur-xl -z-0" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Overlay for mobile - Enhanced */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 lg:hidden animate-fade-in"
            onClick={() => setSidebarOpen(false)}
            style={{
              background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.4) 0%, rgba(115, 103, 240, 0.2) 50%, rgba(0, 0, 0, 0.4) 100%)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          />
        )}

        {/* Main Content - Enhanced Professional Design */}
        <main 
          className="flex-1 overflow-y-auto relative" 
          style={{ 
            background: 'linear-gradient(to bottom, #f8f7fa 0%, #f5f4f7 50%, #f0eff2 100%)',
            backgroundAttachment: 'fixed',
          }}
        >
          {/* Enhanced Background Pattern with Multiple Layers */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Base pattern */}
            <div className="absolute inset-0 opacity-[0.03]">
              <Image
                src={miscMaskLight}
                alt="Background Pattern"
                fill
                className="object-cover"
                quality={50}
              />
            </div>
            
            {/* Gradient overlays for depth */}
            <div 
              className="absolute inset-0"
              style={{
                background: `
                  radial-gradient(circle at 20% 30%, rgba(115, 103, 240, 0.04) 0%, transparent 50%),
                  radial-gradient(circle at 80% 70%, rgba(212, 70, 239, 0.03) 0%, transparent 50%),
                  radial-gradient(circle at 50% 50%, rgba(40, 199, 111, 0.02) 0%, transparent 50%)
                `,
              }}
            />
            
            {/* Subtle grid pattern */}
            <div 
              className="absolute inset-0 opacity-[0.02]"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(115, 103, 240, 0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(115, 103, 240, 0.1) 1px, transparent 1px)
                `,
                backgroundSize: '50px 50px',
              }}
            />
          </div>
          
          {/* Content Container - Enhanced */}
          <div className="relative min-h-full z-10">
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8 lg:py-10">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Footer - Enhanced Professional Design */}
      <footer 
        className="border-t mt-auto flex-shrink-0 relative" 
        style={{ 
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          backgroundColor: 'rgba(255, 255, 255, 0.75)',
          borderTop: '1px solid rgba(226, 232, 240, 0.6)',
          boxShadow: '0 -1px 0 0 rgba(255, 255, 255, 0.5) inset, 0 -2px 8px 0 rgba(0, 0, 0, 0.04)',
        }}
      >
        {/* Subtle gradient overlay */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            background: 'linear-gradient(to top, rgba(115, 103, 240, 0.02) 0%, transparent 100%)',
          }}
        />
        
        <div className="px-4 sm:px-6 lg:px-8 py-6 relative z-10">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3 text-sm">
              <div 
                className="relative rounded-xl overflow-hidden flex items-center justify-center shadow-md ring-1 ring-primary-500/10 bg-white/90 backdrop-blur-sm p-1" 
                style={{ 
                  boxShadow: '0 2px 6px 0 rgba(0, 0, 0, 0.08)',
                  height: '2rem', // Fixed height for footer
                }}
              >
                <img
                  src={typeof logoText === 'string' ? logoText : logoText.src}
                  alt="AssetSight Logo"
                  style={{
                    height: '100%',
                    width: 'auto',
                    maxHeight: '2rem',
                    filter: 'none',
                    display: 'block',
                    objectFit: 'contain',
                  }}
                />
              </div>
              <span className="font-bold bg-gradient-to-r from-primary-600 via-primary-700 to-accent-600 bg-clip-text text-transparent">AssetSight</span>
              <span className="text-slate-400 font-semibold">© {new Date().getFullYear()}</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-600 font-semibold">
              <span>نظام إدارة الأصول</span>
              <span className="hidden sm:inline text-slate-300">•</span>
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

