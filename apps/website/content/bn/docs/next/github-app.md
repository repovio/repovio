---
title: 'GitHub App সেটআপ'
description: 'এনক্রিপ্ট করা শংসাপত্র ও শুধু পড়ার ইনস্টলেশন অ্যাক্সেস দিয়ে নিজের GitHub App যুক্ত করুন।'
---

<a id="register-app"></a>

## অ্যাপ নিবন্ধন

প্রতি Repovio ডিপ্লয়মেন্টে একটি GitHub.com App ব্যবহার করুন; PAT ও OAuth চালু থাকে। মালিক হিসেবে Settings, Developer
settings, GitHub Apps, New GitHub App খুলুন। অনন্য নাম ও Repovio হোমপেজ দিন। একাধিক অ্যাকাউন্টের জন্য Any account বাছুন;
ব্যক্তিগত অ্যাপ শুধু মালিকের অ্যাকাউন্টে ইনস্টল করা যায়। OAuth ক্লায়েন্ট সিক্রেট, callback URL বা setup URL লাগে না।

<a id="permissions-and-events"></a>

## অনুমতি ও ইভেন্ট

নিচের মূল অনুমতিগুলো Read-only করুন; Metadata স্বয়ংক্রিয়। প্রয়োজন ও প্রাপ্যতা অনুযায়ী ঐচ্ছিক নিরাপত্তা অনুমতি দিন।
তালিকার ইভেন্টগুলো বাছুন; ইনস্টলেশন জীবনচক্র ইভেন্ট GitHub নিজেই পাঠায়। অ্যাপে অতিরিক্ত অধিকার থাকলেও Repovio শুধু পড়ার
টোকেন চায়।

```text
Required repository permissions (Read-only):
Actions (actions)
Issues (issues)
Pull requests (pull_requests)
Metadata (metadata, automatic)

Optional repository permissions (Read-only):
Dependabot alerts (vulnerability_alerts)
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

## Repovio কনফিগার

ওয়েবহুক চালু করে নিচের পাবলিক HTTPS ঠিকানা দিন। PUBLIC_URL বাইরের নেটওয়ার্ক থেকে পৌঁছানো ডিপ্লয়মেন্ট নির্দেশ করবে। অন্তত
16 অক্ষরের এলোমেলো সিক্রেট তৈরি করে GitHub ও Repovio-তে একই মান দিন। GitHub-এ RSA কী তৈরি করে PEM নামান। প্রশাসনের
প্রোভাইডার অ্যাকাউন্টে GitHub App খুলে App ID, slug, সম্পূর্ণ ব্যক্তিগত কী ও ওয়েবহুক সিক্রেট দিয়ে যাচাই ও সংরক্ষণ করুন।
API পরিচয় যাচাই করে PostgreSQL-এ উভয় সিক্রেট এনক্রিপ্ট করে। ডিপ্লয়মেন্ট এনক্রিপশন কী নিরাপদ রাখুন; সংরক্ষিত সিক্রেট
ব্রাউজারে ফেরত আসে না।

```text
https://repovio.example.com/api/v1/webhooks/github-app
```

<a id="install-and-connect"></a>

## ইনস্টল ও সংযোগ

GitHub-এ অ্যাপ ইনস্টল করে অ্যাকাউন্ট বা সংস্থা এবং শুধু প্রয়োজনীয় রিপোজিটরি বাছুন। ফিরে তালিকা রিফ্রেশ করে সংযুক্ত করুন।
স্থগিত বা আগে যুক্ত ইনস্টলেশন আবার যুক্ত হয় না। তালিকা কনফিগার করা অ্যাপ থেকে আসে; callback-এর ইনস্টলেশন ID বিশ্বাস করা
হয় না। রিপোজিটরি স্ক্রিন থেকে ট্র্যাকিং দিন। টোকেন স্বয়ংক্রিয় নবায়ন হয়; প্রথম আমদানি ও নিয়মিত পোলিং ওয়েবহুকের পরিপূরক।

বিদ্যমান PAT বা OAuth অ্যাকাউন্টের সঙ্গে নাম মিললে সংযোগের আগে স্থানীয় নাম বদলান।

<a id="rotate-and-disconnect"></a>

## পরিবর্তন ও বিচ্ছিন্ন

GitHub-এ নতুন কী তৈরি করে সংরক্ষণ করুন এবং পুরোনোটি মুছবার আগে সিঙ্ক যাচাই করুন। দুই পাশের ওয়েবহুক সিক্রেট একসঙ্গে
বদলান; পুরোনো স্বাক্ষর সঙ্গে সঙ্গে বাতিল হয়। ফাঁকা ঘরে সিক্রেট অপরিবর্তিত থাকে। অ্যাপ পরিচয় বদলানো বা কনফিগারেশন মোছার
আগে সংযুক্ত অ্যাকাউন্ট মুছুন; নির্ভরশীল ট্র্যাকিং ডেটাও মুছে যায়, তাই আগে রপ্তানি করুন। স্থানীয় মোছা GitHub থেকে অ্যাপ
সরায় না।

<a id="troubleshooting"></a>

## সমস্যা সমাধান

সেটআপ ব্যর্থ হলে App ID, slug ও PEM যাচাই করুন। স্বাক্ষর সমস্যায় সিক্রেট, HTTPS ও প্রক্সি মূল বডি রাখছে কি না দেখুন।
তালিকা ফাঁকা হলে রিপোজিটরি নির্বাচন ও অনুমতি যাচাই করে রিফ্রেশ করুন। অপসারিত বা স্থগিত ইনস্টলেশনের ইতিহাস থাকে; GitHub-এ
অ্যাক্সেস ফিরিয়ে রিফ্রেশ করুন। ঐচ্ছিক নিরাপত্তা অধিকার না থাকলেও অন্য সিঙ্ক চলে। Jobs দেখুন। ওয়েবহুক ব্যর্থ হলেও পোলিং
চলে। মক টেস্ট বাস্তব GitHub ইনস্টলেশন যাচাই করে না; পরীক্ষার অ্যাপ লাগে।

## আরও দেখুন

- [প্রোভাইডার অ্যাকাউন্ট](/docs/next/provider-accounts)
- [OAuth সেটআপ](/docs/next/provider-oauth)
- [প্রোভাইডার ওয়েবহুক](/docs/next/provider-webhooks)
