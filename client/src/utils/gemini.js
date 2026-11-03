// Gemini 2.5 service — StudyPulse's AI layer.
// Primary: Google Gemini REST (gemini-2.5-flash) with structured JSON mode,
// multimodal inline images, and 5 deterministic tutoring methods.
// Legacy fallback: Groq / OpenRouter chat-completions for text-only calls.

// Older models get retired, so fall through until one answers.
const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-flash-latest']
const PRIMARY_MODEL = 'gemini-2.5-flash'
const geminiUrl = (model) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`

function getStoredKey() {
  try {
    // Canonical key (Settings / AI Tutor writes here)
    const k = localStorage.getItem('studypulse_gemini_key')
    if (k && typeof k === 'string' && k.trim()) return k.trim()
    // Legacy keys (older settings + AIAssistant quick-save)
    const directKey = localStorage.getItem('gemini-api-key')
    if (directKey && directKey.trim()) return directKey.trim()
    // Persisted UI store (Settings page)
    const raw = localStorage.getItem('studypulse-ui')
    if (raw) {
      const parsed = JSON.parse(raw)
      const uiKey = parsed?.state?.geminiApiKey || parsed?.geminiApiKey
      if (uiKey && typeof uiKey === 'string' && uiKey.trim()) return uiKey.trim()
    }
    return null
  } catch {
    return null
  }
}

function resolveKey() {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY
  return getStoredKey() || (envKey && typeof envKey === 'string' && envKey.trim()) || null
}

export function hasClientKey() {
  return !!resolveKey()
}

export function getKeyProvider() {
  const key = resolveKey()
  if (!key) return null
  if (key.startsWith('gsk_')) return 'Groq · Llama 3.3 70B'
  if (key.startsWith('sk-or-')) return 'OpenRouter'
  return 'Gemini 2.5 Flash'
}

// ── Low-level Gemini call (REST, multimodal, JSON mode) ───────

/**
 * callGemini({ parts, system, json, temperature, timeoutMs, maxOutputTokens })
 * parts: [{ text }] and/or [{ inlineData: { mimeType, data } }]
 * Returns { ok, text, error, rateLimited } — never throws.
 */
export async function callGemini({
  parts,
  system,
  json = false,
  temperature = 0.55,
  timeoutMs = 20000,
  maxOutputTokens = 4096,
} = {}) {
  const key = resolveKey()
  if (!key) return { ok: false, text: null, error: 'no_key', rateLimited: false }
  if (key.startsWith('gsk_') || key.startsWith('sk-or-')) {
    // Non-Gemini keys: route through the legacy text path (no JSON mode).
    const flat = [
      system ? `SYSTEM:\n${system}` : '',
      parts.map((p) => (p.text ? p.text : '[image attached — not supported on this provider]')).join('\n'),
    ].filter(Boolean).join('\n\n')
    const res = await callGeminiWithMeta(flat, { timeoutMs, temperature, maxOutputTokens })
    return res
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(`${geminiUrl(PRIMARY_MODEL)}?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
        contents: [{ role: 'user', parts }],
        generationConfig: {
          temperature,
          maxOutputTokens,
          ...(json ? { responseMimeType: 'application/json' } : {}),
        },
      }),
      signal: controller.signal,
    })
    if (res.status === 429) return { ok: false, error: 'rate_limited', rateLimited: true }
    if (res.status === 400 || res.status === 401 || res.status === 403) return { ok: false, error: 'auth', rateLimited: false }
    if (!res.ok) return { ok: false, error: `http_${res.status}`, rateLimited: false }
    const data = await res.json()
    const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).filter(Boolean).join('')?.trim()
    return text ? { ok: true, text, error: null, rateLimited: false } : { ok: false, error: 'empty', rateLimited: false }
  } catch (e) {
    if (e?.name === 'AbortError') return { ok: false, error: 'timeout', rateLimited: false }
    return { ok: false, error: 'network', rateLimited: false }
  } finally {
    clearTimeout(timer)
  }
}

// Lenient JSON extraction (models occasionally wrap in fences or prose)
function parseJsonLoose(text) {
  if (!text) return null
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
  try { return JSON.parse(cleaned) } catch {}
  const first = Math.min(...['{', '['].map((c) => {
    const i = cleaned.indexOf(c)
    return i === -1 ? Infinity : i
  }))
  if (!isFinite(first)) return null
  const openChar = cleaned[first]
  const closeChar = openChar === '{' ? '}' : ']'
  const last = cleaned.lastIndexOf(closeChar)
  if (last <= first) return null
  try { return JSON.parse(cleaned.slice(first, last + 1)) } catch {}
  return null
}

// ── Legacy compatibility (text-only callers across the app) ───

