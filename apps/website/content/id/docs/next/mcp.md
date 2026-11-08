---
title: 'Akses MCP'
description: 'Hubungkan klien MCP yang dapat dikonfigurasi header ke alat alur kerja baca-saja Repovio yang sadar izin.'
---

Repovio memperlihatkan titik akhir Protokol Konteks Model tanpa kewarganegaraan di `/mcp`. Ini memberikan akses hanya
baca ke repositori yang sama, alur kerja yang berjalan, antrean kegagalan, antrean persetujuan, ringkasan, dan tren yang
mungkin dilihat oleh pengguna yang diautentikasi di Repovio.

Server MCP membaca database Repovio lokal. Itu tidak memanggil API mutasi penyedia, memulai sinkronisasi, menyetujui
alur kerja, atau mengubah konfigurasi Repovio.

Endpoint `/mcp` yang sama mendukung protokol `2025-06-18` dari klien lama seperti Codex dan protokol modern
`2026-07-28`. Klien lama menggunakan `initialize` lalu `notifications/initialized`; klien modern mengirim metadata
protokol pada setiap permintaan. Keduanya menyediakan tujuh alat hanya baca yang sama dan mengautentikasi setiap
permintaan dengan token Bearer pengguna saat ini. Setiap permintaan memakai instans server baru tanpa sesi MCP persisten.

<a id="create-an-access-token"></a>

## Buat token akses

Buka **Pengaturan**, pilih tab**Akses MCP**, dan buat token bernama. Kedaluwarsa adalah opsional. Salin token lengkap
dari dialog pembuatan karena Repovio hanya menampilkannya sekali dan hanya menyimpan hash SHA-256-nya.

Mencabut token akan berlaku pada permintaan berikutnya. Menghapus penggunanya juga menghapus token. Perubahan pada peran
pengguna atau keanggotaan repositori berlaku segera karena setiap permintaan menyelesaikan otorisasi saat ini dari
database.

<a id="configure-a-client"></a>

## Konfigurasikan klien

Gunakan asal Repovio publik diikuti dengan `/mcp` dan kirimkan token di header otorisasi:

```text
URL: https://repovio.example.com/mcp
Authorization: Bearer repovio_mcp_REPLACE_WITH_TOKEN
```

Rilis pertama menargetkan klien MCP yang mendukung header HTTP khusus, seperti klien editor dan baris perintah. Itu
tidak menyediakan penemuan OAuth dan tidak mengklaim kompatibilitas dengan host yang memerlukan aliran MCP OAuth.

Jangan pernah menempatkan token di URL, parameter kueri, file konfigurasi terlacak, riwayat shell, atau log. Lebih
memilih penyimpanan rahasia klien atau variabel lingkungan tidak berversi.

<a id="available-tools"></a>

## Alat yang tersedia

| Alat                     | Tujuan                                                                           |
| ------------------------ | -------------------------------------------------------------------------------- |
| `list_repositories`      | Daftar repositori terlacak yang terlihat.                                        |
| `get_repository`         | Baca satu repositori terlacak yang terlihat.                                     |
| `list_workflow_runs`     | Alur kerja yang terlihat dinormalisasi kueri berjalan.                           |
| `list_needs_attention`   | Buat daftar konteks alur kerja yang terminal terbarunya gagal dijalankan.        |
| `list_awaiting_approval` | Daftar proses yang terlihat saat ini menunggu persetujuan penyedia.              |
| `get_dashboard_summary`  | Ringkaslah kesehatan alur kerja yang terlihat untuk rentang waktu yang inklusif. |
| `get_workflow_trend`     | Gabungkan kelompok tren keberhasilan dan kegagalan yang terlihat.                |

Daftar alat default ke 25 hasil per halaman dan terima paling banyak 100. Output alat berisi JSON terstruktur dan
representasi teks yang cocok. Tanggal menggunakan nilai ISO 8601 UTC.

Server sengaja tidak mengiklankan sumber daya MCP, perintah, tugas, langganan, tindakan penyedia, atau alat konfigurasi.

<a id="reverse-proxy-requirements"></a>

## Membalikkan persyaratan proksi

- Meneruskan `POST /mcp` ke penampung API tanpa menulis ulang ke `/api/v1/mcp`.
- Meneruskan `Authorization`, `Origin`, `Content-Type`, `Accept`, `MCP-Protocol-Version`, `Mcp-Method`, dan `Mcp-Name`.
- Gunakan TLS di proksi terbalik dan jangan mencatat header otorisasi atau meminta string kueri.
- Tambahkan setiap asal browser yang diizinkan ke `CORS_ORIGIN`. Permintaan tanpa header `Origin` tetap didukung untuk
  klien asli; asal saat ini harus cocok dengan daftar yang diizinkan yang dikonfigurasi.

<a id="token-administration"></a>

## Administrasi token

Pengguna mengelola token mereka sendiri di tab **akses MCP** di bawah Pengaturan. Administrator sistem dapat memeriksa
metadata token aman dan mencabut token dari halaman Pengguna, namun tidak dapat mengambil rahasia hash atau teks biasa
dan tidak dapat membuat token atas nama pengguna lain.

<a id="manage-token-states"></a>

## Kelola status token

Daftar token menunjukkan nama, status, awalan aman, stempel waktu yang dibuat/terakhir digunakan, dan masa berlaku
opsional. Nama dapat berisi maksimal 100 karakter. Pencabutan memerlukan konfirmasi. Token yang dicabut atau kedaluwarsa
tidak dapat mengautentikasi permintaan di masa mendatang. Daftar kosong berarti tidak ada token untuk pengguna;
kesalahan pemuatan menawarkan percobaan ulang. Salin token baru secara lengkap sebelum menutup tampilan satu kali.
Dialog token administrator hanya mengizinkan pencatatan/pencabutan, tidak pernah memungkinkan pembuatan untuk pengguna
lain.
