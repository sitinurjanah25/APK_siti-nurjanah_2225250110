// Membuat ikon aplikasi (public/icon.svg, icon-192.png, icon-512.png).
// Jalankan: npm run icons
import { writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

// Proyeksi isometrik: x ke kiri-bawah, y ke kanan-bawah, z ke atas.
const O = [256, 236];
const EX = [-27, 15.6];
const EY = [27, 15.6];
const EZ = [0, -31];
const N = 5; // ukuran kisi

const p = (x, y, z = 0) => [
  +(O[0] + x * EX[0] + y * EY[0] + z * EZ[0]).toFixed(1),
  +(O[1] + x * EX[1] + y * EY[1] + z * EZ[1]).toFixed(1),
];
const pt = (q) => q.join(',');
const line = (a, b) => `M${pt(a)}L${pt(b)}`;
const poly = (...qs) => qs.map(pt).join(' ');

// Kisi: lantai (z=0), dinding kiri (y=0), dinding kanan (x=0)
let grid = '';
for (let i = 0; i <= N; i++) {
  grid += line(p(i, 0), p(i, N)) + line(p(0, i), p(N, i)); // lantai
  grid += line(p(i, 0, 0), p(i, 0, N)) + line(p(0, 0, i), p(N, 0, i)); // dinding y=0
  grid += line(p(0, i, 0), p(0, i, N)) + line(p(0, 0, i), p(0, N, i)); // dinding x=0
}

// Sumbu dengan ujung panah
const AX = N + 0.9;
function arrow(tip, dir) {
  // dir: vektor layar satuan dari pangkal ke ujung
  const len = Math.hypot(...dir);
  const [ux, uy] = [dir[0] / len, dir[1] / len];
  const back = [tip[0] - ux * 26, tip[1] - uy * 26];
  const [nx, ny] = [-uy * 13, ux * 13];
  return poly(tip, [back[0] + nx, back[1] + ny], [back[0] - nx, back[1] - ny]);
}
const ax = { x: p(AX, 0), y: p(0, AX), z: p(0, 0, AX) };
const shaft = (end, dir) => {
  const len = Math.hypot(...dir);
  return [end[0] - (dir[0] / len) * 20, end[1] - (dir[1] / len) * 20];
};

// Rumah di titik (2, 3)
const H = { x: 2, y: 3 };
const s = 0.72; // setengah lebar alas
const h = 1.0; // tinggi dinding
const hb = (dx, dy, z = 0) => p(H.x + dx, H.y + dy, z);
const L = hb(s, -s), F = hb(s, s), R = hb(-s, s);
const Lu = hb(s, -s, h), Fu = hb(s, s, h), Ru = hb(-s, s, h);
const apex = hb(0, 0, h + 0.85);
const doorA = hb(s, -0.15), doorB = hb(s, 0.25);
const base = p(H.x, H.y);

// Penanda tujuan (pin) di atas rumah
const pinTip = p(H.x, H.y, h + 1.35);
const pinC = [pinTip[0], pinTip[1] - 46];

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1e40af"/>
      <stop offset="0.55" stop-color="#1e1b6b"/>
      <stop offset="1" stop-color="#4c1d95"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#38bdf8" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#38bdf8" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="pin" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fde047"/>
      <stop offset="1" stop-color="#f59e0b"/>
    </linearGradient>
    <filter id="neon" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3.5" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="8"/>
    </filter>
  </defs>

  <rect width="512" height="512" rx="112" fill="url(#bg)"/>
  <ellipse cx="256" cy="300" rx="230" ry="190" fill="url(#glow)"/>

  <!-- Kisi neon -->
  <path d="${grid}" fill="none" stroke="#7dd3fc" stroke-opacity="0.75" stroke-width="2" stroke-linecap="round" filter="url(#neon)"/>
  <polygon points="${poly(p(0, 0), p(N, 0), p(N, N), p(0, N))}" fill="#38bdf8" fill-opacity="0.08"/>

  <!-- Garis proyeksi rumah ke sumbu -->
  <path d="${line(base, p(H.x, 0))}${line(base, p(0, H.y))}" stroke="#e0f2fe" stroke-width="3" stroke-dasharray="7 6" stroke-linecap="round" fill="none"/>
  <g fill="#e0f2fe" filter="url(#neon)">
    <circle cx="${p(H.x, 0)[0]}" cy="${p(H.x, 0)[1]}" r="5.5"/>
    <circle cx="${p(0, H.y)[0]}" cy="${p(0, H.y)[1]}" r="5.5"/>
  </g>

  <!-- Sumbu X, Y, Z -->
  <g stroke="#f97316" stroke-width="11" stroke-linecap="round" filter="url(#neon)">
    <path d="${line(O, shaft(ax.x, EX))}"/>
    <path d="${line(O, shaft(ax.y, EY))}"/>
    <path d="${line(O, shaft(ax.z, EZ))}"/>
  </g>
  <g fill="#fb923c">
    <polygon points="${arrow(ax.x, EX)}"/>
    <polygon points="${arrow(ax.y, EY)}"/>
    <polygon points="${arrow(ax.z, EZ)}"/>
  </g>
  <circle cx="${O[0]}" cy="${O[1]}" r="9" fill="#fff7ed"/>

  <!-- Cincin tujuan di lantai -->
  <ellipse cx="${base[0]}" cy="${base[1]}" rx="50" ry="29" fill="none" stroke="#fde047" stroke-width="4" stroke-opacity="0.9" filter="url(#neon)"/>

  <!-- Rumah -->
  <ellipse cx="${base[0]}" cy="${base[1] + 4}" rx="40" ry="20" fill="#0b1026" opacity="0.45" filter="url(#soft)"/>
  <g stroke="#7c2d12" stroke-width="2.5" stroke-linejoin="round">
    <polygon points="${poly(L, F, Fu, Lu)}" fill="#fdba74"/>
    <polygon points="${poly(F, R, Ru, Fu)}" fill="#f97316"/>
    <polygon points="${poly(Lu, Fu, apex)}" fill="#ea580c"/>
    <polygon points="${poly(Fu, Ru, apex)}" fill="#c2410c"/>
    <polygon points="${poly(doorA, doorB, [doorB[0], doorB[1] - 21], [doorA[0], doorA[1] - 21])}" fill="#7c2d12"/>
  </g>

  <!-- Penanda tujuan -->
  <g filter="url(#neon)">
    <path d="M${pinTip[0]} ${pinTip[1]} C${pinC[0] - 6} ${pinTip[1] - 14} ${pinC[0] - 24} ${pinC[1] + 14} ${pinC[0] - 24} ${pinC[1]} A24 24 0 1 1 ${pinC[0] + 24} ${pinC[1]} C${pinC[0] + 24} ${pinC[1] + 14} ${pinC[0] + 6} ${pinTip[1] - 14} ${pinTip[0]} ${pinTip[1]}Z" fill="url(#pin)" stroke="#92400e" stroke-width="3"/>
  </g>
  <path d="M${pinC[0]} ${pinC[1] - 12} l3.5 7.2 7.9 1.1 -5.7 5.6 1.3 7.9 -7 -3.7 -7 3.7 1.3 -7.9 -5.7 -5.6 7.9 -1.1z" fill="#ffffff"/>
</svg>
`;

writeFileSync('public/icon.svg', svg);
for (const size of [192, 512]) {
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();
  writeFileSync(`public/icon-${size}.png`, png);
}
console.log('Ikon dibuat: public/icon.svg, icon-192.png, icon-512.png');
