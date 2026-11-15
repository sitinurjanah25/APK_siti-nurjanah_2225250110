/** Jumlah jawaban benar. `answers[i]` = indeks pilihan untuk soal ke-i. */
export function countCorrect(questions, answers) {
  return questions.reduce((sum, q, i) => sum + (answers[i] === q.correct ? 1 : 0), 0);
}

export function scoreMessage(score, total) {
  const ratio = total ? score / total : 0;
  if (ratio === 1) return 'Sempurna! Semua jawaban benar.';
  if (ratio >= 0.8) return 'Hebat! Hampir semua benar.';
  if (ratio >= 0.6) return 'Bagus! Lihat lagi soal yang salah.';
  return 'Ayo ulangi modulnya, lalu coba lagi.';
}

const BEST_KEY = 'bkk-quiz-best';

/** Skor terbaik Latihan Soal yang tersimpan, atau null. */
export function loadBestScore(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(BEST_KEY);
    const n = raw == null ? NaN : Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

/** Simpan skor kalau lebih tinggi dari skor terbaik. Mengembalikan skor terbaik. */
export function saveBestScore(score, storage = globalThis.localStorage) {
  const best = loadBestScore(storage);
  if (best !== null && best >= score) return best;
  try {
    storage?.setItem(BEST_KEY, String(score));
  } catch {
    // penyimpanan penuh atau diblokir: abaikan
  }
  return score;
}
