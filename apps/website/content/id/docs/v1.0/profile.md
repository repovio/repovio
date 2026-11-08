---
title: 'Profil'
description: 'Ubah nama akun lokal dan nama pengguna dengan verifikasi kata sandi saat ini.'
---

> Cuplikan sumber yang diarsipkan. Label produk menggunakan Repovio. Gunakan pengidentifikasi konfigurasi dan referensi
> kontainer dari file penerapan yang diberi tag pada rilis ini tanpa perubahan.

<a id="edit-a-local-profile"></a>

## Edit profil lokal

Buka **Pengaturan → Umum**. Pengguna lokal dapat memperbarui nama depan/belakang opsional dan nama pengguna login
mereka. Nama pribadi digunakan sebagai identitas tampilan pilihan; nama pengguna tetap tersedia untuk identifikasi yang
jelas. Kolom memiliki panjang maksimum 255 karakter dan nama pengguna tidak boleh kosong.

Mengubah nama pengguna memerlukan kata sandi saat ini. Masukkan di formulir profil dan pilih simpan. Nama saja tidak
memerlukan perubahan nama pengguna. Tunggu permintaannya; berhasil menyimpan pembaruan akun saat ini. Nama pengguna
duplikat dan kata sandi saat ini yang salah menghasilkan kesalahan validasi yang berbeda. Perbaiki bidang yang
terpengaruh dan coba lagi.

<a id="identity-managed-accounts"></a>

## Akun yang dikelola identitas

Pengguna OIDC tidak dapat mengubah nama pengguna atau nama profil mereka secara lokal. Repovio menyinkronkan nama dari
klaim identitas terverifikasi saat login berhasil. Ubah di penyedia identitas dan masuk lagi. Avatar tetap dapat diedit
secara terpisah di [Pengaturan avatar](/docs/v1.0/avatar). Jika permintaan profil gagal, coba lagi setelah pemulihan
API; jangan mengirimkan kata sandi melalui saluran dukungan.
