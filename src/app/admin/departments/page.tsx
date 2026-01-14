'use client';

import { ProtectedRoute, usePermissions } from "@/components/auth/ProtectedRoute";
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

function DepartmentsPageContent() {
  const pathname = usePathname();
  const { canAdd, canEdit, canDelete } = usePermissions(pathname || '/admin/departments');
  const { showSuccess, showError, showWarning } = useToast();
  const { user } = useAuth();
  const isUserAdmin = isAdmin(user?.get('role'));
  const [departments, setDepartments] = useState<BaseModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [deletingDepartment, setDeletingDepartment] = useState<BaseModel | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<BaseModel | null>(null);
  const [formData, setFormData] = useState<BaseModel>(new BaseModel({
    name: '',
    description: '',
    notes: '',
  }));
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [bulkEditLoading, setBulkEditLoading] = useState(false);
  const [selectedDepartmentsForBulkEdit, setSelectedDepartmentsForBulkEdit] = useState<BaseModel[]>([]);
  const [bulkEditFormDataArray, setBulkEditFormDataArray] = useState<BaseModel[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [deletingDepartments, setDeletingDepartments] = useState<BaseModel[]>([]);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const docs = await firestoreApi.getDocuments(firestoreApi.getCollection("departments"));
      const data = BaseModel.fromFirestoreArray(docs);
      setDepartments(data);
    } catch (error) {
      console.error("Error loading departments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = formData.getData();
      if (editingDepartment?.get('id')) {
        const docRef = firestoreApi.getDocument("departments", editingDepartment.get('id'));
        await firestoreApi.updateData(docRef, data);
      } else {
        const newId = firestoreApi.getNewId("departments");
        const docRef = firestoreApi.getDocument("departments", newId);
        await firestoreApi.setData(docRef, data);
      }
      setIsModalOpen(false);
      setEditingDepartment(null);
      setFormData(new BaseModel({ name: '', description: '', notes: '' }));
      loadDepartments();
      showSuccess(editingDepartment ? "تم تحديث الإدارة بنجاح" : "تم إضافة الإدارة بنجاح");
    } catch (error) {
      console.error("Error saving department:", error);
      showError("حدث خطأ أثناء حفظ الإدارة");
    }
  };

  const handleEdit = (dept: BaseModel) => {
    setEditingDepartment(dept);
    setFormData(new BaseModel(dept.getData()));
    setIsModalOpen(true);
  };

  const handleDelete = (dept: BaseModel) => {
    setDeletingDepartment(dept);
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingDepartment) return;
    const id = deletingDepartment.get('id');
    if (!id) return;

    try {
      setDeleteLoading(true);
      const docRef = firestoreApi.getDocument("departments", id);
      await firestoreApi.deleteData(docRef);
      loadDepartments();
      setIsConfirmModalOpen(false);
      setDeletingDepartment(null);
      showSuccess("تم حذف الإدارة بنجاح");
    } catch (error) {
      console.error("Error deleting department:", error);
      showError("حدث خطأ أثناء حذف الإدارة");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleBulkEdit = (selectedItems: BaseModel[]) => {
    setSelectedDepartmentsForBulkEdit(selectedItems);
    const formDataArray = selectedItems.map(item => new BaseModel(item.getData()));
    setBulkEditFormDataArray(formDataArray);
    setIsBulkEditModalOpen(true);
  };

  const handleBulkDelete = (selectedItems: BaseModel[]) => {
    if (!selectedItems || selectedItems.length === 0) {
      showWarning("لم يتم تحديد أي إدارات للحذف");
      return;
    }
    setDeletingDepartments(selectedItems);
    setIsBulkDeleteModalOpen(true);
  };

  const confirmBulkDelete = async () => {
    if (deletingDepartments.length === 0) {
      showWarning("لم يتم تحديد أي إدارات للحذف");
      return;
    }

    try {
      setBulkDeleteLoading(true);
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      const deletePromises = deletingDepartments.map(async (department, index) => {
        const id = department.get('id');
        if (!id) {
          errorCount++;
          errors.push(`إدارة #${index + 1} بدون معرف`);
          return;
        }

        try {
          const docRef = firestoreApi.getDocument("departments", id);
          await firestoreApi.deleteData(docRef);
          successCount++;
        } catch (error) {
          errorCount++;
          const name = department.get('name') || 'غير معروف';
          const errorMsg = error instanceof Error ? error.message : 'خطأ غير معروف';
          errors.push(`فشل حذف ${name}: ${errorMsg}`);
        }
      });

      await Promise.all(deletePromises);

      if (errorCount > 0) {
        const errorMessage = errors.slice(0, 3).join('، ');
        const moreErrors = errors.length > 3 ? ` و ${errors.length - 3} خطأ آخر` : '';
        showWarning(`تم حذف ${successCount} من ${deletingDepartments.length} إدارة بنجاح، فشل: ${errorCount}. ${errorMessage}${moreErrors}`, 8000);
      } else {
        showSuccess(`تم حذف جميع ${successCount} إدارة بنجاح`);
      }

      await loadDepartments();
      setIsBulkDeleteModalOpen(false);
      setDeletingDepartments([]);
    } catch (error) {
      console.error("Error in bulk delete:", error);
      showError("حدث خطأ أثناء الحذف الجماعي");
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    if (departments.length === 0) {
      showWarning("لا توجد بيانات للحذف");
      return;
    }

    try {
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      const deletePromises = departments.map(async (department, index) => {
        const id = department.get('id');
        if (!id) {
          errorCount++;
          errors.push(`إدارة #${index + 1} بدون معرف`);
          return;
        }

        try {
          const docRef = firestoreApi.getDocument("departments", id);
          await firestoreApi.deleteData(docRef);
          successCount++;
        } catch (error) {
          errorCount++;
          const name = department.get('name') || 'غير معروف';
          const errorMsg = error instanceof Error ? error.message : 'خطأ غير معروف';
          errors.push(`فشل حذف ${name}: ${errorMsg}`);
        }
      });

      await Promise.all(deletePromises);

      if (errorCount > 0) {
        const errorMessage = errors.slice(0, 3).join('، ');
        const moreErrors = errors.length > 3 ? ` و ${errors.length - 3} خطأ آخر` : '';
        showWarning(`تم حذف ${successCount} من ${departments.length} إدارة بنجاح، فشل: ${errorCount}. ${errorMessage}${moreErrors}`, 8000);
      } else {
        showSuccess(`تم حذف جميع ${successCount} إدارة بنجاح`);
      }

      await loadDepartments();
    } catch (error) {
      console.error("Error deleting all:", error);
      showError("حدث خطأ أثناء حذف جميع البيانات");
    }
  };

  const handleBulkEditSubmit = async (dataArray: Record<string, any>[]) => {
    try {
      setBulkEditLoading(true);

      const updatePromises = dataArray.map(async (item) => {
        const department = selectedDepartmentsForBulkEdit.find(d => d.get('id') === item.id);
        if (!department || !item.id) return;

        const docRef = firestoreApi.getDocument("departments", item.id);
        await firestoreApi.updateData(docRef, {
          name: item.name || '',
          description: item.description || '',
          notes: item.notes || '',
        });
      });

      await Promise.all(updatePromises);

      setIsBulkEditModalOpen(false);
      setSelectedDepartmentsForBulkEdit([]);
      setBulkEditFormDataArray([]);
      loadDepartments();
      showSuccess(`تم تحديث ${selectedDepartmentsForBulkEdit.length} إدارة بنجاح`);
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
          // البحث عن اسم الإدارة
          let name = '';
          for (const key of Object.keys(row)) {
            const keyLower = key.toLowerCase().trim();
            if (keyLower.includes('اسم') || keyLower === 'name') {
              name = row[key]?.toString().trim() || '';
              break;
            }
          }
          if (!name) {
            name = (row['اسم الإدارة'] || row['الاسم'] || row['name'] || row['Name'] || '').toString().trim();
          }

          if (!name) {
            errorCount++;
            errors.push(`سطر ${i + 2}: اسم الإدارة فارغ`);
            continue;
          }

          // قراءة الحقول الأخرى
          const description = (
            row['الوصف'] || row['description'] || row['Description'] || ''
          ).toString().trim();

          const notes = (
            row['الملاحظات'] || row['notes'] || row['Notes'] || ''
          ).toString().trim();

          // التحقق من عدم التكرار
          const existing = departments.find(d => d.get('name') === name);
          if (existing) {
            errorCount++;
            errors.push(`سطر ${i + 2}: الإدارة "${name}" موجودة مسبقاً`);
            continue;
          }

          // إضافة إدارة جديدة
          const newId = firestoreApi.getNewId("departments");
          const docRef = firestoreApi.getDocument("departments", newId);
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
        const errorMessage = errors.slice(0, 3).join('، ');
        const moreErrors = errors.length > 3 ? ` و ${errors.length - 3} خطأ آخر` : '';
        showWarning(`تم استيراد ${successCount} إدارة بنجاح، فشل: ${errorCount}. ${errorMessage}${moreErrors}`, 8000);
      } else {
        showSuccess(`تم استيراد ${successCount} إدارة بنجاح`);
      }

      loadDepartments();
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
      label: 'اسم الإدارة',
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
          title="الإدارات"
          subtitle="إدارة وإضافة الإدارات في النظام"
          iconName="business"
          count={departments.length}
          actions={
            canAdd ? (
              <>
                <Button
                  onClick={() => setIsImportModalOpen(true)}
                  size="lg"
                  variant="outline"
                  className="shadow-lg hover:shadow-xl hover:shadow-primary/20 hover:scale-105 material-transition font-bold border-2 hover:border-primary-400 hover:bg-primary-50"
                >
                  <span className="flex items-center gap-2">
                    <MaterialIcon name="upload_file" className="w-5 h-5" size="lg" />
                    <span>استيراد من Excel</span>
                  </span>
                </Button>
                <Button
                  onClick={() => {
                    setEditingDepartment(null);
                    setFormData(new BaseModel({ name: '', description: '', notes: '' }));
                    setIsModalOpen(true);
                  }}
                  leftIcon={<MaterialIcon name="add" className="w-5 h-5" size="lg" />}
                  size="lg"
                  variant="primary"
                  className="shadow-2xl shadow-primary-500/40 hover:shadow-2xl hover:shadow-primary-500/50 hover:scale-105 material-transition font-bold"
                >
                  <span className="flex items-center gap-2">
                    <MaterialIcon name="add" className="w-5 h-5" size="lg" />
                    <span>إضافة إدارة جديدة</span>
                  </span>
                </Button>
              </>
            ) : null
          }
        />

        {/* Data Table */}
        <DataTable
          data={departments}
          columns={columns}
          onEdit={canEdit ? handleEdit : undefined}
          onDelete={canDelete ? handleDelete : undefined}
          onBulkEdit={(canEdit || canDelete) ? handleBulkEdit : undefined}
          onBulkDelete={canDelete ? handleBulkDelete : undefined}
          onDeleteAll={isUserAdmin ? handleDeleteAll : undefined}
          isAdmin={isUserAdmin}
          onAddNew={canAdd ? () => {
            setEditingDepartment(null);
            setFormData(new BaseModel({ name: '', description: '', notes: '' }));
            setIsModalOpen(true);
          } : undefined}
          title="الإدارات"
          exportFileName="departments"
          loading={loading}
        />

        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingDepartment(null);
            setFormData(new BaseModel({ name: '', description: '', notes: '' }));
          }}
          title={editingDepartment ? "تعديل إدارة" : "إضافة إدارة جديدة"}
          size="lg"
          footer={
            <div className="flex flex-col justify-end gap-3 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingDepartment(null);
                  setFormData(new BaseModel({ name: '', description: '', notes: '' }));
                }}
                size="lg"
                className="w-full font-bold"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                form="department-form"
                variant="primary"
                size="lg"
                className="w-full font-bold shadow-xl shadow-primary-500/30"
              >
                {editingDepartment ? "تحديث" : "حفظ"}
              </Button>
            </div>
          }
        >
          <form id="department-form" onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="اسم الإدارة"
              type="text"
              required
              value={formData.get('name')}
              onChange={(e) => {
                const newData = new BaseModel(formData.getData());
                newData.put('name', e.target.value);
                setFormData(newData);
              }}
              placeholder="أدخل اسم الإدارة"
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
              placeholder="أدخل وصف الإدارة"
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
            setDeletingDepartment(null);
          }}
          onConfirm={confirmDelete}
          title="تأكيد الحذف"
          message={`هل أنت متأكد من حذف ${deletingDepartment?.get('name') || 'هذه الإدارة'}؟ لا يمكن التراجع عن هذا الإجراء.`}
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
          title="استيراد الإدارات من Excel"
          description="اختر ملف Excel لعرض البيانات ومعاينتها وتعديلها قبل الحفظ"
          loading={importLoading}
        />

        {/* Bulk Edit Modal */}
        <BulkEditModal
          isOpen={isBulkEditModalOpen}
          onClose={() => {
            setIsBulkEditModalOpen(false);
            setSelectedDepartmentsForBulkEdit([]);
            setBulkEditFormDataArray([]);
          }}
          title={`تحرير جماعي (${selectedDepartmentsForBulkEdit.length} إدارة)`}
          items={selectedDepartmentsForBulkEdit.map((dept, index) => ({
            id: dept.get('id') || `dept-${index}`,
            label: dept.get('name') || `إدارة ${index + 1}`,
            data: bulkEditFormDataArray[index]?.getData() || dept.getData(),
          }))}
          fields={[
            {
              name: 'name',
              label: 'اسم الإدارة',
              type: 'text',
              placeholder: 'أدخل اسم الإدارة',
              icon: 'apartment',
              required: true,
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
          infoMessage="يمكنك تعديل كل إدارة بشكل منفصل. سيتم حفظ جميع التعديلات عند الضغط على 'حفظ جميع التعديلات'."
        />

        {/* Bulk Delete Confirm Modal */}
        <ConfirmModal
          isOpen={isBulkDeleteModalOpen}
          onClose={() => {
            setIsBulkDeleteModalOpen(false);
            setDeletingDepartments([]);
          }}
          onConfirm={confirmBulkDelete}
          title="تأكيد الحذف الجماعي"
          message={`هل أنت متأكد من حذف ${deletingDepartments.length} إدارة؟ لا يمكن التراجع عن هذا الإجراء.`}
          confirmText="حذف الكل"
          cancelText="إلغاء"
          variant="danger"
          loading={bulkDeleteLoading}
        />
      </div>
    </MainLayout>
  );
}

export default function DepartmentsPage() {
  return (
    <ProtectedRoute>
      <DepartmentsPageContent />
    </ProtectedRoute>
  );
}

