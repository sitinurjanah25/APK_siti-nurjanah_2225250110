import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import {
  Balloon,
  CityBlock,
  IsoGridBackground,
  LockIcon,
  MapPin,
  Mascot,
  ModuleIcon,
} from '../components/Illustrations.jsx';
import { MODULES } from '../data/modules.js';
import pretest from '../data/pretest.json';
import quiz from '../data/quiz.json';
import { loadBestScore } from '../lib/quiz.js';
import { hasWebGL } from '../lib/webgl.js';
import { useProgress } from '../state/ProgressContext.jsx';

const MAIN_MODULES = MODULES.filter((m) => !m.warmup);
const WARMUP = MODULES.find((m) => m.warmup);

/** Status setiap modul utama: done, progress, atau open. */
function moduleStatuses(modules) {
  return MAIN_MODULES.map((m) => {
    const p = modules[m.id];
    if (p?.done) return 'done';
    return (p?.step ?? 0) > 0 ? 'progress' : 'open';
  });
}

const STATUS_STYLE = {
  open: {
    card: 'border-blue-200 bg-white shadow-lg shadow-blue-900/10 hover:-translate-y-1 hover:border-blue-400 hover:shadow-xl',
    chip: 'bg-blue-50 text-blue-700',
    icon: 'text-blue-600',
    label: 'Siap',
  },
  progress: {
    card: 'border-sky-400 bg-sky-50 shadow-lg shadow-blue-900/10 hover:-translate-y-1 hover:shadow-xl',
    chip: 'bg-sky-100 text-sky-800',
    icon: 'text-sky-600',
    label: 'Lanjutkan',
  },
  done: {
    card: 'border-blue-500 bg-gradient-to-br from-blue-100 to-white shadow-lg shadow-blue-900/10 hover:-translate-y-1 hover:shadow-xl',
    chip: 'bg-blue-700 text-white',
    icon: 'text-blue-700',
    label: 'Selesai',
  },
  locked: {
    card: 'border-slate-300 bg-slate-100/95 shadow-md shadow-slate-900/5 cursor-not-allowed',
    chip: 'bg-slate-200 text-slate-600',
    icon: '',
    label: 'Terkunci',
  },
};

/** Animasi muncul bertahap. */
const fadeUp = (i) => ({
  className: 'motion-safe:animate-fade-up',
  style: { animationDelay: `${Math.min(i, 9) * 50}ms` },
});

const FOCUS =
  'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-blue-700';

function ModuleCard({ mod, number, status, index }) {
  const anim = fadeUp(index);
  const st = STATUS_STYLE[status];
  const locked = status === 'locked';

  const content = (
    <>
      <span className="flex items-center gap-2">
        {locked ? (
          <LockIcon className="h-7 w-7" />
        ) : (
          <Icon
            name={status === 'done' ? 'check' : mod.id}
            className={`h-7 w-7 ${st.icon}`}
            strokeWidth={status === 'done' ? 2.6 : 2}
          />
        )}
        <span className={`rounded-full px-3 py-0.5 text-sm font-bold ${st.chip}`}>{st.label}</span>
      </span>
      <span
        className={`mt-2 block text-lg font-extrabold leading-snug ${locked ? 'text-slate-600' : 'text-blue-950'}`}
      >
        {number}. {mod.title}
      </span>
      <span className={`mt-1 block text-sm leading-snug ${locked ? 'text-slate-500' : 'text-slate-600'}`}>
        {locked ? `Selesaikan Modul ${number - 1} dulu` : mod.summary}
      </span>
      <ModuleIcon
        id={mod.id}
        className={`pointer-events-none absolute bottom-3 right-3 h-[4.5rem] w-[4.5rem] drop-shadow-md sm:h-20 sm:w-20 ${locked ? 'opacity-70 saturate-50' : ''}`}
      />
    </>
  );

  const cls = `relative block min-h-[8.75rem] rounded-3xl border-2 p-4 pr-24 no-underline transition duration-200 ease-out sm:pr-28 ${st.card} ${anim.className}`;

  if (locked) {
    return (
      <div className={cls} style={anim.style} aria-disabled="true">
        {content}
      </div>
    );
  }

  return (
    <Link to={`/belajar/${mod.id}`} className={`${cls} ${FOCUS}`} style={anim.style}>
      {content}
      {status === 'done' && <span className="visually-hidden">(selesai)</span>}
    </Link>
  );
}

