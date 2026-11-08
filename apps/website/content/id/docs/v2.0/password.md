---
title: 'Kata sandi'
description: 'Ubah kata sandi lokal dan pahami pembatalan dan pemulihan sesi.'
---

<a id="change-a-password"></a>

## Ubah kata sandi

Untuk akun lokal buka **Pengaturan → Umum → Ubah kata sandi**. Masukkan kata sandi saat ini, kata sandi baru yang
terdiri dari 12 hingga 256 karakter, dan konfirmasi yang cocok. Kirim satu kali dan tunggu sampai selesai. Kata sandi
saat ini yang tidak valid, kata sandi yang pendek, atau konfirmasi yang tidak cocok harus diperbaiki sebelum mencoba
lagi.

Perubahan yang berhasil akan mengembalikan token pengganti untuk browser saat ini dan membatalkan sesi akun lainnya yang
sudah ada. Perangkat lain harus masuk lagi dengan kata sandi baru. Ini hanya mengubah akun Repovio, bukan PAT penyedia,
kredensial OAuth, kredensial notifikasi, atau konfigurasi token MCP.

<a id="oidc-and-forgotten-passwords"></a>

## OIDC dan lupa kata sandi

Akun yang dikelola OIDC tidak memiliki formulir kata sandi lokal. Ubah kata sandi penyedia identitas di penyedia itu.
Repovio sengaja tidak memiliki alur reset berbasis email. Operator penerapan dapat menggunakan
[perintah pemulihan lokal](/docs/v2.0/authentication#reset-a-forgotten-password) yang terdokumentasi; itu menolak akun
OIDC dan membatalkan sesi yang ada. Jangan pernah memasukkan kata sandi pengganti ke dalam riwayat shell atau laporan
masalah.

<a id="local-user-and-group-management"></a>

## Membuat dan mereset akun lokal

Aksi Reset sandi pada baris akun lokal memungkinkan administrator mengganti sandi tanpa sandi lama. Isi sandi baru dan
konfirmasi. Sesi JWT lama tidak berlaku; mereset akun sendiri mengeluarkan Anda. Akun OIDC tidak memiliki aksi ini.
Token MCP tidak dicabut.

[Grup akses lokal](/docs/v2.0/users#local-access-groups)
