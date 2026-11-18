import '@fontsource/fredoka/latin-500.css';
import '@fontsource/fredoka/latin-700.css';
import { useCosmicBody } from '../cosmic/Cosmic.jsx';
import splashArt from '../../assets/splash-art.jpg';

const GAME_FONT = { fontFamily: '"Fredoka", system-ui, sans-serif' };

/** Bintang & simbol matematika yang berkelip samar di latar. */
const SPARKS = [
  { t: '8%', l: '6%', s: '✦', d: '0s' },
  { t: '18%', l: '90%', s: '✧', d: '.8s' },
  { t: '42%', l: '4%', s: '+', d: '1.6s' },
  { t: '55%', l: '94%', s: '×', d: '.4s' },
  { t: '78%', l: '8%', s: '✦', d: '1.2s' },
  { t: '88%', l: '88%', s: '÷', d: '2s' },
];

/** Bingkai sudut oranye seperti panel game. */
function Corner({ className }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute h-7 w-7 border-[#fb923c] drop-shadow-[0_0_6px_rgba(251,146,60,.8)] sm:h-9 sm:w-9 ${className}`}
    />
  );
}

/**
 * Layar Landing / Splash cartes.play.
 * Ilustrasi (rumah 3D, judul, tiga siswa, maskot kompas) memakai gambar desain asli;
 * panel sambutan, tombol, dan footer dibuat dengan kode supaya interaktif dan tajam.
 */
export default function WelcomeScreen({ onStart }) {
  useCosmicBody();
  return (
    <section
      className="relative isolate -mx-4 -mt-4 overflow-hidden bg-[#1a1b55] bg-gradient-to-b from-[#141a4c] via-[#22195c] to-[#3a136b] px-4 pb-6 text-white sm:mx-0 sm:mt-0 sm:rounded-[2rem] sm:shadow-2xl sm:shadow-indigo-950/40"
      style={GAME_FONT}
    >
      {/* cahaya latar */}
      <div className="pointer-events-none absolute -left-24 top-1/3 -z-10 h-72 w-72 rounded-full bg-fuchsia-600/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-10 -z-10 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
      {SPARKS.map((p, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="pointer-events-none absolute -z-10 text-lg text-sky-200/60 motion-safe:animate-pulse"
          style={{ top: p.t, left: p.l, animationDelay: p.d }}
        >
          {p.s}
        </span>
      ))}

      {/* Ilustrasi utama */}
      <h2 className="m-0">
        <img
          src={splashArt}
          alt="cartes.play: rumah 3D di grid koordinat X, Y, Z, tiga siswa SMP, dan maskot kompas"
          width="930"
          height="1118"
          className="mx-auto block h-auto w-full max-w-[480px]"
          style={{
            WebkitMaskImage:
              'linear-gradient(to bottom, #000 82%, transparent), linear-gradient(to right, transparent, #000 5%, #000 95%, transparent)',
            WebkitMaskComposite: 'source-in',
            maskImage:
              'linear-gradient(to bottom, #000 82%, transparent), linear-gradient(to right, transparent, #000 5%, #000 95%, transparent)',
            maskComposite: 'intersect',
          }}
        />
      </h2>

      {/* Panel sambutan */}
      <div className="relative z-[1] mx-auto -mt-10 max-w-[440px] sm:-mt-14">
        <div className="relative rounded-[1.75rem] bg-gradient-to-b from-[#1e3a8a]/95 to-[#172554]/95 p-2 shadow-[0_0_0_3px_#334155,0_0_0_5px_#0ea5e9,0_12px_40px_rgba(14,165,233,.35)]">
          <Corner className="-left-1.5 -top-1.5 rounded-tl-2xl border-l-4 border-t-4" />
          <Corner className="-right-1.5 -top-1.5 rounded-tr-2xl border-r-4 border-t-4" />
          <Corner className="-bottom-1.5 -left-1.5 rounded-bl-2xl border-b-4 border-l-4" />
          <Corner className="-bottom-1.5 -right-1.5 rounded-br-2xl border-b-4 border-r-4" />

          <div className="rounded-[1.35rem] border-2 border-sky-400/40 bg-[#0b1a4a]/80 px-4 pb-5 pt-4 text-center">
            <p className="m-0 text-lg font-bold leading-snug text-sky-50 sm:text-xl">
              <span className="block text-2xl text-amber-300 [text-shadow:0_2px_0_#9a3412] sm:text-3xl">
                Selamat Datang!
              </span>
              Mulai Petualangan untuk Mempelajari Koordinat Cartesius.
            </p>

            <button
              type="button"
              onClick={onStart}
              autoFocus
              className="mt-4 w-full cursor-pointer rounded-2xl border-0 bg-gradient-to-b from-sky-400 via-blue-600 to-blue-800 px-5 py-3.5 text-2xl font-bold uppercase leading-tight tracking-wide text-white [text-shadow:0_2px_0_#1e3a8a,0_0_10px_rgba(186,230,253,.8)] motion-safe:animate-glow focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-amber-300 active:scale-95 sm:text-3xl"
              style={GAME_FONT}
            >
              Mulai Petualangan
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-6 text-center text-sm font-medium leading-relaxed text-indigo-100 sm:text-base">
        <p className="m-0">
          <span aria-hidden="true">🚀</span> Petualangan Matematika Menyenangkan 25
        </p>
        <p className="m-0">Made by SN</p>
      </footer>
    </section>
  );
}
