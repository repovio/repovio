---
title: 'Pekerjaan sinkronisasi repositori'
description: 'Pantau dan mulai pekerjaan sinkronisasi repositori Repovio secara manual.'
---

Buka **Pekerjaan** di bagian**Operasi** untuk memeriksa pekerjaan sinkronisasi untuk setiap repositori aktif yang dapat
Anda akses. Ringkasan menunjukkan pekerjaan yang sedang berjalan, menunggu, gagal, dan menganggur. Tabel ini
mengidentifikasi repositori, penyedia, domain tersinkronisasi, fase saat ini, kemajuan item, upaya, dan pesan kesalahan
aman terbaru.

<a id="read-job-state"></a>

## Baca status pekerjaan

- **Idle** berarti tidak ada sinkronisasi yang dimasukkan ke dalam antrean atau berjalan untuk repositori.
- **Tertunda** berarti permintaan tahan lama sedang menunggu waktu yang dijadwalkan atau pekerja yang tersedia.
- **Berjalan** menunjukkan fase aktif dan kemajuan item ketika penyedia melaporkan total yang terukur.
- **Gagal** menyimpan ringkasan kesalahan yang aman dan jumlah upaya hingga repositori dimasukkan ke dalam antrean lagi.
- **Peringatan** berarti cakupan lain diselesaikan sementara satu atau lebih jenis peringatan keamanan tidak tersedia.

Kolom cakupan mengidentifikasi apakah pekerjaan membaca alur kerja, masalah, permintaan penarikan, peringatan keamanan,
atau kombinasi keduanya. Waktu tunggu dapat mencerminkan penggabungan webhook, percobaan ulang, atau instruksi batas
tarif penyedia; menyegarkan halaman berulang kali tidak memajukan waktu yang dijadwalkan.

<a id="start-or-retry-synchronization"></a>

## Mulai atau coba lagi sinkronisasi

Administrator sistem dapat memulai setiap pekerjaan yang sedang menganggur, gagal, atau peringatan dengan **Jalankan
semua**, atau gunakan**Jalankan** atau**Coba lagi** pada satu baris repositori. Pekerjaan yang sudah tertunda atau
sedang berjalan tidak diantri lagi. Tombol memulai tetap dalam status memuat hingga permintaan selesai; lalu ikuti baris
saat bergerak melalui pending, running, dan idle atau failed.

Pekerjaan manual menggunakan antrean sinkronisasi penyedia read-only yang tahan lama dan sama seperti rekonsiliasi
terjadwal dan webhook terverifikasi. Mereka mengambil data penyedia tetapi tidak dapat mengubah repositori, alur kerja,
masalah, atau permintaan penarikan.

Tugas yang berhasil akan dikembalikan ke **Idle** dan tidak disimpan sebagai riwayat eksekusi. Pekerjaan yang gagal
tetap terlihat hingga webhook berikutnya, siklus rekonsiliasi, atau percobaan ulang manual mengantrikannya lagi. Jika
percobaan ulang terus gagal, verifikasi akun penyedia, baca cakupan, URL dasar, dan status batas kecepatan di
[Administrasi dan pengaturan](/docs/next/provider-accounts) sebelum mencoba lagi.

<a id="refresh-and-table-controls"></a>

## Segarkan dan kontrol tabel

Pekerjaan disegarkan secara otomatis setiap lima detik. Tabel defaultnya adalah sepuluh baris per halaman dan mengingat
ukuran halaman. Jalankan semua termasuk pekerjaan menganggur, gagal, dan peringatan; baris yang tertunda/berjalan tidak
dapat diantrekan lagi. Kegagalan pemuatan awal dan latar belakang ditampilkan secara terpisah dari kegagalan pekerjaan.
Penyortiran dan penomoran halaman membantu memeriksa instalasi yang lebih besar.
