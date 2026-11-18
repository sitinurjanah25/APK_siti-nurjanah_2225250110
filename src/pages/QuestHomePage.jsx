import { useState } from 'react';
import { Link } from 'react-router-dom';
import menuHouse from '../assets/menu-house.jpg';
import { CosmicPage, FOCUS, GAME_FONT, HudButton } from '../components/cosmic/Cosmic.jsx';
import { DIFFICULTY_LIST, isUnlocked, LEVELS, MAX_LIVES, SECTIONS, secondsFor } from '../lib/quest.js';
import { questOf } from '../state/progress.js';
import { useProgress } from '../state/ProgressContext.jsx';

/** Posisi node (persen dari lebar/tinggi peta) — jalur berkelok untuk 5 level per dunia. */
const NODE_POS = [
  [16, 26],
  [47, 16],
  [82, 32],
  [64, 64],
  [26, 76],
];

/** Warna pita label tiap node. */
const NODE_TONE = [
  'from-sky-500 to-blue-700',
  'from-amber-500 to-orange-700',
  'from-emerald-500 to-teal-700',
  'from-fuchsia-500 to-pink-700',
  'from-violet-500 to-purple-700',
];

/** Latar cadangan dari CSS: laut biru + pulau hijau, tampil walau SVG peta gagal dimuat. */
const MAP_FALLBACK = {
  backgroundColor: '#3b8fcc',
  backgroundImage: [
    'radial-gradient(ellipse 14% 12% at 20% 24%, #7cc66a 95%, transparent 100%)',
    'radial-gradient(ellipse 12% 8% at 50% 14%, #7cc66a 95%, transparent 100%)',
    'radial-gradient(ellipse 12% 14% at 80% 32%, #7cc66a 95%, transparent 100%)',
    'radial-gradient(ellipse 12% 12% at 60% 64%, #7cc66a 95%, transparent 100%)',
    'radial-gradient(ellipse 12% 12% at 22% 74%, #7cc66a 95%, transparent 100%)',
    'linear-gradient(135deg, #4aa3d8, #2f7fbf)',
  ].join(','),
};

/** Rumah isometrik; kalau gambar gagal dimuat, diganti ilustrasi CSS + emoji. */
function HouseArt({ className = '' }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span
        aria-hidden="true"
        className={`${className} flex aspect-[63/44] items-center justify-center rounded-[40%] bg-[radial-gradient(circle,rgba(132,204,22,.55),transparent_70%)] text-5xl sm:text-7xl`}
      >
        🏠
      </span>
    );
  }
  return (
    <img
      src={menuHouse}
      alt=""
      width="630"
      height="440"
      onError={() => setFailed(true)}
      className={`${className} h-auto drop-shadow-[0_0_14px_rgba(132,204,22,.6)]`}
      style={{
        WebkitMaskImage: 'radial-gradient(ellipse 50% 50% at 50% 50%, #000 55%, transparent 100%)',
        maskImage: 'radial-gradient(ellipse 50% 50% at 50% 50%, #000 55%, transparent 100%)',
      }}
    />
  );
}

