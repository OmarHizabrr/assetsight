'use client';

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PlusIcon } from "@/components/icons";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { DataTable } from "@/components/ui/DataTable";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import { BaseModel } from "@/lib/BaseModel";
import { firestoreApi } from "@/lib/FirestoreApi";
import { useEffect, useState } from "react";

function InventoryPageContent() {
  const [cycles, setCycles] = useState<BaseModel[]>([]);
  const [items, setItems] = useState<BaseModel[]>([]);
  const [departments, setDepartments] = useState<BaseModel[]>([]);
  const [offices, setOffices] = useState<BaseModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'cycles' | 'items'>('cycles');
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState<BaseModel | null>(null);
  const [editingItem, setEditingItem] = useState<BaseModel | null>(null);
  const [selectedCycleId, setSelectedCycleId] = useState<string>('');
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

  const handleCycleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const deptId = cycleFormData.get('department_id');
    if (!deptId) {
      alert("يرجى اختيار الإدارة");
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
      } else {
        const newId = firestoreApi.getNewId("cycles");
        const docRef = firestoreApi.getSubDocument(
          "departments",
          deptId,
          "departments",
          newId
        );
        await firestoreApi.setData(docRef, data);
      }
      setIsCycleModalOpen(false);
      setEditingCycle(null);
      setCycleFormData(new BaseModel({ name: '', start_date: '', end_date: '', department_id: '', notes: '' }));
      loadData();
    } catch (error) {
      console.error("Error saving cycle:", error);
      alert("حدث خطأ أثناء الحفظ");
    }
  };

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cycleId = itemFormData.get('cycle_id');
    if (!cycleId) {
      alert("يرجى اختيار الجولة");
      return;
    }
    
    const cycle = cycles.find(c => c.get('id') === cycleId);
    const deptId = cycle?.get('department_id');
    if (!deptId) {
      alert("معلومات الجولة غير صحيحة");
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
      loadData();
    } catch (error) {
      console.error("Error saving item:", error);
      alert("حدث خطأ أثناء الحفظ");
    }
  };

  const handleDeleteCycle = async (cycle: BaseModel) => {
    const id = cycle.get('id');
    const deptId = cycle.get('department_id');
    if (!id || !deptId) return;
    if (!confirm(`هل أنت متأكد من حذف ${cycle.get('name')}؟`)) return;
    
    try {
      const docRef = firestoreApi.getSubDocument(
        "departments",
        deptId,
        "departments",
        id
      );
      await firestoreApi.deleteData(docRef);
      loadData();
    } catch (error) {
      console.error("Error deleting cycle:", error);
      alert("حدث خطأ أثناء الحذف");
    }
  };

  const handleDeleteItem = async (item: BaseModel) => {
    const id = item.get('id');
    const cycleId = item.get('cycle_id');
    if (!id || !cycleId) return;
    if (!confirm('هل أنت متأكد من حذف هذا العنصر؟')) return;
    
    try {
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
      loadData();
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("حدث خطأ أثناء الحذف");
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
      render: (item: BaseModel) => item.get('name'),
    },
    { 
      key: 'start_date', 
      label: 'تاريخ البداية',
      render: (item: BaseModel) => item.get('start_date'),
    },
    { 
      key: 'end_date', 
      label: 'تاريخ النهاية',
      render: (item: BaseModel) => item.get('end_date'),
    },
    { 
      key: 'department_id', 
      label: 'الإدارة',
      render: (item: BaseModel) => getDepartmentName(item.get('department_id')),
    },
  ];

  const itemColumns = [
    { 
      key: 'cycle_id', 
      label: 'الجولة',
      render: (item: BaseModel) => getCycleName(item.get('cycle_id')),
    },
    { 
      key: 'scanned_tag', 
      label: 'التاج الممسوح',
      render: (item: BaseModel) => item.get('scanned_tag'),
    },
    { 
      key: 'scanned_office_id', 
      label: 'مكتب المسح',
      render: (item: BaseModel) => getOfficeName(item.get('scanned_office_id')),
    },
    { 
      key: 'found', 
      label: 'موجود',
      render: (item: BaseModel) => {
        const found = item.getValue<number>('found') === 1 || item.getValue<boolean>('found') === true;
        return found ? '✓' : '✗';
      },
    },
    { 
      key: 'note', 
      label: 'ملاحظة',
      render: (item: BaseModel) => item.get('note'),
    },
  ];

  return (
    <MainLayout>
      {/* Page Header */}
      <div className="mb-10">
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 flex items-center justify-center shadow-xl shadow-primary-500/40 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 material-transition"></div>
              <span className="text-3xl relative z-10">📋</span>
            </div>
            <div className="flex-1">
              <h1 className="text-5xl font-black bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent mb-2">الجرد</h1>
              <p className="text-slate-600 text-lg font-semibold">إدارة دورات الجرد وعناصر الجرد</p>
            </div>
          </div>
        </div>
      </div>

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
            <DataTable
              data={cycles}
              columns={cycleColumns}
              onEdit={(cycle) => {
                setEditingCycle(cycle);
                setCycleFormData(new BaseModel(cycle.getData()));
                setIsCycleModalOpen(true);
              }}
              onDelete={handleDeleteCycle}
              loading={loading}
            />
          </div>
        )}

        {activeTab === 'items' && (
          <div>
            <div className="mb-4 flex justify-between items-center gap-4">
              <Select
                value={selectedCycleId}
                onChange={(e) => setSelectedCycleId(e.target.value)}
                options={[
                  { value: '', label: 'جميع الدورات' },
                  ...cycles.map((cycle) => ({
                    value: cycle.get('id'),
                    label: cycle.get('name'),
                  })),
                ]}
                className="flex-1 max-w-xs"
              />
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
            </div>
            <DataTable
              data={filteredItems}
              columns={itemColumns}
                onEdit={(item) => {
                  setEditingItem(item);
                  const itemData = item.getData();
                  itemData.found = item.getValue<number>('found') === 1 || item.getValue<boolean>('found') === true;
                  setItemFormData(new BaseModel(itemData));
                  setIsItemModalOpen(true);
                }}
                onDelete={handleDeleteItem}
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
          size="md"
        >
          <form onSubmit={handleCycleSubmit} className="space-y-6">
            <Input
              label="اسم الجولة"
              type="text"
              required
              value={cycleFormData.get('name')}
              onChange={(e) => updateCycleField('name', e.target.value)}
              placeholder="أدخل اسم الجولة"
            />
            <div className="grid grid-cols-2 gap-4">
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
            <Select
              label="الإدارة"
              value={cycleFormData.get('department_id')}
              onChange={(e) => updateCycleField('department_id', e.target.value)}
              options={departments.map((dept) => ({
                value: dept.get('id'),
                label: dept.get('name'),
              }))}
            />
            <Textarea
              label="الملاحظات"
              value={cycleFormData.get('notes')}
              onChange={(e) => updateCycleField('notes', e.target.value)}
              rows={3}
              placeholder="أدخل أي ملاحظات إضافية"
            />
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCycleModalOpen(false)}
                size="lg"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="lg"
              >
                {editingCycle ? "تحديث" : "حفظ"}
              </Button>
            </div>
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
          size="md"
        >
          <form onSubmit={handleItemSubmit} className="space-y-6">
            <Select
              label="الجولة"
              required
              value={itemFormData.get('cycle_id')}
              onChange={(e) => updateItemField('cycle_id', e.target.value)}
              options={cycles.map((cycle) => ({
                value: cycle.get('id'),
                label: cycle.get('name'),
              }))}
            />
            <Input
              label="التاج الممسوح"
              type="text"
              value={itemFormData.get('scanned_tag')}
              onChange={(e) => updateItemField('scanned_tag', e.target.value)}
              placeholder="كود الأصل الممسوح ضوئياً"
            />
            <Select
              label="مكتب المسح"
              value={itemFormData.get('scanned_office_id')}
              onChange={(e) => updateItemField('scanned_office_id', e.target.value)}
              options={offices.map((office) => ({
                value: office.get('id'),
                label: office.get('name'),
              }))}
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
              rows={3}
              placeholder="أدخل أي ملاحظات"
            />
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsItemModalOpen(false)}
                size="lg"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="lg"
              >
                {editingItem ? "تحديث" : "حفظ"}
              </Button>
            </div>
          </form>
        </Modal>
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
