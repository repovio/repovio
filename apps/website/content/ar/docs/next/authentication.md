---
title: 'المصادقة'
description: 'قم بتكوين المصادقة المحلية وتسجيل الدخول الاختياري لـ OpenID Connect واسترداد الحساب.'
---

<a id="first-run-setup"></a>

## الإعداد للتشغيل لأول مرة

بعد نشر التثبيت الجديد، افتح عنوان URL العام الخاص به. يقوم Repovio بإعادة توجيه كل طلب إلى `/auth/setup` حتى يوجد
الحساب الأول. أدخل الاسم الأول والأخير الاختياري، واسم مستخدم فريد، وكلمة مرور مكونة من 12 حرفًا على الأقل. يتم إنشاء
الحساب كمسؤول النظام وتسجيل الدخول على الفور.

يمكن أن ينجح الإعداد مرة واحدة فقط. بعد وجود المستخدم الأول، يقوم `/auth/setup` بإعادة التوجيه إلى `/auth/signin`. تحتفظ
عمليات التثبيت الموجودة بمستخدميها الحاليين أثناء الترقيات ولا تعرض الإعداد مرة أخرى.

<a id="openid-connect-single-sign-on"></a>

## OpenID Connect لتسجيل الدخول الموحد

يدعم Repovio موفر OpenID Connect الاختياري بالإضافة إلى تسجيل الدخول المحلي. يقوم مسؤول النظام بتكوينه ضمن **الإعدادات →
المصادقة**. تسجيل الدخول هذا منفصل عن موفر GitHub وGitLab وForgejo وGitea OAuth: OIDC يحدد مستخدم Repovio، بينما يمنح
الموفر OAuth حق الوصول للقراءة إلى موارد الموفر فقط.

قم بتعيين عنوان URL الدقيق لرد اتصال واجهة برمجة التطبيقات (API) الذي يمكن الوصول إليه خارجيًا قبل تكوين الموفر:

```dotenv
PUBLIC_URL=https://repovio.example.com
OIDC_CALLBACK_URL=https://repovio.example.com/api/v1/auth/oidc/callback
```

قم بتسجيل قيمة `OIDC_CALLBACK_URL` كعنوان URI لإعادة التوجيه المسموح به لدى موفر الهوية. قم بتكوين جهة الإصدار ومعرف
العميل وسر العميل الاختياري والنطاقات والمطالبة الجماعية في Repovio. تقبل واجهة برمجة التطبيقات (API) سر العميل عند
الحفظ ولكنها لا تُرجع قيمته مطلقًا. يتم تشفيره أثناء الراحة باستخدام `TOKEN_ENCRYPTION_KEY`. احفظ التكوين قبل استخدام
**التحقق من الاتصال**؛ تؤدي التغييرات غير المحفوظة إلى تعطيل هذا الفحص. تأكد من نجاح الاكتشاف قبل الاعتماد على تسجيل
الدخول OIDC.

HTTPS مطلوب للمصدر ونقاط النهاية الخاصة به. **السماح لمصدر HTTP** مخصص فقط لشبكات المختبرات المعزولة؛ ويجب ألا يتم
تمكينه مطلقًا للنشر الذي يمكن الوصول إليه عبر الإنترنت. يظل تسجيل الدخول بكلمة المرور المحلية متاحًا كمسار استرداد حتى
عند تمكين OIDC.

يعرض النموذج أيضًا عنوان URL لرد الاتصال للنسخ والمجموعات التي تم تكوينها/مراقبتها وعناصر تحكم منفصلة لاستبدال سر العميل
المخزن أو مسحه. يؤدي ترك الاستبدال معطلاً إلى الحفاظ على السر المحفوظ. يتم الإبلاغ عن حالات فشل التحميل والحفظ والتحقق
من الاتصال بشكل منفصل. أصلح التكوين غير الصالح واحفظه مرة أخرى قبل إعادة محاولة التحقق من الاتصال.

<a id="groups-roles-and-identities"></a>

### المجموعات والأدوار والهويات

يمكن أن يكون claim المجموعات اسماً مطابقاً أو مساراً مفصولاً بنقاط مثل `realm_access.groups`. استخدم قيماً مطابقة حساسة
لحالة الأحرف. عند تعدد التطابقات تكون الأولوية `SYSTEM_ADMIN` ثم `MANAGER` ثم `VIEWER`. تُرفض المجموعات الغائبة أو غير
المطابقة ما لم يُفعّل صراحة وصول Viewer لغير المطابقين. تُرفض claims المشوهة وعلامات تجاوز حد المجموعات دائماً.

