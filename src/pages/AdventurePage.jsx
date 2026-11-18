import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import PracticeGame from '../components/adventure/PracticeGame.jsx';
import CoordinatePlane from '../components/CoordinatePlane.jsx';
import MainMenu from '../components/adventure/MainMenu.jsx';
import { CosmicPage } from '../components/cosmic/Cosmic.jsx';
import MateriList from '../components/adventure/MateriList.jsx';
import PlayModeScreen from '../components/adventure/PlayModeScreen.jsx';
import WelcomeScreen from '../components/adventure/WelcomeScreen.jsx';
import CameraControls from '../components/quest/CameraControls.jsx';
import { fmtPoint } from '../lib/coords.js';
import { useTutorContext } from '../lib/tutor.js';
import { hasWebGL } from '../lib/webgl.js';

const QuestScene = lazy(() => import('../three/QuestScene.jsx'));

/*
 * Alur menu utama cartes.play, diatur dengan state (bukan rute):
 *   home → menu → materi → (detail topik)
 *              → latihan → game
 *              → kuis (membuka halaman /latihan)
 * Layar terakhir diingat selama tab browser masih terbuka, supaya kembali dari
 * halaman lain (misalnya modul) tidak mengulang layar sambutan.
 */
const SCREEN_KEY = 'cquest:screen';
const SCREENS = ['home', 'menu', 'materi', 'latihan', 'game'];

function loadScreen() {
  try {
    const raw = JSON.parse(sessionStorage.getItem(SCREEN_KEY) ?? 'null');
    if (raw && SCREENS.includes(raw.screen)) return raw;
  } catch {
    /* sessionStorage bisa diblokir; mulai dari layar sambutan */
  }
  return { screen: 'home', topic: null, difficulty: null };
}

function saveScreen(value) {
  try {
    sessionStorage.setItem(SCREEN_KEY, JSON.stringify(value));
  } catch {
    /* abaikan */
  }
}

const FOCUS = 'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-blue-700';

export default function AdventurePage() {
  const [nav, setNav] = useState(loadScreen);
  const topRef = useRef(null);

  const go = (screen, extra = {}) => setNav((n) => ({ ...n, ...extra, screen }));

  // Konteks untuk Kak Carta. Di layar game, PracticeGame yang mengisinya.
  const topicTitle = TOPICS.find((t) => t.id === nav.topic)?.title;
  useTutorContext(
    nav.screen === 'game'
      ? null
      : {
          screen: { home: 'Layar sambutan', menu: 'Menu utama', materi: 'Materi', latihan: 'Pilih tingkat latihan' }[nav.screen],
          topic: nav.screen === 'materi' ? topicTitle : undefined,
        },
  );

  useEffect(() => {
    saveScreen(nav);
    topRef.current?.scrollIntoView({ block: 'start' });
  }, [nav]);

  let body;
  switch (nav.screen) {
    case 'menu':
      body = <MainMenu onPick={(s) => go(s, { topic: null })} onBack={() => go('home')} />;
      break;
    case 'materi':
      body = <MateriScreen topic={nav.topic} onTopic={(topic) => go('materi', { topic })} onBack={() => go('menu')} />;
      break;
    case 'latihan':
      body = <PlayModeScreen onPick={(difficulty) => go('game', { difficulty })} onBack={() => go('menu')} />;
      break;
    case 'game':
      body = (
        <CosmicPage>
          <PracticeGame difficulty={nav.difficulty ?? 'easy'} onExit={() => go('latihan')} />
        </CosmicPage>
      );
      break;
    default:
      body = <WelcomeScreen onStart={() => go('menu')} />;
  }

  return (
    <div ref={topRef} className="scroll-mt-[calc(var(--header-h)+var(--safe-top))]">
      <div key={`${nav.screen}-${nav.topic ?? ''}`} className="motion-safe:animate-fade-up">
        {body}
      </div>
    </div>
  );
}

/* ---------- 3. Materi ---------- */

const TOPICS = [
  {
    id: '2d',
    title: 'Bidang 2D Kartesius',
    short: 'Sumbu X, sumbu Y, titik O, dan 4 kuadran.',
    emoji: '🗺️',
    points: [
      'Bidang Kartesius dibentuk oleh **sumbu X** (mendatar) dan **sumbu Y** (tegak) yang berpotongan di **titik O (0, 0)**.',
      'Titik ditulis **(x, y)**: x = jarak mendatar dari O, y = jarak tegak dari O.',
      'Kanan dan atas bernilai **positif**. Kiri dan bawah bernilai **negatif**.',
      'Kedua sumbu membagi bidang menjadi 4 kuadran: I (+, +), II (−, +), III (−, −), IV (+, −).',
    ],
    links: [
      { to: '/belajar/m1', label: 'Modul: Kenalan Bidang Koordinat' },
      { to: '/belajar/m3', label: 'Modul: Kuadran & Tanda Negatif' },
    ],
  },
  {
    id: '3d',
    title: 'Ruang 3D & Sumbu Z',
    short: 'Tambah sumbu ketiga untuk ketinggian.',
    emoji: '🏙️',
    points: [
      'Di ruang 3D ada sumbu ketiga, yaitu **sumbu Z**, untuk **ketinggian** (naik/turun).',
      'Titik ditulis **(x, y, z)**. x = kanan/kiri, y = belakang/depan, z = tinggi.',
      'Kalau **z = 0**, titiknya menempel di lantai (bidang XY).',
      'Makin besar z, makin tinggi rumahnya melayang.',
    ],
    links: [{ to: '/kota-3d', label: 'Jelajahi Kota 3D' }],
  },
  {
    id: 'plot',
    title: 'Cara Plotting Titik',
    short: 'Mendatar dulu, baru naik/turun.',
    emoji: '📍',
    points: [
      'Mulai dari **titik O (0, 0)**.',
      'Langkah 1: jalan **mendatar** sejauh x (kanan kalau positif, kiri kalau negatif).',
      'Langkah 2: jalan **tegak** sejauh y (atas kalau positif, bawah kalau negatif).',
      'Di ruang 3D, tambah langkah 3: **naik** sejauh z.',
      'Coba ketuk titik mana saja di grid di bawah ini!',
    ],
    links: [{ to: '/belajar/m2', label: 'Modul: Membaca & Memplot Titik' }],
  },
];

