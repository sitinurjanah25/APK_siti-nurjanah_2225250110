import { lazy, Suspense, useEffect, useReducer, useRef, useState } from 'react';
import { hasWebGL } from '../../lib/webgl.js';
import { makePracticeLevel, PRACTICE_HINTS, PRACTICE_RANGE, PRACTICE_Z_MAX } from '../../lib/practice.js';
import {
  answerText,
  checkAnswer,
  cheerFor,
  diagnosePoint3,
  gameReducer,
  getDifficulty,
  startGame,
  starsFor,
} from '../../lib/quest.js';
import { MISTAKE_TEXT, useTutorContext } from '../../lib/tutor.js';
import { ACTIONS, questOf } from '../../state/progress.js';
import { useProgress } from '../../state/ProgressContext.jsx';
import RichText from '../RichText.jsx';
import CameraControls from '../quest/CameraControls.jsx';
import Confetti from '../quest/Confetti.jsx';
import Coordinate3Input from '../quest/Coordinate3Input.jsx';
import QuestHud from '../quest/QuestHud.jsx';
import SuccessBurst from '../quest/SuccessBurst.jsx';

const QuestScene = lazy(() => import('../../three/QuestScene.jsx'));

const PRIMARY =
  'flex min-h-[3.25rem] w-full cursor-pointer items-center justify-center rounded-2xl border-0 bg-gradient-to-r from-blue-700 via-indigo-600 to-violet-600 px-5 text-lg font-black text-white shadow-lg shadow-indigo-700/30 transition hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-blue-700';
const SECONDARY =
  'flex min-h-[3rem] w-full cursor-pointer items-center justify-center rounded-2xl border-2 border-blue-200 bg-white px-5 font-bold text-blue-900 transition hover:border-blue-400';

/**
 * Game Latihan 3D. Rumah tampil di ruang 3D tanpa label koordinat,
 * siswa menebak/mengisi (x, y, z) sesuai soal.
 */
export default function PracticeGame({ difficulty, onExit }) {
  const [run, setRun] = useState(0);
  // Soal baru setiap kali "Main lagi".
  const [level, setLevel] = useState(() => makePracticeLevel(difficulty));
  return (
    <PracticeRun
      key={run}
      level={level}
      difficulty={difficulty}
      onExit={onExit}
      onAgain={() => {
        setLevel(makePracticeLevel(difficulty));
        setRun((r) => r + 1);
      }}
    />
  );
}

