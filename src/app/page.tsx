'use client';

import loginIllustration from "@/assets/images/illustrations/auth/v2-login-light.png";
import logoText from "@/assets/images/logos/logo-text.png";
import authMaskLight from "@/assets/images/pages/auth-mask-light.png";
import { MaterialIcon } from "@/components/icons/MaterialIcon";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { useAuth } from "@/contexts/AuthContext";
import { BaseModel } from "@/lib/BaseModel";
import { firestoreApi } from "@/lib/FirestoreApi";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    departments: 0,
    offices: 0,
    assets: 0,
    users: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    
    // إذا لم يكن المستخدم مسجل دخول، لا نحتاج لتحميل الإحصائيات
    if (!user) {
      setLoading(false);
      return;
    }

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
  }, [authLoading, user]);

  // إذا كان المستخدم غير مسجل دخول، اعرض الصفحة الترحيبية
  if (!user && !authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#f8f7fa] px-4 py-12">
        {/* Background Mask Image */}
        <div className="absolute inset-0 z-0 opacity-20">
          <Image
            src={authMaskLight}
            alt="Background"
            fill
            className="object-cover"
            priority
            quality={90}
          />
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary-500/10 to-accent-500/10 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-success-500/10 to-warning-500/10 rounded-full blur-3xl -z-10"></div>

        <div className="relative z-10 w-full max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Illustration */}
            <div className="hidden lg:flex flex-col items-center justify-center space-y-6 p-8">
              <div className="relative w-full max-w-md">
                <Image
                  src={loginIllustration}
                  alt="Welcome Illustration"
                  width={500}
                  height={500}
                  className="object-contain animate-fade-in"
                  priority
                  quality={90}
                />
              </div>
            </div>

            {/* Right Side - Welcome Content */}
            <div className="w-full">
              <div className="w-full max-w-lg mx-auto">
                {/* Logo */}
                <div className="flex flex-col items-center mb-10 space-y-4">
                  <div className="relative w-24 h-24">
                    <Image
                      src={logoText}
                      alt="AssetSight Logo"
                      fill
                      className="object-contain"
                      priority
                      quality={90}
                    />
                  </div>
                  <div className="text-center space-y-2">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                      AssetSight
                    </h1>
                    <p className="text-slate-600 text-base font-medium">نظام إدارة الأصول والممتلكات</p>
                  </div>
                </div>

                {/* Welcome Card */}
                <Card variant="elevated" className="w-full shadow-2xl shadow-primary/20 border border-slate-200/80 bg-white/95 backdrop-blur-sm">
                  <CardBody className="p-8 space-y-6">
                    <div className="text-center space-y-4">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 flex items-center justify-center shadow-xl shadow-primary-500/40 mx-auto">
                        <MaterialIcon name="person" className="text-white" size="3xl" />
                      </div>
                      <h2 className="text-3xl font-bold text-slate-900">مرحباً بك!</h2>
                      <p className="text-slate-600 text-lg leading-relaxed">
                        للوصول إلى النظام والاستفادة من جميع الميزات، يرجى تسجيل الدخول باستخدام بياناتك المسجلة
                      </p>
                    </div>

                    <div className="pt-4">
                      <Button
                        onClick={() => router.push('/login')}
                        variant="primary"
                        size="lg"
                        fullWidth
                        leftIcon={<MaterialIcon name="login" className="text-white" size="md" />}
                        className="shadow-xl shadow-primary-500/40"
                      >
                        تسجيل الدخول
                      </Button>
                    </div>

                    {/* Features */}
                    <div className="pt-6 border-t border-slate-200 space-y-4">
                      <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide text-center">
                        ميزات النظام
                      </p>
                      <div className="grid grid-cols-1 gap-3">
                        <div className="flex items-center gap-3 p-4 bg-primary-50 rounded-xl border border-primary-100 hover:bg-primary-100 material-transition">
                          <div className="w-10 h-10 rounded-lg bg-primary-500 flex items-center justify-center">
                            <MaterialIcon name="inventory" className="text-white" size="md" />
                          </div>
                          <span className="text-sm font-semibold text-slate-700">إدارة الأصول</span>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-accent-50 rounded-xl border border-accent-100 hover:bg-accent-100 material-transition">
                          <div className="w-10 h-10 rounded-lg bg-accent-500 flex items-center justify-center">
                            <MaterialIcon name="assessment" className="text-white" size="md" />
                          </div>
                          <span className="text-sm font-semibold text-slate-700">التقارير والإحصائيات</span>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-success-50 rounded-xl border border-success-100 hover:bg-success-100 material-transition">
                          <div className="w-10 h-10 rounded-lg bg-success-500 flex items-center justify-center">
                            <MaterialIcon name="track_changes" className="text-white" size="md" />
                          </div>
                          <span className="text-sm font-semibold text-slate-700">تتبع الجرد</span>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                {/* Footer */}
                <div className="mt-8 text-center">
                  <p className="text-xs text-slate-500">
                    © {new Date().getFullYear()} AssetSight. جميع الحقوق محفوظة.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              <h1 className="text-4xl font-bold text-slate-900 mb-2 animate-fade-in-right text-gradient-primary">لوحة التحكم</h1>
              <p className="text-slate-600 text-base font-medium animate-fade-in-right" style={{ animationDelay: '0.1s' }}>نظرة شاملة على النظام وإحصائياته</p>
            </div>
          </div>
        </div>
        
        {/* Enhanced Decorative Background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-500/10 to-accent-500/10 rounded-full blur-3xl -z-10 animate-pulse-soft"></div>
        <div className="absolute top-10 left-10 w-48 h-48 bg-gradient-to-br from-success-500/5 to-warning-500/5 rounded-full blur-3xl -z-10 animate-pulse-soft" style={{ animationDelay: '0.5s' }}></div>
      </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Departments Card */}
          <Card hover variant="elevated" className="bg-white/95 border border-slate-200/80 relative overflow-hidden group animate-fade-in-up shadow-md hover:shadow-xl hover:shadow-primary/20 backdrop-blur-sm hover-lift-smooth">
            {/* Enhanced gradient top border */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 shadow-lg shadow-primary-500/50 animate-gradient"></div>
            {/* Glow effect on hover */}
            <div className="absolute -inset-1 bg-primary-500/0 group-hover:bg-primary-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 material-transition -z-10"></div>
            <CardBody padding="lg">
              <div className="flex items-start justify-between relative z-10">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 animate-fade-in">الإدارات</p>
                  <p className="text-4xl font-bold text-slate-900 mb-1 animate-scale-in text-gradient-primary">{stats.departments}</p>
                  <p className="text-sm text-slate-600 font-medium animate-fade-in">إدارة نشطة</p>
                </div>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center shadow-md shadow-primary-500/20 group-hover:bg-gradient-to-br group-hover:from-primary-200 group-hover:to-primary-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary-500/30 material-transition group-hover:rotate-3 animate-float">
                  <MaterialIcon name="business" className="text-primary-600 group-hover:text-primary-700 material-transition" size="lg" />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Offices Card */}
          <Card hover variant="elevated" className="bg-white/95 border border-slate-200/80 relative overflow-hidden group animate-fade-in-up shadow-md hover:shadow-xl hover:shadow-accent/20 backdrop-blur-sm hover-lift-smooth" style={{ animationDelay: '0.1s' }}>
            {/* Enhanced gradient top border */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-accent-500 via-accent-600 to-accent-700 shadow-lg shadow-accent-500/50 animate-gradient"></div>
            {/* Glow effect on hover */}
            <div className="absolute -inset-1 bg-accent-500/0 group-hover:bg-accent-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 material-transition -z-10"></div>
            <CardBody padding="lg">
              <div className="flex items-start justify-between relative z-10">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 animate-fade-in">المكاتب</p>
                  <p className="text-4xl font-bold text-slate-900 mb-1 animate-scale-in" style={{ background: 'linear-gradient(135deg, #d946ef 0%, #c026d3 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent' }}>{stats.offices}</p>
                  <p className="text-sm text-slate-600 font-medium animate-fade-in">مكتب متاح</p>
                </div>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent-100 to-accent-200 flex items-center justify-center shadow-md shadow-accent-500/20 group-hover:bg-gradient-to-br group-hover:from-accent-200 group-hover:to-accent-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-accent-500/30 material-transition group-hover:rotate-3 animate-float" style={{ animationDelay: '0.1s' }}>
                  <MaterialIcon name="meeting_room" className="text-accent-600 group-hover:text-accent-700 material-transition" size="lg" />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Assets Card */}
          <Card hover variant="elevated" className="bg-white/95 border border-slate-200/80 relative overflow-hidden group animate-fade-in-up shadow-md hover:shadow-xl hover:shadow-success/20 backdrop-blur-sm hover-lift-smooth" style={{ animationDelay: '0.2s' }}>
            {/* Enhanced gradient top border */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-success-500 via-success-600 to-success-700 shadow-lg shadow-success-500/50 animate-gradient"></div>
            {/* Glow effect on hover */}
            <div className="absolute -inset-1 bg-success-500/0 group-hover:bg-success-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 material-transition -z-10"></div>
            <CardBody padding="lg">
              <div className="flex items-start justify-between relative z-10">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 animate-fade-in">الأصول</p>
                  <p className="text-4xl font-bold text-slate-900 mb-1 animate-scale-in text-gradient-success">{stats.assets}</p>
                  <p className="text-sm text-slate-600 font-medium animate-fade-in">أصل مسجل</p>
                </div>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-success-100 to-success-200 flex items-center justify-center shadow-md shadow-success-500/20 group-hover:bg-gradient-to-br group-hover:from-success-200 group-hover:to-success-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-success-500/30 material-transition group-hover:rotate-3 animate-float" style={{ animationDelay: '0.2s' }}>
                  <MaterialIcon name="inventory" className="text-success-600 group-hover:text-success-700 material-transition" size="lg" />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Users Card */}
          <Card hover variant="elevated" className="bg-white/95 border border-slate-200/80 relative overflow-hidden group animate-fade-in-up shadow-md hover:shadow-xl hover:shadow-warning/20 backdrop-blur-sm hover-lift-smooth" style={{ animationDelay: '0.3s' }}>
            {/* Enhanced gradient top border */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-warning-500 via-warning-600 to-warning-700 shadow-lg shadow-warning-500/50 animate-gradient"></div>
            {/* Glow effect on hover */}
            <div className="absolute -inset-1 bg-warning-500/0 group-hover:bg-warning-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 material-transition -z-10"></div>
            <CardBody padding="lg">
              <div className="flex items-start justify-between relative z-10">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 animate-fade-in">المستخدمون</p>
                  <p className="text-4xl font-bold text-slate-900 mb-1 animate-scale-in" style={{ background: 'linear-gradient(135deg, #ff9800 0%, #fb8c00 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent' }}>{stats.users}</p>
                  <p className="text-sm text-slate-600 font-medium animate-fade-in">مستخدم نشط</p>
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

