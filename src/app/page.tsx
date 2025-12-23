'use client';

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MaterialIcon } from "@/components/icons/MaterialIcon";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardBody } from "@/components/ui/Card";
import { useAuth } from "@/contexts/AuthContext";
import { useDarkMode } from "@/hooks/useDarkMode";
import { BaseModel } from "@/lib/BaseModel";
import { firestoreApi } from "@/lib/FirestoreApi";
import { useEffect, useState } from "react";

function HomePageContent() {
  const { user } = useAuth();
  const { isDark } = useDarkMode();
  const [stats, setStats] = useState({
    departments: 0,
    offices: 0,
    assets: 0,
    users: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadStats = async () => {
      try {
        // جلب الإحصائيات السريعة باستخدام count (بدون تحميل البيانات)
        const [
          totalAssets,
          totalDepartments,
          totalUsers,
          deptDocs,
        ] = await Promise.all([
          firestoreApi.getCollectionCount("assets"),
          firestoreApi.getCollectionCount("departments"),
          firestoreApi.getCollectionCount("users"),
          firestoreApi.getDocuments(firestoreApi.getCollection("departments")), // للجلب عدد المكاتب
        ]);

        const departments = BaseModel.fromFirestoreArray(deptDocs);
        
        // جلب عدد المكاتب من جميع الإدارات بشكل سريع
        const officeCountPromises = departments.map(async (dept) => {
          const deptId = dept.get('id');
          if (!deptId) return 0;
          return firestoreApi.getSubCollectionCount({
            parentCollection: "departments",
            parentId: deptId,
            subCollection: "departments",
          });
        });
        const officeCounts = await Promise.all(officeCountPromises);
        const totalOffices = officeCounts.reduce((sum, count) => sum + count, 0);

        setStats({
          departments: totalDepartments,
          offices: totalOffices,
          assets: totalAssets,
          users: totalUsers,
        });
      } catch (error) {
        console.error("Error loading stats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [user]);

  if (loading) {
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
      <div className="mb-10 relative animate-fade-in-down">
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 flex items-center justify-center shadow-2xl shadow-primary-500/40 overflow-hidden group hover:scale-105 material-transition animate-float">
              <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-transparent opacity-0 group-hover:opacity-100 material-transition"></div>
              {/* Glow effect */}
              <div className="absolute -inset-2 bg-primary-500/30 rounded-xl blur-xl opacity-0 group-hover:opacity-100 material-transition -z-10"></div>
              <MaterialIcon name="dashboard" className="text-white relative z-10 material-transition group-hover:rotate-12" size="3xl" />
            </div>
            <div className="flex-1">
              <h1 
                className="text-4xl font-bold mb-2 animate-fade-in-right"
                style={{
                  background: isDark
                    ? 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)'
                    : 'linear-gradient(135deg, #7367f0 0%, #5e52d5 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                لوحة التحكم
              </h1>
              <p 
                className="text-base font-medium animate-fade-in-right" 
                style={{ 
                  animationDelay: '0.1s',
                  color: isDark ? 'rgb(203, 213, 225)' : 'rgb(71, 85, 105)',
                }}
              >
                نظرة شاملة على النظام وإحصائياته
              </p>
            </div>
          </div>
        </div>
        
        {/* Enhanced Decorative Background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-500/10 to-accent-500/10 rounded-full blur-3xl -z-10 animate-pulse-soft"></div>
        <div className="absolute top-10 left-10 w-48 h-48 bg-gradient-to-br from-success-500/5 to-warning-500/5 rounded-full blur-3xl -z-10 animate-pulse-soft" style={{ animationDelay: '0.5s' }}></div>
      </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Departments Card */}
          <Card 
            hover 
            variant="elevated" 
            className="relative overflow-hidden group animate-fade-in-up shadow-md hover:shadow-xl hover:shadow-primary/20 backdrop-blur-sm hover-lift-smooth"
            style={{
              backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              borderColor: isDark ? 'rgba(71, 85, 105, 0.6)' : 'rgba(226, 232, 240, 0.8)',
            }}
          >
            {/* Enhanced gradient top border */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 shadow-lg shadow-primary-500/50 animate-gradient"></div>
            {/* Glow effect on hover */}
            <div className="absolute -inset-1 bg-primary-500/0 group-hover:bg-primary-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 material-transition -z-10"></div>
            <CardBody padding="lg">
              <div className="flex items-start justify-between relative z-10">
                <div className="flex-1 min-w-0">
                  <p 
                    className="text-xs font-semibold uppercase tracking-wide mb-2 animate-fade-in"
                    style={{ color: isDark ? 'rgb(148, 163, 184)' : 'rgb(100, 116, 139)' }}
                  >
                    الإدارات
                  </p>
                  <p 
                    className="text-4xl font-bold mb-1 animate-scale-in"
                    style={{
                      background: isDark
                        ? 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)'
                        : 'linear-gradient(135deg, #7367f0 0%, #5e52d5 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    {stats.departments}
                  </p>
                  <p 
                    className="text-sm font-medium animate-fade-in"
                    style={{ color: isDark ? 'rgb(203, 213, 225)' : 'rgb(71, 85, 105)' }}
                  >
                    إدارة نشطة
                  </p>
                </div>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center shadow-md shadow-primary-500/20 group-hover:bg-gradient-to-br group-hover:from-primary-200 group-hover:to-primary-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary-500/30 material-transition group-hover:rotate-3 animate-float">
                  <MaterialIcon name="business" className="text-primary-600 group-hover:text-primary-700 material-transition" size="lg" />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Offices Card */}
          <Card 
            hover 
            variant="elevated" 
            className="relative overflow-hidden group animate-fade-in-up shadow-md hover:shadow-xl hover:shadow-accent/20 backdrop-blur-sm hover-lift-smooth" 
            style={{ 
              animationDelay: '0.1s',
              backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              borderColor: isDark ? 'rgba(71, 85, 105, 0.6)' : 'rgba(226, 232, 240, 0.8)',
            }}
          >
            {/* Enhanced gradient top border */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-accent-500 via-accent-600 to-accent-700 shadow-lg shadow-accent-500/50 animate-gradient"></div>
            {/* Glow effect on hover */}
            <div className="absolute -inset-1 bg-accent-500/0 group-hover:bg-accent-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 material-transition -z-10"></div>
            <CardBody padding="lg">
              <div className="flex items-start justify-between relative z-10">
                <div className="flex-1 min-w-0">
                  <p 
                    className="text-xs font-semibold uppercase tracking-wide mb-2 animate-fade-in"
                    style={{ color: isDark ? 'rgb(148, 163, 184)' : 'rgb(100, 116, 139)' }}
                  >
                    المكاتب
                  </p>
                  <p 
                    className="text-4xl font-bold mb-1 animate-scale-in" 
                    style={{ 
                      background: isDark
                        ? 'linear-gradient(135deg, #c084fc 0%, #a855f7 100%)'
                        : 'linear-gradient(135deg, #d946ef 0%, #c026d3 100%)', 
                      WebkitBackgroundClip: 'text', 
                      backgroundClip: 'text', 
                      WebkitTextFillColor: 'transparent', 
                      color: 'transparent' 
                    }}
                  >
                    {stats.offices}
                  </p>
                  <p 
                    className="text-sm font-medium animate-fade-in"
                    style={{ color: isDark ? 'rgb(203, 213, 225)' : 'rgb(71, 85, 105)' }}
                  >
                    مكتب متاح
                  </p>
                </div>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent-100 to-accent-200 flex items-center justify-center shadow-md shadow-accent-500/20 group-hover:bg-gradient-to-br group-hover:from-accent-200 group-hover:to-accent-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-accent-500/30 material-transition group-hover:rotate-3 animate-float" style={{ animationDelay: '0.1s' }}>
                  <MaterialIcon name="meeting_room" className="text-accent-600 group-hover:text-accent-700 material-transition" size="lg" />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Assets Card */}
          <Card 
            hover 
            variant="elevated" 
            className="relative overflow-hidden group animate-fade-in-up shadow-md hover:shadow-xl hover:shadow-success/20 backdrop-blur-sm hover-lift-smooth" 
            style={{ 
              animationDelay: '0.2s',
              backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              borderColor: isDark ? 'rgba(71, 85, 105, 0.6)' : 'rgba(226, 232, 240, 0.8)',
            }}
          >
            {/* Enhanced gradient top border */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-success-500 via-success-600 to-success-700 shadow-lg shadow-success-500/50 animate-gradient"></div>
            {/* Glow effect on hover */}
            <div className="absolute -inset-1 bg-success-500/0 group-hover:bg-success-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 material-transition -z-10"></div>
            <CardBody padding="lg">
              <div className="flex items-start justify-between relative z-10">
                <div className="flex-1 min-w-0">
                  <p 
                    className="text-xs font-semibold uppercase tracking-wide mb-2 animate-fade-in"
                    style={{ color: isDark ? 'rgb(148, 163, 184)' : 'rgb(100, 116, 139)' }}
                  >
                    الأصول
                  </p>
                  <p 
                    className="text-4xl font-bold mb-1 animate-scale-in"
                    style={{
                      background: isDark
                        ? 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)'
                        : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    {stats.assets}
                  </p>
                  <p 
                    className="text-sm font-medium animate-fade-in"
                    style={{ color: isDark ? 'rgb(203, 213, 225)' : 'rgb(71, 85, 105)' }}
                  >
                    أصل مسجل
                  </p>
                </div>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-success-100 to-success-200 flex items-center justify-center shadow-md shadow-success-500/20 group-hover:bg-gradient-to-br group-hover:from-success-200 group-hover:to-success-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-success-500/30 material-transition group-hover:rotate-3 animate-float" style={{ animationDelay: '0.2s' }}>
                  <MaterialIcon name="inventory" className="text-success-600 group-hover:text-success-700 material-transition" size="lg" />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Users Card */}
          <Card 
            hover 
            variant="elevated" 
            className="relative overflow-hidden group animate-fade-in-up shadow-md hover:shadow-xl hover:shadow-warning/20 backdrop-blur-sm hover-lift-smooth" 
            style={{ 
              animationDelay: '0.3s',
              backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              borderColor: isDark ? 'rgba(71, 85, 105, 0.6)' : 'rgba(226, 232, 240, 0.8)',
            }}
          >
            {/* Enhanced gradient top border */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-warning-500 via-warning-600 to-warning-700 shadow-lg shadow-warning-500/50 animate-gradient"></div>
            {/* Glow effect on hover */}
            <div className="absolute -inset-1 bg-warning-500/0 group-hover:bg-warning-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 material-transition -z-10"></div>
            <CardBody padding="lg">
              <div className="flex items-start justify-between relative z-10">
                <div className="flex-1 min-w-0">
                  <p 
                    className="text-xs font-semibold uppercase tracking-wide mb-2 animate-fade-in"
                    style={{ color: isDark ? 'rgb(148, 163, 184)' : 'rgb(100, 116, 139)' }}
                  >
                    المستخدمون
                  </p>
                  <p 
                    className="text-4xl font-bold mb-1 animate-scale-in" 
                    style={{ 
                      background: isDark
                        ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
                        : 'linear-gradient(135deg, #ff9800 0%, #fb8c00 100%)', 
                      WebkitBackgroundClip: 'text', 
                      backgroundClip: 'text', 
                      WebkitTextFillColor: 'transparent', 
                      color: 'transparent' 
                    }}
                  >
                    {stats.users}
                  </p>
                  <p 
                    className="text-sm font-medium animate-fade-in"
                    style={{ color: isDark ? 'rgb(203, 213, 225)' : 'rgb(71, 85, 105)' }}
                  >
                    مستخدم نشط
                  </p>
                </div>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-warning-100 to-warning-200 flex items-center justify-center shadow-md shadow-warning-500/20 group-hover:bg-gradient-to-br group-hover:from-warning-200 group-hover:to-warning-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-warning-500/30 material-transition group-hover:rotate-3 animate-float" style={{ animationDelay: '0.3s' }}>
                  <MaterialIcon name="people" className="text-warning-600 group-hover:text-warning-700 material-transition" size="lg" />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
    </MainLayout>
  );
}

export default function HomePage() {
  return (
    <ProtectedRoute>
      <HomePageContent />
    </ProtectedRoute>
  );
}

