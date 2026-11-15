// Mesin game Quest: skor, waktu, nyawa, dan pemeriksaan jawaban.
import questData from '../data/quest.json';
import { fmtNum, fmtPoint, quadrantOf, ROMAN } from './coords.js';
import { DIAG, diagnosePoint } from './diagnose.js';

export const LEVELS = questData.levels;
export const MAX_LIVES = 3;
export const BASE_POINTS = 100;
export const TIME_BONUS_PER_SECOND = 2;
export const STREAK_BONUS = 20;

export const findLevel = (id) => LEVELS.find((l) => l.id === id) ?? null;

/** Level terbuka kalau level pertama, atau level sebelumnya sudah lulus. */
export function isUnlocked(levelId, cleared) {
  const i = LEVELS.findIndex((l) => l.id === levelId);
  return i === 0 || (i > 0 && !!cleared?.[LEVELS[i - 1].id]);
}

/** Poin untuk jawaban benar: dasar + bonus sisa waktu + bonus beruntun. */
export function pointsFor(timeLeft, streak) {
  return BASE_POINTS + Math.max(0, timeLeft) * TIME_BONUS_PER_SECOND + streak * STREAK_BONUS;
}

/* ---------- Titik 3D ---------- */

export const fmtPoint3 = ([x, y, z]) => `(${fmtNum(x)}, ${fmtNum(y)}, ${fmtNum(z)})`;

export const DIAG3 = Object.freeze({
  CORRECT: 'CORRECT',
  SWAP_XY: 'SWAP_XY',
  SIGN_X: 'SIGN_X',
  SIGN_Y: 'SIGN_Y',
  Z_WRONG: 'Z_WRONG',
  OFF_BY_ONE: 'OFF_BY_ONE',
  OTHER: 'OTHER',
});

export function diagnosePoint3([x, y, z], [ax, ay, az]) {
  if (ax === x && ay === y && az === z) return DIAG3.CORRECT;
  if (az === z && x !== y && ax === y && ay === x) return DIAG3.SWAP_XY;
  if (az === z && ay === y && x !== 0 && ax === -x) return DIAG3.SIGN_X;
  if (az === z && ax === x && y !== 0 && ay === -y) return DIAG3.SIGN_Y;
  if (ax === x && ay === y) return DIAG3.Z_WRONG;
  if (Math.abs(ax - x) + Math.abs(ay - y) + Math.abs(az - z) === 1) return DIAG3.OFF_BY_ONE;
  return DIAG3.OTHER;
}

const MSG3 = {
  SWAP_XY: 'Hampir! **x dan y tertukar**. Urutannya selalu (x, y, z).',
  SIGN_X: 'Arah **x** terbalik. x positif = ke kanan, x negatif = ke kiri.',
  SIGN_Y: 'Arah **y** terbalik. y positif = ke belakang, y negatif = ke depan.',
  Z_WRONG: 'x dan y sudah tepat! Cek lagi **ketinggiannya (z)**.',
  OFF_BY_ONE: 'Sedikit lagi! Ada satu angka yang meleset 1 kotak.',
  OTHER: 'Belum tepat. Mulai dari O: jalan x, lalu y, lalu naik z.',
};

const MSG2 = {
  [DIAG.SWAP]: 'Hampir! **x dan y tertukar**. Mendatar dulu (x), baru naik/turun (y).',
  [DIAG.SIGN_X]: 'Arah **x** terbalik. x positif = kanan, x negatif = kiri.',
  [DIAG.SIGN_Y]: 'Arah **y** terbalik. y positif = atas, y negatif = bawah.',
  [DIAG.SIGN_BOTH]: 'Kedua arahnya terbalik. Cek tanda + dan −.',
  [DIAG.OFF_BY_ONE]: 'Sedikit lagi! Hitung ulang satu kotak.',
  [DIAG.OTHER]: 'Belum tepat. Mulai dari O: mendatar dulu, baru naik/turun.',
};

export const QUADRANT_CHOICES = [
  { label: 'Kuadran I', value: 1 },
  { label: 'Kuadran II', value: 2 },
  { label: 'Kuadran III', value: 3 },
  { label: 'Kuadran IV', value: 4 },
  { label: 'Pada sumbu (bukan kuadran)', value: null },
];

