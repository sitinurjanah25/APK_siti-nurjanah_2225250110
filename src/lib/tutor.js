// Asisten belajar "Kak Carta": penghubung ke backend dan konteks soal yang sedang dibuka.
import { useEffect, useSyncExternalStore } from 'react';

/** Alamat backend (Cloudflare Worker). Bukan rahasia; API key ada di server. */
export const TUTOR_URL = (import.meta.env.VITE_TUTOR_URL ?? '').replace(/\/+$/, '');
export const tutorReady = () => TUTOR_URL !== '';

/* ---------- Konteks soal (tanpa kunci jawaban) ---------- */

let current = {};
const listeners = new Set();

function setTutorContext(ctx) {
  current = ctx ?? {};
  listeners.forEach((l) => l());
}

const subscribe = (l) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** Dibaca oleh panel chat. */
export const useTutorSnapshot = () => useSyncExternalStore(subscribe, () => current);

/**
 * Dipanggil oleh layar/permainan untuk memberi tahu tutor apa yang sedang dikerjakan siswa.
 * PENTING: jangan pernah memasukkan koordinat jawaban ke sini.
 * Isi `null` untuk tidak menyetel apa pun (misalnya saat komponen anak yang menyetelnya).
 */
export function useTutorContext(ctx) {
  const key = ctx === null ? null : JSON.stringify(ctx ?? {});
  useEffect(() => {
    if (key === null) return undefined;
    setTutorContext(JSON.parse(key));
    return () => setTutorContext({});
  }, [key]);
}

/** Penjelasan singkat jenis kesalahan (dari diagnosis aplikasi) untuk tutor. */
export const MISTAKE_TEXT = {
  SWAP_XY: 'nilai x dan y tertukar',
  SIGN_X: 'tanda/arah x terbalik',
  SIGN_Y: 'tanda/arah y terbalik',
  Z_WRONG: 'x dan y sudah benar, tetapi ketinggian z salah',
  OFF_BY_ONE: 'salah satu angka meleset 1 kotak',
  OTHER: 'beberapa angka belum tepat',
};

/**
 * Level tangga petunjuk (1 pemantik → 2 konsep → 3 contoh serupa).
 * Naik satu tingkat setiap 2 "tanda kesulitan" (salah jawab atau minta bantuan).
 */
export const hintLevelFor = (wrongAttempts = 0, helpRequests = 0) =>
  Math.min(3, 1 + Math.floor((wrongAttempts + helpRequests) / 2));

/* ---------- Panggilan ke backend ---------- */

export async function askTutor(messages, context, { signal } = {}) {
  if (!tutorReady()) throw new Error('not-configured');
  const res = await fetch(`${TUTOR_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, context }),
    signal,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data.reply;
}
