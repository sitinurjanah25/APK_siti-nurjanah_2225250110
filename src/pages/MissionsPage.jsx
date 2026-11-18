import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import CoordinatePlane from '../components/CoordinatePlane.jsx';
import { CosmicPage, FOCUS, GlowTitle, NeonFrame } from '../components/cosmic/Cosmic.jsx';
import { LessonStep } from '../components/LessonPlayer.jsx';
import lessonStyles from '../components/LessonPlayer.module.css';
import { BUILDINGS } from '../data/buildings.js';
import missionData from '../data/missions.json';
import { ACTIONS } from '../state/progress.js';
import { useProgress } from '../state/ProgressContext.jsx';

const BUILDING_BY_ID = Object.fromEntries(BUILDINGS.map((b) => [b.id, b]));
const MISSIONS = missionData.missions;
const ALL_NEW_BUILDINGS = MISSIONS.flatMap((m) => m.builds);

const PRIMARY_BTN =
  'flex min-h-[3rem] w-full items-center justify-center rounded-2xl border-0 bg-gradient-to-r from-blue-800 via-blue-700 to-sky-500 px-5 py-3 text-base font-extrabold text-white no-underline shadow-lg shadow-blue-700/30 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl cursor-pointer';
const SECONDARY_BTN =
  'flex min-h-[3rem] w-full items-center justify-center rounded-2xl border-2 border-blue-200 bg-white px-5 py-3 font-bold text-blue-900 no-underline transition hover:border-blue-400 cursor-pointer';

/** 3 bintang tanpa petunjuk & tanpa salah, 2 bintang kalau petunjuk ≤ 2, selain itu 1. */
function starsFor({ maxHint = 0, wrong = 0 } = {}) {
  if (maxHint === 0 && wrong === 0) return 3;
  return maxHint <= 2 ? 2 : 1;
}

/** Bangunan di Peta Kota: bangunan awal + hasil misi yang sudah diselesaikan. */
function builtIds(base, missions, progress) {
  const set = new Set(base);
  for (const m of missions) {
    if ((progress[m.id]?.stars ?? 0) > 0) for (const id of m.builds) set.add(id);
  }
  return [...set];
}

