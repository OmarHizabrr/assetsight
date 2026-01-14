'use client';

import { ProtectedRoute, usePermissions } from "@/components/auth/ProtectedRoute";
import { PlusIcon } from "@/components/icons";
import { AdminPageHeader } from "@/components/layout/AdminPageHeader";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { DataTable } from "@/components/ui/DataTable";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { Tabs } from "@/components/ui/Tabs";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/contexts/ToastContext";
import { BaseModel } from "@/lib/BaseModel";
import { firestoreApi } from "@/lib/FirestoreApi";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

function InventoryPageContent() {
  const pathname = usePathname();
  const { canAdd, canEdit, canDelete } = usePermissions(pathname || '/admin/inventory');
  const { showSuccess, showError, showWarning } = useToast();
  const [cycles, setCycles] = useState<BaseModel[]>([]);
  const [items, setItems] = useState<BaseModel[]>([]);
  const [departments, setDepartments] = useState<BaseModel[]>([]);
  const [offices, setOffices] = useState<BaseModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'cycles' | 'items'>('cycles');
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [deletingCycle, setDeletingCycle] = useState<BaseModel | null>(null);
  const [deletingItem, setDeletingItem] = useState<BaseModel | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteType, setDeleteType] = useState<'cycle' | 'item'>('cycle');
  const [editingCycle, setEditingCycle] = useState<BaseModel | null>(null);
  const [editingItem, setEditingItem] = useState<BaseModel | null>(null);
  const [selectedCycleId, setSelectedCycleId] = useState<string>('');
  const [isBulkEditCycleModalOpen, setIsBulkEditCycleModalOpen] = useState(false);
  const [isBulkEditItemModalOpen, setIsBulkEditItemModalOpen] = useState(false);
  const [bulkEditCycleLoading, setBulkEditCycleLoading] = useState(false);
  const [bulkEditItemLoading, setBulkEditItemLoading] = useState(false);
  const [selectedCyclesForBulkEdit, setSelectedCyclesForBulkEdit] = useState<BaseModel[]>([]);
  const [selectedItemsForBulkEdit, setSelectedItemsForBulkEdit] = useState<BaseModel[]>([]);
  const [bulkEditCycleFormDataArray, setBulkEditCycleFormDataArray] = useState<BaseModel[]>([]);
  const [bulkEditItemFormDataArray, setBulkEditItemFormDataArray] = useState<BaseModel[]>([]);
  const [cycleFormData, setCycleFormData] = useState<BaseModel>(new BaseModel({
    name: '',
    start_date: '',
    end_date: '',
    department_id: '',
    notes: '',
  }));
  const [itemFormData, setItemFormData] = useState<BaseModel>(new BaseModel({
    cycle_id: '',
    asset_id: '',
    scanned_tag: '',
    scanned_office_id: '',
    found: true,
    note: '',
  }));

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // جلب جميع الإدارات
      const deptDocs = await firestoreApi.getDocuments(firestoreApi.getCollection("departments"));
      const departmentsData = BaseModel.fromFirestoreArray(deptDocs);
      setDepartments(departmentsData);

      // جلب جميع المكاتب
      const allOffices: BaseModel[] = [];
      for (const dept of departmentsData) {
        const deptId = dept.get('id');
        if (deptId) {
          const subCollectionRef = firestoreApi.getSubCollection("departments", deptId, "departments");
          const officeDocs = await firestoreApi.getDocuments(subCollectionRef);
          const offices = BaseModel.fromFirestoreArray(officeDocs);
          offices.forEach(office => {
            office.put('department_id', deptId);
            allOffices.push(office);
          });
        }
      }
      setOffices(allOffices);

      // جلب جميع دورات الجرد من جميع الإدارات
      const allCycles: BaseModel[] = [];
      for (const dept of departmentsData) {
        const deptId = dept.get('id');
        if (deptId) {
          const subCollectionRef = firestoreApi.getSubCollection("departments", deptId, "departments");
          const cycleDocs = await firestoreApi.getDocuments(subCollectionRef);
          const cycles = BaseModel.fromFirestoreArray(cycleDocs);
          cycles.forEach(cycle => {
            cycle.put('department_id', deptId);
            allCycles.push(cycle);
          });
        }
      }
      setCycles(allCycles);

      // جلب جميع عناصر الجرد من جميع الدورات
      const allItems: BaseModel[] = [];
      for (const cycle of allCycles) {
        const cycleId = cycle.get('id');
        const deptId = cycle.get('department_id');
        if (cycleId && deptId) {
          const nestedSubCollectionRef = firestoreApi.getNestedSubCollection(
            "departments",
            deptId,
            "departments",
            cycleId,
            "inventoryItems"
          );
          const itemDocs = await firestoreApi.getDocuments(nestedSubCollectionRef);
          const items = BaseModel.fromFirestoreArray(itemDocs);
          items.forEach(item => {
            item.put('cycle_id', cycleId);
            allItems.push(item);
          });
        }
      }
      setItems(allItems);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateCycleField = (key: string, value: any) => {
    const newData = new BaseModel(cycleFormData.getData());
    newData.put(key, value);
    setCycleFormData(newData);
  };

  const updateItemField = (key: string, value: any) => {
    const newData = new BaseModel(itemFormData.getData());
    newData.put(key, value);
    setItemFormData(newData);
  };

  const handleCycleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const deptId = cycleFormData.get('department_id');
    if (!deptId) {
      showWarning("يرجى اختيار الإدارة");
      return;
    }

    try {
      const data = cycleFormData.getData();
      const cycleId = editingCycle?.get('id');
      const editingDeptId = editingCycle?.get('department_id');

      if (cycleId && editingDeptId) {
        const docRef = firestoreApi.getSubDocument(
          "departments",
          editingDeptId,
          "departments",
          cycleId
        );
        await firestoreApi.updateData(docRef, data);
        showSuccess("تم تحديث دورة الجرد بنجاح");
      } else {
        const newId = firestoreApi.getNewId("cycles");
        const docRef = firestoreApi.getSubDocument(
          "departments",
          deptId,
          "departments",
          newId
        );
        await firestoreApi.setData(docRef, data);
        showSuccess("تم إضافة دورة الجرد بنجاح");
      }
      setIsCycleModalOpen(false);
      setEditingCycle(null);
      setCycleFormData(new BaseModel({ name: '', start_date: '', end_date: '', department_id: '', notes: '' }));
      loadData();
    } catch (error) {
      console.error("Error saving cycle:", error);
      showError("حدث خطأ أثناء الحفظ");
    }
  }, [cycleFormData, editingCycle, showSuccess, showError, showWarning]);

  const handleItemSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const cycleId = itemFormData.get('cycle_id');
    if (!cycleId) {
      showWarning("يرجى اختيار الجولة");
      return;
    }

    const cycle = cycles.find(c => c.get('id') === cycleId);
    const deptId = cycle?.get('department_id');
    if (!deptId) {
      showWarning("معلومات الجولة غير صحيحة");
      return;
    }

    try {
      const data = itemFormData.getData();
      data.found = itemFormData.getValue<boolean>('found') ? 1 : 0;

      const itemId = editingItem?.get('id');
      if (itemId) {
        const docRef = firestoreApi.getNestedSubDocument(
          "departments",
          deptId,
          "departments",
          cycleId,
          "inventoryItems",
          itemId
        );
        await firestoreApi.updateData(docRef, data);
      } else {
        const newId = firestoreApi.getNewId("items");
        const docRef = firestoreApi.getNestedSubDocument(
          "departments",
          deptId,
          "departments",
          cycleId,
          "inventoryItems",
          newId
        );
        await firestoreApi.setData(docRef, data);
      }
      setIsItemModalOpen(false);
      setEditingItem(null);
      setItemFormData(new BaseModel({ cycle_id: '', asset_id: '', scanned_tag: '', scanned_office_id: '', found: true, note: '' }));
      showSuccess(editingItem ? "تم تحديث عنصر الجرد بنجاح" : "تم إضافة عنصر الجرد بنجاح");
      loadData();
    } catch (error) {
      console.error("Error saving item:", error);
      showError("حدث خطأ أثناء الحفظ");
    }
  }, [itemFormData, cycles, editingItem, showSuccess, showError, showWarning]);

  const handleDeleteCycle = (cycle: BaseModel) => {
    setDeletingCycle(cycle);
    setDeleteType('cycle');
    setIsConfirmModalOpen(true);
  };

  const handleDeleteItem = (item: BaseModel) => {
    setDeletingItem(item);
    setDeleteType('item');
    setIsConfirmModalOpen(true);
  };

  const handleBulkEditCycles = (selectedItems: BaseModel[]) => {
    setSelectedCyclesForBulkEdit(selectedItems);
    const formDataArray = selectedItems.map(item => new BaseModel(item.getData()));
    setBulkEditCycleFormDataArray(formDataArray);
    setIsBulkEditCycleModalOpen(true);
  };

  const handleBulkEditItems = (selectedItems: BaseModel[]) => {
    setSelectedItemsForBulkEdit(selectedItems);
    const formDataArray = selectedItems.map(item => {
      const itemData = item.getData();
      itemData.found = item.getValue<number>('found') === 1 || item.getValue<boolean>('found') === true;
      return new BaseModel(itemData);
    });
    setBulkEditItemFormDataArray(formDataArray);
    setIsBulkEditItemModalOpen(true);
  };

  const handleBulkEditCyclesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCyclesForBulkEdit.length === 0) return;

    try {
      setBulkEditCycleLoading(true);

      const updatePromises = selectedCyclesForBulkEdit.map(async (cycle, index) => {
        const cycleId = cycle.get('id');
        const deptId = cycle.get('department_id');
        if (!cycleId || !deptId) return;

        const formData = bulkEditCycleFormDataArray[index];
        if (!formData) return;

        const updates = formData.getData();
        const docRef = firestoreApi.getSubDocument(
          "departments",
          deptId,
          "departments",
          cycleId
        );
        await firestoreApi.updateData(docRef, updates);
      });

      await Promise.all(updatePromises);

      setIsBulkEditCycleModalOpen(false);
      setSelectedCyclesForBulkEdit([]);
      setBulkEditCycleFormDataArray([]);
      loadData();
      showSuccess(`تم تحديث ${selectedCyclesForBulkEdit.length} دورة بنجاح`);
    } catch (error) {
      console.error("Error in bulk edit cycles:", error);
      showError("حدث خطأ أثناء التحديث الجماعي");
    } finally {
      setBulkEditCycleLoading(false);
    }
  };

  const handleBulkEditItemsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItemsForBulkEdit.length === 0) return;

    try {
      setBulkEditItemLoading(true);

      const updatePromises = selectedItemsForBulkEdit.map(async (item, index) => {
        const itemId = item.get('id');
        const cycleId = item.get('cycle_id');
        if (!itemId || !cycleId) return;

        const cycle = cycles.find(c => c.get('id') === cycleId);
        const deptId = cycle?.get('department_id');
        if (!deptId) return;

        const formData = bulkEditItemFormDataArray[index];
        if (!formData) return;

        const updates = formData.getData();
        // معالجة found
        if ('found' in updates) {
          updates.found = formData.getValue<boolean>('found') ? 1 : 0;
        }

        const docRef = firestoreApi.getNestedSubDocument(
          "departments",
          deptId,
          "departments",
          cycleId,
          "inventoryItems",
          itemId
        );
        await firestoreApi.updateData(docRef, updates);
      });

      await Promise.all(updatePromises);

      setIsBulkEditItemModalOpen(false);
      setSelectedItemsForBulkEdit([]);
      setBulkEditItemFormDataArray([]);
      loadData();
      showSuccess(`تم تحديث ${selectedItemsForBulkEdit.length} عنصر بنجاح`);
    } catch (error) {
      console.error("Error in bulk edit items:", error);
      showError("حدث خطأ أثناء التحديث الجماعي");
    } finally {
      setBulkEditItemLoading(false);
    }
  };

  const updateBulkEditCycleField = useCallback((index: number, key: string, value: any) => {
    const newArray = [...bulkEditCycleFormDataArray];
    const newData = new BaseModel(newArray[index].getData());
    newData.put(key, value);
    newArray[index] = newData;
    setBulkEditCycleFormDataArray(newArray);
  }, [bulkEditCycleFormDataArray]);

  const updateBulkEditItemField = useCallback((index: number, key: string, value: any) => {
    const newArray = [...bulkEditItemFormDataArray];
    const newData = new BaseModel(newArray[index].getData());
    newData.put(key, value);
    newArray[index] = newData;
    setBulkEditItemFormDataArray(newArray);
  }, [bulkEditItemFormDataArray]);

  const confirmDelete = async () => {
    if (deleteType === 'cycle' && deletingCycle) {
      const id = deletingCycle.get('id');
      const deptId = deletingCycle.get('department_id');
      if (!id || !deptId) return;

      try {
        setDeleteLoading(true);
        const docRef = firestoreApi.getSubDocument(
          "departments",
          deptId,
          "departments",
          id
        );
        await firestoreApi.deleteData(docRef);
        showSuccess("تم حذف دورة الجرد بنجاح");
        loadData();
        setIsConfirmModalOpen(false);
        setDeletingCycle(null);
      } catch (error) {
        console.error("Error deleting cycle:", error);
        showError("حدث خطأ أثناء الحذف");
      } finally {
        setDeleteLoading(false);
      }
    } else if (deleteType === 'item' && deletingItem) {
      const id = deletingItem.get('id');
      const cycleId = deletingItem.get('cycle_id');
      if (!id || !cycleId) return;

      try {
        setDeleteLoading(true);
        const cycle = cycles.find(c => c.get('id') === cycleId);
        const deptId = cycle?.get('department_id');
        if (deptId) {
          const docRef = firestoreApi.getNestedSubDocument(
            "departments",
            deptId,
            "departments",
            cycleId,
            "inventoryItems",
            id
          );
          await firestoreApi.deleteData(docRef);
        }
        showSuccess("تم حذف عنصر الجرد بنجاح");
        loadData();
        setIsConfirmModalOpen(false);
        setDeletingItem(null);
      } catch (error) {
        console.error("Error deleting item:", error);
        showError("حدث خطأ أثناء الحذف");
      } finally {
        setDeleteLoading(false);
      }
    }
  };

  const getDepartmentName = (id?: string) => {
    if (!id) return '-';
    const dept = departments.find(d => d.get('id') === id);
    return dept?.get('name') || '-';
  };

  const getOfficeName = (id?: string) => {
    if (!id) return '-';
    const office = offices.find(o => o.get('id') === id);
    return office?.get('name') || '-';
  };

  const getCycleName = (id?: string) => {
    if (!id) return '-';
    const cycle = cycles.find(c => c.get('id') === id);
    return cycle?.get('name') || '-';
  };

  const filteredItems = selectedCycleId
    ? items.filter(item => item.get('cycle_id') === selectedCycleId)
    : items;

  const cycleColumns = [
    {
      key: 'name',
      label: 'اسم الجولة',
      sortable: true,
    },
    {
      key: 'start_date',
      label: 'تاريخ البداية',
      sortable: true,
    },
    {
      key: 'end_date',
      label: 'تاريخ النهاية',
      sortable: true,
    },
    {
      key: 'department_id',
      label: 'الإدارة',
      render: (item: BaseModel) => getDepartmentName(item.get('department_id')),
      sortable: true,
    },
  ];

  const itemColumns = [
    {
      key: 'cycle_id',
      label: 'الجولة',
      render: (item: BaseModel) => getCycleName(item.get('cycle_id')),
      sortable: true,
    },
    {
      key: 'scanned_tag',
      label: 'التاج الممسوح',
      sortable: true,
    },
    {
      key: 'scanned_office_id',
      label: 'مكتب المسح',
      render: (item: BaseModel) => getOfficeName(item.get('scanned_office_id')),
      sortable: true,
    },
    {
      key: 'found',
      label: 'موجود',
      render: (item: BaseModel) => {
        const found = item.getValue<number>('found') === 1 || item.getValue<boolean>('found') === true;
        return found ? '✓' : '✗';
      },
      sortable: true,
    },
    {
      key: 'note',
      label: 'ملاحظة',
      sortable: true,
    },
  ];

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Page Header */}
        <AdminPageHeader
          title="الجرد"
          subtitle="إدارة دورات الجرد وعناصر الجرد"
          iconName="checklist"
        />

        {/* Content Card */}
        <Card variant="elevated" className="mb-6 shadow-2xl border-0 bg-white/80 backdrop-blur-xl overflow-hidden">
          <CardBody padding="md">
            <Tabs
              tabs={[
                { id: 'cycles', label: 'دورات الجرد' },
                { id: 'items', label: 'عناصر الجرد' },
              ]}
              activeTab={activeTab}
              onTabChange={(tabId) => setActiveTab(tabId as 'cycles' | 'items')}
            />
          </CardBody>
        </Card>

        {activeTab === 'cycles' && (
          <div>
            {canAdd && (
              <div className="flex justify-end mb-4">
                <Button
                  onClick={() => {
                    setEditingCycle(null);
                    setCycleFormData(new BaseModel({ name: '', start_date: '', end_date: '', department_id: '', notes: '' }));
                    setIsCycleModalOpen(true);
                  }}
                  leftIcon={<PlusIcon className="w-5 h-5" />}
                  size="md"
                >
                  إضافة دورة جديدة
                </Button>
              </div>
            )}
            <DataTable
              data={cycles}
              columns={cycleColumns}
              onEdit={canEdit ? ((cycle) => {
                setEditingCycle(cycle);
                setCycleFormData(new BaseModel(cycle.getData()));
                setIsCycleModalOpen(true);
              }) : undefined}
              onDelete={canDelete ? handleDeleteCycle : undefined}
              onBulkEdit={(canEdit || canDelete) ? handleBulkEditCycles : undefined}
              loading={loading}
            />
          </div>
        )}

        {activeTab === 'items' && (
          <div>
            <div className="mb-4 flex justify-between items-center gap-4">
              <SearchableSelect
                value={selectedCycleId}
                onChange={(value) => setSelectedCycleId(value)}
                options={[
                  { value: '', label: 'جميع الدورات' },
                  ...cycles.map((cycle) => ({
                    value: cycle.get('id'),
                    label: cycle.get('name'),
                  })),
                ]}
                placeholder="اختر الدورة"
                className="flex-1 max-w-xs"
                fullWidth={false}
              />
              {canAdd && (
                <Button
                  onClick={() => {
                    setEditingItem(null);
                    const newData = new BaseModel({ cycle_id: selectedCycleId || '', asset_id: '', scanned_tag: '', scanned_office_id: '', found: true, note: '' });
                    setItemFormData(newData);
                    setIsItemModalOpen(true);
                  }}
                  leftIcon={<PlusIcon className="w-5 h-5" />}
                  size="md"
                >
                  إضافة عنصر جديد
                </Button>
              )}
            </div>
            <DataTable
              data={filteredItems}
              columns={itemColumns}
              onEdit={canEdit ? ((item) => {
                setEditingItem(item);
                const itemData = item.getData();
                itemData.found = item.getValue<number>('found') === 1 || item.getValue<boolean>('found') === true;
                setItemFormData(new BaseModel(itemData));
                setIsItemModalOpen(true);
              }) : undefined}
              onDelete={canDelete ? handleDeleteItem : undefined}
              onBulkEdit={(canEdit || canDelete) ? handleBulkEditItems : undefined}
              loading={loading}
            />
          </div>
        )}

        {/* Cycle Modal */}
        <Modal
          isOpen={isCycleModalOpen}
          onClose={() => {
            setIsCycleModalOpen(false);
            setEditingCycle(null);
            setCycleFormData(new BaseModel({ name: '', start_date: '', end_date: '', department_id: '', notes: '' }));
          }}
          title={editingCycle ? "تعديل دورة جرد" : "إضافة دورة جرد جديدة"}
          size="lg"
          footer={
            <div className="flex flex-col justify-end gap-3 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCycleModalOpen(false)}
                size="lg"
                className="w-full font-bold"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                form="cycle-form"
                variant="primary"
                size="lg"
                className="w-full font-bold shadow-xl shadow-primary-500/30"
              >
                {editingCycle ? "تحديث" : "حفظ"}
              </Button>
            </div>
          }
        >
          <form id="cycle-form" onSubmit={handleCycleSubmit} className="space-y-6">
            <Input
              label="اسم الجولة"
              type="text"
              required
              value={cycleFormData.get('name')}
              onChange={(e) => updateCycleField('name', e.target.value)}
              placeholder="أدخل اسم الجولة"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="تاريخ البداية"
                type="date"
                value={cycleFormData.get('start_date')}
                onChange={(e) => updateCycleField('start_date', e.target.value)}
              />
              <Input
                label="تاريخ النهاية"
                type="date"
                value={cycleFormData.get('end_date')}
                onChange={(e) => updateCycleField('end_date', e.target.value)}
              />
            </div>
            <SearchableSelect
              label="الإدارة"
              value={cycleFormData.get('department_id')}
              onChange={(value) => updateCycleField('department_id', value)}
              options={departments.map((dept) => ({
                value: dept.get('id'),
                label: dept.get('name'),
              }))}
              placeholder="اختر الإدارة"
            />
            <Textarea
              label="الملاحظات"
              value={cycleFormData.get('notes')}
              onChange={(e) => updateCycleField('notes', e.target.value)}
              rows={1}
              placeholder="أدخل أي ملاحظات إضافية"
            />
          </form>
        </Modal>

        {/* Item Modal */}
        <Modal
          isOpen={isItemModalOpen}
          onClose={() => {
            setIsItemModalOpen(false);
            setEditingItem(null);
            setItemFormData(new BaseModel({ cycle_id: '', asset_id: '', scanned_tag: '', scanned_office_id: '', found: true, note: '' }));
          }}
          title={editingItem ? "تعديل عنصر جرد" : "إضافة عنصر جرد جديد"}
          size="lg"
          footer={
            <div className="flex flex-col justify-end gap-3 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsItemModalOpen(false)}
                size="lg"
                className="w-full font-bold"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                form="item-form"
                variant="primary"
                size="lg"
                className="w-full font-bold shadow-xl shadow-primary-500/30"
              >
                {editingItem ? "تحديث" : "حفظ"}
              </Button>
            </div>
          }
        >
          <form id="item-form" onSubmit={handleItemSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SearchableSelect
                label="الجولة"
                required
                value={itemFormData.get('cycle_id')}
                onChange={(value) => updateItemField('cycle_id', value)}
                options={cycles.map((cycle) => ({
                  value: cycle.get('id'),
                  label: cycle.get('name'),
                }))}
                placeholder="اختر الجولة"
              />
              <SearchableSelect
                label="مكتب المسح"
                value={itemFormData.get('scanned_office_id')}
                onChange={(value) => updateItemField('scanned_office_id', value)}
                options={offices.map((office) => ({
                  value: office.get('id'),
                  label: office.get('name'),
                }))}
                placeholder="اختر مكتب المسح"
              />
            </div>
            <Input
              label="التاج الممسوح"
              type="text"
              value={itemFormData.get('scanned_tag')}
              onChange={(e) => updateItemField('scanned_tag', e.target.value)}
              placeholder="كود الأصل الممسوح ضوئياً"
            />
            <Checkbox
              label="موجود"
              checked={itemFormData.getValue<boolean>('found') === true || itemFormData.getValue<number>('found') === 1}
              onChange={(e) => updateItemField('found', e.target.checked)}
            />
            <Textarea
              label="ملاحظة"
              value={itemFormData.get('note')}
              onChange={(e) => updateItemField('note', e.target.value)}
              rows={1}
              placeholder="أدخل أي ملاحظات"
            />
          </form>
        </Modal>

        {/* Confirm Delete Modal */}
        <ConfirmModal
          isOpen={isConfirmModalOpen}
          onClose={() => {
            setIsConfirmModalOpen(false);
            setDeletingCycle(null);
            setDeletingItem(null);
          }}
          onConfirm={confirmDelete}
          title="تأكيد الحذف"
          message={
            deleteType === 'cycle'
              ? `هل أنت متأكد من حذف ${deletingCycle?.get('name') || 'هذا الدورة'}؟ لا يمكن التراجع عن هذا الإجراء.`
              : 'هل أنت متأكد من حذف هذا العنصر؟ لا يمكن التراجع عن هذا الإجراء.'
          }
          confirmText="حذف"
          cancelText="إلغاء"
          variant="danger"
          loading={deleteLoading}
        />

        {/* Bulk Edit Cycle Modal */}
        <Modal
          isOpen={isBulkEditCycleModalOpen}
          onClose={() => {
            setIsBulkEditCycleModalOpen(false);
            setSelectedCyclesForBulkEdit([]);
            setBulkEditCycleFormDataArray([]);
          }}
          title={`تحرير جماعي (${selectedCyclesForBulkEdit.length} دورة)`}
          size="full"
          footer={
            <div className="flex flex-col justify-end gap-3 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsBulkEditCycleModalOpen(false);
                  setSelectedCyclesForBulkEdit([]);
                  setBulkEditCycleFormDataArray([]);
                }}
                size="lg"
                className="w-full font-bold"
                disabled={bulkEditCycleLoading}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                form="bulk-edit-cycle-form"
                className="w-full font-bold shadow-xl shadow-primary-500/30"
                isLoading={bulkEditCycleLoading}
              >
                حفظ جميع التعديلات ({selectedCyclesForBulkEdit.length})
              </Button>
            </div>
          }
        >
          <div className="mb-4 p-4 bg-primary-50 rounded-lg border border-primary-200">
            <p className="text-sm text-primary-800 font-medium">
              يمكنك تعديل كل دورة بشكل منفصل. سيتم حفظ جميع التعديلات عند الضغط على "حفظ جميع التعديلات".
            </p>
          </div>
          <form id="bulk-edit-cycle-form" onSubmit={handleBulkEditCyclesSubmit} className="space-y-6">
            <div className="max-h-[60vh] overflow-y-auto space-y-6 pr-2">
              {selectedCyclesForBulkEdit.map((cycle, index) => {
                const formData = bulkEditCycleFormDataArray[index];
                if (!formData) return null;

                return (
                  <div key={cycle.get('id') || index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <h4 className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-300">
                      {cycle.get('name') || `دورة ${index + 1}`}
                    </h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="تاريخ البداية"
                          type="date"
                          value={formData.get('start_date') || ''}
                          onChange={(e) => updateBulkEditCycleField(index, 'start_date', e.target.value)}
                          fullWidth={false}
                        />
                        <Input
                          label="تاريخ النهاية"
                          type="date"
                          value={formData.get('end_date') || ''}
                          onChange={(e) => updateBulkEditCycleField(index, 'end_date', e.target.value)}
                          fullWidth={false}
                        />
                      </div>
                      <Textarea
                        label="الملاحظات"
                        value={formData.get('notes') || ''}
                        onChange={(e) => updateBulkEditCycleField(index, 'notes', e.target.value)}
                        rows={2}
                        placeholder="أدخل الملاحظات"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </form>
        </Modal>

        {/* Bulk Edit Item Modal */}
        <Modal
          isOpen={isBulkEditItemModalOpen}
          onClose={() => {
            setIsBulkEditItemModalOpen(false);
            setSelectedItemsForBulkEdit([]);
            setBulkEditItemFormDataArray([]);
          }}
          title={`تحرير جماعي (${selectedItemsForBulkEdit.length} عنصر)`}
          size="xl"
          footer={
            <div className="flex flex-col justify-end gap-3 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsBulkEditItemModalOpen(false);
                  setSelectedItemsForBulkEdit([]);
                  setBulkEditItemFormDataArray([]);
                }}
                size="lg"
                className="w-full font-bold"
                disabled={bulkEditItemLoading}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                form="bulk-edit-item-form"
                className="w-full font-bold shadow-xl shadow-primary-500/30"
                isLoading={bulkEditItemLoading}
              >
                حفظ جميع التعديلات ({selectedItemsForBulkEdit.length})
              </Button>
            </div>
          }
        >
          <div className="mb-4 p-4 bg-primary-50 rounded-lg border border-primary-200">
            <p className="text-sm text-primary-800 font-medium">
              يمكنك تعديل كل عنصر بشكل منفصل. سيتم حفظ جميع التعديلات عند الضغط على "حفظ جميع التعديلات".
            </p>
          </div>
          <form id="bulk-edit-item-form" onSubmit={handleBulkEditItemsSubmit} className="space-y-6">
            <div className="max-h-[60vh] overflow-y-auto space-y-6 pr-2">
              {selectedItemsForBulkEdit.map((item, index) => {
                const formData = bulkEditItemFormDataArray[index];
                if (!formData) return null;

                return (
                  <div key={item.get('id') || index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <h4 className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-300">
                      {getCycleName(item.get('cycle_id'))} - {item.get('scanned_tag') || `عنصر ${index + 1}`}
                    </h4>
                    <div className="space-y-4">
                      <SearchableSelect
                        label="المكتب الممسوح"
                        value={formData.get('scanned_office_id')}
                        onChange={(value) => updateBulkEditItemField(index, 'scanned_office_id', value)}
                        options={offices.map((office) => ({
                          value: office.get('id'),
                          label: office.get('name'),
                        }))}
                        placeholder="اختر المكتب"
                      />
                      <Checkbox
                        label="تم العثور عليه"
                        checked={formData.getValue<boolean>('found') === true || formData.getValue<number>('found') === 1}
                        onChange={(e) => updateBulkEditItemField(index, 'found', e.target.checked)}
                      />
                      <Textarea
                        label="ملاحظة"
                        value={formData.get('note') || ''}
                        onChange={(e) => updateBulkEditItemField(index, 'note', e.target.value)}
                        rows={2}
                        placeholder="أدخل الملاحظة"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </form>
        </Modal>
      </div>
    </MainLayout>
  );
}

export default function InventoryPage() {
  return (
    <ProtectedRoute>
      <InventoryPageContent />
    </ProtectedRoute>
  );
}
