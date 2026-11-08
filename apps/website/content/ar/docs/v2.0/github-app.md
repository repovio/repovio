---
title: 'إعداد GitHub App'
description: 'سجّل تطبيق GitHub الخاص بك واربطه ببيانات اعتماد مشفرة وصلاحية قراءة فقط للتثبيت.'
---

<a id="register-app"></a>

## تسجيل التطبيق

استخدم تطبيق GitHub.com واحدًا لكل نشر Repovio؛ تبقى PAT وOAuth متاحة. بصفتك المالك افتح Settings ثم Developer settings
ثم GitHub Apps ثم New GitHub App. اختر اسمًا فريدًا وصفحة Repovio الرئيسية. اختر Any account لعدة حسابات؛ التطبيق الخاص
يثبت فقط في حساب مالكه. لا تحتاج إلى سر عميل OAuth أو عنوان رد اتصال أو عنوان إعداد.

<a id="permissions-and-events"></a>

## الصلاحيات والأحداث

اضبط الصلاحيات الأساسية أدناه على Read-only؛ تمنح Metadata تلقائيًا. أضف صلاحيات الأمان الاختيارية عند الحاجة والتوفر
فقط. اشترك في الأحداث المذكورة؛ يرسل GitHub أحداث دورة حياة التثبيت تلقائيًا. يقيد Repovio الرموز المنشأة بالقراءة حتى
إذا امتلك التطبيق صلاحيات إضافية.

```text
Required repository permissions (Read-only):
Actions (actions)
Issues (issues)
Pull requests (pull_requests)
Metadata (metadata, automatic)

Optional repository permissions (Read-only):
Dependabot alerts (dependabot_alerts)
Code scanning alerts (security_events)
Secret scanning alerts (secret_scanning_alerts)

Webhook events:
workflow_run
issues
pull_request
dependabot_alert
code_scanning_alert
secret_scanning_alert
```

<a id="configure-repovio"></a>

## تهيئة Repovio

فعّل الويب هوك باستخدام عنوان HTTPS العام أدناه. يجب أن يشير PUBLIC_URL إلى نشر متاح خارجيًا. أنشئ سرًا عشوائيًا من 16
محرفًا على الأقل وأدخل القيمة نفسها في GitHub وRepovio. أنشئ مفتاح RSA في GitHub ونزّل ملف PEM. افتح إدارة حسابات
الموفرين ثم GitHub App وأدخل App ID وslug والمفتاح الخاص كاملًا وسر الويب هوك ثم تحقق واحفظ. تتحقق الواجهة من الهوية
وتشفر السرّين في PostgreSQL. احم مفتاح تشفير النشر؛ لا تعاد الأسرار المخزنة إلى المتصفح.

```text
https://repovio.example.com/api/v1/webhooks/github-app
```

<a id="install-and-connect"></a>

## التثبيت والربط

ثبّت التطبيق عبر GitHub واختر الحساب أو المؤسسة والمستودعات المطلوبة فقط. ارجع وحدّث قائمة التثبيتات ثم اربط الحساب
المطلوب. لا يمكن ربط تثبيت معلق أو مرتبط مسبقًا مرة أخرى. تأتي القائمة من التطبيق المهيأ؛ لا تثق بمعرف تثبيت من رد
المتصفح. أضف المستودعات من شاشتها. تتجدد الرموز تلقائيًا؛ يكمل الاستيراد الأول والاستقصاء الدوري الويب هوك.

غيّر اسم الحساب المحلي قبل الربط إذا كان يطابق اسم حساب PAT أو OAuth موجود.

<a id="rotate-and-disconnect"></a>

## التدوير والفصل

أنشئ مفتاحًا بديلًا في GitHub واحفظه وتحقق من المزامنة قبل حذف القديم. غيّر سر الويب هوك على الجانبين معًا؛ ترفض
التوقيعات القديمة فورًا. الحقول الفارغة تحفظ الأسرار السابقة. احذف الحسابات المرتبطة قبل استبدال هوية التطبيق أو حذف
التهيئة؛ تحذف البيانات التابعة أيضًا لذا صدّرها أولًا. الحذف المحلي لا يزيل التطبيق من GitHub.

<a id="troubleshooting"></a>

## استكشاف الأخطاء

تحقق من App ID وslug وPEM عند فشل الإعداد. عند فشل التوقيع تحقق من السر وHTTPS وحفاظ الوكيل على الجسم الأصلي. إذا كانت
القائمة فارغة فتحقق من المستودعات والصلاحيات وحدّثها. تحتفظ التثبيتات المحذوفة أو المعلقة بالبيانات؛ استعد الوصول في
GitHub وحدّث القائمة. غياب صلاحيات الأمان الاختيارية لا يوقف المجالات الأخرى. راجع Jobs. يستمر الاستقصاء عند فشل الويب
هوك. الاختبارات الوهمية لا تتحقق من تثبيت GitHub حقيقي؛ يلزم تطبيق اختبار.

## انظر أيضًا

- [حسابات الموفرين](/docs/v2.0/provider-accounts)
- [إعداد OAuth](/docs/v2.0/provider-oauth)
- [ويب هوك الموفرين](/docs/v2.0/provider-webhooks)
