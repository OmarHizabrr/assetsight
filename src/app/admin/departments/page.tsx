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
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
                <span className="text-2xl">🏢</span>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">الإدارات</h1>
                <p className="text-slate-600 text-base mt-1 font-medium">إدارة وإضافة الإدارات في النظام</p>
              </div>
            </div>
          </div>
          <Button
            onClick={() => {
              setEditingDepartment(null);
              setFormData(new BaseModel({ name: '', description: '', notes: '' }));
              setIsModalOpen(true);
            }}
            leftIcon={<PlusIcon className="w-5 h-5" />}
            size="lg"
            className="shadow-xl shadow-primary-500/30 hover:shadow-2xl hover:shadow-primary-500/40 hover:scale-105 material-transition"
          >
            إضافة إدارة جديدة
          </Button>
        </div>
      </div>

      {/* Data Table Card */}
      <Card variant="elevated" className="shadow-2xl border-0 bg-white/80 backdrop-blur-xl overflow-hidden">
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
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                الوصف
              </label>
              <textarea
                value={formData.get('description')}
                onChange={(e) => {
                  const newData = new BaseModel(formData.getData());
                  newData.put('description', e.target.value);
                  setFormData(newData);
                }}
                rows={4}
                placeholder="أدخل وصف الإدارة"
                className="block w-full rounded-xl border-2 border-slate-200 bg-white/80 backdrop-blur-sm px-4 py-3 text-sm font-medium material-transition focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white shadow-sm focus:shadow-md disabled:opacity-50 disabled:cursor-not-allowed resize-none"
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

