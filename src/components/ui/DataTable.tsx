'use client';

import { MaterialIcon } from "@/components/icons/MaterialIcon";
import { BaseModel } from "@/lib/BaseModel";
import { useState } from "react";
import { Button } from "./Button";
import { Input } from "./Input";

interface Column {
  key: string;
  label: string;
  render?: (item: BaseModel) => React.ReactNode;
}

interface DataTableProps {
  data: BaseModel[];
  columns: Column[];
  onEdit?: (item: BaseModel) => void;
  onDelete?: (item: BaseModel) => void;
  loading?: boolean;
}

export function DataTable({
  data,
  columns,
  onEdit,
  onDelete,
  loading = false,
}: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredData = data.filter((item) => {
    if (!searchTerm) return true;
    return columns.some((col) => {
      const value = col.render ? col.render(item) : item.get(col.key);
      return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
    });
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 animate-fade-in">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"></div>
          <p className="text-secondary-600 text-sm">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden animate-fade-in border border-gray-200 w-full">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="max-w-lg">
          <div className="relative">
        <Input
          type="text"
          placeholder="بحث في الجدول..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<MaterialIcon name="search" className="text-gray-400" size="lg" />}
              className="bg-white border-gray-300 focus:border-primary-500"
        />
          </div>
        </div>
      </div>
      <div className="overflow-x-auto w-full">
        <div className="inline-block min-w-full align-middle w-full">
          <div className="overflow-hidden w-full">
            {/* Desktop Table */}
            <table className="hidden md:table w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={String(col.key)}
                      className="px-6 py-4 text-right text-xs font-medium text-gray-700 uppercase tracking-wider"
                    >
                      {col.label}
                    </th>
                  ))}
                  {(onEdit || onDelete) && (
                    <th className="px-8 py-5 text-right text-xs font-bold text-slate-700 uppercase tracking-wider w-48">
                      الإجراءات
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {filteredData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length + (onEdit || onDelete ? 1 : 0)}
                      className="px-8 py-20 text-center"
                    >
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center">
                          <MaterialIcon name="search" className="text-gray-400" size="5xl" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-slate-700 font-bold text-lg">لا توجد بيانات</p>
                        {searchTerm && (
                            <p className="text-slate-500 text-sm">جرب البحث بكلمات مختلفة</p>
                        )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item, index) => (
                    <tr
                      key={item.get('id')}
                      className="hover:bg-gray-50 material-transition animate-fade-in border-b border-gray-100"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className="px-6 py-4 text-sm text-gray-900 font-normal"
                        >
                          <div className="truncate max-w-xs">
                          {col.render ? col.render(item) : String(item.get(col.key) || "-")}
                          </div>
                        </td>
                      ))}
                      {(onEdit || onDelete) && (
                        <td className="px-8 py-5 whitespace-nowrap">
                          <div className="flex items-center gap-2 justify-end">
                            {onEdit && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEdit(item)}
                                className="text-primary-600 hover:bg-primary-50 normal-case"
                              >
                                <MaterialIcon name="edit" className="text-lg mr-1" size="lg" />
                                <span className="hidden lg:inline">تعديل</span>
                                <span className="lg:hidden">تعديل</span>
                              </Button>
                            )}
                            {onDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDelete(item)}
                                className="text-error-600 hover:bg-error-50 normal-case"
                              >
                                <MaterialIcon name="delete" className="text-lg mr-1" size="lg" />
                                <span className="hidden lg:inline">حذف</span>
                                <span className="lg:hidden">حذف</span>
                              </Button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-secondary-100">
              {filteredData.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                      <MaterialIcon name="search" className="text-gray-400" size="4xl" />
                    </div>
                    <p className="text-secondary-700 font-medium text-base">لا توجد بيانات</p>
                    {searchTerm && (
                      <p className="text-secondary-500 text-sm">جرب البحث بكلمات مختلفة</p>
                    )}
                  </div>
                </div>
              ) : (
                filteredData.map((item, index) => (
                  <div
                    key={item.get('id')}
                    className="p-5 bg-white hover:bg-primary-50 material-transition animate-fade-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="space-y-3">
                      {columns.slice(0, 3).map((col) => (
                        <div key={col.key} className="flex justify-between items-start gap-3 mb-3 last:mb-0">
                          <span className="text-xs font-semibold text-secondary-600 uppercase min-w-[90px]">
                            {col.label}:
                          </span>
                          <span className="text-sm text-secondary-900 text-right flex-1 font-medium">
                            {col.render ? col.render(item) : String(item.get(col.key) || "-")}
                          </span>
                        </div>
                      ))}
                      {(onEdit || onDelete) && (
                        <div className="flex items-center gap-2 justify-end pt-3 mt-3 border-t border-secondary-200">
                          {onEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(item)}
                              className="text-primary-600 hover:bg-primary-50 normal-case"
                            >
                              <MaterialIcon name="edit" className="text-lg mr-1" size="lg" />
                              تعديل
                            </Button>
                          )}
                          {onDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDelete(item)}
                              className="text-error-600 hover:bg-error-50 normal-case"
                            >
                              <MaterialIcon name="delete" className="text-lg mr-1" size="lg" />
                              حذف
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      {filteredData.length > 0 && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-right font-medium">
            عرض <span className="text-primary-600 font-semibold">{filteredData.length}</span> من <span className="text-primary-600 font-semibold">{data.length}</span> عنصر
          </p>
        </div>
      )}
    </div>
  );
}

