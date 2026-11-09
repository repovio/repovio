---
title: 'Pengaturan GitHub App'
description: 'Daftarkan dan hubungkan GitHub App sendiri dengan kredensial terenkripsi dan akses instalasi hanya baca.'
---

<a id="register-app"></a>

## Daftarkan aplikasi

Gunakan satu GitHub.com App per penerapan Repovio; PAT dan OAuth tetap tersedia. Sebagai pemilik, buka Settings,
Developer settings, GitHub Apps, New GitHub App. Pilih nama unik dan halaman Repovio. Pilih Any account untuk beberapa
akun; aplikasi privat hanya dapat dipasang pada akun pemilik. Rahasia klien OAuth, URL callback dan URL pengaturan tidak
diperlukan.

<a id="permissions-and-events"></a>

## Izin dan peristiwa

Atur izin dasar di bawah menjadi Read-only; Metadata diberikan otomatis. Tambahkan izin keamanan opsional hanya jika
diperlukan dan tersedia. Langgani peristiwa yang tercantum; GitHub mengirim peristiwa siklus instalasi otomatis. Repovio
membatasi token yang dibuat ke akses baca meskipun aplikasi memiliki izin tambahan.

```text
Required repository permissions (Read-only):
Actions (actions)
Issues (issues)
Pull requests (pull_requests)
Metadata (metadata, automatic)

Optional repository permissions (Read-only):
Dependabot alerts (vulnerability_alerts)
Code scanning alerts (security_events)
Secret scanning alerts (secret_scanning_alerts)

Webhook events:
workflow_run
issues
pull_request
dependabot_alert
code_scanning_alert
secret_scanning_alert
```

<a id="configure-repovio"></a>

## Konfigurasikan Repovio

Aktifkan webhook dengan endpoint HTTPS publik berikut. PUBLIC_URL harus menunjuk instalasi yang dapat diakses dari luar.
Buat rahasia acak minimal 16 karakter dan masukkan nilai sama di GitHub serta Repovio. Buat kunci RSA di GitHub dan
unduh PEM. Dalam administrasi akun penyedia, buka GitHub App, masukkan App ID, slug, seluruh kunci privat dan rahasia
webhook, lalu verifikasi dan simpan. API memvalidasi identitas dan mengenkripsi kedua rahasia di PostgreSQL. Lindungi
kunci enkripsi penerapan; rahasia tersimpan tidak dikembalikan ke browser.

```text
https://repovio.example.com/api/v1/webhooks/github-app
```

<a id="install-and-connect"></a>

## Pasang dan hubungkan

Pasang lewat GitHub, pilih akun atau organisasi dan hanya repositori yang diperlukan. Kembali, muat ulang instalasi dan
hubungkan akun. Instalasi ditangguhkan atau sudah terhubung tidak dapat dihubungkan lagi. Daftar berasal dari aplikasi
terkonfigurasi; ID callback tidak dipercaya. Tambahkan repositori lewat layar repositori. Token diperbarui otomatis;
impor awal dan polling berkala melengkapi webhook.

Ubah nama akun lokal sebelum menghubungkan jika sama dengan akun PAT atau OAuth yang sudah ada.

<a id="rotate-and-disconnect"></a>

## Rotasi dan putuskan

Buat kunci pengganti di GitHub, simpan dan periksa sinkronisasi sebelum menghapus kunci lama. Ubah rahasia webhook pada
kedua sisi bersama; tanda tangan lama langsung tidak berlaku. Kolom kosong mempertahankan rahasia. Hapus akun terhubung
sebelum mengganti identitas aplikasi atau menghapus konfigurasi. Data pelacakan terkait ikut dihapus, jadi ekspor
dahulu. Penghapusan lokal tidak mencopot aplikasi di GitHub.

<a id="troubleshooting"></a>

## Pemecahan masalah

Periksa App ID, slug dan format PEM untuk kegagalan pengaturan. Untuk kegagalan tanda tangan, periksa rahasia, HTTPS dan
apakah proxy menjaga badan mentah. Jika daftar kosong, periksa pemilihan repositori dan izin lalu muat ulang. Instalasi
dihapus atau ditangguhkan mempertahankan riwayat; pulihkan akses dan muat ulang. Izin keamanan opsional yang hilang
tidak menghalangi domain lain. Periksa Jobs. Polling berlanjut saat webhook gagal. Tes tiruan tidak memverifikasi
instalasi GitHub nyata; diperlukan aplikasi uji.

## Lihat juga

- [Akun penyedia](/docs/next/provider-accounts)
- [Pengaturan OAuth](/docs/next/provider-oauth)
- [Webhook penyedia](/docs/next/provider-webhooks)
