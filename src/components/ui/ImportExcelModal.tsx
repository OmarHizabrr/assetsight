'use client';

import { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Modal } from './Modal';
import { Button } from './Button';
import { MaterialIcon } from '@/components/icons/MaterialIcon';
import { Input } from './Input';

interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: Array<Record<string, any>>) => Promise<void>;
  title?: string;
  description?: string;
  loading?: boolean;
  exampleColumns?: string[]; // مثال على أسماء الأعمدة
}

export function ImportExcelModal({
  isOpen,
  onClose,
  onImport,
  title = 'استيراد من Excel',
  description = 'اختر ملف Excel لعرض البيانات ومعاينتها قبل الحفظ',
  loading = false,
  exampleColumns = [],
}: ImportExcelModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<Array<Record<string, any>>>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      // إعادة تعيين الحالة عند إغلاق النافذة
      setFile(null);
      setPreviewData([]);
      setColumns([]);
      setSelectedRows(new Set());
      setIsSelectAll(false);
      setLastSelectedIndex(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [isOpen]);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const extension = selectedFile.name.split('.').pop()?.toLowerCase();
    if (extension !== 'xlsx' && extension !== 'xls' && extension !== 'csv') {
      alert('يرجى اختيار ملف Excel (.xlsx, .xls) أو CSV');
      return;
    }

    setFile(selectedFile);
    await readFile(selectedFile);
  };

  const readFile = async (file: File) => {
    return new Promise<void>((resolve, reject) => {
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
            workbook = XLSX.read(data, { type: 'string' });
          } else {
            workbook = XLSX.read(data, { type: 'binary' });
          }

          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];

          if (!worksheet) {
            reject(new Error('الملف لا يحتوي على جداول'));
            return;
          }

          const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' }) as Array<Record<string, any>>;

          if (jsonData.length === 0) {
            reject(new Error('الملف فارغ'));
            return;
          }

          // استخراج الأعمدة من أول صف
          const firstRow = jsonData[0];
          const cols = Object.keys(firstRow);
          setColumns(cols);
          setPreviewData(jsonData);
          // تحديد جميع الصفوف افتراضياً
          setSelectedRows(new Set(jsonData.map((_, index) => index)));
          setIsSelectAll(true);
          setLastSelectedIndex(null);

          resolve();
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

  const handleCellEdit = (rowIndex: number, column: string, value: any) => {
    const newData = [...previewData];
    newData[rowIndex] = { ...newData[rowIndex], [column]: value };
    setPreviewData(newData);
    setEditingCell(null);
  };

  const handleRowToggle = (rowIndex: number, event?: React.MouseEvent) => {
    const newSelected = new Set(selectedRows);
    const isShiftPressed = event?.shiftKey;
    const isCtrlPressed = event?.ctrlKey || event?.metaKey;

    if (isShiftPressed && lastSelectedIndex !== null) {
      // تحديد نطاق من الصفوف
      const start = Math.min(lastSelectedIndex, rowIndex);
      const end = Math.max(lastSelectedIndex, rowIndex);
      for (let i = start; i <= end; i++) {
        newSelected.add(i);
      }
    } else if (isCtrlPressed) {
      // تحديد/إلغاء تحديد صف واحد فقط
    if (newSelected.has(rowIndex)) {
      newSelected.delete(rowIndex);
    } else {
      newSelected.add(rowIndex);
    }
    } else {
      // تحديد/إلغاء تحديد صف واحد
      if (newSelected.has(rowIndex)) {
        newSelected.delete(rowIndex);
      } else {
        newSelected.add(rowIndex);
      }
    }

    setSelectedRows(newSelected);
    setIsSelectAll(newSelected.size === previewData.length);
    setLastSelectedIndex(rowIndex);
  };

  const handleSelectAll = () => {
    if (isSelectAll) {
      setSelectedRows(new Set());
      setIsSelectAll(false);
      setLastSelectedIndex(null);
    } else {
      const allIndices = new Set(previewData.map((_, index) => index));
      setSelectedRows(allIndices);
      setIsSelectAll(true);
      setLastSelectedIndex(null);
    }
  };

  const handleDeleteSelected = () => {
    const newData = previewData.filter((_, index) => !selectedRows.has(index));
    setPreviewData(newData);
    setSelectedRows(new Set());
    setIsSelectAll(false);
    setLastSelectedIndex(null);
  };

  const handleDeleteRow = (rowIndex: number) => {
    const newData = previewData.filter((_, index) => index !== rowIndex);
    setPreviewData(newData);
    const newSelected = new Set(selectedRows);
    newSelected.delete(rowIndex);
    // تحديث الفهارس
    const updatedSelected = new Set<number>();
    selectedRows.forEach((index) => {
      if (index < rowIndex) {
        updatedSelected.add(index);
      } else if (index > rowIndex) {
        updatedSelected.add(index - 1);
      }
    });
    setSelectedRows(updatedSelected);
    // إعادة تعيين lastSelectedIndex إذا كان الصف المحذوف هو آخر صف محدد
    if (lastSelectedIndex === rowIndex) {
      setLastSelectedIndex(null);
    } else if (lastSelectedIndex !== null && lastSelectedIndex > rowIndex) {
      setLastSelectedIndex(lastSelectedIndex - 1);
    }
  };

  const handleImport = async () => {
    if (previewData.length === 0) {
      alert('لا توجد بيانات للاستيراد');
      return;
    }

    // استيراد فقط الصفوف المحددة
    const dataToImport = previewData.filter((_, index) => selectedRows.has(index));
    
    if (dataToImport.length === 0) {
      alert('يرجى تحديد صف واحد على الأقل للاستيراد');
      return;
    }

    try {
      await onImport(dataToImport);
      onClose();
    } catch (error) {
      console.error('Error importing:', error);
      throw error;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="full"
    >
      <div className="space-y-6">
        {description && (
          <p className="text-sm text-slate-600">{description}</p>
        )}

        {!file && exampleColumns.length > 0 && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <MaterialIcon name="info" className="text-blue-600" size="md" />
              </div>
              <div className="flex-1">
                <h4 className="text-base font-bold text-blue-900 mb-3 flex items-center gap-2">
                  <MaterialIcon name="table_chart" className="text-blue-600" size="sm" />
                  مثال على تسمية الأعمدة في ملف Excel:
                </h4>
                <div className="bg-white rounded-lg p-4 border-2 border-blue-200 shadow-inner overflow-x-auto">
                  <div className="text-xs text-blue-600 mb-2 font-semibold">الصف الأول (رأس الجدول):</div>
                  <table className="w-full text-xs border-collapse min-w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-blue-100 to-indigo-100">
                        {exampleColumns.map((col, index) => (
                          <th key={index} className="border border-blue-300 px-3 py-3 text-right font-bold text-blue-900 whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-blue-50/50">
                        {exampleColumns.map((col, index) => {
                          // أمثلة للبيانات حسب نوع العمود
                          let exampleValue = '';
                          const colLower = col.toLowerCase();
                          if (colLower.includes('كود') || colLower.includes('code') || colLower.includes('tag')) {
                            exampleValue = 'AST-123456-789';
                          } else if (colLower.includes('اسم') || colLower.includes('name')) {
                            exampleValue = 'جهاز كمبيوتر';
                          } else if (colLower.includes('نوع') || colLower.includes('type')) {
                            exampleValue = 'إلكتروني';
                          } else if (colLower.includes('حالة') || colLower.includes('status')) {
                            exampleValue = 'نشط';
                          } else if (colLower.includes('إدارة') || colLower.includes('department')) {
                            exampleValue = 'إدارة تقنية المعلومات';
                          } else if (colLower.includes('مكتب') || colLower.includes('office')) {
                            exampleValue = 'مكتب الدعم الفني';
                          } else if (colLower.includes('حامل') || colLower.includes('custodian') || colLower.includes('user')) {
                            exampleValue = 'أحمد محمد';
                          } else if (colLower.includes('تاريخ') || colLower.includes('date')) {
                            exampleValue = '2024-01-15';
                          } else if (colLower.includes('قيمة') || colLower.includes('value')) {
                            exampleValue = '5000';
                          } else if (colLower.includes('عملة') || colLower.includes('currency')) {
                            exampleValue = 'ر.س';
                          } else if (colLower.includes('تسلسلي') || colLower.includes('serial')) {
                            exampleValue = 'SN123456';
                          } else if (colLower.includes('فئة') || colLower.includes('category')) {
                            exampleValue = 'أجهزة';
                          } else if (colLower.includes('وصف') || colLower.includes('description')) {
                            exampleValue = 'جهاز كمبيوتر مكتبي';
                          } else if (colLower.includes('ضمان') || colLower.includes('warranty')) {
                            exampleValue = '2025-01-15';
                          } else if (colLower.includes('إهلاك') || colLower.includes('depreciation')) {
                            exampleValue = 'خطي';
                          } else if (colLower.includes('عمر') || colLower.includes('lifetime')) {
                            exampleValue = '5';
                          } else if (colLower.includes('متبقية') || colLower.includes('residual')) {
                            exampleValue = '500';
                          } else if (colLower.includes('مورد') || colLower.includes('supplier')) {
                            exampleValue = 'شركة التقنية';
                          } else if (colLower.includes('فاتورة') || colLower.includes('invoice')) {
                            exampleValue = 'INV-2024-001';
                          } else if (colLower.includes('صيانة') || colLower.includes('maintenance')) {
                            exampleValue = '2024-06-15';
                          } else if (colLower.includes('نشط') || colLower.includes('active')) {
                            exampleValue = '1';
                          } else if (colLower.includes('ملاحظات') || colLower.includes('notes')) {
                            exampleValue = 'ملاحظات إضافية';
                          } else {
                            exampleValue = '...';
                          }
                          return (
                            <td key={index} className="border border-blue-200 px-3 py-2 text-right text-blue-700 whitespace-nowrap bg-white">
                              <span className="font-medium">{exampleValue}</span>
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 space-y-1 text-xs text-blue-700">
                  <p className="flex items-center gap-2">
                    <MaterialIcon name="check_circle" className="text-green-600" size="sm" />
                    <strong>الصف الأول:</strong> يجب أن يحتوي على أسماء الأعمدة (رأس الجدول)
                  </p>
                  <p className="flex items-center gap-2">
                    <MaterialIcon name="check_circle" className="text-green-600" size="sm" />
                    <strong>الصفوف التالية:</strong> البيانات الفعلية للأصول
                  </p>
                  <p className="flex items-center gap-2">
                    <MaterialIcon name="check_circle" className="text-green-600" size="sm" />
                    <strong>الأسماء:</strong> يمكنك استخدام الأسماء بالعربية أو الإنجليزية (مثل: "اسم الأصل" أو "asset_name")
                  </p>
                  <p className="flex items-center gap-2">
                    <MaterialIcon name="check_circle" className="text-green-600" size="sm" />
                    <strong>الحقول الاختيارية:</strong> يمكن تركها فارغة، سيتم استخدام القيم الافتراضية
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!file && (
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 rounded-xl">
            <MaterialIcon name="upload_file" size="xl" className="text-slate-400 mb-4" />
            <Button
              onClick={handleFileSelect}
              variant="outline"
              size="lg"
              leftIcon={<MaterialIcon name="folder_open" size="md" />}
            >
              اختر ملف Excel
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <p className="text-xs text-slate-500 mt-4">يدعم ملفات .xlsx, .xls, .csv</p>
          </div>
        )}

        {file && previewData.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isSelectAll}
                    onChange={handleSelectAll}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <span className="text-sm font-medium">تحديد الكل</span>
                </div>
                <span className="text-sm text-slate-600">
                  {selectedRows.size} من {previewData.length} صف محدد
                </span>
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <MaterialIcon name="info" size="sm" />
                  <span>Shift للنطاق | Ctrl للتحديد المتعدد</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
              {selectedRows.size > 0 && (
                  <>
                    <Button
                      onClick={() => {
                        setSelectedRows(new Set());
                        setIsSelectAll(false);
                        setLastSelectedIndex(null);
                      }}
                      variant="outline"
                      size="sm"
                      leftIcon={<MaterialIcon name="clear" size="sm" />}
                    >
                      إلغاء التحديد
                    </Button>
                <Button
                  onClick={handleDeleteSelected}
                  variant="outline"
                  size="sm"
                      className="text-error-600 hover:text-error-700 hover:bg-error-50"
                  leftIcon={<MaterialIcon name="delete" size="sm" />}
                >
                  حذف المحدد ({selectedRows.size})
                </Button>
                  </>
              )}
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2 text-right border-b border-slate-200 w-12">
                        <input
                          type="checkbox"
                          checked={isSelectAll}
                          onChange={handleSelectAll}
                          className="w-4 h-4"
                        />
                      </th>
                      <th className="px-3 py-2 text-right border-b border-slate-200 w-16">#</th>
                      {columns.map((col) => (
                        <th
                          key={col}
                          className="px-3 py-2 text-right border-b border-slate-200 font-semibold text-slate-700 min-w-[150px]"
                        >
                          {col}
                        </th>
                      ))}
                      <th className="px-3 py-2 text-right border-b border-slate-200 w-16">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, rowIndex) => (
                      <tr
                        key={rowIndex}
                        className={`hover:bg-slate-50 cursor-pointer ${
                          selectedRows.has(rowIndex) ? 'bg-primary-50 border-l-4 border-l-primary-500' : ''
                        }`}
                        onClick={(e) => {
                          // إذا لم يكن النقر على checkbox أو زر الحذف
                          const target = e.target as HTMLElement;
                          if (target.tagName !== 'INPUT' && !target.closest('button')) {
                            handleRowToggle(rowIndex, e);
                          }
                        }}
                      >
                        <td 
                          className="px-3 py-2 border-b border-slate-100 cursor-pointer"
                          onClick={(e) => {
                            // إذا تم النقر على الخلية نفسها وليس على checkbox
                            if (e.target !== e.currentTarget && (e.target as HTMLElement).tagName !== 'INPUT') {
                              handleRowToggle(rowIndex, e);
                            }
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedRows.has(rowIndex)}
                            onChange={() => handleRowToggle(rowIndex, undefined)}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowToggle(rowIndex, e);
                            }}
                            className="w-4 h-4 cursor-pointer"
                          />
                        </td>
                        <td className="px-3 py-2 border-b border-slate-100 text-slate-500">
                          {rowIndex + 1}
                        </td>
                        {columns.map((col) => (
                          <td
                            key={col}
                            className="px-3 py-2 border-b border-slate-100"
                            onDoubleClick={() => setEditingCell({ row: rowIndex, col })}
                          >
                            {editingCell?.row === rowIndex && editingCell?.col === col ? (
                              <Input
                                type="text"
                                value={row[col]?.toString() || ''}
                                onChange={(e) => {
                                  const newData = [...previewData];
                                  newData[rowIndex] = { ...newData[rowIndex], [col]: e.target.value };
                                  setPreviewData(newData);
                                }}
                                onBlur={() => setEditingCell(null)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    setEditingCell(null);
                                  }
                                }}
                                autoFocus
                                className="w-full"
                              />
                            ) : (
                              <div className="min-h-[24px] flex items-center">
                                {row[col]?.toString() || '-'}
                              </div>
                            )}
                          </td>
                        ))}
                        <td className="px-3 py-2 border-b border-slate-100">
                          <button
                            onClick={() => handleDeleteRow(rowIndex)}
                            className="text-error-600 hover:text-error-800 material-transition"
                            title="حذف"
                          >
                            <MaterialIcon name="delete" size="sm" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg flex-wrap gap-3">
              <div className="text-sm text-slate-600">
                <span className="font-semibold">ملاحظة:</span> انقر نقراً مزدوجاً على أي خلية لتعديلها | 
                <span className="mx-2">Shift للنطاق</span> | 
                <span className="mx-2">Ctrl للتحديد المتعدد</span>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setFile(null);
                    setPreviewData([]);
                    setColumns([]);
                    setSelectedRows(new Set());
                    setIsSelectAll(false);
                    setLastSelectedIndex(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  variant="outline"
                  size="sm"
                >
                  تغيير الملف
                </Button>
                <Button
                  onClick={handleImport}
                  variant="primary"
                  size="lg"
                  isLoading={loading}
                  disabled={selectedRows.size === 0}
                >
                  {loading ? 'جاري الاستيراد...' : `استيراد ${selectedRows.size} صف`}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

