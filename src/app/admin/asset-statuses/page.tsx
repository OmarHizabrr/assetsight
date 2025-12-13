'use client';

import { ProtectedRoute, usePermissions } from "@/components/auth/ProtectedRoute";
import { PlusIcon } from "@/components/icons";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { DataTable } from "@/components/ui/DataTable";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { BaseModel } from "@/lib/BaseModel";
import { firestoreApi } from "@/lib/FirestoreApi";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ImportExcelModal } from "@/components/ui/ImportExcelModal";
import { MaterialIcon } from "@/components/icons/MaterialIcon";

function AssetStatusesPageContent() {
  const pathname = usePathname();
  const { canAdd, canEdit, canDelete } = usePermissions(pathname || '/admin/asset-statuses');
  const [assetStatuses, setAssetStatuses] = useState<BaseModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [deletingStatus, setDeletingStatus] = useState<BaseModel | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editingStatus, setEditingStatus] = useState<BaseModel | null>(null);
  const [formData, setFormData] = useState<BaseModel>(new BaseModel({
    name: '',
    description: '',
    notes: '',
  }));
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);

  useEffect(() => {
    loadAssetStatuses();
  }, []);

  const loadAssetStatuses = async () => {
    try {
      setLoading(true);
      const docs = await firestoreApi.getDocuments(firestoreApi.getCollection("assetStatuses"));
      const data = BaseModel.fromFirestoreArray(docs);
      setAssetStatuses(data);
    } catch (error) {
      console.error("Error loading asset statuses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = formData.getData();
      if (editingStatus?.get('id')) {
        const docRef = firestoreApi.getDocument("assetStatuses", editingStatus.get('id'));
        await firestoreApi.updateData(docRef, data);
      } else {
        const newId = firestoreApi.getNewId("assetStatuses");
        const docRef = firestoreApi.getDocument("assetStatuses", newId);
        await firestoreApi.setData(docRef, data);
      }
      setIsModalOpen(false);
      setEditingStatus(null);
      setFormData(new BaseModel({ name: '', description: '', notes: '' }));
      loadAssetStatuses();
    } catch (error) {
      console.error("Error saving asset status:", error);
      alert("حدث خطأ أثناء الحفظ");
    }
  };

  const handleEdit = (status: BaseModel) => {
    setEditingStatus(status);
    setFormData(new BaseModel(status.getData()));
    setIsModalOpen(true);
  };

  const handleDelete = (status: BaseModel) => {
    setDeletingStatus(status);
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingStatus) return;
    const id = deletingStatus.get('id');
    if (!id) return;
    
    try {
      setDeleteLoading(true);
      const docRef = firestoreApi.getDocument("assetStatuses", id);
      await firestoreApi.deleteData(docRef);
      loadAssetStatuses();
      setIsConfirmModalOpen(false);
      setDeletingStatus(null);
    } catch (error) {
      console.error("Error deleting asset status:", error);
      alert("حدث خطأ أثناء الحذف");
    } finally {
      setDeleteLoading(false);
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
            name = (row['اسم الحالة'] || row['الاسم'] || row['name'] || row['Name'] || '').toString().trim();
          }

          if (!name) {
            errorCount++;
            errors.push(`سطر ${i + 2}: اسم الحالة فارغ`);
            continue;
          }

          const description = (row['الوصف'] || row['description'] || row['Description'] || '').toString().trim();
          const notes = (row['الملاحظات'] || row['notes'] || row['Notes'] || '').toString().trim();

          const existing = assetStatuses.find(as => as.get('name') === name);
          if (existing) {
            errorCount++;
            errors.push(`سطر ${i + 2}: الحالة "${name}" موجودة مسبقاً`);
            continue;
          }

          const newId = firestoreApi.getNewId("assetStatuses");
          const docRef = firestoreApi.getDocument("assetStatuses", newId);
          await firestoreApi.setData(docRef, {
            name,
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
        alert(`تم استيراد ${successCount} حالة بنجاح\nفشل: ${errorCount}\n\nالأخطاء:\n${errorMessage}${moreErrors}`);
      } else {
        alert(`تم استيراد ${successCount} حالة بنجاح`);
      }

      loadAssetStatuses();
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
      label: 'اسم الحالة',
      render: (item: BaseModel) => item.get('name'),
    },
    { 
      key: 'description', 
      label: 'الوصف',
      render: (item: BaseModel) => item.get('description'),
    },
  ];

  return (
    <MainLayout>
      {/* Page Header */}
      <div className="mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-6">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 flex items-center justify-center shadow-2xl shadow-primary-500/40 relative overflow-hidden group hover:scale-105 material-transition">
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-transparent opacity-0 group-hover:opacity-100 material-transition"></div>
                <span className="text-3xl relative z-10">📊</span>
              </div>
              <div className="flex-1">
                <h1 className="text-5xl font-black bg-gradient-to-r from-slate-900 via-primary-700 to-slate-900 bg-clip-text text-transparent mb-2">حالات الأصول</h1>
                <p className="text-slate-600 text-lg font-semibold">إدارة وإضافة حالات الأصول في النظام</p>
              </div>
            </div>
          </div>
          {canAdd && (
            <div className="flex gap-4">
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
                  setEditingStatus(null);
                  setFormData(new BaseModel({ name: '', description: '', notes: '' }));
                  setIsModalOpen(true);
                }}
                leftIcon={<PlusIcon className="w-5 h-5" />}
                size="lg"
                variant="primary"
                className="shadow-2xl shadow-primary-500/40 hover:shadow-2xl hover:shadow-primary-500/50 hover:scale-105 material-transition font-bold"
              >
                إضافة حالة جديدة
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={assetStatuses}
        columns={columns}
        onEdit={canEdit ? handleEdit : undefined}
        onDelete={canDelete ? handleDelete : undefined}
        onAddNew={canAdd ? () => {
          setEditingStatus(null);
          setFormData(new BaseModel({ name: '', description: '', notes: '' }));
          setIsModalOpen(true);
        } : undefined}
        title="حالات الأصول"
        exportFileName="asset-statuses"
        loading={loading}
      />

        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingStatus(null);
            setFormData(new BaseModel({ name: '', description: '', notes: '' }));
          }}
          title={editingStatus ? "تعديل حالة" : "إضافة حالة جديدة"}
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="اسم الحالة"
              type="text"
              required
              value={formData.get('name')}
              onChange={(e) => {
                const newData = new BaseModel(formData.getData());
                newData.put('name', e.target.value);
                setFormData(newData);
              }}
              placeholder="أدخل اسم الحالة"
            />

            <Textarea
              label="الوصف"
              value={formData.get('description')}
              onChange={(e) => {
                const newData = new BaseModel(formData.getData());
                newData.put('description', e.target.value);
                setFormData(newData);
              }}
              rows={4}
              placeholder="أدخل وصف الحالة"
            />

            <Textarea
              label="الملاحظات"
              value={formData.get('notes')}
              onChange={(e) => {
                const newData = new BaseModel(formData.getData());
                newData.put('notes', e.target.value);
                setFormData(newData);
              }}
              rows={3}
              placeholder="أدخل أي ملاحظات إضافية"
            />

            <div className="flex justify-end gap-4 pt-6 border-t-2 border-slate-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingStatus(null);
                  setFormData(new BaseModel({ name: '', description: '', notes: '' }));
                }}
                size="lg"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="lg"
              >
                {editingStatus ? "تحديث" : "حفظ"}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Confirm Delete Modal */}
        <ConfirmModal
          isOpen={isConfirmModalOpen}
          onClose={() => {
            setIsConfirmModalOpen(false);
            setDeletingStatus(null);
          }}
          onConfirm={confirmDelete}
          title="تأكيد الحذف"
          message={`هل أنت متأكد من حذف ${deletingStatus?.get('name') || 'هذه الحالة'}؟ لا يمكن التراجع عن هذا الإجراء.`}
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
          title="استيراد حالات الأصول من Excel"
          description="اختر ملف Excel لعرض البيانات ومعاينتها وتعديلها قبل الحفظ"
          loading={importLoading}
        />
    </MainLayout>
  );
}

export default function AssetStatusesPage() {
  return (
    <ProtectedRoute>
      <AssetStatusesPageContent />
    </ProtectedRoute>
  );
}
