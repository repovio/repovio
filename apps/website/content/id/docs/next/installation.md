---
title: 'Memasang Repovio'
description: 'Instalasi dan konfigurasi akun lokal, Authentik, Keycloak atau layanan OIDC yang sudah ada.'
---

<a id="before-you-begin"></a>

## Memasang Repovio

Pilih akun lokal, Authentik, Keycloak atau layanan OIDC yang sudah ada. Contoh berikut merupakan alternatif lengkap
untuk instalasi baru; jangan gabungkan layanannya.

Diperlukan Docker Engine, Compose v2, DNS publik dan reverse proxy TLS. Gunakan nama HTTPS terpisah untuk Repovio dan
penyedia identitas mandiri (Authentik atau Keycloak). Image privat memerlukan akses GHCR. Instalasi lama mengikuti
panduan penerapan dan pembaruan PostgreSQL sesuai versi; jangan gunakan volume PostgreSQL lama pada contoh ini.

<a id="shared-compose-configuration"></a>

## Konfigurasi bersama

Simpan YAML sebagai compose.yml dan nilai berikut sebagai .env di direktori privat. Ganti semua penanda dan gunakan tag
rilis Repovio yang sama persis untuk kedua image. Buat sandi basis data dan rahasia JWT secara terpisah dengan perintah
pertama, kunci enkripsi dengan perintah kedua. Sandi heksadesimal menghindari kesalahan pengodean URL.

```bash
openssl rand -hex 32
openssl rand -base64 32
```

```dotenv
REPOVIO_VERSION=REPLACE_WITH_EXACT_RELEASE_TAG
POSTGRES_PASSWORD=REPLACE_WITH_RANDOM_HEX_PASSWORD
AUTH_JWT_SECRET=REPLACE_WITH_RANDOM_HEX_SECRET
TOKEN_ENCRYPTION_KEY=REPLACE_WITH_BASE64_32_BYTE_KEY
```

<a id="docker-compose-without-oidc"></a>

## Tanpa OIDC

Tumpukan memakai akun lokal. Selesaikan penyiapan awal untuk membuat administrator pertama. Biarkan OIDC nonaktif; buat
akun tambahan di Administrasi → Pengguna.

```yaml
services:
  postgres:
    image: postgres:18-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: repovio
      POSTGRES_USER: repovio
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD}
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U repovio -d repovio']
      interval: 5s
      timeout: 5s
      retries: 12
    volumes:
      - repovio-postgres:/var/lib/postgresql
  migrate:
    image: ghcr.io/repovio/repovio-api:${REPOVIO_VERSION:?Set an exact release version}
    restart: 'no'
    command: ['node_modules/.bin/prisma', 'migrate', 'deploy', '--config', 'prisma.config.ts']
    environment: &api-environment
      NODE_ENV: production
      PORT: 3001
      DATABASE_URL: postgresql://repovio:${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD}@postgres:5432/repovio?schema=public
      SHADOW_DATABASE_URL: postgresql://repovio:${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD}@postgres:5432/repovio_shadow?schema=public
      AUTH_JWT_SECRET: ${AUTH_JWT_SECRET:?Set AUTH_JWT_SECRET}
      TOKEN_ENCRYPTION_KEY: ${TOKEN_ENCRYPTION_KEY:?Set TOKEN_ENCRYPTION_KEY}
      PUBLIC_URL: https://repovio.example.com
      CORS_ORIGIN: https://repovio.example.com
    depends_on:
      postgres:
        condition: service_healthy
  api:
    image: ghcr.io/repovio/repovio-api:${REPOVIO_VERSION:?Set an exact release version}
    restart: unless-stopped
    environment: *api-environment
    depends_on:
      migrate:
        condition: service_completed_successfully
    ports:
      - '127.0.0.1:3001:3001'
  web:
    image: ghcr.io/repovio/repovio-web:${REPOVIO_VERSION:?Set an exact release version}
    restart: unless-stopped
    environment:
      PORT: 3000
      NUXT_PUBLIC_API_BASE_URL: https://repovio.example.com/api/v1
    depends_on:
      api:
        condition: service_healthy
    ports:
      - '127.0.0.1:3000:3000'
volumes:
  repovio-postgres:
```

