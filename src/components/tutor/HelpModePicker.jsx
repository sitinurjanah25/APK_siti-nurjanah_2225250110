import { HELP_MODES } from '../../data/tutor.js';

/**
 * Pilihan tingkat bantuan (Intrinsic Load): siswa mengatur sendiri seberapa banyak bantuan,
 * dari pertanyaan pemantik sampai contoh analogi. "Otomatis" mengikuti jumlah kesalahan.
 */
export default function HelpModePicker({ value, autoLevel, onChange, disabled }) {
  const current = HELP_MODES.find((m) => m.id === value) ?? HELP_MODES[0];
  const autoName = HELP_MODES.find((m) => m.level === autoLevel)?.label;
  return (
    <fieldset className="m-0 min-w-0 border-0 px-3 pb-2 pt-0" disabled={disabled}>
      <legend className="mb-1 p-0 text-[11px] font-bold uppercase tracking-wide text-slate-500">Tingkat bantuan</legend>
      <div className="grid grid-cols-4 gap-1" role="radiogroup" aria-label="Tingkat bantuan">
        {HELP_MODES.map((m) => {
          const on = m.id === current.id;
          return (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={on}
              title={m.desc}
              onClick={() => onChange(m.id)}
              className={`flex cursor-pointer flex-col items-center rounded-xl border-2 px-1 py-1 text-[11px] font-bold leading-tight transition disabled:opacity-50 ${
                on ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300'
              }`}
            >
              <span aria-hidden="true" className="text-base">
                {m.icon}
              </span>
              {m.label}
            </button>
          );
        })}
      </div>
      <p className="m-0 mt-1 text-[11px] text-slate-500" aria-live="polite">
        {current.id === 'auto' ? `${current.desc} (sekarang: ${autoName}).` : current.desc}
      </p>
    </fieldset>
  );
}
