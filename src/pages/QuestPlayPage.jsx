import { lazy, Suspense, useEffect, useReducer, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ChoiceList from '../components/ChoiceList.jsx';
import CoordinateInput from '../components/CoordinateInput.jsx';
import CoordinatePlane from '../components/CoordinatePlane.jsx';
import CameraControls from '../components/quest/CameraControls.jsx';
import Confetti from '../components/quest/Confetti.jsx';
import Coordinate3Input from '../components/quest/Coordinate3Input.jsx';
import QuestHud from '../components/quest/QuestHud.jsx';
import RichText from '../components/RichText.jsx';
import { hasWebGL } from '../lib/webgl.js';
import {
  answerText,
  checkAnswer,
  findLevel,
  gameReducer,
  isUnlocked,
  LEVELS,
  QUADRANT_CHOICES,
  startGame,
  starsFor,
} from '../lib/quest.js';
import { ACTIONS } from '../state/progress.js';
import { useProgress } from '../state/ProgressContext.jsx';

const QuestScene = lazy(() => import('../three/QuestScene.jsx'));

const RANGE_2D = 6;
const RANGE_3D = 5;
const Z_MAX = 5;
const is3dLevel = (level) => level.challenges.some((c) => c.kind === 'read3d' || c.kind === 'plot3d');

const PRIMARY =
  'flex min-h-[3.25rem] w-full cursor-pointer items-center justify-center rounded-2xl border-0 bg-gradient-to-r from-blue-700 via-indigo-600 to-violet-600 px-5 text-lg font-black text-white no-underline shadow-lg shadow-indigo-700/30 transition hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-blue-700';
const SECONDARY =
  'flex min-h-[3rem] w-full cursor-pointer items-center justify-center rounded-2xl border-2 border-blue-200 bg-white px-5 font-bold text-blue-900 no-underline transition hover:border-blue-400';

export default function QuestPlayPage() {
  const { levelId } = useParams();
  const { state } = useProgress();
  const [run, setRun] = useState(0);
  const level = findLevel(levelId);

  if (!level) {
    return (
      <section className="card">
        <h2>Level tidak ditemukan</h2>
        <Link to="/quest" className="btn">
          Kembali ke daftar level
        </Link>
      </section>
    );
  }
  if (!isUnlocked(level.id, state.quest?.cleared)) {
    return (
      <section className="card">
        <h2>Level {level.number} masih terkunci</h2>
        <p>Lulus Level {level.number - 1} dulu untuk membuka level ini.</p>
        <Link to="/quest" className="btn btn-primary">
          Ke daftar level
        </Link>
      </section>
    );
  }
  return <QuestGame key={`${level.id}-${run}`} level={level} onRestart={() => setRun((r) => r + 1)} />;
}

function QuestGame({ level, onRestart }) {
  const { state, dispatch } = useProgress();
  const [game, send] = useReducer(gameReducer, level, startGame);
  const [started, setStarted] = useState(false);
  const [draft3, setDraft3] = useState([0, 0, 0]);
  const sceneRef = useRef(null);
  const saved = useRef(false);
  const challenge = level.challenges[game.index];
  const playing = game.status === 'playing';
  const uses3d = is3dLevel(level);
  const webgl = hasWebGL();

  // Hitung mundur (berhenti saat intro, benar, atau waktu habis)
  useEffect(() => {
    if (!started || !playing) return undefined;
    const id = setInterval(() => send({ type: 'TICK', answer: answerText(challenge) }), 1000);
    return () => clearInterval(id);
  }, [started, playing, challenge]);

  // Soal baru: kosongkan isian 3D
  useEffect(() => setDraft3([0, 0, 0]), [game.index]);

  // Simpan hasil sekali di akhir
  useEffect(() => {
    if ((game.status === 'done' || game.status === 'over') && !saved.current) {
      saved.current = true;
      dispatch({ type: ACTIONS.QUEST_RESULT, levelId: level.id, score: game.score, cleared: game.status === 'done' });
    }
  }, [game.status, game.score, level.id, dispatch]);

  const answer = (value) => {
    const result = checkAnswer(challenge, value);
    send({ type: 'ANSWER', ...result });
    return result.correct;
  };

  if (!started) return <LevelIntro level={level} onStart={() => setStarted(true)} />;
  if (game.status === 'done' || game.status === 'over') {
    return <LevelResult level={level} game={game} best={state.quest?.best?.[level.id] ?? game.score} onRestart={onRestart} />;
  }

  // Posisi rumah di ruang 3D
  let house = null;
  if (challenge.kind === 'read3d') house = challenge.point;
  if (challenge.kind === 'plot3d') house = game.status === 'correct' || game.status === 'timeout' ? challenge.target : draft3;
  const effect =
    game.status === 'correct'
      ? { type: 'success', key: `ok${game.index}` }
      : game.hitCount && game.hitIndex === game.index
        ? { type: 'error', key: `hit${game.hitCount}` }
        : { type: 'idle', key: `q${game.index}` };

  return (
    <div className="space-y-4 pb-4">
      {game.status === 'correct' && <Confetti burstKey={`${game.index}`} />}
      <QuestHud level={level} game={game} />

      <div className={uses3d ? 'grid gap-4 lg:grid-cols-[1.25fr_1fr] lg:items-start' : 'grid gap-4 md:grid-cols-[1.1fr_1fr] md:items-start'}>
        {/* Visual */}
        <section aria-label="Area permainan">
          {uses3d ? (
            webgl ? (
              <div className="relative aspect-square w-full overflow-hidden rounded-3xl border-2 border-indigo-300/40 bg-[#0b1437] shadow-xl shadow-indigo-900/20 sm:aspect-[4/3] lg:aspect-square">
                <Suspense fallback={<p className="grid h-full place-items-center text-white">Memuat ruang 3D…</p>}>
                  <QuestScene ref={sceneRef} house={house} showGuides range={RANGE_3D} zMax={Z_MAX} effect={effect} />
                </Suspense>
                <CameraControls sceneRef={sceneRef} />
                <AxisLegend />
              </div>
            ) : (
              <p className="card">
                Browser ini tidak mendukung grafik 3D. Kamu tetap bisa menjawab dengan isian di bawah.
              </p>
            )
          ) : (
            <Plane2D challenge={challenge} game={game} onAnswer={answer} />
          )}
        </section>

        {/* Soal & jawaban */}
        <section className="space-y-3 rounded-3xl border-2 border-blue-200 bg-white/95 p-4 shadow-lg shadow-blue-900/10 sm:p-5">
          <p className="m-0 text-xs font-black uppercase tracking-wider text-indigo-600">
            Misi {game.index + 1} dari {game.total}
          </p>
          <RichText text={challenge.text} className="m-0 text-lg font-bold leading-snug text-slate-900" />

          <AnswerArea
            key={challenge.id}
            challenge={challenge}
            disabled={!playing}
            onAnswer={answer}
            draft3={draft3}
            setDraft3={setDraft3}
          />

          {game.feedback && <Feedback feedback={game.feedback} />}

          {(game.status === 'correct' || game.status === 'timeout') && (
            <button type="button" className={PRIMARY} onClick={() => send({ type: 'NEXT' })} autoFocus>
              {game.index + 1 < game.total ? 'Misi berikutnya ➜' : 'Lihat hasil 🏁'}
            </button>
          )}
        </section>
      </div>
    </div>
  );
}

function AxisLegend() {
  return (
    <ul className="pointer-events-none absolute left-2 top-2 m-0 flex flex-col gap-1 p-0 text-xs font-black">
      <li className="list-none rounded-full bg-blue-400 px-2 py-0.5 text-slate-900">X: kanan +</li>
      <li className="list-none rounded-full bg-orange-400 px-2 py-0.5 text-slate-900">Y: belakang +</li>
      <li className="list-none rounded-full bg-emerald-400 px-2 py-0.5 text-slate-900">Z: naik +</li>
    </ul>
  );
}

function Feedback({ feedback }) {
  const ok = feedback.tone === 'ok';
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-start gap-3 rounded-2xl border-2 p-3 motion-safe:animate-pop ${ok ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-rose-300 bg-rose-50 text-rose-900'}`}
    >
      <span className="text-2xl leading-none" aria-hidden="true">
        {ok ? '🎉' : '💥'}
      </span>
      <RichText text={feedback.message} className="m-0 font-semibold" />
    </div>
  );
}

/** Bidang 2D untuk Level 1. */
function Plane2D({ challenge, game, onAnswer }) {
  const [picked, setPicked] = useState(null);
  useEffect(() => setPicked(null), [challenge.id]);
  const playing = game.status === 'playing';
  const solved = game.status === 'correct' || game.status === 'timeout';

  let buildings = [];
  let marks = [];
  let selected = null;
  if (challenge.kind === 'plot2d') {
    selected = solved ? challenge.target : picked;
    if (selected) buildings = [{ id: 'rumah', type: 'house', name: 'Rumah', at: selected }];
  } else if (challenge.kind === 'read2d') {
    buildings = [{ id: 'rumah', type: 'house', name: 'Rumah', at: challenge.point }];
  } else if (challenge.kind === 'quadrant') {
    marks = [challenge.point];
  }

  return (
    <div className="space-y-3">
      <div className="rounded-3xl border-2 border-blue-200 bg-white p-2 shadow-lg shadow-blue-900/10">
        <CoordinatePlane
          range={RANGE_2D}
          buildings={buildings}
          marks={marks}
          selected={selected}
          showGuides={challenge.kind === 'plot2d'}
          showQuadrants={challenge.kind !== 'quadrant'}
          showBuildingLabels={false}
          interactive={challenge.kind === 'plot2d' && playing}
          onSelect={setPicked}
        />
      </div>
      {challenge.kind === 'plot2d' && (
        <div className="space-y-2">
          <button
            type="button"
            className="flex min-h-[3.25rem] w-full cursor-pointer items-center justify-center rounded-2xl border-0 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 px-5 text-lg font-black text-slate-900 shadow-lg shadow-orange-500/30 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!picked || !playing}
            onClick={() => onAnswer(picked)}
          >
            🏠 Pasang Rumah {picked && playing ? `di (${picked[0]}, ${picked[1]})` : ''}
          </button>
          {playing && (
            <details className="rounded-2xl bg-white/90 p-3 text-sm">
              <summary className="cursor-pointer font-bold text-blue-900">Sulit mengetuk? Ketik koordinatnya</summary>
              <div className="mt-3">
                <CoordinateInput range={RANGE_2D} onSubmit={setPicked} submitLabel="Pilih titik ini" />
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

/** Isian jawaban sesuai jenis soal. */
function AnswerArea({ challenge, disabled, onAnswer, draft3, setDraft3 }) {
  const [picked, setPicked] = useState(null);
  const [status, setStatus] = useState(null);

  const pick = (i, value) => {
    setPicked(i);
    setStatus(onAnswer(value) ? 'ok' : 'err');
  };

  switch (challenge.kind) {
    case 'plot2d':
      return <p className="m-0 text-sm text-slate-600">Ketuk titik di grid, lalu tekan <strong>Pasang Rumah</strong>.</p>;
    case 'read2d':
      return <CoordinateInput range={RANGE_2D} onSubmit={onAnswer} submitLabel="Periksa" disabled={disabled} />;
    case 'quadrant':
      return (
        <ChoiceList
          label="Pilih letak titik"
          options={QUADRANT_CHOICES}
          picked={picked}
          status={status}
          disabled={disabled}
          onPick={(i) => pick(i, QUADRANT_CHOICES[i].value)}
        />
      );
    case 'choice':
      return (
        <ChoiceList
          label="Pilih jawaban"
          options={challenge.options.map((o) => ({ label: o.text }))}
          picked={picked}
          status={status}
          disabled={disabled}
          onPick={(i) => pick(i, i)}
        />
      );
    case 'read3d':
      return (
        <Coordinate3Input
          value={draft3}
          onChange={setDraft3}
          range={RANGE_3D}
          zMax={Z_MAX}
          disabled={disabled}
          onSubmit={onAnswer}
          submitLabel="Periksa (x, y, z)"
        />
      );
    case 'plot3d':
      return (
        <Coordinate3Input
          value={draft3}
          onChange={setDraft3}
          range={RANGE_3D}
          zMax={Z_MAX}
          disabled={disabled}
          onSubmit={onAnswer}
          submitLabel="🏠 Pasang Rumah"
        />
      );
    default:
      return null;
  }
}

function LevelIntro({ level, onStart }) {
  const three = is3dLevel(level) || level.number > 1;
  return (
    <section className="mx-auto max-w-xl space-y-4 rounded-[2rem] bg-gradient-to-br from-blue-900 via-indigo-900 to-violet-900 p-6 text-center text-white shadow-xl shadow-indigo-900/30">
      <p className="m-0 text-xs font-extrabold uppercase tracking-[0.2em] text-cyan-300">c-quest.sn25</p>
      <p className="m-0 text-6xl font-black leading-none">{level.number}</p>
      <h2 className="m-0 text-2xl font-black">{level.title}</h2>
      <RichText text={level.intro} className="m-0 text-indigo-100" />
      {three && (
        <div className="flex flex-wrap justify-center gap-2 text-xs font-black">
          <span className="rounded-full bg-blue-400 px-3 py-1 text-slate-900">X: kanan (+) / kiri (−)</span>
          <span className="rounded-full bg-orange-400 px-3 py-1 text-slate-900">Y: belakang (+) / depan (−)</span>
          <span className="rounded-full bg-emerald-400 px-3 py-1 text-slate-900">Z: naik (+)</span>
        </div>
      )}
      <ul className="m-0 flex justify-center gap-4 p-0 text-sm font-bold">
        <li className="list-none">❤️ × 3</li>
        <li className="list-none">⏱ {level.seconds} detik/misi</li>
        <li className="list-none">🎯 {level.challenges.length} misi</li>
      </ul>
      <button
        type="button"
        onClick={onStart}
        className="flex min-h-[3.5rem] w-full cursor-pointer items-center justify-center rounded-2xl border-0 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 text-xl font-black text-slate-900 shadow-lg shadow-orange-500/30 transition hover:-translate-y-0.5"
        autoFocus
      >
        Mulai! 🚀
      </button>
    </section>
  );
}

function LevelResult({ level, game, best, onRestart }) {
  const won = game.status === 'done';
  const stars = starsFor(game);
  const next = LEVELS[LEVELS.findIndex((l) => l.id === level.id) + 1];

  return (
    <section className="mx-auto max-w-xl space-y-4 rounded-[2rem] border-2 border-blue-200 bg-white/95 p-6 text-center shadow-xl shadow-blue-900/10">
      {won && <Confetti burstKey="done" count={110} />}
      <p className="m-0 text-xs font-extrabold uppercase tracking-[0.2em] text-indigo-600">
        Level {level.number} · {level.title}
      </p>
      <h2 className="m-0 text-3xl font-black text-blue-950">{won ? 'Level selesai! 🏆' : 'Nyawa habis 💔'}</h2>
      {won ? (
        <p className="m-0 text-4xl" role="img" aria-label={`${stars} dari 3 bintang`}>
          {'⭐'.repeat(stars)}
          <span className="opacity-25">{'⭐'.repeat(3 - stars)}</span>
        </p>
      ) : (
        <p className="m-0 text-slate-600">Tidak apa-apa! Coba lagi, kamu pasti makin jago.</p>
      )}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-indigo-50 p-3">
          <p className="m-0 text-xs font-bold uppercase tracking-wider text-indigo-600">Skor</p>
          <p className="m-0 text-3xl font-black tabular-nums text-indigo-950">{game.score}</p>
        </div>
        <div className="rounded-2xl bg-amber-50 p-3">
          <p className="m-0 text-xs font-bold uppercase tracking-wider text-amber-700">Terbaik</p>
          <p className="m-0 text-3xl font-black tabular-nums text-amber-900">{Math.max(best, game.score)}</p>
        </div>
      </div>
      <div className="space-y-3 pt-1">
        {won && next && (
          <Link to={`/quest/${next.id}`} className={PRIMARY}>
            Lanjut ke Level {next.number} ➜
          </Link>
        )}
        <button type="button" className={won && next ? SECONDARY : PRIMARY} onClick={onRestart}>
          {won ? 'Main lagi' : 'Coba lagi'}
        </button>
        <Link to="/quest" className={SECONDARY}>
          Daftar level
        </Link>
      </div>
    </section>
  );
}
