'use client';

import { ProtectedRoute, usePermissions } from "@/components/auth/ProtectedRoute";
import { PlusIcon } from "@/components/icons";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { DataTable } from "@/components/ui/DataTable";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { Textarea } from "@/components/ui/Textarea";
import { BaseModel } from "@/lib/BaseModel";
import { firestoreApi } from "@/lib/FirestoreApi";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

function AssetsPageContent() {
  const pathname = usePathname();
  const { canAdd, canEdit, canDelete } = usePermissions(pathname || '/admin/assets');
  const [assets, setAssets] = useState<BaseModel[]>([]);
  const [assetNames, setAssetNames] = useState<BaseModel[]>([]);
  const [assetTypes, setAssetTypes] = useState<BaseModel[]>([]);
  const [assetStatuses, setAssetStatuses] = useState<BaseModel[]>([]);
  const [departments, setDepartments] = useState<BaseModel[]>([]);
  const [allOffices, setAllOffices] = useState<BaseModel[]>([]);
  const [offices, setOffices] = useState<BaseModel[]>([]);
  const [users, setUsers] = useState<BaseModel[]>([]);
  const [currencies, setCurrencies] = useState<BaseModel[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [deletingAsset, setDeletingAsset] = useState<BaseModel | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editingAsset, setEditingAsset] = useState<BaseModel | null>(null);
  const [formData, setFormData] = useState<BaseModel>(new BaseModel({
    department_id: '',
    asset_name_id: '',
    asset_tag: '',
    serial_number: '',
    type_id: '',
    status_id: '',
    category: '',
    description: '',
    purchase_date: '',
    purchase_value: 0,
    currency_id: '',
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
      
      const departmentsData = BaseModel.fromFirestoreArray(deptDocs);
      setDepartments(departmentsData);
      
      // جلب جميع المكاتب من جميع الإدارات
      const officesList: BaseModel[] = [];
      
      for (const dept of departmentsData) {
        const deptId = dept.get('id');
        if (deptId) {
          // جلب المكاتب
          const subCollectionRef = firestoreApi.getSubCollection("departments", deptId, "departments");
          const officeDocs = await firestoreApi.getDocuments(subCollectionRef);
          const offices = BaseModel.fromFirestoreArray(officeDocs);
          offices.forEach(office => {
            office.put('department_id', deptId);
            officesList.push(office);
          });
        }
      }
      
      setAllOffices(officesList);
      setOffices([]); // لا تظهر المكاتب حتى يتم اختيار الإدارة
      
      // جلب جميع المستخدمين من الجدول المستقل users/userId/
      const userDocs = await firestoreApi.getDocuments(firestoreApi.getCollection("users"));
      const usersData = BaseModel.fromFirestoreArray(userDocs);
      setUsers(usersData);
      
      // جلب جميع العملات
      const currencyDocs = await firestoreApi.getDocuments(firestoreApi.getCollection("currencies"));
      const currenciesData = BaseModel.fromFirestoreArray(currencyDocs);
      setCurrencies(currenciesData);
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
      department_id: '',
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
      currency_id: '',
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
    setSelectedDepartmentId('');
    setOffices([]);
  };
  
  // تعيين العملة الافتراضية عند فتح النموذج
  useEffect(() => {
    if (isModalOpen && !editingAsset && currencies.length > 0) {
      const defaultCurrency = currencies.find(c => 
        c.getValue<number>('is_default') === 1 || c.getValue<boolean>('is_default') === true
      );
      if (defaultCurrency && !formData.get('currency_id')) {
        updateField('currency_id', defaultCurrency.get('id'));
      }
    }
  }, [isModalOpen, currencies, editingAsset]);

  const handleEdit = async (asset: BaseModel) => {
    setEditingAsset(asset);
    const assetData = asset.getData();
    assetData.is_active = asset.getValue<number>('is_active') === 1 || asset.getValue<boolean>('is_active') === true;
    
    // البحث عن الإدارة من خلال المكتب
    const officeId = asset.get('location_office_id');
    if (officeId) {
      const office = allOffices.find(o => o.get('id') === officeId);
      if (office) {
        const deptId = office.get('department_id');
        if (deptId) {
          assetData.department_id = deptId;
          setSelectedDepartmentId(deptId);
          // تصفية المكاتب حسب الإدارة
          const filteredOffices = allOffices.filter(o => o.get('department_id') === deptId);
          setOffices(filteredOffices);
        }
      }
    }
    
    setFormData(new BaseModel(assetData));
    setIsModalOpen(true);
  };
  
  // عند تغيير الإدارة، تصفية المكاتب
  const handleDepartmentChange = (departmentId: string) => {
    setSelectedDepartmentId(departmentId);
    updateField('department_id', departmentId);
    updateField('location_office_id', ''); // مسح اختيار المكتب عند تغيير الإدارة
    
    if (departmentId) {
      // تصفية المكاتب حسب الإدارة المختارة
      const filteredOffices = allOffices.filter(office => office.get('department_id') === departmentId);
      setOffices(filteredOffices);
    } else {
      setOffices([]);
    }
  };

  const handleDelete = (asset: BaseModel) => {
    setDeletingAsset(asset);
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingAsset) return;
    const id = deletingAsset.get('id');
    if (!id) return;
    
    try {
      setDeleteLoading(true);
      const docRef = firestoreApi.getDocument("assets", id);
      await firestoreApi.deleteData(docRef);
      loadData();
      setIsConfirmModalOpen(false);
      setDeletingAsset(null);
    } catch (error) {
      console.error("Error deleting asset:", error);
      alert("حدث خطأ أثناء الحذف");
    } finally {
      setDeleteLoading(false);
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

  const getCurrencyName = (id?: string) => {
    if (!id) return '-';
    const currency = currencies.find(c => c.get('id') === id);
    return currency ? `${currency.get('name')} (${currency.get('code')})` : '-';
  };

  const getCurrencySymbol = (id?: string) => {
    if (!id) return 'ر.س';
    const currency = currencies.find(c => c.get('id') === id);
    return currency?.get('symbol') || currency?.get('code') || 'ر.س';
  };

  const getDepartmentName = (officeId?: string) => {
    if (!officeId) return '-';
    const office = allOffices.find(o => o.get('id') === officeId);
    if (!office) return '-';
    const deptId = office.get('department_id');
    if (!deptId) return '-';
    const dept = departments.find(d => d.get('id') === deptId);
    return dept?.get('name') || '-';
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
      key: 'department', 
      label: 'الإدارة',
      render: (item: BaseModel) => getDepartmentName(item.get('location_office_id')),
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
      render: (item: BaseModel) => {
        const value = item.getValue<number>('purchase_value') || 0;
        const currencyId = item.get('currency_id');
        const symbol = getCurrencySymbol(currencyId);
        return (
          <span className="font-semibold text-secondary-900">
            {value.toLocaleString('ar-SA')} <span className="text-xs text-secondary-500 font-normal">{symbol}</span>
          </span>
        );
      },
    },
    { 
      key: 'currency_id', 
      label: 'العملة',
      render: (item: BaseModel) => getCurrencyName(item.get('currency_id')),
    },
  ];

  return (
    <MainLayout>
      {/* Page Header */}
      <div className="mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-6">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 flex items-center justify-center shadow-2xl shadow-primary-500/40 relative overflow-hidden group hover:scale-105 material-transition">
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-transparent opacity-0 group-hover:opacity-100 material-transition"></div>
                <span className="text-3xl relative z-10">💼</span>
              </div>
              <div className="flex-1">
                <h1 className="text-5xl font-black bg-gradient-to-r from-slate-900 via-primary-700 to-slate-900 bg-clip-text text-transparent mb-2">الأصول</h1>
                <p className="text-slate-600 text-lg font-semibold">إدارة وإضافة الأصول في النظام</p>
              </div>
            </div>
          </div>
          {canAdd && (
            <Button
              onClick={() => {
                setEditingAsset(null);
                resetForm();
                setIsModalOpen(true);
              }}
              leftIcon={<PlusIcon className="w-5 h-5" />}
              size="lg"
              variant="primary"
              className="shadow-2xl shadow-primary-500/40 hover:shadow-2xl hover:shadow-primary-500/50 hover:scale-105 material-transition font-bold"
            >
              إضافة أصل جديد
            </Button>
          )}
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={assets}
        columns={columns}
        onEdit={canEdit ? handleEdit : undefined}
        onDelete={canDelete ? handleDelete : undefined}
        loading={loading}
      />

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
          <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
            <SearchableSelect
              label="الإدارة"
              required
              value={formData.get('department_id') || selectedDepartmentId}
              onChange={(value) => handleDepartmentChange(value)}
              options={departments.map((dept) => ({
                value: dept.get('id'),
                label: dept.get('name'),
              }))}
              placeholder="اختر الإدارة"
            />
            <SearchableSelect
              label="المكتب الحالي"
              required
              value={formData.get('location_office_id')}
              onChange={(value) => updateField('location_office_id', value)}
              disabled={!selectedDepartmentId || offices.length === 0}
              options={offices.map((office) => ({
                value: office.get('id'),
                label: office.get('name'),
              }))}
              placeholder={!selectedDepartmentId ? "اختر الإدارة أولاً" : offices.length === 0 ? "لا توجد مكاتب في هذه الإدارة" : "اختر المكتب"}
            />
            <div className="grid grid-cols-2 gap-4">
              <SearchableSelect
                label="اسم الأصل"
                required
                value={formData.get('asset_name_id')}
                onChange={(value) => updateField('asset_name_id', value)}
                options={assetNames.map((name) => ({
                  value: name.get('id'),
                  label: name.get('name'),
                }))}
                placeholder="اختر اسم الأصل"
              />
              <div>
                <Input
                  type="text"
                  label="كود الأصل"
                  required
                  value={formData.get('asset_tag')}
                  onChange={(e) => updateField('asset_tag', e.target.value)}
                  placeholder="سيتم توليده تلقائياً"
                  className="flex-1"
                />
                {!editingAsset && (
                  <div className="mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => updateField('asset_tag', generateAssetTag())}
                    >
                      توليد
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <SearchableSelect
                label="نوع الأصل"
                required
                value={formData.get('type_id')}
                onChange={(value) => updateField('type_id', value)}
                options={assetTypes.map((type) => ({
                  value: type.get('id'),
                  label: type.get('name'),
                }))}
                placeholder="اختر نوع الأصل"
              />
              <SearchableSelect
                label="حالة الأصل"
                required
                value={formData.get('status_id')}
                onChange={(value) => updateField('status_id', value)}
                options={assetStatuses.map((status) => ({
                  value: status.get('id'),
                  label: status.get('name'),
                }))}
                placeholder="اختر حالة الأصل"
              />
            </div>
            <SearchableSelect
              label="حامل الأصل"
              value={formData.get('custodian_user_id')}
              onChange={(value) => updateField('custodian_user_id', value)}
              options={users.map((user) => ({
                value: user.get('id'),
                label: user.get('full_name'),
              }))}
              placeholder="اختر حامل الأصل"
            />
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
              <div>
                <Input
                  label="قيمة الشراء"
                  type="number"
                  step="0.01"
                  value={formData.getValue<number>('purchase_value') || 0}
                  onChange={(e) => updateField('purchase_value', parseFloat(e.target.value) || 0)}
                />
              </div>
              <SearchableSelect
                label="العملة"
                value={formData.get('currency_id')}
                onChange={(value) => updateField('currency_id', value)}
                options={currencies.map((currency) => ({
                  value: currency.get('id'),
                  label: `${currency.get('name')} (${currency.get('code')})`,
                }))}
                placeholder="اختر العملة"
              />
            </div>
            <Input
              label="القيمة الحالية"
              type="number"
              step="0.01"
              value={formData.getValue<number>('current_value') || 0}
              onChange={(e) => updateField('current_value', parseFloat(e.target.value) || 0)}
            />
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
            <Textarea
              label="الوصف"
              value={formData.get('description')}
              onChange={(e) => updateField('description', e.target.value)}
              rows={4}
              placeholder="أدخل وصف الأصل"
            />
            <Checkbox
              label="نشط"
              checked={formData.getValue<boolean>('is_active') === true || formData.getValue<number>('is_active') === 1}
              onChange={(e) => updateField('is_active', e.target.checked)}
            />
            <Textarea
              label="الملاحظات"
              value={formData.get('notes')}
              onChange={(e) => updateField('notes', e.target.value)}
              rows={3}
              placeholder="أدخل أي ملاحظات إضافية"
            />
            <div className="flex justify-end gap-4 pt-6 border-t-2 border-slate-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                size="lg"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="lg"
              >
                {editingAsset ? "تحديث" : "حفظ"}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Confirm Delete Modal */}
        <ConfirmModal
          isOpen={isConfirmModalOpen}
          onClose={() => {
            setIsConfirmModalOpen(false);
            setDeletingAsset(null);
          }}
          onConfirm={confirmDelete}
          title="تأكيد الحذف"
          message={`هل أنت متأكد من حذف الأصل ${deletingAsset?.get('asset_tag') || 'هذا الأصل'}؟ لا يمكن التراجع عن هذا الإجراء.`}
          confirmText="حذف"
          cancelText="إلغاء"
          variant="danger"
          loading={deleteLoading}
        />
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