export async function callGeminiWithMeta(prompt, {
  system,
  maxOutputTokens = 2048,
  temperature = 0.6,
  timeoutMs = 15000,
} = {}) {
  const key = resolveKey()
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
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages, temperature, max_tokens: maxOutputTokens }),
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
        body: JSON.stringify({ model: 'google/gemini-2.0-flash-exp:free', messages, temperature, max_tokens: maxOutputTokens }),
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

  // 3. Google Gemini REST — newest first
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
        if (r.status === 404) return { ok: false, error: 'model_retired', rateLimited: false }
        if (!r.ok) return { ok: false, error: `http_${r.status}`, rateLimited: false }
        const data = await r.json()
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
        return text ? { ok: true, text, error: null, rateLimited: false } : { ok: false, error: 'empty', rateLimited: false }
      })
    )
    if (res.ok || res.rateLimited) return res
    if (res.error === 'auth') return res
  }
  return { ok: false, text: null, error: 'unavailable', rateLimited: false }
}

export async function callGeminiClient(prompt, opts = {}) {
  const res = await callGeminiWithMeta(prompt, opts)
  if (res.ok) return res.text
  if (res.error && res.error !== 'model_retired' && res.error !== 'no_key') {
    console.warn(`[gemini] call failed: ${res.error}${res.rateLimited ? ' (rate limited)' : ''}`)
  }
  return null
}

// ── Grounding + language contract shared by the tutor methods ──

const LANGUAGE_RULE = `LANGUAGE: Detect the language of the user's question automatically and reply in exactly that register:
- English question → answer in clear English.
- Hindi (Devanagari) question → answer fully in simple Hindi (Devanagari script).
- Hinglish (Roman-script Hindi mixed with English) → answer in the same natural Hinglish style.
Technical terms and formulas always stay in standard English notation.`

const CBSE_GROUND_RULE = `GROUNDING: You are a CBSE Class 10 & 11 tutor. Ground every claim in the PAGE TEXT provided. Never introduce facts, formulas or chapters that are not on the page or in the concept list. If the page does not contain the answer, say so plainly and offer the closest related idea from the page.`

// ── 1. Page-grounded tutor (reader drawer: Explain / Why this?) ──

export async function askPageGroundedTutor({
  pageText = '',
  croppedImageBase64 = null,
  question,
  language = 'auto',
  tabMode = 'explain',
  simpler = false,
  pageNumber = null,
  chapterTitle = '',
}) {
  if (!question || !question.trim()) return { ok: false, error: 'empty_question' }

  const modeRule = tabMode === 'why'
    ? `MODE: First-principles intuition — explain WHY this works the way it does, the intuition behind it, then one line on exactly how CBSE board exams test this concept (typical question phrasing and mark weight).`
    : simpler
      ? `MODE: "Say it simpler" — rewrite the explanation with a simple everyday analogy a Class 10 student would instantly get. Keep the CBSE-correct terminology alongside the analogy.`
      : `MODE: Explain the concept clearly and precisely, grounded in the page.`

  const sys = `${CBSE_GROUND_RULE}\n\n${LANGUAGE_RULE}\n\n${modeRule}\n\nRespond ONLY with a JSON object with exactly these keys:
{"answerMarkdown": "markdown answer (use **bold** for key terms, \`code\` for formulas)", "keyBullets": ["2-4 one-line takeaways"], "sectionCitation": "the section heading or phrase from the page this answer is grounded in", "followUpSuggestions": ["2 short follow-up questions the student might ask"]}`

  const parts = []
  parts.push({
    text: `CHAPTER: ${chapterTitle || 'CBSE chapter'}${pageNumber ? ` — page ${pageNumber}` : ''}

PAGE TEXT (authoritative source — cite from this):
"""
${String(pageText).slice(0, 8000)}
"""${croppedImageBase64 ? '\n\nIMAGE: the student selected this exact region (diagram/graph/equation) from the page — explain it in the context of the page text.' : ''}

STUDENT QUESTION: ${question.trim()}`,
  })
  if (croppedImageBase64) {
    parts.push({ inlineData: { mimeType: 'image/png', data: croppedImageBase64 } })
  }

  const res = await callGemini({ parts, system: sys, json: true, temperature: 0.5, timeoutMs: 18000 })
  if (!res.ok) {
    return {
      ok: false,
      error: res.error,
      answerMarkdown: '',
      keyBullets: [],
      sectionCitation: '',
      pageNumber,
      followUpSuggestions: [],
    }
  }
  const parsed = parseJsonLoose(res.text) || {}
  return {
    ok: true,
    answerMarkdown: parsed.answerMarkdown || res.text || '',
    keyBullets: Array.isArray(parsed.keyBullets) ? parsed.keyBullets.slice(0, 4) : [],
    sectionCitation: parsed.sectionCitation || '',
    pageNumber,
    followUpSuggestions: Array.isArray(parsed.followUpSuggestions) ? parsed.followUpSuggestions.slice(0, 3) : [],
  }
}

