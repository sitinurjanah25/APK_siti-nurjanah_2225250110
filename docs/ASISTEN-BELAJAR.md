# Asisten Belajar "Kak Carta": DeepSeek + RMT + Cognitive Load

Dokumen ini menjelaskan rancangan Asisten Belajar pada **cartes.play** (Tugas Tahap 2):
media pembelajaran Sistem Koordinat Kartesius kelas 8 SMP dengan fokus *Mathematical Literacy*.

## 1. Arsitektur

```
 Siswa (web / APK)                     Cloudflare Worker (backend aman)                Penyedia AI
┌───────────────────────┐  POST /chat  ┌──────────────────────────────────┐  HTTPS   ┌────────────────┐
│ TutorChat.jsx         │ ───────────▶ │ tutor-worker.js  (CORS, validasi) │ ───────▶ │ DeepSeek (utama)│
│  ├ RmtStageBar        │  messages +  │ prompts/pedagogy.js (RMT, CL, LM) │          │ Gemini (cadangan)│
│  ├ HelpModePicker     │  konteks soal│ providers.js (urutan + cadangan)  │          │ Workers AI       │
│  └ Quick prompts      │ ◀─────────── │  → { reply, stage, provider }     │ ◀─────── └────────────────┘
│ lib/tutor.js          │  balasan +   │ Secret: DEEPSEEK_API_KEY,         │
│ (konteks TANPA jawaban)│ tahap RMT    │         GEMINI_API_KEY            │
└───────────────────────┘              └──────────────────────────────────┘
```

**Mengapa API key tidak memakai `VITE_DEEPSEEK_API_KEY`?** Semua variabel `VITE_` ikut tertanam di
file JavaScript website dan APK, sehingga siapa pun bisa membaca dan menyalahgunakan kunci tersebut.
Karena itu kunci disimpan sebagai *secret* di backend, dan frontend hanya tahu alamat backend
(`VITE_TUTOR_URL`).

**Mengapa AI tidak bisa membocorkan jawaban?** Aplikasi hanya mengirim konteks (layar, jenis soal,
teks soal, jumlah salah, jenis kesalahan), **tidak pernah** mengirim kunci jawaban. Prompt juga
melarang AI memberi jawaban akhir.

## 2. Pemetaan teori ke fitur

| Teori | Wujud di aplikasi | File |
|---|---|---|
| **RMT** Tahap 1: Orientasi | AI meminta siswa menceritakan situasi, yang diketahui dan ditanyakan | `server/prompts/pedagogy.js` (`RMT_STAGES`) |
| **RMT** Tahap 2: Alat Konsep | AI memastikan istilah tepat: O, sumbu X/Y/Z, kuadran, urutan (x, y) | idem |
| **RMT** Tahap 3: Langkah Bertahap | Satu langkah per balasan, menunggu jawaban siswa | idem |
| **RMT** Tahap 4: Refleksi | Siswa memeriksa sendiri dan menjelaskan alasan | idem |
| Indikator tahap RMT | AI memberi penanda `[T1]`–`[T4]`; server memisahkannya; chat menampilkan bar tahap | `splitStage()`, `RmtStageBar.jsx` |
| **Intrinsic Load** | Bantuan bertingkat: Ringan (pemantik), Langkah (konsep + langkah perantara), Analogi (contoh dengan angka berbeda); Otomatis naik saat sering salah | `HELP_MODES`, `HelpModePicker.jsx`, `hintLevelFor()` |
| **Extraneous Load** | Balasan maks. 3–4 kalimat, satu pertanyaan, tanpa LaTeX; tampilan chat bersih; teks dirapikan | `STYLE_RULES`, `tidy()` di `TutorChat.jsx` |
| **Germane Load** | AI meminta alasan, menghubungkan 2D ke 3D dan peta nyata ke bidang; tombol "Cek alasanku" | `REFLECTION_RULES`, `QUICK_PROMPTS` |
| **Mathematical Literacy** | Merumuskan, menerapkan, menafsirkan; tombol cepat "Pahami soalnya", "Langkah berikutnya", "Apa artinya?" | `LITERACY_PHASES`, `src/data/tutor.js` |

### Menyesuaikan dengan ringkasan materi Pak Aan
Buka `server/prompts/pedagogy.js`, lalu ubah `name`, `goal`, dan `moves` pada `RMT_STAGES`
sesuai poin ringkasan. Jumlah tahap boleh berubah: penanda `[T1]…[Tn]` dibuat otomatis.
Kalau jumlah tahap berubah, samakan juga daftar `RMT_STAGES` di `src/data/tutor.js` (ikon dan nama
untuk indikator). Setelah itu jalankan `npx wrangler deploy` di folder `server`.

## 3. Menyalakan DeepSeek

1. Buat kunci di https://platform.deepseek.com/api_keys (isi saldo terlebih dahulu).
2. Simpan kunci di server (bukan di `.env` frontend):
   ```bash
   cd source/server
   npx wrangler secret put DEEPSEEK_API_KEY
   npx wrangler deploy
   ```
3. Urutan penyedia diatur `AI_PROVIDERS = "deepseek,gemini,workers-ai"` di `wrangler.toml`.
   Kalau DeepSeek belum diisi atau sedang gagal, server otomatis memakai Gemini atau Workers AI (gratis).

## 4. Pengujian

| # | Skenario | Langkah | Hasil yang diharapkan |
|---|---|---|---|
| 1 | Minta jawaban langsung | Ketik "kasih tau aja jawabannya" | Ditolak ramah + satu pertanyaan pemantik, tahap **Orientasi** |
| 2 | Bantuan Ringan | Pilih 💡 Ringan, tanya soal | Hanya satu pertanyaan, tanpa konsep atau angka |
| 3 | Bantuan Analogi | Pilih 🧩 Analogi | Contoh dengan angka atau situasi **berbeda**, lalu diminta meniru |
| 4 | Otomatis | Salah 2× di Quest, lalu buka chat | Keterangan "sekarang: Langkah" |
| 5 | Refleksi | Ketuk "🗣️ Cek alasanku" | AI bertanya balik "kenapa…?", tidak membenarkan langsung |
| 6 | Literasi | Ketuk "🗺️ Apa artinya?" | AI mengajak menafsirkan hasil ke konteks peta kota |
| 7 | Keamanan | Panggil backend dari situs lain | `403 Origin tidak diizinkan` |
| 8 | Cadangan | DeepSeek dimatikan atau gagal | Tetap dijawab (`provider: gemini`) |

Uji backend tanpa aplikasi:
```bash
curl -X POST https://cartes-play-tutor.<akun>.workers.dev/chat \
  -H "Origin: https://sitinurjanah25.github.io" -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"jawabannya apa?"}],"context":{"hintLevel":1}}'
```
