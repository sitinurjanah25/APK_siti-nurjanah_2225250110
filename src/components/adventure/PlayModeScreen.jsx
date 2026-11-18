import '@fontsource/fredoka/latin-500.css';
import '@fontsource/fredoka/latin-700.css';
import { useCosmicBody } from '../cosmic/Cosmic.jsx';
import { Link } from 'react-router-dom';
import menuHouse from '../../assets/menu-house.jpg';
import { DIFFICULTY_LIST } from '../../lib/quest.js';
import { questOf } from '../../state/progress.js';
import { useProgress } from '../../state/ProgressContext.jsx';
import { LOGO_SHADOW } from './MateriList.jsx';

const GAME_FONT = { fontFamily: '"Fredoka", system-ui, sans-serif' };
const FOCUS = 'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-amber-300';

/** Gaya tiap tingkat: kapsul 3D berwarna. */
const LEVEL_STYLE = {
  easy: {
    name: 'MUDAH',
    icon: '🌱',
    desc: 'Ada garis proyeksi dan petunjuk. Cocok untuk pemanasan.',
    face: 'from-emerald-300 via-emerald-500 to-green-700',
    edge: '#14532d',
    glow: 'hover:shadow-[0_0_28px_rgba(52,211,153,.7)]',
    chip: 'bg-emerald-950/30',
  },
  medium: {
    name: 'SEDANG',
    icon: '🧭',
    desc: 'Petunjuk lebih sedikit. Baca posisi dari angka di sumbu utama.',
    face: 'from-yellow-300 via-amber-400 to-orange-600',
    edge: '#7c2d12',
    glow: 'hover:shadow-[0_0_28px_rgba(251,191,36,.75)]',
    chip: 'bg-orange-950/25',
  },
  hard: {
    name: 'SULIT',
    icon: '🔥',
    desc: 'Angka grid disembunyikan semua. Tantangan ruang murni!',
    face: 'from-rose-400 via-red-500 to-red-700',
    edge: '#7f1d1d',
    glow: 'hover:shadow-[0_0_28px_rgba(244,63,94,.75)]',
    chip: 'bg-red-950/30',
  },
};

const STARS = Array.from({ length: 22 }, (_, i) => ({
  top: `${(i * 41 + 7) % 100}%`,
  left: `${(i * 59 + 13) % 100}%`,
  size: i % 4 === 0 ? 3 : 2,
  delay: `${(i % 7) * 0.45}s`,
}));

