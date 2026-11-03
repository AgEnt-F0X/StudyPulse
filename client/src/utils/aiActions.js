import { callGeminiClient, callGeminiWithMeta } from './gemini'
import { buildTutorRequest } from './aiModes'

const CBSE_SUBJECTS = [
  'Physics', 'Chemistry', 'Mathematics', 'Maths', 'Biology', 'English',
  'English Core', 'Computer Science', 'Informatics Practices', 'Physical Education',
  'Accountancy', 'Business Studies', 'Economics', 'History', 'Political Science',
  'Geography', 'Sociology', 'Psychology'
]

export function parseNaturalDate(dateStr) {
  const now = new Date()
  if (!dateStr || typeof dateStr !== 'string') {
    return new Date(now.getTime() + 3 * 86400000).toISOString()
  }

  const s = dateStr.toLowerCase().trim()
  if (s.includes('today')) return now.toISOString()
  if (s.includes('tomorrow')) return new Date(now.getTime() + 86400000).toISOString()

  const inDaysMatch = s.match(/in\s+(\d+)\s+days?/)
  if (inDaysMatch) {
    return new Date(now.getTime() + parseInt(inDaysMatch[1], 10) * 86400000).toISOString()
  }

  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  for (let i = 0; i < days.length; i++) {
    if (s.includes(days[i])) {
      const currentDay = now.getDay()
      let diff = i - currentDay
      if (diff <= 0) diff += 7
      return new Date(now.getTime() + diff * 86400000).toISOString()
    }
  }

  // Remove ordinal suffixes (4th, 1st, 2nd, 3rd) -> "4 september 2026"
  const cleaned = s.replace(/(\d+)(st|nd|rd|th)/gi, '$1')
  const timestamp = Date.parse(cleaned)
  if (!isNaN(timestamp)) {
    const d = new Date(timestamp)
    if (!cleaned.match(/\d{4}/) && d < now) {
      d.setFullYear(now.getFullYear() + 1)
    }
    return d.toISOString()
  }

  return new Date(now.getTime() + 3 * 86400000).toISOString()
}

export function detectSubject(text) {
  if (!text) return 'General'
  for (const sub of CBSE_SUBJECTS) {
    const regex = new RegExp(`\\b${sub}\\b`, 'i')
    if (regex.test(text)) {
      if (sub.toLowerCase() === 'maths') return 'Mathematics'
      return sub
    }
  }
  return 'General'
}

