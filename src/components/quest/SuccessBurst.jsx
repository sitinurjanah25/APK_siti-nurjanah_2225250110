import styles from './SuccessBurst.module.css';

/**
 * Popup arcade besar di tengah layar: "PERFECT!", poin, dan combo.
 * Muncul sebentar lalu hilang sendiri (tidak menghalangi ketukan).
 */
export default function SuccessBurst({ burstKey, title, points, streak }) {
  return (
    <div key={burstKey} className={styles.layer} aria-hidden="true">
      <div className={styles.flash} />
      <div className={styles.card}>
        <p className={styles.title}>{title}</p>
        <p className={styles.points}>+{points}</p>
        {streak >= 2 && <p className={styles.combo}>🔥 {streak}x beruntun</p>}
      </div>
    </div>
  );
}
