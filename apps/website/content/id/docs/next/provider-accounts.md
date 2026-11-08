---
title: 'Akun penyedia'
description: 'Hubungkan dan kelola kredensial penyedia terenkripsi dan hanya-baca.'
---

Petunjuk PAT/OAuth di halaman ini menggunakan webhook per repositori. Koneksi GitHub App memakai satu webhook pusat dan
diatur melalui dialog aplikasi.

<a id="access-and-list"></a>

## Akses dan daftar

Administrator sistem membuka **Administrasi → Akun penyedia**. Tabel menunjukkan nama, jenis penyedia, URL dasar, status
yang diaktifkan, dan sinkronisasi terakhir. Filter berdasarkan jenis/diaktifkan, urutkan, ubah kolom, dan buat nomor
halaman. Peran lain tidak mengelola akun penyedia. Token dan rahasia OAuth tidak pernah dikembalikan dalam data daftar.

<a id="connect-a-provider"></a>

## Hubungkan penyedia

Pilih **Tambahkan penyedia** dan pilih GitHub, GitLab, Forgejo, atau Gitea. Masukkan nama yang dapat dikenali dan URL
basis instance yang benar; Gitea memerlukannya. Pilih dari metode autentikasi yang dilaporkan API sebagaimana
dikonfigurasi. Tanpa klien OAuth yang cocok, gunakan token akses pribadi.**Verifikasi dan tambahkan penyedia** memeriksa
kredensial PAT sebelum menyimpannya.**Hubungkan penyedia** mengalihkan ke persetujuan penyedia dan kembali dengan
pemberitahuan berhasil atau gagal.

Gunakan hanya cakupan baca di [Penyiapan penyedia OAuth](/docs/next/provider-oauth). Penyedia OAuth menghubungkan data
repositori; itu terpisah dari [OIDC masuk pengguna](/docs/next/authentication). Repovio mengenkripsi kredensial saat
istirahat dan tidak pernah memberikan mutasi sumber daya penyedia, bahkan ketika token upstream dapat mengotorisasi
penulisan.

<a id="maintain-connections"></a>

## Pertahankan koneksi

Mengaktifkan atau menonaktifkan baris untuk mengontrol partisipasi. Tindakan baris yang tertunda memblokir tindakan yang
bertentangan saat permintaan selesai. Menonaktifkan mempertahankan konfigurasi. Penghapusan segera dijalankan;
pertimbangkan data terlacak yang bergantung sebelum memilih tindakan penghapusan. Buat koneksi pengganti jika
kepemilikan atau kredensial penyedia harus berubah melalui alur yang tidak diekspos oleh layar saat ini.

Tambahkan repositori secara terpisah dari [Repositori](/docs/next/repositories); Konfigurasi webhook milik masing-masing
repositori yang dilacak, bukan akun penyedia. Penemuan kosong dapat berarti tidak adanya repositori, instance yang
salah, cakupan baca yang tidak memadai, atau kredensial yang tidak valid. Membedakan kegagalan pemuatan opsi
autentikasi, kesalahan verifikasi, pemberitahuan panggilan balik OAuth, dan kegagalan API; perbaiki penyebabnya sebelum
mencoba lagi. Periksa pekerjaan untuk mengetahui adanya kegagalan sinkronisasi yang sedang berlangsung.

[Pengaturan GitHub App](/docs/next/github-app)

Koneksi GitLab kini mendukung konversi OAuth dan otorisasi ulang tanpa penggantian. Baca
[siklus hidup koneksi GitLab](/docs/next/provider-oauth#gitlab-connection-lifecycle) sebelum mengganti koneksi yang ada;
otorisasi ulang mempertahankan data terlacak dan status aktif.
