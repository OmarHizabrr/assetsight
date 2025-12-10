'use client';

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PlusIcon } from "@/components/icons";
import { MainLayout } from "@/components/layout/MainLayout";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { DataTable } from "@/components/ui/DataTable";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { BaseModel } from "@/lib/BaseModel";
import { firestoreApi } from "@/lib/FirestoreApi";
import { useEffect, useState } from "react";

function UsersPageContent() {
  const [users, setUsers] = useState<BaseModel[]>([]);
  const [offices, setOffices] = useState<BaseModel[]>([]);
  const [departments, setDepartments] = useState<BaseModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<BaseModel | null>(null);
  const [formData, setFormData] = useState<BaseModel>(new BaseModel({
    username: '',
    full_name: '',
    email: '',
    phone: '',
    office_id: '',
    role: '',
    is_active: true,
    notes: '',
  }));

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
      const allOffices: BaseModel[] = [];
      for (const dept of departmentsData) {
        const deptId = dept.get('id');
        if (deptId) {
          const subCollectionRef = firestoreApi.getSubCollection("departments", deptId, "departments");
          const officeDocs = await firestoreApi.getDocuments(subCollectionRef);
          const offices = BaseModel.fromFirestoreArray(officeDocs);
          offices.forEach(office => {
            office.put('department_id', deptId);
            allOffices.push(office);
          });
        }
      }
      setOffices(allOffices);
      
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
      
      const userId = editingUser?.get('id');
      
      if (userId) {
        // تحديث مستخدم موجود
        const docRef = firestoreApi.getDocument("users", userId);
        await firestoreApi.updateData(docRef, submitData);
      } else {
        // إضافة مستخدم جديد
        const newId = firestoreApi.getNewId("users");
        const docRef = firestoreApi.getDocument("users", newId);
        await firestoreApi.setData(docRef, submitData);
      }
      setIsModalOpen(false);
      setEditingUser(null);
      setFormData(new BaseModel({ username: '', full_name: '', email: '', phone: '', office_id: '', role: '', is_active: true, notes: '' }));
      loadData();
    } catch (error) {
      console.error("Error saving user:", error);
      alert("حدث خطأ أثناء الحفظ");
    }
  };

  const handleEdit = (user: BaseModel) => {
    setEditingUser(user);
    const userData = user.getData();
    userData.is_active = user.getValue<number>('is_active') === 1 || user.getValue<boolean>('is_active') === true;
    setFormData(new BaseModel(userData));
    setIsModalOpen(true);
  };

  const handleDelete = async (user: BaseModel) => {
    const id = user.get('id');
    if (!id) return;
    if (!confirm(`هل أنت متأكد من حذف ${user.get('full_name')}؟`)) return;
    
    try {
      const docRef = firestoreApi.getDocument("users", id);
      await firestoreApi.deleteData(docRef);
      loadData();
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("حدث خطأ أثناء الحذف");
    }
  };

  const getOfficeName = (officeId?: string) => {
    if (!officeId) return '-';
    const office = offices.find(o => o.get('id') === officeId);
    return office?.get('name') || '-';
  };

  const columns = [
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
  ];

  return (
    <MainLayout>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
                <UserIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">المستخدمون</h1>
                <p className="text-slate-600 text-base mt-1 font-medium">إدارة وإضافة المستخدمين في النظام</p>
              </div>
            </div>
          </div>
          <Button
            onClick={() => {
              setEditingUser(null);
              setFormData(new BaseModel({ username: '', full_name: '', email: '', phone: '', office_id: '', role: '', is_active: true, notes: '' }));
              setIsModalOpen(true);
            }}
            leftIcon={<PlusIcon className="w-5 h-5" />}
            size="lg"
            className="shadow-xl shadow-primary-500/30 hover:shadow-2xl hover:shadow-primary-500/40 hover:scale-105 material-transition"
          >
            إضافة مستخدم جديد
          </Button>
        </div>
      </div>

      {/* Data Table Card */}
      <Card variant="elevated" className="shadow-2xl border-0 bg-white/80 backdrop-blur-xl overflow-hidden">
        <CardBody padding="none">
          <DataTable
            data={users}
            columns={columns}
            onEdit={handleEdit}
            onDelete={handleDelete}
            loading={loading}
          />
        </CardBody>
      </Card>

        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingUser(null);
            setFormData(new BaseModel({ username: '', full_name: '', email: '', phone: '', office_id: '', role: '', is_active: true, notes: '' }));
          }}
          title={editingUser ? "تعديل مستخدم" : "إضافة مستخدم جديد"}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
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
                placeholder="أدخل اسم المستخدم"
              />
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
                placeholder="أدخل الاسم الكامل"
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
                label="المكتب"
                value={formData.get('office_id')}
                onChange={(e) => {
                  const newData = new BaseModel(formData.getData());
                  newData.put('office_id', e.target.value);
                  setFormData(newData);
                }}
                options={offices.map((office) => ({
                  value: office.get('id'),
                  label: office.get('name'),
                }))}
              />
              <Input
                label="الدور"
                type="text"
                value={formData.get('role')}
                onChange={(e) => {
                  const newData = new BaseModel(formData.getData());
                  newData.put('role', e.target.value);
                  setFormData(newData);
                }}
                placeholder="مثل: مدير، موظف، إلخ"
              />
            </div>

            <Checkbox
              label="نشط"
              checked={formData.getValue<boolean>('is_active') === true || formData.getValue<number>('is_active') === 1}
              onChange={(e) => {
                const newData = new BaseModel(formData.getData());
                newData.put('is_active', e.target.checked);
                setFormData(newData);
              }}
            />

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                الملاحظات
              </label>
              <textarea
                value={formData.get('notes')}
                onChange={(e) => {
                  const newData = new BaseModel(formData.getData());
                  newData.put('notes', e.target.value);
                  setFormData(newData);
                }}
                rows={3}
                placeholder="أدخل أي ملاحظات إضافية"
                className="block w-full rounded-xl border-2 border-slate-200 bg-white/80 backdrop-blur-sm px-4 py-3 text-sm font-medium material-transition focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white shadow-sm focus:shadow-md disabled:opacity-50 disabled:cursor-not-allowed resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-secondary-300">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                size="md"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
              >
                {editingUser ? "تحديث" : "حفظ"}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
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
