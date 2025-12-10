'use client';

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MainLayout } from "@/components/layout/MainLayout";
import { DataTable } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
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
      
      // جلب جميع المستخدمين من جميع المكاتب
      const allUsers: BaseModel[] = [];
      for (const office of allOffices) {
        const officeId = office.get('id');
        const deptId = office.get('department_id');
        if (officeId && deptId) {
          const nestedSubCollectionRef = firestoreApi.getNestedSubCollection(
            "departments",
            deptId,
            "departments",
            officeId,
            "users"
          );
          const userDocs = await firestoreApi.getDocuments(nestedSubCollectionRef);
          const users = BaseModel.fromFirestoreArray(userDocs);
          users.forEach(user => {
            user.put('office_id', officeId);
            allUsers.push(user);
          });
        }
      }
      setUsers(allUsers);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const officeId = formData.get('office_id');
    if (!officeId) {
      alert("يرجى اختيار المكتب");
      return;
    }
    
    const office = offices.find(o => o.get('id') === officeId);
    if (!office) {
      alert("معلومات المكتب غير صحيحة");
      return;
    }
    
    const deptId = office.get('department_id');
    if (!deptId) {
      alert("معلومات المكتب غير صحيحة");
      return;
    }
    
    try {
      const submitData = formData.getData();
      submitData.is_active = formData.getValue<boolean>('is_active') ? 1 : 0;
      
      const userId = editingUser?.get('id');
      const editingOfficeId = editingUser?.get('office_id');
      
      if (userId && editingOfficeId) {
        const userOffice = offices.find(o => o.get('id') === editingOfficeId);
        const userDeptId = userOffice?.get('department_id');
        if (userDeptId) {
          const docRef = firestoreApi.getNestedSubDocument(
            "departments",
            userDeptId,
            "departments",
            editingOfficeId,
            "users",
            userId
          );
          await firestoreApi.updateData(docRef, submitData);
        }
      } else {
        const newId = firestoreApi.getNewId("users");
        const docRef = firestoreApi.getNestedSubDocument(
          "departments",
          deptId,
          "departments",
          officeId,
          "users",
          newId
        );
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
    const officeId = user.get('office_id');
    if (!id || !officeId) return;
    if (!confirm(`هل أنت متأكد من حذف ${user.get('full_name')}؟`)) return;
    
    try {
      const office = offices.find(o => o.get('id') === officeId);
      const deptId = office?.get('department_id');
      if (deptId) {
        const docRef = firestoreApi.getNestedSubDocument(
          "departments",
          deptId,
          "departments",
          officeId,
          "users",
          id
        );
        await firestoreApi.deleteData(docRef);
      }
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
        return isActive ? 'نشط' : 'غير نشط';
      },
    },
  ];

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">المستخدمون</h1>
          <button
            onClick={() => {
              setEditingUser(null);
              setFormData(new BaseModel({ username: '', full_name: '', email: '', phone: '', office_id: '', role: '', is_active: true, notes: '' }));
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            إضافة مستخدم جديد
          </button>
        </div>

        <DataTable
          data={users}
          columns={columns}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
        />

        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingUser(null);
            setFormData(new BaseModel({ username: '', full_name: '', email: '', phone: '', office_id: '', role: '', is_active: true, notes: '' }));
          }}
          title={editingUser ? "تعديل مستخدم" : "إضافة مستخدم جديد"}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  اسم المستخدم <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.get('username')}
                  onChange={(e) => {
                    const newData = new BaseModel(formData.getData());
                    newData.put('username', e.target.value);
                    setFormData(newData);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الاسم الكامل <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.get('full_name')}
                  onChange={(e) => {
                    const newData = new BaseModel(formData.getData());
                    newData.put('full_name', e.target.value);
                    setFormData(newData);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  value={formData.get('email')}
                  onChange={(e) => {
                    const newData = new BaseModel(formData.getData());
                    newData.put('email', e.target.value);
                    setFormData(newData);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الهاتف
                </label>
                <input
                  type="tel"
                  value={formData.get('phone')}
                  onChange={(e) => {
                    const newData = new BaseModel(formData.getData());
                    newData.put('phone', e.target.value);
                    setFormData(newData);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  المكتب
                </label>
                <select
                  value={formData.get('office_id')}
                  onChange={(e) => {
                    const newData = new BaseModel(formData.getData());
                    newData.put('office_id', e.target.value);
                    setFormData(newData);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">اختر المكتب</option>
                  {offices.map((office) => (
                    <option key={office.get('id')} value={office.get('id')}>
                      {office.get('name')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الدور
                </label>
                <input
                  type="text"
                  value={formData.get('role')}
                  onChange={(e) => {
                    const newData = new BaseModel(formData.getData());
                    newData.put('role', e.target.value);
                    setFormData(newData);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="مثل: مدير، موظف، إلخ"
                />
              </div>
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.getValue<boolean>('is_active') === true || formData.getValue<number>('is_active') === 1}
                  onChange={(e) => {
                    const newData = new BaseModel(formData.getData());
                    newData.put('is_active', e.target.checked);
                    setFormData(newData);
                  }}
                  className="ml-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">نشط</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الملاحظات
              </label>
              <textarea
                value={formData.get('notes')}
                onChange={(e) => {
                  const newData = new BaseModel(formData.getData());
                  newData.put('notes', e.target.value);
                  setFormData(newData);
                }}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex justify-end space-x-2 space-x-reverse pt-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-white bg-primary-600 rounded-lg hover:bg-primary-700"
              >
                حفظ
              </button>
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
