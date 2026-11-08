---
title: 'Saluran notifikasi'
description: 'Buat tujuan notifikasi global, berlangganan acara, dan uji pengiriman.'
---

> Cuplikan sumber yang diarsipkan. Label produk menggunakan Repovio. Gunakan pengidentifikasi konfigurasi dan referensi
> kontainer dari file penerapan yang diberi tag pada rilis ini tanpa perubahan.

<a id="access-and-channel-list"></a>

## Akses dan daftar saluran

Buka **Operasi → Notifikasi → Saluran**. Saluran adalah konfigurasi global Repovio, bukan konfigurasi manajer milik
repositori. Administrator sistem membuat, mengedit, menguji, mengaktifkan/menonaktifkan, dan menghapus saluran. Status
pengelola repositori tidak memberikan administrasi saluran. Tabel ini memperlihatkan nama, jenis, metadata tujuan aman,
peristiwa yang dilanggani, status yang diaktifkan, dan waktu yang diperbarui; gunakan filter jenis/diaktifkan,
pengurutan, kontrol kolom, dan penomoran halaman.

<a id="create-a-destination"></a>

## Buat tujuan

Pilih **Tambahkan saluran**, masukkan nama, pilih jenis, dan konfigurasikan tujuan:

- **Email:** Host/port SMTP, keamanan transportasi, pengirim, autentikasi opsional, dan penerima.
- **Gotify:** URL server, token aplikasi, dan prioritas.
- **ntfy:** server, topik, autentikasi/token opsional, dan prioritas.
- **Discord:** tujuan webhook.
- **URL Apprise Khusus:** URL layanan Apprise yang didukung.
- **Notifikasi push browser:** pengguna penerima; setiap penerima harus mengaktifkan
  [perangkat mereka](/docs/v1.0/browser-push).

Konfigurasikan [langganan dan pratinjau acara](/docs/v1.0/notification-rules) dalam dialog yang sama. Simpan dan tunggu
permintaan sebelum ditutup. Kegagalan validasi atau penyimpanan membuat formulir tersedia untuk koreksi.

<a id="edit-test-and-remove"></a>

## Edit, uji, dan hapus

Tujuannya dienkripsi saat istirahat. Anda dapat menyimpannya, tetapi Anda tidak dapat membacanya kembali. Pengeditan
akan mempertahankan kredensial yang disimpan kecuali **Ganti konfigurasi tujuan** dipilih. Jenis saluran tidak dapat
diubah; buat saluran baru sebagai gantinya. Saluran yang dimigrasikan yang ditandai**Memerlukan konfigurasi ulang**
tidak dapat diaktifkan kembali sampai tujuannya diganti. Saluran browser-push menggunakan langganan pengguna dan menolak
rahasia tujuan transportasi.

Gunakan tindakan pengujian baris untuk mengirim pemberitahuan nyata ke tujuan yang dikonfigurasi; itu tidak mengubah
data penyedia. Tinjau hasilnya di [Riwayat pengiriman](/docs/v1.0/notification-history). Nonaktifkan saluran untuk
menjeda pengiriman, atau hapus saluran saat tidak diperlukan lagi. Penghapusan segera dijalankan. Jangan pernah
menempelkan kredensial ke tangkapan layar atau laporan dukungan.

Email, Gotify, ntfy, Discord, dan tujuan khusus menggunakan Apprise CLI yang dibundel API; server Apprise terpisah tidak
diperlukan. Jika permintaan gagal, coba lagi setelah pemulihan API. Daftar kosong berarti tidak ada saluran
terkonfigurasi yang terlihat cocok dengan filter; hapus filter atau buat saluran. Detail kegagalan pengiriman hanya
berisi kesalahan yang telah disanitasi.
