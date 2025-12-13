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
}

export function ImportExcelModal({
  isOpen,
  onClose,
  onImport,
  title = 'استيراد من Excel',
  description = 'اختر ملف Excel لعرض البيانات ومعاينتها قبل الحفظ',
  loading = false,
}: ImportExcelModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<Array<Record<string, any>>>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [isSelectAll, setIsSelectAll] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      // إعادة تعيين الحالة عند إغلاق النافذة
      setFile(null);
      setPreviewData([]);
      setColumns([]);
      setSelectedRows(new Set());
      setIsSelectAll(false);
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

  const handleRowToggle = (rowIndex: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(rowIndex)) {
      newSelected.delete(rowIndex);
    } else {
      newSelected.add(rowIndex);
    }
    setSelectedRows(newSelected);
    setIsSelectAll(newSelected.size === previewData.length);
  };

  const handleSelectAll = () => {
    if (isSelectAll) {
      setSelectedRows(new Set());
      setIsSelectAll(false);
    } else {
      setSelectedRows(new Set(previewData.map((_, index) => index)));
      setIsSelectAll(true);
    }
  };

  const handleDeleteSelected = () => {
    const newData = previewData.filter((_, index) => !selectedRows.has(index));
    setPreviewData(newData);
    setSelectedRows(new Set());
    setIsSelectAll(false);
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
      size="xl"
    >
      <div className="space-y-6">
        {description && (
          <p className="text-sm text-slate-600">{description}</p>
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isSelectAll}
                    onChange={handleSelectAll}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">تحديد الكل</span>
                </div>
                <span className="text-sm text-slate-600">
                  {selectedRows.size} من {previewData.length} صف محدد
                </span>
              </div>
              {selectedRows.size > 0 && (
                <Button
                  onClick={handleDeleteSelected}
                  variant="outline"
                  size="sm"
                  leftIcon={<MaterialIcon name="delete" size="sm" />}
                >
                  حذف المحدد ({selectedRows.size})
                </Button>
              )}
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
                        className={`hover:bg-slate-50 ${
                          selectedRows.has(rowIndex) ? 'bg-primary-50' : ''
                        }`}
                      >
                        <td className="px-3 py-2 border-b border-slate-100">
                          <input
                            type="checkbox"
                            checked={selectedRows.has(rowIndex)}
                            onChange={() => handleRowToggle(rowIndex)}
                            className="w-4 h-4"
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

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="text-sm text-slate-600">
                <span className="font-semibold">ملاحظة:</span> انقر نقراً مزدوجاً على أي خلية لتعديلها
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setFile(null);
                    setPreviewData([]);
                    setColumns([]);
                    setSelectedRows(new Set());
                    setIsSelectAll(false);
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

