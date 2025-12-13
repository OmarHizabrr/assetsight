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
      <div className="mb-10 relative">
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 flex items-center justify-center shadow-2xl shadow-primary-500/40 overflow-hidden group hover:scale-105 material-transition">
              <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-transparent opacity-0 group-hover:opacity-100 material-transition"></div>
              <MaterialIcon name="dashboard" className="text-white relative z-10" size="3xl" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-slate-900 mb-2">لوحة التحكم</h1>
              <p className="text-slate-600 text-base font-medium">نظرة شاملة على النظام وإحصائياته</p>
            </div>
          </div>
        </div>
        
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-500/10 to-accent-500/10 rounded-full blur-3xl -z-10"></div>
      </div>

        {!user && (
          <Card variant="outlined" className="mb-8 border-warning-500/60 bg-gradient-to-r from-warning-50 to-warning-100/50 shadow-lg">
            <CardBody padding="lg">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <p className="text-warning-800 font-semibold text-sm">يرجى تسجيل الدخول للوصول إلى النظام</p>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Departments Card */}
          <Card hover variant="elevated" className="bg-white/95 border border-slate-200/80 relative overflow-hidden group animate-fade-in shadow-md hover:shadow-xl hover:shadow-primary/20 backdrop-blur-sm">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 shadow-lg shadow-primary-500/50"></div>
            <CardBody padding="lg">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">الإدارات</p>
                  <p className="text-4xl font-bold text-slate-900 mb-1">{stats.departments}</p>
                  <p className="text-sm text-slate-600 font-medium">إدارة نشطة</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center shadow-md shadow-primary-500/20 group-hover:bg-gradient-to-br group-hover:from-primary-200 group-hover:to-primary-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary-500/30 material-transition">
                  <MaterialIcon name="business" className="text-primary-600 group-hover:text-primary-700" size="lg" />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Offices Card */}
          <Card hover variant="elevated" className="bg-white/95 border border-slate-200/80 relative overflow-hidden group animate-fade-in shadow-md hover:shadow-xl hover:shadow-accent/20 backdrop-blur-sm" style={{ animationDelay: '0.1s' }}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent-500 via-accent-600 to-accent-700 shadow-lg shadow-accent-500/50"></div>
            <CardBody padding="lg">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">المكاتب</p>
                  <p className="text-4xl font-bold text-slate-900 mb-1">{stats.offices}</p>
                  <p className="text-sm text-slate-600 font-medium">مكتب متاح</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-100 to-accent-200 flex items-center justify-center shadow-md shadow-accent-500/20 group-hover:bg-gradient-to-br group-hover:from-accent-200 group-hover:to-accent-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-accent-500/30 material-transition">
                  <MaterialIcon name="meeting_room" className="text-accent-600 group-hover:text-accent-700" size="lg" />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Assets Card */}
          <Card hover variant="elevated" className="bg-white/95 border border-slate-200/80 relative overflow-hidden group animate-fade-in shadow-md hover:shadow-xl hover:shadow-success/20 backdrop-blur-sm" style={{ animationDelay: '0.2s' }}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-success-500 via-success-600 to-success-700 shadow-lg shadow-success-500/50"></div>
            <CardBody padding="lg">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">الأصول</p>
                  <p className="text-4xl font-bold text-slate-900 mb-1">{stats.assets}</p>
                  <p className="text-sm text-slate-600 font-medium">أصل مسجل</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-success-100 to-success-200 flex items-center justify-center shadow-md shadow-success-500/20 group-hover:bg-gradient-to-br group-hover:from-success-200 group-hover:to-success-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-success-500/30 material-transition">
                  <MaterialIcon name="inventory" className="text-success-600 group-hover:text-success-700" size="lg" />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Users Card */}
          <Card hover variant="elevated" className="bg-white/95 border border-slate-200/80 relative overflow-hidden group animate-fade-in shadow-md hover:shadow-xl hover:shadow-warning/20 backdrop-blur-sm" style={{ animationDelay: '0.3s' }}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-warning-500 via-warning-600 to-warning-700 shadow-lg shadow-warning-500/50"></div>
            <CardBody padding="lg">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">المستخدمون</p>
                  <p className="text-4xl font-bold text-slate-900 mb-1">{stats.users}</p>
                  <p className="text-sm text-slate-600 font-medium">مستخدم نشط</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-warning-100 to-warning-200 flex items-center justify-center shadow-md shadow-warning-500/20 group-hover:bg-gradient-to-br group-hover:from-warning-200 group-hover:to-warning-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-warning-500/30 material-transition">
                  <MaterialIcon name="people" className="text-warning-600 group-hover:text-warning-700" size="lg" />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
    </MainLayout>
  );
}

