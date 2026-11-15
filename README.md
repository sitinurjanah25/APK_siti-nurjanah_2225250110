# c-quest.sn25 — Kode Sumber

Aplikasi belajar Sistem Koordinat Kartesius (Kelas 8 SMP) lewat peta kota.
Dibuat dengan React 18, React Router 6 (HashRouter), Tailwind CSS 3, CSS Modules, dan three.js (Kota 3D).

## Menjalankan di komputer

```bash
npm install
npm run dev      # buka alamat yang muncul, misalnya http://localhost:5173
```

## Ikon aplikasi

Ikon digambar oleh `scripts/make-icon.mjs` (kisi 3D neon, sumbu X/Y/Z oranye-tembaga, rumah dengan penanda tujuan).
Setelah mengubah skrip itu, jalankan `npm run icons` untuk membuat ulang `public/icon.svg`, `icon-192.png`, dan `icon-512.png`.

## Build untuk GitHub Pages

```bash
npm run build    # hasilnya ada di folder dist/
```

Salin **isi** folder `dist/` ke akar (root) branch `gh-pages`, lalu commit dan push.

## Struktur folder

| Folder | Isi |
| --- | --- |
| `src/pages/` | Halaman: Beranda, Cek Awal, Misi, Latihan, Bidang Bebas, Kota 3D, Uji Coba, Mode Guru |
| `src/components/` | Komponen: bidang koordinat SVG, pemutar pelajaran, form isian, dll. |
| `src/data/` | Materi modul (`modules/m0–m6.json`), misi, soal latihan, cek awal, teks umpan balik |
| `src/lib/` | Fungsi bantu: koordinat, diagnosis kesalahan, geometri grid |
| `src/state/` | Progres siswa (disimpan di localStorage) |
| `src/three/` | Kota 3D (three.js) |

## Yang belum selesai

- **Ikut Uji Coba** (`src/pages/TrialPage.jsx`, milestone M5-5)
- **Mode Guru** (`src/pages/TeacherPage.jsx`, milestone M4-4 / M5-7)
