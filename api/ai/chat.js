// Vercel serverless — mode-aware tutoring endpoint.
// Mirrors server/routes/ai.js mode contracts; accepts { message, mode, telemetry }.

let geminiModel = null

async function getGemini() {
  if (geminiModel) return geminiModel
  const key = process.env.GEMINI_API_KEY
  if (!key) return null
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(key)
    geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    return geminiModel
  } catch {
    return null
  }
}

const MODE_CONTRACTS = {
  hint: `OPERATING CONTRACT (Diagnostic Hint Mode — non-negotiable):
1. Analyze the student's current problem, derivation, code, or query. Identify the SINGLE most consequential flaw — logical, syntactical, or conceptual.
2. NEVER give the final answer, the completed formula, the corrected code, or the worked solution.
3. Reference the student's live telemetry when relevant.
4. End with EXACTLY ONE targeted guiding question on its own line, prefixed "GUIDING: ".
5. Maximum 120 words. No preamble.`,
  cbse: `OPERATING CONTRACT (CBSE Evaluator Mode — non-negotiable):
1. Grade STRICTLY against the CBSE marking scheme. 1 mark per valid step/point unless the scheme says otherwise.
2. Output EXACTLY: MARKS: <earned>/<total> / STEP BREAKDOWN / KEYWORD CHECKS (NCERT terms) / BOARD TRAPS / VERDICT.
3. Rejected paraphrases count as absent keywords. Maximum 250 words. No motivational language.`,
  deep: `OPERATING CONTRACT (Deep Breakdown Mode — non-negotiable):
1. Explain the concept from first principles.
2. Include an EXECUTION TRACE (numbered state walkthrough) for any procedure, formula, or code.
3. Include an EDGE-CASE COMPARISON: at least two concrete edge cases.
4. Close with one line prefixed "INVARIANT: ".
5. Maximum 300 words.`,
}

function buildTelemetry(tel, pending, subjects) {
  if (tel && Object.keys(tel).length > 0) {
    const lines = ['STUDENT TELEMETRY (live):']
    for (const [k, v] of Object.entries(tel)) {
      if (v !== null && v !== undefined && v !== '') lines.push(`- ${k}: ${Array.isArray(v) ? v.join('; ') : v}`)
    }
    return lines.join('\n')
  }
  return `STUDENT TELEMETRY (derived):
- Active subject: ${subjects}
- Pending work: ${pending.length} assignment(s)
- Nearest: ${pending.slice(0, 4).map(a => `"${a.title}" (${a.courseName || 'General'}, due ${new Date(a.dueDate).toLocaleDateString()})`).join('; ') || 'none'}`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { message, context, mode, telemetry } = req.body || {}
  if (!message) return res.status(400).json({ error: 'Message is required' })

  const assignments = context?.assignments || []
  const pending = assignments.filter(a => a.status !== 'graded' && a.dueDate)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5)
  const subjects = [...new Set(assignments.map(a => a.courseName).filter(Boolean))].join(', ') || 'your courses'

  const modeName = (mode === 'cbse' && 'CBSE Evaluator') || (mode === 'deep' && 'Deep Breakdown') || 'Diagnostic Hint'
  const contract = MODE_CONTRACTS[mode] || MODE_CONTRACTS.hint
  const telBlock = buildTelemetry(telemetry, pending, subjects)

  const model = await getGemini()
  if (model) {
    try {
      const systemContext = `You are StudyPulse's tutoring engine, currently in ${modeName}. The student is a Class 11-12 CBSE student.

${telBlock}

${contract}

Never produce marketing language, emojis, or filler.`

      const chat = model.startChat({
        history: [
          { role: 'user', parts: [{ text: systemContext }] },
          { role: 'model', parts: [{ text: 'Understood. Operating under this contract.' }] },
        ],
      })
      const result = await chat.sendMessage(message)
      const text = result.response.text()
      const wantsPlan = /generate|create|make.*plan|study.*plan|schedule/i.test(message)
      return res.json({ message: text, mode: modeName, ...(wantsPlan && pending.length > 0 ? { shouldGeneratePlan: true } : {}) })
    } catch (err) {
      console.error('Gemini error:', err.message)
    }
  }

  // Fallback when no Gemini key
  const lc = message.toLowerCase()
  let response = `${pending.length} pending assignments in ${subjects}. Configure GEMINI_API_KEY to enable the tutoring modes.`
  if (lc.includes('due') || lc.includes('deadline')) {
    response = pending.length > 0
      ? `Nearest: "${pending[0].title}" (${pending[0].courseName}) due ${new Date(pending[0].dueDate).toLocaleDateString()}. ${pending.length} pending total.`
      : 'No upcoming deadlines.'
  } else if (lc.includes('plan') || lc.includes('schedule')) {
    return res.json({ message: `${pending.length} assignments available to schedule. Run Generate Plan.`, shouldGeneratePlan: pending.length > 0 })
  }

  res.json({ message: response, mode: modeName })
}
