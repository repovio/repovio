---
title: 'Peningkatan merek Repovio'
description: 'Pertahankan data database dan kredensial saat berpindah ke nama Repovio.'
---

Penggantian nama ini merupakan perubahan konfigurasi yang dapat menyebabkan gangguan. Perbarui setiap variabel
lingkungan dengan awalan produk sebelumnya ke awalan `REPOVIO_`, termasuk `REPOVIO_ENV_FILE`, `REPOVIO_VERSION`,
`REPOVIO_API_PORT`, dan `REPOVIO_WEB_PORT`. Gunakan API dan gambar web di bawah `ghcr.io/repovio/repovio-api` dan
`ghcr.io/repovio/repovio-web`.

Selesaikan perubahan merek dahulu pada rilis PostgreSQL 17 sebelumnya. Konfigurasi Compose saat ini menargetkan
PostgreSQL 18; ikuti [pemutakhiran PostgreSQL 18 terpisah](/docs/next/postgresql-18-upgrade) sebelum memakainya. Jangan
pasang berkas PostgreSQL 17 pada layanan PostgreSQL 18. Langkah berikut memakai konfigurasi PostgreSQL 17 yang disimpan,
termasuk `compose.yml` dan `compose.upgrade.yml`. Perubahan merek saja tidak memerlukan konversi data; pemutakhiran
versi utama adalah operasi terpisah.

## Pertahankan data PostgreSQL

1. Cadangkan database yang ada dan konfirmasikan bahwa cadangan dapat dipulihkan sebelum mengubah penerapan.
2. Periksa container PostgreSQL yang sedang berjalan dengan `docker inspect <postgres-container>` dan catat volume
   bernama persis yang dipasang di `/var/lib/postgresql/data`. Hentikan aplikasi lama dan wadah PostgreSQL tanpa
   menghapus volume.
3. Tetapkan `REPOVIO_POSTGRES_VOLUME` di lingkungan penerapan baru ke nama volume yang tepat. Konfirmasikan
   keberadaannya menggunakan `docker volume inspect <recorded-volume>`. Default instalasi baru adalah
   `repovio-postgres`; itu tidak boleh menggantikan volume instalasi yang ada secara tidak sengaja.
4. Pertahankan `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `TOKEN_ENCRYPTION_KEY` dan `AUTH_JWT_SECRET` tidak
   berubah. Pertahankan PostgreSQL pada versi mayor yang sama. Tinjau `docker compose config` secara pribadi sebelum
   memulai; keluarannya berisi rahasia yang terselesaikan dan tidak boleh dibagikan atau dilakukan.
5. Gunakan `docker compose -f compose.yml -f compose.upgrade.yml` untuk peningkatan. Penggantian ini memerlukan
   keberadaan volume bernama, sehingga volume yang salah eja tidak dapat secara diam-diam menginisialisasi pengganti
   yang kosong. Mulai PostgreSQL terlebih dahulu dan verifikasi database yang ada, lalu mulai layanan dan aplikasi
   migrasi. Jangan pernah menjalankan `docker compose down --volumes`, menghapus volume lama, atau menginisialisasi
   database kosong sebagai bagian dari penggantian nama ini.

Tidak diperlukan konversi data dengan branding. Kredensial database dan kunci enkripsi tetap penting untuk membaca data
yang ada. Penerapan sebelumnya dapat dipulihkan menggunakan konfigurasi dan volume yang dipertahankan; hindari penulis
bersamaan.

## Otentikasi dan status browser

Penerbit JWT default sekarang adalah `repovio`; masuk lagi setelah memutakhirkan. Penerbit yang dikonfigurasi secara
eksplisit juga harus diperbarui secara sengaja. Preferensi browser, status notifikasi, cookie, dan kunci penyimpanan
yang ada tidak diimpor. Pilih lagi bahasa/tema Anda, instal ulang PWA jika perlu, dan aktifkan kembali notifikasi
browser. Perbarui nama tampilan penyedia identitas dan konfigurasi aplikasi eksternal jika diperlukan; rute panggilan
balik tidak berubah. Hapus data situs yang usang hanya setelah mengonfirmasi bahwa instalasi baru berfungsi.

Cabut token MCP sebelumnya dan buat penggantinya: awalan token yang diganti namanya sengaja tidak diterima sebagai
alias.
