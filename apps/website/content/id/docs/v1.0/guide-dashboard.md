---
title: 'Dasbor'
description: 'Baca kesehatan alur kerja saat ini, ringkasan pekerjaan, dan bagan historis.'
---

> Cuplikan sumber yang diarsipkan. Label produk menggunakan Repovio. Gunakan pengidentifikasi konfigurasi dan referensi
> kontainer dari file penerapan yang diberi tag pada rilis ini tanpa perubahan.

<a id="scope-and-date-range"></a>

## Cakupan dan rentang tanggal

Setiap kartu dan bagan hanya menggunakan repositori yang dapat dibaca oleh pengguna yang masuk. Pilih **7 hari
terakhir**,**30 hari terakhir**, atau**90 hari terakhir** untuk statistik historis. Rentang waktu mengubah total
penyelesaian, tren keberhasilan/kesalahan, durasi, dan distribusi status. Jumlah antrean dan item pekerjaan saat ini
tetap merupakan ringkasan kondisi saat ini. Pilih**Segarkan** untuk memuat ulang dasbor; kontrol tetap sibuk sampai
permintaannya diselesaikan.

<a id="summary-and-navigation"></a>

## Ringkasan dan navigasi

Ringkasan alur kerja berisi tingkat keberhasilan/jumlah selesai, jumlah antrian aktif/berjalan, median durasi selesai,
kegagalan saat ini, jumlah menunggu-persetujuan, dan total waktu proses. Ikuti kegagalan saat ini ke
[Perlu perhatian](/docs/v1.0/needs-attention), atau menunggu persetujuan ke
[Menunggu persetujuan](/docs/v1.0/awaiting-approval). Ringkasan masalah dan permintaan tarik tertaut ke daftar
terfilternya sendiri. Manajer dan administrator juga melihat ringkasan peringatan keamanan untuk repositori yang mereka
kelola.

Kartu yang berjalan aktif membuka filter `preset=active` yang dapat dilepas; kartu item kerja saat ini juga membuka
preset yang dapat dilepas. Perubahan filter manual melepaskan preset.

Grafik tren membandingkan proses yang berhasil dan gagal dari waktu ke waktu. Kelompok distribusi status keadaan yang
dinormalisasi. **Pengoperasian terbaru** menampilkan aktivitas alur kerja terkini dengan tautan ke penyedia. Ini bukan
penampil log penyedia yang tertanam. Repovio tidak dapat menyetujui atau menjalankan kembali alur kerja dari widget
dasbor mana pun.

<a id="empty-and-partial-results"></a>

## Hasil kosong dan parsial

Tidak ada proses yang selesai dalam periode yang dipilih yang menghasilkan grafik kosong. Nol kegagalan saat ini berbeda
dengan koneksi penyedia yang hilang. Jika permintaan gagal, spanduk kesalahan mengidentifikasi muatan sebagian sementara
bagian yang tersedia tetap terlihat. Refresh setelah pemulihan, atau periksa [Tugas sinkronisasi](/docs/v1.0/guide-jobs)
dan sinkronisasi terakhir repositori.