يتم ربط حساب OIDC فقط بواسطة المُصدر المعتمد وزوج الموضوع. لا يربط Repovio أبدًا تسجيل دخول OIDC بحساب محلي عن طريق
عنوان البريد الإلكتروني أو اسم المستخدم. تتم مزامنة الأسماء الأولى والأخيرة من المطالبات التي تم التحقق منها عند كل
تسجيل دخول ناجح؛ لا يمكن تغيير اسم تسجيل الدخول وأسماء ملفات التعريف وكلمة المرور محليًا. تظل عضويات المستودع مُدارة في
Repovio ولا يتم اشتقاقها مطلقًا من مجموعات موفري الهوية.

تؤدي تغييرات الإعدادات المتعلقة بالأمان أو تغييرات الأدوار إلى إبطال رموز OIDC الحالية. لا يؤدي تغيير اسم العرض الخاص
بالموفر فقط إلى إبطال رموز OIDC الحالية. يؤدي تعطيل مجموعة لدى موفر الهوية أو إزالتها إلى منع الحساب المتأثر من إنشاء
جلسة جديدة، وإبطال جلساته السابقة بعد محاولة تسجيل الدخول المرفوضة التالية.

<a id="provider-examples"></a>

### أمثلة للموفرين

أدلة الموفرين: [Keycloak](#oidc-keycloak) · [Microsoft Entra ID](#oidc-entra-id) · [Auth0](#oidc-auth0)

بالنسبة إلى Authentik، قم بإنشاء موفر OAuth2/OpenID مع تدفق كود التفويض، وعنوان URL الدقيق لرد الاتصال أعلاه، ونطاقات
`openid`، و`profile`، و`email`. قم بإضافة تعيين نطاق يقوم بإرجاع مطالبة المجموعة المختارة كمصفوفة من أسماء المجموعات،
وقم بإرفاق الموفر بالتطبيق، ثم انسخ مصدر التطبيق ومعرف العميل وسر العميل إلى Repovio.

بالنسبة لموفر آخر متوافق مع المعايير، قم بتمكين تدفق رمز التفويض، واشترط S256 PKCE، وقم بتسجيل عنوان URL الدقيق لرد
الاتصال، وقم بتضمين `sub` ثابت بالإضافة إلى مطالبة المجموعة التي تم تكوينها في رمز المعرف أو استجابة UserInfo. يقبل
Repovio فقط التوقيعات غير المتماثلة لرمز التعريف ويرفض الرموز المميزة غير الموقعة والموقعة بواسطة HMAC.

<a id="oidc-keycloak"></a>

#### Keycloak

في وحدة إدارة Keycloak، أنشئ realm باسم repovio وعميل OpenID Connect باسم repovio. فعّل Client authentication وStandard
flow، وعطّل Implicit flow وDirect access grants. سجّل عنوان callback المطابق أدناه في Valid redirect URIs، واشترط S256
واحتفظ بتوقيع RS256. انسخ سر العميل من Credentials.

أضف mapper من نوع Group Membership في scope المخصص للعميل: اجعل Token Claim Name هو groups، وعطّل Full group path وفعّل
Add to ID token. أضف profile وemail كنطاقين افتراضيين. أنشئ repovio-admins وrepovio-managers وrepovio-viewers وعيّن
المستخدمين، ثم اربط أسماء المجموعات الكاملة بأدوار Repovio المناسبة. أدوار realm ليست عضويات مجموعات.

```text
Issuer: https://auth.example.com/realms/repovio
Discovery: https://auth.example.com/realms/repovio/.well-known/openid-configuration
Redirect URI: https://repovio.example.com/api/v1/auth/oidc/callback
Client ID: repovio
Scopes: openid profile email
Groups claim: groups
SYSTEM_ADMIN: repovio-admins
MANAGER: repovio-managers
VIEWER: repovio-viewers
```

المراجع: [Keycloak](https://www.keycloak.org/docs/latest/server_admin/index.html#_oidc_clients)

<a id="oidc-entra-id"></a>

#### Microsoft Entra ID

في Entra ID → App registrations سجّل تطبيقاً لمستأجر واحد، وأضف منصة Web وعنوان callback المطابق أدناه دون تفعيل الإصدار
الضمني للرموز. انسخ Application (client) ID وDirectory (tenant) ID. أنشئ سر عميل وانسخ Value، وليس معرّف السر. استخدم
معرّف المستأجر في issuer v2، وليس common أو organizations.

في Token configuration أضف groups إلى ID tokens لمجموعات الأمان باستخدام Group ID. أنشئ ثلاث مجموعات وعيّن المستخدمين
واربط معرّفات كائنات المجموعات بـ SYSTEM_ADMIN وMANAGER وVIEWER. أسماء العرض لا تطابق GUID. قد تتطلب تصفية المجموعات
المعيّنة ترخيص Entra مناسباً. استخدم S256 PKCE وتوقيعات غير متماثلة وجدّد السر قبل انتهاء صلاحيته.

يرفض Repovio علامات تجاوز حد المجموعات حتى مع تفعيل دخول المستخدم غير المطابق بدور Viewer. لا يتبع مصادر claims خارجية
ولا يستعلم عن Microsoft Graph. قلّل العضويات الصادرة أو اضبط تصفية مدعومة؛ منح أذونات Graph لا يحل المشكلة.

```text
Issuer: https://login.microsoftonline.com/TENANT_ID/v2.0
Discovery: https://login.microsoftonline.com/TENANT_ID/v2.0/.well-known/openid-configuration
Redirect URI: https://repovio.example.com/api/v1/auth/oidc/callback
Scopes: openid profile email
Groups claim: groups
SYSTEM_ADMIN: ADMIN_GROUP_OBJECT_ID
MANAGER: MANAGER_GROUP_OBJECT_ID
VIEWER: VIEWER_GROUP_OBJECT_ID
```

المراجع:
[Microsoft Entra ID](https://learn.microsoft.com/en-us/security/zero-trust/develop/configure-tokens-group-claims-app-roles)

<a id="oidc-auth0"></a>

#### Auth0

أنشئ Regular Web Application وسجّل callback المطابق في Allowed Callback URLs، وفعّل Authorization Code مع S256 PKCE
واختر RS256. اضبط Token Endpoint Authentication Method على Basic. انسخ client ID والسر. خذ issuer من discovery للمستأجر
أو النطاق المخصص المختار مع الشرطة المائلة الأخيرة؛ لا تخلط النطاقات.

أنشئ Action من نوع Login / Post Login بالمثال أدناه، واستبدل REPLACE_WITH_REPOVIO_CLIENT_ID، ثم انشرها وأضفها إلى Login
flow. يضبط المسؤول app_metadata.repovio_groups لكل مستخدم كمصفوفة تضم repovio-admins أو repovio-managers أو
repovio-viewers. لا تستخدم user_metadata القابلة للتعديل من المستخدم للتفويض. لا يصدر Auth0 هذه المجموعات تلقائياً؛
claim في access token وحده غير كافٍ. في Repovio استخدم اسم claim الكامل ذي namespace واربط القيم الثلاث بالأدوار
المناسبة.

```text
Issuer: https://YOUR_TENANT.REGION.auth0.com/
Discovery: https://YOUR_TENANT.REGION.auth0.com/.well-known/openid-configuration
Redirect URI: https://repovio.example.com/api/v1/auth/oidc/callback
Scopes: openid profile email
Groups claim: https://repovio.example.com/groups
SYSTEM_ADMIN: repovio-admins
MANAGER: repovio-managers
VIEWER: repovio-viewers
```

```javascript
/** Add administratively managed Repovio groups to this application's ID token. */
exports.onExecutePostLogin = async (event, api) => {
  if (event.client.client_id !== 'REPLACE_WITH_REPOVIO_CLIENT_ID') return;
  const groups = event.user.app_metadata?.repovio_groups;
  api.idToken.setCustomClaim('https://repovio.example.com/groups', Array.isArray(groups) ? groups : []);
};
```

المراجع: [Auth0](https://auth0.com/docs/secure/tokens/json-web-tokens/create-custom-claims)

<a id="verify-oidc-providers"></a>

#### التحقق واستكشاف الأخطاء

لكل موفر، سجّل OIDC_CALLBACK_URL بدقة واطلب openid profile email واستخدم Authorization Code مع S256 PKCE وتوقيع غير
متماثل. احفظ issuer وclient ID والسر وscopes وclaim المجموعات في الإعدادات → المصادقة ثم افحص الاتصال. نجاح discovery لا
يتحقق من مجموعات المستخدم.

اختبر مستخدمين منفصلين لأدوار SYSTEM_ADMIN وMANAGER وVIEWER ومستخدماً غير معيّن يجب رفضه عند تعطيل Viewer لغير
المطابقين. راجع تهجئة المجموعات ومسارات Keycloak ومعرّفات كائنات Entra وclaim الخاص بـ Auth0 في ID token. احتفظ بمسؤول
محلي للاستعادة. تمنح مجموعات OIDC أدواراً عامة فقط؛ تحتاج المستودعات إلى أذونات Repovio منفصلة. اضبط موفر هوية واحداً
فقط.

<a id="oidc-api-contract"></a>

### عقد OIDC API

| الطريقة      | المسار                       | الوصول       | الغرض                                                                    |
| ------------ | ---------------------------- | ------------ | ------------------------------------------------------------------------ |
| `GET`        | `/api/v1/auth/oidc/status`   | عام          | إرجاع التوفر الفعال واسم الموفر الاختياري فقط.                           |
| `GET`        | `/api/v1/auth/oidc/start`    | عام          | يبدأ رمز التفويض المرتبط بالمتصفح ومعاملة S256 PKCE.                     |
| `GET`        | `/api/v1/auth/oidc/callback` | عام          | التحقق من صحة استجابة الموفر وإعادة التوجيه باستخدام رمز جزء لمرة واحدة. |
| `POST`       | `/api/v1/auth/oidc/exchange` | عام          | يستهلك رمز الجزء مرة واحدة ويعيد الحامل العادي `AuthResult`.             |
| `GET`، `PUT` | `/api/v1/auth/oidc/config`   | مسؤول النظام | يقرأ أو يقوم بتحديث إعدادات OIDC السرية والآمنة.                         |
| `POST`       | `/api/v1/auth/oidc/check`    | مسؤول النظام | التحقق من تكوين الاكتشاف المحفوظ دون تغييره.                             |

لا يضع رد الاتصال مطلقًا حامل JWT في عنوان URL. تنتهي صلاحية رمز التبادل غير الشفاف الخاص به بعد 60 ثانية ويمكن استخدامه
مرة واحدة فقط. يتم تقليل أخطاء الموفر إلى رموز خطأ مستقرة قبل أن تصل إلى المتصفح أو السجلات.

<a id="change-your-password"></a>

## تغيير كلمة المرور الخاصة بك

أثناء تسجيل الدخول، افتح **الإعدادات → عام → تغيير كلمة المرور**. أدخل كلمة المرور الحالية وكلمة المرور الجديدة
وتأكيدها. يحافظ Repovio على تسجيل دخول المتصفح الحالي باستخدام رمز وصول بديل ويبطل الرموز المميزة التي تحتفظ بها كل جلسة
تسجيل دخول أخرى.

<a id="reset-a-forgotten-password"></a>

## إعادة تعيين كلمة المرور المنسية

Repovio لم تتم إعادة تعيين كلمة المرور عبر البريد الإلكتروني عمدًا. يمكن لمسؤول النشر إعادة تعيين حساب محلي من الدليل
الذي يحتوي على `compose.yml`. اقرأ كلمة المرور البديلة دون تكرارها أو تخزينها في سجل الصدفة، ثم أرسلها إلى حاوية API عبر
الإدخال القياسي:

```bash
read -rsp 'New Repovio password: ' REPOVIO_NEW_PASSWORD
printf '\n'
printf '%s\n' "$REPOVIO_NEW_PASSWORD" \
  | docker compose exec -T api node dist/scripts/reset-password.js USERNAME
unset REPOVIO_NEW_PASSWORD
```

استبدل `USERNAME` باسم المستخدم الدقيق لتسجيل الدخول. يتطلب الأمر كلمة مرور تتراوح بين 12 و256 حرفًا، ويقوم بتحديث هذا
الحساب المحلي فقط، ويبطل كافة رموز الوصول الموجودة الخاصة به. قم بتسجيل الدخول مرة أخرى باستخدام كلمة المرور الجديدة بعد
ذلك. يرفض الأمر الحسابات المُدارة بواسطة OIDC لأنها لا تحتوي على كلمة مرور محلية.

<a id="local-user-and-group-management"></a>

## مجموعات الوصول المحلية

في وصول المجموعات للمستودع عيّن Viewer أو Manager أو غيّر الصلاحية أو احذفها. تُجمع الصلاحيات المباشرة والموروثة وتغلب
Manager. تتطلب الإدارة دور Manager عاماً أيضاً؛ مسؤول النظام غير مقيد. يسري الإلغاء في الطلب التالي ما لم تبق صلاحية
أخرى. تدعم المجموعات الحسابات المحلية وOIDC دون مزامنة مطالبات OIDC.

[مجموعات الوصول المحلية](/docs/next/users#local-access-groups)
