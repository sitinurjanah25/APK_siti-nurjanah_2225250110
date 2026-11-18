# Backend Asisten Belajar (Kak Carta)

GitHub Pages hanya menyajikan file statis, jadi API key DeepSeek **tidak boleh** ditaruh di kode React
(`VITE_...` di `.env` tetap ikut ter-bundle dan bisa dilihat siapa saja). Karena itu key disimpan di
backend kecil ini (Cloudflare Worker, paket gratis cukup).

```
Aplikasi (GitHub Pages / APK)  ──POST /chat──▶  Cloudflare Worker  ──▶  DeepSeek API
   tanpa API key                                 menyimpan API key
   tanpa kunci jawaban                           + prompt RMT di server
```

## Cara memasang (sekali saja)

1. Buat akun gratis di https://dash.cloudflare.com dan API key di https://platform.deepseek.com
2. Di folder ini:
   ```bash
   cd server
   npx wrangler login
   npx wrangler secret put DEEPSEEK_API_KEY   # tempel API key DeepSeek
   npx wrangler deploy
   ```
3. Wrangler menampilkan alamat seperti `https://cartes-play-tutor.<akun>.workers.dev`.
4. Di folder `source/`, buat file `.env.production` (dan `.env.local` untuk `npm run dev`):
   ```
   VITE_TUTOR_URL=https://cartes-play-tutor.<akun>.workers.dev
   ```
   Ini hanya alamat, **bukan rahasia**, jadi aman ikut ter-bundle.
5. `npm run build`, lalu publikasikan seperti biasa.

Kalau `VITE_TUTOR_URL` belum diisi, tombol Kak Carta tetap muncul tetapi memberi tahu bahwa asisten belum aktif.

## Desain pedagogis

Prompt lengkap ada di `tutor-worker.js` (`SYSTEM_PROMPT`). Ringkasnya:

| Aspek | Penerapan |
| --- | --- |
| **RMT** | 4 tahap mediasi: orientasi masalah → alat psikologis (istilah sumbu, arah, urutan) → pelaksanaan bertahap → refleksi/verifikasi. Satu tahap per balasan. |
| **Intrinsic load** | Masalah dipecah menjadi langkah kecil; satu ide dan maksimal satu pertanyaan per balasan. |
| **Extraneous load** | Balasan maksimal 3–4 kalimat, format koordinat konsisten, tanpa teori panjang. |
| **Germane load** | Pertanyaan yang membangun skema (hubungan 2D → 3D, arti z = 0, dll.). |
| **Literasi matematika** | Merumuskan konteks kota → titik/koordinat, menerapkan prosedur, menafsirkan hasil. |
| **Tangga petunjuk** | Level 1 pertanyaan pemantik → Level 2 petunjuk konsep → Level 3 contoh serupa dengan angka berbeda. Level naik otomatis sesuai jumlah salah dan jumlah permintaan bantuan. |
| **Tidak membocorkan jawaban** | Aplikasi hanya mengirim jenis soal, teks soal, tingkat kesulitan, jumlah salah, dan jenis kesalahan (mis. "x dan y tertukar"). Koordinat target **tidak pernah** dikirim. |

## Keamanan

- API key hanya ada sebagai secret Cloudflare.
- Hanya origin di `ALLOWED_ORIGINS` yang dilayani.
- Riwayat dibatasi 12 pesan terakhir dan 600 karakter per pesan; jawaban maksimal 300 token.
- Untuk penggunaan kelas yang lebih luas, tambahkan *Rate Limiting rule* di dashboard Cloudflare.
