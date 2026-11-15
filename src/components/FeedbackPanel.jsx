import RichText from './RichText.jsx';
import styles from './FeedbackPanel.module.css';

export default function FeedbackPanel({ correct, message }) {
  return (
    <div className={`${styles.panel} ${correct ? styles.ok : styles.err}`} role="status" aria-live="polite">
      <span className={styles.icon} aria-hidden="true">
        {correct ? '✓' : '!'}
      </span>
      <div>
        <p className={styles.title}>{correct ? 'Benar' : 'Coba lagi'}</p>
        <RichText text={message} className={styles.text} />
      </div>
    </div>
  );
}
