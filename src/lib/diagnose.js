import { QUADRANT_SIGNS, quadrantOf } from './coords.js';

// Jenis kesalahan yang sering dilakukan siswa.
export const DIAG = Object.freeze({
  CORRECT: 'CORRECT',
  SWAP: 'SWAP', // x dan y tertukar
  SIGN_X: 'SIGN_X',
  SIGN_Y: 'SIGN_Y',
  SIGN_BOTH: 'SIGN_BOTH',
  OFF_BY_ONE: 'OFF_BY_ONE',
  AXIS_SWAP: 'AXIS_SWAP', // jarak ke sumbu memakai koordinat yang salah
  NEGATIVE_DIST: 'NEGATIVE_DIST', // jarak ditulis negatif
  ON_AXIS: 'ON_AXIS',
  NOT_ON_AXIS: 'NOT_ON_AXIS',
  OTHER: 'OTHER',
});

const isNum = (n) => typeof n === 'number' && Number.isFinite(n);

/** Diagnosis jawaban berupa titik. */
export function diagnosePoint([x, y], answer) {
  if (!Array.isArray(answer) || !isNum(answer[0]) || !isNum(answer[1])) return DIAG.OTHER;
  const [ax, ay] = answer;
  if (ax === x && ay === y) return DIAG.CORRECT;
  if (x !== y && ax === y && ay === x) return DIAG.SWAP;
  if (x !== 0 && ax === -x && ay === y) return DIAG.SIGN_X;
  if (y !== 0 && ax === x && ay === -y) return DIAG.SIGN_Y;
  if (x !== 0 && y !== 0 && ax === -x && ay === -y) return DIAG.SIGN_BOTH;
  if (Math.abs(ax - x) + Math.abs(ay - y) === 1) return DIAG.OFF_BY_ONE;
  return DIAG.OTHER;
}

/** Diagnosis jawaban jarak titik ke sumbu ("X" atau "Y"). */
export function diagnoseDistance([x, y], axis, answer) {
  if (!isNum(answer)) return DIAG.OTHER;
  const right = Math.abs(axis === 'X' ? y : x);
  const other = Math.abs(axis === 'X' ? x : y);
  if (answer === right) return DIAG.CORRECT;
  if (answer < 0 && -answer === right) return DIAG.NEGATIVE_DIST;
  if (other !== right && Math.abs(answer) === other) return DIAG.AXIS_SWAP;
  return DIAG.OTHER;
}

/** Diagnosis jawaban kuadran (1–4, atau null untuk "di sumbu"). */
export function diagnoseQuadrant(point, answer) {
  const q = quadrantOf(point);
  if (answer === q) return DIAG.CORRECT;
  if (q === null) return DIAG.ON_AXIS;
  if (answer === null || !QUADRANT_SIGNS[answer]) return DIAG.NOT_ON_AXIS;
  const [sx, sy] = QUADRANT_SIGNS[q];
  const [ax, ay] = QUADRANT_SIGNS[answer];
  if (sx !== ax && sy === ay) return DIAG.SIGN_X;
  if (sx === ax && sy !== ay) return DIAG.SIGN_Y;
  return DIAG.SIGN_BOTH;
}
