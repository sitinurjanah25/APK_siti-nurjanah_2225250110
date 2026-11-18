import { lazy, Suspense, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CosmicPage, FOCUS, GAME_FONT, GlowTitle } from '../components/cosmic/Cosmic.jsx';
import { BUILDINGS } from '../data/buildings.js';
import { describeOffset, distToXAxis, distToYAxis, fmtNum, locationLabel } from '../lib/coords.js';
import { hasWebGL } from '../lib/webgl.js';

const City3D = lazy(() => import('../three/City3D.jsx'));

/** Ikon tiap jenis bangunan untuk daftar. */
const ICON = {
  alun: '⛲',
  hospital: '🏥',
  library: '📚',
  school: '🏫',
  bank: '🏦',
  police: '🚓',
  mall: '🛍️',
  terminal: '🚌',
  gas: '⛽',
  mosque: '🕌',
  park: '🌳',
};

const GLASS =
  'rounded-3xl border-2 border-indigo-300/30 bg-white/[.07] shadow-[0_0_24px_rgba(129,140,248,.2),inset_0_1px_0_rgba(255,255,255,.15)] backdrop-blur-md';

const CAPSULE = `flex min-h-12 flex-1 basis-40 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full border-2 px-4 text-base font-bold text-white transition hover:-translate-y-0.5 active:translate-y-0.5 sm:text-lg ${FOCUS}`;

