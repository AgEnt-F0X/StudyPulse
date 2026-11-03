// Client-side LLM API wrapper using REST
// Providers, tried in order by key prefix: Groq, OpenRouter, Google Gemini.
// Supports a structured system prompt (tutor modes) and surfaces typed
// errors — rate limits and auth failures — so the UI can render retry states.

// Older models get retired, so fall through until one answers.
const GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.5-flash', 'gemini-flash-latest']
const geminiUrl = (model) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`

function getStoredKey() {
  try {
    const raw = localStorage.getItem('studypulse-ui')
    if (raw) {
      const parsed = JSON.parse(raw)
      const k = parsed?.state?.geminiApiKey || parsed?.geminiApiKey
      if (k && typeof k === 'string' && k.trim()) return k.trim()
    }
    const directKey = localStorage.getItem('gemini-api-key')
    if (directKey && directKey.trim()) return directKey.trim()
    const envKey = import.meta.env.VITE_GEMINI_API_KEY
    if (envKey && typeof envKey === 'string' && envKey.trim()) return envKey.trim()
    return null
  } catch {
    return import.meta.env.VITE_GEMINI_API_KEY?.trim() || null
  }
}

/**
 * Full-fidelity call used by the tutor engine.
 * Returns { ok, text, error, rateLimited } instead of throwing — callers
 * render retry states from `error`/`rateLimited` without try/catch plumbing.
 */
export async function callGeminiWithMeta(prompt, {
  system,
  maxOutputTokens = 2048,
  temperature = 0.6,
  timeoutMs = 15000,
} = {}) {
  const key = getStoredKey() || import.meta.env.VITE_GEMINI_API_KEY
  if (!key) return { ok: false, text: null, error: 'no_key', rateLimited: false }

  const messages = system
    ? [{ role: 'system', content: system }, { role: 'user', content: prompt }]
    : [{ role: 'user', content: prompt }]

  const attempt = async (label, fn) => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      return await fn(controller.signal)
    } catch (e) {
      if (e?.name === 'AbortError') return { ok: false, error: 'timeout', rateLimited: false }
      console.warn(`[${label}] request failed`, e)
      return { ok: false, error: 'network', rateLimited: false }
    } finally {
      clearTimeout(timer)
    }
  }

  // 1. Groq Cloud
  if (key.startsWith('gsk_')) {
    const res = await attempt('groq', (signal) =>
      fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages,
          temperature,
          max_tokens: maxOutputTokens,
        }),
        signal,
      }).then(async (r) => {
        if (r.status === 429) return { ok: false, error: 'rate_limited', rateLimited: true }
        if (r.status === 401 || r.status === 403) return { ok: false, error: 'auth', rateLimited: false }
        if (!r.ok) return { ok: false, error: `http_${r.status}`, rateLimited: false }
        const data = await r.json()
        const text = data?.choices?.[0]?.message?.content?.trim()
        return text ? { ok: true, text, error: null, rateLimited: false } : { ok: false, error: 'empty', rateLimited: false }
      })
    )
    if (res.ok || res.rateLimited) return res
  }

  // 2. OpenRouter
  if (key.startsWith('sk-or-')) {
    const res = await attempt('openrouter', (signal) =>
      fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173',
          'X-Title': 'StudyPulse',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.0-flash-exp:free',
          messages,
          temperature,
          max_tokens: maxOutputTokens,
        }),
        signal,
      }).then(async (r) => {
        if (r.status === 429) return { ok: false, error: 'rate_limited', rateLimited: true }
        if (r.status === 401 || r.status === 403) return { ok: false, error: 'auth', rateLimited: false }
        if (!r.ok) return { ok: false, error: `http_${r.status}`, rateLimited: false }
        const data = await r.json()
        const text = data?.choices?.[0]?.message?.content?.trim()
        return text ? { ok: true, text, error: null, rateLimited: false } : { ok: false, error: 'empty', rateLimited: false }
      })
    )
    if (res.ok || res.rateLimited) return res
  }

  // 3. Google Gemini (REST) — system prompt goes through systemInstruction
  for (const model of GEMINI_MODELS) {
    const res = await attempt('gemini', (signal) =>
      fetch(`${geminiUrl(model)}?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens, temperature },
        }),
        signal,
      }).then(async (r) => {
        if (r.status === 429) return { ok: false, error: 'rate_limited', rateLimited: true }
        if (r.status === 400 || r.status === 401 || r.status === 403) return { ok: false, error: 'auth', rateLimited: false }
        if (r.status === 404) return { ok: false, error: 'model_retired', rateLimited: false } // try next
        if (!r.ok) return { ok: false, error: `http_${r.status}`, rateLimited: false }
        const data = await r.json()
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
        return text ? { ok: true, text, error: null, rateLimited: false } : { ok: false, error: 'empty', rateLimited: false }
      })
    )
    if (res.ok || res.rateLimited) return res
    if (res.error === 'auth') return res // bad key — no point trying other models
  }
  return { ok: false, text: null, error: 'unavailable', rateLimited: false }
}

// Back-compat wrapper: returns text or null. Legacy callers (quiz/flashcards/
// study-plan generators) keep working unchanged.
export async function callGeminiClient(prompt, opts = {}) {
  const res = await callGeminiWithMeta(prompt, opts)
  if (res.ok) return res.text
  if (res.error === 'no_key') {
    console.warn('[gemini] no API key configured')
  } else if (res.error && res.error !== 'model_retired') {
    console.warn(`[gemini] call failed: ${res.error}${res.rateLimited ? ' (rate limited)' : ''}`)
  }
  return null
}

export function getKeyProvider() {
  const key = getStoredKey()
  if (!key) return null
  if (key.startsWith('gsk_')) return 'Groq · Llama 3.3 70B'
  if (key.startsWith('sk-or-')) return 'OpenRouter'
  return 'Gemini Flash'
}

export function hasClientKey() {
  return !!(getStoredKey() || import.meta.env.VITE_GEMINI_API_KEY)
}