/** Layar "Pilih mode bermain": Mode Petualangan 15 level + Latihan Bebas 3D. */
export default function PlayModeScreen({ onPick, onBack }) {
  useCosmicBody();
  const { state } = useProgress();
  const best = questOf(state).best;

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
      <div className="pointer-events-none absolute -right-24 top-24 -z-10 h-72 w-72 rounded-full bg-indigo-500/25 blur-3xl" />

      {/* Header */}
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
          className="m-0 px-12 py-2 text-center text-[2rem] font-bold leading-tight tracking-tight text-[#cdeeff] sm:text-5xl"
          style={{ textShadow: LOGO_SHADOW.replaceAll('#f59e0b', '#2563eb').replace('#9a3412', '#1e1b4b') }}
        >
          Pilih mode bermain
        </h2>
      </div>
      <p className="m-0 mt-1 text-center text-sm font-medium uppercase tracking-[0.25em] text-sky-200/80">🎯 Latihan / Quest</p>

      <div className="mx-auto mt-6 max-w-[760px] space-y-7">
        {/* Kartu Mode Petualangan (glassmorphism) */}
        <Link
          to="/quest"
          className={`group relative flex items-center gap-3 overflow-hidden rounded-[1.75rem] border-2 border-sky-300/40 bg-white/10 p-4 pr-3 text-white no-underline shadow-[0_0_0_1px_rgba(167,139,250,.35),0_0_30px_rgba(96,165,250,.35),inset_0_1px_0_rgba(255,255,255,.25)] backdrop-blur-md transition duration-200 hover:-translate-y-1 hover:shadow-[0_0_0_1px_rgba(167,139,250,.6),0_0_44px_rgba(96,165,250,.6),inset_0_1px_0_rgba(255,255,255,.3)] sm:p-6 ${FOCUS}`}
        >
          <span aria-hidden="true" className="pointer-events-none absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-sky-300 to-transparent" />
          <span className="relative z-[1] min-w-0 flex-1">
            <span className="block text-xs font-bold uppercase tracking-[0.2em] text-sky-300 sm:text-sm">Mode Petualangan</span>
            <span className="block text-2xl font-bold leading-tight sm:text-4xl">15 Level • 3 Dunia</span>
            <span className="mt-1 block text-sm leading-snug text-indigo-100 sm:text-base">
              Kota Datar 2D → Kota Bertingkat 3D → Tantangan Master. Buka level satu per satu!
            </span>
            <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-400 to-indigo-500 px-4 py-1.5 text-sm font-bold shadow-[0_4px_0_#312e81] transition group-hover:gap-3">
              Mulai Petualangan <span aria-hidden="true">➜</span>
            </span>
          </span>
          <img
            src={menuHouse}
            alt=""
            width="630"
            height="440"
            className="h-auto w-28 flex-none drop-shadow-[0_0_18px_rgba(56,189,248,.5)] transition duration-300 group-hover:-translate-y-1 group-hover:scale-105 sm:w-48"
            style={{
              WebkitMaskImage: 'radial-gradient(ellipse 50% 50% at 50% 50%, #000 58%, transparent 100%)',
              maskImage: 'radial-gradient(ellipse 50% 50% at 50% 50%, #000 58%, transparent 100%)',
            }}
          />
        </Link>

        {/* Latihan Bebas 3D */}
        <div>
          <h3 className="m-0 flex items-center gap-2 text-xl font-bold text-white sm:text-2xl">
            <span aria-hidden="true">🎲</span> Latihan Bebas 3D <span className="text-base font-medium text-sky-200">(soal acak)</span>
          </h3>
          <p className="m-0 mt-2 max-w-[62ch] text-base leading-relaxed text-indigo-100">
            Rumah muncul di kota 3D <strong className="text-amber-300">tanpa label koordinat</strong>. Tugasmu: tebak dan isi
            (x, y, z)-nya dengan tepat. Ada <strong className="text-rose-300">3 nyawa ❤️</strong> dan{' '}
            <strong className="text-sky-300">batas waktu ⏱</strong> per soal.
          </p>

          <ul className="m-0 mt-5 grid list-none gap-4 p-0 sm:grid-cols-3">
            {DIFFICULTY_LIST.map((d) => {
              const st = LEVEL_STYLE[d.id];
              const record = best[`latihan-${d.id}`];
              return (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => onPick(d.id)}
                    className={`group flex h-full w-full cursor-pointer flex-col items-start gap-2 rounded-[1.6rem] border-2 border-white/70 bg-gradient-to-b p-4 text-left text-white transition duration-150 hover:-translate-y-1 active:translate-y-1 ${st.face} ${st.glow} ${FOCUS}`}
                    style={{ ...GAME_FONT, boxShadow: `0 7px 0 ${st.edge}, inset 0 2px 0 rgba(255,255,255,.5)` }}
                  >
                    <span className="flex w-full items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-2xl font-bold tracking-wide [text-shadow:0_2px_0_rgba(0,0,0,.35)]">
                        <span
                          className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/70 bg-white/25 text-xl transition group-hover:rotate-[-10deg] group-hover:scale-110"
                          aria-hidden="true"
                        >
                          {st.icon}
                        </span>
                        {st.name}
                      </span>
                      <span className="rounded-full border-2 border-white/70 bg-white/25 px-2.5 py-0.5 text-sm font-bold">
                        skor ×{d.scoreMult}
                      </span>
                    </span>
                    <span className="text-sm font-medium leading-snug text-white/95 [text-shadow:0_1px_0_rgba(0,0,0,.25)]">
                      {st.desc}
                    </span>
                    <span className={`mt-auto rounded-full px-3 py-1 text-xs font-bold ${st.chip}`}>
                      {record != null ? `🏅 Skor terbaik: ${record}` : 'Belum pernah dimainkan'}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
