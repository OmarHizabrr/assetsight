'use client';

import { MaterialIcon } from "@/components/icons/MaterialIcon";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { BaseModel } from "@/lib/BaseModel";
import { firestoreApi } from "@/lib/FirestoreApi";
import { storage } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { useState, useRef } from "react";
import Image from "next/image";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>('');

  const currentImageUrl = user?.get('imageUrl') || user?.get('photoURL') || null;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // التحقق من نوع الملف
      if (!file.type.startsWith('image/')) {
        setError('الرجاء اختيار ملف صورة صحيح');
        return;
      }
      
      // التحقق من حجم الملف (5MB كحد أقصى)
      if (file.size > 5 * 1024 * 1024) {
        setError('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
        return;
      }

      setError('');
      setSelectedFile(file);
      
      // إنشاء معاينة للصورة
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // التحقق من كلمة المرور
    if (password && password !== confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      return;
    }

    if (password && password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    if (!user?.get('id')) {
      setError('خطأ في بيانات المستخدم');
      return;
    }

    try {
      setLoading(true);
      const userId = user.get('id');
      const updateData: any = {};

      // رفع الصورة إذا تم اختيار واحدة
      if (selectedFile) {
        // حذف الصورة القديمة إن وجدت
        if (currentImageUrl) {
          try {
            const oldImageRef = ref(storage, currentImageUrl);
            await deleteObject(oldImageRef);
          } catch (error) {
            // تجاهل خطأ الحذف إذا لم تكن الصورة موجودة
            console.log('لم يتم العثور على الصورة القديمة');
          }
        }

        // رفع الصورة الجديدة
        const imageRef = ref(storage, `users/${userId}/profile/${Date.now()}_${selectedFile.name}`);
        await uploadBytes(imageRef, selectedFile);
        const imageUrl = await getDownloadURL(imageRef);
        updateData.imageUrl = imageUrl;
        updateData.photoURL = imageUrl;
      }

      // تحديث كلمة المرور إذا تم إدخال واحدة
      if (password) {
        updateData.password = password;
      }

      // تحديث بيانات المستخدم في Firestore
      if (Object.keys(updateData).length > 0) {
        const docRef = firestoreApi.getDocument("users", userId);
        await firestoreApi.updateData(docRef, updateData);

        // تحديث بيانات المستخدم في localStorage والـ context
        const updatedUserData = user.getData();
        if (updateData.imageUrl) {
          updatedUserData.imageUrl = updateData.imageUrl;
          updatedUserData.photoURL = updateData.imageUrl;
        }
        if (updateData.password) {
          // لا نحفظ كلمة المرور في localStorage
          delete updatedUserData.password;
        }

        if (typeof window !== 'undefined') {
          window.localStorage.setItem("user", JSON.stringify(updatedUserData));
          window.localStorage.setItem("userData", JSON.stringify(updatedUserData));
        }

        // إعادة تحميل الصفحة لتحديث بيانات المستخدم في الـ context
        window.location.reload();
      }

      // إعادة تعيين النموذج
      setPassword('');
      setConfirmPassword('');
      setSelectedFile(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      onClose();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      setError(error.message || 'حدث خطأ أثناء تحديث البروفايل');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setConfirmPassword('');
    setSelectedFile(null);
    setImagePreview(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const displayImage = imagePreview || currentImageUrl;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="تعديل البروفايل"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-gradient-to-r from-error-50 to-error-100/50 border-2 border-error-200/60 rounded-xl text-error-700 text-sm font-medium shadow-sm">
            {error}
          </div>
        )}

        {/* قسم الصورة */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            صورة البروفايل
          </label>
          
          <div className="flex flex-col items-center gap-4">
            {/* عرض الصورة */}
            <div className="relative">
              {displayImage ? (
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-primary-300/60 shadow-xl shadow-primary-500/20">
                  <Image
                    src={displayImage}
                    alt="صورة البروفايل"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 flex items-center justify-center border-4 border-primary-300/60 shadow-xl shadow-primary-500/20">
                  <MaterialIcon name="person" className="text-white" size="xl" />
                </div>
              )}
              
              {/* زر تغيير الصورة */}
              {displayImage && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute -top-2 -right-2 w-9 h-9 rounded-full bg-gradient-to-br from-error-500 to-error-600 text-white flex items-center justify-center shadow-xl shadow-error-500/40 hover:shadow-2xl hover:shadow-error-500/50 hover:scale-110 material-transition"
                  title="حذف الصورة"
                >
                  <MaterialIcon name="close" size="sm" />
                </button>
              )}
            </div>

            {/* زر اختيار الصورة */}
            <div className="flex gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                id="profile-image-input"
              />
              <label
                htmlFor="profile-image-input"
                className="cursor-pointer"
              >
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  leftIcon={<MaterialIcon name="photo_camera" size="sm" />}
                >
                  {displayImage ? 'تغيير الصورة' : 'اختر صورة'}
                </Button>
              </label>
            </div>
          </div>
        </div>

        {/* قسم كلمة المرور */}
        <div className="space-y-4 pt-4 border-t-2 border-slate-200">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">تغيير كلمة المرور</h3>
          
          <div className="relative">
            <Input
              label="كلمة المرور الجديدة"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="اتركها فارغة للحفاظ على الكلمة الحالية"
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
          
          {password && (
            <div className="relative">
              <Input
                label="تأكيد كلمة المرور"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="أعد إدخال كلمة المرور"
                required={!!password}
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

        {/* معلومات المستخدم */}
        <div className="pt-4 border-t-2 border-slate-200 space-y-2 bg-slate-50 rounded-xl p-4">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-semibold text-slate-600">الاسم الكامل:</span>
            <span className="text-sm font-medium text-slate-900">{user?.get('full_name') || '-'}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-semibold text-slate-600">اسم المستخدم:</span>
            <span className="text-sm font-medium text-slate-900">{user?.get('username') || '-'}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-semibold text-slate-600">البريد الإلكتروني:</span>
            <span className="text-sm font-medium text-slate-900">{user?.get('email') || '-'}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-semibold text-slate-600">الدور:</span>
            <span className="text-sm font-medium text-slate-900">{user?.get('role') || '-'}</span>
          </div>
        </div>

        {/* أزرار الإجراءات */}
        <div className="flex justify-end gap-4 pt-6 border-t-2 border-slate-200">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            size="lg"
            disabled={loading}
          >
            إلغاء
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={loading}
            disabled={loading}
          >
            حفظ التغييرات
          </Button>
        </div>
      </form>
    </Modal>
  );
}

