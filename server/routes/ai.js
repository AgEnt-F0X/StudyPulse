import express from 'express'

const router = express.Router()

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

async function callGemini(model, systemContext, userMessage) {
  const chat = model.startChat({
    history: [
      { role: 'user', parts: [{ text: systemContext }] },
      { role: 'model', parts: [{ text: 'Understood. Operating under this contract for this session.' }] }
    ]
  })
  const result = await chat.sendMessage(userMessage)
  return result.response.text()
}

// ── Deterministic pedagogical mode contracts ──────────────────
// Mirrors client/src/utils/aiModes.js — keep the two in sync.

const MODE_CONTRACTS = {
  hint: `OPERATING CONTRACT (Diagnostic Hint Mode — non-negotiable):
1. Analyze the student's current problem, derivation, code, or query. Identify the SINGLE most consequential flaw — logical, syntactical, or conceptual. If there is no flaw, identify the weakest assumption in their approach.
2. NEVER give the final answer, the completed formula, the corrected code, or the worked solution. Partial hints at the mechanism level are allowed; results are not.
3. Reference the student's live telemetry when relevant.
4. End your reply with EXACTLY ONE targeted guiding question, on its own line, prefixed with "GUIDING: ".
5. Maximum 120 words. No preamble, no pleasantries.`,
  cbse: `OPERATING CONTRACT (CBSE Evaluator Mode — non-negotiable):
1. Grade the student's answer STRICTLY against the CBSE marking scheme. Default: 1 mark per valid step/point unless the standard scheme says otherwise.
2. Output EXACTLY this structure:
   MARKS: <earned>/<total>
   STEP BREAKDOWN:
   - <step or keyword> — <✓ awarded X M | ✗ missing/incorrect — what the scheme expects>
   KEYWORD CHECKS:
   - <required NCERT keyword/term> — <present | absent | paraphrased-unacceptable>
   BOARD TRAPS: <1-2 lines: common examiner penalties for THIS question type>
   VERDICT: <one line: what to add to reach full marks>
3. Keyword checks must reference NCERT terminology; rejected paraphrases count as absent.
4. Be strict. Maximum 250 words. No motivational language.`,
  deep: `OPERATING CONTRACT (Deep Breakdown Mode — non-negotiable):
1. Explain the underlying concept from first principles for the student's specific question.
2. For any procedure, formula, or code, include an EXECUTION TRACE: numbered walkthrough showing the state of every relevant term after each step.
3. Include an EDGE-CASE COMPARISON: correct vs incorrect application on at least two concrete edge cases (boundary values, degenerate inputs, sign/unit traps).
4. Close with ONE invariant, on its own line, prefixed with "INVARIANT: ".
5. Maximum 300 words. Use fenced code blocks with a language tag.`,
}

function buildTelemetry(tel) {
  if (!tel) return 'STUDENT TELEMETRY: unavailable.'
  const lines = ['STUDENT TELEMETRY (live, from StudyPulse session):']
  if (tel.student) lines.push(`- Student: ${tel.student}`)
  if (tel.activeSubject) lines.push(`- Active subject: ${tel.activeSubject}`)
  if (tel.currentTask) lines.push(`- Current task: ${tel.currentTask}`)
  if (tel.timer) lines.push(`- Focus timer: ${tel.timer}`)
  if (typeof tel.pendingCount === 'number') lines.push(`- Pending work: ${tel.pendingCount} assignment(s)`)
  if (Array.isArray(tel.upcoming) && tel.upcoming.length) lines.push(`- Nearest: ${tel.upcoming.join('; ')}`)
  if (typeof tel.focusStreak === 'number') lines.push(`- Focus streak: ${tel.focusStreak} day(s)`)
  if (typeof tel.focusMinutesToday === 'number') lines.push(`- Focused today: ${tel.focusMinutesToday} min`)
  if (typeof tel.xp === 'number') lines.push(`- Progress: ${tel.xp} XP${tel.level ? `, Level ${tel.level}` : ''}`)
  return lines.join('\n')
}

