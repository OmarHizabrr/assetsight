# تحديث هيكل قاعدة البيانات

## التغييرات المنجزة

### 1. تحديث FirestoreApi
- ✅ إضافة دعم للجداول الفرعية (Sub Collections)
- ✅ إضافة `getSubCollection()` للحصول على مجموعات فرعية
- ✅ إضافة `getSubDocument()` للحصول على وثائق فرعية
- ✅ إضافة `getNestedSubCollection()` للمجموعات متعددة المستويات
- ✅ إضافة `setSubData()`, `updateSubData()`, `deleteSubData()` للتعامل مع البيانات الفرعية

### 2. إزالة حقل `code`
- ✅ إزالة `code` من `Department`
- ✅ إزالة `code` من `Office`
- ✅ إزالة `code` من `AssetStatus`
- ✅ تحديث جميع الصفحات لإزالة حقول `code`

### 3. تحديث الصفحات

#### Departments (الإدارات)
- ✅ تحديث للتعامل مع الجدول الرئيسي
- ✅ إزالة حقل `code`

#### Offices (المكاتب)
- ✅ تحديث للتعامل مع الهيكل الهرمي: `departments/departmentId/departments/officeId/`
- ✅ جلب المكاتب من جميع الإدارات
- ✅ حفظ وتحديث وحذف المكاتب في المجموعات الفرعية
- ✅ إزالة حقل `code`

#### Users (المستخدمون)
- ✅ تحديث للتعامل مع الهيكل الهرمي: `departments/departmentId/departments/officeId/departments/users/userId/`
- ✅ جلب المستخدمين من جميع المكاتب
- ✅ حفظ وتحديث وحذف المستخدمين في المجموعات الفرعية المتداخلة

#### Asset Statuses (حالات الأصول)
- ✅ إزالة حقل `code`
- ✅ تحديث النماذج والجداول

## الهيكل الهرمي المحدث

```
departments/
  └── departmentId/
      └── departments/
          ├── officeId/
          │   └── departments/
          │       └── users/
          │           └── userId/
          └── cycleId/
              └── departments/
                  └── inventoryItems/
                      └── itemId/

assets/
  └── assetId/
      └── assets/
          ├── assetAttachments/
          │   └── attachmentId/
          └── assetHistory/
              └── historyId/
```

## ملاحظات

1. **الجداول الرئيسية** (Root Collections):
   - `departments`
   - `assetTypes`
   - `assetStatuses`
   - `assetNames`
   - `categories`
   - `assets`

2. **الجداول الفرعية** (Sub Collections):
   - `offices` → تحت `departments`
   - `users` → تحت `offices` (التي تحت `departments`)
   - `inventoryCycles` → تحت `departments`
   - `inventoryItems` → تحت `inventoryCycles`
   - `assetAttachments` → تحت `assets`
   - `assetHistory` → تحت `assets`

3. **قاعدة مهمة**: كل وثيقة فرعية لابد أن تكون مثل اسم الوثيقة الرئيسية في المسار

## الصفحات المتبقية للتحديث

- [ ] Inventory (الجرد) - تحديث للهيكل الهرمي
- [ ] Assets (الأصول) - تحديث للتعامل مع المكاتب من الهيكل الهرمي
- [ ] Reports (التقارير) - تحديث للتعامل مع الهيكل الجديد

