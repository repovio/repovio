---
title: 'Dorongan peramban'
description: 'Aktifkan notifikasi per perangkat dan pahami persyaratan server dan browser.'
---

<a id="server-requirements"></a>

## Persyaratan server

Browser push adalah transport asli dan tidak menggunakan Apprise. Operator penerapan mengonfigurasi ketiga pengaturan:

```dotenv
WEB_PUSH_VAPID_PUBLIC_KEY=...
WEB_PUSH_VAPID_PRIVATE_KEY=...
WEB_PUSH_VAPID_SUBJECT=mailto:admin@example.com
```

Hasilkan pasangan kunci VAPID dengan `npx web-push generate-vapid-keys`. Subjeknya adalah URI `mailto:` atau `https:`.
Jaga kerahasiaan kunci pribadi. Tanpa konfigurasi lengkap, browser push ditampilkan sebagai tidak tersedia. Gunakan
konteks browser yang aman dan browser yang mendukung pekerja layanan dan Push API.

<a id="enable-or-disable-this-device"></a>

## Mengaktifkan atau menonaktifkan perangkat ini

Gunakan **Aktifkan di perangkat ini** dan berikan izin notifikasi browser bila diminta. Langganan adalah milik pengguna
dan browser saat ini. Administrator memilih pengguna penerima di saluran browser-push; setiap penerima memerlukan
perangkat yang diaktifkan. Menolak izin browser mencegah langganan; sesuaikan izin browser situs dan coba lagi jika
diinginkan. Periksa ketersediaan/jumlah perangkat dan kesalahan yang dilaporkan sebelum mengirim tes.

Menonaktifkan push akan menghapus langganan perangkat ini, bukan perangkat lain. Titik akhir dan kunci dienkripsi dan
dihapus duplikatnya dengan sidik jari yang tidak rahasia. Respons HTTP 404/410 menghapus langganan yang kedaluwarsa.
Browser yang tidak tersedia, konfigurasi server yang hilang, izin yang ditolak, atau kegagalan permintaan berlangganan
memerlukan perbaikan penyebab terkait; menyegarkan saja tidak dapat memberikan izin browser. Lihat
[Riwayat pengiriman](/docs/v2.0/notification-history) untuk upaya.
