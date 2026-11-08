---
title: 'Pengaturan'
description: 'Temukan pengaturan pribadi dan autentikasi khusus administrator serta kontrol sistem.'
---

<a id="settings-tabs"></a>

## Tab pengaturan

Buka **Pengaturan** dari menu pengguna. Setiap pengguna yang diautentikasi dapat mengakses**Umum** dan**MCP**.
Administrator sistem juga melihat**Otentikasi** dan**Sistem**. Pengelompokan administrator sidebar tidak mencegah
pengguna lain yang masuk membuka pengaturan pribadi mereka melalui menu pengguna.

Umum berisi [Profil](/docs/next/profile), [Avatar](/docs/next/avatar), dan, untuk akun lokal,
[Kata sandi](/docs/next/password). Pengguna yang dikelola OIDC melihat pemberitahuan manajemen identitas alih-alih
formulir profil/kata sandi lokal, namun masih dapat mengedit avatar mereka. [MCP](/docs/next/mcp) mengelola token akses
baca-saja pribadi.

<a id="related-preferences"></a>

## Preferensi terkait

[Bahasa](/docs/next/language) dan [Penampilan](/docs/next/appearance) dipilih dari kontrol aplikasi/pengguna.
Administrator mengonfigurasi [Otentikasi OIDC](/docs/next/authentication) dan
[Default sistem](/docs/next/settings-system) di tabnya masing-masing. Tab yang hilang mungkin sesuai dengan peran Anda;
mengubah URL tidak memberikan otorisasi. Coba lagi permintaan pengaturan yang gagal hanya setelah memeriksa konektivitas
API.
