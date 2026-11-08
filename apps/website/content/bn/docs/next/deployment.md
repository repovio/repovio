---
title: 'Repovio স্থাপন করা হচ্ছে'
description: 'Repovio এর জন্য উত্পাদন স্থাপনা, TLS প্রক্সি, ব্যাকআপ, পুনরুদ্ধার, আপগ্রেড এবং রোলব্যাক নির্দেশিকা।'
---

Repovio এর কম্পোজ স্ট্যাক PostgreSQL শুরু করে, একবার প্রিজমা মাইগ্রেশন প্রয়োগ করে এবং তারপর API এবং ওয়েব
অ্যাপ্লিকেশনগুলি শুরু করে। এটি TLS বন্ধ করে না। ওয়েব এবং API পরিষেবাগুলিকে একটি বিপরীত প্রক্সির পিছনে রাখুন যা সর্বজনীন
হোস্টনাম এবং শংসাপত্রগুলির মালিক৷

<a id="prerequisites"></a>

## পূর্বশর্ত

- ডকার কম্পোজ v2 সহ ডকার ইঞ্জিন।
- সর্বজনীন হোস্টনামের জন্য একটি DNS রেকর্ড।
- একটি বিপরীত প্রক্সি যা TLS শংসাপত্রগুলি প্রাপ্ত এবং পুনর্নবীকরণ করে৷
- একটি ব্যক্তিগত সার্ভার ডিরেক্টরি শুধুমাত্র স্থাপনার প্রশাসক দ্বারা পাঠযোগ্য।

কম্পোজ স্ট্যাকটি তার নামযুক্ত `repovio-postgres` ভলিউমে স্বাভাবিক ব্যবহারকারী প্রোফাইল ছবি সহ PostgreSQL ডেটা টিকে থাকে।
আপনি ইচ্ছাকৃতভাবে সমস্ত Repovio ডেটা সরাতে না চাইলে এই ভলিউমটি মুছবেন না৷

<a id="first-deployment"></a>

## প্রথম স্থাপনা

### ধাপ 1: একটি প্রকাশিত Repovio সংস্করণ দেখুন এবং ব্যক্তিগত পরিবেশ ফাইল তৈরি করুন:

```bash
cp .env.example .env
chmod 600 .env
```

### ধাপ 2: `.env`-এ প্রতিটি স্থানধারক প্রতিস্থাপন করুন, বিশেষ করে `POSTGRES_PASSWORD`, উভয় ডাটাবেস URL, `AUTH_JWT_SECRET` এবং

`TOKEN_ENCRYPTION_KEY`. এর সাথে এনক্রিপশন কী তৈরি করুন:

```bash
openssl rand -base64 32
```

### ধাপ 3: বাহ্যিকভাবে দৃশ্যমান URL সেট করুন। `https://repovio.example.com` এ স্থাপনার জন্য, ব্যবহার করুন:

```dotenv
PUBLIC_URL=https://repovio.example.com
OIDC_CALLBACK_URL=https://repovio.example.com/api/v1/auth/oidc/callback
CORS_ORIGIN=https://repovio.example.com
NUXT_PUBLIC_API_BASE_URL=https://repovio.example.com/api/v1
OAUTH_CALLBACK_URL=https://repovio.example.com/api/v1/provider-accounts/oauth/callback
```

### ধাপ 4: যখন বিপরীত প্রক্সি একই হোস্টে চলে তখন কন্টেইনার পোর্টগুলিকে লুপব্যাকে আবদ্ধ করুন:

```dotenv
REPOVIO_API_PORT=127.0.0.1:3001
REPOVIO_WEB_PORT=127.0.0.1:3000
```

অন্যথায়, হোস্ট ফায়ারওয়াল সহ 3000 এবং 3001 পোর্টগুলিতে অ্যাক্সেস সীমাবদ্ধ করুন। PostgreSQL ধারকটি কখনই প্রকাশ করবেন
না।

### ধাপ 5: সেট করুন `REPOVIO_VERSION` মধ্যে `.env` একটি সঠিক রিলিজ ইমেজ পেয়ারে, তারপর স্ট্যাক শুরু করুন:

```bash
docker compose pull
docker compose up --detach --wait
```

যে মান রাখুন `.env` তাই প্রত্যেক পরবর্তী কম্পোজ কমান্ড একই API এবং ওয়েব সংস্করণ ব্যবহার করে।

### ধাপ 6: স্থানীয়ভাবে API হেলথ এন্ডপয়েন্ট নিশ্চিত করুন:

```bash
curl --fail http://127.0.0.1:3001/api/health
```

### ধাপ 7: জনসাধারণকে খুলুন Repovio URL এবং সম্পূর্ণ করুন [এককালীন প্রথম-রান সেটআপ](/docs/next/authentication) প্রথম তৈরি করতে

সিস্টেম প্রশাসক।

<a id="reverse-proxy-and-tls"></a>

## বিপরীত প্রক্সি এবং TLS

পোর্ট 3000-এ পাবলিক ওয়েব অরিজিন, এবং পোর্ট 3001-এ API এবং Socket.IO পাথগুলি প্রক্সি করুন৷ উদাহরণস্বরূপ, একটি Caddy সাইট
ব্লক ব্যবহার করতে পারে:

