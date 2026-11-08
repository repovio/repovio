---
title: PostgreSQL 17 سے 18 پر منتقلی
description: ڈیٹا کو نئے الگ PostgreSQL 18 والیوم میں منتقل کریں اور بحالی کی تصدیق کریں۔
---

موجودہ Compose اسٹیک `postgres:18-alpine` استعمال کرتا ہے اور نامزد والیوم کو `/var/lib/postgresql` پر ماؤنٹ کرتا ہے۔
PostgreSQL 18 کلسٹر کو نسخے کے مخصوص ذیلی فولڈر میں رکھتا ہے۔ PostgreSQL 17 کی فائلیں براہ راست استعمال نہیں ہو سکتیں۔
[تصویر کی سرکاری دستاویزات](https://hub.docker.com/_/postgres) دیکھیں۔

یہ طریقہ ایپلیکیشن ڈیٹابیس کا ڈمپ بناتا اور اسے **الگ نئے والیوم** میں بحال کرتا ہے۔ دیکھ بھال کا وقت درکار ہے۔ اسے
[برانڈ کی تبدیلی](/docs/v2.0/branding-upgrade) کے ساتھ نہ کریں؛ پہلے پچھلے PostgreSQL 17 ریلیز پر نام کی تبدیلی مکمل
کریں۔ سورس کی تازہ کاری پیداوار کی مائیگریشن خودکار طور پر نہیں چلاتی۔

<a id="before-maintenance"></a>

## دیکھ بھال سے پہلے

- پچھلے ریلیز کی مکمل ترتیب، `.env` اور PostgreSQL 17 والیوم کا درست نام محفوظ رکھیں۔ Compose فائل پرانے ریلیز فولڈر میں
  رکھیں تاکہ نسبتی بائنڈ ماؤنٹس اور ماحول کی فائلوں کے راستے درست رہیں۔
- `POSTGRES_DB`، `POSTGRES_USER`، `POSTGRES_PASSWORD`، `TOKEN_ENCRYPTION_KEY` اور `AUTH_JWT_SECRET` تبدیل نہ کریں۔ کلید
  موجودہ فراہم کنندہ اور اطلاعات کے اسناد کی رمز کشائی کے لیے ضروری ہے۔
- ڈمپ اور دونوں والیوم کے لیے جگہ رکھیں۔ بیک اپ اور `.env` کو راز سمجھ کر محفوظ کریں۔
- طریقہ Repovio کے واحد ڈیٹابیس رول کو فرض کرتا ہے۔ اضافی رول، اجازتیں، ایکسٹینشن اور ڈیٹابیس الگ گنیں؛ ایپلیکیشن ڈمپ ان
  کا بیک اپ لازماً نہیں لیتا۔
- عارضی نقل سے بحالی اور تصدیق کی مشق کریں۔ `pnpm test:postgres-upgrade` اصل مائیگریشن اور صرف مصنوعی ڈیٹا استعمال کرتا
  ہے؛ کسی مخصوص تنصیب کا بیک اپ نہیں جانچتا۔

<a id="stop-writers-and-back-up-postgresql-17"></a>

## لکھنا بند کریں اور PostgreSQL 17 کا بیک اپ بنائیں

کمانڈ **پچھلے ریلیز فولڈر** میں اس کی PostgreSQL 17 Compose ترتیب سے چلائیں۔ دوسرے بیرونی لکھنے والے عمل بھی بند کریں۔
بحالی اور تصدیق ختم ہونے سے پہلے نئی ایپلیکیشن شروع نہ کریں۔

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

ابتدائی تعداد نجی طور پر نوٹ کریں۔ ڈمپ کو بحال کر کے جانچیں، صرف سائز دیکھ کر نہیں۔ پرانا والیوم اور ترتیب محفوظ رکھیں۔
کبھی `docker compose down --volumes` نہ چلائیں اور کسی ڈیٹا والیوم کو حذف نہ کریں۔

<a id="restore-into-postgresql-18"></a>

## PostgreSQL 18 میں بحالی

**نئے ریلیز فولڈر** میں وہی اسناد اور کلید رکھیں۔ `backup` کو بیک اپ کا مطلق راستہ دیں۔ ایک نیا منفرد والیوم نام چنیں
اور نئے `.env` میں `REPOVIO_POSTGRES_VOLUME` کے طور پر محفوظ کریں؛ یہ PostgreSQL 17 والیوم سے مختلف ہو۔ غلط یا غیر موجود
نام روکنے کے لیے بیرونی والیوم کی اووررائیڈ استعمال کریں۔

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

واقعی نیا خالی والیوم استعمال کریں؛ نام پہلے موجود ہو تو دوسرا چنیں۔ انٹری پوائنٹ پرانی ڈیٹا ساخت، بشمول غلطی سے نئی جڑ
پر لگائے گئے PostgreSQL 17 والیوم، کو مسترد کرتا ہے؛ ڈیٹا تبدیل نہیں کرتا۔ بحالی ناکام ہو تو ڈمپ اور پرانا والیوم رکھیں،
مسئلہ جانچیں اور دوسرے نئے خالی والیوم سے کوشش کریں۔ جزوی بحال شدہ ڈیٹابیس پر بار بار بحالی نہ کریں۔

ابتدائی تعداد اور نمائندہ تعلقات کا موازنہ کریں۔ لاگ ان، اجازتیں، اطلاعات اور محفوظ کلید سے رمز کشائی جانچیں۔ API کی صحت
اور لاگز نجی طور پر دیکھیں۔ PostgreSQL 18 دوبارہ شروع کر کے ڈیٹا باقی ہونے کی تصدیق کے بعد دیکھ بھال ختم کریں۔ آزمودہ طے
شدہ ڈائریکٹری `/var/lib/postgresql/18/docker` ہے۔

<a id="recovery"></a>

## پچھلے نسخے کی بحالی

نئی تحریروں سے پہلے نیا اسٹیک روک کر مکمل پچھلا ریلیز اس کے اصل PostgreSQL 17 والیوم اور ترتیب سے چلایا جا سکتا ہے۔
دونوں اسٹیک بیک وقت کبھی نہ لکھیں۔ نیا والیوم تشخیص کے لیے رکھیں؛ PostgreSQL 17 کبھی PostgreSQL 18 کی فائلیں نہ کھولے۔

نئی تحریروں کے بعد پرانا والیوم متروک ہو جاتا ہے؛ اس پر واپسی نئی تحریریں کھو دیتی ہے۔ پہلے ڈیٹا کی مطابقت یا الگ آزمودہ
بحالی کا منصوبہ بنائیں۔ PostgreSQL 18 کا ڈمپ 17 میں بحال ہونا یقینی تنزلی نہیں ہے۔ دونوں والیوم اور بیک اپ تب تک رکھیں
جب تک آپریٹر بحالی کا وقت واضح طور پر ختم نہ کرے۔

<a id="disposable-verification"></a>

## عارضی وسائل سے تصدیق

```sh
docker build -f apps/api/Dockerfile -t repovio-api:local .
pnpm test:postgres-upgrade
```

ٹیسٹ منفرد ناموں کے کنٹینر، نیٹ ورک اور والیوم بناتا ہے؛ دونوں نسخوں پر اصل Prisma مائیگریشن چلاتا ہے؛ نئی ابتدا اور
شیڈو ڈیٹابیس جانچتا ہے؛ غلط ماؤنٹ کیا گیا پرانا والیوم مسترد کرتا ہے؛ ڈمپ بحال کرتا ہے؛ تمام عوامی جدولوں کا موازنہ کرتا
ہے؛ مصنوعی سند کی رمز کشائی اور دوبارہ آغاز پر ڈیٹا کے برقرار رہنے اور پرانے ڈیٹا کے نہ بدلنے کی تصدیق کرتا ہے۔ صفائی
صرف ٹیسٹ کے وسائل ہٹاتی ہے۔ موجودہ کنٹینر، والیوم، ڈیٹابیس یا اسناد استعمال نہیں ہوتے۔ دوسری مقامی تیار کردہ تصویر کے
لیے `REPOVIO_TEST_API_IMAGE` مقرر کریں۔
