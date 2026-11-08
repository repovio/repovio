---
title: PostgreSQL 17 থেকে 18-এ আপগ্রেড
description: ডেটা নতুন পৃথক PostgreSQL 18 ভলিউমে নিয়ে পুনরুদ্ধার যাচাই করুন।
---

বর্তমান Compose স্ট্যাক `postgres:18-alpine` ব্যবহার করে এবং নামযুক্ত ভলিউম `/var/lib/postgresql`-এ মাউন্ট করে।
PostgreSQL 18 সংস্করণভিত্তিক সাবডিরেক্টরিতে ক্লাস্টার রাখে। PostgreSQL 17-এর ফাইল সরাসরি ব্যবহার করা যায় না।
[ইমেজের সরকারি নথি](https://hub.docker.com/_/postgres) দেখুন।

এই পদ্ধতি অ্যাপ্লিকেশন ডেটাবেসের ডাম্প তৈরি করে **পৃথক নতুন ভলিউমে** পুনরুদ্ধার করে। রক্ষণাবেক্ষণের সময় দরকার।
[ব্র্যান্ডের নাম পরিবর্তন](/docs/next/branding-upgrade)-এর সঙ্গে একত্রে করবেন না; আগের PostgreSQL 17 রিলিজে আগে নাম
পরিবর্তন শেষ করুন। সোর্স আপডেট উৎপাদনের মাইগ্রেশন নিজে থেকে চালায় না।

<a id="before-maintenance"></a>

## রক্ষণাবেক্ষণের আগে

- আগের রিলিজের সম্পূর্ণ কনফিগারেশন, `.env` এবং PostgreSQL 17 ভলিউমের সঠিক নাম রাখুন। Compose ফাইল আগের রিলিজ ডিরেক্টরিতে
  রাখুন যাতে আপেক্ষিক বাইন্ড মাউন্ট ও পরিবেশ ফাইলের পথ ঠিক থাকে।
- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `TOKEN_ENCRYPTION_KEY` এবং `AUTH_JWT_SECRET` বদলাবেন না। বিদ্যমান
  প্রদানকারী ও বিজ্ঞপ্তির পরিচয়তথ্য ডিক্রিপ্ট করতে এই কী দরকার।
- ডাম্প এবং দুই ভলিউমের জন্য যথেষ্ট জায়গা রাখুন। ব্যাকআপ ও `.env` গোপন রাখুন।
- পদ্ধতিটি Repovio-এর একক ডেটাবেস ভূমিকা ধরে নেয়। বাড়তি ভূমিকা, অনুমতি, এক্সটেনশন ও ডেটাবেস আলাদা তালিকা করুন;
  অ্যাপ্লিকেশন ডাম্পে সেগুলোর ব্যাকআপ নিশ্চিত নয়।
- অস্থায়ী কপি দিয়ে পুনরুদ্ধার ও যাচাই অনুশীলন করুন। `pnpm test:postgres-upgrade` প্রকৃত মাইগ্রেশন এবং শুধু কৃত্রিম
  ডেটা ব্যবহার করে; নির্দিষ্ট স্থাপনার ব্যাকআপ যাচাই করে না।

<a id="stop-writers-and-back-up-postgresql-17"></a>

## লেখা বন্ধ করে PostgreSQL 17 ব্যাকআপ নিন

**আগের রিলিজ ডিরেক্টরি** থেকে তার PostgreSQL 17 Compose কনফিগারেশন দিয়ে কমান্ড চালান। অন্য বাইরের লেখার প্রক্রিয়াও
বন্ধ করুন। পুনরুদ্ধার ও যাচাই শেষ হওয়ার আগে নতুন অ্যাপ্লিকেশন চালু করবেন না।

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

প্রাথমিক সংখ্যা গোপনে লিখে রাখুন। শুধু আকার দেখে নয়, পুনরুদ্ধার করে ডাম্প যাচাই করুন। পুরোনো ভলিউম ও কনফিগারেশন রাখুন।
কখনো `docker compose down --volumes` চালাবেন না বা কোনো ডেটা ভলিউম মুছবেন না।

<a id="restore-into-postgresql-18"></a>

## PostgreSQL 18-এ পুনরুদ্ধার

**নতুন রিলিজ ডিরেক্টরিতে** একই পরিচয়তথ্য ও কী রাখুন। `backup`-এ ব্যাকআপের পূর্ণ পথ দিন। নতুন স্বতন্ত্র ভলিউমের নাম বেছে
নতুন `.env`-এ `REPOVIO_POSTGRES_VOLUME` হিসেবে রাখুন; PostgreSQL 17 ভলিউম থেকে আলাদা হতে হবে। ভুল বা অনুপস্থিত নাম
আটকাতে বাহ্যিক ভলিউম ওভাররাইড ব্যবহার করুন।

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

সত্যিই নতুন খালি ভলিউম ব্যবহার করুন; নাম আগে থাকলে অন্যটি নিন। এন্ট্রিপয়েন্ট পুরোনো ডেটা বিন্যাস প্রত্যাখ্যান করে, নতুন
রুটে ভুলভাবে মাউন্ট করা PostgreSQL 17 ভলিউমও; এটি ডেটা রূপান্তর করে না। পুনরুদ্ধার ব্যর্থ হলে ডাম্প ও পুরোনো ভলিউম
রাখুন, কারণ খুঁজে অন্য নতুন খালি ভলিউমে চেষ্টা করুন। আংশিক পুনরুদ্ধার করা ডেটাবেসে বারবার আমদানি করবেন না।

প্রাথমিক সংখ্যা ও প্রতিনিধিত্বমূলক সম্পর্ক মিলিয়ে দেখুন। লগইন, অনুমতি, বিজ্ঞপ্তির কনফিগারেশন ও রাখা কী দিয়ে ডিক্রিপশন
যাচাই করুন। API স্বাস্থ্য ও লগ গোপনে পরীক্ষা করুন। PostgreSQL 18 পুনরায় চালু করে ডেটা থাকার নিশ্চয়তার পর রক্ষণাবেক্ষণ
শেষ করুন। পরীক্ষিত ডিফল্ট ডেটা ডিরেক্টরি `/var/lib/postgresql/18/docker`।

<a id="recovery"></a>

## আগের সংস্করণে ফেরা

নতুন লেখা শুরু হওয়ার আগে নতুন স্ট্যাক বন্ধ করে মূল PostgreSQL 17 ভলিউম ও কনফিগারেশন দিয়ে সম্পূর্ণ আগের রিলিজ চালু করা
যায়। দুই স্ট্যাককে একসঙ্গে লিখতে দেবেন না। নির্ণয়ের জন্য নতুন ভলিউম রাখুন; PostgreSQL 17 কখনো PostgreSQL 18-এর ফাইল
খুলবে না।

নতুন লেখা হলে পুরোনো ভলিউম অচল হয়ে পড়ে; সেখানে ফিরলে নতুন লেখাগুলো হারায়। আগে ডেটা সমন্বয় বা আলাদাভাবে পরীক্ষিত
পুনরুদ্ধারের পরিকল্পনা করুন। PostgreSQL 18 ডাম্প 17-এ পুনরুদ্ধার নিশ্চিত ডাউনগ্রেড নয়। অপারেটর স্পষ্টভাবে পুনরুদ্ধারের
সময়সীমা শেষ না করা পর্যন্ত দুই ভলিউম ও ব্যাকআপ রাখুন।

<a id="disposable-verification"></a>

## অস্থায়ী সম্পদে যাচাই

```sh
docker build -f apps/api/Dockerfile -t repovio-api:local .
pnpm test:postgres-upgrade
```

পরীক্ষা স্বতন্ত্র নামের কনটেইনার, নেটওয়ার্ক ও ভলিউম তৈরি করে; দুই প্রধান সংস্করণে প্রকৃত Prisma মাইগ্রেশন চালায়; নতুন
সূচনা ও শ্যাডো ডেটাবেস পরীক্ষা করে; ভুল মাউন্ট করা পুরোনো ভলিউম প্রত্যাখ্যান করে; ডাম্প পুনরুদ্ধার করে; সব পাবলিক টেবিল
মেলায়; কৃত্রিম পরিচয়তথ্য ডিক্রিপ্ট করে এবং পুনরায় চালুর পর স্থায়িত্ব ও পুরোনো ডেটার অপরিবর্তিত অবস্থা যাচাই করে।
পরিষ্কার করার সময় শুধু পরীক্ষার সম্পদ মুছে যায়। বিদ্যমান কনটেইনার, ভলিউম, ডেটাবেস বা পরিচয়তথ্য ব্যবহার হয় না। অন্য
স্থানীয়ভাবে তৈরি অ্যাপ্লিকেশন ইমেজের জন্য `REPOVIO_TEST_API_IMAGE` দিন।
