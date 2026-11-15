import RichText from './RichText.jsx';
import styles from './ChoiceList.module.css';

/**
 * Daftar tombol pilihan jawaban.
 * `status` ("ok" / "err") hanya diberikan ke pilihan yang sedang dipilih.
 */
export default function ChoiceList({ options, picked = null, status = null, disabled = false, onPick, label }) {
  return (
    <div className={styles.list} role="group" aria-label={label}>
      {options.map((opt, i) => {
        const st = picked === i ? status : null;
        return (
          <button
            key={i}
            type="button"
            className={`${styles.option} ${st === 'ok' ? styles.ok : ''} ${st === 'err' ? styles.err : ''}`}
            onClick={() => onPick(i)}
            disabled={disabled}
            aria-pressed={picked === i}
          >
            <RichText text={opt.label} as="span" />
          </button>
        );
      })}
    </div>
  );
}
