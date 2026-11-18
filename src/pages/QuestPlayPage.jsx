import { lazy, Suspense, useEffect, useReducer, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ChoiceList from '../components/ChoiceList.jsx';
import CoordinateInput from '../components/CoordinateInput.jsx';
import CoordinatePlane from '../components/CoordinatePlane.jsx';
import CameraControls from '../components/quest/CameraControls.jsx';
import Confetti from '../components/quest/Confetti.jsx';
import Coordinate3Input from '../components/quest/Coordinate3Input.jsx';
import QuestHud from '../components/quest/QuestHud.jsx';
import SuccessBurst from '../components/quest/SuccessBurst.jsx';
import RichText from '../components/RichText.jsx';
import { hasWebGL } from '../lib/webgl.js';
import {
  answerText,
  checkAnswer,
  cheerFor,
  correctHouse,
  DIFFICULTY_LIST,
  findLevel,
  gameReducer,
  getDifficulty,
  is3dLevel,
  isUnlocked,
  levelAids,
  CAMERA_LABEL,
  LEVELS,
  SECTIONS,
  QUADRANT_CHOICES,
  secondsFor,
  startGame,
  starsFor,
} from '../lib/quest.js';
import { useTutorContext } from '../lib/tutor.js';
import { ACTIONS, questOf } from '../state/progress.js';
import { useProgress } from '../state/ProgressContext.jsx';
import { sfx } from '../lib/sfx.js';

const QuestScene = lazy(() => import('../three/QuestScene.jsx'));

const RANGE_2D = 6;
const RANGE_3D = 5;
const Z_MAX = 5;

const PRIMARY =
  'flex min-h-[3.25rem] w-full cursor-pointer items-center justify-center rounded-2xl border-0 bg-gradient-to-r from-blue-700 via-indigo-600 to-violet-600 px-5 text-lg font-black text-white no-underline shadow-lg shadow-indigo-700/30 transition hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-blue-700';
const SECONDARY =
  'flex min-h-[3rem] w-full cursor-pointer items-center justify-center rounded-2xl border-2 border-blue-200 bg-white px-5 font-bold text-blue-900 no-underline transition hover:border-blue-400';
const ACTION =
  'flex min-h-[3.25rem] w-full cursor-pointer items-center justify-center rounded-2xl border-0 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 px-5 text-lg font-black text-slate-900 shadow-lg shadow-orange-500/30 transition hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50';

export default function QuestPlayPage() {
  const { levelId } = useParams();
  const { state } = useProgress();
  const [session, setSession] = useState({ run: 0, difficulty: null });
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
  if (!isUnlocked(level.id, questOf(state).cleared)) {
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
  return (
    <QuestSession
      key={`${level.id}-${session.run}`}
      level={level}
      preset={session.difficulty}
      onRestart={(difficulty) => setSession((s) => ({ run: s.run + 1, difficulty: difficulty ?? null }))}
    />
  );
}

/** Intro + pilih kesulitan, lalu jalankan game. */
function QuestSession({ level, preset, onRestart }) {
  const { state, dispatch } = useProgress();
  const [difficulty, setDifficulty] = useState(preset ?? questOf(state).difficulty ?? 'easy');
  const [started, setStarted] = useState(false);

  if (!started) {
    return (
      <LevelIntro
        level={level}
        difficulty={difficulty}
        onDifficulty={setDifficulty}
        onStart={() => {
          dispatch({ type: ACTIONS.QUEST_DIFFICULTY, difficulty });
          setStarted(true);
        }}
      />
    );
  }
  return <QuestRun level={level} difficulty={difficulty} onRestart={onRestart} />;
}

function QuestRun({ level, difficulty, onRestart }) {
  const { state, dispatch } = useProgress();
  const [game, send] = useReducer(gameReducer, null, () => startGame(level, difficulty));
  const [draft3, setDraft3] = useState([0, 0, 0]);
  const [pickedHouse, setPickedHouse] = useState(null);
  const [lastPick, setLastPick] = useState(null);
  const sceneRef = useRef(null);
  const saved = useRef(false);
  const challenge = level.challenges[game.index];
  const playing = game.status === 'playing';
  const solved = game.status === 'correct' || game.status === 'timeout';
  const diff = getDifficulty(difficulty);
  const aids = levelAids(level, difficulty);
  const uses3d = is3dLevel(level);
  const webgl = hasWebGL();

  // Konteks untuk Kak Carta. Kunci jawaban (titik/target/rumah benar) tidak dikirim.
  const TASK = {
    plot2d: 'memasang rumah di titik (x, y) yang diberikan pada bidang 2D',
    read2d: 'membaca koordinat (x, y) rumah di bidang 2D; koordinat tidak ditampilkan',
    quadrant: 'menentukan kuadran sebuah titik',
    choice: 'pilihan ganda konsep koordinat',
    read3d: 'membaca koordinat (x, y, z) rumah di ruang 3D; koordinat tidak ditampilkan',
    plot3d: 'memasang rumah di koordinat (x, y, z) yang diberikan',
    find3d: 'memilih 1 dari 4 rumah yang berada di koordinat yang diberikan',
  };
  const over = game.status === 'done' || game.status === 'over';
  useTutorContext({
    screen: `Mode Petualangan, Level ${level.number}: ${level.title}`,
    topic: level.tagline,
    taskId: over ? `${level.id}-hasil` : `${level.id}-${challenge.id}`,
    difficulty: `${diff.label}${aids.guides ? ', ada garis bantu' : ''}${aids.numbers ? '' : ', angka grid disembunyikan'}`,
    task: over ? 'melihat hasil level' : TASK[challenge.kind],
    question: over ? undefined : challenge.text.replace(/\*\*|\[[xy]:|\]/g, ''),
  });

  // Hitung mundur
  useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(() => send({ type: 'TICK', answer: answerText(challenge) }), 1000);
    return () => clearInterval(id);
  }, [playing, challenge]);

  // Mode tanpa spoiler: angka sumbu & label kuadran disembunyikan selama soal dikerjakan.
  // Muncul lagi setelah soal dijawab, atau kalau siswa memakai 💡 Petunjuk (tidak tersedia di Hard).
  const [hint, setHint] = useState(false);
  const shownNumbers = solved || (hint && aids.numbers);
  const shownQuadrants = solved || (hint && aids.quadrants);
  const canHint = playing && !hint && aids.numbers;

  // Soal baru: kosongkan isian
  useEffect(() => {
    setHint(false);
    setDraft3([0, 0, 0]);
    setPickedHouse(null);
    setLastPick(null);
  }, [game.index]);

  // Simpan hasil sekali di akhir
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

  const answer = (value) => {
    if (challenge.kind === 'find3d') setLastPick(value);
    const result = checkAnswer(challenge, value);
    sfx.answer(result.correct);
    send({ type: 'ANSWER', ...result });
    return result.correct;
  };

  if (game.status === 'done' || game.status === 'over') {
    return (
      <LevelResult
        level={level}
        game={game}
        best={questOf(state).best[level.id] ?? game.score}
        onRestart={onRestart}
      />
    );
  }

  // Rumah di ruang 3D — tidak pernah ada label angka koordinat di peta.
  let houses = [];
  let effectId = 'h';
  if (challenge.kind === 'read3d') houses = [{ id: 'h', at: challenge.point }];
  if (challenge.kind === 'plot3d') houses = [{ id: 'h', at: solved ? challenge.target : draft3 }];
  if (challenge.kind === 'find3d') {
    houses = challenge.houses.map((h) => ({ id: h.label, label: h.label, at: h.at }));
    effectId = game.status === 'correct' ? correctHouse(challenge)?.label : lastPick;
  }
  // Soal pilihan ganda 3D boleh menampilkan rumah berlabel (koordinatnya sudah ada di teks soal).
  if (challenge.kind === 'choice' && challenge.houses) {
    houses = challenge.houses.map((h) => ({ id: h.label, label: h.label, at: h.at }));
  }
  const effect =
    game.status === 'correct'
      ? { type: 'success', key: `ok${game.index}`, id: effectId }
      : game.hitCount && game.hitIndex === game.index
        ? { type: 'error', key: `hit${game.hitCount}`, id: effectId }
        : { type: 'idle', key: `q${game.index}` };
  const shownPick = challenge.kind === 'find3d' && solved && game.status === 'timeout' ? correctHouse(challenge)?.label : pickedHouse;

  return (
    <div className="space-y-4 pb-4">
      {game.status === 'correct' && (
        <>
          <Confetti burstKey={`${game.index}`} />
          <SuccessBurst burstKey={`b${game.index}`} title={cheerFor(game.streak)} points={game.lastGain} streak={game.streak} />
        </>
      )}
      <QuestHud level={level} game={game} />

      <div className={uses3d ? 'grid gap-4 lg:grid-cols-[1.25fr_1fr] lg:items-start' : 'grid gap-4 md:grid-cols-[1.1fr_1fr] md:items-start'}>
        <section aria-label="Area permainan">
          {uses3d ? (
            webgl ? (
              <div className="relative aspect-square w-full overflow-hidden rounded-3xl border-2 border-indigo-300/40 bg-[#0b1437] shadow-xl shadow-indigo-900/20 sm:aspect-[4/3] lg:aspect-square">
                <Suspense fallback={<p className="grid h-full place-items-center text-white">Memuat ruang 3D…</p>}>
                  <QuestScene
                    ref={sceneRef}
                    houses={houses}
                    selectedId={shownPick}
                    onPick={challenge.kind === 'find3d' && playing ? setPickedHouse : null}
                    showGuides={aids.guides}
                    showNumbers={shownNumbers}
                    view={level.camera ?? 'home'}
                    range={RANGE_3D}
                    zMax={Z_MAX}
                    effect={effect}
                  />
                </Suspense>
                <CameraControls sceneRef={sceneRef} />
                <AxisLegend numbers={shownNumbers} />
              </div>
            ) : (
              <p className="card">Browser ini tidak mendukung grafik 3D. Kamu tetap bisa menjawab dengan isian di bawah.</p>
            )
          ) : (
            <Plane2D challenge={challenge} game={game} diff={{ ...aids, numbers: shownNumbers, quadrants: shownQuadrants }} onAnswer={answer} />
          )}
        </section>

        <section className="space-y-3 rounded-3xl border-2 border-blue-200 bg-white/95 p-4 shadow-lg shadow-blue-900/10 sm:p-5">
          <p className="m-0 flex items-center justify-between text-xs font-black uppercase tracking-wider text-indigo-600">
            <span>
              Misi {game.index + 1} dari {game.total}
            </span>
            {challenge.kind === 'find3d' && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">Temukan Rumah</span>
            )}
          </p>
          <RichText text={challenge.text} className="m-0 text-lg font-bold leading-snug text-slate-900" />

          {playing &&
            (canHint ? (
              <button
                type="button"
                onClick={() => setHint(true)}
                className="flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 px-4 text-sm font-bold text-amber-900 transition hover:bg-amber-100"
              >
                💡 Petunjuk: tampilkan angka sumbu
              </button>
            ) : (
              <p className="m-0 rounded-2xl bg-slate-100 px-4 py-2 text-center text-xs font-bold text-slate-600">
                {hint ? '💡 Petunjuk dipakai: angka sumbu ditampilkan' : '🔒 Mode Hard: tidak ada petunjuk angka'}
              </p>
            ))}

          <AnswerArea
            key={challenge.id}
            challenge={challenge}
            disabled={!playing}
            onAnswer={answer}
            draft3={draft3}
            setDraft3={setDraft3}
            pickedHouse={pickedHouse}
            setPickedHouse={setPickedHouse}
          />

          {game.feedback && <Feedback feedback={game.feedback} />}

          {solved && (
            <button type="button" className={PRIMARY} onClick={() => send({ type: 'NEXT' })} autoFocus>
              {game.index + 1 < game.total ? 'Misi berikutnya ➜' : 'Lihat hasil 🏁'}
            </button>
          )}
        </section>
      </div>
    </div>
  );
}

