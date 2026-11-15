// Ikon garis sederhana (viewBox 24×24).
const PATHS = {
  m1: 'M12 3v4M12 17v4M3 12h4M17 12h4M12 8a4 4 0 110 8 4 4 0 010-8z',
  m2: 'M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM12 13s-3-3-3-5a3 3 0 016 0c0 2-3 5-3 5z',
  m3: 'M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z',
  m4: 'M4 20L20 4M7 17l1.5 1.5M10 14l1.5 1.5M13 11l1.5 1.5M16 8l1.5 1.5',
  m5: 'M5 19h10V7M12 4l3 3 3-3',
  m6: 'M4 8h16M4 16h16',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  star: 'M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6-4.5-4.2 6.1-.7z',
};

export default function Icon({ name, className = 'h-6 w-6', strokeWidth = 2 }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d={PATHS[name] ?? PATHS.m1}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