function ProgressSummary({ score, doneCount, total }) {
  const percent = Math.round((doneCount / total) * 100);
  return (
    <div className="rounded-3xl border-2 border-blue-200 bg-white/95 p-4 shadow-lg shadow-blue-900/10 backdrop-blur-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="m-0 text-blue-950">
            Skor Cek Awal: <strong>{score} dari 5</strong>
          </p>
          <p className="m-0 mt-0.5 text-sm text-slate-600">
            <span>
              {doneCount} dari {total} modul selesai
            </span>
          </p>
        </div>
        <Link to="/cek-awal" className={`rounded-lg px-2 py-1 text-sm font-bold text-blue-800 ${FOCUS}`}>
          Ulangi Cek Awal
        </Link>
      </div>
      <div
        className="mt-3 h-3 overflow-hidden rounded-full bg-blue-100"
        role="progressbar"
        aria-label="Kemajuan modul"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={doneCount}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-700 to-sky-400 transition-[width] duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function ShortcutCard({ to, art, title, text, className = '', style }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 rounded-3xl border-2 border-blue-200 bg-white/95 p-4 no-underline shadow-lg shadow-blue-900/10 backdrop-blur-sm transition duration-200 hover:-translate-y-1 hover:border-blue-400 hover:shadow-xl ${FOCUS} ${className}`}
      style={style}
    >
      {art}
      <span className="min-w-0 flex-1">
        <span className="block font-extrabold text-blue-950">{title}</span>
        <span className="block text-sm text-slate-600">{text}</span>
      </span>
      <Icon name="arrow" className="h-5 w-5 flex-none text-blue-600" strokeWidth={2.5} />
    </Link>
  );
}

export default function HomePage() {
  const { state } = useProgress();
  const hasPretest = state.pretestScore !== null;
  const suggestWarmup =
    hasPretest && state.pretestScore < pretest.passScore && !state.modules[WARMUP.id]?.done;
  const statuses = moduleStatuses(state.modules);
  const doneCount = statuses.filter((s) => s === 'done').length;
  const bestQuiz = loadBestScore();
  const quizTotal = quiz.questions.length;

  return (
    <div className="relative isolate overflow-hidden rounded-[2rem] bg-gradient-to-b from-white to-[#e4eeff] px-4 pb-6 pt-6 shadow-inner sm:px-8 sm:pt-8">
      <IsoGridBackground className="pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-70" />
      <CityBlock
        variant={0}
        className="pointer-events-none absolute -left-6 top-[30rem] -z-10 hidden w-32 opacity-60 sm:block"
      />
      <CityBlock
        variant={1}
        className="pointer-events-none absolute -right-6 top-[26rem] -z-10 hidden w-32 opacity-60 sm:block"
      />
      <CityBlock variant={1} className="pointer-events-none absolute -left-4 bottom-24 -z-10 w-24 opacity-50" />
      <CityBlock variant={0} className="pointer-events-none absolute -right-4 bottom-4 -z-10 w-24 opacity-50" />

      <div className="space-y-6 sm:space-y-7">
        <header className={`relative flex items-center gap-2 sm:gap-6 ${fadeUp(0).className}`}>
          <div className="min-w-0 flex-1">
            <p className="m-0 mb-2 inline-flex items-center gap-1.5 rounded-full bg-blue-700 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-white shadow-md shadow-blue-900/20 sm:text-sm">
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path
                  d="M3 9l9-5 9 5-9 5-9-5zM7 11.5V16c0 1.5 2.5 3 5 3s5-1.5 5-3v-4.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Kelas 8 SMP
            </p>
            <h2 className="m-0 text-[1.6rem] font-black leading-[1.15] tracking-tight text-blue-900 [text-shadow:0_2px_0_#ffffff,0_6px_14px_rgba(30,64,175,0.18)] sm:text-5xl">
              Selamat Datang di Kota Koordinat!
            </h2>
            <p className="m-0 mt-2 text-sm leading-relaxed text-slate-600 sm:text-lg">
              <span className="font-bold">Mode Belajar:</span> Mari kita bangun peta kota dengan meletakkan bangunan
              di koordinat yang tepat.
            </p>
          </div>
          <div className="relative h-28 w-24 flex-none sm:h-48 sm:w-48">
            <Balloon className="absolute -top-2 right-0 h-12 w-9 sm:h-20 sm:w-14" />
            <MapPin className="absolute bottom-8 left-0 h-7 w-6 sm:bottom-12 sm:h-10 sm:w-8" />
            <Mascot className="absolute bottom-0 right-0 h-24 w-20 drop-shadow-md sm:h-40 sm:w-36" />
          </div>
        </header>

        <section className={fadeUp(1).className} style={fadeUp(1).style}>
          {hasPretest ? (
            <ProgressSummary score={state.pretestScore} doneCount={doneCount} total={MAIN_MODULES.length} />
          ) : (
            <Link
              to="/cek-awal"
              className={`flex min-h-[3.75rem] w-full items-center justify-center rounded-2xl border-2 border-blue-300 bg-gradient-to-r from-blue-800 via-blue-700 to-sky-500 px-5 py-4 text-center text-lg font-extrabold text-white no-underline shadow-lg shadow-blue-700/30 transition duration-200 ease-out [text-shadow:0_1px_2px_rgba(0,0,0,0.3)] hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-700/40 active:translate-y-0 sm:text-xl ${FOCUS}`}
            >
              Mulai Petualangan Koordinat (Cek Awal)
            </Link>
          )}
        </section>

        <Link
          to="/quest"
          className={`relative flex items-center gap-4 overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 via-indigo-900 to-violet-900 p-4 text-white no-underline shadow-lg shadow-indigo-900/30 transition duration-200 hover:-translate-y-1 hover:shadow-xl sm:p-5 ${FOCUS} ${fadeUp(2).className}`}
          style={fadeUp(2).style}
        >
          <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" className="h-16 w-16 flex-none rounded-2xl sm:h-20 sm:w-20" />
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-extrabold uppercase tracking-[0.2em] text-cyan-300">Quest Mode · Baru</span>
            <span className="block text-xl font-black leading-tight sm:text-2xl">Main c-quest.sn25</span>
            <span className="block text-sm text-indigo-100">3 level: bidang 2D → ruang 3D → pasang rumah di (x, y, z). Ada skor, waktu, dan nyawa!</span>
          </span>
          <Icon name="arrow" className="h-6 w-6 flex-none text-cyan-300" strokeWidth={2.5} />
        </Link>

        {suggestWarmup && (
          <Link
            to={`/belajar/${WARMUP.id}`}
            className={`flex items-center gap-3 rounded-3xl border-2 border-sky-300 bg-sky-50 p-4 no-underline shadow-lg shadow-blue-900/10 transition duration-200 hover:-translate-y-1 hover:shadow-xl ${FOCUS} ${fadeUp(2).className}`}
            style={fadeUp(2).style}
          >
            <span className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-blue-600 text-white">
              <Icon name="star" />
            </span>
            <span>
              <span className="block font-extrabold text-blue-950">Disarankan: {WARMUP.title}</span>
              <span className="block text-sm text-slate-600">{WARMUP.summary}</span>
            </span>
          </Link>
        )}

        <section className="space-y-3">
          <h2 className="visually-hidden">Modul belajar</h2>
          <ol className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2">
            {MAIN_MODULES.map((mod, i) => (
              <li key={mod.id}>
                <ModuleCard mod={mod} number={i + 1} status={statuses[i]} index={i + 2} />
              </li>
            ))}
          </ol>
        </section>

        <section className={`grid gap-4 sm:grid-cols-2 ${fadeUp(9).className}`} style={fadeUp(9).style}>
          <ShortcutCard
            to="/latihan"
            art={<ModuleIcon id="m4" className="h-12 w-12 flex-none" />}
            title={`Latihan Soal · ${quizTotal} soal`}
            text={bestQuiz === null ? 'Uji pemahamanmu dan lihat skornya' : `Skor terbaik: ${bestQuiz} dari ${quizTotal}`}
          />
          {hasWebGL() && (
            <ShortcutCard
              to="/kota-3d"
              art={<CityBlock className="h-12 w-12 flex-none" />}
              title="Lihat Kota 3D · Eksperimen"
              text="Putar kota dan cari koordinat bangunan"
            />
          )}
        </section>

        <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm">
          {WARMUP && !suggestWarmup && (
            <Link to={`/belajar/${WARMUP.id}`} className="font-bold text-blue-800">
              {WARMUP.title}
            </Link>
          )}
          <Link to="/uji-coba" className="font-bold text-blue-800">
            Punya kode kelas dari guru?
          </Link>
        </div>
      </div>
    </div>
  );
}
