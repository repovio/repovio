---
title: 'إعداد الموفر OAuth'
description: 'قم بتسجيل تطبيقات OAuth وقم بتكوين مصادقة موفر القراءة فقط لـ Repovio.'
---

> لقطة المصدر المؤرشفة. تستخدم ملصقات المنتجات Repovio. استخدم معرفات التكوين ومراجع الحاوية من ملفات النشر ذات العلامات
> لهذا الإصدار دون تغيير.

يربط Repovio حسابات الموفرين من خلال OAuth أو رمز الوصول الشخصي (PAT). يتوفر OAuth عند تكوين عميل OAuth لموفر واحد على
الأقل. بدون أي عملاء OAuth تم تكوينهم، توفر شاشة حساب الموفر مصادقة PAT فقط. يستخدم Repovio إما بيانات الاعتماد الناتجة
فقط لواجهات برمجة تطبيقات موفر القراءة فقط ويقوم بتشفيرها قبل كتابتها إلى PostgreSQL.

<a id="register-oauth-applications"></a>

## تسجيل تطبيقات OAuth

قم بتسجيل تطبيق OAuth واحد لكل مثيل موفر يجب أن يتصل به Repovio. قم بتعيين عنوان URL الدقيق لرد الاتصال من
`OAUTH_CALLBACK_URL` في كل تسجيل للتطبيق. بالنسبة للتثبيت المحلي، يكون الإعداد الافتراضي هو
`http://localhost:3001/api/v1/provider-accounts/oauth/callback`.

قم بتكوين معرف العميل وسر العميل في بيئة API، وليس في تطبيق الويب أو Git أبدًا:

```dotenv
OAUTH_CALLBACK_URL=https://repovio.example.com/api/v1/provider-accounts/oauth/callback
GITHUB_OAUTH_CLIENT_ID=...
GITHUB_OAUTH_CLIENT_SECRET=...
GITLAB_OAUTH_BASE_URL=https://gitlab.example.com
GITLAB_OAUTH_CLIENT_ID=...
GITLAB_OAUTH_CLIENT_SECRET=...
FORGEJO_OAUTH_BASE_URL=https://forgejo.example.com
FORGEJO_OAUTH_CLIENT_ID=...
FORGEJO_OAUTH_CLIENT_SECRET=...
```

قم بتكوين الموفرين الذين يحتاجهم هذا التثبيت فقط. يجب دائمًا تكوين معرفات العملاء وأسرارهم كأزواج. يحدد
`GITLAB_OAUTH_BASE_URL` مثيل GitLab الفردي لتطبيق OAuth المثبت. يحتاج Forgejo إلى عنوان URL أساسي صريح عند تكوين عميل
OAuth الخاص به.

<a id="read-scopes"></a>

## قراءة النطاقات

استخدم هذه النطاقات عند تسجيل التطبيق:

- GitHub: `repo security_events`. يجب إعادة ترخيص حسابات OAuth الموجودة قبل أن يتمكن Repovio من قراءة التنبيهات الأمنية.
- GitLab: `read_api read_user`.

تحتاج رموز الوصول الشخصية GitHub الدقيقة إلى إمكانية الوصول للقراءة إلى تنبيهات Dependabot وتنبيهات مسح التعليمات
البرمجية وتنبيهات المسح السري. يعتمد الوصول إلى تنبيه الأمان GitLab بالإضافة إلى ذلك على ترخيص المثيل ودور مشروع مالك
الرمز المميز؛ يتم عرض أنواع التنبيهات غير المتوفرة دون فشل نطاقات مزامنة المستودع الأخرى.

- Forgejo: `read:repository`.
- Gitea: قم بتكوين رمز وصول شخصي مع إمكانية الوصول للقراءة في نموذج حساب موفر Gitea، بما في ذلك عنوان URL الأساسي
  للمثيل. لا يقدم Repovio حاليًا عميل Gitea OAuth مشترك لأن كل مثيل مستضاف ذاتيًا يحتاج إلى تسجيل التطبيق الخاص به.

تعرض محولات Repovio فقط التحقق من الصحة والاكتشاف ومزامنة سير العمل والتحقق من خطاف الويب. ولا يقومون بإنشاء موارد
الموفر أو تحديثها أو إرسالها أو إعادة تشغيلها أو إلغاءها أو حذفها. تبقى أسرار العميل OAuth في بيئة API، ولا يتم إرجاع
الرموز المميزة للموفر أبدًا بواسطة Repovio API.
