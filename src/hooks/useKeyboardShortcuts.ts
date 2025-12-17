import { useEffect } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  callback: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          event.preventDefault();
          shortcut.callback();
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);

  return shortcuts;
}

// قائمة الاختصارات المتاحة
export const defaultShortcuts: KeyboardShortcut[] = [
  {
    key: 'k',
    ctrl: true,
    description: 'البحث السريع',
    callback: () => {},
  },
  {
    key: '/',
    description: 'تركيز على حقل البحث',
    callback: () => {},
  },
  {
    key: 'n',
    ctrl: true,
    description: 'إنشاء جديد',
    callback: () => {},
  },
  {
    key: 's',
    ctrl: true,
    description: 'حفظ',
    callback: () => {},
  },
  {
    key: 'Escape',
    description: 'إغلاق Modal',
    callback: () => {},
  },
  {
    key: 'd',
    ctrl: true,
    shift: true,
    description: 'تبديل المظهر (فاتح/داكن)',
    callback: () => {},
  },
];

