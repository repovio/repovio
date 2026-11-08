---
title: 'Menunggu persetujuan'
description: 'Temukan gerbang persetujuan penyedia dan buka layar persetujuan eksternal mereka.'
---

> Cuplikan sumber yang diarsipkan. Label produk menggunakan Repovio. Gunakan pengidentifikasi konfigurasi dan referensi
> kontainer dari file penerapan yang diberi tag pada rilis ini tanpa perubahan.

<a id="identify-approval-gates"></a>

## Identifikasi gerbang persetujuan

Buka **Alur kerja berjalan → Menunggu persetujuan** untuk melihat alur kerja tersinkronisasi yang dijeda karena
keputusan manusia. Telusuri berdasarkan alur kerja atau repositori dan periksa repositori, penyedia, dan konteks
permintaan penarikan/penggabungan terkait. Lencana sidebar mencerminkan proses pencocokan yang terlihat; pembatasan
keanggotaan berlaku untuk lencana dan meja.

Gunakan **Buka permintaan penarikan** untuk konteks, atau**Setujui di penyedia** untuk membuka halaman alur kerja milik
penyedia. GitLab dapat menyebut perubahan terkait sebagai permintaan penggabungan. Persetujuan alur kerja berbeda dengan
peninjauan kode atau persetujuan penggabungan.

<a id="complete-the-provider-action"></a>

## Selesaikan tindakan penyedia

Otentikasi di penyedia dan gunakan kontrol persetujuannya jika akun penyedia Anda diotorisasi. Repovio tidak pernah
mengirimkan permintaan persetujuan. Pembacaan webhook atau rekonsiliasi harus memperhatikan status penyedia yang
diperbarui sebelum baris tersebut menghilang. Segarkan antrian yang disimpan sesudahnya; baris yang tidak diubah segera
setelah persetujuan mungkin mencerminkan penundaan sinkronisasi.

Antrean kosong berarti tidak ada proses tersinkronisasi yang terlihat saat ini yang memerlukan persetujuan, bukan karena
setiap repositori terhubung atau akun penyedia Anda memiliki hak persetujuan. Jika beban gagal, coba lagi dan periksa
[Tugas sinkronisasi](/docs/v1.0/guide-jobs).
