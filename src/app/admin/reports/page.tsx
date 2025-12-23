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
import { Skeleton } from "@/components/ui/Skeleton";
import { BaseModel } from "@/lib/BaseModel";
import { firestoreApi } from "@/lib/FirestoreApi";
import { PdfSettingsService } from "@/lib/services/PdfSettingsService";
import { getBothDates } from "@/lib/utils/hijriDate";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow transition-shadow">
      <button
        onClick={onToggleOpen}
        className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between group"
      >
        <div className="flex items-center gap-2">
          <MaterialIcon
            name={isOpen ? "expand_less" : "expand_more"}
            className="text-slate-500 text-sm"
            size="sm"
          />
          <span className="font-medium text-slate-700 text-sm">{title}</span>
          {selectedIds.size > 0 && (
            <Badge variant="primary" size="sm" className="text-xs">
              {selectedIds.size}
            </Badge>
          )}
        </div>
        <span className="text-xs text-slate-500 font-medium">
          {filteredOptions.length}
        </span>
      </button>

      {isOpen && (
        <div className="p-2 border-t border-slate-200 bg-white">
          {/* البحث */}
          <div className="mb-2">
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
          <div className="mb-2 pb-2 border-b border-slate-200">
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
              label={allSelected ? "إلغاء الكل" : "اختيار الكل"}
              className="text-sm"
            />
          </div>

          {/* قائمة الخيارات */}
          <div className="max-h-48 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-primary-200 scrollbar-track-slate-100">
            {filteredOptions.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-3">لا توجد نتائج</p>
            ) : (
              filteredOptions.map((option) => (
                <div 
                  key={option.id} 
                  className="flex items-center justify-between p-2 hover:bg-slate-50 rounded transition-colors cursor-pointer"
                  onClick={() => onToggle(option.id)}
                >
                  <Checkbox
                    checked={selectedIds.has(option.id)}
                    onChange={() => onToggle(option.id)}
                    label={option.label}
                    className="flex-1 text-sm"
                  />
                  <Badge variant="outline" size="sm" className="text-xs">
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
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow transition-shadow">
      <button
        onClick={onToggleOpen}
        className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between group"
      >
        <div className="flex items-center gap-2">
          <MaterialIcon
            name={isOpen ? "expand_less" : "expand_more"}
            className="text-slate-500 text-sm"
            size="sm"
          />
          <span className="font-medium text-slate-700 text-sm">{title}</span>
          {(minValue || maxValue) && (
            <Badge variant="primary" size="sm" className="text-xs">
              مفعل
            </Badge>
          )}
        </div>
      </button>

      {isOpen && (
        <div className="p-2 border-t border-slate-200 bg-white">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">{placeholder.min}</label>
              <Input
                type="number"
                value={minValue}
                onChange={(e) => onMinChange(e.target.value)}
                placeholder={placeholder.min}
                className="w-full text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">{placeholder.max}</label>
              <Input
                type="number"
                value={maxValue}
                onChange={(e) => onMaxChange(e.target.value)}
                placeholder={placeholder.max}
                className="w-full text-sm"
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
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState('جاري التحميل...');
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
      setLoadingStage('حدث خطأ أثناء التحميل');
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

  const toggleFilter = useCallback((filterType: string, id: string) => {
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
  }, []);

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
        <LoadingScreen 
          message={loadingStage}
          showProgress={true}
          progress={loadingProgress}
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="w-full">
        {/* Page Header */}
        <div className="mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30 flex-shrink-0">
              <MaterialIcon name="assessment" className="text-white" size="lg" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-0.5">التقارير والإحصائيات</h1>
              <p className="text-slate-600 text-sm font-medium">نظام فلترة متقدم</p>
            </div>
          </div>
        </div>

        {/* إحصائيات عامة */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
        <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
          <CardBody padding="sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-500 mb-1">إجمالي الأصول</p>
                <p className="text-2xl font-bold text-slate-900 transition-all duration-300">{stats.totalAssets.toLocaleString('ar-SA')}</p>
                <p className="text-xs text-slate-500">أصل</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0 transition-colors hover:bg-primary-200">
                <MaterialIcon name="inventory" className="text-primary-600" size="md" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
          <CardBody padding="sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-500 mb-1">القيمة الإجمالية</p>
                <p className="text-xl font-bold text-slate-900 truncate transition-all duration-300">
                  {stats.totalValue.toLocaleString('ar-SA')}
                </p>
                <p className="text-xs text-slate-500">ريال</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-success-100 flex items-center justify-center flex-shrink-0 transition-colors hover:bg-success-200">
                <MaterialIcon name="attach_money" className="text-success-600" size="md" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
          <CardBody padding="sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-500 mb-1">أصول نشطة</p>
                <p className="text-2xl font-bold text-slate-900 transition-all duration-300">{stats.activeAssets.toLocaleString('ar-SA')}</p>
                <p className="text-xs text-slate-500">نشط</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-accent-100 flex items-center justify-center flex-shrink-0 transition-colors hover:bg-accent-200">
                <MaterialIcon name="check_circle" className="text-accent-600" size="md" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
          <CardBody padding="sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-500 mb-1">النتائج المفلترة</p>
                <p className="text-2xl font-bold text-slate-900 transition-all duration-300">{filteredAssets.length.toLocaleString('ar-SA')}</p>
                <p className="text-xs text-slate-500">من {stats.totalAssets.toLocaleString('ar-SA')}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-warning-100 flex items-center justify-center flex-shrink-0 transition-colors hover:bg-warning-200">
                <MaterialIcon name="filter_list" className="text-warning-600" size="md" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
          <CardBody padding="sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-500 mb-1">قيمة المفلترة</p>
                <p className="text-xl font-bold text-slate-900 truncate transition-all duration-300">
                  {totalFilteredValue.toLocaleString('ar-SA')}
                </p>
                <p className="text-xs text-slate-500">ريال</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0 transition-colors hover:bg-primary-200">
                <MaterialIcon name="calculate" className="text-primary-600" size="md" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 w-full">
        {/* لوحة الفلاتر */}
        <div className="w-full lg:w-80 flex-shrink-0">
          <Card className="sticky top-4 shadow-md border border-slate-200 bg-white h-fit max-h-[calc(100vh-120px)] flex flex-col">
            <CardHeader className="pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <MaterialIcon name="tune" className="text-primary-600" size="sm" />
                <span className="text-base font-semibold text-slate-800">الفلاتر</span>
              </div>
            </CardHeader>
            <CardBody className="pt-3 flex-1 flex flex-col min-h-0">
              <div className="space-y-2 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-primary-300 scrollbar-track-slate-100 pr-1">
                {/* البحث العام */}
                <div className="mb-3">
                  <Input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="ابحث..."
                    leftIcon={<MaterialIcon name="search" size="sm" />}
                    className="w-full"
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
                <div className="pt-3 mt-3 border-t border-slate-200 space-y-2 sticky bottom-0 bg-white pb-2 z-10">
                  <Button
                    onClick={resetFilters}
                    variant="outline"
                    fullWidth
                    size="sm"
                    leftIcon={<MaterialIcon name="refresh" size="sm" />}
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
        <div className="flex-1 min-w-0 w-full">
          <Card className="shadow-md border border-slate-200 bg-white w-full">
            <CardHeader 
              className="pb-3 border-b border-slate-200 flex-shrink-0"
              action={
                filteredAssets.length > 0 ? (
                  <div className="flex items-center gap-2 flex-wrap">
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
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <MaterialIcon name="table_chart" className="text-primary-600" size="sm" />
                  <span className="text-base font-semibold text-slate-800">النتائج ({filteredAssets.length})</span>
                </div>
              </div>
            </CardHeader>
            <CardBody className="p-4">
              {filteredAssets.length === 0 ? (
                <div className="text-center py-16 animate-fade-in">
                  <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 bg-primary-100 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                    <MaterialIcon name="filter_alt_off" className="text-slate-400 mx-auto relative z-10" size="5xl" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-700 mb-3">لا توجد نتائج</h3>
                  <p className="text-slate-500 mb-6">جرب تغيير الفلاتر أو البحث</p>
                  <Button
                    onClick={resetFilters}
                    variant="outline"
                    leftIcon={<MaterialIcon name="refresh" size="sm" />}
                    className="transition-all hover:scale-105"
                  >
                    إعادة تعيين الفلاتر
                  </Button>
                </div>
              ) : (
                <div className="w-full">
                  {/* Desktop Table View */}
                  <div className="hidden lg:block w-full overflow-x-auto reports-table-wrapper">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="text-right p-3 font-semibold text-slate-700 text-xs whitespace-nowrap border-l border-slate-200 first:border-l-0 min-w-[120px]">
                            <div className="flex items-center gap-2 justify-end">
                              <MaterialIcon name="business" className="text-primary-600" size="sm" />
                              <span>الإدارة</span>
                            </div>
                          </th>
                          <th className="text-right p-3 font-semibold text-slate-700 text-xs whitespace-nowrap border-l border-slate-200 min-w-[120px]">
                            <div className="flex items-center gap-2 justify-end">
                              <MaterialIcon name="meeting_room" className="text-primary-600" size="sm" />
                              <span>المكتب</span>
                            </div>
                          </th>
                          <th className="text-right p-3 font-semibold text-slate-700 text-xs whitespace-nowrap border-l border-slate-200 min-w-[150px]">
                            <div className="flex items-center gap-2 justify-end">
                              <MaterialIcon name="inventory_2" className="text-primary-600" size="sm" />
                              <span>اسم الأصل</span>
                            </div>
                          </th>
                          <th className="text-right p-3 font-semibold text-slate-700 text-xs whitespace-nowrap border-l border-slate-200 min-w-[120px]">
                            <div className="flex items-center gap-2 justify-end">
                              <MaterialIcon name="category" className="text-primary-600" size="sm" />
                              <span>نوع الأصل</span>
                            </div>
                          </th>
                          <th className="text-right p-3 font-semibold text-slate-700 text-xs whitespace-nowrap border-l border-slate-200 min-w-[120px]">
                            <div className="flex items-center gap-2 justify-end">
                              <MaterialIcon name="info" className="text-primary-600" size="sm" />
                              <span>حالة الأصل</span>
                            </div>
                          </th>
                          <th className="text-right p-3 font-semibold text-slate-700 text-xs whitespace-nowrap border-l border-slate-200 min-w-[120px]">
                            <div className="flex items-center gap-2 justify-end">
                              <MaterialIcon name="person" className="text-primary-600" size="sm" />
                              <span>حامل الأصل</span>
                            </div>
                          </th>
                          <th className="text-right p-3 font-semibold text-slate-700 text-xs whitespace-nowrap border-l border-slate-200 min-w-[100px]">
                            <div className="flex items-center gap-2 justify-end">
                              <MaterialIcon name="tag" className="text-primary-600" size="sm" />
                              <span>رقم الأصل</span>
                            </div>
                          </th>
                          <th className="text-right p-3 font-semibold text-slate-700 text-xs whitespace-nowrap border-l border-slate-200 min-w-[120px]">
                            <div className="flex items-center gap-2 justify-end">
                              <MaterialIcon name="attach_money" className="text-primary-600" size="sm" />
                              <span>القيمة</span>
                            </div>
                          </th>
                          </tr>
                        </thead>
                      <tbody>
                        {filteredAssets.map((assetDetail, idx) => (
                          <tr 
                            key={idx} 
                            className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                              idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                            }`}
                          >
                            <td className="p-3 text-slate-700 text-sm border-l border-slate-100">
                              <span className="truncate block max-w-[150px]" title={assetDetail.departmentName}>{assetDetail.departmentName}</span>
                            </td>
                            <td className="p-3 text-slate-700 text-sm border-l border-slate-100">
                              <span className="truncate block max-w-[150px]" title={assetDetail.officeName}>{assetDetail.officeName}</span>
                            </td>
                            <td className="p-3 text-slate-900 font-semibold text-sm border-l border-slate-100">
                              <span className="truncate block max-w-[200px]" title={assetDetail.assetName}>{assetDetail.assetName}</span>
                            </td>
                            <td className="p-3 text-slate-700 text-sm border-l border-slate-100">
                              <span className="truncate block max-w-[150px]" title={assetDetail.assetType}>{assetDetail.assetType}</span>
                            </td>
                            <td className="p-3 border-l border-slate-100">
                              <Badge variant="outline" size="sm" className="whitespace-nowrap">
                                {assetDetail.assetStatus}
                              </Badge>
                            </td>
                            <td className="p-3 text-slate-700 text-sm border-l border-slate-100">
                              <span className="truncate block max-w-[150px]" title={assetDetail.custodianName}>{assetDetail.custodianName}</span>
                            </td>
                            <td className="p-3 text-slate-600 font-mono text-xs border-l border-slate-100">
                              <span className="truncate block max-w-[100px]" title={assetDetail.asset.get('asset_tag') || '-'}>{assetDetail.asset.get('asset_tag') || '-'}</span>
                            </td>
                            <td className="p-3 text-slate-900 font-semibold text-sm border-l border-slate-100 text-right">
                              <div className="flex items-center gap-1 justify-end whitespace-nowrap">
                                <span>{assetDetail.value.toLocaleString('ar-SA')}</span>
                                <span className="text-slate-500 text-xs">ريال</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-100 border-t-2 border-slate-300 font-semibold">
                          <td colSpan={7} className="p-3 text-right text-slate-900 text-sm border-l border-slate-200">
                            <span>الإجمالي:</span>
                          </td>
                          <td className="p-3 text-slate-900 text-base border-l border-slate-200 text-right">
                            <div className="flex items-center gap-1 justify-end">
                              <span>{totalFilteredValue.toLocaleString('ar-SA')}</span>
                              <span className="text-slate-600 text-sm">ريال</span>
                            </div>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Mobile/Tablet Card View */}
                  <div className="lg:hidden space-y-3">
                    {filteredAssets.map((assetDetail, idx) => (
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
