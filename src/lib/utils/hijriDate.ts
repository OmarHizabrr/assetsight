/**
 * تحويل التاريخ الميلادي إلى هجري (خوارزمية محسّنة)
 * يعتمد على حساب الفرق بالأيام من بداية التقويم الهجري
 */
export function toHijri(date: Date): { year: number; month: number; day: number; monthName: string } {
  const gregorianYear = date.getFullYear();
  const gregorianMonth = date.getMonth() + 1;
  const gregorianDay = date.getDate();

  // تاريخ بداية التقويم الهجري: 16 يوليو 622 م (1 محرم 1 هـ)
  const hijriEpoch = new Date(622, 6, 16); // يوليو = 6 (0-indexed)
  const currentDate = new Date(gregorianYear, gregorianMonth - 1, gregorianDay);
  
  // حساب الفرق بالأيام
  const diffTime = currentDate.getTime() - hijriEpoch.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // السنة الهجرية = 354.367 يوم في المتوسط
  let hijriYear = Math.floor(diffDays / 354.367) + 1;
  
  // حساب الأيام المتبقية في السنة الحالية
  let remainingDays = diffDays - Math.floor((hijriYear - 1) * 354.367);
  
  // أشهر السنة الهجرية (أيام كل شهر)
  const hijriMonths = [30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 29];
  
  // تحديد السنة الكبيسة (السنة 2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29 في دورة 30 سنة)
  const leapYearCycle = hijriYear % 30;
  const isLeapYear = [2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29].includes(leapYearCycle);
  if (isLeapYear) {
    hijriMonths[11] = 30; // ذو الحجة يصبح 30 يوم في السنة الكبيسة
  }
  
  // حساب الشهر واليوم
  let hijriMonth = 1;
  let hijriDay = remainingDays;
  
  for (let i = 0; i < hijriMonths.length; i++) {
    if (hijriDay <= hijriMonths[i]) {
      hijriMonth = i + 1;
      break;
    }
    hijriDay -= hijriMonths[i];
  }
  
  // التأكد من أن اليوم والشهر صحيحين
  if (hijriDay < 1) hijriDay = 1;
  if (hijriDay > hijriMonths[hijriMonth - 1]) hijriDay = hijriMonths[hijriMonth - 1];
  if (hijriMonth < 1) hijriMonth = 1;
  if (hijriMonth > 12) hijriMonth = 12;

  const monthNames = [
    'محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني', 'جمادى الأولى', 'جمادى الثانية',
    'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
  ];

  return {
    year: hijriYear,
    month: hijriMonth,
    day: Math.floor(hijriDay),
    monthName: monthNames[hijriMonth - 1] || ''
  };
}

/**
 * تنسيق التاريخ الهجري
 */
export function formatHijriDate(date: Date): string {
  const hijri = toHijri(date);
  return `${hijri.day} ${hijri.monthName} ${hijri.year} هـ`;
}

/**
 * تنسيق التاريخ الميلادي
 */
export function formatGregorianDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${day}/${month}/${year}`;
}

/**
 * الحصول على التاريخين معاً
 */
export function getBothDates(date: Date = new Date()): { hijri: string; gregorian: string } {
  return {
    hijri: formatHijriDate(date),
    gregorian: formatGregorianDate(date)
  };
}

