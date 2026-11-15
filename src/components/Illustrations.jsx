// Ilustrasi SVG buatan sendiri: maskot, balon, pin, kota isometrik, dan ikon modul.

const INK = '#2b2118';

const svgProps = (className) => ({ className, 'aria-hidden': true, focusable: 'false' });

/** Maskot petugas pemetaan. */
export function Mascot({ className = '' }) {
  return (
    <svg viewBox="0 0 120 140" {...svgProps(className)}>
      <ellipse cx="60" cy="128" rx="54" ry="14" fill="#fff" opacity="0.85" />
      <path
        d="M30 64C28 34 46 24 60 24s32 10 30 42c0 18-4 30-8 34H38c-4-4-8-16-8-36z"
        fill="#3b2a20"
        stroke={INK}
        strokeWidth="2"
      />
      <path d="M26 140c2-26 16-36 34-36s32 10 34 36z" fill="#fff" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <rect x="53" y="94" width="14" height="14" rx="4" fill="#ffd9b8" stroke={INK} strokeWidth="2" />
      <path d="M46 106l14 8 14-8-2 10-12 4-12-4z" fill="#fff" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <path d="M56 114h8l2 4-6 18-6-18z" fill="#1e3a8a" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="72" y="120" width="10" height="8" rx="1.5" fill="#fde68a" stroke={INK} strokeWidth="1.5" />
      <ellipse cx="60" cy="64" rx="26" ry="28" fill="#ffe0c2" stroke={INK} strokeWidth="2" />
      <path
        d="M34 58c2-18 16-26 28-26 14 0 26 8 24 26-8-8-16-12-26-10-8-2-18 4-26 10z"
        fill="#3b2a20"
        stroke={INK}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <ellipse cx="50" cy="66" rx="3.8" ry="4.8" fill={INK} />
      <ellipse cx="70" cy="66" rx="3.8" ry="4.8" fill={INK} />
      <circle cx="51.3" cy="64.2" r="1.4" fill="#fff" />
      <circle cx="71.3" cy="64.2" r="1.4" fill="#fff" />
      <ellipse cx="43" cy="75" rx="5" ry="3" fill="#fca5a5" opacity="0.75" />
      <ellipse cx="77" cy="75" rx="5" ry="3" fill="#fca5a5" opacity="0.75" />
      <path d="M52 77q8 8 16 0" fill="none" stroke="#9a3412" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/** Balon udara. */
export function Balloon({ className = '' }) {
  return (
    <svg viewBox="0 0 60 84" {...svgProps(className)}>
      <path
        d="M30 3c20 0 27 18 22 32-4 11-14 18-18 22h-8C22 53 12 46 8 35 3 21 10 3 30 3z"
        fill="#fde68a"
        stroke={INK}
        strokeWidth="2"
      />
      <path
        d="M30 3c11 0 15 18 12 32-2 11-6 18-8 22h-8c-2-4-6-11-8-22C15 21 19 3 30 3z"
        fill="#93c5fd"
        stroke={INK}
        strokeWidth="1.5"
      />
      <path
        d="M30 3c4 0 6 18 5 32-1 11-1 18-1 22h-8c0-4 0-11-1-22-1-14 1-32 5-32z"
        fill="#fdba74"
        stroke={INK}
        strokeWidth="1.5"
      />
      <path d="M26 57l-3 12M34 57l3 12" stroke={INK} strokeWidth="1.5" />
      <rect x="21" y="68" width="18" height="12" rx="3" fill="#c2763b" stroke={INK} strokeWidth="2" />
    </svg>
  );
}

/** Pin lokasi bergradasi. */
export function MapPin({ className = '' }) {
  return (
    <svg viewBox="0 0 32 40" {...svgProps(className)}>
      <defs>
        <linearGradient id="pinGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#60a5fa" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <path
        d="M16 2a13 13 0 0113 13c0 10-13 23-13 23S3 25 3 15A13 13 0 0116 2z"
        fill="url(#pinGrad)"
        stroke={INK}
        strokeWidth="1.5"
      />
      <circle cx="16" cy="15" r="5" fill="#fff" />
    </svg>
  );
}

/** Balok gedung isometrik. (x, y) = sudut bawah depan, s = lebar, h = tinggi. */
function IsoBlock({ x, y, s, h, top, left, right, windows = true }) {
  const L = [x - s, y];
  const F = [x, y + s / 2];
  const R = [x + s, y];
  const B = [x, y - s / 2];
  const up = ([px, py]) => [px, py - h];
  const pts = (...ps) => ps.map((p) => p.join(',')).join(' ');
  const rows = windows ? Math.max(1, Math.floor(h / 12)) : 0;

  return (
    <g stroke={INK} strokeWidth="1.2" strokeLinejoin="round">
      <polygon points={pts(up(L), up(F), F, L)} fill={left} />
      <polygon points={pts(up(F), up(R), R, F)} fill={right} />
      <polygon points={pts(up(L), up(B), up(R), up(F))} fill={top} />
      {Array.from({ length: rows }, (_, i) => {
        const wy = y - h + 8 + i * 12;
        return (
          <g key={i} fill="#fff8e7" strokeWidth="0.8">
            <polygon
              points={pts(
                [x - s * 0.75, wy - s * 0.12],
                [x - s * 0.45, wy + s * 0.03],
                [x - s * 0.45, wy + s * 0.03 + 5],
                [x - s * 0.75, wy - s * 0.12 + 5],
              )}
            />
            <polygon
              points={pts(
                [x + s * 0.45, wy + s * 0.03],
                [x + s * 0.75, wy - s * 0.12],
                [x + s * 0.75, wy - s * 0.12 + 5],
                [x + s * 0.45, wy + s * 0.03 + 5],
              )}
            />
          </g>
        );
      })}
    </g>
  );
}

function Tree({ x, y }) {
  return (
    <g stroke={INK} strokeWidth="1.2">
      <rect x={x - 1.5} y={y - 6} width="3" height="8" fill="#a16207" />
      <circle cx={x} cy={y - 11} r="7" fill="#86c77a" />
    </g>
  );
}

const CITY_VARIANTS = [
  [
    { x: 40, y: 90, s: 22, h: 56, top: '#dbeafe', left: '#bfdbfe', right: '#93c5fd' },
    { x: 86, y: 108, s: 20, h: 30, top: '#ffffff', left: '#e0ecff', right: '#b9d0f5' },
  ],
  [
    { x: 70, y: 96, s: 22, h: 64, top: '#e0f2fe', left: '#bae6fd', right: '#7dd3fc' },
    { x: 30, y: 112, s: 18, h: 26, top: '#ffffff', left: '#dbeafe', right: '#a5c4f3' },
  ],
];

/** Potongan kota isometrik kecil (dua variasi). */
export function CityBlock({ className = '', variant = 0 }) {
  return (
    <svg viewBox="0 0 120 130" {...svgProps(className)}>
      <polygon points="4,112 60,84 116,112 60,140" fill="#e6efff" stroke="#c7d9f8" strokeWidth="1" />
      {CITY_VARIANTS[variant % CITY_VARIANTS.length].map((b, i) => (
        <IsoBlock key={i} {...b} />
      ))}
      <Tree x={variant ? 100 : 18} y={118} />
      <Tree x={variant ? 52 : 64} y={124} />
    </svg>
  );
}

/** Pola grid isometrik untuk latar. */
export function IsoGridBackground({ className = '' }) {
  return (
    <svg {...svgProps(className)}>
      <defs>
        <pattern id="isoGrid" width="80" height="46" patternUnits="userSpaceOnUse">
          <path d="M0 23L40 0l40 23-40 23z" fill="none" stroke="#d4e2fa" strokeWidth="1.4" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#isoGrid)" />
    </svg>
  );
}

/* ---------- Ikon modul (viewBox 80×80) ---------- */

function CompassIcon() {
  const colors = ['#ef4444', '#f59e0b', '#facc15', '#22c55e', '#3b82f6', '#a855f7'];
  const c = 2 * Math.PI * 28;
  return (
    <>
      <rect x="34" y="2" width="12" height="9" rx="3" fill="#cbd5e1" stroke={INK} strokeWidth="2" />
      <circle cx="40" cy="44" r="33" fill="#fff" stroke={INK} strokeWidth="2.5" />
      {colors.map((color, i) => (
        <circle
          key={color}
          cx="40"
          cy="44"
          r="28"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={`${c / 6 + 0.5} ${c}`}
          strokeDashoffset={-(c / 6) * i}
        />
      ))}
      <circle cx="40" cy="44" r="23" fill="#fff" stroke={INK} strokeWidth="2" />
      <path d="M40 24v4M40 60v4M20 44h4M56 44h4" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      <g transform="rotate(35 40 44)" stroke={INK} strokeWidth="1.5" strokeLinejoin="round">
        <polygon points="40,25 45.5,44 34.5,44" fill="#ef4444" />
        <polygon points="40,63 45.5,44 34.5,44" fill="#60a5fa" />
      </g>
      <circle cx="40" cy="44" r="3" fill={INK} />
    </>
  );
}

function TreasureMapIcon() {
  return (
    <>
      <polygon
        points="4,26 26,18 52,26 76,18 76,66 52,74 26,66 4,74"
        fill="#f6dfb1"
        stroke={INK}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M26 18v48M52 26v48" stroke="#c99a5b" strokeWidth="1.5" />
      <path
        d="M10 44c6-10 18-8 22-2s14 6 18-2c4 8-2 18-12 18-8 0-10-6-18-4s-12-2-10-10z"
        fill="#8bd88e"
        stroke="#2f7d3a"
        strokeWidth="1.5"
      />
      <path
        d="M12 66c10-4 18-12 28-8s16-8 22-14"
        fill="none"
        stroke="#b45309"
        strokeWidth="2"
        strokeDasharray="3 3"
        strokeLinecap="round"
      />
      <path d="M58 52l6 6m0-6l-6 6" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" />
      <path
        d="M60 2a11 11 0 0111 11c0 9-11 20-11 20S49 22 49 13A11 11 0 0160 2z"
        fill="#ef4444"
        stroke={INK}
        strokeWidth="2"
      />
      <circle cx="60" cy="13" r="4" fill="#fff" />
    </>
  );
}

function HouseIcon() {
  return (
    <>
      <ellipse cx="40" cy="72" rx="30" ry="6" fill="#000" opacity="0.08" />
      <polygon points="14,34 40,46 40,72 14,60" fill="#dbe3ee" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <polygon points="40,46 66,34 66,60 40,72" fill="#a9b8cc" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <polygon points="12,33 40,20 68,33 40,46" fill="#4b5d78" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <polygon points="24,52 32,56 32,68 24,64" fill="#60a5fa" stroke={INK} strokeWidth="1.5" />
      <polygon points="18,42 24,45 24,51 18,48" fill="#fff8e7" stroke={INK} strokeWidth="1.2" />
      <polygon points="48,48 56,44 56,51 48,55" fill="#fff8e7" stroke={INK} strokeWidth="1.2" />
      <circle cx="58" cy="22" r="12" fill="#ef4444" stroke="#fff" strokeWidth="3" />
      <rect x="51" y="20" width="14" height="4" rx="2" fill="#fff" />
    </>
  );
}

function RulerIcon() {
  return (
    <>
      <rect x="10" y="10" width="13" height="60" rx="2" fill="#7dd3e8" stroke={INK} strokeWidth="2" />
      {[18, 26, 34, 42, 50, 58].map((y) => (
        <path key={y} d={`M10 ${y}h${y % 16 === 2 ? 7 : 4}`} stroke={INK} strokeWidth="1.5" />
      ))}
      <polygon points="12,66 74,54 76,65 14,77" fill="#fbbf24" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      {[22, 32, 42, 52, 62].map((x, i) => (
        <path key={x} d={`M${x} ${66 - i * 2} l0.6 ${i % 2 ? 3 : 5}`} stroke={INK} strokeWidth="1.5" />
      ))}
      <path d="M46 58V16" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      <polygon points="46,6 53,18 39,18" fill={INK} />
    </>
  );
}

function RouteIcon() {
  return (
    <>
      <ellipse cx="40" cy="70" rx="34" ry="7" fill="#e7d3ad" stroke="#c99a5b" strokeWidth="1.2" />
      <path d="M18 62H60V30" fill="none" stroke={INK} strokeWidth="2.5" strokeDasharray="4 3" strokeLinecap="round" />
      <polygon points="60,22 66,32 54,32" fill={INK} />
      <path d="M18 40a9 9 0 019 9c0 7-9 15-9 15s-9-8-9-15a9 9 0 019-9z" fill="#22c55e" stroke={INK} strokeWidth="2" />
      <circle cx="18" cy="49" r="3.2" fill="#fff" />
      <path d="M62 4a9 9 0 019 9c0 7-9 15-9 15s-9-8-9-15a9 9 0 019-9z" fill="#ef4444" stroke={INK} strokeWidth="2" />
      <circle cx="62" cy="13" r="3.2" fill="#fff" />
    </>
  );
}

function RoadsIcon() {
  return (
    <>
      {[16, 46].map((y) => (
        <g key={y}>
          <rect x="4" y={y} width="72" height="16" rx="4" fill="#64748b" stroke={INK} strokeWidth="2" />
          <path d={`M10 ${y + 8}h60`} stroke="#fff" strokeWidth="2" strokeDasharray="6 5" />
        </g>
      ))}
      <rect x="44" y="18" width="16" height="9" rx="3" fill="#ef4444" stroke={INK} strokeWidth="1.5" />
      <rect x="16" y="49" width="16" height="9" rx="3" fill="#facc15" stroke={INK} strokeWidth="1.5" />
      <g stroke={INK} strokeWidth="1.2">
        <rect x="67" y="68" width="3" height="8" fill="#a16207" />
        <circle cx="68.5" cy="66" r="6" fill="#86c77a" />
      </g>
    </>
  );
}

const MODULE_ICONS = {
  m1: CompassIcon,
  m2: TreasureMapIcon,
  m3: HouseIcon,
  m4: RulerIcon,
  m5: RouteIcon,
  m6: RoadsIcon,
};

export function ModuleIcon({ id, className = '' }) {
  const Icon = MODULE_ICONS[id] ?? CompassIcon;
  return (
    <svg viewBox="0 0 80 80" {...svgProps(className)}>
      <Icon />
    </svg>
  );
}

export function LockIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" {...svgProps(className)}>
      <path d="M7.5 11V8a4.5 4.5 0 019 0v3" fill="none" stroke="#a16207" strokeWidth="2.6" strokeLinecap="round" />
      <rect x="4" y="10.5" width="16" height="11.5" rx="3" fill="#fbbf24" stroke="#a16207" strokeWidth="1.6" />
      <rect x="5.5" y="12" width="13" height="2" rx="1" fill="#fde68a" />
      <circle cx="12" cy="16" r="1.8" fill="#92400e" />
      <rect x="11.2" y="16.5" width="1.6" height="3" rx="0.8" fill="#92400e" />
    </svg>
  );
}
