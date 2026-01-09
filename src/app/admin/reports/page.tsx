'use client';

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MaterialIcon } from "@/components/icons/MaterialIcon";
import { MainLayout } from "@/components/layout/MainLayout";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useToast } from "@/contexts/ToastContext";
import { BaseModel } from "@/lib/BaseModel";
import { firestoreApi } from "@/lib/FirestoreApi";
import { PdfSettingsService } from "@/lib/services/PdfSettingsService";
import { getBothDates } from "@/lib/utils/hijriDate";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from 'xlsx';

interface AssetDetail {
  asset: BaseModel;
  assetName: string;
  assetType: string;
  assetStatus: string;
  departmentName: string;
  officeName: string;
  custodianName: string;
  value: number;
  purchaseValue: number;
  currentValue: number;
}

interface FilterOption {
  id: string;
  label: string;
  count: number;
}

interface AdvancedFilterProps {
  title: string;
  options: FilterOption[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  icon?: string;
}

const AdvancedFilter = memo(function AdvancedFilter({
  title,
  options,
  selectedIds,
  onToggle,
  onSelectAll,
  onDeselectAll,
  searchTerm,
  onSearchChange,
  isOpen,
  onToggleOpen,
  icon = "filter_list",
}: AdvancedFilterProps) {
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    return options.filter(opt =>
      opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  // حساب الحالة بناءً على الخيارات المفلترة
  const allFilteredSelected = filteredOptions.length > 0 && filteredOptions.every(opt => selectedIds.has(opt.id));
  const someFilteredSelected = filteredOptions.some(opt => selectedIds.has(opt.id));

  const handleToggle = useCallback((id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onToggle(id);
  }, [onToggle]);

  const handleSelectAll = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (allFilteredSelected) {
      // إلغاء تحديد جميع الخيارات المفلترة
      filteredOptions.forEach(opt => {
        if (selectedIds.has(opt.id)) {
          onToggle(opt.id);
        }
      });
    } else {
      // تحديد جميع الخيارات المفلترة
      filteredOptions.forEach(opt => {
        if (!selectedIds.has(opt.id)) {
          onToggle(opt.id);
        }
      });
    }
  }, [allFilteredSelected, filteredOptions, selectedIds, onToggle]);

  return (
    <div className="border-2 border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800 shadow-md hover:shadow-lg transition-all duration-200 hover:border-primary-300 dark:hover:border-primary-600">
      <button
        onClick={onToggleOpen}
        className="w-full p-3 bg-gradient-to-r from-slate-50 via-slate-100/70 to-slate-50 dark:from-slate-700 dark:via-slate-700/70 dark:to-slate-700 hover:from-primary-50 hover:via-primary-100/50 hover:to-primary-50 dark:hover:from-primary-900/30 dark:hover:via-primary-800/30 dark:hover:to-primary-900/30 transition-all duration-200 flex items-center justify-between group"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/50 group-hover:bg-primary-200 dark:group-hover:bg-primary-800 flex items-center justify-center transition-colors">
            <MaterialIcon
              name={isOpen ? "expand_less" : "expand_more"}
              className="text-primary-600 dark:text-primary-400"
              size="sm"
            />
          </div>
          <div className="flex items-center gap-2">
            {icon && <MaterialIcon name={icon} className="text-slate-500 dark:text-slate-400" size="sm" />}
            <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm">{title}</span>
          </div>
          {selectedIds.size > 0 && (
            <Badge variant="primary" size="sm" className="text-xs animate-scale-in">
              {selectedIds.size}
            </Badge>
          )}
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
          {filteredOptions.length}
        </span>
      </button>

      {isOpen && (
        <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 animate-fade-in">
          {/* البحث */}
          <div className="mb-3">
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ابحث في القائمة..."
              leftIcon={<MaterialIcon name="search" className="text-primary-500 flex-shrink-0" size="sm" />}
              className="w-full focus:ring-2 focus:ring-primary-500/20 transition-all duration-200"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* اختيار الكل / إلغاء الكل */}
          {filteredOptions.length > 0 && (
            <div className="mb-3 pb-3 border-b border-slate-200 dark:border-slate-700">
              <div
                className="flex items-center gap-2 p-2 hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:shadow-sm rounded-lg transition-all duration-200 cursor-pointer group"
                onClick={handleSelectAll}
              >
                <Checkbox
                  checked={allFilteredSelected}
                  onChange={() => { }}
                  label={allFilteredSelected ? "إلغاء تحديد الكل" : "تحديد الكل"}
                  className="text-sm font-medium"
                />
                {someFilteredSelected && !allFilteredSelected && (
                  <Badge variant="outline" size="sm" className="text-xs transition-all duration-150 group-hover:scale-105">
                    جزئي
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* قائمة الخيارات */}
          <div className="max-h-64 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-primary-300 dark:scrollbar-thumb-primary-600 scrollbar-track-slate-100 dark:scrollbar-track-slate-700 pr-1">
            {filteredOptions.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-3">
                  <MaterialIcon name="search_off" className="text-slate-400 dark:text-slate-500 transition-transform duration-200" size="md" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">لا توجد نتائج</p>
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = selectedIds.has(option.id);
                return (
                  <div
                    key={option.id}
                    className={`flex items-center justify-between p-2.5 rounded-lg transition-all duration-200 cursor-pointer ${isSelected
                        ? 'bg-gradient-to-r from-primary-50 to-primary-100/50 dark:from-primary-900/40 dark:to-primary-800/40 border-2 border-primary-200 dark:border-primary-700 shadow-md'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:shadow-sm border-2 border-transparent hover:border-slate-200 dark:hover:border-slate-600'
                      }`}
                    onClick={(e) => {
                      // منع النقر على div إذا كان النقر على checkbox
                      if ((e.target as HTMLElement).closest('input[type="checkbox"]')) {
                        return;
                      }
                      e.preventDefault();
                      e.stopPropagation();
                      handleToggle(option.id, e);
                    }}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Checkbox
                        checked={isSelected}
                        onChange={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // استدعاء مباشر لـ onToggle بدلاً من handleToggle لتجنب التكرار
                          onToggle(option.id);
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        label={option.label}
                        className="flex-1 text-sm"
                      />
                    </div>
                    <Badge
                      variant={isSelected ? "primary" : "outline"}
                      size="sm"
                      className="text-xs flex-shrink-0 transition-all duration-150 hover:scale-110 shadow-sm"
                    >
                      {option.count}
                    </Badge>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
});

interface RangeFilterProps {
  title: string;
  minValue: string;
  maxValue: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  icon?: string;
  placeholder?: { min: string; max: string };
}

function RangeFilter({
  title,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  isOpen,
  onToggleOpen,
  icon = "tune",
  placeholder = { min: "من", max: "إلى" },
}: RangeFilterProps) {
  const hasValue = minValue || maxValue;

  return (
    <div className="border-2 border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800 shadow-md hover:shadow-lg transition-all duration-200 hover:border-primary-300 dark:hover:border-primary-600">
      <button
        onClick={onToggleOpen}
        className="w-full p-3 bg-gradient-to-r from-slate-50 via-slate-100/70 to-slate-50 dark:from-slate-700 dark:via-slate-700/70 dark:to-slate-700 hover:from-primary-50 hover:via-primary-100/50 hover:to-primary-50 dark:hover:from-primary-900/30 dark:hover:via-primary-800/30 dark:hover:to-primary-900/30 transition-all duration-200 flex items-center justify-between group"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/50 dark:to-primary-800/50 group-hover:from-primary-200 group-hover:to-primary-100 dark:group-hover:from-primary-800 dark:group-hover:to-primary-700 flex items-center justify-center transition-all duration-200 shadow-sm group-hover:shadow-md group-hover:scale-110">
            <MaterialIcon
              name={isOpen ? "expand_less" : "expand_more"}
              className="text-primary-600 dark:text-primary-400 transition-transform duration-200"
              size="sm"
            />
          </div>
          <div className="flex items-center gap-2">
            {icon && <MaterialIcon name={icon} className="text-primary-500 dark:text-primary-400 flex-shrink-0 transition-colors duration-200" size="sm" />}
            <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors duration-200">{title}</span>
          </div>
          {hasValue && (
            <Badge variant="primary" size="sm" className="text-xs animate-scale-in shadow-sm transition-all duration-150 group-hover:scale-110">
              مفعل
            </Badge>
          )}
        </div>
      </button>

      {isOpen && (
        <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-gradient-to-br from-white to-slate-50/30 dark:from-slate-800 dark:to-slate-700/30 animate-fade-in backdrop-blur-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-1">
                <MaterialIcon name="arrow_downward" className="text-primary-500 dark:text-primary-400 flex-shrink-0" size="sm" />
                <span>{placeholder.min}</span>
              </label>
              <Input
                type="number"
                value={minValue}
                onChange={(e) => onMinChange(e.target.value)}
                placeholder={placeholder.min}
                className="w-full text-sm focus:ring-2 focus:ring-primary-500/20 transition-all duration-200"
                leftIcon={<MaterialIcon name="numbers" className="text-primary-500 flex-shrink-0" size="sm" />}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-1">
                <MaterialIcon name="arrow_upward" className="text-primary-500 dark:text-primary-400 flex-shrink-0" size="sm" />
                <span>{placeholder.max}</span>
              </label>
              <Input
                type="number"
                value={maxValue}
                onChange={(e) => onMaxChange(e.target.value)}
                placeholder={placeholder.max}
                className="w-full text-sm focus:ring-2 focus:ring-primary-500/20 transition-all duration-200"
                leftIcon={<MaterialIcon name="numbers" className="text-primary-500 flex-shrink-0" size="sm" />}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          {hasValue && (
            <Button
              onClick={() => {
                onMinChange('');
                onMaxChange('');
              }}
              variant="outline"
              size="sm"
              fullWidth
              leftIcon={<MaterialIcon name="close" className="transition-transform duration-200 group-hover:rotate-90" size="sm" />}
              className="text-xs mt-3 group hover:shadow-md transition-all duration-200"
              title="مسح جميع القيم"
            >
              مسح القيم
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function ReportsPageContent() {
  const { showSuccess, showError, showInfo } = useToast();
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState('جاري التحميل...');
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalAssets: 0,
    totalValue: 0,
    activeAssets: 0,
    departments: 0,
    offices: 0,
  });

  // البيانات الأساسية
  const [allAssets, setAllAssets] = useState<BaseModel[]>([]);
  const [allDepartments, setAllDepartments] = useState<BaseModel[]>([]);
  const [allOffices, setAllOffices] = useState<BaseModel[]>([]);
  const [statuses, setStatuses] = useState<BaseModel[]>([]);
  const [assetNames, setAssetNames] = useState<BaseModel[]>([]);
  const [assetTypes, setAssetTypes] = useState<BaseModel[]>([]);
  const [users, setUsers] = useState<BaseModel[]>([]);

  // الفلاتر
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<Set<string>>(new Set());
  const [selectedOfficeIds, setSelectedOfficeIds] = useState<Set<string>>(new Set());
  const [selectedAssetTypeIds, setSelectedAssetTypeIds] = useState<Set<string>>(new Set());
  const [selectedAssetStatusIds, setSelectedAssetStatusIds] = useState<Set<string>>(new Set());
  const [selectedAssetNameIds, setSelectedAssetNameIds] = useState<Set<string>>(new Set());
  const [selectedCustodianIds, setSelectedCustodianIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  // فلترات القيمة
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');
  const [minPurchaseValue, setMinPurchaseValue] = useState('');
  const [maxPurchaseValue, setMaxPurchaseValue] = useState('');
  const [minCurrentValue, setMinCurrentValue] = useState('');
  const [maxCurrentValue, setMaxCurrentValue] = useState('');

  // فلترات إضافية
  const [isActiveFilter, setIsActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [purchaseDateFrom, setPurchaseDateFrom] = useState('');
  const [purchaseDateTo, setPurchaseDateTo] = useState('');

  // حالة الفلاتر (مفتوحة/مغلقة)
  const [filterOpenStates, setFilterOpenStates] = useState({
    departments: false,
    offices: false,
    assetTypes: false,
    assetStatuses: false,
    assetNames: false,
    custodians: false,
    value: false,
    purchaseValue: false,
    currentValue: false,
    dates: false,
    status: false,
  });

  // البحث في الفلاتر
  const [filterSearchTerms, setFilterSearchTerms] = useState({
    departments: '',
    offices: '',
    assetTypes: '',
    assetStatuses: '',
    assetNames: '',
    custodians: '',
  });

  // Advanced Search state
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);
  const [searchFields, setSearchFields] = useState({
    assetName: '',
    assetType: '',
    assetStatus: '',
    department: '',
    office: '',
    custodian: '',
    assetTag: '',
    serialNumber: '',
    description: '',
  });

  // البيانات المعروضة
  const [allAssetDetails, setAllAssetDetails] = useState<AssetDetail[]>([]);

  // حالة قائمة التصدير
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [columnVisibilityOpen, setColumnVisibilityOpen] = useState(false);
  const exportButtonRef = useRef<HTMLDivElement>(null);
  const columnVisibilityRef = useRef<HTMLDivElement>(null);

  // Sorting state
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // حفظ الفلاتر في localStorage
  useEffect(() => {
    const savedFilters = localStorage.getItem('reportsFilters');
    if (savedFilters) {
      try {
        const filters = JSON.parse(savedFilters);
        if (filters.selectedDepartmentIds) setSelectedDepartmentIds(new Set(filters.selectedDepartmentIds));
        if (filters.selectedOfficeIds) setSelectedOfficeIds(new Set(filters.selectedOfficeIds));
        if (filters.selectedAssetTypeIds) setSelectedAssetTypeIds(new Set(filters.selectedAssetTypeIds));
        if (filters.selectedAssetStatusIds) setSelectedAssetStatusIds(new Set(filters.selectedAssetStatusIds));
        if (filters.selectedAssetNameIds) setSelectedAssetNameIds(new Set(filters.selectedAssetNameIds));
        if (filters.selectedCustodianIds) setSelectedCustodianIds(new Set(filters.selectedCustodianIds));
        if (filters.searchTerm) setSearchTerm(filters.searchTerm);
        if (filters.minValue) setMinValue(filters.minValue);
        if (filters.maxValue) setMaxValue(filters.maxValue);
        if (filters.isActiveFilter) setIsActiveFilter(filters.isActiveFilter);
        if (filters.itemsPerPage) setItemsPerPage(filters.itemsPerPage);
      } catch (e) {
        console.error('Error loading saved filters:', e);
      }
    }
  }, []);

  // حفظ الفلاتر عند التغيير
  useEffect(() => {
    const filtersToSave = {
      selectedDepartmentIds: Array.from(selectedDepartmentIds),
      selectedOfficeIds: Array.from(selectedOfficeIds),
      selectedAssetTypeIds: Array.from(selectedAssetTypeIds),
      selectedAssetStatusIds: Array.from(selectedAssetStatusIds),
      selectedAssetNameIds: Array.from(selectedAssetNameIds),
      selectedCustodianIds: Array.from(selectedCustodianIds),
      searchTerm,
      minValue,
      maxValue,
      isActiveFilter,
      itemsPerPage,
    };
    localStorage.setItem('reportsFilters', JSON.stringify(filtersToSave));
  }, [
    selectedDepartmentIds,
    selectedOfficeIds,
    selectedAssetTypeIds,
    selectedAssetStatusIds,
    selectedAssetNameIds,
    selectedCustodianIds,
    searchTerm,
    minValue,
    maxValue,
    isActiveFilter,
    itemsPerPage,
  ]);

  // تحميل Filter Presets
  useEffect(() => {
    const savedPresets = localStorage.getItem('reportsFilterPresets');
    if (savedPresets) {
      try {
        setFilterPresets(JSON.parse(savedPresets));
      } catch (e) {
        console.error('Error loading presets:', e);
      }
    }
  }, []);

  // تحميل Export History
  useEffect(() => {
    const savedHistory = localStorage.getItem('reportsExportHistory');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setExportHistory(parsed.map((item: any) => ({
          ...item,
          date: new Date(item.date),
        })));
      } catch (e) {
        console.error('Error loading export history:', e);
      }
    }
  }, []);

  // حفظ Export History (سيتم تعريفه بعد exportColumns)

  // تطبيق Filter Preset
  const applyFilterPreset = useCallback((preset: { name: string; filters: any }) => {
    if (preset.filters.selectedDepartmentIds) setSelectedDepartmentIds(new Set(preset.filters.selectedDepartmentIds));
    if (preset.filters.selectedOfficeIds) setSelectedOfficeIds(new Set(preset.filters.selectedOfficeIds));
    if (preset.filters.selectedAssetTypeIds) setSelectedAssetTypeIds(new Set(preset.filters.selectedAssetTypeIds));
    if (preset.filters.selectedAssetStatusIds) setSelectedAssetStatusIds(new Set(preset.filters.selectedAssetStatusIds));
    if (preset.filters.selectedAssetNameIds) setSelectedAssetNameIds(new Set(preset.filters.selectedAssetNameIds));
    if (preset.filters.selectedCustodianIds) setSelectedCustodianIds(new Set(preset.filters.selectedCustodianIds));
    if (preset.filters.searchTerm !== undefined) setSearchTerm(preset.filters.searchTerm);
    if (preset.filters.minValue !== undefined) setMinValue(preset.filters.minValue);
    if (preset.filters.maxValue !== undefined) setMaxValue(preset.filters.maxValue);
    if (preset.filters.minPurchaseValue !== undefined) setMinPurchaseValue(preset.filters.minPurchaseValue);
    if (preset.filters.maxPurchaseValue !== undefined) setMaxPurchaseValue(preset.filters.maxPurchaseValue);
    if (preset.filters.minCurrentValue !== undefined) setMinCurrentValue(preset.filters.minCurrentValue);
    if (preset.filters.maxCurrentValue !== undefined) setMaxCurrentValue(preset.filters.maxCurrentValue);
    if (preset.filters.isActiveFilter) setIsActiveFilter(preset.filters.isActiveFilter);
    if (preset.filters.purchaseDateFrom !== undefined) setPurchaseDateFrom(preset.filters.purchaseDateFrom);
    if (preset.filters.purchaseDateTo !== undefined) setPurchaseDateTo(preset.filters.purchaseDateTo);
    setCurrentPage(1);
  }, []);

  // حذف Filter Preset
  const deleteFilterPreset = useCallback((index: number) => {
    setFilterPresets(prev => {
      const presetName = prev[index]?.name || 'المجموعة';
      const newPresets = prev.filter((_, i) => i !== index);
      localStorage.setItem('reportsFilterPresets', JSON.stringify(newPresets));
      showInfo(`تم حذف مجموعة الفلاتر "${presetName}"`);
      return newPresets;
    });
  }, [showInfo]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+R أو Cmd+R: مسح جميع الفلاتر
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        resetFilters();
        showInfo('تم مسح جميع الفلاتر');
      }
      // Ctrl+K أو Cmd+K: التركيز على البحث
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }
      // Ctrl/Cmd + K للبحث
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="ابحث في جميع الحقول"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
      // Ctrl/Cmd + R لإعادة تعيين الفلاتر
      if ((e.ctrlKey || e.metaKey) && e.key === 'r' && !e.shiftKey) {
        e.preventDefault();
        resetFilters();
      }
      // Escape لإغلاق الفلاتر المفتوحة
      if (e.key === 'Escape') {
        setFilterOpenStates({
          departments: false,
          offices: false,
          assetTypes: false,
          assetStatuses: false,
          assetNames: false,
          custodians: false,
          value: false,
          purchaseValue: false,
          currentValue: false,
          dates: false,
          status: false,
        });
        setExportDropdownOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      setLoadingProgress(0);
      setLoadingStage('جاري تحميل الإحصائيات...');

      // جلب الإحصائيات السريعة أولاً (بدون تحميل البيانات)
      setLoadingProgress(10);
      const [
        totalAssetsCount,
        totalDepartmentsCount,
        totalUsersCount,
        deptDocs,
      ] = await Promise.all([
        firestoreApi.getCollectionCount("assets"),
        firestoreApi.getCollectionCount("departments"),
        firestoreApi.getCollectionCount("users"),
        firestoreApi.getDocuments(firestoreApi.getCollection("departments")),
      ]);

      setLoadingProgress(30);
      setLoadingStage('جاري جلب عدد المكاتب...');
      const departments = BaseModel.fromFirestoreArray(deptDocs);
      setAllDepartments(departments);

      // جلب عدد المكاتب من جميع الإدارات بشكل سريع
      const officeCountPromises = departments.map(async (dept) => {
        const deptId = dept.get('id');
        if (!deptId) return 0;
        return firestoreApi.getSubCollectionCount({
          parentCollection: "departments",
          parentId: deptId,
          subCollection: "departments",
        });
      });
      const officeCounts = await Promise.all(officeCountPromises);
      const totalOfficesCount = officeCounts.reduce((sum, count) => sum + count, 0);

      setLoadingProgress(50);
      setLoadingStage('جاري تحميل البيانات...');

      // جلب البيانات الكاملة للفلاتر والجدول (بعد الإحصائيات)
      const [
        assetDocs,
        statusDocs,
        assetNameDocs,
        assetTypeDocs,
        userDocs,
      ] = await Promise.all([
        firestoreApi.getDocuments(firestoreApi.getCollection("assets")),
        firestoreApi.getDocuments(firestoreApi.getCollection("assetStatuses")),
        firestoreApi.getDocuments(firestoreApi.getCollection("assetNames")),
        firestoreApi.getDocuments(firestoreApi.getCollection("assetTypes")),
        firestoreApi.getDocuments(firestoreApi.getCollection("users")),
      ]);

      setLoadingProgress(70);
      setLoadingStage('جاري معالجة البيانات...');

      const assets = BaseModel.fromFirestoreArray(assetDocs);
      const statusesData = BaseModel.fromFirestoreArray(statusDocs);
      const assetNamesData = BaseModel.fromFirestoreArray(assetNameDocs);
      const assetTypesData = BaseModel.fromFirestoreArray(assetTypeDocs);
      const usersData = BaseModel.fromFirestoreArray(userDocs);

      setAllAssets(assets);
      setStatuses(statusesData);
      setAssetNames(assetNamesData);
      setAssetTypes(assetTypesData);
      setUsers(usersData);

      setLoadingProgress(80);
      setLoadingStage('جاري تحميل المكاتب...');

      // جلب جميع المكاتب (للفلاتر)
      const officePromises = departments.map(async (dept) => {
        const deptId = dept.get('id');
        if (!deptId) return { deptId: '', offices: [] };

        const subCollectionRef = firestoreApi.getSubCollection("departments", deptId, "departments");
        const officeDocs = await firestoreApi.getDocuments(subCollectionRef);
        const offices = BaseModel.fromFirestoreArray(officeDocs);
        offices.forEach(office => {
          office.put('department_id', deptId);
        });
        return { deptId, offices };
      });

      const officeResults = await Promise.all(officePromises);
      const officesList: BaseModel[] = [];

      officeResults.forEach(({ offices }) => {
        offices.forEach(office => {
          officesList.push(office);
        });
      });

      setAllOffices(officesList);

      setLoadingProgress(90);
      setLoadingStage('جاري إعداد التقارير...');

      // حساب القيمة الإجمالية والأصول النشطة (من البيانات المحملة)
      const totalValue = assets.reduce((sum, asset) => {
        const currentValue = asset.getValue<number>('current_value') || 0;
        const purchaseValue = asset.getValue<number>('purchase_value') || 0;
        return sum + (currentValue || purchaseValue);
      }, 0);
      const activeAssets = assets.filter(a => {
        const isActive = a.getValue<number>('is_active') === 1 || a.getValue<boolean>('is_active') === true;
        return isActive;
      }).length;

      // تحديث الإحصائيات باستخدام الأعداد السريعة
      setStats({
        totalAssets: totalAssetsCount,
        totalValue,
        activeAssets,
        departments: totalDepartmentsCount,
        offices: totalOfficesCount,
      });

      setLoadingProgress(95);
      setLoadingStage('جاري بناء التفاصيل...');

      // بناء تفاصيل الأصول
      buildAssetDetails(assets, departments, officesList, statusesData, assetNamesData, assetTypesData, usersData);

      setLoadingProgress(100);
      // تأخير بسيط لإظهار 100% قبل إخفاء الشاشة
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.error("Error loading reports:", error);
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
      setError(errorMessage);
      setLoadingStage('حدث خطأ أثناء التحميل');
      showError(`فشل تحميل البيانات: ${errorMessage}`);
    } finally {
      setLoading(false);
      setLoadingProgress(0);
    }
  };

  const buildAssetDetails = (
    assets: BaseModel[],
    departments: BaseModel[],
    offices: BaseModel[],
    statuses: BaseModel[],
    assetNames: BaseModel[],
    assetTypes: BaseModel[],
    users: BaseModel[]
  ) => {
    // إنشاء Maps للبحث السريع
    const statusMap = new Map<string, BaseModel>();
    statuses.forEach(s => {
      const id = s.get('id');
      if (id) statusMap.set(id, s);
    });

    const assetNameMap = new Map<string, BaseModel>();
    assetNames.forEach(an => {
      const id = an.get('id');
      if (id) assetNameMap.set(id, an);
    });

    const assetTypeMap = new Map<string, BaseModel>();
    assetTypes.forEach(at => {
      const id = at.get('id');
      if (id) assetTypeMap.set(id, at);
    });

    const departmentMap = new Map<string, BaseModel>();
    departments.forEach(dept => {
      const id = dept.get('id');
      if (id) departmentMap.set(id, dept);
    });

    const officeMap = new Map<string, BaseModel>();
    offices.forEach(office => {
      const id = office.get('id');
      if (id) officeMap.set(id, office);
    });

    const userMap = new Map<string, BaseModel>();
    users.forEach(user => {
      const id = user.get('id');
      if (id) userMap.set(id, user);
    });

    const assetDetails: AssetDetail[] = assets.map(asset => {
      const assetNameId = asset.get('asset_name_id');
      const typeId = asset.get('type_id');
      const statusId = asset.get('status_id');
      const officeId = asset.get('location_office_id');
      const custodianId = asset.get('custodian_user_id');
      const currentValue = asset.getValue<number>('current_value') || 0;
      const purchaseValue = asset.getValue<number>('purchase_value') || 0;
      const value = currentValue || purchaseValue;

      const office = officeId ? officeMap.get(officeId) : null;
      const deptId = office?.get('department_id');
      const department = deptId ? departmentMap.get(deptId) : null;
      const custodian = custodianId ? userMap.get(custodianId) : null;

      return {
        asset,
        assetName: assetNameMap.get(assetNameId || '')?.get('name') || 'غير محدد',
        assetType: assetTypeMap.get(typeId || '')?.get('name') || 'غير محدد',
        assetStatus: statusMap.get(statusId || '')?.get('name') || 'غير محدد',
        departmentName: department?.get('name') || 'غير محدد',
        officeName: office?.get('name') || 'غير محدد',
        custodianName: custodian ? (custodian.get('full_name') || custodian.get('username') || 'غير محدد') : 'غير محدد',
        value,
        purchaseValue,
        currentValue,
      };
    });

    setAllAssetDetails(assetDetails);
  };

  // حساب خيارات الفلاتر مع عدد الأصول لكل خيار مع فلترة متداخلة
  const filterOptions = useMemo(() => {
    const departmentCounts = new Map<string, number>();
    const officeCounts = new Map<string, number>();
    const assetTypeCounts = new Map<string, number>();
    const assetStatusCounts = new Map<string, number>();
    const assetNameCounts = new Map<string, number>();
    const custodianCounts = new Map<string, number>();

    // فلترة أولية للأصول بناءً على الفلاتر المحددة
    let filteredDetails = allAssetDetails;

    // إذا تم تحديد إدارات، فلتر الأصول بناءً على المكاتب التابعة لتلك الإدارات
    if (selectedDepartmentIds.size > 0) {
      const selectedOfficeIdsFromDepts = new Set<string>();
      allOffices.forEach(office => {
        if (selectedDepartmentIds.has(office.get('department_id') || '')) {
          selectedOfficeIdsFromDepts.add(office.get('id') || '');
        }
      });
      filteredDetails = filteredDetails.filter(detail => {
        const officeId = allOffices.find(o => o.get('name') === detail.officeName)?.get('id');
        return officeId && selectedOfficeIdsFromDepts.has(officeId);
      });
    }

    // إذا تم تحديد مكاتب، فلتر الأصول بناءً على المكاتب المحددة
    if (selectedOfficeIds.size > 0) {
      filteredDetails = filteredDetails.filter(detail => {
        const officeId = allOffices.find(o => o.get('name') === detail.officeName)?.get('id');
        return officeId && selectedOfficeIds.has(officeId);
      });
    }

    // تحديد المكاتب المتاحة بناءً على الإدارات المحددة والمكاتب المحددة
    let availableOfficeIds = new Set<string>();
    
    // إذا تم تحديد مكاتب، أضف المكاتب المحددة
    if (selectedOfficeIds.size > 0) {
      selectedOfficeIds.forEach(officeId => {
        availableOfficeIds.add(officeId);
      });
    }
    
    // إذا تم تحديد إدارات، أضف المكاتب التابعة لتلك الإدارات
    if (selectedDepartmentIds.size > 0) {
      allOffices.forEach(office => {
        if (selectedDepartmentIds.has(office.get('department_id') || '')) {
          availableOfficeIds.add(office.get('id') || '');
        }
      });
    } else if (selectedOfficeIds.size === 0) {
      // إذا لم يتم تحديد إدارات ولا مكاتب، جميع المكاتب متاحة
      allOffices.forEach(office => {
        availableOfficeIds.add(office.get('id') || '');
      });
    }

    // حساب العدادات بناءً على الأصول في المكاتب المتاحة (وليس المفلترة)
    const availableDetails = allAssetDetails.filter(detail => {
      const officeId = allOffices.find(o => o.get('name') === detail.officeName)?.get('id');
      return officeId && availableOfficeIds.has(officeId);
    });

    availableDetails.forEach(detail => {
      // حساب الإدارات
      const deptId = allOffices.find(o => o.get('name') === detail.officeName)?.get('department_id');
      if (deptId) {
        departmentCounts.set(deptId, (departmentCounts.get(deptId) || 0) + 1);
      }

      // حساب المكاتب
      const officeId = allOffices.find(o => o.get('name') === detail.officeName)?.get('id');
      if (officeId) {
        officeCounts.set(officeId, (officeCounts.get(officeId) || 0) + 1);
      }

      // حساب أنواع الأصول
      const typeId = assetTypes.find(t => t.get('name') === detail.assetType)?.get('id');
      if (typeId) {
        assetTypeCounts.set(typeId, (assetTypeCounts.get(typeId) || 0) + 1);
      }

      // حساب حالات الأصول
      const statusId = statuses.find(s => s.get('name') === detail.assetStatus)?.get('id');
      if (statusId) {
        assetStatusCounts.set(statusId, (assetStatusCounts.get(statusId) || 0) + 1);
      }

      // حساب أسماء الأصول
      const nameId = assetNames.find(n => n.get('name') === detail.assetName)?.get('id');
      if (nameId) {
        assetNameCounts.set(nameId, (assetNameCounts.get(nameId) || 0) + 1);
      }

      // حساب حاملي الأصول
      const custodianId = users.find(u =>
        (u.get('full_name') === detail.custodianName || u.get('username') === detail.custodianName)
      )?.get('id');
      if (custodianId) {
        custodianCounts.set(custodianId, (custodianCounts.get(custodianId) || 0) + 1);
      }
    });

    // حساب العدادات الكاملة لجميع الإدارات (لإظهار جميع الإدارات حتى لو كانت count = 0)
    const allDepartmentCounts = new Map<string, number>();
    allAssetDetails.forEach(detail => {
      const deptId = allOffices.find(o => o.get('name') === detail.officeName)?.get('department_id');
      if (deptId) {
        allDepartmentCounts.set(deptId, (allDepartmentCounts.get(deptId) || 0) + 1);
      }
    });

    // فلترة المكاتب بناءً على الإدارات المحددة
    // إظهار المكاتب التابعة للإدارات المحددة + المكاتب المحددة مسبقاً
    let filteredOffices = allOffices;
    if (selectedDepartmentIds.size > 0) {
      const officesFromSelectedDepts = allOffices.filter(office => 
        selectedDepartmentIds.has(office.get('department_id') || '')
      );
      
      // إضافة المكاتب المحددة مسبقاً حتى لو لم تكن تابعة للإدارات المحددة
      const selectedOffices = allOffices.filter(office => 
        selectedOfficeIds.has(office.get('id') || '')
      );
      
      // دمج المكاتب مع تجنب التكرار
      const officeIdsSet = new Set<string>();
      filteredOffices = [];
      
      // إضافة المكاتب التابعة للإدارات المحددة
      officesFromSelectedDepts.forEach(office => {
        const officeId = office.get('id') || '';
        if (!officeIdsSet.has(officeId)) {
          officeIdsSet.add(officeId);
          filteredOffices.push(office);
        }
      });
      
      // إضافة المكاتب المحددة مسبقاً
      selectedOffices.forEach(office => {
        const officeId = office.get('id') || '';
        if (!officeIdsSet.has(officeId)) {
          officeIdsSet.add(officeId);
          filteredOffices.push(office);
        }
      });
    }

    return {
      // إظهار جميع الإدارات دائماً (لا يتم فلترتها)، لكن العدادات تعتمد على الأصول المفلترة
      departments: allDepartments
        .map(dept => {
          const deptId = dept.get('id') || '';
          // استخدام العدادات الكاملة لجميع الإدارات (لإظهار جميع الإدارات)
          const totalCount = allDepartmentCounts.get(deptId) ?? 0;
          
          return {
            id: deptId,
            label: dept.get('name') || 'غير محدد',
            // إظهار العدد الكامل دائماً (لإظهار جميع الإدارات)
            count: totalCount,
          };
        })
        .filter(opt => opt.count > 0) // إظهار فقط الإدارات التي لديها أصول
        .sort((a, b) => {
          // ترتيب الإدارات المحددة أولاً، ثم حسب العدد
          const aSelected = selectedDepartmentIds.has(a.id);
          const bSelected = selectedDepartmentIds.has(b.id);
          if (aSelected && !bSelected) return -1;
          if (!aSelected && bSelected) return 1;
          return b.count - a.count;
        }),
      offices: filteredOffices
        .map(office => {
          const officeId = office.get('id') || '';
          const isSelected = selectedOfficeIds.has(officeId);
          return {
            id: officeId,
            label: office.get('name') || 'غير محدد',
            count: officeCounts.get(officeId) || 0,
          };
        })
        .filter(opt => opt.count > 0 || selectedOfficeIds.has(opt.id)) // إظهار المكاتب المحددة حتى لو كانت count = 0
        .sort((a, b) => {
          // ترتيب المكاتب المحددة أولاً، ثم حسب العدد
          const aSelected = selectedOfficeIds.has(a.id);
          const bSelected = selectedOfficeIds.has(b.id);
          if (aSelected && !bSelected) return -1;
          if (!aSelected && bSelected) return 1;
          return b.count - a.count;
        }),
      assetTypes: assetTypes
        .map(type => {
          const typeId = type.get('id') || '';
          const isSelected = selectedAssetTypeIds.has(typeId);
          return {
            id: typeId,
            label: type.get('name') || 'غير محدد',
            count: assetTypeCounts.get(typeId) || 0,
          };
        })
        .filter(opt => opt.count > 0 || selectedAssetTypeIds.has(opt.id)) // إظهار الأنواع المحددة حتى لو كانت count = 0
        .sort((a, b) => {
          const aSelected = selectedAssetTypeIds.has(a.id);
          const bSelected = selectedAssetTypeIds.has(b.id);
          if (aSelected && !bSelected) return -1;
          if (!aSelected && bSelected) return 1;
          return b.count - a.count;
        }),
      assetStatuses: statuses
        .map(status => {
          const statusId = status.get('id') || '';
          const isSelected = selectedAssetStatusIds.has(statusId);
          return {
            id: statusId,
            label: status.get('name') || 'غير محدد',
            count: assetStatusCounts.get(statusId) || 0,
          };
        })
        .filter(opt => opt.count > 0 || selectedAssetStatusIds.has(opt.id)) // إظهار الحالات المحددة حتى لو كانت count = 0
        .sort((a, b) => {
          const aSelected = selectedAssetStatusIds.has(a.id);
          const bSelected = selectedAssetStatusIds.has(b.id);
          if (aSelected && !bSelected) return -1;
          if (!aSelected && bSelected) return 1;
          return b.count - a.count;
        }),
      assetNames: assetNames
        .map(name => {
          const nameId = name.get('id') || '';
          const isSelected = selectedAssetNameIds.has(nameId);
          return {
            id: nameId,
            label: name.get('name') || 'غير محدد',
            count: assetNameCounts.get(nameId) || 0,
          };
        })
        .filter(opt => opt.count > 0 || selectedAssetNameIds.has(opt.id)) // إظهار الأسماء المحددة حتى لو كانت count = 0
        .sort((a, b) => {
          const aSelected = selectedAssetNameIds.has(a.id);
          const bSelected = selectedAssetNameIds.has(b.id);
          if (aSelected && !bSelected) return -1;
          if (!aSelected && bSelected) return 1;
          return b.count - a.count;
        }),
      custodians: users
        .map(user => ({
          id: user.get('id') || '',
          label: user.get('full_name') || user.get('username') || 'غير محدد',
          count: custodianCounts.get(user.get('id') || '') || 0,
        }))
        .filter(opt => opt.count > 0)
        .sort((a, b) => b.count - a.count),
    };
  }, [allAssetDetails, allDepartments, allOffices, assetTypes, statuses, assetNames, users, selectedDepartmentIds, selectedOfficeIds]);

  // تطبيق الفلاتر على البيانات
  const filteredAssets = useMemo(() => {
    let filtered = allAssetDetails;

    // فلتر المكاتب (إذا تم تحديد مكاتب، استخدمها مباشرة بغض النظر عن الإدارات)
    if (selectedOfficeIds.size > 0) {
      filtered = filtered.filter(detail => {
        const officeId = allOffices.find(o => o.get('name') === detail.officeName)?.get('id');
        return officeId && selectedOfficeIds.has(officeId);
      });
    } 
    // فلتر الإدارات (فقط إذا لم يتم تحديد مكاتب)
    else if (selectedDepartmentIds.size > 0) {
      const selectedOfficeIdsFromDepts = new Set<string>();
      allOffices.forEach(office => {
        if (selectedDepartmentIds.has(office.get('department_id') || '')) {
          selectedOfficeIdsFromDepts.add(office.get('id') || '');
        }
      });
      filtered = filtered.filter(detail => {
        const officeId = allOffices.find(o => o.get('name') === detail.officeName)?.get('id');
        return officeId && selectedOfficeIdsFromDepts.has(officeId);
      });
    }

    // فلتر أنواع الأصول
    if (selectedAssetTypeIds.size > 0) {
      filtered = filtered.filter(detail => {
        const typeId = assetTypes.find(t => t.get('name') === detail.assetType)?.get('id');
        return typeId && selectedAssetTypeIds.has(typeId);
      });
    }

    // فلتر حالات الأصول
    if (selectedAssetStatusIds.size > 0) {
      filtered = filtered.filter(detail => {
        const statusId = statuses.find(s => s.get('name') === detail.assetStatus)?.get('id');
        return statusId && selectedAssetStatusIds.has(statusId);
      });
    }

    // فلتر أسماء الأصول
    if (selectedAssetNameIds.size > 0) {
      filtered = filtered.filter(detail => {
        const nameId = assetNames.find(n => n.get('name') === detail.assetName)?.get('id');
        return nameId && selectedAssetNameIds.has(nameId);
      });
    }

    // فلتر حاملي الأصول
    if (selectedCustodianIds.size > 0) {
      filtered = filtered.filter(detail => {
        const custodianId = users.find(u =>
          (u.get('full_name') === detail.custodianName || u.get('username') === detail.custodianName)
        )?.get('id');
        return custodianId && selectedCustodianIds.has(custodianId);
      });
    }

    // فلتر القيمة
    if (minValue || maxValue) {
      filtered = filtered.filter(detail => {
        const value = detail.value;
        if (minValue && value < parseFloat(minValue)) return false;
        if (maxValue && value > parseFloat(maxValue)) return false;
        return true;
      });
    }

    // فلتر القيمة الشرائية
    if (minPurchaseValue || maxPurchaseValue) {
      filtered = filtered.filter(detail => {
        const value = detail.purchaseValue;
        if (minPurchaseValue && value < parseFloat(minPurchaseValue)) return false;
        if (maxPurchaseValue && value > parseFloat(maxPurchaseValue)) return false;
        return true;
      });
    }

    // فلتر القيمة الحالية
    if (minCurrentValue || maxCurrentValue) {
      filtered = filtered.filter(detail => {
        const value = detail.currentValue;
        if (minCurrentValue && value < parseFloat(minCurrentValue)) return false;
        if (maxCurrentValue && value > parseFloat(maxCurrentValue)) return false;
        return true;
      });
    }

    // فلتر الحالة النشطة
    if (isActiveFilter !== 'all') {
      filtered = filtered.filter(detail => {
        const isActive = detail.asset.getValue<number>('is_active') === 1 ||
          detail.asset.getValue<boolean>('is_active') === true;
        return isActiveFilter === 'active' ? isActive : !isActive;
      });
    }

    // فلتر تاريخ الشراء
    if (purchaseDateFrom || purchaseDateTo) {
      filtered = filtered.filter(detail => {
        const purchaseDate = detail.asset.get('purchase_date');
        if (!purchaseDate) return false;
        if (purchaseDateFrom && purchaseDate < purchaseDateFrom) return false;
        if (purchaseDateTo && purchaseDate > purchaseDateTo) return false;
        return true;
      });
    }

    // البحث العام
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(detail => {
        return (
          detail.assetName.toLowerCase().includes(searchLower) ||
          detail.assetType.toLowerCase().includes(searchLower) ||
          detail.assetStatus.toLowerCase().includes(searchLower) ||
          detail.departmentName.toLowerCase().includes(searchLower) ||
          detail.officeName.toLowerCase().includes(searchLower) ||
          detail.custodianName.toLowerCase().includes(searchLower) ||
          detail.asset.get('asset_tag')?.toLowerCase().includes(searchLower) ||
          detail.asset.get('serial_number')?.toLowerCase().includes(searchLower) ||
          detail.asset.get('description')?.toLowerCase().includes(searchLower)
        );
      });
    }

    return filtered;
  }, [
    allAssetDetails,
    selectedDepartmentIds,
    selectedOfficeIds,
    selectedAssetTypeIds,
    selectedAssetStatusIds,
    selectedAssetNameIds,
    selectedCustodianIds,
    searchTerm,
    minValue,
    maxValue,
    minPurchaseValue,
    maxPurchaseValue,
    minCurrentValue,
    maxCurrentValue,
    isActiveFilter,
    purchaseDateFrom,
    purchaseDateTo,
    allOffices,
    assetTypes,
    statuses,
    assetNames,
    users,
  ]);

  // Sorting logic
  const sortedAndPaginatedAssets = useMemo(() => {
    let sorted = [...filteredAssets];

    if (sortColumn) {
      sorted.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortColumn) {
          case 'department':
            aValue = a.departmentName;
            bValue = b.departmentName;
            break;
          case 'office':
            aValue = a.officeName;
            bValue = b.officeName;
            break;
          case 'assetName':
            aValue = a.assetName;
            bValue = b.assetName;
            break;
          case 'assetType':
            aValue = a.assetType;
            bValue = b.assetType;
            break;
          case 'assetStatus':
            aValue = a.assetStatus;
            bValue = b.assetStatus;
            break;
          case 'custodian':
            aValue = a.custodianName;
            bValue = b.custodianName;
            break;
          case 'value':
            aValue = a.value;
            bValue = b.value;
            break;
          default:
            return 0;
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDirection === 'asc'
            ? aValue.localeCompare(bValue, 'ar')
            : bValue.localeCompare(aValue, 'ar');
        }

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }

        return 0;
      });
    }

    // Pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sorted.slice(startIndex, endIndex);
  }, [filteredAssets, sortColumn, sortDirection, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);

  const handleSort = useCallback((column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  }, [sortColumn, sortDirection]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleItemsPerPageChange = useCallback((items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
  }, []);

  const toggleFilter = useCallback((filterType: string, id: string) => {
    const toggleSet = (setter: React.Dispatch<React.SetStateAction<Set<string>>>) => {
      setter(prev => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        return newSet;
      });
    };

    switch (filterType) {
      case 'departments':
        setSelectedDepartmentIds(prev => {
          const newSet = new Set(prev);
          const isRemoving = newSet.has(id);
          
          if (isRemoving) {
            newSet.delete(id);
            // إلغاء تحديد جميع المكاتب التابعة لهذه الإدارة
            setSelectedOfficeIds(prevOffices => {
              const newOfficeSet = new Set(prevOffices);
              allOffices.forEach(office => {
                if (office.get('department_id') === id) {
                  newOfficeSet.delete(office.get('id') || '');
                }
              });
              return newOfficeSet;
            });
          } else {
            newSet.add(id);
          }
          return newSet;
        });
        break;
      case 'offices':
        toggleSet(setSelectedOfficeIds);
        break;
      case 'assetTypes':
        toggleSet(setSelectedAssetTypeIds);
        break;
      case 'assetStatuses':
        toggleSet(setSelectedAssetStatusIds);
        break;
      case 'assetNames':
        toggleSet(setSelectedAssetNameIds);
        break;
      case 'custodians':
        toggleSet(setSelectedCustodianIds);
        break;
    }
  }, [allOffices]);

  const resetFilters = useCallback(() => {
    setSelectedDepartmentIds(new Set());
    setSelectedOfficeIds(new Set());
    setSelectedAssetTypeIds(new Set());
    setSelectedAssetStatusIds(new Set());
    setSelectedAssetNameIds(new Set());
    setSelectedCustodianIds(new Set());
    setSearchTerm('');
    setMinValue('');
    setMaxValue('');
    setMinPurchaseValue('');
    setMaxPurchaseValue('');
    setMinCurrentValue('');
    setMaxCurrentValue('');
    setIsActiveFilter('all');
    setPurchaseDateFrom('');
    setPurchaseDateTo('');
  }, []);

  const exportToCSV = () => {
    if (filteredAssets.length === 0 || isExporting) return;
    setIsExporting(true);
    setExportType('CSV');

    // Simulate async operation
    setTimeout(() => {

      // بناء headers و data بناءً على الأعمدة المحددة
      const columnMap: { [key: string]: { header: string; getValue: (ad: AssetDetail) => string | number } } = {
        department: { header: 'الإدارة', getValue: (ad) => `"${ad.departmentName}"` },
        office: { header: 'المكتب', getValue: (ad) => `"${ad.officeName}"` },
        assetName: { header: 'اسم الأصل', getValue: (ad) => `"${ad.assetName}"` },
        assetType: { header: 'نوع الأصل', getValue: (ad) => `"${ad.assetType}"` },
        assetStatus: { header: 'حالة الأصل', getValue: (ad) => `"${ad.assetStatus}"` },
        custodian: { header: 'حامل الأصل', getValue: (ad) => `"${ad.custodianName}"` },
        assetTag: { header: 'رقم الأصل', getValue: (ad) => `"${ad.asset.get('asset_tag') || ''}"` },
        serialNumber: { header: 'الرقم التسلسلي', getValue: (ad) => `"${ad.asset.get('serial_number') || ''}"` },
        value: { header: 'القيمة', getValue: (ad) => ad.value },
        purchaseValue: { header: 'القيمة الشرائية', getValue: (ad) => ad.purchaseValue },
        currentValue: { header: 'القيمة الحالية', getValue: (ad) => ad.currentValue },
        purchaseDate: { header: 'تاريخ الشراء', getValue: (ad) => `"${ad.asset.get('purchase_date') || ''}"` },
        lastMaintenanceDate: { header: 'تاريخ آخر صيانة', getValue: (ad) => `"${ad.asset.get('last_maintenance_date') || ''}"` },
        description: { header: 'الوصف', getValue: (ad) => `"${(ad.asset.get('description') || '').replace(/"/g, '""')}"` },
        notes: { header: 'ملاحظات', getValue: (ad) => `"${(ad.asset.get('notes') || '').replace(/"/g, '""')}"` },
      };

      const selectedColumns = Object.entries(exportColumns)
        .filter(([_, selected]) => selected)
        .map(([key, _]) => key);

      const headers = selectedColumns.map(key => columnMap[key].header);
      const csvContent = [
        headers.join(','),
        ...filteredAssets.map(assetDetail => {
          return selectedColumns.map(key => columnMap[key].getValue(assetDetail)).join(',');
        })
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `تقرير_الأصول_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setExportDropdownOpen(false);
      saveExportHistory('CSV', filteredAssets.length);
      showSuccess(`تم تصدير ${filteredAssets.length} أصل إلى CSV`);
      setIsExporting(false);
      setExportType(null);
    }, 500);
  };

  const exportToExcel = () => {
    if (filteredAssets.length === 0 || isExporting) return;
    setIsExporting(true);
    setExportType('Excel');

    // Simulate async operation
    setTimeout(() => {

      const columnMap: { [key: string]: { header: string; getValue: (ad: AssetDetail) => any } } = {
        department: { header: 'الإدارة', getValue: (ad) => ad.departmentName },
        office: { header: 'المكتب', getValue: (ad) => ad.officeName },
        assetName: { header: 'اسم الأصل', getValue: (ad) => ad.assetName },
        assetType: { header: 'نوع الأصل', getValue: (ad) => ad.assetType },
        assetStatus: { header: 'حالة الأصل', getValue: (ad) => ad.assetStatus },
        custodian: { header: 'حامل الأصل', getValue: (ad) => ad.custodianName },
        assetTag: { header: 'رقم الأصل', getValue: (ad) => ad.asset.get('asset_tag') || '' },
        serialNumber: { header: 'الرقم التسلسلي', getValue: (ad) => ad.asset.get('serial_number') || '' },
        value: { header: 'القيمة', getValue: (ad) => ad.value },
        purchaseValue: { header: 'القيمة الشرائية', getValue: (ad) => ad.purchaseValue },
        currentValue: { header: 'القيمة الحالية', getValue: (ad) => ad.currentValue },
        purchaseDate: { header: 'تاريخ الشراء', getValue: (ad) => ad.asset.get('purchase_date') || '' },
        lastMaintenanceDate: { header: 'تاريخ آخر صيانة', getValue: (ad) => ad.asset.get('last_maintenance_date') || '' },
        description: { header: 'الوصف', getValue: (ad) => ad.asset.get('description') || '' },
        notes: { header: 'ملاحظات', getValue: (ad) => ad.asset.get('notes') || '' },
      };

      const selectedColumns = Object.entries(exportColumns)
        .filter(([_, selected]) => selected)
        .map(([key, _]) => key);

      const data = filteredAssets.map(assetDetail => {
        const row: any = {};
        selectedColumns.forEach(key => {
          row[columnMap[key].header] = columnMap[key].getValue(assetDetail);
        });
        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'الأصول');
      XLSX.writeFile(workbook, `تقرير_الأصول_${new Date().toISOString().split('T')[0]}.xlsx`);
      setExportDropdownOpen(false);
      saveExportHistory('Excel', filteredAssets.length);
      showSuccess(`تم تصدير ${filteredAssets.length} أصل إلى Excel`);
      setIsExporting(false);
      setExportType(null);
    }, 500);
  };

  const exportToPDF = () => {
    if (filteredAssets.length === 0 || isExporting) return;
    setIsExporting(true);
    setExportType('PDF');

    // Simulate async operation
    setTimeout(() => {

      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      const settingsService = PdfSettingsService.getInstance();
      const settings = settingsService.getSettings();
      const now = new Date();
      const { hijri, gregorian } = getBothDates(now);

      const hour = now.getHours() > 12 ? now.getHours() - 12 : (now.getHours() === 0 ? 12 : now.getHours());
      const period = now.getHours() < 12 ? 'صباحاً' : 'مساءً';
      const timeStr = `${String(hour).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} ${period}`;

      const rightHeaderLines = (settings.rightHeader || '').split('\n').filter(line => line.trim());
      const leftHeaderLines = (settings.leftHeader || '').split('\n').filter(line => line.trim());
      const footerSignatures = (settings.footerText || '').split('\n').filter(line => line.trim());

      let logoPath = settings.logoBase64 ? `data:image/png;base64,${settings.logoBase64}` : '/favicon.png';

      const tableRows = filteredAssets.map(assetDetail => {
        const asset = assetDetail.asset;
        return `
        <tr>
          <td>${assetDetail.departmentName}</td>
          <td>${assetDetail.officeName}</td>
          <td>${assetDetail.assetName}</td>
          <td>${assetDetail.assetType}</td>
          <td>${assetDetail.assetStatus}</td>
          <td>${assetDetail.custodianName}</td>
          <td>${asset.get('asset_tag') || '-'}</td>
          <td>${assetDetail.value.toLocaleString('ar-SA')} ريال</td>
        </tr>
      `;
      }).join('');

      const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <title>تقرير الأصول</title>
          <style>
            @media print {
              @page {
                margin: 15mm 10mm 15mm 10mm;
                size: A4 landscape;
              }
              body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
            }
            * {
              box-sizing: border-box;
            }
            body {
              font-family: 'Arial', 'Tahoma', 'Segoe UI', sans-serif;
              direction: rtl;
              margin: 0;
              padding: 15px;
              background: white;
              color: #000;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 15px;
              border-bottom: 3px solid #2563eb;
              padding-bottom: 10px;
              page-break-inside: avoid;
            }
            .header-left {
              text-align: right;
              flex: 1;
            }
            .header-right {
              text-align: left;
              flex: 1;
            }
            .logo {
              max-width: 120px;
              max-height: 70px;
              object-fit: contain;
            }
            h2 {
              text-align: center;
              margin: 15px 0;
              color: #1e40af;
              font-size: 18px;
            }
            .summary {
              background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
              padding: 12px;
              margin: 15px 0;
              border-radius: 8px;
              border: 2px solid #3b82f6;
              page-break-inside: avoid;
            }
            .summary strong {
              color: #1e40af;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
              font-size: 11px;
              page-break-inside: auto;
            }
            thead {
              display: table-header-group;
            }
            tfoot {
              display: table-footer-group;
            }
            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
            th, td {
              border: 1px solid #94a3b8;
              padding: 6px 8px;
              text-align: right;
              word-wrap: break-word;
            }
            th {
              background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
              color: white;
              font-weight: bold;
              font-size: 11px;
            }
            tbody tr:nth-child(even) {
              background-color: #f8fafc;
            }
            tbody tr:hover {
              background-color: #e0e7ff;
            }
            tfoot tr {
              background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
              font-weight: bold;
            }
            .footer {
              margin-top: 20px;
              border-top: 3px solid #2563eb;
              padding-top: 10px;
              text-align: center;
              page-break-inside: avoid;
              font-size: 10px;
              color: #475569;
            }
            @media print {
              .no-print {
                display: none !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="header-right">
              ${logoPath ? `<img src="${logoPath}" alt="Logo" class="logo" />` : ''}
              ${rightHeaderLines.map(line => `<div>${line}</div>`).join('')}
            </div>
            <div class="header-left">
              ${leftHeaderLines.map(line => `<div>${line}</div>`).join('')}
              <div>التاريخ الهجري: ${hijri}</div>
              <div>التاريخ الميلادي: ${gregorian}</div>
              <div>الوقت: ${timeStr}</div>
            </div>
          </div>
          
          <h2 style="text-align: center; margin: 20px 0;">تقرير الأصول المفلترة</h2>
          
          <div class="summary">
            <strong>عدد الأصول:</strong> ${filteredAssets.length} أصل | 
            <strong>القيمة الإجمالية:</strong> ${totalFilteredValue.toLocaleString('ar-SA')} ريال
          </div>

          <table>
            <thead>
              <tr>
                <th>الإدارة</th>
                <th>المكتب</th>
                <th>اسم الأصل</th>
                <th>نوع الأصل</th>
                <th>حالة الأصل</th>
                <th>حامل الأصل</th>
                <th>رقم الأصل</th>
                <th>القيمة</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
            <tfoot>
              <tr style="background-color: #f2f2f2; font-weight: bold;">
                <td colspan="7" style="text-align: left;">الإجمالي:</td>
                <td>${totalFilteredValue.toLocaleString('ar-SA')} ريال</td>
              </tr>
            </tfoot>
          </table>

          ${footerSignatures.length > 0 ? `
            <div class="footer">
              ${footerSignatures.map(line => `<div>${line}</div>`).join('')}
            </div>
          ` : ''}
        </body>
      </html>
    `;

      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 250);
      setExportDropdownOpen(false);
      const selectedColumnsCount = Object.values(exportColumns).filter(v => v).length;
      const newEntry = {
        id: `export-${Date.now()}-${Math.random()}`,
        type: 'PDF' as const,
        count: filteredAssets.length,
        date: new Date(),
        columns: selectedColumnsCount,
      };
      setExportHistory(prev => {
        const updated = [newEntry, ...prev].slice(0, 10);
        localStorage.setItem('reportsExportHistory', JSON.stringify(updated));
        return updated;
      });
      showInfo(`تم فتح نافذة الطباعة لـ ${filteredAssets.length} أصل`);
      setIsExporting(false);
      setExportType(null);
    }, 500);
  };

  const handlePrint = useCallback(() => {
    exportToPDF();
  }, [exportToPDF]);

  // إغلاق القوائم المنسدلة عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportButtonRef.current && !exportButtonRef.current.contains(event.target as Node)) {
        setExportDropdownOpen(false);
      }
      if (columnVisibilityRef.current && !columnVisibilityRef.current.contains(event.target as Node)) {
        setColumnVisibilityOpen(false);
      }
    };

    if (exportDropdownOpen || columnVisibilityOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [exportDropdownOpen, columnVisibilityOpen]);

  const totalFilteredValue = useMemo(() => {
    return filteredAssets.reduce((sum, ad) => sum + ad.value, 0);
  }, [filteredAssets]);

  // Copy to Clipboard
  const copyToClipboard = useCallback(() => {
    if (filteredAssets.length === 0 || isCopying) return;
    setIsCopying(true);

    const text = filteredAssets.map((assetDetail, idx) => {
      const asset = assetDetail.asset;
      return `${idx + 1}. ${assetDetail.assetName} - ${assetDetail.departmentName}/${assetDetail.officeName} - ${assetDetail.value.toLocaleString('ar-SA')} ريال`;
    }).join('\n');

    const summary = `إجمالي: ${filteredAssets.length} أصل\nالقيمة الإجمالية: ${totalFilteredValue.toLocaleString('ar-SA')} ريال\n\n${text}`;

    navigator.clipboard.writeText(summary).then(() => {
      showSuccess(`تم نسخ ${filteredAssets.length} أصل إلى الحافظة`);
      setIsCopying(false);
    }).catch(() => {
      showError('فشل نسخ البيانات إلى الحافظة');
      setIsCopying(false);
    });
  }, [filteredAssets, totalFilteredValue, showSuccess, showError]);

  // إحصائيات متقدمة للنتائج المفلترة
  const filteredStats = useMemo(() => {
    const activeCount = filteredAssets.filter(detail => {
      const isActive = detail.asset.getValue<number>('is_active') === 1 ||
        detail.asset.getValue<boolean>('is_active') === true;
      return isActive;
    }).length;

    const inactiveCount = filteredAssets.length - activeCount;
    const avgValue = filteredAssets.length > 0 ? totalFilteredValue / filteredAssets.length : 0;
    const maxValue = filteredAssets.length > 0 ? Math.max(...filteredAssets.map(a => a.value)) : 0;
    const minValue = filteredAssets.length > 0 ? Math.min(...filteredAssets.map(a => a.value)) : 0;

    // إحصائيات حسب النوع
    const typeStats = new Map<string, { count: number; value: number }>();
    filteredAssets.forEach(detail => {
      const type = detail.assetType;
      const current = typeStats.get(type) || { count: 0, value: 0 };
      typeStats.set(type, {
        count: current.count + 1,
        value: current.value + detail.value,
      });
    });

    // إحصائيات حسب الحالة
    const statusStats = new Map<string, { count: number; value: number }>();
    filteredAssets.forEach(detail => {
      const status = detail.assetStatus;
      const current = statusStats.get(status) || { count: 0, value: 0 };
      statusStats.set(status, {
        count: current.count + 1,
        value: current.value + detail.value,
      });
    });

    return {
      activeCount,
      inactiveCount,
      avgValue,
      maxValue,
      minValue,
      typeStats: Array.from(typeStats.entries()).sort((a, b) => b[1].value - a[1].value),
      statusStats: Array.from(statusStats.entries()).sort((a, b) => b[1].value - a[1].value),
    };
  }, [filteredAssets, totalFilteredValue]);

  // View Mode state
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Column Visibility state
  const [visibleColumns, setVisibleColumns] = useState({
    department: true,
    office: true,
    assetName: true,
    assetType: true,
    assetStatus: true,
    custodian: true,
    assetTag: true,
    value: true,
  });

  // Export Columns state
  const [exportColumns, setExportColumns] = useState({
    department: true,
    office: true,
    assetName: true,
    assetType: true,
    assetStatus: true,
    custodian: true,
    assetTag: true,
    serialNumber: true,
    value: true,
    purchaseValue: true,
    currentValue: true,
    purchaseDate: true,
    lastMaintenanceDate: true,
    description: true,
    notes: true,
  });
  const [showExportColumnsModal, setShowExportColumnsModal] = useState(false);

  // Export History state
  const [exportHistory, setExportHistory] = useState<Array<{
    id: string;
    type: 'CSV' | 'Excel' | 'PDF';
    count: number;
    date: Date;
    columns: number;
  }>>([]);
  const [showExportHistory, setShowExportHistory] = useState(false);

  // Saved Searches state
  const [savedSearches, setSavedSearches] = useState<Array<{
    id: string;
    name: string;
    searchTerm: string;
    searchFields: {
      assetName: boolean;
      assetTag: boolean;
      serialNumber: boolean;
      description: boolean;
    };
    date: Date;
  }>>([]);
  const [showSavedSearchesModal, setShowSavedSearchesModal] = useState(false);

  // Loading states
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<'CSV' | 'Excel' | 'PDF' | null>(null);
  const [isCopying, setIsCopying] = useState(false);

  // Search Suggestions state
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Row Selection state
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [selectAllMode, setSelectAllMode] = useState(false);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

  // Calculate if all current page items are selected (memoized for performance)
  const allCurrentPageSelected = useMemo(() => {
    if (sortedAndPaginatedAssets.length === 0) return false;
    return sortedAndPaginatedAssets.every((_, idx) => {
      const globalIndex = (currentPage - 1) * itemsPerPage + idx;
      return selectedRows.has(globalIndex);
    });
  }, [sortedAndPaginatedAssets, selectedRows, currentPage, itemsPerPage]);

  // Shared function for select/deselect all
  const handleSelectAllToggle = useCallback((e?: React.ChangeEvent<HTMLInputElement> | React.MouseEvent) => {
    if (e && 'stopPropagation' in e) {
      e.stopPropagation();
    }
    if (allCurrentPageSelected) {
      // إلغاء تحديد الكل
      setSelectedRows(prev => {
        const newSet = new Set(prev);
        sortedAndPaginatedAssets.forEach((_, idx) => {
          const globalIndex = (currentPage - 1) * itemsPerPage + idx;
          newSet.delete(globalIndex);
        });
        return newSet;
      });
      setLastSelectedIndex(null);
    } else {
      // تحديد الكل
      setSelectedRows(prev => {
        const newSet = new Set(prev);
        sortedAndPaginatedAssets.forEach((_, idx) => {
          const globalIndex = (currentPage - 1) * itemsPerPage + idx;
          newSet.add(globalIndex);
        });
        return newSet;
      });
      if (sortedAndPaginatedAssets.length > 0) {
        setLastSelectedIndex(sortedAndPaginatedAssets.length - 1);
      }
    }
  }, [allCurrentPageSelected, sortedAndPaginatedAssets, currentPage, itemsPerPage]);

  // Handle row selection with Shift and Ctrl support
  const handleRowToggle = useCallback((globalIndex: number, localIndex: number, event?: React.MouseEvent | React.ChangeEvent<HTMLInputElement> | React.KeyboardEvent) => {
    // Check if event is a MouseEvent to access shiftKey/ctrlKey
    const isMouseEvent = event && 'shiftKey' in event && 'ctrlKey' in event;
    const isShiftPressed = isMouseEvent ? (event as React.MouseEvent).shiftKey : false;
    const isCtrlPressed = isMouseEvent ? ((event as React.MouseEvent).ctrlKey || (event as React.MouseEvent).metaKey) : false;

    setSelectedRows(prev => {
      const newSet = new Set(prev);

      if (isShiftPressed && lastSelectedIndex !== null) {
        // Select range of rows
        const start = Math.min(lastSelectedIndex, localIndex);
        const end = Math.max(lastSelectedIndex, localIndex);
        for (let i = start; i <= end; i++) {
          const idx = (currentPage - 1) * itemsPerPage + i;
          newSet.add(idx);
        }
      } else {
        // Toggle single row (normal click, Ctrl+Click, or checkbox change)
        if (newSet.has(globalIndex)) {
          newSet.delete(globalIndex);
        } else {
          newSet.add(globalIndex);
        }
      }

      return newSet;
    });

    setLastSelectedIndex(localIndex);
  }, [lastSelectedIndex, currentPage, itemsPerPage]);

  // Reset selection when filters or search change
  useEffect(() => {
    setSelectedRows(new Set());
    setSelectAllMode(false);
    setLastSelectedIndex(null);
  }, [
    searchTerm,
    selectedDepartmentIds,
    selectedOfficeIds,
    selectedAssetTypeIds,
    selectedAssetStatusIds,
    selectedAssetNameIds,
    selectedCustodianIds,
    minValue,
    maxValue,
    minPurchaseValue,
    maxPurchaseValue,
    minCurrentValue,
    maxCurrentValue,
    isActiveFilter,
  ]);

  // Reset lastSelectedIndex when page changes
  useEffect(() => {
    setLastSelectedIndex(null);
  }, [currentPage]);

  // Memoized selected rows count for performance
  const selectedRowsCount = useMemo(() => selectedRows.size, [selectedRows]);

  // Memoized selected assets from current page
  const selectedAssetsFromCurrentPage = useMemo(() => {
    return sortedAndPaginatedAssets.filter((_, idx) => {
      const globalIndex = (currentPage - 1) * itemsPerPage + idx;
      return selectedRows.has(globalIndex);
    });
  }, [sortedAndPaginatedAssets, selectedRows, currentPage, itemsPerPage]);

  // Memoized selected assets summary
  const selectedAssetsSummary = useMemo(() => {
    if (selectedAssetsFromCurrentPage.length === 0) return null;
    
    const text = selectedAssetsFromCurrentPage.map((assetDetail, idx) => {
      return `${idx + 1}. ${assetDetail.assetName} - ${assetDetail.departmentName}/${assetDetail.officeName} - ${assetDetail.value.toLocaleString('ar-SA')} ريال`;
    }).join('\n');
    
    const totalValue = selectedAssetsFromCurrentPage.reduce((sum, ad) => sum + ad.value, 0);
    const summary = `إجمالي: ${selectedAssetsFromCurrentPage.length} أصل\nالقيمة الإجمالية: ${totalValue.toLocaleString('ar-SA')} ريال\n\n${text}`;
    
    return { text, summary, totalValue, count: selectedAssetsFromCurrentPage.length };
  }, [selectedAssetsFromCurrentPage]);

  // Generate Search Suggestions
  useEffect(() => {
    if (searchTerm.trim().length < 2) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    const suggestions: string[] = [];

    // اقتراحات من أسماء الأصول
    allAssetDetails.forEach(detail => {
      if (detail.assetName.toLowerCase().includes(searchLower) &&
        !suggestions.includes(detail.assetName) &&
        suggestions.length < 5) {
        suggestions.push(detail.assetName);
      }
    });

    // اقتراحات من أنواع الأصول
    assetTypes.forEach(type => {
      const typeName = type.get('name') || '';
      if (typeName.toLowerCase().includes(searchLower) &&
        !suggestions.includes(typeName) &&
        suggestions.length < 5) {
        suggestions.push(typeName);
      }
    });

    // اقتراحات من أسماء الإدارات
    allDepartments.forEach(dept => {
      const deptName = dept.get('name') || '';
      if (deptName.toLowerCase().includes(searchLower) &&
        !suggestions.includes(deptName) &&
        suggestions.length < 5) {
        suggestions.push(deptName);
      }
    });

    setSearchSuggestions(suggestions.slice(0, 5));
    setShowSuggestions(suggestions.length > 0);
  }, [searchTerm, allAssetDetails, assetTypes, allDepartments]);

  // حفظ Export History
  const saveExportHistory = useCallback((type: 'CSV' | 'Excel' | 'PDF', count: number) => {
    const selectedColumnsCount = Object.values(exportColumns).filter(v => v).length;
    const newEntry = {
      id: `export-${Date.now()}-${Math.random()}`,
      type,
      count,
      date: new Date(),
      columns: selectedColumnsCount,
    };
    setExportHistory(prev => {
      const updated = [newEntry, ...prev].slice(0, 10); // حفظ آخر 10 تصديرات
      localStorage.setItem('reportsExportHistory', JSON.stringify(updated));
      return updated;
    });
  }, [exportColumns]);

  // Filter Presets state
  const [filterPresets, setFilterPresets] = useState<Array<{ name: string; filters: any }>>([]);
  const [presetName, setPresetName] = useState('');
  const [showPresetModal, setShowPresetModal] = useState(false);

  // حفظ Filter Preset
  const saveFilterPreset = useCallback(() => {
    if (!presetName.trim()) return;

    const preset = {
      name: presetName.trim(),
      filters: {
        selectedDepartmentIds: Array.from(selectedDepartmentIds),
        selectedOfficeIds: Array.from(selectedOfficeIds),
        selectedAssetTypeIds: Array.from(selectedAssetTypeIds),
        selectedAssetStatusIds: Array.from(selectedAssetStatusIds),
        selectedAssetNameIds: Array.from(selectedAssetNameIds),
        selectedCustodianIds: Array.from(selectedCustodianIds),
        searchTerm,
        minValue,
        maxValue,
        minPurchaseValue,
        maxPurchaseValue,
        minCurrentValue,
        maxCurrentValue,
        isActiveFilter,
        purchaseDateFrom,
        purchaseDateTo,
      },
    };

    setFilterPresets(prev => {
      const newPresets = [...prev, preset];
      localStorage.setItem('reportsFilterPresets', JSON.stringify(newPresets));
      return newPresets;
    });
    setPresetName('');
    setShowPresetModal(false);
    showSuccess(`تم حفظ مجموعة الفلاتر "${presetName.trim()}"`);
  }, [
    presetName,
    selectedDepartmentIds,
    selectedOfficeIds,
    selectedAssetTypeIds,
    selectedAssetStatusIds,
    selectedAssetNameIds,
    selectedCustodianIds,
    searchTerm,
    searchFields,
    minValue,
    maxValue,
    minPurchaseValue,
    maxPurchaseValue,
    minCurrentValue,
    maxCurrentValue,
    isActiveFilter,
    purchaseDateFrom,
    purchaseDateTo,
  ]);

  if (loading) {
    return (
      <MainLayout>
        <LoadingScreen
          message={loadingStage}
          showProgress={true}
          progress={loadingProgress}
        />
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="max-w-md w-full shadow-xl border-2 border-error-200 dark:border-error-800 bg-gradient-to-br from-white to-error-50/30 dark:from-slate-800 dark:to-error-900/20">
            <CardBody className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-error-100 to-error-50 dark:from-error-900/50 dark:to-error-800/50 flex items-center justify-center mx-auto mb-4 shadow-lg transition-all duration-300 hover:scale-110">
                <MaterialIcon name="error" className="text-error-600 dark:text-error-400 transition-transform duration-300" size="2xl" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">حدث خطأ</h2>
              <p className="text-slate-600 dark:text-slate-300 mb-4">{error}</p>
              <Button
                onClick={() => {
                  setError(null);
                  window.location.reload();
                }}
                variant="primary"
                leftIcon={<MaterialIcon name="refresh" className="transition-transform duration-200 group-hover:rotate-180" size="sm" />}
                className="group hover:shadow-md transition-all duration-200"
                title="إعادة تحميل الصفحة"
              >
                إعادة المحاولة
              </Button>
            </CardBody>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="w-full">
        {/* Page Header */}
        <div className="mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30 flex-shrink-0 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-primary-500/40">
              <MaterialIcon name="assessment" className="text-white transition-transform duration-300 hover:scale-110" size="lg" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-0.5" id="reports-page-title">التقارير والإحصائيات</h1>
              <p className="text-slate-600 dark:text-slate-300 text-sm font-medium" aria-describedby="reports-page-title">
                نظام فلترة متقدم مع Sorting و Pagination
                <span className="text-xs text-slate-400 dark:text-slate-500 mr-2" aria-label="اختصارات لوحة المفاتيح">(Ctrl+K للبحث، Ctrl+R لإعادة التعيين)</span>
              </p>
            </div>
          </div>
        </div>

        {/* إحصائيات عامة */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
          <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-700/50 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer group">
            <CardBody padding="sm">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">إجمالي الأصول</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 transition-all duration-300 group-hover:text-primary-700 dark:group-hover:text-primary-400">{stats.totalAssets.toLocaleString('ar-SA')}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">أصل</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/50 dark:to-primary-800/50 flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-110 group-hover:shadow-md">
                  <MaterialIcon name="inventory" className="text-primary-600 dark:text-primary-400 transition-transform duration-200 group-hover:scale-110" size="md" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-700/50 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer group">
            <CardBody padding="sm">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 group-hover:text-success-600 dark:group-hover:text-success-400 transition-colors duration-200">القيمة الإجمالية</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-slate-100 truncate transition-all duration-300 group-hover:text-success-700 dark:group-hover:text-success-400">
                    {stats.totalValue.toLocaleString('ar-SA')}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">ريال</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-success-100 to-success-50 dark:from-success-900/50 dark:to-success-800/50 flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-110 group-hover:shadow-md">
                  <MaterialIcon name="attach_money" className="text-success-600 dark:text-success-400 transition-transform duration-200 group-hover:scale-110" size="md" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-700/50 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer group">
            <CardBody padding="sm">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors duration-200">أصول نشطة</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 transition-all duration-300 group-hover:text-accent-700 dark:group-hover:text-accent-400">{stats.activeAssets.toLocaleString('ar-SA')}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">نشط</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-100 to-accent-50 dark:from-accent-900/50 dark:to-accent-800/50 flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-110 group-hover:shadow-md">
                  <MaterialIcon name="check_circle" className="text-accent-600 dark:text-accent-400 transition-transform duration-200 group-hover:scale-110" size="md" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-700/50 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer group">
            <CardBody padding="sm">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 group-hover:text-warning-600 dark:group-hover:text-warning-400 transition-colors duration-200">النتائج المفلترة</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 transition-all duration-300 group-hover:text-warning-700 dark:group-hover:text-warning-400">{filteredAssets.length.toLocaleString('ar-SA')}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">من {stats.totalAssets.toLocaleString('ar-SA')}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-warning-100 to-warning-50 dark:from-warning-900/50 dark:to-warning-800/50 flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-110 group-hover:shadow-md">
                  <MaterialIcon name="filter_list" className="text-warning-600 dark:text-warning-400 transition-transform duration-200 group-hover:scale-110" size="md" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
            <CardBody padding="sm">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">قيمة المفلترة</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-slate-100 truncate transition-all duration-300">
                    {totalFilteredValue.toLocaleString('ar-SA')}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">ريال</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center flex-shrink-0 transition-colors hover:bg-primary-200 dark:hover:bg-primary-800">
                  <MaterialIcon name="calculate" className="text-primary-600 dark:text-primary-400" size="md" />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* إحصائيات متقدمة للنتائج المفلترة */}
        {filteredAssets.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
            <Card className="bg-gradient-to-br from-primary-50 to-primary-100 border-2 border-primary-200">
              <CardBody padding="sm">
                <div className="text-center">
                  <p className="text-xs font-medium text-primary-700 mb-1">متوسط القيمة</p>
                  <p className="text-lg font-bold text-primary-900">
                    {filteredStats.avgValue.toLocaleString('ar-SA', { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-xs text-primary-600">ريال</p>
                </div>
              </CardBody>
            </Card>

            <Card className="bg-gradient-to-br from-success-50 to-success-100 border-2 border-success-200">
              <CardBody padding="sm">
                <div className="text-center">
                  <p className="text-xs font-medium text-success-700 mb-1">أعلى قيمة</p>
                  <p className="text-lg font-bold text-success-900">
                    {filteredStats.maxValue.toLocaleString('ar-SA')}
                  </p>
                  <p className="text-xs text-success-600">ريال</p>
                </div>
              </CardBody>
            </Card>

            <Card className="bg-gradient-to-br from-warning-50 to-warning-100 border-2 border-warning-200">
              <CardBody padding="sm">
                <div className="text-center">
                  <p className="text-xs font-medium text-warning-700 mb-1">أقل قيمة</p>
                  <p className="text-lg font-bold text-warning-900">
                    {filteredStats.minValue.toLocaleString('ar-SA')}
                  </p>
                  <p className="text-xs text-warning-600">ريال</p>
                </div>
              </CardBody>
            </Card>

            <Card className="bg-gradient-to-br from-accent-50 to-accent-100 border-2 border-accent-200">
              <CardBody padding="sm">
                <div className="text-center">
                  <p className="text-xs font-medium text-accent-700 mb-1">نشط</p>
                  <p className="text-lg font-bold text-accent-900">
                    {filteredStats.activeCount.toLocaleString('ar-SA')}
                  </p>
                  <p className="text-xs text-accent-600">
                    ({filteredAssets.length > 0 ? Math.round((filteredStats.activeCount / filteredAssets.length) * 100) : 0}%)
                  </p>
                </div>
              </CardBody>
            </Card>

            <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600 border-2 border-slate-200 dark:border-slate-600">
              <CardBody padding="sm">
                <div className="text-center">
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">غير نشط</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {filteredStats.inactiveCount.toLocaleString('ar-SA')}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    ({filteredAssets.length > 0 ? Math.round((filteredStats.inactiveCount / filteredAssets.length) * 100) : 0}%)
                  </p>
                </div>
              </CardBody>
            </Card>

            <Card className="bg-gradient-to-br from-secondary-50 to-secondary-100 border-2 border-secondary-200">
              <CardBody padding="sm">
                <div className="text-center">
                  <p className="text-xs font-medium text-secondary-700 mb-1">أنواع مختلفة</p>
                  <p className="text-lg font-bold text-secondary-900">
                    {filteredStats.typeStats.length}
                  </p>
                  <p className="text-xs text-secondary-600">نوع</p>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Summary Banner */}
        {filteredAssets.length > 0 && filteredAssets.length < allAssetDetails.length && (
          <div className="mb-4 p-4 bg-gradient-to-r from-primary-50 via-blue-50 to-primary-50 border-2 border-primary-200 rounded-xl shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/50 dark:to-primary-800/50 flex items-center justify-center flex-shrink-0 shadow-md transition-all duration-200 hover:scale-110">
                <MaterialIcon name="info" className="text-primary-600 dark:text-primary-400 transition-transform duration-200" size="md" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  عرض {filteredAssets.length.toLocaleString('ar-SA')} من {allAssetDetails.length.toLocaleString('ar-SA')} أصل
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  النسبة: {((filteredAssets.length / allAssetDetails.length) * 100).toFixed(1)}% من إجمالي الأصول
                </p>
              </div>
              <Button
                onClick={resetFilters}
                variant="outline"
                size="sm"
                leftIcon={<MaterialIcon name="refresh" className="transition-transform duration-200 group-hover:rotate-180" size="sm" />}
                className="group hover:shadow-md transition-all duration-200"
                title="إعادة تعيين جميع الفلاتر"
              >
                عرض الكل
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-4 w-full">
          {/* لوحة الفلاتر */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <Card className="lg:sticky lg:top-4 shadow-xl border-2 border-slate-200 dark:border-slate-700 bg-gradient-to-br from-white to-slate-50/30 dark:from-slate-800 dark:to-slate-700/30 h-fit lg:max-h-[calc(100vh-120px)] flex flex-col backdrop-blur-sm">
              <CardHeader className="pb-3 border-b-2 border-slate-200 dark:border-slate-700 bg-gradient-to-r from-primary-50 via-slate-50 to-primary-50 dark:from-primary-900/30 dark:via-slate-700 dark:to-primary-900/30 shadow-sm">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/50 dark:to-primary-800/50 flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110">
                      <MaterialIcon name="tune" className="text-primary-600 dark:text-primary-400 transition-transform duration-200" size="sm" />
                    </div>
                    <span className="text-base font-bold text-slate-800 dark:text-slate-200" id="filters-panel-title">الفلاتر المتقدمة</span>
                    {/* عرض عدد الفلاتر المحددة */}
                    {(selectedDepartmentIds.size > 0 || selectedOfficeIds.size > 0 || selectedAssetTypeIds.size > 0 || 
                      selectedAssetStatusIds.size > 0 || selectedAssetNameIds.size > 0 || selectedCustodianIds.size > 0 ||
                      minValue || maxValue || minPurchaseValue || maxPurchaseValue || minCurrentValue || maxCurrentValue ||
                      isActiveFilter !== 'all' || purchaseDateFrom || purchaseDateTo) && (
                      <Badge variant="primary" size="sm" className="animate-scale-in shadow-sm">
                        {selectedDepartmentIds.size + selectedOfficeIds.size + selectedAssetTypeIds.size + 
                         selectedAssetStatusIds.size + selectedAssetNameIds.size + selectedCustodianIds.size +
                         (minValue || maxValue ? 1 : 0) + (minPurchaseValue || maxPurchaseValue ? 1 : 0) + 
                         (minCurrentValue || maxCurrentValue ? 1 : 0) + (isActiveFilter !== 'all' ? 1 : 0) +
                         (purchaseDateFrom || purchaseDateTo ? 1 : 0)} مفعل
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* زر مسح جميع الفلاتر */}
                    {(selectedDepartmentIds.size > 0 || selectedOfficeIds.size > 0 || selectedAssetTypeIds.size > 0 || 
                      selectedAssetStatusIds.size > 0 || selectedAssetNameIds.size > 0 || selectedCustodianIds.size > 0 ||
                      minValue || maxValue || minPurchaseValue || maxPurchaseValue || minCurrentValue || maxCurrentValue ||
                      isActiveFilter !== 'all' || purchaseDateFrom || purchaseDateTo || searchTerm) && (
                      <Button
                        onClick={resetFilters}
                        variant="outline"
                        size="sm"
                        leftIcon={<MaterialIcon name="clear_all" className="transition-transform duration-200 group-hover:rotate-90" size="sm" />}
                        className="text-xs group hover:shadow-md hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-all duration-200 animate-scale-in"
                        title="مسح جميع الفلاتر (Ctrl+R)"
                      >
                        <span className="hidden sm:inline">مسح الكل</span>
                        <span className="sm:hidden">مسح</span>
                      </Button>
                    )}
                    {/* Filter Presets */}
                    <div className="relative">
                      <Button
                        onClick={() => setShowPresetModal(!showPresetModal)}
                        variant="outline"
                        size="sm"
                        leftIcon={<MaterialIcon name="folder" size="sm" />}
                        className="text-xs"
                      >
                        <span className="hidden sm:inline">حفظ</span>
                        {filterPresets.length > 0 && (
                          <Badge variant="primary" size="sm" className="mr-1 text-xs">
                            {filterPresets.length}
                          </Badge>
                        )}
                      </Button>
                      {showPresetModal && (
                        <div className="absolute top-full left-0 mt-2 glass-effect rounded-xl shadow-2xl z-50 overflow-hidden animate-scale-in min-w-[250px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          <div className="p-2 max-h-64 overflow-y-auto">
                            <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2 px-2">مجموعات الفلاتر المحفوظة:</div>
                            {filterPresets.map((preset, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-2 hover:bg-primary-50 rounded-lg transition-colors group"
                              >
                                <button
                                  onClick={() => {
                                    applyFilterPreset(preset);
                                    setShowPresetModal(false);
                                  }}
                                  className="flex-1 text-right text-sm text-slate-700 dark:text-slate-200 hover:text-primary-600 dark:hover:text-primary-400"
                                >
                                  {preset.name}
                                </button>
                                <button
                                  onClick={() => deleteFilterPreset(idx)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-error-50 rounded"
                                >
                                  <MaterialIcon name="delete" className="text-error-600" size="sm" />
                                </button>
                              </div>
                            ))}
                            <div className="border-t border-slate-200 dark:border-slate-700 mt-2 pt-2">
                              <div className="p-2 space-y-2">
                                <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">حفظ الفلاتر الحالية:</div>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="text"
                                    value={presetName}
                                    onChange={(e) => setPresetName(e.target.value)}
                                    placeholder="اسم المجموعة..."
                                    className="flex-1 text-sm"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        saveFilterPreset();
                                      }
                                    }}
                                  />
                                  <Button
                                    onClick={saveFilterPreset}
                                    variant="primary"
                                    size="sm"
                                    disabled={!presetName.trim()}
                                    leftIcon={<MaterialIcon name="save" className="transition-transform duration-200 group-hover:scale-110" size="sm" />}
                                    className="group hover:shadow-md transition-all duration-200"
                                    title="حفظ مجموعة الفلاتر الحالية"
                                  >
                                    حفظ
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    {(selectedDepartmentIds.size > 0 || selectedOfficeIds.size > 0 || selectedAssetTypeIds.size > 0 ||
                      selectedAssetStatusIds.size > 0 || selectedAssetNameIds.size > 0 || selectedCustodianIds.size > 0 ||
                      minValue || maxValue || minPurchaseValue || maxPurchaseValue || minCurrentValue || maxCurrentValue ||
                      isActiveFilter !== 'all' || purchaseDateFrom || purchaseDateTo) && (
                        <Button
                          onClick={resetFilters}
                          variant="outline"
                          size="sm"
                          leftIcon={<MaterialIcon name="refresh" className="transition-transform duration-200 group-hover:rotate-180" size="sm" />}
                          className="text-xs group hover:shadow-md transition-all duration-200"
                          title="إعادة تعيين جميع الفلاتر"
                        >
                          إعادة تعيين
                        </Button>
                      )}
                  </div>
                </div>
              </CardHeader>
              <CardBody className="pt-4 flex-1 flex flex-col min-h-0" aria-labelledby="filters-panel-title">
                <div className="space-y-3 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-primary-300 scrollbar-track-slate-100 pr-1" role="group" aria-label="خيارات الفلترة">
                  {/* Quick Filters */}
                  <div className="mb-4 pb-3 border-b-2 border-slate-200 dark:border-slate-700">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
                      <MaterialIcon name="star" className="inline-block ml-1" size="sm" />
                      فلاتر سريعة
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => {
                          setIsActiveFilter('active');
                          setCurrentPage(1);
                        }}
                        variant={isActiveFilter === 'active' ? 'primary' : 'outline'}
                        size="sm"
                        className="text-xs group hover:shadow-md transition-all duration-200"
                        leftIcon={<MaterialIcon name="check_circle" className="transition-transform duration-200 group-hover:scale-110" size="sm" />}
                      >
                        نشط فقط
                      </Button>
                      <Button
                        onClick={() => {
                          setIsActiveFilter('inactive');
                          setCurrentPage(1);
                        }}
                        variant={isActiveFilter === 'inactive' ? 'primary' : 'outline'}
                        size="sm"
                        className="text-xs group hover:shadow-md transition-all duration-200"
                        leftIcon={<MaterialIcon name="cancel" className="transition-transform duration-200 group-hover:scale-110" size="sm" />}
                      >
                        غير نشط
                      </Button>
                      <Button
                        onClick={() => {
                          setMinValue('');
                          setMaxValue('');
                          setMinPurchaseValue('');
                          setMaxPurchaseValue('');
                          setMinCurrentValue('');
                          setMaxCurrentValue('');
                          setCurrentPage(1);
                        }}
                        variant="outline"
                        size="sm"
                        className="text-xs group hover:shadow-md transition-all duration-200"
                        leftIcon={<MaterialIcon name="attach_money" className="transition-transform duration-200 group-hover:scale-110" size="sm" />}
                        title="مسح جميع قيم الفلاتر"
                      >
                        مسح القيم
                      </Button>
                    </div>
                  </div>

                  {/* البحث العام */}
                  <div className="mb-4 pb-3 border-b-2 border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                        <MaterialIcon name="search" className="text-primary-500 dark:text-primary-400 flex-shrink-0" size="sm" />
                        <span>البحث السريع</span>
                        <span className="text-xs text-slate-400 dark:text-slate-500 mr-2">(Ctrl+K)</span>
                      </label>
                      <Button
                        onClick={() => setAdvancedSearchOpen(!advancedSearchOpen)}
                        variant="ghost"
                        size="sm"
                        className="text-xs group hover:bg-primary-50 transition-all duration-200"
                        leftIcon={<MaterialIcon name={advancedSearchOpen ? "expand_less" : "expand_more"} className="transition-transform duration-200 group-hover:scale-110" size="sm" />}
                        title={advancedSearchOpen ? "إخفاء البحث المتقدم" : "إظهار البحث المتقدم"}
                      >
                        <span className="hidden sm:inline">بحث متقدم</span>
                      </Button>
                    </div>
                    <div className="relative">
                      <Input
                        type="search"
                        value={searchTerm}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          setSearchTerm(newValue);
                          if (newValue.trim().length >= 2) {
                            setShowSuggestions(true);
                          } else {
                            setShowSuggestions(false);
                          }
                        }}
                        onFocus={() => {
                          if (searchSuggestions.length > 0) setShowSuggestions(true);
                        }}
                        onBlur={() => {
                          // Delay to allow clicking on suggestions
                          setTimeout(() => setShowSuggestions(false), 200);
                        }}
                        placeholder="ابحث في جميع الحقول..."
                        leftIcon={<MaterialIcon name="search" className="text-primary-500 flex-shrink-0" size="sm" />}
                        className="w-full focus:ring-2 focus:ring-primary-500/20 transition-all duration-200"
                        aria-label="البحث السريع في جميع الحقول"
                        aria-autocomplete="list"
                        aria-expanded={showSuggestions}
                        aria-controls="search-suggestions"
                        role="combobox"
                      />
                      {showSuggestions && searchSuggestions.length > 0 && (
                        <div
                          id="search-suggestions"
                          className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border-2 border-primary-200 dark:border-primary-700 rounded-lg shadow-2xl z-50 max-h-60 overflow-y-auto animate-scale-in backdrop-blur-sm"
                          role="listbox"
                          aria-label="اقتراحات البحث"
                        >
                          {searchSuggestions.map((suggestion, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setSearchTerm(suggestion);
                                setShowSuggestions(false);
                              }}
                              className="w-full px-4 py-2 text-right text-sm text-slate-700 dark:text-slate-200 hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:text-primary-700 dark:hover:text-primary-400 transition-all duration-150 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 last:border-b-0 focus:bg-primary-50 dark:focus:bg-primary-900/30 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-600 rounded"
                              role="option"
                              aria-label={`اختر ${suggestion}`}
                            >
                              <MaterialIcon name="search" className="text-primary-500" size="sm" aria-hidden="true" />
                              <span className="flex-1">{suggestion}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {searchTerm && (
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setSearchSuggestions([]);
                          setShowSuggestions(false);
                        }}
                        className="mt-2 text-xs text-primary-600 hover:text-primary-700 hover:bg-primary-50 px-2 py-1 rounded transition-all duration-150 flex items-center gap-1 group"
                      >
                        <MaterialIcon name="close" className="transition-transform duration-200 group-hover:rotate-90" size="sm" />
                        <span>مسح البحث</span>
                      </button>
                    )}

                    {/* Saved Searches */}
                    {searchTerm && searchTerm.length > 2 && (
                      <div className="flex items-center gap-2 mb-2">
                        <Button
                          onClick={() => {
                            const newSearch = {
                              id: `search-${Date.now()}-${Math.random()}`,
                              name: `بحث: ${searchTerm.substring(0, 20)}...`,
                              searchTerm,
                              searchFields: {
                                assetName: Boolean(searchFields.assetName && searchFields.assetName.length > 0),
                                assetTag: Boolean(searchFields.assetTag && searchFields.assetTag.length > 0),
                                serialNumber: Boolean(searchFields.serialNumber && searchFields.serialNumber.length > 0),
                                description: Boolean(searchFields.description && searchFields.description.length > 0),
                              },
                              date: new Date(),
                            };
                            setSavedSearches(prev => {
                              const updated = [newSearch, ...prev].slice(0, 10);
                              localStorage.setItem('reportsSavedSearches', JSON.stringify(updated));
                              return updated;
                            });
                            showSuccess('تم حفظ البحث');
                          }}
                          variant="ghost"
                          size="sm"
                          className="text-xs group hover:shadow-md transition-all duration-200"
                          leftIcon={<MaterialIcon name="bookmark" className="transition-transform duration-200 group-hover:scale-110" size="sm" />}
                          title="حفظ البحث الحالي"
                        >
                          حفظ البحث
                        </Button>
                        {savedSearches.length > 0 && (
                          <Button
                            onClick={() => setShowSavedSearchesModal(true)}
                            variant="outline"
                            size="sm"
                            className="text-xs group hover:shadow-md transition-all duration-200"
                            leftIcon={<MaterialIcon name="history" className="transition-transform duration-200 group-hover:scale-110" size="sm" />}
                            title="عرض البحوث المحفوظة"
                          >
                            البحوث المحفوظة ({savedSearches.length})
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Advanced Search */}
                    {advancedSearchOpen && (
                      <div className="mt-3 p-3 bg-gradient-to-br from-slate-50 to-white dark:from-slate-700 dark:to-slate-800 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm space-y-2 animate-fade-in backdrop-blur-sm">
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-1">
                          <MaterialIcon name="tune" className="text-primary-500 dark:text-primary-400 flex-shrink-0" size="sm" />
                          <span>البحث في حقول محددة:</span>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          <Input
                            type="text"
                            value={searchFields.assetName}
                            onChange={(e) => setSearchFields(prev => ({ ...prev, assetName: e.target.value }))}
                            placeholder="اسم الأصل..."
                            leftIcon={<MaterialIcon name="inventory_2" className="text-primary-500 flex-shrink-0" size="sm" />}
                            className="text-sm focus:ring-2 focus:ring-primary-500/20 transition-all duration-200"
                          />
                          <Input
                            type="text"
                            value={searchFields.assetTag}
                            onChange={(e) => setSearchFields(prev => ({ ...prev, assetTag: e.target.value }))}
                            placeholder="رقم الأصل..."
                            leftIcon={<MaterialIcon name="tag" className="text-primary-500 flex-shrink-0" size="sm" />}
                            className="text-sm focus:ring-2 focus:ring-primary-500/20 transition-all duration-200"
                          />
                          <Input
                            type="text"
                            value={searchFields.serialNumber}
                            onChange={(e) => setSearchFields(prev => ({ ...prev, serialNumber: e.target.value }))}
                            placeholder="الرقم التسلسلي..."
                            leftIcon={<MaterialIcon name="qr_code" className="text-primary-500 flex-shrink-0" size="sm" />}
                            className="text-sm focus:ring-2 focus:ring-primary-500/20 transition-all duration-200"
                          />
                          <Input
                            type="text"
                            value={searchFields.description}
                            onChange={(e) => setSearchFields(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="الوصف..."
                            leftIcon={<MaterialIcon name="description" className="text-primary-500 flex-shrink-0" size="sm" />}
                            className="text-sm focus:ring-2 focus:ring-primary-500/20 transition-all duration-200"
                          />
                        </div>
                        {(searchFields.assetName || searchFields.assetTag || searchFields.serialNumber || searchFields.description) && (
                          <Button
                            onClick={() => {
                              setSearchFields({
                                assetName: '',
                                assetType: '',
                                assetStatus: '',
                                department: '',
                                office: '',
                                custodian: '',
                                assetTag: '',
                                serialNumber: '',
                                description: '',
                              });
                            }}
                            variant="outline"
                            size="sm"
                            fullWidth
                            leftIcon={<MaterialIcon name="close" className="transition-transform duration-200 group-hover:rotate-90" size="sm" />}
                            className="text-xs mt-2 group hover:shadow-md transition-all duration-200"
                            title="مسح جميع حقول البحث"
                          >
                            مسح جميع الحقول
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* فلتر الإدارات */}
                  <AdvancedFilter
                    title="الإدارات"
                    icon="business"
                    options={filterOptions.departments}
                    selectedIds={selectedDepartmentIds}
                    onToggle={(id) => toggleFilter('departments', id)}
                    onSelectAll={() => {
                      filterOptions.departments.forEach(opt => {
                        if (!selectedDepartmentIds.has(opt.id)) {
                          toggleFilter('departments', opt.id);
                        }
                      });
                    }}
                    onDeselectAll={() => {
                      filterOptions.departments.forEach(opt => {
                        if (selectedDepartmentIds.has(opt.id)) {
                          toggleFilter('departments', opt.id);
                        }
                      });
                    }}
                    searchTerm={filterSearchTerms.departments}
                    onSearchChange={(term) => setFilterSearchTerms(prev => ({ ...prev, departments: term }))}
                    isOpen={filterOpenStates.departments}
                    onToggleOpen={() => setFilterOpenStates(prev => ({ ...prev, departments: !prev.departments }))}
                  />

                  {/* فلتر المكاتب */}
                  <AdvancedFilter
                    title="المكاتب"
                    icon="meeting_room"
                    options={filterOptions.offices}
                    selectedIds={selectedOfficeIds}
                    onToggle={(id) => toggleFilter('offices', id)}
                    onSelectAll={() => {
                      filterOptions.offices.forEach(opt => {
                        if (!selectedOfficeIds.has(opt.id)) {
                          toggleFilter('offices', opt.id);
                        }
                      });
                    }}
                    onDeselectAll={() => {
                      filterOptions.offices.forEach(opt => {
                        if (selectedOfficeIds.has(opt.id)) {
                          toggleFilter('offices', opt.id);
                        }
                      });
                    }}
                    searchTerm={filterSearchTerms.offices}
                    onSearchChange={(term) => setFilterSearchTerms(prev => ({ ...prev, offices: term }))}
                    isOpen={filterOpenStates.offices}
                    onToggleOpen={() => setFilterOpenStates(prev => ({ ...prev, offices: !prev.offices }))}
                  />

                  {/* فلتر أنواع الأصول */}
                  <AdvancedFilter
                    title="أنواع الأصول"
                    icon="category"
                    options={filterOptions.assetTypes}
                    selectedIds={selectedAssetTypeIds}
                    onToggle={(id) => toggleFilter('assetTypes', id)}
                    onSelectAll={() => {
                      filterOptions.assetTypes.forEach(opt => {
                        if (!selectedAssetTypeIds.has(opt.id)) {
                          toggleFilter('assetTypes', opt.id);
                        }
                      });
                    }}
                    onDeselectAll={() => {
                      filterOptions.assetTypes.forEach(opt => {
                        if (selectedAssetTypeIds.has(opt.id)) {
                          toggleFilter('assetTypes', opt.id);
                        }
                      });
                    }}
                    searchTerm={filterSearchTerms.assetTypes}
                    onSearchChange={(term) => setFilterSearchTerms(prev => ({ ...prev, assetTypes: term }))}
                    isOpen={filterOpenStates.assetTypes}
                    onToggleOpen={() => setFilterOpenStates(prev => ({ ...prev, assetTypes: !prev.assetTypes }))}
                  />

                  {/* فلتر حالات الأصول */}
                  <AdvancedFilter
                    title="حالات الأصول"
                    icon="info"
                    options={filterOptions.assetStatuses}
                    selectedIds={selectedAssetStatusIds}
                    onToggle={(id) => toggleFilter('assetStatuses', id)}
                    onSelectAll={() => {
                      filterOptions.assetStatuses.forEach(opt => {
                        if (!selectedAssetStatusIds.has(opt.id)) {
                          toggleFilter('assetStatuses', opt.id);
                        }
                      });
                    }}
                    onDeselectAll={() => {
                      filterOptions.assetStatuses.forEach(opt => {
                        if (selectedAssetStatusIds.has(opt.id)) {
                          toggleFilter('assetStatuses', opt.id);
                        }
                      });
                    }}
                    searchTerm={filterSearchTerms.assetStatuses}
                    onSearchChange={(term) => setFilterSearchTerms(prev => ({ ...prev, assetStatuses: term }))}
                    isOpen={filterOpenStates.assetStatuses}
                    onToggleOpen={() => setFilterOpenStates(prev => ({ ...prev, assetStatuses: !prev.assetStatuses }))}
                  />

                  {/* فلتر أسماء الأصول */}
                  <AdvancedFilter
                    title="أسماء الأصول"
                    icon="inventory_2"
                    options={filterOptions.assetNames}
                    selectedIds={selectedAssetNameIds}
                    onToggle={(id) => toggleFilter('assetNames', id)}
                    onSelectAll={() => {
                      filterOptions.assetNames.forEach(opt => {
                        if (!selectedAssetNameIds.has(opt.id)) {
                          toggleFilter('assetNames', opt.id);
                        }
                      });
                    }}
                    onDeselectAll={() => {
                      filterOptions.assetNames.forEach(opt => {
                        if (selectedAssetNameIds.has(opt.id)) {
                          toggleFilter('assetNames', opt.id);
                        }
                      });
                    }}
                    searchTerm={filterSearchTerms.assetNames}
                    onSearchChange={(term) => setFilterSearchTerms(prev => ({ ...prev, assetNames: term }))}
                    isOpen={filterOpenStates.assetNames}
                    onToggleOpen={() => setFilterOpenStates(prev => ({ ...prev, assetNames: !prev.assetNames }))}
                  />

                  {/* فلتر حاملي الأصول */}
                  <AdvancedFilter
                    title="حاملي الأصول"
                    icon="person"
                    options={filterOptions.custodians}
                    selectedIds={selectedCustodianIds}
                    onToggle={(id) => toggleFilter('custodians', id)}
                    onSelectAll={() => {
                      filterOptions.custodians.forEach(opt => {
                        if (!selectedCustodianIds.has(opt.id)) {
                          toggleFilter('custodians', opt.id);
                        }
                      });
                    }}
                    onDeselectAll={() => {
                      filterOptions.custodians.forEach(opt => {
                        if (selectedCustodianIds.has(opt.id)) {
                          toggleFilter('custodians', opt.id);
                        }
                      });
                    }}
                    searchTerm={filterSearchTerms.custodians}
                    onSearchChange={(term) => setFilterSearchTerms(prev => ({ ...prev, custodians: term }))}
                    isOpen={filterOpenStates.custodians}
                    onToggleOpen={() => setFilterOpenStates(prev => ({ ...prev, custodians: !prev.custodians }))}
                  />

                  {/* فلتر القيمة */}
                  <RangeFilter
                    title="القيمة"
                    icon="attach_money"
                    minValue={minValue}
                    maxValue={maxValue}
                    onMinChange={setMinValue}
                    onMaxChange={setMaxValue}
                    isOpen={filterOpenStates.value}
                    onToggleOpen={() => setFilterOpenStates(prev => ({ ...prev, value: !prev.value }))}
                    placeholder={{ min: "من", max: "إلى" }}
                  />

                  {/* فلتر القيمة الشرائية */}
                  <RangeFilter
                    title="القيمة الشرائية"
                    icon="shopping_cart"
                    minValue={minPurchaseValue}
                    maxValue={maxPurchaseValue}
                    onMinChange={setMinPurchaseValue}
                    onMaxChange={setMaxPurchaseValue}
                    isOpen={filterOpenStates.purchaseValue}
                    onToggleOpen={() => setFilterOpenStates(prev => ({ ...prev, purchaseValue: !prev.purchaseValue }))}
                    placeholder={{ min: "من", max: "إلى" }}
                  />

                  {/* فلتر القيمة الحالية */}
                  <RangeFilter
                    title="القيمة الحالية"
                    icon="trending_up"
                    minValue={minCurrentValue}
                    maxValue={maxCurrentValue}
                    onMinChange={setMinCurrentValue}
                    onMaxChange={setMaxCurrentValue}
                    isOpen={filterOpenStates.currentValue}
                    onToggleOpen={() => setFilterOpenStates(prev => ({ ...prev, currentValue: !prev.currentValue }))}
                    placeholder={{ min: "من", max: "إلى" }}
                  />

                  {/* فلتر الحالة النشطة */}
                  <div className="border-2 border-slate-200/60 dark:border-slate-700/60 rounded-xl overflow-hidden bg-white dark:bg-slate-800 shadow-md hover:shadow-xl transition-all duration-300 hover:border-primary-300/50 dark:hover:border-primary-600/50">
                    <button
                      onClick={() => setFilterOpenStates(prev => ({ ...prev, status: !prev.status }))}
                      className="w-full p-3 bg-gradient-to-r from-slate-50 via-slate-100/70 to-slate-50 dark:from-slate-700 dark:via-slate-700/70 dark:to-slate-700 hover:from-primary-50 hover:via-primary-100/50 hover:to-primary-50 dark:hover:from-primary-900/30 dark:hover:via-primary-800/30 dark:hover:to-primary-900/30 transition-all duration-200 flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/50 group-hover:bg-primary-200 dark:group-hover:bg-primary-800 flex items-center justify-center transition-colors">
                          <MaterialIcon
                            name={filterOpenStates.status ? "expand_less" : "expand_more"}
                            className="text-primary-600 dark:text-primary-400"
                            size="sm"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <MaterialIcon name="toggle_on" className="text-slate-500 dark:text-slate-400" size="sm" />
                          <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm">الحالة</span>
                        </div>
                        {isActiveFilter !== 'all' && (
                          <Badge variant="primary" size="sm" className="animate-scale-in text-xs">
                            {isActiveFilter === 'active' ? 'نشط' : 'غير نشط'}
                          </Badge>
                        )}
                      </div>
                    </button>

                    {filterOpenStates.status && (
                      <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 filter-panel-open space-y-2 animate-fade-in">
                        <div
                          className={`p-2.5 rounded-lg transition-all cursor-pointer ${isActiveFilter === 'all'
                              ? 'bg-primary-50 dark:bg-primary-900/40 border-2 border-primary-200 dark:border-primary-700'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 border-2 border-transparent'
                            }`}
                          onClick={() => setIsActiveFilter('all')}
                        >
                          <Checkbox
                            checked={isActiveFilter === 'all'}
                            onChange={() => setIsActiveFilter('all')}
                            label="الكل"
                            className="text-sm"
                          />
                        </div>
                        <div
                          className={`p-2.5 rounded-lg transition-all cursor-pointer ${isActiveFilter === 'active'
                              ? 'bg-primary-50 dark:bg-primary-900/40 border-2 border-primary-200 dark:border-primary-700'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 border-2 border-transparent'
                            }`}
                          onClick={() => setIsActiveFilter('active')}
                        >
                          <Checkbox
                            checked={isActiveFilter === 'active'}
                            onChange={() => setIsActiveFilter('active')}
                            label="نشط فقط"
                            className="text-sm"
                          />
                        </div>
                        <div
                          className={`p-2.5 rounded-lg transition-all cursor-pointer ${isActiveFilter === 'inactive'
                              ? 'bg-primary-50 dark:bg-primary-900/40 border-2 border-primary-200 dark:border-primary-700'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 border-2 border-transparent'
                            }`}
                          onClick={() => setIsActiveFilter('inactive')}
                        >
                          <Checkbox
                            checked={isActiveFilter === 'inactive'}
                            onChange={() => setIsActiveFilter('inactive')}
                            label="غير نشط فقط"
                            className="text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* فلتر تاريخ الشراء */}
                  <div className="border-2 border-slate-200/60 dark:border-slate-700/60 rounded-xl overflow-hidden bg-white dark:bg-slate-800 shadow-md hover:shadow-xl transition-all duration-300 hover:border-primary-300/50 dark:hover:border-primary-600/50">
                    <button
                      onClick={() => setFilterOpenStates(prev => ({ ...prev, dates: !prev.dates }))}
                      className="w-full p-3 bg-gradient-to-r from-slate-50 via-slate-100/70 to-slate-50 dark:from-slate-700 dark:via-slate-700/70 dark:to-slate-700 hover:from-primary-50 hover:via-primary-100/50 hover:to-primary-50 dark:hover:from-primary-900/30 dark:hover:via-primary-800/30 dark:hover:to-primary-900/30 transition-all duration-200 flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/50 group-hover:bg-primary-200 dark:group-hover:bg-primary-800 flex items-center justify-center transition-colors">
                          <MaterialIcon
                            name={filterOpenStates.dates ? "expand_less" : "expand_more"}
                            className="text-primary-600 dark:text-primary-400"
                            size="sm"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <MaterialIcon name="calendar_today" className="text-slate-500 dark:text-slate-400" size="sm" />
                          <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm">تاريخ الشراء</span>
                        </div>
                        {(purchaseDateFrom || purchaseDateTo) && (
                          <Badge variant="primary" size="sm" className="animate-scale-in text-xs">
                            مفعل
                          </Badge>
                        )}
                      </div>
                    </button>

                    {filterOpenStates.dates && (
                      <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 filter-panel-open animate-fade-in">
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
                              <MaterialIcon name="event" className="inline-block ml-1" size="sm" />
                              من تاريخ
                            </label>
                            <Input
                              type="date"
                              value={purchaseDateFrom}
                              onChange={(e) => setPurchaseDateFrom(e.target.value)}
                              leftIcon={<MaterialIcon name="event" size="sm" />}
                              className="w-full"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
                              <MaterialIcon name="event" className="inline-block ml-1" size="sm" />
                              إلى تاريخ
                            </label>
                            <Input
                              type="date"
                              value={purchaseDateTo}
                              onChange={(e) => setPurchaseDateTo(e.target.value)}
                              leftIcon={<MaterialIcon name="event" size="sm" />}
                              className="w-full"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          {(purchaseDateFrom || purchaseDateTo) && (
                            <Button
                              onClick={() => {
                                setPurchaseDateFrom('');
                                setPurchaseDateTo('');
                              }}
                              variant="outline"
                              size="sm"
                              fullWidth
                              leftIcon={<MaterialIcon name="close" size="sm" />}
                              className="text-xs"
                            >
                              مسح التواريخ
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* أزرار التحكم */}
                  <div className="pt-4 mt-4 border-t-2 border-slate-200 dark:border-slate-700 space-y-2 sticky bottom-0 bg-white dark:bg-slate-800 pb-2 z-10">
                    {filteredAssets.length > 0 && (
                      <>
                        <div className="relative" ref={exportButtonRef}>
                          <Button
                            onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                            variant="primary"
                            fullWidth
                            leftIcon={<MaterialIcon name="download" size="sm" />}
                            rightIcon={<MaterialIcon name={exportDropdownOpen ? "expand_less" : "expand_more"} size="sm" />}
                            className="font-semibold shadow-lg"
                          >
                            تصدير ({filteredAssets.length})
                          </Button>
                          {exportDropdownOpen && (
                            <div className="absolute bottom-full left-0 right-0 mb-2 glass-effect rounded-xl shadow-2xl z-50 overflow-hidden animate-scale-in bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                              <button
                                onClick={() => {
                                  setShowExportColumnsModal(true);
                                  setExportDropdownOpen(false);
                                }}
                                className="w-full px-4 py-3 text-right hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:translate-x-[-2px] border-b border-slate-200 dark:border-slate-700"
                              >
                                <MaterialIcon name="settings" className="text-slate-600 dark:text-slate-400" size="sm" />
                                <span>تخصيص الأعمدة</span>
                              </button>
                              <button
                                onClick={exportToCSV}
                                disabled={isExporting}
                                className="w-full px-4 py-3 text-right hover:bg-success-50 dark:hover:bg-success-900/30 transition-all duration-200 flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:translate-x-[-2px] border-t border-slate-200 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isExporting && exportType === 'CSV' ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-success-600 border-t-transparent rounded-full animate-spin" />
                                    <span>جاري التصدير...</span>
                                  </>
                                ) : (
                                  <>
                                    <MaterialIcon name="description" className="text-success-600" size="sm" />
                                    <span>تصدير إلى CSV</span>
                                  </>
                                )}
                              </button>
                              <button
                                onClick={exportToExcel}
                                disabled={isExporting}
                                className="w-full px-4 py-3 text-right hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-all duration-200 flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-200 border-t border-slate-200 dark:border-slate-700 hover:translate-x-[-2px] disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isExporting && exportType === 'Excel' ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-primary-600 dark:border-primary-400 border-t-transparent rounded-full animate-spin" />
                                    <span>جاري التصدير...</span>
                                  </>
                                ) : (
                                  <>
                                    <MaterialIcon name="table_chart" className="text-primary-600 dark:text-primary-400" size="sm" />
                                    <span>تصدير إلى Excel</span>
                                  </>
                                )}
                              </button>
                              <button
                                onClick={exportToPDF}
                                disabled={isExporting}
                                className="w-full px-4 py-3 text-right hover:bg-error-50 dark:hover:bg-error-900/30 transition-all duration-200 flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-200 border-t border-slate-200 dark:border-slate-700 hover:translate-x-[-2px] disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isExporting && exportType === 'PDF' ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-error-600 border-t-transparent rounded-full animate-spin" />
                                    <span>جاري التصدير...</span>
                                  </>
                                ) : (
                                  <>
                                    <MaterialIcon name="picture_as_pdf" className="text-error-600" size="sm" />
                                    <span>تصدير إلى PDF</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                        <Button
                          onClick={handlePrint}
                          variant="outline"
                          fullWidth
                          leftIcon={<MaterialIcon name="print" size="sm" />}
                          className="font-semibold"
                        >
                          طباعة
                        </Button>
                        <Button
                          onClick={copyToClipboard}
                          variant="outline"
                          fullWidth
                          leftIcon={<MaterialIcon name="content_copy" size="sm" />}
                          className="font-semibold"
                          disabled={filteredAssets.length === 0 || isCopying}
                          isLoading={isCopying}
                        >
                          {isCopying ? 'جاري النسخ...' : 'نسخ إلى الحافظة'}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* جدول النتائج */}
          <div className="flex-1 min-w-0 w-full">
            <Card className="shadow-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 w-full">
              <CardHeader
                className="pb-3 border-b-2 border-slate-200 dark:border-slate-700 flex-shrink-0 bg-gradient-to-r from-slate-50 to-white dark:from-slate-700 dark:to-slate-800"
                action={
                  filteredAssets.length > 0 ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* View Mode Toggle */}
                      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                        <Button
                          onClick={() => setViewMode('table')}
                          variant={viewMode === 'table' ? 'primary' : 'ghost'}
                          size="sm"
                          className="px-2 group hover:shadow-md transition-all duration-200"
                          leftIcon={<MaterialIcon name="table_chart" className="transition-transform duration-200 group-hover:scale-110" size="sm" />}
                          title="عرض الجدول"
                        >
                          <span className="hidden sm:inline">جدول</span>
                        </Button>
                        <Button
                          onClick={() => setViewMode('grid')}
                          variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                          size="sm"
                          className="px-2 group hover:shadow-md transition-all duration-200"
                          leftIcon={<MaterialIcon name="dashboard" className="transition-transform duration-200 group-hover:scale-110" size="sm" />}
                          title="عرض الشبكة"
                        >
                          <span className="hidden sm:inline">شبكة</span>
                        </Button>
                      </div>

                      {/* Column Visibility Toggle */}
                      {viewMode === 'table' && (
                        <div className="relative" ref={columnVisibilityRef}>
                          <Button
                            onClick={() => setColumnVisibilityOpen(!columnVisibilityOpen)}
                            variant="outline"
                            size="sm"
                            leftIcon={<MaterialIcon name="visibility" className="transition-transform duration-200 group-hover:scale-110" size="sm" />}
                            rightIcon={<MaterialIcon name={columnVisibilityOpen ? "expand_less" : "expand_more"} className="transition-transform duration-200" size="sm" />}
                            className="group hover:shadow-md transition-all duration-200"
                            title="إظهار/إخفاء الأعمدة"
                          >
                            <span className="hidden sm:inline">الأعمدة</span>
                          </Button>
                          {columnVisibilityOpen && (
                            <div className="absolute top-full left-0 mt-2 glass-effect rounded-xl shadow-2xl z-50 overflow-hidden animate-scale-in min-w-[200px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                              <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
                                {[
                                  { key: 'department', label: 'الإدارة' },
                                  { key: 'office', label: 'المكتب' },
                                  { key: 'assetName', label: 'اسم الأصل' },
                                  { key: 'assetType', label: 'نوع الأصل' },
                                  { key: 'assetStatus', label: 'حالة الأصل' },
                                  { key: 'custodian', label: 'حامل الأصل' },
                                  { key: 'assetTag', label: 'رقم الأصل' },
                                  { key: 'value', label: 'القيمة' },
                                ].map(({ key, label }) => (
                                  <label
                                    key={key}
                                    className="flex items-center gap-2 p-2 hover:bg-primary-50 rounded-lg cursor-pointer transition-colors"
                                  >
                                    <Checkbox
                                      checked={visibleColumns[key as keyof typeof visibleColumns]}
                                      onChange={() => {
                                        setVisibleColumns(prev => ({
                                          ...prev,
                                          [key]: !prev[key as keyof typeof visibleColumns],
                                        }));
                                      }}
                                      label={label}
                                      className="text-sm"
                                    />
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="relative" ref={exportButtonRef}>
                        <Button
                          onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                          variant="outline"
                          size="sm"
                          leftIcon={<MaterialIcon name="download" size="sm" />}
                          rightIcon={<MaterialIcon name={exportDropdownOpen ? "expand_less" : "expand_more"} size="sm" />}
                        >
                          <span className="hidden sm:inline">تصدير</span>
                        </Button>
                        {exportDropdownOpen && (
                          <div className="absolute top-full left-0 mt-2 glass-effect rounded-xl shadow-2xl z-50 overflow-hidden animate-scale-in min-w-[180px]">
                            <button
                              onClick={() => {
                                setShowExportColumnsModal(true);
                                setExportDropdownOpen(false);
                              }}
                              className="w-full px-4 py-3 text-right hover:bg-slate-50 hover:text-primary-700 transition-all duration-200 flex items-center gap-3 text-sm font-medium text-slate-700 hover:translate-x-[-2px] border-b border-slate-200 group"
                            >
                              <MaterialIcon name="settings" className="text-slate-600 group-hover:text-primary-600 transition-colors duration-200" size="sm" />
                              <span>تخصيص الأعمدة</span>
                            </button>
                            {exportHistory.length > 0 && (
                              <button
                                onClick={() => {
                                  setShowExportHistory(true);
                                  setExportDropdownOpen(false);
                                }}
                                className="w-full px-4 py-3 text-right hover:bg-primary-50 hover:text-primary-700 transition-all duration-200 flex items-center gap-3 text-sm font-medium text-slate-700 hover:translate-x-[-2px] border-b border-slate-200 group"
                              >
                                <MaterialIcon name="history" className="text-primary-600 group-hover:scale-110 transition-transform duration-200" size="sm" />
                                <span>سجل التصدير</span>
                                {exportHistory.length > 0 && (
                                  <Badge variant="primary" size="sm" className="mr-auto">
                                    {exportHistory.length}
                                  </Badge>
                                )}
                              </button>
                            )}
                            <button
                              onClick={exportToCSV}
                              disabled={isExporting}
                              className="w-full px-4 py-3 text-right hover:bg-success-50 hover:text-success-700 transition-all duration-200 flex items-center gap-3 text-sm font-medium text-slate-700 hover:translate-x-[-2px] border-t border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                              {isExporting && exportType === 'CSV' ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-success-600 border-t-transparent rounded-full animate-spin" />
                                  <span>جاري التصدير...</span>
                                </>
                              ) : (
                                <>
                                  <MaterialIcon name="description" className="text-success-600 group-hover:scale-110 transition-transform duration-200" size="sm" />
                                  <span>CSV</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={exportToExcel}
                              disabled={isExporting}
                              className="w-full px-4 py-3 text-right hover:bg-primary-50 hover:text-primary-700 transition-all duration-200 flex items-center gap-3 text-sm font-medium text-slate-700 border-t border-slate-200 hover:translate-x-[-2px] disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                              {isExporting && exportType === 'Excel' ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                                  <span>جاري التصدير...</span>
                                </>
                              ) : (
                                <>
                                  <MaterialIcon name="table_chart" className="text-primary-600 group-hover:scale-110 transition-transform duration-200" size="sm" />
                                  <span>Excel</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={exportToPDF}
                              disabled={isExporting}
                              className="w-full px-4 py-3 text-right hover:bg-error-50 transition-all duration-200 flex items-center gap-3 text-sm font-medium text-slate-700 border-t border-slate-200 hover:translate-x-[-2px] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isExporting && exportType === 'PDF' ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-error-600 border-t-transparent rounded-full animate-spin" />
                                  <span>جاري التصدير...</span>
                                </>
                              ) : (
                                <>
                                  <MaterialIcon name="picture_as_pdf" className="text-error-600" size="sm" />
                                  <span>PDF</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                      <Button
                        onClick={handlePrint}
                        variant="outline"
                        size="sm"
                        leftIcon={<MaterialIcon name="print" className="transition-transform duration-200 group-hover:scale-110" size="sm" />}
                        className="group hover:shadow-md transition-all duration-200"
                        title="طباعة التقرير"
                      >
                        <span className="hidden sm:inline">طباعة</span>
                      </Button>
                      <Button
                        onClick={copyToClipboard}
                        variant="outline"
                        size="sm"
                        leftIcon={<MaterialIcon name="content_copy" className="transition-transform duration-200 group-hover:scale-110" size="sm" />}
                        disabled={filteredAssets.length === 0 || isCopying}
                        isLoading={isCopying}
                        className="disabled:opacity-50 group hover:shadow-md transition-all duration-200"
                        title="نسخ البيانات إلى الحافظة"
                      >
                        <span className="hidden sm:inline">{isCopying ? 'جاري النسخ...' : 'نسخ'}</span>
                      </Button>
                      {selectedRowsCount > 0 && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-primary-100 to-primary-50 rounded-lg border-2 border-primary-300 shadow-md animate-fade-in backdrop-blur-sm">
                          <Badge variant="primary" size="sm" className="font-bold shadow-sm">
                            {selectedRowsCount}
                          </Badge>
                          <span className="text-xs font-semibold text-primary-700 hidden sm:inline">{selectedRowsCount === 1 ? 'عنصر محدد' : 'عناصر محددة'}</span>
                          <div className="flex items-center gap-1 mr-2 border-r border-primary-300 pr-2">
                            <Button
                              onClick={() => {
                                if (!selectedAssetsSummary) {
                                  showError('لا توجد بيانات محددة للنسخ');
                                  return;
                                }
                                navigator.clipboard.writeText(selectedAssetsSummary.summary).then(() => {
                                  showSuccess(`تم نسخ ${selectedAssetsSummary.count} أصل محدد إلى الحافظة`);
                                }).catch(() => {
                                  showError('فشل نسخ البيانات');
                                });
                              }}
                              variant="outline"
                              size="sm"
                              className="text-xs group hover:shadow-md transition-all duration-200"
                              leftIcon={<MaterialIcon name="content_copy" className="transition-transform duration-200 group-hover:scale-110" size="sm" />}
                              title="نسخ المحدد"
                              disabled={!selectedAssetsSummary || selectedAssetsSummary.count === 0}
                            >
                              <span className="hidden sm:inline">نسخ</span>
                            </Button>
                          </div>
                          <Button
                            onClick={() => {
                              setSelectedRows(new Set());
                              setSelectAllMode(false);
                              setLastSelectedIndex(null);
                            }}
                            variant="ghost"
                            size="sm"
                            className="text-xs p-1 group hover:bg-error-50 hover:text-error-600 transition-all duration-200"
                            leftIcon={<MaterialIcon name="close" className="transition-transform duration-200 group-hover:rotate-90" size="sm" />}
                            aria-label="إلغاء التحديد"
                            title="إلغاء تحديد جميع العناصر"
                          />
                        </div>
                      )}
                    </div>
                  ) : undefined
                }
              >
                <div className="flex items-center justify-between w-full flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <MaterialIcon name="table_chart" className="text-primary-600" size="sm" />
                    <span className="text-base font-semibold text-slate-800 dark:text-slate-200" id="results-count" aria-live="polite" aria-atomic="true">
                      النتائج ({filteredAssets.length.toLocaleString('ar-SA')})
                    </span>
                    {filteredAssets.length > itemsPerPage && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        (صفحة {currentPage} من {totalPages})
                      </span>
                    )}
                  </div>
                  {filteredAssets.length > 0 && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-slate-600 font-medium">عدد العناصر:</label>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                        className="text-xs border border-slate-300 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={250}>250</option>
                        <option value={500}>500</option>
                        <option value={1000}>1000</option>
                      </select>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardBody className="p-4">
                {filteredAssets.length === 0 ? (
                  <div className="text-center py-16 animate-fade-in">
                    <div className="relative inline-block mb-6">
                      <div className="absolute inset-0 bg-primary-100 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                      <MaterialIcon name="filter_alt_off" className="text-slate-400 mx-auto relative z-10" size="5xl" />
                    </div>
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shadow-lg">
                        <MaterialIcon name="search_off" className="text-slate-500" size="2xl" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-700">لا توجد نتائج</h3>
                    </div>
                    <p className="text-slate-500 mb-6 text-center">جرب تغيير الفلاتر أو البحث</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <Button
                        onClick={resetFilters}
                        variant="outline"
                        leftIcon={<MaterialIcon name="refresh" className="transition-transform duration-200 group-hover:rotate-180" size="sm" />}
                        className="transition-all hover:scale-105 group hover:shadow-md"
                        title="إعادة تعيين جميع الفلاتر"
                      >
                        إعادة تعيين الفلاتر
                      </Button>
                      <Button
                        onClick={() => {
                          setSearchTerm('');
                          setCurrentPage(1);
                        }}
                        variant="outline"
                        leftIcon={<MaterialIcon name="search" className="transition-transform duration-200 group-hover:scale-110" size="sm" />}
                        className="transition-all hover:scale-105 group hover:shadow-md"
                        title="مسح البحث"
                      >
                        مسح البحث
                      </Button>
                    </div>
                    <div className="mt-6 p-4 bg-gradient-to-br from-slate-50 to-white rounded-lg max-w-md mx-auto border border-slate-200 shadow-sm">
                      <p className="text-sm text-slate-600 mb-2 font-semibold flex items-center gap-2">
                        <MaterialIcon name="lightbulb" className="text-warning-500 flex-shrink-0" size="sm" />
                        <span>اقتراحات:</span>
                      </p>
                      <ul className="text-xs text-slate-500 text-right space-y-1.5">
                        <li className="flex items-center gap-2 justify-end">
                          <MaterialIcon name="check_circle" className="text-success-500 flex-shrink-0" size="sm" />
                          <span>تأكد من أن الفلاتر المحددة صحيحة</span>
                        </li>
                        <li className="flex items-center gap-2 justify-end">
                          <MaterialIcon name="check_circle" className="text-success-500 flex-shrink-0" size="sm" />
                          <span>جرب البحث بكلمات مختلفة</span>
                        </li>
                        <li className="flex items-center gap-2 justify-end">
                          <MaterialIcon name="check_circle" className="text-success-500 flex-shrink-0" size="sm" />
                          <span>أزل بعض الفلاتر لتوسيع النتائج</span>
                        </li>
                        <li className="flex items-center gap-2 justify-end">
                          <MaterialIcon name="check_circle" className="text-success-500 flex-shrink-0" size="sm" />
                          <span>تحقق من نطاق القيم المحدد</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                ) : viewMode === 'grid' ? (
                  <div className="w-full">
                    {/* Grid View - Select All */}
                    {sortedAndPaginatedAssets.length > 0 && (
                      <div className="mb-4 p-3 bg-gradient-to-r from-slate-50 to-white rounded-lg border border-slate-200 shadow-sm flex items-center justify-between backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={allCurrentPageSelected}
                            onChange={handleSelectAllToggle}
                            label={allCurrentPageSelected ? "إلغاء تحديد الكل" : "تحديد الكل"}
                            className="text-sm font-medium"
                            title="تحديد جميع العناصر في هذه الصفحة"
                          />
                          {selectedRowsCount > 0 && (
                            <Badge variant="primary" size="sm" className="font-bold shadow-sm">
                              {selectedRowsCount} {selectedRowsCount === 1 ? 'محدد' : 'محدد'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    {/* Grid View */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" role="grid" aria-label="عرض الشبكة للأصول">
                      {sortedAndPaginatedAssets.map((assetDetail, idx) => {
                        const globalIndex = (currentPage - 1) * itemsPerPage + idx;
                        const isSelected = selectedRows.has(globalIndex);
                        return (
                          <Card
                            key={idx}
                            className={`hover:shadow-xl hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-300 ease-out hover:scale-[1.02] active:scale-[0.98] border-2 ${isSelected ? 'border-primary-400 dark:border-primary-600 bg-primary-50/50 dark:bg-primary-900/30 shadow-md' : 'border-slate-200/60 dark:border-slate-700/60'
                              } bg-gradient-to-br from-white to-slate-50/30 dark:from-slate-800 dark:to-slate-700/30 cursor-pointer`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleRowToggle(globalIndex, idx, e);
                            }}
                          >
                            <CardBody padding="md">
                              <div className="space-y-3">
                                <div className="flex items-start justify-between border-b-2 border-primary-200/50 dark:border-primary-700/50 pb-2">
                                  <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate mb-1 hover:text-primary-700 dark:hover:text-primary-400 transition-colors duration-150">{assetDetail.assetName}</h3>
                                    <Badge variant="outline" size="sm" className="text-xs transition-all duration-150 hover:scale-105">
                                      {assetDetail.assetStatus}
                                    </Badge>
                                  </div>
                                  <div className="text-left flex-shrink-0 mr-2">
                                    <div className="text-base font-black text-success-600 dark:text-success-400 drop-shadow-sm">
                                      {assetDetail.value.toLocaleString('ar-SA')}
                                    </div>
                                    <div className="text-xs text-success-600 dark:text-success-400 opacity-80">ريال</div>
                                  </div>
                                </div>
                                <div className="space-y-1.5 text-xs">
                                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-150">
                                    <MaterialIcon name="business" className="text-primary-500 dark:text-primary-400 flex-shrink-0" size="sm" />
                                    <span className="truncate">{assetDetail.departmentName}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-150">
                                    <MaterialIcon name="meeting_room" className="text-primary-500 dark:text-primary-400 flex-shrink-0" size="sm" />
                                    <span className="truncate">{assetDetail.officeName}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-150">
                                    <MaterialIcon name="category" className="text-primary-500 dark:text-primary-400 flex-shrink-0" size="sm" />
                                    <span className="truncate">{assetDetail.assetType}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-150">
                                    <MaterialIcon name="person" className="text-primary-500 dark:text-primary-400 flex-shrink-0" size="sm" />
                                    <span className="truncate">{assetDetail.custodianName}</span>
                                  </div>
                                </div>
                              </div>
                            </CardBody>
                          </Card>
                        );
                      })}
                    </div>

                    {/* Grid View Pagination */}
                    {filteredAssets.length > itemsPerPage && (
                      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <span>
                            عرض {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredAssets.length)} من {filteredAssets.length.toLocaleString('ar-SA')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handlePageChange(1)}
                            variant="outline"
                            size="sm"
                            disabled={currentPage === 1}
                            className="disabled:opacity-50 group hover:shadow-md transition-all duration-200"
                            title="الصفحة الأولى"
                          >
                            <MaterialIcon name="arrow_back" className="transition-transform duration-200 group-hover:-translate-x-1" size="sm" />
                          </Button>
                          <Button
                            onClick={() => handlePageChange(currentPage - 1)}
                            variant="outline"
                            size="sm"
                            disabled={currentPage === 1}
                            className="disabled:opacity-50 group hover:shadow-md transition-all duration-200"
                            title="الصفحة السابقة"
                          >
                            <MaterialIcon name="chevron_right" className="transition-transform duration-200 group-hover:translate-x-1" size="sm" />
                          </Button>
                          <div className="flex items-center gap-1">
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
                                <Button
                                  key={pageNum}
                                  onClick={() => handlePageChange(pageNum)}
                                  variant={currentPage === pageNum ? "primary" : "outline"}
                                  size="sm"
                                  className="min-w-[40px]"
                                >
                                  {pageNum}
                                </Button>
                              );
                            })}
                          </div>
                          <Button
                            onClick={() => handlePageChange(currentPage + 1)}
                            variant="outline"
                            size="sm"
                            disabled={currentPage === totalPages}
                            className="disabled:opacity-50 group hover:shadow-md transition-all duration-200"
                            title="الصفحة التالية"
                          >
                            <MaterialIcon name="chevron_left" className="transition-transform duration-200 group-hover:-translate-x-1" size="sm" />
                          </Button>
                          <Button
                            onClick={() => handlePageChange(totalPages)}
                            variant="outline"
                            size="sm"
                            disabled={currentPage === totalPages}
                            className="disabled:opacity-50 group hover:shadow-md transition-all duration-200"
                            title="الصفحة الأخيرة"
                          >
                            <MaterialIcon name="arrow_forward" className="transition-transform duration-200 group-hover:translate-x-1" size="sm" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full">
                    {/* Mobile/Tablet Card View - Select All */}
                    {sortedAndPaginatedAssets.length > 0 && (
                      <div className="mb-4 p-3 bg-gradient-to-r from-slate-50 to-white dark:from-slate-700 dark:to-slate-800 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm flex items-center justify-between backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={allCurrentPageSelected}
                            onChange={handleSelectAllToggle}
                            label={allCurrentPageSelected ? "إلغاء تحديد الكل" : "تحديد الكل"}
                            className="text-sm font-medium"
                            title="تحديد جميع العناصر في هذه الصفحة"
                          />
                          {selectedRowsCount > 0 && (
                            <Badge variant="primary" size="sm" className="font-bold shadow-sm">
                              {selectedRowsCount} {selectedRowsCount === 1 ? 'محدد' : 'محدد'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    {/* Mobile/Tablet Card View */}
                    <div className="lg:hidden space-y-3 mb-4">
                      {sortedAndPaginatedAssets.map((assetDetail, idx) => {
                        const globalIndex = (currentPage - 1) * itemsPerPage + idx;
                        const isSelected = selectedRows.has(globalIndex);
                        return (
                          <Card
                            key={idx}
                            className={`hover:shadow-xl hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-300 ease-out hover:scale-[1.01] active:scale-[0.99] border-2 ${isSelected ? 'border-primary-400 dark:border-primary-600 bg-primary-50/50 dark:bg-primary-900/30 shadow-md' : 'border-slate-200/60 dark:border-slate-700/60'
                              } bg-gradient-to-br from-white to-slate-50/30 dark:from-slate-800 dark:to-slate-700/30 cursor-pointer`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleRowToggle(globalIndex, idx, e);
                            }}
                          >
                            <CardBody padding="md">
                              <div className="space-y-3">
                                <div className="flex items-start justify-between border-b-2 border-primary-200/50 dark:border-primary-700/50 pb-2">
                                  <div className="flex items-start gap-2 flex-1 min-w-0">
                                    <Checkbox
                                      checked={isSelected}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        handleRowToggle(globalIndex, idx, e as any);
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                      }}
                                      className="mt-1 flex-shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1 truncate hover:text-primary-700 dark:hover:text-primary-400 transition-colors duration-150">{assetDetail.assetName}</h3>
                                      <Badge variant="outline" size="sm" className="text-xs transition-all duration-150 hover:scale-105">
                                        {assetDetail.assetStatus}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div className="text-left flex-shrink-0 mr-2">
                                    <div className="text-lg font-black text-success-600 dark:text-success-400 drop-shadow-sm">
                                      {assetDetail.value.toLocaleString('ar-SA')}
                                    </div>
                                    <div className="text-xs text-success-600 dark:text-success-400 opacity-80">ريال</div>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 gap-2 text-sm">
                                  {visibleColumns.department && (
                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-150">
                                      <MaterialIcon name="business" className="text-primary-500 dark:text-primary-400 flex-shrink-0" size="sm" />
                                      <span className="truncate">{assetDetail.departmentName}</span>
                                    </div>
                                  )}
                                  {visibleColumns.office && (
                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-150">
                                      <MaterialIcon name="meeting_room" className="text-primary-500 dark:text-primary-400 flex-shrink-0" size="sm" />
                                      <span className="truncate">{assetDetail.officeName}</span>
                                    </div>
                                  )}
                                  {visibleColumns.assetType && (
                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-150">
                                      <MaterialIcon name="category" className="text-primary-500 dark:text-primary-400 flex-shrink-0" size="sm" />
                                      <span className="truncate">{assetDetail.assetType}</span>
                                    </div>
                                  )}
                                  {visibleColumns.custodian && (
                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-150">
                                      <MaterialIcon name="person" className="text-primary-500 dark:text-primary-400 flex-shrink-0" size="sm" />
                                      <span className="truncate">{assetDetail.custodianName}</span>
                                    </div>
                                  )}
                                  {visibleColumns.assetTag && (
                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-150">
                                      <MaterialIcon name="tag" className="text-primary-500 dark:text-primary-400 flex-shrink-0" size="sm" />
                                      <span className="truncate font-mono text-xs">
                                        {assetDetail.asset.get('asset_tag') || '-'}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardBody>
                          </Card>
                        );
                      })}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden lg:block w-full overflow-x-auto reports-table-wrapper rounded-lg border-2 border-slate-200 dark:border-slate-700 shadow-md bg-white dark:bg-slate-800">
                      <table className="w-full text-sm border-collapse" role="table" aria-label="جدول الأصول المفلترة">
                        <thead>
                          <tr className="bg-gradient-to-r from-primary-50 via-slate-50 to-primary-50 dark:from-primary-900/30 dark:via-slate-700 dark:to-primary-900/30 border-b-2 border-primary-200 dark:border-primary-700 shadow-sm" role="row">
                            <th className="p-2 border-l border-slate-200 dark:border-slate-600 sticky right-0 bg-inherit z-10" role="columnheader" scope="col">
                              <Checkbox
                                checked={allCurrentPageSelected}
                                onChange={handleSelectAllToggle}
                                aria-label="تحديد جميع العناصر في هذه الصفحة"
                                aria-describedby="select-all-help"
                                onClick={(e) => e.stopPropagation()}
                                title="تحديد جميع العناصر في هذه الصفحة (Shift+Click لتحديد نطاق، Ctrl+Click لتحديد متعدد)"
                              />
                              <span id="select-all-help" className="sr-only">
                                استخدم Shift+Click لتحديد نطاق، Ctrl+Click لتحديد متعدد
                              </span>
                            </th>
                            {visibleColumns.department && (
                              <th className="text-right p-4 font-bold text-slate-800 dark:text-slate-200 text-xs whitespace-nowrap border-l border-slate-200 dark:border-slate-600 first:border-l-0 min-w-[140px] sticky right-0 bg-inherit" role="columnheader" scope="col">
                                <button
                                  onClick={() => handleSort('department')}
                                  className="flex items-center gap-2 justify-end w-full hover:opacity-80 hover:bg-primary-50/50 dark:hover:bg-primary-900/30 active:bg-primary-100/50 dark:active:bg-primary-800/30 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-600 rounded px-2 py-1"
                                  aria-label={`ترتيب حسب الإدارة ${sortColumn === 'department' ? (sortDirection === 'asc' ? 'تصاعدي' : 'تنازلي') : ''}`}
                                  aria-sort={sortColumn === 'department' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                                >
                                  <MaterialIcon 
                                    name="business" 
                                    className="text-primary-600 flex-shrink-0 transition-colors duration-200" 
                                    size="sm" 
                                  />
                                  <span className="font-semibold">الإدارة</span>
                                  {sortColumn === 'department' && (
                                    <MaterialIcon
                                      name={sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                                      className="text-primary-600 flex-shrink-0 animate-fade-in"
                                      size="sm"
                                    />
                                  )}
                                </button>
                              </th>
                            )}
                            {visibleColumns.office && (
                              <th className="text-right p-4 font-bold text-slate-800 dark:text-slate-200 text-xs whitespace-nowrap border-l border-slate-200 dark:border-slate-600 min-w-[140px]">
                                <button
                                  onClick={() => handleSort('office')}
                                  className="flex items-center gap-2 justify-end w-full hover:opacity-70 transition-opacity"
                                >
                                  <MaterialIcon name="meeting_room" className="text-primary-600 dark:text-primary-400" size="sm" />
                                  <span>المكتب</span>
                                  {sortColumn === 'office' && (
                                    <MaterialIcon
                                      name={sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                                      className="text-primary-600 dark:text-primary-400"
                                      size="sm"
                                    />
                                  )}
                                </button>
                              </th>
                            )}
                            {visibleColumns.assetName && (
                              <th className="text-right p-4 font-bold text-slate-800 dark:text-slate-200 text-xs whitespace-nowrap border-l border-slate-200 dark:border-slate-600 min-w-[180px]">
                                <button
                                  onClick={() => handleSort('assetName')}
                                  className="flex items-center gap-2 justify-end w-full hover:opacity-70 transition-opacity"
                                >
                                  <MaterialIcon name="inventory_2" className="text-primary-600 dark:text-primary-400" size="sm" />
                                  <span>اسم الأصل</span>
                                  {sortColumn === 'assetName' && (
                                    <MaterialIcon
                                      name={sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                                      className="text-primary-600 dark:text-primary-400"
                                      size="sm"
                                    />
                                  )}
                                </button>
                              </th>
                            )}
                            {visibleColumns.assetType && (
                              <th className="text-right p-4 font-bold text-slate-800 dark:text-slate-200 text-xs whitespace-nowrap border-l border-slate-200 dark:border-slate-600 min-w-[140px]">
                                <button
                                  onClick={() => handleSort('assetType')}
                                  className="flex items-center gap-2 justify-end w-full hover:opacity-70 transition-opacity"
                                >
                                  <MaterialIcon name="category" className="text-primary-600 dark:text-primary-400" size="sm" />
                                  <span>نوع الأصل</span>
                                  {sortColumn === 'assetType' && (
                                    <MaterialIcon
                                      name={sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                                      className="text-primary-600 dark:text-primary-400"
                                      size="sm"
                                    />
                                  )}
                                </button>
                              </th>
                            )}
                            {visibleColumns.assetStatus && (
                              <th className="text-right p-4 font-bold text-slate-800 dark:text-slate-200 text-xs whitespace-nowrap border-l border-slate-200 dark:border-slate-600 min-w-[140px]">
                                <button
                                  onClick={() => handleSort('assetStatus')}
                                  className="flex items-center gap-2 justify-end w-full hover:opacity-70 transition-opacity"
                                >
                                  <MaterialIcon name="info" className="text-primary-600" size="sm" />
                                  <span>حالة الأصل</span>
                                  {sortColumn === 'assetStatus' && (
                                    <MaterialIcon
                                      name={sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                                      className="text-primary-600"
                                      size="sm"
                                    />
                                  )}
                                </button>
                              </th>
                            )}
                            {visibleColumns.custodian && (
                              <th className="text-right p-4 font-bold text-slate-800 text-xs whitespace-nowrap border-l border-slate-200 min-w-[140px]">
                                <button
                                  onClick={() => handleSort('custodian')}
                                  className="flex items-center gap-2 justify-end w-full hover:opacity-70 transition-opacity"
                                >
                                  <MaterialIcon name="person" className="text-primary-600" size="sm" />
                                  <span>حامل الأصل</span>
                                  {sortColumn === 'custodian' && (
                                    <MaterialIcon
                                      name={sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                                      className="text-primary-600"
                                      size="sm"
                                    />
                                  )}
                                </button>
                              </th>
                            )}
                            {visibleColumns.assetTag && (
                              <th className="text-right p-4 font-bold text-slate-800 text-xs whitespace-nowrap border-l border-slate-200 min-w-[120px]">
                                <div className="flex items-center gap-2 justify-end">
                                  <MaterialIcon name="tag" className="text-primary-600" size="sm" />
                                  <span>رقم الأصل</span>
                                </div>
                              </th>
                            )}
                            {visibleColumns.value && (
                              <th className="text-right p-4 font-bold text-slate-800 text-xs whitespace-nowrap border-l border-slate-200 min-w-[140px] sticky left-0 bg-inherit z-10 shadow-lg">
                                <button
                                  onClick={() => handleSort('value')}
                                  className="flex items-center gap-2 justify-end w-full hover:opacity-70 transition-opacity"
                                >
                                  <MaterialIcon name="attach_money" className="text-primary-600" size="sm" />
                                  <span>القيمة</span>
                                  {sortColumn === 'value' && (
                                    <MaterialIcon
                                      name={sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                                      className="text-primary-600"
                                      size="sm"
                                    />
                                  )}
                                </button>
                              </th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {sortedAndPaginatedAssets.map((assetDetail, idx) => {
                            const globalIndex = (currentPage - 1) * itemsPerPage + idx;
                            const isSelected = selectedRows.has(globalIndex);
                            return (
                              <tr
                                key={idx}
                                className={`border-b border-slate-200 dark:border-slate-700 hover:bg-primary-50/50 dark:hover:bg-primary-900/30 hover:shadow-sm transition-all duration-200 ease-in-out cursor-pointer ${idx % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/30 dark:bg-slate-700/30'
                                  } ${isSelected ? 'bg-primary-100 dark:bg-primary-900/50 border-primary-300 dark:border-primary-700 shadow-sm' : ''}`}
                                role="row"
                                aria-rowindex={idx + 1}
                                aria-selected={isSelected}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleRowToggle(globalIndex, idx, e);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleRowToggle(globalIndex, idx, e);
                                  }
                                }}
                                tabIndex={0}
                              >
                                <td className="p-2 border-l border-slate-200 dark:border-slate-600 sticky right-0 bg-inherit z-10" onClick={(e) => e.stopPropagation()} role="gridcell">
                                  <Checkbox
                                    checked={isSelected}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      handleRowToggle(globalIndex, idx, e as any);
                                    }}
                                    aria-label={`تحديد ${assetDetail.assetName}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                    }}
                                  />
                                </td>
                                {visibleColumns.department && (
                                  <td className="p-4 text-slate-700 dark:text-slate-200 text-sm border-l border-slate-200 dark:border-slate-600 hover:text-slate-900 dark:hover:text-slate-100 transition-colors duration-150" role="gridcell" aria-label={`الإدارة: ${assetDetail.departmentName}`}>
                                    <div className="flex items-center gap-2">
                                      <MaterialIcon name="business" className="text-primary-500 dark:text-primary-400 flex-shrink-0 opacity-60" size="sm" />
                                      <span className="truncate block max-w-[160px]" title={assetDetail.departmentName}>
                                        {assetDetail.departmentName}
                                      </span>
                                    </div>
                                  </td>
                                )}
                                {visibleColumns.office && (
                                  <td className="p-4 text-slate-700 dark:text-slate-200 text-sm border-l border-slate-200 dark:border-slate-600 hover:text-slate-900 dark:hover:text-slate-100 transition-colors duration-150">
                                    <div className="flex items-center gap-2">
                                      <MaterialIcon name="meeting_room" className="text-primary-500 dark:text-primary-400 flex-shrink-0 opacity-60" size="sm" />
                                      <span className="truncate block max-w-[160px]" title={assetDetail.officeName}>
                                        {assetDetail.officeName}
                                      </span>
                                    </div>
                                  </td>
                                )}
                                {visibleColumns.assetName && (
                                  <td className="p-4 text-slate-900 dark:text-slate-100 font-bold text-sm border-l border-slate-200 dark:border-slate-600 hover:text-primary-700 dark:hover:text-primary-400 transition-colors duration-150">
                                    <div className="flex items-center gap-2">
                                      <MaterialIcon name="inventory_2" className="text-primary-500 dark:text-primary-400 flex-shrink-0" size="sm" />
                                      <span className="truncate block max-w-[220px]" title={assetDetail.assetName}>
                                        {assetDetail.assetName}
                                      </span>
                                    </div>
                                  </td>
                                )}
                                {visibleColumns.assetType && (
                                  <td className="p-4 text-slate-700 dark:text-slate-200 text-sm border-l border-slate-200 dark:border-slate-600 hover:text-slate-900 dark:hover:text-slate-100 transition-colors duration-150">
                                    <div className="flex items-center gap-2">
                                      <MaterialIcon name="category" className="text-primary-500 dark:text-primary-400 flex-shrink-0 opacity-60" size="sm" />
                                      <span className="truncate block max-w-[160px]" title={assetDetail.assetType}>
                                        {assetDetail.assetType}
                                      </span>
                                    </div>
                                  </td>
                                )}
                                {visibleColumns.assetStatus && (
                                  <td className="p-4 border-l border-slate-200 dark:border-slate-600">
                                    <Badge variant="outline" size="sm" className="whitespace-nowrap font-semibold transition-all duration-150 hover:scale-105">
                                      {assetDetail.assetStatus}
                                    </Badge>
                                  </td>
                                )}
                                {visibleColumns.custodian && (
                                  <td className="p-4 text-slate-700 dark:text-slate-200 text-sm border-l border-slate-200 dark:border-slate-600 hover:text-slate-900 dark:hover:text-slate-100 transition-colors duration-150">
                                    <div className="flex items-center gap-2">
                                      <MaterialIcon name="person" className="text-primary-500 dark:text-primary-400 flex-shrink-0 opacity-60" size="sm" />
                                      <span className="truncate block max-w-[160px]" title={assetDetail.custodianName}>
                                        {assetDetail.custodianName}
                                      </span>
                                    </div>
                                  </td>
                                )}
                                {visibleColumns.assetTag && (
                                  <td className="p-4 text-slate-600 dark:text-slate-300 font-mono text-xs border-l border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-700/30">
                                    <div className="flex items-center gap-1">
                                      <MaterialIcon name="tag" className="text-slate-400 dark:text-slate-500" size="sm" />
                                      <span className="truncate block max-w-[120px]" title={assetDetail.asset.get('asset_tag') || '-'}>
                                        {assetDetail.asset.get('asset_tag') || '-'}
                                      </span>
                                    </div>
                                  </td>
                                )}
                                {visibleColumns.value && (
                                  <td className="p-4 text-slate-900 dark:text-slate-100 font-bold text-sm border-l border-slate-200 dark:border-slate-600 text-right sticky left-0 bg-inherit z-10 shadow-lg">
                                    <div className="flex items-center gap-1 justify-end whitespace-nowrap">
                                      <MaterialIcon name="attach_money" className="text-success-600 dark:text-success-400" size="sm" />
                                      <span className="text-success-700 dark:text-success-400">{assetDetail.value.toLocaleString('ar-SA')}</span>
                                      <span className="text-slate-500 dark:text-slate-400 text-xs">ريال</span>
                                    </div>
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="bg-gradient-to-r from-primary-100 via-slate-100 to-primary-100 border-t-2 border-primary-300 font-bold shadow-md">
                            <td
                              colSpan={Object.values(visibleColumns).filter(v => v).length - (visibleColumns.value ? 1 : 0)}
                              className="p-4 text-right text-slate-900 text-sm border-l border-slate-200"
                            >
                              <div className="flex items-center gap-2 justify-end">
                                <MaterialIcon name="calculate" className="text-primary-600 flex-shrink-0 transition-transform duration-200" size="sm" />
                                <span className="font-bold">الإجمالي:</span>
                              </div>
                            </td>
                            {visibleColumns.value && (
                              <td className="p-4 text-slate-900 text-lg border-l border-slate-200 text-right sticky left-0 bg-inherit z-10 shadow-lg">
                                <div className="flex items-center gap-1 justify-end">
                                  <MaterialIcon name="attach_money" className="text-success-600 flex-shrink-0 transition-transform duration-200" size="md" />
                                  <span className="text-success-700 font-black drop-shadow-sm">{totalFilteredValue.toLocaleString('ar-SA')}</span>
                                  <span className="text-slate-600 text-sm font-semibold">ريال</span>
                                </div>
                              </td>
                            )}
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Pagination Controls */}
                    {filteredAssets.length > itemsPerPage && (
                      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gradient-to-r from-slate-50 to-white rounded-lg border border-slate-200 shadow-sm backdrop-blur-sm">
                        <div className="flex items-center gap-2 text-sm text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                          <MaterialIcon name="info" className="text-primary-500 flex-shrink-0" size="sm" />
                          <span className="font-medium">
                            عرض {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredAssets.length)} من {filteredAssets.length.toLocaleString('ar-SA')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handlePageChange(1)}
                            variant="outline"
                            size="sm"
                            disabled={currentPage === 1}
                            leftIcon={<MaterialIcon name="arrow_back" size="sm" />}
                            className="disabled:opacity-50"
                          >
                            <span className="hidden sm:inline">الأولى</span>
                          </Button>
                          <Button
                            onClick={() => handlePageChange(currentPage - 1)}
                            variant="outline"
                            size="sm"
                            disabled={currentPage === 1}
                            leftIcon={<MaterialIcon name="chevron_right" size="sm" />}
                            className="disabled:opacity-50"
                          >
                            <span className="hidden sm:inline">السابقة</span>
                          </Button>
                          <div className="flex items-center gap-1">
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
                                <Button
                                  key={pageNum}
                                  onClick={() => handlePageChange(pageNum)}
                                  variant={currentPage === pageNum ? "primary" : "outline"}
                                  size="sm"
                                  className="min-w-[40px]"
                                >
                                  {pageNum}
                                </Button>
                              );
                            })}
                          </div>
                          <Button
                            onClick={() => handlePageChange(currentPage + 1)}
                            variant="outline"
                            size="sm"
                            disabled={currentPage === totalPages}
                            rightIcon={<MaterialIcon name="chevron_left" size="sm" />}
                            className="disabled:opacity-50"
                          >
                            <span className="hidden sm:inline">التالية</span>
                          </Button>
                          <Button
                            onClick={() => handlePageChange(totalPages)}
                            variant="outline"
                            size="sm"
                            disabled={currentPage === totalPages}
                            rightIcon={<MaterialIcon name="arrow_forward" size="sm" />}
                            className="disabled:opacity-50"
                          >
                            <span className="hidden sm:inline">الأخيرة</span>
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Mobile/Tablet Card View */}
                    <div className="lg:hidden space-y-3">
                      {sortedAndPaginatedAssets.map((assetDetail, idx) => (
                        <Card
                          key={idx}
                          className="hover:shadow-xl transition-all duration-300 hover:scale-[1.01] border-2 border-slate-200/60 bg-gradient-to-br from-white to-slate-50/30 animate-fade-in"
                        >
                          <CardBody padding="md">
                            <div className="space-y-3">
                              {/* Header with Asset Name */}
                              <div className="flex items-start justify-between border-b-2 border-primary-200/50 pb-3 mb-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <MaterialIcon name="inventory_2" className="text-primary-500 flex-shrink-0" size="md" />
                                    <h3 className="text-base font-bold text-slate-900 truncate">{assetDetail.assetName}</h3>
                                  </div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Badge variant="outline" size="sm" className="font-semibold">
                                      {assetDetail.assetStatus}
                                    </Badge>
                                    <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-1 rounded">
                                      {assetDetail.asset.get('asset_tag') || '-'}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-left flex-shrink-0 mr-2">
                                  <div className="text-lg font-black bg-gradient-to-r from-success-500 to-success-600 bg-clip-text text-transparent">
                                    {assetDetail.value.toLocaleString('ar-SA')}
                                  </div>
                                  <div className="text-xs text-success-600 font-semibold">ريال</div>
                                </div>
                              </div>

                              {/* Details Grid */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div className="flex items-center gap-2 p-2.5 bg-slate-50/50 rounded-lg">
                                  <MaterialIcon name="business" className="text-primary-500 flex-shrink-0" size="sm" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-slate-500 mb-1">الإدارة</p>
                                    <p className="text-sm font-semibold text-slate-800 truncate" title={assetDetail.departmentName}>
                                      {assetDetail.departmentName}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 p-2.5 bg-slate-50/50 rounded-lg">
                                  <MaterialIcon name="meeting_room" className="text-primary-500 flex-shrink-0" size="sm" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-slate-500 mb-1">المكتب</p>
                                    <p className="text-sm font-semibold text-slate-800 truncate" title={assetDetail.officeName}>
                                      {assetDetail.officeName}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 p-2.5 bg-slate-50/50 rounded-lg">
                                  <MaterialIcon name="category" className="text-primary-500 flex-shrink-0" size="sm" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-slate-500 mb-1">نوع الأصل</p>
                                    <p className="text-sm font-semibold text-slate-800 truncate" title={assetDetail.assetType}>
                                      {assetDetail.assetType}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 p-2.5 bg-slate-50/50 rounded-lg">
                                  <MaterialIcon name="person" className="text-primary-500 flex-shrink-0" size="sm" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-slate-500 mb-1">حامل الأصل</p>
                                    <p className="text-sm font-semibold text-slate-800 truncate" title={assetDetail.custodianName}>
                                      {assetDetail.custodianName}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Additional Info */}
                              {(assetDetail.asset.get('serial_number') || assetDetail.asset.get('description')) && (
                                <div className="pt-3 border-t border-slate-200 space-y-2">
                                  {assetDetail.asset.get('serial_number') && (
                                    <div className="flex items-center gap-2 text-xs text-slate-600">
                                      <MaterialIcon name="tag" className="text-slate-400" size="sm" />
                                      <span className="font-mono">الرقم التسلسلي: {assetDetail.asset.get('serial_number')}</span>
                                    </div>
                                  )}
                                  {assetDetail.asset.get('description') && (
                                    <div className="text-xs text-slate-600 line-clamp-2">
                                      {assetDetail.asset.get('description')}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </CardBody>
                        </Card>
                      ))}

                      {/* Mobile Footer Summary */}
                      <Card className="bg-gradient-to-r from-primary-100 via-primary-200/50 to-primary-100 border-2 border-primary-300 shadow-lg">
                        <CardBody padding="lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <MaterialIcon name="calculate" className="text-primary-700 transition-transform duration-200" size="lg" />
                              <span className="text-lg font-bold text-slate-900">الإجمالي:</span>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-black bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent drop-shadow-sm">
                                {totalFilteredValue.toLocaleString('ar-SA')}
                              </div>
                              <div className="text-sm text-primary-700 font-bold">ريال</div>
                            </div>
                          </div>
                        </CardBody>
                      </Card>

                      {/* Mobile Pagination */}
                      {filteredAssets.length > itemsPerPage && (
                        <div className="mt-4 flex flex-col items-center gap-3 p-4 bg-gradient-to-r from-slate-50 to-white rounded-lg border border-slate-200 shadow-sm backdrop-blur-sm">
                          <div className="text-sm text-slate-600 text-center bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2 justify-center">
                            <MaterialIcon name="info" className="text-primary-500 flex-shrink-0" size="sm" />
                            <span className="font-medium">
                              عرض {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredAssets.length)} من {filteredAssets.length.toLocaleString('ar-SA')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap justify-center">
                            <Button
                              onClick={() => handlePageChange(1)}
                              variant="outline"
                              size="sm"
                              disabled={currentPage === 1}
                              className="disabled:opacity-50 group hover:shadow-md transition-all duration-200"
                              title="الصفحة الأولى"
                            >
                              <MaterialIcon name="arrow_back" className="transition-transform duration-200 group-hover:-translate-x-1" size="sm" />
                            </Button>
                            <Button
                              onClick={() => handlePageChange(currentPage - 1)}
                              variant="outline"
                              size="sm"
                              disabled={currentPage === 1}
                              className="disabled:opacity-50 group hover:shadow-md transition-all duration-200"
                              title="الصفحة السابقة"
                            >
                              <MaterialIcon name="chevron_right" className="transition-transform duration-200 group-hover:translate-x-1" size="sm" />
                            </Button>
                            <div className="flex items-center gap-1">
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
                                  <Button
                                    key={pageNum}
                                    onClick={() => handlePageChange(pageNum)}
                                    variant={currentPage === pageNum ? "primary" : "outline"}
                                    size="sm"
                                    className="min-w-[36px] group hover:shadow-md transition-all duration-200"
                                    title={`الصفحة ${pageNum}`}
                                  >
                                    {pageNum}
                                  </Button>
                                );
                              })}
                            </div>
                            <Button
                              onClick={() => handlePageChange(currentPage + 1)}
                              variant="outline"
                              size="sm"
                              disabled={currentPage === totalPages}
                              className="disabled:opacity-50 group hover:shadow-md transition-all duration-200"
                              title="الصفحة التالية"
                            >
                              <MaterialIcon name="chevron_left" className="transition-transform duration-200 group-hover:-translate-x-1" size="sm" />
                            </Button>
                            <Button
                              onClick={() => handlePageChange(totalPages)}
                              variant="outline"
                              size="sm"
                              disabled={currentPage === totalPages}
                              className="disabled:opacity-50 group hover:shadow-md transition-all duration-200"
                              title="الصفحة الأخيرة"
                            >
                              <MaterialIcon name="arrow_forward" className="transition-transform duration-200 group-hover:translate-x-1" size="sm" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>

        {/* Export Columns Modal */}
        {showExportColumnsModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowExportColumnsModal(false)}>
            <Card
              className="w-full max-w-md bg-white shadow-2xl animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader className="border-b-2 border-slate-200 bg-gradient-to-r from-primary-50 to-slate-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MaterialIcon name="settings" className="text-primary-600" size="md" />
                    <span className="text-lg font-bold text-slate-800">تخصيص أعمدة التصدير</span>
                  </div>
                  <Button
                    onClick={() => setShowExportColumnsModal(false)}
                    variant="ghost"
                    size="sm"
                    leftIcon={<MaterialIcon name="close" size="sm" />}
                  />
                </div>
              </CardHeader>
              <CardBody className="p-4">
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {[
                    { key: 'department', label: 'الإدارة' },
                    { key: 'office', label: 'المكتب' },
                    { key: 'assetName', label: 'اسم الأصل' },
                    { key: 'assetType', label: 'نوع الأصل' },
                    { key: 'assetStatus', label: 'حالة الأصل' },
                    { key: 'custodian', label: 'حامل الأصل' },
                    { key: 'assetTag', label: 'رقم الأصل' },
                    { key: 'serialNumber', label: 'الرقم التسلسلي' },
                    { key: 'value', label: 'القيمة' },
                    { key: 'purchaseValue', label: 'القيمة الشرائية' },
                    { key: 'currentValue', label: 'القيمة الحالية' },
                    { key: 'purchaseDate', label: 'تاريخ الشراء' },
                    { key: 'lastMaintenanceDate', label: 'تاريخ آخر صيانة' },
                    { key: 'description', label: 'الوصف' },
                    { key: 'notes', label: 'ملاحظات' },
                  ].map(({ key, label }) => (
                    <label
                      key={key}
                      className="flex items-center gap-2 p-2 hover:bg-primary-50 rounded-lg cursor-pointer transition-colors"
                    >
                      <Checkbox
                        checked={exportColumns[key as keyof typeof exportColumns]}
                        onChange={() => {
                          setExportColumns(prev => ({
                            ...prev,
                            [key]: !prev[key as keyof typeof exportColumns],
                          }));
                        }}
                        label={label}
                        className="text-sm"
                      />
                    </label>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-200">
                  <Button
                    onClick={() => {
                      setExportColumns({
                        department: true,
                        office: true,
                        assetName: true,
                        assetType: true,
                        assetStatus: true,
                        custodian: true,
                        assetTag: true,
                        serialNumber: true,
                        value: true,
                        purchaseValue: true,
                        currentValue: true,
                        purchaseDate: true,
                        lastMaintenanceDate: true,
                        description: true,
                        notes: true,
                      });
                    }}
                    variant="outline"
                    size="sm"
                    fullWidth
                    leftIcon={<MaterialIcon name="check_box" size="sm" />}
                  >
                    تحديد الكل
                  </Button>
                  <Button
                    onClick={() => {
                      setExportColumns({
                        department: false,
                        office: false,
                        assetName: false,
                        assetType: false,
                        assetStatus: false,
                        custodian: false,
                        assetTag: false,
                        serialNumber: false,
                        value: false,
                        purchaseValue: false,
                        currentValue: false,
                        purchaseDate: false,
                        lastMaintenanceDate: false,
                        description: false,
                        notes: false,
                      });
                    }}
                    variant="outline"
                    size="sm"
                    fullWidth
                    leftIcon={<MaterialIcon name="check_box_outline_blank" size="sm" />}
                  >
                    إلغاء الكل
                  </Button>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Button
                    onClick={() => setShowExportColumnsModal(false)}
                    variant="primary"
                    fullWidth
                    leftIcon={<MaterialIcon name="check" size="sm" />}
                  >
                    حفظ
                  </Button>
                  <Button
                    onClick={() => setShowExportColumnsModal(false)}
                    variant="outline"
                    fullWidth
                    leftIcon={<MaterialIcon name="close" size="sm" />}
                  >
                    إلغاء
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Saved Searches Modal */}
        {showSavedSearchesModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowSavedSearchesModal(false)}>
            <Card
              className="w-full max-w-lg bg-white shadow-2xl animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader className="border-b-2 border-slate-200 bg-gradient-to-r from-primary-50 to-slate-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MaterialIcon name="bookmark" className="text-primary-600" size="md" />
                    <span className="text-lg font-bold text-slate-800">البحوث المحفوظة</span>
                  </div>
                  <Button
                    onClick={() => setShowSavedSearchesModal(false)}
                    variant="ghost"
                    size="sm"
                    leftIcon={<MaterialIcon name="close" size="sm" />}
                  />
                </div>
              </CardHeader>
              <CardBody className="p-4">
                {savedSearches.length === 0 ? (
                  <div className="text-center py-8">
                    <MaterialIcon name="bookmark_border" className="text-slate-400 mx-auto mb-3" size="3xl" />
                    <p className="text-slate-600">لا توجد بحوث محفوظة</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {savedSearches.map((search) => (
                      <div
                        key={search.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-slate-800 truncate">{search.name}</div>
                          <div className="text-xs text-slate-600 truncate">{search.searchTerm}</div>
                          <div className="text-xs text-slate-500 mt-1">
                            {search.date.toLocaleDateString('ar-SA', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mr-2">
                          <Button
                            onClick={() => {
                              setSearchTerm(search.searchTerm);
                              // Apply saved search fields - convert boolean to string for searchFields state
                              if (search.searchFields && typeof search.searchFields === 'object') {
                                setSearchFields(prev => ({
                                  ...prev,
                                  assetName: search.searchFields.assetName ? (prev.assetName || search.searchTerm) : '',
                                  assetTag: search.searchFields.assetTag ? (prev.assetTag || search.searchTerm) : '',
                                  serialNumber: search.searchFields.serialNumber ? (prev.serialNumber || search.searchTerm) : '',
                                  description: search.searchFields.description ? (prev.description || search.searchTerm) : '',
                                }));
                              }
                              setShowSavedSearchesModal(false);
                              showSuccess('تم تطبيق البحث المحفوظ');
                            }}
                            variant="primary"
                            size="sm"
                            className="text-xs"
                            leftIcon={<MaterialIcon name="search" size="sm" />}
                          >
                            تطبيق
                          </Button>
                          <Button
                            onClick={() => {
                              setSavedSearches(prev => {
                                const updated = prev.filter(s => s.id !== search.id);
                                localStorage.setItem('reportsSavedSearches', JSON.stringify(updated));
                                return updated;
                              });
                              showSuccess('تم حذف البحث');
                            }}
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                            leftIcon={<MaterialIcon name="delete" size="sm" />}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        )}

        {/* Export History Modal */}
        {showExportHistory && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowExportHistory(false)}>
            <Card
              className="w-full max-w-lg bg-white shadow-2xl animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader className="border-b-2 border-slate-200 bg-gradient-to-r from-primary-50 to-slate-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MaterialIcon name="history" className="text-primary-600" size="md" />
                    <span className="text-lg font-bold text-slate-800">سجل التصدير</span>
                  </div>
                  <Button
                    onClick={() => setShowExportHistory(false)}
                    variant="ghost"
                    size="sm"
                    leftIcon={<MaterialIcon name="close" size="sm" />}
                  />
                </div>
              </CardHeader>
              <CardBody className="p-4">
                {exportHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <MaterialIcon name="history" className="text-slate-400 mx-auto mb-3" size="3xl" />
                    <p className="text-slate-600">لا يوجد سجل تصدير</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {exportHistory.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${entry.type === 'CSV' ? 'bg-success-100' :
                              entry.type === 'Excel' ? 'bg-primary-100' :
                                'bg-error-100'
                            }`}>
                            <MaterialIcon
                              name={
                                entry.type === 'CSV' ? 'description' :
                                  entry.type === 'Excel' ? 'table_chart' :
                                    'picture_as_pdf'
                              }
                              className={
                                entry.type === 'CSV' ? 'text-success-600' :
                                  entry.type === 'Excel' ? 'text-primary-600' :
                                    'text-error-600'
                              }
                              size="sm"
                            />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">{entry.type}</div>
                            <div className="text-xs text-slate-600">
                              {entry.count.toLocaleString('ar-SA')} أصل • {entry.columns} عمود
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-slate-500 text-left">
                          {entry.date.toLocaleDateString('ar-SA', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {exportHistory.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <Button
                      onClick={() => {
                        setExportHistory([]);
                        localStorage.removeItem('reportsExportHistory');
                        showInfo('تم مسح سجل التصدير');
                      }}
                      variant="outline"
                      fullWidth
                      leftIcon={<MaterialIcon name="delete" size="sm" />}
                    >
                      مسح السجل
                    </Button>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default function ReportsPage() {
  return (
    <ProtectedRoute>
      <ReportsPageContent />
    </ProtectedRoute>
  );
}