<a id="docker-compose-with-authentik"></a>

## Dengan Authentik

Gunakan alternatif lengkap ini, jangan jalankan kedua contoh bersamaan. Tambahkan nilai berikut ke .env dan buat sandi
basis data serta kunci rahasia terpisah. Versi Authentik yang dikunci memakai PostgreSQL sendiri, server dan worker;
contoh OIDC ini tidak memerlukan Redis atau soket Docker.

```dotenv
AUTHENTIK_POSTGRES_PASSWORD=REPLACE_WITH_SEPARATE_RANDOM_HEX_PASSWORD
AUTHENTIK_SECRET_KEY=REPLACE_WITH_RANDOM_HEX_SECRET
```

```yaml
services:
  postgres:
    image: postgres:18-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: repovio
      POSTGRES_USER: repovio
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD}
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U repovio -d repovio']
      interval: 5s
      timeout: 5s
      retries: 12
    volumes:
      - repovio-postgres:/var/lib/postgresql
  migrate:
    image: ghcr.io/repovio/repovio-api:${REPOVIO_VERSION:?Set an exact release version}
    restart: 'no'
    command: ['node_modules/.bin/prisma', 'migrate', 'deploy', '--config', 'prisma.config.ts']
    environment: &api-environment
      NODE_ENV: production
      PORT: 3001
      DATABASE_URL: postgresql://repovio:${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD}@postgres:5432/repovio?schema=public
      SHADOW_DATABASE_URL: postgresql://repovio:${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD}@postgres:5432/repovio_shadow?schema=public
      AUTH_JWT_SECRET: ${AUTH_JWT_SECRET:?Set AUTH_JWT_SECRET}
      TOKEN_ENCRYPTION_KEY: ${TOKEN_ENCRYPTION_KEY:?Set TOKEN_ENCRYPTION_KEY}
      PUBLIC_URL: https://repovio.example.com
      CORS_ORIGIN: https://repovio.example.com
      OIDC_CALLBACK_URL: https://repovio.example.com/api/v1/auth/oidc/callback
    depends_on:
      postgres:
        condition: service_healthy
  api:
    image: ghcr.io/repovio/repovio-api:${REPOVIO_VERSION:?Set an exact release version}
    restart: unless-stopped
    environment: *api-environment
    depends_on:
      migrate:
        condition: service_completed_successfully
    ports:
      - '127.0.0.1:3001:3001'
  web:
    image: ghcr.io/repovio/repovio-web:${REPOVIO_VERSION:?Set an exact release version}
    restart: unless-stopped
    environment:
      PORT: 3000
      NUXT_PUBLIC_API_BASE_URL: https://repovio.example.com/api/v1
    depends_on:
      api:
        condition: service_healthy
    ports:
      - '127.0.0.1:3000:3000'
  authentik-postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: authentik
      POSTGRES_USER: authentik
      POSTGRES_PASSWORD: ${AUTHENTIK_POSTGRES_PASSWORD:?Set AUTHENTIK_POSTGRES_PASSWORD}
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U authentik -d authentik']
      interval: 5s
      timeout: 5s
      retries: 12
    volumes:
      - authentik-postgres:/var/lib/postgresql/data
  authentik-server:
    image: ghcr.io/goauthentik/server:2026.8.5
    command: server
    restart: unless-stopped
    shm_size: 512mb
    environment: &authentik-environment
      AUTHENTIK_POSTGRESQL__HOST: authentik-postgres
      AUTHENTIK_POSTGRESQL__NAME: authentik
      AUTHENTIK_POSTGRESQL__USER: authentik
      AUTHENTIK_POSTGRESQL__PASSWORD: ${AUTHENTIK_POSTGRES_PASSWORD:?Set AUTHENTIK_POSTGRES_PASSWORD}
      AUTHENTIK_SECRET_KEY: ${AUTHENTIK_SECRET_KEY:?Set AUTHENTIK_SECRET_KEY}
    depends_on:
      authentik-postgres:
        condition: service_healthy
    ports:
      - '127.0.0.1:9000:9000'
    healthcheck:
      test: ['CMD', 'ak', 'healthcheck']
      interval: 30s
      timeout: 10s
      retries: 10
      start_period: 90s
    volumes:
      - authentik-data:/data
      - authentik-templates:/templates
  authentik-worker:
    image: ghcr.io/goauthentik/server:2026.8.5
    command: worker
    restart: unless-stopped
    shm_size: 512mb
    environment: *authentik-environment
    depends_on:
      authentik-postgres:
        condition: service_healthy
    healthcheck:
      test: ['CMD', 'ak', 'healthcheck']
      interval: 30s
      timeout: 10s
      retries: 10
      start_period: 90s
    volumes:
      - authentik-data:/data
      - authentik-templates:/templates
volumes:
  repovio-postgres:
  authentik-postgres:
  authentik-data:
  authentik-templates:
```

