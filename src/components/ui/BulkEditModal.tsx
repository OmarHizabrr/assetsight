'use client';

import { MaterialIcon } from "@/components/icons/MaterialIcon";
import React from 'react';
import { Button } from "./Button";
import { Card } from "./Card";
import { Input } from "./Input";
import { Modal } from "./Modal";
import { Select } from "./Select";
import { Textarea } from "./Textarea";

interface BulkEditField {
  label: string;
  name: string;
  type?: 'text' | 'number' | 'select' | 'textarea' | 'date' | 'checkbox';
  component?: React.ReactNode;
  colSpan?: number;
  options?: { value: string; label: string }[];
  placeholder?: string;
  icon?: string;
  width?: string;
  required?: boolean;
  validation?: (value: any) => string | undefined;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
}

interface BulkEditItem {
  id: string;
  label: string;
  data: any;
}

interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  items: BulkEditItem[];
  fields: BulkEditField[];
  onSubmit: (data: Record<string, any>[]) => Promise<void>;
  isLoading?: boolean;
  infoMessage?: string;
}

export function BulkEditModal({
  isOpen,
  onClose,
  title,
  items,
  fields,
  onSubmit,
  isLoading = false,
  infoMessage,
}: BulkEditModalProps) {
  const [formData, setFormData] = React.useState<Record<string, any>>({});
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, Record<string, string>>>({});
  const [savingRows, setSavingRows] = React.useState<Set<string>>(new Set());
  const containerRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (isOpen && items.length > 0) {
      const initialData: Record<string, any> = {};
      items.forEach((item) => {
        initialData[item.id] = { ...item.data };
      });
      setFormData(initialData);
      // توسيع جميع الصفوف افتراضياً
      setExpandedRows(new Set(items.map(item => item.id)));
      // إعادة تعيين الأخطاء
      setFieldErrors({});
      setSavingRows(new Set());
    }
  }, [isOpen, items]);

  const toggleRowExpansion = (itemId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const validateField = (itemId: string, fieldName: string, value: any): string | undefined => {
    const field = fields.find(f => f.name === fieldName);
    if (!field) return undefined;

    // Required validation
    if (field.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return 'هذا الحقل مطلوب';
    }

    // Custom validation
    if (field.validation) {
      return field.validation(value);
    }

    // Number validations
    if (field.type === 'number' && value !== '' && value !== null && value !== undefined) {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      if (isNaN(numValue)) {
        return 'يجب إدخال رقم صحيح';
      }
      if (field.min !== undefined && numValue < field.min) {
        return `القيمة يجب أن تكون أكبر من أو تساوي ${field.min}`;
      }
      if (field.max !== undefined && numValue > field.max) {
        return `القيمة يجب أن تكون أقل من أو تساوي ${field.max}`;
      }
    }

    // String length validations
    if (typeof value === 'string') {
      if (field.minLength && value.length < field.minLength) {
        return `يجب أن يكون الحد الأدنى ${field.minLength} أحرف`;
      }
      if (field.maxLength && value.length > field.maxLength) {
        return `يجب أن يكون الحد الأقصى ${field.maxLength} حرف`;
      }
    }

    return undefined;
  };

  const validateAllFields = (): boolean => {
    const errors: Record<string, Record<string, string>> = {};
    let hasErrors = false;

    items.forEach((item) => {
      const itemErrors: Record<string, string> = {};
      fields.forEach((field) => {
        const value = formData[item.id]?.[field.name];
        const error = validateField(item.id, field.name, value);
        if (error) {
          itemErrors[field.name] = error;
          hasErrors = true;
        }
      });
      if (Object.keys(itemErrors).length > 0) {
        errors[item.id] = itemErrors;
      }
    });

    setFieldErrors(errors);
    return !hasErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    if (!validateAllFields()) {
      return;
    }

    const dataArray = items.map((item) => ({
      id: item.id,
      ...formData[item.id],
    }));
    await onSubmit(dataArray);
  };

  const updateField = (itemId: string, fieldName: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [fieldName]: value,
      },
    }));

    // Real-time validation
    const error = validateField(itemId, fieldName, value);
    setFieldErrors((prev) => {
      const newErrors = { ...prev };
      if (!newErrors[itemId]) {
        newErrors[itemId] = {};
      }
      if (error) {
        newErrors[itemId][fieldName] = error;
      } else {
        delete newErrors[itemId][fieldName];
        if (Object.keys(newErrors[itemId]).length === 0) {
          delete newErrors[itemId];
        }
      }
      return newErrors;
    });
  };


  // حساب الحجم المناسب بناءً على عدد الحقول
  const modalSize = React.useMemo(() => {
    const fieldCount = fields.length;
    if (fieldCount <= 1) return 'md';      // 600px
    if (fieldCount === 2) return 'lg';     // 900px
    return 'full';                          // 1600px - للحقول المتعددة
  }, [fields.length]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={modalSize}
      customMaxWidth={fields.length >= 3 ? '95vw' : undefined}
      customWidth={fields.length >= 3 ? 'auto' : undefined}
      title={
        <div className="flex items-center gap-3 animate-fade-in-down">
          <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-white/30 via-white/20 to-white/10 flex items-center justify-center shadow-xl backdrop-blur-sm group-hover:scale-110 material-transition">
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent rounded-2xl opacity-0 group-hover:opacity-100 material-transition"></div>
            <MaterialIcon name="edit" className="text-white relative z-10 drop-shadow-lg" size="xl" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-white/30 rounded-full blur-sm animate-pulse-soft"></div>
          </div>
          <div className="flex-1">
            <h2 className="text-white font-black text-xl sm:text-2xl drop-shadow-md">{title}</h2>
            <p className="text-white/80 text-xs sm:text-sm font-medium mt-1 animate-fade-in">
              {items.length} عنصر محدد للتعديل
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex flex-col sm:flex-row justify-end gap-3 w-full animate-fade-in-up">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            size="lg"
            className="w-full sm:w-auto font-bold border-2 hover:border-slate-400 hover:bg-slate-50"
            disabled={isLoading}
          >
            <span className="flex items-center gap-2">
              <MaterialIcon name="close" className="text-slate-600" size="sm" />
              <span>إلغاء</span>
            </span>
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            form="bulk-edit-form"
            className="w-full sm:w-auto font-bold shadow-xl shadow-primary-500/30 hover:shadow-2xl hover:shadow-primary-500/40"
            isLoading={isLoading}
          >
            <span className="flex items-center gap-2">
              <MaterialIcon name="save" className="text-white" size="sm" />
              <span>حفظ جميع التعديلات ({items.length})</span>
            </span>
          </Button>
        </div>
      }
    >
      {/* Info Message */}
      {infoMessage && (
        <div className="mb-6 p-4 bg-gradient-to-r from-primary-50 via-primary-50/80 to-primary-50 rounded-xl border-2 border-primary-200/60 shadow-sm animate-fade-in backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md">
              <MaterialIcon name="info" className="text-white" size="sm" />
            </div>
            <p className="text-sm text-primary-800 font-semibold leading-relaxed">
              {infoMessage}
            </p>
          </div>
        </div>
      )}

      <form id="bulk-edit-form" onSubmit={handleSubmit} className="space-y-4" ref={containerRef} style={{ width: '100%', minWidth: 'fit-content' }}>
        {/* Table Header - Fixed with field labels */}
        <div className="sticky top-0 z-10 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border-2 border-slate-200/80 shadow-md p-4 mb-4 animate-fade-in-down">
          <div className="flex gap-4 w-full">
            <div className="w-20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-black text-slate-600 uppercase tracking-wider">#</span>
            </div>
            <div className="w-16 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-black text-slate-600 uppercase tracking-wider sr-only">توسيع</span>
            </div>
            <div className="flex-1 grid gap-4" style={{
              gridTemplateColumns: `repeat(${fields.length}, minmax(180px, max-content))`,
            }}>
              {fields.map((field, fieldIndex) => (
                <div key={field.name} className="flex items-center gap-2 animate-fade-in min-w-0" style={{ animationDelay: `${fieldIndex * 30}ms` }}>
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center flex-shrink-0">
                    <MaterialIcon
                      name={field.icon || 'label'}
                      className="text-primary-600"
                      size="sm"
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide truncate">
                    {field.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Items Table - Each row is one item with fields in columns */}
        <div 
          className="space-y-3 overflow-auto smooth-scroll pr-2"
          style={{
            maxHeight: items.length <= 5 ? 'none' : 'calc(100vh - 350px)',
            minHeight: items.length <= 3 ? 'auto' : '400px',
            overflowX: 'auto',
          }}
        >
          {items.map((item, index) => {
            const isExpanded = expandedRows.has(item.id);
            const fieldValue = formData[item.id]?.[fields[0]?.name] ?? item.data[fields[0]?.name] ?? '';
            const itemHasErrors = fieldErrors[item.id] && Object.keys(fieldErrors[item.id]).length > 0;
            const isRowSaving = savingRows.has(item.id);
            
            return (
              <Card
                key={item.id}
                variant="elevated"
                className={`bg-white/95 border-2 hover:shadow-xl material-transition animate-fade-in-up group relative overflow-hidden transition-all duration-300 ${
                  isExpanded ? 'shadow-lg border-primary-300/40' : ''
                } ${
                  itemHasErrors ? 'border-error-300/60 bg-error-50/30' : 'border-slate-200/80 hover:border-primary-300/60'
                }`}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                {/* Row number indicator */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 material-transition ${
                  itemHasErrors 
                    ? 'bg-gradient-to-b from-error-500 via-error-600 to-error-500 opacity-100' 
                    : `bg-gradient-to-b from-primary-500 via-primary-600 to-primary-500 ${isExpanded ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`
                }`}></div>
                
                {/* Loading indicator for row */}
                {isRowSaving && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-xl">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                      <span className="text-sm font-semibold text-primary-700">جاري الحفظ...</span>
                    </div>
                  </div>
                )}
                
                <div className={`p-4 transition-all duration-300 ${
                  isExpanded ? 'pb-6' : 'pb-4'
                }`}>
                  <div className="flex gap-4 w-full min-w-0 items-start">
                    {/* Row Number */}
                    <div className="w-20 flex items-center justify-center pt-1 flex-shrink-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 material-transition relative ${
                        itemHasErrors 
                          ? 'bg-gradient-to-br from-error-500 to-error-600' 
                          : 'bg-gradient-to-br from-primary-500 to-primary-600'
                      }`}>
                        <span className="text-white font-bold text-sm">
                          {index + 1}
                        </span>
                        {itemHasErrors && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-error-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                            <MaterialIcon name="error" className="text-white text-xs" size="sm" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Expand/Collapse Button */}
                    <div className="w-16 flex items-center justify-center pt-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleRowExpansion(item.id)}
                        className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 hover:from-primary-100 hover:to-primary-200 flex items-center justify-center shadow-sm hover:shadow-md material-transition group/btn"
                        aria-label={isExpanded ? 'طي الصف' : 'توسيع الصف'}
                      >
                        <MaterialIcon
                          name={isExpanded ? 'expand_less' : 'expand_more'}
                          className={`text-slate-600 group-hover/btn:text-primary-600 material-transition ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                          size="sm"
                        />
                      </button>
                    </div>

                    {/* Fields in columns - متساوية العرض وتتوسع تلقائياً */}
                    <div className="flex-1 min-w-0 grid gap-4" style={{
                      gridTemplateColumns: `repeat(${fields.length}, minmax(180px, max-content))`,
                    }}>
                    {fields.map((field) => {
                      const fieldValue = formData[item.id]?.[field.name] ?? item.data[field.name] ?? '';
                      const fieldError = fieldErrors[item.id]?.[field.name];

                      return (
                        <div
                          key={field.name}
                          className={`flex flex-col gap-1.5 transition-all duration-300 w-full min-w-0 ${
                            isExpanded ? 'opacity-100 max-h-none' : 'opacity-60 max-h-12 overflow-hidden'
                          }`}
                          style={{ minWidth: '180px' }}
                        >
                          {field.component ? (
                            <div className={`transform origin-top transition-all duration-300 w-full ${
                              isExpanded ? 'scale-100' : 'scale-95'
                            }`}>
                              {React.isValidElement(field.component) && React.cloneElement(field.component as React.ReactElement<any>, {
                                ...(field.type === 'checkbox' ? {
                                  checked: fieldValue === true || fieldValue === 1,
                                  onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                                    updateField(
                                      item.id,
                                      field.name,
                                      e.target.checked
                                    ),
                                } : {
                                  value: fieldValue,
                                  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
                                    updateField(
                                      item.id,
                                      field.name,
                                      e.target?.value ?? e
                                    ),
                                }),
                              })}
                            </div>
                          ) : field.type === 'textarea' ? (
                            <div className="w-full">
                              <Textarea
                                value={fieldValue}
                                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                                  updateField(item.id, field.name, e.target.value)
                                }
                                placeholder={field.placeholder || `أدخل ${field.label}`}
                                rows={isExpanded ? 3 : 2}
                                required={field.required}
                                error={fieldError}
                                className={`w-full transition-all duration-300 ${
                                  isExpanded ? 'min-h-[80px]' : 'min-h-[60px]'
                                }`}
                                style={{
                                  width: '100%',
                                  minWidth: '160px',
                                  maxWidth: '100%',
                                }}
                              />
                            </div>
                          ) : field.type === 'select' && field.options ? (
                            <div className="w-full">
                              <Select
                                value={fieldValue}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                                  updateField(item.id, field.name, e.target.value)
                                }
                                options={field.options}
                                required={field.required}
                                error={fieldError}
                                className="w-full"
                              />
                            </div>
                          ) : (
                            <div className="w-full" style={{ minWidth: '180px', width: 'auto' }}>
                              <Input
                                type={field.type || 'text'}
                                value={fieldValue}
                                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                                  updateField(item.id, field.name, e.target.value)
                                }
                                placeholder={field.placeholder || `أدخل ${field.label}`}
                                required={field.required}
                                error={fieldError}
                                min={field.min}
                                max={field.max}
                                minLength={field.minLength}
                                maxLength={field.maxLength}
                                className={`w-full transition-all duration-300 ${
                                  isExpanded ? 'h-auto' : ''
                                }`}
                                style={{
                                  width: '100%',
                                  minWidth: '180px',
                                }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </form>
    </Modal>
  );
}

