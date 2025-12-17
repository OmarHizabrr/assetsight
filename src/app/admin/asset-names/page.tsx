'use client';

import { ProtectedRoute, usePermissions } from "@/components/auth/ProtectedRoute";
import { PlusIcon } from "@/components/icons";
import { MaterialIcon } from "@/components/icons/MaterialIcon";
import { MainLayout } from "@/components/layout/MainLayout";
import { BulkEditModal } from "@/components/ui/BulkEditModal";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { DataTable } from "@/components/ui/DataTable";
import { ImportExcelModal } from "@/components/ui/ImportExcelModal";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/contexts/ToastContext";
import { BaseModel } from "@/lib/BaseModel";
import { firestoreApi } from "@/lib/FirestoreApi";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import * as XLSX from 'xlsx';

function AssetNamesPageContent() {
  const pathname = usePathname();
  const { canAdd, canEdit, canDelete } = usePermissions(pathname || '/admin/asset-names');
  const { showSuccess, showError, showWarning } = useToast();
  const [assetNames, setAssetNames] = useState<BaseModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [deletingAssetName, setDeletingAssetName] = useState<BaseModel | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editingAssetName, setEditingAssetName] = useState<BaseModel | null>(null);
  const [formData, setFormData] = useState<BaseModel>(new BaseModel({
    name: '',
    category: '',
    description: '',
    notes: '',
  }));
  const [importLoading, setImportLoading] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [bulkEditLoading, setBulkEditLoading] = useState(false);
  const [selectedAssetNamesForBulkEdit, setSelectedAssetNamesForBulkEdit] = useState<BaseModel[]>([]);
  const [bulkEditFormDataArray, setBulkEditFormDataArray] = useState<BaseModel[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAssetNames();
  }, []);

  const loadAssetNames = async () => {
    try {
      setLoading(true);
      const docs = await firestoreApi.getDocuments(firestoreApi.getCollection("assetNames"));
      const data = BaseModel.fromFirestoreArray(docs);
      setAssetNames(data);
    } catch (error) {
      console.error("Error loading asset names:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = formData.getData();
      if (editingAssetName?.get('id')) {
        const docRef = firestoreApi.getDocument("assetNames", editingAssetName.get('id'));
        await firestoreApi.updateData(docRef, data);
      } else {
        const newId = firestoreApi.getNewId("assetNames");
        const docRef = firestoreApi.getDocument("assetNames", newId);
        await firestoreApi.setData(docRef, data);
      }
      setIsModalOpen(false);
      setEditingAssetName(null);
      setFormData(new BaseModel({ name: '', category: '', description: '', notes: '' }));
      showSuccess(editingAssetName ? "تم تحديث اسم الأصل بنجاح" : "تم إضافة اسم الأصل بنجاح");
      loadAssetNames();
    } catch (error) {
      console.error("Error saving asset name:", error);
      showError("حدث خطأ أثناء الحفظ");
    }
  };

  const handleEdit = (assetName: BaseModel) => {
    setEditingAssetName(assetName);
    setFormData(new BaseModel(assetName.getData()));
    setIsModalOpen(true);
  };

  const handleDelete = (assetName: BaseModel) => {
    setDeletingAssetName(assetName);
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingAssetName) return;
    const id = deletingAssetName.get('id');
    if (!id) return;
    
    try {
      setDeleteLoading(true);
      const docRef = firestoreApi.getDocument("assetNames", id);
      await firestoreApi.deleteData(docRef);
      showSuccess("تم حذف اسم الأصل بنجاح");
      loadAssetNames();
      setIsConfirmModalOpen(false);
      setDeletingAssetName(null);
    } catch (error) {
      console.error("Error deleting asset name:", error);
      showError("حدث خطأ أثناء الحذف");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleBulkEdit = (selectedItems: BaseModel[]) => {
    setSelectedAssetNamesForBulkEdit(selectedItems);
    // تهيئة formData لكل صف مع بياناته الحالية
    const formDataArray = selectedItems.map(item => new BaseModel(item.getData()));
    setBulkEditFormDataArray(formDataArray);
    setIsBulkEditModalOpen(true);
  };

  const handleBulkEditSubmit = async (dataArray: Record<string, any>[]) => {
    try {
      setBulkEditLoading(true);

      const updatePromises = dataArray.map(async (item) => {
        if (!item.id) return;
        
        const docRef = firestoreApi.getDocument("assetNames", item.id);
        await firestoreApi.updateData(docRef, {
          name: item.name || '',
          category: item.category || '',
          description: item.description || '',
          notes: item.notes || '',
        });
      });

      await Promise.all(updatePromises);
      
      setIsBulkEditModalOpen(false);
      setSelectedAssetNamesForBulkEdit([]);
      setBulkEditFormDataArray([]);
      loadAssetNames();
      showSuccess(`تم تحديث ${dataArray.length} اسم بنجاح`);
    } catch (error) {
      showError("حدث خطأ أثناء التحديث الجماعي");
    } finally {
      setBulkEditLoading(false);
    }
  };

  const handleImportClick = () => {
    setIsImportModalOpen(true);
  };

  const handleImportData = async (data: Array<Record<string, any>>) => {
    setImportLoading(true);
    try {
      await importAssetNames(data);
    } catch (error) {
      console.error("Error importing data:", error);
      throw error;
    } finally {
      setImportLoading(false);
    }
  };

  const readExcelFile = async (file: File): Promise<Array<Record<string, any>>> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) {
            reject(new Error('فشل قراءة الملف'));
            return;
          }

          let workbook: XLSX.WorkBook;
          
          if (file.name.endsWith('.csv')) {
            // قراءة CSV
            workbook = XLSX.read(data, { type: 'string' });
          } else {
            // قراءة Excel
            workbook = XLSX.read(data, { type: 'binary' });
          }

          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          if (!worksheet) {
            reject(new Error('الملف لا يحتوي على جداول'));
            return;
          }

          // تحويل إلى JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' }) as Record<string, any>[];
          
          if (jsonData.length === 0) {
            reject(new Error('الملف فارغ'));
            return;
          }

          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('فشل قراءة الملف'));
      };

      if (file.name.endsWith('.csv')) {
        reader.readAsText(file, 'UTF-8');
      } else {
        reader.readAsBinaryString(file);
      }
    });
  };

  const importAssetNames = async (data: Array<Record<string, any>>) => {
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        // البحث عن اسم الأصل في أعمدة مختلفة (بدعم للأعمدة بدون رأسيات)
        let name = '';
        let category = '';

        // محاولة قراءة من الأعمدة المسماة (بدعم للرأسيات العربية والإنجليزية)
        const rowKeys = Object.keys(row);
        
        // البحث عن عمود اسم الأصل
        for (const key of rowKeys) {
          const keyLower = key.toLowerCase().trim();
          if (keyLower.includes('اسم') && (keyLower.includes('أصل') || keyLower.includes('اصل'))) {
            name = row[key]?.toString().trim() || '';
            break;
          } else if (keyLower === 'asset_name' || keyLower === 'name' || keyLower === 'asset name') {
            name = row[key]?.toString().trim() || '';
            break;
          }
        }
        
        // إذا لم نجد من الرأسيات، جرب الأسماء الشائعة
        if (!name) {
          name = (
            row['اسم الأصل'] || 
            row['اسم الاصل'] ||
            row['asset_name'] || 
            row['name'] || 
            row['Name'] ||
            row['Asset Name'] ||
            ''
          ).toString().trim();
        }

        // البحث عن عمود الفئة
        for (const key of rowKeys) {
          const keyLower = key.toLowerCase().trim();
          if (keyLower.includes('فئة') || keyLower.includes('فئه')) {
            category = row[key]?.toString().trim() || '';
            break;
          } else if (keyLower === 'category') {
            category = row[key]?.toString().trim() || '';
            break;
          }
        }
        
        // إذا لم نجد من الرأسيات، جرب الأسماء الشائعة
        if (!category) {
          category = (
            row['الفئة'] || 
            row['الفئه'] ||
            row['category'] || 
            row['Category'] || 
            ''
          ).toString().trim();
        }

        // إذا لم يتم العثور على الأعمدة المسماة، جرب قراءة من الفهرس (للأعمدة بدون رأسيات)
        // أو إذا كان الملف يحتوي على أعمدة بدون رأسيات واضحة
        if (!name) {
          const rowKeys = Object.keys(row);
          const rowValues = Object.values(row);
          
          // محاولة قراءة من الفهرس (العمود الأول = اسم الأصل، العمود الثاني = الفئة)
          if (rowValues.length >= 1) {
            const firstValue = rowValues[0]?.toString().trim() || '';
            // إذا كان المفتاح رقم أو __EMPTY أو مشابه، فهذا يعني عمود بدون رأسية
            if (rowKeys[0] && (rowKeys[0].startsWith('__') || /^\d+$/.test(rowKeys[0]) || rowKeys[0] === 'A' || rowKeys[0] === 'B')) {
              name = firstValue;
              if (rowValues.length >= 2) {
                category = rowValues[1]?.toString().trim() || '';
              }
            } else if (!name) {
              // إذا لم نجد اسم، جرب القيمة الأولى
              name = firstValue;
            }
          }
        }
        
        // إذا لم نجد الفئة بعد، جرب قراءة من الفهرس الثاني
        if (!category && Object.values(row).length >= 2) {
          const rowValues = Object.values(row);
          category = rowValues[1]?.toString().trim() || '';
        }

        if (!name) {
          errorCount++;
          errors.push(`سطر ${i + 2}: اسم الأصل فارغ`);
          continue;
        }

        const description = (
          row['الوصف'] || 
          row['description'] || 
          row['Description'] || 
          ''
        ).toString().trim();

        const notes = (
          row['الملاحظات'] || 
          row['notes'] || 
          row['Notes'] || 
          ''
        ).toString().trim();

        // التحقق من عدم التكرار
        const existing = assetNames.find(an => an.get('name') === name);
        if (existing) {
          // إذا كان موجوداً، نحدثه فقط إذا كانت هناك بيانات إضافية
          if (category || description || notes) {
            const existingData = existing.getData();
            if (category) existingData.category = category;
            if (description) existingData.description = description;
            if (notes) existingData.notes = notes;
            
            const docRef = firestoreApi.getDocument("assetNames", existing.get('id'));
            await firestoreApi.updateData(docRef, existingData);
            successCount++;
          } else {
            successCount++; // موجود بالفعل
          }
          continue;
        }

        // إضافة اسم جديد
        const newId = firestoreApi.getNewId("assetNames");
        const docRef = firestoreApi.getDocument("assetNames", newId);
        await firestoreApi.setData(docRef, {
          name,
          category: category || '',
          description: description || '',
          notes: notes || '',
        });

        successCount++;
      } catch (error) {
        errorCount++;
        errors.push(`سطر ${i + 2}: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
      }
    }

    // عرض النتائج
      if (errorCount > 0) {
        const errorMessage = errors.slice(0, 10).join('\n');
        const moreErrors = errors.length > 10 ? `\n... و ${errors.length - 10} خطأ آخر` : '';
        showWarning(`تم استيراد ${successCount} اسم بنجاح\nفشل: ${errorCount}\n\nالأخطاء:\n${errorMessage}${moreErrors}`);
      } else {
        showSuccess(`تم استيراد ${successCount} اسم بنجاح`);
      }

    // إعادة تحميل البيانات
    loadAssetNames();
  };

  const columns = [
    { 
      key: 'name', 
      label: 'اسم الأصل',
      sortable: true,
    },
    { 
      key: 'category', 
      label: 'الفئة',
      sortable: true,
    },
    { 
      key: 'description', 
      label: 'الوصف',
      sortable: true,
    },
  ];

  return (
    <MainLayout>
      {/* Page Header */}
      <div className="mb-10 relative">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-6">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 flex items-center justify-center shadow-2xl shadow-primary-500/40 overflow-hidden group hover:scale-105 material-transition">
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-transparent opacity-0 group-hover:opacity-100 material-transition"></div>
                <MaterialIcon name="label" className="text-white relative z-10" size="3xl" />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-white/20 rounded-full blur-sm"></div>
                <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-white/10 rounded-full blur-sm"></div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-primary-600 via-primary-700 to-accent-600 bg-clip-text text-transparent">
                    أسماء الأصول
                  </h1>
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-primary-50 rounded-full border border-primary-200">
                    <MaterialIcon name="label" className="text-primary-600" size="sm" />
                    <span className="text-xs font-semibold text-primary-700">{assetNames.length}</span>
                  </div>
                </div>
                <p className="text-slate-600 text-base sm:text-lg font-semibold flex items-center gap-2">
                  <MaterialIcon name="info" className="text-slate-400" size="sm" />
                  <span>إدارة وإضافة أسماء الأصول في النظام</span>
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            {canAdd && (
              <>
                <Button
                  onClick={handleImportClick}
                  leftIcon={<MaterialIcon name="upload_file" size="md" />}
                  size="lg"
                  variant="outline"
                  className="shadow-lg hover:shadow-xl hover:scale-105 material-transition font-bold"
                >
                  استيراد من Excel
                </Button>
                <Button
                  onClick={() => {
                    setEditingAssetName(null);
                    setFormData(new BaseModel({ name: '', category: '', description: '', notes: '' }));
                    setIsModalOpen(true);
                  }}
                  leftIcon={<PlusIcon className="w-5 h-5" />}
                  size="lg"
                  variant="primary"
                  className="shadow-2xl shadow-primary-500/40 hover:shadow-2xl hover:shadow-primary-500/50 hover:scale-105 material-transition font-bold"
                >
                  إضافة اسم جديد
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={assetNames}
        columns={columns}
        onEdit={canEdit ? handleEdit : undefined}
        onDelete={canDelete ? handleDelete : undefined}
        onBulkEdit={(canEdit || canDelete) ? handleBulkEdit : undefined}
        onAddNew={canAdd ? () => {
          setEditingAssetName(null);
          setFormData(new BaseModel({ name: '', category: '', description: '', notes: '' }));
          setIsModalOpen(true);
        } : undefined}
        title="أسماء الأصول"
        exportFileName="asset-names"
        loading={loading}
      />

        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingAssetName(null);
            setFormData(new BaseModel({ name: '', category: '', description: '', notes: '' }));
          }}
          title={editingAssetName ? "تعديل اسم الأصل" : "إضافة اسم جديد"}
          size="md"
          footer={
            <div className="flex flex-col sm:flex-row justify-end gap-3 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingAssetName(null);
                  setFormData(new BaseModel({ name: '', category: '', description: '', notes: '' }));
                }}
                size="lg"
                className="w-full sm:w-auto font-bold"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                form="asset-name-form"
                variant="primary"
                size="lg"
                className="w-full sm:w-auto font-bold shadow-xl shadow-primary-500/30"
              >
                {editingAssetName ? "تحديث" : "حفظ"}
              </Button>
            </div>
          }
        >
          <form id="asset-name-form" onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="اسم الأصل"
              type="text"
              required
              value={formData.get('name')}
              onChange={(e) => {
                const newData = new BaseModel(formData.getData());
                newData.put('name', e.target.value);
                setFormData(newData);
              }}
              placeholder="أدخل اسم الأصل"
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

            <Textarea
              label="الوصف"
              value={formData.get('description')}
              onChange={(e) => {
                const newData = new BaseModel(formData.getData());
                newData.put('description', e.target.value);
                setFormData(newData);
              }}
              rows={1}
              placeholder="أدخل وصف الأصل"
            />

            <Textarea
              label="الملاحظات"
              value={formData.get('notes')}
              onChange={(e) => {
                const newData = new BaseModel(formData.getData());
                newData.put('notes', e.target.value);
                setFormData(newData);
              }}
              rows={1}
              placeholder="أدخل أي ملاحظات إضافية"
            />
          </form>
        </Modal>

        {/* Confirm Delete Modal */}
        <ConfirmModal
          isOpen={isConfirmModalOpen}
          onClose={() => {
            setIsConfirmModalOpen(false);
            setDeletingAssetName(null);
          }}
          onConfirm={confirmDelete}
          title="تأكيد الحذف"
          message={`هل أنت متأكد من حذف ${deletingAssetName?.get('name') || 'هذا الاسم'}؟ لا يمكن التراجع عن هذا الإجراء.`}
          confirmText="حذف"
          cancelText="إلغاء"
          variant="danger"
          loading={deleteLoading}
        />

        {/* Import Excel Modal */}
        <ImportExcelModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImport={handleImportData}
          title="استيراد أسماء الأصول من Excel"
          description="اختر ملف Excel لعرض البيانات ومعاينتها وتعديلها قبل الحفظ"
          loading={importLoading}
        />

        {/* Bulk Edit Modal */}
        <BulkEditModal
          isOpen={isBulkEditModalOpen}
          onClose={() => {
            setIsBulkEditModalOpen(false);
            setSelectedAssetNamesForBulkEdit([]);
            setBulkEditFormDataArray([]);
          }}
          title={`تحرير جماعي (${selectedAssetNamesForBulkEdit.length} اسم)`}
          items={selectedAssetNamesForBulkEdit.map((assetName, index) => ({
            id: assetName.get('id') || `asset-name-${index}`,
            label: assetName.get('name') || `اسم ${index + 1}`,
            data: bulkEditFormDataArray[index]?.getData() || assetName.getData(),
          }))}
          fields={[
            {
              name: 'name',
              label: 'اسم الأصل',
              type: 'text',
              placeholder: 'أدخل اسم الأصل',
              icon: 'label',
              required: true,
            },
            {
              name: 'category',
              label: 'الفئة',
              type: 'text',
              placeholder: 'أدخل الفئة',
              icon: 'category',
            },
            {
              name: 'description',
              label: 'الوصف',
              type: 'textarea',
              placeholder: 'أدخل الوصف',
              icon: 'description',
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
          infoMessage="يمكنك تعديل كل صف بشكل منفصل. سيتم حفظ جميع التعديلات عند الضغط على 'حفظ جميع التعديلات'."
        />
    </MainLayout>
  );
}

export default function AssetNamesPage() {
  return (
    <ProtectedRoute>
      <AssetNamesPageContent />
    </ProtectedRoute>
  );
}
