import { useState } from 'react';
import { Link } from 'react-router-dom';
import CoordinateInput from '../components/CoordinateInput.jsx';
import CoordinatePlane from '../components/CoordinatePlane.jsx';
import { CosmicPage, FOCUS, GAME_FONT, GlowTitle, NeonFrame, Toggle } from '../components/cosmic/Cosmic.jsx';
import { BUILDINGS } from '../data/buildings.js';
import { describeOffset, distToXAxis, distToYAxis, fmtNum, locationLabel, samePoint } from '../lib/coords.js';
import { hasWebGL } from '../lib/webgl.js';

const GLASS =
  'rounded-3xl border-2 border-indigo-300/30 bg-white/[.07] p-4 shadow-[0_0_24px_rgba(129,140,248,.2),inset_0_1px_0_rgba(255,255,255,.15)] backdrop-blur-md';
const PILL = `flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full border-2 border-white/60 px-5 text-base font-bold text-white no-underline transition hover:-translate-y-0.5 active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS}`;

/** Bidang Bebas: ketuk titik mana saja dan lihat keterangannya. */
export default function FreePlanePage() {
  const [range, setRange] = useState(5);
  const [point, setPoint] = useState(null);
  const [walkKey, setWalkKey] = useState(0);
  const [showBuildings, setShowBuildings] = useState(true);
  // Bawaan tanpa spoiler: angka sumbu, label kuadran, dan nama bangunan disembunyikan.
  // Koordinat titik tetap muncul di panel setelah titik diketuk.
  const [showQuadrants, setShowQuadrants] = useState(false);
  const [showNumbers, setShowNumbers] = useState(false);
  const [showNames, setShowNames] = useState(false);

  const select = (p) => {
    setPoint(p);
    setWalkKey(0);
  };

  const changeRange = (r) => {
    setRange(r);
    if (point && (Math.abs(point[0]) > r || Math.abs(point[1]) > r)) select(null);
  };

  const building = point && BUILDINGS.find((b) => samePoint(b.at, point));
  const [x, y] = point ?? [0, 0];
  const walk = walkKey && point ? [[0, 0], [x, 0], [x, y]] : null;

  return (
    <CosmicPage>
      <GlowTitle className="py-2 text-[2rem] sm:text-5xl">
        Bidang Bebas:
        <span className="block">Eksplorasi Koordinat</span>
      </GlowTitle>
      <p className="m-0 mt-2 text-center text-sm text-indigo-100 sm:text-base">👆 Ketuk titik mana saja di bidang koordinat.</p>

      <div className="mx-auto mt-5 grid max-w-[980px] gap-6 lg:grid-cols-[1.15fr_1fr] lg:items-start">
        {/* Peta */}
        <NeonFrame className="p-3 sm:p-5">
          <div className="mx-auto aspect-square w-full max-w-[460px]">
            <CoordinatePlane
              theme="dark"
              range={range}
              buildings={showBuildings ? BUILDINGS : []}
              selected={point}
              showQuadrants={showQuadrants}
              showNumbers={showNumbers}
              showCoordLabels={false} /* angka koordinat titik terpilih tidak ditulis di grid */
              showBuildingLabels={showNames && range === 5}
              path={walk}
              pathKey={walkKey}
              interactive
              onSelect={select}
            />
          </div>
          {/* Zoom */}
          <div className="mt-3 flex items-center justify-center gap-2" role="group" aria-label="Perbesar atau perkecil grid">
            <button
              type="button"
              onClick={() => changeRange(10)}
              disabled={range === 10}
              aria-label={`Perkecil: tampilkan ${fmtNum(-10)} sampai 10`}
              className={`h-11 w-11 cursor-pointer rounded-full border-2 border-sky-300/60 bg-[#0d1240] text-2xl font-bold text-sky-100 transition hover:bg-[#1a2160] disabled:cursor-not-allowed disabled:opacity-35 ${FOCUS}`}
            >
              −
            </button>
            <span className="min-w-[6.5rem] rounded-full border-2 border-sky-300/40 bg-white/5 px-3 py-1.5 text-center font-bold tabular-nums text-sky-100">
              {fmtNum(-range)} … {range}
            </span>
            <button
              type="button"
              onClick={() => changeRange(5)}
              disabled={range === 5}
              aria-label={`Perbesar: tampilkan ${fmtNum(-5)} sampai 5`}
              className={`h-11 w-11 cursor-pointer rounded-full border-2 border-sky-300/60 bg-[#0d1240] text-2xl font-bold text-sky-100 transition hover:bg-[#1a2160] disabled:cursor-not-allowed disabled:opacity-35 ${FOCUS}`}
            >
              +
            </button>
          </div>
        </NeonFrame>

        {/* Panel kontrol */}
        <div className="space-y-4">
          <section className={GLASS} aria-live="polite">
            <div className="grid gap-2 sm:grid-cols-2">
              <p className="m-0 flex min-h-12 items-center rounded-full border-2 border-indigo-300/50 bg-[#120c3d]/80 px-4 font-bold">
                Koordinat Titik:&nbsp;
                {point ? (
                  <span className="tabular-nums">
                    (<span className="val-x">{fmtNum(x)}</span>, <span className="val-y">{fmtNum(y)}</span>)
                  </span>
                ) : (
                  <span className="text-indigo-300">—</span>
                )}
              </p>
              <p
                className={`m-0 flex min-h-12 items-center rounded-full border-2 px-4 font-bold ${building ? 'border-rose-200/70 bg-gradient-to-r from-rose-500 to-red-600 shadow-[0_0_16px_rgba(244,63,94,.5)]' : 'border-indigo-300/30 bg-white/5 text-indigo-200'}`}
              >
                Detail Objek:&nbsp;<span className="truncate">{building ? building.name : '—'}</span>
              </p>
            </div>

            {point ? (
              <>
                <dl className="m-0 mt-4 grid gap-2 text-sm sm:text-base">
                  <Fact label="Letak">{locationLabel(point)}</Fact>
                  <Fact label={<span className="val-y">Jarak ke sumbu-X</span>}>
                    {distToXAxis(point)} satuan <span className="text-indigo-300">(dilihat dari y, garis oranye)</span>
                  </Fact>
                  <Fact label={<span className="val-x">Jarak ke sumbu-Y</span>}>
                    {distToYAxis(point)} satuan <span className="text-indigo-300">(dilihat dari x, garis biru)</span>
                  </Fact>
                  <Fact label="Dari titik O">{describeOffset(point)}</Fact>
                </dl>
                <button
                  type="button"
                  className={`${PILL} mt-4 bg-gradient-to-r from-sky-500 to-blue-600 shadow-[0_4px_0_#1e3a8a]`}
                  style={GAME_FONT}
                  onClick={() => setWalkKey((k) => k + 1)}
                  disabled={x === 0 && y === 0}
                >
                  👣 Tunjukkan jalannya dari titik O
                </button>
              </>
            ) : (
              <p className="m-0 mt-3 text-indigo-200">Belum ada titik dipilih. Ketuk grid, atau ketik koordinatnya di bawah.</p>
            )}
          </section>

          <details className={`${GLASS} group`}>
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between font-bold">
              ⌨️ Ketik koordinat
              <span className="transition group-open:rotate-180" aria-hidden="true">
                ▾
              </span>
            </summary>
            {/* Isian memakai gaya terang supaya angka mudah dibaca */}
            <div className="mt-3 rounded-2xl bg-white p-3 text-slate-900">
              <CoordinateInput range={range} onSubmit={select} />
            </div>
          </details>

          <fieldset className={`${GLASS} m-0`}>
            <legend className="px-1 text-lg font-bold text-white">Tampilkan</legend>
            <Toggle checked={showBuildings} onChange={setShowBuildings} label="Tampilkan Bangunan" />
            <Toggle checked={showNames} onChange={setShowNames} label="Tampilkan Nama Bangunan" />
            <Toggle checked={showNumbers} onChange={setShowNumbers} label="Tampilkan Angka Sumbu" />
            <Toggle checked={showQuadrants} onChange={setShowQuadrants} label="Tampilkan Label Kuadran" />
            <p className="m-0 mt-1 text-xs text-indigo-200">
              Semua label disembunyikan dulu supaya kamu bisa menebak sendiri. Nyalakan untuk mode belajar.
            </p>
          </fieldset>

          {hasWebGL() && (
            <Link
              to="/kota-3d"
              className={`${PILL} bg-gradient-to-r from-violet-500 to-fuchsia-600 shadow-[0_4px_0_#4c1d95]`}
              style={GAME_FONT}
            >
              🏙️ Eksplorasi Lanjutan: Lihat 3D
            </Link>
          )}
        </div>
      </div>
    </CosmicPage>
  );
}

function Fact({ label, children }) {
  return (
    <div className="grid grid-cols-[8.5rem_1fr] gap-2 rounded-xl bg-white/5 px-3 py-2">
      <dt className="font-bold">{label}</dt>
      <dd className="m-0 text-indigo-50">{children}</dd>
    </div>
  );
}
