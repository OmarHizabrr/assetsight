'use client';

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MaterialIcon } from "@/components/icons/MaterialIcon";
import { MainLayout } from "@/components/layout/MainLayout";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { BaseModel } from "@/lib/BaseModel";
import { firestoreApi } from "@/lib/FirestoreApi";
import { PdfSettingsService } from "@/lib/services/PdfSettingsService";
import { getBothDates } from "@/lib/utils/hijriDate";
import { useEffect, useMemo, useRef, useState } from "react";
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

function AdvancedFilter({
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

  const allSelected = filteredOptions.length > 0 && filteredOptions.every(opt => selectedIds.has(opt.id));

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
      <button
        onClick={onToggleOpen}
        className="w-full p-4 bg-gradient-to-r from-slate-50 to-slate-100/50 hover:from-slate-100 hover:to-slate-200/50 transition-all flex items-center justify-between group"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-100 group-hover:bg-primary-200 flex items-center justify-center transition-colors">
            <MaterialIcon
              name={isOpen ? "expand_less" : "expand_more"}
              className="text-primary-600"
              size="md"
            />
          </div>
          <div className="flex items-center gap-2">
            {icon && (
              <MaterialIcon name={icon} className="text-slate-500" size="sm" />
            )}
            <span className="font-semibold text-slate-700">{title}</span>
          </div>
          {selectedIds.size > 0 && (
            <Badge variant="primary" size="sm" className="animate-scale-in">
              {selectedIds.size}
            </Badge>
          )}
        </div>
        <span className="text-xs text-slate-500 font-medium bg-white px-2 py-1 rounded-md">
          {filteredOptions.length}
        </span>
      </button>

      {isOpen && (
        <div className="p-4 border-t border-slate-200 bg-white filter-panel-open">
          {/* البحث */}
          <div className="mb-4">
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ابحث..."
              leftIcon={<MaterialIcon name="search" size="sm" />}
              className="w-full"
            />
          </div>

          {/* اختيار الكل / إلغاء الكل */}
          <div className="mb-3 pb-3 border-b border-slate-200">
            <Checkbox
              checked={allSelected}
              onChange={() => {
                if (allSelected) {
                  filteredOptions.forEach(opt => {
                    if (selectedIds.has(opt.id)) {
                      onToggle(opt.id);
                    }
                  });
                } else {
                  filteredOptions.forEach(opt => {
                    if (!selectedIds.has(opt.id)) {
                      onToggle(opt.id);
                    }
                  });
                }
              }}
              label={allSelected ? "إلغاء اختيار الكل" : "اختيار الكل"}
              className="font-semibold text-slate-700"
            />
          </div>

          {/* قائمة الخيارات */}
          <div className="max-h-64 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-primary-200 scrollbar-track-slate-100">
            {filteredOptions.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">لا توجد نتائج</p>
            ) : (
              filteredOptions.map((option) => (
                <div 
                  key={option.id} 
                  className="flex items-center justify-between p-2.5 hover:bg-primary-50 rounded-lg transition-all duration-200 cursor-pointer group hover:shadow-sm hover:scale-[1.02]"
                  onClick={() => onToggle(option.id)}
                >
                  <Checkbox
                    checked={selectedIds.has(option.id)}
                    onChange={() => onToggle(option.id)}
                    label={option.label}
                    className="flex-1"
                  />
                  <Badge variant="outline" size="sm" className="group-hover:bg-primary-100 group-hover:scale-110 transition-all duration-200">
                    {option.count}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

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
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
      <button
        onClick={onToggleOpen}
        className="w-full p-4 bg-gradient-to-r from-slate-50 to-slate-100/50 hover:from-slate-100 hover:to-slate-200/50 transition-all flex items-center justify-between group"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-100 group-hover:bg-primary-200 flex items-center justify-center transition-colors">
            <MaterialIcon
              name={isOpen ? "expand_less" : "expand_more"}
              className="text-primary-600"
              size="md"
            />
          </div>
          <div className="flex items-center gap-2">
            {icon && (
              <MaterialIcon name={icon} className="text-slate-500" size="sm" />
            )}
            <span className="font-semibold text-slate-700">{title}</span>
          </div>
          {(minValue || maxValue) && (
            <Badge variant="primary" size="sm" className="animate-scale-in">
              مفعل
            </Badge>
          )}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 border-t border-slate-200 bg-white filter-panel-open">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">{placeholder.min}</label>
              <Input
                type="number"
                value={minValue}
                onChange={(e) => onMinChange(e.target.value)}
                placeholder={placeholder.min}
                leftIcon={<MaterialIcon name="arrow_downward" size="sm" />}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">{placeholder.max}</label>
              <Input
                type="number"
                value={maxValue}
                onChange={(e) => onMaxChange(e.target.value)}
                placeholder={placeholder.max}
                leftIcon={<MaterialIcon name="arrow_upward" size="sm" />}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ReportsPageContent() {
  const [loading, setLoading] = useState(true);
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

  // البيانات المعروضة
  const [allAssetDetails, setAllAssetDetails] = useState<AssetDetail[]>([]);
  
  // حالة قائمة التصدير
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const exportButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      
      // جلب جميع البيانات بشكل متوازي
      const [
        assetDocs,
        deptDocs,
        statusDocs,
        assetNameDocs,
        assetTypeDocs,
        userDocs,
      ] = await Promise.all([
        firestoreApi.getDocuments(firestoreApi.getCollection("assets")),
        firestoreApi.getDocuments(firestoreApi.getCollection("departments")),
        firestoreApi.getDocuments(firestoreApi.getCollection("assetStatuses")),
        firestoreApi.getDocuments(firestoreApi.getCollection("assetNames")),
        firestoreApi.getDocuments(firestoreApi.getCollection("assetTypes")),
        firestoreApi.getDocuments(firestoreApi.getCollection("users")),
      ]);

      const assets = BaseModel.fromFirestoreArray(assetDocs);
      const departments = BaseModel.fromFirestoreArray(deptDocs);
      const statusesData = BaseModel.fromFirestoreArray(statusDocs);
      const assetNamesData = BaseModel.fromFirestoreArray(assetNameDocs);
      const assetTypesData = BaseModel.fromFirestoreArray(assetTypeDocs);
      const usersData = BaseModel.fromFirestoreArray(userDocs);

      setAllAssets(assets);
      setAllDepartments(departments);
      setStatuses(statusesData);
      setAssetNames(assetNamesData);
      setAssetTypes(assetTypesData);
      setUsers(usersData);

      // جلب جميع المكاتب
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

      // حساب الإحصائيات
      const totalAssets = assets.length;
      const totalValue = assets.reduce((sum, asset) => {
        const currentValue = asset.getValue<number>('current_value') || 0;
        const purchaseValue = asset.getValue<number>('purchase_value') || 0;
        return sum + (currentValue || purchaseValue);
      }, 0);
      const activeAssets = assets.filter(a => {
        const isActive = a.getValue<number>('is_active') === 1 || a.getValue<boolean>('is_active') === true;
        return isActive;
      }).length;

      setStats({
        totalAssets,
        totalValue,
        activeAssets,
        departments: departments.length,
        offices: officesList.length,
      });

      // بناء تفاصيل الأصول
      buildAssetDetails(assets, departments, officesList, statusesData, assetNamesData, assetTypesData, usersData);
    } catch (error) {
      console.error("Error loading reports:", error);
    } finally {
      setLoading(false);
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

  // حساب خيارات الفلاتر مع عدد الأصول لكل خيار
  const filterOptions = useMemo(() => {
    const departmentCounts = new Map<string, number>();
    const officeCounts = new Map<string, number>();
    const assetTypeCounts = new Map<string, number>();
    const assetStatusCounts = new Map<string, number>();
    const assetNameCounts = new Map<string, number>();
    const custodianCounts = new Map<string, number>();

    allAssetDetails.forEach(detail => {
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

    return {
      departments: allDepartments
        .map(dept => ({
          id: dept.get('id') || '',
          label: dept.get('name') || 'غير محدد',
          count: departmentCounts.get(dept.get('id') || '') || 0,
        }))
        .filter(opt => opt.count > 0)
        .sort((a, b) => b.count - a.count),
      offices: allOffices
        .map(office => ({
          id: office.get('id') || '',
          label: office.get('name') || 'غير محدد',
          count: officeCounts.get(office.get('id') || '') || 0,
        }))
        .filter(opt => opt.count > 0)
        .sort((a, b) => b.count - a.count),
      assetTypes: assetTypes
        .map(type => ({
          id: type.get('id') || '',
          label: type.get('name') || 'غير محدد',
          count: assetTypeCounts.get(type.get('id') || '') || 0,
        }))
        .filter(opt => opt.count > 0)
        .sort((a, b) => b.count - a.count),
      assetStatuses: statuses
        .map(status => ({
          id: status.get('id') || '',
          label: status.get('name') || 'غير محدد',
          count: assetStatusCounts.get(status.get('id') || '') || 0,
        }))
        .filter(opt => opt.count > 0)
        .sort((a, b) => b.count - a.count),
      assetNames: assetNames
        .map(name => ({
          id: name.get('id') || '',
          label: name.get('name') || 'غير محدد',
          count: assetNameCounts.get(name.get('id') || '') || 0,
        }))
        .filter(opt => opt.count > 0)
        .sort((a, b) => b.count - a.count),
      custodians: users
        .map(user => ({
          id: user.get('id') || '',
          label: user.get('full_name') || user.get('username') || 'غير محدد',
          count: custodianCounts.get(user.get('id') || '') || 0,
        }))
        .filter(opt => opt.count > 0)
        .sort((a, b) => b.count - a.count),
    };
  }, [allAssetDetails, allDepartments, allOffices, assetTypes, statuses, assetNames, users]);

  // تطبيق الفلاتر على البيانات
  const filteredAssets = useMemo(() => {
    let filtered = allAssetDetails;

    // فلتر الإدارات
    if (selectedDepartmentIds.size > 0) {
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

    // فلتر المكاتب
    if (selectedOfficeIds.size > 0) {
      filtered = filtered.filter(detail => {
        const officeId = allOffices.find(o => o.get('name') === detail.officeName)?.get('id');
        return officeId && selectedOfficeIds.has(officeId);
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

  const toggleFilter = (filterType: string, id: string) => {
    switch (filterType) {
      case 'departments':
        setSelectedDepartmentIds(prev => {
          const newSet = new Set(prev);
          if (newSet.has(id)) {
            newSet.delete(id);
          } else {
            newSet.add(id);
          }
          return newSet;
        });
        break;
      case 'offices':
        setSelectedOfficeIds(prev => {
          const newSet = new Set(prev);
          if (newSet.has(id)) {
            newSet.delete(id);
          } else {
            newSet.add(id);
          }
          return newSet;
        });
        break;
      case 'assetTypes':
        setSelectedAssetTypeIds(prev => {
          const newSet = new Set(prev);
          if (newSet.has(id)) {
            newSet.delete(id);
          } else {
            newSet.add(id);
          }
          return newSet;
        });
        break;
      case 'assetStatuses':
        setSelectedAssetStatusIds(prev => {
          const newSet = new Set(prev);
          if (newSet.has(id)) {
            newSet.delete(id);
          } else {
            newSet.add(id);
          }
          return newSet;
        });
        break;
      case 'assetNames':
        setSelectedAssetNameIds(prev => {
          const newSet = new Set(prev);
          if (newSet.has(id)) {
            newSet.delete(id);
          } else {
            newSet.add(id);
          }
          return newSet;
        });
        break;
      case 'custodians':
        setSelectedCustodianIds(prev => {
          const newSet = new Set(prev);
          if (newSet.has(id)) {
            newSet.delete(id);
          } else {
            newSet.add(id);
          }
          return newSet;
        });
        break;
    }
  };

  const resetFilters = () => {
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
  };

  const exportToCSV = () => {
    if (filteredAssets.length === 0) return;

    const headers = [
      'الإدارة',
      'المكتب',
      'اسم الأصل',
      'نوع الأصل',
      'حالة الأصل',
      'حامل الأصل',
      'رقم الأصل',
      'الرقم التسلسلي',
      'القيمة',
      'القيمة الشرائية',
      'القيمة الحالية',
      'تاريخ الشراء',
      'تاريخ آخر صيانة',
      'الوصف',
      'ملاحظات'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredAssets.map(assetDetail => {
        const asset = assetDetail.asset;
        return [
          `"${assetDetail.departmentName}"`,
          `"${assetDetail.officeName}"`,
          `"${assetDetail.assetName}"`,
          `"${assetDetail.assetType}"`,
          `"${assetDetail.assetStatus}"`,
          `"${assetDetail.custodianName}"`,
          `"${asset.get('asset_tag') || ''}"`,
          `"${asset.get('serial_number') || ''}"`,
          assetDetail.value,
          assetDetail.purchaseValue,
          assetDetail.currentValue,
          `"${asset.get('purchase_date') || ''}"`,
          `"${asset.get('last_maintenance_date') || ''}"`,
          `"${(asset.get('description') || '').replace(/"/g, '""')}"`,
          `"${(asset.get('notes') || '').replace(/"/g, '""')}"`
        ].join(',');
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
  };

  const exportToExcel = () => {
    if (filteredAssets.length === 0) return;

    const data = filteredAssets.map(assetDetail => {
      const asset = assetDetail.asset;
      return {
        'الإدارة': assetDetail.departmentName,
        'المكتب': assetDetail.officeName,
        'اسم الأصل': assetDetail.assetName,
        'نوع الأصل': assetDetail.assetType,
        'حالة الأصل': assetDetail.assetStatus,
        'حامل الأصل': assetDetail.custodianName,
        'رقم الأصل': asset.get('asset_tag') || '',
        'الرقم التسلسلي': asset.get('serial_number') || '',
        'القيمة': assetDetail.value,
        'القيمة الشرائية': assetDetail.purchaseValue,
        'القيمة الحالية': assetDetail.currentValue,
        'تاريخ الشراء': asset.get('purchase_date') || '',
        'تاريخ آخر صيانة': asset.get('last_maintenance_date') || '',
        'الوصف': asset.get('description') || '',
        'ملاحظات': asset.get('notes') || '',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'الأصول');
    XLSX.writeFile(workbook, `تقرير_الأصول_${new Date().toISOString().split('T')[0]}.xlsx`);
    setExportDropdownOpen(false);
  };

  const exportToPDF = () => {
    if (filteredAssets.length === 0) return;

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
                margin: 20mm 15mm 20mm 15mm;
              }
            }
            body {
              font-family: 'Arial', 'Tahoma', sans-serif;
              direction: rtl;
              margin: 0;
              padding: 20px;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 20px;
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
            }
            .header-left {
              text-align: right;
            }
            .header-right {
              text-align: left;
            }
            .logo {
              max-width: 150px;
              max-height: 80px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
              font-size: 12px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: right;
            }
            th {
              background-color: #f2f2f2;
              font-weight: bold;
            }
            .footer {
              margin-top: 30px;
              border-top: 2px solid #333;
              padding-top: 10px;
              text-align: center;
            }
            .summary {
              background-color: #f9f9f9;
              padding: 10px;
              margin: 20px 0;
              border-radius: 5px;
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
  };

  const handlePrint = () => {
    exportToPDF();
  };

  // إغلاق قائمة التصدير عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportButtonRef.current && !exportButtonRef.current.contains(event.target as Node)) {
        setExportDropdownOpen(false);
      }
    };

    if (exportDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [exportDropdownOpen]);

  const totalFilteredValue = useMemo(() => {
    return filteredAssets.reduce((sum, ad) => sum + ad.value, 0);
  }, [filteredAssets]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh] animate-fade-in">
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-100 border-t-primary-600"></div>
              <div className="absolute inset-0 animate-spin rounded-full h-16 w-16 border-4 border-transparent border-r-primary-400" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-slate-700 font-semibold text-lg">جاري تحميل التقارير...</p>
              <p className="text-slate-500 text-sm">يرجى الانتظار</p>
            </div>
            <div className="flex gap-2">
              <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
              <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Page Header */}
      <div className="mb-10 animate-fade-in">
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 flex items-center justify-center shadow-2xl shadow-primary-500/40 relative overflow-hidden group hover:scale-105 material-transition hover:shadow-primary-500/60">
              <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-transparent opacity-0 group-hover:opacity-100 material-transition"></div>
              <MaterialIcon name="assessment" className="text-white relative z-10 group-hover:rotate-12 transition-transform duration-300" size="3xl" />
            </div>
            <div className="flex-1">
              <h1 className="text-5xl font-black bg-gradient-to-r from-slate-900 via-primary-700 to-slate-900 bg-clip-text text-transparent mb-2 animate-fade-in">التقارير والإحصائيات</h1>
              <p className="text-slate-600 text-lg font-semibold animate-fade-in" style={{ animationDelay: '0.1s' }}>نظام فلترة متقدم مثل Excel</p>
            </div>
          </div>
        </div>
      </div>

      {/* إحصائيات عامة */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <Card hover variant="elevated" className="bg-gradient-to-br from-white via-white to-primary-50/30 border-primary-200/40 group hover:scale-[1.02] transition-all duration-300 hover:shadow-2xl hover:shadow-primary-500/20">
          <CardBody padding="lg">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">إجمالي الأصول</p>
                <p className="text-4xl font-black bg-gradient-to-r from-slate-900 via-primary-600 to-slate-700 bg-clip-text text-transparent mb-1 transition-all duration-300 group-hover:scale-110 inline-block">{stats.totalAssets}</p>
                <p className="text-xs text-slate-500 font-medium">أصل مسجل</p>
              </div>
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30 group-hover:shadow-xl group-hover:shadow-primary-500/50 group-hover:scale-110 transition-all duration-300">
                <MaterialIcon name="inventory" className="text-white group-hover:scale-110 transition-transform duration-300" size="3xl" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card hover variant="elevated" className="bg-gradient-to-br from-white via-white to-success-50/30 border-success-200/40 group hover:scale-[1.02] transition-all duration-300 hover:shadow-2xl hover:shadow-success-500/20">
          <CardBody padding="lg">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">القيمة الإجمالية</p>
                <p className="text-4xl font-black bg-gradient-to-r from-slate-900 via-success-600 to-slate-700 bg-clip-text text-transparent mb-1 transition-all duration-300 group-hover:scale-110 inline-block">
                  {stats.totalValue.toLocaleString('ar-SA')}
                </p>
                <p className="text-xs text-slate-500 font-medium">ريال سعودي</p>
              </div>
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-success-500 to-success-700 flex items-center justify-center shadow-lg shadow-success-500/30 group-hover:shadow-xl group-hover:shadow-success-500/50 group-hover:scale-110 transition-all duration-300">
                <MaterialIcon name="attach_money" className="text-white group-hover:scale-110 transition-transform duration-300" size="3xl" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card hover variant="elevated" className="bg-gradient-to-br from-white via-white to-accent-50/30 border-accent-200/40 group hover:scale-[1.02] transition-all duration-300 hover:shadow-2xl hover:shadow-accent-500/20">
          <CardBody padding="lg">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">أصول نشطة</p>
                <p className="text-4xl font-black bg-gradient-to-r from-slate-900 via-accent-600 to-slate-700 bg-clip-text text-transparent mb-1 transition-all duration-300 group-hover:scale-110 inline-block">{stats.activeAssets}</p>
                <p className="text-xs text-slate-500 font-medium">أصل نشط</p>
              </div>
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center shadow-lg shadow-accent-500/30 group-hover:shadow-xl group-hover:shadow-accent-500/50 group-hover:scale-110 transition-all duration-300">
                <MaterialIcon name="check_circle" className="text-white group-hover:scale-110 transition-transform duration-300" size="3xl" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card hover variant="elevated" className="bg-gradient-to-br from-white via-white to-warning-50/30 border-warning-200/40 group hover:scale-[1.02] transition-all duration-300 hover:shadow-2xl hover:shadow-warning-500/20">
          <CardBody padding="lg">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">النتائج المفلترة</p>
                <p className="text-4xl font-black bg-gradient-to-r from-slate-900 via-warning-600 to-slate-700 bg-clip-text text-transparent mb-1 transition-all duration-300 group-hover:scale-110 inline-block">{filteredAssets.length}</p>
                <p className="text-xs text-slate-500 font-medium">من {stats.totalAssets} أصل</p>
              </div>
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-warning-500 to-warning-700 flex items-center justify-center shadow-lg shadow-warning-500/30 group-hover:shadow-xl group-hover:shadow-warning-500/50 group-hover:scale-110 transition-all duration-300">
                <MaterialIcon name="filter_list" className="text-white group-hover:scale-110 transition-transform duration-300" size="3xl" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card hover variant="elevated" className="bg-gradient-to-br from-white via-white to-primary-50/30 border-primary-200/40 group hover:scale-[1.02] transition-all duration-300 hover:shadow-2xl hover:shadow-primary-500/20">
          <CardBody padding="lg">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">قيمة المفلترة</p>
                <p className="text-4xl font-black bg-gradient-to-r from-slate-900 via-primary-600 to-slate-700 bg-clip-text text-transparent mb-1 transition-all duration-300 group-hover:scale-110 inline-block">
                  {totalFilteredValue.toLocaleString('ar-SA')}
                </p>
                <p className="text-xs text-slate-500 font-medium">ريال سعودي</p>
              </div>
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30 group-hover:shadow-xl group-hover:shadow-primary-500/50 group-hover:scale-110 transition-all duration-300">
                <MaterialIcon name="calculate" className="text-white group-hover:scale-110 transition-transform duration-300" size="3xl" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* لوحة الفلاتر */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6 shadow-xl border-2 border-slate-200/50 bg-gradient-to-br from-white to-slate-50/30">
            <CardHeader>
              <div className="flex items-center gap-2">
                <MaterialIcon name="tune" className="text-primary-600" size="md" />
                <span className="text-xl font-bold text-slate-800">الفلاتر المتقدمة</span>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto scrollbar-thin scrollbar-thumb-primary-300 scrollbar-track-slate-100 pr-2 hover:scrollbar-thumb-primary-400 transition-colors">
                {/* البحث العام */}
                <div className="bg-gradient-to-r from-primary-50 via-primary-100/70 to-primary-50 p-4 rounded-xl border-2 border-primary-200/60 shadow-md hover:shadow-lg transition-all duration-300">
                  <Input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="ابحث في جميع الحقول..."
                    leftIcon={<MaterialIcon name="search" size="sm" />}
                    className="w-full bg-white shadow-sm hover:shadow-md transition-shadow"
                  />
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
                <div className="border-2 border-slate-200/60 rounded-xl overflow-hidden bg-white shadow-md hover:shadow-xl transition-all duration-300 hover:border-primary-300/50">
                  <button
                    onClick={() => setFilterOpenStates(prev => ({ ...prev, status: !prev.status }))}
                    className="w-full p-4 bg-gradient-to-r from-slate-50 via-slate-100/70 to-slate-50 hover:from-primary-50 hover:via-primary-100/50 hover:to-primary-50 transition-all duration-300 flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary-100 group-hover:bg-primary-200 flex items-center justify-center transition-colors">
                        <MaterialIcon
                          name={filterOpenStates.status ? "expand_less" : "expand_more"}
                          className="text-primary-600"
                          size="md"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <MaterialIcon name="toggle_on" className="text-slate-500" size="sm" />
                        <span className="font-semibold text-slate-700">الحالة</span>
                      </div>
                      {isActiveFilter !== 'all' && (
                        <Badge variant="primary" size="sm" className="animate-scale-in">
                          {isActiveFilter === 'active' ? 'نشط' : 'غير نشط'}
                        </Badge>
                      )}
                    </div>
                  </button>

                  {filterOpenStates.status && (
                    <div className="p-4 border-t border-slate-200 bg-white filter-panel-open space-y-2">
                      <Checkbox
                        checked={isActiveFilter === 'all'}
                        onChange={() => setIsActiveFilter('all')}
                        label="الكل"
                      />
                      <Checkbox
                        checked={isActiveFilter === 'active'}
                        onChange={() => setIsActiveFilter('active')}
                        label="نشط فقط"
                      />
                      <Checkbox
                        checked={isActiveFilter === 'inactive'}
                        onChange={() => setIsActiveFilter('inactive')}
                        label="غير نشط فقط"
                      />
                    </div>
                  )}
                </div>

                {/* فلتر تاريخ الشراء */}
                <div className="border-2 border-slate-200/60 rounded-xl overflow-hidden bg-white shadow-md hover:shadow-xl transition-all duration-300 hover:border-primary-300/50">
                  <button
                    onClick={() => setFilterOpenStates(prev => ({ ...prev, dates: !prev.dates }))}
                    className="w-full p-4 bg-gradient-to-r from-slate-50 via-slate-100/70 to-slate-50 hover:from-primary-50 hover:via-primary-100/50 hover:to-primary-50 transition-all duration-300 flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary-100 group-hover:bg-primary-200 flex items-center justify-center transition-colors">
                        <MaterialIcon
                          name={filterOpenStates.dates ? "expand_less" : "expand_more"}
                          className="text-primary-600"
                          size="md"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <MaterialIcon name="calendar_today" className="text-slate-500" size="sm" />
                        <span className="font-semibold text-slate-700">تاريخ الشراء</span>
                      </div>
                      {(purchaseDateFrom || purchaseDateTo) && (
                        <Badge variant="primary" size="sm" className="animate-scale-in">
                          مفعل
                        </Badge>
                      )}
                    </div>
                  </button>

                  {filterOpenStates.dates && (
                    <div className="p-4 border-t border-slate-200 bg-white filter-panel-open">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-2">من تاريخ</label>
                          <Input
                            type="date"
                            value={purchaseDateFrom}
                            onChange={(e) => setPurchaseDateFrom(e.target.value)}
                            leftIcon={<MaterialIcon name="event" size="sm" />}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-2">إلى تاريخ</label>
                          <Input
                            type="date"
                            value={purchaseDateTo}
                            onChange={(e) => setPurchaseDateTo(e.target.value)}
                            leftIcon={<MaterialIcon name="event" size="sm" />}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* أزرار التحكم */}
                <div className="pt-4 border-t-2 border-slate-200 space-y-2 sticky bottom-0 bg-white pb-2">
                  <Button
                    onClick={resetFilters}
                    variant="outline"
                    fullWidth
                    leftIcon={<MaterialIcon name="refresh" size="sm" />}
                    className="font-semibold"
                  >
                    إعادة تعيين
                  </Button>
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
                          <div className="absolute bottom-full left-0 right-0 mb-2 glass-effect rounded-xl shadow-2xl z-50 overflow-hidden animate-scale-in">
                            <button
                              onClick={exportToCSV}
                              className="w-full px-4 py-3 text-right hover:bg-success-50 transition-all duration-200 flex items-center gap-3 text-sm font-medium text-slate-700 hover:translate-x-[-2px]"
                            >
                              <MaterialIcon name="description" className="text-success-600" size="sm" />
                              <span>تصدير إلى CSV</span>
                            </button>
                            <button
                              onClick={exportToExcel}
                              className="w-full px-4 py-3 text-right hover:bg-primary-50 transition-all duration-200 flex items-center gap-3 text-sm font-medium text-slate-700 border-t border-slate-200 hover:translate-x-[-2px]"
                            >
                              <MaterialIcon name="table_chart" className="text-primary-600" size="sm" />
                              <span>تصدير إلى Excel</span>
                            </button>
                            <button
                              onClick={exportToPDF}
                              className="w-full px-4 py-3 text-right hover:bg-error-50 transition-all duration-200 flex items-center gap-3 text-sm font-medium text-slate-700 border-t border-slate-200 hover:translate-x-[-2px]"
                            >
                              <MaterialIcon name="picture_as_pdf" className="text-error-600" size="sm" />
                              <span>تصدير إلى PDF</span>
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
                    </>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* جدول النتائج */}
        <div className="lg:col-span-3">
          <Card className="shadow-xl border-2 border-slate-200/50 bg-gradient-to-br from-white to-slate-50/30">
            <CardHeader 
              action={
                filteredAssets.length > 0 ? (
                  <div className="flex items-center gap-2">
                    <div className="relative" ref={exportButtonRef}>
                      <Button
                        onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                        variant="outline"
                        size="sm"
                        leftIcon={<MaterialIcon name="download" size="sm" />}
                        rightIcon={<MaterialIcon name={exportDropdownOpen ? "expand_less" : "expand_more"} size="sm" />}
                      >
                        تصدير
                      </Button>
                      {exportDropdownOpen && (
                        <div className="absolute top-full left-0 mt-2 glass-effect rounded-xl shadow-2xl z-50 overflow-hidden animate-scale-in min-w-[180px]">
                          <button
                            onClick={exportToCSV}
                            className="w-full px-4 py-3 text-right hover:bg-success-50 transition-all duration-200 flex items-center gap-3 text-sm font-medium text-slate-700 hover:translate-x-[-2px]"
                          >
                            <MaterialIcon name="description" className="text-success-600" size="sm" />
                            <span>CSV</span>
                          </button>
                          <button
                            onClick={exportToExcel}
                            className="w-full px-4 py-3 text-right hover:bg-primary-50 transition-all duration-200 flex items-center gap-3 text-sm font-medium text-slate-700 border-t border-slate-200 hover:translate-x-[-2px]"
                          >
                            <MaterialIcon name="table_chart" className="text-primary-600" size="sm" />
                            <span>Excel</span>
                          </button>
                          <button
                            onClick={exportToPDF}
                            className="w-full px-4 py-3 text-right hover:bg-error-50 transition-all duration-200 flex items-center gap-3 text-sm font-medium text-slate-700 border-t border-slate-200 hover:translate-x-[-2px]"
                          >
                            <MaterialIcon name="picture_as_pdf" className="text-error-600" size="sm" />
                            <span>PDF</span>
                          </button>
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={handlePrint}
                      variant="outline"
                      size="sm"
                      leftIcon={<MaterialIcon name="print" size="sm" />}
                    >
                      طباعة
                    </Button>
                  </div>
                ) : undefined
              }
            >
              <div className="flex items-center gap-2">
                <MaterialIcon name="table_chart" className="text-primary-600" size="md" />
                <span className="text-xl font-bold text-slate-800">النتائج المفلترة ({filteredAssets.length} أصل)</span>
              </div>
            </CardHeader>
            <CardBody>
              {filteredAssets.length === 0 ? (
                <div className="text-center py-16 animate-fade-in">
                  <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 bg-primary-100 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                    <MaterialIcon name="filter_alt_off" className="text-slate-400 mx-auto relative z-10 text-6xl" size="5xl" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-700 mb-3">لا توجد نتائج</h3>
                  <p className="text-slate-500 mb-6">جرب تغيير الفلاتر أو البحث</p>
                  <Button
                    onClick={resetFilters}
                    variant="outline"
                    leftIcon={<MaterialIcon name="refresh" size="sm" />}
                  >
                    إعادة تعيين الفلاتر
                  </Button>
                </div>
              ) : (
                <div className="w-full">
                  {/* Desktop Table View */}
                  <div className="hidden lg:block overflow-x-auto rounded-xl border-2 border-slate-200/60 shadow-lg bg-white reports-table">
                    <div className="min-w-full">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b-2 border-primary-200 bg-gradient-to-r from-primary-50 via-primary-100/50 to-primary-50 sticky top-0 z-20 shadow-md">
                            <th className="text-right p-4 font-extrabold text-primary-900 text-xs uppercase tracking-widest whitespace-nowrap border-l border-primary-200/50 first:border-l-0 min-w-[120px]">
                              <div className="flex items-center gap-2">
                                <MaterialIcon name="business" className="text-primary-600" size="sm" />
                                <span>الإدارة</span>
                              </div>
                            </th>
                            <th className="text-right p-4 font-extrabold text-primary-900 text-xs uppercase tracking-widest whitespace-nowrap border-l border-primary-200/50 min-w-[120px]">
                              <div className="flex items-center gap-2">
                                <MaterialIcon name="meeting_room" className="text-primary-600" size="sm" />
                                <span>المكتب</span>
                              </div>
                            </th>
                            <th className="text-right p-4 font-extrabold text-primary-900 text-xs uppercase tracking-widest whitespace-nowrap border-l border-primary-200/50 min-w-[150px]">
                              <div className="flex items-center gap-2">
                                <MaterialIcon name="inventory_2" className="text-primary-600" size="sm" />
                                <span>اسم الأصل</span>
                              </div>
                            </th>
                            <th className="text-right p-4 font-extrabold text-primary-900 text-xs uppercase tracking-widest whitespace-nowrap border-l border-primary-200/50 min-w-[120px]">
                              <div className="flex items-center gap-2">
                                <MaterialIcon name="category" className="text-primary-600" size="sm" />
                                <span>نوع الأصل</span>
                              </div>
                            </th>
                            <th className="text-right p-4 font-extrabold text-primary-900 text-xs uppercase tracking-widest whitespace-nowrap border-l border-primary-200/50 min-w-[120px]">
                              <div className="flex items-center gap-2">
                                <MaterialIcon name="info" className="text-primary-600" size="sm" />
                                <span>حالة الأصل</span>
                              </div>
                            </th>
                            <th className="text-right p-4 font-extrabold text-primary-900 text-xs uppercase tracking-widest whitespace-nowrap border-l border-primary-200/50 min-w-[120px]">
                              <div className="flex items-center gap-2">
                                <MaterialIcon name="person" className="text-primary-600" size="sm" />
                                <span>حامل الأصل</span>
                              </div>
                            </th>
                            <th className="text-right p-4 font-extrabold text-primary-900 text-xs uppercase tracking-widest whitespace-nowrap border-l border-primary-200/50 min-w-[100px]">
                              <div className="flex items-center gap-2">
                                <MaterialIcon name="tag" className="text-primary-600" size="sm" />
                                <span>رقم الأصل</span>
                              </div>
                            </th>
                            <th className="text-right p-4 font-extrabold text-primary-900 text-xs uppercase tracking-widest whitespace-nowrap border-l border-primary-200/50 min-w-[120px]">
                              <div className="flex items-center gap-2">
                                <MaterialIcon name="attach_money" className="text-primary-600" size="sm" />
                                <span>القيمة</span>
                              </div>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredAssets.map((assetDetail, idx) => (
                            <tr 
                              key={idx} 
                              className={`group relative transition-all duration-300 hover:duration-200 animate-fade-in ${
                                idx % 2 === 0 
                                  ? 'bg-white hover:bg-gradient-to-r hover:from-primary-50/80 hover:via-primary-50/50 hover:to-white' 
                                  : 'bg-slate-50/70 hover:bg-gradient-to-r hover:from-primary-50/80 hover:via-primary-50/50 hover:to-slate-50/70'
                              } hover:shadow-lg hover:shadow-primary-500/10 hover:scale-[1.01] hover:border-l-4 hover:border-l-primary-500`}
                              style={{ animationDelay: `${idx * 0.02}s` }}
                            >
                              {/* Left border indicator on hover */}
                              <div className="absolute right-0 top-0 bottom-0 w-1 bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              
                              <td className="p-4 text-slate-800 font-semibold transition-all duration-200 group-hover:text-primary-700 group-hover:font-bold border-l border-slate-100 group-hover:border-l-primary-200">
                                <div className="flex items-center gap-2">
                                  <MaterialIcon name="business" className="text-slate-400 group-hover:text-primary-500 text-sm opacity-0 group-hover:opacity-100 transition-all duration-200" size="sm" />
                                  <span className="truncate max-w-[150px]" title={assetDetail.departmentName}>{assetDetail.departmentName}</span>
                                </div>
                              </td>
                              <td className="p-4 text-slate-800 font-semibold transition-all duration-200 group-hover:text-primary-700 group-hover:font-bold border-l border-slate-100 group-hover:border-l-primary-200">
                                <div className="flex items-center gap-2">
                                  <MaterialIcon name="meeting_room" className="text-slate-400 group-hover:text-primary-500 text-sm opacity-0 group-hover:opacity-100 transition-all duration-200" size="sm" />
                                  <span className="truncate max-w-[150px]" title={assetDetail.officeName}>{assetDetail.officeName}</span>
                                </div>
                              </td>
                              <td className="p-4 text-slate-900 font-bold transition-all duration-200 group-hover:text-primary-800 group-hover:scale-105 border-l border-slate-100 group-hover:border-l-primary-200">
                                <div className="flex items-center gap-2">
                                  <MaterialIcon name="inventory_2" className="text-primary-400 text-sm flex-shrink-0" size="sm" />
                                  <span className="truncate max-w-[200px]" title={assetDetail.assetName}>{assetDetail.assetName}</span>
                                </div>
                              </td>
                              <td className="p-4 text-slate-700 font-medium transition-all duration-200 group-hover:text-slate-800 border-l border-slate-100 group-hover:border-l-primary-200">
                                <span className="truncate max-w-[150px]" title={assetDetail.assetType}>{assetDetail.assetType}</span>
                              </td>
                              <td className="p-4 transition-all duration-200 border-l border-slate-100 group-hover:border-l-primary-200">
                                <Badge 
                                  variant="outline" 
                                  size="sm" 
                                  className="group-hover:scale-110 group-hover:shadow-md group-hover:border-primary-300 transition-all duration-200 font-semibold whitespace-nowrap"
                                >
                                  {assetDetail.assetStatus}
                                </Badge>
                              </td>
                              <td className="p-4 text-slate-700 font-medium transition-all duration-200 group-hover:text-slate-800 border-l border-slate-100 group-hover:border-l-primary-200">
                                <div className="flex items-center gap-2">
                                  <MaterialIcon name="person" className="text-slate-400 group-hover:text-primary-500 text-sm opacity-0 group-hover:opacity-100 transition-all duration-200 flex-shrink-0" size="sm" />
                                  <span className="truncate max-w-[150px]" title={assetDetail.custodianName}>{assetDetail.custodianName}</span>
                                </div>
                              </td>
                              <td className="p-4 text-slate-600 font-mono text-xs transition-all duration-200 group-hover:text-primary-600 group-hover:font-semibold border-l border-slate-100 group-hover:border-l-primary-200 bg-slate-50/50 group-hover:bg-primary-50/50 rounded-md">
                                <div className="flex items-center gap-2">
                                  <MaterialIcon name="tag" className="text-slate-400 group-hover:text-primary-500 text-xs opacity-0 group-hover:opacity-100 transition-all duration-200 flex-shrink-0" size="sm" />
                                  <span className="font-mono truncate max-w-[100px]" title={assetDetail.asset.get('asset_tag') || '-'}>{assetDetail.asset.get('asset_tag') || '-'}</span>
                                </div>
                              </td>
                              <td className="p-4 text-slate-900 font-bold transition-all duration-200 group-hover:text-primary-700 group-hover:text-lg border-l border-slate-100 group-hover:border-l-primary-200">
                                <div className="flex items-center gap-2 justify-end whitespace-nowrap">
                                  <span className="bg-gradient-to-r from-success-500 to-success-600 bg-clip-text text-transparent group-hover:from-success-600 group-hover:to-success-700">
                                    {assetDetail.value.toLocaleString('ar-SA')}
                                  </span>
                                  <span className="text-success-600 font-semibold">ريال</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-gradient-to-r from-primary-100 via-primary-200/50 to-primary-100 font-extrabold border-t-4 border-primary-400 shadow-inner relative">
                            <td colSpan={7} className="p-5 text-right text-slate-900 text-base border-l border-primary-300/50">
                              <div className="flex items-center gap-2 justify-end">
                                <MaterialIcon name="calculate" className="text-primary-700" size="md" />
                                <span>الإجمالي:</span>
                              </div>
                            </td>
                            <td className="p-5 text-slate-900 text-2xl border-l border-primary-300/50">
                              <div className="flex items-center gap-2 justify-end">
                                <span className="bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent font-black">
                                  {totalFilteredValue.toLocaleString('ar-SA')}
                                </span>
                                <span className="text-primary-700 font-bold">ريال</span>
                              </div>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* Mobile/Tablet Card View */}
                  <div className="lg:hidden space-y-4">
                    {filteredAssets.map((assetDetail, idx) => (
                      <Card 
                        key={idx} 
                        className="hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-2 border-slate-200/60 bg-gradient-to-br from-white to-slate-50/30"
                        style={{ animationDelay: `${idx * 0.03}s` }}
                      >
                        <CardBody padding="lg">
                          <div className="space-y-4">
                            {/* Header with Asset Name */}
                            <div className="flex items-start justify-between border-b-2 border-primary-200/50 pb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <MaterialIcon name="inventory_2" className="text-primary-500" size="md" />
                                  <h3 className="text-lg font-bold text-slate-900">{assetDetail.assetName}</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" size="sm" className="font-semibold">
                                    {assetDetail.assetStatus}
                                  </Badge>
                                  <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-1 rounded">
                                    {assetDetail.asset.get('asset_tag') || '-'}
                                  </span>
                                </div>
                              </div>
                              <div className="text-left">
                                <div className="text-xl font-black bg-gradient-to-r from-success-500 to-success-600 bg-clip-text text-transparent">
                                  {assetDetail.value.toLocaleString('ar-SA')}
                                </div>
                                <div className="text-xs text-success-600 font-semibold">ريال</div>
                              </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="flex items-center gap-2 p-3 bg-slate-50/50 rounded-lg">
                                <MaterialIcon name="business" className="text-primary-500 flex-shrink-0" size="sm" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-slate-500 mb-1">الإدارة</p>
                                  <p className="text-sm font-semibold text-slate-800 truncate" title={assetDetail.departmentName}>
                                    {assetDetail.departmentName}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 p-3 bg-slate-50/50 rounded-lg">
                                <MaterialIcon name="meeting_room" className="text-primary-500 flex-shrink-0" size="sm" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-slate-500 mb-1">المكتب</p>
                                  <p className="text-sm font-semibold text-slate-800 truncate" title={assetDetail.officeName}>
                                    {assetDetail.officeName}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 p-3 bg-slate-50/50 rounded-lg">
                                <MaterialIcon name="category" className="text-primary-500 flex-shrink-0" size="sm" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-slate-500 mb-1">نوع الأصل</p>
                                  <p className="text-sm font-semibold text-slate-800 truncate" title={assetDetail.assetType}>
                                    {assetDetail.assetType}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 p-3 bg-slate-50/50 rounded-lg">
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
                    <Card className="bg-gradient-to-r from-primary-100 via-primary-200/50 to-primary-100 border-2 border-primary-300">
                      <CardBody padding="lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MaterialIcon name="calculate" className="text-primary-700" size="lg" />
                            <span className="text-lg font-bold text-slate-900">الإجمالي:</span>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-black bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                              {totalFilteredValue.toLocaleString('ar-SA')}
                            </div>
                            <div className="text-sm text-primary-700 font-bold">ريال</div>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
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