```caddy
repovio.example.com {
  reverse_proxy /api/* 127.0.0.1:3001
  reverse_proxy /socket.io/* 127.0.0.1:3001
  reverse_proxy /mcp 127.0.0.1:3001
  reverse_proxy 127.0.0.1:3000
}
```

প্রক্সিকে অবশ্যই HTTP-কে HTTPS-এ পুনঃনির্দেশিত করতে হবে, তার স্থানীয় নীতি অনুযায়ী আপস্ট্রিম সংযোগ যাচাই করতে হবে এবং
সর্বজনীন হোস্টনাম সংরক্ষণ করতে হবে। কনফিগার করুন OAuth একই HTTPS কলব্যাক ইউআরএল সেট করা আছে `OAUTH_CALLBACK_URL`.

<a id="upgrading"></a>

## আপগ্রেড হচ্ছে

<a id="migrating-an-earlier-installation"></a>

### একটি আগের ইনস্টলেশন স্থানান্তর করা হচ্ছে

অনুসরণ করুন [ব্র্যান্ডিং আপগ্রেড](/docs/next/branding-upgrade) পুনঃনামকৃত স্ট্যাক শুরু করার আগে। সেট
`REPOVIO_POSTGRES_VOLUME` সঠিক বিদ্যমান ভলিউম নামের সাথে। ডাটাবেস শংসাপত্র এবং এনক্রিপশন কী সংরক্ষণ করুন; ব্র্যান্ডিং এর
জন্য কোন ডাটাবেস কপি বা রিসেটের প্রয়োজন নেই।

### ধাপ 1: ছবি পরিবর্তন করার আগে একটি ডাটাবেস ব্যাকআপ তৈরি করুন এবং যাচাই করুন।

### ধাপ 2: সেট করুন `REPOVIO_VERSION` সঠিক রিলিজ সংস্করণে `.env`.

### ধাপ 3: রিলিজ টানুন এবং প্রয়োগ করুন:

```bash
docker compose pull
docker compose up --detach --wait
```

`migrate` পরিষেবাটি API শুরু হওয়ার আগে মুলতুবি প্রিজমা মাইগ্রেশন প্রযোজ্য। প্রতিটি আপডেটের পরে এটি পরিদর্শন করুন:

```bash
docker compose logs migrate
```

### ধাপ 4: আপডেট সম্পূর্ণ করার আগে স্বাস্থ্যের শেষ পয়েন্ট এবং প্রক্সি-সার্ভড ড্যাশবোর্ড যাচাই করুন।

<a id="database-backup"></a>

## ডাটাবেস ব্যাকআপ

স্থাপনার ডিরেক্টরি থেকে ব্যাকআপ চালান। এটি একটি PostgreSQL কাস্টম-ফরম্যাট ডাম্প লিখে শংসাপত্রগুলি মুদ্রণ না করে বা
কমান্ড লাইনে না রেখে হোস্টে:

```bash
mkdir -p backups
backup_file="backups/repovio-$(date +%F-%H%M%S).dump"
docker compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -Fc "$POSTGRES_DB"' \
  > "$backup_file"
pg_restore --list "$backup_file"
```

এনক্রিপ্ট করা অনুলিপিগুলি অফ-হোস্ট সংরক্ষণ করুন এবং পর্যায়ক্রমে একটি পৃথক সিস্টেমে পুনরুদ্ধারের পরীক্ষা করুন৷

<a id="database-restore"></a>

## ডাটাবেস পুনরুদ্ধার

পুনরুদ্ধার বর্তমান ডাটাবেস বস্তু প্রতিস্থাপন. প্রথমে একটি নতুন ব্যাকআপ নিন এবং ডাউনটাইম শিডিউল করুন।

```bash
docker compose stop api web
docker compose exec -T postgres sh -c 'pg_restore -U "$POSTGRES_USER" --clean --if-exists --no-owner -d "$POSTGRES_DB"' \
  < backups/repovio-YYYY-MM-DD-HHMMSS.dump
docker compose up --detach --wait
```

তারপরে, `docker compose logs migrate` এবং API হেলথ এন্ডপয়েন্ট চেক করুন। একটি সামঞ্জস্যপূর্ণ Repovio সংস্করণ দ্বারা তৈরি
একটি ডাম্প পুনরুদ্ধার করুন যখন স্কিমা পরিবর্তনগুলি জুড়ে ফিরে আসবে৷

<a id="rollback"></a>

## রোলব্যাক

### ধাপ 1: ব্যর্থ আপগ্রেডের আগে অবিলম্বে করা ব্যাকআপ রাখুন।

### ধাপ 2: `.env`-এ `REPOVIO_VERSION` শেষ পরিচিত-ভাল ছবির সংস্করণে সেট করুন।

### ধাপ 3: `docker compose pull` এবং `docker compose up --detach --wait` চালান।

### ধাপ 4: যদি নতুন রিলিজটি ডাটাবেসকে অসঙ্গতভাবে স্থানান্তরিত করে, তাহলে API এবং ওয়েব বন্ধ করুন, সামঞ্জস্যপূর্ণ ব্যাকআপ পুনরুদ্ধার করুন এবং তারপরে

পূর্ববর্তী চিত্র সংস্করণ আবার শুরু করুন।

আপডেট বা রোলব্যাক কমান্ড হিসাবে `docker compose down --volumes` ব্যবহার করবেন না: এটি নামযুক্ত PostgreSQL ভলিউম সরিয়ে
দেয়।
