'use client';

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PlusIcon, UserIcon } from "@/components/icons";
import { MaterialIcon } from "@/components/icons/MaterialIcon";
import { MainLayout } from "@/components/layout/MainLayout";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { DataTable } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { useToast } from "@/contexts/ToastContext";
import { BaseModel } from "@/lib/BaseModel";
import { firestoreApi } from "@/lib/FirestoreApi";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

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

function PermissionsPageContent() {
  const searchParams = useSearchParams();
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  const [users, setUsers] = useState<BaseModel[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [permissions, setPermissions] = useState<BaseModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [deletingPermission, setDeletingPermission] = useState<BaseModel | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editingPermission, setEditingPermission] = useState<BaseModel | null>(null);
  const [formData, setFormData] = useState<BaseModel>(new BaseModel({
    page_path: '',
    can_view: true,
    can_add: false,
    can_edit: false,
    can_delete: false,
  }));

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const userDocs = await firestoreApi.getDocuments(firestoreApi.getCollection("users"));
      const usersData = BaseModel.fromFirestoreArray(userDocs);
      setUsers(usersData);
    } catch (error) {
      console.error("Error loading data:", error);
      showError("حدث خطأ أثناء تحميل المستخدمين");
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const loadPermissions = useCallback(async () => {
    if (!selectedUserId) {
      setPermissions([]);
      return;
    }
    
    try {
      setLoading(true);
      const subCollectionRef = firestoreApi.getSubCollection("powers", selectedUserId, "powers");
      const permissionDocs = await firestoreApi.getDocuments(subCollectionRef);
      const permissionsData = BaseModel.fromFirestoreArray(permissionDocs);
      console.log("Loaded permissions:", permissionsData.length, permissionsData);
      setPermissions(permissionsData);
    } catch (error) {
      console.error("Error loading permissions:", error);
      showError("حدث خطأ أثناء تحميل الصلاحيات");
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, [selectedUserId, showError]);

  useEffect(() => {
    loadData();
    // قراءة userId من query parameters
    const userId = searchParams.get('userId');
    if (userId) {
      setSelectedUserId(userId);
    }
  }, [searchParams, loadData]);

  useEffect(() => {
    if (selectedUserId) {
      loadPermissions();
    } else {
      setPermissions([]);
    }
  }, [selectedUserId, loadPermissions]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      showWarning("يرجى اختيار مستخدم أولاً");
      return;
    }

    try {
      // دالة لتطبيع المسار (إزالة الشرطة المائلة في النهاية)
      const normalizePath = (path: string): string => {
        if (!path || path === '/') return '/';
        return path.replace(/\/+$/, ''); // إزالة جميع الشرطات المائلة في النهاية
      };
      
      const submitData = formData.getData();
      submitData.can_view = formData.getValue<boolean>('can_view') ? 1 : 0;
      submitData.can_add = formData.getValue<boolean>('can_add') ? 1 : 0;
      submitData.can_edit = formData.getValue<boolean>('can_edit') ? 1 : 0;
      submitData.can_delete = formData.getValue<boolean>('can_delete') ? 1 : 0;
      
      // تطبيع المسار قبل الحفظ
      if (submitData.page_path) {
        submitData.page_path = normalizePath(submitData.page_path);
      }

      const permissionId = editingPermission?.get('id');
      
      if (permissionId) {
        // تحديث صلاحية موجودة
        const docRef = firestoreApi.getSubDocument("powers", selectedUserId, "powers", permissionId);
        await firestoreApi.updateData(docRef, submitData);
        showSuccess("تم تحديث الصلاحية بنجاح");
      } else {
        // إضافة صلاحية جديدة - التحقق من عدم تكرار الصفحة
        const pagePath = submitData.page_path;
        const existingPermission = permissions.find(p => {
          const existingPath = normalizePath(p.get('page_path') || '');
          return existingPath === pagePath;
        });
        
        if (existingPermission) {
          showWarning("هذه الصفحة موجودة بالفعل في الصلاحيات. يرجى اختيار صفحة أخرى أو تعديل الصلاحية الموجودة");
          return;
        }
        
        const newId = firestoreApi.getNewId("powers");
        const docRef = firestoreApi.getSubDocument("powers", selectedUserId, "powers", newId);
        console.log("Saving permission:", submitData, "to:", docRef.path);
        await firestoreApi.setData(docRef, submitData);
        console.log("Permission saved successfully");
        showSuccess("تم إضافة الصلاحية بنجاح");
      }
      
      setIsModalOpen(false);
      setEditingPermission(null);
      setFormData(new BaseModel({
        page_path: '',
        can_view: true,
        can_add: false,
        can_edit: false,
        can_delete: false,
      }));
      // إعادة تحميل الصلاحيات بعد الحفظ
      await loadPermissions();
    } catch (error) {
      console.error("Error saving permission:", error);
      showError("حدث خطأ أثناء الحفظ");
    }
  }, [selectedUserId, formData, editingPermission, permissions, loadPermissions, showSuccess, showError, showWarning]);

  const handleEdit = (permission: BaseModel) => {
    setEditingPermission(permission);
    const permissionData = permission.getData();
    permissionData.can_view = permission.getValue<number>('can_view') === 1 || permission.getValue<boolean>('can_view') === true;
    permissionData.can_add = permission.getValue<number>('can_add') === 1 || permission.getValue<boolean>('can_add') === true;
    permissionData.can_edit = permission.getValue<number>('can_edit') === 1 || permission.getValue<boolean>('can_edit') === true;
    permissionData.can_delete = permission.getValue<number>('can_delete') === 1 || permission.getValue<boolean>('can_delete') === true;
    setFormData(new BaseModel(permissionData));
    setIsModalOpen(true);
  };

  const handleDelete = (permission: BaseModel) => {
    setDeletingPermission(permission);
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = useCallback(async () => {
    if (!deletingPermission || !selectedUserId) return;
    const id = deletingPermission.get('id');
    if (!id) return;
    
    try {
      setDeleteLoading(true);
      const docRef = firestoreApi.getSubDocument("powers", selectedUserId, "powers", id);
      await firestoreApi.deleteData(docRef);
      showSuccess("تم حذف الصلاحية بنجاح");
      loadPermissions();
      setIsConfirmModalOpen(false);
      setDeletingPermission(null);
    } catch (error) {
      console.error("Error deleting permission:", error);
      showError("حدث خطأ أثناء الحذف");
    } finally {
      setDeleteLoading(false);
    }
  }, [deletingPermission, selectedUserId, loadPermissions, showSuccess, showError]);

  const getUserName = useCallback((userId?: string) => {
    if (!userId) return '-';
    const user = users.find(u => u.get('id') === userId);
    return user?.get('full_name') || user?.get('username') || '-';
  }, [users]);

  const getPageLabel = useCallback((path?: string) => {
    if (!path) return '-';
    const page = allPages.find(p => p.path === path);
    return page?.label || path;
  }, []);

  const columns = useMemo(() => [
    { 
      key: 'page_path', 
      label: 'الصفحة',
      render: (item: BaseModel) => getPageLabel(item.get('page_path')),
      sortable: true,
    },
    { 
      key: 'can_view', 
      label: 'عرض',
      render: (item: BaseModel) => {
        const canView = item.getValue<number>('can_view') === 1 || item.getValue<boolean>('can_view') === true;
        return (
          <Badge variant={canView ? 'success' : 'error'} size="sm">
            {canView ? 'نعم' : 'لا'}
          </Badge>
        );
      },
      sortable: true,
    },
    { 
      key: 'can_add', 
      label: 'إضافة',
      render: (item: BaseModel) => {
        const canAdd = item.getValue<number>('can_add') === 1 || item.getValue<boolean>('can_add') === true;
        return (
          <Badge variant={canAdd ? 'success' : 'error'} size="sm">
            {canAdd ? 'نعم' : 'لا'}
          </Badge>
        );
      },
      sortable: true,
    },
    { 
      key: 'can_edit', 
      label: 'تعديل',
      render: (item: BaseModel) => {
        const canEdit = item.getValue<number>('can_edit') === 1 || item.getValue<boolean>('can_edit') === true;
        return (
          <Badge variant={canEdit ? 'success' : 'error'} size="sm">
            {canEdit ? 'نعم' : 'لا'}
          </Badge>
        );
      },
      sortable: true,
    },
    { 
      key: 'can_delete', 
      label: 'حذف',
      render: (item: BaseModel) => {
        const canDelete = item.getValue<number>('can_delete') === 1 || item.getValue<boolean>('can_delete') === true;
        return (
          <Badge variant={canDelete ? 'success' : 'error'} size="sm">
            {canDelete ? 'نعم' : 'لا'}
          </Badge>
        );
      },
      sortable: true,
    },
  ], [getPageLabel]);

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
                <h1 className="text-5xl font-black bg-gradient-to-r from-slate-900 via-primary-700 to-slate-900 bg-clip-text text-transparent mb-2">إدارة الصلاحيات</h1>
                <p className="text-slate-600 text-lg font-semibold">إدارة صلاحيات المستخدمين على الصفحات والعمليات</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Select User */}
      <div className="mb-6">
        <SearchableSelect
          label="اختر المستخدم"
          value={selectedUserId}
          onChange={(value) => {
            const userId = value;
            console.log("User selected:", userId);
            setSelectedUserId(userId);
          }}
          options={users.map((user) => ({
            value: user.get('id'),
            label: `${user.get('full_name') || user.get('username')} (${user.get('username') || user.get('employee_number')})`,
          }))}
          placeholder="ابحث واختر المستخدم"
        />
      </div>

      {selectedUserId && (
        <>
          {/* Add Button */}
          <div className="mb-6 flex justify-end">
            <Button
              onClick={() => {
                setEditingPermission(null);
                setFormData(new BaseModel({
                  page_path: '',
                  can_view: true,
                  can_add: false,
                  can_edit: false,
                  can_delete: false,
                }));
                setIsModalOpen(true);
              }}
              leftIcon={<PlusIcon className="w-5 h-5" />}
              size="lg"
              variant="primary"
              className="shadow-2xl shadow-primary-500/40 hover:shadow-2xl hover:shadow-primary-500/50 hover:scale-105 material-transition font-bold"
            >
              إضافة صلاحية جديدة
            </Button>
          </div>

          {/* Info Message */}
          {!loading && permissions.length === 0 && (
            <div className="mb-6 p-6 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-start gap-4">
                <MaterialIcon name="info" className="text-blue-600 text-2xl mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-1">لا توجد صلاحيات</h3>
                  <p className="text-blue-700">لم يتم إضافة أي صلاحيات لهذا المستخدم بعد. اضغط على زر "إضافة صلاحية جديدة" لإضافة صلاحيات.</p>
                </div>
              </div>
            </div>
          )}

          {/* Data Table */}
          <DataTable
            data={permissions}
            columns={columns}
            onEdit={handleEdit}
            onDelete={handleDelete}
            loading={loading}
          />
        </>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPermission(null);
          setFormData(new BaseModel({
            page_path: '',
            can_view: true,
            can_add: false,
            can_edit: false,
            can_delete: false,
          }));
        }}
        title={editingPermission ? "تعديل صلاحية" : "إضافة صلاحية جديدة"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <SearchableSelect
            label="الصفحة"
            value={formData.get('page_path')}
            onChange={(value) => {
              const newData = new BaseModel(formData.getData());
              newData.put('page_path', value);
              setFormData(newData);
            }}
            required
            options={(() => {
              // عند التعديل، نعرض جميع الصفحات
              if (editingPermission) {
                return allPages.map((page) => ({
                  value: page.path,
                  label: page.label,
                }));
              }
              
              // عند الإضافة، نعرض فقط الصفحات غير المضافة
              const addedPagePaths = permissions.map(p => p.get('page_path'));
              const availablePages = allPages.filter(page => !addedPagePaths.includes(page.path));
              
              return availablePages.map((page) => ({
                value: page.path,
                label: page.label,
              }));
            })()}
            placeholder="ابحث واختر الصفحة"
          />

          <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">الصلاحيات</h3>
            
            <Checkbox
              label="عرض (View)"
              checked={formData.getValue<boolean>('can_view') === true || formData.getValue<number>('can_view') === 1}
              onChange={(e) => {
                const newData = new BaseModel(formData.getData());
                newData.put('can_view', e.target.checked);
                setFormData(newData);
              }}
            />

            <Checkbox
              label="إضافة (Add)"
              checked={formData.getValue<boolean>('can_add') === true || formData.getValue<number>('can_add') === 1}
              onChange={(e) => {
                const newData = new BaseModel(formData.getData());
                newData.put('can_add', e.target.checked);
                setFormData(newData);
              }}
            />

            <Checkbox
              label="تعديل (Edit)"
              checked={formData.getValue<boolean>('can_edit') === true || formData.getValue<number>('can_edit') === 1}
              onChange={(e) => {
                const newData = new BaseModel(formData.getData());
                newData.put('can_edit', e.target.checked);
                setFormData(newData);
              }}
            />

            <Checkbox
              label="حذف (Delete)"
              checked={formData.getValue<boolean>('can_delete') === true || formData.getValue<number>('can_delete') === 1}
              onChange={(e) => {
                const newData = new BaseModel(formData.getData());
                newData.put('can_delete', e.target.checked);
                setFormData(newData);
              }}
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t-2 border-slate-200/60 bg-gradient-to-r from-slate-50/50 via-transparent to-slate-50/50 -mx-6 -mb-6 px-6 pb-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                setEditingPermission(null);
                setFormData(new BaseModel({
                  page_path: '',
                  can_view: true,
                  can_add: false,
                  can_edit: false,
                  can_delete: false,
                }));
              }}
              size="lg"
              className="w-full sm:w-auto font-bold"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full sm:w-auto font-bold shadow-xl shadow-primary-500/30"
            >
              {editingPermission ? "تحديث" : "حفظ"}
            </Button>
          </div>
          </form>
        </Modal>

        {/* Confirm Delete Modal */}
        <ConfirmModal
          isOpen={isConfirmModalOpen}
          onClose={() => {
            setIsConfirmModalOpen(false);
            setDeletingPermission(null);
          }}
          onConfirm={confirmDelete}
          title="تأكيد الحذف"
          message="هل أنت متأكد من حذف هذه الصلاحية؟ لا يمكن التراجع عن هذا الإجراء."
          confirmText="حذف"
          cancelText="إلغاء"
          variant="danger"
          loading={deleteLoading}
        />
    </MainLayout>
  );
}

export default function PermissionsPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="flex items-center justify-center h-64">جاري التحميل...</div>}>
        <PermissionsPageContent />
      </Suspense>
    </ProtectedRoute>
  );
}