// ── 2. Quiz Me — targeted MCQ generation (JSON mode) ──────────

export async function generateQuizMeQuestions({
  chapterTitle = '',
  pageText = '',
  concepts = [],
  weakConcepts = [],
  count = 3,
  highlights = [],
}) {
  const sys = `You write CBSE Class 10 & 11 multiple-choice questions. Each question targets ONE named concept from the chapter, is exam-accurate to NCERT, has exactly 4 options with exactly one correct answer, a one-sentence explanation, and a trapNote naming the classic mistake students make on this question.

PRIORITY: aim at the weak concepts first (${weakConcepts.join(', ') || 'none — spread across the concept list'}).

Respond ONLY with a JSON array of exactly ${count} objects:
[{"conceptName": "concept from the list", "question": "...", "options": ["A","B","C","D"], "correctIndex": 0, "explanation": "one sentence", "trapNote": "the common CBSE trap on this"}]`

  const prompt = `CHAPTER: ${chapterTitle}

CONCEPTS: ${concepts.join(' | ') || 'inferred from the text'}

${highlights.length ? `STUDENT HIGHLIGHTS (give these extra weight):\n${highlights.slice(0, 8).join('\n')}\n` : ''}
PAGE TEXT:
"""
${String(pageText || chapterTitle).slice(0, 8000)}
"""

Generate the questions.`

  const res = await callGemini({ parts: [{ text: prompt }], system: sys, json: true, temperature: 0.65, timeoutMs: 16000 })
  if (!res.ok) return { ok: false, questions: [], error: res.error }
  const parsed = parseJsonLoose(res.text)
  const list = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.questions) ? parsed.questions : [])
  const questions = list
    .filter((q) => q && q.question && Array.isArray(q.options) && q.options.length === 4 && Number.isInteger(q.correctIndex))
    .slice(0, count)
    .map((q, i) => ({
      id: `ai-${Date.now()}-${i}`,
      conceptName: String(q.conceptName || concepts[0] || chapterTitle),
      question: String(q.question),
      options: q.options.map(String),
      correctIndex: Math.max(0, Math.min(3, Number(q.correctIndex))),
      explanation: String(q.explanation || ''),
      trapNote: String(q.trapNote || ''),
    }))
  return { ok: questions.length > 0, questions, error: questions.length ? null : 'parse_failed' }
}

// ── 3. Slip diagnosis ("What StudyPulse Noticed") ─────────────

export async function diagnoseStudentSlip({
  question = '',
  chosenAnswer = '',
  correctAnswer = '',
  confidence = '',
  conceptName = '',
}) {
  const sys = `You are StudyPulse's slip diagnostician. Name the EXACT mistake the student made (the misconception, not just "wrong answer") and give a ONE-sentence corrective rule they can apply immediately. Maximum 2 sentences total. Respond ONLY with JSON:
{"misconceptionType": "one-phrase label, e.g. 'sign confusion on refraction'", "exactSlipDescription": "the exact mistake in one sentence, referencing their answer", "correctiveRule": "one-sentence fix"}`

  const prompt = `Concept: ${conceptName}
Question: ${question}
Student's answer: ${chosenAnswer || '(no answer chosen)'}
Correct answer: ${correctAnswer}
Declared confidence: ${confidence}`

  const res = await callGemini({ parts: [{ text: prompt }], system: sys, json: true, temperature: 0.4, timeoutMs: 10000 })
  if (!res.ok) return { ok: false, error: res.error }
  const parsed = parseJsonLoose(res.text) || {}
  return {
    ok: !!(parsed.exactSlipDescription && parsed.correctiveRule),
    misconceptionType: parsed.misconceptionType || '',
    exactSlipDescription: parsed.exactSlipDescription || '',
    correctiveRule: parsed.correctiveRule || '',
  }
}

// ── 4. Multi-format chapter notes (6 Vedmi formats) ───────────

export const NOTE_FORMATS = [
  { id: 'all_topics', label: 'All important topics' },
  { id: 'mind_map', label: 'Mind map' },
  { id: 'flow_chart', label: 'Flow chart' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'mnemonics', label: 'Mnemonics' },
  { id: 'formula_sheet', label: 'Formula sheet' },
]

