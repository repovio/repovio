---
title: 'Penyiapan penyedia OAuth'
description: 'Daftarkan aplikasi OAuth dan konfigurasikan autentikasi penyedia hanya-baca untuk Repovio.'
---

> Cuplikan sumber yang diarsipkan. Label produk menggunakan Repovio. Gunakan pengidentifikasi konfigurasi dan referensi
> kontainer dari file penerapan yang diberi tag pada rilis ini tanpa perubahan.

Repovio menghubungkan akun penyedia melalui OAuth atau token akses pribadi (PAT). OAuth tersedia ketika setidaknya satu
klien penyedia OAuth dikonfigurasi. Tanpa klien OAuth yang dikonfigurasi, layar akun penyedia hanya menawarkan
otentikasi PAT. Repovio menggunakan kredensial yang dihasilkan hanya untuk API penyedia hanya-baca dan mengenkripsinya
sebelum menulisnya ke PostgreSQL.

<a id="register-oauth-applications"></a>

## Daftarkan aplikasi OAuth

Daftarkan satu aplikasi OAuth untuk setiap instans penyedia yang harus dihubungkan oleh Repovio. Tetapkan URL panggilan
balik yang tepat dari `OAUTH_CALLBACK_URL` di setiap pendaftaran aplikasi. Untuk instalasi lokal defaultnya adalah
`http://localhost:3001/api/v1/provider-accounts/oauth/callback`.

Konfigurasikan ID klien dan rahasia klien di lingkungan API, jangan pernah di aplikasi web atau Git:

```dotenv
OAUTH_CALLBACK_URL=https://repovio.example.com/api/v1/provider-accounts/oauth/callback
GITHUB_OAUTH_CLIENT_ID=...
GITHUB_OAUTH_CLIENT_SECRET=...
GITLAB_OAUTH_BASE_URL=https://gitlab.example.com
GITLAB_OAUTH_CLIENT_ID=...
GITLAB_OAUTH_CLIENT_SECRET=...
FORGEJO_OAUTH_BASE_URL=https://forgejo.example.com
FORGEJO_OAUTH_CLIENT_ID=...
FORGEJO_OAUTH_CLIENT_SECRET=...
```

Konfigurasikan hanya penyedia yang memerlukan instalasi ini. ID klien dan rahasia harus selalu dikonfigurasi sebagai
pasangan. `GITLAB_OAUTH_BASE_URL` mengidentifikasi instans GitLab tunggal untuk aplikasi OAuth yang diinstal. Forgejo
memerlukan URL dasar eksplisit ketika klien OAuth dikonfigurasi.

<a id="read-scopes"></a>

## Baca cakupan

Gunakan cakupan ini saat mendaftarkan aplikasi:

- GitHub: `repo security_events`. Akun OAuth yang ada harus diotorisasi ulang sebelum Repovio dapat membaca peringatan
  keamanan.
- GitLab: `read_api read_user`.

Token akses pribadi GitHub yang terperinci memerlukan akses baca ke peringatan Dependabot, peringatan pemindaian kode,
dan peringatan pemindaian rahasia. Akses peringatan keamanan GitLab juga bergantung pada lisensi instans dan peran
proyek pemilik token; jenis peringatan yang tidak tersedia ditampilkan tanpa menggagalkan cakupan sinkronisasi
repositori lainnya.

- Forgejo: `read:repository`.
- Gitea: konfigurasikan token akses pribadi dengan akses baca di formulir akun penyedia Gitea, termasuk URL basis
  instans. Repovio saat ini tidak menawarkan klien Gitea OAuth bersama karena setiap instans yang dihosting sendiri
  memerlukan pendaftaran aplikasinya sendiri.

Adaptor Repovio hanya mengekspos validasi, penemuan, sinkronisasi alur kerja, dan verifikasi webhook. Mereka tidak
membuat, memperbarui, mengirimkan, menjalankan kembali, membatalkan, atau menghapus sumber daya penyedia. Rahasia klien
OAuth tetap berada di lingkungan API, dan token penyedia tidak pernah dikembalikan oleh API Repovio.
