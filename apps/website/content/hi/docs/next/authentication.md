---
title: 'प्रमाणीकरण'
description: 'स्थानीय प्रमाणीकरण, वैकल्पिक ओपनआईडी कनेक्ट साइन-इन और खाता पुनर्प्राप्ति कॉन्फ़िगर करें।'
---

<a id="first-run-setup"></a>

## प्रथम-रन सेटअप

एक नया इंस्टॉलेशन तैनात करने के बाद, उसका सार्वजनिक यूआरएल खोलें। Repovio पहला खाता मौजूद होने तक प्रत्येक अनुरोध को
`/auth/setup` पर पुनर्निर्देशित करता है। एक वैकल्पिक प्रथम और अंतिम नाम, एक अद्वितीय उपयोगकर्ता नाम और कम से कम 12
अक्षरों वाला एक पासवर्ड दर्ज करें। खाता सिस्टम प्रशासक के रूप में बनाया गया है और तुरंत साइन इन किया गया है।

सेटअप केवल एक बार ही सफल हो सकता है. पहला उपयोगकर्ता मौजूद होने के बाद, `/auth/setup` `/auth/signin` पर रीडायरेक्ट करता
है। मौजूदा इंस्टॉलेशन अपग्रेड के दौरान अपने वर्तमान उपयोगकर्ताओं को बनाए रखते हैं और दोबारा सेटअप नहीं दिखाते हैं।

<a id="openid-connect-single-sign-on"></a>

## ओपनआईडी कनेक्ट सिंगल साइन-ऑन

Repovio स्थानीय साइन-इन के अलावा एक वैकल्पिक ओपनआईडी कनेक्ट प्रदाता का समर्थन करता है। एक सिस्टम प्रशासक इसे **सेटिंग्स
→ प्रमाणीकरण** के अंतर्गत कॉन्फ़िगर करता है। यह लॉगिन GitHub, GitLab, Forgejo, और Gitea प्रदाता OAuth से अलग है: OIDC एक
Repovio उपयोगकर्ता की पहचान करता है, जबकि प्रदाता OAuth केवल प्रदाता संसाधनों तक पढ़ने की पहुंच प्रदान करता है।

प्रदाता को कॉन्फ़िगर करने से पहले सटीक बाहरी पहुंच योग्य एपीआई कॉलबैक यूआरएल सेट करें:

```dotenv
PUBLIC_URL=https://repovio.example.com
OIDC_CALLBACK_URL=https://repovio.example.com/api/v1/auth/oidc/callback
```

पहचान प्रदाता पर अनुमत रीडायरेक्ट यूआरआई के रूप में `OIDC_CALLBACK_URL` का मान पंजीकृत करें। Repovio में इसके जारीकर्ता,
क्लाइंट आईडी, वैकल्पिक क्लाइंट सीक्रेट, स्कोप और समूह दावे को कॉन्फ़िगर करें। एपीआई क्लाइंट सीक्रेट को सेव करने पर
स्वीकार करता है लेकिन कभी भी उसका मूल्य नहीं लौटाता है। इसे `TOKEN_ENCRYPTION_KEY` के साथ आराम से एन्क्रिप्ट किया गया
है। **कनेक्शन जांचें** का उपयोग करने से पहले कॉन्फ़िगरेशन सहेजें; सहेजे न गए परिवर्तन उस चेक को अक्षम कर देते हैं। OIDC
साइन-इन पर भरोसा करने से पहले पुष्टि करें कि खोज सफल है।

जारीकर्ता और उसके अंतिम बिंदुओं के लिए HTTPS आवश्यक है। **HTTP जारीकर्ता को अनुमति दें** केवल पृथक लैब नेटवर्क के लिए
है; इसे इंटरनेट-पहुंच योग्य परिनियोजन के लिए कभी भी सक्षम नहीं किया जाना चाहिए। OIDC सक्षम होने पर भी स्थानीय पासवर्ड
साइन-इन पुनर्प्राप्ति पथ के रूप में उपलब्ध रहता है।

फॉर्म कॉपी करने, कॉन्फ़िगर/अवलोकित समूहों और संग्रहीत क्लाइंट रहस्य को बदलने या साफ़ करने के लिए अलग-अलग नियंत्रणों के
लिए कॉलबैक यूआरएल भी दिखाता है। प्रतिस्थापन को अक्षम छोड़ने से सहेजा गया रहस्य सुरक्षित रहता है। लोडिंग, सेविंग और
कनेक्शन-चेक विफलताओं की रिपोर्ट अलग से की जाती है। अमान्य कॉन्फ़िगरेशन को ठीक करें और कनेक्शन जांच का पुनः प्रयास करने
से पहले दोबारा सहेजें।

