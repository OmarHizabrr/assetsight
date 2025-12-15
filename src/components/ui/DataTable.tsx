'use client';

import { MaterialIcon } from "@/components/icons/MaterialIcon";
import { BaseModel } from "@/lib/BaseModel";
import { useEffect, useLayoutEffect, useRef, useState, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import * as XLSX from 'xlsx';
import { Button } from "./Button";
import { Input } from "./Input";
import { Select } from "./Select";
import { Card, CardBody, CardHeader } from "./Card";
import { DebouncedInput } from "./DebouncedInput";
import logoText from "@/assets/images/logos/logo-text.png";
import { PdfSettingsService } from "@/lib/services/PdfSettingsService";
import { getBothDates } from "@/lib/utils/hijriDate";

// Utility function to format dates
const formatDate = (dateValue: any): string => {
  if (!dateValue) return '-';
  
  try {
    let date: Date;
    if (typeof dateValue === 'string') {
      // Handle ISO strings and various date formats
      date = new Date(dateValue);
    } else if (dateValue instanceof Date) {
      date = dateValue;
    } else if (typeof dateValue === 'number') {
      date = new Date(dateValue);
    } else {
      return String(dateValue);
    }
    
    if (isNaN(date.getTime())) {
      return String(dateValue);
    }
    
    // Format as Arabic date: YYYY/MM/DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}/${month}/${day}`;
  } catch (error) {
    return String(dateValue);
  }
};

// Utility function to detect if a value is a date
const isDateValue = (value: any): boolean => {
  if (!value) return false;
  if (value instanceof Date) return true;
  if (typeof value === 'string') {
    // Check if it's a date string (ISO format or common date patterns)
    const datePattern = /^\d{4}-\d{2}-\d{2}|^\d{4}\/\d{2}\/\d{2}|^\d{2}\/\d{2}\/\d{4}/;
    if (datePattern.test(value)) {
      const date = new Date(value);
      return !isNaN(date.getTime());
    }
  }
  return false;
};

// Utility function to detect if a value is a number
const isNumericValue = (value: any): boolean => {
  if (typeof value === 'number') return true;
  if (typeof value === 'string') {
    return !isNaN(Number(value)) && value.trim() !== '';
  }
  return false;
};

interface Column {
  key: string;
  label: string;
  render?: (item: BaseModel) => React.ReactNode;
  sortable?: boolean; // إمكانية الترتيب على هذا العمود
}

interface DataTableProps {
  data: BaseModel[];
  columns: Column[];
  onEdit?: (item: BaseModel) => void;
  onDelete?: (item: BaseModel) => void;
  onView?: (item: BaseModel) => void;
  onArchive?: (item: BaseModel) => void;
  onAddNew?: () => void;
  onBulkEdit?: (items: BaseModel[]) => void; // دالة التحرير الجماعي
  loading?: boolean;
  title?: string;
  exportFileName?: string;
  pageSize?: number; // عدد العناصر في الصفحة
  pageSizeOptions?: number[]; // خيارات عدد العناصر
}

export function DataTable({
  data,
  columns,
  onEdit,
  onDelete,
  onView,
  onArchive,
  onAddNew,
  onBulkEdit,
  loading = false,
  title,
  exportFileName = 'export',
  pageSize = 10,
  pageSizeOptions = [7, 10, 25, 50, 75, 100],
}: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [exportDropdownPosition, setExportDropdownPosition] = useState<{ top: number; right: number } | null>(null);
  const [actionDropdownOpen, setActionDropdownOpen] = useState<{ [key: string]: boolean }>({});
  const [actionDropdownPosition, setActionDropdownPosition] = useState<{ [key: string]: { top: number; left: number } }>({});
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(pageSize || 10);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const exportDropdownRef = useRef<HTMLDivElement>(null);
  const exportButtonRef = useRef<HTMLButtonElement>(null);
  const actionDropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const actionButtonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Check export dropdown
      const isClickOnExportButton = exportButtonRef.current?.contains(target);
      const isClickOnExportDropdown = document.querySelector('[data-export-dropdown]')?.contains(target);
      if (!isClickOnExportButton && !isClickOnExportDropdown) {
        setExportDropdownOpen(false);
        setExportDropdownPosition(null);
      }
      
      // Check action dropdowns - exclude the button itself
      Object.keys(actionDropdownOpen).forEach((key) => {
        const dropdownElement = document.querySelector(`[data-dropdown-id="${key}"]`);
        const buttonElement = actionDropdownRefs.current[key]?.querySelector('button[type="button"]');
        
        // Check if click is outside both the dropdown menu and the button
        const isClickOnButton = buttonElement && (buttonElement.contains(target) || buttonElement === target);
        const isClickOnDropdown = dropdownElement && dropdownElement.contains(target);
        const isClickInContainer = actionDropdownRefs.current[key]?.contains(target);
        
        if (!isClickOnButton && !isClickOnDropdown && !isClickInContainer) {
          setActionDropdownOpen((prev) => ({ ...prev, [key]: false }));
          setActionDropdownPosition((prevPos) => {
            const newPos = { ...prevPos };
            delete newPos[key];
            return newPos;
          });
        }
      });
    };

    // Use a slight delay to allow button click to process first
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside, true);
    }, 0);
    
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [actionDropdownOpen]);

  // Calculate export dropdown position when opened
  useLayoutEffect(() => {
    if (exportDropdownOpen && exportButtonRef.current) {
      const button = exportButtonRef.current;
      const rect = button.getBoundingClientRect();
      setExportDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right, // RTL: use right instead of left
      });
    } else {
      setExportDropdownPosition(null);
    }
  }, [exportDropdownOpen]);

  // Calculate and update dropdown position when opened - use useLayoutEffect for synchronous updates
  useLayoutEffect(() => {
    Object.keys(actionDropdownOpen).forEach((key) => {
      if (actionDropdownOpen[key] && actionButtonRefs.current[key]) {
        const button = actionButtonRefs.current[key];
        if (button) {
          const rect = button.getBoundingClientRect();
          setActionDropdownPosition((prevPos) => {
            // Only update if position changed significantly (more than 1px)
            const currentPos = prevPos[key];
            if (!currentPos || 
                Math.abs(currentPos.top - (rect.bottom + 4)) > 1 || 
                Math.abs(currentPos.left - rect.left) > 1) {
              return {
                ...prevPos,
                [key]: {
                  top: rect.bottom + 4,
                  left: rect.left,
                }
              };
            }
            return prevPos;
          });
        }
      }
    });
  }, [actionDropdownOpen]);

  // Update dropdown position on scroll and resize
  const handleScroll = useCallback(() => {
    // Update export dropdown position
    if (exportDropdownOpen && exportButtonRef.current) {
      const button = exportButtonRef.current;
      const rect = button.getBoundingClientRect();
      setExportDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
    
    // Update action dropdowns position
    Object.keys(actionDropdownOpen).forEach((key) => {
      if (actionDropdownOpen[key] && actionButtonRefs.current[key]) {
        const button = actionButtonRefs.current[key];
        if (button) {
          const rect = button.getBoundingClientRect();
          // Fixed positioning is relative to viewport, not page
          setActionDropdownPosition((prevPos) => ({
            ...prevPos,
            [key]: {
              top: rect.bottom + 4,
              left: rect.left,
            }
          }));
        }
      }
    });
  }, [exportDropdownOpen, actionDropdownOpen]);

  useEffect(() => {
    const hasOpenDropdowns = exportDropdownOpen || Object.keys(actionDropdownOpen).length > 0;
    
    if (hasOpenDropdowns) {
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleScroll);
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleScroll);
      };
    }
  }, [exportDropdownOpen, actionDropdownOpen, handleScroll]);

  // Filter data using debounced search term - memoized for performance
  const filteredData = useMemo(() => {
    if (!debouncedSearchTerm) return data;
    return data.filter((item) => {
      return columns.some((col) => {
        const value = col.render ? col.render(item) : item.get(col.key);
        const searchValue = debouncedSearchTerm.toLowerCase();
        const itemValue = value?.toString().toLowerCase() || '';
        return itemValue.includes(searchValue);
      });
    });
  }, [data, debouncedSearchTerm, columns]);

  // Sort data - memoized for performance with improved date and number sorting
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;
    
    const column = columns.find(col => col.key === sortColumn);
    if (!column) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      // Get values
      let valueA: any = a.get(sortColumn);
      let valueB: any = b.get(sortColumn);
      
      // Handle null/undefined
      if (valueA == null) valueA = '';
      if (valueB == null) valueB = '';
      
      // Check if values are dates
      const isDateA = isDateValue(valueA);
      const isDateB = isDateValue(valueB);
      
      if (isDateA && isDateB) {
        const dateA = new Date(valueA).getTime();
        const dateB = new Date(valueB).getTime();
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }
      
      // Check if values are numbers
      const isNumA = isNumericValue(valueA);
      const isNumB = isNumericValue(valueB);
      
      if (isNumA && isNumB) {
        const numA = Number(valueA);
        const numB = Number(valueB);
        return sortDirection === 'asc' ? numA - numB : numB - numA;
      }
      
      // String comparison with Arabic locale
      const strA = String(valueA).toLowerCase();
      const strB = String(valueB).toLowerCase();
      
      if (sortDirection === 'asc') {
        return strA.localeCompare(strB, 'ar', { numeric: true, sensitivity: 'base' });
      } else {
        return strB.localeCompare(strA, 'ar', { numeric: true, sensitivity: 'base' });
      }
    });
  }, [filteredData, sortColumn, sortDirection, columns]);

  // Handle column sort - memoized with useCallback
  const handleSort = useCallback((columnKey: string) => {
    const column = columns.find(col => col.key === columnKey);
    if (!column || column.sortable === false) return;
    
    if (sortColumn === columnKey) {
      // Toggle direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to ascending
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
    // Reset to first page when sorting
    setCurrentPage(1);
  }, [columns, sortColumn, sortDirection]);

  // Pagination logic - memoized for performance
  const paginationInfo = useMemo(() => {
    const totalPages = Math.ceil(sortedData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = sortedData.slice(startIndex, endIndex);
    return { totalPages, startIndex, endIndex, paginatedData };
  }, [sortedData, itemsPerPage, currentPage]);
  
  const { totalPages, startIndex, endIndex, paginatedData } = paginationInfo;

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  // Reset selection when data changes
  useEffect(() => {
    setSelectedRows(new Set());
    setIsSelectAll(false);
    setLastSelectedIndex(null);
  }, [data]);

  // Handle row selection with Shift and Ctrl support
  const handleRowToggle = (itemId: string, rowIndex: number, event?: React.MouseEvent) => {
    if (!itemId) return;
    
    const newSelected = new Set(selectedRows);
    const isShiftPressed = event?.shiftKey;
    const isCtrlPressed = event?.ctrlKey || event?.metaKey;

    if (isShiftPressed && lastSelectedIndex !== null) {
      // Select range of rows
      const start = Math.min(lastSelectedIndex, rowIndex);
      const end = Math.max(lastSelectedIndex, rowIndex);
      for (let i = start; i <= end; i++) {
        const item = paginatedData[i];
        if (item) {
          const id = item.get('id');
          if (id) {
            const idString = String(id);
            newSelected.add(idString);
          }
        }
      }
    } else if (isCtrlPressed) {
      // Toggle single row (Ctrl + Click)
      if (newSelected.has(itemId)) {
        newSelected.delete(itemId);
      } else {
        newSelected.add(itemId);
      }
    } else {
      // Toggle single row (normal click)
      if (newSelected.has(itemId)) {
        newSelected.delete(itemId);
      } else {
        newSelected.add(itemId);
      }
    }

    setSelectedRows(newSelected);
    setIsSelectAll(newSelected.size === paginatedData.length && paginatedData.length > 0);
    setLastSelectedIndex(rowIndex);
  };

  const handleSelectAll = () => {
    if (isSelectAll) {
      setSelectedRows(new Set());
      setIsSelectAll(false);
      setLastSelectedIndex(null);
    } else {
      const allIds = new Set(
        paginatedData
          .map(item => {
            const id = item.get('id');
            return id ? String(id) : null;
          })
          .filter(Boolean) as string[]
      );
      setSelectedRows(allIds);
      setIsSelectAll(allIds.size === paginatedData.length && paginatedData.length > 0);
      setLastSelectedIndex(null);
    }
  };

  const handleDeleteSelected = () => {
    if (!onDelete || selectedRows.size === 0) return;
    
    const selectedItems = paginatedData.filter(item => {
      const id = item.get('id');
      return id && selectedRows.has(id);
    });

    // Delete all selected items
    selectedItems.forEach(item => {
      if (onDelete) {
        onDelete(item);
      }
    });

    setSelectedRows(new Set());
    setIsSelectAll(false);
    setLastSelectedIndex(null);
  };

  // Reset to first page when items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  // Handle page change - memoized with useCallback
  const handlePageChange = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Scroll to top of table smoothly
      const tableElement = document.querySelector('.table-responsive');
      if (tableElement) {
        tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [totalPages]);

  // Export functions
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      sortedData.map((item) => {
        const row: any = {};
        columns.forEach((col) => {
          const value = col.render ? col.render(item) : item.get(col.key);
          row[col.label] = typeof value === 'string' || typeof value === 'number' ? value : String(value || '');
        });
        return row;
      })
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    XLSX.writeFile(workbook, `${exportFileName}.xlsx`);
    setExportDropdownOpen(false);
  };

  const exportToCSV = () => {
    const csvData = sortedData.map((item) => {
      return columns.map((col) => {
        const value = col.render ? col.render(item) : item.get(col.key);
        return typeof value === 'string' || typeof value === 'number' ? value : String(value || '');
      });
    });
    
    const headers = columns.map((col) => col.label);
    const csvContent = [
      headers.join(','),
      ...csvData.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${exportFileName}.csv`;
    link.click();
    setExportDropdownOpen(false);
  };

  const exportToPDF = () => {
    // PDF export with header and footer
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    // Get PDF settings
    const settingsService = PdfSettingsService.getInstance();
    const settings = settingsService.getSettings();
    
    // Get current date and time
    const now = new Date();
    const { hijri, gregorian } = getBothDates(now);
    
    // تنسيق الوقت بنظام 12 ساعة (مثل المرجع)
    const hour = now.getHours() > 12 ? now.getHours() - 12 : (now.getHours() === 0 ? 12 : now.getHours());
    const period = now.getHours() < 12 ? 'صباحاً' : 'مساءً';
    const formattedHour = String(hour).padStart(2, '0');
    const formattedMinute = String(now.getMinutes()).padStart(2, '0');
    const formattedSecond = String(now.getSeconds()).padStart(2, '0');
    const timeStr = `${formattedHour}:${formattedMinute}:${formattedSecond} ${period}`;
    
    // تقسيم النصوص إلى سطور
    const rightHeaderLines = (settings.rightHeader || '').split('\n').filter(line => line.trim());
    const leftHeaderLines = (settings.leftHeader || '').split('\n').filter(line => line.trim());
    const footerSignatures = (settings.footerText || '').split('\n').filter(line => line.trim());
    
    // Get logo path
    let logoPath = typeof logoText === 'string' ? logoText : (logoText?.src || logoText || '/favicon.png');
    if (settings.logoBase64) {
      logoPath = `data:image/png;base64,${settings.logoBase64}`;
    }
    
    const tableHTML = `
      <html>
        <head>
          <title>${exportFileName}</title>
          <style>
            @page {
              size: A4;
              margin: 120px 50px 100px 50px;
              @top-center {
                content: element(header);
              }
              @bottom-center {
                content: element(footer);
              }
            }
            
            body { 
              font-family: 'Arial', 'Tahoma', sans-serif; 
              direction: rtl;
              margin: 0;
              padding: 0;
            }
            
            #header {
              position: running(header);
              width: 100%;
              padding: 20px;
              background: white;
            }
            
            .header-content {
              display: flex;
              justify-content: space-between;
              align-items: center;
              width: 100%;
            }
            
            .header-right {
              flex: 1;
              text-align: right;
            }
            
            .header-right-line {
              font-size: 14px;
              color: #4b465c;
              margin: 0;
              line-height: 1.6;
              direction: rtl;
            }
            
            .header-logo {
              width: 75px;
              height: 75px;
              border-radius: 50%;
              object-fit: cover;
              margin: 0 20px;
              flex-shrink: 0;
            }
            
            .header-left {
              flex: 1;
              text-align: left;
            }
            
            .header-left-line {
              font-size: 14px;
              color: #4b465c;
              margin: 0;
              line-height: 1.6;
              direction: ltr;
              text-align: left;
            }
            
            #footer {
              position: running(footer);
              width: 100%;
              padding: 10px 20px;
              background: white;
            }
            
            .footer-content {
              display: flex;
              justify-content: space-between;
              align-items: center;
              width: 100%;
            }
            
            .footer-right {
              font-size: 10px;
              font-weight: bold;
              color: #1976d2;
              direction: rtl;
            }
            
            .footer-center {
              padding: 10px 15px;
              border-radius: 10px;
              font-size: 12px;
              color: #2196f3;
              direction: rtl;
            }
            
            .footer-left {
              font-size: 10px;
              color: #4b465c;
              direction: rtl;
              text-align: right;
              line-height: 1.4;
            }
            
            .signatures-section {
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #dbdade;
            }
            
            .signatures-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 12px;
            }
            
            .signature-item {
              flex: 1;
              text-align: center;
              max-width: 200px;
            }
            
            .signature-line {
              width: 150px;
              height: 1px;
              background: #000;
              margin: 0 auto 5px;
            }
            
            .signature-text {
              font-size: 10px;
              color: #4b465c;
              direction: rtl;
              line-height: 1.4;
            }
            
            .content {
              margin-top: 20px;
            }
            
            /* منع تقسيم التوقيعات */
            .signatures-section {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            .signatures-row {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            h2 {
              text-align: center;
              color: #4b465c;
              margin: 20px 0;
              font-size: 18px;
            }
            
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 20px 0;
              font-size: 12px;
            }
            
            thead {
              display: table-header-group;
            }
            
            tbody {
              display: table-row-group;
            }
            
            tr {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            th, td { 
              border: 1px solid #dbdade; 
              padding: 10px 8px; 
              text-align: right; 
            }
            
            th { 
              background-color: #f8f7fa; 
              font-weight: bold;
              color: #5d596c;
              font-size: 13px;
            }
            
            td {
              color: #6f6b7d;
            }
            
            tr:nth-child(even) {
              background-color: #fafafa;
            }
            
            /* تحسين الطباعة */
            @media print {
              table {
                page-break-inside: auto;
              }
              
              thead {
                display: table-header-group;
              }
              
              tfoot {
                display: table-footer-group;
              }
              
              tbody tr {
                page-break-inside: avoid;
                break-inside: avoid;
              }
            }
            
            @media print {
              body {
                margin: 0;
              }
              
              #header {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                z-index: 1000;
              }
              
              #footer {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                z-index: 1000;
              }
              
              .content {
                margin-top: 100px;
                margin-bottom: 80px;
              }
            }
          </style>
        </head>
        <body>
          ${settings.isHeaderVisible ? `
          <div id="header">
            <div class="header-content">
              <div class="header-right">
                ${rightHeaderLines.map(line => `<p class="header-right-line">${line}</p>`).join('')}
              </div>
              <img src="${logoPath}" alt="Logo" class="header-logo" onerror="this.style.display='none'" />
              <div class="header-left">
                ${leftHeaderLines.map(line => `<p class="header-left-line">${line}</p>`).join('')}
              </div>
            </div>
          </div>
          ` : ''}
          
          <div class="content">
            <table>
              <thead>
                <tr>
                  <th style="width: 50px; text-align: center;">#</th>
                  ${columns.map((col) => `<th>${col.label}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${sortedData.map((item, index) => `
                  <tr>
                    <td style="text-align: center; font-weight: bold; color: #7367f0;">${index + 1}</td>
                    ${columns.map((col) => {
                      const value = col.render ? col.render(item) : item.get(col.key);
                      return `<td>${typeof value === 'string' || typeof value === 'number' ? value : String(value || '')}</td>`;
                    }).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          ${settings.isHeaderVisible && footerSignatures.length > 0 ? `
          <div class="signatures-section">
            ${(function() {
              let html = '';
              for (let i = 0; i < footerSignatures.length; i += 3) {
                html += '<div class="signatures-row">';
                for (let j = i; j < i + 3 && j < footerSignatures.length; j++) {
                  html += `
                    <div class="signature-item">
                      <div class="signature-line"></div>
                      <div class="signature-text">${footerSignatures[j]}</div>
                    </div>
                  `;
                }
                html += '</div>';
              }
              return html;
            })()}
          </div>
          ` : ''}
          
          ${settings.isHeaderVisible ? `
          <div id="footer">
            <div class="footer-content">
              <div class="footer-right">${title || 'الجدول'}</div>
              <div class="footer-center">صفحة <span id="page-num">1</span></div>
              <div class="footer-left">تاريخ الطباعة: ${gregorian}<br>الوقت: ${timeStr}</div>
            </div>
          </div>
          ` : ''}
        </body>
      </html>
    `;
    
    printWindow.document.write(tableHTML);
    printWindow.document.close();
    
    // Wait for images to load before printing
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
    
    setExportDropdownOpen(false);
  };

  const printTable = () => {
    exportToPDF();
  };

  const copyToClipboard = async () => {
    const text = sortedData.map((item) => {
      return columns.map((col) => {
        const value = col.render ? col.render(item) : item.get(col.key);
        return typeof value === 'string' || typeof value === 'number' ? value : String(value || '');
      }).join('\t');
    }).join('\n');
    
    const headers = columns.map((col) => col.label).join('\t');
    const fullText = headers + '\n' + text;
    
    try {
      await navigator.clipboard.writeText(fullText);
      alert('تم نسخ البيانات إلى الحافظة');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
    setExportDropdownOpen(false);
  };

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
    <>
    <Card variant="elevated" className="overflow-visible animate-scale-in border-primary-200/30 shadow-primary/10">
      <CardHeader className="pb-4 group">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        {title && (
            <h5 className="text-lg font-semibold text-slate-800">{title}</h5>
          )}
          {((onDelete || onBulkEdit) && selectedRows.size > 0) && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-slate-600 font-medium">
                {selectedRows.size} عنصر محدد
              </span>
              {onBulkEdit && (
                <Button
                  onClick={() => {
                    const selectedItems = data.filter(item => {
                      const id = item.get('id');
                      return id && selectedRows.has(String(id));
                    });
                    onBulkEdit(selectedItems);
                  }}
                  variant="primary"
                  size="sm"
                  className="shadow-md hover:shadow-lg hover:scale-105 material-transition"
                  leftIcon={<MaterialIcon name="edit" size="sm" />}
                >
                  تحرير جماعي ({selectedRows.size})
                </Button>
              )}
              {onDelete && (
                <Button
                  onClick={handleDeleteSelected}
                  variant="outline"
                  size="sm"
                  className="text-error-600 hover:text-error-700 hover:bg-error-50"
                  leftIcon={<MaterialIcon name="delete" size="sm" />}
                >
                  حذف المحدد ({selectedRows.size})
                </Button>
              )}
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
            </div>
        )}
        </div>
        
        {/* Search and Controls Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Select
              value={itemsPerPage.toString()}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              options={pageSizeOptions.map(size => ({ value: size.toString(), label: size.toString() }))}
              className="w-20"
              fullWidth={false}
            />
            <span className="text-sm text-slate-600 font-medium">عنصر في الصفحة</span>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap flex-1 sm:flex-initial sm:justify-end">
            <div className="flex-1 sm:flex-initial min-w-[200px] sm:min-w-[280px]">
              <DebouncedInput
                value={searchTerm}
                onChange={(value) => setDebouncedSearchTerm(String(value))}
                placeholder="بحث في الجدول..."
                debounce={300}
                fullWidth
              />
            </div>
            
            {/* Export Dropdown */}
            <div className="relative" ref={exportDropdownRef}>
              <Button
                ref={exportButtonRef}
                variant="outline"
                size="sm"
                onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                className="normal-case shadow-sm hover:shadow-md material-transition"
              >
                <MaterialIcon name="archive" size="sm" />
                <span className="hidden sm:inline mr-1">تصدير</span>
                <MaterialIcon name="arrow_drop_down" size="sm" />
              </Button>
            </div>
            
            {onAddNew && (
              <Button
                variant="primary"
                size="sm"
                onClick={onAddNew}
                className="normal-case shadow-lg hover:shadow-xl hover:scale-105 material-transition"
              >
                <MaterialIcon name="add" size="sm" />
                <span className="hidden sm:inline mr-1">إضافة جديد</span>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardBody padding="none" className="p-0">
        <div className="table-responsive overflow-x-auto" style={{ maxWidth: '100%' }}>
        {/* Desktop Table */}
        <table className="table datatables-basic" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
          <thead className="sticky top-0 z-10">
            <tr style={{ backgroundColor: '#f8f7fa' }}>
              {onDelete && (
                <th
                  style={{ 
                    padding: '1rem 1.5rem',
                    textAlign: 'center',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#5d596c',
                    borderBottom: '2px solid #dbdade',
                    background: 'linear-gradient(to bottom, #f8f7fa 0%, #f0eff2 100%)',
                    width: '60px',
                    borderTopRightRadius: '1.5rem'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelectAll}
                    onChange={handleSelectAll}
                    className="w-4 h-4 cursor-pointer"
                    title="تحديد الكل"
                  />
                </th>
              )}
              {columns.map((col, colIndex) => {
                const isSortable = col.sortable !== false;
                const isSorted = sortColumn === col.key;
                const isFirstColumn = colIndex === 0 && !onDelete;
                const isLastColumn = colIndex === columns.length - 1 && !(onEdit || onDelete || onView || onArchive);
                return (
                  <th
                    key={String(col.key)}
                    onClick={() => isSortable && handleSort(col.key)}
                    style={{ 
                      padding: '1rem 1.5rem',
                      textAlign: 'right',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#5d596c',
                      borderBottom: '2px solid #dbdade',
                      background: 'linear-gradient(to bottom, #f8f7fa 0%, #f0eff2 100%)',
                      cursor: isSortable ? 'pointer' : 'default',
                      userSelect: 'none',
                      position: 'relative',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      letterSpacing: '0.01em',
                      borderTopRightRadius: isFirstColumn ? '1.5rem' : '0',
                      borderTopLeftRadius: isLastColumn ? '1.5rem' : '0',
                      backdropFilter: 'blur(10px)'
                    }}
                    onMouseEnter={(e) => {
                      if (isSortable) {
                        e.currentTarget.style.background = 'linear-gradient(to bottom, #f0eff2 0%, #e8e6ea 100%)';
                        e.currentTarget.style.borderBottomColor = '#7367f0';
                        e.currentTarget.style.color = '#7367f0';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(115, 103, 240, 0.15)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(to bottom, #f8f7fa 0%, #f0eff2 100%)';
                      e.currentTarget.style.borderBottomColor = '#dbdade';
                      e.currentTarget.style.color = '#5d596c';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <span>{col.label}</span>
                      {isSortable && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '16px', height: '20px', lineHeight: '10px' }}>
                          <span
                            style={{
                              color: isSorted && sortDirection === 'asc' ? '#7367f0' : '#a5a3ae',
                              fontSize: '16px',
                              lineHeight: '8px',
                              marginTop: '-2px',
                              opacity: isSorted && sortDirection === 'asc' ? 1 : 0.4,
                              display: 'block'
                            }}
                          >
                            <MaterialIcon
                              name="arrow_drop_up"
                              size="sm"
                              className={isSorted && sortDirection === 'asc' ? 'text-primary-600' : 'text-slate-400'}
                            />
                          </span>
                          <span
                            style={{
                              color: isSorted && sortDirection === 'desc' ? '#7367f0' : '#a5a3ae',
                              fontSize: '16px',
                              lineHeight: '8px',
                              marginTop: '-2px',
                              opacity: isSorted && sortDirection === 'desc' ? 1 : 0.4,
                              display: 'block'
                            }}
                          >
                            <MaterialIcon
                              name="arrow_drop_down"
                              size="sm"
                              className={isSorted && sortDirection === 'desc' ? 'text-primary-600' : 'text-slate-400'}
                            />
                          </span>
                        </div>
                      )}
                    </div>
                  </th>
                );
              })}
              {(onEdit || onDelete || onView || onArchive) && (
                <th
                  style={{ 
                    padding: '1rem 1.5rem',
                    textAlign: 'right',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#5d596c',
                    borderBottom: '2px solid #dbdade',
                    backgroundColor: '#f8f7fa',
                    width: '200px',
                    letterSpacing: '0.01em',
                    borderTopLeftRadius: '1.5rem'
                  }}
                >
                  الإجراءات
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (onDelete ? 1 : 0) + (onEdit || onDelete || onView || onArchive ? 1 : 0)}
                  style={{ padding: '4rem 1.5rem', textAlign: 'center' }}
                  className="animate-fade-in"
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shadow-lg animate-pulse">
                      <MaterialIcon name="inventory" className="text-slate-400" size="3xl" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-slate-700 font-semibold text-lg">لا توجد بيانات</p>
                      {debouncedSearchTerm && (
                        <p className="text-slate-500 text-sm">جرب البحث بكلمات مختلفة</p>
                      )}
                      {!debouncedSearchTerm && onAddNew && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={onAddNew}
                          className="mt-2"
                        >
                          <MaterialIcon name="add" size="sm" />
                          <span className="mr-1">إضافة أول عنصر</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((item, index) => {
                const itemId = item.get('id');
                const itemIdString = itemId ? String(itemId) : '';
                const isSelected = Boolean(itemIdString && selectedRows.has(itemIdString));
                return (
                <tr
                  key={itemIdString || `row-${index}`}
                  className={`material-transition animate-fade-in cursor-pointer ${isSelected ? 'bg-primary-50' : ''}`}
                  style={{
                    borderBottom: '1px solid #f0eff2',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    backgroundColor: isSelected ? '#f0f4ff' : 'transparent',
                    animationDelay: `${index * 0.02}s`,
                    animationFillMode: 'both',
                    borderLeft: isSelected ? '4px solid #7367f0' : 'none'
                  }}
                  onClick={(e) => {
                    // إذا لم يكن النقر على checkbox أو زر الحذف أو زر الإجراءات
                    const target = e.target as HTMLElement;
                    const isInput = target.tagName === 'INPUT';
                    const isButton = target.closest('button') !== null;
                    const isActionDropdown = target.closest('[data-action-dropdown]') !== null;
                    const isTableCell = target.tagName === 'TD' && target.querySelector('input[type="checkbox"]');
                    
                    if (!isInput && !isButton && !isActionDropdown && !isTableCell && itemIdString) {
                      handleRowToggle(itemIdString, index, e);
                    }
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                    e.currentTarget.style.background = 'linear-gradient(to right, #f8f7fa 0%, #f0eff2 50%, #f8f7fa 100%)';
                    }
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(115, 103, 240, 0.2), 0 2px 8px rgba(115, 103, 240, 0.1)';
                    e.currentTarget.style.transform = 'translateY(-2px) scale(1.002)';
                    if (!isSelected) {
                    e.currentTarget.style.borderLeft = '3px solid #7367f0';
                    }
                    Array.from(e.currentTarget.children).forEach((cell) => {
                      (cell as HTMLElement).style.borderBottomColor = '#e8e6ea';
                    });
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                    e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderLeft = 'none';
                    } else {
                      e.currentTarget.style.background = '#f0f4ff';
                      e.currentTarget.style.borderLeft = '4px solid #7367f0';
                    }
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    Array.from(e.currentTarget.children).forEach((cell) => {
                      (cell as HTMLElement).style.borderBottomColor = '#f0eff2';
                    });
                  }}
                >
                  {onDelete && (
                    <td
                      style={{ padding: '1rem 1.5rem', textAlign: 'center' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (itemIdString) {
                          handleRowToggle(itemIdString, index, e);
                        }
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          if (itemIdString) {
                            handleRowToggle(itemIdString, index, undefined);
                          }
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (itemIdString) {
                            handleRowToggle(itemIdString, index, e);
                          }
                        }}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </td>
                  )}
                  {columns.map((col) => {
                    const rawValue = item.get(col.key);
                    const isDate = isDateValue(rawValue);
                    const isNumber = isNumericValue(rawValue);
                    
                    let displayValue: React.ReactNode;
                    if (col.render) {
                      displayValue = col.render(item);
                    } else if (isDate) {
                      displayValue = (
                        <span className="font-medium text-slate-700" title={rawValue}>
                          {formatDate(rawValue)}
                        </span>
                      );
                    } else if (isNumber) {
                      const numValue = Number(rawValue);
                      displayValue = (
                        <span className="font-semibold text-slate-800" title={numValue.toLocaleString('ar-SA')}>
                          {numValue.toLocaleString('ar-SA')}
                        </span>
                      );
                    } else {
                      const stringValue = String(rawValue || "-");
                      displayValue = (
                        <span className="text-slate-700" title={stringValue}>
                          {stringValue}
                        </span>
                      );
                    }
                    
                    return (
                      <td
                        key={col.key}
                        className="material-transition"
                        style={{
                          padding: '1rem 1.5rem',
                          fontSize: '0.9375rem',
                          color: '#4b465c',
                          verticalAlign: 'middle',
                          borderBottom: '1px solid #f0eff2',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                      >
                        <div 
                          className="truncate max-w-[300px]"
                          style={{ 
                            fontWeight: 400,
                            lineHeight: '1.6',
                            wordBreak: 'break-word'
                          }}
                          title={typeof rawValue === 'string' ? rawValue : String(rawValue || '')}
                        >
                          {displayValue}
                        </div>
                      </td>
                    );
                  })}
                  {(onEdit || onDelete || onView || onArchive) && (
                    <td style={{ 
                      padding: '1rem 1.5rem', 
                      whiteSpace: 'nowrap',
                      borderBottom: '1px solid #f0eff2',
                      verticalAlign: 'middle',
                      transition: 'all 0.15s ease-in-out'
                    }}>
                      <div className="flex items-center gap-2 justify-end">
                        {/* Actions Dropdown */}
                        <div className="relative inline-block" ref={(el) => { actionDropdownRefs.current[item.get('id')] = el; }}>
                          <button
                            ref={(el) => { actionButtonRefs.current[item.get('id')] = el; }}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const button = e.currentTarget;
                              const itemId = item.get('id');
                              
                              setActionDropdownOpen((prev) => {
                                const newState = { ...prev, [itemId]: !prev[itemId] };
                                if (!newState[itemId]) {
                                  // Clear position when closing
                                  setActionDropdownPosition((prevPos) => {
                                    const newPos = { ...prevPos };
                                    delete newPos[itemId];
                                    return newPos;
                                  });
                                }
                                return newState;
                              });
                            }}
                            className="material-transition hover:bg-primary-50 hover:scale-110 active:scale-95"
                            style={{
                              padding: '0.5rem',
                              border: 'none',
                              background: 'transparent',
                              color: '#7367f0',
                              cursor: 'pointer',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              minWidth: '2rem',
                              minHeight: '2rem',
                              zIndex: 10,
                              position: 'relative'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#f8f7fa';
                              e.currentTarget.style.color = '#5e52d5';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = '#7367f0';
                            }}
                            aria-label="خيارات"
                            title="خيارات"
                          >
                            <MaterialIcon name="more_vert" size="md" />
                          </button>
                        </div>
                        {/* Quick Edit Button */}
                        {onEdit && (
                          <button
                            onClick={() => onEdit(item)}
                            style={{
                              padding: '0.375rem',
                              border: 'none',
                              background: 'transparent',
                              color: '#7367f0',
                              cursor: 'pointer',
                              borderRadius: '1.25rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f7fa'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            title="تعديل"
                          >
                            <MaterialIcon name="edit" size="md" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Mobile Cards */}
        <div className="md:hidden" style={{ borderTop: '1px solid #dbdade' }}>
          {filteredData.length === 0 ? (
            <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
              <div className="flex flex-col items-center gap-3">
                <div style={{ width: '4rem', height: '4rem', borderRadius: '50%', backgroundColor: '#f8f7fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialIcon name="search" className="text-slate-400" size="4xl" />
                </div>
                <p style={{ color: '#4b465c', fontWeight: 500, fontSize: '1rem' }}>لا توجد بيانات</p>
                {searchTerm && (
                  <p style={{ color: '#6f6b7d', fontSize: '0.875rem' }}>جرب البحث بكلمات مختلفة</p>
                )}
              </div>
            </div>
          ) : (
            paginatedData.map((item, index) => (
              <div
                key={item.get('id')}
                style={{
                  padding: '1.25rem 1.5rem',
                  borderBottom: '1px solid #dbdade',
                  transition: 'background-color 0.15s ease-in-out'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8f7fa';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div className="space-y-3">
                  {columns.slice(0, 3).map((col) => {
                    const rawValue = item.get(col.key);
                    const isDate = isDateValue(rawValue);
                    const isNumber = isNumericValue(rawValue);
                    
                    let displayValue: React.ReactNode;
                    if (col.render) {
                      displayValue = col.render(item);
                    } else if (isDate) {
                      displayValue = (
                        <span className="font-medium text-slate-700">
                          {formatDate(rawValue)}
                        </span>
                      );
                    } else if (isNumber) {
                      const numValue = Number(rawValue);
                      displayValue = (
                        <span className="font-semibold text-slate-800">
                          {numValue.toLocaleString('ar-SA')}
                        </span>
                      );
                    } else {
                      displayValue = String(rawValue || "-");
                    }
                    
                    return (
                      <div key={col.key} className="flex justify-between items-start gap-3 mb-3 last:mb-0">
                        <span className="text-xs font-semibold text-slate-600 min-w-[90px]">
                          {col.label}:
                        </span>
                        <span className="text-sm text-slate-800 text-right flex-1 font-medium">
                          {displayValue}
                        </span>
                      </div>
                    );
                  })}
                  {(onEdit || onDelete) && (
                    <div className="flex items-center gap-2 justify-end pt-3 mt-3" style={{ borderTop: '1px solid #dbdade' }}>
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(item)}
                          className="normal-case"
                          style={{ color: '#7367f0' }}
                        >
                          <MaterialIcon name="edit" size="sm" />
                          <span className="mr-1">تعديل</span>
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(item)}
                          className="normal-case"
                          style={{ color: '#ea5455' }}
                        >
                          <MaterialIcon name="delete" size="sm" />
                          <span className="mr-1">حذف</span>
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
        
        {/* Pagination Footer */}
        {sortedData.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-200 bg-gradient-to-br from-slate-50 to-white">
        {/* Info and Page Size Selector */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600 font-medium">عرض</span>
            <Select
              value={itemsPerPage.toString()}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              options={pageSizeOptions.map(size => ({ value: size.toString(), label: size.toString() }))}
              className="w-20"
              fullWidth={false}
            />
            <span className="text-sm text-slate-600 font-medium">عنصر في الصفحة</span>
          </div>
          <div className="text-sm text-slate-600">
            عرض <span className="text-primary-600 font-semibold">{sortedData.length > 0 ? startIndex + 1 : 0}</span> إلى{' '}
            <span className="text-primary-600 font-semibold">{Math.min(endIndex, sortedData.length)}</span> من{' '}
            <span className="text-primary-600 font-semibold">{sortedData.length}</span> عنصر
            {sortedData.length !== data.length && (
              <span> (من أصل <span className="text-primary-600 font-semibold">{data.length}</span>)</span>
            )}
          </div>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 flex-wrap animate-fade-in">
            {/* First Page */}
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className={`px-3 py-2 rounded-full border border-slate-300 text-sm font-medium flex items-center gap-1 material-transition ${
                currentPage === 1
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-white text-slate-700 hover:bg-primary-50 hover:border-primary-500 hover:text-primary-700 hover:shadow-md hover:scale-105'
              }`}
            >
              <MaterialIcon name="chevron_right" size="sm" />
              <MaterialIcon name="chevron_right" size="sm" />
            </button>

            {/* Previous Page */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-2 rounded-full border border-slate-300 text-sm font-medium flex items-center gap-1 material-transition ${
                currentPage === 1
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-white text-slate-700 hover:bg-primary-50 hover:border-primary-500 hover:text-primary-700 hover:shadow-md hover:scale-105'
              }`}
            >
              <MaterialIcon name="chevron_right" size="sm" />
              <span>السابق</span>
            </button>

            {/* Page Numbers */}
            <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`min-w-[2.5rem] h-10 px-3 rounded-full border text-sm font-medium material-transition ${
                      currentPage === pageNum
                        ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-600/30 scale-105'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-primary-50 hover:border-primary-500 hover:text-primary-700 hover:shadow-md hover:scale-105'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            {/* Next Page */}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-3 py-2 rounded-full border border-slate-300 text-sm font-medium flex items-center gap-1 material-transition ${
                currentPage === totalPages
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-white text-slate-700 hover:bg-primary-50 hover:border-primary-500 hover:text-primary-700 hover:shadow-md hover:scale-105'
              }`}
            >
              <span>التالي</span>
              <MaterialIcon name="chevron_left" size="sm" />
            </button>

            {/* Last Page */}
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className={`px-3 py-2 rounded-full border border-slate-300 text-sm font-medium flex items-center gap-1 material-transition ${
                currentPage === totalPages
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-white text-slate-700 hover:bg-primary-50 hover:border-primary-500 hover:text-primary-700 hover:shadow-md hover:scale-105'
              }`}
            >
              <MaterialIcon name="chevron_left" size="sm" />
              <MaterialIcon name="chevron_left" size="sm" />
            </button>
          </div>
        )}
          </div>
        )}
      </CardBody>
    </Card>
    {/* Render export dropdown using Portal */}
    {typeof window !== 'undefined' && exportDropdownOpen && exportDropdownPosition && createPortal(
      <div
        data-export-dropdown
        className="animate-scale-in"
        style={{
          position: 'fixed',
          right: `${exportDropdownPosition.right}px`,
          top: `${exportDropdownPosition.top}px`,
          backgroundColor: 'white',
          border: '2px solid #dbdade',
          borderRadius: '1rem',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(115, 103, 240, 0.1)',
          zIndex: 10000,
          minWidth: '192px',
          padding: '0.5rem 0',
          transformOrigin: 'top right',
          overflow: 'hidden'
        }}
      >
        <button
          onClick={() => {
            exportToExcel();
            setExportDropdownOpen(false);
            setExportDropdownPosition(null);
          }}
          style={{
            width: '100%',
            padding: '0.625rem 1rem',
            textAlign: 'right',
            border: 'none',
            background: 'transparent',
            color: '#6f6b7d',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f8f7fa';
            e.currentTarget.style.color = '#7367f0';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#6f6b7d';
          }}
        >
          <span>Excel</span>
          <MaterialIcon name="table_chart" className="text-primary-600" size="sm" />
        </button>
        <button
          onClick={() => {
            exportToCSV();
            setExportDropdownOpen(false);
            setExportDropdownPosition(null);
          }}
          style={{
            width: '100%',
            padding: '0.625rem 1rem',
            textAlign: 'right',
            border: 'none',
            background: 'transparent',
            color: '#6f6b7d',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f8f7fa';
            e.currentTarget.style.color = '#7367f0';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#6f6b7d';
          }}
        >
          <span>CSV</span>
          <MaterialIcon name="description" className="text-primary-600" size="sm" />
        </button>
        <button
          onClick={() => {
            exportToPDF();
            setExportDropdownOpen(false);
            setExportDropdownPosition(null);
          }}
          style={{
            width: '100%',
            padding: '0.625rem 1rem',
            textAlign: 'right',
            border: 'none',
            background: 'transparent',
            color: '#6f6b7d',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f8f7fa';
            e.currentTarget.style.color = '#7367f0';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#6f6b7d';
          }}
        >
          <span>PDF</span>
          <MaterialIcon name="picture_as_pdf" className="text-primary-600" size="sm" />
        </button>
        <button
          onClick={() => {
            printTable();
            setExportDropdownOpen(false);
            setExportDropdownPosition(null);
          }}
          style={{
            width: '100%',
            padding: '0.625rem 1rem',
            textAlign: 'right',
            border: 'none',
            background: 'transparent',
            color: '#6f6b7d',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f8f7fa';
            e.currentTarget.style.color = '#7367f0';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#6f6b7d';
          }}
        >
          <span>طباعة</span>
          <MaterialIcon name="print" className="text-primary-600" size="sm" />
        </button>
        <div style={{ margin: '0.25rem 0.5rem', height: '1px', background: '#e2e8f0' }}></div>
        <button
          onClick={() => {
            copyToClipboard();
            setExportDropdownOpen(false);
            setExportDropdownPosition(null);
          }}
          style={{
            width: '100%',
            padding: '0.625rem 1rem',
            textAlign: 'right',
            border: 'none',
            background: 'transparent',
            color: '#6f6b7d',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f8f7fa';
            e.currentTarget.style.color = '#7367f0';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#6f6b7d';
          }}
        >
          <span>نسخ</span>
          <MaterialIcon name="content_copy" className="text-primary-600" size="sm" />
        </button>
      </div>,
      document.body
    )}
    {/* Render action dropdowns using Portal outside the table */}
    {typeof window !== 'undefined' && Object.keys(actionDropdownOpen).map((itemId) => {
      if (!actionDropdownOpen[itemId] || !actionDropdownPosition[itemId]) return null;
      
      const item = paginatedData.find((i) => i.get('id') === itemId);
      if (!item) return null;
      
      return createPortal(
        <div
          key={itemId}
          data-dropdown-id={itemId}
          className="animate-scale-in"
          style={{
            position: 'fixed',
            left: `${actionDropdownPosition[itemId].left}px`,
            top: `${actionDropdownPosition[itemId].top}px`,
            backgroundColor: 'white',
            border: '2px solid #dbdade',
            borderRadius: '1rem',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(115, 103, 240, 0.1)',
            zIndex: 10000,
            minWidth: '180px',
            padding: '0.5rem 0',
            transformOrigin: 'top right'
          }}
        >
          {onView && (
            <button
              onClick={() => {
                onView(item);
                setActionDropdownOpen((prev) => ({ ...prev, [itemId]: false }));
                setActionDropdownPosition((prevPos) => {
                  const newPos = { ...prevPos };
                  delete newPos[itemId];
                  return newPos;
                });
              }}
              style={{
                width: '100%',
                padding: '0.5rem 1rem',
                textAlign: 'right',
                border: 'none',
                background: 'transparent',
                color: '#6f6b7d',
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f7fa'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <MaterialIcon name="visibility" size="sm" />
              <span>التفاصيل</span>
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => {
                onEdit(item);
                setActionDropdownOpen((prev) => ({ ...prev, [itemId]: false }));
                setActionDropdownPosition((prevPos) => {
                  const newPos = { ...prevPos };
                  delete newPos[itemId];
                  return newPos;
                });
              }}
              style={{
                width: '100%',
                padding: '0.5rem 1rem',
                textAlign: 'right',
                border: 'none',
                background: 'transparent',
                color: '#6f6b7d',
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f7fa'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <MaterialIcon name="edit" size="sm" />
              <span>تعديل</span>
            </button>
          )}
          {onArchive && (
            <button
              onClick={() => {
                onArchive(item);
                setActionDropdownOpen((prev) => ({ ...prev, [itemId]: false }));
                setActionDropdownPosition((prevPos) => {
                  const newPos = { ...prevPos };
                  delete newPos[itemId];
                  return newPos;
                });
              }}
              style={{
                width: '100%',
                padding: '0.5rem 1rem',
                textAlign: 'right',
                border: 'none',
                background: 'transparent',
                color: '#6f6b7d',
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f7fa'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <MaterialIcon name="archive" size="sm" />
              <span>أرشفة</span>
            </button>
          )}
          {(onView || onEdit || onArchive) && onDelete && (
            <div style={{ height: '1px', backgroundColor: '#dbdade', margin: '0.5rem 0' }}></div>
          )}
          {onDelete && (
            <button
              onClick={() => {
                onDelete(item);
                setActionDropdownOpen((prev) => ({ ...prev, [itemId]: false }));
                setActionDropdownPosition((prevPos) => {
                  const newPos = { ...prevPos };
                  delete newPos[itemId];
                  return newPos;
                });
              }}
              style={{
                width: '100%',
                padding: '0.5rem 1rem',
                textAlign: 'right',
                border: 'none',
                background: 'transparent',
                color: '#ea5455',
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ffebee'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <MaterialIcon name="delete" size="sm" />
              <span>حذف</span>
            </button>
          )}
        </div>,
        document.body
      );
    })}
    </>
  );
}

