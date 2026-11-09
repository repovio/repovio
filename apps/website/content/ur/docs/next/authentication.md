---
title: 'تصدیق'
description: 'مقامی تصدیق، اختیاری OpenID Connect سائن ان، اور اکاؤنٹ کی بازیابی کو ترتیب دیں۔'
---

<a id="first-run-setup"></a>

## فرسٹ رن سیٹ اپ

ایک نئی تنصیب کو تعینات کرنے کے بعد، اس کا عوامی URL کھولیں۔ Repovio ہر درخواست کو ری ڈائریکٹ کرتا ہے۔ `/auth/setup` جب
تک پہلا اکاؤنٹ موجود نہ ہو۔ ایک اختیاری پہلا اور آخری نام، ایک منفرد صارف نام، اور کم از کم 12 حروف والا پاس ورڈ درج
کریں۔ اکاؤنٹ کو سسٹم ایڈمنسٹریٹر کے طور پر بنایا جاتا ہے اور فوری طور پر سائن ان ہوتا ہے۔

سیٹ اپ صرف ایک بار کامیاب ہو سکتا ہے۔ پہلے صارف کے موجود ہونے کے بعد، `/auth/setup` کو ری ڈائریکٹ کرتا ہے۔
`/auth/signin`. موجودہ تنصیبات اپ گریڈ کے دوران اپنے موجودہ صارفین کو برقرار رکھتی ہیں اور دوبارہ سیٹ اپ نہیں دکھاتی
ہیں۔

<a id="openid-connect-single-sign-on"></a>

## اوپن آئی ڈی کنیکٹ سنگل سائن آن

Repovio مقامی سائن ان کے علاوہ ایک اختیاری OpenID Connect فراہم کنندہ کو سپورٹ کرتا ہے۔ سسٹم ایڈمنسٹریٹر اسے **ترتیبات →
توثیق** کے تحت ترتیب دیتا ہے۔ یہ لاگ ان اس سے الگ ہے۔ GitHub، GitLab، Forgejo، اور Gitea فراہم کنندہ OAuth: OIDC شناخت
کرتا ہے a Repovio صارف، جبکہ فراہم کنندہ OAuth صرف فراہم کنندہ کے وسائل تک پڑھنے کی رسائی فراہم کرتا ہے۔

فراہم کنندہ کو کنفیگر کرنے سے پہلے بالکل خارجی طور پر قابل رسائی API کال بیک URL سیٹ کریں:

```dotenv
PUBLIC_URL=https://repovio.example.com
OIDC_CALLBACK_URL=https://repovio.example.com/api/v1/auth/oidc/callback
```

کی قدر رجسٹر کریں۔ `OIDC_CALLBACK_URL` شناخت فراہم کنندہ پر ایک مجاز ری ڈائریکٹ URI کے طور پر۔ اس کے جاری کنندہ، کلائنٹ
آئی ڈی، اختیاری کلائنٹ سیکرٹ، اسکوپس، اور گروپ کلیم کو کنفیگر کریں۔ Repovio. API محفوظ کرنے پر کلائنٹ کے راز کو قبول
کرتا ہے لیکن اس کی قیمت کبھی واپس نہیں کرتا ہے۔ اس کے ساتھ آرام سے خفیہ کردہ ہے۔ `TOKEN_ENCRYPTION_KEY`. استعمال کرنے سے
پہلے کنفیگریشن کو محفوظ کریں **کنکشن چیک کریں**؛ غیر محفوظ شدہ تبدیلیاں اس چیک کو غیر فعال کر دیتی ہیں۔ پر انحصار کرنے
سے پہلے دریافت کے کامیاب ہونے کی تصدیق کریں۔ OIDC سائن ان

