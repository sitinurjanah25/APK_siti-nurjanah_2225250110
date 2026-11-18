import { memo, useCallback, useId, useMemo, useRef } from 'react';
import { describeOffset, fmtNum, fmtPoint, ROMAN, speakPoint } from '../lib/coords.js';
import {
  clientToSvg,
  fromSvg,
  gridViewBox,
  pxToUnits,
  snapToGrid,
  stepPoint,
  ticks,
  toSvg,
  useElementWidth,
} from '../lib/grid.js';
import { sfx } from '../lib/sfx.js';
import BuildingSymbols from './BuildingSymbols.jsx';
import styles from './CoordinatePlane.module.css';

/** Sumbu, angka, panah, label kuadran. `u(px)` mengubah piksel ke unit SVG. */
function AxesBase({ range, u, highlight, showQuadrants, showNumbers = true }) {
  const end = range + 0.85;
  const arrowLen = u(12);
  const arrowHalf = u(6);
  const step = range > 5 ? 2 : 1;
  // Ukuran angka ikut mengecil di layar HP yang sempit (maks. 0,42 × jarak antar-angka)
  // supaya angka tidak berhimpitan satu sama lain maupun dengan "O".
  const numSize = Math.min(u(13), 0.42 * step);
  const nums = showNumbers ? ticks(range, step).filter((n) => n !== 0) : [];
  const dimX = highlight === 'y' ? styles.dim : '';
  const dimY = highlight === 'x' ? styles.dim : '';
  const q = range / 2;

  return (
    <g aria-hidden="true">
      {showQuadrants && (
        <g className={styles.quadrant} fontSize={u(22)}>
          <text x={q} y={-q}>
            {ROMAN[1]}
          </text>
          <text x={-q} y={-q}>
            {ROMAN[2]}
          </text>
          <text x={-q} y={q}>
            {ROMAN[3]}
          </text>
          <text x={q} y={q}>
            {ROMAN[4]}
          </text>
        </g>
      )}

      <g className={dimX}>
        <line x1={-end} y1={0} x2={end - arrowLen} y2={0} className={styles.axisX} />
        <polygon
          points={`${end},0 ${end - arrowLen},${-arrowHalf} ${end - arrowLen},${arrowHalf}`}
          className={styles.arrowX}
        />
        <text x={end - u(2)} y={-u(9)} textAnchor="end" fontSize={u(15)} className={styles.labelX}>
          X
        </text>
        {nums.map((n) => (
          <text
            key={n}
            x={n < 0 ? n - numSize * 0.22 : n}
            y={u(5) + numSize}
            textAnchor="middle"
            fontSize={numSize}
            className={`${styles.halo} ${styles.numX}`}
          >
            {fmtNum(n)}
          </text>
        ))}
      </g>

      <g className={dimY}>
        <line x1={0} y1={end} x2={0} y2={-end + arrowLen} className={styles.axisY} />
        <polygon
          points={`0,${-end} ${-arrowHalf},${-end + arrowLen} ${arrowHalf},${-end + arrowLen}`}
          className={styles.arrowY}
        />
        <text x={u(9)} y={-end + u(12)} fontSize={u(15)} className={styles.labelY}>
          Y
        </text>
        {nums.map((n) => (
          <text
            key={n}
            x={-u(6)}
            y={-n + numSize * 0.35}
            textAnchor="end"
            fontSize={numSize}
            className={`${styles.halo} ${styles.numY}`}
          >
            {fmtNum(n)}
          </text>
        ))}
      </g>

      {/* Titik asal O di kiri-atas pusat, supaya tidak menempel dengan angka −1 di sumbu X dan Y */}
      <text x={-u(5)} y={-u(5)} textAnchor="end" fontSize={numSize} className={`${styles.halo} ${styles.origin}`}>
        O
      </text>
    </g>
  );
}
const Axes = memo(AxesBase);

function BuildingMarker({ building, prefix, range, u, showLabel, showCoords = true }) {
  const [x] = building.at;
  const [sx, sy] = toSvg(building.at);
  const size = u(24);
  const nearRight = x >= range - 2;
  return (
    <g role="img" aria-label={showCoords ? `${building.name}, koordinat ${speakPoint(building.at)}` : building.name}>
      <use href={`#${prefix}-${building.type}`} x={sx - size / 2} y={sy - size / 2} width={size} height={size} />
      {showLabel && (
        <text
          x={nearRight ? sx - size / 2 - u(3) : sx + size / 2 + u(3)}
          y={sy + u(4)}
          textAnchor={nearRight ? 'end' : 'start'}
          fontSize={u(11)}
          className={`${styles.halo} ${styles.buildingLabel}`}
          aria-hidden="true"
        >
          {building.name}
        </text>
      )}
    </g>
  );
}

