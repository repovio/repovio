---
title: Memutakhirkan PostgreSQL 17 ke 18
description: Pindahkan data ke volume PostgreSQL 18 baru dan verifikasi pemulihannya.
---

Stack Compose memakai `postgres:18-alpine` dan memasang volume bernama di `/var/lib/postgresql`. PostgreSQL 18 menyimpan
klaster dalam subdirektori khusus versi. Berkas PostgreSQL 17 tidak dapat langsung digunakan. Lihat
[dokumentasi image resmi](https://hub.docker.com/_/postgres).

Prosedur ini membuat dump basis data aplikasi dan memulihkannya ke **volume baru yang terpisah**. Diperlukan waktu
pemeliharaan. Jangan gabungkan dengan [perubahan merek](/docs/next/branding-upgrade); selesaikan perubahan itu dahulu
dengan rilis PostgreSQL 17 sebelumnya. Pembaruan sumber tidak menjalankan migrasi produksi secara otomatis.

<a id="before-maintenance"></a>

## Sebelum pemeliharaan

- Simpan seluruh konfigurasi rilis sebelumnya, `.env`, dan nama volume PostgreSQL 17 yang tepat. Simpan berkas Compose
  di direktori rilis sebelumnya agar jalur relatif bind mount dan berkas lingkungan tetap benar.
- Jangan ubah `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `TOKEN_ENCRYPTION_KEY`, dan `AUTH_JWT_SECRET`. Kunci
  diperlukan untuk mendekripsi kredensial penyedia dan notifikasi yang ada.
- Sediakan ruang untuk dump serta kedua volume. Lindungi cadangan dan `.env` sebagai rahasia.
- Prosedur mengasumsikan satu peran basis data Repovio. Inventarisasi peran, izin, ekstensi, dan basis data tambahan
  secara terpisah; dump aplikasi tidak menjamin pencadangannya.
- Latih pemulihan dan verifikasi dengan salinan sekali pakai. `pnpm test:postgres-upgrade` memakai migrasi aplikasi
  nyata dan hanya data sintetis; tidak memvalidasi cadangan penerapan tertentu.

<a id="stop-writers-and-back-up-postgresql-17"></a>

## Hentikan penulisan dan cadangkan PostgreSQL 17

Jalankan perintah dari **direktori rilis sebelumnya** dengan konfigurasi Compose PostgreSQL 17 miliknya. Hentikan
penulis eksternal lain juga. Jangan mulai aplikasi baru sebelum pemulihan dan verifikasi selesai.

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

Catat jumlah awal secara privat. Validasi dump dengan memulihkannya, bukan hanya memeriksa ukuran. Simpan volume dan
konfigurasi lama. Jangan pernah menjalankan `docker compose down --volumes` atau menghapus salah satu volume data.

<a id="restore-into-postgresql-18"></a>

## Pulihkan ke PostgreSQL 18

Di **direktori rilis baru**, pertahankan kredensial dan kunci. Atur `backup` ke jalur absolut cadangan. Pilih nama
volume baru yang unik dan simpan sebagai `REPOVIO_POSTGRES_VOLUME` dalam `.env` baru; harus berbeda dari volume
PostgreSQL 17. Gunakan override volume eksternal untuk menolak nama yang salah atau tidak ada.

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

Gunakan volume yang benar-benar baru dan kosong; jika nama sudah ada, pilih yang lain. Entrypoint menolak tata letak
lama, termasuk volume PostgreSQL 17 yang keliru dipasang pada akar baru; tidak mengonversi data. Jika pemulihan gagal,
simpan dump dan volume lama, selidiki kesalahan, lalu ulangi dengan volume kosong baru lainnya. Jangan memulihkan
berulang kali ke basis data yang baru dipulihkan sebagian.

Bandingkan jumlah awal dan relasi yang mewakili. Verifikasi login, izin, konfigurasi notifikasi, dan dekripsi dengan
kunci tersimpan. Periksa kesehatan API dan log secara privat. Mulai ulang PostgreSQL 18 dan pastikan data tetap ada
sebelum mengakhiri pemeliharaan. Direktori default yang diuji adalah `/var/lib/postgresql/18/docker`.

<a id="recovery"></a>

## Pemulihan ke versi sebelumnya

Sebelum penulisan baru, hentikan stack baru dan mulai ulang seluruh rilis sebelumnya dengan volume PostgreSQL 17 dan
konfigurasi aslinya. Jangan pernah menjalankan kedua stack sebagai penulis bersamaan. Simpan volume baru untuk
diagnosis; PostgreSQL 17 tidak boleh membuka berkas PostgreSQL 18.

Setelah penulisan baru, volume lama sudah usang; kembali ke sana menghilangkan penulisan tersebut. Rencanakan
rekonsiliasi data atau pemulihan yang diuji terpisah. Memulihkan dump PostgreSQL 18 ke 17 bukan downgrade yang terjamin.
Simpan kedua volume dan cadangan hingga operator secara eksplisit menutup jendela pemulihan.

<a id="disposable-verification"></a>

## Verifikasi dengan sumber daya sekali pakai

```sh
docker build -f apps/api/Dockerfile -t repovio-api:local .
pnpm test:postgres-upgrade
```

Pengujian membuat kontainer, jaringan, dan volume bernama unik; menerapkan migrasi Prisma nyata pada kedua versi;
memeriksa inisialisasi baru dan basis data bayangan; menolak volume lama yang salah dipasang; memulihkan dump;
membandingkan seluruh tabel publik; mendekripsi kredensial sintetis serta memverifikasi persistensi setelah mulai ulang
dan data lama yang tidak berubah. Pembersihan hanya menghapus sumber daya pengujian. Kontainer, volume, basis data, dan
kredensial yang ada tidak digunakan. Atur `REPOVIO_TEST_API_IMAGE` untuk memakai image aplikasi lain yang dibangun
lokal.