/** Halaman /quest: World Map 15 level dalam 3 dunia. */
export default function QuestHomePage() {
  const { state } = useProgress();
  const quest = questOf(state);
  const total = LEVELS.reduce((sum, l) => sum + (quest.best[l.id] ?? 0), 0);
  const nextId = LEVELS.find((l) => isUnlocked(l.id, quest.cleared) && !quest.cleared[l.id])?.id;
  const nextSection = LEVELS.find((l) => l.id === nextId)?.section ?? SECTIONS[0].id;

  const [worldId, setWorldId] = useState(nextSection);
  const [picked, setPicked] = useState(nextId ?? null);
  const [help, setHelp] = useState(false);

  const world = SECTIONS.find((s) => s.id === worldId) ?? SECTIONS[0];
  const worldIndex = SECTIONS.indexOf(world);
  const done = world.levels.filter((l) => quest.cleared[l.id]).length;
  const selected = world.levels.find((l) => l.id === picked) ?? world.levels.find((l) => l.id === nextId) ?? world.levels[0];

  return (
    <CosmicPage>
      {/* HUD */}
      <div className="sticky top-[calc(var(--header-h)+var(--safe-top)+6px)] z-[6] mx-auto flex max-w-[760px] items-center justify-between gap-2 rounded-2xl border-2 border-indigo-300/30 bg-[#160f45]/80 px-3 py-1.5 backdrop-blur-md">
        <span className="flex items-center gap-1.5 text-lg font-bold" aria-label={`Skor total ${total}`}>
          <span aria-hidden="true">🌟</span> Skor: <span className="tabular-nums text-amber-300">{total}</span>
        </span>
        <span className="text-xl" role="img" aria-label={`${MAX_LIVES} nyawa di setiap level`} title="Nyawa di setiap level">
          {'❤️'.repeat(MAX_LIVES)}
        </span>
        <HudButton onClick={() => setHelp((v) => !v)} aria-expanded={help} aria-controls="quest-help">
          <span aria-hidden="true">⚙️</span>
          <span className="hidden sm:inline">Pengaturan</span>
          <span className="visually-hidden sm:hidden">Pengaturan</span>
        </HudButton>
      </div>

      {help && <QuestHelp />}

      {/* Pilih dunia */}
      <div className="mx-auto mt-4 grid max-w-[760px] grid-cols-3 gap-2" role="tablist" aria-label="Pilih dunia">
        {SECTIONS.map((s, i) => {
          const active = s.id === world.id;
          const cleared = s.levels.filter((l) => quest.cleared[l.id]).length;
          return (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setWorldId(s.id);
                setPicked(null);
              }}
              className={`cursor-pointer rounded-2xl border-2 px-2 py-2 text-center transition ${active ? 'border-amber-300 bg-gradient-to-b from-[#5b3a8f] to-[#3b2470] shadow-[0_0_18px_rgba(251,191,36,.55)]' : 'border-indigo-300/30 bg-white/5 hover:bg-white/10'} ${FOCUS}`}
              style={GAME_FONT}
            >
              <span className="block text-xl" aria-hidden="true">
                {s.emoji}
              </span>
              <span className={`block text-sm font-bold ${active ? 'text-amber-100' : 'text-white'}`}>Dunia {i + 1}</span>
              <span className={`block text-xs ${active ? 'text-amber-200' : 'text-indigo-200'}`}>
                {cleared}/{s.levels.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Kartu perkamen */}
      <section
        aria-labelledby="world-title"
        className="relative mx-auto mt-5 max-w-[760px] rounded-[2rem] border-[6px] border-[#6b4a3a] bg-[#f3e2c4] p-3 text-[#2a1b4a] shadow-[0_0_0_2px_#3b2a4f,0_18px_40px_rgba(0,0,0,.45)] sm:p-5"
      >
        <div className="rounded-[1.5rem] border-2 border-dashed border-[#c9a77a] px-3 pb-4 pt-4 sm:px-5">
          {/* Judul + progres */}
          <div className="relative pr-24 sm:pr-40">
            <h2 id="world-title" className="m-0 text-2xl font-bold leading-tight sm:text-4xl">
              Dunia {worldIndex + 1} – {world.title.split('·')[1]?.trim() ?? world.title}
            </h2>
            <p className="m-0 mt-1 text-sm text-[#5b4a6e] sm:text-base">{world.subtitle}</p>
            <div className="mt-3 max-w-sm">
              <div
                className="relative h-7 overflow-hidden rounded-full border-2 border-[#3b2a6b] bg-[#2a1f5c]"
                role="progressbar"
                aria-label="Kemajuan dunia"
                aria-valuemin={0}
                aria-valuemax={world.levels.length}
                aria-valuenow={done}
              >
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-lime-300 transition-[width] duration-700"
                  style={{ width: `${(done / world.levels.length) * 100}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white [text-shadow:0_1px_2px_#000]">
                  {done}/{world.levels.length}
                </span>
              </div>
              <p className="m-0 mt-1 text-center text-sm font-bold text-[#3b2a6b]">Kemajuan Dunia</p>
            </div>
            <HouseArt className="absolute -right-1 -top-2 w-24 sm:-top-4 sm:w-40" />

          </div>

          <span className="mt-4 inline-block rounded-full border-2 border-[#b8916a] bg-[#e9d1ac] px-4 py-1 text-sm font-bold text-[#5b3a22]">
            🗺️ World Map
          </span>

          {/* Peta */}
          <WorldMap
            world={world}
            quest={quest}
            nextId={nextId}
            selectedId={selected?.id}
            onPick={(id) => setPicked(id)}
          />

          {/* Detail misi */}
          {selected && <LevelDetail level={selected} quest={quest} isNext={selected.id === nextId} />}
        </div>
      </section>
    </CosmicPage>
  );
}

/* ---------- Peta dunia ---------- */

function WorldMap({ world, quest, nextId, selectedId, onPick }) {
  const pts = NODE_POS.slice(0, world.levels.length);
  const path = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');
  return (
    <div className="relative mt-3 aspect-[4/3] w-full overflow-hidden rounded-xl sm:aspect-[16/10]" style={MAP_FALLBACK}>
      {/* Gambar peta: laut + daratan */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id="sea" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#4aa3d8" />
            <stop offset="1" stopColor="#2f7fbf" />
          </linearGradient>
        </defs>
        <path d="M6 10 L94 6 L97 92 L3 95 Z" fill="url(#sea)" stroke="#c9a77a" strokeWidth="1" />
        <g fill="#7cc66a" stroke="#5a9e4a" strokeWidth=".4" opacity=".95">
          <path d="M10 18 C18 10 30 14 32 22 C34 32 22 38 14 34 C8 31 6 24 10 18Z" />
          <path d="M40 10 C52 6 62 10 60 18 C58 24 46 26 40 20 Z" />
          <path d="M70 18 C82 14 92 22 90 34 C88 44 76 46 72 38 C68 30 64 22 70 18Z" />
          <path d="M50 52 C60 46 74 52 72 66 C70 78 56 80 50 72 C46 64 44 56 50 52Z" />
          <path d="M14 62 C22 56 34 60 34 70 C34 82 22 88 14 82 C8 76 8 66 14 62Z" />
          <path d="M80 72 C86 70 92 76 90 84 C88 90 80 90 78 84 C76 80 76 74 80 72Z" />
        </g>
        <g fill="none" stroke="#e8f4ff" strokeWidth=".35" opacity=".6">
          <path d="M40 40 q3 -2 6 0 q3 2 6 0" />
          <path d="M20 48 q3 -2 6 0 q3 2 6 0" />
          <path d="M70 88 q3 -2 6 0 q3 2 6 0" />
        </g>
        {/* Jalur petualangan */}
        <path d={path} fill="none" stroke="#fff7e6" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" opacity=".9" />
        <path d={path} fill="none" stroke="#d29a4a" strokeWidth="1" strokeDasharray="2 2" strokeLinecap="round" />
      </svg>

      {/* Node level */}
      <ol className="m-0 list-none p-0">
        {world.levels.map((level, i) => {
          const [x, y] = pts[i];
          const open = isUnlocked(level.id, quest.cleared);
          const cleared = !!quest.cleared[level.id];
          const isNext = level.id === nextId;
          const isSel = level.id === selectedId;
          return (
            <li key={level.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${x}%`, top: `${y}%` }}>
              <button
                type="button"
                onClick={() => onPick(level.id)}
                aria-pressed={isSel}
                aria-label={`Level ${level.number}: ${level.title}${cleared ? ', lulus' : open ? '' : ', terkunci'}`}
                className={`group flex cursor-pointer flex-col items-center border-0 bg-transparent p-0 ${FOCUS}`}
                style={GAME_FONT}
              >
                <span
                  className={`relative flex h-11 w-11 items-center justify-center rounded-full border-[3px] text-lg font-bold text-white transition group-hover:scale-110 sm:h-14 sm:w-14 sm:text-xl ${
                    cleared
                      ? 'border-white bg-gradient-to-b from-emerald-400 to-green-600 shadow-[0_0_16px_rgba(52,211,153,.9)]'
                      : open
                        ? 'border-white bg-gradient-to-b from-amber-300 to-orange-500 shadow-[0_0_18px_rgba(251,191,36,.95)]'
                        : 'border-[#d6c4a5] bg-gradient-to-b from-slate-400 to-slate-600'
                  } ${isNext ? 'motion-safe:animate-pulse' : ''} ${isSel ? 'scale-110 ring-4 ring-white/80' : ''}`}
                >
                  {cleared ? '✓' : open ? level.number : '🔒'}
                </span>
                <span
                  className={`mt-1 max-w-[6.5rem] truncate rounded-full bg-gradient-to-b px-2 py-0.5 text-[0.65rem] font-bold text-white shadow-[0_3px_0_rgba(0,0,0,.25)] sm:max-w-[9rem] sm:px-3 sm:text-sm ${open ? NODE_TONE[i % NODE_TONE.length] : 'from-stone-500 to-stone-700'}`}
                >
                  {level.title}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ---------- Detail level terpilih ---------- */

function LevelDetail({ level, quest, isNext }) {
  const open = isUnlocked(level.id, quest.cleared);
  const cleared = !!quest.cleared[level.id];
  const best = quest.best[level.id];
  const medal = DIFFICULTY_LIST.find((d) => d.rank === quest.medals[level.id]);
  return (
    <div
      key={level.id}
      className="mt-4 rounded-2xl border-2 border-[#c9a77a] bg-[#fbf1de] p-4 motion-safe:animate-fade-up"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="m-0 text-xs font-bold uppercase tracking-wider text-[#8a5a2b]">
            Level {level.number}
            {isNext && ' · Berikutnya'}
            {cleared && medal && ` · ${medal.medal} ${medal.label}`}
          </p>
          <h3 className="m-0 text-xl font-bold text-[#2a1b4a]">{level.title}</h3>
          <p className="m-0 text-sm text-[#5b4a6e]">{level.tagline}</p>
        </div>
        {best != null && (
          <p className="m-0 rounded-xl bg-[#2a1f5c] px-3 py-1 text-right text-xs font-bold text-amber-200">
            Terbaik
            <span className="block text-lg tabular-nums text-white">{best}</span>
          </p>
        )}
      </div>
      <ul className="m-0 mt-2 flex flex-wrap gap-2 p-0 text-xs font-bold text-[#3b2a6b]">
        <li className="list-none rounded-full bg-[#ecdcbf] px-3 py-1">🎯 {level.challenges.length} misi</li>
        <li className="list-none rounded-full bg-[#ecdcbf] px-3 py-1">⏱ ±{secondsFor(level, 'medium')} detik/misi</li>
        <li className="list-none rounded-full bg-[#ecdcbf] px-3 py-1">❤️ × {MAX_LIVES}</li>
      </ul>
      {open ? (
        <Link
          to={`/quest/${level.id}`}
          className={`mt-3 flex min-h-12 items-center justify-center rounded-full border-2 border-white bg-gradient-to-b from-lime-300 via-green-500 to-emerald-600 text-lg font-bold text-[#0f2a14] no-underline shadow-[0_5px_0_#166534,0_0_18px_rgba(132,204,22,.5)] transition hover:-translate-y-0.5 ${FOCUS}`}
          style={GAME_FONT}
        >
          ▶ {cleared ? 'Main lagi' : 'Mulai'} Level {level.number}
        </Link>
      ) : (
        <p className="m-0 mt-3 rounded-full bg-[#e2d3b8] px-4 py-2 text-center text-sm font-bold text-[#6b5a4a]">
          🔒 Lulus Level {level.number - 1} dulu untuk membuka level ini
        </p>
      )}
    </div>
  );
}

/* ---------- Panel bantuan ---------- */

function QuestHelp() {
  return (
    <div
      id="quest-help"
      className="mx-auto mt-2 max-w-[760px] rounded-2xl border-2 border-indigo-300/40 bg-[#160f45]/95 p-4 text-sm text-indigo-50 motion-safe:animate-fade-up"
    >
      <p className="m-0 font-bold text-white">⚙️ Cara main & tingkat kesulitan</p>
      <ul className="m-0 mt-2 space-y-1 pl-5">
        <li>Jawab benar = 100 poin + bonus sisa waktu, dikali combo (sampai ×2) dan tingkat kesulitan.</li>
        <li>Waktu habis atau salah jawab = nyawa berkurang. Ada {MAX_LIVES} nyawa di setiap level.</li>
        <li>Lulus level untuk membuka level berikutnya.</li>
      </ul>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {DIFFICULTY_LIST.map((d) => (
          <p key={d.id} className="m-0 rounded-xl bg-white/5 p-2">
            <strong className="text-white">
              {d.emoji} {d.label} · ×{d.scoreMult} · {d.medal}
            </strong>
            <br />
            {d.desc}
          </p>
        ))}
      </div>
      <Link to="/" className={`mt-3 inline-block font-bold text-sky-300 ${FOCUS}`}>
        🏠 Kembali ke Menu Utama
      </Link>
    </div>
  );
}
