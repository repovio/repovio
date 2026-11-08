---
title: 'Penyiapan penyedia OAuth'
description: 'Daftarkan aplikasi OAuth dan konfigurasikan autentikasi penyedia hanya-baca untuk Repovio.'
---

Petunjuk PAT/OAuth di halaman ini menggunakan webhook per repositori. Koneksi GitHub App memakai satu webhook pusat dan
diatur melalui dialog aplikasi.

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

[Pengaturan GitHub App](/docs/next/github-app)

<a id="gitlab-connection-lifecycle"></a>

## Siklus hidup koneksi GitLab

Daftarkan aplikasi OAuth GitLab rahasia dengan URL callback yang tepat dan cakupan baca yang tercantum di atas. Simpan
rahasia klien di lingkungan API. Hanya instans GitLab yang dikonfigurasi yang dapat menggunakan aplikasi ini; instans
lain memerlukan konfigurasi penerapan yang sesuai.

Untuk Akun Penyedia baru, pilih **Tambah penyedia**, GitLab dan OAuth, lalu selesaikan persetujuan. Pada koneksi GitLab
yang sudah ada, pilih **Hubungkan dengan GitLab OAuth** untuk mengonversinya tanpa mengganti koneksi. Koneksi OAuth
terkelola menyediakan **Otorisasi ulang**. Konversi mengikat ID numerik pengguna GitLab; otorisasi berikutnya harus
menggunakan pengguna GitLab yang sama meskipun nama penggunanya berubah. ID, nama saat ini, status aktif Akun Penyedia,
Repositori yang dilacak, keanggotaan, konfigurasi, dan riwayat tetap dipertahankan. Pembatalan atau kegagalan
persetujuan tidak mengubah koneksi yang ada.

Koneksi yang belum menyimpan metadata penyegaran memerlukan satu otorisasi baru. Repovio tidak dapat membedakan token
OAuth lama ini dari PAT, sehingga peningkatan tidak otomatis mengubah label atau mengonversinya.

<a id="gitlab-token-recovery"></a>

## Rotasi token dan pemulihan

Repovio mengenkripsi token akses dan penyegaran bersama-sama serta memperbarui token akses secara otomatis ketika
tersisa 60 detik atau kurang. Setiap rotasi yang berhasil mengganti pasangan sebelumnya. Penolakan penyegaran dengan
`invalid_grant` menandai koneksi sebagai memerlukan otorisasi ulang dan menghentikan upaya otomatis sampai otorisasi
berhasil. Gunakan **Otorisasi ulang**; tidak perlu menghapus dan membuat ulang koneksi.

Kesalahan jaringan, batas waktu, batas laju, dan kegagalan server menggunakan mekanisme percobaan ulang dan jeda yang
sudah ada. Pulihkan konfigurasi klien yang hilang; perubahan identitas klien memerlukan otorisasi ulang, dan instans
yang tidak cocok ditolak. Kredensial dan kesalahan mentah penyedia tidak pernah ditampilkan. Jika GitLab merotasi token
tetapi respons hilang atau commit basis data gagal, token lama mungkin sudah tidak valid. Lakukan otorisasi ulang untuk
memulihkan; PostgreSQL dan GitLab tidak dapat melakukan commit operasi ini secara atomik.

<a id="gitlab-oauth-rollout"></a>

## Peluncuran dan rollback

Terapkan migrasi basis data aditif terlebih dahulu, kemudian gunakan versi API dan web yang sesuai. Pertahankan kolom
tambahan saat melakukan rollback aplikasi. Versi lama tidak otomatis menyegarkan token OAuth GitLab, dan rollback tidak
dapat memulihkan token yang telah dibatalkan oleh GitLab.
