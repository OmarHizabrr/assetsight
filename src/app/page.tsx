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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card variant="flat" className="mb-6">
          <CardHeader title="لوحة التحكم" subtitle="نظرة شاملة على النظام" />
        </Card>

        {!user && (
          <Card variant="outlined" className="mb-6 border-warning-200 bg-warning-50">
            <CardBody padding="md">
              <div className="flex items-center justify-between">
                <p className="text-warning-800 font-medium">يرجى تسجيل الدخول للوصول إلى النظام</p>
                <a href="/login">
                  <Button
                    variant="primary"
                    size="md"
                  >
                    تسجيل الدخول
                  </Button>
                </a>
              </div>
            </CardBody>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card hover>
            <CardBody padding="md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary-600 mb-1">الإدارات</p>
                  <p className="text-3xl font-bold text-secondary-900">{stats.departments}</p>
                </div>
                <div className="text-4xl">🏢</div>
              </div>
            </CardBody>
          </Card>

          <Card hover>
            <CardBody padding="md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary-600 mb-1">المكاتب</p>
                  <p className="text-3xl font-bold text-secondary-900">{stats.offices}</p>
                </div>
                <div className="text-4xl">🚪</div>
              </div>
            </CardBody>
          </Card>

          <Card hover>
            <CardBody padding="md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary-600 mb-1">الأصول</p>
                  <p className="text-3xl font-bold text-secondary-900">{stats.assets}</p>
                </div>
                <div className="text-4xl">💼</div>
              </div>
            </CardBody>
          </Card>

          <Card hover>
            <CardBody padding="md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary-600 mb-1">المستخدمون</p>
                  <p className="text-3xl font-bold text-secondary-900">{stats.users}</p>
                </div>
                <div className="text-4xl">👥</div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}

