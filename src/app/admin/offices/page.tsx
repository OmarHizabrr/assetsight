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
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { Textarea } from "@/components/ui/Textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { BaseModel } from "@/lib/BaseModel";
import { firestoreApi } from "@/lib/FirestoreApi";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

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

function OfficesPageContent() {
  const pathname = usePathname();
  const { canAdd, canEdit, canDelete } = usePermissions(pathname || '/admin/offices');
  const { showSuccess, showError, showWarning } = useToast();
  const { user } = useAuth();
  const isUserAdmin = isAdmin(user?.get('role'));
  const [offices, setOffices] = useState<BaseModel[]>([]);
  const [departments, setDepartments] = useState<BaseModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [deletingOffice, setDeletingOffice] = useState<BaseModel | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editingOffice, setEditingOffice] = useState<BaseModel | null>(null);
  const [formData, setFormData] = useState<BaseModel>(new BaseModel({
    name: '',
    department_id: '',
    floor: '',
    room: '',
    notes: '',
  }));
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [bulkEditLoading, setBulkEditLoading] = useState(false);
  const [selectedOfficesForBulkEdit, setSelectedOfficesForBulkEdit] = useState<BaseModel[]>([]);
  const [bulkEditFormDataArray, setBulkEditFormDataArray] = useState<BaseModel[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [deletingOffices, setDeletingOffices] = useState<BaseModel[]>([]);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // جلب جميع الإدارات
      const deptDocs = await firestoreApi.getDocuments(firestoreApi.getCollection("departments"));
      const departmentsData = BaseModel.fromFirestoreArray(deptDocs);
      setDepartments(departmentsData);
      
      // جلب جميع المكاتب من جميع الإدارات
      const allOffices: BaseModel[] = [];
      for (const dept of departmentsData) {
        const deptId = dept.get('id');
        if (deptId) {
          const subCollectionRef = firestoreApi.getSubCollection(
            "departments",
            deptId,
            "departments"
          );
          const officeDocs = await firestoreApi.getDocuments(subCollectionRef);
          const offices = BaseModel.fromFirestoreArray(officeDocs);
          offices.forEach(office => {
            office.put('department_id', deptId);
            allOffices.push(office);
          });
        }
      }
      
      setOffices(allOffices);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const deptId = formData.get('department_id');
    if (!deptId) {
      showWarning("يرجى اختيار الإدارة");
      return;
    }
    
    try {
      const data = formData.getData();
      const officeId = editingOffice?.get('id');
      const editingDeptId = editingOffice?.get('department_id');
      
      if (officeId && editingDeptId) {
        const docRef = firestoreApi.getSubDocument(
          "departments",
          editingDeptId,
          "departments",
          officeId
        );
        await firestoreApi.updateData(docRef, data);
        showSuccess("تم تحديث المكتب بنجاح");
      } else {
        const newId = firestoreApi.getNewId("offices");
        const docRef = firestoreApi.getSubDocument(
          "departments",
          deptId,
          "departments",
          newId
        );
        await firestoreApi.setData(docRef, data);
        showSuccess("تم إضافة المكتب بنجاح");
      }
      setIsModalOpen(false);
      setEditingOffice(null);
      setFormData(new BaseModel({ name: '', department_id: '', floor: '', room: '', notes: '' }));
      loadData();
    } catch (error) {
      console.error("Error saving office:", error);
      showError("حدث خطأ أثناء الحفظ");
    }
  }, [formData, editingOffice, showSuccess, showError, showWarning]);

  const handleEdit = (office: BaseModel) => {
    setEditingOffice(office);
    setFormData(new BaseModel(office.getData()));
    setIsModalOpen(true);
  };

  const handleDelete = (office: BaseModel) => {
    setDeletingOffice(office);
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingOffice) return;
    const id = deletingOffice.get('id');
    const deptId = deletingOffice.get('department_id');
    if (!id || !deptId) return;
    
    try {
      setDeleteLoading(true);
      const docRef = firestoreApi.getSubDocument(
        "departments",
        deptId,
        "departments",
        id
      );
      await firestoreApi.deleteData(docRef);
      showSuccess("تم حذف المكتب بنجاح");
      loadData();
      setIsConfirmModalOpen(false);
      setDeletingOffice(null);
    } catch (error) {
      console.error("Error deleting office:", error);
      showError("حدث خطأ أثناء الحذف");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleBulkEdit = (selectedItems: BaseModel[]) => {
    setSelectedOfficesForBulkEdit(selectedItems);
    const formDataArray = selectedItems.map(item => new BaseModel(item.getData()));
    setBulkEditFormDataArray(formDataArray);
    setIsBulkEditModalOpen(true);
  };

  const handleBulkDelete = (selectedItems: BaseModel[]) => {
    if (!selectedItems || selectedItems.length === 0) {
      showWarning("لم يتم تحديد أي مكاتب للحذف");
      return;
    }
    setDeletingOffices(selectedItems);
    setIsBulkDeleteModalOpen(true);
  };

  const confirmBulkDelete = async () => {
    if (deletingOffices.length === 0) {
      showWarning("لم يتم تحديد أي مكاتب للحذف");
      return;
    }
    
    try {
      setBulkDeleteLoading(true);
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      const deletePromises = deletingOffices.map(async (office, index) => {
        const id = office.get('id');
        const deptId = office.get('department_id');
        if (!id || !deptId) {
          errorCount++;
          errors.push(`مكتب #${index + 1} بدون معرف أو إدارة`);
          return;
        }

        try {
          const docRef = firestoreApi.getSubDocument(
            "departments",
            deptId,
            "departments",
            id
          );
          await firestoreApi.deleteData(docRef);
          successCount++;
        } catch (error) {
          errorCount++;
          const name = office.get('name') || 'غير معروف';
          const errorMsg = error instanceof Error ? error.message : 'خطأ غير معروف';
          errors.push(`فشل حذف ${name}: ${errorMsg}`);
        }
      });

      await Promise.all(deletePromises);

      if (errorCount > 0) {
        const errorMessage = errors.slice(0, 3).join('، ');
        const moreErrors = errors.length > 3 ? ` و ${errors.length - 3} خطأ آخر` : '';
        showWarning(`تم حذف ${successCount} من ${deletingOffices.length} مكتب بنجاح، فشل: ${errorCount}. ${errorMessage}${moreErrors}`, 8000);
      } else {
        showSuccess(`تم حذف جميع ${successCount} مكتب بنجاح`);
      }

      await loadData();
      setIsBulkDeleteModalOpen(false);
      setDeletingOffices([]);
    } catch (error) {
      console.error("Error in bulk delete:", error);
      showError("حدث خطأ أثناء الحذف الجماعي");
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    if (offices.length === 0) {
      showWarning("لا توجد بيانات للحذف");
      return;
    }

    try {
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      const deletePromises = offices.map(async (office, index) => {
        const id = office.get('id');
        const deptId = office.get('department_id');
        if (!id || !deptId) {
          errorCount++;
          errors.push(`مكتب #${index + 1} بدون معرف أو إدارة`);
          return;
        }

        try {
          const docRef = firestoreApi.getSubDocument(
            "departments",
            deptId,
            "departments",
            id
          );
          await firestoreApi.deleteData(docRef);
          successCount++;
        } catch (error) {
          errorCount++;
          const name = office.get('name') || 'غير معروف';
          const errorMsg = error instanceof Error ? error.message : 'خطأ غير معروف';
          errors.push(`فشل حذف ${name}: ${errorMsg}`);
        }
      });

      await Promise.all(deletePromises);

      if (errorCount > 0) {
        const errorMessage = errors.slice(0, 3).join('، ');
        const moreErrors = errors.length > 3 ? ` و ${errors.length - 3} خطأ آخر` : '';
        showWarning(`تم حذف ${successCount} من ${offices.length} مكتب بنجاح، فشل: ${errorCount}. ${errorMessage}${moreErrors}`, 8000);
      } else {
        showSuccess(`تم حذف جميع ${successCount} مكتب بنجاح`);
      }

      await loadData();
    } catch (error) {
      console.error("Error deleting all:", error);
      showError("حدث خطأ أثناء حذف جميع البيانات");
    }
  };

  const handleBulkEditSubmit = async (dataArray: Record<string, any>[]) => {
    try {
      setBulkEditLoading(true);

      const updatePromises = dataArray.map(async (item) => {
        const office = selectedOfficesForBulkEdit.find(o => o.get('id') === item.id);
        if (!office || !item.id) return;
        
        const deptId = office.get('department_id');
        if (!deptId) return;
        
        const docRef = firestoreApi.getSubDocument(
          "departments",
          deptId,
          "departments",
          item.id
        );
        await firestoreApi.updateData(docRef, {
          name: item.name || '',
          floor: item.floor || '',
          room: item.room || '',
          notes: item.notes || '',
        });
      });

      await Promise.all(updatePromises);
      
      setIsBulkEditModalOpen(false);
      setSelectedOfficesForBulkEdit([]);
      setBulkEditFormDataArray([]);
      loadData();
      showSuccess(`تم تحديث ${selectedOfficesForBulkEdit.length} مكتب بنجاح`);
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
          let departmentName = '';
          
          for (const key of Object.keys(row)) {
            const keyLower = key.toLowerCase().trim();
            if (keyLower.includes('اسم') && !keyLower.includes('إدارة') || keyLower === 'name') {
              name = row[key]?.toString().trim() || '';
            } else if (keyLower.includes('إدارة') || keyLower.includes('department')) {
              departmentName = row[key]?.toString().trim() || '';
            }
          }
          
          if (!name) {
            name = (row['اسم المكتب'] || row['الاسم'] || row['name'] || row['Name'] || '').toString().trim();
          }
          if (!departmentName) {
            departmentName = (row['الإدارة'] || row['department'] || row['Department'] || '').toString().trim();
          }

          if (!name) {
            errorCount++;
            errors.push(`سطر ${i + 2}: اسم المكتب فارغ`);
            continue;
          }

          if (!departmentName) {
            errorCount++;
            errors.push(`سطر ${i + 2}: اسم الإدارة فارغ`);
            continue;
          }

          // البحث عن الإدارة
          const department = departments.find(d => 
            d.get('name')?.toLowerCase().includes(departmentName.toLowerCase()) ||
            departmentName.toLowerCase().includes(d.get('name')?.toLowerCase() || '')
          );

          if (!department) {
            errorCount++;
            errors.push(`سطر ${i + 2}: الإدارة "${departmentName}" غير موجودة`);
            continue;
          }

          const deptId = department.get('id');
          if (!deptId) {
            errorCount++;
            errors.push(`سطر ${i + 2}: خطأ في معرف الإدارة`);
            continue;
          }

          const floor = (row['الطابق'] || row['floor'] || row['Floor'] || '').toString().trim();
          const room = (row['الغرفة'] || row['room'] || row['Room'] || '').toString().trim();
          const notes = (row['الملاحظات'] || row['notes'] || row['Notes'] || '').toString().trim();

          // التحقق من عدم التكرار
          const existing = offices.find(o => 
            o.get('name') === name && o.get('department_id') === deptId
          );
          if (existing) {
            errorCount++;
            errors.push(`سطر ${i + 2}: المكتب "${name}" موجود مسبقاً في هذه الإدارة`);
            continue;
          }

          const newId = firestoreApi.getNewId("offices");
          const docRef = firestoreApi.getSubDocument(
            "departments",
            deptId,
            "departments",
            newId
          );
          await firestoreApi.setData(docRef, {
            name,
            department_id: deptId,
            floor: floor || '',
            room: room || '',
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
        showWarning(`تم استيراد ${successCount} مكتب بنجاح\nفشل: ${errorCount}\n\nالأخطاء:\n${errorMessage}${moreErrors}`);
      } else {
        showSuccess(`تم استيراد ${successCount} مكتب بنجاح`);
      }

      loadData();
    } catch (error) {
      console.error("Error importing data:", error);
      throw error;
    } finally {
      setImportLoading(false);
    }
  };

  const getDepartmentName = (deptId?: string) => {
    if (!deptId) return '-';
    const dept = departments.find(d => d.get('id') === deptId);
    return dept?.get('name') || '-';
  };

  const columns = [
    { 
      key: 'department_id', 
      label: 'الإدارة',
      render: (item: BaseModel) => getDepartmentName(item.get('department_id')),
      sortable: true,
    },
    { 
      key: 'name', 
      label: 'اسم المكتب',
      sortable: true,
    },
    { 
      key: 'floor', 
      label: 'الطابق',
      sortable: true,
    },
    { 
      key: 'room', 
      label: 'الغرفة',
      sortable: true,
    },
  ];

  return (
    <MainLayout>
      {/* Page Header */}
      <div className="mb-10 relative animate-fade-in-down">
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-500/10 to-accent-500/10 rounded-full blur-3xl -z-10 animate-pulse-soft"></div>
        <div className="absolute top-10 left-10 w-48 h-48 bg-gradient-to-br from-success-500/5 to-warning-500/5 rounded-full blur-3xl -z-10 animate-pulse-soft" style={{ animationDelay: '0.5s' }}></div>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-6">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 flex items-center justify-center shadow-2xl shadow-primary-500/40 overflow-hidden group hover:scale-110 material-transition animate-float">
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-transparent opacity-0 group-hover:opacity-100 material-transition"></div>
                <MaterialIcon name="meeting_room" className="text-white relative z-10 group-hover:scale-110 material-transition" size="3xl" />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-white/20 rounded-full blur-sm animate-pulse-soft"></div>
                <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-white/10 rounded-full blur-sm animate-pulse-soft" style={{ animationDelay: '0.3s' }}></div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl sm:text-5xl font-black text-gradient-primary">
                    المكاتب
                  </h1>
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-primary-50 rounded-full border border-primary-200 animate-fade-in">
                    <MaterialIcon name="meeting_room" className="text-primary-600" size="sm" />
                    <span className="text-xs font-semibold text-primary-700">{offices.length}</span>
                  </div>
                </div>
                <p className="text-slate-600 text-base sm:text-lg font-semibold flex items-center gap-2 animate-fade-in">
                  <MaterialIcon name="info" className="text-slate-400" size="sm" />
                  <span>إدارة وإضافة المكاتب في النظام</span>
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
                className="shadow-lg hover:shadow-xl hover:shadow-primary/20 hover:scale-105 material-transition font-bold border-2 hover:border-primary-400 hover:bg-primary-50"
              >
                استيراد من Excel
              </Button>
              <Button
                onClick={() => {
                  setEditingOffice(null);
                  setFormData(new BaseModel({ name: '', department_id: '', floor: '', room: '', notes: '' }));
                  setIsModalOpen(true);
                }}
                leftIcon={<PlusIcon className="w-5 h-5" />}
                size="lg"
                variant="primary"
                className="shadow-2xl shadow-primary-500/40 hover:shadow-2xl hover:shadow-primary-500/50 hover:scale-105 material-transition font-bold"
              >
                إضافة مكتب جديد
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={offices}
        columns={columns}
        onEdit={canEdit ? handleEdit : undefined}
        onDelete={canDelete ? handleDelete : undefined}
        onBulkEdit={(canEdit || canDelete) ? handleBulkEdit : undefined}
        onBulkDelete={canDelete ? handleBulkDelete : undefined}
        onDeleteAll={isUserAdmin ? handleDeleteAll : undefined}
        isAdmin={isUserAdmin}
        onAddNew={canAdd ? () => {
          setEditingOffice(null);
          setFormData(new BaseModel({ name: '', department_id: '', floor: '', room: '', notes: '' }));
          setIsModalOpen(true);
        } : undefined}
        title="المكاتب"
        exportFileName="offices"
        loading={loading}
      />

        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingOffice(null);
            setFormData(new BaseModel({ name: '', department_id: '', floor: '', room: '', notes: '' }));
          }}
          title={editingOffice ? "تعديل مكتب" : "إضافة مكتب جديد"}
          size="lg"
          footer={
            <div className="flex flex-col sm:flex-row justify-end gap-3 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingOffice(null);
                  setFormData(new BaseModel({ name: '', department_id: '', floor: '', room: '', notes: '' }));
                }}
                size="lg"
                className="w-full sm:w-auto font-bold"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                form="office-form"
                variant="primary"
                size="lg"
                className="w-full sm:w-auto font-bold shadow-xl shadow-primary-500/30"
              >
                {editingOffice ? "تحديث" : "حفظ"}
              </Button>
            </div>
          }
        >
          <form id="office-form" onSubmit={handleSubmit} className="space-y-6">
            <SearchableSelect
              label="الإدارة"
              required
              value={formData.get('department_id')}
              onChange={(value) => {
                const newData = new BaseModel(formData.getData());
                newData.put('department_id', value);
                setFormData(newData);
              }}
              options={departments.map((dept) => ({
                value: dept.get('id'),
                label: dept.get('name'),
              }))}
              placeholder="اختر الإدارة"
            />

            <Input
              label="اسم المكتب"
              type="text"
              required
              value={formData.get('name')}
              onChange={(e) => {
                const newData = new BaseModel(formData.getData());
                newData.put('name', e.target.value);
                setFormData(newData);
              }}
              placeholder="أدخل اسم المكتب"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="الطابق"
                type="text"
                value={formData.get('floor')}
                onChange={(e) => {
                  const newData = new BaseModel(formData.getData());
                  newData.put('floor', e.target.value);
                  setFormData(newData);
                }}
                placeholder="أدخل الطابق"
              />
              <Input
                label="الغرفة/القسم"
                type="text"
                value={formData.get('room')}
                onChange={(e) => {
                  const newData = new BaseModel(formData.getData());
                  newData.put('room', e.target.value);
                  setFormData(newData);
                }}
                placeholder="أدخل الغرفة/القسم"
              />
            </div>

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
            setDeletingOffice(null);
          }}
          onConfirm={confirmDelete}
          title="تأكيد الحذف"
          message={`هل أنت متأكد من حذف ${deletingOffice?.get('name') || 'هذا المكتب'}؟ لا يمكن التراجع عن هذا الإجراء.`}
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
          title="استيراد المكاتب من Excel"
          description="اختر ملف Excel لعرض البيانات ومعاينتها وتعديلها قبل الحفظ. يجب أن يحتوي الملف على: اسم المكتب، الإدارة، الطابق (اختياري)، الغرفة (اختياري)"
          loading={importLoading}
        />

        {/* Bulk Edit Modal */}
        <BulkEditModal
          isOpen={isBulkEditModalOpen}
          onClose={() => {
            setIsBulkEditModalOpen(false);
            setSelectedOfficesForBulkEdit([]);
            setBulkEditFormDataArray([]);
          }}
          title={`تحرير جماعي (${selectedOfficesForBulkEdit.length} مكتب)`}
          items={selectedOfficesForBulkEdit.map((office, index) => ({
            id: office.get('id') || `office-${index}`,
            label: office.get('name') || `مكتب ${index + 1}`,
            data: bulkEditFormDataArray[index]?.getData() || office.getData(),
          }))}
          fields={[
            {
              name: 'name',
              label: 'اسم المكتب',
              type: 'text',
              placeholder: 'أدخل اسم المكتب',
              icon: 'meeting_room',
              required: true,
            },
            {
              name: 'floor',
              label: 'الطابق',
              type: 'text',
              placeholder: 'أدخل الطابق',
              icon: 'layers',
            },
            {
              name: 'room',
              label: 'الغرفة',
              type: 'text',
              placeholder: 'أدخل الغرفة',
              icon: 'room',
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
          infoMessage="يمكنك تعديل كل مكتب بشكل منفصل. سيتم حفظ جميع التعديلات عند الضغط على 'حفظ جميع التعديلات'."
        />

        {/* Bulk Delete Confirm Modal */}
        <ConfirmModal
          isOpen={isBulkDeleteModalOpen}
          onClose={() => {
            setIsBulkDeleteModalOpen(false);
            setDeletingOffices([]);
          }}
          onConfirm={confirmBulkDelete}
          title="تأكيد الحذف الجماعي"
          message={`هل أنت متأكد من حذف ${deletingOffices.length} مكتب؟ لا يمكن التراجع عن هذا الإجراء.`}
          confirmText="حذف الكل"
          cancelText="إلغاء"
          variant="danger"
          loading={bulkDeleteLoading}
        />
    </MainLayout>
  );
}

export default function OfficesPage() {
  return (
    <ProtectedRoute>
      <OfficesPageContent />
    </ProtectedRoute>
  );
}
