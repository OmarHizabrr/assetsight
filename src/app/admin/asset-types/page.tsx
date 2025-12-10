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

function AssetTypesPageContent() {
  const [assetTypes, setAssetTypes] = useState<BaseModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssetType, setEditingAssetType] = useState<BaseModel | null>(null);
  const [formData, setFormData] = useState<BaseModel>(new BaseModel({
    name: '',
    category: '',
    description: '',
    notes: '',
  }));

  useEffect(() => {
    loadAssetTypes();
  }, []);

  const loadAssetTypes = async () => {
    try {
      setLoading(true);
      const docs = await firestoreApi.getDocuments(firestoreApi.getCollection("assetTypes"));
      const data = BaseModel.fromFirestoreArray(docs);
      setAssetTypes(data);
    } catch (error) {
      console.error("Error loading asset types:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = formData.getData();
      if (editingAssetType?.get('id')) {
        const docRef = firestoreApi.getDocument("assetTypes", editingAssetType.get('id'));
        await firestoreApi.updateData(docRef, data);
      } else {
        const newId = firestoreApi.getNewId("assetTypes");
        const docRef = firestoreApi.getDocument("assetTypes", newId);
        await firestoreApi.setData(docRef, data);
      }
      setIsModalOpen(false);
      setEditingAssetType(null);
      setFormData(new BaseModel({ name: '', category: '', description: '', notes: '' }));
      loadAssetTypes();
    } catch (error) {
      console.error("Error saving asset type:", error);
      alert("حدث خطأ أثناء الحفظ");
    }
  };

  const handleEdit = (assetType: BaseModel) => {
    setEditingAssetType(assetType);
    setFormData(new BaseModel(assetType.getData()));
    setIsModalOpen(true);
  };

  const handleDelete = async (assetType: BaseModel) => {
    const id = assetType.get('id');
    if (!id) return;
    if (!confirm(`هل أنت متأكد من حذف ${assetType.get('name')}؟`)) return;
    
    try {
      const docRef = firestoreApi.getDocument("assetTypes", id);
      await firestoreApi.deleteData(docRef);
      loadAssetTypes();
    } catch (error) {
      console.error("Error deleting asset type:", error);
      alert("حدث خطأ أثناء الحذف");
    }
  };

  const columns = [
    { 
      key: 'name', 
      label: 'اسم نوع الأصل',
      render: (item: BaseModel) => item.get('name'),
    },
    { 
      key: 'category', 
      label: 'الفئة',
      render: (item: BaseModel) => item.get('category'),
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
            title="أنواع الأصول"
            subtitle="إدارة وإضافة أنواع الأصول في النظام"
            action={
              <Button
                onClick={() => {
                  setEditingAssetType(null);
                  setFormData(new BaseModel({ name: '', category: '', description: '', notes: '' }));
                  setIsModalOpen(true);
                }}
                leftIcon={<PlusIcon className="w-5 h-5" />}
                size="md"
              >
                إضافة نوع جديد
              </Button>
            }
          />
        </Card>

        <Card>
          <CardBody padding="none">
            <DataTable
              data={assetTypes}
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
            setEditingAssetType(null);
            setFormData(new BaseModel({ name: '', category: '', description: '', notes: '' }));
          }}
          title={editingAssetType ? "تعديل نوع الأصل" : "إضافة نوع جديد"}
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="اسم نوع الأصل"
              type="text"
              required
              value={formData.get('name')}
              onChange={(e) => {
                const newData = new BaseModel(formData.getData());
                newData.put('name', e.target.value);
                setFormData(newData);
              }}
              placeholder="أدخل اسم نوع الأصل"
            />

            <Input
              label="الفئة"
              type="text"
              value={formData.get('category')}
              onChange={(e) => {
                const newData = new BaseModel(formData.getData());
                newData.put('category', e.target.value);
                setFormData(newData);
              }}
              placeholder="أدخل الفئة"
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
                placeholder="أدخل وصف نوع الأصل"
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
                {editingAssetType ? "تحديث" : "حفظ"}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </MainLayout>
  );
}

export default function AssetTypesPage() {
  return (
    <ProtectedRoute>
      <AssetTypesPageContent />
    </ProtectedRoute>
  );
}

