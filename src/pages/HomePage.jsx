import { Link } from 'react-router-dom';
import { CosmicPage, FOCUS, GAME_FONT, GlowTitle } from '../components/cosmic/Cosmic.jsx';
import Icon from '../components/Icon.jsx';
import { Balloon, CityBlock, MapPin, Mascot, ModuleIcon } from '../components/Illustrations.jsx';
import { MODULES } from '../data/modules.js';
import pretest from '../data/pretest.json';
import quiz from '../data/quiz.json';
import { loadBestScore } from '../lib/quiz.js';
import { hasWebGL } from '../lib/webgl.js';
import { useProgress } from '../state/ProgressContext.jsx';

const MAIN_MODULES = MODULES.filter((m) => !m.warmup);
const WARMUP = MODULES.find((m) => m.warmup);

const GLASS =
  'rounded-3xl border-2 border-indigo-300/30 bg-white/[.07] shadow-[0_0_24px_rgba(129,140,248,.2),inset_0_1px_0_rgba(255,255,255,.15)] backdrop-blur-md';

/** Status setiap modul utama: done, progress, atau open. */
function moduleStatuses(modules) {
  return MAIN_MODULES.map((m) => {
    const p = modules[m.id];
    if (p?.done) return 'done';
    return (p?.step ?? 0) > 0 ? 'progress' : 'open';
  });
}

const STATUS = {
  open: { label: 'Mulai', chip: 'bg-sky-400/20 text-sky-200 border-sky-300/40', ring: 'border-indigo-300/30' },
  progress: { label: 'Lanjutkan', chip: 'bg-amber-400/20 text-amber-200 border-amber-300/50', ring: 'border-amber-300/50' },
  done: { label: '✓ Selesai', chip: 'bg-emerald-400/20 text-emerald-200 border-emerald-300/50', ring: 'border-emerald-300/50' },
};

/** Animasi muncul bertahap. */
const fadeUp = (i) => ({ className: 'motion-safe:animate-fade-up', style: { animationDelay: `${Math.min(i, 9) * 50}ms` } });

function ModuleCard({ mod, number, status, index }) {
  const st = STATUS[status];
  const anim = fadeUp(index);
  return (
    <Link
      to={`/belajar/${mod.id}`}
      className={`group relative flex h-full min-h-[9rem] flex-col rounded-3xl border-2 bg-white/[.07] p-4 text-white no-underline shadow-[0_0_20px_rgba(129,140,248,.15)] backdrop-blur-md transition duration-200 hover:-translate-y-1 hover:border-sky-300/70 hover:shadow-[0_0_26px_rgba(56,189,248,.45)] ${st.ring} ${FOCUS} ${anim.className}`}
      style={anim.style}
    >
      <span className="flex items-start justify-between gap-2">
        <span className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl bg-gradient-to-b from-indigo-400/30 to-violet-700/30 transition group-hover:rotate-[-4deg] group-hover:scale-110">
          <ModuleIcon id={mod.id} className="h-12 w-12 drop-shadow-[0_0_8px_rgba(125,211,252,.5)]" />
        </span>
        <span className={`rounded-full border px-3 py-0.5 text-xs font-bold ${st.chip}`}>{st.label}</span>
      </span>
      <span className="mt-3 block text-lg font-bold leading-snug">
        {number}. {mod.title}
      </span>
      <span className="mt-0.5 block text-sm leading-snug text-indigo-200">{mod.summary}</span>
      {status === 'done' && <span className="visually-hidden">(selesai)</span>}
    </Link>
  );
}

