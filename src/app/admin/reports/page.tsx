'use client';

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MainLayout } from "@/components/layout/MainLayout";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { BaseModel } from "@/lib/BaseModel";
import { firestoreApi } from "@/lib/FirestoreApi";
import { useEffect, useState } from "react";

function ReportsPageContent() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAssets: 0,
    totalValue: 0,
    activeAssets: 0,
    departments: 0,
    offices: 0,
  });
  const [assetsByStatus, setAssetsByStatus] = useState<{ status: string; count: number }[]>([]);
  const [assetsByDepartment, setAssetsByDepartment] = useState<{ department: string; count: number }[]>([]);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      // جلب البيانات الأساسية
      const [assetDocs, deptDocs, statusDocs] = await Promise.all([
        firestoreApi.getDocuments(firestoreApi.getCollection("assets")),
        firestoreApi.getDocuments(firestoreApi.getCollection("departments")),
        firestoreApi.getDocuments(firestoreApi.getCollection("assetStatuses")),
      ]);

      const assets = BaseModel.fromFirestoreArray(assetDocs);
      const departments = BaseModel.fromFirestoreArray(deptDocs);
      const statuses = BaseModel.fromFirestoreArray(statusDocs);

      // جلب جميع المكاتب من جميع الإدارات
      const allOffices: BaseModel[] = [];
      for (const dept of departments) {
        const deptId = dept.get('id');
        if (deptId) {
          const subCollectionRef = firestoreApi.getSubCollection("departments", deptId, "offices");
          const officeDocs = await firestoreApi.getDocuments(subCollectionRef);
          const offices = BaseModel.fromFirestoreArray(officeDocs);
          offices.forEach(office => {
            office.put('department_id', deptId);
            allOffices.push(office);
          });
        }
      }

      // حساب الإحصائيات الأساسية
      const totalAssets = assets.length;
      const totalValue = assets.reduce((sum, asset) => {
        const currentValue = asset.getValue<number>('current_value') || 0;
        const purchaseValue = asset.getValue<number>('purchase_value') || 0;
        return sum + (currentValue || purchaseValue);
      }, 0);
      const activeAssets = assets.filter(a => {
        const isActive = a.getValue<number>('is_active') === 1 || a.getValue<boolean>('is_active') === true;
        return isActive;
      }).length;

      // الأصول حسب الحالة
      const statusCounts: { [key: string]: number } = {};
      assets.forEach(asset => {
        const statusId = asset.get('status_id');
        if (statusId) {
          statusCounts[statusId] = (statusCounts[statusId] || 0) + 1;
        }
      });
      const assetsByStatusData = statuses
        .map(status => ({
          status: status.get('name') || 'غير محدد',
          count: statusCounts[status.get('id') || ''] || 0,
        }))
        .filter(item => item.count > 0)
        .sort((a, b) => b.count - a.count);

      // الأصول حسب الإدارة (من خلال المكاتب)
      const officeToDept: { [key: string]: string } = {};
      allOffices.forEach(office => {
        const deptId = office.get('department_id');
        const officeId = office.get('id');
        if (deptId && officeId) {
          officeToDept[officeId] = deptId;
        }
      });

      const deptCounts: { [key: string]: number } = {};
      assets.forEach(asset => {
        const officeId = asset.get('location_office_id');
        if (officeId && officeToDept[officeId]) {
          const deptId = officeToDept[officeId];
          deptCounts[deptId] = (deptCounts[deptId] || 0) + 1;
        }
      });
      const assetsByDepartmentData = departments
        .map(dept => ({
          department: dept.get('name') || 'غير محدد',
          count: deptCounts[dept.get('id') || ''] || 0,
        }))
        .filter(item => item.count > 0)
        .sort((a, b) => b.count - a.count);

      setStats({
        totalAssets,
        totalValue,
        activeAssets,
        departments: departments.length,
        offices: allOffices.length,
      });
      setAssetsByStatus(assetsByStatusData);
      setAssetsByDepartment(assetsByDepartmentData);
    } catch (error) {
      console.error("Error loading reports:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64 animate-fade-in">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"></div>
            <p className="text-secondary-600 text-sm">جاري تحميل التقارير...</p>
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
              <span className="text-2xl">📈</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">التقارير والإحصائيات</h1>
              <p className="text-slate-600 text-base mt-1 font-medium">نظرة شاملة على بيانات الأصول</p>
            </div>
          </div>
        </div>
      </div>

        {/* إحصائيات عامة */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card hover variant="elevated">
            <CardBody padding="md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary-600 mb-1">إجمالي الأصول</p>
                  <p className="text-3xl font-bold text-secondary-900">{stats.totalAssets}</p>
                </div>
                <div className="text-4xl">💼</div>
              </div>
            </CardBody>
          </Card>

          <Card hover variant="elevated">
            <CardBody padding="md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary-600 mb-1">القيمة الإجمالية</p>
                  <p className="text-3xl font-bold text-secondary-900">
                    {stats.totalValue.toLocaleString('ar-SA')}
                  </p>
                </div>
                <div className="text-4xl">💰</div>
              </div>
            </CardBody>
          </Card>

          <Card hover variant="elevated">
            <CardBody padding="md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary-600 mb-1">أصول نشطة</p>
                  <p className="text-3xl font-bold text-secondary-900">{stats.activeAssets}</p>
                </div>
                <div className="text-4xl">✅</div>
              </div>
            </CardBody>
          </Card>

          <Card hover variant="elevated">
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

          <Card hover variant="elevated">
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* الأصول حسب الحالة */}
          <Card>
            <CardHeader title="الأصول حسب الحالة" />
            <CardBody>
              {assetsByStatus.length === 0 ? (
                <p className="text-secondary-500 text-center py-8">لا توجد بيانات</p>
              ) : (
                <div className="space-y-3">
                  {assetsByStatus.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg hover:bg-secondary-100 transition-colors duration-200 animate-fade-in"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <span className="font-medium text-secondary-700">{item.status}</span>
                      <Badge variant="primary" size="lg">
                        {item.count}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* الأصول حسب الإدارة */}
          <Card>
            <CardHeader title="الأصول حسب الإدارة" />
            <CardBody>
              {assetsByDepartment.length === 0 ? (
                <p className="text-secondary-500 text-center py-8">لا توجد بيانات</p>
              ) : (
                <div className="space-y-3">
                  {assetsByDepartment.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg hover:bg-secondary-100 transition-colors duration-200 animate-fade-in"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <span className="font-medium text-secondary-700">{item.department}</span>
                      <Badge variant="success" size="lg">
                        {item.count}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}

export default function ReportsPage() {
  return (
    <ProtectedRoute>
      <ReportsPageContent />
    </ProtectedRoute>
  );
}
