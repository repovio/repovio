---
title: 'Menyebarkan Repovio'
description: 'Penerapan produksi, proksi TLS, pencadangan, pemulihan, peningkatan, dan panduan rollback untuk Repovio.'
---

Tumpukan Compose Repovio memulai PostgreSQL, menerapkan migrasi Prisma satu kali, lalu memulai API dan aplikasi web. Itu
tidak menghentikan TLS. Letakkan layanan web dan API di belakang proxy terbalik yang memiliki nama host dan sertifikat
publik.

<a id="prerequisites"></a>

## Prasyarat

- Mesin Docker dengan Docker Compose v2.
- Catatan DNS untuk nama host publik.
- Proksi terbalik yang memperoleh dan memperbarui sertifikat TLS.
- Direktori server pribadi hanya dapat dibaca oleh administrator penempatan.

Tumpukan Compose menyimpan data PostgreSQL, termasuk gambar profil pengguna yang dinormalisasi, dalam volume bernama
`repovio-postgres`. Jangan hapus volume ini kecuali Anda sengaja ingin menghapus semua data Repovio.

<a id="first-deployment"></a>

## Penerapan pertama

### Langkah 1: Periksa versi Repovio yang dirilis dan buat file lingkungan pribadi:

```bash
cp .env.example .env
chmod 600 .env
```

### Langkah 2: Ganti setiap placeholder di `.env`, terutama `POSTGRES_PASSWORD`, baik URL database, `AUTH_JWT_SECRET`, dan

`TOKEN_ENCRYPTION_KEY`. Hasilkan kunci enkripsi dengan:

```bash
openssl rand -base64 32
```

### Langkah 3: Tetapkan URL yang terlihat secara eksternal. Untuk penerapan di `https://repovio.example.com`, gunakan:

```dotenv
PUBLIC_URL=https://repovio.example.com
OIDC_CALLBACK_URL=https://repovio.example.com/api/v1/auth/oidc/callback
CORS_ORIGIN=https://repovio.example.com
NUXT_PUBLIC_API_BASE_URL=https://repovio.example.com/api/v1
OAUTH_CALLBACK_URL=https://repovio.example.com/api/v1/provider-accounts/oauth/callback
```

### Langkah 4: Ikat port kontainer ke loopback ketika proksi terbalik berjalan pada host yang sama:

```dotenv
REPOVIO_API_PORT=127.0.0.1:3001
REPOVIO_WEB_PORT=127.0.0.1:3000
```

Jika tidak, batasi akses ke port 3000 dan 3001 dengan firewall host. Jangan pernah memaparkan wadah PostgreSQL.

### Langkah 5: Atur `REPOVIO_VERSION` di `.env` ke pasangan gambar yang dirilis dengan tepat, lalu mulai tumpukan:

```bash
docker compose pull
docker compose up --detach --wait
```

Pertahankan nilai tersebut di `.env` sehingga setiap perintah Compose selanjutnya menggunakan API dan versi web yang
sama.

### Langkah 6: Konfirmasikan titik akhir kesehatan API secara lokal:

```bash
curl --fail http://127.0.0.1:3001/api/health
```

### Langkah 7: Buka URL Repovio publik dan lengkapi [pengaturan yang dijalankan pertama kali](/docs/v2.0/authentication) untuk membuat yang pertama

administrator sistem.

<a id="reverse-proxy-and-tls"></a>

## Membalikkan proksi dan TLS

Proxy asal web publik ke port 3000, dan jalur API dan Socket.IO ke port 3001. Misalnya, blok situs Caddy dapat
menggunakan:

```caddy
repovio.example.com {
  reverse_proxy /api/* 127.0.0.1:3001
  reverse_proxy /socket.io/* 127.0.0.1:3001
  reverse_proxy /mcp 127.0.0.1:3001
  reverse_proxy 127.0.0.1:3000
}
```

Proksi harus mengalihkan HTTP ke HTTPS, memvalidasi koneksi upstream sesuai dengan kebijakan lokalnya, dan
mempertahankan nama host publik. Konfigurasikan penyedia OAuth dengan URL panggilan balik HTTPS yang sama yang diatur di
`OAUTH_CALLBACK_URL`.

<a id="upgrading"></a>

## Meningkatkan

<a id="migrating-an-earlier-installation"></a>

### Memigrasi instalasi sebelumnya

Ikuti [peningkatan merek](/docs/v2.0/branding-upgrade) sebelum memulai tumpukan yang diganti namanya. Setel
`REPOVIO_POSTGRES_VOLUME` ke nama volume yang sudah ada. Pertahankan kredensial basis data dan kunci enkripsi; tidak
diperlukan salinan atau pengaturan ulang basis data untuk pencitraan merek.

### Langkah 1: Buat dan verifikasi cadangan database sebelum mengubah gambar.

### Langkah 2: Setel `REPOVIO_VERSION` ke versi rilis persisnya di `.env`.

### Langkah 3: Tarik dan terapkan pelepasan:

```bash
docker compose pull
docker compose up --detach --wait
```

Layanan `migrate` menerapkan migrasi Prisma yang tertunda sebelum API dimulai. Periksa setelah setiap pembaruan:

```bash
docker compose logs migrate
```

### Langkah 4: Verifikasi titik akhir kesehatan dan dasbor yang dilayani proxy sebelum menganggap pembaruan telah selesai.

<a id="database-backup"></a>

## Cadangan basis data

Jalankan pencadangan dari direktori penerapan. Ini menulis dump format khusus PostgreSQL ke host tanpa mencetak
kredensial atau memasukkannya ke dalam baris perintah:

```bash
mkdir -p backups
backup_file="backups/repovio-$(date +%F-%H%M%S).dump"
docker compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -Fc "$POSTGRES_DB"' \
  > "$backup_file"
pg_restore --list "$backup_file"
```

Simpan salinan terenkripsi di luar host dan uji pemulihan secara berkala pada sistem terpisah.

<a id="database-restore"></a>

## Pemulihan basis data

Memulihkan menggantikan objek database saat ini. Ambil cadangan baru terlebih dahulu dan jadwalkan waktu henti.

```bash
docker compose stop api web
docker compose exec -T postgres sh -c 'pg_restore -U "$POSTGRES_USER" --clean --if-exists --no-owner -d "$POSTGRES_DB"' \
  < backups/repovio-YYYY-MM-DD-HHMMSS.dump
docker compose up --detach --wait
```

Setelah itu, periksa `docker compose logs migrate` dan titik akhir kesehatan API. Pulihkan dump yang dibuat oleh versi
Repovio yang kompatibel saat memutar kembali seluruh perubahan skema.

<a id="rollback"></a>

## Kembalikan

### Langkah 1: Simpan cadangan yang dibuat segera sebelum pemutakhiran gagal.

### Langkah 2: Atur `REPOVIO_VERSION` di `.env` ke versi gambar terakhir yang diketahui bagus.

### Langkah 3: Jalankan `docker compose pull` dan `docker compose up --detach --wait`.

### Langkah 4: Jika rilis yang lebih baru memigrasikan database secara tidak kompatibel, hentikan API dan web, pulihkan cadangan yang kompatibel, lalu

mulai lagi versi gambar sebelumnya.

Jangan pernah menggunakan `docker compose down --volumes` sebagai perintah pembaruan atau rollback: ini akan menghapus
volume bernama PostgreSQL.
