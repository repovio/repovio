---
title: 'Otentikasi'
description: 'Konfigurasikan autentikasi lokal, proses masuk OpenID Connect opsional, dan pemulihan akun.'
---

<a id="first-run-setup"></a>

## Penyiapan yang dijalankan pertama kali

Setelah menerapkan instalasi baru, buka URL publiknya. Repovio mengalihkan setiap permintaan ke `/auth/setup` hingga
akun pertama ada. Masukkan nama depan dan belakang opsional, nama pengguna unik, dan kata sandi dengan minimal 12
karakter. Akun dibuat sebagai administrator sistem dan segera masuk.

Penyiapan hanya dapat berhasil satu kali. Setelah pengguna pertama ada, `/auth/setup` dialihkan ke `/auth/signin`.
Penginstalan yang ada mempertahankan penggunanya saat ini selama peningkatan dan tidak menampilkan penyiapan lagi.

<a id="openid-connect-single-sign-on"></a>

## OpenID Hubungkan sistem masuk tunggal

Repovio mendukung satu penyedia OpenID Connect opsional selain masuk lokal. Administrator sistem mengonfigurasinya di
**Pengaturan → Otentikasi**. Login ini terpisah dari penyedia GitHub, GitLab, Forgejo, dan Gitea OAuth: OIDC
mengidentifikasi pengguna Repovio, sedangkan penyedia OAuth hanya memberikan akses baca ke sumber daya penyedia.

Tetapkan URL panggilan balik API yang dapat dijangkau secara eksternal sebelum mengonfigurasi penyedia:

```dotenv
PUBLIC_URL=https://repovio.example.com
OIDC_CALLBACK_URL=https://repovio.example.com/api/v1/auth/oidc/callback
```

Daftarkan nilai `OIDC_CALLBACK_URL` sebagai URI pengalihan yang diizinkan di penyedia identitas. Konfigurasikan
penerbit, ID klien, rahasia klien opsional, cakupan, dan klaim grupnya di Repovio. API menerima rahasia klien saat
disimpan tetapi tidak pernah mengembalikan nilainya. Itu dienkripsi saat istirahat dengan `TOKEN_ENCRYPTION_KEY`. Simpan
konfigurasi sebelum menggunakan **Periksa koneksi**; perubahan yang belum disimpan menonaktifkan pemeriksaan itu.
Konfirmasikan penemuan berhasil sebelum mengandalkan proses masuk OIDC.

HTTPS diperlukan untuk penerbit dan titik akhirnya. **Izinkan penerbit HTTP** hanya ditujukan untuk jaringan lab yang
terisolasi; itu tidak boleh diaktifkan untuk penerapan yang dapat dijangkau Internet. Masuk dengan kata sandi lokal
tetap tersedia sebagai jalur pemulihan meskipun OIDC diaktifkan.

Formulir juga memperlihatkan URL panggilan balik untuk penyalinan, grup yang dikonfigurasi/diamati, dan kontrol terpisah
untuk mengganti atau menghapus rahasia klien yang disimpan. Membiarkan pengganti dinonaktifkan akan menjaga rahasia yang
disimpan. Kegagalan pemuatan, penyimpanan, dan pemeriksaan koneksi dilaporkan secara terpisah. Perbaiki konfigurasi yang
tidak valid dan simpan lagi sebelum mencoba kembali pemeriksaan koneksi.

<a id="groups-roles-and-identities"></a>

### Grup, peran, dan identitas

Klaim grup dapat berupa satu nama klaim yang sama persis atau jalur yang dipisahkan titik seperti `realm_access.groups`.
Konfigurasikan nilai grup yang tepat dan peka huruf besar-kecil untuk tiga peran Repovio. Jika beberapa grup cocok,
Repovio menerapkan `SYSTEM_ADMIN`, lalu `MANAGER`, lalu `VIEWER`. Klaim grup yang tidak cocok, salah format, hilang,
atau terlalu besar ditolak kecuali **Izinkan pengguna yang tidak cocok sebagai pemirsa** diaktifkan secara eksplisit.

Akun OIDC hanya ditautkan oleh penerbit terverifikasi dan pasangan subjek. Repovio tidak pernah menautkan login OIDC ke
akun lokal melalui alamat email atau nama pengguna. Nama depan dan belakang disinkronkan dari klaim terverifikasi pada
setiap login yang berhasil; nama login, nama profil, dan kata sandi tidak dapat diubah secara lokal. Keanggotaan
repositori tetap dikelola di Repovio dan tidak pernah berasal dari grup penyedia identitas.

Perubahan konfigurasi terkait keamanan atau perubahan peran membatalkan token bearer OIDC yang ada. Mengubah hanya nama
tampilan penyedia tidak membatalkan token OIDC yang ada. Menonaktifkan atau menghapus grup penyedia identitas mencegah
akun terkait memperoleh sesi baru dan membatalkan sesi sebelumnya setelah upaya masuk berikutnya ditolak.