<a id="docker-compose-with-keycloak"></a>

## Dengan Keycloak

Gunakan stack alternatif lengkap ini secara terpisah. Tambahkan nilai di bawah ke .env dan buat kata sandi acak berbeda
untuk database dan administrator bootstrap. Keycloak memakai PostgreSQL 17 dan volume sendiri; jangan gunakan database
Repovio atau volume PostgreSQL lama. Image dipatok pada Keycloak 26.8.2 dengan start produksi, bukan start-dev.

```dotenv
KEYCLOAK_POSTGRES_PASSWORD=REPLACE_WITH_SEPARATE_RANDOM_HEX_PASSWORD
KEYCLOAK_ADMIN_USERNAME=bootstrap-admin
KEYCLOAK_ADMIN_PASSWORD=REPLACE_WITH_SEPARATE_RANDOM_HEX_PASSWORD
```

```yaml
services:
  postgres:
    image: postgres:18-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: repovio
      POSTGRES_USER: repovio
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD}
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U repovio -d repovio']
      interval: 5s
      timeout: 5s
      retries: 12
    volumes:
      - repovio-postgres:/var/lib/postgresql
  migrate:
    image: ghcr.io/repovio/repovio-api:${REPOVIO_VERSION:?Set an exact release version}
    restart: 'no'
    command: ['node_modules/.bin/prisma', 'migrate', 'deploy', '--config', 'prisma.config.ts']
    environment: &api-environment
      NODE_ENV: production
      PORT: 3001
      DATABASE_URL: postgresql://repovio:${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD}@postgres:5432/repovio?schema=public
      SHADOW_DATABASE_URL: postgresql://repovio:${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD}@postgres:5432/repovio_shadow?schema=public
      AUTH_JWT_SECRET: ${AUTH_JWT_SECRET:?Set AUTH_JWT_SECRET}
      TOKEN_ENCRYPTION_KEY: ${TOKEN_ENCRYPTION_KEY:?Set TOKEN_ENCRYPTION_KEY}
      PUBLIC_URL: https://repovio.example.com
      CORS_ORIGIN: https://repovio.example.com
      OIDC_CALLBACK_URL: https://repovio.example.com/api/v1/auth/oidc/callback
    depends_on:
      postgres:
        condition: service_healthy
  api:
    image: ghcr.io/repovio/repovio-api:${REPOVIO_VERSION:?Set an exact release version}
    restart: unless-stopped
    environment: *api-environment
    depends_on:
      migrate:
        condition: service_completed_successfully
    ports:
      - '127.0.0.1:3001:3001'
  web:
    image: ghcr.io/repovio/repovio-web:${REPOVIO_VERSION:?Set an exact release version}
    restart: unless-stopped
    environment:
      PORT: 3000
      NUXT_PUBLIC_API_BASE_URL: https://repovio.example.com/api/v1
    depends_on:
      api:
        condition: service_healthy
    ports:
      - '127.0.0.1:3000:3000'
  keycloak-postgres:
    image: postgres:17-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: keycloak
      POSTGRES_USER: keycloak
      POSTGRES_PASSWORD: ${KEYCLOAK_POSTGRES_PASSWORD:?Set KEYCLOAK_POSTGRES_PASSWORD}
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U keycloak -d keycloak']
      interval: 5s
      timeout: 5s
      retries: 12
    volumes:
      - keycloak-postgres:/var/lib/postgresql/data
  keycloak:
    image: quay.io/keycloak/keycloak:26.8.2
    command: ['start']
    restart: unless-stopped
    environment:
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://keycloak-postgres:5432/keycloak
      KC_DB_USERNAME: keycloak
      KC_DB_PASSWORD: ${KEYCLOAK_POSTGRES_PASSWORD:?Set KEYCLOAK_POSTGRES_PASSWORD}
      KC_BOOTSTRAP_ADMIN_USERNAME: ${KEYCLOAK_ADMIN_USERNAME:?Set KEYCLOAK_ADMIN_USERNAME}
      KC_BOOTSTRAP_ADMIN_PASSWORD: ${KEYCLOAK_ADMIN_PASSWORD:?Set KEYCLOAK_ADMIN_PASSWORD}
      KC_HOSTNAME: https://auth.example.com
      KC_HTTP_ENABLED: 'true'
      KC_PROXY_HEADERS: xforwarded
      KC_HEALTH_ENABLED: 'true'
    depends_on:
      keycloak-postgres:
        condition: service_healthy
    ports:
      - '127.0.0.1:8080:8080'
    healthcheck:
      test:
        - CMD
        - /bin/bash
        - -ec
        - >-
          exec 3<>/dev/tcp/127.0.0.1/9000; printf 'GET /health/ready HTTP/1.0\r\n\r\n' >&3; IFS= read -r status <&3; [[
          "$$status" == *' 200 '* ]]
      interval: 15s
      timeout: 5s
      retries: 20
      start_period: 120s
volumes:
  repovio-postgres:
  keycloak-postgres:
```

