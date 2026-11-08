---
title: 'Avatar'
description: 'Unggah, impor, potong, atau hapus gambar profil Anda.'
---

> Cuplikan sumber yang diarsipkan. Label produk menggunakan Repovio. Gunakan pengidentifikasi konfigurasi dan referensi
> kontainer dari file penerapan yang diberi tag pada rilis ini tanpa perubahan.

<a id="choose-an-image"></a>

## Pilih gambar

Setiap pengguna yang masuk, termasuk pengguna OIDC, dapat membuka **Pengaturan → Umum** dan mengunggah JPEG, PNG, atau
WebP hingga 2 MiB. Alternatifnya, impor gambar dari URL HTTPS publik. Gambar non-persegi membuka dialog pemotongan;
pilih potongan persegi dan konfirmasi sebelum mengunggah. Membatalkan dialog membuat avatar saat ini tidak berubah.

Repovio menghapus metadata gambar, merender WebP 256 × 256, dan hanya menyimpan gambar yang dinormalisasi tersebut di
PostgreSQL. Itu tidak mempertahankan gambar asli atau URL jarak jauh. Jenis yang tidak valid, gambar yang terlalu besar,
kegagalan impor, kegagalan dekode, dan kegagalan pengunggahan dilaporkan secara terpisah; pilih gambar yang didukung
atau coba lagi setelah memperbaiki sumber/konektivitas.

<a id="remove-and-display"></a>

## Hapus dan tampilkan

Gunakan tindakan hapus untuk menghapus gambar saat ini. Penghapusan yang gagal membuat avatar yang ada tersedia untuk
dicoba lagi. Tanpa gambar, antarmuka menampilkan inisial berdasarkan nama pribadi atau nama pengguna. Grup avatar
anggota repositori menampilkan paling banyak lima anggota dan merangkum anggota tambahan. Visibilitas Avatar mengikuti
izin sumber daya yang memuatnya. Mengubah avatar Repovio tidak memperbarui gambar profil penyedia Anda.
