---
title: 'Masalah'
description: 'Telusuri masalah yang disinkronkan, filter, dan detail hanya-baca.'
---

> Cuplikan sumber yang diarsipkan. Label produk menggunakan Repovio. Gunakan pengidentifikasi konfigurasi dan referensi
> kontainer dari file penerapan yang diberi tag pada rilis ini tanpa perubahan.

<a id="browse-and-filter"></a>

## Telusuri dan saring

Buka **Ikhtisar → Masalah**. Daftar, ringkasan, pilihan filter, dan detail menggunakan keanggotaan repositori. Cari
berdasarkan judul atau nomor; filter berdasarkan penyedia, repositori, siklus hidup, penulis, penerima tugas,
pencapaian, label, dan waktu pembaruan jika tersedia. Batasan tanggal yang diperbarui bersifat inklusif UTC. Beberapa
label yang dipilih harus cocok semuanya. Ubah pengurutan, kolom yang terlihat, dan penomoran halaman dengan kontrol
tabel. Kartu ringkasan menghitung masalah terbuka, baru diperbarui, ditetapkan, dan basi. Sinkronisasi awal membaca
setiap terbitan terbuka dan terbitan tertutup yang diperbarui dalam 90 hari sebelumnya. Staleness membantu menemukan
pekerjaan terbuka tanpa pengawasan; itu tidak mengubah status penyedia.

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
