---
title: 'Pengguna'
description: 'Tinjau pengguna lokal dan yang dikelola identitas, peran, penghapusan, dan administrasi token MCP.'
---

<a id="review-accounts"></a>

## Tinjau akun

Administrator sistem membuka **Administrasi → Pengguna**. Tabel menunjukkan nama pengguna, avatar/nama tampilan, peran,
asal lokal/OIDC, dan stempel waktu yang dibuat/diperbarui. Filter berdasarkan peran, urutkan, ubah kolom, atau penomoran
halaman. Akses repositori untuk Viewer atau Manager memerlukan [keanggotaan repositori](/docs/next/repositories)
terpisah; kelompok penyedia identitas tidak membuat keanggotaan tersebut.

<a id="provisioning-and-deletion"></a>

## Penyediaan dan penghapusan

Di Administrasi → Pengguna pilih Pengguna baru pada toolbar. Isi nama unik, nama depan/belakang opsional, sandi 12–256
karakter dengan konfirmasi dan peran; standar Viewer. Pembuatan tetap tersedia ketika OIDC aktif. Identitas OIDC dibuat
melalui providernya dan tidak ditautkan berdasarkan kesamaan nama lokal.

Tindakan penghapusan tersedia untuk pengguna lain dan segera dijalankan; tinjau akun sebelum memilihnya. Anda tidak
dapat menghapus akun Anda sendiri melalui API atau layar ini. Menghapus pengguna Repovio akan menghapus akses lokal; itu
tidak menghapus akun penyedia apa pun di GitHub, GitLab, Forgejo, atau Gitea. Tinjau akses pengguna yang terpengaruh
sebelum menghapus.

<a id="user-mcp-tokens"></a>

## Pengguna token MCP

Buka dialog token MCP pengguna untuk mencantumkan metadata token atau mencabut token dengan konfirmasi. Administrator
tidak dapat mengambil nilai token teks biasa atau membuat token pengguna lain melalui dialog ini. Pengguna membuat token
mereka sendiri di [Pengaturan MCP](/docs/next/mcp). Daftar kosong dan kesalahan pemuatan berbeda; coba lagi setelah
pemulihan API. Jangan pernah menyalin nilai token ke dalam laporan dukungan atau tangkapan layar.

<a id="local-user-api"></a>

## Penyediaan pengguna lokal melalui API

Gunakan klien API melalui HTTPS untuk mengirim `POST /api/v1/users` dengan autentikasi pembawa administrator dan
`Content-Type: application/json`. Sediakan badan permintaan ini, gantikan placeholder di masukan klien yang dilindungi:

```json
{
  "username": "new-user",
  "password": "REPLACE_WITH_A_PASSWORD_OF_AT_LEAST_12_CHARACTERS",
  "role": "VIEWER"
}
```

Peran yang valid adalah `VIEWER`, `MANAGER`, dan `SYSTEM_ADMIN`. Tetapkan hanya peran yang diperlukan, lalu berikan
keanggotaan repositori secara terpisah. Responsnya berisi metadata pengguna yang aman, bukan kata sandi atau hashnya.
Nama pengguna duplikat atau permintaan yang tidak valid harus diperbaiki sebelum mencoba lagi. Jangan menyimpan kata
sandi atau token pembawa dalam file yang dilacak, riwayat shell, tangkapan layar, atau laporan masalah.

<a id="create-and-reset-local-accounts"></a>

## Membuat dan mereset akun lokal

Aksi Reset sandi pada baris akun lokal memungkinkan administrator mengganti sandi tanpa sandi lama. Isi sandi baru dan
konfirmasi. Sesi JWT lama tidak berlaku; mereset akun sendiri mengeluarkan Anda. Akun OIDC tidak memiliki aksi ini.
Token MCP tidak dicabut.

<a id="local-access-groups"></a>

## Grup akses lokal

Buka Administrasi → Grup pengguna untuk membuat, mengganti nama, menghapus serta mengelola anggota. Nama harus unik dan
tidak kosong. Pemilihan mendukung pencarian dan halaman; pengguna boleh bergabung beberapa grup tanpa grup bersarang.
Penghapusan memerlukan konfirmasi dan menghapus keanggotaan serta hak turunan, tetapi mempertahankan penetapan langsung.

Pada Akses grup repositori, berikan Viewer atau Manager, ubah atau hapus hak. Hak langsung dan turunan digabung; Manager
menang. Pengelolaan tetap memerlukan peran global Manager; administrator sistem tidak dibatasi. Pencabutan berlaku pada
permintaan berikutnya kecuali ada hak lain. Grup menerima akun lokal dan OIDC tanpa sinkronisasi klaim OIDC.

```text
POST   /api/v1/users                              { username, password, role, firstName?, lastName? }
PUT    /api/v1/users/:id/password                 { newPassword }
GET    /api/v1/user-groups                       ?page=1&perPage=10
POST   /api/v1/user-groups                       { name }
PUT    /api/v1/user-groups/:id                    { name }
DELETE /api/v1/user-groups/:id
GET    /api/v1/user-groups/:id/members            ?page=1&perPage=10
PUT    /api/v1/user-groups/:id/members/:userId
DELETE /api/v1/user-groups/:id/members/:userId
GET    /api/v1/repositories/:id/group-memberships
PUT    /api/v1/repositories/:id/group-memberships/:groupId  { role }
DELETE /api/v1/repositories/:id/group-memberships/:groupId
```
