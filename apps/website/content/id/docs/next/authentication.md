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

Claim grup dapat berupa nama persis atau jalur bertitik seperti `realm_access.groups`. Gunakan nilai persis yang peka
huruf besar-kecil. Jika beberapa grup cocok, prioritasnya `SYSTEM_ADMIN`, lalu `MANAGER`, lalu `VIEWER`. Grup yang
hilang atau tidak cocok ditolak kecuali akses Viewer tanpa kecocokan diaktifkan secara eksplisit. Claim rusak dan
kelebihan grup selalu ditolak.

Akun OIDC hanya ditautkan oleh penerbit terverifikasi dan pasangan subjek. Repovio tidak pernah menautkan login OIDC ke
akun lokal melalui alamat email atau nama pengguna. Nama depan dan belakang disinkronkan dari klaim terverifikasi pada
setiap login yang berhasil; nama login, nama profil, dan kata sandi tidak dapat diubah secara lokal. Keanggotaan
repositori tetap dikelola di Repovio dan tidak pernah berasal dari grup penyedia identitas.

Perubahan konfigurasi terkait keamanan atau perubahan peran membatalkan token bearer OIDC yang ada. Mengubah hanya nama
tampilan penyedia tidak membatalkan token OIDC yang ada. Menonaktifkan atau menghapus grup penyedia identitas mencegah
akun terkait memperoleh sesi baru dan membatalkan sesi sebelumnya setelah upaya masuk berikutnya ditolak.

<a id="provider-examples"></a>

### Contoh penyedia

