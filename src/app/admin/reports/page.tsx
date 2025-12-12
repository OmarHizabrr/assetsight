'use client';

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MaterialIcon } from "@/components/icons/MaterialIcon";
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
      <div className="mb-10">
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 flex items-center justify-center shadow-2xl shadow-primary-500/40 relative overflow-hidden group hover:scale-105 material-transition">
              <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-transparent opacity-0 group-hover:opacity-100 material-transition"></div>
              <MaterialIcon name="assessment" className="text-white relative z-10" size="3xl" />
            </div>
            <div className="flex-1">
              <h1 className="text-5xl font-black bg-gradient-to-r from-slate-900 via-primary-700 to-slate-900 bg-clip-text text-transparent mb-2">التقارير والإحصائيات</h1>
              <p className="text-slate-600 text-lg font-semibold">نظرة شاملة على بيانات الأصول</p>
            </div>
          </div>
        </div>
      </div>

        {/* إحصائيات عامة */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card hover variant="elevated" className="bg-gradient-to-br from-white via-white to-primary-50/30 border-primary-200/40">
            <CardBody padding="lg">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">إجمالي الأصول</p>
                  <p className="text-4xl font-black bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-1">{stats.totalAssets}</p>
                  <p className="text-xs text-slate-500 font-medium">أصل مسجل</p>
                </div>
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30">
                  <MaterialIcon name="inventory" className="text-white" size="3xl" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card hover variant="elevated" className="bg-gradient-to-br from-white via-white to-success-50/30 border-success-200/40">
            <CardBody padding="lg">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">القيمة الإجمالية</p>
                  <p className="text-4xl font-black bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-1">
                    {stats.totalValue.toLocaleString('ar-SA')}
                  </p>
                  <p className="text-xs text-slate-500 font-medium">ريال سعودي</p>
                </div>
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-success-500 to-success-700 flex items-center justify-center shadow-lg shadow-success-500/30">
                  <MaterialIcon name="attach_money" className="text-white" size="3xl" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card hover variant="elevated" className="bg-gradient-to-br from-white via-white to-accent-50/30 border-accent-200/40">
            <CardBody padding="lg">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">أصول نشطة</p>
                  <p className="text-4xl font-black bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-1">{stats.activeAssets}</p>
                  <p className="text-xs text-slate-500 font-medium">أصل نشط</p>
                </div>
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center shadow-lg shadow-accent-500/30">
                  <MaterialIcon name="check_circle" className="text-white" size="3xl" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card hover variant="elevated" className="bg-gradient-to-br from-white via-white to-warning-50/30 border-warning-200/40">
            <CardBody padding="lg">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">الإدارات</p>
                  <p className="text-4xl font-black bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-1">{stats.departments}</p>
                  <p className="text-xs text-slate-500 font-medium">إدارة نشطة</p>
                </div>
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-warning-500 to-warning-700 flex items-center justify-center shadow-lg shadow-warning-500/30">
                  <MaterialIcon name="business" className="text-white" size="3xl" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card hover variant="elevated" className="bg-gradient-to-br from-white via-white to-primary-50/30 border-primary-200/40">
            <CardBody padding="lg">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">المكاتب</p>
                  <p className="text-4xl font-black bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-1">{stats.offices}</p>
                  <p className="text-xs text-slate-500 font-medium">مكتب متاح</p>
                </div>
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30">
                  <MaterialIcon name="meeting_room" className="text-white" size="3xl" />
                </div>
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
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors duration-200 animate-fade-in border border-slate-200/50"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <span className="font-semibold text-slate-700 text-sm">{item.status}</span>
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
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors duration-200 animate-fade-in border border-slate-200/50"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <span className="font-semibold text-slate-700 text-sm">{item.department}</span>
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