<a id="provider-examples"></a>

### Contoh penyedia

Untuk Authentik, buat Penyedia OAuth2/OpenID dengan alur kode otorisasi, URL panggilan balik yang tepat di atas, dan
cakupan `openid`, `profile`, dan `email`. Tambahkan pemetaan cakupan yang mengembalikan klaim grup yang dipilih sebagai
array nama grup, lampirkan penyedia ke aplikasi, lalu salin penerbit aplikasi, ID klien, dan rahasia klien ke Repovio.

Untuk penyedia lain yang mematuhi standar, aktifkan Aliran Kode Otorisasi, wajibkan S256 PKCE, daftarkan URL panggilan
balik yang tepat, dan sertakan `sub` yang stabil ditambah klaim grup yang dikonfigurasi dalam token ID atau respons
UserInfo. Repovio hanya menerima tanda tangan token ID asimetris dan menolak token yang tidak ditandatangani dan
ditandatangani HMAC.

<a id="oidc-api-contract"></a>

### Kontrak API OIDC

| Metode       | Jalur                        | Akses                | Tujuan                                                                            |
| ------------ | ---------------------------- | -------------------- | --------------------------------------------------------------------------------- |
| `GET`        | `/api/v1/auth/oidc/status`   | Publik               | Hanya mengembalikan ketersediaan efektif dan nama penyedia opsional.              |
| `GET`        | `/api/v1/auth/oidc/start`    | Publik               | Memulai kode otorisasi terikat browser dan transaksi S256 PKCE.                   |
| `GET`        | `/api/v1/auth/oidc/callback` | Publik               | Memvalidasi respons penyedia dan mengalihkan dengan kode fragmen satu kali.       |
| `POST`       | `/api/v1/auth/oidc/exchange` | Publik               | Mengonsumsi kode fragmen satu kali dan mengembalikan pembawa normal `AuthResult`. |
| `GET`, `PUT` | `/api/v1/auth/oidc/config`   | Administrator sistem | Membaca atau memperbarui pengaturan OIDC yang aman secara rahasia.                |
| `POST`       | `/api/v1/auth/oidc/check`    | Administrator sistem | Memeriksa konfigurasi penemuan yang disimpan tanpa mengubahnya.                   |

Callback tidak pernah menempatkan JWT pembawa di URL. Kode pertukaran buramnya akan kedaluwarsa setelah 60 detik dan
hanya dapat digunakan sekali. Kesalahan penyedia direduksi menjadi kode kesalahan stabil sebelum mencapai browser atau
log.

<a id="change-your-password"></a>

## Ubah kata sandi Anda

Saat masuk, buka **Pengaturan → Umum → Ubah kata sandi**. Masukkan kata sandi saat ini, kata sandi baru, dan
konfirmasinya. Repovio menjaga browser saat ini tetap masuk dengan token akses pengganti dan membatalkan validasi token
yang dimiliki oleh setiap sesi masuk lainnya.

<a id="reset-a-forgotten-password"></a>

## Reset kata sandi yang terlupa

Repovio sengaja tidak ada reset password berbasis email. Administrator penerapan dapat mengatur ulang akun lokal dari
direktori yang berisi `compose.yml`. Baca kata sandi pengganti tanpa mengulanginya atau menyimpannya dalam riwayat
shell, lalu kirimkan ke wadah API melalui input standar:

```bash
read -rsp 'New Repovio password: ' REPOVIO_NEW_PASSWORD
printf '\n'
printf '%s\n' "$REPOVIO_NEW_PASSWORD" \
  | docker compose exec -T api node dist/scripts/reset-password.js USERNAME
unset REPOVIO_NEW_PASSWORD
```

Ganti `USERNAME` dengan nama pengguna login yang tepat. Perintah ini memerlukan kata sandi antara 12 dan 256 karakter,
hanya memperbarui akun lokal tersebut, dan membatalkan semua token akses yang ada. Masuk lagi dengan kata sandi baru
sesudahnya. Perintah ini menolak akun yang dikelola OIDC karena tidak memiliki kata sandi lokal.

<a id="local-user-and-group-management"></a>

## Grup akses lokal

Pada Akses grup repositori, berikan Viewer atau Manager, ubah atau hapus hak. Hak langsung dan turunan digabung; Manager
menang. Pengelolaan tetap memerlukan peran global Manager; administrator sistem tidak dibatasi. Pencabutan berlaku pada
permintaan berikutnya kecuali ada hak lain. Grup menerima akun lokal dan OIDC tanpa sinkronisasi klaim OIDC.

[Grup akses lokal](/docs/next/users#local-access-groups)
