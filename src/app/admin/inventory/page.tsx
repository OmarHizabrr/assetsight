'use client';

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MainLayout } from "@/components/layout/MainLayout";
import { DataTable } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
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
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">الجرد</h1>
        </div>

        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 space-x-reverse">
              <button
                onClick={() => setActiveTab('cycles')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'cycles'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                دورات الجرد
              </button>
              <button
                onClick={() => setActiveTab('items')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'items'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                عناصر الجرد
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'cycles' && (
          <>
            <div className="flex justify-end mb-4">
              <button
                onClick={() => {
                  setEditingCycle(null);
                  setCycleFormData(new BaseModel({ name: '', start_date: '', end_date: '', department_id: '', notes: '' }));
                  setIsCycleModalOpen(true);
                }}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                إضافة دورة جديدة
              </button>
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
          </>
        )}

        {activeTab === 'items' && (
          <>
            <div className="mb-4 flex justify-between items-center">
              <select
                value={selectedCycleId}
                onChange={(e) => setSelectedCycleId(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">جميع الدورات</option>
                {cycles.map((cycle) => (
                  <option key={cycle.get('id')} value={cycle.get('id')}>
                    {cycle.get('name')}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  setEditingItem(null);
                  const newData = new BaseModel({ cycle_id: selectedCycleId || '', asset_id: '', scanned_tag: '', scanned_office_id: '', found: true, note: '' });
                  setItemFormData(newData);
                  setIsItemModalOpen(true);
                }}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                إضافة عنصر جديد
              </button>
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
          </>
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
        >
          <form onSubmit={handleCycleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                اسم الجولة <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={cycleFormData.get('name')}
                onChange={(e) => updateCycleField('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  تاريخ البداية
                </label>
                <input
                  type="date"
                  value={cycleFormData.get('start_date')}
                  onChange={(e) => updateCycleField('start_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  تاريخ النهاية
                </label>
                <input
                  type="date"
                  value={cycleFormData.get('end_date')}
                  onChange={(e) => updateCycleField('end_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الإدارة
              </label>
              <select
                value={cycleFormData.get('department_id')}
                onChange={(e) => updateCycleField('department_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">اختر الإدارة</option>
                {departments.map((dept) => (
                  <option key={dept.get('id')} value={dept.get('id')}>
                    {dept.get('name')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الملاحظات
              </label>
              <textarea
                value={cycleFormData.get('notes')}
                onChange={(e) => updateCycleField('notes', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex justify-end space-x-2 space-x-reverse pt-4">
              <button
                type="button"
                onClick={() => setIsCycleModalOpen(false)}
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

        {/* Item Modal */}
        <Modal
          isOpen={isItemModalOpen}
          onClose={() => {
            setIsItemModalOpen(false);
            setEditingItem(null);
            setItemFormData(new BaseModel({ cycle_id: '', asset_id: '', scanned_tag: '', scanned_office_id: '', found: true, note: '' }));
          }}
          title={editingItem ? "تعديل عنصر جرد" : "إضافة عنصر جرد جديد"}
        >
          <form onSubmit={handleItemSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الجولة <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={itemFormData.get('cycle_id')}
                onChange={(e) => updateItemField('cycle_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">اختر الجولة</option>
                {cycles.map((cycle) => (
                  <option key={cycle.get('id')} value={cycle.get('id')}>
                    {cycle.get('name')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                التاج الممسوح
              </label>
              <input
                type="text"
                value={itemFormData.get('scanned_tag')}
                onChange={(e) => updateItemField('scanned_tag', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="كود الأصل الممسوح ضوئياً"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                مكتب المسح
              </label>
              <select
                value={itemFormData.get('scanned_office_id')}
                onChange={(e) => updateItemField('scanned_office_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">اختر المكتب</option>
                {offices.map((office) => (
                  <option key={office.get('id')} value={office.get('id')}>
                    {office.get('name')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={itemFormData.getValue<boolean>('found') === true || itemFormData.getValue<number>('found') === 1}
                  onChange={(e) => updateItemField('found', e.target.checked)}
                  className="ml-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">موجود</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ملاحظة
              </label>
              <textarea
                value={itemFormData.get('note')}
                onChange={(e) => updateItemField('note', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex justify-end space-x-2 space-x-reverse pt-4">
              <button
                type="button"
                onClick={() => setIsItemModalOpen(false)}
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

export default function InventoryPage() {
  return (
    <ProtectedRoute>
      <InventoryPageContent />
    </ProtectedRoute>
  );
}
