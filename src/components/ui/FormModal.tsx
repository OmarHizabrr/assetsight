'use client';

import { MaterialIcon } from "@/components/icons/MaterialIcon";
import React from 'react';
import { Button } from "./Button";
import { Input } from "./Input";
import { Modal } from "./Modal";
import { Select } from "./Select";
import { Textarea } from "./Textarea";

interface FormField {
  name: string;
  label: string;
  type?: 'text' | 'number' | 'email' | 'password' | 'textarea' | 'select' | 'date';
  placeholder?: string;
  required?: boolean;
  component?: React.ReactNode;
  colSpan?: number;
  validation?: (value: any) => string | null;
  options?: { value: string; label: string }[];
  helperText?: string;
  icon?: string;
}

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: string;
  fields: FormField[];
  initialData?: Record<string, any>;
  onSubmit: (data: Record<string, any>) => Promise<void>;
  isLoading?: boolean;
  submitText?: string;
  cancelText?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  layout?: 'single' | 'two-column' | 'three-column';
  description?: string;
}

export function FormModal({
  isOpen,
  onClose,
  title,
  icon = 'edit',
  fields,
  initialData = {},
  onSubmit,
  isLoading = false,
  submitText = 'حفظ',
  cancelText = 'إلغاء',
  size = 'md',
  layout = 'single',
  description,
}: FormModalProps) {
  const [formData, setFormData] = React.useState<Record<string, any>>(initialData);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    if (isOpen) {
      setFormData(initialData);
      setErrors({});
      setTouched({});
    }
  }, [isOpen, initialData]);

  const updateField = (name: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    // Real-time validation
    const field = fields.find(f => f.name === name);
    if (field && field.validation && touched[name]) {
      const error = field.validation(value);
      if (error) {
        setErrors((prev) => ({
          ...prev,
          [name]: error,
        }));
      } else if (errors[name]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    fields.forEach((field) => {
      const value = formData[field.name];
      
      if (field.required && (!value || value.toString().trim() === '')) {
        newErrors[field.name] = `${field.label} مطلوب`;
      } else if (field.validation) {
        const error = field.validation(value);
        if (error) {
          newErrors[field.name] = error;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const getGridCols = () => {
    switch (layout) {
      case 'two-column':
        return 'grid-cols-1 md:grid-cols-2';
      case 'three-column':
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      default:
        return 'grid-cols-1';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3 animate-fade-in-down">
          <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-white/30 via-white/20 to-white/10 flex items-center justify-center shadow-xl backdrop-blur-sm group-hover:scale-110 material-transition">
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent rounded-2xl opacity-0 group-hover:opacity-100 material-transition"></div>
            <MaterialIcon name={icon} className="text-white relative z-10 drop-shadow-lg" size="xl" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-white/30 rounded-full blur-sm animate-pulse-soft"></div>
          </div>
          <div className="flex-1">
            <h2 className="text-white font-black text-xl sm:text-2xl drop-shadow-md">{title}</h2>
            {description && (
              <p className="text-white/80 text-xs sm:text-sm font-medium mt-1 animate-fade-in">
                {description}
              </p>
            )}
          </div>
        </div>
      }
      size={size}
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
              <span>{cancelText}</span>
            </span>
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            form="form-modal-form"
            className="w-full sm:w-auto font-bold shadow-xl shadow-primary-500/30 hover:shadow-2xl hover:shadow-primary-500/40"
            isLoading={isLoading}
          >
            <span className="flex items-center gap-2">
              <MaterialIcon name="save" className="text-white" size="sm" />
              <span>{submitText}</span>
            </span>
          </Button>
        </div>
      }
    >
      <form id="form-modal-form" onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
        <div className={`grid ${getGridCols()} gap-5`}>
          {fields.map((field, index) => {
            const fieldValue = formData[field.name] ?? '';
            const hasError = !!errors[field.name] && touched[field.name];
            const colSpan = field.colSpan || 1;
            const fieldIcon = field.icon || 'label';

            return (
              <div
                key={field.name}
                className={`flex flex-col gap-2.5 animate-fade-in-up ${
                  colSpan > 1 ? `md:col-span-${colSpan}` : ''
                }`}
                style={{
                  gridColumn: colSpan > 1 ? `span ${colSpan}` : 'auto',
                  animationDelay: `${index * 50}ms`,
                }}
              >
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2 group">
                  {field.required && (
                    <span className="text-error-500 text-base font-black">*</span>
                  )}
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center group-hover:from-primary-200 group-hover:to-primary-300 material-transition">
                    <MaterialIcon
                      name={fieldIcon}
                      className="text-primary-600 group-hover:text-primary-700"
                      size="sm"
                    />
                  </div>
                  <span className="group-hover:text-primary-700 material-transition">{field.label}</span>
                </label>
                
                {field.component ? (
                  <div className="transform scale-95 origin-top">
                    {React.isValidElement(field.component) && React.cloneElement(field.component as React.ReactElement<any>, {
                      value: fieldValue,
                      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
                        updateField(field.name, e.target?.value ?? e),
                      error: hasError ? errors[field.name] : undefined,
                    })}
                  </div>
                ) : field.type === 'textarea' ? (
                  <Textarea
                    value={fieldValue}
                    onChange={(e) => updateField(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                    error={hasError ? errors[field.name] : undefined}
                    rows={4}
                  />
                ) : field.type === 'select' && field.options ? (
                  <Select
                    value={fieldValue}
                    onChange={(e) => updateField(field.name, e.target.value)}
                    options={field.options}
                    error={hasError ? errors[field.name] : undefined}
                  />
                ) : (
                  <Input
                    type={field.type || 'text'}
                    value={fieldValue}
                    onChange={(e) => updateField(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                    error={hasError ? errors[field.name] : undefined}
                    onBlur={() => setTouched((prev) => ({ ...prev, [field.name]: true }))}
                  />
                )}
                
                {field.helperText && !hasError && (
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-medium animate-fade-in">
                    <MaterialIcon name="info" className="text-slate-400" size="sm" />
                    <span>{field.helperText}</span>
                  </div>
                )}
                
                {hasError && (
                  <div className="flex items-center gap-2 text-error-600 text-xs font-semibold animate-fade-in">
                    <MaterialIcon name="error" className="text-error-500" size="sm" />
                    <span>{errors[field.name]}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </form>
    </Modal>
  );
}