function Stars({ value, size = 'h-5 w-5', dark = false }) {
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={`${value} dari 3 bintang`}>
      {[1, 2, 3].map((n) => (
        <svg key={n} viewBox="0 0 24 24" className={size} aria-hidden="true">
          <path
            d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6-4.5-4.2 6.1-.7z"
            fill={n <= value ? '#fbbf24' : dark ? '#334155' : '#e2e8f0'}
            stroke={n <= value ? '#b45309' : dark ? '#475569' : '#cbd5e1'}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </span>
  );
}

/** Halaman /misi (daftar) dan /misi/:missionId (memainkan misi). */
export default function MissionsPage() {
  const { missionId } = useParams();
  if (!missionId) return <MissionList />;

  const mission = MISSIONS.find((m) => m.id === missionId);
  if (!mission) {
    return (
      <section className="card">
        <h2>Misi tidak ditemukan</h2>
        <Link to="/misi" className="btn">
          Kembali ke daftar misi
        </Link>
      </section>
    );
  }
  return (
    <CosmicPage>
      <div className="cosmic-panel">
        <MissionPlayer key={mission.id} mission={mission} />
      </div>
    </CosmicPage>
  );
}

function MissionList() {
  const { state } = useProgress();
  const built = builtIds(missionData.base, MISSIONS, state.missions);
  const builtNew = ALL_NEW_BUILDINGS.filter((id) => built.includes(id)).length;
  const remaining = ALL_NEW_BUILDINGS.length - builtNew;
  const totalStars = MISSIONS.reduce((sum, m) => sum + (state.missions[m.id]?.stars ?? 0), 0);
  const listRef = useRef(null);

  return (
    <CosmicPage>
      <GlowTitle className="py-2 text-[2.3rem] sm:text-6xl">Misi Bangun Kota</GlowTitle>

      {/* Panel peta neon */}
      <NeonFrame className="mx-auto mt-6 max-w-[640px]">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="m-0 text-xl font-bold text-white sm:text-2xl">Peta Kota Cartesius</h3>
          <span className="text-sm font-bold text-sky-300 sm:text-base">
            ★ {totalStars} dari {MISSIONS.length * 3} Bintang
          </span>
        </div>
        <p className="m-0 mt-1 text-sm text-indigo-100 sm:text-base">
          {remaining > 0
            ? `Tersisa ${remaining} bangunan baru untuk dibangun. Selesaikan misi agar kota tumbuh.`
            : 'Semua bangunan sudah dibangun. Kotamu lengkap! 🎉'}
        </p>
        <div className="relative mx-auto mt-3 max-w-md">
          <CoordinatePlane range={10} theme="dark" buildings={built.map((id) => BUILDING_BY_ID[id]).filter(Boolean)} />
          <button
            type="button"
            onClick={() => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            aria-label="Lihat daftar misi"
            className={`absolute -bottom-2 -right-2 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border-[3px] border-sky-200 bg-gradient-to-b from-sky-400 to-blue-700 text-3xl shadow-[0_0_20px_rgba(56,189,248,.8)] transition hover:scale-110 sm:h-16 sm:w-16 ${FOCUS}`}
          >
            🧭
          </button>
        </div>
      </NeonFrame>

      {/* Daftar misi */}
      <h3 ref={listRef} className="m-0 mx-auto mt-8 max-w-[640px] scroll-mt-24 text-xl font-bold text-white">
        🚧 Daftar Misi
      </h3>
      <ol className="m-0 mx-auto mt-3 grid max-w-[640px] list-none gap-3 p-0 sm:grid-cols-2">
        {MISSIONS.map((m, i) => {
          const stars = state.missions[m.id]?.stars ?? 0;
          return (
            <li key={m.id}>
              <Link
                to={`/misi/${m.id}`}
                className={`flex h-full items-center gap-3 rounded-3xl border-2 p-4 text-white no-underline backdrop-blur-sm transition duration-200 hover:-translate-y-1 ${stars ? 'border-amber-300/70 bg-amber-400/10 shadow-[0_0_18px_rgba(251,191,36,.25)]' : 'border-sky-400/40 bg-white/5 hover:border-sky-300 hover:shadow-[0_0_20px_rgba(56,189,248,.35)]'} ${FOCUS}`}
              >
                <span
                  className={`flex h-12 w-12 flex-none items-center justify-center rounded-2xl text-lg font-bold ${stars ? 'bg-gradient-to-b from-amber-300 to-orange-500 text-amber-950' : 'bg-gradient-to-b from-sky-400 to-indigo-600 text-white'}`}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-bold uppercase tracking-wider text-sky-300">Misi {i + 1}</span>
                  <span className="block font-bold leading-snug">{m.title}</span>
                  <span className="block text-sm leading-snug text-indigo-100">{m.summary}</span>
                </span>
                <span className="flex flex-none flex-col items-end gap-1.5">
                  <Stars value={stars} size="h-4 w-4" dark />
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold shadow-[0_3px_0_rgba(0,0,0,.35)] ${stars ? 'bg-white/15 text-amber-200' : 'bg-gradient-to-r from-sky-400 to-indigo-500 text-white'}`}
                  >
                    {stars ? '↻ Ulangi' : '▶ Mulai'}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </CosmicPage>
  );
}

function scrollToTop() {
  try {
    window.scrollTo({ top: 0 });
  } catch {
    // abaikan
  }
}

function MissionPlayer({ mission }) {
  const { dispatch } = useProgress();
  const [index, setIndex] = useState(0);
  const [stars, setStars] = useState(null);
  const tally = useRef({ maxHint: 0, wrong: 0 });
  const total = mission.steps.length;

  const next = (info = {}) => {
    tally.current.maxHint = Math.max(tally.current.maxHint, info.hintLevel ?? 0);
    tally.current.wrong += info.wrong ?? 0;
    if (index + 1 < total) {
      setIndex(index + 1);
      scrollToTop();
      return;
    }
    const earned = starsFor(tally.current);
    dispatch({ type: ACTIONS.SET_MISSION_STARS, missionId: mission.id, stars: earned });
    setStars(earned);
    scrollToTop();
  };

  const restart = () => {
    tally.current = { maxHint: 0, wrong: 0 };
    setStars(null);
    setIndex(0);
  };

  if (stars !== null) return <MissionFinished mission={mission} stars={stars} onRestart={restart} />;

  const step = mission.steps[index];
  return (
    <div className={lessonStyles.wrap}>
      <div className={lessonStyles.progress}>
        <span className={lessonStyles.moduleTitle}>{mission.title}</span>
        <span className="muted">
          Langkah {index + 1}/{total}
        </span>
      </div>
      <div
        className={lessonStyles.bar}
        role="progressbar"
        aria-label="Kemajuan misi"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={index + 1}
      >
        <span style={{ width: `${((index + 1) / total) * 100}%` }} />
      </div>
      <LessonStep key={step.id} step={step} fadeHints={false} onNext={next} onPrev={null} isLast={index === total - 1} />
    </div>
  );
}

const STAR_MESSAGES = {
  3: 'Luar biasa! Semua benar tanpa petunjuk.',
  2: 'Bagus! Kamu berhasil dengan sedikit bantuan.',
  1: 'Misi selesai! Coba lagi tanpa petunjuk untuk bintang lebih banyak.',
};

function MissionFinished({ mission, stars, onRestart }) {
  const pos = MISSIONS.findIndex((m) => m.id === mission.id);
  const nextMission = MISSIONS[pos + 1];

  return (
    <section className="space-y-4 rounded-3xl border-2 border-blue-200 bg-white/95 p-6 text-center shadow-lg shadow-blue-900/10">
      <p className="m-0 text-sm font-bold uppercase tracking-wider text-blue-600">Misi selesai</p>
      <h2 className="m-0 text-2xl font-extrabold text-blue-950">{mission.title}</h2>
      <Stars value={stars} size="h-10 w-10" />
      <p className="m-0 text-slate-700">{STAR_MESSAGES[stars]}</p>
      {mission.builds.length > 0 && (
        <p className="m-0 rounded-2xl bg-blue-50 p-3 text-sm font-semibold text-blue-900">
          Bangunan baru muncul di Peta Kota: {mission.builds.map((id) => BUILDING_BY_ID[id]?.name).join(', ')}.
        </p>
      )}
      <div className="space-y-3 pt-1">
        {nextMission && (
          <Link to={`/misi/${nextMission.id}`} className={PRIMARY_BTN}>
            Lanjut: {nextMission.title}
          </Link>
        )}
        <Link to="/misi" className={nextMission ? SECONDARY_BTN : PRIMARY_BTN}>
          Lihat Peta Kota
        </Link>
        <button type="button" className={SECONDARY_BTN} onClick={onRestart}>
          Ulangi misi ini
        </button>
      </div>
    </section>
  );
}
