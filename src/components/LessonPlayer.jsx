import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BUILDINGS } from '../data/buildings.js';
import { LESSONS, MAIN_MODULE_IDS } from '../data/lessons.js';
import { fmtPoint } from '../lib/coords.js';
import { DIAG } from '../lib/diagnose.js';
import { diagnoseStep, feedbackMessage, isTapStep, needsAnswer, stepHints } from '../lib/lesson.js';
import { ACTIONS } from '../state/progress.js';
import { useProgress } from '../state/ProgressContext.jsx';
import ChoiceList from './ChoiceList.jsx';
import CoordinateInput, { NumberAnswerInput } from './CoordinateInput.jsx';
import CoordinatePlane from './CoordinatePlane.jsx';
import FeedbackPanel from './FeedbackPanel.jsx';
import RichText from './RichText.jsx';
import styles from './LessonPlayer.module.css';

const BUILDING_BY_ID = Object.fromEntries(BUILDINGS.map((b) => [b.id, b]));

const QUADRANT_OPTIONS = [
  { label: 'Kuadran I', value: 1 },
  { label: 'Kuadran II', value: 2 },
  { label: 'Kuadran III', value: 3 },
  { label: 'Kuadran IV', value: 4 },
  { label: 'Tidak di kuadran mana pun (pada sumbu)', value: null },
];

/** Setelah sekian langkah mandiri, petunjuk terakhir (paling membantu) disembunyikan. */
const FADE_HINTS_AFTER = 3;

export default function LessonPage() {
  const { moduleId } = useParams();
  const mod = LESSONS[moduleId];

  if (!mod || mod.steps.length === 0) {
    return (
      <section className="card">
        <h2>Modul tidak ditemukan</h2>
        <Link to="/" className="btn">
          Kembali ke daftar modul
        </Link>
      </section>
    );
  }
  return <LessonPlayer key={mod.id} mod={mod} />;
}

function scrollToTop() {
  try {
    window.scrollTo({ top: 0 });
  } catch {
    // abaikan
  }
}

function LessonPlayer({ mod }) {
  const { state, dispatch } = useProgress();
  const saved = state.modules[mod.id];
  const [index, setIndex] = useState(() =>
    saved?.done ? 0 : Math.min(Math.max(saved?.step ?? 0, 0), mod.steps.length - 1),
  );
  const [finished, setFinished] = useState(false);

  const independentDone = useMemo(
    () => mod.steps.slice(0, index).filter((s) => s.phase === 'independent').length,
    [mod, index],
  );

  const goTo = (i) => {
    setIndex(i);
    dispatch({ type: ACTIONS.SET_MODULE_STEP, moduleId: mod.id, step: i });
    scrollToTop();
  };

  const next = () => {
    if (index + 1 < mod.steps.length) {
      goTo(index + 1);
      return;
    }
    dispatch({ type: ACTIONS.COMPLETE_MODULE, moduleId: mod.id });
    dispatch({ type: ACTIONS.SET_MODULE_STEP, moduleId: mod.id, step: 0 });
    setFinished(true);
    scrollToTop();
  };

  if (finished) {
    return (
      <ModuleFinished
        mod={mod}
        onRestart={() => {
          setFinished(false);
          goTo(0);
        }}
      />
    );
  }

  const step = mod.steps[index];
  return (
    <div className={styles.wrap}>
      <div className={styles.progress}>
        <span className={styles.moduleTitle}>{mod.title}</span>
        <span className="muted">
          Langkah {index + 1}/{mod.steps.length}
        </span>
      </div>
      <div
        className={styles.bar}
        role="progressbar"
        aria-label="Kemajuan modul"
        aria-valuemin={1}
        aria-valuemax={mod.steps.length}
        aria-valuenow={index + 1}
      >
        <span style={{ width: `${((index + 1) / mod.steps.length) * 100}%` }} />
      </div>
      <LessonStep
        key={step.id}
        step={step}
        fadeHints={step.phase === 'independent' && independentDone >= FADE_HINTS_AFTER}
        onNext={next}
        onPrev={index > 0 ? () => goTo(index - 1) : null}
        isLast={index === mod.steps.length - 1}
      />
    </div>
  );
}

