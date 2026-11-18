import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CosmicPage, FOCUS, GAME_FONT, HudButton } from '../components/cosmic/Cosmic.jsx';
import Confetti from '../components/quest/Confetti.jsx';
import RichText, { Inline } from '../components/RichText.jsx';
import quiz from '../data/quiz.json';
import { sfx } from '../lib/sfx.js';
import SoundToggle from '../components/SoundToggle.jsx';
import { countCorrect, saveBestScore, scoreMessage } from '../lib/quiz.js';
import {
  attemptsOf,
  clearStudent,
  downloadCsv,
  fmtTime,
  loadStudent,
  recordAttempt,
  reportFileName,
  saveStudent,
  toCsv,
} from '../lib/quizHistory.js';

const TOTAL = quiz.questions.length;
const SECONDS = 30; // waktu per soal
const TIMEOUT = -1; // penanda "waktu habis" di daftar jawaban
const pointsFor = (timeLeft) => 100 + timeLeft * 5;

/** Warna kapsul A–D. */
const CHOICE_STYLE = [
  { face: 'from-emerald-400 to-green-600', edge: '#14532d', ring: 'ring-emerald-200' },
  { face: 'from-amber-300 to-orange-500', edge: '#7c2d12', ring: 'ring-amber-100' },
  { face: 'from-rose-400 to-red-600', edge: '#7f1d1d', ring: 'ring-rose-200' },
  { face: 'from-sky-400 to-indigo-600', edge: '#1e1b4b', ring: 'ring-sky-200' },
];
const LETTERS = ['A', 'B', 'C', 'D'];

/* ---------- Mini bidang Kartesius ---------- */

const R = 6;
const toSvg = ([x, y]) => [x, -y];

