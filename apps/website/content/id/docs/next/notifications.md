---
title: 'Saluran notifikasi'
description: 'Buat tujuan notifikasi global, berlangganan acara, dan uji pengiriman.'
---

<a id="access-and-channel-list"></a>

## Akses dan daftar saluran

Buka **Operasi → Notifikasi → Saluran**. Saluran adalah konfigurasi global Repovio, bukan konfigurasi manajer milik
repositori. Administrator sistem membuat, mengedit, menguji, mengaktifkan/menonaktifkan, dan menghapus saluran. Status
pengelola repositori tidak memberikan administrasi saluran. Tabel ini memperlihatkan nama, jenis, metadata tujuan aman,
peristiwa yang dilanggani, status yang diaktifkan, dan waktu yang diperbarui; gunakan filter jenis/diaktifkan,
pengurutan, kontrol kolom, dan penomoran halaman.

<a id="create-a-destination"></a>

## Buat tujuan

Dialog pembuatan dan penyuntingan memiliki empat langkah: **Nama dan jenis**, **Tujuan**, **Peristiwa**, dan **Pratinjau dan tinjauan**.
Tetapkan nama, jenis, dan status aktif, atur tujuan, pilih langganan peristiwa dan filter, lalu tinjau ringkasan serta
pratinjau workflow opsional sebelum menyimpan. Kembali/Berikutnya mempertahankan draf. Kredensial tujuan disembunyikan
dalam ringkasan.

Pilih **Tambahkan saluran**, masukkan nama, pilih jenis, dan konfigurasikan tujuan:

- **Email:** Host/port SMTP, keamanan transportasi, pengirim, autentikasi opsional, dan penerima.
- **Gotify:** URL server, token aplikasi, dan prioritas.
- **ntfy:** server, topik, autentikasi/token opsional, dan prioritas.
- **Discord:** tujuan webhook.
- **URL Apprise Khusus:** URL layanan Apprise yang didukung.
- **Notifikasi push browser:** pengguna penerima; setiap penerima harus mengaktifkan
  [perangkat mereka](/docs/next/browser-push).

Konfigurasikan [langganan dan pratinjau acara](/docs/next/notification-rules) dalam dialog yang sama. Simpan dan tunggu
permintaan sebelum ditutup. Kegagalan validasi atau penyimpanan membuat formulir tersedia untuk koreksi.

<a id="edit-test-and-remove"></a>

## Edit, uji, dan hapus

Tujuannya dienkripsi saat istirahat. Anda dapat menyimpannya, tetapi Anda tidak dapat membacanya kembali. Pengeditan
akan mempertahankan kredensial yang disimpan kecuali **Ganti konfigurasi tujuan** dipilih. Jenis saluran tidak dapat
diubah; buat saluran baru sebagai gantinya. Saluran yang dimigrasikan yang ditandai**Memerlukan konfigurasi ulang**
tidak dapat diaktifkan kembali sampai tujuannya diganti. Saluran browser-push menggunakan langganan pengguna dan menolak
rahasia tujuan transportasi.

Gunakan tindakan pengujian baris untuk mengirim pemberitahuan nyata ke tujuan yang dikonfigurasi; itu tidak mengubah
data penyedia. Tinjau hasilnya di [Riwayat pengiriman](/docs/next/notification-history). Nonaktifkan saluran untuk
menjeda pengiriman, atau hapus saluran saat tidak diperlukan lagi. Penghapusan segera dijalankan. Jangan pernah
menempelkan kredensial ke tangkapan layar atau laporan dukungan.

Email, Gotify, ntfy, Discord, dan tujuan khusus menggunakan Apprise CLI yang dibundel API; server Apprise terpisah tidak
diperlukan. Jika permintaan gagal, coba lagi setelah pemulihan API. Daftar kosong berarti tidak ada saluran
terkonfigurasi yang terlihat cocok dengan filter; hapus filter atau buat saluran. Detail kegagalan pengiriman hanya
berisi kesalahan yang telah disanitasi.
