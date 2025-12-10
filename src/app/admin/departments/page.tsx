'use client';

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MainLayout } from "@/components/layout/MainLayout";
import { DataTable } from "@/components/ui/DataTable";
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
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">الإدارات</h1>
          <button
            onClick={() => {
              setEditingDepartment(null);
              setFormData(new BaseModel({ name: '', description: '', notes: '' }));
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            إضافة إدارة جديدة
          </button>
        </div>

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
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                اسم الإدارة <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.get('name')}
                onChange={(e) => {
                  const newData = new BaseModel(formData.getData());
                  newData.put('name', e.target.value);
                  setFormData(newData);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex justify-end space-x-2 space-x-reverse pt-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-white bg-primary-600 rounded-lg hover:bg-primary-700"
              >
                حفظ
              </button>
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

