'use client';

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { firestoreApi } from "@/lib/FirestoreApi";
import { BaseModel } from "@/lib/BaseModel";

// دالة لتطبيع المسار (إزالة الشرطة المائلة في النهاية)
function normalizePath(path: string): string {
  if (!path || path === '/') return '/';
  return path.replace(/\/+$/, ''); // إزالة جميع الشرطات المائلة في النهاية
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
  if (role === 'مدير') {
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
  if (role === 'مدير') {
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
  if (role === 'مدير') return true;
  
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
  if (role === 'مدير') return true;
  
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
  if (role === 'مدير') return true;
  
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
      if (role === 'مدير') {
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
    if (!loading && !user) {
      router.push('/login');
      return;
    }

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
    return null;
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

