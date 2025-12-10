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
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
                <span className="text-2xl">🚪</span>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">المكاتب</h1>
                <p className="text-slate-600 text-base mt-1 font-medium">إدارة وإضافة المكاتب في النظام</p>
              </div>
            </div>
          </div>
          <Button
            onClick={() => {
              setEditingOffice(null);
              setFormData(new BaseModel({ name: '', department_id: '', floor: '', room: '', notes: '' }));
              setIsModalOpen(true);
            }}
            leftIcon={<PlusIcon className="w-5 h-5" />}
            size="lg"
            className="shadow-xl shadow-primary-500/30 hover:shadow-2xl hover:shadow-primary-500/40 hover:scale-105 material-transition"
          >
            إضافة مكتب جديد
          </Button>
        </div>
      </div>

      {/* Data Table Card */}
      <Card variant="elevated" className="shadow-2xl border-0 bg-white/80 backdrop-blur-xl overflow-hidden">
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
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                الملاحظات
              </label>
              <textarea
                value={formData.get('notes')}
                onChange={(e) => {
                  const newData = new BaseModel(formData.getData());
                  newData.put('notes', e.target.value);
                  setFormData(newData);
                }}
                rows={3}
                placeholder="أدخل أي ملاحظات إضافية"
                className="block w-full rounded-xl border-2 border-slate-200 bg-white/80 backdrop-blur-sm px-4 py-3 text-sm font-medium material-transition focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white shadow-sm focus:shadow-md disabled:opacity-50 disabled:cursor-not-allowed resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-secondary-300">
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
