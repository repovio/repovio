---
title: 'نشر Repovio'
description: 'نشر الإنتاج، وكيل TLS، والنسخ الاحتياطي، والاستعادة، والترقية، وإرشادات التراجع لـ Repovio.'
---

يبدأ مكدس الإنشاء الخاص بـ Repovio PostgreSQL، ويطبق عمليات ترحيل Prisma مرة واحدة، ثم يبدأ واجهة برمجة التطبيقات (API)
وتطبيقات الويب. لا ينهي TLS. ضع خدمات الويب وواجهة برمجة التطبيقات (API) خلف وكيل عكسي يمتلك اسم المضيف العام والشهادات.

<a id="prerequisites"></a>

## المتطلبات الأساسية

- محرك Docker مع Docker Compose v2.
- سجل DNS لاسم المضيف العام.
- وكيل عكسي يحصل على شهادات TLS ويجددها.
- دليل خادم خاص لا يمكن قراءته إلا من قبل مسؤولي النشر.

تحتفظ مجموعة Compose ببيانات PostgreSQL، بما في ذلك صور ملف تعريف المستخدم التي تمت تسويتها، في وحدة التخزين المسماة
`repovio-postgres`. لا تقم بحذف وحدة التخزين هذه إلا إذا كنت ترغب عمدًا في إزالة كافة بيانات Repovio.

<a id="first-deployment"></a>

## النشر الأول

### الخطوة 1: التحقق من إصدار Repovio وإنشاء ملف البيئة الخاص:

```bash
cp .env.example .env
chmod 600 .env
```

### الخطوة 2: استبدل كل عنصر نائب في `.env`، وخاصة `POSTGRES_PASSWORD`، وعناوين URL لقاعدة البيانات، و`AUTH_JWT_SECRET`، و

`TOKEN_ENCRYPTION_KEY`. قم بإنشاء مفتاح التشفير باستخدام:

```bash
openssl rand -base64 32
```

### الخطوة 3: قم بتعيين عناوين URL المرئية خارجيًا. للنشر في `https://repovio.example.com`، استخدم:

```dotenv
PUBLIC_URL=https://repovio.example.com
OIDC_CALLBACK_URL=https://repovio.example.com/api/v1/auth/oidc/callback
CORS_ORIGIN=https://repovio.example.com
NUXT_PUBLIC_API_BASE_URL=https://repovio.example.com/api/v1
OAUTH_CALLBACK_URL=https://repovio.example.com/api/v1/provider-accounts/oauth/callback
```

### الخطوة 4: ربط منافذ الحاوية للاسترجاع عند تشغيل الوكيل العكسي على نفس المضيف:

```dotenv
REPOVIO_API_PORT=127.0.0.1:3001
REPOVIO_WEB_PORT=127.0.0.1:3000
```

بخلاف ذلك، قم بتقييد الوصول إلى المنفذين 3000 و3001 باستخدام جدار الحماية المضيف. لا تعرض أبدًا حاوية PostgreSQL.

### الخطوة 5: قم بتعيين `REPOVIO_VERSION` في `.env` على زوج صور تم إصداره بالضبط، ثم ابدأ المجموعة:

```bash
docker compose pull
docker compose up --detach --wait
```

احتفظ بهذه القيمة في `.env` بحيث يستخدم كل أمر إنشاء لاحق نفس واجهة برمجة التطبيقات وإصدار الويب.

### الخطوة 6: تأكيد نقطة نهاية سلامة واجهة برمجة التطبيقات محليًا:

```bash
curl --fail http://127.0.0.1:3001/api/health
```

### الخطوة 7: افتح عنوان URL العام لـ Repovio وأكمل [الإعداد للتشغيل الأول لمرة واحدة](/docs/v2.0/authentication) لإنشاء أول عنوان URL

مسؤول النظام.

<a id="reverse-proxy-and-tls"></a>

## الوكيل العكسي وTLS

قم بتوصيل أصل الويب العام إلى المنفذ 3000، ومسارات API وSocket.IO إلى المنفذ 3001. على سبيل المثال، يمكن أن تستخدم كتلة
موقع Caddy:

```caddy
repovio.example.com {
  reverse_proxy /api/* 127.0.0.1:3001
  reverse_proxy /socket.io/* 127.0.0.1:3001
  reverse_proxy /mcp 127.0.0.1:3001
  reverse_proxy 127.0.0.1:3000
}
```

