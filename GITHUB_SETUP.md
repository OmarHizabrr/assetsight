# دليل رفع المشروع على GitHub و Vercel

## 📋 الخطوة 1: إنشاء المستودع على GitHub

### الطريقة الأولى: من خلال GitHub Website

1. اذهب إلى [GitHub](https://github.com/OmarHizabrr)
2. اضغط على **New** أو **+** في الأعلى
3. املأ التفاصيل:
   - **Repository name**: `assetsight`
   - **Description**: `نظام إدارة الأصول - Asset Management System`
   - **Visibility**: اختر **Public** أو **Private**
   - **لا** تضع علامة على "Initialize this repository with a README"
4. اضغط **Create repository**

### الطريقة الثانية: من خلال GitHub CLI

```bash
gh repo create assetsight --public --description "نظام إدارة الأصول - Asset Management System"
```

## 📤 الخطوة 2: رفع الكود إلى GitHub

بعد إنشاء المستودع، قم بتنفيذ الأوامر التالية:

```bash
# تأكد من أنك في مجلد المشروع
cd E:\AlMosawaNew\assetsight_wep

# رفع الكود
git push -u origin main
```

إذا طُلب منك اسم المستخدم وكلمة المرور:
- استخدم **Personal Access Token** بدلاً من كلمة المرور
- يمكنك إنشاء token من: [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)

## 🚀 الخطوة 3: النشر على Vercel

### 1. اذهب إلى Vercel

افتح الرابط: [https://vercel.com/new?teamSlug=omarhizabrrs-projects](https://vercel.com/new?teamSlug=omarhizabrrs-projects)

### 2. ربط المشروع

1. اضغط **Import Git Repository**
2. اختر **GitHub** كـ provider
3. ابحث عن `OmarHizabrr/assetsight`
4. اضغط **Import**

### 3. إعداد المشروع

Vercel سيكتشف تلقائياً:
- **Framework Preset**: Next.js ✅
- **Root Directory**: `./` ✅
- **Build Command**: `npm run build` ✅
- **Output Directory**: `.next` ✅

### 4. إضافة متغيرات البيئة

**مهم جداً:** قبل النشر، أضف متغيرات Firebase:

1. في صفحة إعدادات المشروع، اذهب إلى **Environment Variables**
2. أضف المتغيرات التالية (لكل بيئة: Production, Preview, Development):

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBbDfP3Wm97RyCZcPHHtBBcXQZytG_EC_0
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=assetsight.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=assetsight
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=assetsight.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=175578104736
NEXT_PUBLIC_FIREBASE_APP_ID=1:175578104736:web:e3b11bc97d802fda8edac5
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-DP3DR9FQ1L
```

**ملاحظة:** استبدل القيم بقيم Firebase الخاصة بك من Firebase Console.

### 5. النشر

1. اضغط **Deploy**
2. انتظر حتى يكتمل البناء (عادة 2-3 دقائق)
3. بعد النشر الناجح، ستحصل على رابط مثل: `https://assetsight.vercel.app`

## ✅ التحقق من النشر

بعد النشر:
1. افتح الرابط الذي حصلت عليه من Vercel
2. تأكد من أن الموقع يعمل بشكل صحيح
3. جرب تسجيل الدخول
4. تحقق من أن Firebase يعمل بشكل صحيح

## 🔄 التحديثات المستقبلية

بعد ربط المشروع بـ Vercel:
- كل **push** إلى `main` سيؤدي إلى نشر تلقائي جديد
- يمكنك رؤية جميع deployments في صفحة **Deployments** على Vercel
- يمكنك إعادة نشر أي deployment سابق

## 🐛 حل المشاكل

### خطأ: Repository not found
- تأكد من إنشاء المستودع على GitHub أولاً
- تأكد من اسم المستودع: `assetsight`
- تأكد من أنك مسجل دخول إلى GitHub

### خطأ في البناء على Vercel
- تحقق من logs البناء
- تأكد من إضافة جميع متغيرات البيئة
- تأكد من أن `package.json` صحيح

### خطأ في Runtime
- تحقق من console في المتصفح
- تأكد من صحة متغيرات Firebase
- تحقق من إعدادات Firebase Console

## 📚 روابط مفيدة

- [GitHub Documentation](https://docs.github.com)
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Firebase Console](https://console.firebase.google.com)

