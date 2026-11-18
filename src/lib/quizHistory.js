// Identitas siswa & riwayat percobaan Kuis. Disimpan di localStorage HP/browser ini saja.

const STUDENT_KEY = 'cartes:quiz-student';
const HISTORY_KEY = 'cartes:quiz-history';

function read(key, fallback) {
  try {
    const raw = globalThis.localStorage?.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    globalThis.localStorage?.setItem(key, JSON.stringify(value));
  } catch {
    /* penyimpanan penuh/diblokir: abaikan */
  }
}

const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
/** Kunci pencocokan siswa: nama + kelas, tanpa beda huruf besar/kecil & spasi. */
const studentKey = ({ nama, kelas }) => `${clean(nama).toLowerCase()}|${clean(kelas).toLowerCase()}`;

export function loadStudent() {
  const s = read(STUDENT_KEY, null);
  return s && clean(s.nama) && clean(s.kelas) ? { nama: clean(s.nama), kelas: clean(s.kelas) } : null;
}

export function saveStudent({ nama, kelas }) {
  const s = { nama: clean(nama), kelas: clean(kelas) };
  write(STUDENT_KEY, s);
  return s;
}

export function clearStudent() {
  try {
    globalThis.localStorage?.removeItem(STUDENT_KEY);
  } catch {
    /* abaikan */
  }
}

export const loadHistory = () => {
  const h = read(HISTORY_KEY, []);
  return Array.isArray(h) ? h : [];
};

/** Semua percobaan milik satu siswa, urut dari percobaan pertama. */
export const attemptsOf = (student, history = loadHistory()) =>
  history.filter((a) => studentKey(a) === studentKey(student)).sort((a, b) => a.percobaan - b.percobaan);

/** Catat satu percobaan baru. Nomor percobaan dihitung per siswa (nama + kelas). */
export function recordAttempt(student, { skor, benar, total }) {
  const history = loadHistory();
  const percobaan = attemptsOf(student, history).length + 1;
  const attempt = {
    nama: clean(student.nama),
    kelas: clean(student.kelas),
    skor,
    benar,
    total,
    waktu: new Date().toISOString(),
    percobaan,
  };
  write(HISTORY_KEY, [...history, attempt]);
  return attempt;
}

/** Waktu yang mudah dibaca: 17/11/2026 20.31 */
export const fmtTime = (iso) => {
  try {
    return new Date(iso).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
};

/* ---------- Ekspor CSV ---------- */

const cell = (v) => {
  const s = String(v ?? '');
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/**
 * Laporan CSV. Pemisah titik koma (;) supaya langsung rapi di Excel berbahasa Indonesia.
 * Kolom: Nama, Kelas, Skor, Benar, Waktu, Percobaan Ke-.
 */
export function toCsv(attempts) {
  const header = ['Nama', 'Kelas', 'Skor', 'Benar', 'Waktu', 'Percobaan Ke-'];
  // "8 dari 10" (bukan 8/10) supaya Excel tidak mengubahnya jadi tanggal
  const rows = attempts.map((a) => [a.nama, a.kelas, a.skor, `${a.benar} dari ${a.total}`, fmtTime(a.waktu), a.percobaan]);
  return [header, ...rows].map((r) => r.map(cell).join(';')).join('\r\n');
}

const safeName = (s) => clean(s).replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_|_$/g, '') || 'siswa';

export const reportFileName = (student) =>
  `laporan-kuis_${safeName(student.nama)}_${safeName(student.kelas)}_${new Date().toISOString().slice(0, 10)}.csv`;

/**
 * Unduh file CSV. Di browser biasa memakai link unduhan; kalau tidak bisa (mis. di beberapa WebView),
 * mencoba menu Bagikan; kalau tetap tidak bisa, mengembalikan false agar UI menawarkan "Salin".
 */
export async function downloadCsv(text, fileName) {
  const blob = new Blob(['﻿', text], { type: 'text/csv;charset=utf-8' });
  try {
    const file = new File([blob], fileName, { type: 'text/csv' });
    if (navigator.canShare?.({ files: [file] }) && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
      await navigator.share({ files: [file], title: fileName });
      return true;
    }
  } catch (e) {
    if (e?.name === 'AbortError') return true; // siswa menutup menu Bagikan
  }
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return true;
  } catch {
    return false;
  }
}
