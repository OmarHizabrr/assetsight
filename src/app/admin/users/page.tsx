'use client';

import { ProtectedRoute, usePermissions } from "@/components/auth/ProtectedRoute";
import { MaterialIcon } from "@/components/icons/MaterialIcon";
import { MainLayout } from "@/components/layout/MainLayout";
import { Badge } from "@/components/ui/Badge";
import { BulkEditModal } from "@/components/ui/BulkEditModal";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { DataTable } from "@/components/ui/DataTable";
import { ImportExcelModal } from "@/components/ui/ImportExcelModal";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/contexts/ToastContext";
import { BaseModel } from "@/lib/BaseModel";
import { firestoreApi } from "@/lib/FirestoreApi";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

function UsersPageContent() {
  const pathname = usePathname();
  const { canAdd, canEdit, canDelete } = usePermissions(pathname || '/admin/users');
  const router = useRouter();
  const { showSuccess, showError, showWarning } = useToast();
  const [users, setUsers] = useState<BaseModel[]>([]);
  const [allOffices, setAllOffices] = useState<BaseModel[]>([]);
  const [offices, setOffices] = useState<BaseModel[]>([]);
  const [departments, setDepartments] = useState<BaseModel[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<BaseModel | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<BaseModel | null>(null);
  // قائمة جميع الصفحات في النظام
  const allPages = [
    { path: '/', label: 'الرئيسية' },
    { path: '/admin/departments', label: 'الإدارات' },
    { path: '/admin/offices', label: 'المكاتب' },
    { path: '/admin/asset-types', label: 'أنواع الأصول' },
    { path: '/admin/asset-statuses', label: 'حالات الأصول' },
    { path: '/admin/asset-names', label: 'أسماء الأصول' },
    { path: '/admin/categories', label: 'الفئات' },
    { path: '/admin/users', label: 'المستخدمون' },
    { path: '/admin/assets', label: 'الأصول' },
    { path: '/admin/inventory', label: 'الجرد' },
    { path: '/admin/reports', label: 'التقارير' },
  ];

  const [formData, setFormData] = useState<BaseModel>(new BaseModel({
    employee_number: '',
    username: '',
    full_name: '',
    email: '',
    phone: '',
    department_id: '',
    office_id: '',
    role: '',
    user_type: 'موظف', // نوع المستخدم: موظف أو مستخدم نظام
    password: '',
    confirm_password: '',
    permissions: [] as string[],
    is_active: true,
    notes: '',
  }));
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [bulkEditLoading, setBulkEditLoading] = useState(false);
  const [selectedUsersForBulkEdit, setSelectedUsersForBulkEdit] = useState<BaseModel[]>([]);
  const [bulkEditFormDataArray, setBulkEditFormDataArray] = useState<BaseModel[]>([]);
  const [bulkEditSelectedDepartmentIds, setBulkEditSelectedDepartmentIds] = useState<Record<number, string>>({});
  const [bulkEditOfficesMap, setBulkEditOfficesMap] = useState<Record<number, BaseModel[]>>({});
  const [userTypeFilter, setUserTypeFilter] = useState<string>('all'); // 'all', 'موظف', 'مستخدم نظام'

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // جلب جميع الإدارات
      const deptDocs = await firestoreApi.getDocuments(firestoreApi.getCollection("departments"));
      const departmentsData = BaseModel.fromFirestoreArray(deptDocs);
      setDepartments(departmentsData);
      
      // جلب جميع المكاتب من جميع الإدارات
      const officesList: BaseModel[] = [];
      for (const dept of departmentsData) {
        const deptId = dept.get('id');
        if (deptId) {
          const subCollectionRef = firestoreApi.getSubCollection("departments", deptId, "departments");
          const officeDocs = await firestoreApi.getDocuments(subCollectionRef);
          const offices = BaseModel.fromFirestoreArray(officeDocs);
          offices.forEach(office => {
            office.put('department_id', deptId);
            officesList.push(office);
          });
        }
      }
      setAllOffices(officesList);
      setOffices([]); // لا تظهر المكاتب حتى يتم اختيار الإدارة
      
      // جلب جميع المستخدمين من الجدول المستقل users/userId/
      const userDocs = await firestoreApi.getDocuments(firestoreApi.getCollection("users"));
      const usersData = BaseModel.fromFirestoreArray(userDocs);
      setUsers(usersData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = formData.getData();
      submitData.is_active = formData.getValue<boolean>('is_active') ? 1 : 0;
      
      // التحقق من تكرار رقم الموظف
      const employeeNumber = submitData.employee_number?.trim();
      if (!employeeNumber) {
        showWarning("يجب إدخال رقم الموظف");
        return;
      }
      
      // التحقق من عدم تكرار رقم الموظف
      const existingUser = users.find(u => {
        const userEmpNum = u.get('employee_number')?.trim();
        const isSameUser = editingUser?.get('id') === u.get('id');
        return userEmpNum === employeeNumber && !isSameUser;
      });
      
      if (existingUser) {
        showWarning("رقم الموظف موجود بالفعل. يرجى استخدام رقم آخر");
        return;
      }
      
      // إذا كان الدور "مدير"، إعطاء صلاحية لجميع الصفحات
      if (submitData.role === 'مدير') {
        submitData.permissions = allPages.map(page => page.path);
      } else {
        // الحفاظ على الصلاحيات المحددة وإزالة التكرارات
        const permissions = formData.getValue<string[]>('permissions') || [];
        submitData.permissions = Array.from(new Set(permissions));
      }
      
      // إذا لم يتم إدخال كلمة مرور جديدة عند التعديل، لا نحدثها
      if (editingUser && !submitData.password) {
        delete submitData.password;
        delete submitData.confirm_password;
      } else if (editingUser && submitData.password) {
        // التحقق من تطابق كلمة المرور عند التعديل
        if (submitData.password !== submitData.confirm_password) {
          showWarning("كلمة المرور وتأكيد كلمة المرور غير متطابقين");
          return;
        }
      }
      
      // حذف confirm_password قبل الحفظ
      delete submitData.confirm_password;
      
      const userId = editingUser?.get('id');
      let finalUserId = userId;
      
      if (userId) {
        // تحديث مستخدم موجود
        const docRef = firestoreApi.getDocument("users", userId);
        await firestoreApi.updateData(docRef, submitData);
        finalUserId = userId;
      } else {
        // إضافة مستخدم جديد - كلمة المرور مطلوبة
        if (!submitData.password) {
          showWarning("يجب إدخال كلمة المرور للمستخدم الجديد");
          return;
        }
        
        // التحقق من تطابق كلمة المرور
        if (submitData.password !== submitData.confirm_password) {
          showWarning("كلمة المرور وتأكيد كلمة المرور غير متطابقين");
          return;
        }
        const newId = firestoreApi.getNewId("users");
        const docRef = firestoreApi.getDocument("users", newId);
        await firestoreApi.setData(docRef, submitData);
        finalUserId = newId;
      }
      
      // حفظ الصلاحيات في subcollection powers/{userId}/powers (فقط للمستخدمين غير المديرين)
      if (finalUserId && submitData.role !== 'مدير') {
        try {
          // حذف جميع الصلاحيات القديمة أولاً (عند التعديل)
          if (userId) {
            const subCollectionRef = firestoreApi.getSubCollection("powers", finalUserId, "powers");
            const existingPermissions = await firestoreApi.getDocuments(subCollectionRef);
            for (const perm of existingPermissions) {
              const permId = perm.id;
              if (permId) {
                const permDocRef = firestoreApi.getSubDocument("powers", finalUserId, "powers", permId);
                await firestoreApi.deleteData(permDocRef);
              }
            }
          }
          
          // دالة لتطبيع المسار (إزالة الشرطة المائلة في النهاية)
          const normalizePath = (path: string): string => {
            if (!path || path === '/') return '/';
            return path.replace(/\/+$/, ''); // إزالة جميع الشرطات المائلة في النهاية
          };
          
          // حفظ الصلاحيات الجديدة (فقط الصفحات المحددة)
          const permissionsToSave = submitData.permissions || [];
          for (const pagePath of permissionsToSave) {
            if (pagePath && pagePath !== '/') { // لا نحفظ الصفحة الرئيسية
              const normalizedPath = normalizePath(pagePath);
              const permissionId = firestoreApi.getNewId("powers");
              const permissionDocRef = firestoreApi.getSubDocument("powers", finalUserId, "powers", permissionId);
              await firestoreApi.setData(permissionDocRef, {
                page_path: normalizedPath,
                can_view: 1,
                can_add: 0,
                can_edit: 0,
                can_delete: 0,
              });
            }
          }
          console.log(`Saved ${permissionsToSave.length} permissions for user ${finalUserId}`);
        } catch (error) {
          console.error("Error saving permissions:", error);
          // لا نوقف العملية إذا فشل حفظ الصلاحيات
        }
      } else if (finalUserId && submitData.role === 'مدير') {
        // حذف جميع الصلاحيات القديمة للمدير (لأن المدير لا يحتاج صلاحيات محددة)
        try {
          const subCollectionRef = firestoreApi.getSubCollection("powers", finalUserId, "powers");
          const existingPermissions = await firestoreApi.getDocuments(subCollectionRef);
          for (const perm of existingPermissions) {
            const permId = perm.id;
            if (permId) {
              const permDocRef = firestoreApi.getSubDocument("powers", finalUserId, "powers", permId);
              await firestoreApi.deleteData(permDocRef);
            }
          }
        } catch (error) {
          console.error("Error deleting permissions for admin:", error);
        }
      }
      
      setIsModalOpen(false);
      setEditingUser(null);
      setFormData(new BaseModel({ employee_number: '', username: '', full_name: '', email: '', phone: '', department_id: '', office_id: '', role: '', user_type: 'موظف', password: '', confirm_password: '', permissions: [], is_active: true, notes: '' }));
      setShowPassword(false);
      setShowConfirmPassword(false);
      showSuccess(editingUser ? "تم تحديث المستخدم بنجاح" : "تم إضافة المستخدم بنجاح");
      loadData();
    } catch (error) {
      console.error("Error saving user:", error);
      showError("حدث خطأ أثناء الحفظ");
    }
  };

  const handleEdit = async (user: BaseModel) => {
    setEditingUser(user);
    const userData = user.getData();
    userData.is_active = user.getValue<number>('is_active') === 1 || user.getValue<boolean>('is_active') === true;
    // عدم إظهار كلمة المرور عند التعديل
    userData.password = '';
    userData.confirm_password = '';
    
    // دالة لتطبيع المسار (إزالة الشرطة المائلة في النهاية)
    const normalizePath = (path: string): string => {
      if (!path || path === '/') return '/';
      return path.replace(/\/+$/, ''); // إزالة جميع الشرطات المائلة في النهاية
    };
    
    // تحميل الصلاحيات من subcollection powers/{userId}/powers
    const userId = user.get('id');
    if (userId) {
      try {
        const subCollectionRef = firestoreApi.getSubCollection("powers", userId, "powers");
        const permissionDocs = await firestoreApi.getDocuments(subCollectionRef);
        const pagePaths = permissionDocs.map(doc => {
          const data = doc.data();
          return normalizePath(data.page_path || '');
        }).filter(path => path && path !== '/'); // إزالة القيم الفارغة والصفحة الرئيسية
        
        userData.permissions = Array.from(new Set(pagePaths));
        console.log(`Loaded ${userData.permissions.length} permissions from subcollection for user ${userId}`);
      } catch (error) {
        console.error("Error loading permissions:", error);
        // إذا فشل التحميل، نستخدم permissions من بيانات المستخدم
        if (!userData.permissions) {
          userData.permissions = [];
        } else {
          userData.permissions = Array.from(new Set(userData.permissions.map((p: string) => normalizePath(p))));
        }
      }
    } else {
      // التأكد من وجود permissions وإزالة التكرارات
      if (!userData.permissions) {
        userData.permissions = [];
      } else {
        // إزالة التكرارات من الصلاحيات
        userData.permissions = Array.from(new Set(userData.permissions));
      }
    }
    
    // تعيين الإدارة المختارة وتصفية المكاتب
    const departmentId = userData.department_id || '';
    setSelectedDepartmentId(departmentId);
    if (departmentId) {
      const filteredOffices = allOffices.filter(office => office.get('department_id') === departmentId);
      setOffices(filteredOffices);
    } else {
      setOffices([]);
    }
    
    setFormData(new BaseModel(userData));
    setShowPassword(false);
    setShowConfirmPassword(false);
    setIsModalOpen(true);
  };

  const handleDelete = (user: BaseModel) => {
    setDeletingUser(user);
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingUser) return;
    const id = deletingUser.get('id');
    if (!id) return;
    
    try {
      setDeleteLoading(true);
      const docRef = firestoreApi.getDocument("users", id);
      await firestoreApi.deleteData(docRef);
      showSuccess("تم حذف المستخدم بنجاح");
      loadData();
      setIsConfirmModalOpen(false);
      setDeletingUser(null);
    } catch (error) {
      console.error("Error deleting user:", error);
      showError("حدث خطأ أثناء الحذف");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleBulkEdit = (selectedItems: BaseModel[]) => {
    setSelectedUsersForBulkEdit(selectedItems);
    const formDataArray = selectedItems.map(item => {
      const itemData = item.getData();
      itemData.is_active = item.getValue<number>('is_active') === 1 || item.getValue<boolean>('is_active') === true;
      return new BaseModel(itemData);
    });
    setBulkEditFormDataArray(formDataArray);
    
    // تهيئة department IDs و offices لكل مستخدم
    const deptIds: Record<number, string> = {};
    const officesMap: Record<number, BaseModel[]> = {};
    selectedItems.forEach((user, index) => {
      const deptId = user.get('department_id');
      if (deptId) {
        deptIds[index] = deptId;
        const filteredOffices = allOffices.filter(office => office.get('department_id') === deptId);
        officesMap[index] = filteredOffices;
      }
    });
    setBulkEditSelectedDepartmentIds(deptIds);
    setBulkEditOfficesMap(officesMap);
    
    setIsBulkEditModalOpen(true);
  };

  const handleBulkEditSubmit = async (dataArray: Record<string, any>[]) => {
    try {
      setBulkEditLoading(true);

      const updatePromises = dataArray.map(async (item) => {
        if (!item.id) return;
        
        const updates: any = {
          employee_number: item.employee_number || '',
          username: item.username || '',
          full_name: item.full_name || '',
          email: item.email || '',
          phone: item.phone || '',
          department_id: item.department_id || '',
          office_id: item.office_id || '',
          role: item.role || '',
          user_type: item.user_type || 'موظف',
          notes: item.notes || '',
        };
        
        // معالجة is_active
        updates.is_active = item.is_active === true || item.is_active === 1 ? 1 : 0;
        
        const docRef = firestoreApi.getDocument("users", item.id);
        await firestoreApi.updateData(docRef, updates);
      });

      await Promise.all(updatePromises);
      
      setIsBulkEditModalOpen(false);
      setSelectedUsersForBulkEdit([]);
      setBulkEditFormDataArray([]);
      setBulkEditSelectedDepartmentIds({});
      setBulkEditOfficesMap({});
      loadData();
      showSuccess(`تم تحديث ${dataArray.length} مستخدم بنجاح`);
    } catch (error) {
      console.error("Error in bulk edit:", error);
      showError("حدث خطأ أثناء التحديث الجماعي");
    } finally {
      setBulkEditLoading(false);
    }
  };

  const updateBulkEditField = useCallback((index: number, key: string, value: any) => {
    const newArray = [...bulkEditFormDataArray];
    const newData = new BaseModel(newArray[index].getData());
    newData.put(key, value);
    
    // إذا تم تغيير department_id، تحديث offices المتاحة
    if (key === 'department_id') {
      const newDeptIds = { ...bulkEditSelectedDepartmentIds };
      newDeptIds[index] = value;
      setBulkEditSelectedDepartmentIds(newDeptIds);
      
      const newOfficesMap = { ...bulkEditOfficesMap };
      if (value) {
        const filteredOffices = allOffices.filter(office => office.get('department_id') === value);
        newOfficesMap[index] = filteredOffices;
        // إعادة تعيين office_id إذا تغيرت الإدارة
        newData.put('office_id', '');
      } else {
        newOfficesMap[index] = [];
        newData.put('office_id', '');
      }
      setBulkEditOfficesMap(newOfficesMap);
    }
    
    newArray[index] = newData;
    setBulkEditFormDataArray(newArray);
  }, [bulkEditFormDataArray, bulkEditSelectedDepartmentIds, bulkEditOfficesMap, allOffices]);

  const getOfficeName = (officeId?: string) => {
    if (!officeId) return '-';
    const office = allOffices.find(o => o.get('id') === officeId);
    return office?.get('name') || '-';
  };

  const getDepartmentName = (departmentId?: string) => {
    if (!departmentId) return '-';
    const department = departments.find(d => d.get('id') === departmentId);
    return department?.get('name') || '-';
  };

  const handleImportData = async (data: Array<Record<string, any>>) => {
    setImportLoading(true);
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    try {
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        try {
          // دالة مساعدة لاستخراج القيمة من الصف بأسماء مختلفة - مرنة جداً
          const normalizeKey = (key: string): string => {
            // إزالة المسافات والرموز الخاصة وتحويل إلى صغير
            return key.toLowerCase()
              .replace(/\s+/g, '') // إزالة جميع المسافات
              .replace(/[_\-\.,]/g, '') // إزالة الرموز الخاصة
              .trim();
          };

          const getValue = (keys: string[]): string => {
            // أولاً: البحث المباشر بالأسماء المحددة
            for (const key of keys) {
              const value = row[key];
              if (value !== undefined && value !== null && value !== '') {
                return value.toString().trim();
              }
            }

            // ثانياً: البحث في جميع مفاتيح الصف (مرونة عالية)
            const normalizedKeys = keys.map(normalizeKey);
            const rowKeys = Object.keys(row);
            
            for (const rowKey of rowKeys) {
              const normalizedRowKey = normalizeKey(rowKey);
              
              // البحث عن تطابق كامل
              if (normalizedKeys.some(nk => normalizedRowKey === nk)) {
                const value = row[rowKey];
                if (value !== undefined && value !== null && value !== '') {
                  return value.toString().trim();
                }
              }
              
              // البحث عن تطابق جزئي (يحتوي على)
              if (normalizedKeys.some(nk => normalizedRowKey.includes(nk) || nk.includes(normalizedRowKey))) {
                const value = row[rowKey];
                if (value !== undefined && value !== null && value !== '') {
                  return value.toString().trim();
                }
              }
            }

            return '';
          };

          // استخراج البيانات من الصف
          const employeeNumber = getValue(['رقم الموظف', 'employee_number', 'Employee Number', 'رقم_الموظف', 'user_id', 'User ID', 'USER_ID']);
          const username = getValue(['اسم المستخدم', 'username', 'Username', 'اسم_المستخدم', 'user_name', 'User Name', 'USER_NAME']);
          const fullName = getValue(['الاسم الكامل', 'full_name', 'Full Name', 'الاسم_الكامل', 'name', 'Name', 'NAME']);
          const email = getValue(['البريد الإلكتروني', 'email', 'Email', 'البريد_الإلكتروني', 'EMAIL']);
          const phone = getValue(['الهاتف', 'phone', 'Phone']);
          const departmentName = getValue(['الإدارة', 'department', 'Department']);
          const officeName = getValue(['المكتب', 'office', 'Office']);
          const role = getValue(['الدور', 'role', 'Role']) || 'غير المدير';
          // كلمة المرور تساوي رقم الموظف
          const password = employeeNumber || '';
          const isActive = getValue(['نشط', 'is_active', 'Is Active', 'active']) || '1';
          const notes = getValue(['الملاحظات', 'notes', 'Notes']);

          // طباعة البيانات المستخرجة للمساعدة في التصحيح
          console.log(`سطر ${i + 2} - البيانات المستخرجة:`, {
            employeeNumber,
            username,
            fullName,
            email,
            rowKeys: Object.keys(row),
            rowData: row
          });

          // التحقق من الحقول المطلوبة
          if (!employeeNumber) {
            errorCount++;
            errors.push(`سطر ${i + 2}: رقم الموظف فارغ. الأعمدة المتاحة: ${Object.keys(row).join(', ')}`);
            continue;
          }

          if (!username) {
            errorCount++;
            errors.push(`سطر ${i + 2}: اسم المستخدم فارغ. الأعمدة المتاحة: ${Object.keys(row).join(', ')}`);
            continue;
          }

          if (!fullName) {
            errorCount++;
            errors.push(`سطر ${i + 2}: الاسم الكامل فارغ. الأعمدة المتاحة: ${Object.keys(row).join(', ')}`);
            continue;
          }

          // التحقق من عدم تكرار رقم الموظف
          const existingUser = users.find(u => {
            const userEmpNum = u.get('employee_number')?.toString().trim();
            return userEmpNum === employeeNumber;
          });

          if (existingUser) {
            errorCount++;
            errors.push(`سطر ${i + 2}: رقم الموظف "${employeeNumber}" موجود مسبقاً`);
            continue;
          }

          // البحث عن الإدارة بالاسم (اختياري)
          let departmentId = '';
          if (departmentName) {
            const department = departments.find(d => d.get('name') === departmentName);
            if (department) {
              departmentId = department.get('id') || '';
            }
            // لا نعتبر عدم وجود الإدارة خطأ - يمكن أن يكون المستخدم بدون إدارة
          }

          // البحث عن المكتب بالاسم (اختياري)
          let officeId = '';
          if (officeName && departmentId) {
            const office = allOffices.find(o => 
              o.get('name') === officeName && o.get('department_id') === departmentId
            );
            if (office) {
              officeId = office.get('id') || '';
            }
            // لا نعتبر عدم وجود المكتب خطأ - يمكن أن يكون المستخدم بدون مكتب
          }

          // تحديد الدور
          const finalRole = (role === 'مدير' || role === 'admin' || role === 'Admin') ? 'مدير' : 'غير المدير';

          // تحديد حالة النشاط
          const finalIsActive = (isActive === '1' || isActive === 'نعم' || isActive === 'yes' || isActive === 'Yes' || isActive === 'true' || isActive === 'True') ? 1 : 0;

          // إعداد الصلاحيات
          let permissions: string[] = [];
          if (finalRole === 'مدير') {
            permissions = allPages.map(page => page.path);
          }

          // إضافة مستخدم جديد
          const newId = firestoreApi.getNewId("users");
          const docRef = firestoreApi.getDocument("users", newId);
          const userData = {
            employee_number: employeeNumber,
            username: username,
            full_name: fullName,
            email: email || '',
            phone: phone || '',
            department_id: departmentId || '',
            office_id: officeId || '',
            role: finalRole,
            password: password,
            is_active: finalIsActive,
            notes: notes || '',
            permissions: permissions,
          };
          
          console.log(`إضافة مستخدم جديد:`, userData);
          await firestoreApi.setData(docRef, userData);

          // حفظ الصلاحيات في subcollection powers/{userId}/powers (فقط للمستخدمين غير المديرين)
          if (finalRole !== 'مدير' && permissions.length > 0) {
            try {
              const normalizePath = (path: string): string => {
                if (!path || path === '/') return '/';
                return path.replace(/\/+$/, '');
              };

              for (const pagePath of permissions) {
                if (pagePath && pagePath !== '/') {
                  const normalizedPath = normalizePath(pagePath);
                  const permissionId = firestoreApi.getNewId("powers");
                  const permissionDocRef = firestoreApi.getSubDocument("powers", newId, "powers", permissionId);
                  await firestoreApi.setData(permissionDocRef, {
                    page_path: normalizedPath,
                    can_view: 1,
                    can_add: 0,
                    can_edit: 0,
                    can_delete: 0,
                  });
                }
              }
            } catch (error) {
              console.error("Error saving permissions:", error);
            }
          }

          successCount++;
        } catch (error) {
          errorCount++;
          errors.push(`سطر ${i + 2}: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
        }
      }

      if (errorCount > 0) {
        const errorMessage = errors.slice(0, 3).join('، ');
        const moreErrors = errors.length > 3 ? ` و ${errors.length - 3} خطأ آخر` : '';
        showWarning(`تم استيراد ${successCount} مستخدم بنجاح، فشل: ${errorCount}. ${errorMessage}${moreErrors}`, 8000);
      } else {
        showSuccess(`تم استيراد ${successCount} مستخدم بنجاح`);
      }

      loadData();
    } catch (error) {
      console.error("Error importing data:", error);
      throw error;
    } finally {
      setImportLoading(false);
    }
  };

  const handleDepartmentChange = (departmentId: string) => {
    setSelectedDepartmentId(departmentId);
    const newData = new BaseModel(formData.getData());
    newData.put('department_id', departmentId);
    // إعادة تعيين المكتب عند تغيير الإدارة
    newData.put('office_id', '');
    setFormData(newData);
    
    if (departmentId) {
      // تصفية المكاتب بناءً على الإدارة المختارة
      const filteredOffices = allOffices.filter(office => office.get('department_id') === departmentId);
      setOffices(filteredOffices);
    } else {
      // إذا لم يتم اختيار إدارة، لا تظهر أي مكاتب
      setOffices([]);
    }
  };

  // فلترة المستخدمين حسب النوع
  const filteredUsers = userTypeFilter === 'all' 
    ? users 
    : users.filter(user => user.get('user_type') === userTypeFilter);

  const columns = [
    { 
      key: 'employee_number', 
      label: 'رقم الموظف',
      sortable: true,
    },
    { 
      key: 'username', 
      label: 'اسم المستخدم',
      sortable: true,
    },
    { 
      key: 'full_name', 
      label: 'الاسم الكامل',
      sortable: true,
    },
    { 
      key: 'email', 
      label: 'البريد الإلكتروني',
      sortable: true,
    },
    { 
      key: 'phone', 
      label: 'الهاتف',
      sortable: true,
    },
    { 
      key: 'user_type', 
      label: 'نوع المستخدم',
      render: (item: BaseModel) => {
        const userType = item.get('user_type') || 'موظف';
        return (
          <Badge variant={userType === 'موظف' ? 'primary' : 'warning'} size="sm">
            {userType}
          </Badge>
        );
      },
      sortable: true,
    },
    { 
      key: 'department_id', 
      label: 'الإدارة',
      render: (item: BaseModel) => getDepartmentName(item.get('department_id')),
      sortable: true,
    },
    { 
      key: 'office_id', 
      label: 'المكتب',
      render: (item: BaseModel) => getOfficeName(item.get('office_id')),
      sortable: true,
    },
    { 
      key: 'role', 
      label: 'الدور',
      sortable: true,
    },
    { 
      key: 'is_active', 
      label: 'الحالة',
      render: (item: BaseModel) => {
        const isActive = item.getValue<number>('is_active') === 1 || item.getValue<boolean>('is_active') === true;
        return (
          <Badge variant={isActive ? 'success' : 'error'} size="sm">
            {isActive ? 'نشط' : 'غير نشط'}
          </Badge>
        );
      },
    },
    {
      key: 'permissions',
      label: 'الصلاحيات',
      render: (item: BaseModel) => {
        const userId = item.get('id');
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              router.push(`/admin/permissions?userId=${userId}`);
            }}
          >
            إدارة الصلاحيات
          </Button>
        );
      },
    },
  ];

  return (
    <MainLayout>
      {/* Page Header */}
      <div className="mb-4 relative animate-fade-in-down w-full">
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-500/10 to-accent-500/10 rounded-full blur-3xl -z-10 animate-pulse-soft"></div>
        <div className="absolute top-10 left-10 w-48 h-48 bg-gradient-to-br from-success-500/5 to-warning-500/5 rounded-full blur-3xl -z-10 animate-pulse-soft" style={{ animationDelay: '0.5s' }}></div>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-0 w-full">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 flex items-center justify-center shadow-xl shadow-primary-500/40 overflow-hidden group hover:scale-110 material-transition animate-float">
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-transparent opacity-0 group-hover:opacity-100 material-transition"></div>
                <MaterialIcon name="people" className="text-white relative z-10 group-hover:scale-110 material-transition" size="2xl" />
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-white/20 rounded-full blur-sm animate-pulse-soft"></div>
                <div className="absolute -bottom-2 -left-2 w-5 h-5 bg-white/10 rounded-full blur-sm animate-pulse-soft" style={{ animationDelay: '0.3s' }}></div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-3xl sm:text-4xl font-black text-gradient-primary">
                    المستخدمون
                  </h1>
                  <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 bg-primary-50 rounded-full border border-primary-200 animate-fade-in">
                    <MaterialIcon name="people" className="text-primary-600" size="sm" />
                    <span className="text-xs font-semibold text-primary-700">{users.length}</span>
                  </div>
                </div>
                <p className="text-slate-600 text-sm sm:text-base font-semibold flex items-center gap-1.5 animate-fade-in">
                  <MaterialIcon name="info" className="text-slate-400" size="sm" />
                  <span>إدارة وإضافة المستخدمين في النظام</span>
                </p>
              </div>
            </div>
          </div>
          {canAdd && (
            <div className="flex flex-col sm:flex-row gap-2 animate-fade-in-left">
              <Button
                onClick={() => setIsImportModalOpen(true)}
                size="lg"
                variant="outline"
                className="shadow-lg hover:shadow-xl hover:shadow-primary/20 hover:scale-105 material-transition font-bold border-2 hover:border-primary-400 hover:bg-primary-50"
              >
                <span className="flex items-center gap-2">
                  <MaterialIcon name="upload_file" className="w-5 h-5" size="lg" />
                  <span>استيراد من Excel</span>
                </span>
              </Button>
              <Button
                onClick={() => {
                  setEditingUser(null);
                  setFormData(new BaseModel({ employee_number: '', username: '', full_name: '', email: '', phone: '', department_id: '', office_id: '', role: '', user_type: 'موظف', password: '', confirm_password: '', permissions: [], is_active: true, notes: '' }));
          setSelectedDepartmentId('');
          setOffices([]);
          setShowPassword(false);
          setShowConfirmPassword(false);
                  setIsModalOpen(true);
                }}
                size="lg"
                variant="primary"
                className="shadow-2xl shadow-primary-500/40 hover:shadow-2xl hover:shadow-primary-500/50 hover:scale-105 material-transition font-bold"
              >
                <span className="flex items-center gap-2">
                  <MaterialIcon name="add" className="w-5 h-5" size="lg" />
                  <span>إضافة مستخدم جديد</span>
                </span>
              </Button>
            </div>
          )}
        </div>
        
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-500/5 to-accent-500/5 rounded-full blur-3xl -z-10"></div>
      </div>

      {/* Filter Section */}
      <div className="mb-3 p-3 bg-white rounded-xl border-2 border-slate-200/80 shadow-sm animate-fade-in w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full">
          <div className="flex items-center gap-1.5">
            <MaterialIcon name="filter_alt" className="text-primary-600" size="md" />
            <span className="font-bold text-slate-700 text-sm">فلتر حسب نوع المستخدم:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Button
              variant={userTypeFilter === 'all' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setUserTypeFilter('all')}
              className="font-semibold"
            >
              الكل ({users.length})
            </Button>
            <Button
              variant={userTypeFilter === 'موظف' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setUserTypeFilter('موظف')}
              className="font-semibold"
            >
              موظف ({users.filter(u => u.get('user_type') === 'موظف' || !u.get('user_type')).length})
            </Button>
            <Button
              variant={userTypeFilter === 'مستخدم نظام' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setUserTypeFilter('مستخدم نظام')}
              className="font-semibold"
            >
              مستخدم نظام ({users.filter(u => u.get('user_type') === 'مستخدم نظام').length})
            </Button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={filteredUsers}
        columns={columns}
        onEdit={canEdit ? handleEdit : undefined}
        onDelete={canDelete ? handleDelete : undefined}
        onBulkEdit={(canEdit || canDelete) ? handleBulkEdit : undefined}
        onAddNew={canAdd ? () => {
          setEditingUser(null);
          setFormData(new BaseModel({ employee_number: '', username: '', full_name: '', email: '', phone: '', department_id: '', office_id: '', role: '', user_type: 'موظف', password: '', confirm_password: '', permissions: [], is_active: true, notes: '' }));
          setSelectedDepartmentId('');
          setOffices([]);
          setShowPassword(false);
          setShowConfirmPassword(false);
          setIsModalOpen(true);
        } : undefined}
        onView={(item) => {
          // يمكن إضافة صفحة عرض التفاصيل لاحقاً
          handleEdit(item);
        }}
        title="المستخدمون"
        exportFileName="users"
        loading={loading}
      />

        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingUser(null);
            setFormData(new BaseModel({ employee_number: '', username: '', full_name: '', email: '', phone: '', department_id: '', office_id: '', role: '', user_type: 'موظف', password: '', confirm_password: '', permissions: [], is_active: true, notes: '' }));
          setSelectedDepartmentId('');
          setOffices([]);
          setShowPassword(false);
          setShowConfirmPassword(false);
          }}
          title={editingUser ? "تعديل مستخدم" : "إضافة مستخدم جديد"}
          size="full"
          footer={
            <div className="flex flex-col sm:flex-row justify-end gap-3 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingUser(null);
                  setFormData(new BaseModel({ employee_number: '', username: '', full_name: '', email: '', phone: '', department_id: '', office_id: '', role: '', user_type: 'موظف', password: '', confirm_password: '', permissions: [], is_active: true, notes: '' }));
                  setSelectedDepartmentId('');
                  setOffices([]);
                  setShowPassword(false);
                  setShowConfirmPassword(false);
                }}
                size="lg"
                className="w-full sm:w-auto font-bold"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                form="user-form"
                variant="primary"
                size="lg"
                className="w-full sm:w-auto font-bold shadow-xl shadow-primary-500/30"
              >
                {editingUser ? "تحديث" : "حفظ"}
              </Button>
            </div>
          }
        >
          <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="رقم الموظف"
                type="text"
                required
                value={formData.get('employee_number')}
                onChange={(e) => {
                  const newData = new BaseModel(formData.getData());
                  newData.put('employee_number', e.target.value);
                  setFormData(newData);
                }}
                placeholder="أدخل رقم الموظف"
                fullWidth={false}
              />
              <Input
                label="اسم المستخدم"
                type="text"
                required
                value={formData.get('username')}
                onChange={(e) => {
                  const newData = new BaseModel(formData.getData());
                  newData.put('username', e.target.value);
                  setFormData(newData);
                }}
                placeholder="مثال: قائد زيد"
                fullWidth={false}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="الاسم الكامل"
                type="text"
                required
                value={formData.get('full_name')}
                onChange={(e) => {
                  const newData = new BaseModel(formData.getData());
                  newData.put('full_name', e.target.value);
                  setFormData(newData);
                }}
                placeholder="مثال: قائد محمد زيد الشميري"
                fullWidth={false}
              />
              <Input
                label="البريد الإلكتروني"
                type="email"
                value={formData.get('email')}
                onChange={(e) => {
                  const newData = new BaseModel(formData.getData());
                  newData.put('email', e.target.value);
                  setFormData(newData);
                }}
                placeholder="example@email.com"
                fullWidth={false}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="الهاتف"
                type="tel"
                value={formData.get('phone')}
                onChange={(e) => {
                  const newData = new BaseModel(formData.getData());
                  newData.put('phone', e.target.value);
                  setFormData(newData);
                }}
                placeholder="أدخل رقم الهاتف"
                fullWidth={false}
              />
              <SearchableSelect
                label="الدور"
                value={formData.get('role')}
                onChange={(value) => {
                  const newData = new BaseModel(formData.getData());
                  newData.put('role', value);
                  // إذا تم اختيار "مدير"، إعطاء صلاحية لجميع الصفحات
                  if (value === 'مدير') {
                    newData.put('permissions', allPages.map(page => page.path));
                  } else if (value === 'غير المدير') {
                    // إذا تم تغيير الدور من مدير إلى غير مدير، إعادة تعيين الصلاحيات
                    newData.put('permissions', []);
                  }
                  setFormData(newData);
                }}
                options={[
                  { value: 'مدير', label: 'مدير' },
                  { value: 'غير المدير', label: 'غير المدير' },
                ]}
                placeholder="اختر الدور"
                fullWidth={false}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <SearchableSelect
                label="نوع المستخدم"
                value={formData.get('user_type') || 'موظف'}
                onChange={(value) => {
                  const newData = new BaseModel(formData.getData());
                  newData.put('user_type', value);
                  setFormData(newData);
                }}
                options={[
                  { value: 'موظف', label: 'موظف' },
                  { value: 'مستخدم نظام', label: 'مستخدم نظام' },
                ]}
                placeholder="اختر نوع المستخدم"
                fullWidth={false}
              />
              <SearchableSelect
                label="الإدارة"
                value={formData.get('department_id')}
                onChange={(value) => {
                  handleDepartmentChange(value);
                }}
                options={departments.map((dept) => ({
                  value: dept.get('id'),
                  label: dept.get('name'),
                }))}
                placeholder="اختر الإدارة"
                fullWidth={false}
              />
              <SearchableSelect
                label="المكتب"
                value={formData.get('office_id')}
                onChange={(value) => {
                  const newData = new BaseModel(formData.getData());
                  newData.put('office_id', value);
                  setFormData(newData);
                }}
                disabled={!selectedDepartmentId}
                options={offices.map((office) => ({
                  value: office.get('id'),
                  label: office.get('name'),
                }))}
                placeholder={!selectedDepartmentId ? "اختر الإدارة أولاً" : "اختر المكتب"}
                fullWidth={false}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label={editingUser ? "كلمة المرور (اتركها فارغة للحفاظ على الكلمة الحالية)" : "كلمة المرور"}
                type="password"
                required={!editingUser}
                value={formData.get('password')}
                onChange={(e) => {
                  const newData = new BaseModel(formData.getData());
                  newData.put('password', e.target.value);
                  setFormData(newData);
                }}
                placeholder="أدخل كلمة المرور"
                fullWidth={false}
                showPasswordToggle={true}
                isPasswordVisible={showPassword}
                onTogglePassword={() => setShowPassword(!showPassword)}
              />
              {(formData.get('password') || !editingUser) && (
                <Input
                  label="تأكيد كلمة المرور"
                  type="password"
                  required={!editingUser || !!formData.get('password')}
                  value={formData.get('confirm_password')}
                  onChange={(e) => {
                    const newData = new BaseModel(formData.getData());
                    newData.put('confirm_password', e.target.value);
                    setFormData(newData);
                  }}
                  placeholder="أعد إدخال كلمة المرور"
                  fullWidth={false}
                  showPasswordToggle={true}
                  isPasswordVisible={showConfirmPassword}
                  onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              )}
            </div>

            {/* قسم الصلاحيات - يظهر فقط عندما يكون الدور "غير المدير" */}
            {formData.get('role') === 'غير المدير' && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">الصلاحيات</h3>
                  <span className="text-sm text-gray-500">اختر الصفحات التي يمكن للمستخدم الوصول إليها</span>
                </div>
                
                {/* عرض الصفحات المضافة */}
                {(() => {
                  const permissions = Array.from(new Set(formData.getValue<string[]>('permissions') || []));
                  const addedPages = allPages.filter(page => permissions.includes(page.path));
                  
                  if (addedPages.length > 0) {
                    return (
                      <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">الصفحات المضافة:</h4>
                        <div className="flex flex-wrap gap-2">
                          {addedPages.map((page) => (
                            <div
                              key={page.path}
                              className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 border border-primary-200 rounded-lg"
                            >
                              <span className="text-sm text-primary-700 font-medium">{page.label}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const newData = new BaseModel(formData.getData());
                                  // الحصول على الصلاحيات الحالية وإزالة التكرارات أولاً
                                  const currentPermissions = Array.from(new Set(newData.getValue<string[]>('permissions') || []));
                                  // إزالة الصفحة وإزالة أي تكرارات
                                  const filteredPermissions = Array.from(new Set(currentPermissions.filter(p => p !== page.path)));
                                  newData.put('permissions', filteredPermissions);
                                  setFormData(newData);
                                }}
                                className="text-primary-600 hover:text-primary-800 material-transition"
                                title="إزالة"
                              >
                                <MaterialIcon name="close" size="sm" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
                
                {/* قائمة الصفحات المتاحة (بدون المضافة) */}
                {(() => {
                  const permissions = Array.from(new Set(formData.getValue<string[]>('permissions') || []));
                  const availablePages = allPages.filter(page => !permissions.includes(page.path));
                  
                  if (availablePages.length > 0) {
                    return (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">إضافة صفحة جديدة:</h4>
                        <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                          {availablePages.map((page) => {
                            // التحقق مرة أخرى من أن الصفحة غير موجودة في الصلاحيات
                            const permissions = Array.from(new Set(formData.getValue<string[]>('permissions') || []));
                            const isAlreadyAdded = permissions.includes(page.path);
                            
                            if (isAlreadyAdded) {
                              return null; // لا تعرض الصفحة إذا كانت موجودة بالفعل
                            }
                            
                            return (
                              <Checkbox
                                key={page.path}
                                label={page.label}
                                checked={false}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    const newData = new BaseModel(formData.getData());
                                    // الحصول على الصلاحيات الحالية وإزالة التكرارات أولاً
                                    const currentPermissions = Array.from(new Set(newData.getValue<string[]>('permissions') || []));
                                    
                                    // التأكد مرة أخرى من عدم وجود الصفحة قبل الإضافة
                                    if (!currentPermissions.includes(page.path)) {
                                      currentPermissions.push(page.path);
                                    }
                                    
                                    // إزالة التكرارات مرة أخرى للتأكد
                                    const uniquePermissions = Array.from(new Set(currentPermissions));
                                    newData.put('permissions', uniquePermissions);
                                    setFormData(newData);
                                  }
                                }}
                              />
                            );
                          })}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                      <p className="text-sm text-blue-700">تم إضافة جميع الصفحات المتاحة</p>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* عرض الصلاحيات للمدير */}
            {formData.get('role') === 'مدير' && (
              <div className="p-4 bg-primary-50 rounded-xl border border-primary-200">
                <div className="flex items-center gap-2">
                  <span className="text-primary-700 font-semibold">المدير لديه صلاحية كاملة على جميع الصفحات</span>
                </div>
              </div>
            )}

            <Checkbox
              label="نشط"
              checked={formData.getValue<boolean>('is_active') === true || formData.getValue<number>('is_active') === 1}
              onChange={(e) => {
                const newData = new BaseModel(formData.getData());
                newData.put('is_active', e.target.checked);
                setFormData(newData);
              }}
            />

            <Textarea
              label="الملاحظات"
              value={formData.get('notes')}
              onChange={(e) => {
                const newData = new BaseModel(formData.getData());
                newData.put('notes', e.target.value);
                setFormData(newData);
              }}
              rows={1}
              placeholder="أدخل أي ملاحظات إضافية"
            />
          </form>
        </Modal>

        {/* Confirm Delete Modal */}
        <ConfirmModal
          isOpen={isConfirmModalOpen}
          onClose={() => {
            setIsConfirmModalOpen(false);
            setDeletingUser(null);
          }}
          onConfirm={confirmDelete}
          title="تأكيد الحذف"
          message={`هل أنت متأكد من حذف ${deletingUser?.get('full_name') || 'هذا المستخدم'}؟ لا يمكن التراجع عن هذا الإجراء.`}
          confirmText="حذف"
          cancelText="إلغاء"
          variant="danger"
          loading={deleteLoading}
        />

        {/* Import Excel Modal */}
        <ImportExcelModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImport={handleImportData}
          title="استيراد المستخدمين من Excel"
          description="اختر ملف Excel لعرض البيانات ومعاينتها وتعديلها قبل الحفظ. يجب أن يحتوي الملف على الأعمدة: رقم الموظف، اسم المستخدم، الاسم الكامل، البريد الإلكتروني، الهاتف، الإدارة، المكتب، الدور، كلمة المرور، نشط، الملاحظات"
          loading={importLoading}
        />

        {/* Bulk Edit Modal */}
        <BulkEditModal
          isOpen={isBulkEditModalOpen}
          onClose={() => {
            setIsBulkEditModalOpen(false);
            setSelectedUsersForBulkEdit([]);
          }}
          title="تعديل جماعي للمستخدمين"
          items={selectedUsersForBulkEdit.map((user) => ({
            id: user.get('id') || '',
            label: user.get('full_name') || user.get('username') || '',
            data: user.getData(),
          }))}
          fields={[
            {
              name: 'employee_number',
              label: 'رقم الموظف',
              type: 'text',
              placeholder: 'أدخل رقم الموظف',
              icon: 'badge',
            },
            {
              name: 'username',
              label: 'اسم المستخدم',
              type: 'text',
              placeholder: 'أدخل اسم المستخدم',
              icon: 'person',
              required: true,
            },
            {
              name: 'full_name',
              label: 'الاسم الكامل',
              type: 'text',
              placeholder: 'أدخل الاسم الكامل',
              icon: 'account_circle',
              required: true,
            },
            {
              name: 'email',
              label: 'البريد الإلكتروني',
              type: 'text',
              placeholder: 'أدخل البريد الإلكتروني',
              icon: 'email',
            },
            {
              name: 'phone',
              label: 'الهاتف',
              type: 'text',
              placeholder: 'أدخل الهاتف',
              icon: 'phone',
            },
            {
              name: 'department_id',
              label: 'الإدارة',
              type: 'select',
              placeholder: 'اختر الإدارة',
              icon: 'apartment',
              options: departments.map((dept) => ({
                value: dept.get('id'),
                label: dept.get('name'),
              })),
            },
            {
              name: 'office_id',
              label: 'المكتب',
              type: 'select',
              placeholder: 'اختر المكتب',
              icon: 'meeting_room',
              options: allOffices.map((office) => ({
                value: office.get('id'),
                label: office.get('name'),
              })),
            },
            {
              name: 'user_type',
              label: 'نوع المستخدم',
              type: 'select',
              placeholder: 'اختر نوع المستخدم',
              icon: 'category',
              options: [
                { value: 'موظف', label: 'موظف' },
                { value: 'مستخدم نظام', label: 'مستخدم نظام' },
              ],
            },
            {
              name: 'role',
              label: 'الدور',
              type: 'text',
              placeholder: 'أدخل الدور',
              icon: 'work',
            },
            {
              name: 'is_active',
              label: 'نشط',
              type: 'checkbox',
              icon: 'check_circle',
            },
            {
              name: 'notes',
              label: 'الملاحظات',
              type: 'textarea',
              placeholder: 'أدخل الملاحظات',
              icon: 'note',
            },
          ]}
          onSubmit={handleBulkEditSubmit}
          isLoading={bulkEditLoading}
          infoMessage="يمكنك تعديل كل مستخدم بشكل منفصل. سيتم حفظ جميع التعديلات عند الضغط على 'حفظ جميع التعديلات'."
        />
    </MainLayout>
  );
}

export default function UsersPage() {
  return (
    <ProtectedRoute>
      <UsersPageContent />
    </ProtectedRoute>
  );
}
