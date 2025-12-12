'use client';

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { firestoreApi } from "@/lib/FirestoreApi";
import { BaseModel } from "@/lib/BaseModel";

// دالة للتحقق من صلاحية المستخدم على صفحة معينة
export function hasPermission(user: any, path: string): boolean {
  if (!user) return false;
  
  // الصفحة الرئيسية متاحة دائماً
  if (path === '/') {
    return true;
  }
  
  const role = user.get('role');
  const permissions = user.getValue<string[]>('permissions') || [];
  
  // المدير لديه صلاحية على جميع الصفحات
  if (role === 'مدير') {
    return true;
  }
  
  // التحقق من الصلاحيات للمستخدمين غير المديرين
  return permissions.includes(path);
}

// دالة لجلب صلاحيات المستخدم على صفحة معينة
export async function getUserPermissions(userId: string, pagePath: string): Promise<BaseModel | null> {
  try {
    const subCollectionRef = firestoreApi.getSubCollection("powers", userId, "powers");
    const permissionDocs = await firestoreApi.getDocuments(subCollectionRef, {
      whereField: "page_path",
      isEqualTo: pagePath
    });
    
    if (permissionDocs.length > 0) {
      return BaseModel.fromFirestore(permissionDocs[0]);
    }
    return null;
  } catch (error) {
    console.error("Error loading user permissions:", error);
    return null;
  }
}

// دالة للتحقق من صلاحية إضافة
export async function canAdd(user: any, pagePath: string): Promise<boolean> {
  if (!user) return false;
  
  const role = user.get('role');
  if (role === 'مدير') return true;
  
  const userId = user.get('id');
  if (!userId) return false;
  
  const permission = await getUserPermissions(userId, pagePath);
  if (!permission) return false;
  
  return permission.getValue<number>('can_add') === 1 || permission.getValue<boolean>('can_add') === true;
}

// دالة للتحقق من صلاحية تعديل
export async function canEdit(user: any, pagePath: string): Promise<boolean> {
  if (!user) return false;
  
  const role = user.get('role');
  if (role === 'مدير') return true;
  
  const userId = user.get('id');
  if (!userId) return false;
  
  const permission = await getUserPermissions(userId, pagePath);
  if (!permission) return false;
  
  return permission.getValue<number>('can_edit') === 1 || permission.getValue<boolean>('can_edit') === true;
}

// دالة للتحقق من صلاحية حذف
export async function canDelete(user: any, pagePath: string): Promise<boolean> {
  if (!user) return false;
  
  const role = user.get('role');
  if (role === 'مدير') return true;
  
  const userId = user.get('id');
  if (!userId) return false;
  
  const permission = await getUserPermissions(userId, pagePath);
  if (!permission) return false;
  
  return permission.getValue<number>('can_delete') === 1 || permission.getValue<boolean>('can_delete') === true;
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
          setPermissions({
            canAdd: permission.getValue<number>('can_add') === 1 || permission.getValue<boolean>('can_add') === true,
            canEdit: permission.getValue<number>('can_edit') === 1 || permission.getValue<boolean>('can_edit') === true,
            canDelete: permission.getValue<number>('can_delete') === 1 || permission.getValue<boolean>('can_delete') === true,
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

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    // التحقق من الصلاحيات إذا كان المستخدم مسجل دخول
    if (!loading && user && pathname && pathname !== '/') {
      if (!hasPermission(user, pathname)) {
        // إعادة التوجيه إلى الصفحة الرئيسية إذا لم يكن لديه صلاحية
        router.push('/');
      }
    }
  }, [user, loading, router, pathname]);

  if (loading) {
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
  if (pathname && pathname !== '/' && !hasPermission(user, pathname)) {
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

