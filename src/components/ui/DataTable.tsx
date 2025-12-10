'use client';

import { BaseModel } from "@/lib/BaseModel";
import { useState } from "react";
import { DeleteIcon, EditIcon, SearchIcon } from "../icons";
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
    <div className="bg-white rounded-xl shadow-soft border border-secondary-100 overflow-hidden animate-fade-in">
      <div className="p-3 sm:p-4 border-b border-secondary-200 bg-secondary-50">
        <Input
          type="text"
          placeholder="بحث في الجدول..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon={<SearchIcon className="w-4 h-4" />}
          className="bg-white"
        />
      </div>
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden">
            {/* Desktop Table */}
            <table className="hidden md:table min-w-full divide-y divide-secondary-100">
              <thead className="bg-secondary-50 border-b border-secondary-200">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={String(col.key)}
                      className="px-4 lg:px-6 py-3 lg:py-4 text-right text-xs font-semibold text-secondary-700 uppercase tracking-wider"
                    >
                      {col.label}
                    </th>
                  ))}
                  {(onEdit || onDelete) && (
                    <th className="px-4 lg:px-6 py-3 lg:py-4 text-right text-xs font-semibold text-secondary-700 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-100">
                {filteredData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length + (onEdit || onDelete ? 1 : 0)}
                      className="px-4 lg:px-6 py-12 text-center"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-secondary-100 flex items-center justify-center">
                          <SearchIcon className="w-6 h-6 sm:w-8 sm:h-8 text-secondary-400" />
                        </div>
                        <p className="text-secondary-500 font-medium text-sm sm:text-base">لا توجد بيانات</p>
                        {searchTerm && (
                          <p className="text-secondary-400 text-xs sm:text-sm">جرب البحث بكلمات مختلفة</p>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item, index) => (
                    <tr
                      key={item.get('id')}
                      className="hover:bg-primary-50/50 transition-colors duration-150 animate-fade-in"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-sm text-secondary-900"
                        >
                          {col.render ? col.render(item) : String(item.get(col.key) || "-")}
                        </td>
                      ))}
                      {(onEdit || onDelete) && (
                        <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 justify-end">
                            {onEdit && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEdit(item)}
                                leftIcon={<EditIcon className="w-4 h-4" />}
                                className="text-primary-600 hover:text-primary-700"
                              >
                                <span className="hidden lg:inline">تعديل</span>
                                <span className="lg:hidden">تعديل</span>
                              </Button>
                            )}
                            {onDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDelete(item)}
                                leftIcon={<DeleteIcon className="w-4 h-4" />}
                                className="text-error-600 hover:text-error-700"
                              >
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
                <div className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-secondary-100 flex items-center justify-center">
                      <SearchIcon className="w-6 h-6 text-secondary-400" />
                    </div>
                    <p className="text-secondary-500 font-medium text-sm">لا توجد بيانات</p>
                    {searchTerm && (
                      <p className="text-secondary-400 text-xs">جرب البحث بكلمات مختلفة</p>
                    )}
                  </div>
                </div>
              ) : (
                filteredData.map((item, index) => (
                  <div
                    key={item.get('id')}
                    className="p-4 bg-white hover:bg-primary-50/50 transition-colors duration-150 animate-fade-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="space-y-3">
                      {columns.slice(0, 3).map((col) => (
                        <div key={col.key} className="flex justify-between items-start gap-2">
                          <span className="text-xs font-semibold text-secondary-500 uppercase min-w-[80px]">
                            {col.label}:
                          </span>
                          <span className="text-sm text-secondary-900 text-right flex-1">
                            {col.render ? col.render(item) : String(item.get(col.key) || "-")}
                          </span>
                        </div>
                      ))}
                      {(onEdit || onDelete) && (
                        <div className="flex items-center gap-2 justify-end pt-2 border-t border-secondary-100">
                          {onEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(item)}
                              leftIcon={<EditIcon className="w-4 h-4" />}
                              className="text-primary-600 hover:text-primary-700"
                            >
                              تعديل
                            </Button>
                          )}
                          {onDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDelete(item)}
                              leftIcon={<DeleteIcon className="w-4 h-4" />}
                              className="text-error-600 hover:text-error-700"
                            >
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
        <div className="px-4 sm:px-6 py-3 bg-secondary-50 border-t border-secondary-200">
          <p className="text-xs text-secondary-500 text-right">
            عرض {filteredData.length} من {data.length} عنصر
          </p>
        </div>
      )}
    </div>
  );
}

