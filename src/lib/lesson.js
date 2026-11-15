import texts from '../data/feedback.json';
import {
  describeOffset,
  distToXAxis,
  distToYAxis,
  fmtNum,
  fmtPoint,
  locationLabel,
  relativeTo,
} from './coords.js';
import { DIAG, diagnoseDistance, diagnosePoint, diagnoseQuadrant } from './diagnose.js';

const FEEDBACK = texts.feedback;
const HINTS = texts.hints;

/** Langkah yang butuh jawaban (bukan sekadar informasi). */
export const needsAnswer = (step) => step.kind !== 'info';

/** Langkah yang dijawab dengan mengetuk titik di grid. */
export const isTapStep = (step) => step.kind === 'plot' || step.kind === 'tap';

/** Jawaban benar untuk langkah "relative": posisi titik terhadap titik acuan. */
export const relativeTarget = (step) => relativeTo(step.point, step.ref);

function isOnTarget(accept, point) {
  if (!Array.isArray(point)) return false;
  const [x, y] = point;
  if (accept === 'axisX') return y === 0;
  if (accept === 'axisY') return x === 0;
  if (accept === 'origin') return x === 0 && y === 0;
  return false;
}

/** Periksa jawaban sebuah langkah, hasilnya kode DIAG. */
export function diagnoseStep(step, answer) {
  switch (step.kind) {
    case 'plot':
    case 'read':
      return diagnosePoint(step.target, answer);
    case 'relative':
      return diagnosePoint(relativeTarget(step), answer);
    case 'distance':
      return diagnoseDistance(step.point, step.axis, answer);
    case 'quadrant':
      return diagnoseQuadrant(step.point, answer);
    case 'choice':
      return step.options?.[answer]?.correct ? DIAG.CORRECT : DIAG.OTHER;
    case 'tap':
      return isOnTarget(step.accept, answer) ? DIAG.CORRECT : DIAG.OTHER;
    case 'reflect':
      return DIAG.CORRECT;
    default:
      return DIAG.OTHER;
  }
}

/** Isi {nama} di dalam teks. */
export function fillTemplate(text, vars = {}) {
  return text.replace(/\{(\w+)\}/g, (match, key) => (key in vars ? String(vars[key]) : match));
}

const dirX = (n) => (n > 0 ? 'kanan' : 'kiri');
const dirY = (n) => (n > 0 ? 'atas' : 'bawah');
const signOf = (n) => (n > 0 ? '+' : n < 0 ? '−' : '0');

function pointVars([x, y]) {
  return { a: fmtNum(x), b: fmtNum(y), dirX: dirX(x), dirY: dirY(y) };
}

/** Pesan umpan balik untuk hasil diagnosis. */
export function feedbackMessage(step, diagnosis, answer) {
  const correct = diagnosis === DIAG.CORRECT;
  switch (step.kind) {
    case 'plot':
    case 'read':
      return fillTemplate(FEEDBACK.plot[diagnosis] ?? FEEDBACK.plot.OTHER, {
        ...pointVars(step.target),
        point: fmtPoint(step.target),
      });
    case 'relative': {
      const target = relativeTarget(step);
      return fillTemplate(FEEDBACK.relative[diagnosis] ?? FEEDBACK.relative.OTHER, {
        ...pointVars(target),
        move: describeOffset(target),
      });
    }
    case 'distance': {
      const d = step.axis === 'X' ? distToXAxis(step.point) : distToYAxis(step.point);
      const key = diagnosis === DIAG.AXIS_SWAP ? `AXIS_SWAP_${step.axis}` : diagnosis;
      return fillTemplate(FEEDBACK.distance[key] ?? FEEDBACK.distance.OTHER, { d });
    }
    case 'quadrant':
      return fillTemplate(FEEDBACK.quadrant[diagnosis] ?? FEEDBACK.quadrant.OTHER, {
        ...pointVars(step.point),
        place: locationLabel(step.point),
      });
    case 'choice': {
      const opt = step.options?.[answer];
      if (opt?.feedback) return opt.feedback;
      return correct ? FEEDBACK.generic.CORRECT : FEEDBACK.generic.OTHER;
    }
    case 'tap':
      return correct
        ? (step.correctMessage ?? FEEDBACK.generic.CORRECT)
        : (step.wrongMessage ?? FEEDBACK.generic.OTHER);
    case 'reflect':
      return FEEDBACK.reflect.CORRECT;
    default:
      return correct ? FEEDBACK.generic.CORRECT : FEEDBACK.generic.OTHER;
  }
}

function moveText(axis, v) {
  if (v === 0) return HINTS.move[axis === 'x' ? 'zeroX' : 'zeroY'];
  return fillTemplate(HINTS.move[axis], {
    v: fmtNum(v),
    n: Math.abs(v),
    dir: axis === 'x' ? dirX(v) : dirY(v),
  });
}

/**
 * Petunjuk bertingkat untuk sebuah langkah. Setiap petunjuk berisi `text` dan
 * boleh punya efek ke grid: `path` (jejak), `guides`, atau `quadrants`.
 */
export function stepHints(step) {
  if (Array.isArray(step.hints)) return step.hints.map((h) => (typeof h === 'string' ? { text: h } : h));

  switch (step.kind) {
    case 'plot':
    case 'read': {
      const [x, y] = step.target;
      return [
        { text: HINTS.plot[0] },
        { text: fillTemplate(HINTS.plot[1], { xMove: moveText('x', x), yMove: moveText('y', y) }) },
        { text: HINTS.plot[2], path: [[0, 0], [x, 0]] },
      ];
    }
    case 'relative': {
      const [x, y] = step.point;
      const [a, b] = step.ref;
      return [
        { text: HINTS.relative[0] },
        { text: fillTemplate(HINTS.relative[1], { x: fmtNum(x), y: fmtNum(y), a: fmtNum(a), b: fmtNum(b) }) },
        { text: HINTS.relative[2], path: [[a, b], [x, b], [x, y]] },
      ];
    }
    case 'distance': {
      const [x, y] = step.point;
      return [
        { text: HINTS.distance[0] },
        { text: fillTemplate(HINTS.distance[1], { x: fmtNum(x), y: fmtNum(y) }) },
        { text: fillTemplate(HINTS.distance[2], { axis: step.axis }), guides: true },
      ];
    }
    case 'quadrant': {
      const [x, y] = step.point;
      return [
        { text: HINTS.quadrant[0] },
        {
          text: fillTemplate(HINTS.quadrant[1], { x: fmtNum(x), y: fmtNum(y), signX: signOf(x), signY: signOf(y) }),
        },
        { text: HINTS.quadrant[2], quadrants: true },
      ];
    }
    default:
      return [];
  }
}
