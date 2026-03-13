# The English Hub - Learning Center Management System

## تم تنفيذ المشروع بنجاح!

تم إنشاء نظام إدارة شامل لمركز التعلم مع واجهة مستخدم عصرية ومتجاوبة بالكامل.

## ✅ ما تم تنفيذه

### الواجهة الأمامية (Frontend)

#### التقنيات المستخدمة:
- **React 19** مع TypeScript
- **Tailwind CSS v4** للتصميم
- **shadcn/ui** للمكونات
- **tRPC** للاتصال بالخلفية
- **React Router** للتنقل
- **Recharts** للرسوم البيانية
- **Bun** كمدير للحزم

#### الميزات المنفذة:

1. **نظام المصادقة (Authentication)**
   - صفحة تسجيل الدخول مع RTL
   - حماية الصفحات (Protected Routes)
   - إدارة الجلسات
   - صلاحيات المستخدمين (Admin/Assistant)

2. **لوحة التحكم (Dashboard)**
   - بطاقات الإحصائيات مع مؤشرات الاتجاه
   - رسوم بيانية تفاعلية (Bar, Line, Pie charts)
   - خلاصة النشاطات الأخيرة
   - تنبيهات للمدفوعات المتأخرة
   - تصميم RTL بالكامل

3. **إدارة الطلاب (Students)**
   - جدول بيانات الطلاب
   - البحث والتصفية
   - إدارة حالات الدفع
   - تصميم responsive

4. **إدارة المعلمين (Teachers)**
   - قائمة المعلمين مع التفاصيل
   - حساب الأرباح
   - إدارة الفصول

5. **إدارة الدورات (Courses)**
   - بطاقات الدورات
   - إدارة المستويات
   - إحصائيات الطلاب

6. **إدارة الفصول (Classes)**
   - جدول الفصول
   - تتبع التقدم
   - الجداول الدراسية

7. **المدفوعات (Payments)**
   - تبويب لدفعات الطلاب والمعلمين
   - حالات الدفع (مدفوع/معلق/متأخر)
   - سجل المدفوعات

8. **التقارير والتحليلات (Reports)**
   - تقارير مالية
   - إحصائيات التسجيل
   - تحليلات المدفوعات
   - رسوم بيانية متنوعة

9. **الإعدادات (Settings)**
   - إدارة المستخدمين
   - إدارة الصلاحيات
   - إعدادات النظام

### الخلفية (Backend)

#### التقنيات المستخدمة:
- **Express.js** مع TypeScript
- **tRPC** للـ APIs
- **Drizzle ORM** لقاعدة البيانات
- **PostgreSQL** قاعدة البيانات
- **JWT** للمصادقة
- **Bun** كـ runtime

#### نقاط النهاية المتوفرة:
- `/api/trpc/auth.login` - تسجيل الدخول
- `/api/trpc/reports.getDashboardStats` - إحصائيات لوحة التحكم
- `/api/trpc/reports.getFinancialReport` - التقرير المالي
- `/api/trpc/reports.getStudentPaymentReport` - تقرير دفعات الطلاب
- `/api/trpc/reports.getTeacherPaymentSchedule` - جدول دفعات المعلمين
- `/api/trpc/reports.getEnrollmentReport` - تقرير التسجيل
- وغيرها...

### التصميم

#### الألوان المستخدمة (حسب المواصفات):
- **Primary:** #8B5CF6 (بنفسجي)
- **Primary Dark:** #6D28D9
- **Primary Light:** #C4B5FD
- **Accent Cyan:** #22D3EE
- **Accent Gold:** #FBBF24
- **Accent Coral:** #F87171
- **Background:** #F8F7FF (بنفسجي فاتح)
- **Sidebar:** #2E1065 (بنفسجي داكن)

#### المميزات:
- ✅ دعم RTL بالكامل
- ✅ تصميم متجاوب (Mobile, Tablet, Desktop)
- ✅ خط Cairo للعربية
- ✅ مكونات shadcn/ui حديثة
- ✅ رسوم بيانية تفاعلية
- ✅ شريط جانبي قابل للطي
- ✅ تنقل سلس بين الصفحات

## 🚀 كيفية التشغيل

### تشغيل الخلفية:
```bash
cd backend
bun install
bun run dev
```

سيعمل السيرفر على: `http://localhost:3001`

### تشغيل الواجهة الأمامية:
```bash
cd frontend
bun install
bun run dev
```

سيعمل التطبيق على: `http://localhost:5173`

### بيانات الدخول الافتراضية:
- **اسم المستخدم:** admin
- **كلمة المرور:** (تحتاج إلى إعداد أولي في قاعدة البيانات)

## 📁 هيكل المشروع

```
theEnglishHub/
├── frontend/          # React + TypeScript + Tailwind
│   ├── src/
│   │   ├── components/   # مكونات shadcn/ui
│   │   ├── contexts/     # سياقات React
│   │   ├── pages/        # صفحات التطبيق
│   │   ├── lib/          # utilities
│   │   └── App.tsx       # التطبيق الرئيسي
│   └── index.html
│
├── backend/           # Express + tRPC + Drizzle
│   ├── src/
│   │   ├── routers/      # نقاط النهاية
│   │   ├── services/     # منطق الأعمال
│   │   ├── db/           # قاعدة البيانات
│   │   └── index.ts      # نقطة الدخول
│   └── package.json
│
└── docs/              # التوثيق
    ├── frontendFeatures.md
    └── theEnglishHub.svg
```

## 🎨 المكونات UI المنفذة

- ✅ Button (أزرار)
- ✅ Card (بطاقات)
- ✅ Input (حقول إدخال)
- ✅ Label (تسميات)
- ✅ Table (جداول)
- ✅ Tabs (تبويبات)
- ✅ Badge (شارات)
- ✅ Avatar (صور شخصية)
- ✅ Alert (تنبيهات)
- ✅ Switch (مفاتيح)
- ✅ Dropdown Menu (قوائم منسدلة)
- ✅ Progress (شريط التقدم)
- ✅ Sidebar (شريط جانبي)
- ✅ Header (رأس الصفحة)

## 📱 التجاوب (Responsive Design)

- ✅ Mobile: < 640px
- ✅ Tablet: 640px - 1024px  
- ✅ Desktop: > 1024px

المميزات على الجوال:
- شريط جانبي قابل للطي
- قائمة همبرجر
- جداول قابلة للتمرير
- أحجام أزرار مناسبة للمس

## 🔒 الأمان

- ✅ JWT Authentication
- ✅ Protected Routes
- ✅ Role-based Access Control (RBAC)
- ✅ Rate Limiting
- ✅ CORS protection
- ✅ Helmet security headers

## 📊 الرسوم البيانية

- ✅ Bar Charts (الدخل vs المصروفات)
- ✅ Line Charts (اتجاهات التسجيل)
- ✅ Pie Charts (توزيع المدفوعات)

## 🎯 المميزات المستقبلية

يمكن إضافة:
- ✅ PWA support
- ✅ Offline mode
- ✅ Push notifications
- ✅ Dark mode toggle
- ✅ Export to PDF/Excel
- ✅ Advanced filtering
- ✅ Bulk operations

## 📞 الدعم

للاستفسارات أو المشاكل، يرجى التواصل عبر:
- GitHub Issues
- البريد الإلكتروني

---

**تم التطوير باستخدام:** React + TypeScript + Tailwind CSS + tRPC + Bun

**الإصدار:** 1.0.0

**تاريخ الإنشاء:** 2024
