'use client';

import { ProtectedRoute, usePermissions } from "@/components/auth/ProtectedRoute";
import { PlusIcon } from "@/components/icons";
import { MaterialIcon } from "@/components/icons/MaterialIcon";
import { AdminPageHeader } from "@/components/layout/AdminPageHeader";
import { MainLayout } from "@/components/layout/MainLayout";
import { BulkEditModal } from "@/components/ui/BulkEditModal";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { DataTable } from "@/components/ui/DataTable";
import { ImportExcelModal } from "@/components/ui/ImportExcelModal";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { BaseModel } from "@/lib/BaseModel";
import { firestoreApi } from "@/lib/FirestoreApi";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// دالة للتحقق من أن المستخدم مدير
function isAdmin(role: string | null | undefined): boolean {
  if (!role) return false;
  const normalizedRole = role.trim().toLowerCase();
  return normalizedRole === 'مدير' ||
    normalizedRole === 'admin' ||
    normalizedRole === 'administrator' ||
    normalizedRole === 'مدير النظام' ||
    normalizedRole === 'system admin';
}

function CurrenciesPageContent() {
  const pathname = usePathname();
  const { canAdd, canEdit, canDelete } = usePermissions(pathname || '/admin/currencies');
  const { showSuccess, showError, showWarning } = useToast();
  const { user } = useAuth();
  const isUserAdmin = isAdmin(user?.get('role'));
  const [currencies, setCurrencies] = useState<BaseModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [deletingCurrency, setDeletingCurrency] = useState<BaseModel | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<BaseModel | null>(null);
  const [formData, setFormData] = useState<BaseModel>(new BaseModel({
    name: '',
    code: '',
    symbol: '',
    is_default: false,
    notes: '',
  }));
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [bulkEditLoading, setBulkEditLoading] = useState(false);
  const [selectedCurrenciesForBulkEdit, setSelectedCurrenciesForBulkEdit] = useState<BaseModel[]>([]);
  const [bulkEditFormDataArray, setBulkEditFormDataArray] = useState<BaseModel[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [deletingCurrencies, setDeletingCurrencies] = useState<BaseModel[]>([]);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  useEffect(() => {
    loadCurrencies();
  }, []);

  const loadCurrencies = async () => {
    try {
      setLoading(true);
      const docs = await firestoreApi.getDocuments(firestoreApi.getCollection("currencies"));
      const data = BaseModel.fromFirestoreArray(docs);
      setCurrencies(data);
    } catch (error) {
      console.error("Error loading currencies:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = formData.getData();
      data.is_default = formData.getValue<boolean>('is_default') ? 1 : 0;

      // إذا تم تحديد كعملة افتراضية، إلغاء التحديد من باقي العملات
      if (data.is_default === 1) {
        for (const currency of currencies) {
          if (currency.get('id') !== editingCurrency?.get('id') && currency.getValue<number>('is_default') === 1) {
            const docRef = firestoreApi.getDocument("currencies", currency.get('id'));
            await firestoreApi.updateData(docRef, { is_default: 0 });
          }
        }
      }

      if (editingCurrency?.get('id')) {
        const docRef = firestoreApi.getDocument("currencies", editingCurrency.get('id'));
        await firestoreApi.updateData(docRef, data);
      } else {
        const newId = firestoreApi.getNewId("currencies");
        const docRef = firestoreApi.getDocument("currencies", newId);
        await firestoreApi.setData(docRef, data);
      }
      setIsModalOpen(false);
      setEditingCurrency(null);
      setFormData(new BaseModel({ name: '', code: '', symbol: '', is_default: false, notes: '' }));
      showSuccess(editingCurrency ? "تم تحديث العملة بنجاح" : "تم إضافة العملة بنجاح");
      loadCurrencies();
    } catch (error) {
      console.error("Error saving currency:", error);
      showError("حدث خطأ أثناء الحفظ");
    }
  };

  const handleEdit = (currency: BaseModel) => {
    setEditingCurrency(currency);
    const currencyData = currency.getData();
    currencyData.is_default = currency.getValue<number>('is_default') === 1 || currency.getValue<boolean>('is_default') === true;
    setFormData(new BaseModel(currencyData));
    setIsModalOpen(true);
  };

  const handleDelete = (currency: BaseModel) => {
    setDeletingCurrency(currency);
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingCurrency) return;
    const id = deletingCurrency.get('id');
    if (!id) return;

    try {
      setDeleteLoading(true);
      const docRef = firestoreApi.getDocument("currencies", id);
      await firestoreApi.deleteData(docRef);
      showSuccess("تم حذف العملة بنجاح");
      loadCurrencies();
      setIsConfirmModalOpen(false);
      setDeletingCurrency(null);
    } catch (error) {
      console.error("Error deleting currency:", error);
      showError("حدث خطأ أثناء الحذف");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleBulkEdit = (selectedItems: BaseModel[]) => {
    setSelectedCurrenciesForBulkEdit(selectedItems);
    const formDataArray = selectedItems.map(item => {
      const itemData = item.getData();
      itemData.is_default = item.getValue<number>('is_default') === 1 || item.getValue<boolean>('is_default') === true;
      return new BaseModel(itemData);
    });
    setBulkEditFormDataArray(formDataArray);
    setIsBulkEditModalOpen(true);
  };

  const handleBulkDelete = (selectedItems: BaseModel[]) => {
    if (!selectedItems || selectedItems.length === 0) {
      showWarning("لم يتم تحديد أي عملات للحذف");
      return;
    }
    setDeletingCurrencies(selectedItems);
    setIsBulkDeleteModalOpen(true);
  };

  const confirmBulkDelete = async () => {
    if (deletingCurrencies.length === 0) {
      showWarning("لم يتم تحديد أي عملات للحذف");
      return;
    }

    try {
      setBulkDeleteLoading(true);
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      const deletePromises = deletingCurrencies.map(async (currency, index) => {
        const id = currency.get('id');
        if (!id) {
          errorCount++;
          errors.push(`عملة #${index + 1} بدون معرف`);
          return;
        }

        try {
          const docRef = firestoreApi.getDocument("currencies", id);
          await firestoreApi.deleteData(docRef);
          successCount++;
        } catch (error) {
          errorCount++;
          const name = currency.get('name') || 'غير معروف';
          const errorMsg = error instanceof Error ? error.message : 'خطأ غير معروف';
          errors.push(`فشل حذف ${name}: ${errorMsg}`);
        }
      });

      await Promise.all(deletePromises);

      if (errorCount > 0) {
        const errorMessage = errors.slice(0, 3).join('، ');
        const moreErrors = errors.length > 3 ? ` و ${errors.length - 3} خطأ آخر` : '';
        showWarning(`تم حذف ${successCount} من ${deletingCurrencies.length} عملة بنجاح، فشل: ${errorCount}. ${errorMessage}${moreErrors}`, 8000);
      } else {
        showSuccess(`تم حذف جميع ${successCount} عملة بنجاح`);
      }

      await loadCurrencies();
      setIsBulkDeleteModalOpen(false);
      setDeletingCurrencies([]);
    } catch (error) {
      console.error("Error in bulk delete:", error);
      showError("حدث خطأ أثناء الحذف الجماعي");
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    if (currencies.length === 0) {
      showWarning("لا توجد بيانات للحذف");
      return;
    }

    try {
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      const deletePromises = currencies.map(async (currency, index) => {
        const id = currency.get('id');
        if (!id) {
          errorCount++;
          errors.push(`عملة #${index + 1} بدون معرف`);
          return;
        }

        try {
          const docRef = firestoreApi.getDocument("currencies", id);
          await firestoreApi.deleteData(docRef);
          successCount++;
        } catch (error) {
          errorCount++;
          const name = currency.get('name') || 'غير معروف';
          const errorMsg = error instanceof Error ? error.message : 'خطأ غير معروف';
          errors.push(`فشل حذف ${name}: ${errorMsg}`);
        }
      });

      await Promise.all(deletePromises);

      if (errorCount > 0) {
        const errorMessage = errors.slice(0, 3).join('، ');
        const moreErrors = errors.length > 3 ? ` و ${errors.length - 3} خطأ آخر` : '';
        showWarning(`تم حذف ${successCount} من ${currencies.length} عملة بنجاح، فشل: ${errorCount}. ${errorMessage}${moreErrors}`, 8000);
      } else {
        showSuccess(`تم حذف جميع ${successCount} عملة بنجاح`);
      }

      await loadCurrencies();
    } catch (error) {
      console.error("Error deleting all:", error);
      showError("حدث خطأ أثناء حذف جميع البيانات");
    }
  };

  const handleBulkEditSubmit = async (dataArray: Record<string, any>[]) => {
    try {
      setBulkEditLoading(true);

      // التحقق من العملات الافتراضية أولاً
      const defaultCurrencies = dataArray.filter((item) => {
        const isDefault = item.is_default === true || item.is_default === 1;
        return isDefault;
      });

      if (defaultCurrencies.length > 1) {
        showWarning("لا يمكن تحديد أكثر من عملة افتراضية واحدة");
        setBulkEditLoading(false);
        return;
      }

      // إلغاء التحديد من باقي العملات إذا تم تحديد عملة افتراضية
      if (defaultCurrencies.length === 1) {
        for (const currency of currencies) {
          const isSelected = dataArray.find(c => c.id === currency.get('id'));
          if (!isSelected && (currency.getValue<number>('is_default') === 1 || currency.getValue<boolean>('is_default') === true)) {
            const docRef = firestoreApi.getDocument("currencies", currency.get('id'));
            await firestoreApi.updateData(docRef, { is_default: 0 });
          }
        }
      }

      const updatePromises = dataArray.map(async (item) => {
        if (!item.id) return;

        const updates: any = {
          name: item.name || '',
          code: item.code || '',
          symbol: item.symbol || '',
          notes: item.notes || '',
        };

        // معالجة is_default
        updates.is_default = item.is_default === true || item.is_default === 1 ? 1 : 0;

        const docRef = firestoreApi.getDocument("currencies", item.id);
        await firestoreApi.updateData(docRef, updates);
      });

      await Promise.all(updatePromises);

      setIsBulkEditModalOpen(false);
      setSelectedCurrenciesForBulkEdit([]);
      setBulkEditFormDataArray([]);
      loadCurrencies();
      showSuccess(`تم تحديث ${dataArray.length} عملة بنجاح`);
    } catch (error) {
      showError("حدث خطأ أثناء التحديث الجماعي");
    } finally {
      setBulkEditLoading(false);
    }
  };

  const handleImportData = async (data: Array<Record<string, any>>) => {
    setImportLoading(true);
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    try {
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        try {
          let name = '';
          let code = '';
          let symbol = '';

          for (const key of Object.keys(row)) {
            const keyLower = key.toLowerCase().trim();
            if (keyLower.includes('اسم') || keyLower === 'name') {
              name = row[key]?.toString().trim() || '';
            } else if (keyLower.includes('رمز') && (keyLower.includes('عملة') || keyLower.includes('كود')) || keyLower === 'code') {
              code = row[key]?.toString().trim() || '';
            } else if (keyLower.includes('رمز') && !keyLower.includes('عملة') && !keyLower.includes('كود') || keyLower === 'symbol') {
              symbol = row[key]?.toString().trim() || '';
            }
          }

          if (!name) {
            name = (row['اسم العملة'] || row['الاسم'] || row['name'] || row['Name'] || '').toString().trim();
          }
          if (!code) {
            code = (row['رمز العملة'] || row['الكود'] || row['code'] || row['Code'] || '').toString().trim();
          }
          if (!symbol) {
            symbol = (row['الرمز'] || row['symbol'] || row['Symbol'] || '').toString().trim();
          }

          if (!name) {
            errorCount++;
            errors.push(`سطر ${i + 2}: اسم العملة فارغ`);
            continue;
          }

          const isDefault = (
            row['افتراضي'] || row['is_default'] || row['Is Default'] ||
            row['default'] || row['Default'] || false
          );
          const notes = (row['الملاحظات'] || row['notes'] || row['Notes'] || '').toString().trim();

          const existing = currencies.find(c => c.get('name') === name || c.get('code') === code);
          if (existing) {
            errorCount++;
            errors.push(`سطر ${i + 2}: العملة "${name}" أو الرمز "${code}" موجود مسبقاً`);
            continue;
          }

          const newId = firestoreApi.getNewId("currencies");
          const docRef = firestoreApi.getDocument("currencies", newId);
          await firestoreApi.setData(docRef, {
            name,
            code: code || '',
            symbol: symbol || '',
            is_default: isDefault ? 1 : 0,
            notes: notes || '',
          });

          successCount++;
        } catch (error) {
          errorCount++;
          errors.push(`سطر ${i + 2}: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
        }
      }

      if (errorCount > 0) {
        const errorMessage = errors.slice(0, 10).join('\n');
        const moreErrors = errors.length > 10 ? `\n... و ${errors.length - 10} خطأ آخر` : '';
        showWarning(`تم استيراد ${successCount} عملة بنجاح\nفشل: ${errorCount}\n\nالأخطاء:\n${errorMessage}${moreErrors}`);
      } else {
        showSuccess(`تم استيراد ${successCount} عملة بنجاح`);
      }

      loadCurrencies();
    } catch (error) {
      console.error("Error importing data:", error);
      throw error;
    } finally {
      setImportLoading(false);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'اسم العملة',
      sortable: true,
    },
    {
      key: 'code',
      label: 'رمز العملة',
      render: (item: BaseModel) => (
        <span className="font-mono font-semibold text-primary-600">{item.get('code')}</span>
      ),
      sortable: true,
    },
    {
      key: 'symbol',
      label: 'الرمز',
      sortable: true,
      render: (item: BaseModel) => (
        <span className="text-lg font-bold text-slate-700">{item.get('symbol') || '-'}</span>
      ),
    },
    {
      key: 'is_default',
      label: 'افتراضي',
      render: (item: BaseModel) => {
        const isDefault = item.getValue<number>('is_default') === 1 || item.getValue<boolean>('is_default') === true;
        return isDefault ? (
          <span className="px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-semibold">
            افتراضي
          </span>
        ) : (
          <span className="text-slate-400 text-xs">-</span>
        );
      },
    },
  ];

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <AdminPageHeader
          title="العملات"
          subtitle="إدارة وإضافة العملات في النظام"
          iconName="attach_money"
          count={currencies.length}
          actions={
            canAdd ? (
              <>
                <Button
                  onClick={() => setIsImportModalOpen(true)}
                  leftIcon={<MaterialIcon name="upload_file" size="md" />}
                  size="lg"
                  variant="outline"
                  className="shadow-lg hover:shadow-xl hover:scale-105 material-transition font-bold"
                >
                  استيراد من Excel
                </Button>
                <Button
                  onClick={() => {
                    setEditingCurrency(null);
                    setFormData(new BaseModel({ name: '', code: '', symbol: '', is_default: false, notes: '' }));
                    setIsModalOpen(true);
                  }}
                  leftIcon={<PlusIcon className="w-5 h-5" />}
                  size="lg"
                  variant="primary"
                  className="shadow-2xl shadow-primary-500/40 hover:shadow-2xl hover:shadow-primary-500/50 hover:scale-105 material-transition font-bold"
                >
                  إضافة عملة جديدة
                </Button>
              </>
            ) : null
          }
        />

        {/* Data Table */}
        <DataTable
          data={currencies}
          columns={columns}
          onEdit={canEdit ? handleEdit : undefined}
          onDelete={canDelete ? handleDelete : undefined}
          onBulkEdit={(canEdit || canDelete) ? handleBulkEdit : undefined}
          onBulkDelete={canDelete ? handleBulkDelete : undefined}
          onDeleteAll={isUserAdmin ? handleDeleteAll : undefined}
          isAdmin={isUserAdmin}
          onAddNew={canAdd ? () => {
            setEditingCurrency(null);
            setFormData(new BaseModel({ name: '', code: '', symbol: '', is_default: false, notes: '' }));
            setIsModalOpen(true);
          } : undefined}
          title="العملات"
          exportFileName="currencies"
          loading={loading}
        />

        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingCurrency(null);
            setFormData(new BaseModel({ name: '', code: '', symbol: '', is_default: false, notes: '' }));
          }}
          title={editingCurrency ? "تعديل عملة" : "إضافة عملة جديدة"}
          size="lg"
          footer={
            <div className="flex flex-col justify-end gap-3 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingCurrency(null);
                  setFormData(new BaseModel({ name: '', code: '', symbol: '', is_default: false, notes: '' }));
                }}
                size="lg"
                className="w-full font-bold"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                form="currency-form"
                variant="primary"
                size="lg"
                className="w-full font-bold shadow-xl shadow-primary-500/30"
              >
                {editingCurrency ? "تحديث" : "حفظ"}
              </Button>
            </div>
          }
        >
          <form id="currency-form" onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="اسم العملة"
              type="text"
              required
              value={formData.get('name')}
              onChange={(e) => {
                const newData = new BaseModel(formData.getData());
                newData.put('name', e.target.value);
                setFormData(newData);
              }}
              placeholder="مثل: ريال سعودي، دولار أمريكي"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="رمز العملة"
                type="text"
                required
                value={formData.get('code')}
                onChange={(e) => {
                  const newData = new BaseModel(formData.getData());
                  newData.put('code', e.target.value.toUpperCase());
                  setFormData(newData);
                }}
                placeholder="مثل: SAR, USD"
                maxLength={3}
              />

              <Input
                label="الرمز"
                type="text"
                value={formData.get('symbol')}
                onChange={(e) => {
                  const newData = new BaseModel(formData.getData());
                  newData.put('symbol', e.target.value);
                  setFormData(newData);
                }}
                placeholder="مثل: ر.س، $"
              />
            </div>

            <Checkbox
              label="عملة افتراضية"
              checked={formData.getValue<boolean>('is_default') === true || formData.getValue<number>('is_default') === 1}
              onChange={(e) => {
                const newData = new BaseModel(formData.getData());
                newData.put('is_default', e.target.checked);
                setFormData(newData);
              }}
            />

            <Textarea
              label="الملاحظات"
              value={formData.get('notes')}
              onChange={(e) => {
                const newData = new BaseModel(formData.getData());
                newData.put('notes', e.target.value);
                setFormData(newData);
              }}
              rows={1}
              placeholder="أدخل أي ملاحظات إضافية"
            />
          </form>
        </Modal>

        {/* Confirm Delete Modal */}
        <ConfirmModal
          isOpen={isConfirmModalOpen}
          onClose={() => {
            setIsConfirmModalOpen(false);
            setDeletingCurrency(null);
          }}
          onConfirm={confirmDelete}
          title="تأكيد الحذف"
          message={`هل أنت متأكد من حذف ${deletingCurrency?.get('name') || 'هذه العملة'}؟ لا يمكن التراجع عن هذا الإجراء.`}
          confirmText="حذف"
          cancelText="إلغاء"
          variant="danger"
          loading={deleteLoading}
        />

        {/* Import Excel Modal */}
        <ImportExcelModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImport={handleImportData}
          title="استيراد العملات من Excel"
          description="اختر ملف Excel لعرض البيانات ومعاينتها وتعديلها قبل الحفظ"
          loading={importLoading}
        />

        {/* Bulk Edit Modal */}
        <BulkEditModal
          isOpen={isBulkEditModalOpen}
          onClose={() => {
            setIsBulkEditModalOpen(false);
            setSelectedCurrenciesForBulkEdit([]);
            setBulkEditFormDataArray([]);
          }}
          title={`تحرير جماعي (${selectedCurrenciesForBulkEdit.length} عملة)`}
          items={selectedCurrenciesForBulkEdit.map((currency, index) => {
            const formData = bulkEditFormDataArray[index];
            const itemData = formData?.getData() || currency.getData();
            return {
              id: currency.get('id') || `currency-${index}`,
              label: currency.get('name') || `عملة ${index + 1}`,
              data: {
                ...itemData,
                is_default: itemData.is_default === 1 || itemData.is_default === true,
              },
            };
          })}
          fields={[
            {
              name: 'name',
              label: 'اسم العملة',
              type: 'text',
              placeholder: 'أدخل اسم العملة',
              icon: 'payments',
              required: true,
            },
            {
              name: 'code',
              label: 'رمز العملة',
              type: 'text',
              placeholder: 'أدخل رمز العملة',
              icon: 'code',
            },
            {
              name: 'symbol',
              label: 'الرمز',
              type: 'text',
              placeholder: 'أدخل الرمز',
              icon: 'attach_money',
            },
            {
              name: 'is_default',
              label: 'عملة افتراضية',
              type: 'checkbox',
              icon: 'check_circle',
              component: (
                <Checkbox
                  label=""
                  checked={false}
                  onChange={() => { }}
                />
              ),
            },
            {
              name: 'notes',
              label: 'الملاحظات',
              type: 'textarea',
              placeholder: 'أدخل الملاحظات',
              icon: 'note',
            },
          ]}
          onSubmit={handleBulkEditSubmit}
          isLoading={bulkEditLoading}
          infoMessage="يمكنك تعديل كل عملة بشكل منفصل. سيتم حفظ جميع التعديلات عند الضغط على 'حفظ جميع التعديلات'. ملاحظة: لا يمكن تحديد أكثر من عملة افتراضية واحدة."
        />

        {/* Bulk Delete Confirm Modal */}
        <ConfirmModal
          isOpen={isBulkDeleteModalOpen}
          onClose={() => {
            setIsBulkDeleteModalOpen(false);
            setDeletingCurrencies([]);
          }}
          onConfirm={confirmBulkDelete}
          title="تأكيد الحذف الجماعي"
          message={`هل أنت متأكد من حذف ${deletingCurrencies.length} عملة؟ لا يمكن التراجع عن هذا الإجراء.`}
          confirmText="حذف الكل"
          cancelText="إلغاء"
          variant="danger"
          loading={bulkDeleteLoading}
        />
      </div>
    </MainLayout>
  );
}

export default function CurrenciesPage() {
  return (
    <ProtectedRoute>
      <CurrenciesPageContent />
    </ProtectedRoute>
  );
}

