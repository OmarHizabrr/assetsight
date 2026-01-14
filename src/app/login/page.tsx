'use client';

import loginIllustration from "@/assets/images/illustrations/auth/v2-login-light.png";
import logoText from "@/assets/images/logos/logo-text.png";
import authMaskLight from "@/assets/images/pages/auth-mask-light.png";
import { MaterialIcon } from "@/components/icons/MaterialIcon";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { useDarkMode } from "@/hooks/useDarkMode";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const { login, loading } = useAuth();
  const router = useRouter();
  const { isDark } = useDarkMode();
  const [credentials, setCredentials] = useState({ employee_number: '', password: '' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ employee_number?: string; password?: string }>({});

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    setError('');
    setFieldErrors({});

    // التحقق الصارم من الحقول قبل الإرسال
    const employeeNumber = credentials.employee_number?.trim() || '';
    const password = credentials.password?.trim() || '';

    if (!employeeNumber || employeeNumber.length === 0) {
      setFieldErrors({ employee_number: 'يرجى إدخال رقم الموظف' });
      return;
    }

    if (!password || password.length === 0) {
      setFieldErrors({ password: 'يرجى إدخال كلمة المرور' });
      return;
    }

    try {
      await login({ employee_number: employeeNumber, password: password });
      router.push('/');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ أثناء تسجيل الدخول';
      setError(errorMessage);

      // تحديد نوع الخطأ وإظهاره في الحقل المناسب
      if (errorMessage.includes('رقم الموظف')) {
        setFieldErrors({ employee_number: errorMessage });
      } else if (errorMessage.includes('كلمة المرور')) {
        setFieldErrors({ password: errorMessage });
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleSubmit();
    }
  };

  const handleInputChange = (field: 'employee_number' | 'password', value: string) => {
    setCredentials({ ...credentials, [field]: value });
    // مسح خطأ الحقل عند البدء بالكتابة
    if (fieldErrors[field]) {
      setFieldErrors({ ...fieldErrors, [field]: undefined });
    }
    if (error) {
      setError('');
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-10 sm:py-12"
    >
      <div className="absolute top-4 left-4 z-20">
        <ThemeToggle variant="icon" size="md" />
      </div>

      {/* Background Mask Image */}
      <div className="absolute inset-0 z-0 opacity-30">
        <Image
          src={authMaskLight}
          alt="Background"
          fill
          className="object-cover"
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
              />
            </div>
            <div className="text-center space-y-3">
              <h2
                className="text-3xl font-bold"
                style={{ color: isDark ? 'rgb(248, 250, 252)' : 'rgb(15, 23, 42)' }}
              >
                مرحباً بك في AssetSight
              </h2>
              <p
                className="text-lg"
                style={{ color: isDark ? 'rgb(203, 213, 225)' : 'rgb(71, 85, 105)' }}
              >
                نظام شامل لإدارة وتتبع الأصول والممتلكات
              </p>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full">
            <Card
              variant="elevated"
              className="w-full max-w-md mx-auto shadow-2xl shadow-primary/20 backdrop-blur-md hover:shadow-primary-lg material-transition hover-lift-smooth glass-morphism"
            >
              <CardBody padding="lg">
                {/* Logo */}
                <div className="flex flex-col items-center mb-8 space-y-4 animate-fade-in-down">
                  <div className="relative w-20 h-20 animate-float">
                    <div className="absolute -inset-2 bg-primary-500/20 rounded-full blur-xl opacity-50 animate-pulse-soft"></div>
                    <Image
                      src={logoText}
                      alt="AssetSight Logo"
                      fill
                      className="object-contain relative z-10"
                      priority
                    />
                  </div>
                  <div className="text-center space-y-2 animate-fade-in-down" style={{ animationDelay: '0.1s' }}>
                    <h1
                      className="text-3xl font-black text-slate-900 dark:text-slate-50"
                    >
                      AssetSight
                    </h1>
                    <p
                      className="text-sm font-medium"
                      style={{ color: isDark ? 'rgb(203, 213, 225)' : 'rgb(71, 85, 105)' }}
                    >
                      تسجيل الدخول إلى النظام
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && !fieldErrors.employee_number && !fieldErrors.password && (
                    <div className="bg-gradient-to-r from-error-50 to-error-100/80 border-r-4 border-error-500 text-error-700 px-4 py-3 rounded-xl animate-fade-in-down shadow-md shadow-error/20 flex items-center gap-2 backdrop-blur-sm hover-glow-error">
                      <MaterialIcon name="warning" className="text-error-600 animate-pulse-soft" size="md" />
                      <span className="flex-1 font-semibold text-sm">{error}</span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <Input
                      label="رقم الموظف"
                      type="text"
                      required
                      inputMode="numeric"
                      autoComplete="username"
                      value={credentials.employee_number}
                      onChange={(e) => handleInputChange('employee_number', e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="أدخل رقم الموظف"
                      error={fieldErrors.employee_number}
                      helperText={!fieldErrors.employee_number ? 'مثال: 10234' : undefined}
                      rightIcon={<MaterialIcon name={fieldErrors.employee_number ? 'error' : 'person'} className={fieldErrors.employee_number ? 'text-error-500' : 'text-slate-400'} size="sm" />}
                    />
                  </div>

                  <div className="space-y-1">
                    <Input
                      label="كلمة المرور"
                      type="password"
                      required
                      autoComplete="current-password"
                      value={credentials.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="أدخل كلمة المرور"
                      error={fieldErrors.password}
                      rightIcon={<MaterialIcon name={fieldErrors.password ? 'error' : 'lock'} className={fieldErrors.password ? 'text-error-500' : 'text-slate-400'} size="sm" />}
                      showPasswordToggle
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    isLoading={loading}
                    className="mt-6 hover-lift-smooth"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <MaterialIcon name="progress_activity" className="text-white/90 animate-spin" size="md" />
                        <span>جاري تسجيل الدخول...</span>
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <MaterialIcon name="login" className="text-white material-transition group-hover:translate-x-1" size="md" />
                        <span>تسجيل الدخول</span>
                      </span>
                    )}
                  </Button>
                </form>

                {/* Footer */}
                <div
                  className="mt-8 pt-6 border-t text-center"
                  style={{
                    borderTopColor: isDark ? 'rgba(71, 85, 105, 0.6)' : 'rgb(226, 232, 240)',
                  }}
                >
                  <p
                    className="text-xs"
                    style={{ color: isDark ? 'rgb(148, 163, 184)' : 'rgb(100, 116, 139)' }}
                  >
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

