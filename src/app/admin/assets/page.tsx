'use client';

import { ProtectedRoute, usePermissions } from "@/components/auth/ProtectedRoute";
import { MaterialIcon } from "@/components/icons/MaterialIcon";
import { MainLayout } from "@/components/layout/MainLayout";
import { BulkEditModal } from "@/components/ui/BulkEditModal";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { DataTable } from "@/components/ui/DataTable";
import { ImportExcelModal } from "@/components/ui/ImportExcelModal";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/contexts/ToastContext";
import { BaseModel } from "@/lib/BaseModel";
import { firestoreApi } from "@/lib/FirestoreApi";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

function AssetsPageContent() {
  const pathname = usePathname();
  const { canAdd, canEdit, canDelete } = usePermissions(pathname || '/admin/assets');
  const { showSuccess, showError, showWarning } = useToast();
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
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [deletingAssets, setDeletingAssets] = useState<BaseModel[]>([]);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const [editingAsset, setEditingAsset] = useState<BaseModel | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [bulkEditLoading, setBulkEditLoading] = useState(false);
  const [selectedAssetsForBulkEdit, setSelectedAssetsForBulkEdit] = useState<BaseModel[]>([]);
  const [bulkEditFormDataArray, setBulkEditFormDataArray] = useState<BaseModel[]>([]);
  const [bulkEditNewAssetNames, setBulkEditNewAssetNames] = useState<Record<number, string>>({});
  const [bulkEditNewAssetTypes, setBulkEditNewAssetTypes] = useState<Record<number, string>>({});
  const [bulkEditNewAssetStatuses, setBulkEditNewAssetStatuses] = useState<Record<number, string>>({});
  const [bulkEditSelectedDepartmentIds, setBulkEditSelectedDepartmentIds] = useState<Record<number, string>>({});
  const [bulkEditOfficesMap, setBulkEditOfficesMap] = useState<Record<number, BaseModel[]>>({});
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetType, setNewAssetType] = useState('');
  const [newAssetStatus, setNewAssetStatus] = useState('');
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
      
      // إضافة اسم الأصل إذا كان جديداً
      let assetNameId = data.asset_name_id;
      if (!assetNameId && newAssetName.trim()) {
        const existingName = assetNames.find(n => n.get('name') === newAssetName.trim());
        if (existingName) {
          assetNameId = existingName.get('id') || '';
        } else {
          const newAssetNameId = firestoreApi.getNewId("assetNames");
          const assetNameDocRef = firestoreApi.getDocument("assetNames", newAssetNameId);
          await firestoreApi.setData(assetNameDocRef, {
            name: newAssetName.trim(),
            description: '',
            notes: '',
          });
          assetNameId = newAssetNameId;
          // إضافة إلى القائمة المحلية
          const newName = new BaseModel({ id: newAssetNameId, name: newAssetName.trim() });
          setAssetNames(prev => [...prev, newName]);
        }
        data.asset_name_id = assetNameId;
      }

      // إضافة نوع الأصل إذا كان جديداً
      let typeId = data.type_id;
      if (!typeId && newAssetType.trim()) {
        const existingType = assetTypes.find(t => t.get('name') === newAssetType.trim());
        if (existingType) {
          typeId = existingType.get('id') || '';
        } else {
          const newTypeId = firestoreApi.getNewId("assetTypes");
          const typeDocRef = firestoreApi.getDocument("assetTypes", newTypeId);
          await firestoreApi.setData(typeDocRef, {
            name: newAssetType.trim(),
            description: '',
            notes: '',
          });
          typeId = newTypeId;
          // إضافة إلى القائمة المحلية
          const newType = new BaseModel({ id: newTypeId, name: newAssetType.trim() });
          setAssetTypes(prev => [...prev, newType]);
        }
        data.type_id = typeId;
      }

      // إضافة حالة الأصل إذا كانت جديدة
      let statusId = data.status_id;
      if (!statusId && newAssetStatus.trim()) {
        const existingStatus = assetStatuses.find(s => s.get('name') === newAssetStatus.trim());
        if (existingStatus) {
          statusId = existingStatus.get('id') || '';
        } else {
          const newStatusId = firestoreApi.getNewId("assetStatuses");
          const statusDocRef = firestoreApi.getDocument("assetStatuses", newStatusId);
          await firestoreApi.setData(statusDocRef, {
            name: newAssetStatus.trim(),
            description: '',
            notes: '',
          });
          statusId = newStatusId;
          // إضافة إلى القائمة المحلية
          const newStatus = new BaseModel({ id: newStatusId, name: newAssetStatus.trim() });
          setAssetStatuses(prev => [...prev, newStatus]);
        }
        data.status_id = statusId;
      }

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
      setNewAssetName('');
      setNewAssetType('');
      setNewAssetStatus('');
      loadData();
      showSuccess(editingAsset ? "تم تحديث الأصل بنجاح" : "تم إضافة الأصل بنجاح");
    } catch (error) {
      console.error("Error saving asset:", error);
      showError("حدث خطأ أثناء الحفظ");
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
    setNewAssetName('');
    setNewAssetType('');
    setNewAssetStatus('');
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
    setNewAssetName('');
    setNewAssetType('');
    setNewAssetStatus('');
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
      showSuccess("تم حذف الأصل بنجاح");
      loadData();
      setIsConfirmModalOpen(false);
      setDeletingAsset(null);
    } catch (error) {
      console.error("Error deleting asset:", error);
      showError("حدث خطأ أثناء الحذف");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleBulkDelete = (selectedAssets: BaseModel[]) => {
    if (!selectedAssets || selectedAssets.length === 0) {
      showWarning("لم يتم تحديد أي أصول للحذف");
      return;
    }
    console.log(`Bulk delete requested for ${selectedAssets.length} assets`);
    setDeletingAssets(selectedAssets);
    setIsBulkDeleteModalOpen(true);
  };

  const confirmBulkDelete = async () => {
    if (deletingAssets.length === 0) {
      showWarning("لم يتم تحديد أي أصول للحذف");
      return;
    }
    
    console.log(`Starting bulk delete for ${deletingAssets.length} assets`);
    
    try {
      setBulkDeleteLoading(true);
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // حذف جميع الأصول المحددة بشكل متوازي
      const deletePromises = deletingAssets.map(async (asset, index) => {
        const id = asset.get('id');
        if (!id) {
          errorCount++;
          errors.push(`أصل #${index + 1} بدون معرف`);
          console.warn(`Asset at index ${index} has no ID:`, asset.getData());
          return;
        }

        try {
          console.log(`Deleting asset ${index + 1}/${deletingAssets.length}: ${id}`);
          const docRef = firestoreApi.getDocument("assets", id);
          await firestoreApi.deleteData(docRef);
          successCount++;
          console.log(`Successfully deleted asset ${id}`);
        } catch (error) {
          errorCount++;
          const assetTag = asset.get('asset_tag') || 'غير معروف';
          const errorMsg = error instanceof Error ? error.message : 'خطأ غير معروف';
          errors.push(`فشل حذف ${assetTag}: ${errorMsg}`);
          console.error(`Failed to delete asset ${id}:`, error);
        }
      });

      await Promise.all(deletePromises);

      console.log(`Bulk delete completed: ${successCount} succeeded, ${errorCount} failed`);

      if (errorCount > 0) {
        const errorMessage = errors.slice(0, 3).join('، ');
        const moreErrors = errors.length > 3 ? ` و ${errors.length - 3} خطأ آخر` : '';
        showWarning(`تم حذف ${successCount} من ${deletingAssets.length} أصل بنجاح، فشل: ${errorCount}. ${errorMessage}${moreErrors}`, 8000);
      } else {
        showSuccess(`تم حذف جميع ${successCount} أصل بنجاح`);
      }

      // إعادة تحميل البيانات
      await loadData();
      setIsBulkDeleteModalOpen(false);
      setDeletingAssets([]);
      
      // مسح التحديد بعد الحذف الناجح
      // سيتم مسحه تلقائياً عند إعادة تحميل البيانات
    } catch (error) {
      console.error("Error in bulk delete:", error);
      showError("حدث خطأ أثناء الحذف الجماعي");
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  const handleBulkEdit = (selectedAssets: BaseModel[]) => {
    setSelectedAssetsForBulkEdit(selectedAssets);
    const formDataArray = selectedAssets.map(item => {
      const itemData = item.getData();
      itemData.is_active = item.getValue<number>('is_active') === 1 || item.getValue<boolean>('is_active') === true;
      return new BaseModel(itemData);
    });
    setBulkEditFormDataArray(formDataArray);
    
    // تهيئة department IDs و offices لكل أصل
    const deptIds: Record<number, string> = {};
    const officesMap: Record<number, BaseModel[]> = {};
    selectedAssets.forEach((asset, index) => {
      const deptId = asset.get('department_id');
      if (deptId) {
        deptIds[index] = deptId;
        const filteredOffices = allOffices.filter(office => office.get('department_id') === deptId);
        officesMap[index] = filteredOffices;
      }
    });
    setBulkEditSelectedDepartmentIds(deptIds);
    setBulkEditOfficesMap(officesMap);
    setBulkEditNewAssetNames({});
    setBulkEditNewAssetTypes({});
    setBulkEditNewAssetStatuses({});
    
    setIsBulkEditModalOpen(true);
  };

  const handleBulkEditSubmit = async (dataArray: Record<string, any>[]) => {
    try {
      setBulkEditLoading(true);

      const updatePromises = dataArray.map(async (item) => {
        if (!item.id) return;
        
        const updates: any = {
          asset_tag: item.asset_tag || '',
          serial_number: item.serial_number || '',
          asset_name_id: item.asset_name_id || '',
          type_id: item.type_id || '',
          status_id: item.status_id || '',
          category: item.category || '',
          description: item.description || '',
          purchase_date: item.purchase_date || '',
          purchase_value: parseFloat(item.purchase_value) || 0,
          currency_id: item.currency_id || '',
          current_value: parseFloat(item.current_value) || 0,
          location_office_id: item.location_office_id || '',
          custodian_user_id: item.custodian_user_id || '',
          warranty_end: item.warranty_end || '',
          depreciation_method: item.depreciation_method || '',
          expected_lifetime_years: parseInt(item.expected_lifetime_years) || 0,
          residual_value: parseFloat(item.residual_value) || 0,
          notes: item.notes || '',
        };
        
        const docRef = firestoreApi.getDocument("assets", item.id);
        await firestoreApi.updateData(docRef, updates);
      });

      await Promise.all(updatePromises);
      
      setIsBulkEditModalOpen(false);
      setSelectedAssetsForBulkEdit([]);
      loadData();
      showSuccess(`تم تحديث ${dataArray.length} أصل بنجاح`);
    } catch (error) {
      console.error("Error in bulk edit:", error);
      showError("حدث خطأ أثناء التحديث الجماعي");
    } finally {
      setBulkEditLoading(false);
    }
  };

  const updateBulkEditField = useCallback((index: number, key: string, value: any) => {
    const newArray = [...bulkEditFormDataArray];
    const newData = new BaseModel(newArray[index].getData());
    newData.put(key, value);
    
    // إذا تم تغيير department_id، تحديث offices المتاحة
    if (key === 'department_id') {
      const newDeptIds = { ...bulkEditSelectedDepartmentIds };
      newDeptIds[index] = value;
      setBulkEditSelectedDepartmentIds(newDeptIds);
      
      const newOfficesMap = { ...bulkEditOfficesMap };
      if (value) {
        const filteredOffices = allOffices.filter(office => office.get('department_id') === value);
        newOfficesMap[index] = filteredOffices;
        // إعادة تعيين location_office_id إذا تغيرت الإدارة
        newData.put('location_office_id', '');
      } else {
        newOfficesMap[index] = [];
        newData.put('location_office_id', '');
      }
      setBulkEditOfficesMap(newOfficesMap);
    }
    
    // إذا تم تغيير asset_name_id، إعادة تعيين newAssetName
    if (key === 'asset_name_id') {
      const newNames = { ...bulkEditNewAssetNames };
      delete newNames[index];
      setBulkEditNewAssetNames(newNames);
    }
    
    // إذا تم تغيير type_id، إعادة تعيين newAssetType
    if (key === 'type_id') {
      const newTypes = { ...bulkEditNewAssetTypes };
      delete newTypes[index];
      setBulkEditNewAssetTypes(newTypes);
    }
    
    // إذا تم تغيير status_id، إعادة تعيين newAssetStatus
    if (key === 'status_id') {
      const newStatuses = { ...bulkEditNewAssetStatuses };
      delete newStatuses[index];
      setBulkEditNewAssetStatuses(newStatuses);
    }
    
    newArray[index] = newData;
    setBulkEditFormDataArray(newArray);
  }, [bulkEditFormDataArray, bulkEditSelectedDepartmentIds, bulkEditOfficesMap, bulkEditNewAssetNames, bulkEditNewAssetTypes, bulkEditNewAssetStatuses, allOffices]);

  const getAssetName = useCallback((id?: string) => {
    if (!id) return '-';
    const name = assetNames.find(n => n.get('id') === id);
    return name?.get('name') || '-';
  }, [assetNames]);

  const getAssetType = useCallback((id?: string) => {
    if (!id) return '-';
    const type = assetTypes.find(t => t.get('id') === id);
    return type?.get('name') || '-';
  }, [assetTypes]);

  const getAssetStatus = useCallback((id?: string) => {
    if (!id) return '-';
    const status = assetStatuses.find(s => s.get('id') === id);
    return status?.get('name') || '-';
  }, [assetStatuses]);

  const getOfficeName = useCallback((id?: string) => {
    if (!id) return '-';
    const office = offices.find(o => o.get('id') === id);
    return office?.get('name') || '-';
  }, [offices]);

  const getUserName = useCallback((id?: string) => {
    if (!id) return '-';
    const user = users.find(u => u.get('id') === id);
    return user?.get('full_name') || '-';
  }, [users]);

  const getCurrencyName = useCallback((id?: string) => {
    if (!id) return '-';
    const currency = currencies.find(c => c.get('id') === id);
    return currency ? `${currency.get('name')} (${currency.get('code')})` : '-';
  }, [currencies]);

  const getCurrencySymbol = useCallback((id?: string) => {
    if (!id) return 'ر.س';
    const currency = currencies.find(c => c.get('id') === id);
    return currency?.get('symbol') || currency?.get('code') || 'ر.س';
  }, [currencies]);

  const getDepartmentName = useCallback((officeId?: string) => {
    if (!officeId) return '-';
    const office = allOffices.find(o => o.get('id') === officeId);
    if (!office) return '-';
    const deptId = office.get('department_id');
    if (!deptId) return '-';
    const dept = departments.find(d => d.get('id') === deptId);
    return dept?.get('name') || '-';
  }, [allOffices, departments]);

  const updateField = useCallback((key: string, value: any) => {
    const newData = new BaseModel(formData.getData());
    newData.put(key, value);
    setFormData(newData);
  }, [formData]);

  const handleImportData = async (data: Array<Record<string, any>>) => {
    setImportLoading(true);
    setImportProgress({ current: 0, total: data.length });
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // إنشاء Maps للبحث السريع بدلاً من find (O(1) بدلاً من O(n))
    const departmentsMap = new Map<string, BaseModel>();
    const officesMap = new Map<string, BaseModel>(); // key: "deptId|officeName"
    const usersMap = new Map<string, BaseModel>();
    const currenciesMap = new Map<string, BaseModel>(); // key: name أو code
    const assetNamesMap = new Map<string, BaseModel>();
    const assetTypesMap = new Map<string, BaseModel>();
    const assetStatusesMap = new Map<string, BaseModel>();

    // تهيئة Maps من البيانات الحالية
    departments.forEach(d => {
      const name = d.get('name');
      if (name) departmentsMap.set(name, d);
    });
    allOffices.forEach(o => {
      const name = o.get('name');
      const deptId = o.get('department_id');
      if (name && deptId) officesMap.set(`${deptId}|${name}`, o);
    });
    users.forEach(u => {
      const name = u.get('full_name');
      if (name) usersMap.set(name, u);
    });
    currencies.forEach(c => {
      const name = c.get('name');
      const code = c.get('code');
      if (name) currenciesMap.set(name, c);
      if (code) currenciesMap.set(code, c);
    });
    assetNames.forEach(n => {
      const name = n.get('name');
      if (name) assetNamesMap.set(name, n);
    });
    assetTypes.forEach(t => {
      const name = t.get('name');
      if (name) assetTypesMap.set(name, t);
    });
    assetStatuses.forEach(s => {
      const name = s.get('name');
      if (name) assetStatusesMap.set(name, s);
    });

    // دالة مساعدة لاستخراج القيمة من الصف
    const normalizeKey = (key: string): string => {
      return key.toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[_\-\.,]/g, '')
        .trim();
    };

    const getValue = (keys: string[], row: Record<string, any>): string => {
      // أولاً: البحث المباشر بالأسماء المحددة
      for (const key of keys) {
        const value = row[key];
        if (value !== undefined && value !== null && value !== '') {
          return value.toString().trim();
        }
      }

      // ثانياً: البحث في جميع مفاتيح الصف
      const normalizedKeys = keys.map(normalizeKey);
      const rowKeys = Object.keys(row);
      
      for (const rowKey of rowKeys) {
        const normalizedRowKey = normalizeKey(rowKey);
        
        if (normalizedKeys.some(nk => normalizedRowKey === nk)) {
          const value = row[rowKey];
          if (value !== undefined && value !== null && value !== '') {
            return value.toString().trim();
          }
        }
        
        if (normalizedKeys.some(nk => normalizedRowKey.includes(nk) || nk.includes(normalizedRowKey))) {
          const value = row[rowKey];
          if (value !== undefined && value !== null && value !== '') {
            return value.toString().trim();
          }
        }
      }

      return '';
    };

    // معالجة السجلات بشكل متوازي (batch processing)
    const BATCH_SIZE = 50; // معالجة 50 سجل في كل مرة
    const batches: Array<Record<string, any>[]> = [];
    
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      batches.push(data.slice(i, i + BATCH_SIZE));
    }

    try {
      // معالجة كل batch
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        
        // معالجة السجلات في هذا batch بشكل متوازي
        const batchPromises = batch.map(async (row, rowIndex) => {
          const globalIndex = batchIndex * BATCH_SIZE + rowIndex;
          
          try {

          // استخراج البيانات من الصف
          const assetTag = getValue(['كود الأصل', 'asset_tag', 'Asset Tag', 'asset_tag', 'ASSET_TAG'], row);
          const assetName = getValue(['اسم الأصل', 'asset_name', 'Asset Name', 'name'], row);
          const assetType = getValue(['نوع الأصل', 'type', 'Type', 'asset_type'], row);
          const assetStatus = getValue(['حالة الأصل', 'status', 'Status', 'asset_status'], row);
          const departmentName = getValue(['الإدارة', 'department', 'Department'], row);
          const officeName = getValue(['المكتب', 'office', 'Office'], row);
          const custodianName = getValue(['حامل الأصل', 'custodian', 'Custodian', 'user'], row);
          const currencyName = getValue(['العملة', 'currency', 'Currency'], row);
          const serialNumber = getValue(['الرقم التسلسلي', 'serial_number', 'Serial Number', 'serial'], row);
          const category = getValue(['الفئة', 'category', 'Category'], row);
          const description = getValue(['الوصف', 'description', 'Description'], row);
          const purchaseDate = getValue(['تاريخ الشراء', 'purchase_date', 'Purchase Date', 'date'], row);
          const purchaseValue = getValue(['قيمة الشراء', 'purchase_value', 'Purchase Value', 'value'], row);
          const currentValue = getValue(['القيمة الحالية', 'current_value', 'Current Value'], row);
          const currencyId = getValue(['currency_id', 'Currency ID'], row);
          const warrantyEnd = getValue(['نهاية الضمان', 'warranty_end', 'Warranty End'], row);
          const depreciationMethod = getValue(['طريقة الإهلاك', 'depreciation_method', 'Depreciation Method'], row);
          const expectedLifetime = getValue(['عمر الخدمة', 'expected_lifetime_years', 'Expected Lifetime'], row);
          const residualValue = getValue(['القيمة المتبقية', 'residual_value', 'Residual Value'], row);
          const supplier = getValue(['المورد', 'supplier', 'Supplier'], row);
          const invoiceNumber = getValue(['رقم الفاتورة', 'invoice_number', 'Invoice Number'], row);
          const lastMaintenanceDate = getValue(['تاريخ آخر صيانة', 'last_maintenance_date', 'Last Maintenance Date'], row);
          const isActive = getValue(['نشط', 'is_active', 'Is Active', 'active'], row);
          // الافتراضي نشط إذا لم يتم تحديده
          const finalIsActiveValue = isActive || '1';
          const notes = getValue(['الملاحظات', 'notes', 'Notes'], row);

          // البحث عن asset_name_id بالاسم أو إضافته تلقائياً (استخدام Map)
          let assetNameId = '';
          if (assetName) {
            let found = assetNamesMap.get(assetName);
            if (found) {
              assetNameId = found.get('id') || '';
            } else {
              // إضافة اسم الأصل تلقائياً
              const newAssetNameId = firestoreApi.getNewId("assetNames");
              const assetNameDocRef = firestoreApi.getDocument("assetNames", newAssetNameId);
              await firestoreApi.setData(assetNameDocRef, {
                name: assetName,
                description: '',
                notes: '',
              });
              assetNameId = newAssetNameId;
              // إضافة إلى Map والقائمة
              const newAssetName = new BaseModel({ id: newAssetNameId, name: assetName });
              assetNamesMap.set(assetName, newAssetName);
              setAssetNames(prev => [...prev, newAssetName]);
            }
          }

          // البحث عن type_id بالاسم أو إضافته تلقائياً (استخدام Map)
          let typeId = '';
          if (assetType) {
            let found = assetTypesMap.get(assetType);
            if (found) {
              typeId = found.get('id') || '';
            } else {
              // إضافة نوع الأصل تلقائياً
              const newTypeId = firestoreApi.getNewId("assetTypes");
              const typeDocRef = firestoreApi.getDocument("assetTypes", newTypeId);
              await firestoreApi.setData(typeDocRef, {
                name: assetType,
                description: '',
                notes: '',
              });
              typeId = newTypeId;
              // إضافة إلى Map والقائمة
              const newType = new BaseModel({ id: newTypeId, name: assetType });
              assetTypesMap.set(assetType, newType);
              setAssetTypes(prev => [...prev, newType]);
            }
          }

          // البحث عن status_id بالاسم أو إضافته تلقائياً (استخدام Map)
          let statusId = '';
          if (assetStatus) {
            let found = assetStatusesMap.get(assetStatus);
            if (found) {
              statusId = found.get('id') || '';
            } else {
              // إضافة حالة الأصل تلقائياً
              const newStatusId = firestoreApi.getNewId("assetStatuses");
              const statusDocRef = firestoreApi.getDocument("assetStatuses", newStatusId);
              await firestoreApi.setData(statusDocRef, {
                name: assetStatus,
                description: '',
                notes: '',
              });
              statusId = newStatusId;
              // إضافة إلى Map والقائمة
              const newStatus = new BaseModel({ id: newStatusId, name: assetStatus });
              assetStatusesMap.set(assetStatus, newStatus);
              setAssetStatuses(prev => [...prev, newStatus]);
            }
          }

          // البحث عن department_id و location_office_id أو إضافتهما تلقائياً (استخدام Map)
          let departmentId = '';
          let locationOfficeId = '';
          if (departmentName) {
            let foundDept = departmentsMap.get(departmentName);
            if (foundDept) {
              departmentId = foundDept.get('id') || '';
            } else {
              // إضافة الإدارة تلقائياً إذا لم تكن موجودة
              const newDeptId = firestoreApi.getNewId("departments");
              const deptDocRef = firestoreApi.getDocument("departments", newDeptId);
              await firestoreApi.setData(deptDocRef, {
                name: departmentName,
                description: '',
                notes: '',
              });
              departmentId = newDeptId;
              // إضافة إلى Map والقائمة
              const newDept = new BaseModel({ id: newDeptId, name: departmentName });
              departmentsMap.set(departmentName, newDept);
              setDepartments(prev => [...prev, newDept]);
            }
            
            // البحث عن المكتب أو إضافته تلقائياً (استخدام Map)
            if (officeName && departmentId) {
              const officeKey = `${departmentId}|${officeName}`;
              let foundOffice = officesMap.get(officeKey);
              if (foundOffice) {
                locationOfficeId = foundOffice.get('id') || '';
              } else {
                // إضافة المكتب تلقائياً إذا لم يكن موجوداً
                const newOfficeId = firestoreApi.getNewId("offices");
                const officeDocRef = firestoreApi.getSubDocument("departments", departmentId, "departments", newOfficeId);
                await firestoreApi.setData(officeDocRef, {
                  name: officeName,
                  floor: '',
                  room: '',
                  notes: '',
                });
                locationOfficeId = newOfficeId;
                // إضافة إلى Map والقائمة
                const newOffice = new BaseModel({ 
                  id: newOfficeId, 
                  name: officeName,
                  department_id: departmentId 
                });
                officesMap.set(officeKey, newOffice);
                setAllOffices(prev => [...prev, newOffice]);
              }
            }
          }

          // البحث عن custodian_user_id بالاسم أو إضافته تلقائياً (استخدام Map)
          let custodianUserId = '';
          if (custodianName) {
            let found = usersMap.get(custodianName);
            if (found) {
              custodianUserId = found.get('id') || '';
            } else {
              // إضافة المستخدم تلقائياً إذا لم يكن موجوداً
              const newUserId = firestoreApi.getNewId("users");
              const userDocRef = firestoreApi.getDocument("users", newUserId);
              await firestoreApi.setData(userDocRef, {
                full_name: custodianName,
                email: '',
                phone: '',
                role: 'user',
                is_active: 1,
              });
              custodianUserId = newUserId;
              // إضافة إلى Map والقائمة
              const newUser = new BaseModel({ 
                id: newUserId, 
                full_name: custodianName 
              });
              usersMap.set(custodianName, newUser);
              setUsers(prev => [...prev, newUser]);
            }
          }

          // البحث عن currency_id بالاسم أو الكود أو إضافته تلقائياً (استخدام Map)
          let finalCurrencyId = currencyId || '';
          if (!finalCurrencyId && currencyName) {
            let found = currenciesMap.get(currencyName);
            if (found) {
              finalCurrencyId = found.get('id') || '';
            } else {
              // إضافة العملة تلقائياً إذا لم تكن موجودة
              const newCurrencyId = firestoreApi.getNewId("currencies");
              const currencyDocRef = firestoreApi.getDocument("currencies", newCurrencyId);
              const currencyCode = currencyName.length >= 3 
                ? currencyName.substring(0, 3).toUpperCase() 
                : currencyName.toUpperCase();
              await firestoreApi.setData(currencyDocRef, {
                name: currencyName,
                code: currencyCode,
                symbol: currencyName.substring(0, 1) || currencyCode.substring(0, 1),
                is_default: 0,
              });
              finalCurrencyId = newCurrencyId;
              // إضافة إلى Map والقائمة
              const newCurrency = new BaseModel({ 
                id: newCurrencyId, 
                name: currencyName,
                code: currencyCode,
              });
              currenciesMap.set(currencyName, newCurrency);
              if (currencyCode !== currencyName) {
                currenciesMap.set(currencyCode, newCurrency);
              }
              setCurrencies(prev => [...prev, newCurrency]);
            }
          } else if (!finalCurrencyId) {
            // استخدام العملة الافتراضية إذا لم يتم تحديد عملة
            for (const currency of currencies) {
              if (currency.getValue<number>('is_default') === 1 || currency.getValue<boolean>('is_default') === true) {
                finalCurrencyId = currency.get('id') || '';
                break;
              }
            }
          }

          // تحديد حالة النشاط (الافتراضي نشط)
          const finalIsActive = (finalIsActiveValue === '0' || finalIsActiveValue === 'لا' || finalIsActiveValue === 'no' || finalIsActiveValue === 'No' || finalIsActiveValue === 'false' || finalIsActiveValue === 'False') ? 0 : 1;

          // إضافة أصل جديد
          const newId = firestoreApi.getNewId("assets");
          const docRef = firestoreApi.getDocument("assets", newId);
          const assetData = {
            department_id: departmentId || '',
            asset_name_id: assetNameId || '',
            asset_tag: assetTag || generateAssetTag(),
            serial_number: serialNumber || '',
            type_id: typeId || '',
            status_id: statusId || '',
            category: category || '',
            description: description || '',
            purchase_date: purchaseDate || '',
            purchase_value: parseFloat(purchaseValue) || 0,
            currency_id: finalCurrencyId || '',
            current_value: parseFloat(currentValue) || 0,
            location_office_id: locationOfficeId || '',
            custodian_user_id: custodianUserId || '',
            warranty_end: warrantyEnd || '',
            depreciation_method: depreciationMethod || '',
            expected_lifetime_years: parseFloat(expectedLifetime) || 0,
            residual_value: parseFloat(residualValue) || 0,
            supplier: supplier || '',
            invoice_number: invoiceNumber || '',
            last_maintenance_date: lastMaintenanceDate || '',
            is_active: finalIsActive,
            notes: notes || '',
          };
          
          await firestoreApi.setData(docRef, assetData);
          
          // تحديث التقدم
          setImportProgress(prev => ({ ...prev, current: prev.current + 1 }));
          
          return { success: true, index: globalIndex };
        } catch (error) {
          const errorMsg = `سطر ${globalIndex + 2}: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`;
          return { success: false, index: globalIndex, error: errorMsg };
        }
      });

      // انتظار اكتمال جميع السجلات في هذا batch
      const batchResults = await Promise.all(batchPromises);
      
      // معالجة النتائج
      batchResults.forEach(result => {
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
          if (result.error) {
            errors.push(result.error);
          }
        }
      });
      
      // تحديث التقدم بعد كل batch
      setImportProgress({ current: (batchIndex + 1) * BATCH_SIZE, total: data.length });
    }

      // تحديث التقدم النهائي
      setImportProgress({ current: data.length, total: data.length });

      if (errorCount > 0) {
        const errorMessage = errors.slice(0, 5).join('، ');
        const moreErrors = errors.length > 5 ? ` و ${errors.length - 5} خطأ آخر` : '';
        showWarning(`تم استيراد ${successCount} من ${data.length} أصل بنجاح، فشل: ${errorCount}. ${errorMessage}${moreErrors}`, 10000);
      } else {
        showSuccess(`تم استيراد جميع ${successCount} أصل بنجاح`);
      }

      loadData();
    } catch (error) {
      console.error("Error importing data:", error);
      throw error;
    } finally {
      setImportLoading(false);
    }
  };

  const columns = useMemo(() => [
    { 
      key: 'asset_tag', 
      label: 'كود الأصل',
      sortable: true,
    },
    { 
      key: 'asset_name_id', 
      label: 'اسم الأصل',
      render: (item: BaseModel) => getAssetName(item.get('asset_name_id')),
      sortable: true,
    },
    { 
      key: 'type_id', 
      label: 'النوع',
      render: (item: BaseModel) => getAssetType(item.get('type_id')),
      sortable: true,
    },
    { 
      key: 'status_id', 
      label: 'الحالة',
      render: (item: BaseModel) => getAssetStatus(item.get('status_id')),
      sortable: true,
    },
    { 
      key: 'department', 
      label: 'الإدارة',
      render: (item: BaseModel) => getDepartmentName(item.get('location_office_id')),
      sortable: true,
    },
    { 
      key: 'location_office_id', 
      label: 'المكتب',
      render: (item: BaseModel) => getOfficeName(item.get('location_office_id')),
      sortable: true,
    },
    { 
      key: 'custodian_user_id', 
      label: 'حامل الأصل',
      render: (item: BaseModel) => getUserName(item.get('custodian_user_id')),
      sortable: true,
    },
    { 
      key: 'purchase_date', 
      label: 'تاريخ الشراء',
      sortable: true,
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
      sortable: true,
    },
    { 
      key: 'currency_id', 
      label: 'العملة',
      render: (item: BaseModel) => getCurrencyName(item.get('currency_id')),
      sortable: true,
    },
    { 
      key: 'warranty_end', 
      label: 'نهاية الضمان',
      sortable: true,
    },
  ], [getAssetName, getAssetType, getAssetStatus, getDepartmentName, getOfficeName, getUserName, getCurrencyName, getCurrencySymbol]);

  return (
    <MainLayout>
      {/* Page Header */}
      <div className="mb-10 relative">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-6">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 flex items-center justify-center shadow-2xl shadow-primary-500/40 overflow-hidden group hover:scale-105 material-transition">
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-transparent opacity-0 group-hover:opacity-100 material-transition"></div>
                <MaterialIcon name="inventory" className="text-white relative z-10" size="3xl" />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-white/20 rounded-full blur-sm"></div>
                <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-white/10 rounded-full blur-sm"></div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-primary-600 via-primary-700 to-accent-600 bg-clip-text text-transparent">
                    الأصول
                  </h1>
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-primary-50 rounded-full border border-primary-200">
                    <MaterialIcon name="inventory" className="text-primary-600" size="sm" />
                    <span className="text-xs font-semibold text-primary-700">{assets.length}</span>
                  </div>
                </div>
                <p className="text-slate-600 text-base sm:text-lg font-semibold flex items-center gap-2">
                  <MaterialIcon name="info" className="text-slate-400" size="sm" />
                  <span>إدارة وإضافة الأصول في النظام</span>
                </p>
              </div>
            </div>
          </div>
          {canAdd && (
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => setIsImportModalOpen(true)}
                size="lg"
                variant="outline"
                className="shadow-lg hover:shadow-xl hover:scale-105 material-transition font-bold border-2 hover:border-primary-400"
              >
                <span className="flex items-center gap-2">
                  <MaterialIcon name="upload_file" className="w-5 h-5" size="lg" />
                  <span>استيراد من Excel</span>
                </span>
              </Button>
              <Button
                onClick={() => {
                  setEditingAsset(null);
                  resetForm();
                  setIsModalOpen(true);
                }}
                size="lg"
                variant="primary"
                className="shadow-2xl shadow-primary-500/40 hover:shadow-2xl hover:shadow-primary-500/50 hover:scale-105 material-transition font-bold"
              >
                <span className="flex items-center gap-2">
                  <MaterialIcon name="add" className="w-5 h-5" size="lg" />
                  <span>إضافة أصل جديد</span>
                </span>
              </Button>
            </div>
          )}
        </div>
        
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-500/5 to-accent-500/5 rounded-full blur-3xl -z-10"></div>
      </div>

      {/* Data Table */}
      <DataTable
        data={assets}
        columns={columns}
        onEdit={canEdit ? handleEdit : undefined}
        onDelete={canDelete ? handleDelete : undefined}
        onBulkEdit={(canEdit || canDelete) ? handleBulkEdit : undefined}
        onBulkDelete={canDelete ? handleBulkDelete : undefined}
        loading={loading}
      />

        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingAsset(null);
            resetForm();
            setNewAssetName('');
            setNewAssetType('');
            setNewAssetStatus('');
          }}
          title={editingAsset ? "تعديل أصل" : "إضافة أصل جديد"}
          size="full"
          footer={
            <div className="flex flex-col sm:flex-row justify-end gap-3 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingAsset(null);
                  resetForm();
                  setNewAssetName('');
                  setNewAssetType('');
                  setNewAssetStatus('');
                }}
                size="lg"
                className="w-full sm:w-auto font-bold"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                form="asset-form"
                className="w-full sm:w-auto font-bold shadow-xl shadow-primary-500/30"
              >
                {editingAsset ? "تحديث" : "حفظ"}
              </Button>
            </div>
          }
        >
          <form id="asset-form" onSubmit={handleSubmit} className="space-y-4">
            {/* معلومات أساسية */}
            <div className="grid grid-cols-2 gap-4">
              <SearchableSelect
                label="الإدارة"
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
                value={formData.get('location_office_id')}
                onChange={(value) => updateField('location_office_id', value)}
                disabled={!selectedDepartmentId || offices.length === 0}
                options={offices.map((office) => ({
                  value: office.get('id'),
                  label: office.get('name'),
                }))}
                placeholder={!selectedDepartmentId ? "اختر الإدارة أولاً" : offices.length === 0 ? "لا توجد مكاتب في هذه الإدارة" : "اختر المكتب"}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <SearchableSelect
                  label="اسم الأصل"
                  value={formData.get('asset_name_id')}
                  onChange={(value) => {
                    updateField('asset_name_id', value);
                    setNewAssetName(''); // مسح الحقل الجديد عند اختيار اسم موجود
                  }}
                  options={assetNames.map((name) => ({
                    value: name.get('id'),
                    label: name.get('name'),
                  }))}
                  placeholder="اختر اسم الأصل"
                  fullWidth={false}
                />
                <div className="flex gap-2 items-end">
                  <Input
                    type="text"
                    value={newAssetName}
                    onChange={(e) => {
                      setNewAssetName(e.target.value);
                      updateField('asset_name_id', ''); // مسح الاختيار عند كتابة اسم جديد
                    }}
                    placeholder="أو أدخل اسم أصل جديد"
                    fullWidth={true}
                    className="text-sm"
                  />
                  {newAssetName.trim() && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        const existingName = assetNames.find(n => n.get('name') === newAssetName.trim());
                        if (existingName) {
                          updateField('asset_name_id', existingName.get('id') || '');
                          setNewAssetName('');
                          showSuccess("تم اختيار اسم الأصل الموجود");
                        } else {
                          const newAssetNameId = firestoreApi.getNewId("assetNames");
                          const assetNameDocRef = firestoreApi.getDocument("assetNames", newAssetNameId);
                          await firestoreApi.setData(assetNameDocRef, {
                            name: newAssetName.trim(),
                            description: '',
                            notes: '',
                          });
                          const newName = new BaseModel({ id: newAssetNameId, name: newAssetName.trim() });
                          setAssetNames(prev => [...prev, newName]);
                          updateField('asset_name_id', newAssetNameId);
                          setNewAssetName('');
                          showSuccess("تم إضافة اسم الأصل الجديد");
                        }
                      }}
                    >
                      إضافة
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Input
                      type="text"
                      label="كود الأصل"
                      value={formData.get('asset_tag')}
                      onChange={(e) => updateField('asset_tag', e.target.value)}
                      placeholder="سيتم توليده تلقائياً"
                    />
                  </div>
                  {!editingAsset && (
                    <Button
                      type="button"
                      variant="outline"
                      size="md"
                      onClick={() => updateField('asset_tag', generateAssetTag())}
                      className="mb-0"
                      style={{ minWidth: '100px', height: '42px' }}
                    >
                      توليد
                    </Button>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1.5 mr-1">سيتم توليده تلقائياً</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <SearchableSelect
                  label="نوع الأصل"
                  value={formData.get('type_id')}
                  onChange={(value) => {
                    updateField('type_id', value);
                    setNewAssetType(''); // مسح الحقل الجديد عند اختيار نوع موجود
                  }}
                  options={assetTypes.map((type) => ({
                    value: type.get('id'),
                    label: type.get('name'),
                  }))}
                  placeholder="اختر نوع الأصل"
                  fullWidth={false}
                />
                <div className="flex gap-2 items-end">
                  <Input
                    type="text"
                    value={newAssetType}
                    onChange={(e) => {
                      setNewAssetType(e.target.value);
                      updateField('type_id', ''); // مسح الاختيار عند كتابة نوع جديد
                    }}
                    placeholder="أو أدخل نوع أصل جديد"
                    fullWidth={true}
                    className="text-sm"
                  />
                  {newAssetType.trim() && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        const existingType = assetTypes.find(t => t.get('name') === newAssetType.trim());
                        if (existingType) {
                          updateField('type_id', existingType.get('id') || '');
                          setNewAssetType('');
                          showSuccess("تم اختيار نوع الأصل الموجود");
                        } else {
                          const newTypeId = firestoreApi.getNewId("assetTypes");
                          const typeDocRef = firestoreApi.getDocument("assetTypes", newTypeId);
                          await firestoreApi.setData(typeDocRef, {
                            name: newAssetType.trim(),
                            description: '',
                            notes: '',
                          });
                          const newType = new BaseModel({ id: newTypeId, name: newAssetType.trim() });
                          setAssetTypes(prev => [...prev, newType]);
                          updateField('type_id', newTypeId);
                          setNewAssetType('');
                          showSuccess("تم إضافة نوع الأصل الجديد");
                        }
                      }}
                    >
                      إضافة
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <SearchableSelect
                  label="حالة الأصل"
                  value={formData.get('status_id')}
                  onChange={(value) => {
                    updateField('status_id', value);
                    setNewAssetStatus(''); // مسح الحقل الجديد عند اختيار حالة موجودة
                  }}
                  options={assetStatuses.map((status) => ({
                    value: status.get('id'),
                    label: status.get('name'),
                  }))}
                  placeholder="اختر حالة الأصل"
                  fullWidth={false}
                />
                <div className="flex gap-2 items-end">
                  <Input
                    type="text"
                    value={newAssetStatus}
                    onChange={(e) => {
                      setNewAssetStatus(e.target.value);
                      updateField('status_id', ''); // مسح الاختيار عند كتابة حالة جديدة
                    }}
                    placeholder="أو أدخل حالة أصل جديدة"
                    fullWidth={true}
                    className="text-sm"
                  />
                  {newAssetStatus.trim() && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        const existingStatus = assetStatuses.find(s => s.get('name') === newAssetStatus.trim());
                        if (existingStatus) {
                          updateField('status_id', existingStatus.get('id') || '');
                          setNewAssetStatus('');
                          showSuccess("تم اختيار حالة الأصل الموجودة");
                        } else {
                          const newStatusId = firestoreApi.getNewId("assetStatuses");
                          const statusDocRef = firestoreApi.getDocument("assetStatuses", newStatusId);
                          await firestoreApi.setData(statusDocRef, {
                            name: newAssetStatus.trim(),
                            description: '',
                            notes: '',
                          });
                          const newStatus = new BaseModel({ id: newStatusId, name: newAssetStatus.trim() });
                          setAssetStatuses(prev => [...prev, newStatus]);
                          updateField('status_id', newStatusId);
                          setNewAssetStatus('');
                          showSuccess("تم إضافة حالة الأصل الجديدة");
                        }
                      }}
                    >
                      إضافة
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <SearchableSelect
                label="حامل الأصل"
                value={formData.get('custodian_user_id')}
                onChange={(value) => updateField('custodian_user_id', value)}
                options={users.map((user) => ({
                  value: user.get('id'),
                  label: user.get('full_name'),
                }))}
                placeholder="اختر حامل الأصل"
                fullWidth={false}
              />
              <Input
                label="الرقم التسلسلي"
                type="text"
                value={formData.get('serial_number')}
                onChange={(e) => updateField('serial_number', e.target.value)}
                placeholder="أدخل الرقم التسلسلي"
                fullWidth={false}
              />
            </div>
            
            {/* التواريخ - صف 5 */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="تاريخ الشراء"
                type="date"
                value={formData.get('purchase_date')}
                onChange={(e) => updateField('purchase_date', e.target.value)}
                fullWidth={false}
              />
              <Input
                label="نهاية الضمان"
                type="date"
                value={formData.get('warranty_end')}
                onChange={(e) => updateField('warranty_end', e.target.value)}
                fullWidth={false}
              />
            </div>
            
            {/* تاريخ الصيانة - صف 6 */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="تاريخ آخر صيانة"
                type="date"
                value={formData.get('last_maintenance_date')}
                onChange={(e) => updateField('last_maintenance_date', e.target.value)}
                fullWidth={false}
              />
              <SearchableSelect
                label="العملة"
                value={formData.get('currency_id')}
                onChange={(value) => updateField('currency_id', value)}
                options={currencies.map((currency) => ({
                  value: currency.get('id'),
                  label: `${currency.get('name')} (${currency.get('code')})`,
                }))}
                placeholder="اختر العملة"
                fullWidth={false}
              />
            </div>
            
            {/* القيم المالية - صف 7 */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="قيمة الشراء"
                type="number"
                step="0.01"
                value={formData.getValue<number>('purchase_value') || 0}
                onChange={(e) => updateField('purchase_value', parseFloat(e.target.value) || 0)}
                fullWidth={false}
              />
              <Input
                label="القيمة الحالية"
                type="number"
                step="0.01"
                value={formData.getValue<number>('current_value') || 0}
                onChange={(e) => updateField('current_value', parseFloat(e.target.value) || 0)}
                fullWidth={false}
              />
            </div>
            
            {/* القيمة المتبقية والإهلاك - صف 8 */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="القيمة المتبقية"
                type="number"
                step="0.01"
                value={formData.getValue<number>('residual_value') || 0}
                onChange={(e) => updateField('residual_value', parseFloat(e.target.value) || 0)}
                fullWidth={false}
              />
              <Input
                label="طريقة الإهلاك"
                type="text"
                value={formData.get('depreciation_method')}
                onChange={(e) => updateField('depreciation_method', e.target.value)}
                placeholder="مثل: خطي، متسارع"
                fullWidth={false}
              />
            </div>
            
            {/* عمر الخدمة والفئة - صف 9 */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="عمر الخدمة المتوقع (بالسنوات)"
                type="number"
                value={formData.getValue<number>('expected_lifetime_years') || 0}
                onChange={(e) => updateField('expected_lifetime_years', parseFloat(e.target.value) || 0)}
                fullWidth={false}
              />
              <Input
                label="الفئة"
                type="text"
                value={formData.get('category')}
                onChange={(e) => updateField('category', e.target.value)}
                placeholder="أدخل الفئة"
                fullWidth={false}
              />
            </div>
            
            {/* المورد ورقم الفاتورة - صف 10 */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="المورد"
                type="text"
                value={formData.get('supplier')}
                onChange={(e) => updateField('supplier', e.target.value)}
                placeholder="أدخل اسم المورد"
                fullWidth={false}
              />
              <Input
                label="رقم الفاتورة"
                type="text"
                value={formData.get('invoice_number')}
                onChange={(e) => updateField('invoice_number', e.target.value)}
                placeholder="أدخل رقم الفاتورة"
                fullWidth={false}
              />
            </div>
            
            {/* الوصف والملاحظات - صف 9 */}
            <div className="grid grid-cols-2 gap-4">
              <Textarea
                label="الوصف"
                value={formData.get('description')}
                onChange={(e) => updateField('description', e.target.value)}
                rows={1}
                placeholder="أدخل وصف الأصل"
                fullWidth={false}
              />
              <Textarea
                label="الملاحظات"
                value={formData.get('notes')}
                onChange={(e) => updateField('notes', e.target.value)}
                rows={1}
                placeholder="أدخل أي ملاحظات إضافية"
                fullWidth={false}
              />
            </div>
            <Checkbox
              label="نشط"
              checked={formData.getValue<boolean>('is_active') === true || formData.getValue<number>('is_active') === 1}
              onChange={(e) => updateField('is_active', e.target.checked)}
            />
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

        {/* Confirm Bulk Delete Modal */}
        <ConfirmModal
          isOpen={isBulkDeleteModalOpen}
          onClose={() => {
            setIsBulkDeleteModalOpen(false);
            setDeletingAssets([]);
          }}
          onConfirm={confirmBulkDelete}
          title="تأكيد الحذف الجماعي"
          message={`هل أنت متأكد من حذف ${deletingAssets.length} أصل محدد؟ لا يمكن التراجع عن هذا الإجراء. سيتم حذف جميع الأصول المحددة بشكل دائم.`}
          confirmText={`حذف ${deletingAssets.length} أصل`}
          cancelText="إلغاء"
          variant="danger"
          loading={bulkDeleteLoading}
        />

        {/* Import Excel Modal */}
        <ImportExcelModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImport={handleImportData}
          title="استيراد الأصول من Excel"
          description="اختر ملف Excel لعرض البيانات ومعاينتها وتعديلها قبل الحفظ. سيتم إضافة اسم الأصل ونوع الأصل وحالة الأصل تلقائياً إذا لم تكن موجودة. الافتراضي: نشط."
          loading={importLoading}
          exampleColumns={[
            'كود الأصل',
            'اسم الأصل',
            'نوع الأصل',
            'حالة الأصل',
            'الإدارة',
            'المكتب',
            'حامل الأصل',
            'تاريخ الشراء',
            'قيمة الشراء',
            'القيمة الحالية',
            'العملة',
            'الرقم التسلسلي',
            'الفئة',
            'الوصف',
            'نهاية الضمان',
            'طريقة الإهلاك',
            'عمر الخدمة',
            'القيمة المتبقية',
            'المورد',
            'رقم الفاتورة',
            'تاريخ آخر صيانة',
            'نشط',
            'الملاحظات'
          ]}
        />

        {/* Bulk Edit Modal */}
        <BulkEditModal
          isOpen={isBulkEditModalOpen}
          onClose={() => {
            setIsBulkEditModalOpen(false);
            setSelectedAssetsForBulkEdit([]);
          }}
          title="تعديل جماعي للأصول"
          items={selectedAssetsForBulkEdit.map((asset) => ({
            id: asset.get('id') || '',
            label: asset.get('asset_tag') || '',
            data: asset.getData(),
          }))}
          fields={[
            {
              name: 'asset_tag',
              label: 'كود الأصل',
              type: 'text',
              placeholder: 'أدخل كود الأصل',
              icon: 'qr_code',
              required: true,
            },
            {
              name: 'serial_number',
              label: 'الرقم التسلسلي',
              type: 'text',
              placeholder: 'أدخل الرقم التسلسلي',
              icon: 'tag',
            },
            {
              name: 'asset_name_id',
              label: 'اسم الأصل',
              type: 'select',
              placeholder: 'اختر اسم الأصل',
              icon: 'label',
              options: assetNames.map((name) => ({
                value: name.get('id'),
                label: name.get('name'),
              })),
            },
            {
              name: 'type_id',
              label: 'نوع الأصل',
              type: 'select',
              placeholder: 'اختر نوع الأصل',
              icon: 'category',
              options: assetTypes.map((type) => ({
                value: type.get('id'),
                label: type.get('name'),
              })),
            },
            {
              name: 'status_id',
              label: 'حالة الأصل',
              type: 'select',
              placeholder: 'اختر حالة الأصل',
              icon: 'assignment',
              options: assetStatuses.map((status) => ({
                value: status.get('id'),
                label: status.get('name'),
              })),
            },
            {
              name: 'location_office_id',
              label: 'المكتب الحالي',
              type: 'select',
              placeholder: 'اختر المكتب',
              icon: 'meeting_room',
              options: allOffices.map((office) => ({
                value: office.get('id'),
                label: office.get('name'),
              })),
            },
            {
              name: 'custodian_user_id',
              label: 'حامل الأصل',
              type: 'select',
              placeholder: 'اختر حامل الأصل',
              icon: 'person',
              options: users.map((user) => ({
                value: user.get('id'),
                label: user.get('full_name'),
              })),
            },
            {
              name: 'purchase_date',
              label: 'تاريخ الشراء',
              type: 'date',
              placeholder: 'اختر تاريخ الشراء',
              icon: 'calendar_today',
            },
            {
              name: 'purchase_value',
              label: 'قيمة الشراء',
              type: 'number',
              placeholder: 'أدخل قيمة الشراء',
              icon: 'attach_money',
            },
            {
              name: 'currency_id',
              label: 'العملة',
              type: 'select',
              placeholder: 'اختر العملة',
              icon: 'payments',
              options: currencies.map((currency) => ({
                value: currency.get('id'),
                label: currency.get('name'),
              })),
            },
            {
              name: 'warranty_end',
              label: 'نهاية الضمان',
              type: 'date',
              placeholder: 'اختر تاريخ نهاية الضمان',
              icon: 'verified',
            },
            {
              name: 'notes',
              label: 'الملاحظات',
              type: 'textarea',
              placeholder: 'أدخل الملاحظات',
              icon: 'note',
            },
          ]}
          onSubmit={handleBulkEditSubmit}
          isLoading={bulkEditLoading}
          infoMessage="يمكنك تعديل كل أصل بشكل منفصل. سيتم حفظ جميع التعديلات عند الضغط على 'حفظ جميع التعديلات'."
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
