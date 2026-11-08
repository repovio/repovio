---
title: 'Perlu perhatian'
description: 'Selidiki konteks alur kerja yang proses terbarunya gagal.'
---

> Cuplikan sumber yang diarsipkan. Label produk menggunakan Repovio. Gunakan pengidentifikasi konfigurasi dan referensi
> kontainer dari file penerapan yang diberi tag pada rilis ini tanpa perubahan.

<a id="current-failures"></a>

## Kegagalan saat ini

Buka **Alur kerja berjalan → Perlu perhatian**. Tidak seperti proses gagal historis, antrean ini mempertahankan konteks
alur kerja yang dapat ditindaklanjuti yang proses terbarunya gagal. Proses baru yang berhasil, perubahan terkait yang
ditutup, atau perubahan gabungan akan menghapus konteks setelah sinkronisasi. Proses dengan cakupan cabang yang lebih
lama dapat dikaitkan dengan permintaan penarikan/penggabungan yang aktif saat dimulai. Lencana sidebar menggunakan
antrean dengan cakupan izin yang sama.

Cari dan gunakan kontrol tabel yang tersedia untuk mempersempit konteks alur kerja/repositori. Buka tautan eksekusi
eksternal untuk log dan remediasi. Buka perubahan terkait saat ada. Repovio tidak pernah menjalankan ulang, membatalkan,
mengedit, atau mengirimkan alur kerja.

<a id="diagnose-missing-or-stale-entries"></a>

## Diagnosis entri yang hilang atau basi

Hasil yang kosong dapat diperbaiki setelah penggantian berhasil dijalankan. Untuk kegagalan yang lebih lama gunakan
[Semua eksekusi](/docs/v1.0/workflow-runs). Hapus filter dan periksa keanggotaan repositori sebelum memperlakukan
konteks yang tidak ada sebagai data yang hilang. Tindakan penyedia diamati secara asinkron; periksa
[Tugas sinkronisasi](/docs/v1.0/guide-jobs) jika status tetap basi. Kesalahan pemuatan dan permintaan terpisah dari
antrian kosong; coba lagi setelah pemulihan API.
