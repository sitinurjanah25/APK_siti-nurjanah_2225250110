import { useMemo } from 'react';
import styles from './Confetti.module.css';

const COLORS = ['#f43f5e', '#f59e0b', '#fde047', '#22c55e', '#38bdf8', '#a855f7'];

/** Hujan konfeti singkat. Ganti `burstKey` untuk memicu lagi. */
export default function Confetti({ burstKey, count = 70 }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.35,
        duration: 1.2 + Math.random() * 1.1,
        drift: (Math.random() - 0.5) * 160,
        spin: (Math.random() - 0.5) * 1440,
        color: COLORS[i % COLORS.length],
        round: i % 3 === 0,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [burstKey, count],
  );

  return (
    <div className={styles.layer} aria-hidden="true" key={burstKey}>
      {pieces.map((p, i) => (
        <span
          key={i}
          className={`${styles.piece} ${p.round ? styles.round : ''}`}
          style={{
            left: `${p.left}%`,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            '--drift': `${p.drift}px`,
            '--spin': `${p.spin}deg`,
          }}
        />
      ))}
    </div>
  );
}
