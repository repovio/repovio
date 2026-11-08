---
title: ترقية PostgreSQL من 17 إلى 18
description: نقل البيانات إلى وحدة تخزين PostgreSQL 18 جديدة والتحقق من الاستعادة.
---

تستخدم حزمة Compose الحالية `postgres:18-alpine` وتربط وحدة التخزين المسماة عند `/var/lib/postgresql`. يخزن PostgreSQL
18 العنقود في مجلد فرعي خاص بالإصدار. لا يمكن استخدام ملفات PostgreSQL 17 مباشرة. راجع
[توثيق الصورة الرسمي](https://hub.docker.com/_/postgres).

ينشئ هذا الإجراء تفريغًا لقاعدة بيانات التطبيق ويستعيده في **وحدة تخزين جديدة منفصلة**. يتطلب نافذة صيانة. لا تجمعه مع
[تغيير العلامة التجارية](/docs/v2.0/branding-upgrade)؛ أكمل ذلك أولًا باستخدام الإصدار السابق الذي يعمل على
PostgreSQL 17. تحديث المصدر لا ينفذ ترحيل الإنتاج تلقائيًا.

<a id="before-maintenance"></a>

## قبل الصيانة

- احتفظ بإعدادات الإصدار السابق كاملة وملف `.env` والاسم الدقيق لوحدة PostgreSQL 17. اترك ملف Compose في مجلد الإصدار
  السابق لضمان صحة مسارات الربط النسبية وملفات البيئة.
- لا تغير `POSTGRES_DB` أو `POSTGRES_USER` أو `POSTGRES_PASSWORD` أو `TOKEN_ENCRYPTION_KEY` أو `AUTH_JWT_SECRET`.
  المفتاح مطلوب لفك تشفير بيانات اعتماد المزودين والإشعارات الحالية.
- وفر مساحة للتفريغ ووحدتي التخزين. احم النسخ الاحتياطية وملف `.env` باعتبارها أسرارًا.
- يفترض الإجراء دور قاعدة البيانات الوحيد في Repovio. احصر الأدوار والصلاحيات والإضافات وقواعد البيانات الإضافية بشكل
  منفصل؛ لا تفترض أن تفريغ التطبيق ينسخها أيضًا.
- تدرب على الاستعادة والتحقق بنسخة مؤقتة. يستخدم `pnpm test:postgres-upgrade` ترحيلات التطبيق الحقيقية وبيانات اصطناعية
  فقط؛ لا يتحقق من نسخة احتياطية لنشر معين.

<a id="stop-writers-and-back-up-postgresql-17"></a>

## إيقاف الكتابة ونسخ PostgreSQL 17 احتياطيًا

نفذ الأوامر من **مجلد الإصدار السابق** باستخدام إعدادات Compose الخاصة بـ PostgreSQL 17 فيه. أوقف كذلك أي عمليات كتابة
خارجية. لا تبدأ التطبيق الجديد قبل اكتمال الاستعادة والتحقق.

```sh
umask 077
docker compose stop web api migrate
backup="$PWD/repovio-postgresql17-$(date -u +%Y%m%dT%H%M%SZ).dump"
docker compose exec -T postgres sh -ec \
  'pg_dump --format=custom --no-owner --no-privileges --username "$POSTGRES_USER" --dbname "$POSTGRES_DB"' > "$backup"
docker compose exec -T postgres sh -ec \
  'psql -X --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c "SELECT count(*) FROM users; SELECT count(*) FROM repositories; SELECT count(*) FROM notification_channels; SELECT count(*) FROM _prisma_migrations;"'
docker compose stop postgres
```

سجل الأعداد المرجعية بسرية. تحقق من التفريغ باستعادته، لا بفحص حجمه فقط. احتفظ بالوحدة القديمة والإعدادات السابقة. لا
تنفذ مطلقًا `docker compose down --volumes` ولا تحذف أيًا من وحدتي البيانات.

<a id="restore-into-postgresql-18"></a>

## الاستعادة إلى PostgreSQL 18

في **مجلد الإصدار الجديد** احتفظ ببيانات الاعتماد والمفتاح نفسيهما. اضبط `backup` على المسار المطلق للنسخة الاحتياطية.
اختر اسم وحدة جديدًا وفريدًا واحفظه في `REPOVIO_POSTGRES_VOLUME` بملف `.env` الجديد؛ يجب أن يختلف عن وحدة PostgreSQL 17.
استخدم إعداد تجاوز الوحدة الخارجية لرفض الأسماء الخاطئة أو المفقودة.

```sh
export REPOVIO_POSTGRES_VOLUME=repovio-postgresql18-upgrade
docker volume create "$REPOVIO_POSTGRES_VOLUME"
docker compose -f compose.yml -f compose.upgrade.yml up --detach --wait postgres
docker compose -f compose.yml -f compose.upgrade.yml exec -T postgres sh -ec \
  'pg_restore --exit-on-error --no-owner --no-privileges --username "$POSTGRES_USER" --dbname "$POSTGRES_DB"' < "$backup"
docker compose -f compose.yml -f compose.upgrade.yml exec -T postgres sh -ec \
  'psql -X --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c "SHOW server_version; SHOW data_directory; SELECT count(*) FROM users; SELECT count(*) FROM repositories; SELECT count(*) FROM notification_channels; SELECT count(*) FROM _prisma_migrations;"'
docker compose -f compose.yml -f compose.upgrade.yml run --rm migrate
docker compose -f compose.yml -f compose.upgrade.yml up --detach --wait api web
```

استخدم وحدة جديدة وفارغة فعلًا؛ إذا كان الاسم موجودًا فاختر غيره. ترفض نقطة الدخول بنية البيانات القديمة، بما فيها وحدة
PostgreSQL 17 المربوطة خطأً عند الجذر الجديد؛ لا تحول البيانات. إذا فشلت الاستعادة فاحتفظ بالتفريغ والوحدة القديمة وافحص
الخطأ ثم أعد المحاولة بوحدة فارغة جديدة أخرى. لا تكرر الاستعادة فوق قاعدة مستعادة جزئيًا.

قارن الأعداد المرجعية وعلاقات نموذجية. تحقق من الدخول والصلاحيات وإعدادات الإشعارات وفك التشفير بالمفتاح المحفوظ. افحص
صحة API والسجلات بسرية. أعد تشغيل PostgreSQL 18 وتأكد من بقاء البيانات قبل إنهاء الصيانة. مجلد البيانات الافتراضي
المختبر هو `/var/lib/postgresql/18/docker`.

<a id="recovery"></a>

## الرجوع إلى الإصدار السابق

قبل أي كتابة جديدة يمكن إيقاف الحزمة الجديدة وإعادة تشغيل الإصدار السابق كاملًا بوحدة PostgreSQL 17 وإعداداته الأصليتين.
لا تسمح مطلقًا للحزمتين بالكتابة بالتزامن. احتفظ بالوحدة الجديدة للتشخيص؛ يجب ألا يفتح PostgreSQL 17 ملفات PostgreSQL 18
مطلقًا.

بعد كتابة بيانات جديدة تصبح الوحدة القديمة متقادمة؛ الرجوع إليها يفقد تلك الكتابات. خطط أولًا لمواءمة البيانات أو
لاستعادة مختبرة بشكل منفصل. استعادة تفريغ PostgreSQL 18 في 17 ليست ضمانًا للرجوع إلى إصدار أقدم. احتفظ بالوحدتين والنسخ
الاحتياطية حتى ينهي المشغل نافذة الاستعادة صراحةً.

<a id="disposable-verification"></a>

## التحقق بموارد مؤقتة

```sh
docker build -f apps/api/Dockerfile -t repovio-api:local .
pnpm test:postgres-upgrade
```

ينشئ الاختبار حاويات وشبكة ووحدات بأسماء فريدة؛ يطبق ترحيلات Prisma الحقيقية على الإصدارين؛ يتحقق من التهيئة الجديدة
وقاعدة الظل؛ يرفض وحدة قديمة مربوطة خطأً؛ يستعيد تفريغًا؛ يقارن كل الجداول العامة؛ يفك بيانات اعتماد اصطناعية ويتحقق من
الاستمرار بعد إعادة التشغيل وبقاء البيانات القديمة دون تغيير. التنظيف يزيل موارده فقط. لا يستخدم حاويات أو وحدات أو
قواعد أو بيانات اعتماد موجودة. اضبط `REPOVIO_TEST_API_IMAGE` لاستخدام صورة تطبيق أخرى مبنية محليًا.
