import '@fontsource/fredoka/latin-500.css';
import '@fontsource/fredoka/latin-700.css';
import { useCosmicBody } from '../cosmic/Cosmic.jsx';

const GAME_FONT = { fontFamily: '"Fredoka", system-ui, sans-serif' };
const FOCUS = 'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-amber-300';

/** Judul "cartes.play" bergaya logo: biru muda, garis tepi oranye, bercahaya. */
export const LOGO_SHADOW = [
  '3px 0 #f59e0b',
  '-3px 0 #f59e0b',
  '0 3px #f59e0b',
  '0 -3px #f59e0b',
  '2px 2px #f59e0b',
  '-2px -2px #f59e0b',
  '2px -2px #f59e0b',
  '-2px 2px #f59e0b',
  '0 6px 0 #9a3412',
  '0 0 26px rgba(56,189,248,.7)',
].join(',');

/* ---------- Ikon neon (SVG) ---------- */

const GLOW = { filter: 'drop-shadow(0 0 3px rgba(56,189,248,.9))' };

function Grid2DIcon() {
  const lines = [16, 26, 36, 46, 56, 66, 76, 86];
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
      <g stroke="#38bdf8" strokeWidth="1.2" opacity=".85" style={GLOW}>
        {lines.map((v) => (
          <line key={`v${v}`} x1={v} y1="16" x2={v} y2="86" />
        ))}
        {lines.map((v) => (
          <line key={`h${v}`} x1="16" y1={v} x2="86" y2={v} />
        ))}
      </g>
      <g stroke="#f8fafc" strokeWidth="2.4" fill="#f8fafc" strokeLinecap="round">
        <line x1="8" y1="51" x2="90" y2="51" />
        <path d="M94 51l-6-3.5v7z" />
        <line x1="51" y1="94" x2="51" y2="10" />
        <path d="M51 6l-3.5 6h7z" />
      </g>
      <circle cx="51" cy="51" r="2.6" fill="#fbbf24" />
      <g fill="#f8fafc" fontSize="10" fontWeight="700" fontFamily="system-ui">
        <text x="40" y="12">Y</text>
        <text x="88" y="64">X</text>
        <text x="40" y="62">O</text>
      </g>
      <g fill="none" stroke="#fbbf24" strokeWidth="1.8">
        <rect x="12" y="12" width="7" height="7" />
        <rect x="83" y="12" width="7" height="7" transform="translate(-4 0)" />
        <rect x="12" y="80" width="7" height="7" />
        <rect x="79" y="80" width="7" height="7" />
      </g>
    </svg>
  );
}

function Space3DIcon() {
  // Proyeksi isometrik: titik O, lalu arah satuan sumbu X (kiri-bawah), Y (kanan-bawah), Z (atas).
  const O = [50, 66];
  const X = [-6.5, 3.75];
  const Y = [6.5, 3.75];
  const Z = [0, -7.5];
  const pt = (a, b, u, v) => [O[0] + a[0] * u + b[0] * v, O[1] + a[1] * u + b[1] * v];
  const N = [0, 1, 2, 3, 4, 5];
  /** Grid 5×5 pada bidang yang dibentuk sumbu a dan b. */
  const plane = (a, b, key) =>
    N.flatMap((i) => {
      const [x1, y1] = pt(a, b, i, 0);
      const [x2, y2] = pt(a, b, i, 5);
      const [x3, y3] = pt(a, b, 0, i);
      const [x4, y4] = pt(a, b, 5, i);
      return [
        <line key={`${key}a${i}`} x1={x1} y1={y1} x2={x2} y2={y2} />,
        <line key={`${key}b${i}`} x1={x3} y1={y3} x2={x4} y2={y4} />,
      ];
    });
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
      <g stroke="#fb7185" strokeWidth="1" opacity=".9">{plane(X, Z, 'xz')}</g>
      <g stroke="#4ade80" strokeWidth="1" opacity=".9">{plane(Y, Z, 'yz')}</g>
      <g stroke="#f472b6" strokeWidth="1" opacity=".75">{plane(X, Y, 'xy')}</g>
      <g strokeWidth="2.4" strokeLinecap="round" style={GLOW}>
        <line x1={O[0]} y1={O[1]} x2="50" y2="10" stroke="#38bdf8" />
        <path d="M50 6l-3.5 6h7z" fill="#38bdf8" />
        <line x1={O[0]} y1={O[1]} x2="12" y2="88" stroke="#f87171" />
        <line x1={O[0]} y1={O[1]} x2="88" y2="88" stroke="#4ade80" />
      </g>
      <g fontSize="10" fontWeight="700" fontFamily="system-ui">
        <text x="55" y="13" fill="#38bdf8">Z</text>
        <text x="6" y="96" fill="#f87171">X</text>
        <text x="88" y="98" fill="#4ade80">Y</text>
      </g>
    </svg>
  );
}