/** Satu langkah pelajaran/misi: teks, grid, isian jawaban, petunjuk, umpan balik. */
export function LessonStep({ step, fadeHints, onNext, onPrev, isLast }) {
  const { dispatch } = useProgress();
  const [picked, setPicked] = useState(null); // titik yang diketuk
  const [choice, setChoice] = useState(null); // indeks pilihan
  const [result, setResult] = useState(null); // { diagnosis, message }
  const [hintLevel, setHintLevel] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);

  const allHints = useMemo(() => stepHints(step), [step]);
  const hints = fadeHints ? allHints.slice(0, 2) : allHints;
  const shownHints = hints.slice(0, hintLevel);
  const hintEffects = Object.assign({}, ...shownHints);
  const answerable = needsAnswer(step);
  const solved = result?.diagnosis === DIAG.CORRECT;

  const check = (answer) => {
    const diagnosis = diagnoseStep(step, answer);
    if (step.kind !== 'reflect') dispatch({ type: ACTIONS.RECORD_DIAGNOSIS, diagnosis });
    if (diagnosis !== DIAG.CORRECT) setWrongCount((n) => n + 1);
    setResult({ diagnosis, message: feedbackMessage(step, diagnosis, answer) });
  };

  const selectPoint = (p) => {
    if (solved) return;
    setPicked(p);
    setResult(null);
  };

  const gridCfg = step.grid;
  const tap = isTapStep(step);
  const selected = tap ? picked : (gridCfg?.point ?? null);
  const guidesByDefault = step.kind !== 'distance';
  const plane = gridCfg && {
    range: gridCfg.range ?? 5,
    buildings: (gridCfg.buildings ?? []).map((id) => BUILDING_BY_ID[id]).filter(Boolean),
    marks: gridCfg.marks ?? [],
    selected,
    showGuides: !!hintEffects.guides || (gridCfg.showGuides ?? guidesByDefault),
    showQuadrants: !!hintEffects.quadrants || !!gridCfg.showQuadrants,
    highlight: gridCfg.highlight ?? null,
    path: hintEffects.path ?? gridCfg.path ?? null,
    pathKey: hintLevel,
    interactive: tap && !solved,
    onSelect: selectPoint,
  };

  let answerUi = null;
  if (tap) {
    answerUi = (
      <>
        <p className={styles.selected}>
          {picked ? (
            <>
              Titik dipilih: <strong className="num">{fmtPoint(picked)}</strong>
            </>
          ) : (
            <span className="muted">Ketuk sebuah titik di grid.</span>
          )}
        </p>
        {!solved && (
          <details className={styles.typeIn}>
            <summary>Sulit mengetuk? Ketik koordinatnya</summary>
            <CoordinateInput range={plane.range} onSubmit={selectPoint} submitLabel="Pilih titik ini" />
          </details>
        )}
      </>
    );
  } else if (step.kind === 'read' || step.kind === 'relative') {
    answerUi = <CoordinateInput range={10} onSubmit={check} submitLabel="Periksa" disabled={solved} />;
  } else if (step.kind === 'distance') {
    answerUi = (
      <NumberAnswerInput
        label={`Jarak ke sumbu-${step.axis}`}
        tone={step.axis === 'X' ? 'y' : 'x'}
        onSubmit={check}
        disabled={solved}
      />
    );
  } else if (step.kind === 'quadrant') {
    answerUi = (
      <ChoiceList
        label="Pilih letak titik"
        options={QUADRANT_OPTIONS}
        picked={choice}
        status={result ? (solved ? 'ok' : 'err') : null}
        disabled={solved}
        onPick={(i) => {
          setChoice(i);
          check(QUADRANT_OPTIONS[i].value);
        }}
      />
    );
  } else if (step.kind === 'choice' || step.kind === 'reflect') {
    answerUi = (
      <ChoiceList
        label="Pilih jawaban"
        options={step.options.map((o) => ({ label: o.text }))}
        picked={choice}
        status={result ? (solved ? (step.kind === 'reflect' ? null : 'ok') : 'err') : null}
        disabled={solved}
        onPick={(i) => {
          setChoice(i);
          check(i);
        }}
      />
    );
  }

  const canHint = answerable && step.kind !== 'reflect' && hints.length > 0 && !solved;

  return (
    <div className={styles.step}>
      <div className={styles.text}>
        <RichText text={step.text} />
      </div>

      {plane && (
        <div className={styles.gridBox}>
          <CoordinatePlane {...plane} />
        </div>
      )}

      {answerUi}

      {shownHints.length > 0 && !solved && (
        <ol className={styles.hints} aria-label="Petunjuk">
          {shownHints.map((h, i) => (
            <li key={i}>
              <span className={styles.hintLevel}>Petunjuk {i + 1}</span> <RichText text={h.text} as="span" />
            </li>
          ))}
        </ol>
      )}

      {result && <FeedbackPanel correct={solved} message={result.message} />}

      <div className={styles.actions}>
        {onPrev && !answerable && (
          <button type="button" className="btn" onClick={onPrev}>
            Sebelumnya
          </button>
        )}
        {canHint && (
          <button
            type="button"
            className="btn"
            onClick={() => setHintLevel((n) => Math.min(n + 1, hints.length))}
            disabled={hintLevel >= hints.length}
          >
            Petunjuk {Math.min(hintLevel + 1, hints.length)}/{hints.length}
          </button>
        )}
        {tap && !solved && (
          <button type="button" className="btn btn-primary" onClick={() => check(picked)} disabled={!picked}>
            Periksa
          </button>
        )}
        {(!answerable || solved) && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onNext({ hintLevel, wrong: wrongCount })}
          >
            {isLast ? 'Selesai' : 'Lanjut'}
          </button>
        )}
      </div>
    </div>
  );
}

function ModuleFinished({ mod, onRestart }) {
  const pos = MAIN_MODULE_IDS.indexOf(mod.id);
  const nextId = mod.warmup ? MAIN_MODULE_IDS[0] : MAIN_MODULE_IDS[pos + 1];
  const nextMod = nextId ? LESSONS[nextId] : null;

  return (
    <section className={`card ${styles.finish}`}>
      <p className={styles.finishIcon} aria-hidden="true">
        ✓
      </p>
      <h2>Modul selesai!</h2>
      <p>Kamu sudah menyelesaikan “{mod.title}”.</p>
      <div className={styles.finishActions}>
        {nextMod && (
          <Link to={`/belajar/${nextMod.id}`} className="btn btn-primary btn-block">
            Lanjut: {nextMod.title}
          </Link>
        )}
        <Link to="/bidang-bebas" className="btn btn-block">
          Coba di Bidang Bebas
        </Link>
        <button type="button" className="btn btn-block" onClick={onRestart}>
          Ulangi modul ini
        </button>
        <Link to="/" className="btn btn-block">
          Daftar modul
        </Link>
      </div>
    </section>
  );
}
