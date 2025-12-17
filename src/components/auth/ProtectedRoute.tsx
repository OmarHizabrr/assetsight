'use client';

import loginIllustration from "@/assets/images/illustrations/auth/v2-login-light.png";
import logoText from "@/assets/images/logos/logo-text.png";
import authMaskLight from "@/assets/images/pages/auth-mask-light.png";
import { MaterialIcon } from "@/components/icons/MaterialIcon";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { useAuth } from "@/contexts/AuthContext";
import { BaseModel } from "@/lib/BaseModel";
import { firestoreApi } from "@/lib/FirestoreApi";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// دالة لتطبيع المسار (إزالة الشرطة المائلة في النهاية)
function normalizePath(path: string): string {
  if (!path || path === '/') return '/';
  return path.replace(/\/+$/, ''); // إزالة جميع الشرطات المائلة في النهاية
}

// دالة للتحقق من أن المستخدم مدير (تدعم عدة أشكال من role)
function isAdmin(role: string | null | undefined): boolean {
  if (!role) return false;
  const normalizedRole = role.trim().toLowerCase();
  return normalizedRole === 'مدير' || 
         normalizedRole === 'admin' || 
         normalizedRole === 'administrator' ||
         normalizedRole === 'مدير النظام' ||
         normalizedRole === 'system admin';
}

// دالة للتحقق من صلاحية المستخدم على صفحة معينة (async)
export async function hasPermissionAsync(user: BaseModel | null, path: string): Promise<boolean> {
  if (!user) return false;
  
  // تطبيع المسار
  const normalizedPath = normalizePath(path);
  
  // الصفحة الرئيسية متاحة دائماً
  if (normalizedPath === '/') {
    return true;
  }
  
  const role = user.get('role');
  
  // المدير لديه صلاحية على جميع الصفحات
  if (isAdmin(role)) {
    return true;
  }
  
  // التحقق من الصلاحيات للمستخدمين غير المديرين من subcollection
  const userId = user.get('id');
  if (!userId) return false;
  
  try {
    const permission = await getUserPermissions(userId, normalizedPath);
    if (!permission) return false;
    
    // التحقق من can_view
    const canView = permission.getValue('can_view');
    return (canView as number) === 1 || (canView as boolean) === true;
  } catch (error) {
    console.error("Error checking permission:", error);
    return false;
  }
}

// دالة للتحقق من صلاحية المستخدم على صفحة معينة (sync - للتوافق مع الكود القديم)
export function hasPermission(user: BaseModel | null, path: string): boolean {
  if (!user) return false;
  
  // الصفحة الرئيسية متاحة دائماً
  if (path === '/') {
    return true;
  }
  
  const role = user.get('role');
  
  // المدير لديه صلاحية على جميع الصفحات
  if (isAdmin(role)) {
    return true;
  }
  
  // للمستخدمين غير المديرين، نستخدم hasPermissionAsync
  // لكن هذه الدالة sync، لذا نعيد false مؤقتاً وسيتم التحقق في useEffect
  return false;
}

// دالة لجلب صلاحيات المستخدم على صفحة معينة
export async function getUserPermissions(userId: string, pagePath: string): Promise<BaseModel | null> {
  try {
    // تطبيع المسار
    const normalizedPath = normalizePath(pagePath);
    
    const subCollectionRef = firestoreApi.getSubCollection("powers", userId, "powers");
    
    // جلب جميع الصلاحيات أولاً للتحقق
    const allPermissionDocs = await firestoreApi.getDocuments(subCollectionRef);
    console.log(`All permissions for user ${userId}:`, allPermissionDocs.length, "total permissions");
    
    // البحث عن الصلاحية المحددة باستخدام المسار المطبيع
    const permissionDocs = await firestoreApi.getDocuments(subCollectionRef, {
      whereField: "page_path",
      isEqualTo: normalizedPath
    });
    
    console.log(`Checking permissions for user ${userId} on path "${normalizedPath}":`, permissionDocs.length, "permissions found");
    
    if (permissionDocs.length > 0) {
      const permission = BaseModel.fromFirestore(permissionDocs[0]);
      const permData = permission.getData();
      console.log("Permission data:", permData);
      console.log("Permission can_view:", permData.can_view);
      return permission;
    }
    
    // إذا لم نجد باستخدام whereField، نبحث يدوياً (مع تطبيع المسارات)
    const manualMatch = allPermissionDocs.find(doc => {
      const data = doc.data();
      const storedPath = normalizePath(data.page_path || '');
      const matches = storedPath === normalizedPath;
      if (matches) {
        console.log(`Found manual match: stored="${storedPath}", requested="${normalizedPath}"`);
      }
      return matches;
    });
    
    if (manualMatch) {
      console.log("Found permission manually:", manualMatch.data());
      return BaseModel.fromFirestore(manualMatch);
    }
    
    console.log(`No permission found for path: "${normalizedPath}"`);
    console.log("Available paths:", allPermissionDocs.map(doc => normalizePath(doc.data().page_path)));
    return null;
  } catch (error) {
    console.error("Error loading user permissions:", error);
    return null;
  }
}