function PracticeRun({ level, difficulty, onExit, onAgain }) {
  const { state, dispatch } = useProgress();
  const [game, send] = useReducer(gameReducer, null, () => startGame(level, difficulty));
  const [draft, setDraft] = useState([0, 0, 0]);
  const [mistakes, setMistakes] = useState({ index: 0, count: 0, last: null });
  const sceneRef = useRef(null);
  const saved = useRef(false);
  const diff = getDifficulty(difficulty);
  const challenge = level.challenges[game.index];
  const playing = game.status === 'playing';
  const solved = game.status === 'correct' || game.status === 'timeout';
  const webgl = hasWebGL();
  const tip = PRACTICE_HINTS[diff.id];
  const wrong = mistakes.index === game.index ? mistakes : { count: 0, last: null };

  // Konteks untuk Kak Carta. Koordinat jawaban sengaja TIDAK dikirim.
  const inGame = game.status !== 'done' && game.status !== 'over';
  useTutorContext(
    inGame && challenge
      ? {
          screen: 'Latihan 3D (tebak koordinat rumah)',
          taskId: `${level.id}-${game.index}-${challenge.id}`,
          difficulty: `${diff.label}${diff.guides ? ', ada garis proyeksi' : ''}${diff.numbers ? ', angka sumbu tampil' : ', angka grid disembunyikan'}`,
          task:
            challenge.kind === 'plot3d'
              ? 'memasang rumah di koordinat (x, y, z) yang diberikan soal'
              : 'membaca koordinat (x, y, z) rumah di ruang 3D; koordinat tidak ditampilkan di peta',
          question: challenge.kind === 'plot3d' ? challenge.text.replace(/\*\*/g, '') : 'Berapa (x, y, z) rumah ini?',
          wrongAttempts: wrong.count,
          lastMistake: wrong.last ? MISTAKE_TEXT[wrong.last] : undefined,
        }
      : { screen: 'Hasil latihan 3D' },
  );

  useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(() => send({ type: 'TICK', answer: answerText(challenge) }), 1000);
    return () => clearInterval(id);
  }, [playing, challenge]);

  // Tanpa spoiler: angka sumbu disembunyikan sampai soal dijawab atau 💡 Petunjuk dipakai.
  const [hint, setHint] = useState(false);
  const shownNumbers = solved || (hint && diff.numbers);

  useEffect(() => {
    setDraft([0, 0, 0]);
    setHint(false);
  }, [game.index]);

  useEffect(() => {
    if ((game.status === 'done' || game.status === 'over') && !saved.current) {
      saved.current = true;
      dispatch({
        type: ACTIONS.QUEST_RESULT,
        levelId: level.id,
        score: game.score,
        cleared: game.status === 'done',
        rank: diff.rank,
      });
    }
  }, [game.status, game.score, level.id, dispatch, diff.rank]);

  if (game.status === 'done' || game.status === 'over') {
    const best = Math.max(questOf(state).best[level.id] ?? 0, game.score);
    return <PracticeResult game={game} diff={diff} best={best} onAgain={onAgain} onExit={onExit} />;
  }

  const at = challenge.kind === 'plot3d' ? (solved ? challenge.target : draft) : challenge.point;
  const houses = [{ id: 'h', at }];
  const effect =
    game.status === 'correct'
      ? { type: 'success', key: `ok${game.index}`, id: 'h' }
      : game.hitCount && game.hitIndex === game.index
        ? { type: 'error', key: `hit${game.hitCount}`, id: 'h' }
        : { type: 'idle', key: `q${game.index}` };

  const answer = (value) => {
    const result = checkAnswer(challenge, value);
    if (!result.correct) {
      const target = challenge.kind === 'plot3d' ? challenge.target : challenge.point;
      setMistakes((m) => ({
        index: game.index,
        count: (m.index === game.index ? m.count : 0) + 1,
        last: diagnosePoint3(target, value),
      }));
    }
    send({ type: 'ANSWER', ...result });
  };

  return (
    <div className="space-y-4 pb-4">
      {game.status === 'correct' && (
        <>
          <Confetti burstKey={`${game.index}`} />
          <SuccessBurst burstKey={`b${game.index}`} title={cheerFor(game.streak)} points={game.lastGain} streak={game.streak} />
        </>
      )}
      <QuestHud level={level} game={game} />

      <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr] lg:items-start">
        <section aria-label="Ruang 3D">
          {webgl ? (
            <div className="relative aspect-square w-full overflow-hidden rounded-3xl border-2 border-indigo-300/40 bg-[#0b1437] shadow-xl shadow-indigo-900/20 sm:aspect-[4/3] lg:aspect-square">
              <Suspense fallback={<p className="grid h-full place-items-center text-white">Memuat ruang 3D…</p>}>
                <QuestScene
                  ref={sceneRef}
                  houses={houses}
                  showGuides={diff.guides}
                  showNumbers={shownNumbers}
                  range={PRACTICE_RANGE}
                  zMax={PRACTICE_Z_MAX}
                  effect={effect}
                />
              </Suspense>
              <CameraControls sceneRef={sceneRef} />
              {!shownNumbers && (
                <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-rose-500 px-2 py-0.5 text-xs font-black text-white">
                  🙈 Angka disembunyikan: hitung kotaknya!
                </span>
              )}
            </div>
          ) : (
            <p className="card">Browser ini tidak mendukung grafik 3D, jadi latihan ini belum bisa dimainkan di sini.</p>
          )}
        </section>

        <section className="space-y-3 rounded-3xl border-2 border-blue-200 bg-white/95 p-4 shadow-lg shadow-blue-900/10 sm:p-5">
          <p className="m-0 text-xs font-black uppercase tracking-wider text-indigo-600">
            Soal {game.index + 1} dari {game.total}
          </p>
          <RichText text={challenge.text} className="m-0 text-lg font-bold leading-snug text-slate-900" />
          {tip && <p className="m-0 rounded-2xl bg-sky-50 p-3 text-sm text-sky-900">{tip}</p>}
          {playing &&
            (diff.numbers && !hint ? (
              <button
                type="button"
                onClick={() => setHint(true)}
                className="flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 px-4 text-sm font-bold text-amber-900 transition hover:bg-amber-100"
              >
                💡 Petunjuk: tampilkan angka sumbu
              </button>
            ) : (
              <p className="m-0 rounded-2xl bg-slate-100 px-4 py-2 text-center text-xs font-bold text-slate-600">
                {hint ? '💡 Petunjuk dipakai: angka sumbu ditampilkan' : '🔒 Mode Sulit: tidak ada petunjuk angka'}
              </p>
            ))}

          <Coordinate3Input
            key={challenge.id}
            value={draft}
            onChange={setDraft}
            range={PRACTICE_RANGE}
            zMax={PRACTICE_Z_MAX}
            disabled={!playing}
            onSubmit={answer}
            submitLabel={challenge.kind === 'plot3d' ? '🏠 Pasang Rumah' : 'Periksa (x, y, z)'}
          />

          {game.feedback && (
            <div
              role="status"
              aria-live="polite"
              className={`rounded-2xl border-2 p-3 font-semibold motion-safe:animate-pop ${game.feedback.tone === 'ok' ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-rose-300 bg-rose-50 text-rose-900 motion-safe:animate-shake'}`}
            >
              <RichText text={game.feedback.message} className="m-0" />
            </div>
          )}

          {solved && (
            <button type="button" className={PRIMARY} onClick={() => send({ type: 'NEXT' })} autoFocus>
              {game.index + 1 < game.total ? 'Soal berikutnya ➜' : 'Lihat hasil 🏁'}
            </button>
          )}
          <button type="button" className={SECONDARY} onClick={onExit}>
            Keluar ke pilihan level
          </button>
        </section>
      </div>
    </div>
  );
}

