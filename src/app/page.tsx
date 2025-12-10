'use client';

import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { useAuth } from "@/contexts/AuthContext";
import { BaseModel } from "@/lib/BaseModel";
import { firestoreApi } from "@/lib/FirestoreApi";
import { useEffect, useState } from "react";

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    departments: 0,
    offices: 0,
    assets: 0,
    users: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    const loadStats = async () => {
      try {
        // جلب الإدارات والأصول
        const [deptDocs, assetDocs] = await Promise.all([
          firestoreApi.getDocuments(firestoreApi.getCollection("departments")),
          firestoreApi.getDocuments(firestoreApi.getCollection("assets")),
        ]);

        const departments = BaseModel.fromFirestoreArray(deptDocs);
        
        // جلب جميع المكاتب من جميع الإدارات
        let totalOffices = 0;
        
        for (const dept of departments) {
          const deptId = dept.get('id');
          if (deptId) {
            // جلب المكاتب
            const subCollectionRef = firestoreApi.getSubCollection("departments", deptId, "departments");
            const officeDocs = await firestoreApi.getDocuments(subCollectionRef);
            totalOffices += officeDocs.length;
          }
        }
        
        // جلب جميع المستخدمين من الجدول المستقل users/userId/
        const userDocs = await firestoreApi.getDocuments(firestoreApi.getCollection("users"));
        const totalUsers = userDocs.length;

        setStats({
          departments: departments.length,
          offices: totalOffices,
          assets: assetDocs.length,
          users: totalUsers,
        });
      } catch (error) {
        console.error("Error loading stats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [authLoading]);

  if (authLoading || loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64 animate-fade-in">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"></div>
            <p className="text-secondary-600 text-sm">جاري التحميل...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-6">
          <Card variant="flat" className="shadow-elevation-0 bg-white border-0">
            <CardHeader 
              title="لوحة التحكم" 
              subtitle="نظرة شاملة على النظام"
            />
          </Card>
        </div>

        {!user && (
          <Card variant="outlined" className="mb-4 sm:mb-6 border-warning-500 bg-warning-50 shadow-elevation-1">
            <CardBody padding="md">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <p className="text-warning-800 font-medium text-sm sm:text-base">يرجى تسجيل الدخول للوصول إلى النظام</p>
                <a href="/login" className="w-full sm:w-auto">
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full sm:w-auto"
                  >
                    تسجيل الدخول
                  </Button>
                </a>
              </div>
            </CardBody>
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
          <Card hover variant="elevated" className="material-transition">
            <CardBody padding="md">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-secondary-600 mb-1 sm:mb-2">الإدارات</p>
                  <p className="text-2xl sm:text-3xl font-bold text-secondary-900 truncate">{stats.departments}</p>
                </div>
                <div className="text-3xl sm:text-4xl flex-shrink-0 mr-2 sm:mr-0">🏢</div>
              </div>
            </CardBody>
          </Card>

          <Card hover variant="elevated" className="material-transition">
            <CardBody padding="md">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-secondary-600 mb-1 sm:mb-2">المكاتب</p>
                  <p className="text-2xl sm:text-3xl font-bold text-secondary-900 truncate">{stats.offices}</p>
                </div>
                <div className="text-3xl sm:text-4xl flex-shrink-0 mr-2 sm:mr-0">🚪</div>
              </div>
            </CardBody>
          </Card>

          <Card hover variant="elevated" className="material-transition">
            <CardBody padding="md">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-secondary-600 mb-1 sm:mb-2">الأصول</p>
                  <p className="text-2xl sm:text-3xl font-bold text-secondary-900 truncate">{stats.assets}</p>
                </div>
                <div className="text-3xl sm:text-4xl flex-shrink-0 mr-2 sm:mr-0">💼</div>
              </div>
            </CardBody>
          </Card>

          <Card hover variant="elevated" className="material-transition">
            <CardBody padding="md">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-secondary-600 mb-1 sm:mb-2">المستخدمون</p>
                  <p className="text-2xl sm:text-3xl font-bold text-secondary-900 truncate">{stats.users}</p>
                </div>
                <div className="text-3xl sm:text-4xl flex-shrink-0 mr-2 sm:mr-0">👥</div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}

