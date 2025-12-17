# 🚀 دليل البدء السريع - AssetSight UI Components

## 📚 المكونات المحسّنة

### 1. Input Component

```tsx
import { Input } from '@/components/ui';

// استخدام بسيط
<Input
  label="البريد الإلكتروني"
  type="email"
  required
/>

// مع جميع الخيارات
<Input
  label="الاسم الكامل"
  type="text"
  size="medium"              // small | medium | large
  variant="outlined"         // outlined | filled
  leftIcon={<UserIcon />}
  required
  error={errors.name}
  helperText="أدخل الاسم الثلاثي"
  placeholder="مثال: محمد أحمد علي"
/>

// كلمة مرور مع زر إظهار
<Input
  label="كلمة المرور"
  type="password"
  showPasswordToggle
  onTogglePassword={() => setShow(!show)}
  isPasswordVisible={show}
/>
```

---

### 2. Button Component

```tsx
import { Button } from '@/components/ui';

// الأنماط المختلفة
<Button variant="primary">حفظ</Button>
<Button variant="secondary">إلغاء</Button>
<Button variant="success">موافق</Button>
<Button variant="warning">تحذير</Button>
<Button variant="error">حذف</Button>
<Button variant="outline">تفاصيل</Button>
<Button variant="ghost">إغلاق</Button>

// الأحجام
<Button size="xs">صغير جداً</Button>
<Button size="sm">صغير</Button>
<Button size="md">متوسط</Button>
<Button size="lg">كبير</Button>
<Button size="xl">كبير جداً</Button>

// مع loading و icons
<Button 
  variant="primary" 
  size="lg"
  isLoading={loading}
  leftIcon={<SaveIcon />}
>
  حفظ البيانات
</Button>
```

---

### 3. Select Component

```tsx
import { Select } from '@/components/ui';

// استخدام بسيط
<Select
  label="الدولة"
  options={[
    { value: 'sa', label: 'السعودية' },
    { value: 'ae', label: 'الإمارات' },
  ]}
  required
/>

// مع جميع الخيارات
<Select
  label="المدينة"
  size="medium"
  variant="outlined"
  leftIcon={<LocationIcon />}
  options={cities}
  error={errors.city}
  helperText="اختر مدينتك"
/>
```

---

### 4. Card Component

```tsx
import { Card, CardHeader, CardBody } from '@/components/ui';

// بسيط
<Card>
  <p>المحتوى هنا</p>
</Card>

// مع header و variants
<Card variant="elevated" hover padding="lg">
  <CardHeader 
    title="العنوان"
    action={<Button size="sm">تعديل</Button>}
  />
  <CardBody>
    <p>محتوى البطاقة...</p>
  </CardBody>
</Card>

// الأنماط المختلفة
<Card variant="default">افتراضي</Card>
<Card variant="elevated">مرتفع</Card>
<Card variant="outlined">محدد</Card>
<Card variant="flat">مسطح</Card>
```

---

### 5. Modal Component

```tsx
import { Modal } from '@/components/ui';

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="إضافة مستخدم"
  size="lg"
  footer={
    <>
      <Button variant="secondary" onClick={onClose}>
        إلغاء
      </Button>
      <Button variant="primary" onClick={onSave}>
        حفظ
      </Button>
    </>
  }
>
  {/* محتوى Modal */}
  <form>
    <Input label="الاسم" />
    <Input label="البريد" />
  </form>
</Modal>
```

---

### 6. Toast Notifications

```tsx
import { useToast } from '@/contexts/ToastContext';

function MyComponent() {
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  
  const handleSave = () => {
    showSuccess('تم الحفظ بنجاح!');
  };
  
  const handleError = () => {
    showError('حدث خطأ أثناء الحفظ');
  };
  
  return (
    <Button onClick={handleSave}>حفظ</Button>
  );
}
```

---

### 7. Skeleton Component

