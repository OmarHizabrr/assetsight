'use client';

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PlusIcon } from "@/components/icons";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { BaseModel } from "@/lib/BaseModel";
import { firestoreApi } from "@/lib/FirestoreApi";
import { useEffect, useState } from "react";

function OfficesPageContent() {
  const [offices, setOffices] = useState<BaseModel[]>([]);
  const [departments, setDepartments] = useState<BaseModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffice, setEditingOffice] = useState<BaseModel | null>(null);
  const [formData, setFormData] = useState<BaseModel>(new BaseModel({
    name: '',
    department_id: '',
    floor: '',
    room: '',
    notes: '',
  }));

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

  const handleDelete = async (office: BaseModel) => {
    const id = office.get('id');
    const deptId = office.get('department_id');
    if (!id || !deptId) return;
    if (!confirm(`هل أنت متأكد من حذف ${office.get('name')}؟`)) return;
    
    try {
      const docRef = firestoreApi.getSubDocument(
        "departments",
        deptId,
        "departments",
        id
      );
      await firestoreApi.deleteData(docRef);
      loadData();
    } catch (error) {
      console.error("Error deleting office:", error);
      alert("حدث خطأ أثناء الحذف");
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card variant="flat" className="mb-6">
          <CardHeader
            title="المكاتب"
            subtitle="إدارة وإضافة المكاتب في النظام"
            action={
              <Button
                onClick={() => {
                  setEditingOffice(null);
                  setFormData(new BaseModel({ name: '', department_id: '', floor: '', room: '', notes: '' }));
                  setIsModalOpen(true);
                }}
                leftIcon={<PlusIcon className="w-5 h-5" />}
                size="md"
              >
                إضافة مكتب جديد
              </Button>
            }
          />
        </Card>

        <Card>
          <CardBody padding="none">
            <DataTable
              data={offices}
              columns={columns}
              onEdit={handleEdit}
              onDelete={handleDelete}
              loading={loading}
            />
          </CardBody>
        </Card>

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
          <form onSubmit={handleSubmit} className="space-y-5">
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

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                الملاحظات
              </label>
              <textarea
                value={formData.get('notes')}
                onChange={(e) => {
                  const newData = new BaseModel(formData.getData());
                  newData.put('notes', e.target.value);
                  setFormData(newData);
                }}
                rows={2}
                placeholder="أدخل أي ملاحظات إضافية"
                className="block w-full rounded-lg border border-secondary-300 px-4 py-2.5 text-sm text-secondary-900 placeholder-secondary-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                size="md"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
              >
                {editingOffice ? "تحديث" : "حفظ"}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
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
