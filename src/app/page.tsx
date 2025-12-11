'use client';

import { HomeIcon } from "@/components/icons";
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
      {/* Page Header */}
      <div className="mb-10">
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 flex items-center justify-center shadow-xl shadow-primary-500/40 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 material-transition"></div>
              <HomeIcon className="w-7 h-7 text-white relative z-10" />
            </div>
            <div className="flex-1">
              <h1 className="text-5xl font-black bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent mb-2">لوحة التحكم</h1>
              <p className="text-slate-600 text-lg font-semibold">نظرة شاملة على النظام وإحصائياته</p>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Departments Card */}
          <Card hover variant="elevated" className="material-transition border-0 shadow-elevation-4 hover:shadow-elevation-8 bg-gradient-to-br from-white via-primary-50/40 to-primary-100/30 overflow-hidden group relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-400/20 to-transparent rounded-full blur-2xl"></div>
            <CardBody padding="lg" className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">الإدارات</p>
                  <p className="text-5xl font-black bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 bg-clip-text text-transparent truncate mb-1">{stats.departments}</p>
                  <p className="text-xs text-slate-500 font-medium">إدارة نشطة</p>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/40 group-hover:scale-110 material-transition">
                  <span className="text-3xl">🏢</span>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Offices Card */}
          <Card hover variant="elevated" className="material-transition border-0 shadow-elevation-4 hover:shadow-elevation-8 bg-gradient-to-br from-white via-accent-50/40 to-accent-100/30 overflow-hidden group relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent-400/20 to-transparent rounded-full blur-2xl"></div>
            <CardBody padding="lg" className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">المكاتب</p>
                  <p className="text-5xl font-black bg-gradient-to-r from-accent-600 via-accent-700 to-accent-800 bg-clip-text text-transparent truncate mb-1">{stats.offices}</p>
                  <p className="text-xs text-slate-500 font-medium">مكتب متاح</p>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center shadow-lg shadow-accent-500/40 group-hover:scale-110 material-transition">
                  <span className="text-3xl">🚪</span>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Assets Card */}
          <Card hover variant="elevated" className="material-transition border-0 shadow-elevation-4 hover:shadow-elevation-8 bg-gradient-to-br from-white via-success-50/40 to-success-100/30 overflow-hidden group relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-success-400/20 to-transparent rounded-full blur-2xl"></div>
            <CardBody padding="lg" className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">الأصول</p>
                  <p className="text-5xl font-black bg-gradient-to-r from-success-600 via-success-700 to-success-800 bg-clip-text text-transparent truncate mb-1">{stats.assets}</p>
                  <p className="text-xs text-slate-500 font-medium">أصل مسجل</p>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-success-500 to-success-600 flex items-center justify-center shadow-lg shadow-success-500/40 group-hover:scale-110 material-transition">
                  <span className="text-3xl">💼</span>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Users Card */}
          <Card hover variant="elevated" className="material-transition border-0 shadow-elevation-4 hover:shadow-elevation-8 bg-gradient-to-br from-white via-warning-50/40 to-warning-100/30 overflow-hidden group relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-warning-400/20 to-transparent rounded-full blur-2xl"></div>
            <CardBody padding="lg" className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">المستخدمون</p>
                  <p className="text-5xl font-black bg-gradient-to-r from-warning-600 via-warning-700 to-warning-800 bg-clip-text text-transparent truncate mb-1">{stats.users}</p>
                  <p className="text-xs text-slate-500 font-medium">مستخدم نشط</p>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-warning-500 to-warning-600 flex items-center justify-center shadow-lg shadow-warning-500/40 group-hover:scale-110 material-transition">
                  <span className="text-3xl">👥</span>
                </div>
              </div>
            </CardBody>
          </Card>
      </div>
    </MainLayout>
  );
}

