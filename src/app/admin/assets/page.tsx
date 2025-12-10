'use client';

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PlusIcon } from "@/components/icons";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { DataTable } from "@/components/ui/DataTable";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { BaseModel } from "@/lib/BaseModel";
import { firestoreApi } from "@/lib/FirestoreApi";
import { useEffect, useState } from "react";

function AssetsPageContent() {
  const [assets, setAssets] = useState<BaseModel[]>([]);
  const [assetNames, setAssetNames] = useState<BaseModel[]>([]);
  const [assetTypes, setAssetTypes] = useState<BaseModel[]>([]);
  const [assetStatuses, setAssetStatuses] = useState<BaseModel[]>([]);
  const [offices, setOffices] = useState<BaseModel[]>([]);
  const [users, setUsers] = useState<BaseModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<BaseModel | null>(null);
  const [formData, setFormData] = useState<BaseModel>(new BaseModel({
    asset_name_id: '',
    asset_tag: '',
    serial_number: '',
    type_id: '',
    status_id: '',
    category: '',
    description: '',
    purchase_date: '',
    purchase_value: 0,
    current_value: 0,
    location_office_id: '',
    custodian_user_id: '',
    warranty_end: '',
    depreciation_method: '',
    expected_lifetime_years: 0,
    residual_value: 0,
    supplier: '',
    invoice_number: '',
    last_maintenance_date: '',
    is_active: true,
    notes: '',
  }));

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // جلب البيانات الأساسية
      const [
        assetDocs,
        assetNameDocs,
        assetTypeDocs,
        assetStatusDocs,
        deptDocs,
      ] = await Promise.all([
        firestoreApi.getDocuments(firestoreApi.getCollection("assets")),
        firestoreApi.getDocuments(firestoreApi.getCollection("assetNames")),
        firestoreApi.getDocuments(firestoreApi.getCollection("assetTypes")),
        firestoreApi.getDocuments(firestoreApi.getCollection("assetStatuses")),
        firestoreApi.getDocuments(firestoreApi.getCollection("departments")),
      ]);
      
      setAssets(BaseModel.fromFirestoreArray(assetDocs));
      setAssetNames(BaseModel.fromFirestoreArray(assetNameDocs));
      setAssetTypes(BaseModel.fromFirestoreArray(assetTypeDocs));
      setAssetStatuses(BaseModel.fromFirestoreArray(assetStatusDocs));
      
      // جلب جميع المكاتب من جميع الإدارات
      const allOffices: BaseModel[] = [];
      const allUsers: BaseModel[] = [];
      
      for (const dept of BaseModel.fromFirestoreArray(deptDocs)) {
        const deptId = dept.get('id');
        if (deptId) {
          // جلب المكاتب
          const subCollectionRef = firestoreApi.getSubCollection("departments", deptId, "departments");
          const officeDocs = await firestoreApi.getDocuments(subCollectionRef);
          const offices = BaseModel.fromFirestoreArray(officeDocs);
          offices.forEach(office => {
            office.put('department_id', deptId);
            allOffices.push(office);
          });
          
          // جلب المستخدمين من المكاتب
          for (const office of offices) {
            const officeId = office.get('id');
            if (officeId) {
              const nestedSubCollectionRef = firestoreApi.getNestedSubCollection(
                "departments",
                deptId,
                "departments",
                officeId,
                "users"
              );
              const userDocs = await firestoreApi.getDocuments(nestedSubCollectionRef);
              const users = BaseModel.fromFirestoreArray(userDocs);
              users.forEach(user => {
                user.put('office_id', officeId);
                allUsers.push(user);
              });
            }
          }
        }
      }
      
      setOffices(allOffices);
      setUsers(allUsers);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateAssetTag = () => {
    const prefix = 'AST';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${timestamp}-${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = formData.getData();
      data.is_active = formData.getValue<boolean>('is_active') ? 1 : 0;
      data.purchase_value = formData.getValue<number>('purchase_value') || 0;
      data.current_value = formData.getValue<number>('current_value') || 0;
      data.expected_lifetime_years = formData.getValue<number>('expected_lifetime_years') || 0;
      data.residual_value = formData.getValue<number>('residual_value') || 0;
      
      const assetId = editingAsset?.get('id');
      if (assetId) {
        const docRef = firestoreApi.getDocument("assets", assetId);
        await firestoreApi.updateData(docRef, data);
      } else {
        const newId = firestoreApi.getNewId("assets");
        if (!data.asset_tag) {
          data.asset_tag = generateAssetTag();
        }
        const docRef = firestoreApi.getDocument("assets", newId);
        await firestoreApi.setData(docRef, data);
      }
      setIsModalOpen(false);
      setEditingAsset(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error("Error saving asset:", error);
      alert("حدث خطأ أثناء الحفظ");
    }
  };

  const resetForm = () => {
    setFormData(new BaseModel({
      asset_name_id: '',
      asset_tag: '',
      serial_number: '',
      type_id: '',
      status_id: '',
      category: '',
      description: '',
      purchase_date: '',
      purchase_value: 0,
      current_value: 0,
      location_office_id: '',
      custodian_user_id: '',
      warranty_end: '',
      depreciation_method: '',
      expected_lifetime_years: 0,
      residual_value: 0,
      supplier: '',
      invoice_number: '',
      last_maintenance_date: '',
      is_active: true,
      notes: '',
    }));
  };

  const handleEdit = (asset: BaseModel) => {
    setEditingAsset(asset);
    const assetData = asset.getData();
    assetData.is_active = asset.getValue<number>('is_active') === 1 || asset.getValue<boolean>('is_active') === true;
    setFormData(new BaseModel(assetData));
    setIsModalOpen(true);
  };

  const handleDelete = async (asset: BaseModel) => {
    const id = asset.get('id');
    if (!id) return;
    if (!confirm(`هل أنت متأكد من حذف الأصل ${asset.get('asset_tag')}؟`)) return;
    
    try {
      const docRef = firestoreApi.getDocument("assets", id);
      await firestoreApi.deleteData(docRef);
      loadData();
    } catch (error) {
      console.error("Error deleting asset:", error);
      alert("حدث خطأ أثناء الحذف");
    }
  };

  const getAssetName = (id?: string) => {
    if (!id) return '-';
    const name = assetNames.find(n => n.get('id') === id);
    return name?.get('name') || '-';
  };

  const getAssetType = (id?: string) => {
    if (!id) return '-';
    const type = assetTypes.find(t => t.get('id') === id);
    return type?.get('name') || '-';
  };

  const getAssetStatus = (id?: string) => {
    if (!id) return '-';
    const status = assetStatuses.find(s => s.get('id') === id);
    return status?.get('name') || '-';
  };

  const getOfficeName = (id?: string) => {
    if (!id) return '-';
    const office = offices.find(o => o.get('id') === id);
    return office?.get('name') || '-';
  };

  const getUserName = (id?: string) => {
    if (!id) return '-';
    const user = users.find(u => u.get('id') === id);
    return user?.get('full_name') || '-';
  };

  const updateField = (key: string, value: any) => {
    const newData = new BaseModel(formData.getData());
    newData.put(key, value);
    setFormData(newData);
  };

  const columns = [
    { 
      key: 'asset_tag', 
      label: 'كود الأصل',
      render: (item: BaseModel) => item.get('asset_tag'),
    },
    { 
      key: 'asset_name_id', 
      label: 'اسم الأصل',
      render: (item: BaseModel) => getAssetName(item.get('asset_name_id')),
    },
    { 
      key: 'type_id', 
      label: 'النوع',
      render: (item: BaseModel) => getAssetType(item.get('type_id')),
    },
    { 
      key: 'status_id', 
      label: 'الحالة',
      render: (item: BaseModel) => getAssetStatus(item.get('status_id')),
    },
    { 
      key: 'location_office_id', 
      label: 'المكتب',
      render: (item: BaseModel) => getOfficeName(item.get('location_office_id')),
    },
    { 
      key: 'custodian_user_id', 
      label: 'حامل الأصل',
      render: (item: BaseModel) => getUserName(item.get('custodian_user_id')),
    },
    { 
      key: 'purchase_value', 
      label: 'قيمة الشراء',
      render: (item: BaseModel) => item.getValue<number>('purchase_value')?.toLocaleString('ar-SA') || '0',
    },
  ];

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card variant="flat" className="mb-6">
          <CardHeader
            title="الأصول"
            subtitle="إدارة وإضافة الأصول في النظام"
            action={
              <Button
                onClick={() => {
                  setEditingAsset(null);
                  resetForm();
                  setIsModalOpen(true);
                }}
                leftIcon={<PlusIcon className="w-5 h-5" />}
                size="md"
              >
                إضافة أصل جديد
              </Button>
            }
          />
        </Card>

        <Card>
          <CardBody padding="none">
            <DataTable
              data={assets}
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
            setEditingAsset(null);
            resetForm();
          }}
          title={editingAsset ? "تعديل أصل" : "إضافة أصل جديد"}
          size="xl"
        >
          <form onSubmit={handleSubmit} className="space-y-5 max-h-[80vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="اسم الأصل"
                required
                value={formData.get('asset_name_id')}
                onChange={(e) => updateField('asset_name_id', e.target.value)}
                options={assetNames.map((name) => ({
                  value: name.get('id'),
                  label: name.get('name'),
                }))}
              />
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                  كود الأصل <span className="text-error-500">*</span>
                </label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    required
                    value={formData.get('asset_tag')}
                    onChange={(e) => updateField('asset_tag', e.target.value)}
                    placeholder="سيتم توليده تلقائياً"
                    className="flex-1"
                  />
                  {!editingAsset && (
                    <Button
                      type="button"
                      variant="outline"
                      size="md"
                      onClick={() => updateField('asset_tag', generateAssetTag())}
                    >
                      توليد
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="نوع الأصل"
                required
                value={formData.get('type_id')}
                onChange={(e) => updateField('type_id', e.target.value)}
                options={assetTypes.map((type) => ({
                  value: type.get('id'),
                  label: type.get('name'),
                }))}
              />
              <Select
                label="حالة الأصل"
                required
                value={formData.get('status_id')}
                onChange={(e) => updateField('status_id', e.target.value)}
                options={assetStatuses.map((status) => ({
                  value: status.get('id'),
                  label: status.get('name'),
                }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="المكتب الحالي"
                required
                value={formData.get('location_office_id')}
                onChange={(e) => updateField('location_office_id', e.target.value)}
                options={offices.map((office) => ({
                  value: office.get('id'),
                  label: office.get('name'),
                }))}
              />
              <Select
                label="حامل الأصل"
                value={formData.get('custodian_user_id')}
                onChange={(e) => updateField('custodian_user_id', e.target.value)}
                options={users.map((user) => ({
                  value: user.get('id'),
                  label: user.get('full_name'),
                }))}
              />
            </div>
            <Input
              label="الرقم التسلسلي"
              type="text"
              value={formData.get('serial_number')}
              onChange={(e) => updateField('serial_number', e.target.value)}
              placeholder="أدخل الرقم التسلسلي"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="تاريخ الشراء"
                type="date"
                value={formData.get('purchase_date')}
                onChange={(e) => updateField('purchase_date', e.target.value)}
              />
              <Input
                label="نهاية الضمان"
                type="date"
                value={formData.get('warranty_end')}
                onChange={(e) => updateField('warranty_end', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="قيمة الشراء"
                type="number"
                step="0.01"
                value={formData.getValue<number>('purchase_value') || 0}
                onChange={(e) => updateField('purchase_value', parseFloat(e.target.value) || 0)}
              />
              <Input
                label="القيمة الحالية"
                type="number"
                step="0.01"
                value={formData.getValue<number>('current_value') || 0}
                onChange={(e) => updateField('current_value', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="الفئة"
                type="text"
                value={formData.get('category')}
                onChange={(e) => updateField('category', e.target.value)}
                placeholder="أدخل الفئة"
              />
              <Input
                label="المورد"
                type="text"
                value={formData.get('supplier')}
                onChange={(e) => updateField('supplier', e.target.value)}
                placeholder="أدخل اسم المورد"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="رقم الفاتورة"
                type="text"
                value={formData.get('invoice_number')}
                onChange={(e) => updateField('invoice_number', e.target.value)}
                placeholder="أدخل رقم الفاتورة"
              />
              <Input
                label="تاريخ آخر صيانة"
                type="date"
                value={formData.get('last_maintenance_date')}
                onChange={(e) => updateField('last_maintenance_date', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="طريقة الإهلاك"
                type="text"
                value={formData.get('depreciation_method')}
                onChange={(e) => updateField('depreciation_method', e.target.value)}
                placeholder="مثل: خطي، متسارع، إلخ"
              />
              <Input
                label="عمر الخدمة المتوقع (بالسنوات)"
                type="number"
                value={formData.getValue<number>('expected_lifetime_years') || 0}
                onChange={(e) => updateField('expected_lifetime_years', parseFloat(e.target.value) || 0)}
              />
            </div>
            <Input
              label="القيمة المتبقية"
              type="number"
              step="0.01"
              value={formData.getValue<number>('residual_value') || 0}
              onChange={(e) => updateField('residual_value', parseFloat(e.target.value) || 0)}
            />
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                الوصف
              </label>
              <textarea
                value={formData.get('description')}
                onChange={(e) => updateField('description', e.target.value)}
                rows={3}
                placeholder="أدخل وصف الأصل"
                className="block w-full rounded-lg border border-secondary-300 px-4 py-2.5 text-sm text-secondary-900 placeholder-secondary-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <Checkbox
              label="نشط"
              checked={formData.getValue<boolean>('is_active') === true || formData.getValue<number>('is_active') === 1}
              onChange={(e) => updateField('is_active', e.target.checked)}
            />
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                الملاحظات
              </label>
              <textarea
                value={formData.get('notes')}
                onChange={(e) => updateField('notes', e.target.value)}
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
                {editingAsset ? "تحديث" : "حفظ"}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </MainLayout>
  );
}

export default function AssetsPage() {
  return (
    <ProtectedRoute>
      <AssetsPageContent />
    </ProtectedRoute>
  );
}
