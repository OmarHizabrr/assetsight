'use client';

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PdfSettingsService } from "@/lib/services/PdfSettingsService";
import { PdfSettingsModel, defaultPdfSettings } from "@/lib/models/PdfSettingsModel";
import { MaterialIcon } from "@/components/icons/MaterialIcon";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/contexts/ToastContext";
import logoText from "@/assets/images/logos/logo-text.png";

function PdfSettingsPageContent() {
  const settingsService = PdfSettingsService.getInstance();
  const { showToast } = useToast();
  const [settings, setSettings] = useState<PdfSettingsModel>(defaultPdfSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<'rightHeader' | 'leftHeader' | 'footerText' | null>(null);
  const [editValue, setEditValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    const loaded = settingsService.getSettings();
    setSettings(loaded);
    if (loaded.logoBase64) {
      setLogoPreview(`data:image/png;base64,${loaded.logoBase64}`);
    } else {
      setLogoPreview(typeof logoText === 'string' ? logoText : logoText?.src || '');
    }
    setLoading(false);
  };

  const handleSave = () => {
    setSaving(true);
    const success = settingsService.saveSettings(settings);
    setSaving(false);
    
    if (success) {
      showToast('تم حفظ إعدادات PDF بنجاح', 'success');
    } else {
      showToast('فشل في حفظ الإعدادات', 'error');
    }
  };

  const handleReset = () => {
    if (confirm('هل تريد استعادة جميع الإعدادات إلى القيم الافتراضية؟')) {
      settingsService.resetToDefault();
      loadSettings();
      showToast('تم استعادة الإعدادات الافتراضية', 'success');
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('الرجاء اختيار ملف صورة', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        // تحويل إلى base64
        const base64 = result.split(',')[1];
        setSettings({ ...settings, logoBase64: base64 });
        setLogoPreview(result);
        showToast('تم تحميل الصورة بنجاح', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    if (confirm('هل تريد إزالة الصورة المخصصة والعودة للصورة الافتراضية؟')) {
      setSettings({ ...settings, logoBase64: '' });
      setLogoPreview(typeof logoText === 'string' ? logoText : logoText?.src || '');
      showToast('تم إزالة الصورة المخصصة', 'success');
    }
  };

  const openEditModal = (field: 'rightHeader' | 'leftHeader' | 'footerText') => {
    setEditingField(field);
    setEditValue(settings[field]);
    setIsEditModalOpen(true);
  };

  const saveEdit = () => {
    if (editingField) {
      setSettings({ ...settings, [editingField]: editValue });
      setIsEditModalOpen(false);
      setEditingField(null);
      setEditValue('');
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"></div>
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <Card variant="elevated" className="mb-6">
            <CardHeader>
              <h1 className="text-2xl font-bold text-slate-800">إعدادات PDF</h1>
              <p className="text-sm text-slate-600 mt-1">تخصيص رأس وتذييل ملفات PDF</p>
            </CardHeader>
            <CardBody>
              {/* إظهار/إخفاء الرأس والتذييل */}
              <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">
                      إظهار الرأس والتذييل في التقارير
                    </h3>
                    <p className="text-sm text-slate-600">تفعيل لإظهار الشعار والمعلومات</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.isHeaderVisible}
                      onChange={(e) => setSettings({ ...settings, isHeaderVisible: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>

              {/* صورة الشعار */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">صورة الشعار</h3>
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <div
                      className="w-32 h-32 rounded-full border-4 border-primary-500 overflow-hidden cursor-pointer hover:border-primary-600 transition-colors shadow-lg"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {logoPreview ? (
                        <img
                          src={logoPreview}
                          alt="Logo"
                          className="w-full h-full object-contain"
                          onError={() => setLogoPreview('/favicon.png')}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100">
                          <MaterialIcon name="image" className="text-slate-400" size="lg" />
                        </div>
                      )}
                    </div>
                    {settings.logoBase64 && (
                      <button
                        onClick={handleRemoveLogo}
                        className="absolute -top-2 -right-2 w-8 h-8 bg-error-500 text-white rounded-full flex items-center justify-center hover:bg-error-600 transition-colors shadow-lg"
                      >
                        <MaterialIcon name="close" size="sm" />
                      </button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  <p className="text-sm text-slate-600 text-center">
                    {settings.logoBase64 ? 'صورة الشعار المخصصة - اضغط للتغيير' : 'صورة الشعار الافتراضية - اضغط للتغيير'}
                  </p>
                  {settings.logoBase64 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveLogo}
                      leftIcon={<MaterialIcon name="restore" size="sm" />}
                    >
                      استعادة الصورة الافتراضية
                    </Button>
                  )}
                </div>
              </div>

              {/* الرأس الأيمن (العربي) */}
              <div className="mb-6">
                <Card variant="outlined" className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openEditModal('rightHeader')}>
                  <CardBody>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-base font-bold text-slate-800 mb-2 flex items-center gap-2">
                          <MaterialIcon name="edit" className="text-warning-500" size="sm" />
                          الرأس الأيمن (العربي)
                        </h3>
                        <p className="text-sm text-slate-600 whitespace-pre-line">{settings.rightHeader}</p>
                      </div>
                      <MaterialIcon name="chevron_left" className="text-slate-400" size="sm" />
                    </div>
                  </CardBody>
                </Card>
              </div>

              {/* الرأس الأيسر (English) */}
              <div className="mb-6">
                <Card variant="outlined" className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openEditModal('leftHeader')}>
                  <CardBody>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-base font-bold text-slate-800 mb-2 flex items-center gap-2">
                          <MaterialIcon name="edit" className="text-info-500" size="sm" />
                          الرأس الأيسر (English)
                        </h3>
                        <p className="text-sm text-slate-600 whitespace-pre-line">{settings.leftHeader}</p>
                      </div>
                      <MaterialIcon name="chevron_left" className="text-slate-400" size="sm" />
                    </div>
                  </CardBody>
                </Card>
              </div>

              {/* التذييل (التوقيعات) */}
              <div className="mb-6">
                <Card variant="outlined" className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openEditModal('footerText')}>
                  <CardBody>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-base font-bold text-slate-800 mb-2 flex items-center gap-2">
                          <MaterialIcon name="edit" className="text-success-500" size="sm" />
                          التذييل (التوقيعات)
                        </h3>
                        <p className="text-sm text-slate-600 whitespace-pre-line">{settings.footerText}</p>
                      </div>
                      <MaterialIcon name="chevron_left" className="text-slate-400" size="sm" />
                    </div>
                  </CardBody>
                </Card>
              </div>

              {/* أزرار الحفظ والاستعادة */}
              <div className="flex gap-3 mt-6">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleSave}
                  isLoading={saving}
                  leftIcon={<MaterialIcon name="save" size="sm" />}
                  fullWidth
                >
                  حفظ الإعدادات
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={handleReset}
                  leftIcon={<MaterialIcon name="restore" size="sm" />}
                  fullWidth
                >
                  استعادة الافتراضية
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Modal للتحرير */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingField(null);
            setEditValue('');
          }}
          title={
            editingField === 'rightHeader' ? 'تحرير الرأس الأيمن' :
            editingField === 'leftHeader' ? 'تحرير الرأس الأيسر' :
            'تحرير التذييل'
          }
          size="full"
          footer={
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingField(null);
                  setEditValue('');
                }}
              >
                إلغاء
              </Button>
              <Button variant="primary" onClick={saveEdit}>
                حفظ
              </Button>
            </div>
          }
        >
          <Input
            type="textarea"
            rows={6}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder="أدخل النص هنا..."
            fullWidth
          />
        </Modal>
      </MainLayout>
    </ProtectedRoute>
  );
}

export default PdfSettingsPageContent;

