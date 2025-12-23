'use client';

import { useEffect, useState } from 'react';
import { MaterialIcon } from '@/components/icons/MaterialIcon';

interface LoadingScreenProps {
  message?: string;
  subMessage?: string;
  showProgress?: boolean;
  progress?: number;
}

const loadingMessages = [
  'جاري تحميل البيانات...',
  'جاري معالجة المعلومات...',
  'جاري إعداد التقارير...',
  'جاري تحميل الإحصائيات...',
  'جاري جلب البيانات...',
  'جاري تحديث المعلومات...',
];

const tips = [
  '💡 نصيحة: يمكنك استخدام الفلاتر المتقدمة للبحث السريع',
  '💡 نصيحة: استخدم البحث العام للعثور على أي معلومات',
  '💡 نصيحة: يمكنك تصدير البيانات إلى Excel أو PDF',
  '💡 نصيحة: استخدم الفلاتر المتعددة للحصول على نتائج دقيقة',
];

export function LoadingScreen({ 
  message, 
  subMessage,
  showProgress = false,
  progress = 0 
}: LoadingScreenProps) {
  const [currentMessage, setCurrentMessage] = useState(message || loadingMessages[0]);
  const [currentTip, setCurrentTip] = useState(tips[0]);
  const [messageIndex, setMessageIndex] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    if (message) return;

    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => {
        const next = (prev + 1) % loadingMessages.length;
        setCurrentMessage(loadingMessages[next]);
        return next;
      });
    }, 3000);

    return () => clearInterval(messageInterval);
  }, [message]);

  useEffect(() => {
    const tipInterval = setInterval(() => {
      setTipIndex((prev) => {
        const next = (prev + 1) % tips.length;
        setCurrentTip(tips[next]);
        return next;
      });
    }, 5000);

    return () => clearInterval(tipInterval);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-[60vh] animate-fade-in">
      <div className="flex flex-col items-center gap-8 max-w-md w-full px-4">
        {/* Animated Spinner */}
        <div className="relative">
          {/* Outer ring */}
          <div className="w-20 h-20 rounded-full border-4 border-primary-100 animate-spin">
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary-600"></div>
          </div>
          {/* Inner ring */}
          <div className="absolute inset-2 rounded-full border-4 border-transparent border-r-primary-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <MaterialIcon name="assessment" className="text-primary-500" size="lg" />
          </div>
        </div>

        {/* Messages */}
        <div className="text-center space-y-3 w-full">
          <p className="text-slate-800 font-bold text-xl animate-fade-in">
            {currentMessage}
          </p>
          {subMessage && (
            <p className="text-slate-500 text-sm">{subMessage}</p>
          )}
        </div>

        {/* Progress Bar */}
        {showProgress && (
          <div className="w-full space-y-2">
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 text-center">{Math.round(progress)}%</p>
          </div>
        )}

        {/* Loading Dots */}
        <div className="flex gap-2">
          <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} suppressHydrationWarning></div>
          <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} suppressHydrationWarning></div>
        </div>

        {/* Tips */}
        <div className="mt-4 p-4 bg-primary-50 rounded-lg border border-primary-200 w-full">
          <p className="text-sm text-primary-700 text-center animate-fade-in">
            {currentTip}
          </p>
        </div>

        {/* Connection Status */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
          <span>متصل</span>
        </div>
      </div>
    </div>
  );
}

// Loading Screen Component for general use
export function LoadingScreenSimple({ message = 'جاري التحميل...' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-primary-100 border-t-primary-600 animate-spin"></div>
        </div>
        <p className="text-slate-700 font-medium">{message}</p>
      </div>
    </div>
  );
}

