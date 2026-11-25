import { RMT_STAGES } from '../../data/tutor.js';

/**
 * Indikator tahap Rigorous Mathematical Thinking yang sedang dibimbing Kak Carta.
 * Membantu siswa (dan guru) melihat proses berpikirnya, bukan hanya jawabannya.
 */
export default function RmtStageBar({ stage }) {
  const current = stage?.id ?? 0;
  return (
    <ol className="m-0 flex list-none gap-1 bg-indigo-50 px-3 py-2" aria-label="Tahap berpikir (RMT)">
      {RMT_STAGES.map((s) => {
        const active = s.id === current;
        const done = s.id < current;
        return (
          <li
            key={s.id}
            aria-current={active ? 'step' : undefined}
            title={s.name}
            className={`flex min-w-0 flex-1 items-center justify-center gap-1 rounded-full px-1.5 py-1 text-[11px] font-bold transition ${
              active
                ? 'bg-indigo-600 text-white shadow-sm'
                : done
                  ? 'bg-indigo-200 text-indigo-900'
                  : 'bg-white text-slate-500'
            }`}
          >
            <span aria-hidden="true">{s.icon}</span>
            {/* Nama lengkap hanya untuk tahap aktif supaya bar tetap ringkas */}
            <span className={active ? 'truncate' : 'visually-hidden'}>{stage?.name && active ? stage.name : s.name}</span>
          </li>
        );
      })}
    </ol>
  );
}