function ShortcutCard({ to, art, title, text }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 p-4 text-white no-underline transition duration-200 hover:-translate-y-1 hover:border-sky-300/60 ${GLASS} ${FOCUS}`}
    >
      <span className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-white/10">{art}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold">{title}</span>
        <span className="block text-sm text-indigo-200">{text}</span>
      </span>
      <Icon name="arrow" className="h-5 w-5 flex-none text-sky-300" strokeWidth={2.5} />
    </Link>
  );
}

/** Halaman /modul: daftar modul belajar bergaya kosmik. */
export default function HomePage() {
  const { state } = useProgress();
  const hasPretest = state.pretestScore !== null;
  const suggestWarmup = hasPretest && state.pretestScore < pretest.passScore && !state.modules[WARMUP.id]?.done;
  const statuses = moduleStatuses(state.modules);
  const doneCount = statuses.filter((s) => s === 'done').length;
  const percent = Math.round((doneCount / MAIN_MODULES.length) * 100);
  const bestQuiz = loadBestScore();
  const quizTotal = quiz.questions.length;

  return (
    <CosmicPage>
      <GlowTitle className="py-2 text-[2.2rem] sm:text-5xl">Modul Belajar</GlowTitle>

      <div className="mx-auto mt-5 max-w-[760px] space-y-5">
        {/* Kartu sambutan (kaca) */}
        <section className={`relative overflow-hidden p-5 sm:p-6 ${GLASS} !border-white/30 bg-gradient-to-br from-white/20 to-white/5`}>
          <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-sky-400/25 blur-3xl" />
          <div className="relative flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="m-0 mb-2 inline-flex items-center gap-1.5 rounded-full bg-indigo-500/40 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-50">
                🎓 Kelas 8 SMP
              </p>
              <h2 className="m-0 text-2xl font-bold leading-tight sm:text-4xl" style={GAME_FONT}>
                Selamat Datang di Kota Koordinat!
              </h2>
              <p className="m-0 mt-2 text-sm leading-relaxed text-indigo-100 sm:text-base">
                <strong className="text-white">Mode Belajar:</strong> Mari kita bangun peta kota dengan meletakkan bangunan di
                koordinat yang tepat.
              </p>
            </div>
            <div className="relative h-32 w-24 flex-none sm:h-44 sm:w-40" aria-hidden="true">
              <Balloon className="absolute -top-1 right-0 h-12 w-9 motion-safe:animate-bounce [animation-duration:3s] sm:h-16 sm:w-12" />
              <MapPin className="absolute bottom-10 left-0 h-7 w-6 sm:h-9 sm:w-7" />
              <span className="absolute bottom-0 left-1/2 h-4 w-20 -translate-x-1/2 rounded-[50%] bg-sky-300/50 blur-sm sm:w-28" />
              <Mascot className="absolute bottom-1 right-1 h-28 w-24 drop-shadow-[0_0_14px_rgba(125,211,252,.6)] sm:h-40 sm:w-32" />
            </div>
          </div>

          <div className="relative mt-5">
            {hasPretest ? (
              <div>
                <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                  <span>
                    Skor Cek Awal: <strong className="text-amber-300">{state.pretestScore} dari 5</strong> · {doneCount} dari{' '}
                    {MAIN_MODULES.length} modul selesai
                  </span>
                  <Link to="/cek-awal" className={`font-bold text-sky-300 ${FOCUS}`}>
                    Ulangi Cek Awal
                  </Link>
                </div>
                <div
                  className="mt-2 h-3 overflow-hidden rounded-full bg-white/10"
                  role="progressbar"
                  aria-label="Kemajuan modul"
                  aria-valuemin={0}
                  aria-valuemax={MAIN_MODULES.length}
                  aria-valuenow={doneCount}
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-300 transition-[width] duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            ) : (
              <Link
                to="/cek-awal"
                className={`flex min-h-[3.5rem] w-full items-center justify-center rounded-full border-2 border-sky-200 bg-gradient-to-b from-sky-400 via-blue-600 to-blue-800 px-5 text-center text-lg font-bold text-white no-underline [text-shadow:0_2px_0_#1e3a8a] motion-safe:animate-glow sm:text-xl ${FOCUS}`}
                style={GAME_FONT}
              >
                Mulai Petualangan Koordinat (Cek Awal)
              </Link>
            )}
          </div>
        </section>

        {/* Banner Mode Quest (neon) */}
        <Link
          to="/quest"
          className={`relative flex items-center gap-4 rounded-3xl border-2 border-fuchsia-400/80 bg-[#140f45]/90 p-4 text-white no-underline shadow-[0_0_0_3px_rgba(56,189,248,.55),0_0_28px_rgba(217,70,239,.45),0_0_40px_rgba(56,189,248,.35)] transition duration-200 hover:-translate-y-1 sm:p-5 ${FOCUS}`}
        >
          <img
            src={`${import.meta.env.BASE_URL}icon.svg`}
            alt=""
            className="h-16 w-16 flex-none rounded-2xl shadow-[0_0_16px_rgba(56,189,248,.5)] sm:h-20 sm:w-20"
          />
          <span className="min-w-0 flex-1">
            <span className="block text-xl font-bold leading-tight sm:text-2xl" style={GAME_FONT}>
              Main cartes.play
            </span>
            <span className="mt-1 flex flex-wrap gap-1.5 text-xs font-bold">
              <span className="rounded-full bg-sky-400/20 px-2 py-0.5 text-sky-200">15 level</span>
              <span className="rounded-full bg-fuchsia-400/20 px-2 py-0.5 text-fuchsia-200">3 dunia</span>
              <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-amber-200">skor · waktu · ❤️ nyawa</span>
            </span>
            <span className="mt-1 block text-sm text-indigo-200">Kota Datar 2D → Kota Bertingkat 3D → Tantangan Master</span>
          </span>
          <Icon name="arrow" className="h-6 w-6 flex-none text-sky-300" strokeWidth={2.5} />
        </Link>

        {suggestWarmup && (
          <Link
            to={`/belajar/${WARMUP.id}`}
            className={`flex items-center gap-3 p-4 text-white no-underline transition hover:-translate-y-1 ${GLASS} !border-amber-300/60 ${FOCUS}`}
          >
            <span className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-amber-400/80 text-amber-950">
              <Icon name="star" />
            </span>
            <span>
              <span className="block font-bold">Disarankan: {WARMUP.title}</span>
              <span className="block text-sm text-indigo-200">{WARMUP.summary}</span>
            </span>
          </Link>
        )}

        {/* Kartu modul */}
        <section>
          <h3 className="m-0 mb-3 text-lg font-bold">📚 Modul</h3>
          <ol className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2">
            {MAIN_MODULES.map((mod, i) => (
              <li key={mod.id}>
                <ModuleCard mod={mod} number={i + 1} status={statuses[i]} index={i + 2} />
              </li>
            ))}
          </ol>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <ShortcutCard
            to="/latihan"
            art={<ModuleIcon id="m4" className="h-10 w-10" />}
            title={`Kuis · ${quizTotal} soal`}
            text={bestQuiz === null ? 'Uji pemahamanmu dan lihat skornya' : `Skor terbaik: ${bestQuiz} dari ${quizTotal}`}
          />
          {hasWebGL() && (
            <ShortcutCard
              to="/kota-3d"
              art={<CityBlock className="h-10 w-10" />}
              title="Eksplorasi Kota 3D"
              text="Putar kota dan cari koordinat bangunan"
            />
          )}
        </section>

        <p className="m-0 flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm">
          {WARMUP && !suggestWarmup && (
            <Link to={`/belajar/${WARMUP.id}`} className="font-bold text-sky-300">
              {WARMUP.title}
            </Link>
          )}
          <Link to="/uji-coba" className="font-bold text-sky-300">
            Punya kode kelas dari guru?
          </Link>
        </p>
      </div>
    </CosmicPage>
  );
}
