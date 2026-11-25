/**
 * Backend Asisten Belajar cartes.play (Cloudflare Worker).
 *
 * Susunan modul:
 *   tutor-worker.js       → HTTP, CORS, validasi input (file ini)
 *   prompts/pedagogy.js   → prompt RMT + Cognitive Load + Literasi Matematika
 *   providers.js          → DeepSeek / Gemini / Workers AI (dengan cadangan otomatis)
 *
 * Keamanan:
 * - Kunci API (DEEPSEEK_API_KEY, GEMINI_API_KEY) HANYA ada di sini sebagai secret Cloudflare,
 *   tidak pernah dikirim ke browser / APK.
 * - Prompt pedagogis ada di server, jadi tidak bisa diubah dari sisi siswa.
 * - Aplikasi tidak pernah mengirim kunci jawaban, jadi AI tidak tahu jawabannya dan tidak bisa membocorkannya.
 *
 * Endpoint: POST /chat  { messages: [{role, content}], context: {...} }
 *           → { reply: string, stage: {id, name, total} | null, provider: string }
 */
import { buildSystemPrompt, contextBlock, splitStage } from './prompts/pedagogy.js';
import { askChain } from './providers.js';

const DEFAULT_ORIGINS = [
  'https://sitinurjanah25.github.io', // GitHub Pages
  'https://localhost', // APK (Capacitor Android)
  'capacitor://localhost',
  'http://localhost:5173', // npm run dev
];

const MAX_MESSAGES = 12; // hanya riwayat terakhir yang dikirim ke AI
const MAX_CHARS = 600; // batas panjang satu pesan siswa
const SYSTEM_PROMPT = buildSystemPrompt();

function cors(origin, env) {
  const allowed = (env.ALLOWED_ORIGINS?.split(',').map((s) => s.trim()) ?? DEFAULT_ORIGINS).filter(Boolean);
  const ok = allowed.includes(origin);
  return {
    'Access-Control-Allow-Origin': ok ? origin : allowed[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

const json = (data, status, headers) =>
  new Response(JSON.stringify(data), { status, headers: { ...headers, 'Content-Type': 'application/json' } });

function cleanMessages(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-MAX_MESSAGES)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') ?? '';
    const headers = cors(origin, env);
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'POST' || url.pathname !== '/chat') return json({ error: 'Not found' }, 404, headers);
    if (headers['Access-Control-Allow-Origin'] !== origin) {
      return json({ error: 'Origin tidak diizinkan' }, 403, headers);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Body harus JSON' }, 400, headers);
    }
    const messages = cleanMessages(body.messages);
    if (!messages.length || messages[messages.length - 1].role !== 'user') {
      return json({ error: 'Pesan siswa kosong' }, 400, headers);
    }

    const prompt = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'system', content: contextBlock(body.context ?? {}) },
      ...messages,
    ];

    try {
      const { reply, provider } = await askChain(env, prompt);
      const { text, stage } = splitStage(reply);
      return json(
        { reply: text || 'Maaf, Kak Carta sedang bingung. Coba tanya lagi ya.', stage, provider },
        200,
        headers,
      );
    } catch (e) {
      return json({ error: String(e.message || e) }, 502, headers);
    }
  },
};
