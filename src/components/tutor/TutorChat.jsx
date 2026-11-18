import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { askTutor, hintLevelFor, tutorReady, useTutorSnapshot } from '../../lib/tutor.js';

const GREETING = {
  role: 'assistant',
  content:
    'Hai! Aku **Kak Carta** 👋 Aku tidak akan langsung kasih jawaban, tapi aku bantu kamu berpikir langkah demi langkah. Kamu lagi bingung di bagian mana?',
};

/** Pertanyaan cepat. Disusun mengikuti tahap RMT: orientasi → konsep → langkah → refleksi. */
const QUICK = [
  { label: '🤔 Bingung mulai dari mana', text: 'Aku bingung harus mulai dari mana.' },
  { label: '📐 Ingatkan konsepnya', text: 'Tolong ingatkan konsep yang dipakai di soal ini.' },
  { label: '👣 Langkah berikutnya?', text: 'Apa langkah berikutnya yang harus aku lakukan?' },
  { label: '✅ Cek cara berpikirku', text: 'Aku mau cek apakah cara berpikirku sudah benar.' },
];

const SCREEN_BY_PATH = [
  ['/quest', 'Quest level'],
  ['/latihan', 'Kuis'],
  ['/belajar', 'Modul belajar'],
  ['/misi', 'Misi Bangun Kota'],
  ['/bidang-bebas', 'Bidang bebas 2D'],
  ['/kota-3d', 'Kota 3D'],
];

function Bold({ text }) {
  return text.split(/\*\*(.+?)\*\*/g).map((p, i) => (i % 2 ? <strong key={i}>{p}</strong> : p));
}

/** Tombol mengambang + panel chat Asisten Belajar. */
export default function TutorChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([GREETING]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [help, setHelp] = useState({ key: '', count: 0 });
  const ctx = useTutorSnapshot();
  const { pathname } = useLocation();
  const listRef = useRef(null);
  const abortRef = useRef(null);

  // Jumlah permintaan bantuan dihitung per soal.
  const taskKey = ctx.taskId ?? pathname;
  const helpCount = help.key === taskKey ? help.count : 0;

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy, open]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const send = async (text) => {
    const content = text.trim();
    if (!content || busy) return;
    const next = [...messages, { role: 'user', content }];
    setMessages(next);
    setDraft('');
    setError(null);
    const count = helpCount + 1;
    setHelp({ key: taskKey, count });

    if (!tutorReady()) {
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: 'Asisten belum aktif: backend AI belum dipasang oleh pengembang. Coba lagi nanti ya!' },
      ]);
      return;
    }

    const screen = ctx.screen ?? SCREEN_BY_PATH.find(([p]) => pathname.startsWith(p))?.[1] ?? 'Beranda';
    const context = { ...ctx, screen, hintLevel: hintLevelFor(ctx.wrongAttempts ?? 0, count - 1) };
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setBusy(true);
    try {
      // Sapaan pembuka tidak perlu dikirim ke AI.
      const history = next.filter((m) => m !== GREETING);
      const reply = await askTutor(history, context, { signal: ac.signal });
      setMessages((m) => [...m, { role: 'assistant', content: reply }]);
    } catch (e) {
      if (e.name !== 'AbortError') setError('Kak Carta tidak bisa dihubungi. Cek internetmu, lalu coba lagi.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="tutor-panel"
        className="group fixed bottom-[calc(var(--nav-h)+var(--safe-bottom)+12px)] right-3 z-30 flex h-14 cursor-pointer items-center gap-2 rounded-full border-2 border-white/40 bg-gradient-to-r from-fuchsia-600 to-indigo-600 px-4 font-black text-white shadow-[0_0_22px_rgba(192,38,211,.55),0_8px_20px_rgba(49,46,129,.45)] transition hover:-translate-y-0.5 hover:shadow-[0_0_32px_rgba(192,38,211,.8),0_8px_20px_rgba(49,46,129,.45)] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-indigo-700"
      >
        {!open && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -inset-1 rounded-full motion-safe:animate-fab-glow"
          />
        )}
        <span className="relative text-2xl" aria-hidden="true">
          {open ? '✕' : '🤖'}
        </span>
        <span className="text-sm">{open ? 'Tutup' : 'Tanya Kak Carta'}</span>
      </button>

      {open && (
        <section
          id="tutor-panel"
          aria-label="Asisten belajar Kak Carta"
          className="fixed bottom-[calc(var(--nav-h)+var(--safe-bottom)+80px)] right-3 z-30 flex max-h-[min(70vh,560px)] w-[min(400px,calc(100vw-24px))] flex-col overflow-hidden rounded-3xl border-2 border-indigo-200 bg-white shadow-2xl shadow-indigo-900/30 motion-safe:animate-fade-up"
        >
          <header className="bg-gradient-to-r from-fuchsia-600 to-indigo-600 px-4 py-3 text-white">
            <p className="m-0 font-black">🤖 Kak Carta · Asisten Belajar</p>
            <p className="m-0 text-xs text-indigo-100">Membimbing cara berpikir, bukan memberi jawaban.</p>
          </header>

          <ol ref={listRef} className="m-0 flex-1 space-y-2 overflow-y-auto p-3" aria-live="polite">
            {messages.map((m, i) => (
              <li
                key={i}
                className={`max-w-[85%] list-none whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed ${m.role === 'user' ? 'ml-auto bg-indigo-600 text-white' : 'bg-slate-100 text-slate-800'}`}
              >
                <Bold text={m.content} />
              </li>
            ))}
            {busy && <li className="list-none text-sm text-slate-500">Kak Carta sedang berpikir…</li>}
            {error && <li className="list-none rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</li>}
          </ol>

          <div className="flex gap-1.5 overflow-x-auto px-3 pb-2">
            {QUICK.map((q) => (
              <button
                key={q.label}
                type="button"
                disabled={busy}
                onClick={() => send(q.text)}
                className="flex-none cursor-pointer whitespace-nowrap rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-800 disabled:opacity-50"
              >
                {q.label}
              </button>
            ))}
          </div>

          <form
            className="flex gap-2 border-t border-slate-200 p-3"
            onSubmit={(e) => {
              e.preventDefault();
              send(draft);
            }}
          >
            <label htmlFor="tutor-input" className="visually-hidden">
              Tulis pertanyaanmu
            </label>
            <input
              id="tutor-input"
              value={draft}
              maxLength={600}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Tulis caramu berpikir atau pertanyaanmu…"
              className="min-w-0 flex-1 rounded-xl border-2 border-slate-200 px-3 py-2 text-sm focus-visible:border-indigo-500 focus-visible:outline-none"
            />
            <button
              type="submit"
              disabled={busy || !draft.trim()}
              className="cursor-pointer rounded-xl border-0 bg-indigo-600 px-4 font-black text-white disabled:opacity-50"
            >
              Kirim
            </button>
          </form>
        </section>
      )}
    </>
  );
}