جاری کنندہ اور اس کے اختتامی مقامات کے لیے HTTPS درکار ہے۔ **HTTP جاری کنندہ کو اجازت دیں** کا مقصد صرف الگ تھلگ لیب نیٹ
ورکس کے لیے ہے۔ انٹرنیٹ کے قابل رسائی تعیناتی کے لیے اسے کبھی بھی فعال نہیں ہونا چاہیے۔ مقامی پاس ورڈ سائن ان ایک
بازیابی کے راستے کے طور پر دستیاب رہتا ہے تب بھی OIDC فعال ہے.

فارم کاپی کرنے، ترتیب شدہ/مشاہدہ گروپس، اور ذخیرہ شدہ کلائنٹ کے راز کو تبدیل کرنے یا صاف کرنے کے لیے علیحدہ کنٹرولز کے
لیے کال بیک یو آر ایل بھی دکھاتا ہے۔ متبادل کو غیر فعال چھوڑنے سے محفوظ کردہ راز محفوظ رہتا ہے۔ لوڈنگ، سیونگ، اور کنکشن
چیک کی ناکامیوں کو الگ سے رپورٹ کیا جاتا ہے۔ غلط کنفیگریشن کو درست کریں اور کنکشن چیک کی دوبارہ کوشش کرنے سے پہلے دوبارہ
محفوظ کریں۔

<a id="groups-roles-and-identities"></a>

### گروپس، کردار اور شناخت

Group claim عین نام یا `realm_access.groups` جیسا dot-separated path ہو سکتا ہے۔ حروف کی بڑی چھوٹی صورت کے مطابق درست
اقدار دیں۔ کئی گروپ ملیں تو ترجیح `SYSTEM_ADMIN`، پھر `MANAGER`، پھر `VIEWER` ہے۔ Missing یا unmatched گروپ مسترد ہوتے
ہیں، جب تک unmatched-viewer واضح طور پر فعال نہ ہو۔ Malformed claims اور group-overage ہمیشہ مسترد ہوتے ہیں۔

ایک OIDC اکاؤنٹ صرف تصدیق شدہ جاری کنندہ اور سبجیکٹ جوڑی کے ذریعے منسلک ہوتا ہے۔ Repovio کبھی بھی کسی مقامی اکاؤنٹ سے
OIDC لاگ ان کو ای میل ایڈریس یا صارف نام کے ذریعے لنک نہیں کرتا ہے۔ پہلے اور آخری نام ہر کامیاب لاگ ان پر تصدیق شدہ
دعووں سے مطابقت پذیر ہوتے ہیں۔ لاگ ان نام، پروفائل کے نام، اور پاس ورڈ کو مقامی طور پر تبدیل نہیں کیا جا سکتا۔ ذخیرے کی
رکنیت کا انتظام Repovio میں رہتا ہے اور کبھی بھی شناخت فراہم کرنے والے گروپوں سے اخذ نہیں کیا جاتا ہے۔

سیکیورٹی سے متعلق ترتیب یا کردار میں تبدیلی موجودہ OIDC bearer token کو غیر مؤثر کر دیتی ہے۔ صرف فراہم کنندہ کا ظاہر
ہونے والا نام بدلنے سے موجودہ OIDC token غیر مؤثر نہیں ہوتے۔ شناخت فراہم کنندہ کے گروپ کو غیر فعال کرنے یا ہٹانے سے
متعلقہ اکاؤنٹ کو نیا سیشن نہیں ملتا اور اگلی مسترد شدہ لاگ ان کوشش کے بعد اس کے پرانے سیشن بھی غیر مؤثر ہو جاتے ہیں۔

<a id="provider-examples"></a>

### فراہم کنندگان کی مثالیں۔

