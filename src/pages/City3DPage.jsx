import { lazy, Suspense, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { BUILDINGS } from '../data/buildings.js';
import { describeOffset, distToXAxis, distToYAxis, fmtNum, locationLabel } from '../lib/coords.js';
import { hasWebGL } from '../lib/webgl.js';
import styles from './City3DPage.module.css';

const City3D = lazy(() => import('../three/City3D.jsx'));

export default function City3DPage() {
  const [selectedId, setSelectedId] = useState(null);
  const [view, setView] = useState('tilt');
  const cityRef = useRef(null);
  const supported = hasWebGL();

  const changeView = (v) => {
    setView(v);
    cityRef.current?.flyTo(v);
  };

  const selected = BUILDINGS.find((b) => b.id === selectedId);

  if (!supported) {
    return (
      <section className="card">
        <h2>Kota 3D belum bisa dibuka</h2>
        <p>HP atau browser ini tidak mendukung grafik 3D. Semua materi tetap bisa dipelajari di grid 2D.</p>
        <Link to="/bidang-bebas" className="btn btn-primary">
          Ke Bidang Bebas
        </Link>
      </section>
    );
  }

  return (
    <div className={styles.wrap}>
      <p className={styles.badge}>Eksperimen</p>
      <ul className={styles.instruction}>
        <li>
          <strong>Satu jari</strong>: putar kota ke segala arah
        </li>
        <li>
          <strong>Dua jari</strong>: cubit untuk zoom, geser untuk memindah kota
        </li>
        <li>Di laptop: klik kiri = putar, klik kanan = geser, roda mouse = zoom</li>
        <li>
          <strong>Ketuk bangunan</strong> untuk melihat koordinatnya
        </li>
      </ul>

      <div className={styles.stage}>
        <Suspense fallback={<p className={styles.loading}>Memuat kota…</p>}>
          <City3D
            ref={cityRef}
            buildings={BUILDINGS}
            selectedId={selectedId}
            onSelectBuilding={setSelectedId}
          />
        </Suspense>
        <div className={styles.zoom} role="group" aria-label="Zoom kota 3D">
          <button
            type="button"
            className={styles.zoomBtn}
            onClick={() => cityRef.current?.zoom(0.75)}
            aria-label="Perbesar (mendekat)"
          >
            +
          </button>
          <button
            type="button"
            className={styles.zoomBtn}
            onClick={() => cityRef.current?.zoom(1.33)}
            aria-label="Perkecil (menjauh)"
          >
            −
          </button>
        </div>
      </div>

      <div className={styles.views} role="group" aria-label="Arah pandang">
        <button type="button" className="btn" aria-pressed={view === 'tilt'} onClick={() => changeView('tilt')}>
          Lihat miring
        </button>
        <button type="button" className="btn" aria-pressed={view === 'top'} onClick={() => changeView('top')}>
          Lihat dari atas
        </button>
        <button type="button" className="btn" onClick={() => changeView('tilt')}>
          Atur ulang
        </button>
      </div>

      <section className="card" aria-live="polite">
        {selected ? (
          <>
            <p className={styles.name}>
              {selected.name}{' '}
              <strong className="num">
                (<span className="val-x">{fmtNum(selected.at[0])}</span>,{' '}
                <span className="val-y">{fmtNum(selected.at[1])}</span>)
              </strong>
            </p>
            <ul className={styles.facts}>
              <li>{locationLabel(selected.at)}</li>
              <li>
                <span className="val-y">Jarak ke sumbu-X:</span> {distToXAxis(selected.at)} satuan
              </li>
              <li>
                <span className="val-x">Jarak ke sumbu-Y:</span> {distToYAxis(selected.at)} satuan
              </li>
              <li>Dari Alun-alun: {describeOffset(selected.at)}</li>
            </ul>
          </>
        ) : (
          <p className="muted">Belum ada bangunan dipilih.</p>
        )}
      </section>

      <details className="card">
        <summary className={styles.summary}>Daftar bangunan</summary>
        <ul className={styles.list}>
          {BUILDINGS.map((b) => (
            <li key={b.id}>
              <button type="button" className={styles.listBtn} onClick={() => setSelectedId(b.id)}>
                {b.name}{' '}
                <span className="num">
                  ({fmtNum(b.at[0])}, {fmtNum(b.at[1])})
                </span>
              </button>
            </li>
          ))}
        </ul>
      </details>

      <Link to="/bidang-bebas" className="btn btn-block">
        ← Kembali ke Peta 2D
      </Link>
    </div>
  );
}