function IconButton({ children, label, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-2xl border-2 border-indigo-300/40 bg-white/10 text-xl text-white backdrop-blur-md transition hover:bg-white/20 ${FOCUS}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default function City3DPage() {
  const [selectedId, setSelectedId] = useState(null);
  const [view, setView] = useState('tilt');
  const [listOpen, setListOpen] = useState(true);
  const [help, setHelp] = useState(false);
  const cityRef = useRef(null);
  const supported = hasWebGL();

  const changeView = (v) => {
    setView(v);
    cityRef.current?.flyTo(v);
  };

  const selected = BUILDINGS.find((b) => b.id === selectedId);

  if (!supported) {
    return (
      <CosmicPage>
        <GlowTitle className="py-2 text-3xl">Eksplorasi Kota 3D</GlowTitle>
        <div className={`${GLASS} mx-auto mt-6 max-w-md p-5 text-center`}>
          <p className="m-0 text-lg font-bold">Kota 3D belum bisa dibuka</p>
          <p className="m-0 mt-2 text-indigo-100">
            HP atau browser ini tidak mendukung grafik 3D. Semua materi tetap bisa dipelajari di grid 2D.
          </p>
          <Link
            to="/bidang-bebas"
            className={`${CAPSULE} mt-4 border-white/60 bg-gradient-to-r from-sky-500 to-blue-600 no-underline`}
          >
            Ke Bidang Bebas
          </Link>
        </div>
      </CosmicPage>
    );
  }

  return (
    <CosmicPage>
      {/* Header */}
      <div className="relative flex items-center justify-center">
        <GlowTitle className="px-24 py-1 text-[1.9rem] sm:text-5xl">Eksplorasi Kota 3D</GlowTitle>
        <div className="absolute right-0 top-1/2 flex -translate-y-1/2 gap-2">
          <IconButton label="Cara memutar kota" aria-expanded={help} onClick={() => setHelp((v) => !v)}>
            ❓
          </IconButton>
          <Link
            to="/bidang-bebas"
            aria-label="Kembali ke Peta 2D"
            title="Kembali ke Peta 2D"
            className={`flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-indigo-300/40 bg-white/10 text-xl no-underline backdrop-blur-md transition hover:bg-white/20 ${FOCUS}`}
          >
            🗺️
          </Link>
        </div>
      </div>
      <p className="m-0 mt-1 text-center text-xs font-bold uppercase tracking-[0.25em] text-fuchsia-300">✨ Eksperimen</p>

      {help && (
        <ul className={`${GLASS} mx-auto mt-3 max-w-xl list-none space-y-1 p-4 text-sm text-indigo-50 motion-safe:animate-fade-up`}>
          <li>👆 <strong>Satu jari</strong>: putar kota ke segala arah</li>
          <li>🤏 <strong>Dua jari</strong>: cubit untuk zoom, geser untuk memindah kota</li>
          <li>🖱️ Di laptop: klik kiri = putar, klik kanan = geser, roda mouse = zoom</li>
          <li>🏠 <strong>Ketuk bangunan</strong> untuk melihat koordinatnya</li>
        </ul>
      )}

      <div className="mx-auto mt-5 grid max-w-[1100px] gap-5 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="space-y-4">
          {/* Papan kota 3D dalam bingkai kaca neon */}
          <div className="relative rounded-[2rem] border-2 border-sky-300/50 bg-gradient-to-b from-[#1b1f6b]/70 to-[#120c3d]/80 p-2 shadow-[0_0_0_4px_rgba(56,189,248,.12),0_0_40px_rgba(56,189,248,.35),0_0_70px_rgba(168,85,247,.3),inset_0_0_40px_rgba(99,102,241,.25)] backdrop-blur-md">
            <div className="relative mx-auto aspect-square max-h-[70vh] w-full overflow-hidden rounded-[1.6rem] sm:aspect-[4/3]">
              <Suspense fallback={<p className="m-0 grid h-full place-items-center text-indigo-100">Memuat kota…</p>}>
                <City3D ref={cityRef} buildings={BUILDINGS} selectedId={selectedId} onSelectBuilding={setSelectedId} />
              </Suspense>
              <div className="absolute right-2 top-2 grid gap-2" role="group" aria-label="Zoom kota 3D">
                <IconButton label="Perbesar (mendekat)" onClick={() => cityRef.current?.zoom(0.75)}>
                  +
                </IconButton>
                <IconButton label="Perkecil (menjauh)" onClick={() => cityRef.current?.zoom(1.33)}>
                  −
                </IconButton>
              </div>
            </div>
          </div>

          {/* Tombol kapsul 3D */}
          <div className="flex flex-wrap gap-3" role="group" aria-label="Arah pandang" style={GAME_FONT}>
            <button
              type="button"
              aria-pressed={view === 'tilt'}
              onClick={() => changeView('tilt')}
              className={`${CAPSULE} ${view === 'tilt' ? 'border-sky-200 bg-gradient-to-b from-sky-400 to-indigo-600 shadow-[0_5px_0_#1e1b4b,0_0_18px_rgba(56,189,248,.6)]' : 'border-indigo-300/50 bg-gradient-to-b from-indigo-600 to-violet-800 shadow-[0_5px_0_#1e1b4b]'}`}
            >
              <span aria-hidden="true">📐</span> Lihat Miring
            </button>
            <button
              type="button"
              aria-pressed={view === 'top'}
              onClick={() => changeView('top')}
              className={`${CAPSULE} ${view === 'top' ? 'border-sky-200 bg-gradient-to-b from-sky-400 to-indigo-600 shadow-[0_5px_0_#1e1b4b,0_0_18px_rgba(56,189,248,.6)]' : 'border-indigo-300/50 bg-gradient-to-b from-indigo-600 to-violet-800 shadow-[0_5px_0_#1e1b4b]'}`}
            >
              <span aria-hidden="true">👁️</span> Lihat dari Atas
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedId(null);
                changeView('tilt');
              }}
              className={`${CAPSULE} border-indigo-300/50 bg-gradient-to-b from-indigo-600 to-violet-800 shadow-[0_5px_0_#1e1b4b]`}
            >
              <span aria-hidden="true">🔄</span> Atur Ulang
            </button>
          </div>

          {/* Info bangunan terpilih */}
          <section className={`${GLASS} p-4`} aria-live="polite">
            {selected ? (
              <>
                <p className="m-0 flex flex-wrap items-center gap-2 text-xl font-bold">
                  <span aria-hidden="true">{ICON[selected.type] ?? '🏢'}</span>
                  {selected.name}
                  <span className="tabular-nums">
                    (<span className="val-x">{fmtNum(selected.at[0])}</span>, <span className="val-y">{fmtNum(selected.at[1])}</span>)
                  </span>
                </p>
                <ul className="m-0 mt-2 grid list-none gap-1.5 p-0 text-sm sm:grid-cols-2 sm:text-base">
                  <li className="rounded-xl bg-white/5 px-3 py-2">📍 {locationLabel(selected.at)}</li>
                  <li className="rounded-xl bg-white/5 px-3 py-2">
                    <span className="val-y">Jarak ke sumbu-X:</span> {distToXAxis(selected.at)} satuan
                  </li>
                  <li className="rounded-xl bg-white/5 px-3 py-2">
                    <span className="val-x">Jarak ke sumbu-Y:</span> {distToYAxis(selected.at)} satuan
                  </li>
                  <li className="rounded-xl bg-white/5 px-3 py-2">⛲ Dari Alun-alun: {describeOffset(selected.at)}</li>
                </ul>
              </>
            ) : (
              <p className="m-0 text-indigo-200">Belum ada bangunan dipilih. Ketuk bangunan di kota, atau pilih dari daftar.</p>
            )}
          </section>
        </div>

        {/* Sidebar: Daftar bangunan */}
        <aside className={`${GLASS} overflow-hidden lg:sticky lg:top-[calc(var(--header-h)+1rem)]`}>
          <button
            type="button"
            onClick={() => setListOpen((v) => !v)}
            aria-expanded={listOpen}
            aria-controls="daftar-bangunan"
            className={`flex w-full cursor-pointer items-center justify-between border-0 bg-transparent px-4 py-3 text-left text-lg font-bold text-white ${FOCUS}`}
            style={GAME_FONT}
          >
            🏙️ Daftar bangunan
            <span className={`transition ${listOpen ? 'rotate-180' : ''}`} aria-hidden="true">
              ▾
            </span>
          </button>
          {listOpen && (
            <ul id="daftar-bangunan" className="m-0 grid max-h-[60vh] list-none gap-2 overflow-y-auto p-3 pt-0">
              {BUILDINGS.map((b) => {
                const active = b.id === selectedId;
                return (
                  <li key={b.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(b.id)}
                      aria-pressed={active}
                      className={`flex w-full cursor-pointer items-center gap-3 rounded-2xl border-2 px-3 py-2 text-left text-white transition ${active ? 'border-sky-300 bg-sky-400/20 shadow-[0_0_14px_rgba(56,189,248,.5)]' : 'border-white/10 bg-white/5 hover:border-indigo-300/50 hover:bg-white/10'} ${FOCUS}`}
                    >
                      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-white/10 text-2xl" aria-hidden="true">
                        {ICON[b.type] ?? '🏢'}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-bold leading-tight">{b.name}</span>
                        <span className="block text-sm tabular-nums text-indigo-200">
                          (<span className="val-x">{fmtNum(b.at[0])}</span>, <span className="val-y">{fmtNum(b.at[1])}</span>)
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>
      </div>
    </CosmicPage>
  );
}