/** Jawaban benar dalam bentuk teks (ditampilkan saat waktu habis). */
export function answerText(ch) {
  switch (ch.kind) {
    case 'plot2d':
      return fmtPoint(ch.target);
    case 'read2d':
      return fmtPoint(ch.point);
    case 'quadrant': {
      const q = quadrantOf(ch.point);
      return q ? `Kuadran ${ROMAN[q]}` : 'pada sumbu';
    }
    case 'choice':
      return ch.options.find((o) => o.correct)?.text ?? '';
    case 'read3d':
      return fmtPoint3(ch.point);
    case 'plot3d':
      return fmtPoint3(ch.target);
    default:
      return '';
  }
}

/** Periksa jawaban. Hasil: { correct, message }. */
export function checkAnswer(ch, answer) {
  switch (ch.kind) {
    case 'plot2d':
    case 'read2d': {
      const target = ch.kind === 'plot2d' ? ch.target : ch.point;
      const d = diagnosePoint(target, answer);
      if (d === DIAG.CORRECT) return { correct: true, message: `Tepat! Rumah ada di ${fmtPoint(target)}.` };
      return { correct: false, message: MSG2[d] ?? MSG2[DIAG.OTHER] };
    }
    case 'quadrant': {
      const q = quadrantOf(ch.point);
      if (answer === q) {
        return { correct: true, message: q ? `Tepat! Kuadran ${ROMAN[q]}.` : 'Tepat! Titik di sumbu bukan milik kuadran mana pun.' };
      }
      if (q === null) return { correct: false, message: 'Ada angka **0** di titik ini, jadi letaknya **pada sumbu**.' };
      return { correct: false, message: 'Lihat tanda x dan y: I (+,+), II (−,+), III (−,−), IV (+,−).' };
    }
    case 'choice': {
      const opt = ch.options[answer];
      return opt?.correct
        ? { correct: true, message: 'Tepat!' }
        : { correct: false, message: 'Belum tepat. Baca lagi soalnya pelan-pelan.' };
    }
    case 'read3d':
    case 'plot3d': {
      const target = ch.kind === 'plot3d' ? ch.target : ch.point;
      const d = diagnosePoint3(target, answer);
      if (d === DIAG3.CORRECT) return { correct: true, message: `Tepat! Rumah terpasang di ${fmtPoint3(target)}.` };
      return { correct: false, message: MSG3[d] };
    }
    default:
      return { correct: false, message: 'Belum tepat.' };
  }
}

/* ---------- State game (reducer) ---------- */

export function startGame(level) {
  return {
    levelId: level.id,
    total: level.challenges.length,
    seconds: level.seconds,
    index: 0,
    score: 0,
    lives: MAX_LIVES,
    streak: 0,
    timeLeft: level.seconds,
    status: 'playing', // playing | correct | timeout | over | done
    feedback: null, // { tone: 'ok' | 'err' | 'info', message }
    lastGain: 0,
    hitCount: 0, // bertambah setiap kali salah (untuk animasi)
    hitIndex: -1, // soal tempat kesalahan terakhir
  };
}

export function gameReducer(state, action) {
  switch (action.type) {
    case 'TICK': {
      if (state.status !== 'playing') return state;
      const timeLeft = state.timeLeft - 1;
      if (timeLeft > 0) return { ...state, timeLeft };
      const lives = state.lives - 1;
      return {
        ...state,
        timeLeft: 0,
        lives,
        streak: 0,
        hitCount: state.hitCount + 1,
        hitIndex: state.index,
        status: lives <= 0 ? 'over' : 'timeout',
        feedback: { tone: 'err', message: `Waktu habis! Jawabannya: **${action.answer}**.` },
      };
    }
    case 'ANSWER': {
      if (state.status !== 'playing') return state;
      if (action.correct) {
        const gain = pointsFor(state.timeLeft, state.streak);
        return {
          ...state,
          score: state.score + gain,
          streak: state.streak + 1,
          lastGain: gain,
          status: 'correct',
          feedback: { tone: 'ok', message: action.message },
        };
      }
      const lives = state.lives - 1;
      return {
        ...state,
        lives,
        streak: 0,
        hitCount: state.hitCount + 1,
        hitIndex: state.index,
        status: lives <= 0 ? 'over' : 'playing',
        feedback: { tone: 'err', message: action.message },
      };
    }
    case 'NEXT': {
      if (state.status !== 'correct' && state.status !== 'timeout') return state;
      if (state.index + 1 >= state.total) return { ...state, status: 'done', feedback: null };
      return { ...state, index: state.index + 1, timeLeft: state.seconds, status: 'playing', feedback: null, lastGain: 0 };
    }
    default:
      return state;
  }
}

/** Bintang hasil level: sama dengan sisa nyawa (minimal 1 kalau lulus). */
export const starsFor = (state) => (state.status === 'done' ? Math.max(1, state.lives) : 0);
