/**
 * Penyedia AI untuk Kak Carta. Semua kunci API dibaca dari secret Cloudflare (env),
 * tidak pernah dikirim ke browser / APK.
 *
 * Urutan dipakai diatur lewat variabel AI_PROVIDERS di wrangler.toml, misalnya:
 *   AI_PROVIDERS = "deepseek,gemini,workers-ai"
 * Penyedia yang kuncinya belum diisi otomatis dilewati; kalau satu gagal/lambat,
 * server pindah ke penyedia berikutnya.
 */

const TIMEOUT_MS = 25000;

/** Banyak model hanya menerima satu pesan "system": gabungkan. */
function mergeSystem(messages) {
  const system = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n');
  return [{ role: 'system', content: system }, ...messages.filter((m) => m.role !== 'system')];
}

/** Panggilan bergaya OpenAI (/chat/completions): dipakai DeepSeek dan Gemini. */
async function openAiStyle(name, url, key, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`${name} error ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content?.trim() ?? '';
}

/** DeepSeek: https://api-docs.deepseek.com (kunci dari https://platform.deepseek.com/api_keys). */
export const deepseek = {
  id: 'deepseek',
  ready: (env) => !!env.DEEPSEEK_API_KEY,
  ask: (env, messages) =>
    openAiStyle('DeepSeek', `${env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'}/chat/completions`, env.DEEPSEEK_API_KEY, {
      model: env.DEEPSEEK_MODEL || 'deepseek-flash',
      temperature: 0.4,
      max_tokens: 400,
      messages: mergeSystem(messages),
    }),
};

/** Google Gemini (gratis): kunci dari https://aistudio.google.com/apikey. */
export const gemini = {
  id: 'gemini',
  ready: (env) => !!env.GEMINI_API_KEY,
  ask: (env, messages) =>
    openAiStyle('Gemini', 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', env.GEMINI_API_KEY, {
      model: env.GEMINI_MODEL || 'gemini-flash-lite-latest',
      temperature: 0.4,
      max_tokens: 400,
      ...(env.GEMINI_REASONING ? { reasoning_effort: env.GEMINI_REASONING } : {}),
      messages: mergeSystem(messages),
    }),
};

/** Cloudflare Workers AI (gratis, tanpa kunci): binding "AI" di wrangler.toml. */
export const workersAi = {
  id: 'workers-ai',
  ready: (env) => !!env.AI,
  ask: async (env, messages) => {
    const out = await env.AI.run(env.WORKERS_AI_MODEL || '@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: mergeSystem(messages),
      max_tokens: 400,
      temperature: 0.4,
    });
    return String(out?.response ?? out?.choices?.[0]?.message?.content ?? '').trim();
  },
};

const ALL = [deepseek, gemini, workersAi];

/** Daftar penyedia yang siap dipakai, sesuai urutan AI_PROVIDERS. */
export function providerChain(env) {
  const order = (env.AI_PROVIDERS || 'deepseek,gemini,workers-ai').split(',').map((s) => s.trim());
  return order.map((id) => ALL.find((p) => p.id === id)).filter((p) => p && p.ready(env));
}

/** Coba penyedia satu per satu. → { reply, provider } atau melempar error gabungan. */
export async function askChain(env, messages) {
  const chain = providerChain(env);
  if (!chain.length) throw new Error('Server belum punya AI: isi DEEPSEEK_API_KEY / GEMINI_API_KEY atau pasang Workers AI');
  const errors = [];
  for (const p of chain) {
    try {
      const reply = await p.ask(env, messages);
      if (reply) return { reply, provider: p.id };
    } catch (e) {
      errors.push(String(e.message || e));
      console.log(`AI ${p.id} gagal:`, e.message || e);
    }
  }
  throw new Error(errors.join(' | ') || 'Semua penyedia AI tidak menjawab');
}
