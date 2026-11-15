import { useState } from 'react';
import { Link } from 'react-router-dom';
import ChoiceList from '../components/ChoiceList.jsx';
import lessonStyles from '../components/LessonPlayer.module.css';
import pretest from '../data/pretest.json';
import { ACTIONS } from '../state/progress.js';
import { useProgress } from '../state/ProgressContext.jsx';

/** Cek Awal: 5 soal garis bilangan untuk menentukan titik mulai belajar. */
export default function PretestPage() {
  const { dispatch } = useProgress();
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const total = pretest.questions.length;

  const answer = (choice) => {
    const q = pretest.questions[index];
    const newScore = score + (choice === q.correct ? 1 : 0);
    setScore(newScore);
    if (index + 1 < total) {
      setIndex(index + 1);
    } else {
      dispatch({ type: ACTIONS.SET_PRETEST, score: newScore });
      setDone(true);
    }
  };

  if (done) {
    const needsWarmup = score < pretest.passScore;
    return (
      <section className={`card ${lessonStyles.finish}`}>
        <h2>
          Skor Cek Awal: {score} dari {total}
        </h2>
        {needsWarmup ? (
          <>
            <p>Kita pemanasan dulu tentang garis bilangan, supaya materi koordinat terasa lebih mudah.</p>
            <div className={lessonStyles.finishActions}>
              <Link to="/belajar/m0" className="btn btn-primary btn-block">
                Mulai Pemanasan
              </Link>
              <Link to="/belajar/m1" className="btn btn-block">
                Langsung ke Modul 1
              </Link>
            </div>
          </>
        ) : (
          <>
            <p>Bagus! Kamu siap mulai belajar koordinat.</p>
            <div className={lessonStyles.finishActions}>
              <Link to="/belajar/m1" className="btn btn-primary btn-block">
                Mulai Modul 1
              </Link>
            </div>
          </>
        )}
      </section>
    );
  }

  const q = pretest.questions[index];
  return (
    <div className={lessonStyles.wrap}>
      <div className={lessonStyles.progress}>
        <span className={lessonStyles.moduleTitle}>Cek Awal</span>
        <span className="muted">
          Soal {index + 1}/{total}
        </span>
      </div>
      <p className="muted">Jawab sebisamu. Tidak ada nilai, ini hanya untuk menentukan titik mulai.</p>
      <div className={lessonStyles.step}>
        <p className={lessonStyles.text}>{q.text}</p>
        <ChoiceList key={q.id} label="Pilih jawaban" options={q.options.map((o) => ({ label: o }))} onPick={answer} />
      </div>
    </div>
  );
}
