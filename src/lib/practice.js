// Latihan acak untuk menu Latihan: soal 3D dibuat baru setiap kali main.
import { fmtPoint3, getDifficulty } from './quest.js';

export const PRACTICE_RANGE = 5;
export const PRACTICE_Z_MAX = 5;
export const PRACTICE_COUNT = 6;

/** Batas angka per tingkat kesulitan. Makin sulit, makin banyak angka negatif. */
const BOUNDS = {
  easy: { xy: [0, 4], z: [0, 3], seconds: 60 },
  medium: { xy: [-4, 4], z: [0, 4], seconds: 60 },
  hard: { xy: [-5, 5], z: [0, 5], seconds: 60 },
};

/** Petunjuk yang muncul di kartu soal, sesuai tingkat kesulitan. */
export const PRACTICE_HINTS = {
  easy: 'Petunjuk: ikuti garis putus-putus dari rumah ke sumbu X, Y, lalu Z. Hitung kotaknya dari O, atau tekan 💡 untuk melihat angka sumbu.',
  medium: 'Petunjuk: tidak ada garis bantu. Hitung kotak dari titik O; tekan 💡 kalau butuh angka sumbu.',
  hard: null,
};

const randInt = (min, max, rnd) => min + Math.floor(rnd() * (max - min + 1));

function randomPoint(bounds, rnd) {
  const [lo, hi] = bounds.xy;
  return [randInt(lo, hi, rnd), randInt(lo, hi, rnd), randInt(bounds.z[0], bounds.z[1], rnd)];
}

/**
 * Buat satu "level" latihan dengan bentuk yang sama seperti level di quest.json,
 * supaya bisa dijalankan oleh mesin game Quest (gameReducer).
 * Koordinat target tidak pernah ditulis di peta 3D. Siswa harus membacanya sendiri.
 */
export function makePracticeLevel(difficulty, rnd = Math.random) {
  const diff = getDifficulty(difficulty);
  const bounds = BOUNDS[diff.id];
  const used = new Set();
  const challenges = [];

  while (challenges.length < PRACTICE_COUNT) {
    const p = randomPoint(bounds, rnd);
    const key = p.join(',');
    // Hindari titik kembar dan titik O (0, 0, 0) yang terlalu mudah.
    if (used.has(key) || (p[0] === 0 && p[1] === 0 && p[2] === 0)) continue;
    used.add(key);

    const i = challenges.length;
    // Selang-seling: 2 soal "baca rumah", lalu 1 soal "pasang rumah".
    if (i % 3 === 2) {
      challenges.push({
        id: `P-${i}`,
        kind: 'plot3d',
        text: `Pasang rumah di **${fmtPoint3(p)}**. Atur x, y, z lalu tekan Pasang Rumah.`,
        target: p,
      });
    } else {
      challenges.push({
        id: `P-${i}`,
        kind: 'read3d',
        text: 'Ada rumah di ruang 3D. Koordinatnya disembunyikan. Berapa **(x, y, z)**-nya?',
        point: p,
      });
    }
  }

  return {
    id: `latihan-${diff.id}`,
    number: null,
    title: `Latihan ${diff.label}`,
    seconds: bounds.seconds,
    challenges,
  };
}