Panduan penyedia: [Keycloak](#oidc-keycloak) · [Microsoft Entra ID](#oidc-entra-id) · [Auth0](#oidc-auth0)

Untuk Authentik, buat Penyedia OAuth2/OpenID dengan alur kode otorisasi, URL panggilan balik yang tepat di atas, dan
cakupan `openid`, `profile`, dan `email`. Tambahkan pemetaan cakupan yang mengembalikan klaim grup yang dipilih sebagai
array nama grup, lampirkan penyedia ke aplikasi, lalu salin penerbit aplikasi, ID klien, dan rahasia klien ke Repovio.

Untuk penyedia lain yang mematuhi standar, aktifkan Aliran Kode Otorisasi, wajibkan S256 PKCE, daftarkan URL panggilan
balik yang tepat, dan sertakan `sub` yang stabil ditambah klaim grup yang dikonfigurasi dalam token ID atau respons
UserInfo. Repovio hanya menerima tanda tangan token ID asimetris dan menolak token yang tidak ditandatangani dan
ditandatangani HMAC.

<a id="oidc-keycloak"></a>

#### Keycloak

Di konsol Keycloak, buat realm repovio dan klien OpenID Connect repovio. Aktifkan Client authentication dan Standard
flow; nonaktifkan Implicit flow dan Direct access grants. Daftarkan callback persis di bawah pada Valid redirect URIs,
wajibkan S256 dan pertahankan RS256. Salin rahasia dari Credentials.

Pada scope khusus klien, tambahkan mapper Group Membership: Token Claim Name groups, Full group path nonaktif, Add to ID
token aktif. Jadikan profile dan email scope default. Buat repovio-admins, repovio-managers dan repovio-viewers,
tetapkan pengguna lalu petakan nama grup lengkap ke peran Repovio yang sesuai. Peran realm bukan keanggotaan grup.

```text
Issuer: https://auth.example.com/realms/repovio
Discovery: https://auth.example.com/realms/repovio/.well-known/openid-configuration
Redirect URI: https://repovio.example.com/api/v1/auth/oidc/callback
Client ID: repovio
Scopes: openid profile email
Groups claim: groups
SYSTEM_ADMIN: repovio-admins
MANAGER: repovio-managers
VIEWER: repovio-viewers
```

Referensi: [Keycloak](https://www.keycloak.org/docs/latest/server_admin/index.html#_oidc_clients)

<a id="oidc-entra-id"></a>

#### Microsoft Entra ID

Di Entra ID → App registrations, buat aplikasi satu tenant dengan platform Web dan callback persis di bawah, tanpa
penerbitan token implisit. Salin Application (client) ID dan Directory (tenant) ID. Buat rahasia klien dan salin Value,
bukan ID rahasianya. Gunakan ID tenant pada issuer v2, bukan common atau organizations.

Di Token configuration, tambahkan groups pada ID token untuk grup keamanan dengan Group ID. Buat tiga grup, tetapkan
pengguna dan petakan ID objek grup ke SYSTEM_ADMIN, MANAGER dan VIEWER. Nama tampilan tidak cocok dengan GUID. Filter
grup yang ditetapkan mungkin memerlukan lisensi Entra yang sesuai. Gunakan S256 PKCE dan tanda tangan asimetris;
perbarui rahasia sebelum kedaluwarsa.

Repovio menolak penanda kelebihan grup meskipun akses Viewer tanpa kecocokan diaktifkan. Repovio tidak mengikuti sumber
claim eksternal atau mengakses Microsoft Graph. Kurangi keanggotaan yang diterbitkan atau filter grup; izin Graph tidak
mengatasinya.

```text
Issuer: https://login.microsoftonline.com/TENANT_ID/v2.0
Discovery: https://login.microsoftonline.com/TENANT_ID/v2.0/.well-known/openid-configuration
Redirect URI: https://repovio.example.com/api/v1/auth/oidc/callback
Scopes: openid profile email
Groups claim: groups
SYSTEM_ADMIN: ADMIN_GROUP_OBJECT_ID
MANAGER: MANAGER_GROUP_OBJECT_ID
VIEWER: VIEWER_GROUP_OBJECT_ID
```

Referensi:
[Microsoft Entra ID](https://learn.microsoft.com/en-us/security/zero-trust/develop/configure-tokens-group-claims-app-roles)

<a id="oidc-auth0"></a>

#### Auth0

Buat Regular Web Application, daftarkan callback persis pada Allowed Callback URLs, aktifkan Authorization Code dengan
S256 PKCE dan pilih RS256. Atur Token Endpoint Authentication Method ke Basic. Salin client ID dan rahasia. Gunakan
issuer dari discovery tenant atau domain kustom yang dipilih, termasuk garis miring terakhir; jangan campur domain.

Buat Action Login / Post Login dari contoh di bawah, ganti REPLACE_WITH_REPOVIO_CLIENT_ID, deploy dan tambahkan ke Login
flow. Administrator mengatur app_metadata.repovio_groups tiap pengguna sebagai array berisi repovio-admins,
repovio-managers atau repovio-viewers; jangan gunakan user_metadata yang dapat diedit pengguna untuk otorisasi. Auth0
tidak menerbitkan grup ini otomatis; claim pada access token saja tidak cukup. Di Repovio, gunakan nama claim namespaced
lengkap dan petakan ketiga nilai ke perannya.

```text
Issuer: https://YOUR_TENANT.REGION.auth0.com/
Discovery: https://YOUR_TENANT.REGION.auth0.com/.well-known/openid-configuration
Redirect URI: https://repovio.example.com/api/v1/auth/oidc/callback
Scopes: openid profile email
Groups claim: https://repovio.example.com/groups
SYSTEM_ADMIN: repovio-admins
MANAGER: repovio-managers
VIEWER: repovio-viewers
```

```javascript
/** Add administratively managed Repovio groups to this application's ID token. */
exports.onExecutePostLogin = async (event, api) => {
  if (event.client.client_id !== 'REPLACE_WITH_REPOVIO_CLIENT_ID') return;
  const groups = event.user.app_metadata?.repovio_groups;
  api.idToken.setCustomClaim('https://repovio.example.com/groups', Array.isArray(groups) ? groups : []);
};
```

Referensi: [Auth0](https://auth0.com/docs/secure/tokens/json-web-tokens/create-custom-claims)

<a id="verify-oidc-providers"></a>

#### Validasi dan pemecahan masalah

Untuk setiap penyedia, daftarkan OIDC_CALLBACK_URL persis, minta openid profile email dan gunakan Authorization Code
dengan S256 PKCE serta tanda tangan asimetris. Simpan issuer, client ID, rahasia, scopes dan claim grup di Pengaturan →
Autentikasi lalu periksa koneksi. Discovery tidak memverifikasi grup pengguna.

Uji SYSTEM_ADMIN, MANAGER, VIEWER dan pengguna tanpa penetapan yang harus ditolak saat Viewer tanpa kecocokan
dinonaktifkan. Periksa ejaan grup, jalur Keycloak, ID objek Entra dan claim namespaced Auth0 pada ID token. Pertahankan
administrator lokal untuk pemulihan. Grup OIDC hanya memberi peran global; akses repositori memerlukan izin Repovio
terpisah. Konfigurasikan satu penyedia saja.

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
