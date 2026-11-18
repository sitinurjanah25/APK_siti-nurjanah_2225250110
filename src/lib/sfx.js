// Efek suara kecil yang disintesis dengan Web Audio API.
// Tanpa file audio: langsung bunyi, jalan offline (APK), dan tidak ada urusan lisensi.
import { useSyncExternalStore } from 'react';

const MUTE_KEY = 'cartes:sfx-muted';

let ctx = null;
let muted = (() => {
  try {
    return globalThis.localStorage?.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
})();
const listeners = new Set();

function audio() {
  if (muted) return null;
  try {
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AC) return null;
    ctx ??= new AC();
    // Browser menahan audio sampai ada sentuhan/klik; panggilan dari klik akan membukanya.
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** Satu nada pendek dengan selubung (envelope) halus supaya tidak "klik". */
function tone(ac, { freq, to = freq, start = 0, dur = 0.12, type = 'sine', vol = 0.18 }) {
  const t0 = ac.currentTime + start;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to !== freq) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

// Waktu bunyi terakhir: dipakai supaya klik global tidak dobel dengan bunyi lain.
let lastPlayed = 0;
const now = () => globalThis.performance?.now?.() ?? Date.now();

const play = (fn) => () => {
  const ac = audio();
  if (!ac) return;
  lastPlayed = now();
  fn(ac);
};

export const sfx = {
  /** Klik tombol biasa */
  click: play((ac) => tone(ac, { freq: 660, to: 520, dur: 0.06, type: 'triangle', vol: 0.12 })),
  /** Memilih jawaban A–D */
  select: play((ac) => {
    tone(ac, { freq: 520, dur: 0.05, type: 'triangle', vol: 0.12 });
    tone(ac, { freq: 780, start: 0.05, dur: 0.07, type: 'triangle', vol: 0.12 });
  }),
  /** Jawaban benar: arpeggio ceria C–E–G–C */
  correct: play((ac) => {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(ac, { freq: f, start: i * 0.08, dur: 0.18, vol: 0.16 }));
  }),
  /** Jawaban salah / waktu habis: dengung rendah yang lembut */
  wrong: play((ac) => {
    tone(ac, { freq: 220, to: 150, dur: 0.22, type: 'square', vol: 0.07 });
    tone(ac, { freq: 180, to: 120, start: 0.18, dur: 0.26, type: 'square', vol: 0.07 });
  }),
  /** Mengetuk titik di grid */
  tap: play((ac) => tone(ac, { freq: 880, to: 990, dur: 0.05, type: 'sine', vol: 0.1 })),
  /** Bunyi benar/salah sekaligus, misalnya: sfx.answer(hasil.correct) */
  answer: (correct) => (correct ? sfx.correct() : sfx.wrong()),
  /** Kuis selesai: fanfare singkat */
  finish: play((ac) => {
    [392, 523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
      tone(ac, { freq: f, start: i * 0.1, dur: i === 4 ? 0.45 : 0.16, type: 'triangle', vol: 0.16 }),
    );
  }),
};

/* ---------- Status bisu (mute) ---------- */

export function setMuted(value) {
  muted = !!value;
  try {
    globalThis.localStorage?.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {
    /* abaikan */
  }
  listeners.forEach((l) => l());
}

export const useMuted = () =>
  useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => muted,
  );

/* ---------- Bunyi klik untuk semua tombol ---------- */

const CLICKABLE = 'button, a[href], [role="button"], [role="tab"], summary, input[type="checkbox"], input[type="radio"]';

/**
 * Pasang sekali (di main.jsx): setiap tombol yang diklik berbunyi "klik".
 * Listener ada di `document` (fase bubble) sehingga berjalan SETELAH handler React;
 * kalau handler itu sudah membunyikan suara lain (benar/salah/pilih), klik dilewati.
 * Tambahkan data-sfx="off" pada elemen yang tidak perlu berbunyi.
 */
export function installClickSound() {
  if (typeof document === 'undefined' || installClickSound.done) return;
  installClickSound.done = true;
  document.addEventListener('click', (e) => {
    const el = e.target instanceof Element ? e.target.closest(CLICKABLE) : null;
    if (!el || el.disabled || el.closest('[data-sfx="off"]')) return;
    if (now() - lastPlayed < 60) return;
    sfx.click();
  });
}