function PlotIcon() {
  const lines = [22, 33, 44, 55, 66, 77];
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
      <g stroke="#38bdf8" strokeWidth="1.2" opacity=".85" style={GLOW}>
        {lines.map((v) => (
          <line key={`v${v}`} x1={v} y1="22" x2={v} y2="88" />
        ))}
        {lines.map((v) => (
          <line key={`h${v}`} x1="22" y1={v} x2="88" y2={v} />
        ))}
      </g>
      <g stroke="#f8fafc" strokeWidth="2.4" fill="#f8fafc" strokeLinecap="round">
        <line x1="10" y1="60" x2="90" y2="60" />
        <path d="M95 60l-6-3.5v7z" />
        <line x1="44" y1="94" x2="44" y2="14" />
        <path d="M44 9l-3.5 6h7z" />
      </g>
      {/* langkah: mendatar dulu, baru naik */}
      <g stroke="#fbbf24" strokeWidth="2.6" fill="#fbbf24" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 3px rgba(251,191,36,.9))' }}>
        <line x1="62" y1="38" x2="82" y2="18" />
        <path d="M86 14l-8 2.5 5.5 5.5z" />
      </g>
      {/* kursor */}
      <path
        d="M70 30L44 62l10-2 6 10z"
        fill="#bae6fd"
        stroke="#f8fafc"
        strokeWidth="2"
        strokeLinejoin="round"
        style={GLOW}
      />
    </svg>
  );
}

const ICONS = { '2d': Grid2DIcon, '3d': Space3DIcon, plot: PlotIcon };

/* ---------- Kartu ---------- */