function MateriScreen({ topic, onTopic, onBack }) {
  const current = TOPICS.find((t) => t.id === topic);
  if (current)
    return (
      <CosmicPage>
        <TopicCard topic={current} onBack={() => onTopic(null)} />
      </CosmicPage>
    );
  return <MateriList topics={TOPICS} onTopic={onTopic} onBack={onBack} />;
}

/** Teks dengan **tebal** sederhana. */
function Bold({ text }) {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : part));
}

function TopicCard({ topic, onBack }) {
  return (
    <div className="space-y-4">
      <ScreenHeader kicker={`${topic.emoji} Materi`} title={topic.title} onBack={onBack} backLabel="Daftar topik" />
      <div className="grid gap-4 md:grid-cols-[1fr_1fr] md:items-start">
        <section className="rounded-3xl border-2 border-blue-200 bg-white/95 p-5 shadow-lg shadow-blue-900/10">
          <ul className="m-0 space-y-3 p-0">
            {topic.points.map((p, i) => (
              <li key={i} className="flex list-none gap-3 text-slate-800">
                <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">
                  {i + 1}
                </span>
                <span>
                  <Bold text={p} />
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            {topic.links.map((l) => (
              <Link key={l.to} to={l.to} className={`rounded-full bg-blue-700 px-4 py-2 text-sm font-bold text-white no-underline ${FOCUS}`}>
                {l.label} ➜
              </Link>
            ))}
          </div>
        </section>
        <section aria-label="Contoh gambar">
          <TopicPreview id={topic.id} />
        </section>
      </div>
    </div>
  );
}

function TopicPreview({ id }) {
  const [picked, setPicked] = useState([3, 2]);
  const sceneRef = useRef(null);

  if (id === '3d') {
    if (!hasWebGL()) return <p className="card">Browser ini tidak mendukung grafik 3D.</p>;
    return (
      <div className="space-y-2">
        <div className="relative aspect-square w-full overflow-hidden rounded-3xl border-2 border-indigo-300/40 bg-[#0b1437] shadow-xl">
          <Suspense fallback={<p className="grid h-full place-items-center text-white">Memuat ruang 3D…</p>}>
            <QuestScene ref={sceneRef} houses={[{ id: 'h', at: [2, 3, 2] }]} showGuides showNumbers range={5} zMax={5} />
          </Suspense>
          <CameraControls sceneRef={sceneRef} />
        </div>
        <p className="m-0 text-center text-sm font-bold text-indigo-100">
          Contoh: rumah di (<span className="val-x">2</span>, <span className="val-y">3</span>,{' '}
          <span className="val-z">2</span>). Geser untuk memutar kamera.
        </p>
      </div>
    );
  }

  const plot = id === 'plot';
  return (
    <div className="space-y-2">
      <div className="rounded-3xl border-2 border-blue-200 bg-white p-2 shadow-lg shadow-blue-900/10">
        <CoordinatePlane
          range={5}
          buildings={[{ id: 'rumah', type: 'house', name: 'Rumah', at: plot ? picked : [3, 2] }]}
          selected={plot ? picked : [3, 2]}
          showGuides
          showQuadrants={!plot}
          interactive={plot}
          onSelect={setPicked}
        />
      </div>
      <p className="m-0 text-center text-sm font-bold text-indigo-100">
        {plot ? `Titik yang dipilih: ${fmtPoint(picked)}` : 'Contoh: rumah di (3, 2), di Kuadran I.'}
      </p>
    </div>
  );
}


/* ---------- Bersama ---------- */

function ScreenHeader({ kicker, title, onBack, backLabel }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onBack}
        aria-label={`Kembali ke ${backLabel}`}
        className={`flex h-12 w-12 flex-none cursor-pointer items-center justify-center rounded-2xl border-2 border-blue-200 bg-white text-xl font-black text-blue-900 shadow-md transition hover:border-blue-400 ${FOCUS}`}
      >
        ←
      </button>
      <div className="min-w-0">
        <p className="m-0 text-xs font-extrabold uppercase tracking-[0.18em] text-sky-300">{kicker}</p>
        <h2 className="m-0 text-2xl font-black leading-tight text-white">{title}</h2>
      </div>
    </div>
  );
}
