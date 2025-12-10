# دليل النشر على Vercel

## 📋 الخطوات

### 1. رفع المشروع على GitHub

تم رفع المشروع على GitHub بنجاح.

### 2. ربط المشروع بـ Vercel

1. اذهب إلى [Vercel New Project](https://vercel.com/new?teamSlug=omarhizabrrs-projects)
2. اختر **Import Git Repository**
3. اختر المستودع `OmarHizabrr/assetsight`
4. اضغط **Import**

### 3. إعداد متغيرات البيئة

في صفحة إعدادات المشروع على Vercel:

1. اذهب إلى **Settings** → **Environment Variables**
2. أضف المتغيرات التالية:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

3. اختر **Production**, **Preview**, و **Development** لكل متغير
4. اضغط **Save**

### 4. إعدادات البناء

Vercel سيكتشف تلقائياً:
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### 5. النشر

بعد إضافة المتغيرات:
1. اذهب إلى **Deployments**
2. اضغط **Redeploy** على آخر deployment
3. أو انتظر النشر التلقائي بعد push جديد

## 🔧 إعدادات إضافية (اختيارية)

### Custom Domain
1. اذهب إلى **Settings** → **Domains**
2. أضف domain مخصص
3. اتبع التعليمات لإعداد DNS

### Environment Variables per Environment
يمكنك إعداد متغيرات مختلفة لكل بيئة:
- **Production**: للموقع النهائي
- **Preview**: للـ pull requests
- **Development**: للبيئة التطويرية

## 📝 ملاحظات

- Vercel سيقوم بنشر المشروع تلقائياً عند كل push إلى `main`
- يمكنك رؤية logs البناء في صفحة **Deployments**
- يمكنك إعادة نشر أي deployment من صفحة **Deployments**

## 🚀 بعد النشر

بعد النشر الناجح:
1. ستحصل على رابط مثل: `https://assetsight.vercel.app`
2. يمكنك مشاركة الرابط مع المستخدمين
3. يمكنك إضافة domain مخصص لاحقاً

## 🐛 حل المشاكل

### خطأ في البناء
- تحقق من logs البناء في Vercel
- تأكد من إضافة جميع متغيرات البيئة
- تأكد من أن `package.json` يحتوي على جميع dependencies

### خطأ في Runtime
- تحقق من console في المتصفح
- تأكد من صحة متغيرات Firebase
- تحقق من إعدادات Firebase في Console

## 📚 روابط مفيدة

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

