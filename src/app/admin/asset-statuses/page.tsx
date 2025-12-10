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

function AssetStatusesPageContent() {
  const [assetStatuses, setAssetStatuses] = useState<BaseModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<BaseModel | null>(null);
  const [formData, setFormData] = useState<BaseModel>(new BaseModel({
    name: '',
    description: '',
    notes: '',
  }));

  useEffect(() => {
    loadAssetStatuses();
  }, []);

  const loadAssetStatuses = async () => {
    try {
      setLoading(true);
      const docs = await firestoreApi.getDocuments(firestoreApi.getCollection("assetStatuses"));
      const data = BaseModel.fromFirestoreArray(docs);
      setAssetStatuses(data);
    } catch (error) {
      console.error("Error loading asset statuses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = formData.getData();
      if (editingStatus?.get('id')) {
        const docRef = firestoreApi.getDocument("assetStatuses", editingStatus.get('id'));
        await firestoreApi.updateData(docRef, data);
      } else {
        const newId = firestoreApi.getNewId("assetStatuses");
        const docRef = firestoreApi.getDocument("assetStatuses", newId);
        await firestoreApi.setData(docRef, data);
      }
      setIsModalOpen(false);
      setEditingStatus(null);
      setFormData(new BaseModel({ name: '', description: '', notes: '' }));
      loadAssetStatuses();
    } catch (error) {
      console.error("Error saving asset status:", error);
      alert("حدث خطأ أثناء الحفظ");
    }
  };

  const handleEdit = (status: BaseModel) => {
    setEditingStatus(status);
    setFormData(new BaseModel(status.getData()));
    setIsModalOpen(true);
  };

  const handleDelete = async (status: BaseModel) => {
    const id = status.get('id');
    if (!id) return;
    if (!confirm(`هل أنت متأكد من حذف ${status.get('name')}؟`)) return;
    
    try {
      const docRef = firestoreApi.getDocument("assetStatuses", id);
      await firestoreApi.deleteData(docRef);
      loadAssetStatuses();
    } catch (error) {
      console.error("Error deleting asset status:", error);
      alert("حدث خطأ أثناء الحذف");
    }
  };

  const columns = [
    { 
      key: 'name', 
      label: 'اسم الحالة',
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-6">
          <Card variant="flat" className="shadow-elevation-0 bg-white border-0">
            <CardHeader
              title="حالات الأصول"
              subtitle="إدارة وإضافة حالات الأصول في النظام"
              action={
                <Button
                  onClick={() => {
                    setEditingStatus(null);
                    setFormData(new BaseModel({ name: '', description: '', notes: '' }));
                    setIsModalOpen(true);
                  }}
                  leftIcon={<PlusIcon className="w-5 h-5" />}
                  size="md"
                >
                  إضافة حالة جديدة
                </Button>
              }
            />
          </Card>
        </div>

        {/* Data Table Card */}
        <Card variant="elevated" className="shadow-elevation-2">
          <CardBody padding="none">
            <DataTable
              data={assetStatuses}
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
            setEditingStatus(null);
            setFormData(new BaseModel({ name: '', description: '', notes: '' }));
          }}
          title={editingStatus ? "تعديل حالة" : "إضافة حالة جديدة"}
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="اسم الحالة"
              type="text"
              required
              value={formData.get('name')}
              onChange={(e) => {
                const newData = new BaseModel(formData.getData());
                newData.put('name', e.target.value);
                setFormData(newData);
              }}
              placeholder="أدخل اسم الحالة"
            />

            <div className="relative pt-6">
              <label className="block text-xs font-medium text-secondary-600 absolute top-0 right-0 pointer-events-none">
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
                placeholder="أدخل وصف الحالة"
                className="block w-full rounded-md border-b-2 border-t-0 border-l-0 border-r-0 border-secondary-300 bg-transparent px-0 py-2 text-sm text-secondary-900 placeholder-secondary-400 focus:outline-none focus:ring-0 focus:border-primary-500 material-transition disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div className="relative pt-6">
              <label className="block text-xs font-medium text-secondary-600 absolute top-0 right-0 pointer-events-none">
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
                className="block w-full rounded-md border-b-2 border-t-0 border-l-0 border-r-0 border-secondary-300 bg-transparent px-0 py-2 text-sm text-secondary-900 placeholder-secondary-400 focus:outline-none focus:ring-0 focus:border-primary-500 material-transition disabled:opacity-50 disabled:cursor-not-allowed"
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
                {editingStatus ? "تحديث" : "حفظ"}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </MainLayout>
  );
}

export default function AssetStatusesPage() {
  return (
    <ProtectedRoute>
      <AssetStatusesPageContent />
    </ProtectedRoute>
  );
}
