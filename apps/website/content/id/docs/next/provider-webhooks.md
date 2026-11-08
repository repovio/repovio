---
title: 'Penyiapan webhook repositori'
description: 'Konfigurasikan webhook baca-saja yang ditandatangani untuk repositori GitHub, GitLab, Forgejo, dan Gitea.'
---

Petunjuk PAT/OAuth di halaman ini menggunakan webhook per repositori. Koneksi GitHub App memakai satu webhook pusat dan
diatur melalui dialog aplikasi.

Repovio dapat menerima webhook yang ditandatangani untuk menyinkronkan repositori yang dilacak lebih cepat dari interval
polling normalnya. Itu tidak pernah membuat, memperbarui, menghapus, atau menguji webhook melalui API penyedia.
Administrator mengonfigurasi setiap webhook repositori secara manual di GitHub, GitLab, Forgejo, atau Gitea.

Buka **Repositori**, pilih repositori yang dilacak, dan gunakan kartu**Repositori webhook**. Kartu tersebut menunjukkan
URL panggilan balik spesifik repositori, menghasilkan atau menerima rahasia penandatanganan, dan melaporkan pengiriman
terakhir yang diterima. Repovio tidak pernah mengirimkan konfigurasi itu ke penyedia.

Webhook adalah pengoptimalan, bukan sumber kebenaran. Payload yang ditandatangani harus mengidentifikasi repositori yang
dipilih oleh URL panggilan balik. Repovio kemudian membaca data saat ini melalui adaptor penyedia read-only yang
dikonfigurasi. Pengiriman yang diterima menyebabkan sinkronisasi repositori yang tahan lama; pengiriman yang diterima
dalam waktu 15 detik digabungkan. Interval pemungutan suara cadangan default adalah 30 menit.

<a id="configure-a-repository-webhook"></a>

## Konfigurasikan webhook repositori

1. Tambahkan repositori ke Repovio dan buka kartu **Webhook repositori**.
2. Salin URL panggilan balik.
3. Buat rahasia penandatanganan unik dengan entropi tinggi atau tempelkan token penandatanganan persis yang disediakan
   oleh penyedia. Jangan pernah menggunakan kembali token akses atau rahasia repositori lain.
4. Simpan rahasianya. Repovio mengenkripsinya dengan AES-256-GCM dan tidak pernah mengembalikannya melalui API.
5. Konfigurasikan URL panggilan balik dan rahasia dalam pengaturan penyedia repositori tersebut.
6. Tetap aktifkan verifikasi TLS dan kirim pengiriman tes.

Callback stabil menggunakan `/api/webhooks/<provider>/<repository-id>`. Callback
`/api/v1/webhooks/<provider>/<repository-id>` berversi juga tersedia. URL panggilan balik akun penyedia dari Repovio
0.2.9 dan versi lebih lama tidak lagi diterima. Setelah memutakhirkan, buat ulang setiap webhook dengan callback
repositori dan rahasia repositori baru.

Pengiriman yang berhasil mengembalikan HTTP `202` dengan `{ "accepted": true }`. ID pengiriman penyedia berulang
mengembalikan `{ "accepted": true, "duplicate": true }` dan tidak memasukkan sinkronisasi lainnya. Repositori yang tidak
diketahui atau dinonaktifkan, akun penyedia yang dinonaktifkan, rahasia yang hilang, tanda tangan tidak valid, ID
repositori penyedia yang tidak cocok, dan ID pengiriman yang hilang ditolak tanpa memperlihatkan detail konfigurasi.

Sinkronisasi yang antri akan bertahan jika API dimulai ulang. Beberapa contoh menggunakan penyewaan basis data dan tidak
menyinkronkan akun penyedia yang sama secara bersamaan. Header batas kecepatan menunda pekerjaan untuk akun yang
terpengaruh, sementara percobaan ulang terbatas menangani kegagalan sementara.

<a id="github-actions"></a>

## Tindakan GitHub

