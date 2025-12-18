'use client';

import loginIllustration from "@/assets/images/illustrations/auth/v2-login-light.png";
import logoText from "@/assets/images/logos/logo-text.png";
import authMaskLight from "@/assets/images/pages/auth-mask-light.png";
import { MaterialIcon } from "@/components/icons/MaterialIcon";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
      className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-12"
      style={{
        background: isDark
          ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'
          : '#f8f7fa',
      }}
    >
      {/* Background Mask Image */}
      <div className="absolute inset-0 z-0 opacity-30">
        <Image
          src={authMaskLight}
          alt="Background"
          fill
          className="object-cover"
          priority
          unoptimized
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
                unoptimized
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
              style={{
                backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.98)',
                borderColor: isDark ? 'rgba(71, 85, 105, 0.6)' : 'rgba(226, 232, 240, 0.8)',
              }}
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
                      unoptimized
                    />
                  </div>
                  <div className="text-center space-y-2 animate-fade-in-down" style={{ animationDelay: '0.1s' }}>
                    <h1 
                      className="text-3xl font-bold"
                      style={{
                        color: isDark 
                          ? 'rgba(248, 250, 252, 0.15)' 
                          : 'rgba(15, 23, 42, 0.15)',
                        textShadow: isDark
                          ? '0 0 0 rgba(248, 250, 252, 0.95), 0 2px 12px rgba(0, 0, 0, 0.5), 0 4px 20px rgba(0, 0, 0, 0.3)'
                          : '0 0 0 rgba(15, 23, 42, 0.9), 0 2px 12px rgba(255, 255, 255, 0.7), 0 4px 20px rgba(255, 255, 255, 0.4)',
                      }}
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
                    <label 
                      className="flex items-center gap-2 text-sm font-semibold mb-2"
                      style={{ color: isDark ? 'rgb(226, 232, 240)' : 'rgb(51, 65, 85)' }}
                    >
                      <MaterialIcon name="person" className="text-primary-600" size="sm" />
                      <span>رقم الموظف</span>
                      <span className="text-error-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={credentials.employee_number}
                        onChange={(e) => handleInputChange('employee_number', e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="أدخل رقم الموظف"
                        className={`block w-full rounded-xl border-2 px-4 py-3 pl-10 text-base font-medium material-transition focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-300 backdrop-blur-sm focus:shadow-xl hover:shadow-lg hover:scale-[1.005] focus:scale-[1.01] focus:ring-4 ${
                          fieldErrors.employee_number
                            ? 'border-error-500 focus:border-error-500 focus:ring-error-500/15 focus:shadow-error-500/25'
                            : 'focus:border-primary-500 focus:ring-primary-500/15 focus:shadow-primary-500/25 hover:border-primary-400'
                        }`}
                        style={{
                          backgroundColor: isDark ? 'rgba(71, 85, 105, 0.7)' : 'white',
                          borderColor: fieldErrors.employee_number 
                            ? '#ea5455' 
                            : isDark 
                              ? 'rgba(100, 116, 139, 0.7)' 
                              : 'rgb(203, 213, 225)',
                          color: isDark ? 'rgb(248, 250, 252)' : 'rgb(15, 23, 42)',
                        }}
                        onFocus={(e) => {
                          if (isDark) {
                            e.target.style.backgroundColor = 'rgba(71, 85, 105, 0.85)';
                            e.target.style.borderColor = 'rgba(115, 103, 240, 0.7)';
                          }
                        }}
                        onBlur={(e) => {
                          if (isDark) {
                            e.target.style.backgroundColor = 'rgba(71, 85, 105, 0.7)';
                            e.target.style.borderColor = 'rgba(100, 116, 139, 0.7)';
                          }
                        }}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <MaterialIcon 
                          name={fieldErrors.employee_number ? "error" : "person"} 
                          className={fieldErrors.employee_number ? "text-error-500" : "text-slate-400"} 
                          size="sm" 
                        />
                      </div>
                    </div>
                    {fieldErrors.employee_number && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-error-600 animate-fade-in">
                        <MaterialIcon name="error" className="text-error-500" size="sm" />
                        <span>{fieldErrors.employee_number}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <label 
                      className="flex items-center gap-2 text-sm font-semibold mb-2"
                      style={{ color: isDark ? 'rgb(226, 232, 240)' : 'rgb(51, 65, 85)' }}
                    >
                      <MaterialIcon name="lock" className="text-primary-600" size="sm" />
                      <span>كلمة المرور</span>
                      <span className="text-error-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        value={credentials.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="أدخل كلمة المرور"
                        className={`block w-full rounded-xl border-2 px-4 py-3 pl-10 text-base font-medium material-transition focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-300 backdrop-blur-sm focus:shadow-xl hover:shadow-lg hover:scale-[1.005] focus:scale-[1.01] focus:ring-4 ${
                          fieldErrors.password
                            ? 'border-error-500 focus:border-error-500 focus:ring-error-500/15 focus:shadow-error-500/25'
                            : 'focus:border-primary-500 focus:ring-primary-500/15 focus:shadow-primary-500/25 hover:border-primary-400'
                        }`}
                        style={{
                          backgroundColor: isDark ? 'rgba(71, 85, 105, 0.7)' : 'white',
                          borderColor: fieldErrors.password 
                            ? '#ea5455' 
                            : isDark 
                              ? 'rgba(100, 116, 139, 0.7)' 
                              : 'rgb(203, 213, 225)',
                          color: isDark ? 'rgb(248, 250, 252)' : 'rgb(15, 23, 42)',
                        }}
                        onFocus={(e) => {
                          if (isDark) {
                            e.target.style.backgroundColor = 'rgba(71, 85, 105, 0.85)';
                            e.target.style.borderColor = 'rgba(115, 103, 240, 0.7)';
                          }
                        }}
                        onBlur={(e) => {
                          if (isDark) {
                            e.target.style.backgroundColor = 'rgba(71, 85, 105, 0.7)';
                            e.target.style.borderColor = 'rgba(100, 116, 139, 0.7)';
                          }
                        }}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <MaterialIcon 
                          name={fieldErrors.password ? "error" : "lock"} 
                          className={fieldErrors.password ? "text-error-500" : "text-slate-400"} 
                          size="sm" 
                        />
                      </div>
                    </div>
                    {fieldErrors.password && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-error-600 animate-fade-in">
                        <MaterialIcon name="error" className="text-error-500" size="sm" />
                        <span>{fieldErrors.password}</span>
                      </div>
                    )}
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
                      <span className="flex items-center gap-2">
                        <span className="animate-spin">⏳</span>
                        <span>جاري تسجيل الدخول...</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
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

