import '@fontsource/fredoka/latin-500.css';
import '@fontsource/fredoka/latin-700.css';
import { useCosmicBody } from '../cosmic/Cosmic.jsx';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import menuHouse from '../../assets/menu-house.jpg';
import { ACTIONS, questOf } from '../../state/progress.js';
import { useProgress } from '../../state/ProgressContext.jsx';

const GAME_FONT = { fontFamily: '"Fredoka", system-ui, sans-serif' };
const FOCUS = 'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-amber-300';

/** Tombol menu bergaya arcade, berurutan dari atas ke bawah. */
const MENU_ITEMS = [
  {
    id: 'materi',
    number: 1,
    icon: '📖',
    title: 'MATERI',
    text: 'Bidang 2D, ruang 3D, dan cara plotting',
    face: 'from-sky-400 via-blue-500 to-blue-700',
    edge: '#1e3a8a',
    glow: 'hover:shadow-[0_0_24px_rgba(56,189,248,.7)]',
  },
  {
    id: 'latihan',
    number: 2,
    icon: '🎯',
    title: 'LATIHAN / QUEST',
    text: '15 level petualangan & latihan bebas',
    face: 'from-violet-400 via-fuchsia-500 to-purple-700',
    edge: '#581c87',
    glow: 'hover:shadow-[0_0_24px_rgba(217,70,239,.7)]',
  },
  {
    id: 'kuis',
    number: 3,
    icon: '🏆',
    title: 'KUIS',
    text: 'Uji pemahaman & kejar skor terbaik',
    face: 'from-amber-300 via-orange-500 to-orange-700',
    edge: '#7c2d12',
    glow: 'hover:shadow-[0_0_24px_rgba(251,146,60,.75)]',
  },
];

/** Bingkai sudut oranye seperti panel game. */
function Corner({ className }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute h-7 w-7 border-[#fb923c] drop-shadow-[0_0_6px_rgba(251,146,60,.8)] ${className}`}
    />
  );
}

