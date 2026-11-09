---
title: 'Repositori'
description: 'Lacak repositori, periksa aktivitas, dan konfigurasikan sinkronisasi dan akses lokal.'
---

<a id="browse-and-open-details"></a>

## Telusuri dan buka detailnya

Buka repositori dari tabel untuk berpindah antara Ringkasan, Eksekusi workflow, Issue, Pull request, Peringatan
keamanan, dan Pengaturan. Halaman aktivitas tetap dalam lingkup repositori dan menyediakan filter, pengurutan,
paginasi, dan navigasi baris. Peringatan memerlukan izin pengelolaan; Pengaturan hanya tersedia bagi administrator
sistem. Tautan penyedia membuka repositori eksternal; dialog pengaturan tetap tersedia dari daftar repositori.

Ringkasan menampilkan informasi umum, retensi, sinkronisasi terakhir, usia data, interval, pekerjaan saat ini, dan
aktivitas terbaru. Pekerjaan tertunda atau berjalan menampilkan progres dan kesalahan terklasifikasi tanpa rahasia.

<a id="add-and-maintain-tracking"></a>

## Tambahkan dan pertahankan pelacakan

Hanya administrator sistem yang menambahkan repositori. Pilih akun penyedia yang diaktifkan, tunggu penemuan, dan pilih
satu atau beberapa repositori yang tidak terlacak. Repositori yang sudah dilacak tidak termasuk. Jika bagian dari
multi-tambah gagal, pilihan yang berhasil tetap ditambahkan dan hanya pilihan yang gagal yang tersisa untuk dicoba lagi.
Daftar penyedia yang kosong memerlukan koneksi [akun penyedia](/docs/next/provider-accounts) yang diaktifkan terlebih
dahulu.

Administrator dapat mengaktifkan/menonaktifkan pelacakan, **Segarkan data penyedia**, dan mengantri sinkronisasi
hanya-baca. Identitas repositori menggunakan akun penyedia dan ID repositori penyedia stabil. Ganti nama/transfer
melestarikan riwayat, filter, keanggotaan, dan saluran; penyegaran metadata menolak ID yang berbeda di jalur lama
daripada menugaskannya kembali. Repositori yang dinonaktifkan mempertahankan data yang disimpan tetapi berhenti
berpartisipasi dalam sinkronisasi.

<a id="retention-filters-and-memberships"></a>

## Retensi, filter, dan keanggotaan

Administrator menetapkan penggantian retensi alur kerja, masalah, dan permintaan penarikan yang terpisah, masing-masing
dari 1 hingga 3650 hari. Nilai kosong mengembalikan [bawaan sistem](/docs/next/settings-system) yang sesuai. Filter alur
kerja menerima pola glob **ALLOW** dan**DENY**; penolakan diutamakan. Tambahkan pola yang tidak kosong atau hapus pola
yang sudah ada. Filter yang membatasi dapat menjelaskan tidak adanya proses.

Dalam keanggotaan, tambahkan pengguna non-administrator sebagai Viewer atau Manager, ubah peran repositori mereka, atau
hapus akses. Administrator dikecualikan dari pemilihan anggota karena mereka telah memiliki akses tidak terbatas.
Manajer global masih memerlukan keanggotaan Manajer untuk kemampuan manajemen repositori seperti peringatan keamanan.

<a id="webhooks-and-failures"></a>

## Webhook dan kegagalan

Kartu webhook repositori menunjukkan URL panggilan balik, status yang dikonfigurasi, instruksi penyedia, dan pengiriman
terakhir. Itu dapat menghasilkan/menyalin rahasia, menyimpan konfigurasi, memutar dengan konfirmasi eksplisit, atau
menghapus konfigurasi. URL publik yang hilang harus diperbaiki sebelum pendaftaran penyedia. Rahasia hanya ditampilkan
selama konfigurasi; simpan di manajer rahasia. Ikuti [Webhook repositori](/docs/next/provider-webhooks) untuk pengaturan
dan verifikasi.

Pemirsa dan pengelola menerima ringkasan pengaturan repositori hanya-baca. Coba lagi memuat/menyimpan kesalahan setelah
pemulihan; periksa [Tugas sinkronisasi](/docs/next/guide-jobs) untuk akses penyedia, batas kecepatan, atau kegagalan
sinkronisasi.

<a id="local-user-and-group-management"></a>

## Grup akses lokal

Pada Akses grup repositori, berikan Viewer atau Manager, ubah atau hapus hak. Hak langsung dan turunan digabung; Manager
menang. Pengelolaan tetap memerlukan peran global Manager; administrator sistem tidak dibatasi. Pencabutan berlaku pada
permintaan berikutnya kecuali ada hak lain. Grup menerima akun lokal dan OIDC tanpa sinkronisasi klaim OIDC.

[Grup akses lokal](/docs/next/users#local-access-groups)

<a id="delete-local-tracking"></a>

## Menghapus pelacakan lokal

Administrator sistem dapat memilih **Hapus repositori** di halaman detail atau dialog pengaturan. Konfirmasi menyebutkan
nama repositori dan menjelaskan penghapusan permanen workflow, eksekusi, issue, pull request, peringatan keamanan,
pengaturan, pemberian akses, riwayat webhook, status sinkronisasi, dan riwayat notifikasi terkait yang tersimpan lokal.
Akun penyedia dan data repositori pada penyedia tetap tidak berubah.

Penghapusan diblokir selama sinkronisasi berjalan; tunggu hingga selesai lalu coba lagi. Permintaan sinkronisasi yang
menunggu dihapus bersama repositori. Langganan notifikasi kehilangan filter repositori ini; langganan yang hanya mencakup
repositori tersebut dihapus alih-alih menjadi global. Kanal bersama tetap tersedia.

Repositori dapat ditambahkan kembali melalui pilihan penyedia yang sudah ada. Pelacakan dimulai dari awal tanpa
memulihkan riwayat atau pengaturan lokal sebelumnya.
