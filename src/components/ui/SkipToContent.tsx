'use client';

/**
 * مكون "تخطي إلى المحتوى" - مهم جداً للـ accessibility
 * يسمح لمستخدمي لوحة المفاتيح وقارئات الشاشة بتخطي التنقل والذهاب مباشرة للمحتوى
 */

export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] px-6 py-3 bg-primary-600 text-white font-bold rounded-xl shadow-2xl focus:outline-none focus:ring-4 focus:ring-primary-500/50 material-transition"
      aria-label="تخطي إلى المحتوى الرئيسي"
    >
      تخطي إلى المحتوى
    </a>
  );
}