function AxisLegend({ numbers }) {
  return (
    <ul className="pointer-events-none absolute left-2 top-2 m-0 flex flex-col gap-1 p-0 text-xs font-black">
      <li className="list-none rounded-full bg-blue-400 px-2 py-0.5 text-slate-900">X: kanan +</li>
      <li className="list-none rounded-full bg-orange-400 px-2 py-0.5 text-slate-900">Y: belakang +</li>
      <li className="list-none rounded-full bg-emerald-400 px-2 py-0.5 text-slate-900">Z: naik +</li>
      {!numbers && (
        <li className="list-none rounded-full bg-rose-500 px-2 py-0.5 text-white">🙈 Angka disembunyikan: hitung kotaknya!</li>
      )}
    </ul>
  );
}

function Feedback({ feedback }) {
  const ok = feedback.tone === 'ok';
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-start gap-3 rounded-2xl border-2 p-3 motion-safe:animate-pop ${ok ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-rose-300 bg-rose-50 text-rose-900 motion-safe:animate-shake'}`}
    >
      <span className="text-2xl leading-none" aria-hidden="true">
        {ok ? '🎉' : '💥'}
      </span>
      <RichText text={feedback.message} className="m-0 font-semibold" />
    </div>
  );
}

/** Bidang 2D untuk Level 1. Titik yang diketuk tidak pernah diberi label angka. */
function Plane2D({ challenge, game, diff, onAnswer }) {
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
      <div className="relative rounded-3xl border-2 border-blue-200 bg-white p-2 shadow-lg shadow-blue-900/10">
        <CoordinatePlane
          range={RANGE_2D}
          buildings={buildings}
          marks={marks}
          selected={selected}
          showGuides={challenge.kind === 'plot2d' && diff.guides}
          showQuadrants={challenge.kind !== 'quadrant' && diff.quadrants}
          showNumbers={diff.numbers}
          showCoordLabels={false}
          showBuildingLabels={false}
          interactive={challenge.kind === 'plot2d' && playing}
          onSelect={setPicked}
        />
        {!diff.numbers && (
          <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-rose-500 px-2 py-0.5 text-xs font-black text-white">
            🙈 Angka disembunyikan: hitung kotaknya!
          </span>
        )}
      </div>
      {challenge.kind === 'plot2d' && (
        <div className="space-y-2">
          <button type="button" className={ACTION} disabled={!picked || !playing} onClick={() => onAnswer(picked)}>
            🏠 Pasang Rumah
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
function AnswerArea({ challenge, disabled, onAnswer, draft3, setDraft3, pickedHouse, setPickedHouse }) {
  const [picked, setPicked] = useState(null);
  const [status, setStatus] = useState(null);

  const pick = (i, value) => {
    setPicked(i);
    setStatus(onAnswer(value) ? 'ok' : 'err');
  };

  switch (challenge.kind) {
    case 'plot2d':
      return (
        <p className="m-0 text-sm text-slate-600">
          Ketuk titik di grid, lalu tekan <strong>Pasang Rumah</strong>.
        </p>
      );
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
    case 'find3d':
      return (
        <div className="space-y-3">
          <p className="m-0 text-sm text-slate-600">Ketuk rumah di ruang 3D, atau pilih hurufnya:</p>
          <div className="grid grid-cols-4 gap-2" role="group" aria-label="Pilih rumah">
            {challenge.houses.map((h) => (
              <button
                key={h.label}
                type="button"
                disabled={disabled}
                aria-pressed={pickedHouse === h.label}
                onClick={() => setPickedHouse(h.label)}
                className={`h-14 cursor-pointer rounded-2xl border-2 text-2xl font-black transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${pickedHouse === h.label ? 'border-amber-500 bg-amber-300 text-slate-900 shadow-lg shadow-amber-500/30' : 'border-blue-200 bg-white text-blue-900 hover:border-blue-400'}`}
              >
                {h.label}
              </button>
            ))}
          </div>
          <button type="button" className={ACTION} disabled={disabled || !pickedHouse} onClick={() => onAnswer(pickedHouse)}>
            {pickedHouse ? `🎯 Pilih Rumah ${pickedHouse}` : '🎯 Pilih rumah dulu'}
          </button>
        </div>
      );
    default:
      return null;
  }
}

const DIFF_CARD = {
  easy: 'peer-checked:border-emerald-400 peer-checked:bg-emerald-400/20',
  medium: 'peer-checked:border-amber-300 peer-checked:bg-amber-300/20',
  hard: 'peer-checked:border-rose-400 peer-checked:bg-rose-500/20',
};

function LevelIntro({ level, difficulty, onDifficulty, onStart }) {
  const three = is3dLevel(level);
  const diff = getDifficulty(difficulty);
  const section = SECTIONS.find((s) => s.id === level.section);
  return (
    <section className="mx-auto max-w-xl space-y-4 rounded-[2rem] bg-gradient-to-br from-blue-900 via-indigo-900 to-violet-900 p-5 text-center text-white shadow-xl shadow-indigo-900/30 sm:p-6">
      <p className="m-0 text-xs font-extrabold uppercase tracking-[0.2em] text-cyan-300">
        {section ? `${section.emoji} ${section.title}` : 'cartes.play'}
      </p>
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
      {(three || level.noGuides || level.noNumbers) && (
        <ul className="m-0 flex flex-wrap justify-center gap-2 p-0 text-xs font-bold text-indigo-100">
          {three && <li className="list-none rounded-full bg-white/10 px-3 py-1">🎥 Kamera {CAMERA_LABEL[level.camera ?? 'home']}</li>}
          {level.noGuides && <li className="list-none rounded-full bg-rose-500/30 px-3 py-1">🚫 Tanpa garis bantu</li>}
          {level.noNumbers && <li className="list-none rounded-full bg-rose-500/30 px-3 py-1">🚫 Tanpa angka grid</li>}
        </ul>
      )}

      <fieldset className="m-0 space-y-2 border-0 p-0 text-left">
        <legend className="mb-2 w-full text-center text-sm font-black uppercase tracking-wider text-cyan-200">
          Pilih tingkat kesulitan
        </legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {DIFFICULTY_LIST.map((d) => (
            <label key={d.id} className="block cursor-pointer">
              <input
                type="radio"
                name="difficulty"
                value={d.id}
                checked={difficulty === d.id}
                onChange={() => onDifficulty(d.id)}
                className="peer sr-only"
              />
              <span
                className={`block h-full rounded-2xl border-2 border-white/15 bg-white/5 p-3 transition peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-cyan-300 ${DIFF_CARD[d.id]}`}
              >
                <span className="flex items-center justify-between">
                  <span className="text-lg font-black">
                    {d.emoji} {d.label}
                  </span>
                  <span className="rounded-full bg-white/15 px-2 text-xs font-black">×{d.scoreMult}</span>
                </span>
                <span className="mt-1 block text-xs leading-snug text-indigo-100">{d.desc}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <ul className="m-0 flex flex-wrap justify-center gap-x-4 gap-y-1 p-0 text-sm font-bold">
        <li className="list-none">❤️ × 3</li>
        <li className="list-none">⏱ {secondsFor(level, difficulty)} detik/misi</li>
        <li className="list-none">🎯 {level.challenges.length} misi</li>
        <li className="list-none">⭐ skor ×{diff.scoreMult}</li>
      </ul>
      <button type="button" onClick={onStart} className={`${ACTION} min-h-[3.5rem] text-xl`} autoFocus>
        Mulai {diff.label}! 🚀
      </button>
    </section>
  );
}

function LevelResult({ level, game, best, onRestart }) {
  const won = game.status === 'done';
  const stars = starsFor(game);
  const diff = getDifficulty(game.difficulty);
  const harder = DIFFICULTY_LIST.find((d) => d.rank === diff.rank + 1);
  const next = LEVELS[LEVELS.findIndex((l) => l.id === level.id) + 1];

  return (
    <section className="mx-auto max-w-xl space-y-4 rounded-[2rem] border-2 border-blue-200 bg-white/95 p-6 text-center shadow-xl shadow-blue-900/10">
      {won && <Confetti burstKey="done" count={110} />}
      <p className="m-0 text-xs font-extrabold uppercase tracking-[0.2em] text-indigo-600">
        Level {level.number} · {level.title} · {diff.label}
      </p>
      <h2 className="m-0 text-3xl font-black text-blue-950">{won ? 'Level selesai! 🏆' : 'Nyawa habis 💔'}</h2>
      {won ? (
        <>
          <p className="m-0 text-4xl" role="img" aria-label={`${stars} dari 3 bintang`}>
            {'⭐'.repeat(stars)}
            <span className="opacity-25">{'⭐'.repeat(3 - stars)}</span>
          </p>
          <p className="m-0 font-bold text-slate-700">
            Medali {diff.medal} {diff.label}
          </p>
        </>
      ) : (
        <p className="m-0 text-slate-600">Tidak apa-apa! Coba lagi, kamu pasti makin jago.</p>
      )}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-indigo-50 p-3">
          <p className="m-0 text-[0.65rem] font-bold uppercase tracking-wider text-indigo-600">Skor</p>
          <p className="m-0 text-2xl font-black tabular-nums text-indigo-950">{game.score}</p>
        </div>
        <div className="rounded-2xl bg-amber-50 p-3">
          <p className="m-0 text-[0.65rem] font-bold uppercase tracking-wider text-amber-700">Terbaik</p>
          <p className="m-0 text-2xl font-black tabular-nums text-amber-900">{Math.max(best, game.score)}</p>
        </div>
        <div className="rounded-2xl bg-rose-50 p-3">
          <p className="m-0 text-[0.65rem] font-bold uppercase tracking-wider text-rose-700">Combo max</p>
          <p className="m-0 text-2xl font-black tabular-nums text-rose-900">🔥{game.bestStreak}</p>
        </div>
      </div>
      <div className="space-y-3 pt-1">
        {won && next && (
          <p className="m-0 rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-3 font-bold text-emerald-900 motion-safe:animate-pop">
            🔓 Level {next.number}: {next.title} sekarang terbuka!
          </p>
        )}
        {won && next && (
          <Link to={`/quest/${next.id}`} className={PRIMARY}>
            Lanjut ke Level {next.number} ➜
          </Link>
        )}
        {won && harder && (
          <button type="button" className={next ? SECONDARY : PRIMARY} onClick={() => onRestart(harder.id)}>
            Tantang diri: coba {harder.emoji} {harder.label}
          </button>
        )}
        <button type="button" className={won ? SECONDARY : PRIMARY} onClick={() => onRestart(game.difficulty)}>
          {won ? 'Main lagi' : 'Coba lagi'}
        </button>
        <Link to="/quest" className={SECONDARY}>
          Daftar level
        </Link>
      </div>
    </section>
  );
}
