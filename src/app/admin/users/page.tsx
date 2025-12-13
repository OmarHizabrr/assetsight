'use client';

import { ProtectedRoute, usePermissions } from "@/components/auth/ProtectedRoute";
import { PlusIcon, UserIcon } from "@/components/icons";
import { MaterialIcon } from "@/components/icons/MaterialIcon";
import { MainLayout } from "@/components/layout/MainLayout";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { DataTable } from "@/components/ui/DataTable";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { BaseModel } from "@/lib/BaseModel";
import { firestoreApi } from "@/lib/FirestoreApi";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function UsersPageContent() {
  const pathname = usePathname();
  const { canAdd, canEdit, canDelete } = usePermissions(pathname || '/admin/users');
  const router = useRouter();
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
    password: '',
    confirm_password: '',
    permissions: [] as string[],
    is_active: true,
    notes: '',
  }));
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
        alert("يجب إدخال رقم الموظف");
        return;
      }
      
      // التحقق من عدم تكرار رقم الموظف
      const existingUser = users.find(u => {
        const userEmpNum = u.get('employee_number')?.trim();
        const isSameUser = editingUser?.get('id') === u.get('id');
        return userEmpNum === employeeNumber && !isSameUser;
      });
      
      if (existingUser) {
        alert("رقم الموظف موجود بالفعل. يرجى استخدام رقم آخر");
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
          alert("كلمة المرور وتأكيد كلمة المرور غير متطابقين");
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
          alert("يجب إدخال كلمة المرور للمستخدم الجديد");
          return;
        }
        
        // التحقق من تطابق كلمة المرور
        if (submitData.password !== submitData.confirm_password) {
          alert("كلمة المرور وتأكيد كلمة المرور غير متطابقين");
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
      setFormData(new BaseModel({ employee_number: '', username: '', full_name: '', email: '', phone: '', office_id: '', role: '', password: '', confirm_password: '', permissions: [], is_active: true, notes: '' }));
      setShowPassword(false);
      setShowConfirmPassword(false);
      loadData();
    } catch (error) {
      console.error("Error saving user:", error);
      alert("حدث خطأ أثناء الحفظ");
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
      loadData();
      setIsConfirmModalOpen(false);
      setDeletingUser(null);
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("حدث خطأ أثناء الحذف");
    } finally {
      setDeleteLoading(false);
    }
  };

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

  const columns = [
    { 
      key: 'employee_number', 
      label: 'رقم الموظف',
      render: (item: BaseModel) => item.get('employee_number'),
    },
    { 
      key: 'username', 
      label: 'اسم المستخدم',
      render: (item: BaseModel) => item.get('username'),
    },
    { 
      key: 'full_name', 
      label: 'الاسم الكامل',
      render: (item: BaseModel) => item.get('full_name'),
    },
    { 
      key: 'email', 
      label: 'البريد الإلكتروني',
      render: (item: BaseModel) => item.get('email'),
    },
    { 
      key: 'phone', 
      label: 'الهاتف',
      render: (item: BaseModel) => item.get('phone'),
    },
    { 
      key: 'department_id', 
      label: 'الإدارة',
      render: (item: BaseModel) => getDepartmentName(item.get('department_id')),
    },
    { 
      key: 'office_id', 
      label: 'المكتب',
      render: (item: BaseModel) => getOfficeName(item.get('office_id')),
    },
    { 
      key: 'role', 
      label: 'الدور',
      render: (item: BaseModel) => item.get('role'),
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
      <div className="mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-6">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 flex items-center justify-center shadow-2xl shadow-primary-500/40 relative overflow-hidden group hover:scale-105 material-transition">
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-transparent opacity-0 group-hover:opacity-100 material-transition"></div>
                <UserIcon className="w-7 h-7 text-white relative z-10" />
              </div>
              <div className="flex-1">
                <h1 className="text-5xl font-black bg-gradient-to-r from-slate-900 via-primary-700 to-slate-900 bg-clip-text text-transparent mb-2">المستخدمون</h1>
                <p className="text-slate-600 text-lg font-semibold">إدارة وإضافة المستخدمين في النظام</p>
              </div>
            </div>
          </div>
          {canAdd && (
            <Button
              onClick={() => {
                setEditingUser(null);
                setFormData(new BaseModel({ employee_number: '', username: '', full_name: '', email: '', phone: '', department_id: '', office_id: '', role: '', password: '', confirm_password: '', permissions: [], is_active: true, notes: '' }));
          setSelectedDepartmentId('');
          setOffices([]);
          setShowPassword(false);
          setShowConfirmPassword(false);
                setIsModalOpen(true);
              }}
              leftIcon={<PlusIcon className="w-5 h-5" />}
              size="lg"
              variant="primary"
              className="shadow-2xl shadow-primary-500/40 hover:shadow-2xl hover:shadow-primary-500/50 hover:scale-105 material-transition font-bold"
            >
              إضافة مستخدم جديد
            </Button>
          )}
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={users}
        columns={columns}
        onEdit={canEdit ? handleEdit : undefined}
        onDelete={canDelete ? handleDelete : undefined}
        onAddNew={canAdd ? () => {
          setEditingUser(null);
          setFormData(new BaseModel({ employee_number: '', username: '', full_name: '', email: '', phone: '', department_id: '', office_id: '', role: '', password: '', confirm_password: '', permissions: [], is_active: true, notes: '' }));
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
            setFormData(new BaseModel({ employee_number: '', username: '', full_name: '', email: '', phone: '', department_id: '', office_id: '', role: '', password: '', confirm_password: '', permissions: [], is_active: true, notes: '' }));
          setSelectedDepartmentId('');
          setOffices([]);
          setShowPassword(false);
          setShowConfirmPassword(false);
          }}
          title={editingUser ? "تعديل مستخدم" : "إضافة مستخدم جديد"}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
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
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
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
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
              />
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
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="الإدارة"
                value={formData.get('department_id')}
                onChange={(e) => {
                  handleDepartmentChange(e.target.value);
                }}
                options={[
                  { value: '', label: '-- اختر الإدارة --' },
                  ...departments.map((dept) => ({
                    value: dept.get('id'),
                    label: dept.get('name'),
                  })),
                ]}
              />
              <Select
                label="المكتب"
                value={formData.get('office_id')}
                onChange={(e) => {
                  const newData = new BaseModel(formData.getData());
                  newData.put('office_id', e.target.value);
                  setFormData(newData);
                }}
                disabled={!selectedDepartmentId}
                options={[
                  { value: '', label: selectedDepartmentId ? '-- اختر المكتب --' : '-- اختر الإدارة أولاً --' },
                  ...offices.map((office) => ({
                    value: office.get('id'),
                    label: office.get('name'),
                  })),
                ]}
              />
              <Select
                label="الدور"
                value={formData.get('role')}
                onChange={(e) => {
                  const newData = new BaseModel(formData.getData());
                  newData.put('role', e.target.value);
                  // إذا تم اختيار "مدير"، إعطاء صلاحية لجميع الصفحات
                  if (e.target.value === 'مدير') {
                    newData.put('permissions', allPages.map(page => page.path));
                  } else if (e.target.value === 'غير المدير') {
                    // إذا تم تغيير الدور من مدير إلى غير مدير، إعادة تعيين الصلاحيات
                    newData.put('permissions', []);
                  }
                  setFormData(newData);
                }}
                options={[
                  { value: 'مدير', label: 'مدير' },
                  { value: 'غير المدير', label: 'غير المدير' },
                ]}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <Input
                  label={editingUser ? "كلمة المرور (اتركها فارغة للحفاظ على الكلمة الحالية)" : "كلمة المرور"}
                  type={showPassword ? "text" : "password"}
                  required={!editingUser}
                  value={formData.get('password')}
                  onChange={(e) => {
                    const newData = new BaseModel(formData.getData());
                    newData.put('password', e.target.value);
                    setFormData(newData);
                  }}
                  placeholder="أدخل كلمة المرور"
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-500 hover:text-slate-700 material-transition cursor-pointer"
                      tabIndex={-1}
                    >
                      <MaterialIcon 
                        name={showPassword ? "visibility_off" : "visibility"} 
                        size="md" 
                      />
                    </button>
                  }
                />
              </div>
              {(formData.get('password') || !editingUser) && (
                <div className="relative">
                  <Input
                    label="تأكيد كلمة المرور"
                    type={showConfirmPassword ? "text" : "password"}
                    required={!editingUser || !!formData.get('password')}
                    value={formData.get('confirm_password')}
                    onChange={(e) => {
                      const newData = new BaseModel(formData.getData());
                      newData.put('confirm_password', e.target.value);
                      setFormData(newData);
                    }}
                    placeholder="أعد إدخال كلمة المرور"
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="text-slate-500 hover:text-slate-700 material-transition cursor-pointer"
                        tabIndex={-1}
                      >
                        <MaterialIcon 
                          name={showConfirmPassword ? "visibility_off" : "visibility"} 
                          size="md" 
                        />
                      </button>
                    }
                  />
                </div>
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
              rows={3}
              placeholder="أدخل أي ملاحظات إضافية"
            />

            <div className="flex justify-end gap-4 pt-6 border-t-2 border-slate-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingUser(null);
                  setFormData(new BaseModel({ employee_number: '', username: '', full_name: '', email: '', phone: '', department_id: '', office_id: '', role: '', password: '', confirm_password: '', permissions: [], is_active: true, notes: '' }));
          setSelectedDepartmentId('');
          setOffices([]);
          setShowPassword(false);
          setShowConfirmPassword(false);
                }}
                size="lg"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="lg"
              >
                {editingUser ? "تحديث" : "حفظ"}
              </Button>
            </div>
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