/** Grid kecil bergaya neon. Hanya menampilkan titik yang sudah disebut di soal. */
function MiniGrid({ points = [], showLabels = false }) {
  const ticks = Array.from({ length: R * 2 + 1 }, (_, i) => i - R);
  return (
    <svg
      viewBox={`${-R - 1} ${-R - 1} ${R * 2 + 2} ${R * 2 + 2}`}
      className="mx-auto block h-40 w-40 sm:h-48 sm:w-48"
      role="img"
      aria-label={points.length ? 'Bidang Kartesius dengan titik dari soal' : 'Bidang Kartesius'}
    >
      <defs>
        <radialGradient id="mgGlow">
          <stop offset="0" stopColor="#3b82f6" stopOpacity=".35" />
          <stop offset="1" stopColor="#3b82f6" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x={-R - 1} y={-R - 1} width={R * 2 + 2} height={R * 2 + 2} fill="url(#mgGlow)" />
      <g stroke="#4f63d9" strokeWidth=".05" opacity=".8">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={t} y1={-R} x2={t} y2={R} />
            <line x1={-R} y1={t} x2={R} y2={t} />
          </g>
        ))}
      </g>
      <g strokeWidth=".12" strokeLinecap="round">
        <line x1={-R - 0.4} y1="0" x2={R + 0.4} y2="0" stroke="#60a5fa" />
        <line x1="0" y1={R + 0.4} x2="0" y2={-R - 0.4} stroke="#fb923c" />
      </g>
      <path d={`M${R + 0.8} 0l-.6-.35v.7z`} fill="#60a5fa" />
      <path d={`M0 ${-R - 0.8}l-.35 .6h.7z`} fill="#fb923c" />
      <text x={R + 0.2} y="-0.5" fontSize=".9" fill="#93c5fd" fontWeight="700">X</text>
      <text x="0.4" y={-R + 0.2} fontSize=".9" fill="#fdba74" fontWeight="700">Y</text>
      {points.length === 2 && (
        <line
          x1={toSvg(points[0].at)[0]}
          y1={toSvg(points[0].at)[1]}
          x2={toSvg(points[1].at)[0]}
          y2={toSvg(points[1].at)[1]}
          stroke="#fbbf24"
          strokeWidth=".1"
          strokeDasharray=".3 .25"
        />
      )}
      {points.map((p, i) => {
        const [sx, sy] = toSvg(p.at);
        return (
          <g key={i} style={{ filter: 'drop-shadow(0 0 .25px #fff)' }}>
            <circle cx={sx} cy={sy} r=".28" fill="#fde68a" />
            <text x={sx} y={sy - 0.45} fontSize="1.3" textAnchor="middle">
              🏠
            </text>
            {showLabels && p.label && (
              <text x={sx} y={sy + 1.05} fontSize=".75" textAnchor="middle" fill="#e0f2fe" fontWeight="700">
                {p.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ---------- HUD ---------- */

function Hud({ score, index, onSettings, settingsOpen }) {
  return (
    <div className="sticky top-[calc(var(--header-h)+var(--safe-top)+6px)] z-[6] mx-auto flex max-w-[560px] items-center justify-center gap-2 rounded-2xl border-2 border-indigo-300/40 bg-[#160f45]/85 px-3 py-1 text-sm shadow-[0_0_20px_rgba(129,140,248,.35)] backdrop-blur-md sm:gap-3 sm:text-base">
      <span className="flex items-center gap-1.5 font-bold" aria-label={`Skor ${score}`}>
        <span aria-hidden="true">🌟</span> Skor: <span className="tabular-nums text-amber-300">{score}</span>
      </span>
      <span className="text-indigo-300/60" aria-hidden="true">|</span>
      <span className="font-bold tabular-nums" aria-label={`Soal ${index + 1} dari ${TOTAL}`}>
        <span aria-hidden="true">📝</span> {index + 1}/{TOTAL}
      </span>
      <span className="text-indigo-300/60" aria-hidden="true">|</span>
      <SoundToggle as={HudButton} className="h-9 text-lg" />
      <HudButton onClick={onSettings} aria-expanded={settingsOpen} aria-controls="quiz-settings" className="h-9">
        <span aria-hidden="true">⚙️</span>
        <span className="hidden sm:inline">Pengaturan</span>
        <span className="visually-hidden sm:hidden">Pengaturan</span>
      </HudButton>
    </div>
  );
}

function Settings({ onRestart, onChangeStudent, student }) {
  return (
    <div
      id="quiz-settings"
      className="relative z-[6] mx-auto mt-2 grid max-w-[360px] gap-2 rounded-2xl border-2 border-indigo-300/40 bg-[#160f45]/95 p-3 shadow-xl motion-safe:animate-fade-up"
    >
      <button
        type="button"
        onClick={onRestart}
        className={`h-11 cursor-pointer rounded-xl border-2 border-sky-400/50 bg-transparent font-bold text-sky-100 hover:bg-white/10 ${FOCUS}`}
      >
        🔄 Ulangi kuis dari awal
      </button>
      {student && (
        <button
          type="button"
          onClick={onChangeStudent}
          className={`h-11 cursor-pointer rounded-xl border-2 border-sky-400/50 bg-transparent font-bold text-sky-100 hover:bg-white/10 ${FOCUS}`}
        >
          👤 Ganti nama / kelas ({student.nama})
        </button>
      )}
      <Link
        to="/"
        className={`flex h-11 items-center justify-center rounded-xl border-2 border-sky-400/50 font-bold text-sky-100 no-underline hover:bg-white/10 ${FOCUS}`}
      >
        🏠 Kembali ke Menu Utama
      </Link>
    </div>
  );
}

/** Bingkai kartu: kaca buram + bingkai emas + pita judul. */
function QuestCard({ title, children, className = '' }) {
  return (
    <div className={`relative mx-auto mt-8 max-w-[640px] rounded-[2rem] border-[3px] border-[#e8b778] bg-[#1b1a5a]/70 px-4 pb-6 pt-10 shadow-[0_0_0_2px_#6b3f1d,0_0_34px_rgba(167,139,250,.45),inset_0_0_40px_rgba(99,102,241,.25)] backdrop-blur-md sm:px-8 ${className}`}>
      <div className="absolute -top-6 left-1/2 w-[min(92%,30rem)] -translate-x-1/2 rounded-2xl border-[3px] border-[#e8b778] bg-gradient-to-b from-[#3b2f8f] to-[#24196b] px-4 py-2 text-center shadow-[0_0_0_2px_#6b3f1d,0_6px_18px_rgba(0,0,0,.35)]">
        <h2 className="m-0 truncate text-lg font-bold tracking-wide text-white sm:text-2xl">{title}</h2>
      </div>
      {children}
    </div>
  );
}

/* ---------- Identitas siswa ---------- */

const INPUT = `h-12 w-full rounded-2xl border-2 border-indigo-300/40 bg-[#120c3d]/80 px-4 text-lg text-white placeholder:text-indigo-300/60 focus-visible:border-sky-300 focus-visible:outline-none ${FOCUS}`;

function IdentityForm({ initial, onSave }) {
  const [nama, setNama] = useState(initial?.nama ?? '');
  const [kelas, setKelas] = useState(initial?.kelas ?? '');
  const [error, setError] = useState('');
  return (
    <QuestCard title="Siapa yang ikut kuis? 🧑‍🚀">
      <form
        className="space-y-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (!nama.trim() || !kelas.trim()) {
            sfx.wrong();
            setError('Isi Nama Lengkap dan Kelas dulu, ya.');
            return;
          }
          sfx.click();
          onSave(saveStudent({ nama, kelas }));
        }}
      >
        <p className="m-0 text-center text-indigo-100">
          Isi identitasmu supaya skor dan semua percobaanmu tercatat di laporan.
        </p>
        <label className="block">
          <span className="mb-1 block font-bold text-sky-200">Nama Lengkap</span>
          <input
            className={INPUT}
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            maxLength={60}
            autoComplete="name"
            placeholder="contoh: Siti Nurjanah"
            autoFocus
          />
        </label>
        <label className="block">
          <span className="mb-1 block font-bold text-sky-200">Kelas</span>
          <input
            className={INPUT}
            value={kelas}
            onChange={(e) => setKelas(e.target.value)}
            maxLength={20}
            placeholder="contoh: 8A"
          />
        </label>
        {error && (
          <p role="alert" className="m-0 rounded-xl bg-rose-500/20 px-3 py-2 text-center font-bold text-rose-200">
            {error}
          </p>
        )}
        <p className="m-0 text-center text-xs text-indigo-300">Data hanya disimpan di HP/browser ini.</p>
        <div className="flex justify-center pt-1">
          <button
            type="submit"
            className={`h-14 w-[min(100%,22rem)] cursor-pointer rounded-full border-2 border-white/80 bg-gradient-to-r from-violet-500 via-indigo-400 to-violet-500 text-xl font-bold uppercase tracking-wide text-white motion-safe:animate-glow ${FOCUS}`}
            style={GAME_FONT}
          >
            Mulai Kuis 🚀
          </button>
        </div>
      </form>
    </QuestCard>
  );
}

/** Tabel riwayat percobaan siswa + tombol unduh laporan. */
function AttemptHistory({ student, attempts, currentId }) {
  const [status, setStatus] = useState('');
  const csv = toCsv(attempts);
  const first = attempts[0];
  const last = attempts[attempts.length - 1];
  const delta = attempts.length > 1 ? last.skor - first.skor : 0;

  const download = async () => {
    sfx.click();
    const ok = await downloadCsv(csv, reportFileName(student));
    setStatus(ok ? '✅ Laporan diunduh.' : '⚠️ Tidak bisa mengunduh di perangkat ini. Pakai tombol Salin.');
  };
  const copy = async () => {
    sfx.click();
    try {
      await navigator.clipboard.writeText(csv);
      setStatus('📋 Laporan disalin. Tempel ke Excel/Spreadsheet atau WhatsApp.');
    } catch {
      setStatus('⚠️ Gagal menyalin.');
    }
  };

  return (
    <section className="mt-6 rounded-3xl border-2 border-indigo-300/30 bg-white/[.06] p-4 backdrop-blur-md" aria-labelledby="riwayat">
      <h3 id="riwayat" className="m-0 text-lg font-bold">
        📜 Riwayat Percobaan
      </h3>
      <p className="m-0 text-sm text-indigo-200">
        {student.nama} · Kelas {student.kelas} · {attempts.length} kali percobaan
        {attempts.length > 1 &&
          (delta > 0
            ? ` · naik ${delta} poin sejak percobaan pertama 📈`
            : delta < 0
              ? ` · turun ${-delta} poin dari percobaan pertama`
              : ' · skor sama dengan percobaan pertama')}
      </p>

      <div className="mt-3 overflow-x-auto rounded-2xl border border-indigo-300/20">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-indigo-500/25 text-sky-100">
            <tr>
              <th className="px-3 py-2">Ke-</th>
              <th className="px-3 py-2">Skor</th>
              <th className="px-3 py-2">Benar</th>
              <th className="px-3 py-2">Waktu</th>
            </tr>
          </thead>
          <tbody>
            {attempts.map((a) => {
              const now = a.waktu === currentId;
              return (
                <tr key={a.waktu} className={`border-t border-indigo-300/15 ${now ? 'bg-amber-400/15 font-bold' : ''}`}>
                  <td className="px-3 py-2">
                    {a.percobaan}
                    {now && <span className="ml-1 text-xs text-amber-300">(baru)</span>}
                  </td>
                  <td className="px-3 py-2 tabular-nums text-amber-300">{a.skor}</td>
                  <td className="px-3 py-2 tabular-nums">
                    {a.benar}/{a.total}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-indigo-100">{fmtTime(a.waktu)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={download}
          className={`flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-full border-2 border-emerald-200 bg-gradient-to-b from-emerald-400 to-green-600 font-bold text-white shadow-[0_4px_0_#14532d] ${FOCUS}`}
          style={GAME_FONT}
        >
          ⬇️ Unduh Laporan (CSV)
        </button>
        <button
          type="button"
          onClick={copy}
          className={`flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-full border-2 border-sky-300/60 bg-white/10 font-bold text-sky-100 hover:bg-white/15 ${FOCUS}`}
          style={GAME_FONT}
        >
          📋 Salin Laporan
        </button>
      </div>
      {status && (
        <p role="status" className="m-0 mt-2 text-center text-sm text-indigo-100">
          {status}
        </p>
      )}
    </section>
  );
}

/* ---------- Hasil ---------- */

/** Bintang hasil kuis: 3 (≥9 benar), 2 (≥7), 1 (≥5). */
const starsOf = (correct) => (correct >= 9 ? 3 : correct >= 7 ? 2 : correct >= 5 ? 1 : 0);

function QuizResult({ answers, score, onRetry, student, attempt }) {
  const correct = countCorrect(quiz.questions, answers);
  const stars = starsOf(correct);
  const [best] = useState(() => saveBestScore(correct));

  return (
    <>
    {/* Confetti di luar kartu: kartu memakai backdrop-blur yang akan "mengurung" elemen fixed */}
    {stars > 0 && <Confetti burstKey="quiz-done" count={40 + stars * 30} />}
    <QuestCard title="Kuis selesai! 🏆">
      <div className="text-center">
        <p className="m-0 mb-2 flex justify-center gap-2 text-5xl" role="img" aria-label={`${stars} dari 3 bintang`}>
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className={`inline-block motion-safe:animate-star-pop ${n <= stars ? 'drop-shadow-[0_0_14px_rgba(251,191,36,.9)]' : 'opacity-25 grayscale'}`}
              style={{ animationDelay: `${0.2 + n * 0.18}s` }}
            >
              ⭐
            </span>
          ))}
        </p>
        <p className="m-0 text-sm font-bold uppercase tracking-widest text-sky-200">Skor kamu</p>
        <p className="m-0 text-5xl font-bold tabular-nums text-amber-300 [text-shadow:0_0_18px_rgba(251,191,36,.6)]">
          {score}
        </p>
        <p className="m-0 mt-1 text-lg">
          {correct} dari {TOTAL} benar
        </p>
        <p className="m-0 mt-1 text-indigo-100">{scoreMessage(correct, TOTAL)}</p>
        <p className="m-0 mt-1 text-sm text-indigo-200">
          Terbaik: {best} dari {TOTAL} benar
        </p>
      </div>

      {student && attempt && (
        <AttemptHistory student={student} attempts={attemptsOf(student)} currentId={attempt.waktu} />
      )}

      <h3 className="m-0 mt-6 text-lg font-bold">Periksa jawabanmu</h3>
      <ol className="m-0 mt-2 grid list-none gap-2 p-0">
        {quiz.questions.map((q, i) => {
          const a = answers[i];
          const right = a === q.correct;
          const status = a === null ? '— Belum dijawab' : a === TIMEOUT ? '⏱ Waktu habis' : right ? '✓ Benar' : '✗ Salah';
          return (
            <li
              key={q.id}
              className={`rounded-2xl border-2 p-3 ${right ? 'border-emerald-400/60 bg-emerald-500/10' : 'border-rose-400/50 bg-rose-500/10'}`}
            >
              <p className="m-0 text-sm font-bold text-sky-200">
                Soal {i + 1} · {status}
              </p>
              <RichText text={q.text} className="m-0 mt-1" />
              {!right && (
                <p className="m-0 mt-1 text-sm text-indigo-100">
                  Jawaban benar: <RichText text={q.options[q.correct]} as="strong" />
                </p>
              )}
            </li>
          );
        })}
      </ol>

      <div className="mt-5 grid gap-3">
        <button
          type="button"
          onClick={onRetry}
          className={`h-14 cursor-pointer rounded-full border-2 border-white/70 bg-gradient-to-r from-violet-500 via-indigo-500 to-sky-500 text-xl font-bold uppercase tracking-wide text-white motion-safe:animate-glow ${FOCUS}`}
          style={GAME_FONT}
        >
          Main lagi 🚀
        </button>
        <Link
          to="/"
          className={`flex h-12 items-center justify-center rounded-full border-2 border-sky-400/50 font-bold text-sky-100 no-underline hover:bg-white/10 ${FOCUS}`}
        >
          Kembali ke Menu Utama
        </Link>
      </div>
    </QuestCard>
    </>
  );
}

/* ---------- Halaman Kuis ---------- */

const fresh = () => ({
  index: 0,
  answers: Array(TOTAL).fill(null),
  selected: null,
  submitted: false,
  score: 0,
  gain: 0,
  timeLeft: SECONDS,
  finished: false,
});

export default function QuizPage() {
  const [g, setG] = useState(fresh);
  const [settings, setSettings] = useState(false);
  const [student, setStudent] = useState(loadStudent);
  const [askStudent, setAskStudent] = useState(() => !loadStudent());
  const [attempt, setAttempt] = useState(null);
  const recorded = useRef(false);
  const q = quiz.questions[g.index];
  const playing = !g.finished && !g.submitted;

  // Efek suara: benar / salah (waktu habis juga dihitung salah)
  useEffect(() => {
    if (!g.submitted) return;
    if (g.answers[g.index] === quiz.questions[g.index].correct) sfx.correct();
    else sfx.wrong();
  }, [g.submitted, g.index]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (g.finished) sfx.finish();
  }, [g.finished]);

  // Catat percobaan sekali setiap kuis selesai
  useEffect(() => {
    if (!g.finished || recorded.current || !student) return;
    recorded.current = true;
    setAttempt(
      recordAttempt(student, {
        skor: g.score,
        benar: countCorrect(quiz.questions, g.answers),
        total: TOTAL,
      }),
    );
  }, [g.finished, g.score, g.answers, student]);

  // Hitung mundur per soal (berhenti selama form identitas tampil)
  useEffect(() => {
    if (!playing || askStudent) return undefined;
    const id = setInterval(() => {
      setG((s) => {
        if (s.finished || s.submitted) return s;
        if (s.timeLeft > 1) return { ...s, timeLeft: s.timeLeft - 1 };
        return {
          ...s,
          timeLeft: 0,
          submitted: true,
          gain: 0,
          answers: s.answers.map((a, i) => (i === s.index ? TIMEOUT : a)),
        };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [playing, g.index, askStudent]);

  const restart = () => {
    sfx.click();
    setSettings(false);
    setAttempt(null);
    recorded.current = false;
    setG(fresh());
  };

  if (askStudent) {
    return (
      <CosmicPage>
        <IdentityForm
          initial={student}
          onSave={(st) => {
            setStudent(st);
            setAskStudent(false);
            restart();
          }}
        />
      </CosmicPage>
    );
  }

  const submit = () =>
    setG((s) => {
      if (s.selected === null || s.submitted) return s;
      const right = s.selected === quiz.questions[s.index].correct;
      const gain = right ? pointsFor(s.timeLeft) : 0;
      return {
        ...s,
        submitted: true,
        score: s.score + gain,
        gain,
        answers: s.answers.map((a, i) => (i === s.index ? s.selected : a)),
      };
    });

  const next = () =>
    setG((s) => {
      if (s.index + 1 >= TOTAL) return { ...s, finished: true };
      return { ...s, index: s.index + 1, selected: null, submitted: false, gain: 0, timeLeft: SECONDS };
    });

  const answer = g.answers[g.index];
  const right = g.submitted && answer === q.correct;
  const progress = ((g.index + (g.submitted ? 1 : 0)) / TOTAL) * 100;
  const lowTime = g.timeLeft <= 10;

  return (
    <CosmicPage>
      <Hud
        score={g.score}
        index={g.index}
        onSettings={() => {
          sfx.click();
          setSettings((v) => !v);
        }}
        settingsOpen={settings}
      />
      {settings && (
        <Settings
          onRestart={restart}
          student={student}
          onChangeStudent={() => {
            setSettings(false);
            clearStudent();
            setAskStudent(true);
          }}
        />
      )}
      {student && !g.finished && (
        <p className="m-0 mt-2 text-center text-sm text-indigo-200">
          👤 {student.nama} · Kelas {student.kelas}
        </p>
      )}

      {g.finished ? (
        <QuizResult
          answers={g.answers}
          score={g.score}
          onRetry={restart}
          student={student}
          attempt={attempt}
        />
      ) : (
        <QuestCard
          key={`card-${g.index}-${g.submitted && !right ? 'hit' : 'ok'}`}
          title={quiz.title}
          className={g.submitted && !right ? 'motion-safe:animate-shake' : ''}
        >
          {g.submitted && (
            <span
              aria-hidden="true"
              className={`pointer-events-none absolute left-1/2 top-24 z-10 whitespace-nowrap rounded-full border-2 px-4 py-1.5 text-2xl font-bold motion-safe:animate-xp-float motion-reduce:hidden ${right ? 'border-amber-200 bg-gradient-to-r from-amber-300 to-orange-500 text-amber-950 shadow-[0_0_24px_rgba(251,191,36,.8)]' : 'border-rose-200 bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-[0_0_20px_rgba(244,63,94,.7)]'}`}
              style={GAME_FONT}
            >
              {right ? `+${g.gain} XP 🌟 Benar!` : answer === TIMEOUT ? '⏱ Waktu habis!' : '💥 Oops!'}
            </span>
          )}
          {/* Progres */}
          <p className="m-0 text-center text-base text-indigo-100">
            Soal {g.index + 1}/{TOTAL}
          </p>
          <div
            className="mx-auto mt-1.5 h-3 max-w-xs overflow-hidden rounded-full border border-indigo-200/60 bg-[#120c3d]"
            role="progressbar"
            aria-label="Kemajuan kuis"
            aria-valuemin={0}
            aria-valuemax={TOTAL}
            aria-valuenow={g.index + (g.submitted ? 1 : 0)}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-300 transition-[width] duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-3">
            <MiniGrid points={q.plot} showLabels={g.submitted} />
          </div>

          {g.index === 0 && !g.submitted && <p className="m-0 mb-2 text-center text-sm text-indigo-200">{quiz.intro}</p>}
          <RichText
            key={q.id}
            text={q.text}
            className="m-0 text-center text-xl font-bold leading-snug text-white motion-safe:animate-fade-up sm:text-2xl"
          />

          {/* Pilihan A–D */}
          <ul className="m-0 mt-5 grid list-none gap-3 p-0 sm:grid-cols-2" role="radiogroup" aria-label="Pilih jawaban">
            {q.options.map((opt, i) => {
              const st = CHOICE_STYLE[i % CHOICE_STYLE.length];
              const isSel = g.selected === i;
              const isAnswer = g.submitted && i === q.correct;
              const isWrongPick = g.submitted && isSel && !right;
              const dim = g.submitted && !isAnswer && !isWrongPick;
              return (
                <li key={i}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={isSel}
                    disabled={g.submitted}
                    onClick={() => {
                      sfx.select();
                      setG((s) => ({ ...s, selected: i }));
                    }}
                    className={`flex min-h-[3.4rem] w-full cursor-pointer items-center gap-2 rounded-full border-2 bg-gradient-to-b px-5 text-left text-xl font-bold text-white transition duration-150 disabled:cursor-default [text-shadow:0_2px_0_rgba(0,0,0,.3)] ${st.face} ${isSel ? `scale-[1.03] border-white ring-4 ${st.ring}` : 'border-white/40 hover:-translate-y-0.5 hover:border-white/80'} ${dim ? 'opacity-40' : ''} ${isAnswer ? 'shadow-[0_0_24px_rgba(52,211,153,.9)]' : ''} ${FOCUS}`}
                    style={{ ...GAME_FONT, boxShadow: isAnswer ? undefined : `0 5px 0 ${st.edge}` }}
                  >
                    <span className="text-amber-100">{LETTERS[i]}.</span>
                    <span className="min-w-0 flex-1">
                      <Inline text={opt} />
                    </span>
                    {isAnswer && <span aria-label="jawaban benar">✓</span>}
                    {isWrongPick && <span aria-label="jawabanmu salah">✗</span>}
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Waktu */}
          <p
            className={`m-0 mt-5 flex items-center justify-center gap-2 text-lg ${lowTime && playing ? 'text-rose-300 motion-safe:animate-pulse' : 'text-indigo-100'}`}
            aria-live="off"
          >
            <span aria-hidden="true">⏳</span> Waktu Tersisa: <span className="tabular-nums font-bold">{g.timeLeft}s</span>
          </p>

          {/* Umpan balik */}
          {g.submitted && (
            <div
              role="status"
              className={`mt-4 rounded-2xl border-2 p-3 motion-safe:animate-pop ${right ? 'border-emerald-400/70 bg-emerald-500/15' : 'border-rose-400/70 bg-rose-500/15'}`}
            >
              <p className={`m-0 font-bold ${right ? 'text-emerald-300' : 'text-rose-300'}`}>
                {right ? `🎉 Benar! +${g.gain} poin` : answer === TIMEOUT ? '⏱ Waktu habis! Tidak dapat poin.' : '💥 Belum tepat.'}
              </p>
              {!right && (
                <p className="m-0 mt-1 text-indigo-50">
                  Jawaban benar: <RichText text={q.options[q.correct]} as="strong" />
                </p>
              )}
              <RichText text={q.explain} className="m-0 mt-1 text-indigo-100" />
            </div>
          )}

          {/* Tombol aksi */}
          <div className="relative -mb-12 mt-6 flex justify-center">
            {g.submitted ? (
              <button
                type="button"
                onClick={() => {
                  sfx.click();
                  next();
                }}
                autoFocus
                className={`h-14 w-[min(100%,22rem)] cursor-pointer rounded-full border-2 border-white/80 bg-gradient-to-r from-violet-500 via-indigo-500 to-sky-500 text-xl font-bold uppercase tracking-wide text-white motion-safe:animate-glow ${FOCUS}`}
                style={GAME_FONT}
              >
                {g.index + 1 >= TOTAL ? 'Lihat Hasil 🏁' : 'Soal Berikutnya ➜'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  sfx.click();
                  submit();
                }}
                disabled={g.selected === null}
                className={`h-14 w-[min(100%,22rem)] cursor-pointer rounded-full border-2 border-white/80 bg-gradient-to-r from-violet-500 via-indigo-400 to-violet-500 text-xl font-bold uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-50 enabled:motion-safe:animate-glow ${FOCUS}`}
                style={GAME_FONT}
              >
                Kirim Jawaban 🚀
              </button>
            )}
          </div>
        </QuestCard>
      )}
    </CosmicPage>
  );
}