function IconBox({ id }) {
  const Icon = ICONS[id] ?? Grid2DIcon;
  return (
    <span className="relative z-[1] flex h-[6.5rem] w-[6.5rem] flex-none items-center justify-center rounded-[1.4rem] border-[3px] border-[#f5c27a] bg-gradient-to-b from-[#1a2160] to-[#0d1240] p-3 shadow-[0_0_0_2px_#7c4a1e,0_0_18px_rgba(245,194,122,.55),inset_0_0_18px_rgba(56,189,248,.25)] sm:h-32 sm:w-32">
      {/* aksen sudut pink & panah cyan */}
      {['left-1 top-1 rotate-45', 'right-1 top-1 -rotate-45', 'bottom-1 left-1 -rotate-45', 'bottom-1 right-1 rotate-45'].map((c) => (
        <span key={c} aria-hidden="true" className={`absolute h-1.5 w-3 rounded-full bg-pink-400 shadow-[0_0_6px_#f472b6] ${c}`} />
      ))}
      <span aria-hidden="true" className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs font-black text-cyan-300 [text-shadow:0_0_6px_#22d3ee]">
        ︿
      </span>
      <span aria-hidden="true" className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 text-xs font-black text-cyan-300 [text-shadow:0_0_6px_#22d3ee]">
        ﹀
      </span>
      <Icon />
    </span>
  );
}

function TopicButton({ topic, number, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex w-full cursor-pointer items-center border-0 bg-transparent p-0 text-left transition duration-200 hover:-translate-y-1 active:scale-[0.98] ${FOCUS}`}
      style={GAME_FONT}
    >
      <IconBox id={topic.id} />
      <span className="relative -ml-3 flex min-h-[5.25rem] flex-1 flex-col justify-center rounded-r-[1.4rem] border-[3px] border-l-0 border-[#f5c27a] bg-gradient-to-b from-[#fff8ef] to-[#f8e6d3] py-3 pl-6 pr-6 shadow-[0_0_0_2px_#7c4a1e,0_0_16px_rgba(245,194,122,.45)] transition group-hover:shadow-[0_0_0_2px_#7c4a1e,0_0_26px_rgba(245,194,122,.8)] sm:min-h-[6.5rem] sm:pl-7">
        {/* permata cyan di sudut kanan */}
        <span aria-hidden="true" className="absolute -right-1.5 -top-1.5 h-3 w-3 rotate-45 rounded-sm bg-cyan-300 shadow-[0_0_8px_#22d3ee]" />
        <span aria-hidden="true" className="absolute -bottom-1.5 -right-1.5 h-3 w-3 rotate-45 rounded-sm bg-cyan-300 shadow-[0_0_8px_#22d3ee]" />
        <span aria-hidden="true" className="absolute -right-2 top-1/2 h-8 w-1.5 -translate-y-1/2 rounded-full bg-cyan-300/80 shadow-[0_0_8px_#22d3ee]" />

        <span className="block text-lg font-bold leading-tight text-[#1a1446] sm:text-2xl">
          {number}. {topic.title}
        </span>
        <span className="mt-0.5 block text-sm font-medium leading-snug text-[#2a2457] sm:text-base">{topic.short}</span>
      </span>
    </button>
  );
}

/* ---------- Halaman daftar Materi ---------- */

const STARS = Array.from({ length: 18 }, (_, i) => ({
  top: `${(i * 37) % 100}%`,
  left: `${(i * 53 + 11) % 100}%`,
  size: i % 3 === 0 ? 3 : 2,
  delay: `${(i % 6) * 0.5}s`,
}));

export default function MateriList({ topics, onTopic, onBack }) {
  useCosmicBody();
  return (
    <section
      className="relative isolate -mx-4 -mt-4 min-h-[70vh] overflow-hidden bg-[#1c1450] bg-gradient-to-b from-[#1b1550] via-[#21155a] to-[#341366] px-4 pb-10 pt-4 text-white sm:mx-0 sm:mt-0 sm:rounded-[2rem] sm:px-8 sm:shadow-2xl sm:shadow-indigo-950/40"
      style={GAME_FONT}
    >
      {STARS.map((s, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="pointer-events-none absolute -z-10 rounded-full bg-sky-200/60 motion-safe:animate-pulse"
          style={{ top: s.top, left: s.left, width: s.size, height: s.size, animationDelay: s.delay }}
        />
      ))}
      <div className="pointer-events-none absolute -left-24 bottom-0 -z-10 h-72 w-72 rounded-full bg-fuchsia-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-24 -z-10 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />

      <div className="relative flex items-center justify-center">
        <button
          type="button"
          onClick={onBack}
          aria-label="Kembali ke Menu"
          className={`absolute left-0 top-1/2 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-2xl border-2 border-[#f5c27a] bg-[#0d1240]/80 text-xl font-bold text-amber-200 transition hover:bg-[#1a2160] ${FOCUS}`}
        >
          ←
        </button>
        <h2
          className="m-0 py-2 text-[2.6rem] font-bold leading-none tracking-tight text-[#cdeeff] sm:text-6xl"
          style={{ textShadow: LOGO_SHADOW }}
        >
          cartes.play
        </h2>
      </div>
      <p className="m-0 mt-3 text-center text-sm font-medium uppercase tracking-[0.25em] text-sky-200/80">📖 Pilih Topik Belajar</p>

      <ol className="mx-auto mt-6 grid max-w-[720px] list-none gap-6 p-0 sm:gap-8">
        {topics.map((t, i) => (
          <li key={t.id} className="motion-safe:animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
            <TopicButton topic={t} number={i + 1} onClick={() => onTopic(t.id)} />
          </li>
        ))}
      </ol>
    </section>
  );
}
