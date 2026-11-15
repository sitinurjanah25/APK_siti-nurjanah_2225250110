import { useEffect, useState } from 'react';
import { parseInteger } from '../CoordinateInput.jsx';

const AXES = [
  { key: 0, name: 'x', hint: 'kanan +', ring: 'border-blue-400', text: 'text-blue-600', bg: 'bg-blue-50' },
  { key: 1, name: 'y', hint: 'belakang +', ring: 'border-orange-400', text: 'text-orange-600', bg: 'bg-orange-50' },
  { key: 2, name: 'z', hint: 'naik +', ring: 'border-emerald-400', text: 'text-emerald-600', bg: 'bg-emerald-50' },
];

function AxisField({ axis, value, min, max, disabled, onChange }) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);

  const commit = (raw) => {
    setText(raw);
    const n = parseInteger(raw);
    if (n !== null && n >= min && n <= max) onChange(n);
  };
  const step = (d) => onChange(Math.min(max, Math.max(min, value + d)));
  const stepBtn =
    'flex h-11 w-full items-center justify-center rounded-xl border-0 text-2xl font-black leading-none transition active:scale-90 disabled:opacity-40';

  return (
    <div className={`min-w-0 rounded-2xl border-2 ${axis.ring} ${axis.bg} p-2`}>
      <div className="mb-1 flex items-baseline justify-between gap-1 px-1">
        <label htmlFor={`q3-${axis.name}`} className={`text-xl font-black ${axis.text}`}>
          {axis.name}
        </label>
        <span className="truncate text-[0.65rem] font-semibold text-slate-500">{axis.hint}</span>
      </div>
      <input
        id={`q3-${axis.name}`}
        className="box-border h-12 w-full min-w-0 rounded-xl border-2 border-white bg-white text-center text-2xl font-black tabular-nums text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
        inputMode="numeric"
        autoComplete="off"
        value={text}
        disabled={disabled}
        onChange={(e) => commit(e.target.value)}
        onBlur={() => setText(String(value))}
      />
      <div className="mt-1.5 grid grid-cols-2 gap-1.5">
        <button
          type="button"
          className={`${stepBtn} bg-white ${axis.text}`}
          onClick={() => step(-1)}
          disabled={disabled || value <= min}
          aria-label={`Kurangi ${axis.name}`}
        >
          −
        </button>
        <button
          type="button"
          className={`${stepBtn} bg-white ${axis.text}`}
          onClick={() => step(1)}
          disabled={disabled || value >= max}
          aria-label={`Tambah ${axis.name}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

/** Isian (x, y, z) dengan tombol − / + yang nyaman di HP. */
export default function Coordinate3Input({ value, onChange, range = 5, zMax = 5, disabled = false, onSubmit, submitLabel }) {
  const set = (i, n) => onChange(value.map((v, j) => (j === i ? n : v)));
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(value);
      }}
      noValidate
    >
      <div className="grid grid-cols-3 gap-2">
        {AXES.map((a) => (
          <AxisField
            key={a.name}
            axis={a}
            value={value[a.key]}
            min={a.name === 'z' ? 0 : -range}
            max={a.name === 'z' ? zMax : range}
            disabled={disabled}
            onChange={(n) => set(a.key, n)}
          />
        ))}
      </div>
      <button
        type="submit"
        disabled={disabled}
        className="flex min-h-[3.25rem] w-full cursor-pointer items-center justify-center rounded-2xl border-0 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 px-5 text-lg font-black text-slate-900 shadow-lg shadow-orange-500/30 transition hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitLabel}
      </button>
    </form>
  );
}
