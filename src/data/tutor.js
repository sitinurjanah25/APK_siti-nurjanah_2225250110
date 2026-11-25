// Isi panel Asisten Belajar "Kak Carta" (teks saja, tanpa logika).
// Nama tahap RMT di sini hanya cadangan: nama resmi dikirim server dari server/prompts/pedagogy.js.

export const GREETING =
  'Hai! Aku **Kak Carta** 👋 Aku tidak akan langsung kasih jawaban, tapi aku temani kamu berpikir langkah demi langkah. Ceritakan dulu, soalnya tentang apa?';

/** Tahapan RMT (urutan tampil di indikator). */
export const RMT_STAGES = [
  { id: 1, name: 'Orientasi', icon: '🔍' },
  { id: 2, name: 'Alat Konsep', icon: '📐' },
  { id: 3, name: 'Langkah Bertahap', icon: '👣' },
  { id: 4, name: 'Refleksi', icon: '🪞' },
];

/**
 * Mode bantuan bertingkat (Intrinsic Load). `level` dikirim ke server sebagai level_petunjuk.
 * `auto` = naik sendiri kalau siswa sering salah / sering minta bantuan.
 */
export const HELP_MODES = [
  { id: 'auto', level: null, label: 'Otomatis', icon: '✨', desc: 'Bantuan naik sendiri kalau kamu kesulitan' },
  { id: 'light', level: 1, label: 'Ringan', icon: '💡', desc: 'Satu pertanyaan pemantik saja' },
  { id: 'step', level: 2, label: 'Langkah', icon: '👣', desc: 'Pengingat konsep + langkah perantara' },
  { id: 'analogy', level: 3, label: 'Analogi', icon: '🧩', desc: 'Contoh serupa dengan angka berbeda' },
];

/**
 * Pertanyaan cepat, mengikuti proses Mathematical Literacy
 * (merumuskan → menerapkan → menafsirkan) + refleksi (Germane Load).
 */
export const QUICK_PROMPTS = [
  { label: '📖 Pahami soalnya', text: 'Bantu aku memahami situasi soal ini dulu. Apa yang diketahui dan ditanyakan?' },
  { label: '👣 Langkah berikutnya', text: 'Aku sudah paham soalnya. Apa langkah berikutnya yang harus aku lakukan?' },
  { label: '🗺️ Apa artinya?', text: 'Aku sudah dapat hasilnya. Bagaimana cara mengartikan hasil ini ke situasi di soal?' },
  { label: '🗣️ Cek alasanku', text: 'Aku mau menjelaskan alasanku. Tolong tanya balik supaya aku bisa mengecek sendiri.' },
];
