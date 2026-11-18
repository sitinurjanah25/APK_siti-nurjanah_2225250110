/**
 * Backend Asisten Belajar cartes.play (Cloudflare Worker).
 *
 * - API key DeepSeek HANYA disimpan di sini sebagai secret (DEEPSEEK_API_KEY),
 *   tidak pernah dikirim ke browser / APK.
 * - Prompt pedagogis (RMT + Cognitive Load + Literasi Matematika) juga ada di server,
 *   supaya tidak bisa diubah dari sisi siswa.
 * - Aplikasi tidak pernah mengirim kunci jawaban ke sini, jadi AI pun tidak tahu
 *   jawabannya dan tidak bisa membocorkannya.
 *
 * Endpoint: POST /chat  { messages: [{role, content}], context: {...} }
 *           → { reply: string }
 */

const DEFAULT_ORIGINS = [
  'https://sitinurjanah25.github.io', // GitHub Pages
  'https://localhost', // APK (Capacitor Android)
  'capacitor://localhost',
  'http://localhost:5173', // npm run dev
];

const MAX_MESSAGES = 12; // hanya riwayat terakhir yang dikirim ke AI
const MAX_CHARS = 600; // batas panjang satu pesan siswa

/* ------------------------------------------------------------------ */
/* Prompt sistem: peran tutor                                          */
/* ------------------------------------------------------------------ */

const SYSTEM_PROMPT = `Kamu adalah "Kak Carta", asisten belajar di aplikasi cartes.play untuk siswa kelas 8 SMP yang belajar Sistem Koordinat Kartesius (bidang 2D dan ruang 3D dengan sumbu Z).

ATURAN UTAMA
1. JANGAN PERNAH memberi jawaban akhir (misalnya "jawabannya (2, 3, 1)") untuk soal yang sedang dikerjakan siswa. Tugasmu membimbing cara berpikir, bukan menjawabkan.
2. Kalau siswa meminta jawaban langsung, tolak dengan ramah lalu ajukan satu pertanyaan pemantik.
3. Kamu tidak tahu kunci jawaban soal yang sedang dikerjakan. Jangan menebak atau mengarang angka jawabannya.
4. Gunakan Bahasa Indonesia yang santai dan ramah untuk remaja. Sapa dengan "kamu".
5. Hanya bahas matematika (koordinat, sumbu, kuadran, plotting, ruang 3D). Kalau di luar topik, arahkan kembali dengan sopan.

MODEL RIGOROUS MATHEMATICAL THINKING (RMT)
Bimbing siswa lewat tahap berikut. Tentukan siswa sedang di tahap mana, lalu kerjakan SATU tahap per balasan:
- Tahap 1 Orientasi (memahami masalah): ajak siswa menyebutkan apa yang diketahui dan apa yang ditanyakan.
- Tahap 2 Alat psikologis (bahasa konsep): pastikan siswa memakai istilah yang tepat: titik asal O, sumbu X (kanan +, kiri −), sumbu Y (belakang/atas +, depan/bawah −), sumbu Z (ketinggian, naik +), urutan (x, y, z).
- Tahap 3 Pelaksanaan bertahap: pandu satu langkah saja, misalnya "dari O, berapa kotak ke kanan atau kiri sampai sejajar rumah?".
- Tahap 4 Refleksi dan verifikasi: minta siswa mengecek jawabannya sendiri ("coba jalan lagi dari O dengan angkamu, apakah sampai di rumah?") dan menjelaskan alasannya.
Berikan mediasi sesuai kesulitan siswa: tanyakan alasan, tunjukkan pola, dan hubungkan dengan konsep sebelumnya.

PENGELOLAAN BEBAN KOGNITIF (COGNITIVE LOAD)
- Intrinsic load: pecah masalah jadi langkah kecil. Satu balasan = satu ide = paling banyak 1 pertanyaan.
- Extraneous load: balasan singkat (maksimal 3–4 kalimat pendek), tanpa teori panjang, tanpa istilah yang tidak perlu, format konsisten. Tulis koordinat dengan format (x, y) atau (x, y, z).
- Germane load: ajak siswa membangun skema, misalnya "Apa bedanya titik di lantai dan titik yang melayang?", dan menghubungkan 2D ke 3D.

LITERASI MATEMATIKA (PISA: merumuskan, menerapkan, menafsirkan)
- Bantu siswa merumuskan situasi (peta kota, rumah, lantai) ke bahasa matematika (titik, sumbu, koordinat).
- Bantu menerapkan prosedur (menghitung kotak dari O).
- Bantu menafsirkan hasil ke konteks ("berarti rumahnya 2 lantai di atas tanah").

TANGGA PETUNJUK (lihat "level_petunjuk" di konteks)
- Level 1: hanya pertanyaan pemantik (tanpa petunjuk isi).
- Level 2: petunjuk konsep (ingatkan arah sumbu atau urutan koordinat).
- Level 3: contoh serupa dengan ANGKA BERBEDA dari soal (worked example), lalu minta siswa meniru langkahnya.
Jangan lompat ke level yang lebih tinggi dari yang diberikan.`;

