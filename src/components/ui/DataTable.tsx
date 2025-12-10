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
      <div className="p-4 border-b border-secondary-200 bg-secondary-50">
        <Input
          type="text"
          placeholder="بحث في الجدول..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon={<SearchIcon className="w-4 h-4" />}
          className="bg-white"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-secondary-50 border-b border-secondary-200">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className="px-6 py-4 text-right text-xs font-semibold text-secondary-700 uppercase tracking-wider"
                >
                  {col.label}
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th className="px-6 py-4 text-right text-xs font-semibold text-secondary-700 uppercase tracking-wider">
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
                  className="px-6 py-12 text-center"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-full bg-secondary-100 flex items-center justify-center">
                      <SearchIcon className="w-8 h-8 text-secondary-400" />
                    </div>
                    <p className="text-secondary-500 font-medium">لا توجد بيانات</p>
                    {searchTerm && (
                      <p className="text-secondary-400 text-sm">جرب البحث بكلمات مختلفة</p>
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
                      className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900"
                    >
                      {col.render ? col.render(item) : String(item.get(col.key) || "-")}
                    </td>
                  ))}
                  {(onEdit || onDelete) && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 justify-end">
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
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {filteredData.length > 0 && (
        <div className="px-6 py-3 bg-secondary-50 border-t border-secondary-200">
          <p className="text-xs text-secondary-500 text-right">
            عرض {filteredData.length} من {data.length} عنصر
          </p>
        </div>
      )}
    </div>
  );
}