```tsx
import { Skeleton } from '@/components/ui';

// أثناء التحميل
{loading ? (
  <>
    <Skeleton variant="text" width="60%" />
    <Skeleton variant="text" width="80%" />
    <Skeleton variant="rectangular" height={200} />
    <Skeleton variant="circular" width={40} height={40} />
  </>
) : (
  <ActualContent />
)}
```

---

### 8. EmptyState Component

```tsx
import { EmptyState } from '@/components/ui';

// عند عدم وجود بيانات
{data.length === 0 && (
  <EmptyState
    icon="inbox"
    title="لا توجد بيانات"
    description="لم يتم العثور على أي عناصر"
    action={{
      label: "إضافة جديد",
      onClick: () => setIsModalOpen(true)
    }}
  />
)}

// الأنماط المختلفة
<EmptyState variant="info" icon="info" title="معلومة" />
<EmptyState variant="warning" icon="warning" title="تحذير" />
<EmptyState variant="success" icon="check_circle" title="نجاح" />
```

---

### 9. DataTable Component

```tsx
import { DataTable } from '@/components/ui';

const columns = [
  { key: 'name', label: 'الاسم', sortable: true },
  { key: 'email', label: 'البريد', sortable: true },
  { 
    key: 'status', 
    label: 'الحالة',
    render: (item) => (
      <Badge variant={item.get('status')}>
        {item.get('status')}
      </Badge>
    )
  },
];

<DataTable
  data={users}
  columns={columns}
  loading={loading}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onAddNew={() => setIsModalOpen(true)}
  title="المستخدمون"
/>
```

---

## 🎨 Design Tokens

### استخدام المتغيرات

```css
/* في CSS */
.my-element {
  color: var(--color-primary-500);
  background: var(--gradient-primary);
  box-shadow: var(--shadow-card);
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
  font-family: var(--font-primary);
}

/* في Tailwind */
className="text-primary-500 bg-gradient-primary shadow-card rounded-lg p-4"
```

### الألوان المتاحة

```typescript
// Primary Colors
primary-50 to primary-900

// Semantic Colors
success-50 to success-900
warning-50 to warning-900
error-50 to error-900
info-50 to info-900

// Neutral Colors
slate-50 to slate-900
neutral-50 to neutral-900
```

---

## 📐 Spacing System

```css
--spacing-0: 0
--spacing-1: 0.25rem  /* 4px */
--spacing-2: 0.5rem   /* 8px */
--spacing-3: 0.75rem  /* 12px */
--spacing-4: 1rem     /* 16px */
--spacing-5: 1.25rem  /* 20px */
--spacing-6: 1.5rem   /* 24px */
--spacing-8: 2rem     /* 32px */
--spacing-10: 2.5rem  /* 40px */
--spacing-12: 3rem    /* 48px */
```

---

## 🎭 Animations

```css
/* الفئات الجاهزة */
.animate-fade-in        /* تلاشي للداخل */
.animate-slide-in-up    /* انزلاق للأعلى */
.animate-pulse-glow     /* نبض مع توهج */
.animate-bounce-subtle  /* ارتداد خفيف */
.animate-shimmer        /* لمعان */

.material-transition    /* انتقال Material */
.hover-lift            /* رفع عند hover */
.hover-scale           /* تكبير عند hover */
```

---

## 📱 Responsive Breakpoints

```tsx
// في Tailwind
<div className="
  w-full           /* mobile */
  sm:w-1/2         /* 640px+ */
  md:w-1/3         /* 768px+ */
  lg:w-1/4         /* 1024px+ */
  xl:w-1/5         /* 1280px+ */
">
</div>
```

---

## 🏗️ نمط صفحة Admin

