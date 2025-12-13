'use client';

import { ProtectedRoute, usePermissions } from "@/components/auth/ProtectedRoute";
import { PlusIcon } from "@/components/icons";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { DataTable } from "@/components/ui/DataTable";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { BaseModel } from "@/lib/BaseModel";
import { firestoreApi } from "@/lib/FirestoreApi";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ImportExcelModal } from "@/components/ui/ImportExcelModal";
import { MaterialIcon } from "@/components/icons/MaterialIcon";

function OfficesPageContent() {
  const pathname = usePathname();
  const { canAdd, canEdit, canDelete } = usePermissions(pathname || '/admin/offices');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const deptId = formData.get('department_id');
    if (!deptId) {
      alert("يرجى اختيار الإدارة");
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
      } else {
        const newId = firestoreApi.getNewId("offices");
        const docRef = firestoreApi.getSubDocument(
          "departments",
          deptId,
          "departments",
          newId
        );
        await firestoreApi.setData(docRef, data);
      }
      setIsModalOpen(false);
      setEditingOffice(null);
      setFormData(new BaseModel({ name: '', department_id: '', floor: '', room: '', notes: '' }));
      loadData();
    } catch (error) {
      console.error("Error saving office:", error);
      alert("حدث خطأ أثناء الحفظ");
    }
  };

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
      loadData();
      setIsConfirmModalOpen(false);
      setDeletingOffice(null);
    } catch (error) {
      console.error("Error deleting office:", error);
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
        alert(`تم استيراد ${successCount} مكتب بنجاح\nفشل: ${errorCount}\n\nالأخطاء:\n${errorMessage}${moreErrors}`);
      } else {
        alert(`تم استيراد ${successCount} مكتب بنجاح`);
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
    },
    { 
      key: 'name', 
      label: 'اسم المكتب',
      render: (item: BaseModel) => item.get('name'),
    },
    { 
      key: 'floor', 
      label: 'الطابق',
      render: (item: BaseModel) => item.get('floor'),
    },
    { 
      key: 'room', 
      label: 'الغرفة',
      render: (item: BaseModel) => item.get('room'),
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
                <span className="text-3xl relative z-10">🚪</span>
              </div>
              <div className="flex-1">
                <h1 className="text-5xl font-black bg-gradient-to-r from-slate-900 via-primary-700 to-slate-900 bg-clip-text text-transparent mb-2">المكاتب</h1>
                <p className="text-slate-600 text-lg font-semibold">إدارة وإضافة المكاتب في النظام</p>
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
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <Select
              label="الإدارة"
              required
              value={formData.get('department_id')}
              onChange={(e) => {
                const newData = new BaseModel(formData.getData());
                newData.put('department_id', e.target.value);
                setFormData(newData);
              }}
              options={departments.map((dept) => ({
                value: dept.get('id'),
                label: dept.get('name'),
              }))}
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

            <div className="grid grid-cols-2 gap-4">
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
              rows={3}
              placeholder="أدخل أي ملاحظات إضافية"
            />

            <div className="flex justify-end gap-4 pt-6 border-t-2 border-slate-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingOffice(null);
                  setFormData(new BaseModel({ department_id: '', name: '', floor: '', room: '', notes: '' }));
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
                {editingOffice ? "تحديث" : "حفظ"}
              </Button>
            </div>
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
