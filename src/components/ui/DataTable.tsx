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
    <div className="bg-white rounded-xl shadow-elevation-4 overflow-hidden animate-fade-in border-0">
      <div className="p-5 lg:p-6 border-b border-secondary-100 bg-gradient-to-r from-secondary-50 to-white">
        <div className="max-w-md">
          <Input
            type="text"
            placeholder="بحث في الجدول..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<SearchIcon className="w-4 h-4" />}
            className="bg-white shadow-elevation-1"
          />
        </div>
      </div>
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden">
            {/* Desktop Table */}
            <table className="hidden md:table min-w-full">
              <thead className="bg-gradient-to-r from-secondary-50 to-white border-b-2 border-secondary-200">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={String(col.key)}
                      className="px-6 py-4 text-right text-xs font-bold text-secondary-800 uppercase tracking-wider"
                    >
                      {col.label}
                    </th>
                  ))}
                  {(onEdit || onDelete) && (
                    <th className="px-6 py-4 text-right text-xs font-bold text-secondary-800 uppercase tracking-wider w-40">
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
                      className="px-6 py-16 text-center"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-secondary-100 flex items-center justify-center">
                          <SearchIcon className="w-8 h-8 text-secondary-400" />
                        </div>
                        <p className="text-secondary-700 font-medium text-base">لا توجد بيانات</p>
                        {searchTerm && (
                          <p className="text-secondary-500 text-sm">جرب البحث بكلمات مختلفة</p>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item, index) => (
                    <tr
                      key={item.get('id')}
                      className="hover:bg-primary-50 material-transition animate-fade-in"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className="px-6 py-4 text-sm text-secondary-900 font-medium"
                        >
                          <div className="truncate max-w-xs">
                            {col.render ? col.render(item) : String(item.get(col.key) || "-")}
                          </div>
                        </td>
                      ))}
                      {(onEdit || onDelete) && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3 justify-end">
                            {onEdit && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEdit(item)}
                                leftIcon={<EditIcon className="w-4 h-4" />}
                                className="text-primary-600 hover:text-primary-700 hover:bg-primary-50"
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
                                className="text-error-600 hover:text-error-700 hover:bg-error-50"
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
                <div className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-secondary-100 flex items-center justify-center">
                      <SearchIcon className="w-8 h-8 text-secondary-400" />
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
        <div className="px-6 py-4 bg-gradient-to-r from-secondary-50 to-white border-t border-secondary-200">
          <p className="text-sm text-secondary-700 text-right font-semibold">
            عرض <span className="text-primary-600 font-bold">{filteredData.length}</span> من <span className="text-primary-600 font-bold">{data.length}</span> عنصر
          </p>
        </div>
      )}
    </div>
  );
}

