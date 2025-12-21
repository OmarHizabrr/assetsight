'use client';

import { MaterialIcon } from "@/components/icons/MaterialIcon";
import { Modal } from "./Modal";

interface KeyboardShortcut {
  keys: string[];
  description: string;
  category: string;
}

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  const shortcuts: KeyboardShortcut[] = [
    // Navigation
    { keys: ['Ctrl', 'K'], description: 'البحث السريع', category: 'التنقل' },
    { keys: ['/'], description: 'تركيز على البحث', category: 'التنقل' },
    { keys: ['Esc'], description: 'إغلاق Modal/Dialog', category: 'التنقل' },
    
    // Actions
    { keys: ['Ctrl', 'N'], description: 'إنشاء جديد', category: 'الإجراءات' },
    { keys: ['Ctrl', 'S'], description: 'حفظ', category: 'الإجراءات' },
    { keys: ['Ctrl', 'E'], description: 'تعديل', category: 'الإجراءات' },
    { keys: ['Ctrl', 'Delete'], description: 'حذف', category: 'الإجراءات' },
    
    // View
    { keys: ['Ctrl', 'Shift', 'D'], description: 'تبديل المظهر', category: 'العرض' },
    { keys: ['Ctrl', 'B'], description: 'تبديل Sidebar', category: 'العرض' },
    { keys: ['Ctrl', '1-9'], description: 'الانتقال للتاب رقم', category: 'العرض' },
    
    // Help
    { keys: ['Ctrl', '?'], description: 'إظهار هذه القائمة', category: 'المساعدة' },
    { keys: ['Alt', 'H'], description: 'الصفحة الرئيسية', category: 'المساعدة' },
  ];

  const categories = [...new Set(shortcuts.map(s => s.category))];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="⌨️ اختصارات لوحة المفاتيح"
      size="xl"
    >
      <div className="space-y-6">
        {categories.map(category => (
          <div key={category}>
            <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-primary-500 to-primary-600 rounded-full"></div>
              {category}
            </h3>
            <div className="space-y-2">
              {shortcuts
                .filter(s => s.category === category)
                .map((shortcut, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-xl material-transition group"
                  >
                    <span className="text-sm text-slate-700 font-medium group-hover:text-slate-900 material-transition">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <span key={keyIndex} className="flex items-center gap-1">
                          <kbd className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border-2 border-slate-200 rounded-lg shadow-sm group-hover:border-primary-300 group-hover:text-primary-700 material-transition">
                            {key}
                          </kbd>
                          {keyIndex < shortcut.keys.length - 1 && (
                            <span className="text-slate-400 text-xs font-bold">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}

        {/* نصائح */}
        <div className="mt-6 p-4 bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-xl border-2 border-primary-200/50">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg flex-shrink-0">
              <MaterialIcon name="lightbulb" className="text-white" size="md" />
            </div>
            <div>
              <h4 className="font-bold text-primary-900 mb-1">💡 نصيحة</h4>
              <p className="text-sm text-primary-800">
                اضغط <kbd className="px-2 py-1 text-xs font-bold bg-white rounded border border-primary-300">Ctrl</kbd> + <kbd className="px-2 py-1 text-xs font-bold bg-white rounded border border-primary-300">?</kbd> في أي وقت لإظهار هذه القائمة.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

