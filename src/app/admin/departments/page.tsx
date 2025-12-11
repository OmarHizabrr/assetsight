'use client';

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MaterialIcon } from "@/components/icons/MaterialIcon";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { BaseModel } from "@/lib/BaseModel";
import { firestoreApi } from "@/lib/FirestoreApi";
import { useEffect, useState } from "react";

function DepartmentsPageContent() {
  const [departments, setDepartments] = useState<BaseModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<BaseModel | null>(null);
  const [formData, setFormData] = useState<BaseModel>(new BaseModel({
    name: '',
    description: '',
    notes: '',
  }));

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
    } catch (error) {
      console.error("Error saving department:", error);
      alert("حدث خطأ أثناء الحفظ");
    }
  };

  const handleEdit = (dept: BaseModel) => {
    setEditingDepartment(dept);
    setFormData(new BaseModel(dept.getData()));
    setIsModalOpen(true);
  };

  const handleDelete = async (dept: BaseModel) => {
    const id = dept.get('id');
    if (!id) return;
    if (!confirm(`هل أنت متأكد من حذف ${dept.get('name')}؟`)) return;
    
    try {
      const docRef = firestoreApi.getDocument("departments", id);
      await firestoreApi.deleteData(docRef);
      loadDepartments();
    } catch (error) {
      console.error("Error deleting department:", error);
      alert("حدث خطأ أثناء الحذف");
    }
  };

  const columns = [
    { 
      key: 'name', 
      label: 'اسم الإدارة',
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
              <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
                <MaterialIcon name="business" className="text-primary-600" size="3xl" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-medium text-gray-900 mb-1">الإدارات</h1>
                <p className="text-gray-600 text-sm">إدارة وإضافة الإدارات في النظام</p>
              </div>
            </div>
          </div>
          <Button
            onClick={() => {
              setEditingDepartment(null);
              setFormData(new BaseModel({ name: '', description: '', notes: '' }));
              setIsModalOpen(true);
            }}
            size="lg"
            className="normal-case"
          >
            <MaterialIcon name="add" className="text-lg mr-1" size="lg" />
            إضافة إدارة جديدة
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={departments}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
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
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
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
              rows={4}
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
              rows={3}
              placeholder="أدخل أي ملاحظات إضافية"
            />

            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingDepartment(null);
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
                {editingDepartment ? "تحديث" : "حفظ"}
              </Button>
            </div>
          </form>
        </Modal>
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

