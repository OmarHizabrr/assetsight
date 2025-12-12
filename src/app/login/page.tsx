'use client';

import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const { login, loading } = useAuth();
  const router = useRouter();
  const [credentials, setCredentials] = useState({ username: '', password: '' });
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
    <div className="min-h-screen flex items-center justify-center bg-[#f8f7fa] px-4 py-12">
      <Card variant="elevated" className="w-full max-w-md animate-scale-in shadow-lg border border-slate-200/80">
        <CardHeader
          title="AssetSight"
          subtitle="تسجيل الدخول إلى النظام"
          className="text-center"
        />
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-error-50 border-r-4 border-error-500 text-error-700 px-4 py-3 rounded-xl animate-fade-in shadow-sm">
                {error}
              </div>
            )}
            
            <Input
              label="اسم المستخدم"
              type="text"
              required
              value={credentials.username}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              placeholder="أدخل اسم المستخدم"
              error={error && !credentials.username ? 'اسم المستخدم مطلوب' : undefined}
            />
            
            <Input
              label="كلمة المرور"
              type="password"
              required
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              placeholder="أدخل كلمة المرور"
              error={error && !credentials.password ? 'كلمة المرور مطلوبة' : undefined}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={loading}
            >
              {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

