---
title: 'Lokalisasi antarmuka'
description: 'Bahasa antarmuka yang didukung, perilaku fallback, dan proses pemeliharaan terjemahan Repovio.'
---

Repovio mendukung seluruh 13 bahasa situs web serta mempertahankan bahasa Italia, Belanda, Polandia, dan Portugis:
tersedia 17 bahasa aplikasi. Portugis (`pt`) dan Portugis Brasil (`pt-BR`) tetap menjadi pilihan terpisah. Semua kode
bahasa tercantum pada tabel di bawah.

Bahasa Inggris adalah bahasa bawaan dan cadangan. Cookie `repovio-locale` lebih diutamakan daripada bahasa peramban yang
didukung; preferensi yang tidak didukung menggunakan bahasa Inggris. Pergantian bahasa mempertahankan rute dan parameter
kueri. Format tanggal, waktu, dan angka mengikuti bahasa dengan tetap mempertahankan kebijakan 24 jam dan ISO yang
dikonfigurasi. Bahasa Arab dan Urdu menggunakan tata letak kanan ke kiri; bahasa lain menggunakan kiri ke kanan. Nama,
pengenal repositori, URL, dan kode dari penyedia mempertahankan nilai asli dan arah yang mudah dibaca.

<a id="sign-in-controls-and-language-flags"></a>

## Kontrol masuk dan bendera bahasa

Halaman masuk, pengaturan awal, dan menu pengguna menyediakan nama asli dan bendera SVG lokal dekoratif yang sama.
Nama tetap menjadi label aksesibel. Menu panjang dapat digulir dan dioperasikan dengan papan ketik. Kontrol tetap sibuk
selama seluruh pengunduhan dan memblokir pilihan berulang. Jika gagal, Repovio memulihkan bahasa sebelumnya dan menampilkan
pesan kesalahan terjemahan. Muat ulang halaman dan pilih kembali bahasa untuk mencoba pengunduhan lagi.

Halaman autentikasi publik juga menyediakan tombol tema yang bergilir antara Sistem, Terang, dan Gelap. Ikon menunjukkan
preferensi; tooltip dan nama aksesibel menjelaskan preferensi saat ini dan tindakan berikutnya.

Pemetaan kode bahasa ke negara bendera:

| Bahasa | Negara | Bahasa  | Negara |
| ------ | ------ | ------- | ------ |
| `en`   | GB     | `zh-CN` | CN     |
| `de`   | DE     | `hi`    | IN     |
| `es`   | ES     | `ar`    | SA     |
| `fr`   | FR     | `bn`    | BD     |
| `it`   | IT     | `pt-BR` | BR     |
| `nl`   | NL     | `id`    | ID     |
| `pl`   | PL     | `ur`    | PK     |
| `pt`   | PT     | `ru`    | RU     |
| `ja`   | JP     |         |        |

Aset dalam `apps/web/public/flags` berasal dari [flag-icons v7.5.0](https://github.com/lipis/flag-icons/tree/v7.5.0), dengan lisensi MIT yang disertakan. Tidak diperlukan layanan gambar atau terjemahan eksternal.

<a id="adding-or-updating-a-locale"></a>

## Menambahkan atau memperbarui bahasa

1. Gunakan `apps/web/i18n/locales/en.json` sebagai referensi pesan lengkap saat ini. Terjemahkan setiap katalog yang
   dikirimkan, termasuk label aksesibel, validasi, status, parameter, dan makna bentuk jamak.
2. Daftarkan kode, tag bahasa, nama asli, berkas, arah, negara, dan pengenal Nuxt UI dalam `apps/web/shared/locales.ts`.
   Pertahankan kode yang ada dan bedakan `pt` dari `pt-BR`.
3. Petakan ekspor Nuxt UI yang terpasang dalam `apps/web/app/utils/locales.ts`, misalnya `zh_cn` dan `pt_br`.
4. Tambahkan bendera lokal dengan lisensi dan atribusinya. Jangan impor implementasi situs web ke aplikasi.
5. Jalankan pemeriksaan dan skenario peramban. Pengujian membandingkan bahasa situs dengan aplikasi dan menolak pesan
   hilang, parameter tidak cocok, sintaks tidak valid, pemetaan UI, dan aset bendera yang hilang. Cadangan bahasa Inggris
   bukan pengganti terjemahan lengkap; nama produk serta literal teknis boleh tetap sama.

Aktifkan Node.js 26.13.0 dan pnpm 11.28.9, jalankan aplikasi lokal, lalu jalankan:

```sh
corepack pnpm --dir apps/web test
corepack pnpm --dir apps/web lint
corepack pnpm --dir apps/web typecheck
corepack pnpm --dir apps/web exec playwright test tests/e2e/localization.spec.ts \
  tests/e2e/auth-preferences.spec.ts tests/e2e/localization-rtl.spec.ts
```

Periksa tangkapan layar tema terang/gelap dan layar sempit/lebar, terutama RTL, CJK, serta aksara India. Perbarui semua terjemahan `next` saat ini secara konsisten; arsip versi yang diterbitkan tetap tidak berubah.
