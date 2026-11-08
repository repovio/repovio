---
title: 'Pencarian global'
description: 'Tujuan pencarian, repositori, akun penyedia, dan alur kerja berjalan.'
---

> Cuplikan sumber yang diarsipkan. Label produk menggunakan Repovio. Gunakan pengidentifikasi konfigurasi dan referensi
> kontainer dari file penerapan yang diberi tag pada rilis ini tanpa perubahan.

<a id="search-the-installation"></a>

## Cari instalasi

Buka pencarian dari bilah aplikasi atau gunakan pintasan keyboard yang ditampilkan. Masukkan setidaknya dua karakter.
Hasil dikelompokkan ke dalam tujuan navigasi, repositori, akun penyedia, dan alur kerja yang dijalankan. Pencocokan
navigasi menggunakan terjemahan label tujuan yang dapat diakses akun Anda; hasil sumber daya menggunakan nama penyedia
yang disinkronkan.

Telusuri hasil dengan keyboard atau pilih salah satu dengan penunjuk. Pencocokan repositori dan akun penyedia membuka
tampilan Repovio yang sesuai; alur kerja cocok dengan URL jalankan penyedia. Tekan **Escape** untuk menutup pencarian
dan kembali ke halaman sebelumnya. Pencarian tidak melakukan penemuan sisi penyedia atau memulai sinkronisasi.

<a id="access-and-failure-states"></a>

## Akses dan status kegagalan

Pencarian sumber daya menggunakan izin repositori pengguna saat ini. Hasil akun penyedia terbatas pada administrator.
Tidak ada hasil dapat berarti kueri singkat, tidak ada catatan yang cocok, atau keanggotaan tidak mencukupi. Coba nama
yang lebih spesifik dan periksa repositori/pekerjaan jika data yang disinkronkan tidak ada. Pemuatan ditampilkan saat
kueri dijalankan. Jika terjadi kesalahan permintaan, coba lagi kueri setelah konektivitas API pulih. Pencarian tidak
pernah mengungkapkan token penyedia atau kredensial pemberitahuan.
