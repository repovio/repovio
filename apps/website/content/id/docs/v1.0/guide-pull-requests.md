---
title: 'Permintaan penggabungan'
description: 'Telusuri permintaan tarik tersinkronisasi, filter, dan detail hanya-baca.'
---

> Cuplikan sumber yang diarsipkan. Label produk menggunakan Repovio. Gunakan pengidentifikasi konfigurasi dan referensi
> kontainer dari file penerapan yang diberi tag pada rilis ini tanpa perubahan.

<a id="browse-and-filter"></a>

## Telusuri dan saring

Buka **Ikhtisar → Tarik permintaan**. Daftar, ringkasan, pilihan filter, dan detail menggunakan keanggotaan repositori.
Cari berdasarkan judul atau nomor; filter berdasarkan penyedia, repositori, siklus hidup, penulis, penerima tugas,
status draf, status alur kerja, persyaratan persetujuan, label, dan waktu pembaruan. Batasan tanggal yang diperbarui
bersifat inklusif UTC. Beberapa label yang dipilih harus cocok semuanya. Ubah pengurutan, kolom yang terlihat, dan
penomoran halaman dengan kontrol tabel. Kartu ringkasan menghitung perubahan terbuka, draf, alur kerja yang gagal, dan
persetujuan alur kerja. GitLab menggunakan istilah permintaan penggabungan. Detail memperlihatkan cabang sumber/target,
status draf, siklus hidup, dan status alur kerja agregat. Agregat ini menggunakan proses terbaru untuk setiap alur kerja
tertaut; hasil yang gagal diutamakan daripada hasil yang berjalan, tertunda, dibatalkan, berhasil, dan tidak diketahui.
Persyaratan persetujuan alur kerja bukanlah persetujuan tinjauan kode, persetujuan penggabungan, atau indikator konflik
penggabungan.

<a id="inspect-details"></a>

## Periksa detailnya

Pilih baris untuk membuka halaman detail Repovio. Tinjau identitas, repositori, penulis, penerima tugas, label,
pencapaian, status penyedia, stempel waktu, dan deskripsi penurunan harga yang sudah dibersihkan. Konteks alur kerja
tertaut ditampilkan bila tersedia. HTML yang tersemat dan markup yang tidak aman dihapus. Komentar, reaksi, lampiran,
dan perbedaan kode tidak disinkronkan. Gunakan tautan penyedia untuk mengomentari, menetapkan, memberi label, menutup,
meninjau, menyetujui, atau menggabungkan. Repovio tidak melakukan penulisan apa pun.

<a id="synchronization-and-failures"></a>

## Sinkronisasi dan kegagalan

Webhook yang ditandatangani mengantrekan pembacaan khusus repositori setelah jendela penggabungan 15 detik; Rekonsiliasi
30 menit mencakup kejadian-kejadian yang terlewat. Penyegaran browser memuat ulang data yang disimpan. Jika catatan
tidak ada, hapus filter, periksa pengaktifan dan keanggotaan repositori, dan periksa
[Tugas sinkronisasi](/docs/v1.0/guide-jobs). Retensi dapat menghapus catatan lama yang sudah ditutup. Halaman detail
yang tidak dapat diakses dapat menunjukkan akses yang dicabut atau catatan yang dihapus; kembali ke daftar. Coba lagi
kegagalan permintaan setelah pemulihan API.
