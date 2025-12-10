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

function CategoriesPageContent() {
  const [categories, setCategories] = useState<BaseModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BaseModel | null>(null);
  const [formData, setFormData] = useState<BaseModel>(new BaseModel({
    name: '',
    description: '',
    notes: '',
  }));

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
      loadCategories();
    } catch (error) {
      console.error("Error saving category:", error);
      alert("حدث خطأ أثناء الحفظ");
    }
  };

  const handleEdit = (category: BaseModel) => {
    setEditingCategory(category);
    setFormData(new BaseModel(category.getData()));
    setIsModalOpen(true);
  };

  const handleDelete = async (category: BaseModel) => {
    const id = category.get('id');
    if (!id) return;
    if (!confirm(`هل أنت متأكد من حذف ${category.get('name')}؟`)) return;
    
    try {
      const docRef = firestoreApi.getDocument("categories", id);
      await firestoreApi.deleteData(docRef);
      loadCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("حدث خطأ أثناء الحذف");
    }
  };

  const columns = [
    { 
      key: 'name', 
      label: 'اسم الفئة',
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
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <Card variant="flat" className="mb-6">
          <CardHeader
            title="الفئات"
            subtitle="إدارة وإضافة الفئات في النظام"
            action={
              <Button
                onClick={() => {
                  setEditingCategory(null);
                  setFormData(new BaseModel({ name: '', description: '', notes: '' }));
                  setIsModalOpen(true);
                }}
                leftIcon={<PlusIcon className="w-5 h-5" />}
                size="md"
              >
                إضافة فئة جديدة
              </Button>
            }
          />
        </Card>

        <Card>
          <CardBody padding="none">
            <DataTable
              data={categories}
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
            setEditingCategory(null);
            setFormData(new BaseModel({ name: '', description: '', notes: '' }));
          }}
          title={editingCategory ? "تعديل فئة" : "إضافة فئة جديدة"}
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
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
                placeholder="أدخل وصف الفئة"
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
                {editingCategory ? "تحديث" : "حفظ"}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
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