// AI Chat endpoint — mode-aware tutoring with telemetry injection
router.post('/chat', async (req, res) => {
  try {
    const { message, context, mode, telemetry } = req.body || {}

    if (!message) {
      return res.status(400).json({ error: 'Message is required' })
    }

    const assignments = context?.assignments || []
    const pendingAssignments = assignments.filter(a => a.status !== 'graded')
    const upcomingDeadlines = pendingAssignments
      .filter(a => a.dueDate)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5)
    const courseNames = [...new Set(assignments.map(a => a.courseName).filter(Boolean))]
    const subjectsText = courseNames.length > 0 ? courseNames.join(', ') : 'your courses'

    // Server-side telemetry fallback when the client didn't send a block.
    const telBlock = telemetry && Object.keys(telemetry).length > 0
      ? buildTelemetry(telemetry)
      : buildTelemetry({
          pendingCount: pendingAssignments.length,
          upcoming: upcomingDeadlines.map(a =>
            `"${a.title}" (${a.courseName || 'Unknown'}, due ${new Date(a.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`
          ),
          activeSubject: courseNames[0] || null,
        })

    const contract = MODE_CONTRACTS[mode] || MODE_CONTRACTS.hint
    const modeName = (mode === 'cbse' && 'CBSE Evaluator') || (mode === 'deep' && 'Deep Breakdown') || 'Diagnostic Hint'

    const model = await getGemini()
    if (model) {
      const systemContext = `You are StudyPulse's tutoring engine, currently in ${modeName}. The student is a Class 11-12 CBSE student.

${telBlock}

${contract}

Never produce marketing language, emojis, or filler.`

      try {
        const text = await callGemini(model, systemContext, message)
        const lowerMsg = message.toLowerCase()
        const wantsStudyPlan = (lowerMsg.includes('generate') || lowerMsg.includes('create')) &&
          (lowerMsg.includes('study') || lowerMsg.includes('plan') || lowerMsg.includes('schedule'))
        return res.json({
          message: text,
          mode: modeName,
          ...(wantsStudyPlan && pendingAssignments.length > 0 ? { shouldGeneratePlan: true } : {})
        })
      } catch (geminiErr) {
        console.warn('Gemini error, using fallback:', geminiErr.message)
      }
    }

    // Fallback rule-based responses when Gemini is unavailable
    const lowerMessage = message.toLowerCase()
    const gradedAssignments = assignments.filter(a => a.status === 'graded' && a.grade)
    let response = pendingAssignments.length > 0
      ? `${pendingAssignments.length} pending assignments across ${subjectsText}. Ask about deadlines, or run a mode query with an API key configured.`
      : 'No pending work on the board.'

    if (lowerMessage.includes('due') || lowerMessage.includes('deadline')) {
      response = upcomingDeadlines.length > 0
        ? `Upcoming deadlines:\n${upcomingDeadlines.map(a =>
            `- ${a.title} (${a.courseName || 'Unknown'}) — ${new Date(a.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
          ).join('\n')}`
        : 'No upcoming deadlines.'
    } else if (lowerMessage.includes('grade') || lowerMessage.includes('gpa')) {
      if (gradedAssignments.length > 0) {
        const avg = gradedAssignments.reduce((s, a) => s + (parseFloat(a.grade?.percentage) || 0), 0) / gradedAssignments.length
        response = `${gradedAssignments.length} graded assignments, average ${avg.toFixed(1)}%.`
      } else {
        response = 'No graded assignments yet.'
      }
    } else if (lowerMessage.includes('plan') || lowerMessage.includes('schedule')) {
      return res.json({
        message: `${pendingAssignments.length} assignments available to schedule. Run Generate Plan.`,
        shouldGeneratePlan: pendingAssignments.length > 0,
        planContext: { assignments: pendingAssignments, courses: courseNames, subjects: subjectsText }
      })
    }

    res.json({ message: response, mode: modeName })
  } catch (error) {
    console.error('AI chat error:', error)
    res.status(500).json({ error: 'Failed to process message' })
  }
})

// Generate AI study plan
router.post('/study-plan', async (req, res) => {
  try {
    const { assignments, preferences } = req.body

    const daysPerWeek = preferences?.daysPerWeek || 5
    const hoursPerDay = preferences?.hoursPerDay || 3
    const today = new Date()

    const pending = (assignments || [])
      .filter(a => a.status !== 'graded' && a.dueDate)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))

    // Try Gemini for study plan insight
    const model = await getGemini()
    let aiInsight = null
    if (model && pending.length > 0) {
      try {
        const prompt = `Student workload: ${pending.map(a =>
          `"${a.title}" (${a.courseName || 'Unknown'}) due ${new Date(a.dueDate).toLocaleDateString()}`
        ).join(', ')}. Capacity: ${daysPerWeek} days/week, ${hoursPerDay} hours/day. Give ONE specific scheduling recommendation in 1-2 sentences, referencing the actual deadlines. No generic advice.`
        aiInsight = await callGemini(model, 'You are a scheduling analyst. Concise, specific, no filler.', prompt)
      } catch (e) {
        // ignore gemini errors for study plan insight
      }
    }

    // Build sessions
    const sessions = []
    pending.forEach((assignment, index) => {
      const daysUntilDue = Math.ceil((new Date(assignment.dueDate) - today) / (1000 * 60 * 60 * 24))
      const numSessions = Math.min(Math.max(1, Math.ceil(daysUntilDue / 2)), 3)

      for (let i = 0; i < numSessions; i++) {
        const sessionDate = new Date(today)
        sessionDate.setDate(today.getDate() + (index * 2) + i)
        if (sessionDate <= new Date(assignment.dueDate)) {
          sessions.push({
            id: `session-${assignment.id}-${i}`,
            assignmentId: assignment.id,
            title: `Study: ${assignment.title || assignment.courseName || 'Review'}`,
            subject: assignment.courseName || 'General',
            date: sessionDate.toISOString(),
            duration: 45 + Math.round(Math.random() * 45),
            completed: false,
            aiGenerated: true
          })
        }
      }
    })

    res.json({
      plan: {
        generated: new Date().toISOString(),
        daysPerWeek,
        hoursPerDay,
        totalSessions: sessions.length,
        estimatedHours: +(sessions.reduce((s, x) => s + x.duration, 0) / 60).toFixed(1),
        aiInsight
      },
      sessions
    })
  } catch (error) {
    console.error('Study plan generation error:', error)
    res.status(500).json({ error: 'Failed to generate study plan' })
  }
})

// AI Flashcard Generation from notes
router.post('/flashcards', async (req, res) => {
  try {
    const { content, title } = req.body
    if (!content || content.trim().length < 20) {
      return res.status(400).json({ error: 'Note content too short to generate flashcards' })
    }

    const model = await getGemini()
    if (model) {
      const prompt = `From the following study notes, generate 5-10 high-quality flashcard question-answer pairs. Focus on key concepts, definitions, formulas, and important facts.

Notes title: ${title || 'Study Notes'}
Notes content:
${content.slice(0, 3000)}

Respond ONLY with a JSON array, no explanation. Format:
[{"front": "question here", "back": "answer here"}, ...]`

      try {
        const raw = await callGemini(model, 'You are a study flashcard generator. Output only valid JSON arrays.', prompt)
        const match = raw.match(/\[[\s\S]*\]/)
        if (!match) throw new Error('No JSON array in response')
        const cards = JSON.parse(match[0])
        if (!Array.isArray(cards) || cards.length === 0) throw new Error('Empty cards array')
        return res.json({ cards: cards.slice(0, 12) })
      } catch (e) {
        console.warn('Gemini flashcard parse error:', e.message)
      }
    }

    // Fallback: extract headings + bullet points as cards
    const lines = content.split('\n').filter(l => l.trim())
    const cards = []
    let lastHeading = null
    lines.forEach(line => {
      if (/^#{1,3}\s/.test(line)) {
        lastHeading = line.replace(/^#{1,3}\s/, '').trim()
      } else if (/^[-*]\s/.test(line) && lastHeading) {
        const point = line.replace(/^[-*]\s/, '').trim()
        if (point.length > 8) {
          cards.push({ front: `What is "${lastHeading}"?`, back: point })
        }
      }
    })
    res.json({ cards: cards.slice(0, 10) })
  } catch (error) {
    console.error('Flashcard generation error:', error)
    res.status(500).json({ error: 'Failed to generate flashcards' })
  }
})

export default router
