---
title: 'Pengaturan sistem'
description: 'Konfigurasikan kebijakan penyimpanan independen dan format tanggal/waktu default.'
---

<a id="administrator-access"></a>

## Akses administrator

Hanya administrator sistem yang dapat membuka **Pengaturan → Sistem**. Pemuatan menunjukkan kerangka; pemuatan yang
gagal memberikan kesalahan dan coba lagi alih-alih default yang dapat diedit yang disimpulkan dari data yang hilang.
Tunggu permintaan pengaturan sebelum menyimpan perubahan.

<a id="retention-defaults"></a>

## Default retensi

Tetapkan periode retensi default terpisah untuk alur kerja yang berjalan, masalah, dan permintaan penarikan. Setiap
nilai harus berkisar antara 1 hingga 3650 hari. Sebuah repositori dapat mengganti setiap nilai terkait secara
independen; penggantian repositori kosong mengembalikan default sistem itu. Retensi memengaruhi riwayat yang disimpan
secara lokal, bukan catatan sisi penyedia. Memperpendek retensi dapat menghapus data tersimpan lama, jadi periksa
persyaratan pelaporan dan investigasi terlebih dahulu.

Kontrol retensi dan pelacakan repositori didokumentasikan di [Repositori](/docs/next/repositories). Baris riwayat yang
hilang dapat mencerminkan retensi, bukan sinkronisasi penyedia yang gagal.

<a id="datetime-formatting"></a>

## Pemformatan tanggal/waktu

Tetapkan format tanggal/waktu default dan periksa pratinjau langsungnya sebelum menyimpan. Pemilihan lokal masih
mengontrol terjemahan teks antarmuka dan pemformatan sensitif lokal. Simpan sekali; keberhasilan dan validasi/kegagalan
API dilaporkan secara terpisah. Coba lagi setelah koreksi atau pemulihan API. Preferensi pemformatan tidak pernah
mengubah stempel waktu penyedia asli.
