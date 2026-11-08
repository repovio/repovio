---
title: 'GitHub App کی ترتیب'
description: 'خفیہ کردہ اسناد اور صرف پڑھنے کی تنصیب رسائی کے ساتھ اپنا GitHub App جوڑیں۔'
---

<a id="register-app"></a>

## ایپ رجسٹر کریں

ہر Repovio تعیناتی کے لیے ایک GitHub.com App رکھیں؛ PAT اور OAuth دستیاب رہتے ہیں۔ مالک کے طور پر Settings، Developer
settings، GitHub Apps، New GitHub App کھولیں۔ منفرد نام اور Repovio ہوم پیج دیں۔ متعدد اکاؤنٹس کے لیے Any account منتخب
کریں؛ نجی ایپ صرف مالک کے اکاؤنٹ میں نصب ہوسکتی ہے۔ OAuth کلائنٹ سیکرٹ، callback URL یا setup URL ضروری نہیں۔

<a id="permissions-and-events"></a>

## اجازتیں اور واقعات

ذیل کی بنیادی اجازتیں Read-only رکھیں؛ Metadata خود ملتی ہے۔ اختیاری حفاظتی اجازتیں ضرورت اور دستیابی پر شامل کریں۔ درج
واقعات منتخب کریں؛ تنصیب کے واقعات GitHub خود بھیجتا ہے۔ ایپ کو زیادہ اجازت ہونے کے باوجود Repovio صرف پڑھنے کے ٹوکن
مانگتا ہے۔

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

## Repovio کی ترتیب

ویب ہک فعال کرکے ذیل کا عوامی HTTPS پتہ استعمال کریں۔ PUBLIC_URL باہر سے قابل رسائی تعیناتی ہونا چاہیے۔ کم از کم 16 حروف
کا اتفاقی راز بنائیں اور GitHub و Repovio میں یکساں قدر دیں۔ GitHub پر RSA کلید بنا کر PEM اتاریں۔ انتظامیہ میں فراہم
کنندہ اکاؤنٹس، GitHub App کھول کر App ID، slug، مکمل نجی کلید اور ویب ہک راز درج کریں، پھر تصدیق اور محفوظ کریں۔ API
شناخت جانچ کر دونوں راز PostgreSQL میں خفیہ کرتی ہے۔ تعیناتی کی خفیہ کاری کلید محفوظ رکھیں؛ محفوظ راز براؤزر کو واپس
نہیں ملتے۔

```text
https://repovio.example.com/api/v1/webhooks/github-app
```

<a id="install-and-connect"></a>

## نصب اور منسلک کریں

GitHub پر ایپ نصب کرکے اکاؤنٹ یا تنظیم اور صرف مطلوب مخزن منتخب کریں۔ واپس آکر فہرست تازہ کریں اور جوڑیں۔ معطل یا پہلے
سے منسلک تنصیب دوبارہ نہیں جوڑی جاسکتی۔ فہرست ترتیب شدہ ایپ سے آتی ہے؛ callback کی تنصیب ID قابل اعتماد نہیں۔ مخزن کی
اسکرین سے ٹریکنگ شامل کریں۔ ٹوکن خود تازہ ہوتے ہیں؛ ابتدائی درآمد اور باقاعدہ پولنگ ویب ہک کی تکمیل کرتے ہیں۔

اگر نام موجودہ PAT یا OAuth اکاؤنٹ سے ملتا ہے تو جوڑنے سے پہلے مقامی نام بدلیں۔

<a id="rotate-and-disconnect"></a>

## تبدیل اور الگ کریں

GitHub پر نئی کلید بنائیں، محفوظ کریں اور پرانی مٹانے سے پہلے ہم وقت سازی جانچیں۔ ویب ہک راز دونوں طرف ایک ساتھ بدلیں؛
پرانے دستخط فوراً مسترد ہوتے ہیں۔ خالی خانے محفوظ راز برقرار رکھتے ہیں۔ ایپ شناخت بدلنے یا ترتیب حذف کرنے سے پہلے منسلک
اکاؤنٹ مٹائیں؛ متعلقہ ٹریکنگ ڈیٹا بھی حذف ہوتا ہے، اس لیے پہلے برآمد کریں۔ مقامی حذف GitHub سے ایپ نہیں ہٹاتا۔

<a id="troubleshooting"></a>

## مسائل حل کریں

ترتیب کی ناکامی پر App ID، slug اور PEM دیکھیں۔ دستخط کی ناکامی پر راز، HTTPS اور پراکسی کے اصل باڈی برقرار رکھنے کی
جانچ کریں۔ فہرست خالی ہو تو مخزن انتخاب اور اجازتیں دیکھ کر تازہ کریں۔ ہٹائی یا معطل تنصیب کا پرانا ڈیٹا باقی رہتا ہے؛
GitHub پر رسائی بحال کرکے تازہ کریں۔ اختیاری حفاظتی اجازت نہ ہونے سے دوسرے شعبے نہیں رکتے۔ Jobs دیکھیں۔ ویب ہک ناکام ہو
تو پولنگ چلتی ہے۔ نقلی ٹیسٹ حقیقی GitHub تنصیب نہیں جانچتے؛ آزمائشی ایپ چاہیے۔

## مزید دیکھیں

- [فراہم کنندہ اکاؤنٹس](/docs/v2.0/provider-accounts)
- [OAuth ترتیب](/docs/v2.0/provider-oauth)
- [فراہم کنندہ ویب ہک](/docs/v2.0/provider-webhooks)
