---
title: 'Lokalisasi antarmuka'
description: 'Bahasa antarmuka yang didukung, perilaku fallback, dan proses pemeliharaan terjemahan Repovio.'
---

> Cuplikan sumber yang diarsipkan. Label produk telah dinormalisasi menjadi Repovio. Untuk rilis historis ini, gunakan
> pengidentifikasi konfigurasi dan referensi kontainer dari file penerapan yang diberi tag tanpa perubahan.

Repovio mengirimkan antarmuka webnya dalam bahasa Inggris (`en`), Jerman (`de`), Spanyol (`es`), Prancis (`fr`), Italia
(`it`), Belanda (`nl`), Polandia (`pl`), dan Portugis (`pt`). Menu bahasa di header aplikasi tersedia untuk setiap
pengguna yang masuk. Memilih bahasa akan menyimpan preferensi di cookie browser `ezrepo-locale` dan menerapkannya pada
kunjungan berikutnya.

Bahasa Inggris adalah default dan fallback deterministik. Ketika preferensi browser atau cookie yang disimpan tidak
mengidentifikasi lokal yang didukung, Repovio menerjemahkan bahasa Inggris. Pemformatan tanggal, waktu, dan angka
menggunakan lokal yang dipilih.

<a id="adding-or-updating-a-locale"></a>

## Menambah atau memperbarui lokal

1. Tambahkan atau perbarui `apps/web/i18n/locales/<locale>.json` menggunakan `en.json` sebagai referensi kunci lengkap.
2. Daftarkan kode lokal, nama file, dan nama tampilan aslinya di `apps/web/nuxt.config.ts`.
3. Simpan semua kunci pesan di `en.json`; rangkaian pengujian web memeriksa paritas ini untuk setiap lokal yang
   dikirimkan.
4. Tambahkan pesan bahasa Inggris dan Jerman untuk setiap string antarmuka baru yang terlihat pengguna, lalu tambahkan
   terjemahan yang sesuai ke setiap lokal yang dikirimkan.
5. Jalankan `pnpm --filter @repovio/web test`, `pnpm --filter @repovio/web typecheck`, dan tes Penulis Drama yang
   terpengaruh.

Nama penyedia, nama repositori, nama alur kerja, dan data lain yang disediakan penyedia tetap tidak berubah karena bukan
salinan antarmuka Repovio.