// دالة للتحقق من صلاحية إضافة
export async function canAdd(user: BaseModel | null, pagePath: string): Promise<boolean> {
  if (!user) return false;
  
  const role = user.get('role');
  if (isAdmin(role)) return true;
  
  const userId = user.get('id');
  if (!userId) return false;
  
  const permission = await getUserPermissions(userId, pagePath);
  if (!permission) return false;
  
  const canAddValue = permission.getValue('can_add');
  return (canAddValue as number) === 1 || (canAddValue as boolean) === true;
}

// دالة للتحقق من صلاحية تعديل
export async function canEdit(user: BaseModel | null, pagePath: string): Promise<boolean> {
  if (!user) return false;
  
  const role = user.get('role');
  if (isAdmin(role)) return true;
  
  const userId = user.get('id');
  if (!userId) return false;
  
  const permission = await getUserPermissions(userId, pagePath);
  if (!permission) return false;
  
  const canEditValue = permission.getValue('can_edit');
  return (canEditValue as number) === 1 || (canEditValue as boolean) === true;
}

// دالة للتحقق من صلاحية حذف
export async function canDelete(user: BaseModel | null, pagePath: string): Promise<boolean> {
  if (!user) return false;
  
  const role = user.get('role');
  if (isAdmin(role)) return true;
  
  const userId = user.get('id');
  if (!userId) return false;
  
  const permission = await getUserPermissions(userId, pagePath);
  if (!permission) return false;
  
  const canDeleteValue = permission.getValue('can_delete');
  return (canDeleteValue as number) === 1 || (canDeleteValue as boolean) === true;
}