function contextBlock(ctx = {}) {
  const lines = [];
  if (ctx.screen) lines.push(`- layar: ${ctx.screen}`);
  if (ctx.topic) lines.push(`- topik: ${ctx.topic}`);
  if (ctx.difficulty) lines.push(`- tingkat kesulitan: ${ctx.difficulty}`);
  if (ctx.task) lines.push(`- jenis soal: ${ctx.task}`);
  if (ctx.question) lines.push(`- teks soal: ${ctx.question}`);
  if (Number.isFinite(ctx.wrongAttempts)) lines.push(`- jumlah salah pada soal ini: ${ctx.wrongAttempts}`);
  if (ctx.lastMistake) lines.push(`- jenis kesalahan terakhir (dari sistem): ${ctx.lastMistake}`);
  const level = Math.min(3, Math.max(1, Number(ctx.hintLevel) || 1));
  lines.push(`- level_petunjuk: ${level}`);
  return `KONTEKS SISWA SAAT INI (dari aplikasi, bukan dari siswa)\n${lines.join('\n')}`;
}

/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/* Penyedia AI                                                          */
/* ------------------------------------------------------------------ */

/**
 * GRATIS: Cloudflare Workers AI (binding "AI" di wrangler.toml).
 * Tidak perlu API key; memakai kuota gratis harian akun Cloudflare.
 */
async function askWorkersAI(env, messages) {
  // Sebagian model tidak menerima beberapa pesan "system": gabungkan jadi satu.
  const system = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n');
  const chat = [{ role: 'system', content: system }, ...messages.filter((m) => m.role !== 'system')];
  const out = await env.AI.run(env.WORKERS_AI_MODEL || '@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
    messages: chat,
    max_tokens: 300,
    temperature: 0.4,
  });
  // Bentuk jawaban berbeda antar-model: { response } atau gaya OpenAI { choices }.
  const text = out?.response ?? out?.choices?.[0]?.message?.content ?? '';
  return String(text).trim();
}

/**
 * GRATIS: Google Gemini (kunci dari https://aistudio.google.com/apikey, disimpan sebagai secret GEMINI_API_KEY).
 * Memakai endpoint Gemini yang kompatibel dengan format OpenAI.
 */
async function askGemini(env, messages) {
  const system = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n');
  const res = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.GEMINI_API_KEY}` },
    body: JSON.stringify({
      model: env.GEMINI_MODEL || 'gemini-flash-lite-latest',
      temperature: 0.4,
      max_tokens: 400,
      // Jawaban tutor pendek: matikan/kecilkan "mode berpikir" supaya cepat.
      ...(env.GEMINI_REASONING ? { reasoning_effort: env.GEMINI_REASONING } : {}),
      messages: [{ role: 'system', content: system }, ...messages.filter((m) => m.role !== 'system')],
    }),
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`Gemini error ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content?.trim() ?? '';
}

/** BERBAYAR (opsional): DeepSeek, dipakai kalau secret DEEPSEEK_API_KEY diisi. */
async function askDeepSeek(env, messages) {
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.DEEPSEEK_API_KEY}` },
    body: JSON.stringify({ model: env.DEEPSEEK_MODEL || 'deepseek-flash', temperature: 0.4, max_tokens: 300, messages }),
  });
  if (!res.ok) throw new Error(`DeepSeek error ${res.status}`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content?.trim() ?? '';
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') ?? '';
    const headers = cors(origin, env);
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'POST' || url.pathname !== '/chat') return json({ error: 'Not found' }, 404, headers);
    if (!headers['Access-Control-Allow-Origin'] || headers['Access-Control-Allow-Origin'] !== origin) {
      return json({ error: 'Origin tidak diizinkan' }, 403, headers);
    }
    if (!env.GEMINI_API_KEY && !env.DEEPSEEK_API_KEY && !env.AI) {
      return json({ error: 'Server belum punya AI: isi GEMINI_API_KEY (gratis) atau pasang Workers AI' }, 500, headers);
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
      { role: 'system', content: contextBlock(body.context) },
      ...messages,
    ];

    // Urutan: Gemini (gratis) → DeepSeek (berbayar, opsional) → Workers AI (gratis, cadangan).
    // Kalau satu penyedia gagal/lambat, otomatis pindah ke berikutnya.
    const providers = [];
    if (env.GEMINI_API_KEY) providers.push(askGemini);
    if (env.DEEPSEEK_API_KEY) providers.push(askDeepSeek);
    if (env.AI) providers.push(askWorkersAI);

    let reply;
    const errors = [];
    for (const ask of providers) {
      try {
        reply = await ask(env, prompt);
        if (reply) break;
      } catch (e) {
        errors.push(String(e.message || e));
        console.log('AI gagal:', e.message || e);
      }
    }
    if (!reply && errors.length) return json({ error: errors.join(' | ') }, 502, headers);
    return json({ reply: reply || 'Maaf, Kak Carta sedang bingung. Coba tanya lagi ya.' }, 200, headers);
  },
};
