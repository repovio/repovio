---
title: 'Masuk'
description: 'Gunakan kredensial lokal atau OpenID Connect dan akhiri sesi dengan aman.'
---

<a id="local-sign-in"></a>

## Masuk lokal

Buka `/auth/signin`, masukkan nama pengguna dan kata sandi lokal, lalu pilih **Masuk**. Tunggu hingga autentikasi
selesai. Kredensial yang ditolak meninggalkan Anda di formulir; verifikasi nama pengguna dan tanyakan kepada operator
penerapan tentang [pemulihan kata sandi](/docs/next/authentication#reset-a-forgotten-password). Repovio tidak memiliki
alur pengaturan ulang kata sandi email.

Instalasi baru akan membuka [Penyiapan yang dijalankan pertama kali](/docs/next/setup). Setelah diautentikasi, navigasi
dan hasilnya bergantung pada peran dan keanggotaan repositori Anda. Dasbor kosong bukan berarti login gagal.

<a id="openid-connect"></a>

## Koneksi OpenID

Saat administrator mengaktifkan OIDC, gunakan tombol masuk penyedia tambahan. Selesaikan autentikasi di halaman penyedia
identitas dan biarkan panggilan balik selesai. Pemetaan grup yang ditolak, transaksi yang kedaluwarsa, atau kegagalan
penyedia akan menghasilkan kesalahan; memulai upaya masuk baru. OIDC tidak pernah menautkan akun lokal yang ada dengan
mencocokkan emailnya.

Login OIDC terpisah dari koneksi penyedia OAuth. Ini mengautentikasi pengguna Repovio; itu tidak menghubungkan
repositori GitHub, GitLab, Forgejo, atau Gitea. Nama dan kata sandi yang dikelola identitas harus diubah di penyedia
identitas.

<a id="sign-out"></a>

## Keluar

Pilih keluar dari menu pengguna. Keluar akan menghapus sesi browser tanpa menghapus repositori, mengubah kredensial
penyedia, atau mengubah sumber daya penyedia. Di perangkat bersama, keluarlah setelah selesai. Jika sesi API berakhir,
masuk lagi sebelum mencoba kembali tindakan yang gagal. Masuk dengan kata sandi lokal tetap tersedia ketika OIDC
diaktifkan.
