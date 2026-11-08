---
title: 'Ikhtisar Repovio'
description: 'Alur kerja hanya baca berjalan, pekerjaan repositori, dan peringatan keamanan di seluruh penyedia Anda.'
---

Repovio adalah dasbor yang dihosting sendiri untuk Tindakan GitHub, saluran pipa GitLab, Tindakan Forgejo, dan Tindakan
Gitea. Lacak jalannya alur kerja yang dipilih, masalah dan tarik permintaan, identifikasi kegagalan saat ini dan kirim
pemberitahuan tanpa mengubah sumber daya penyedia.

<a id="one-permission-scoped-overview"></a>

## Satu ikhtisar cakupan izin

- Periksa kesehatan alur kerja, proses terkini, tren, antrian persetujuan, dan pekerjaan yang memerlukan perhatian.
- Baca masalah dan tarik atau gabungkan permintaan di samping aktivitas alur kerja terkait.
- Tinjau metadata peringatan keamanan yang didukung tanpa menyimpan nilai rahasia.
- Kelola keanggotaan repositori, tujuan notifikasi terenkripsi, dan koneksi penyedia hanya-baca.
- Gunakan akun lokal, OpenID Connect opsional, dan token akses MCP pribadi yang hanya dapat dibaca.

Perubahan penyedia, persetujuan, peninjauan, dan pemutaran ulang alur kerja tetap merupakan tindakan eksternal. Kontrol
administrasi Repovio mengonfigurasi pelacakan dan pemberitahuan lokalnya; mereka tidak memberikan akses tulis kepada
penyedia.

Mulailah dengan [instalasi](/docs/v2.0/installation), lalu ikuti [masuk dan navigasi](/docs/v2.0/sign-in). Untuk operasi
produksi, lihat [penerapan dan pencadangan](/docs/v2.0/deployment).