1. Buka **Pengaturan → Webhook** repositori dan pilih**Tambahkan webhook**.
2. Gunakan `https://repovio.example.com/api/webhooks/github/<repository-id>` sebagai URL muatan.
3. Pilih `application/json`, tempelkan rahasia repositori, dan berlangganan **Workflow run** (`workflow_run`).
4. Tetap aktifkan verifikasi SSL dan simpan webhook.

Repovio memverifikasi `X-Hub-Signature-256` pada bodi mentah dan menggunakan `X-GitHub-Delivery` untuk idempotensi.
Lihat [dokumentasi acara webhook](https://docs.github.com/en/webhooks/webhook-events-and-payloads) GitHub.

<a id="gitlab-pipelines"></a>

## Saluran pipa GitLab

1. Buka **Pengaturan → Webhook** proyek dan pilih**Tambahkan webhook baru**.
2. Gunakan `https://repovio.example.com/api/webhooks/gitlab/<repository-id>` sebagai URL.
3. Buat **Token penandatanganan** dan simpan nilai lengkapnya, termasuk `whsec_`, di kartu repositori Repovio.
4. Pilih **Acara alur**, tetap aktifkan verifikasi SSL, simpan, dan kirim pengiriman pengujian.

Repovio memverifikasi tanda tangan Webhook Standar HMAC-SHA256 dan lebih memilih `webhook-id` untuk idempotensi. Header
`X-Gitlab-Token` dan `X-Gitlab-Event-UUID` lama tetap didukung untuk instans lama. Lihat
[dokumentasi webhook](https://docs.gitlab.com/user/project/integrations/webhooks/) GitLab.

<a id="forgejo-actions"></a>

## Tindakan Forgejo

1. Buka **Pengaturan → Webhook** repositori dan tambahkan webhook JSON asli**Forgejo**.
2. Gunakan `https://repovio.example.com/api/webhooks/forgejo/<repository-id>` sebagai URL target.
3. Tempelkan rahasia repositori dan pilih **Acara push** ditambah acara Tindakan apa pun yang tersedia.
4. Tetap aktifkan verifikasi TLS dan simpan webhook.

Repovio memverifikasi `X-Forgejo-Signature` dan menggunakan `X-Forgejo-Delivery` untuk idempotensi. Header yang
kompatibel dengan Gitea tetap diterima untuk kompatibilitas Forgejo. Lihat Forgejo
[dokumentasi webhook](https://forgejo.org/docs/latest/user/repository/webhooks/).

<a id="gitea-actions"></a>

## Tindakan Gitea

1. Buka **Pengaturan → Webhook** repositori dan tambahkan webhook JSON asli**Gitea**.
2. Gunakan `https://repovio.example.com/api/webhooks/gitea/<repository-id>` sebagai URL target.
3. Tempelkan rahasia repositori dan pilih **Push events** plus event alur kerja apa pun yang tersedia.
4. Tetap aktifkan verifikasi TLS dan simpan webhook.

Repovio memverifikasi `X-Gitea-Signature` pada bodi mentah dan menggunakan `X-Gitea-Delivery` untuk idempotensi. Lihat
Gitea [dokumentasi webhook](https://docs.gitea.com/usage/repository/webhooks/).

<a id="troubleshooting"></a>

## Pemecahan masalah

- `401` berarti Repovio tidak dapat memverifikasi repositori, jenis penyedia, rahasia, tanda tangan, ID repositori
  payload, atau ID pengiriman. Konfirmasikan UUID repositori panggilan balik dan rahasia persisnya.
- `202` dengan `duplicate: true` diharapkan ketika penyedia mencoba kembali pengiriman.
- Pengiriman yang berhasil hanya memicu sinkronisasi read-only; itu tidak pernah mengubah alur kerja penyedia.
- Periksa `/api/health` untuk status sinkronisasi penyedia yang bertahan.
- Atur `SCHEDULER_SYNC_INTERVAL_SECONDS=1800` untuk fallback 30 menit.
- `SCHEDULER_ENABLED=false` mempertahankan permintaan yang antri tetapi menghentikan sementara antrean dan pemrosesan
  fallback.

[Pengaturan GitHub App](/docs/next/github-app)
