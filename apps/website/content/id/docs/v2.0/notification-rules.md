---
title: 'Langganan acara'
description: 'Pilih peristiwa, filter repositori, dan pola alur kerja di dalam saluran.'
---

<a id="configure-subscriptions"></a>

## Konfigurasikan langganan

Administrator sistem membuka [saluran](/docs/v2.0/notifications) dan mengonfigurasi langganan acara dalam dialog
buat/editnya. Rute `/notifications/rules` yang lama dialihkan ke Saluran; tidak ada layar manajemen aturan terpisah.
Halaman ini mendokumentasikan alur kerja dialog saluran tersebut.

Pilih keberhasilan, kegagalan, atau pemulihan alur kerja; permintaan tarik dibuka, ditutup, dibuka kembali, atau
digabungkan; masalah dibuka, ditutup, atau dibuka kembali; dan mendukung ketergantungan, kode, atau peristiwa peringatan
rahasia yang dibuka/diselesaikan. Pilih batasan repositori untuk setiap acara. Pilihan repositori yang kosong berarti
semua repositori yang berlaku, bukan tidak satupun. Pola nama alur kerja hanya berlaku untuk kejadian alur kerja. Simpan
saluran untuk mempertahankan langganannya.

<a id="preview-matches"></a>

## Pratinjau pertandingan

Pratinjau hanya tersedia bila setidaknya satu peristiwa alur kerja dipilih; langganan non-alur kerja saja
menonaktifkannya. Gunakan pratinjau untuk memeriksa hingga 20 catatan alur kerja terbaru yang cocok sebelum
menyimpannya. Kecocokan mengonfirmasi kondisi filter saat ini terhadap data yang disimpan; itu tidak menyebabkan
pengiriman. Bedakan tidak ada kecocokan dengan pemberitahuan yang tidak pernah disinkronkan, gagal sinkronisasi, atau
pemberitahuan data sebagian. Perluas pemilihan repositori/pola atau periksa [Tugas sinkronisasi](/docs/v2.0/guide-jobs)
ketika data sumber tidak tersedia.

Sinkronisasi awal menetapkan garis dasar senyap untuk peristiwa siklus hidup dan tidak membanjiri saluran dengan
transisi lama terbuka/tertutup. Transisi yang diamati kemudian dapat menghasilkan penyampaian. Ketersediaan penyedia dan
izin baca membatasi peristiwa keamanan mana yang dapat diamati. Repovio tidak pernah mengubah sumber daya penyedia untuk
membuat aturan cocok.

Jika pratinjau atau penyimpanan gagal, pertahankan nilai formulir, periksa status API, dan coba lagi. Pratinjau kosong
saja tidak membuktikan bahwa tidak ada peristiwa di masa depan yang cocok atau bahwa setiap repositori yang dipilih
telah berhasil disinkronkan.
