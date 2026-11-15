import { useId, useState } from 'react';
import { fmtNum } from '../lib/coords.js';
import styles from './CoordinateInput.module.css';

/** Baca bilangan bulat (boleh pakai tanda minus "−"), atau null. */
export function parseInteger(value) {
  const s = String(value).trim().replace(/−/g, '-');
  if (!/^-?\d+$/.test(s)) return null;
  const n = Number(s);
  return n === 0 ? 0 : n;
}

function toggleSign(value) {
  const s = String(value).trim().replace(/−/g, '-');
  return s.startsWith('-') ? s.slice(1) : `-${s}`;
}

/** Form isian koordinat (x, y). */
export default function CoordinateInput({ range = 5, onSubmit, submitLabel = 'Tampilkan titik', disabled = false }) {
  const id = useId();
  const [xText, setXText] = useState('');
  const [yText, setYText] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const x = parseInteger(xText);
    const y = parseInteger(yText);
    const bounds = `${fmtNum(-range)} sampai ${range}`;
    if (x === null || Math.abs(x) > range) {
      setError(`Nilai x harus bilangan bulat dari ${bounds}.`);
      return;
    }
    if (y === null || Math.abs(y) > range) {
      setError(`Nilai y harus bilangan bulat dari ${bounds}.`);
      return;
    }
    setError('');
    onSubmit([x, y]);
  };

  const field = (axis, value, setValue) => (
    <div className={`${styles.field} ${axis === 'x' ? styles.fieldX : styles.fieldY}`}>
      <label htmlFor={`${id}-${axis}`} className={styles.label}>
        {axis}
      </label>
      <button
        type="button"
        className={styles.sign}
        onClick={() => setValue(toggleSign(value))}
        aria-label={`Ubah tanda ${axis} (positif/negatif)`}
      >
        ±
      </button>
      <input
        id={`${id}-${axis}`}
        className={styles.input}
        inputMode="numeric"
        autoComplete="off"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-describedby={error ? `${id}-err` : undefined}
      />
    </div>
  );

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.row}>
        <span className={styles.paren} aria-hidden="true">
          (
        </span>
        {field('x', xText, setXText)}
        <span className={styles.paren} aria-hidden="true">
          ,
        </span>
        {field('y', yText, setYText)}
        <span className={styles.paren} aria-hidden="true">
          )
        </span>
      </div>
      {error && (
        <p id={`${id}-err`} className={styles.error} role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn btn-primary btn-block" disabled={disabled}>
        {submitLabel}
      </button>
    </form>
  );
}

/** Form isian satu bilangan (misalnya jarak dalam satuan). */
export function NumberAnswerInput({ label, tone = 'x', disabled = false, onSubmit }) {
  const id = useId();
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const n = parseInteger(text);
    if (n === null) {
      setError('Isi dengan bilangan bulat, misalnya 3.');
      return;
    }
    setError('');
    onSubmit(n);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.row}>
        <div className={`${styles.field} ${tone === 'x' ? styles.fieldX : styles.fieldY}`}>
          <label htmlFor={id} className={styles.wideLabel}>
            {label}
          </label>
          <button
            type="button"
            className={styles.sign}
            onClick={() => setText((t) => (t.trim().startsWith('-') ? t.trim().slice(1) : `-${t.trim()}`))}
            aria-label="Ubah tanda (positif/negatif)"
            disabled={disabled}
          >
            ±
          </button>
          <input
            id={id}
            className={styles.input}
            inputMode="numeric"
            autoComplete="off"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={disabled}
          />
          <span className={styles.unit}>satuan</span>
        </div>
      </div>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn btn-primary btn-block" disabled={disabled}>
        Periksa
      </button>
    </form>
  );
}