// Hook للتحقق من الصلاحيات في المكونات
export function usePermissions(pagePath: string) {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState({
    canAdd: false,
    canEdit: false,
    canDelete: false,
    loading: true,
  });

  useEffect(() => {
    const loadPermissions = async () => {
      if (!user) {
        setPermissions({ canAdd: false, canEdit: false, canDelete: false, loading: false });
        return;
      }

      const role = user.get('role');
      if (isAdmin(role)) {
        setPermissions({ canAdd: true, canEdit: true, canDelete: true, loading: false });
        return;
      }

      const userId = user.get('id');
      if (!userId) {
        setPermissions({ canAdd: false, canEdit: false, canDelete: false, loading: false });
        return;
      }

      try {
        const permission = await getUserPermissions(userId, pagePath);
        if (permission) {
          const canAddValue = permission.getValue('can_add');
          const canEditValue = permission.getValue('can_edit');
          const canDeleteValue = permission.getValue('can_delete');
          setPermissions({
            canAdd: (canAddValue as number) === 1 || (canAddValue as boolean) === true,
            canEdit: (canEditValue as number) === 1 || (canEditValue as boolean) === true,
            canDelete: (canDeleteValue as number) === 1 || (canDeleteValue as boolean) === true,
            loading: false,
          });
        } else {
          setPermissions({ canAdd: false, canEdit: false, canDelete: false, loading: false });
        }
      } catch (error) {
        console.error("Error loading permissions:", error);
        setPermissions({ canAdd: false, canEdit: false, canDelete: false, loading: false });
      }
    };

    loadPermissions();
  }, [user, pagePath]);

  return permissions;
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    // لا نعيد التوجيه تلقائياً، سنعرض صفحة ترحيبية بدلاً من ذلك
    // if (!loading && !user) {
    //   router.push('/login');
    //   return;
    // }

    // التحقق من الصلاحيات إذا كان المستخدم مسجل دخول
    if (!loading && user && pathname) {
      // الصفحة الرئيسية متاحة دائماً
      if (pathname === '/') {
        setHasAccess(true);
        return;
      }
      
      // إعادة تعيين hasAccess عند تغيير pathname
      setHasAccess(null);
      
      const checkPermission = async () => {
        try {
          console.log(`Checking permission for path: ${pathname}, user: ${user.get('id')}, role: ${user.get('role')}`);
          const hasPerm = await hasPermissionAsync(user, pathname);
          console.log(`Permission result for ${pathname}:`, hasPerm);
          setHasAccess(hasPerm);
          
          if (!hasPerm) {
            // إعادة التوجيه إلى الصفحة الرئيسية إذا لم يكن لديه صلاحية
            console.log(`No permission for ${pathname}, redirecting to home`);
            router.push('/');
          }
        } catch (error) {
          console.error("Error checking permission:", error);
          setHasAccess(false);
          router.push('/');
        }
      };
      
      checkPermission();
    }
  }, [user, loading, router, pathname]);

  if (loading || (user && pathname && pathname !== '/' && hasAccess === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"></div>
          <p className="text-sm text-secondary-600 animate-pulse">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#f8f7fa] px-4 py-12">
        {/* Background Mask Image */}
        <div className="absolute inset-0 z-0 opacity-20">
          <Image
            src={authMaskLight}
            alt="Background"
            fill
            className="object-cover"
            priority
            quality={90}
          />
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary-500/10 to-accent-500/10 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-success-500/10 to-warning-500/10 rounded-full blur-3xl -z-10"></div>

        <div className="relative z-10 w-full max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Illustration */}
            <div className="hidden lg:flex flex-col items-center justify-center space-y-6 p-8">
              <div className="relative w-full max-w-md">
                <Image
                  src={loginIllustration}
                  alt="Welcome Illustration"
                  width={500}
                  height={500}
                  className="object-contain animate-fade-in"
                  priority
                  quality={90}
                />
              </div>
            </div>

            {/* Right Side - Welcome Content */}
            <div className="w-full">
              <div className="w-full max-w-lg mx-auto">
                {/* Logo */}
                <div className="flex flex-col items-center mb-10 space-y-4">
                  <div className="relative w-24 h-24">
                    <Image
                      src={logoText}
                      alt="AssetSight Logo"
                      fill
                      className="object-contain"
                      priority
                      quality={90}
                    />
                  </div>
                  <div className="text-center space-y-2">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                      AssetSight
                    </h1>
                    <p className="text-slate-600 text-base font-medium">نظام إدارة الأصول والممتلكات</p>
                  </div>
                </div>

                {/* Welcome Card */}
                <Card variant="elevated" className="w-full shadow-2xl shadow-primary/20 border border-slate-200/80 bg-white/95 backdrop-blur-sm">
                  <CardBody className="p-8 space-y-6">
                    <div className="text-center space-y-4">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 flex items-center justify-center shadow-xl shadow-primary-500/40 mx-auto">
                        <MaterialIcon name="person" className="text-white" size="3xl" />
                      </div>
                      <h2 className="text-3xl font-bold text-slate-900">مرحباً بك!</h2>
                      <p className="text-slate-600 text-lg leading-relaxed">
                        للوصول إلى النظام والاستفادة من جميع الميزات، يرجى تسجيل الدخول باستخدام بياناتك المسجلة
                      </p>
                    </div>

                    <div className="pt-4">
                      <Button
                        onClick={() => router.push('/login')}
                        variant="primary"
                        size="lg"
                        fullWidth
                        leftIcon={<MaterialIcon name="login" className="text-white" size="md" />}
                        className="shadow-xl shadow-primary-500/40"
                      >
                        تسجيل الدخول
                      </Button>
                    </div>

                    {/* Features */}
                    <div className="pt-6 border-t border-slate-200 space-y-4">
                      <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide text-center">
                        ميزات النظام
                      </p>
                      <div className="grid grid-cols-1 gap-3">
                        <div className="flex items-center gap-3 p-4 bg-primary-50 rounded-xl border border-primary-100 hover:bg-primary-100 material-transition">
                          <div className="w-10 h-10 rounded-lg bg-primary-500 flex items-center justify-center">
                            <MaterialIcon name="inventory" className="text-white" size="md" />
                          </div>
                          <span className="text-sm font-semibold text-slate-700">إدارة الأصول</span>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-accent-50 rounded-xl border border-accent-100 hover:bg-accent-100 material-transition">
                          <div className="w-10 h-10 rounded-lg bg-accent-500 flex items-center justify-center">
                            <MaterialIcon name="assessment" className="text-white" size="md" />
                          </div>
                          <span className="text-sm font-semibold text-slate-700">التقارير والإحصائيات</span>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-success-50 rounded-xl border border-success-100 hover:bg-success-100 material-transition">
                          <div className="w-10 h-10 rounded-lg bg-success-500 flex items-center justify-center">
                            <MaterialIcon name="track_changes" className="text-white" size="md" />
                          </div>
                          <span className="text-sm font-semibold text-slate-700">تتبع الجرد</span>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                {/* Footer */}
                <div className="mt-8 text-center">
                  <p className="text-xs text-slate-500">
                    © {new Date().getFullYear()} AssetSight. جميع الحقوق محفوظة.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // التحقق من الصلاحيات قبل عرض المحتوى (الصفحة الرئيسية متاحة دائماً)
  if (pathname && pathname !== '/' && hasAccess === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50">
        <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="w-16 h-16 rounded-full bg-error-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-error-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">غير مصرح بالوصول</h2>
          <p className="text-sm text-gray-600 text-center">ليس لديك صلاحية للوصول إلى هذه الصفحة</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 material-transition"
          >
            العودة إلى الصفحة الرئيسية
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