function HudButton({ children, ...props }) {
  return (
    <button
      type="button"
      className={`flex h-11 min-w-11 cursor-pointer items-center justify-center gap-1.5 rounded-2xl border-2 border-sky-400/50 bg-[#0b1a4a]/80 px-3 text-sm font-bold text-sky-100 transition hover:border-sky-300 hover:bg-[#13256b] active:scale-95 ${FOCUS}`}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * Menu Utama cartes.play: HUD (Skor · Menu Utama · Pengaturan), header rumah isometrik,
 * dan panel berisi 3 tombol arcade berurutan.
 */
export default function MainMenu({ onPick, onBack }) {
  useCosmicBody();
  const navigate = useNavigate();
  const { state, dispatch } = useProgress();
  const [settings, setSettings] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const best = questOf(state).best;
  const score = Object.values(best).reduce((a, b) => a + (b ?? 0), 0);

  const pick = (id) => (id === 'kuis' ? navigate('/latihan') : onPick(id));

  return (
    <section
      className="relative isolate -mx-4 -mt-4 overflow-hidden bg-[#1a1b55] bg-gradient-to-b from-[#141a4c] via-[#22195c] to-[#3a136b] px-4 pb-8 pt-3 text-white sm:mx-0 sm:mt-0 sm:rounded-[2rem] sm:shadow-2xl sm:shadow-indigo-950/40"
      style={GAME_FONT}
    >
      <div className="pointer-events-none absolute -left-24 top-1/3 -z-10 h-72 w-72 rounded-full bg-fuchsia-600/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-10 -z-10 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />

      {/* HUD atas */}
      <div className="relative z-[2] mx-auto flex max-w-[520px] items-center justify-between gap-2">
        <div
          className="flex h-11 items-center gap-1.5 rounded-2xl border-2 border-amber-300/60 bg-[#0b1a4a]/80 px-3 font-bold"
          aria-label={`Skor total ${score}`}
        >
          <span aria-hidden="true">⭐</span>
          <span className="text-xs uppercase tracking-wider text-amber-200">Skor</span>
          <span className="tabular-nums text-amber-300">{score}</span>
        </div>
        <h2 className="m-0 truncate text-lg font-bold tracking-wide text-sky-100 [text-shadow:0_0_12px_rgba(56,189,248,.6)] sm:text-xl">
          Menu Utama
        </h2>
        <HudButton onClick={() => setSettings((s) => !s)} aria-expanded={settings} aria-controls="menu-settings" aria-label="Pengaturan">
          <span aria-hidden="true">⚙️</span>
          <span className="hidden sm:inline">Pengaturan</span>
        </HudButton>
      </div>

      {settings && (
        <div
          id="menu-settings"
          className="relative z-[3] mx-auto mt-2 max-w-[520px] rounded-2xl border-2 border-sky-400/50 bg-[#0b1a4a]/95 p-3 text-sm shadow-xl motion-safe:animate-fade-up"
        >
          <p className="m-0 mb-2 font-bold text-sky-200">⚙️ Pengaturan</p>
          <div className="grid gap-2">
            <HudButton onClick={onBack}>🏠 Kembali ke layar awal</HudButton>
            <Link
              to="/modul"
              className={`flex h-11 items-center justify-center rounded-2xl border-2 border-sky-400/50 font-bold text-sky-100 no-underline hover:border-sky-300 ${FOCUS}`}
            >
              📚 Modul belajar lengkap
            </Link>
            <Link
              to="/misi"
              className={`flex h-11 items-center justify-center rounded-2xl border-2 border-sky-400/50 font-bold text-sky-100 no-underline hover:border-sky-300 ${FOCUS}`}
            >
              🏗️ Misi Bangun Kota
            </Link>
            {confirmReset ? (
              <div className="rounded-2xl border-2 border-rose-400/60 bg-rose-950/40 p-3 text-center">
                <p className="m-0 mb-2 text-rose-100">Hapus semua skor dan progres di HP ini?</p>
                <div className="grid grid-cols-2 gap-2">
                  <HudButton onClick={() => setConfirmReset(false)}>Batal</HudButton>
                  <button
                    type="button"
                    onClick={() => {
                      dispatch({ type: ACTIONS.RESET });
                      setConfirmReset(false);
                      setSettings(false);
                    }}
                    className={`h-11 cursor-pointer rounded-2xl border-0 bg-rose-600 font-bold text-white ${FOCUS}`}
                  >
                    Ya, hapus
                  </button>
                </div>
              </div>
            ) : (
              <HudButton onClick={() => setConfirmReset(true)}>🗑️ Hapus progres</HudButton>
            )}
          </div>
        </div>
      )}

      {/* Header rumah isometrik */}
      <img
        src={menuHouse}
        alt="Rumah 3D di atas grid koordinat X, Y, Z"
        width="630"
        height="440"
        className="mx-auto mt-1 block h-auto w-full max-w-[340px] sm:max-w-[380px]"
        style={{
          WebkitMaskImage: 'radial-gradient(ellipse 50% 50% at 50% 50%, #000 62%, transparent 100%)',
          maskImage: 'radial-gradient(ellipse 50% 50% at 50% 50%, #000 62%, transparent 100%)',
        }}
      />

      {/* Panel menu */}
      <div className="relative z-[1] mx-auto -mt-4 max-w-[440px]">
        <div className="relative rounded-[1.75rem] bg-gradient-to-b from-[#1e3a8a]/95 to-[#172554]/95 p-2 shadow-[0_0_0_3px_#334155,0_0_0_5px_#0ea5e9,0_12px_40px_rgba(14,165,233,.35)]">
          <Corner className="-left-1.5 -top-1.5 rounded-tl-2xl border-l-4 border-t-4" />
          <Corner className="-right-1.5 -top-1.5 rounded-tr-2xl border-r-4 border-t-4" />
          <Corner className="-bottom-1.5 -left-1.5 rounded-bl-2xl border-b-4 border-l-4" />
          <Corner className="-bottom-1.5 -right-1.5 rounded-br-2xl border-b-4 border-r-4" />

          <div className="rounded-[1.35rem] border-2 border-sky-400/40 bg-[#0b1a4a]/80 px-3 pb-4 pt-3 sm:px-4">
            <p className="m-0 mb-3 text-center text-base font-bold text-amber-300 [text-shadow:0_2px_0_#9a3412] sm:text-lg">
              Pilih petualanganmu!
            </p>
            <ol className="m-0 grid list-none gap-3 p-0">
              {MENU_ITEMS.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => pick(item.id)}
                    className={`group relative flex w-full cursor-pointer items-center gap-3 rounded-2xl border-2 border-white/70 bg-gradient-to-b px-3 py-3 text-left text-white transition duration-150 hover:-translate-y-0.5 active:translate-y-1 ${item.face} ${item.glow} ${FOCUS}`}
                    style={{ boxShadow: `0 6px 0 ${item.edge}, inset 0 2px 0 rgba(255,255,255,.45)` }}
                  >
                    <span
                      className="flex h-12 w-12 flex-none items-center justify-center rounded-xl border-2 border-white/60 bg-white/20 text-3xl transition group-hover:scale-110 group-hover:rotate-[-6deg]"
                      aria-hidden="true"
                    >
                      {item.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xl font-bold leading-tight tracking-wide [text-shadow:0_2px_0_rgba(0,0,0,.35)] sm:text-2xl">
                        {item.number}. {item.title}
                      </span>
                      <span className="block text-xs font-medium leading-snug text-white/90 sm:text-sm">{item.text}</span>
                    </span>
                    <span className="flex-none text-2xl font-bold text-white/90 transition group-hover:translate-x-1" aria-hidden="true">
                      ›
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
