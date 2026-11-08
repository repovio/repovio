---
title: 'Peringatan ketergantungan'
description: 'Tinjau peringatan ketergantungan dengan akses manajemen cakupan repositori.'
---

<a id="access-and-provider-support"></a>

## Akses dan dukungan penyedia

Buka **Ikhtisar → Peringatan keamanan → Peringatan ketergantungan**. Manajer memerlukan akses manajemen ke repositori;
administrator sistem dapat memeriksa semua repositori. Pemirsa tidak dapat mengakses data peringatan. Daftar, opsi
filter, penghitung, detail, aktivitas repositori, dan metrik dasbor menerapkan pembatasan akses yang sama.

GitHub mendukung jenis peringatan ini melalui API keamanannya. GitLab memetakan kerentanan Pemindaian Ketergantungan,
SAST, dan Deteksi Rahasia ke tampilan peringatan yang sesuai, tergantung pada izin instans/lisensi dan token. Forgejo
dan Gitea saat ini melaporkan jenis ini sebagai tidak didukung. Peringatan untuk jenis yang tidak tersedia tidak akan
menggagalkan cakupan sinkronisasi lainnya.

<a id="review-findings"></a>

## Tinjau temuan

Gunakan pencarian dan repositori yang tersedia, penyedia, tingkat keparahan, dan filter status, pengurutan, kolom yang
terlihat, dan penomoran halaman. Negara bagian termasuk `OPEN`, `RESOLVED`, dan `DISMISSED`; tingkat keparahan termasuk
kritis, tinggi, sedang, rendah, informasional, dan tidak diketahui. Filter ketergantungan juga mencakup ekosistem,
paket, dan manifes. Batasan tanggal yang diperbarui dan pencarian teks berdasarkan jenis membantu mempersempit daftar
besar. Pilih temuan untuk memeriksa nama paket, ekosistem, tingkat keparahan, metadata kerentanan, dan lokasi
ketergantungan yang terpengaruh. Repovio hanya menyimpan metadata yang diizinkan; muatan penyedia mentah, kredensial,
fragmen token, dan nilai rahasia tidak pernah disimpan. Bidang yang hilang dapat mencerminkan kemampuan penyedia, bukan
kesalahan pemrosesan.

Gunakan **Buka di penyedia** untuk menyelidiki dan memulihkan. Repovio tidak mengabaikan, menyelesaikan, membuka
kembali, atau mengedit peringatan. Pembacaan pertama yang berhasil per repositori dan jenis peringatan menetapkan garis
dasar diam. Transisi yang dibuka, diselesaikan, ditutup, atau dibuka kembali kemudian dapat memicu
[saluran notifikasi](/docs/next/notifications) berlangganan.

<a id="empty-unavailable-and-stale-data"></a>

## Data kosong, tidak tersedia, dan basi

Hapus filter dan verifikasi keanggotaan manajemen jika tidak ada temuan yang muncul. Periksa
[Tugas sinkronisasi](/docs/next/guide-jobs) untuk jenis yang tidak didukung atau peringatan izin. Akun GitHub OAuth yang
ada mungkin memerlukan otorisasi ulang dengan `security_events`; lihat [Penyedia OAuth](/docs/next/provider-oauth). Coba
lagi pemuatan yang gagal setelah pemulihan; tidak adanya temuan yang terlihat bukan merupakan bukti bahwa penyedia telah
memindai repositori atau bahwa setiap jenis peringatan didukung.
