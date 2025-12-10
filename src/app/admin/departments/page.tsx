'use client';

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PlusIcon } from "@/components/icons";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card variant="flat" className="mb-6">
          <CardHeader
            title="الإدارات"
            subtitle="إدارة وإضافة الإدارات في النظام"
            action={
              <Button
                onClick={() => {
                  setEditingDepartment(null);
                  setFormData(new BaseModel({ name: '', description: '', notes: '' }));
                  setIsModalOpen(true);
                }}
                leftIcon={<PlusIcon className="w-5 h-5" />}
                size="md"
              >
                إضافة إدارة جديدة
              </Button>
            }
          />
        </Card>

        <Card>
          <CardBody padding="none">
            <DataTable
              data={departments}
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
            setEditingDepartment(null);
            setFormData(new BaseModel({ name: '', description: '', notes: '' }));
          }}
          title={editingDepartment ? "تعديل إدارة" : "إضافة إدارة جديدة"}
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
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

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                الوصف
              </label>
              <textarea
                value={formData.get('description')}
                onChange={(e) => {
                  const newData = new BaseModel(formData.getData());
                  newData.put('description', e.target.value);
                  setFormData(newData);
                }}
                rows={3}
                placeholder="أدخل وصف الإدارة"
                className="block w-full rounded-lg border border-secondary-300 px-4 py-2.5 text-sm text-secondary-900 placeholder-secondary-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
                {editingDepartment ? "تحديث" : "حفظ"}
              </Button>
            </div>
          </form>
        </Modal>
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