<a id="groups-roles-and-identities"></a>

### समूह, भूमिकाएँ और पहचान

Group claim एक सटीक नाम या `realm_access.groups` जैसा dot-separated path हो सकता है। Case-sensitive सटीक मान दें। कई
समूह मिलने पर प्राथमिकता `SYSTEM_ADMIN`, फिर `MANAGER`, फिर `VIEWER` है। Missing या unmatched समूह अस्वीकार होते हैं, जब
तक unmatched-viewer स्पष्ट रूप से सक्रिय न हो। Malformed claims और group-overage हमेशा अस्वीकार होते हैं।

एक OIDC खाता केवल सत्यापित जारीकर्ता और विषय जोड़ी द्वारा लिंक किया गया है। Repovio कभी भी OIDC लॉगिन को ईमेल पते या
उपयोगकर्ता नाम द्वारा किसी स्थानीय खाते से लिंक नहीं करता है। प्रत्येक सफल लॉगिन पर सत्यापित दावों से प्रथम और अंतिम नाम
सिंक्रनाइज़ किए जाते हैं; लॉगिन नाम, प्रोफ़ाइल नाम और पासवर्ड स्थानीय रूप से नहीं बदले जा सकते। रिपॉजिटरी सदस्यताएँ
Repovio में प्रबंधित रहती हैं और कभी भी पहचान-प्रदाता समूहों से प्राप्त नहीं होती हैं।

सुरक्षा से जुड़े कॉन्फ़िगरेशन या भूमिका में बदलाव से मौजूदा OIDC bearer token अमान्य हो जाते हैं। केवल प्रदाता का
प्रदर्शन नाम बदलने से मौजूदा OIDC token अमान्य नहीं होते। पहचान प्रदाता का समूह अक्षम करने या हटाने से प्रभावित खाते को
नया सत्र नहीं मिलता और अगली अस्वीकृत लॉगिन कोशिश के बाद उसके पुराने सत्र भी अमान्य हो जाते हैं।

<a id="provider-examples"></a>

### प्रदाता उदाहरण

