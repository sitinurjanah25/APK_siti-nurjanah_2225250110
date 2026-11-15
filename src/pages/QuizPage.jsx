import { useState } from 'react';
import { Link } from 'react-router-dom';
import ChoiceList from '../components/ChoiceList.jsx';
import RichText from '../components/RichText.jsx';
import quiz from '../data/quiz.json';
import { countCorrect, saveBestScore, scoreMessage } from '../lib/quiz.js';

const TOTAL = quiz.questions.length;

const PRIMARY_BTN =
  'flex min-h-[3rem] w-full items-center justify-center rounded-2xl bg-gradient-to-r from-blue-800 via-blue-700 to-sky-500 px-6 py-3 text-lg font-extrabold text-white no-underline shadow-lg shadow-blue-700/30 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl border-0 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700';
const SECONDARY_BTN =
  'flex min-h-[3rem] w-full items-center justify-center rounded-2xl border-2 border-slate-200 bg-white px-6 py-3 font-bold text-slate-700 no-underline transition hover:border-slate-300 cursor-pointer';

function QuizResult({ answers, onRetry }) {
  const score = countCorrect(quiz.questions, answers);
  const [best] = useState(() => saveBestScore(score));
  const percent = Math.round((score / TOTAL) * 100);

  return (
    <div className="space-y-5 pb-4">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-lg shadow-slate-900/5">
        <p className="m-0 text-sm font-bold uppercase tracking-wider text-slate-500">Skor kamu</p>
        <h2 className="m-0 mt-1 text-4xl font-extrabold text-slate-900">
          {score} dari {TOTAL} benar
        </h2>
        <div
          className="mx-auto mt-4 h-3 max-w-xs overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-label="Jawaban benar"
          aria-valuemin={0}
          aria-valuemax={TOTAL}
          aria-valuenow={score}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-700 to-sky-400"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="m-0 mt-3 text-slate-600">{scoreMessage(score, TOTAL)}</p>
        <p className="m-0 mt-1 text-sm text-slate-500">
          Skor terbaik: {best} dari {TOTAL}
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="m-0 text-lg font-bold text-slate-900">Periksa jawabanmu</h3>
        <ol className="m-0 list-none space-y-2 p-0">
          {quiz.questions.map((q, i) => {
            const right = answers[i] === q.correct;
            return (
              <li
                key={q.id}
                className={`rounded-2xl border-2 p-3 ${right ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}
              >
                <p className="m-0 text-sm font-bold text-slate-700">
                  Soal {i + 1} · {right ? '✓ Benar' : '✗ Salah'}
                </p>
                <RichText text={q.text} className="m-0 mt-1 text-slate-900" />
                {!right && (
                  <p className="m-0 mt-1 text-sm text-slate-700">
                    Jawaban benar: <RichText text={q.options[q.correct]} as="strong" />
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      <div className="space-y-3">
        <button type="button" className={PRIMARY_BTN} onClick={onRetry}>
          Ulangi Latihan
        </button>
        <Link to="/" className={SECONDARY_BTN}>
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}

export default function QuizPage() {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState(() => Array(TOTAL).fill(null));
  const [finished, setFinished] = useState(false);

  if (finished) {
    return (
      <QuizResult
        answers={answers}
        onRetry={() => {
          setAnswers(Array(TOTAL).fill(null));
          setIndex(0);
          setFinished(false);
        }}
      />
    );
  }

  const q = quiz.questions[index];
  const picked = answers[index];
  const answered = picked !== null;
  const right = answered && picked === q.correct;
  const isLast = index + 1 === TOTAL;

  const pick = (choice) => {
    if (answered) return;
    setAnswers((prev) => prev.map((a, i) => (i === index ? choice : a)));
  };

  return (
    <div className="space-y-4 pb-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold text-slate-900">{quiz.title}</span>
          <span className="text-slate-500">
            Soal {index + 1}/{TOTAL}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-blue-100" aria-hidden="true">
          <div
            className="h-full rounded-full bg-blue-600 transition-[width] duration-300"
            style={{ width: `${((index + (answered ? 1 : 0)) / TOTAL) * 100}%` }}
          />
        </div>
        {index === 0 && !answered && <p className="m-0 text-sm text-slate-500">{quiz.intro}</p>}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg shadow-slate-900/5 sm:p-5">
        <RichText text={q.text} className="m-0 mb-4 text-lg font-semibold leading-snug text-slate-900" />
        <ChoiceList
          key={q.id}
          label="Pilih jawaban"
          options={q.options.map((o) => ({ label: o }))}
          picked={picked}
          status={answered ? (right ? 'ok' : 'err') : null}
          disabled={answered}
          onPick={pick}
        />
      </section>

      {answered && (
        <section
          role="status"
          className={`rounded-2xl border-2 p-4 ${right ? 'border-emerald-300 bg-emerald-50' : 'border-red-300 bg-red-50'}`}
        >
          <p className={`m-0 font-extrabold ${right ? 'text-emerald-800' : 'text-red-800'}`}>
            {right ? '✓ Benar!' : '✗ Belum tepat.'}
          </p>
          {!right && (
            <p className="m-0 mt-1 text-slate-800">
              Jawaban benar: <RichText text={q.options[q.correct]} as="strong" />
            </p>
          )}
          <RichText text={q.explain} className="m-0 mt-1 text-slate-700" />
        </section>
      )}

      {answered && (
        <button type="button" className={PRIMARY_BTN} onClick={() => (isLast ? setFinished(true) : setIndex(index + 1))}>
          {isLast ? 'Lihat Skor' : 'Soal Berikutnya'}
        </button>
      )}
    </div>
  );
}
