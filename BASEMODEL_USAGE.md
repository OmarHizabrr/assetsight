# دليل استخدام BaseModel

## التحديثات المنجزة

✅ **BaseModel.ts** - تم إنشاء النموذج الأساسي
✅ **DataTable.tsx** - تم تحديثه ليعمل مع BaseModel
✅ **departments/page.tsx** - تم تحديثه كمثال كامل

## كيفية استخدام BaseModel

### 1. استيراد BaseModel

```typescript
import { BaseModel } from "@/lib/BaseModel";
```

### 2. إنشاء كائن BaseModel

```typescript
// إنشاء كائن جديد
const model = new BaseModel({ name: 'قيمة', description: 'وصف' });

// أو من بيانات Firestore
const docs = await firestoreApi.getDocuments(collectionRef);
const models = BaseModel.fromFirestoreArray(docs);
```

### 3. استخدام BaseModel في State

```typescript
const [items, setItems] = useState<BaseModel[]>([]);
const [formData, setFormData] = useState<BaseModel>(new BaseModel({}));
```

### 4. قراءة البيانات

```typescript
// الحصول على قيمة كنص
const name = model.get('name');

// الحصول على قيمة بنوع محدد
const value = model.getValue<number>('price');

// الحصول على جميع البيانات
const allData = model.getData();

// التحقق من وجود مفتاح
if (model.containsKey('id')) {
  // ...
}
```

### 5. كتابة البيانات

```typescript
// إضافة/تحديث قيمة
model.put('name', 'قيمة جديدة');

// حذف قيمة
model.remove('name');
```

### 6. في النماذج (Forms)

```typescript
// قراءة القيمة
<input
  value={formData.get('name')}
  onChange={(e) => {
    const newData = new BaseModel(formData.getData());
    newData.put('name', e.target.value);
    setFormData(newData);
  }}
/>

// أو استخدام دالة مساعدة
const updateField = (key: string, value: any) => {
  const newData = new BaseModel(formData.getData());
  newData.put(key, value);
  setFormData(newData);
};
```

### 7. في DataTable Columns

```typescript
const columns = [
  { 
    key: 'name', 
    label: 'الاسم',
    render: (item: BaseModel) => item.get('name'),
  },
  { 
    key: 'description', 
    label: 'الوصف',
    render: (item: BaseModel) => item.get('description'),
  },
];
```

### 8. حفظ البيانات في Firestore

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const data = formData.getData();
  
  if (editingItem?.get('id')) {
    await firestoreApi.updateData("collection", editingItem.get('id'), data);
  } else {
    const newId = firestoreApi.getNewId("collection");
    await firestoreApi.setData("collection", newId, data);
  }
};
```

## مثال كامل - صفحة Departments

تم تحديث صفحة `departments/page.tsx` كمثال كامل يمكن استخدامه كمرجع لبقية الصفحات.

## الصفحات المتبقية للتحديث

- [ ] offices/page.tsx
- [ ] asset-types/page.tsx
- [ ] asset-statuses/page.tsx
- [ ] asset-names/page.tsx
- [ ] categories/page.tsx
- [ ] users/page.tsx
- [ ] assets/page.tsx
- [ ] inventory/page.tsx
- [ ] reports/page.tsx

## ملاحظات مهمة

1. **لا تستخدم الأنواع (Types/Interfaces)** - استخدم BaseModel فقط
2. **استخدم `get()` للحصول على القيم** - دائماً ترجع string
3. **استخدم `getValue<T>()` للحصول على أنواع محددة**
4. **استخدم `put()` لتحديث القيم** - دائماً أنشئ BaseModel جديد عند التحديث
5. **استخدم `BaseModel.fromFirestoreArray()`** لتحويل Firestore documents

