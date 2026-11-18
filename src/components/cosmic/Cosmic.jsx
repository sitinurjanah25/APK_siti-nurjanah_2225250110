import '@fontsource/fredoka/latin-500.css';
import '@fontsource/fredoka/latin-700.css';
import { useEffect } from 'react';

/** Komponen bersama untuk layar bergaya kosmik arcade (latar, judul bercahaya). */

export const GAME_FONT = { fontFamily: '"Fredoka", system-ui, sans-serif' };
export const FOCUS =
  'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-amber-300';

const STARS = Array.from({ length: 24 }, (_, i) => ({
  top: `${(i * 41 + 7) % 100}%`,
  left: `${(i * 59 + 13) % 100}%`,
  size: i % 4 === 0 ? 3 : 2,
  delay: `${(i % 7) * 0.45}s`,
}));

/** Selama layar kosmik terbuka, latar seluruh halaman & header ikut gelap (tidak ada area putih). */
export function useCosmicBody() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('cosmic-body');
    return () => root.classList.remove('cosmic-body');
  }, []);
}

/** Halaman penuh dengan gradasi ungu-biru dan bintang berkelip. */
export function CosmicPage({ children, className = '' }) {
  useCosmicBody();
  return (
    <section
      className={`cosmic relative isolate -mx-4 -mt-4 min-h-[70vh] overflow-hidden [overflow:clip] bg-[#1c1450] bg-gradient-to-b from-[#1b1550] via-[#21155a] to-[#3a1470] px-4 pb-10 pt-4 text-white sm:mx-0 sm:mt-0 sm:rounded-[2rem] sm:px-8 sm:shadow-2xl sm:shadow-indigo-950/40 ${className}`}
      style={GAME_FONT}
    >
      {STARS.map((s, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="pointer-events-none absolute -z-10 rounded-full bg-sky-200/60 motion-safe:animate-pulse"
          style={{ top: s.top, left: s.left, width: s.size, height: s.size, animationDelay: s.delay }}
        />
      ))}
      <div className="pointer-events-none absolute -left-24 bottom-0 -z-10 h-72 w-72 rounded-full bg-fuchsia-600/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-24 -z-10 h-72 w-72 rounded-full bg-indigo-500/25 blur-3xl" />
      {children}
    </section>
  );
}

const OUTLINE = (c, depth) =>
  [
    `3px 0 ${c}`,
    `-3px 0 ${c}`,
    `0 3px ${c}`,
    `0 -3px ${c}`,
    `2px 2px ${c}`,
    `-2px -2px ${c}`,
    `2px -2px ${c}`,
    `-2px 2px ${c}`,
    `0 6px 0 ${depth}`,
    '0 0 26px rgba(56,189,248,.75)',
  ].join(',');

/** Judul banner biru muda dengan garis tepi bercahaya. */
export function GlowTitle({ children, className = '' }) {
  return (
    <h2
      className={`m-0 text-center font-bold leading-tight tracking-tight text-[#d6f1ff] ${className}`}
      style={{ textShadow: OUTLINE('#2563eb', '#1e1b4b') }}
    >
      {children}
    </h2>
  );
}

/** Tombol kecil bergaya HUD. */
export function HudButton({ children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-xl border-0 bg-transparent px-2 font-bold text-sky-100 transition hover:bg-white/10 active:scale-95 ${FOCUS} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

/** Panel dengan bingkai neon sci-fi (sudut biru di kiri, ungu di kanan). */
export function NeonFrame({ children, className = '', as: Tag = 'section', ...props }) {
  const corner = 'pointer-events-none absolute h-10 w-10';
  return (
    <Tag
      className={`relative rounded-[1.75rem] border-2 border-sky-400/70 bg-[#0b1033]/85 p-4 shadow-[0_0_0_4px_rgba(56,189,248,.15),0_0_36px_rgba(56,189,248,.35),0_0_60px_rgba(168,85,247,.25),inset_0_0_30px_rgba(59,130,246,.18)] backdrop-blur-sm sm:p-6 ${className}`}
      {...props}
    >
      <span aria-hidden="true" className={`${corner} -left-1 -top-1 rounded-tl-[1.75rem] border-l-4 border-t-4 border-sky-300 shadow-[-4px_-4px_14px_-4px_rgba(56,189,248,.9)]`} />
      <span aria-hidden="true" className={`${corner} -right-1 -top-1 rounded-tr-[1.75rem] border-r-4 border-t-4 border-fuchsia-400 shadow-[4px_-4px_14px_-4px_rgba(232,121,249,.9)]`} />
      <span aria-hidden="true" className={`${corner} -bottom-1 -left-1 rounded-bl-[1.75rem] border-b-4 border-l-4 border-sky-300 shadow-[-4px_4px_14px_-4px_rgba(56,189,248,.9)]`} />
      <span aria-hidden="true" className={`${corner} -bottom-1 -right-1 rounded-br-[1.75rem] border-b-4 border-r-4 border-fuchsia-400 shadow-[4px_4px_14px_-4px_rgba(232,121,249,.9)]`} />
      {children}
    </Tag>
  );
}

/** Sakelar ON/OFF bergaya game. */
export function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center gap-3 font-bold text-white">
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span
        aria-hidden="true"
        className="relative flex h-9 w-[4.5rem] flex-none items-center rounded-full border-2 border-white/30 bg-slate-600/70 px-2 text-xs font-bold tracking-wider text-white/80 transition peer-checked:border-sky-200 peer-checked:bg-gradient-to-r peer-checked:from-sky-500 peer-checked:to-blue-600 peer-checked:shadow-[0_0_14px_rgba(56,189,248,.7)] peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-amber-300"
      >
        <span className={checked ? 'ml-0.5' : 'ml-auto mr-0.5'}>{checked ? 'ON' : 'OFF'}</span>
        <span
          className={`absolute top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-white shadow transition-all ${checked ? 'left-[calc(100%-1.75rem)]' : 'left-1'}`}
        />
      </span>
      {label}
    </label>
  );
}