प्रदाता गाइड: [Keycloak](#oidc-keycloak) · [Microsoft Entra ID](#oidc-entra-id) · [Auth0](#oidc-auth0)

Authentik के लिए, प्राधिकरण-कोड प्रवाह, उपरोक्त सटीक कॉलबैक URL और `openid`, `profile`, और `email` स्कोप के साथ एक
OAuth2/OpenID प्रदाता बनाएं। एक स्कोप मैपिंग जोड़ें जो चुने गए समूह के दावे को समूह नामों की एक सरणी के रूप में लौटाता
है, प्रदाता को एक एप्लिकेशन से जोड़ता है, फिर एप्लिकेशन के जारीकर्ता, क्लाइंट आईडी और क्लाइंट सीक्रेट को Repovio में
कॉपी करें।

अन्य मानक-अनुपालक प्रदाता के लिए, प्राधिकरण कोड फ़्लो सक्षम करें, S256 PKCE की आवश्यकता है, सटीक कॉलबैक URL पंजीकृत
करें, और एक स्थिर `sub` प्लस आईडी टोकन या यूजरइन्फो प्रतिक्रिया में कॉन्फ़िगर समूह दावा शामिल करें। Repovio केवल असममित
आईडी-टोकन हस्ताक्षर स्वीकार करता है और अहस्ताक्षरित और HMAC-हस्ताक्षरित टोकन को अस्वीकार करता है।

<a id="oidc-keycloak"></a>

#### Keycloak

Keycloak व्यवस्थापक कंसोल में repovio realm और repovio नाम का OpenID Connect क्लाइंट बनाएँ। Client authentication और
Standard flow चालू करें; Implicit flow और Direct access grants बंद करें। नीचे का सटीक callback Valid redirect URIs में
दर्ज करें, S256 अनिवार्य करें और RS256 बनाए रखें। Credentials से क्लाइंट सीक्रेट कॉपी करें।

क्लाइंट के dedicated scope में Group Membership mapper जोड़ें: Token Claim Name groups, Full group path बंद और Add to ID
token चालू। profile और email को default scopes बनाएँ। repovio-admins, repovio-managers और repovio-viewers समूह बनाकर
उपयोगकर्ता जोड़ें और पूरे समूह नाम संबंधित Repovio भूमिकाओं से मैप करें। Realm भूमिकाएँ समूह सदस्यताएँ नहीं हैं।

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

संदर्भ: [Keycloak](https://www.keycloak.org/docs/latest/server_admin/index.html#_oidc_clients)

<a id="oidc-entra-id"></a>

#### Microsoft Entra ID

Entra ID → App registrations में single-tenant ऐप बनाएँ, Web platform और नीचे का सटीक callback जोड़ें; implicit token
issuance चालू न करें। Application (client) ID और Directory (tenant) ID कॉपी करें। क्लाइंट सीक्रेट बनाएँ और उसका Value
कॉपी करें, secret ID नहीं। v2 issuer में tenant ID दें; common या organizations नहीं।

Token configuration में सुरक्षा समूहों के लिए ID tokens में groups claim जोड़ें और Group ID चुनें। तीन समूह बनाकर
उपयोगकर्ता जोड़ें तथा समूह object IDs को SYSTEM_ADMIN, MANAGER और VIEWER से मैप करें। Display names GUID से मेल नहीं
खाते। Assigned-group filtering के लिए उपयुक्त Entra लाइसेंस आवश्यक हो सकता है। S256 PKCE और असममित हस्ताक्षर उपयोग करें;
सीक्रेट समाप्त होने से पहले बदलें।

समूह सीमा पार होने पर Repovio overage markers अस्वीकार करता है, भले ही unmatched-viewer पहुँच चालू हो। यह बाहरी claim
sources या Microsoft Graph नहीं पढ़ता। जारी सदस्यताएँ घटाएँ या समर्थित group filtering करें; Graph permissions देना
समाधान नहीं है।

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

संदर्भ:
[Microsoft Entra ID](https://learn.microsoft.com/en-us/security/zero-trust/develop/configure-tokens-group-claims-app-roles)

<a id="oidc-auth0"></a>

#### Auth0

Regular Web Application बनाएँ, Allowed Callback URLs में सटीक callback दें, Authorization Code और S256 PKCE उपयोग करें
तथा RS256 चुनें। Token Endpoint Authentication Method को Basic करें। Client ID और सीक्रेट कॉपी करें। चुने tenant या
custom domain की discovery से issuer लें और अंतिम slash बनाए रखें; domains न मिलाएँ।

नीचे के उदाहरण से Login / Post Login Action बनाएँ, REPLACE_WITH_REPOVIO_CLIENT_ID बदलें, deploy करके Login flow में
जोड़ें। व्यवस्थापक प्रत्येक उपयोगकर्ता का app_metadata.repovio_groups, repovio-admins, repovio-managers या
repovio-viewers वाली array के रूप में सेट करे। उपयोगकर्ता द्वारा संपादन योग्य user_metadata से authorization न करें।
Auth0 ये समूह स्वतः नहीं देता; केवल access token claim पर्याप्त नहीं है। Repovio में पूरा namespaced claim नाम दें और
तीनों मान संबंधित भूमिकाओं से मैप करें।

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

संदर्भ: [Auth0](https://auth0.com/docs/secure/tokens/json-web-tokens/create-custom-claims)

<a id="verify-oidc-providers"></a>

#### सत्यापन और समस्या निवारण

हर प्रदाता में OIDC_CALLBACK_URL सटीक दर्ज करें, openid profile email माँगें और Authorization Code, S256 PKCE तथा असममित
हस्ताक्षर उपयोग करें। सेटिंग्स → प्रमाणीकरण में issuer, client ID, सीक्रेट, scopes और group claim सहेजकर कनेक्शन जाँचें।
Discovery उपयोगकर्ता के समूहों की जाँच नहीं करती।

अलग उपयोगकर्ताओं से SYSTEM_ADMIN, MANAGER, VIEWER और बिना assignment का परीक्षण करें; unmatched-viewer बंद होने पर अंतिम
उपयोगकर्ता अस्वीकार होना चाहिए। समूहों की सटीक वर्तनी, Keycloak paths, Entra object IDs और Auth0 का namespaced ID-token
claim जाँचें। पुनर्प्राप्ति के लिए स्थानीय व्यवस्थापक रखें। OIDC समूह केवल global roles देते हैं; repository access के
लिए अलग Repovio grants चाहिए। एक समय में केवल एक प्रदाता कॉन्फ़िगर करें।

<a id="oidc-api-contract"></a>

### OIDC एपीआई अनुबंध

| विधि         | पथ                           | पहुंच          | उद्देश्य                                                                                       |
| ------------ | ---------------------------- | -------------- | ---------------------------------------------------------------------------------------------- |
| `GET`        | `/api/v1/auth/oidc/status`   | जनता           | केवल प्रभावी उपलब्धता और वैकल्पिक प्रदाता का नाम लौटाता है।                                    |
| `GET`        | `/api/v1/auth/oidc/start`    | जनता           | ब्राउज़र-बाउंड प्राधिकरण-कोड और S256 PKCE लेनदेन प्रारंभ करता है।                              |
| `GET`        | `/api/v1/auth/oidc/callback` | जनता           | प्रदाता की प्रतिक्रिया को मान्य करता है और एक बार के फ़्रैगमेंट कोड के साथ रीडायरेक्ट करता है। |
| `POST`       | `/api/v1/auth/oidc/exchange` | जनता           | एक बार फ़्रैगमेंट कोड का उपभोग करता है और सामान्य वाहक `AuthResult` लौटाता है।                 |
| `GET`, `PUT` | `/api/v1/auth/oidc/config`   | सिस्टम प्रशासक | गुप्त-सुरक्षित OIDC सेटिंग्स को पढ़ता या अपडेट करता है।                                        |
| `POST`       | `/api/v1/auth/oidc/check`    | सिस्टम प्रशासक | सहेजे गए डिस्कवरी कॉन्फ़िगरेशन को बदले बिना जाँचता है।                                         |

कॉलबैक कभी भी URL में बियरर JWT नहीं रखता है। इसका अपारदर्शी एक्सचेंज कोड 60 सेकंड के बाद समाप्त हो जाता है और इसका
उपयोग केवल एक बार किया जा सकता है। ब्राउज़र या लॉग तक पहुंचने से पहले प्रदाता त्रुटियां स्थिर त्रुटि कोड में कम हो जाती
हैं।

<a id="change-your-password"></a>

## अपना पासवर्ड बदलें

साइन इन करते समय, **सेटिंग्स → सामान्य → पासवर्ड बदलें** खोलें। वर्तमान पासवर्ड, नया पासवर्ड और इसकी पुष्टि दर्ज करें।
Repovio वर्तमान ब्राउज़र को प्रतिस्थापन एक्सेस टोकन के साथ साइन इन रखता है और हर दूसरे साइन-इन सत्र द्वारा रखे गए टोकन
को अमान्य कर देता है।

<a id="reset-a-forgotten-password"></a>

## भूले हुए पासवर्ड को रीसेट करें

Repovio में जानबूझकर कोई ईमेल-आधारित पासवर्ड रीसेट नहीं किया गया है। एक परिनियोजन व्यवस्थापक `compose.yml` वाली
निर्देशिका से एक स्थानीय खाते को रीसेट कर सकता है। प्रतिस्थापन पासवर्ड को बिना दोहराए या शेल इतिहास में संग्रहीत किए
बिना पढ़ें, फिर इसे मानक इनपुट पर एपीआई कंटेनर में भेजें:

```bash
read -rsp 'New Repovio password: ' REPOVIO_NEW_PASSWORD
printf '\n'
printf '%s\n' "$REPOVIO_NEW_PASSWORD" \
  | docker compose exec -T api node dist/scripts/reset-password.js USERNAME
unset REPOVIO_NEW_PASSWORD
```

`USERNAME` को सटीक लॉगिन उपयोगकर्ता नाम से बदलें। कमांड को 12 और 256 अक्षरों के बीच एक पासवर्ड की आवश्यकता होती है, केवल
उस स्थानीय खाते को अपडेट करता है, और उसके सभी मौजूदा एक्सेस टोकन को अमान्य कर देता है। बाद में नए पासवर्ड के साथ दोबारा
साइन इन करें। आदेश OIDC-प्रबंधित खातों को अस्वीकार कर देता है क्योंकि उनके पास कोई स्थानीय पासवर्ड नहीं है।

<a id="local-user-and-group-management"></a>

## स्थानीय पहुँच समूह

रिपॉज़िटरी के समूह पहुँच में Viewer या Manager दें, बदलें या हटाएँ। सीधे और विरासत अधिकार जुड़ते हैं; Manager प्राथमिक
है। प्रबंधन के लिए वैश्विक Manager भूमिका भी चाहिए; सिस्टम व्यवस्थापक अप्रतिबंधित हैं। निरसन अगले अनुरोध पर लागू है, जब
तक अन्य अनुदान मौजूद न हो। समूह स्थानीय तथा OIDC खाते लेते हैं, OIDC claims से सिंक नहीं होते।

[स्थानीय पहुँच समूह](/docs/next/users#local-access-groups)
