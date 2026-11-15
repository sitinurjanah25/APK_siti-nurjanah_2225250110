// Ikon bangunan untuk peta 2D, didefinisikan sekali sebagai <symbol>.

const ICON_PATHS = {
  alun: 'M12 4.5l2 3v9.5h-4V7.5z M8 19h8',
  hospital: 'M12 7v10 M7 12h10',
  school: 'M6 18v-7l6-4 6 4v7z M10.5 18v-3.5h3V18 M12 7V4.5h3',
  police: 'M12 5l6 2v5c0 3.5-2.6 6-6 7-3.4-1-6-3.5-6-7V7z M12 9.5v5',
  library: 'M5.5 7.5c2.2-1 4.3-1 6.5 0V18c-2.2-1-4.3-1-6.5 0z M12 7.5c2.2-1 4.3-1 6.5 0V18c-2.2-1-4.3-1-6.5 0z',
  terminal: 'M7.5 6h9a1.5 1.5 0 011.5 1.5V16H6V7.5A1.5 1.5 0 017.5 6z M6 12h12 M8.5 16v2 M15.5 16v2',
  mall: 'M6.5 9h11l-1 10h-9z M9.5 9V7.5a2.5 2.5 0 015 0V9',
  gas: 'M6.5 19V6h7v13 M6.5 10.5h7 M13.5 9l3 2v5a1 1 0 002 0V9.5l-2-2',
  bank: 'M5 10l7-4 7 4z M7.5 10v7 M10.5 10v7 M13.5 10v7 M16.5 10v7 M5 18h14',
  park: 'M12 19v-5 M12 5a4 4 0 014 4 3.5 3.5 0 01-4 5 3.5 3.5 0 01-4-5 4 4 0 014-4z',
  mosque: 'M5 18h14 M7 18v-5a5 5 0 0110 0v5 M12 8V5 M10.5 18v-3h3v3',
  market:
    'M5 9.5L6.5 6h11L19 9.5z M5 9.5a2.3 2.3 0 004.7 0 2.3 2.3 0 004.6 0 2.3 2.3 0 004.7 0 M6.5 11.5V18h11v-6.5',
  house: 'M4.5 11.5L12 5l7.5 6.5 M7 10v8.5h10V10 M10.5 18.5V14h3v4.5',
};

export const BUILDING_TYPES = Object.keys(ICON_PATHS);

const TILE_COLORS = {
  alun: '#d3d9e2',
  hospital: '#efc4ca',
  school: '#e8d79c',
  police: '#c3ccd8',
  library: '#d2e0b0',
  terminal: '#cfd3db',
  mall: '#d8cdef',
  gas: '#c3dfbf',
  bank: '#ddcbe6',
  park: '#b7dcbf',
  mosque: '#b2dacb',
  market: '#e3d1b6',
  house: '#fdba74',
};

function BuildingTile({ type }) {
  return (
    <>
      <rect
        x="1.5"
        y="1.5"
        width="21"
        height="21"
        rx="5"
        fill={TILE_COLORS[type] ?? TILE_COLORS.alun}
        stroke="#475569"
        strokeWidth="1.5"
      />
      <path
        d={ICON_PATHS[type] ?? ICON_PATHS.alun}
        fill="none"
        stroke="#1e293b"
        strokeWidth={type === 'hospital' ? 3 : 1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  );
}

/** <defs> berisi satu <symbol> per jenis bangunan, id = `${prefix}-${type}`. */
export default function BuildingSymbols({ prefix }) {
  return (
    <defs>
      {BUILDING_TYPES.map((type) => (
        <symbol key={type} id={`${prefix}-${type}`} viewBox="0 0 24 24">
          <BuildingTile type={type} />
        </symbol>
      ))}
    </defs>
  );
}