export function parseAssignmentIntent(text) {
  const textLower = text.toLowerCase()
  const isAssignment =
    /(?:add|create|new|schedule|make|remind me to)(?:\s+(?:an|a|the))?\s+assignment/i.test(text) ||
    /^(?:assignment|task|homework)\s*:/i.test(text) ||
    /(?:assignment|homework|submission|notebook|project)\s+(?:due|on|by)/i.test(text)

  if (!isAssignment) return null

  // Remove command prefixes
  let cleaned = text
    .replace(/^(?:please\s+)?(?:can you\s+)?(?:add|create|make|schedule|put|insert)(?:\s+(?:an|a|the))?\s+assignment\s*:?/i, '')
    .replace(/^(?:assignment|task|homework)\s*:\s*/i, '')
    .trim()

  // Extract date part (e.g. "on 4 september 2026", "due tomorrow", "by Friday")
  let dueDate = null
  const dateRegex = /(?:due(?:\s+on|\s+by|\s+date)?|on|by|before)\s+([0-9]{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+(?:\s+\d{4})?|[A-Za-z]+\s+[0-9]{1,2}(?:st|nd|rd|th)?(?:\s+\d{4})?|tomorrow|today|next\s+\w+|\w+day|in\s+\d+\s+days?|\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i
  const dateMatch = cleaned.match(dateRegex)

  if (dateMatch) {
    dueDate = parseNaturalDate(dateMatch[1])
    cleaned = cleaned.replace(dateMatch[0], '').trim()
  } else {
    dueDate = parseNaturalDate(null)
  }

  // Detect subject
  const subject = detectSubject(text)

  // Clean title: remove trailing punctuation or quotes
  let title = cleaned.replace(/^[:\-\s]+|[:\-\s]+$/g, '').trim()
  if (!title) title = `${subject} Assignment`

  return {
    title,
    course: subject,
    dueDate,
  }
}

// ── Tutor-intent routing ──────────────────────────────────────
// Evaluate / solve intents run through the deterministic mode engine with
// live telemetry. Returns a meta result so callers can render retry states.

export async function runTutorIntent(userText, intent, modeId) {
  const { system, text } = buildTutorRequest(modeId, userText)
  const subject = detectSubject(userText)
  const result = await callGeminiWithMeta(text, { system, timeoutMs: 20000 })
  if (result.ok) {
    return {
      replyText: result.text,
      actionCard: { type: intent, subject },
      meta: { mode: modeId },
    }
  }
  return {
    replyText: null,
    error: result.error === 'no_key'
      ? 'NO_KEY'
      : result.rateLimited
        ? 'RATE_LIMITED'
        : result.error === 'timeout'
          ? 'TIMEOUT'
          : 'FAILED',
    actionCard: { type: intent, subject },
  }
}

export async function executeAIAssistantCommand(userText, stores, hasKey, modeId = 'hint') {
  const { addAssignment, addNote, addDeck, addCard, addStudyPlan, assignments } = stores
  const textLower = userText.toLowerCase()

  // Evaluate Answer Intent → CBSE Evaluator mode (strict, telemetry-aware)
  const isEvaluate = /(?:evaluate|check|grade|mark|rate|review)\s+(?:my|this|the)?\s*answer/i.test(userText)
  if (isEvaluate) {
    if (!hasKey) {
      return { replyText: 'CBSE evaluation needs an AI key. Add one in **Settings** → AI Engine, then retry.' }
    }
    const answerText = userText.replace(/(?:please\s+)?(?:evaluate|check|grade|mark|rate|review)\s+(?:my|this|the)?\s*answer\s*:?/i, '').trim()
    if (!answerText) {
      return { replyText: 'Provide the answer to grade. Format: **"Evaluate my answer: [your answer]"**' }
    }
    return runTutorIntent(
      `Question subject: ${detectSubject(userText)}\n\nStudent's answer to grade:\n${answerText}`,
      'evaluation',
      'cbse'
    )
  }

  // Doubt Solver Intent → Deep Breakdown mode (execution trace + edge cases)
  const isDoubt = /(?:solve|derive|prove\s+that|explain\s+(?:how|why|what)|what\s+is|why\s+does|how\s+(?:does|do|to|can)|find\s+the|calculate|doubt|step[\s-]*by[\s-]*step)/i.test(textLower)
  if (isDoubt && hasKey) {
    return runTutorIntent(userText, 'solution', 'deep')
  }

  // 1. Direct Assignment Intent (deterministic — no model round-trip)
  const assignmentData = parseAssignmentIntent(userText)
  if (assignmentData) {
    const newId = Date.now().toString()
    addAssignment({
      id: newId,
      title: assignmentData.title,
      course: assignmentData.course,
      courseName: assignmentData.course,
      dueDate: assignmentData.dueDate,
      status: 'pending',
      priority: 'medium',
      completed: false,
      createdAt: new Date().toISOString()
    })

    const formattedDate = new Date(assignmentData.dueDate).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    })

    return {
      replyText: `Added **"${assignmentData.title}"** — ${assignmentData.course}, due ${formattedDate}.`,
      actionCard: {
        type: 'assignment',
        title: assignmentData.title,
        course: assignmentData.course,
        dueDate: formattedDate,
      }
    }
  }

  // 2. Structured LLM action protocol (flashcards / summary / study plan)
  if (hasKey) {
    try {
      const pendingList = (assignments || []).map(a => `- ${a.title} (${a.courseName || a.course})`).slice(0, 8).join('\n')
      const systemPrompt = `You are StudyPulse's task agent — a CBSE study assistant with tool-execution capabilities.
Student pending assignments:
${pendingList}

User message: ${userText}

If the user wants to add an assignment, return a JSON block:
{"action":"add_assignment","title":"...","course":"Physics|Chemistry|Mathematics|Biology|English|General","dueDate":"YYYY-MM-DD","reply":"..."}

If the user wants a summary:
{"action":"summary","title":"...","summary":"...","reply":"..."}

If the user wants flashcards:
{"action":"flashcards","topic":"...","cards":[{"front":"...","back":"..."},...],"reply":"..."}

If the user wants a study plan:
{"action":"study_plan","subject":"...","weeks":[{"week":1,"topic":"...","tasks":["..."]}],"reply":"..."}

If general query/explanation, return clear markdown text.`

      const text = await callGeminiClient(systemPrompt, { timeoutMs: 7000 })
      if (text) {
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0])
            if (parsed.action === 'add_assignment' && parsed.title) {
              const due = parseNaturalDate(parsed.dueDate)
              addAssignment({
                id: Date.now().toString(),
                title: parsed.title,
                course: parsed.course || 'General',
                courseName: parsed.course || 'General',
                dueDate: due,
                status: 'pending',
                priority: 'medium',
                completed: false,
                createdAt: new Date().toISOString()
              })
              return {
                replyText: parsed.reply || `Added assignment "${parsed.title}" for ${parsed.course}.`,
                actionCard: {
                  type: 'assignment',
                  title: parsed.title,
                  course: parsed.course,
                  dueDate: new Date(due).toLocaleDateString()
                }
              }
            }

            if (parsed.action === 'summary' && parsed.summary) {
              return {
                replyText: parsed.summary,
                actionCard: {
                  type: 'save_note',
                  title: parsed.title || 'Study Summary',
                  content: parsed.summary
                }
              }
            }

            if (parsed.action === 'flashcards' && Array.isArray(parsed.cards)) {
              return {
                replyText: parsed.reply || `Generated ${parsed.cards.length} flashcards for ${parsed.topic || 'your topic'}.`,
                actionCard: {
                  type: 'save_flashcards',
                  topic: parsed.topic || 'AI Flashcards',
                  cards: parsed.cards
                }
              }
            }
          } catch {}
        }
        return { replyText: text }
      }
    } catch (e) {
      console.warn('Gemini command error, falling back', e)
    }
  }

  // 3. Fallback heuristics for summaries, quizzes, flashcards & plans
  if (textLower.includes('summar') || textLower.includes('notes on')) {
    const topic = userText.replace(/summarize|summary of|this text|for cbse|notes on|:/gi, '').trim() || 'Topic Notes'
    const summary = `# Summary & Key Concepts: ${topic}\n\n## 1. Core Principles\n• Key definitions and fundamental theoretical laws in the NCERT syllabus.\n• Important boundary conditions and underlying assumptions.\n\n## 2. Essential Formulas & SI Units\n• Primary equations and mathematical expressions.\n• Constants and standard conversion factors.\n\n## 3. Board Exam Notes\n• Step presentation: state formula, show substitution with units, box the final answer.\n• High-frequency 3-mark & 5-mark conceptual derivations.`
    return {
      replyText: summary,
      actionCard: {
        type: 'save_note',
        title: topic.slice(0, 32),
        content: summary
      }
    }
  }

  if (textLower.includes('quiz') || textLower.includes('test me')) {
    const topic = userText.replace(/generate a|5-question|quiz on|test me on|:/gi, '').trim() || 'Science Concepts'
    const quizContent = `Here is a quiz on **${topic}**:\n\n**1. What is the fundamental principle of this concept?**\n(A) Conservation laws & empirical relations\n(B) Random variation\n(C) Arbitrary definitions\n(D) None of the above\n*Answer: (A)*\n\n**2. Which SI unit applies to standard physical calculations?**\n(A) Standard SI (MKS) units\n(B) CGS units only\n(C) Imperial units\n(D) Non-standard units\n*Answer: (A)*\n\n**3. In board numericals, full marks are awarded when:**\n(A) Formula, substitution with units, and step calculation are shown\n(B) Only the final number is written\n(C) Calculations are done mentally\n(D) Units are omitted\n*Answer: (A)*\n\n**4. Which type of bond involves sharing of valence electrons?**\n(A) Covalent bond\n(B) Ionic bond\n(C) Metallic bond\n(D) Hydrogen bond only\n*Answer: (A)*\n\n**5. What is the key strategy for complex derivations?**\n(A) Draw labeled diagram, state assumptions, derive step-by-step\n(B) Memorize without diagram\n(C) Skip intermediate algebraic steps\n(D) Only write the final equation\n*Answer: (A)*`
    return { replyText: quizContent }
  }

  if (textLower.includes('flashcard')) {
    const topic = userText.replace(/create flashcards for|make flashcards on|generate flashcards for|flashcards on|:/gi, '').trim() || 'Key Concepts'
    return {
      replyText: `Three flashcards for **${topic}**:\n\n**Q1:** What is the primary definition?\n**A1:** The fundamental law or principle governing this phenomenon according to NCERT.\n\n**Q2:** State the primary equation and SI units.\n**A2:** Standard formula relating variables with standard units.\n\n**Q3:** What is a critical board exam note?\n**A3:** State given parameters, substitute step-by-step, and box the final answer.`,
      actionCard: {
        type: 'save_flashcards',
        topic,
        cards: [
          { front: `What is the core definition of ${topic}?`, back: 'Fundamental law or principle from the NCERT syllabus.' },
          { front: `State the primary formula for ${topic}`, back: 'Standard formula with appropriate SI units.' },
          { front: `Key board exam application for ${topic}`, back: 'State given variables, substitute step-by-step, and box the final answer.' }
        ]
      }
    }
  }

  if (textLower.includes('plan') || textLower.includes('schedule')) {
    const subject = userText.replace(/create a study plan for|build a study plan for|study plan for|:/gi, '').trim() || 'Physics'
    addStudyPlan({
      id: Date.now().toString(),
      subject,
      weeks: [
        { week: 1, topic: 'NCERT Theory & Basic Concepts', tasks: ['Read NCERT Chapters 1-2', 'Prepare Formula Sheet', 'Solve Examples'] },
        { week: 2, topic: 'Exercise Numericals & Derivations', tasks: ['Back Exercises', 'Diagram Practice', 'Doubt Clearing'] },
        { week: 3, topic: 'NCERT Exemplar & Advanced Questions', tasks: ['Exemplar Problems', 'Chapter Summary', '30-min Chapter Quiz'] },
        { week: 4, topic: 'PYQs & Full Mock Exam', tasks: ['5-Year PYQs', 'Timed 3-hour Mock Test', 'Final Review'] },
      ],
      createdAt: Date.now()
    })
    return {
      replyText: `Created a **4-week study plan for ${subject}**. Track weekly progress in Study Plans.`,
      actionCard: { type: 'study_plan', subject }
    }
  }

  // Default conversational response
  return {
    replyText: `Available commands:\n• Add assignment: *"Add assignment: Physics notebook due Friday"*\n• Summarize: *"Summarize this text: [paste]"*\n• Quiz: *"Generate a quiz on Chemical Bonding"*\n• Flashcards: *"Create flashcards for Kinematics"*\n• Study plan: *"Build a 4-week study plan for Mathematics"*`
  }
}