فراہم کنندہ گائیڈز: [Keycloak](#oidc-keycloak) · [Microsoft Entra ID](#oidc-entra-id) · [Auth0](#oidc-auth0)

Authentik کے لیے، اجازت کوڈ کے بہاؤ کے ساتھ ایک OAuth2/OpenID فراہم کنندہ بنائیں، اوپر دی گئی عین مطابق کال بیک URL، اور
`openid`، `profile`، اور `email` اسکوپس۔ اسکوپ میپنگ شامل کریں جو گروپ کے ناموں کی ایک صف کے طور پر منتخب کردہ گروپ کلیم
کو واپس کرتا ہے، فراہم کنندہ کو کسی ایپلیکیشن کے ساتھ منسلک کریں، پھر ایپلیکیشن کے جاری کنندہ، کلائنٹ ID، اور کلائنٹ کے
راز کو Repovio میں کاپی کریں۔

دوسرے معیارات کے مطابق فراہم کنندہ کے لیے، اتھارٹی کوڈ فلو کو فعال کریں، S256 PKCE کی ضرورت ہے، درست کال بیک یو آر ایل
کو رجسٹر کریں، اور ID ٹوکن یا UserInfo کے جواب میں ایک مستحکم `sub` کے علاوہ کنفیگر کردہ گروپ کلیم شامل کریں۔ Repovio
صرف غیر متناسب ID-ٹوکن دستخطوں کو قبول کرتا ہے اور غیر دستخط شدہ اور HMAC کے دستخط شدہ ٹوکنز کو مسترد کرتا ہے۔

<a id="oidc-keycloak"></a>

#### Keycloak

Keycloak انتظامی کنسول میں repovio realm اور repovio نام کا OpenID Connect کلائنٹ بنائیں۔ Client authentication اور
Standard flow فعال کریں؛ Implicit flow اور Direct access grants بند کریں۔ نیچے والا عین callback، Valid redirect URIs
میں درج کریں، S256 لازم کریں اور RS256 برقرار رکھیں۔ Credentials سے client secret نقل کریں۔

کلائنٹ کے dedicated scope میں Group Membership mapper شامل کریں: Token Claim Name groups، Full group path بند اور Add to
ID token فعال۔ profile اور email کو default scopes بنائیں۔ repovio-admins، repovio-managers اور repovio-viewers بنائیں،
صارفین مقرر کریں اور مکمل گروپ نام متعلقہ Repovio کرداروں سے ملائیں۔ Realm کردار گروپ کی رکنیت نہیں ہیں۔

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

حوالے: [Keycloak](https://www.keycloak.org/docs/latest/server_admin/index.html#_oidc_clients)

<a id="oidc-entra-id"></a>

#### Microsoft Entra ID

Entra ID → App registrations میں single-tenant ایپ رجسٹر کریں، Web platform اور نیچے والا عین callback شامل کریں؛
implicit token issuance فعال نہ کریں۔ Application (client) ID اور Directory (tenant) ID نقل کریں۔ Client secret بنا کر
Value نقل کریں، secret ID نہیں۔ v2 issuer میں tenant ID استعمال کریں، common یا organizations نہیں۔

Token configuration میں حفاظتی گروپوں کے groups claim کو ID tokens میں شامل کریں اور Group ID منتخب کریں۔ تین گروپ بنا
کر صارفین مقرر کریں اور group object IDs کو SYSTEM_ADMIN، MANAGER اور VIEWER سے ملائیں۔ Display names، GUID سے مطابقت
نہیں رکھتے۔ Assigned-group filtering کے لیے مناسب Entra لائسنس درکار ہو سکتا ہے۔ S256 PKCE اور غیر متناسب دستخط استعمال
کریں؛ مدت ختم ہونے سے پہلے secret بدلیں۔

Repovio گروپوں کی حد تجاوز کرنے والے markers مسترد کرتا ہے، چاہے unmatched-viewer رسائی فعال ہو۔ یہ بیرونی claim sources
یا Microsoft Graph سے معلومات نہیں لیتا۔ جاری رکنیتیں کم کریں یا معاون group filtering ترتیب دیں؛ Graph permissions دینا
حل نہیں ہے۔

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

حوالے:
[Microsoft Entra ID](https://learn.microsoft.com/en-us/security/zero-trust/develop/configure-tokens-group-claims-app-roles)

<a id="oidc-auth0"></a>

#### Auth0

Regular Web Application بنائیں، Allowed Callback URLs میں عین callback درج کریں، Authorization Code کے ساتھ S256 PKCE
استعمال کریں اور RS256 منتخب کریں۔ Token Endpoint Authentication Method کو Basic کریں۔ Client ID اور secret نقل کریں۔
منتخب tenant یا custom domain کی discovery سے issuer لیں اور آخری slash برقرار رکھیں؛ domains نہ ملائیں۔

نیچے کی مثال سے Login / Post Login Action بنائیں، REPLACE_WITH_REPOVIO_CLIENT_ID بدلیں، deploy کرکے Login flow میں شامل
کریں۔ منتظم ہر صارف کا app_metadata.repovio_groups، repovio-admins، repovio-managers یا repovio-viewers والی array
بنائے۔ صارف کے قابلِ ترمیم user_metadata سے اجازت مت دیں۔ Auth0 یہ گروپ خود جاری نہیں کرتا؛ صرف access token کا claim
کافی نہیں۔ Repovio میں مکمل namespaced claim نام دیں اور تینوں اقدار متعلقہ کرداروں سے ملائیں۔

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

حوالے: [Auth0](https://auth0.com/docs/secure/tokens/json-web-tokens/create-custom-claims)

<a id="verify-oidc-providers"></a>

#### تصدیق اور خرابیوں کی تشخیص

ہر فراہم کنندہ میں عین OIDC_CALLBACK_URL رجسٹر کریں، openid profile email طلب کریں اور Authorization Code کے ساتھ S256
PKCE اور غیر متناسب دستخط استعمال کریں۔ ترتیبات → توثیق میں issuer، client ID، secret، scopes اور group claim محفوظ کرکے
رابطہ جانچیں۔ Discovery صارف کے گروپوں کی تصدیق نہیں کرتی۔

الگ صارفین سے SYSTEM_ADMIN، MANAGER، VIEWER اور غیر مقرر صارف آزمائیں؛ unmatched-viewer بند ہو تو آخری صارف مسترد ہونا
چاہیے۔ گروپ کے عین نام، Keycloak paths، Entra object IDs اور Auth0 کا namespaced ID-token claim دیکھیں۔ بحالی کے لیے
مقامی منتظم رکھیں۔ OIDC گروپ صرف عالمی کردار دیتے ہیں؛ repository access کے لیے الگ Repovio اجازتیں درکار ہیں۔ ایک وقت
میں صرف ایک فراہم کنندہ ترتیب دیں۔

<a id="oidc-api-contract"></a>

### OIDC API معاہدہ

| طریقہ        | راستہ                        | رسائی            | مقصد                                                                                     |
| ------------ | ---------------------------- | ---------------- | ---------------------------------------------------------------------------------------- |
| `GET`        | `/api/v1/auth/oidc/status`   | عوامی            | صرف موثر دستیابی اور اختیاری فراہم کنندہ کا نام لوٹاتا ہے۔                               |
| `GET`        | `/api/v1/auth/oidc/start`    | عوامی            | براؤزر سے منسلک اجازت کوڈ اور S256 PKCE لین دین شروع کرتا ہے۔                            |
| `GET`        | `/api/v1/auth/oidc/callback` | عوامی            | فراہم کنندہ کے جواب کی توثیق کرتا ہے اور ایک بار کے ٹکڑے کوڈ کے ساتھ ری ڈائریکٹ کرتا ہے۔ |
| `POST`       | `/api/v1/auth/oidc/exchange` | عوامی            | فریگمنٹ کوڈ کو ایک بار استعمال کرتا ہے اور عام بیئرر `AuthResult` واپس کرتا ہے۔          |
| `GET`, `PUT` | `/api/v1/auth/oidc/config`   | سسٹم ایڈمنسٹریٹر | خفیہ محفوظ OIDC ترتیبات کو پڑھتا یا اپ ڈیٹ کرتا ہے۔                                      |
| `POST`       | `/api/v1/auth/oidc/check`    | سسٹم ایڈمنسٹریٹر | محفوظ شدہ دریافت کنفیگریشن کو تبدیل کیے بغیر چیک کرتا ہے۔                                |

کال بیک کبھی بھی بیئرر JWT کو URL میں نہیں رکھتا۔ اس کا مبہم ایکسچینج کوڈ 60 سیکنڈ کے بعد ختم ہو جاتا ہے اور اسے صرف ایک
بار استعمال کیا جا سکتا ہے۔ فراہم کنندہ کی خامیاں براؤزر یا لاگز تک پہنچنے سے پہلے مستحکم ایرر کوڈز تک کم ہو جاتی ہیں۔

<a id="change-your-password"></a>

## اپنا پاس ورڈ تبدیل کریں۔

سائن ان ہونے کے دوران، **ترتیبات → عمومی → پاس ورڈ تبدیل کریں** کھولیں۔ موجودہ پاس ورڈ، نیا پاس ورڈ، اور اس کی تصدیق درج
کریں۔ Repovio موجودہ براؤزر کو ایک متبادل رسائی ٹوکن کے ساتھ سائن ان رکھتا ہے اور ہر دوسرے سائن ان سیشن کے ذریعہ رکھے
گئے ٹوکنز کو باطل کرتا ہے۔

<a id="reset-a-forgotten-password"></a>

## بھولا ہوا پاس ورڈ دوبارہ ترتیب دیں۔

Repovio نے جان بوجھ کر کوئی ای میل پر مبنی پاس ورڈ دوبارہ ترتیب نہیں دیا ہے۔ ایک تعیناتی منتظم `compose.yml` پر مشتمل
ڈائریکٹری سے مقامی اکاؤنٹ کو دوبارہ ترتیب دے سکتا ہے۔ متبادل پاس ورڈ کو بازگشت کیے بغیر یا اسے شیل ہسٹری میں اسٹور کیے
بغیر پڑھیں، پھر اسے معیاری ان پٹ پر API کنٹینر پر بھیجیں:

```bash
read -rsp 'New Repovio password: ' REPOVIO_NEW_PASSWORD
printf '\n'
printf '%s\n' "$REPOVIO_NEW_PASSWORD" \
  | docker compose exec -T api node dist/scripts/reset-password.js USERNAME
unset REPOVIO_NEW_PASSWORD
```

`USERNAME` کو درست لاگ ان صارف نام سے تبدیل کریں۔ کمانڈ کو 12 اور 256 حروف کے درمیان پاس ورڈ کی ضرورت ہوتی ہے، صرف اس
مقامی اکاؤنٹ کو اپ ڈیٹ کرتا ہے، اور اس کے تمام موجودہ رسائی ٹوکن کو باطل کرتا ہے۔ اس کے بعد نئے پاس ورڈ کے ساتھ دوبارہ
سائن ان کریں۔ کمانڈ OIDC کے زیر انتظام اکاؤنٹس کو مسترد کرتی ہے کیونکہ ان کا کوئی مقامی پاس ورڈ نہیں ہے۔

<a id="local-user-and-group-management"></a>

## مقامی رسائی گروپ

ریپوزٹری کے گروپ رسائی حصے میں Viewer یا Manager دیں، بدلیں یا ہٹائیں۔ براہ راست اور وراثتی حقوق ملتے ہیں؛ Manager غالب
ہے۔ انتظام کے لیے عالمی Manager کردار بھی چاہیے؛ سسٹم منتظم غیر محدود ہیں۔ دوسری اجازت نہ ہو تو اگلی درخواست پر منسوخی
مؤثر ہے۔ گروپس مقامی اور OIDC اکاؤنٹس لیتے ہیں، OIDC claims سے ہم وقت نہیں ہوتے۔

[مقامی رسائی گروپ](/docs/next/users#local-access-groups)