function GridLinesBase({ range }) {
  const { minor, major } = useMemo(() => {
    let minorD = '';
    let majorD = '';
    for (const i of ticks(range)) {
      if (i === 0) continue;
      const d = `M${i} ${-range}V${range}M${-range} ${i}H${range}`;
      if (i % 5 === 0) majorD += d;
      else minorD += d;
    }
    return { minor: minorD, major: majorD };
  }, [range]);

  return (
    <g aria-hidden="true">
      <rect x={-range} y={-range} width={range * 2} height={range * 2} className={styles.paper} />
      {minor && <path d={minor} className={styles.gridMinor} />}
      {major && <path d={major} className={styles.gridMajor} />}
    </g>
  );
}
const GridLines = memo(GridLinesBase);

/** Garis bantu dari titik terpilih ke kedua sumbu. */
function Guides({ point, range, u, highlight, showLabels = true }) {
  const [x, y] = point;
  const [sx, sy] = toSvg(point);
  const fontSize = u(12);
  const foot = u(7);
  const nearRight = x > 0 && x >= range - 3;

  return (
    <g aria-hidden="true">
      {x !== 0 && (
        <g className={highlight === 'y' ? styles.dim : ''}>
          <line x1={sx} y1={sy} x2={0} y2={sy} className={styles.guideX} />
          <rect x={-foot / 2} y={sy - foot / 2} width={foot} height={foot} className={styles.footX} />
          {showLabels && <text
            x={sx / 2}
            y={sy + (y > range - 1 ? u(18) : -u(7))}
            textAnchor="middle"
            fontSize={fontSize}
            className={`${styles.halo} ${styles.guideLabelX}`}
          >
            {describeOffset([x, 0])}
          </text>}
        </g>
      )}
      {y !== 0 && (
        <g className={highlight === 'x' ? styles.dim : ''}>
          <line x1={sx} y1={sy} x2={sx} y2={0} className={styles.guideY} />
          <rect x={sx - foot / 2} y={-foot / 2} width={foot} height={foot} className={styles.footY} />
          {showLabels && <text
            x={nearRight ? sx - u(8) : sx + u(8)}
            y={sy / 2 + u(4)}
            textAnchor={nearRight ? 'end' : 'start'}
            fontSize={fontSize}
            className={`${styles.halo} ${styles.guideLabelY}`}
          >
            {describeOffset([0, y])}
          </text>}
        </g>
      )}
    </g>
  );
}

/** Titik-titik tambahan (misalnya jawaban yang sudah ditemukan). */
function Marks({ points, range, u, showLabels = true }) {
  return (
    <g aria-hidden="true">
      {points.map((p) => {
        const [sx, sy] = toSvg(p);
        const nearRight = p[0] >= range - 2;
        return (
          <g key={`${p[0]},${p[1]}`}>
            <circle cx={sx} cy={sy} r={u(6)} className={styles.mark} />
            {showLabels && <text
              x={nearRight ? sx - u(9) : sx + u(9)}
              y={sy + u(18)}
              textAnchor={nearRight ? 'end' : 'start'}
              fontSize={u(12)}
              className={`${styles.halo} ${styles.markLabel}`}
            >
              {fmtPoint(p)}
            </text>}
          </g>
        );
      })}
    </g>
  );
}

function SelectedPoint({ point, range, u, showLabel = true }) {
  const [x, y] = point;
  const [sx, sy] = toSvg(point);
  const nearRight = x >= range - 2;
  const nearTop = y >= range - 1;
  return (
    <g aria-hidden="true">
      {/* Lingkaran samar = area sentuh jari (± 44 px) */}
      <circle cx={sx} cy={sy} r={u(22)} className={styles.pointRing} />
      <circle cx={sx} cy={sy} r={u(9)} className={styles.point} />
      {showLabel && <text
        x={nearRight ? sx - u(10) : sx + u(10)}
        y={nearTop ? sy + u(22) : sy - u(10)}
        textAnchor={nearRight ? 'end' : 'start'}
        fontSize={u(14)}
        className={`${styles.halo} ${styles.pointLabel}`}
      >
        {fmtPoint(point)}
      </text>}
    </g>
  );
}

const WALK_SEGMENT_SECONDS = 0.8;

