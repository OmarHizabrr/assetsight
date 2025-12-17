'use client';

import { ProtectedRoute, usePermissions } from "@/components/auth/ProtectedRoute";
import { PlusIcon } from "@/components/icons";
import { MaterialIcon } from "@/components/icons/MaterialIcon";
import { MainLayout } from "@/components/layout/MainLayout";
import { BulkEditModal } from "@/components/ui/BulkEditModal";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { DataTable } from "@/components/ui/DataTable";
import { ImportExcelModal } from "@/components/ui/ImportExcelModal";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/contexts/ToastContext";
import { BaseModel } from "@/lib/BaseModel";
import { firestoreApi } from "@/lib/FirestoreApi";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

function CategoriesPageContent() {
  const pathname = usePathname();
  const { canAdd, canEdit, canDelete } = usePermissions(pathname || '/admin/categories');
  const { showSuccess, showError, showWarning } = useToast();
  const [categories, setCategories] = useState<BaseModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<BaseModel | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BaseModel | null>(null);
  const [formData, setFormData] = useState<BaseModel>(new BaseModel({
    name: '',
    description: '',
    notes: '',
  }));
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [bulkEditLoading, setBulkEditLoading] = useState(false);
  const [selectedCategoriesForBulkEdit, setSelectedCategoriesForBulkEdit] = useState<BaseModel[]>([]);
  const [bulkEditFormDataArray, setBulkEditFormDataArray] = useState<BaseModel[]>([]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const docs = await firestoreApi.getDocuments(firestoreApi.getCollection("categories"));
      const data = BaseModel.fromFirestoreArray(docs);
      setCategories(data);
    } catch (error) {
      console.error("Error loading categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = formData.getData();
      if (editingCategory?.get('id')) {
        const docRef = firestoreApi.getDocument("categories", editingCategory.get('id'));
        await firestoreApi.updateData(docRef, data);
      } else {
        const newId = firestoreApi.getNewId("categories");
        const docRef = firestoreApi.getDocument("categories", newId);
        await firestoreApi.setData(docRef, data);
      }
      setIsModalOpen(false);
      setEditingCategory(null);
      setFormData(new BaseModel({ name: '', description: '', notes: '' }));
      showSuccess(editingCategory ? "تم تحديث الفئة بنجاح" : "تم إضافة الفئة بنجاح");
      loadCategories();
    } catch (error) {
      console.error("Error saving category:", error);
      showError("حدث خطأ أثناء الحفظ");
    }
  };

  const handleEdit = (category: BaseModel) => {
    setEditingCategory(category);
    setFormData(new BaseModel(category.getData()));
    setIsModalOpen(true);
  };

  const handleDelete = (category: BaseModel) => {
    setDeletingCategory(category);
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingCategory) return;
    const id = deletingCategory.get('id');
    if (!id) return;
    
    try {
      setDeleteLoading(true);
      const docRef = firestoreApi.getDocument("categories", id);
      await firestoreApi.deleteData(docRef);
      showSuccess("تم حذف الفئة بنجاح");
      loadCategories();
      setIsConfirmModalOpen(false);
      setDeletingCategory(null);
    } catch (error) {
      console.error("Error deleting category:", error);
      showError("حدث خطأ أثناء الحذف");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleBulkEdit = (selectedItems: BaseModel[]) => {
    setSelectedCategoriesForBulkEdit(selectedItems);
    const formDataArray = selectedItems.map(item => new BaseModel(item.getData()));
    setBulkEditFormDataArray(formDataArray);
    setIsBulkEditModalOpen(true);
  };

  const handleBulkEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCategoriesForBulkEdit.length === 0) return;

    try {
      setBulkEditLoading(true);

      const updatePromises = selectedCategoriesForBulkEdit.map(async (category, index) => {
        const categoryId = category.get('id');
        if (!categoryId) return;
        
        const formData = bulkEditFormDataArray[index];
        if (!formData) return;
        
        const updates = formData.getData();
        const docRef = firestoreApi.getDocument("categories", categoryId);
        await firestoreApi.updateData(docRef, updates);
      });

      await Promise.all(updatePromises);
      
      setIsBulkEditModalOpen(false);
      setSelectedCategoriesForBulkEdit([]);
      setBulkEditFormDataArray([]);
      loadCategories();
      showSuccess(`تم تحديث ${selectedCategoriesForBulkEdit.length} فئة بنجاح`);
    } catch (error) {
      console.error("Error in bulk edit:", error);
      showError("حدث خطأ أثناء التحديث الجماعي");
    } finally {
      setBulkEditLoading(false);
    }
  };

  const updateBulkEditField = useCallback((index: number, key: string, value: any) => {
    const newArray = [...bulkEditFormDataArray];
    const newData = new BaseModel(newArray[index].getData());
    newData.put(key, value);
    newArray[index] = newData;
    setBulkEditFormDataArray(newArray);
  }, [bulkEditFormDataArray]);

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
            name = (row['اسم الفئة'] || row['الاسم'] || row['name'] || row['Name'] || '').toString().trim();
          }

          if (!name) {
            errorCount++;
            errors.push(`سطر ${i + 2}: اسم الفئة فارغ`);
            continue;
          }

          const description = (row['الوصف'] || row['description'] || row['Description'] || '').toString().trim();
          const notes = (row['الملاحظات'] || row['notes'] || row['Notes'] || '').toString().trim();

          const existing = categories.find(c => c.get('name') === name);
          if (existing) {
            errorCount++;
            errors.push(`سطر ${i + 2}: الفئة "${name}" موجودة مسبقاً`);
            continue;
          }

          const newId = firestoreApi.getNewId("categories");
          const docRef = firestoreApi.getDocument("categories", newId);
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
        showWarning(`تم استيراد ${successCount} فئة بنجاح\nفشل: ${errorCount}\n\nالأخطاء:\n${errorMessage}${moreErrors}`);
      } else {
        showSuccess(`تم استيراد ${successCount} فئة بنجاح`);
      }

      loadCategories();
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
      label: 'اسم الفئة',
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
      {/* Page Header */}
      <div className="mb-10 relative">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-6">
          <div className="space-y-3">
            <div className="flex items-center gap-4 animate-fade-in-down">
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 flex items-center justify-center shadow-2xl shadow-primary-500/40 overflow-hidden group hover:scale-105 material-transition animate-float">
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-transparent opacity-0 group-hover:opacity-100 material-transition"></div>
                {/* Enhanced glow effect */}
                <div className="absolute -inset-2 bg-primary-500/30 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 material-transition -z-10"></div>
                <MaterialIcon name="folder" className="text-white relative z-10 material-transition group-hover:rotate-12" size="3xl" />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-white/20 rounded-full blur-sm animate-pulse-soft"></div>
                <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-white/10 rounded-full blur-sm animate-pulse-soft" style={{ animationDelay: '0.3s' }}></div>
              </div>
              <div className="flex-1 animate-fade-in-right" style={{ animationDelay: '0.1s' }}>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl sm:text-5xl font-black text-gradient-primary animate-gradient">
                    الفئات
                  </h1>
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-primary-50 rounded-full border border-primary-200 animate-scale-in hover-scale-smooth" style={{ animationDelay: '0.2s' }}>
                    <MaterialIcon name="folder" className="text-primary-600 material-transition group-hover:scale-110" size="sm" />
                    <span className="text-xs font-semibold text-primary-700">{categories.length}</span>
                  </div>
                </div>
                <p className="text-slate-600 text-base sm:text-lg font-semibold flex items-center gap-2 animate-fade-in-right" style={{ animationDelay: '0.2s' }}>
                  <MaterialIcon name="info" className="text-slate-400 material-transition group-hover:text-primary-600" size="sm" />
                  <span>إدارة وإضافة الفئات في النظام</span>
                </p>
              </div>
            </div>
          </div>
          {canAdd && (
            <div className="flex gap-4 animate-fade-in-left">
              <Button
                onClick={() => setIsImportModalOpen(true)}
                leftIcon={<MaterialIcon name="upload_file" size="md" />}
                size="lg"
                variant="outline"
                className="shadow-lg hover:shadow-xl hover:scale-105 material-transition font-bold hover-lift-smooth"
              >
                استيراد من Excel
              </Button>
              <Button
                onClick={() => {
                  setEditingCategory(null);
                  setFormData(new BaseModel({ name: '', description: '', notes: '' }));
                  setIsModalOpen(true);
                }}
                leftIcon={<PlusIcon className="w-5 h-5" />}
                size="lg"
                variant="primary"
                className="shadow-2xl shadow-primary-500/40 hover:shadow-2xl hover:shadow-primary-500/50 hover:scale-105 material-transition font-bold hover-lift-smooth hover-glow-primary"
              >
                إضافة فئة جديدة
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={categories}
        columns={columns}
        onEdit={canEdit ? handleEdit : undefined}
        onDelete={canDelete ? handleDelete : undefined}
        onBulkEdit={(canEdit || canDelete) ? handleBulkEdit : undefined}
        onAddNew={canAdd ? () => {
          setEditingCategory(null);
          setFormData(new BaseModel({ name: '', description: '', notes: '' }));
          setIsModalOpen(true);
        } : undefined}
        title="الفئات"
        exportFileName="categories"
        loading={loading}
      />

        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingCategory(null);
            setFormData(new BaseModel({ name: '', description: '', notes: '' }));
          }}
          title={editingCategory ? "تعديل فئة" : "إضافة فئة جديدة"}
          size="md"
          footer={
            <div className="flex flex-col sm:flex-row justify-end gap-3 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingCategory(null);
                  setFormData(new BaseModel({ name: '', description: '', notes: '' }));
                }}
                size="lg"
                className="w-full sm:w-auto font-bold"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                form="category-form"
                variant="primary"
                size="lg"
                className="w-full sm:w-auto font-bold shadow-xl shadow-primary-500/30"
              >
                {editingCategory ? "تحديث" : "حفظ"}
              </Button>
            </div>
          }
        >
          <form id="category-form" onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="اسم الفئة"
              type="text"
              required
              value={formData.get('name')}
              onChange={(e) => {
                const newData = new BaseModel(formData.getData());
                newData.put('name', e.target.value);
                setFormData(newData);
              }}
              placeholder="أدخل اسم الفئة"
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
              placeholder="أدخل وصف الفئة"
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
            setDeletingCategory(null);
          }}
          onConfirm={confirmDelete}
          title="تأكيد الحذف"
          message={`هل أنت متأكد من حذف ${deletingCategory?.get('name') || 'هذه الفئة'}؟ لا يمكن التراجع عن هذا الإجراء.`}
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
          title="استيراد الفئات من Excel"
          description="اختر ملف Excel لعرض البيانات ومعاينتها وتعديلها قبل الحفظ"
          loading={importLoading}
        />

        {/* Bulk Edit Modal */}
        <BulkEditModal
          isOpen={isBulkEditModalOpen}
          onClose={() => {
            setIsBulkEditModalOpen(false);
            setSelectedCategoriesForBulkEdit([]);
            setBulkEditFormDataArray([]);
          }}
          title={`تحرير جماعي (${selectedCategoriesForBulkEdit.length} فئة)`}
          items={selectedCategoriesForBulkEdit.map((category, index) => ({
            id: category.get('id') || `category-${index}`,
            label: category.get('name') || `فئة ${index + 1}`,
            data: bulkEditFormDataArray[index]?.getData() || category.getData(),
          }))}
          fields={[
            {
              name: 'description',
              label: 'الوصف',
              type: 'textarea',
              colSpan: 2,
            },
            {
              name: 'notes',
              label: 'الملاحظات',
              type: 'textarea',
              colSpan: 2,
            },
          ]}
          onSubmit={async (dataArray) => {
            const updatePromises = dataArray.map(async (item) => {
              const category = selectedCategoriesForBulkEdit.find(c => c.get('id') === item.id);
              if (!category) return;
              
              const docRef = firestoreApi.getDocument("categories", item.id);
              await firestoreApi.updateData(docRef, {
                name: item.name || '',
                description: item.description || '',
                notes: item.notes || '',
              });
            });

            await Promise.all(updatePromises);
            
            setIsBulkEditModalOpen(false);
            setSelectedCategoriesForBulkEdit([]);
            setBulkEditFormDataArray([]);
            loadCategories();
            showSuccess(`تم تحديث ${selectedCategoriesForBulkEdit.length} فئة بنجاح`);
          }}
          isLoading={bulkEditLoading}
          infoMessage="يمكنك تعديل كل فئة بشكل منفصل. سيتم حفظ جميع التعديلات عند الضغط على 'حفظ جميع التعديلات'."
        />
    </MainLayout>
  );
}

export default function CategoriesPage() {
  return (
    <ProtectedRoute>
      <CategoriesPageContent />
    </ProtectedRoute>
  );
}
