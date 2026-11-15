import { useState } from 'react';
import { Link } from 'react-router-dom';
import CoordinateInput from '../components/CoordinateInput.jsx';
import CoordinatePlane from '../components/CoordinatePlane.jsx';
import RangeStepper from '../components/RangeStepper.jsx';
import { BUILDINGS } from '../data/buildings.js';
import { describeOffset, distToXAxis, distToYAxis, fmtNum, locationLabel, samePoint } from '../lib/coords.js';
import { hasWebGL } from '../lib/webgl.js';
import styles from './FreePlanePage.module.css';

/** Bidang Bebas: ketuk titik mana saja dan lihat keterangannya. */
export default function FreePlanePage() {
  const [range, setRange] = useState(5);
  const [point, setPoint] = useState(null);
  const [walkKey, setWalkKey] = useState(0);
  const [showBuildings, setShowBuildings] = useState(true);
  const [showQuadrants, setShowQuadrants] = useState(true);

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
    <div className={styles.wrap}>
      <p className={styles.instruction}>Ketuk titik mana saja di bidang koordinat.</p>

      <div className={styles.gridBox}>
        <CoordinatePlane
          range={range}
          buildings={showBuildings ? BUILDINGS : []}
          selected={point}
          showQuadrants={showQuadrants}
          showBuildingLabels={range === 5}
          path={walk}
          pathKey={walkKey}
          interactive
          onSelect={select}
        />
      </div>

      <div className={styles.toolbar}>
        <RangeStepper range={range} onChange={changeRange} />
      </div>

      <section className={`card ${styles.info}`} aria-live="polite">
        {point ? (
          <>
            <p className={styles.point}>
              Titik{' '}
              <strong className="num">
                (<span className="val-x">{fmtNum(x)}</span>, <span className="val-y">{fmtNum(y)}</span>)
              </strong>
              {building && <span className={styles.building}> · {building.name}</span>}
            </p>
            <dl className={styles.facts}>
              <div>
                <dt>Letak</dt>
                <dd>{locationLabel(point)}</dd>
              </div>
              <div>
                <dt className="val-y">Jarak ke sumbu-X</dt>
                <dd>
                  {distToXAxis(point)} satuan <span className="muted">(dilihat dari y, garis oranye)</span>
                </dd>
              </div>
              <div>
                <dt className="val-x">Jarak ke sumbu-Y</dt>
                <dd>
                  {distToYAxis(point)} satuan <span className="muted">(dilihat dari x, garis biru)</span>
                </dd>
              </div>
              <div>
                <dt>Dari titik O</dt>
                <dd>{describeOffset(point)}</dd>
              </div>
            </dl>
            <button
              type="button"
              className="btn btn-block"
              onClick={() => setWalkKey((k) => k + 1)}
              disabled={x === 0 && y === 0}
            >
              Tunjukkan jalannya dari titik O
            </button>
          </>
        ) : (
          <p className="muted">Belum ada titik dipilih.</p>
        )}
      </section>

      <details className={`card ${styles.details}`}>
        <summary>Ketik koordinat</summary>
        <CoordinateInput range={range} onSubmit={select} />
      </details>

      {hasWebGL() && (
        <Link to="/kota-3d" className="btn btn-block">
          Lihat Kota 3D · Eksperimen
        </Link>
      )}

      <fieldset className={`card ${styles.options}`}>
        <legend>Tampilan</legend>
        <label className={styles.check}>
          <input type="checkbox" checked={showBuildings} onChange={(e) => setShowBuildings(e.target.checked)} />
          Tampilkan bangunan
        </label>
        <label className={styles.check}>
          <input type="checkbox" checked={showQuadrants} onChange={(e) => setShowQuadrants(e.target.checked)} />
          Tampilkan label kuadran
        </label>
      </fieldset>
    </div>
  );
}
