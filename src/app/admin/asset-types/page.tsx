'use client';

import { ProtectedRoute, usePermissions } from "@/components/auth/ProtectedRoute";
import { PlusIcon } from "@/components/icons";
import { MaterialIcon } from "@/components/icons/MaterialIcon";
import { AdminPageHeader } from "@/components/layout/AdminPageHeader";
import { MainLayout } from "@/components/layout/MainLayout";
import { BulkEditModal } from "@/components/ui/BulkEditModal";
import { Button } from "@/components/ui/Button";
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

function AssetTypesPageContent() {
  const pathname = usePathname();
  const { canAdd, canEdit, canDelete } = usePermissions(pathname || '/admin/asset-types');
  const { showSuccess, showError, showWarning } = useToast();
  const { user } = useAuth();
  const isUserAdmin = isAdmin(user?.get('role'));
  const [assetTypes, setAssetTypes] = useState<BaseModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [deletingAssetType, setDeletingAssetType] = useState<BaseModel | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editingAssetType, setEditingAssetType] = useState<BaseModel | null>(null);
  const [formData, setFormData] = useState<BaseModel>(new BaseModel({
    name: '',
    category: '',
    description: '',
    notes: '',
  }));
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [bulkEditLoading, setBulkEditLoading] = useState(false);
  const [selectedAssetTypesForBulkEdit, setSelectedAssetTypesForBulkEdit] = useState<BaseModel[]>([]);
  const [bulkEditFormDataArray, setBulkEditFormDataArray] = useState<BaseModel[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [deletingAssetTypes, setDeletingAssetTypes] = useState<BaseModel[]>([]);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  useEffect(() => {
    loadAssetTypes();
  }, []);

  const loadAssetTypes = async () => {
    try {
      setLoading(true);
      const docs = await firestoreApi.getDocuments(firestoreApi.getCollection("assetTypes"));
      const data = BaseModel.fromFirestoreArray(docs);
      setAssetTypes(data);
    } catch (error) {
      console.error("Error loading asset types:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = formData.getData();
      if (editingAssetType?.get('id')) {
        const docRef = firestoreApi.getDocument("assetTypes", editingAssetType.get('id'));
        await firestoreApi.updateData(docRef, data);
      } else {
        const newId = firestoreApi.getNewId("assetTypes");
        const docRef = firestoreApi.getDocument("assetTypes", newId);
        await firestoreApi.setData(docRef, data);
      }
      setIsModalOpen(false);
      setEditingAssetType(null);
      setFormData(new BaseModel({ name: '', category: '', description: '', notes: '' }));
      showSuccess(editingAssetType ? "تم تحديث نوع الأصل بنجاح" : "تم إضافة نوع الأصل بنجاح");
      loadAssetTypes();
    } catch (error) {
      console.error("Error saving asset type:", error);
      showError("حدث خطأ أثناء الحفظ");
    }
  };

  const handleEdit = (assetType: BaseModel) => {
    setEditingAssetType(assetType);
    setFormData(new BaseModel(assetType.getData()));
    setIsModalOpen(true);
  };

  const handleDelete = (assetType: BaseModel) => {
    setDeletingAssetType(assetType);
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingAssetType) return;
    const id = deletingAssetType.get('id');
    if (!id) return;

    try {
      setDeleteLoading(true);
      const docRef = firestoreApi.getDocument("assetTypes", id);
      await firestoreApi.deleteData(docRef);
      showSuccess("تم حذف نوع الأصل بنجاح");
      loadAssetTypes();
      setIsConfirmModalOpen(false);
      setDeletingAssetType(null);
    } catch (error) {
      console.error("Error deleting asset type:", error);
      showError("حدث خطأ أثناء الحذف");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleBulkEdit = (selectedItems: BaseModel[]) => {
    setSelectedAssetTypesForBulkEdit(selectedItems);
    const formDataArray = selectedItems.map(item => new BaseModel(item.getData()));
    setBulkEditFormDataArray(formDataArray);
    setIsBulkEditModalOpen(true);
  };

  const handleBulkDelete = (selectedItems: BaseModel[]) => {
    if (!selectedItems || selectedItems.length === 0) {
      showWarning("لم يتم تحديد أي أنواع للحذف");
      return;
    }
    setDeletingAssetTypes(selectedItems);
    setIsBulkDeleteModalOpen(true);
  };

  const confirmBulkDelete = async () => {
    if (deletingAssetTypes.length === 0) {
      showWarning("لم يتم تحديد أي أنواع للحذف");
      return;
    }

    try {
      setBulkDeleteLoading(true);
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      const deletePromises = deletingAssetTypes.map(async (assetType, index) => {
        const id = assetType.get('id');
        if (!id) {
          errorCount++;
          errors.push(`نوع #${index + 1} بدون معرف`);
          return;
        }

        try {
          const docRef = firestoreApi.getDocument("assetTypes", id);
          await firestoreApi.deleteData(docRef);
          successCount++;
        } catch (error) {
          errorCount++;
          const name = assetType.get('name') || 'غير معروف';
          const errorMsg = error instanceof Error ? error.message : 'خطأ غير معروف';
          errors.push(`فشل حذف ${name}: ${errorMsg}`);
        }
      });

      await Promise.all(deletePromises);

      if (errorCount > 0) {
        const errorMessage = errors.slice(0, 3).join('، ');
        const moreErrors = errors.length > 3 ? ` و ${errors.length - 3} خطأ آخر` : '';
        showWarning(`تم حذف ${successCount} من ${deletingAssetTypes.length} نوع بنجاح، فشل: ${errorCount}. ${errorMessage}${moreErrors}`, 8000);
      } else {
        showSuccess(`تم حذف جميع ${successCount} نوع بنجاح`);
      }

      await loadAssetTypes();
      setIsBulkDeleteModalOpen(false);
      setDeletingAssetTypes([]);
    } catch (error) {
      console.error("Error in bulk delete:", error);
      showError("حدث خطأ أثناء الحذف الجماعي");
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    if (assetTypes.length === 0) {
      showWarning("لا توجد بيانات للحذف");
      return;
    }

    try {
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      const deletePromises = assetTypes.map(async (assetType, index) => {
        const id = assetType.get('id');
        if (!id) {
          errorCount++;
          errors.push(`نوع #${index + 1} بدون معرف`);
          return;
        }

        try {
          const docRef = firestoreApi.getDocument("assetTypes", id);
          await firestoreApi.deleteData(docRef);
          successCount++;
        } catch (error) {
          errorCount++;
          const name = assetType.get('name') || 'غير معروف';
          const errorMsg = error instanceof Error ? error.message : 'خطأ غير معروف';
          errors.push(`فشل حذف ${name}: ${errorMsg}`);
        }
      });

      await Promise.all(deletePromises);

      if (errorCount > 0) {
        const errorMessage = errors.slice(0, 3).join('، ');
        const moreErrors = errors.length > 3 ? ` و ${errors.length - 3} خطأ آخر` : '';
        showWarning(`تم حذف ${successCount} من ${assetTypes.length} نوع بنجاح، فشل: ${errorCount}. ${errorMessage}${moreErrors}`, 8000);
      } else {
        showSuccess(`تم حذف جميع ${successCount} نوع بنجاح`);
      }

      await loadAssetTypes();
    } catch (error) {
      console.error("Error deleting all:", error);
      showError("حدث خطأ أثناء حذف جميع البيانات");
    }
  };

  const handleBulkEditSubmit = async (dataArray: Record<string, any>[]) => {
    try {
      setBulkEditLoading(true);

      const updatePromises = dataArray.map(async (item) => {
        if (!item.id) return;

        const docRef = firestoreApi.getDocument("assetTypes", item.id);
        await firestoreApi.updateData(docRef, {
          name: item.name || '',
          category: item.category || '',
          description: item.description || '',
          notes: item.notes || '',
        });
      });

      await Promise.all(updatePromises);

      setIsBulkEditModalOpen(false);
      setSelectedAssetTypesForBulkEdit([]);
      setBulkEditFormDataArray([]);
      loadAssetTypes();
      showSuccess(`تم تحديث ${dataArray.length} نوع بنجاح`);
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
          for (const key of Object.keys(row)) {
            const keyLower = key.toLowerCase().trim();
            if (keyLower.includes('اسم') || keyLower === 'name') {
              name = row[key]?.toString().trim() || '';
              break;
            }
          }
          if (!name) {
            name = (row['اسم نوع الأصل'] || row['الاسم'] || row['name'] || row['Name'] || '').toString().trim();
          }

          if (!name) {
            errorCount++;
            errors.push(`سطر ${i + 2}: اسم نوع الأصل فارغ`);
            continue;
          }

          const category = (row['الفئة'] || row['category'] || row['Category'] || '').toString().trim();
          const description = (row['الوصف'] || row['description'] || row['Description'] || '').toString().trim();
          const notes = (row['الملاحظات'] || row['notes'] || row['Notes'] || '').toString().trim();

          const existing = assetTypes.find(at => at.get('name') === name);
          if (existing) {
            errorCount++;
            errors.push(`سطر ${i + 2}: نوع الأصل "${name}" موجود مسبقاً`);
            continue;
          }

          const newId = firestoreApi.getNewId("assetTypes");
          const docRef = firestoreApi.getDocument("assetTypes", newId);
          await firestoreApi.setData(docRef, {
            name,
            category: category || '',
            description: description || '',
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
        showWarning(`تم استيراد ${successCount} نوع بنجاح\nفشل: ${errorCount}\n\nالأخطاء:\n${errorMessage}${moreErrors}`);
      } else {
        showSuccess(`تم استيراد ${successCount} نوع بنجاح`);
      }

      loadAssetTypes();
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
      label: 'اسم نوع الأصل',
      sortable: true,
    },
    {
      key: 'category',
      label: 'الفئة',
      sortable: true,
    },
    {
      key: 'description',
      label: 'الوصف',
      sortable: true,
    },
  ];

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <AdminPageHeader
          title="أنواع الأصول"
          subtitle="إدارة وإضافة أنواع الأصول في النظام"
          iconName="category"
          count={assetTypes.length}
          actions={
            canAdd ? (
              <>
                <Button
                  onClick={() => setIsImportModalOpen(true)}
                  leftIcon={<MaterialIcon name="upload_file" size="sm" />}
                  size="md"
                  variant="outline"
                  className="text-sm font-semibold"
                >
                  استيراد
                </Button>
                <Button
                  onClick={() => {
                    setEditingAssetType(null);
                    setFormData(new BaseModel({ name: '', category: '', description: '', notes: '' }));
                    setIsModalOpen(true);
                  }}
                  leftIcon={<PlusIcon className="w-4 h-4" />}
                  size="md"
                  variant="primary"
                  className="text-sm font-semibold"
                >
                  إضافة نوع جديد
                </Button>
              </>
            ) : null
          }
        />

        {/* Data Table */}
        <DataTable
          data={assetTypes}
          columns={columns}
          onEdit={canEdit ? handleEdit : undefined}
          onDelete={canDelete ? handleDelete : undefined}
          onBulkEdit={(canEdit || canDelete) ? handleBulkEdit : undefined}
          onBulkDelete={canDelete ? handleBulkDelete : undefined}
          onDeleteAll={isUserAdmin ? handleDeleteAll : undefined}
          isAdmin={isUserAdmin}
          onAddNew={canAdd ? () => {
            setEditingAssetType(null);
            setFormData(new BaseModel({ name: '', category: '', description: '', notes: '' }));
            setIsModalOpen(true);
          } : undefined}
          title="أنواع الأصول"
          exportFileName="asset-types"
          loading={loading}
        />

        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingAssetType(null);
            setFormData(new BaseModel({ name: '', category: '', description: '', notes: '' }));
          }}
          title={editingAssetType ? "تعديل نوع الأصل" : "إضافة نوع جديد"}
          size="lg"
          footer={
            <div className="flex flex-col justify-end gap-3 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingAssetType(null);
                  setFormData(new BaseModel({ name: '', category: '', description: '', notes: '' }));
                }}
                size="lg"
                className="w-full font-bold"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                form="asset-type-form"
                variant="primary"
                size="lg"
                className="w-full font-bold shadow-xl shadow-primary-500/30"
              >
                {editingAssetType ? "تحديث" : "حفظ"}
              </Button>
            </div>
          }
        >
          <form id="asset-type-form" onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="اسم نوع الأصل"
              type="text"
              required
              value={formData.get('name')}
              onChange={(e) => {
                const newData = new BaseModel(formData.getData());
                newData.put('name', e.target.value);
                setFormData(newData);
              }}
              placeholder="أدخل اسم نوع الأصل"
            />

            <Input
              label="الفئة"
              type="text"
              value={formData.get('category')}
              onChange={(e) => {
                const newData = new BaseModel(formData.getData());
                newData.put('category', e.target.value);
                setFormData(newData);
              }}
              placeholder="أدخل الفئة"
            />

            <Textarea
              label="الوصف"
              value={formData.get('description')}
              onChange={(e) => {
                const newData = new BaseModel(formData.getData());
                newData.put('description', e.target.value);
                setFormData(newData);
              }}
              rows={1}
              placeholder="أدخل وصف نوع الأصل"
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
            setDeletingAssetType(null);
          }}
          onConfirm={confirmDelete}
          title="تأكيد الحذف"
          message={`هل أنت متأكد من حذف ${deletingAssetType?.get('name') || 'هذا النوع'}؟ لا يمكن التراجع عن هذا الإجراء.`}
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
          title="استيراد أنواع الأصول من Excel"
          description="اختر ملف Excel لعرض البيانات ومعاينتها وتعديلها قبل الحفظ"
          loading={importLoading}
        />

        {/* Bulk Edit Modal */}
        <BulkEditModal
          isOpen={isBulkEditModalOpen}
          onClose={() => {
            setIsBulkEditModalOpen(false);
            setSelectedAssetTypesForBulkEdit([]);
            setBulkEditFormDataArray([]);
          }}
          title={`تحرير جماعي (${selectedAssetTypesForBulkEdit.length} نوع)`}
          items={selectedAssetTypesForBulkEdit.map((assetType, index) => ({
            id: assetType.get('id') || `asset-type-${index}`,
            label: assetType.get('name') || `نوع ${index + 1}`,
            data: bulkEditFormDataArray[index]?.getData() || assetType.getData(),
          }))}
          fields={[
            {
              name: 'name',
              label: 'اسم النوع',
              type: 'text',
              placeholder: 'أدخل اسم النوع',
              icon: 'label',
              required: true,
            },
            {
              name: 'category',
              label: 'الفئة',
              type: 'text',
              placeholder: 'أدخل الفئة',
              icon: 'category',
            },
            {
              name: 'description',
              label: 'الوصف',
              type: 'textarea',
              placeholder: 'أدخل الوصف',
              icon: 'description',
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
          infoMessage="يمكنك تعديل كل نوع بشكل منفصل. سيتم حفظ جميع التعديلات عند الضغط على 'حفظ جميع التعديلات'."
        />

        {/* Bulk Delete Confirm Modal */}
        <ConfirmModal
          isOpen={isBulkDeleteModalOpen}
          onClose={() => {
            setIsBulkDeleteModalOpen(false);
            setDeletingAssetTypes([]);
          }}
          onConfirm={confirmBulkDelete}
          title="تأكيد الحذف الجماعي"
          message={`هل أنت متأكد من حذف ${deletingAssetTypes.length} نوع؟ لا يمكن التراجع عن هذا الإجراء.`}
          confirmText="حذف الكل"
          cancelText="إلغاء"
          variant="danger"
          loading={bulkDeleteLoading}
        />
      </div>
    </MainLayout>
  );
}

export default function AssetTypesPage() {
  return (
    <ProtectedRoute>
      <AssetTypesPageContent />
    </ProtectedRoute>
  );
}

