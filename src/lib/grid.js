import { useEffect, useState } from 'react';
import { noNegZero } from './coords.js';

// Geometri bidang koordinat SVG. Satu satuan koordinat = 1 unit SVG,
// dengan sumbu-y SVG dibalik (atas = positif).

export const GRID_PADDING = 1;

/** Koordinat matematika → koordinat SVG. */
export const toSvg = ([x, y]) => [x, noNegZero(-y)];

/** Koordinat SVG → koordinat matematika. */
export const fromSvg = ([x, y]) => [x, noNegZero(-y)];

export function gridViewBox(range, pad = GRID_PADDING) {
  const r = range + pad;
  return `${-r} ${-r} ${r * 2} ${r * 2}`;
}

/** Ubah ukuran piksel layar menjadi unit SVG, supaya teks & titik tetap sama besar. */
export function pxToUnits(px, widthPx, range, pad = GRID_PADDING) {
  return widthPx <= 0 ? 0 : (px * (range + pad) * 2) / widthPx;
}

/** Posisi klik (piksel) → koordinat SVG, atau null. */
export function clientToSvg(rect, clientX, clientY, range, pad = GRID_PADDING) {
  const r = range + pad;
  const size = r * 2;
  const scale = Math.min(rect.width, rect.height) / size;
  if (!(scale > 0)) return null;
  const offX = (rect.width - size * scale) / 2;
  const offY = (rect.height - size * scale) / 2;
  return [(clientX - rect.left - offX) / scale - r, (clientY - rect.top - offY) / scale - r];
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** Geser titik dengan tombol panah, tetap di dalam grid. */
export function stepPoint([x, y], [dx, dy], range) {
  return [noNegZero(clamp(x + dx, -range, range)), noNegZero(clamp(y + dy, -range, range))];
}

export function roundPoint([x, y], range) {
  return [noNegZero(clamp(Math.round(x), -range, range)), noNegZero(clamp(Math.round(y), -range, range))];
}

/** Bulatkan ke titik grid terdekat kalau cukup dekat, atau null. */
export function snapToGrid([x, y], range, maxDist = Infinity) {
  const limit = range + 0.5;
  if (Math.abs(x) > limit || Math.abs(y) > limit) return null;
  const p = roundPoint([x, y], range);
  return Math.hypot(x - p[0], y - p[1]) <= maxDist ? p : null;
}

/** Bilangan bulat dari -range sampai range, kelipatan `step`. */
export function ticks(range, step = 1) {
  const out = [];
  for (let i = -range; i <= range; i += 1) if (i % step === 0) out.push(noNegZero(i));
  return out;
}

/** Lebar elemen (piksel), ikut berubah saat layar diubah ukurannya. */
export function useElementWidth(ref, fallback = 340) {
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const w = el.getBoundingClientRect().width;
      if (w > 0) setWidth(w);
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return width;
}
