---
title: PostgreSQL 17 से 18 में अपग्रेड
description: नए अलग PostgreSQL 18 वॉल्यूम में डेटा स्थानांतरित करें और पुनर्स्थापन सत्यापित करें।
---

वर्तमान Compose स्टैक `postgres:18-alpine` का उपयोग करता है और नामित वॉल्यूम को `/var/lib/postgresql` पर माउंट करता है।
PostgreSQL 18 क्लस्टर को संस्करण-विशिष्ट उपनिर्देशिका में रखता है। PostgreSQL 17 की फ़ाइलें सीधे उपयोग नहीं हो सकतीं।
[आधिकारिक इमेज दस्तावेज़](https://hub.docker.com/_/postgres) देखें।

यह प्रक्रिया एप्लिकेशन डेटाबेस का डंप बनाकर **अलग नए वॉल्यूम** में पुनर्स्थापित करती है। रखरखाव अवधि आवश्यक है। इसे
[ब्रांड नाम परिवर्तन](/docs/next/branding-upgrade) के साथ न करें; पहले पुराने PostgreSQL 17 रिलीज़ पर नाम परिवर्तन पूरा
करें। स्रोत अपडेट अपने आप उत्पादन माइग्रेशन नहीं चलाता।

<a id="before-maintenance"></a>

## रखरखाव से पहले

- पिछले रिलीज़ की पूरी कॉन्फ़िगरेशन, `.env` और PostgreSQL 17 वॉल्यूम का सटीक नाम बचाएँ। Compose फ़ाइल पुराने रिलीज़
  फ़ोल्डर में रखें ताकि सापेक्ष बाइंड माउंट और परिवेश फ़ाइलों के पथ सही रहें।
- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `TOKEN_ENCRYPTION_KEY` और `AUTH_JWT_SECRET` न बदलें। कुंजी मौजूदा
  प्रदाता और सूचना क्रेडेंशियल डिक्रिप्ट करने के लिए आवश्यक है।
- डंप और दोनों वॉल्यूम के लिए जगह रखें। बैकअप और `.env` को गोपनीय रखें।
- प्रक्रिया Repovio की एकल डेटाबेस भूमिका मानती है। अतिरिक्त भूमिकाएँ, अधिकार, एक्सटेंशन और डेटाबेस अलग से सूचीबद्ध
  करें; एप्लिकेशन डंप उनका बैकअप सुनिश्चित नहीं करता।
- अस्थायी प्रति पर पुनर्स्थापन और जाँच का अभ्यास करें। `pnpm test:postgres-upgrade` वास्तविक माइग्रेशन और केवल कृत्रिम
  डेटा उपयोग करता है; किसी विशिष्ट स्थापना का बैकअप सत्यापित नहीं करता।

<a id="stop-writers-and-back-up-postgresql-17"></a>

## लेखन रोकें और PostgreSQL 17 का बैकअप लें

आदेश **पिछले रिलीज़ की निर्देशिका** से उसकी PostgreSQL 17 Compose कॉन्फ़िगरेशन के साथ चलाएँ। अन्य बाहरी लेखन प्रक्रियाएँ
भी रोकें। पुनर्स्थापन और सत्यापन पूरा होने से पहले नया एप्लिकेशन शुरू न करें।

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

प्रारंभिक गणनाएँ निजी रूप से दर्ज करें। डंप को पुनर्स्थापित करके जाँचें, केवल आकार देखकर नहीं। पुराना वॉल्यूम और
कॉन्फ़िगरेशन बचाएँ। कभी `docker compose down --volumes` न चलाएँ और कोई भी डेटा वॉल्यूम न हटाएँ।

<a id="restore-into-postgresql-18"></a>

## PostgreSQL 18 में पुनर्स्थापन

**नए रिलीज़ की निर्देशिका** में वही क्रेडेंशियल और कुंजी रखें। `backup` में बैकअप का पूर्ण पथ दें। नया अनूठा वॉल्यूम नाम
चुनें और नए `.env` में `REPOVIO_POSTGRES_VOLUME` के रूप में रखें; वह PostgreSQL 17 वॉल्यूम से अलग होना चाहिए। गलत या
अनुपस्थित नाम रोकने के लिए बाहरी-वॉल्यूम ओवरराइड उपयोग करें।

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

वास्तव में नया खाली वॉल्यूम लें; नाम पहले मौजूद हो तो दूसरा चुनें। एंट्रीपॉइंट पुराने डेटा लेआउट को रोकता है, जिसमें नई
रूट पर गलती से लगा PostgreSQL 17 वॉल्यूम भी है; डेटा रूपांतरित नहीं करता। पुनर्स्थापन विफल हो तो डंप और पुराना वॉल्यूम
रखें, त्रुटि जाँचें और दूसरे नए खाली वॉल्यूम से प्रयास करें। आंशिक रूप से पुनर्स्थापित डेटाबेस पर बार-बार आयात न करें।

प्रारंभिक गणनाएँ और प्रतिनिधि संबंध मिलाएँ। लॉगिन, अनुमतियाँ, सूचना सेटिंग और सुरक्षित कुंजी से डिक्रिप्शन जाँचें। API
स्वास्थ्य और लॉग निजी रूप से देखें। PostgreSQL 18 पुनः शुरू कर डेटा बने रहने की पुष्टि के बाद रखरखाव समाप्त करें।
परीक्षित डिफ़ॉल्ट डेटा निर्देशिका `/var/lib/postgresql/18/docker` है।

<a id="recovery"></a>

## पिछले संस्करण में वापसी

नई लिखाइयों से पहले नया स्टैक रोककर पूरा पिछला रिलीज़ उसके मूल PostgreSQL 17 वॉल्यूम और कॉन्फ़िगरेशन से शुरू कर सकते
हैं। दोनों स्टैक को एक साथ कभी लिखने न दें। नया वॉल्यूम निदान के लिए रखें; PostgreSQL 17 कभी PostgreSQL 18 की फ़ाइलें न
खोले।

नई लिखाइयों के बाद पुराना वॉल्यूम पुराना पड़ जाता है; उस पर लौटने से नई लिखाइयाँ खोती हैं। पहले डेटा मिलान या अलग से
परीक्षित पुनर्प्राप्ति की योजना बनाएँ। PostgreSQL 18 डंप को 17 में बहाल करना सुनिश्चित डाउनग्रेड नहीं है। दोनों वॉल्यूम
और बैकअप तब तक बचाएँ जब तक संचालक पुनर्प्राप्ति अवधि स्पष्ट रूप से समाप्त न करे।

<a id="disposable-verification"></a>

## अस्थायी संसाधनों पर सत्यापन

```sh
docker build -f apps/api/Dockerfile -t repovio-api:local .
pnpm test:postgres-upgrade
```

टेस्ट अनूठे नाम वाले कंटेनर, नेटवर्क और वॉल्यूम बनाता है; दोनों प्रमुख संस्करणों पर वास्तविक Prisma माइग्रेशन चलाता है;
नई शुरुआत और शैडो डेटाबेस जाँचता है; गलत माउंट किए पुराने वॉल्यूम को रोकता है; डंप पुनर्स्थापित करता है; सभी सार्वजनिक
तालिकाएँ मिलाता है; कृत्रिम क्रेडेंशियल डिक्रिप्ट करता है और पुनः आरंभ पर स्थायित्व तथा अपरिवर्तित पुराने डेटा की जाँच
करता है। सफाई केवल टेस्ट के बनाए संसाधन हटाती है। मौजूदा कंटेनर, वॉल्यूम, डेटाबेस या क्रेडेंशियल उपयोग नहीं होते। दूसरी
स्थानीय निर्मित एप्लिकेशन इमेज के लिए `REPOVIO_TEST_API_IMAGE` सेट करें।
