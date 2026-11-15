import { Link } from 'react-router-dom';
import { LockIcon } from '../components/Illustrations.jsx';
import { isUnlocked, LEVELS } from '../lib/quest.js';
import { useProgress } from '../state/ProgressContext.jsx';

const LEVEL_STYLE = [
  { badge: 'from-sky-400 to-blue-600', glow: 'shadow-blue-500/30' },
  { badge: 'from-emerald-400 to-teal-600', glow: 'shadow-emerald-500/30' },
  { badge: 'from-orange-400 to-rose-600', glow: 'shadow-orange-500/30' },
];

/** Halaman /quest: pilih level. */
export default function QuestHomePage() {
  const { state } = useProgress();
  const quest = state.quest ?? { best: {}, cleared: {} };
  const total = LEVELS.reduce((sum, l) => sum + (quest.best[l.id] ?? 0), 0);
  const clearedCount = LEVELS.filter((l) => quest.cleared[l.id]).length;

  return (
    <div className="space-y-5 pb-4">
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-900 via-indigo-900 to-violet-900 p-5 text-white shadow-xl shadow-indigo-900/30 sm:p-7">
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-cyan-400/20 blur-2xl" />
        <div className="relative flex items-center gap-4">
          <img
            src={`${import.meta.env.BASE_URL}icon.svg`}
            alt=""
            className="h-20 w-20 flex-none rounded-3xl shadow-lg shadow-black/30 sm:h-24 sm:w-24"
          />
          <div className="min-w-0">
            <p className="m-0 text-xs font-extrabold uppercase tracking-[0.2em] text-cyan-300">Quest Mode</p>
            <h2 className="m-0 text-3xl font-black tracking-tight sm:text-4xl">c-quest.sn25</h2>
            <p className="m-0 mt-1 text-sm text-indigo-100 sm:text-base">
              Dari bidang 2D ke ruang 3D. Pasang rumah di koordinat yang tepat!
            </p>
          </div>
        </div>
        <div className="relative mt-5 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-white/10 p-2">
            <p className="m-0 text-[0.65rem] font-bold uppercase tracking-wider text-cyan-200">Total skor</p>
            <p className="m-0 text-xl font-black tabular-nums">{total}</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-2">
            <p className="m-0 text-[0.65rem] font-bold uppercase tracking-wider text-cyan-200">Level lulus</p>
            <p className="m-0 text-xl font-black">
              {clearedCount}/{LEVELS.length}
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 p-2">
            <p className="m-0 text-[0.65rem] font-bold uppercase tracking-wider text-cyan-200">Nyawa</p>
            <p className="m-0 text-xl">❤️❤️❤️</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="cara-main" className="rounded-3xl border-2 border-blue-200 bg-white/95 p-4 shadow-lg shadow-blue-900/10">
        <h3 id="cara-main" className="m-0 mb-2 text-base font-extrabold text-blue-950">
          Cara main
        </h3>
        <ul className="m-0 grid gap-2 p-0 text-sm text-slate-700 sm:grid-cols-3">
          <li className="flex list-none items-start gap-2 rounded-2xl bg-blue-50 p-3">
            <span aria-hidden="true">⭐</span> Jawab benar = 100 poin + bonus sisa waktu + bonus beruntun.
          </li>
          <li className="flex list-none items-start gap-2 rounded-2xl bg-amber-50 p-3">
            <span aria-hidden="true">⏱</span> Setiap soal punya batas waktu. Waktu habis = nyawa berkurang.
          </li>
          <li className="flex list-none items-start gap-2 rounded-2xl bg-rose-50 p-3">
            <span aria-hidden="true">❤️</span> Ada 3 nyawa. Salah jawab = nyawa berkurang satu.
          </li>
        </ul>
      </section>

      <ol className="m-0 grid list-none gap-4 p-0">
        {LEVELS.map((level, i) => {
          const open = isUnlocked(level.id, quest.cleared);
          const best = quest.best[level.id];
          const cleared = !!quest.cleared[level.id];
          const st = LEVEL_STYLE[i % LEVEL_STYLE.length];
          const content = (
            <>
              <span
                className={`flex h-14 w-14 flex-none items-center justify-center rounded-2xl bg-gradient-to-br text-2xl font-black text-white shadow-lg ${open ? `${st.badge} ${st.glow}` : 'from-slate-300 to-slate-400'}`}
                aria-hidden="true"
              >
                {open ? level.number : <LockIcon className="h-7 w-7" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-bold uppercase tracking-wider text-blue-600">
                  Level {level.number}
                  {cleared && ' · Lulus ✓'}
                </span>
                <span className={`block text-lg font-extrabold leading-snug ${open ? 'text-blue-950' : 'text-slate-500'}`}>
                  {level.title}
                </span>
                <span className="block text-sm leading-snug text-slate-600">
                  {open ? level.tagline : `Lulus Level ${level.number - 1} dulu untuk membuka`}
                </span>
              </span>
              <span className="flex flex-none flex-col items-end gap-1 text-right">
                {best != null && (
                  <span className="text-xs font-bold text-slate-500">
                    Terbaik <span className="block text-base font-black text-blue-900 tabular-nums">{best}</span>
                  </span>
                )}
                {open && (
                  <span className="rounded-full bg-blue-700 px-3 py-1 text-xs font-black text-white">
                    {best != null ? 'Main lagi' : 'Main'}
                  </span>
                )}
              </span>
            </>
          );
          const cls =
            'flex items-center gap-3 rounded-3xl border-2 p-4 no-underline shadow-lg transition duration-200';
          return (
            <li key={level.id}>
              {open ? (
                <Link
                  to={`/quest/${level.id}`}
                  className={`${cls} border-blue-200 bg-white shadow-blue-900/10 hover:-translate-y-1 hover:border-blue-400 hover:shadow-xl focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-blue-700`}
                >
                  {content}
                </Link>
              ) : (
                <div className={`${cls} cursor-not-allowed border-slate-300 bg-slate-100/95 shadow-slate-900/5`} aria-disabled="true">
                  {content}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
