---
title: 'akses API'
description: 'Buka dokumentasi API yang diinstal dan gunakan referensi API statis khusus rilis.'
---

<a id="installed-api-documentation"></a>

## Dokumentasi API yang diinstal

Setiap server API Repovio menyajikan dokumentasi API interaktifnya di `/docs`. Dalam pengembangan lokal, buka
`http://localhost:3001/docs`. Titik akhir REST menggunakan jalur dasar `/api/v1`.

Untuk penerapan, gunakan asal API yang dapat dijangkau secara eksternal dan jalur yang dikonfigurasi oleh proksi
terbalik Anda. Misalnya, jika server API diekspos di `https://repovio.example.com`, dokumentasinya dapat diekspos di
`https://repovio.example.com/docs`. Aplikasi web tidak secara otomatis mem-proxy rute ini; konfigurasikan proxy Anda
secara eksplisit jika Anda ingin mengeksposnya. `/api/v1/docs` bukan rute dokumentasi.

Referensi yang diinstal menjelaskan aplikasi yang sedang berjalan. Permintaan yang dibuat dari referensi interaktif
tersebut menggunakan instans Anda dan memerlukan autentikasi serta izin yang didokumentasikan untuk setiap operasi.
Lihat [Otentikasi](/docs/v2.0/authentication) untuk masuk dan konfigurasi akun. Token akses MCP ditujukan untuk
[Klien MCP](/docs/v2.0/mcp), bukan sebagai token pembawa REST pada umumnya.

<a id="static-release-reference"></a>

## Referensi rilis statis

[Referensi API](/docs/v2.0/api-reference) di situs web ini adalah snapshot read-only yang dihasilkan dari revisi
aplikasi yang tepat dari rilis yang dipilih. Itu tidak memerlukan instance Repovio yang berjalan dan tidak mengirim
permintaan API. Pilih versi yang cocok dengan instalasi Anda; halaman `/docs` yang terinstal tetap resmi untuk build
Anda yang sedang berjalan.

Telusuri berdasarkan metode, jalur, atau deskripsi, periksa parameter dan skema respons, atau unduh OpenAPI JSON lengkap
dari halaman referensi. Pengidentifikasi skema dan deskripsi API mempertahankan bahasa kontrak yang dihasilkan.
