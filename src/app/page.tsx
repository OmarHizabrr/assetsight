'use client';

import { MaterialIcon } from "@/components/icons/MaterialIcon";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
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
      {/* Page Header */}
      <div className="mb-10">
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
              <MaterialIcon name="dashboard" className="text-primary-600" size="3xl" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-medium text-gray-900 mb-1">لوحة التحكم</h1>
              <p className="text-gray-600 text-sm">نظرة شاملة على النظام وإحصائياته</p>
            </div>
          </div>
        </div>
      </div>

        {!user && (
          <Card variant="outlined" className="mb-8 border-warning-500 bg-gradient-to-r from-warning-50 to-warning-100/50 shadow-elevation-2">
            <CardBody padding="lg">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <p className="text-warning-800 font-semibold text-base">يرجى تسجيل الدخول للوصول إلى النظام</p>
                <a href="/login" className="w-full sm:w-auto">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    تسجيل الدخول
                  </Button>
                </a>
              </div>
            </CardBody>
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Departments Card - Vuetify Style */}
          <Card hover variant="elevated" className="bg-white shadow-sm hover:shadow-md material-transition">
            <CardBody padding="lg">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500 mb-2 uppercase">الإدارات</p>
                  <p className="text-4xl font-medium text-gray-900 mb-1">{stats.departments}</p>
                  <p className="text-xs text-gray-500">إدارة نشطة</p>
                </div>
                <div className="w-14 h-14 rounded-lg bg-primary-100 flex items-center justify-center">
                  <MaterialIcon name="business" className="text-primary-600" size="3xl" />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Offices Card */}
          <Card hover variant="elevated" className="bg-white shadow-sm hover:shadow-md material-transition">
            <CardBody padding="lg">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500 mb-2 uppercase">المكاتب</p>
                  <p className="text-4xl font-medium text-gray-900 mb-1">{stats.offices}</p>
                  <p className="text-xs text-gray-500">مكتب متاح</p>
                </div>
                <div className="w-14 h-14 rounded-lg bg-purple-100 flex items-center justify-center">
                  <MaterialIcon name="meeting_room" className="text-purple-600" size="3xl" />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Assets Card */}
          <Card hover variant="elevated" className="bg-white shadow-sm hover:shadow-md material-transition">
            <CardBody padding="lg">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500 mb-2 uppercase">الأصول</p>
                  <p className="text-4xl font-medium text-gray-900 mb-1">{stats.assets}</p>
                  <p className="text-xs text-gray-500">أصل مسجل</p>
                </div>
                <div className="w-14 h-14 rounded-lg bg-green-100 flex items-center justify-center">
                  <MaterialIcon name="inventory" className="text-green-600" size="3xl" />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Users Card */}
          <Card hover variant="elevated" className="bg-white shadow-sm hover:shadow-md material-transition">
            <CardBody padding="lg">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500 mb-2 uppercase">المستخدمون</p>
                  <p className="text-4xl font-medium text-gray-900 mb-1">{stats.users}</p>
                  <p className="text-xs text-gray-500">مستخدم نشط</p>
                </div>
                <div className="w-14 h-14 rounded-lg bg-orange-100 flex items-center justify-center">
                  <MaterialIcon name="people" className="text-orange-600" size="3xl" />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
    </MainLayout>
  );
}