يجب على الوكيل إعادة توجيه HTTP إلى HTTPS، والتحقق من صحة الاتصالات الأولية وفقًا لسياسته المحلية، والحفاظ على اسم
المضيف العام. قم بتكوين موفري OAuth بنفس عنوان URL لرد اتصال HTTPS الذي تم تعيينه في `OAUTH_CALLBACK_URL`.

<a id="upgrading"></a>

## الترقية

<a id="migrating-an-earlier-installation"></a>

### ترحيل تثبيت سابق

اتبع [ترقية العلامة التجارية](/docs/v2.0/branding-upgrade) قبل بدء المكدس المعاد تسميته. قم بتعيين
`REPOVIO_POSTGRES_VOLUME` على اسم وحدة التخزين الموجودة بالضبط. الحفاظ على بيانات اعتماد قاعدة البيانات ومفتاح التشفير؛
لا يلزم نسخ قاعدة البيانات أو إعادة تعيينها للعلامة التجارية.

### الخطوة 1: إنشاء نسخة احتياطية لقاعدة البيانات والتحقق منها قبل تغيير الصور.

### الخطوة 2: قم بتعيين `REPOVIO_VERSION` على إصدار الإصدار الدقيق في `.env`.

### الخطوة 3: سحب الإصدار وتطبيقه:

```bash
docker compose pull
docker compose up --detach --wait
```

تطبق خدمة `migrate` عمليات ترحيل Prisma المعلقة قبل بدء تشغيل واجهة برمجة التطبيقات (API). قم بفحصه بعد كل تحديث:

```bash
docker compose logs migrate
```

### الخطوة 4: تحقق من نقطة النهاية الصحية ولوحة المعلومات التي يخدمها الوكيل قبل التفكير في اكتمال التحديث.

<a id="database-backup"></a>

## النسخ الاحتياطي لقاعدة البيانات

قم بتشغيل النسخ الاحتياطية من دليل النشر. يؤدي هذا إلى كتابة تفريغ PostgreSQL بتنسيق مخصص إلى المضيف دون طباعة بيانات
الاعتماد أو وضعها في سطر الأوامر:

```bash
mkdir -p backups
backup_file="backups/repovio-$(date +%F-%H%M%S).dump"
docker compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -Fc "$POSTGRES_DB"' \
  > "$backup_file"
pg_restore --list "$backup_file"
```

قم بتخزين النسخ المشفرة خارج المضيف واختبار عمليات الاستعادة بشكل دوري على نظام منفصل.

<a id="database-restore"></a>

## استعادة قاعدة البيانات

تؤدي الاستعادة إلى استبدال كائنات قاعدة البيانات الحالية. خذ نسخة احتياطية جديدة أولاً وقم بجدولة وقت التوقف عن العمل.

```bash
docker compose stop api web
docker compose exec -T postgres sh -c 'pg_restore -U "$POSTGRES_USER" --clean --if-exists --no-owner -d "$POSTGRES_DB"' \
  < backups/repovio-YYYY-MM-DD-HHMMSS.dump
docker compose up --detach --wait
```

بعد ذلك، تحقق من `docker compose logs migrate` ونقطة نهاية سلامة API. قم باستعادة التفريغ الذي تم إنشاؤه بواسطة إصدار
Repovio المتوافق عند التراجع عبر تغييرات المخطط.

<a id="rollback"></a>

## التراجع

### الخطوة 1: احتفظ بالنسخة الاحتياطية فورًا قبل فشل الترقية.

### الخطوة 2: اضبط `REPOVIO_VERSION` في `.env` على آخر إصدار صورة معروف جيدًا.

### الخطوة 3: تشغيل `docker compose pull` و`docker compose up --detach --wait`.

### الخطوة 4: إذا كان الإصدار الأحدث قد قام بترحيل قاعدة البيانات بشكل غير متوافق، فأوقف واجهة برمجة التطبيقات والويب، واستعد النسخة الاحتياطية المتوافقة، ثم

ابدأ إصدار الصورة السابقة مرة أخرى.

لا تستخدم `docker compose down --volumes` أبدًا كأمر تحديث أو التراجع: فهو يزيل وحدة التخزين PostgreSQL المسماة.
