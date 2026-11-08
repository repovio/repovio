---
title: 'Pengguna'
description: 'Tinjau pengguna lokal dan yang dikelola identitas, peran, penghapusan, dan administrasi token MCP.'
---

> Cuplikan sumber yang diarsipkan. Label produk menggunakan Repovio. Gunakan pengidentifikasi konfigurasi dan referensi
> kontainer dari file penerapan yang diberi tag pada rilis ini tanpa perubahan.

<a id="review-accounts"></a>

## Tinjau akun

Administrator sistem membuka **Administrasi → Pengguna**. Tabel menunjukkan nama pengguna, avatar/nama tampilan, peran,
asal lokal/OIDC, dan stempel waktu yang dibuat/diperbarui. Filter berdasarkan peran, urutkan, ubah kolom, atau penomoran
halaman. Akses repositori untuk Viewer atau Manager memerlukan [keanggotaan repositori](/docs/v1.0/repositories)
terpisah; kelompok penyedia identitas tidak membuat keanggotaan tersebut.

<a id="provisioning-and-deletion"></a>

## Penyediaan dan penghapusan

Halaman Pengguna tidak memiliki formulir buat-pengguna atau edit-pengguna. Pengguna lokal tambahan dibuat melalui API
pengguna yang dilindungi khusus administrator menggunakan nama pengguna, kata sandi, dan peran. Pengguna OIDC disediakan
melalui login identitas yang dikonfigurasi. Lihat [Otentikasi](/docs/v1.0/authentication) untuk pemetaan dan pemisahan
akun. Jangan menyimpulkan tindakan edit pengguna dari keberadaan profil yang dapat diedit di halaman Pengaturan Anda
sendiri.

Tindakan penghapusan tersedia untuk pengguna lain dan segera dijalankan; tinjau akun sebelum memilihnya. Anda tidak
dapat menghapus akun Anda sendiri melalui API atau layar ini. Menghapus pengguna Repovio akan menghapus akses lokal; itu
tidak menghapus akun penyedia apa pun di GitHub, GitLab, Forgejo, atau Gitea. Tinjau akses pengguna yang terpengaruh
sebelum menghapus.

<a id="user-mcp-tokens"></a>

## Pengguna token MCP

Buka dialog token MCP pengguna untuk mencantumkan metadata token atau mencabut token dengan konfirmasi. Administrator
tidak dapat mengambil nilai token teks biasa atau membuat token pengguna lain melalui dialog ini. Pengguna membuat token
mereka sendiri di [Pengaturan MCP](/docs/v1.0/mcp). Daftar kosong dan kesalahan pemuatan berbeda; coba lagi setelah
pemulihan API. Jangan pernah menyalin nilai token ke dalam laporan dukungan atau tangkapan layar.

<a id="local-user-api"></a>

## Penyediaan pengguna lokal melalui API

Gunakan klien API melalui HTTPS untuk mengirim `POST /api/v1/users` dengan autentikasi pembawa administrator dan
`Content-Type: application/json`. Sediakan badan permintaan ini, gantikan placeholder di masukan klien yang dilindungi:

```json
{
  "username": "new-user",
  "password": "REPLACE_WITH_A_PASSWORD_OF_AT_LEAST_12_CHARACTERS",
  "role": "VIEWER"
}
```

Peran yang valid adalah `VIEWER`, `MANAGER`, dan `SYSTEM_ADMIN`. Tetapkan hanya peran yang diperlukan, lalu berikan
keanggotaan repositori secara terpisah. Responsnya berisi metadata pengguna yang aman, bukan kata sandi atau hashnya.
Nama pengguna duplikat atau permintaan yang tidak valid harus diperbaiki sebelum mencoba lagi. Jangan menyimpan kata
sandi atau token pembawa dalam file yang dilacak, riwayat shell, tangkapan layar, atau laporan masalah.
