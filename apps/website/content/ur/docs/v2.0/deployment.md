---
title: 'Repovio تعینات کیا جا رہا ہے۔'
description: 'Repovio کے لیے پیداوار کی تعیناتی، TLS پراکسی، بیک اپ، بحال، اپ گریڈ اور رول بیک رہنمائی۔'
---

Repovio کا کمپوز اسٹیک PostgreSQL شروع ہوتا ہے، ایک بار Prisma منتقلی کا اطلاق کرتا ہے، اور پھر API اور ویب ایپلیکیشنز
شروع کرتا ہے۔ یہ TLS کو ختم نہیں کرتا ہے۔ ویب اور API سروسز کو ایک ریورس پراکسی کے پیچھے رکھیں جو عوامی میزبان نام اور
سرٹیفکیٹس کا مالک ہو۔

<a id="prerequisites"></a>

## شرائط

- ڈوکر کمپوز v2 کے ساتھ ڈوکر انجن۔
- عوامی میزبان نام کے لیے ایک DNS ریکارڈ۔
- ایک ریورس پراکسی جو TLS سرٹیفکیٹ حاصل کرتی ہے اور اس کی تجدید کرتی ہے۔
- ایک نجی سرور ڈائرکٹری جو صرف تعیناتی منتظمین کے ذریعہ پڑھنے کے قابل ہے۔

کمپوز اسٹیک PostgreSQL ڈیٹا کو برقرار رکھتا ہے، بشمول نارملائزڈ صارف پروفائل تصویریں، اس کے نامزد کردہ
`repovio-postgres` والیوم میں۔ اس والیوم کو حذف نہ کریں جب تک کہ آپ جان بوجھ کر تمام Repovio ڈیٹا کو ہٹانا نہیں چاہتے
ہیں۔

<a id="first-deployment"></a>

## پہلی تعیناتی۔

### مرحلہ 1: جاری کردہ Repovio ورژن دیکھیں اور نجی ماحول کی فائل بنائیں:

```bash
cp .env.example .env
chmod 600 .env
```

### مرحلہ 2: `.env` میں ہر پلیس ہولڈر کو تبدیل کریں، خاص طور پر `POSTGRES_PASSWORD`، دونوں ڈیٹا بیس URLs، `AUTH_JWT_SECRET`، اور

`TOKEN_ENCRYPTION_KEY` اس کے ساتھ خفیہ کاری کی کلید بنائیں:

```bash
openssl rand -base64 32
```

### مرحلہ 3: بیرونی طور پر دکھائی دینے والے یو آر ایل سیٹ کریں۔ `https://repovio.example.com` پر تعیناتی کے لیے، استعمال کریں:

```dotenv
PUBLIC_URL=https://repovio.example.com
OIDC_CALLBACK_URL=https://repovio.example.com/api/v1/auth/oidc/callback
CORS_ORIGIN=https://repovio.example.com
NUXT_PUBLIC_API_BASE_URL=https://repovio.example.com/api/v1
OAUTH_CALLBACK_URL=https://repovio.example.com/api/v1/provider-accounts/oauth/callback
```

### مرحلہ 4: جب ایک ہی میزبان پر ریورس پراکسی چلتی ہے تو کنٹینر پورٹس کو لوپ بیک پر باندھیں:

```dotenv
REPOVIO_API_PORT=127.0.0.1:3001
REPOVIO_WEB_PORT=127.0.0.1:3000
```

بصورت دیگر، میزبان فائر وال کے ساتھ بندرگاہوں 3000 اور 3001 تک رسائی کو محدود کریں۔ PostgreSQL کنٹینر کو کبھی بھی بے
نقاب نہ کریں۔

### مرحلہ 5: `REPOVIO_VERSION` کو `.env` میں ایک عین جاری کردہ تصویری جوڑے پر سیٹ کریں، پھر اسٹیک شروع کریں:

```bash
docker compose pull
docker compose up --detach --wait
```

اس قدر کو `.env` میں رکھیں تاکہ ہر بعد میں Compose کمانڈ وہی API اور ویب ورژن استعمال کرے۔

### مرحلہ 6: مقامی طور پر API ہیلتھ اینڈ پوائنٹ کی تصدیق کریں:

```bash
curl --fail http://127.0.0.1:3001/api/health
```

### مرحلہ 7: عوامی Repovio URL کھولیں اور پہلا بنانے کے لیے [ایک بار پہلا رن سیٹ اپ](/docs/v2.0/authentication) مکمل کریں

سسٹم ایڈمنسٹریٹر

<a id="reverse-proxy-and-tls"></a>

## ریورس پراکسی اور TLS

پورٹ 3000 پر عوامی ویب کی اصل اور API اور Socket.IO کو پورٹ 3001 تک پراکسی کریں۔ مثال کے طور پر، ایک Caddy سائٹ بلاک
استعمال کر سکتا ہے:

```caddy
repovio.example.com {
  reverse_proxy /api/* 127.0.0.1:3001
  reverse_proxy /socket.io/* 127.0.0.1:3001
  reverse_proxy /mcp 127.0.0.1:3001
  reverse_proxy 127.0.0.1:3000
}
```

