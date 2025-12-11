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
      <div className="mb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
              <HomeIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">لوحة التحكم</h1>
              <p className="text-slate-600 text-base mt-1 font-medium">نظرة شاملة على النظام</p>
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
          <Card hover variant="elevated" className="material-transition border-0 shadow-2xl hover:shadow-3xl bg-gradient-to-br from-white to-blue-50/30 overflow-hidden group">
            <CardBody padding="lg">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-600 mb-3">الإدارات</p>
                  <p className="text-4xl font-extrabold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent truncate">{stats.departments}</p>
                </div>
                <div className="text-5xl flex-shrink-0 opacity-20 group-hover:opacity-30 material-transition">🏢</div>
              </div>
            </CardBody>
          </Card>

          <Card hover variant="elevated" className="material-transition border-0 shadow-2xl hover:shadow-3xl bg-gradient-to-br from-white to-blue-50/30 overflow-hidden group">
            <CardBody padding="lg">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-600 mb-3">المكاتب</p>
                  <p className="text-4xl font-extrabold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent truncate">{stats.offices}</p>
                </div>
                <div className="text-5xl flex-shrink-0 opacity-20 group-hover:opacity-30 material-transition">🚪</div>
              </div>
            </CardBody>
          </Card>

          <Card hover variant="elevated" className="material-transition border-0 shadow-2xl hover:shadow-3xl bg-gradient-to-br from-white to-blue-50/30 overflow-hidden group">
            <CardBody padding="lg">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-600 mb-3">الأصول</p>
                  <p className="text-4xl font-extrabold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent truncate">{stats.assets}</p>
                </div>
                <div className="text-5xl flex-shrink-0 opacity-20 group-hover:opacity-30 material-transition">💼</div>
              </div>
            </CardBody>
          </Card>

          <Card hover variant="elevated" className="material-transition border-0 shadow-2xl hover:shadow-3xl bg-gradient-to-br from-white to-blue-50/30 overflow-hidden group">
            <CardBody padding="lg">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-600 mb-3">المستخدمون</p>
                  <p className="text-4xl font-extrabold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent truncate">{stats.users}</p>
                </div>
                <div className="text-5xl flex-shrink-0 opacity-20 group-hover:opacity-30 material-transition">👥</div>
              </div>
            </CardBody>
          </Card>
        </div>
    </MainLayout>
  );
}