const FORMAT_SCHEMAS = {
  all_topics: `{"sections": [{"title": "section heading", "points": ["bullet points with the key facts, formulas and definitions"], "examTip": "one board-exam tip for this section"}]}`,
  mind_map: `{"root": "chapter title", "children": [{"label": "branch", "children": [{"label": "leaf", "children": []}]}]} — 3-5 top branches, nested leaves.`,
  flow_chart: `{"nodes": [{"id": "n1", "label": "step", "note": "one-line detail"}], "edges": [{"from": "n1", "to": "n2", "label": "condition if any"}]} — a decision/cause-effect flow of the chapter's logic.`,
  timeline: `{"events": [{"when": "date/era/order marker", "label": "event or discovery", "description": "one line"}]} — strictly chronological.`,
  mnemonics: `{"items": [{"mnemonic": "the memory hook", "meaning": "what it stands for", "topic": "which concept"}]} — 5-8 genuinely useful hooks.`,
  formula_sheet: `{"groups": [{"topic": "grouping", "formulas": [{"latex": "LaTeX expression", "name": "what it is", "note": "when to use / units"}]}]} — every formula on the page with LaTeX.`,
}

export async function generateChapterNotes({
  chapterTitle = '',
  pageText = '',
  highlights = [],
  format = 'all_topics',
}) {
  const schema = FORMAT_SCHEMAS[format] || FORMAT_SCHEMAS.all_topics
  const sys = `You produce CBSE revision notes. Format: ${format}. Respond ONLY with JSON matching exactly this schema:
${schema}

Rules: strictly grounded in the provided page text and highlights; NCERT-accurate terminology; ${format === 'formula_sheet' ? 'every formula in valid LaTeX' : 'concise, scannable lines'}; no preamble.`

  const prompt = `CHAPTER: ${chapterTitle}
${highlights.length ? `\nSTUDENT'S SAVED HIGHLIGHTS (build these in — they flagged them deliberately):\n${highlights.slice(0, 12).map((h) => `- ${h}`).join('\n')}\n` : ''}
PAGE TEXT:
"""
${String(pageText || chapterTitle).slice(0, 10000)}
"""`

  const res = await callGemini({ parts: [{ text: prompt }], system: sys, json: true, temperature: 0.5, timeoutMs: 22000, maxOutputTokens: 6000 })
  if (!res.ok) return { ok: false, format, data: null, error: res.error }
  const parsed = parseJsonLoose(res.text)
  return { ok: !!parsed, format, data: parsed, error: parsed ? null : 'parse_failed' }
}

// ── 5. Board PYQ walkthrough (step-wise marking scheme) ───────

export async function solveBoardPYQ({
  pyqQuestion = '',
  marks = 3,
  year = null,
  subject = '',
  studentDraft = '',
  chapterTitle = '',
}) {
  const sys = `You are a CBSE board examiner walking a student through the OFFICIAL step-wise marking scheme for this past board question (${marks} mark${marks === 1 ? '' : 's'}${year ? `, ${year}` : ''}).

Show every VALUE POINT the marking scheme awards, one per step, with its mark allocation (e.g. "½ mark for stating...", "1 mark for the correct formula with substitution"). Point out the common board traps for this exact question type. If the student provided a draft, grade it against the scheme first.

Respond ONLY with JSON:
{"gradingOfDraft": "2-3 sentences grading the student's draft against the scheme (or empty string if no draft)", "valuePoints": [{"step": "what earns the mark", "marks": "1 or ½", "detail": "exactly how to write it for full credit"}], "totalMarks": ${marks}, "modelAnswer": "the complete full-marks answer, markdown", "examinerTip": "one trap the examiner watches for on this question"}`

  const prompt = `Subject: ${subject}${chapterTitle ? ` · Chapter: ${chapterTitle}` : ''}
Board question (CBSE ${year || 'past year'}, ${marks} marks):
"""
${pyqQuestion.slice(0, 4000)}
"""${studentDraft ? `\n\nSTUDENT'S DRAFT ANSWER:\n"""\n${studentDraft.slice(0, 2500)}\n"""` : ''}`

  const res = await callGemini({ parts: [{ text: prompt }], system: sys, json: true, temperature: 0.5, timeoutMs: 20000, maxOutputTokens: 5000 })
  if (!res.ok) return { ok: false, error: res.error }
  const parsed = parseJsonLoose(res.text)
  if (!parsed || !Array.isArray(parsed.valuePoints)) return { ok: false, error: 'parse_failed' }
  return {
    ok: true,
    gradingOfDraft: parsed.gradingOfDraft || '',
    valuePoints: parsed.valuePoints.map((v) => ({ step: String(v.step || ''), marks: String(v.marks || '1'), detail: String(v.detail || '') })),
    totalMarks: Number(parsed.totalMarks) || marks,
    modelAnswer: String(parsed.modelAnswer || ''),
    examinerTip: String(parsed.examinerTip || ''),
  }
}
