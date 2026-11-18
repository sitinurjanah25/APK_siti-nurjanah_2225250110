import { useEffect, useRef, useState } from 'react';
import { comboMultiplier, getDifficulty, MAX_LIVES } from '../../lib/quest.js';

function Heart({ full }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-6 w-6 transition duration-300 ${full ? '' : 'scale-90 opacity-40'}`} aria-hidden="true">
      <path
        d="M12 21s-7.5-4.6-9.6-9.3C.9 8.2 3 4.5 6.6 4.5c2.1 0 3.6 1.2 4.4 2.6.8-1.4 2.3-2.6 4.4-2.6 3.6 0 5.7 3.7 4.2 7.2C19.5 16.4 12 21 12 21z"
        fill={full ? '#f43f5e' : '#475569'}
        stroke={full ? '#fecdd3' : '#64748b'}
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function Lives({ lives, hitCount = 0 }) {
  return (
    <span
      key={hitCount}
      className={`flex items-center gap-0.5 ${hitCount ? 'motion-safe:animate-shake' : ''}`}
      role="img"
      aria-label={`Nyawa: ${lives} dari ${MAX_LIVES}`}
    >
      {Array.from({ length: MAX_LIVES }, (_, i) => (
        <Heart key={i} full={i < lives} />
      ))}
    </span>
  );
}

/** Angka yang "menghitung naik" seperti skor di game arcade. */
function useCountUp(value, ms = 650) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = from.current;
    if (start === value) return undefined;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      from.current = value;
      setShown(value);
      return undefined;
    }
    const t0 = performance.now();
    let raf = 0;
    const step = (now) => {
      const k = Math.min(1, (now - t0) / ms);
      const v = Math.round(start + (value - start) * (1 - (1 - k) ** 3));
      setShown(v);
      from.current = v;
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, ms]);
  return shown;
}

function TimerBar({ timeLeft, seconds }) {
  const pct = Math.max(0, Math.min(100, (timeLeft / seconds) * 100));
  const tone = pct > 50 ? 'from-emerald-400 to-cyan-400' : pct > 25 ? 'from-amber-300 to-orange-400' : 'from-rose-500 to-orange-500';
  return (
    <div className="flex items-center gap-2">
      <span
        className={`w-12 text-right text-sm font-black tabular-nums ${pct <= 25 ? 'text-rose-300 motion-safe:animate-pulse' : 'text-white'}`}
        aria-label={`Sisa waktu ${timeLeft} detik`}
      >
        ⏱ {timeLeft}
      </span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/15" aria-hidden="true">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${tone} transition-[width] duration-1000 ease-linear`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

const DIFF_CHIP = {
  easy: 'bg-emerald-400 text-emerald-950',
  medium: 'bg-amber-300 text-amber-950',
  hard: 'bg-rose-500 text-white',
};

/** Panel atas game: judul, level, kesulitan, skor, combo, nyawa, waktu, progres. */
export default function QuestHud({ level, game }) {
  const score = useCountUp(game.score);
  const diff = getDifficulty(game.difficulty);
  const nextMult = comboMultiplier(game.streak);
  const flash =
    game.status === 'correct'
      ? 'ring-4 ring-emerald-400/80'
      : game.hitIndex === game.index && game.hitCount
        ? 'ring-4 ring-rose-500/70'
        : 'ring-0';

  return (
    <div
      className={`sticky top-[calc(var(--header-h)+var(--safe-top)+4px)] z-[5] rounded-3xl bg-gradient-to-br from-blue-900 via-indigo-900 to-violet-900 p-3 text-white shadow-lg shadow-indigo-900/30 transition-shadow duration-300 sm:p-4 ${flash}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex min-w-0 items-center gap-2">
          <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" className="h-9 w-9 flex-none rounded-xl" />
          <div className="min-w-0">
            <p className="m-0 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-cyan-300">
              cartes.play
              <span className={`rounded-full px-1.5 py-px text-[0.6rem] font-black tracking-normal ${DIFF_CHIP[diff.id]}`}>
                {diff.label}
              </span>
            </p>
            <p className="m-0 truncate text-sm font-bold">
              {level.number != null ? `Level ${level.number} · ${level.title}` : level.title}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <span
            className={`rounded-2xl px-2.5 py-1 text-center transition ${game.streak >= 1 ? 'bg-amber-400/20' : 'bg-white/5 opacity-60'}`}
            aria-label={`Combo ${game.streak}, pengali berikutnya ${nextMult}`}
          >
            <span className="block text-[0.6rem] font-bold uppercase tracking-wider text-amber-200">Combo</span>
            <span key={game.streak} className="block text-base font-black leading-tight text-amber-300 motion-safe:animate-pop">
              ×{nextMult.toFixed(2).replace(/\.?0+$/, '')}
            </span>
          </span>
          <span className="relative rounded-2xl bg-white/10 px-3 py-1 text-right">
            <span className="block text-[0.6rem] font-bold uppercase tracking-wider text-cyan-200">Skor</span>
            <span className="block min-w-[3.5ch] text-lg font-black leading-tight tabular-nums">{score}</span>
            {game.status === 'correct' && game.lastGain > 0 && (
              <span
                key={`${game.index}-${game.score}`}
                className="absolute -top-3 right-1 rounded-full bg-emerald-400 px-2 text-xs font-black text-emerald-950 motion-safe:animate-pop"
              >
                +{game.lastGain}
              </span>
            )}
          </span>
          <Lives lives={game.lives} hitCount={game.hitCount} />
        </div>
      </div>
      <div className="mt-3 grid gap-2">
        <TimerBar timeLeft={game.timeLeft} seconds={game.seconds} />
        <div className="flex items-center gap-1" aria-label={`Misi ${game.index + 1} dari ${game.total}`}>
          {Array.from({ length: game.total }, (_, i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full ${i < game.index || (i === game.index && game.status === 'correct') ? 'bg-cyan-300' : i === game.index ? 'bg-white/60' : 'bg-white/15'}`}
            />
          ))}
          {game.streak >= 2 && (
            <span className="ml-2 whitespace-nowrap text-xs font-black text-amber-300">🔥 {game.streak}</span>
          )}
        </div>
      </div>
    </div>
  );
}
