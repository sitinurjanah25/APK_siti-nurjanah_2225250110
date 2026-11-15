const BTN =
  'flex h-11 min-w-11 items-center justify-center gap-1 rounded-2xl border border-white/20 bg-slate-900/70 px-3 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-slate-800 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300';

/** Tombol kamera untuk HP & laptop (di atas kanvas 3D). */
export default function CameraControls({ sceneRef }) {
  const call = (fn, ...args) => sceneRef.current?.[fn]?.(...args);
  return (
    <div className="pointer-events-none absolute inset-x-2 bottom-2 flex flex-wrap items-end justify-between gap-2">
      <div className="pointer-events-auto flex gap-2" role="group" aria-label="Putar kamera">
        <button type="button" className={BTN} onClick={() => call('rotate', -45)} aria-label="Putar ke kiri">
          ⟲ <span className="hidden sm:inline">Kiri</span>
        </button>
        <button type="button" className={BTN} onClick={() => call('rotate', 45)} aria-label="Putar ke kanan">
          <span className="hidden sm:inline">Kanan</span> ⟳
        </button>
        <button type="button" className={BTN} onClick={() => call('topView')} aria-label="Lihat dari atas">
          ⬇ <span className="hidden sm:inline">Atas</span>
        </button>
      </div>
      <div className="pointer-events-auto flex gap-2" role="group" aria-label="Zoom dan reset kamera">
        <button type="button" className={BTN} onClick={() => call('zoom', 0.75)} aria-label="Perbesar">
          +
        </button>
        <button type="button" className={BTN} onClick={() => call('zoom', 1.33)} aria-label="Perkecil">
          −
        </button>
        <button type="button" className={BTN} onClick={() => call('resetView')}>
          ↺ Reset
        </button>
      </div>
    </div>
  );
}
