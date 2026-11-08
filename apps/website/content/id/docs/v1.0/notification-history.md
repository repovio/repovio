---
title: 'Riwayat pengiriman'
description: 'Periksa hasil pemberitahuan dan detail pengiriman per upaya yang aman.'
---

> Cuplikan sumber yang diarsipkan. Label produk menggunakan Repovio. Gunakan pengidentifikasi konfigurasi dan referensi
> kontainer dari file penerapan yang diberi tag pada rilis ini tanpa perubahan.

<a id="review-deliveries"></a>

## Tinjau pengiriman

Hanya administrator sistem yang dapat membuka **Pemberitahuan → Riwayat pengiriman**. Tabel ini membedakan pengiriman
peristiwa dari pengujian dan menunjukkan jenis peristiwa, repositori, tautan subjek/penyedia, saluran, status, jumlah
upaya, upaya berikutnya, dan kesalahan akhir yang dibersihkan. Filter berdasarkan jenis/status dan gunakan pengurutan,
kontrol kolom, dan penomoran halaman.

Buka pengiriman untuk subjeknya, pemohon saat ada, saluran, status, dan stempel waktu per upaya, label perangkat, dan
kesalahan. Rahasia, tujuan transportasi mentah, dan kredensial penyedia tidak pernah dikembalikan. Pengiriman melalui
browser dapat berisi upaya untuk perangkat berlangganan yang terpisah.

<a id="interpret-outcomes"></a>

## Tafsirkan hasil

Waktu tertunda/coba lagi menggambarkan pekerjaan pengiriman yang tahan lama, bukan antrean alur kerja penyedia. Upaya
yang berhasil mengonfirmasi bahwa angkutan telah menerima pengiriman; kegagalan memerlukan penyelidikan konfigurasi
saluran dan layanan tujuan. Tidak ada tindakan jalankan ulang, batalkan, atau coba lagi secara manual dalam tampilan
riwayat ini. Perbaiki [saluran](/docs/v1.0/notifications) dan gunakan tindakan pengujiannya untuk memverifikasi
konfigurasi.

Tabel kosong dapat mencerminkan filter atau tidak ada pengiriman yang ditahan. Permintaan daftar/detail yang gagal
ditampilkan secara terpisah; coba lagi setelah pemulihan. Sinkronisasi awal mungkin sengaja tidak menghasilkan
pengiriman siklus hidup. Tautan eksternal subjek membuka konteks penyedia tanpa memberikan akses tulis Repovio.