function PracticeResult({ game, diff, best, onAgain, onExit }) {
  const won = game.status === 'done';
  const stars = starsFor(game);
  return (
    <section className="mx-auto max-w-xl space-y-4 rounded-[2rem] border-2 border-blue-200 bg-white/95 p-6 text-center shadow-xl shadow-blue-900/10">
      {won && <Confetti burstKey="done" count={110} />}
      <h2 className="m-0 text-3xl font-black text-blue-950">{won ? 'Latihan selesai! 🏆' : 'Nyawa habis 💔'}</h2>
      {won ? (
        <p className="m-0 text-4xl" role="img" aria-label={`${stars} dari 3 bintang`}>
          {'⭐'.repeat(stars)}
          <span className="opacity-25">{'⭐'.repeat(3 - stars)}</span>
        </p>
      ) : (
        <p className="m-0 text-slate-600">Tidak apa-apa! Coba lagi dengan soal baru.</p>
      )}
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Skor" value={game.score} tone="bg-indigo-50 text-indigo-950" />
        <Stat label="Terbaik" value={best} tone="bg-amber-50 text-amber-900" />
        <Stat label="Combo max" value={`🔥${game.bestStreak}`} tone="bg-rose-50 text-rose-900" />
      </div>
      <p className="m-0 text-sm text-slate-500">Tingkat: {diff.emoji} {diff.label}</p>
      <div className="space-y-3">
        <button type="button" className={PRIMARY} onClick={onAgain} autoFocus>
          Main lagi (soal baru)
        </button>
        <button type="button" className={SECONDARY} onClick={onExit}>
          Ganti tingkat kesulitan
        </button>
      </div>
    </section>
  );
}

function Stat({ label, value, tone }) {
  return (
    <div className={`rounded-2xl p-3 ${tone}`}>
      <p className="m-0 text-[0.65rem] font-bold uppercase tracking-wider opacity-70">{label}</p>
      <p className="m-0 text-2xl font-black tabular-nums">{value}</p>
    </div>
  );
}
