# تحديث المنهجية - FirestoreApi

## ✅ التحديثات المنجزة

### 1. FirestoreApi - المنهجية الجديدة

تم تحديث `FirestoreApi` بالكامل ليطابق المنهجية المطلوبة:

#### المبادئ الأساسية:
- ✅ جميع عمليات الكتابة تمر عبر `setData/updateData` حصراً
- ✅ لا توجد `try/catch` داخل الدوال (الأخطاء تذهب للمستدعي)
- ✅ التعليقات باللغة العربية
- ✅ يستخدم المسارات البسيطة المباشرة
- ✅ كل وثيقة فرعية لابد أن تكون مثل اسم الوثيقة الرئيسية

#### الدوال الرئيسية:

```typescript
// الحصول على مراجع
getCollection(collectionName: string): CollectionReference
getDocument(collectionName: string, documentId: string): DocumentReference
getSubCollection(collectionName: string, documentId: string, subCollectionName: string): CollectionReference
getSubDocument(collectionName: string, documentId: string, subCollectionName: string, subDocumentId: string): DocumentReference
getNestedSubCollection(...): CollectionReference
getNestedSubDocument(...): DocumentReference

// عمليات CRUD (تأخذ DocumentReference)
async setData(docRef: DocumentReference, data: { [key: string]: any }, merge?: boolean): Promise<void>
async updateData(docRef: DocumentReference, data: { [key: string]: any }): Promise<void>
async getData(docRef: DocumentReference): Promise<{ [key: string]: any } | null>
async deleteData(docRef: DocumentReference): Promise<void>

// دوال للعمل مع حلقات
async getDocuments(colRef: CollectionReference, options?: {...}): Promise<QueryDocumentSnapshot[]>
subscribeToCollection(colRef: CollectionReference, callback: Function, options?: {...}): Unsubscribe

// دوال متداخلة (اختيارية)
async setNested(...): Promise<void>
async updateNested(...): Promise<void>
async getNested(...): Promise<{ [key: string]: any } | null>
async deleteNested(...): Promise<void>
async setNestedDeep(...): Promise<void>
async updateNestedDeep(...): Promise<void>
async getNestedDeep(...): Promise<{ [key: string]: any } | null>
async deleteNestedDeep(...): Promise<void>
```

### 2. المسارات المحدثة

#### الجداول الرئيسية:
- `departments/departmentId/`
- `assetTypes/assetTypeId/`
- `assetStatuses/assetStatusId/`
- `assetNames/assetNameId/`
- `categories/categoryId/`
- `assets/assetId/`

#### الجداول الفرعية:
- `departments/departmentId/departments/departmentId/departments/officeId/` (مكتب)
- `departments/departmentId/departments/officeId/departments/officeId/departments/users/userId/` (مستخدم)
- `departments/departmentId/departments/departmentId/departments/cycleId/` (دورة جرد)
- `departments/departmentId/departments/cycleId/departments/cycleId/departments/inventoryItems/itemId/` (عنصر جرد)
- `assets/assetId/assets/assetId/assets/assetAttachments/attachmentId/` (مرفق)
- `assets/assetId/assets/assetId/assets/assetHistory/historyId/` (سجل)

### 3. جميع الصفحات محدثة

#### ✅ الصفحات الرئيسية:
- `src/app/admin/departments/page.tsx`
- `src/app/admin/offices/page.tsx`
- `src/app/admin/users/page.tsx`
- `src/app/admin/assets/page.tsx`
- `src/app/admin/inventory/page.tsx`

#### ✅ الصفحات الثانوية:
- `src/app/admin/categories/page.tsx`
- `src/app/admin/asset-types/page.tsx`
- `src/app/admin/asset-statuses/page.tsx`
- `src/app/admin/asset-names/page.tsx`
- `src/app/admin/reports/page.tsx`

#### ✅ الصفحات الأخرى:
- `src/app/page.tsx` (Home)
- `src/contexts/AuthContext.tsx`

### 4. أمثلة الاستخدام

#### مثال 1: إنشاء إدارة جديدة
```typescript
const newId = firestoreApi.getNewId("departments");
const docRef = firestoreApi.getDocument("departments", newId);
await firestoreApi.setData(docRef, {
  name: "إدارة جديدة",
  description: "وصف الإدارة"
});
```

#### مثال 2: تحديث مكتب
```typescript
const docRef = firestoreApi.getSubDocument(
  "departments",
  departmentId,
  "departments",
  officeId
);
await firestoreApi.updateData(docRef, {
  name: "اسم جديد",
  floor: "الطابق الثاني"
});
```

#### مثال 3: حذف مستخدم
```typescript
const docRef = firestoreApi.getNestedSubDocument(
  "departments",
  departmentId,
  "departments",
  officeId,
  "users",
  userId
);
await firestoreApi.deleteData(docRef);
```

#### مثال 4: جلب البيانات
```typescript
// جلب جميع الإدارات
const colRef = firestoreApi.getCollection("departments");
const docs = await firestoreApi.getDocuments(colRef);
const departments = BaseModel.fromFirestoreArray(docs);

// جلب مكاتب إدارة معينة
const subColRef = firestoreApi.getSubCollection("departments", departmentId, "departments");
const officeDocs = await firestoreApi.getDocuments(subColRef);
const offices = BaseModel.fromFirestoreArray(officeDocs);
```

### 5. الحقول التلقائية

عند استخدام `setData` أو `updateData`، يتم إضافة الحقول التالية تلقائياً:

#### في `setData`:
- `createdByName`: اسم منشئ السجل
- `createdByImageUrl`: صورة منشئ السجل
- `createdBy`: معرف منشئ السجل
- `createTimes`: وقت الإنشاء (Timestamp)
- `updatedTimes`: وقت التحديث (Timestamp)

#### في `updateData`:
- `updateByName`: اسم محدث السجل
- `updateByImageUrl`: صورة محدث السجل
- `updatedTimes`: وقت التحديث (Timestamp)

**ملاحظة:** يتم جلب بيانات المستخدم من `localStorage.getItem('userData')`

### 6. الفروقات الرئيسية

#### قبل التحديث:
```typescript
// ❌ الطريقة القديمة
await firestoreApi.setData("departments", id, data);
await firestoreApi.updateData("departments", id, data);
await firestoreApi.deleteData("departments", id);
```

#### بعد التحديث:
```typescript
// ✅ الطريقة الجديدة
const docRef = firestoreApi.getDocument("departments", id);
await firestoreApi.setData(docRef, data);
await firestoreApi.updateData(docRef, data);
await firestoreApi.deleteData(docRef);
```

### 7. الميزات

- ✅ **Singleton Pattern**: `FirestoreApi.Api` أو `firestoreApi`
- ✅ **Type Safety**: استخدام TypeScript بشكل كامل
- ✅ **Timestamp Conversion**: تحويل تلقائي للطوابع الزمنية
- ✅ **User Tracking**: تتبع تلقائي للمستخدمين الذين ينشئون/يحدثون السجلات
- ✅ **Error Handling**: الأخطاء تذهب للمستدعي (لا try/catch داخل الدوال)

## 🎯 الحالة النهائية

جميع الملفات محدثة وتعمل مع:
- ✅ المنهجية الجديدة (DocumentReference)
- ✅ المسارات الصحيحة (كل وثيقة فرعية مثل اسم الوثيقة الرئيسية)
- ✅ BaseModel فقط
- ✅ لا استخدام مباشر لـ setDoc/updateDoc/deleteDoc
- ✅ جميع عمليات الكتابة تمر عبر setData/updateData

المشروع جاهز للاستخدام! 🎉