/** Jejak jalan beranimasi (mendatar biru, tegak oranye). */
function WalkPath({ path, u }) {
  const pts = path.filter((p, i) => i === 0 || p[0] !== path[i - 1][0] || p[1] !== path[i - 1][1]);
  if (pts.length < 2) return null;

  const segments = pts.slice(1).map((p, i) => {
    const prev = pts[i];
    const horizontal = prev[1] === p[1];
    const [x1, y1] = toSvg(prev);
    const [x2, y2] = toSvg(p);
    return { d: `M${x1} ${y1}L${x2} ${y2}`, horizontal, key: i };
  });
  const [ex, ey] = toSvg(pts[pts.length - 1]);

  return (
    <g aria-hidden="true">
      {segments.map((s) => (
        <path
          key={s.key}
          d={s.d}
          pathLength="1"
          className={`${styles.walk} ${s.horizontal ? styles.walkX : styles.walkY}`}
          style={{ animationDelay: `${s.key * WALK_SEGMENT_SECONDS}s` }}
        />
      ))}
      <circle
        cx={ex}
        cy={ey}
        r={u(9)}
        className={styles.walker}
        style={{ animationDelay: `${segments.length * WALK_SEGMENT_SECONDS}s` }}
      />
    </g>
  );
}

/**
 * Jarak maksimal dari titik grid supaya ketukan dianggap mengenai titik itu.
 * Minimal 32 px (ujung jari ± 44 px), dan minimal 0,75 kotak supaya di HP
 * ketukan di mana pun di dalam grid selalu "menempel" ke titik terdekat.
 */
const SNAP_PX = 32;
const SNAP_MIN_UNITS = 0.75;

const ARROW_KEYS = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, 1],
  ArrowDown: [0, -1],
};

export default function CoordinatePlane({
  range = 5,
  buildings = [],
  marks = [],
  selected = null,
  showGuides = true,
  showQuadrants = true,
  showBuildingLabels = true,
  highlight = null,
  path = null,
  pathKey = 0,
  interactive = false,
  onSelect,
  label = 'Bidang koordinat Kartesius',
  showNumbers = true,
  showCoordLabels = true,
  theme = 'light', // 'light' | 'dark' (neon, untuk layar bergaya kosmik)
}) {
  const svgRef = useRef(null);
  const width = useElementWidth(svgRef);
  const prefix = `bkk${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const u = useCallback((px) => pxToUnits(px, width, range), [width, range]);

  const handleClick = (e) => {
    if (!interactive || !onSelect) return;
    const rect = svgRef.current.getBoundingClientRect();
    const svgPoint = clientToSvg(rect, e.clientX, e.clientY, range);
    if (!svgPoint) return;
    const p = snapToGrid(fromSvg(svgPoint), range, Math.max(u(SNAP_PX), SNAP_MIN_UNITS));
    if (!p) return;
    sfx.tap();
    onSelect(p);
  };

  const handleKeyDown = (e) => {
    if (!interactive || !onSelect) return;
    const delta = ARROW_KEYS[e.key];
    if (delta) {
      e.preventDefault();
      onSelect(stepPoint(selected ?? [0, 0], delta, range));
    }
  };

  const ariaLabel = [
    label,
    selected ? (showCoordLabels ? `Titik dipilih: ${speakPoint(selected)}` : 'Titik sudah dipilih') : 'Belum ada titik dipilih',
    interactive ? 'Ketuk titik, atau pakai tombol panah untuk memindahkan titik' : '',
  ]
    .filter(Boolean)
    .join('. ');

  return (
    <svg
      ref={svgRef}
      viewBox={gridViewBox(range)}
      className={`${styles.svg} ${interactive ? styles.interactive : ''} ${theme === 'dark' ? styles.dark : ''}`}
      role={interactive ? 'application' : 'img'}
      aria-label={ariaLabel}
      tabIndex={interactive ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      data-selected={selected && showCoordLabels ? fmtPoint(selected) : undefined}
    >
      <BuildingSymbols prefix={prefix} />
      <GridLines range={range} />
      <Axes range={range} u={u} highlight={highlight} showQuadrants={showQuadrants} showNumbers={showNumbers} />
      {path && <WalkPath key={pathKey} path={path} u={u} />}
      {selected && showGuides && <Guides point={selected} range={range} u={u} highlight={highlight} showLabels={showCoordLabels} />}
      <g>
        {buildings
          .filter((b) => Math.abs(b.at[0]) <= range && Math.abs(b.at[1]) <= range)
          .map((b) => (
            <BuildingMarker
              key={b.id}
              building={b}
              prefix={prefix}
              range={range}
              u={u}
              showLabel={showBuildingLabels}
              showCoords={showCoordLabels}
            />
          ))}
      </g>
      {marks.length > 0 && <Marks points={marks} range={range} u={u} showLabels={showCoordLabels} />}
      {selected && <SelectedPoint point={selected} range={range} u={u} showLabel={showCoordLabels} />}
    </svg>
  );
}
