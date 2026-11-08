---
title: 'Repositori'
description: 'Lacak repositori, periksa aktivitas, dan konfigurasikan sinkronisasi dan akses lokal.'
---

> Cuplikan sumber yang diarsipkan. Label produk menggunakan Repovio. Gunakan pengidentifikasi konfigurasi dan referensi
> kontainer dari file penerapan yang diberi tag pada rilis ini tanpa perubahan.

<a id="browse-and-open-details"></a>

## Telusuri dan buka detailnya

Semua pengguna yang masuk dapat membuat daftar repositori yang mungkin mereka baca. Tabel ini memperlihatkan
pemilik/nama, status yang diaktifkan, anggota, jumlah proses yang dipertahankan, retensi, dan sinkronisasi terakhir.
Gunakan pemfilteran, pengurutan, kontrol kolom, dan penomoran halaman yang diaktifkan. Buka tautan penyedia untuk
repositori eksternal, halaman detail untuk aktivitas yang disinkronkan, atau dialog pengaturan untuk konfigurasi.
Keanggotaan yang hilang atau repositori yang dihapus dapat menghasilkan status detail yang tidak dapat diakses.

Halaman detail menggabungkan informasi umum, retensi, sinkronisasi terakhir/usia data, interval yang dikonfigurasi,
pekerjaan saat ini, dan alur kerja terkini, masalah, dan permintaan penarikan. Manajer dengan akses manajemen repositori
dan administrator juga melihat aktivitas peringatan keamanan. Pekerjaan yang tertunda/berjalan menunjukkan kemajuan;
peringatan dan kegagalan termasuk kesalahan aman yang dikategorikan.

<a id="add-and-maintain-tracking"></a>

## Tambahkan dan pertahankan pelacakan

Hanya administrator sistem yang menambahkan repositori. Pilih akun penyedia yang diaktifkan, tunggu penemuan, dan pilih
satu atau beberapa repositori yang tidak terlacak. Repositori yang sudah dilacak tidak termasuk. Jika bagian dari
multi-tambah gagal, pilihan yang berhasil tetap ditambahkan dan hanya pilihan yang gagal yang tersisa untuk dicoba lagi.
Daftar penyedia yang kosong memerlukan koneksi [akun penyedia](/docs/v1.0/provider-accounts) yang diaktifkan terlebih
dahulu.

Administrator dapat mengaktifkan/menonaktifkan pelacakan, **Segarkan data penyedia**, dan mengantri sinkronisasi
hanya-baca. Identitas repositori menggunakan akun penyedia dan ID repositori penyedia stabil. Ganti nama/transfer
melestarikan riwayat, filter, keanggotaan, dan saluran; penyegaran metadata menolak ID yang berbeda di jalur lama
daripada menugaskannya kembali. Repositori yang dinonaktifkan mempertahankan data yang disimpan tetapi berhenti
berpartisipasi dalam sinkronisasi.

<a id="retention-filters-and-memberships"></a>

## Retensi, filter, dan keanggotaan

Administrator menetapkan penggantian retensi alur kerja, masalah, dan permintaan penarikan yang terpisah, masing-masing
dari 1 hingga 3650 hari. Nilai kosong mengembalikan [bawaan sistem](/docs/v1.0/settings-system) yang sesuai. Filter alur
kerja menerima pola glob **ALLOW** dan**DENY**; penolakan diutamakan. Tambahkan pola yang tidak kosong atau hapus pola
yang sudah ada. Filter yang membatasi dapat menjelaskan tidak adanya proses.

Dalam keanggotaan, tambahkan pengguna non-administrator sebagai Viewer atau Manager, ubah peran repositori mereka, atau
hapus akses. Administrator dikecualikan dari pemilihan anggota karena mereka telah memiliki akses tidak terbatas.
Manajer global masih memerlukan keanggotaan Manajer untuk kemampuan manajemen repositori seperti peringatan keamanan.

<a id="webhooks-and-failures"></a>

## Webhook dan kegagalan

Kartu webhook repositori menunjukkan URL panggilan balik, status yang dikonfigurasi, instruksi penyedia, dan pengiriman
terakhir. Itu dapat menghasilkan/menyalin rahasia, menyimpan konfigurasi, memutar dengan konfirmasi eksplisit, atau
menghapus konfigurasi. URL publik yang hilang harus diperbaiki sebelum pendaftaran penyedia. Rahasia hanya ditampilkan
selama konfigurasi; simpan di manajer rahasia. Ikuti [Webhook repositori](/docs/v1.0/provider-webhooks) untuk pengaturan
dan verifikasi.

Pemirsa dan pengelola menerima ringkasan pengaturan repositori hanya-baca. Coba lagi memuat/menyimpan kesalahan setelah
pemulihan; periksa [Tugas sinkronisasi](/docs/v1.0/guide-jobs) untuk akses penyedia, batas kecepatan, atau kegagalan
sinkronisasi.
