// Client-side Gemini API wrapper using REST
// Uses stored API key from Settings if server endpoint fails

// Tried in order — older models get retired, so fall through until one answers.
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

export async function callGeminiClient(prompt, { maxOutputTokens = 2048, temperature = 0.7, timeoutMs = 7000 } = {}) {
  const key = getStoredKey() || import.meta.env.VITE_GEMINI_API_KEY
  if (!key) return null

  // 1. Groq Cloud (Free Llama 3.3 70B & DeepSeek R1 - ultra-fast)
  if (key.startsWith('gsk_')) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature,
          max_tokens: maxOutputTokens
        }),
        signal: controller.signal
      })
      clearTimeout(timer)
      if (res.ok) {
        const data = await res.json()
        return data?.choices?.[0]?.message?.content?.trim() || null
      }
    } catch {
      clearTimeout(timer)
    }
  }

  // 2. OpenRouter (Free multi-model API)
  if (key.startsWith('sk-or-')) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173',
          'X-Title': 'StudyPulse'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.0-flash-exp:free',
          messages: [{ role: 'user', content: prompt }]
        }),
        signal: controller.signal
      })
      clearTimeout(timer)
      if (res.ok) {
        const data = await res.json()
        return data?.choices?.[0]?.message?.content?.trim() || null
      }
    } catch {
      clearTimeout(timer)
    }
  }

  // 3. Google Gemini (REST)
  for (const model of GEMINI_MODELS) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch(`${geminiUrl(model)}?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens, temperature }
        }),
        signal: controller.signal
      })
      clearTimeout(timer)
      if (res.status === 404) continue // model retired — try next
      if (!res.ok) continue
      const data = await res.json()
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (text) return text
    } catch {
      clearTimeout(timer)
    }
  }
  return null
}

export function getKeyProvider() {
  const key = getStoredKey()
  if (!key) return null
  if (key.startsWith('gsk_')) return 'Groq (Llama 3.3 70B)'
  if (key.startsWith('sk-or-')) return 'OpenRouter (Free)'
  return 'Gemini 2.0 Flash'
}

export function hasClientKey() {
  return !!(getStoredKey() || import.meta.env.VITE_GEMINI_API_KEY)
}