```tsx
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardBody, DataTable, Button } from '@/components/ui';

export default function MyAdminPage() {
  return (
    <MainLayout>
      {/* Page Header */}
      <div className="mb-10 relative animate-fade-in-down">
        {/* Decorative BG */}
        <div className="absolute top-0 right-0 w-64 h-64 
          bg-gradient-to-br from-primary-500/10 to-accent-500/10 
          rounded-full blur-3xl -z-10 animate-pulse-soft">
        </div>
        
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl 
            bg-gradient-to-br from-primary-500 to-primary-700 
            flex items-center justify-center shadow-2xl 
            shadow-primary-500/40 hover:scale-110 material-transition">
            <MaterialIcon name="dashboard" size="3xl" />
          </div>
          
          {/* Title */}
          <div>
            <h1 className="text-5xl font-black text-gradient-primary">
              العنوان
            </h1>
            <p className="text-slate-600 text-lg">الوصف</p>
          </div>
        </div>
        
        {/* Action Button */}
        <Button 
          variant="primary" 
          size="lg"
          onClick={() => setIsModalOpen(true)}
        >
          إضافة جديد
        </Button>
      </div>
      
      {/* Content */}
      <Card variant="elevated">
        <CardBody>
          <DataTable
            data={data}
            columns={columns}
            loading={loading}
          />
        </CardBody>
      </Card>
    </MainLayout>
  );
}
```

---

## ✨ نصائح سريعة

### 1. استخدم Design Tokens دائماً
```css
/* ✅ جيد */
color: var(--color-primary-500);

/* ❌ سيئ */
color: #7367f0;
```

### 2. احترم الـ size variants
```tsx
/* ✅ جيد - موحد */
<Input size="medium" />
<Button size="medium" />
<Select size="medium" />

/* ❌ سيئ - غير موحد */
<Input size="large" />
<Button size="small" />
```

### 3. استخدم Skeleton أثناء التحميل
```tsx
/* ✅ جيد */
{loading ? <Skeleton /> : <Content />}

/* ❌ سيئ */
{loading && <div>Loading...</div>}
```

### 4. EmptyState للبيانات الفارغة
```tsx
/* ✅ جيد */
{data.length === 0 && <EmptyState />}

/* ❌ سيئ */
{data.length === 0 && <p>لا توجد بيانات</p>}
```

---

## 🔍 استكشاف الأخطاء

### Input لا يظهر بشكل صحيح
```tsx
// تأكد من:
1. استيراد من المسار الصحيح
2. تمرير label إذا لزم الأمر
3. fullWidth={true} إذا أردت عرض كامل
```

### Button بدون تأثيرات
```tsx
// تأكد من:
1. تطبيق CSS globals
2. استخدام variant صحيح
3. لا يوجد disabled=true
```

### Modal لا يُغلق
```tsx
// تأكد من:
1. تمرير onClose
2. تحديث isOpen في الـ state
3. إضافة Backdrop onClick
```

---

## 📦 الملفات المهمة

```
src/
├── styles/
│   ├── design-tokens.css   ← المتغيرات الأساسية
│   ├── typography.css      ← خط Tajawal
│   └── globals.css         ← Animations
├── components/ui/
│   ├── Input.tsx          ← محسّن ✨
│   ├── Button.tsx         ← محسّن ✨
│   ├── Select.tsx         ← محسّن ✨
│   ├── Card.tsx           ← محسّن ✨
│   ├── Modal.tsx          ← محسّن ✨
│   ├── Toast.tsx          ← محسّن ✨
│   ├── Skeleton.tsx       ← جديد ⭐
│   └── EmptyState.tsx     ← جديد ⭐
└── app/
    ├── login/
    │   └── login-enhanced.module.css  ← تصميم Login
    └── admin/
        └── [pages]/       ← صفحات Admin محسّنة
```

---

## 🎓 موارد إضافية

### التوثيق الكامل:
- `UI_UX_COMPLETE_IMPROVEMENT_ANALYSIS.md`
- `UI_UX_FINAL_SUMMARY_REPORT.md`
- `FINAL_PROJECT_COMPLETION_REPORT.md`

### أمثلة حية:
- راجع صفحات Admin للأمثلة
- انظر إلى `users/page.tsx`
- تحقق من `assets/page.tsx`

---

**تم التحديث**: ديسمبر 2025  
**الحالة**: ✅ جاهز للاستخدام

🚀 **استمتع بالبرمجة!**

