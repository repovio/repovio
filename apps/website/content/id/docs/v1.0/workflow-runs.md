---
title: 'Semua eksekusi'
description: 'Cari, filter, dan periksa riwayat alur kerja yang disimpan tanpa mengubah sumber daya penyedia.'
---

> Cuplikan sumber yang diarsipkan. Label produk menggunakan Repovio. Gunakan pengidentifikasi konfigurasi dan referensi
> kontainer dari file penerapan yang diberi tag pada rilis ini tanpa perubahan.

<a id="browse-retained-runs"></a>

## Jelajahi proses yang dipertahankan

Buka **Ikhtisar → Alur kerja berjalan → Semua berjalan**. Hasil dibatasi pada repositori yang dapat diakses dan riwayat
yang disimpan. Gunakan filter repositori, penyedia, status, dan durasi (durasi dimasukkan dalam hitungan detik). Semua
proses tidak memiliki kotak pencarian teks; Perlu perhatian, tambahkan pencarian dan detail kolom yang dibuat/dimulai.
Urutkan kolom, ubah kolom yang terlihat, dan beri nomor halaman pada hasilnya. Hapus filter jika proses yang diharapkan
tidak ada.

Baris mengidentifikasi alur kerja dan repositori, penyedia, status yang dinormalisasi, stempel waktu penyedia, dan
durasi saat disediakan. Proses yang antri atau belum selesai mungkin kekurangan waktu penyelesaian atau durasi akhir.
Status yang dinormalisasi adalah `queued`, `running`, `success`, `failed`, `cancelled`, `skipped`, dan `unknown`.
Keadaan yang tidak diketahui harus diperiksa di penyedia.

<a id="open-a-run"></a>

## Buka proses

Gunakan tindakan baris eksternal untuk membuka proses penyedia dan lognya. Repovio tidak menyediakan layar proses
terpisah yang dapat diedit, artefak penyedia pengunduhan, atau sinkronisasi log lengkap. Setujui, jalankan kembali,
batalkan, atau kirim hanya di penyedia dengan akun penyedia Anda. Untuk kegagalan saat ini gunakan
[Perlu perhatian](/docs/v1.0/needs-attention); untuk gerbang gunakan
[Menunggu persetujuan](/docs/v1.0/awaiting-approval).

<a id="missing-or-stale-history"></a>

## Riwayat hilang atau basi

Tabel kosong berarti tidak ada rekaman tersimpan yang cocok dengan filter dan izin Anda. Retensi dapat menghapus proses
lama. Periksa pengaktifan repositori, keanggotaan, pola izin/penolakan alur kerja, dan
[Tugas sinkronisasi](/docs/v1.0/guide-jobs). Penyegaran halaman memuat ulang data yang disimpan; itu tidak melewati
antrian sinkronisasi yang tahan lama. Coba lagi memuat kesalahan setelah pemulihan API.
