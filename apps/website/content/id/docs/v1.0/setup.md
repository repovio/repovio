---
title: 'Penyiapan yang dijalankan pertama kali'
description: 'Buat administrator lokal pertama dan pahami pengaturan satu kali.'
---

> Cuplikan sumber yang diarsipkan. Label produk menggunakan Repovio. Gunakan pengidentifikasi konfigurasi dan referensi
> kontainer dari file penerapan yang diberi tag pada rilis ini tanpa perubahan.

<a id="before-setup"></a>

## Sebelum pengaturan

Terapkan API, aplikasi web, dan PostgreSQL menggunakan [Penyebaran](/docs/v1.0/deployment). Buka URL instalasi. Jika
tidak ada pengguna, Repovio mengarahkan browser ke `/auth/setup`. Penginstalan yang ada mempertahankan akunnya dan
membuka proses masuk. Penyiapan membuat akun Repovio lokal, bukan akun penyedia.

<a id="create-the-administrator"></a>

## Buat administrator

Masukkan nama depan dan belakang opsional, nama pengguna unik, kata sandi, dan konfirmasi kata sandi. Kata sandi
memerlukan setidaknya 12 karakter. Kirimkan formulir pengaturan satu kali dan tunggu permintaannya; tanda pengaturan
berhasil di administrator sistem pertama. Kesalahan validasi membuat formulir tersedia untuk diperbaiki. Jika operator
lain menyelesaikan setup terlebih dahulu, lanjutkan ke [Masuk](/docs/v1.0/sign-in) dengan akun yang sudah ada.

<a id="continue-configuration"></a>

## Lanjutkan konfigurasi

Hubungkan [akun penyedia](/docs/v1.0/provider-accounts), pilih [repositori](/docs/v1.0/repositories), dan periksa
[pekerjaan sinkronisasi](/docs/v1.0/guide-jobs). Pengguna lokal dapat dibuat melalui API yang dilindungi; halaman
Pengguna mencantumkan akun dan mengelola penghapusan dan akses MCP. Atau konfigurasikan
[OIDC](/docs/v1.0/authentication) untuk akun yang dikelola penyedia identitas. Non-administrator baru memerlukan
keanggotaan repositori yang eksplisit.

Jika penyiapan gagal, periksa ketersediaan API/database dan log penerapan tanpa menerbitkan kredensial. Jangan mereset
database untuk mengulangi pengaturan. Lihat [Pemulihan kata sandi](/docs/v1.0/authentication#reset-a-forgotten-password)
untuk administrator lokal yang ada.
