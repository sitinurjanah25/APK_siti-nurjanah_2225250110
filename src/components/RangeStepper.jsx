import { fmtNum } from '../lib/coords.js';
import styles from './RangeStepper.module.css';

/** Tombol zoom grid: −5…5 atau −10…10. */
export default function RangeStepper({ range, onChange }) {
  return (
    <div className={styles.group} role="group" aria-label="Perbesar atau perkecil grid">
      <button
        type="button"
        className={styles.btn}
        onClick={() => onChange(10)}
        disabled={range === 10}
        aria-label={`Perkecil: tampilkan ${fmtNum(-10)} sampai 10`}
      >
        −
      </button>
      <span className={styles.range}>
        {fmtNum(-range)} … {range}
      </span>
      <button
        type="button"
        className={styles.btn}
        onClick={() => onChange(5)}
        disabled={range === 5}
        aria-label={`Perbesar: tampilkan ${fmtNum(-5)} sampai 5`}
      >
        +
      </button>
    </div>
  );
}
