
export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  callback: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  return shortcuts;
}

// قائمة الاختصارات المتاحة
export const defaultShortcuts: KeyboardShortcut[] = [
  {
    key: 'k',
    ctrl: true,
    description: 'البحث السريع',
    callback: () => { },
  },
  {
    key: '/',
    description: 'تركيز على حقل البحث',
    callback: () => { },
  },
  {
    key: 'n',
    ctrl: true,
    description: 'إنشاء جديد',
    callback: () => { },
  },
  {
    key: 's',
    ctrl: true,
    description: 'حفظ',
    callback: () => { },
  },
  {
    key: 'Escape',
    description: 'إغلاق Modal',
    callback: () => { },
  },
  {
    key: 'd',
    ctrl: true,
    shift: true,
    description: 'تبديل المظهر (فاتح/داكن)',
    callback: () => { },
  },
];

