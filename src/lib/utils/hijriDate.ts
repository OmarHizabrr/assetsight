/**
 * تحويل التاريخ الميلادي إلى هجري
 */
export function toHijri(date: Date): { year: number; month: number; day: number; monthName: string } {
  const gregorianYear = date.getFullYear();
  const gregorianMonth = date.getMonth() + 1;
  const gregorianDay = date.getDate();

  // حساب التاريخ الهجري
  const hijriYear = Math.floor((gregorianYear - 622) * 0.9702) + 1;
  const daysSinceHijriEpoch = Math.floor((gregorianYear - 622) * 354.37) + 
    Math.floor((gregorianMonth - 1) * 29.5) + gregorianDay - 1;
  
  let hijriYearCalc = Math.floor(daysSinceHijriEpoch / 354.37) + 1;
  const remainingDays = daysSinceHijriEpoch % 354.37;
  
  // حساب الشهر واليوم
  let hijriMonth = Math.floor(remainingDays / 29.5) + 1;
  if (hijriMonth > 12) {
    hijriMonth = 12;
  }
  const hijriDay = Math.floor(remainingDays % 29.5) + 1;

  const monthNames = [
    'محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني', 'جمادى الأولى', 'جمادى الثانية',
    'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
  ];

  return {
    year: hijriYearCalc,
    month: hijriMonth,
    day: hijriDay,
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