پراکسی کو HTTP کو HTTPS پر ری ڈائریکٹ کرنا، اپنی مقامی پالیسی کے مطابق اپ اسٹریم کنکشن کی توثیق کرنا، اور عوامی میزبان
نام کو محفوظ کرنا چاہیے۔ OAuth فراہم کنندگان کو `OAUTH_CALLBACK_URL` میں سیٹ کردہ اسی HTTPS کال بیک URL کے ساتھ ترتیب
دیں۔

<a id="upgrading"></a>

## اپ گریڈ کرنا

<a id="migrating-an-earlier-installation"></a>

### پہلے کی تنصیب کو منتقل کرنا

نام تبدیل شدہ اسٹیک شروع کرنے سے پہلے [برانڈنگ اپ گریڈ](/docs/v2.0/branding-upgrade) کی پیروی کریں۔
`REPOVIO_POSTGRES_VOLUME` کو صحیح موجودہ والیوم کے نام پر سیٹ کریں۔ ڈیٹا بیس کی اسناد اور انکرپشن کلید کو محفوظ رکھیں؛
برانڈنگ کے لیے ڈیٹا بیس کی کاپی یا ری سیٹ کی ضرورت نہیں ہے۔

### مرحلہ 1: تصاویر کو تبدیل کرنے سے پہلے ڈیٹا بیس بیک اپ بنائیں اور اس کی تصدیق کریں۔

### مرحلہ 2: `REPOVIO_VERSION` کو `.env` میں بالکل درست ریلیز ورژن پر سیٹ کریں۔

### مرحلہ 3: ریلیز کو کھینچ کر لاگو کریں:

```bash
docker compose pull
docker compose up --detach --wait
```

`migrate` سروس API شروع ہونے سے پہلے زیر التواء Prisma منتقلی کا اطلاق کرتی ہے۔ ہر اپ ڈیٹ کے بعد اس کا معائنہ کریں:

```bash
docker compose logs migrate
```

### مرحلہ 4: اپ ڈیٹ کو مکمل کرنے پر غور کرنے سے پہلے ہیلتھ اینڈ پوائنٹ اور پراکسی پیش کردہ ڈیش بورڈ کی تصدیق کریں۔

<a id="database-backup"></a>

## ڈیٹا بیس کا بیک اپ

تعیناتی ڈائرکٹری سے بیک اپ چلائیں۔ یہ اسناد پرنٹ کیے یا کمانڈ لائن میں ڈالے بغیر میزبان کو PostgreSQL کسٹم فارمیٹ ڈمپ
لکھتا ہے:

```bash
mkdir -p backups
backup_file="backups/repovio-$(date +%F-%H%M%S).dump"
docker compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -Fc "$POSTGRES_DB"' \
  > "$backup_file"
pg_restore --list "$backup_file"
```

انکرپٹ شدہ کاپیاں آف ہوسٹ اسٹور کریں اور وقتاً فوقتاً ایک علیحدہ سسٹم پر بحال ہونے کی جانچ کریں۔

<a id="database-restore"></a>

## ڈیٹا بیس کی بحالی

بحال کرنا موجودہ ڈیٹا بیس اشیاء کی جگہ لے لیتا ہے۔ پہلے ایک نیا بیک اپ لیں اور ڈاؤن ٹائم شیڈول کریں۔

```bash
docker compose stop api web
docker compose exec -T postgres sh -c 'pg_restore -U "$POSTGRES_USER" --clean --if-exists --no-owner -d "$POSTGRES_DB"' \
  < backups/repovio-YYYY-MM-DD-HHMMSS.dump
docker compose up --detach --wait
```

اس کے بعد، `docker compose logs migrate` اور API ہیلتھ اینڈ پوائنٹ کو چیک کریں۔ سکیما کی تبدیلیوں میں واپس آنے پر ہم
آہنگ Repovio ورژن کے ذریعے بنائے گئے ڈمپ کو بحال کریں۔

<a id="rollback"></a>

## رول بیک

### مرحلہ 1: ناکام اپ گریڈ ہونے سے پہلے بنایا گیا بیک اپ رکھیں۔

### مرحلہ 2: `REPOVIO_VERSION` کو `.env` میں آخری معروف تصویری ورژن پر سیٹ کریں۔

### مرحلہ 3: `docker compose pull` اور `docker compose up --detach --wait` چلائیں۔

### مرحلہ 4: اگر نئی ریلیز نے ڈیٹا بیس کو غیر موازن طریقے سے منتقل کیا ہے، تو API اور ویب کو روکیں، مطابقت پذیر بیک اپ کو بحال کریں، اور پھر

پچھلے تصویری ورژن کو دوبارہ شروع کریں۔

کبھی بھی `docker compose down --volumes` کو اپ ڈیٹ یا رول بیک کمانڈ کے طور پر استعمال نہ کریں: یہ PostgreSQL والیوم کو
ہٹا دیتا ہے۔