Pada contoh Caddy yang ada, ubah upstream auth.example.com dari 127.0.0.1:9000 menjadi 127.0.0.1:8080. Atur KC_HOSTNAME
ke URL HTTPS publik. Caddy harus menimpa header X-Forwarded; hanya proxy tepercaya boleh mencapai listener HTTP. Jangan
publikasikan port readiness internal 9000. Biarkan Allow HTTP issuer nonaktif: HTTP hanya dipakai antara proxy dan
Keycloak.

Buka konsol menggunakan kredensial bootstrap setelah startup. Buat dan verifikasi administrator permanen pada realm
master, hapus administrator sementara lalu hapus kedua entri KC_BOOTSTRAP_ADMIN dari Compose dan nilainya dari .env.
Ikuti panduan Keycloak untuk realm repovio, klien, grup dan pemetaan. Setelah restart, periksa discovery dan empat kasus
akses.

Referensi: [Keycloak](/docs/next/authentication#oidc-keycloak) ·
[Keycloak containers](https://www.keycloak.org/server/containers)

<a id="existing-oidc-provider"></a>

## Menggunakan penyedia yang sudah ada

Gunakan stack Compose akun lokal dengan layanan Keycloak, Entra ID, Auth0 atau Authentik yang sudah ada. Tambahkan
OIDC_CALLBACK_URL dengan callback API publik yang persis pada lingkungan API bersama. Selesaikan setup administrator
lokal lalu ikuti panduan penyedia. Atur issuer dan rahasia di Repovio, bukan melalui variabel lingkungan buatan.

Referensi: [Keycloak](/docs/next/authentication#oidc-keycloak) ·
[Microsoft Entra ID](/docs/next/authentication#oidc-entra-id) · [Auth0](/docs/next/authentication#oidc-auth0)

<a id="compose-proxy-and-startup"></a>

## Proxy dan mulai

Ganti domain contoh dalam YAML, variabel dan proxy. Proxy berjalan di host Docker; kedua nama memerlukan sertifikat TLS
valid. Proxy dalam kontainer memakai jaringan Docker bersama, bukan loopback sendiri. Jangan publikasikan port basis
data.

```caddy
repovio.example.com {
  reverse_proxy /api/* 127.0.0.1:3001
  reverse_proxy /socket.io/* 127.0.0.1:3001
  reverse_proxy /mcp 127.0.0.1:3001
  reverse_proxy 127.0.0.1:3000
}
auth.example.com {
  reverse_proxy 127.0.0.1:9000
}
```

<a id="configure-authentik-oidc"></a>

## Mengatur OIDC

Buka Authentik dan siapkan akadmin. Buat aplikasi/provider OAuth2/OpenID dengan slug repovio, klien rahasia, alur kode
otorisasi, kunci tanda tangan, issuer per provider dan redirect URI ketat berikut. Sertakan openid, profile dan email;
profile harus mengembalikan nama grup pada groups.

```text
Issuer: https://auth.example.com/application/o/repovio/
Discovery: https://auth.example.com/application/o/repovio/.well-known/openid-configuration
Redirect URI: https://repovio.example.com/api/v1/auth/oidc/callback
```

Masuk ke Repovio sebagai administrator lokal. Dalam Pengaturan → Autentikasi masukkan issuer, ID dan rahasia klien,
pilih groups dan cakupan openid profile email. Buat repovio-admins, repovio-managers dan repovio-viewers di Authentik
lalu petakan peran. Uji, aktifkan OIDC dan periksa akun nonadministrator serta akun tanpa pemetaan. Konfigurasi disimpan
di Repovio, bukan variabel OIDC rekaan. Login lokal tetap tersedia untuk pemulihan.

Grup OIDC hanya menentukan peran global. Grup akses lokal dan penetapan langsung memberi akses repositori secara
terpisah; pengelola juga memerlukan penetapan Manager. Tidak ada sinkronisasi grup OIDC.

<a id="verify-compose-installation"></a>

## Verifikasi dan pembaruan

Validasi tanpa menampilkan rahasia lalu mulai. Periksa migrasi, kesehatan API dan web; pada contoh kedua periksa juga
Authentik dan login OIDC. Lindungi .env dan cadangkan kedua basis data serta volume Authentik. Pertahankan nama volume
yang sudah ada. Versi lama mengabaikan izin grup: rollback dapat menghilangkan akses turunan, tetapi penetapan langsung
tetap berlaku.

```bash
chmod 600 .env
docker compose config --quiet
docker compose pull
docker compose up --detach --wait
docker compose logs migrate
curl --fail http://127.0.0.1:3001/api/health
```

<a id="keycloak-backup-recovery"></a>

## Pencadangan dan pemulihan Keycloak

Jalankan juga perintah validasi dan startup bersama. Setelah restart Keycloak dan PostgreSQL, periksa readiness,
discovery HTTPS dan login S256 PKCE baru; pengguna dan konfigurasi realm harus tetap tersimpan.

Cadangkan kedua database secara terpisah, Compose, .env terlindungi dan TOKEN_ENCRYPTION_KEY. Untuk Keycloak gunakan
dump PostgreSQL yang konsisten; ekspor realm saja tidak cukup. Pulihkan pada instalasi terpisah dengan versi Keycloak
dan PostgreSQL yang sama sebelum menguji upgrade. Hentikan Keycloak selama pemulihan; periksa pengguna, rahasia,
pemetaan dan peran sebelum mengalihkan trafik. Jangan timpa satu-satunya volume yang berfungsi.

<a id="recommended-first-session"></a>

## Panduan lanjutan

[Panduan lanjutan](/docs/next/setup) · [Masuk](/docs/next/sign-in) · [Repovio](/docs/next/deployment) ·
[OIDC](/docs/next/authentication)

Panduan lanjutan: [Authentik Compose](https://docs.goauthentik.io/install-config/install/docker-compose/) ·
[Authentik OIDC](https://docs.goauthentik.io/add-secure-apps/providers/oauth2/)

<a id="when-a-page-is-empty-or-unavailable"></a>

[Panduan lanjutan](/docs/next/repositories)
