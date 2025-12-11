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
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in border border-slate-100 w-full">
      <div className="p-6 border-b-2 border-slate-200/60 bg-gradient-to-r from-slate-50 via-primary-50/40 to-slate-50">
        <div className="max-w-lg">
          <div className="relative">
        <Input
          type="text"
          placeholder="بحث في الجدول..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<SearchIcon className="w-5 h-5" />}
              className="bg-white shadow-lg border-slate-200 focus:border-primary-500 focus:shadow-xl focus:shadow-primary-500/20"
        />
          </div>
        </div>
      </div>
      <div className="overflow-x-auto w-full">
        <div className="inline-block min-w-full align-middle w-full">
          <div className="overflow-hidden w-full">
            {/* Desktop Table */}
            <table className="hidden md:table w-full">
              <thead className="bg-gradient-to-r from-slate-100 via-primary-50/40 to-slate-100 border-b-2 border-primary-200/60">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={String(col.key)}
                      className="px-8 py-6 text-right text-xs font-black text-slate-800 uppercase tracking-wider"
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
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shadow-lg">
                          <SearchIcon className="w-10 h-10 text-slate-400" />
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
                      className="hover:bg-gradient-to-r hover:from-primary-50 hover:via-blue-50/30 hover:to-primary-50 material-transition animate-fade-in border-b border-slate-100/60"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className="px-8 py-6 text-sm text-slate-900 font-bold"
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
                                leftIcon={<EditIcon className="w-4 h-4" />}
                                className="text-primary-600 hover:text-white hover:bg-primary-600 shadow-md hover:shadow-lg material-transition rounded-lg"
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
                                className="text-error-600 hover:text-white hover:bg-error-600 shadow-md hover:shadow-lg material-transition rounded-lg"
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
        <div className="px-8 py-5 bg-gradient-to-r from-slate-50 via-primary-50/40 to-slate-50 border-t-2 border-slate-200/60">
          <p className="text-sm text-slate-800 text-right font-black">
            عرض <span className="text-primary-700 font-extrabold text-base">{filteredData.length}</span> من <span className="text-primary-700 font-extrabold text-base">{data.length}</span> عنصر
          </p>
        </div>
      )}
    </div>
  );
}

