// Fungsi bantu untuk titik koordinat [x, y].

/** Ubah -0 menjadi 0 supaya tidak tampil "−0". */
export const noNegZero = (n) => (n === 0 ? 0 : n);

/** Nomor kuadran 1–4, atau null kalau titik ada di sumbu. */
export function quadrantOf([x, y]) {
  if (x === 0 || y === 0) return null;
  if (x > 0) return y > 0 ? 1 : 4;
  return y > 0 ? 2 : 3;
}

export const ROMAN = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV' };

/** Tanda (x, y) untuk setiap kuadran. */
export const QUADRANT_SIGNS = { 1: [1, 1], 2: [-1, 1], 3: [-1, -1], 4: [1, -1] };

/** Jarak ke sumbu-X dilihat dari y. */
export const distToXAxis = ([, y]) => Math.abs(y);

/** Jarak ke sumbu-Y dilihat dari x. */
export const distToYAxis = ([x]) => Math.abs(x);

/** Posisi titik `p` terhadap titik acuan `ref`. */
export const relativeTo = ([x, y], [rx, ry]) => [noNegZero(x - rx), noNegZero(y - ry)];

/** Kalimat arah, misalnya "3 satuan ke kiri dan 2 satuan ke bawah". */
export function describeOffset([dx, dy]) {
  const parts = [];
  if (dx !== 0) parts.push(`${Math.abs(dx)} satuan ke ${dx > 0 ? 'kanan' : 'kiri'}`);
  if (dy !== 0) parts.push(`${Math.abs(dy)} satuan ke ${dy > 0 ? 'atas' : 'bawah'}`);
  return parts.length === 0 ? 'tepat di titik yang sama' : parts.join(' dan ');
}

export const samePoint = ([x1, y1], [x2, y2]) => x1 === x2 && y1 === y2;

/** Tulis bilangan dengan tanda minus tipografis (−). */
export function fmtNum(n) {
  const v = noNegZero(n);
  return v < 0 ? `−${Math.abs(v)}` : String(v);
}

export const fmtPoint = ([x, y]) => `(${fmtNum(x)}, ${fmtNum(y)})`;

/** Bacaan untuk pembaca layar, misalnya "minus 3 koma 2". */
export function speakPoint([x, y]) {
  const say = (n) => (noNegZero(n) < 0 ? `minus ${Math.abs(n)}` : String(Math.abs(n)));
  return `${say(x)} koma ${say(y)}`;
}

/** Letak titik: titik asal, pada sumbu, atau kuadran. */
export function locationLabel(p) {
  const [x, y] = p;
  if (x === 0 && y === 0) return 'Titik asal';
  if (y === 0) return 'Pada sumbu-X';
  if (x === 0) return 'Pada sumbu-Y';
  return `Kuadran ${ROMAN[quadrantOf(p)]}`;
}
