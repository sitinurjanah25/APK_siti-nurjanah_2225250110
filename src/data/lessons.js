import { MODULES } from './modules.js';
import m0 from './modules/m0.json';
import m1 from './modules/m1.json';
import m2 from './modules/m2.json';
import m3 from './modules/m3.json';
import m4 from './modules/m4.json';
import m5 from './modules/m5.json';
import m6 from './modules/m6.json';

const CONTENT = { m0, m1, m2, m3, m4, m5, m6 };

/** Modul lengkap (info + langkah-langkah), diindeks per id. */
export const LESSONS = Object.fromEntries(
  MODULES.map((m) => [m.id, { ...m, steps: CONTENT[m.id]?.steps ?? [] }]),
);

/** Urutan modul utama (tanpa pemanasan). */
export const MAIN_MODULE_IDS = MODULES.filter((m) => !m.warmup).map((m) => m.id);
