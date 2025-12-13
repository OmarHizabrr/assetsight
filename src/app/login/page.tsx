'use client';

import loginIllustration from "@/assets/images/illustrations/auth/v2-login-light.png";
import logoText from "@/assets/images/logos/logo-text.png";
import authMaskLight from "@/assets/images/pages/auth-mask-light.png";
import { MaterialIcon } from "@/components/icons/MaterialIcon";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const { login, loading } = useAuth();
  const router = useRouter();
  const [credentials, setCredentials] = useState({ employee_number: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await login(credentials);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء تسجيل الدخول');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#f8f7fa] px-4 py-12">
      {/* Background Mask Image */}
      <div className="absolute inset-0 z-0 opacity-30">
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

      <div className="relative z-10 w-full max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Illustration */}
          <div className="hidden lg:flex flex-col items-center justify-center space-y-6 p-8">
            <div className="relative w-full max-w-md">
              <Image
                src={loginIllustration}
                alt="Login Illustration"
                width={500}
                height={500}
                className="object-contain animate-fade-in"
                priority
                quality={90}
              />
            </div>
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-bold text-slate-900">مرحباً بك في AssetSight</h2>
              <p className="text-slate-600 text-lg">نظام شامل لإدارة وتتبع الأصول والممتلكات</p>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full">
            <Card variant="elevated" className="w-full max-w-md mx-auto animate-scale-in shadow-2xl shadow-primary/20 border border-slate-200/80 bg-white/98 backdrop-blur-md hover:shadow-primary-lg material-transition">
              <CardBody className="p-8">
                {/* Logo */}
                <div className="flex flex-col items-center mb-8 space-y-4">
                  <div className="relative w-20 h-20">
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
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                      AssetSight
                    </h1>
                    <p className="text-slate-600 text-sm font-medium">تسجيل الدخول إلى النظام</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="bg-gradient-to-r from-error-50 to-error-100/80 border-r-4 border-error-500 text-error-700 px-4 py-3 rounded-xl animate-fade-in shadow-md shadow-error/20 flex items-center gap-2 backdrop-blur-sm">
                      <MaterialIcon name="warning" className="text-error-600 animate-bounce-subtle" size="md" />
                      <span className="flex-1 font-semibold">{error}</span>
                    </div>
                  )}
                  
                  <div className="space-y-1">
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                      <MaterialIcon name="person" className="text-primary-600" size="sm" />
                      <span>رقم الموظف</span>
                    </label>
                    <Input
                      type="text"
                      required
                      value={credentials.employee_number}
                      onChange={(e) => setCredentials({ ...credentials, employee_number: e.target.value })}
                      placeholder="أدخل رقم الموظف"
                      error={error && !credentials.employee_number ? 'رقم الموظف مطلوب' : undefined}
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                      <MaterialIcon name="visibility_off" className="text-primary-600" size="sm" />
                      <span>كلمة المرور</span>
                    </label>
                    <Input
                      type="password"
                      required
                      value={credentials.password}
                      onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                      placeholder="أدخل كلمة المرور"
                      error={error && !credentials.password ? 'كلمة المرور مطلوبة' : undefined}
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    isLoading={loading}
                    className="mt-6"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin">⏳</span>
                        <span>جاري تسجيل الدخول...</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <MaterialIcon name="login" className="text-white" size="md" />
                        <span>تسجيل الدخول</span>
                      </span>
                    )}
                  </Button>
                </form>

                {/* Footer */}
                <div className="mt-8 pt-6 border-t border-slate-200 text-center">
                  <p className="text-xs text-slate-500">
                    © {new Date().getFullYear()} AssetSight. جميع الحقوق محفوظة.
                  </p>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

