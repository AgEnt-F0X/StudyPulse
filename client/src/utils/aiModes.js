// StudyPulse Tutoring Engine — deterministic pedagogical modes.
//
// Three system prompts, each with a fixed behavioral contract. Every request
// injects a live telemetry block built from the Zustand stores so the tutor
// reasons over the student's actual session state (timer, streak, workload)
// instead of chatting in a vacuum.

import {
  usePomodoroStore,
  useAssignmentsStore,
  useHabitsStore,
  useXPStore,
  useAuthStore,
} from '../stores'
import { calcStreak } from '../stores'

// ── Mode registry ─────────────────────────────────────────────

export const AI_MODES = {
  hint: {
    id: 'hint',
    label: 'Diagnostic Hint',
    short: 'HINT',
    description: 'Finds the exact flaw, asks the guiding question. Never reveals the answer.',
    status: 'default',
    buildSystem: (tel) => `You are StudyPulse's Diagnostic Hint tutor for a Class 11 CBSE student.

${tel}

OPERATING CONTRACT (Diagnostic Hint Mode — non-negotiable):
1. Analyze the student's current problem, derivation, code, or query. Identify the SINGLE most consequential flaw — logical, syntactical, or conceptual. If there is no flaw, identify the weakest assumption in their approach.
2. NEVER give the final answer, the completed formula, the corrected code, or the worked solution. Partial hints at the mechanism level are allowed; results are not.
3. Reference their live telemetry when relevant (e.g. "your focus timer just started — one clean derivation before the break").
4. End your reply with EXACTLY ONE targeted guiding question that, once answered, lets the student fix the flaw themselves. Format it on its own line, prefixed with "GUIDING: ".
5. Maximum 120 words. No preamble, no pleasantries, no restating the question.
6. Format: one short diagnosis paragraph, optionally one code/math snippet demonstrating the flaw pattern (never the fix), then the GUIDING line.`,
  },
  cbse: {
    id: 'cbse',
    label: 'CBSE Evaluator',
    short: 'CBSE',
    description: 'Strict marking-scheme grading: step marks, keyword checks, board traps.',
    status: 'default',
    buildSystem: (tel) => `You are a CBSE Class 12 board examiner operating inside StudyPulse. You grade against the official marking scheme, without encouragement padding.

${tel}

OPERATING CONTRACT (CBSE Evaluator Mode — non-negotiable):
1. Grade the student's answer STRICTLY against the CBSE marking scheme for the question's subject. Default weight: 1 mark per valid step/point unless the standard scheme says otherwise.
2. Output EXACTLY this structure:
   MARKS: <earned>/<total>
   STEP BREAKDOWN:
   - <step or keyword> — <✓ awarded X M | ✗ missing/incorrect — what the scheme expects>
   KEYWORD CHECKS:
   - <required NCERT keyword/term> — <present | absent | paraphrased-unacceptable>
   BOARD TRAPS: <1-2 lines: the common mistakes examiners penalize on THIS question type>
   VERDICT: <one line: what to add to reach full marks>
3. Keyword checks must reference NCERT terminology — a paraphrase that a board examiner would reject counts as absent.
4. Be strict: half-right steps get half marks only when step-marking explicitly applies. Never inflate.
5. Maximum 250 words. No motivational language.`,
  },
  deep: {
    id: 'deep',
    label: 'Deep Breakdown',
    short: 'DEEP',
    description: 'Concept from first principles: execution trace + edge-case comparison.',
    status: 'default',
    buildSystem: (tel) => `You are StudyPulse's Deep Breakdown tutor for a Class 11 CBSE student. You teach mechanism, not trivia.

${tel}

OPERATING CONTRACT (Deep Breakdown Mode — non-negotiable):
1. Explain the underlying concept from first principles for the student's specific question.
2. When the question involves a procedure, formula, or code, include an EXECUTION TRACE: a numbered, line-by-line walkthrough showing the state of every relevant variable/term after each step. Format as a fenced code block (language tag: trace) or a numbered list, whichever is clearer.
3. Include an EDGE-CASE COMPARISON: contrast correct vs incorrect application on at least two concrete edge cases (boundary values, degenerate inputs, sign/unit traps).
4. Close with ONE invariant — a single sentence the student can test any future answer against, prefixed with "INVARIANT: ".
5. Maximum 300 words. Use fenced code blocks with a language tag for anything runnable or mathematical. No filler.`,
  },
}

export const DEFAULT_MODE = 'hint'
export const MODE_IDS = Object.keys(AI_MODES)

export function isModeId(id) {
  return !!AI_MODES[id]
}

// ── Live telemetry injection ──────────────────────────────────
// Reads the current Zustand state (not hooks — safe inside async callers).

const fmtClock = (secs) => `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(Math.floor(secs % 60)).padStart(2, '0')}`

export function buildTelemetryContext() {
  let line = []
  try {
    const pom = usePomodoroStore.getState()
    const asg = useAssignmentsStore.getState()
    const hab = useHabitsStore.getState()
    const xp = useXPStore.getState()
    const auth = useAuthStore.getState()

    const timerState = !pom.isRunning
      ? 'idle'
      : `${pom.isBreak ? 'break' : 'focus'} running, ${fmtClock(pom.secondsLeft)} left (session ${pom.sessionCount + 1})`
    const todayKey = new Date().toISOString().split('T')[0]
    const focusToday = pom.dailyFocusLog?.[todayKey] || 0
    const focusStreak = calcStreak(pom.dailyFocusLog || {})
    const habitStreak = (hab.habits || []).reduce((m, h) => Math.max(m, h.streak || 0), 0)

    const pending = (asg.assignments || []).filter(a => !a.completed && a.status !== 'graded')
    const upcoming = pending
      .filter(a => a.dueDate)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 4)
      .map(a => {
        const days = Math.ceil((new Date(a.dueDate) - new Date()) / 86400000)
        return `"${a.title}" (${a.courseName || a.course || 'General'}, due in ${days <= 0 ? 0 : days}d)`
      })

    const activeTask = pom.activeAssignment && typeof pom.activeAssignment === 'object'
      ? pom.activeAssignment
      : upcoming.length ? { title: upcoming[0].title, courseName: upcoming[0].courseName } : null

    line = [
      `STUDENT TELEMETRY (live, from StudyPulse session):`,
      `- Student: ${auth.user?.name || 'Student'}${auth.isDemo ? ' (demo mode)' : ''}`,
      `- Active subject: ${activeTask?.courseName || activeTask?.course || 'unspecified'}`,
      `- Current task: ${activeTask?.title || 'none selected'}`,
      `- Focus timer: ${timerState}; ${focusToday} min focused today; focus streak ${focusStreak} day(s); ${pom.totalFocusMinutes} min all-time`,
      `- Pending work: ${pending.length} assignment(s)${upcoming.length ? ` — nearest: ${upcoming.join('; ')}` : ''}`,
      `- Habit streak (best): ${habitStreak} day(s)`,
      `- Progress: Level ${xp.getProgress().cur?.level || 1}, ${xp.xp || 0} XP`,
    ]
  } catch {
    line = ['STUDENT TELEMETRY: unavailable (stores not hydrated)']
  }
  return line.join('\n')
}

// ── Prompt assembly ───────────────────────────────────────────

export function buildTutorRequest(modeId, userText, { telemetry } = {}) {
  const mode = AI_MODES[modeId] || AI_MODES[DEFAULT_MODE]
  const tel = telemetry !== undefined ? telemetry : buildTelemetryContext()
  const system = mode.buildSystem(tel)

  // "Run Query" — the student executes a snippet through the current mode
  const isRun = typeof userText === 'string' && userText.startsWith('/run ')
  const text = isRun
    ? `Execute and analyze this through your operating contract. Treat the following as the student's attempt/query:\n\n${userText.slice(5)}`
    : userText

  return { mode, system, text, telemetry: tel }
}

// Parser for structured segments the modes emit (GUIDING / INVARIANT lines)
// so the UI can pin them instead of burying them in prose.
export function extractStructured(content) {
  if (!content || typeof content !== 'string') return { body: content, pinned: [] }
  const pinned = []
  let body = content

  const guiding = body.match(/^GUIDING:\s*(.+)$/m)
  if (guiding) {
    pinned.push({ kind: 'guiding', text: guiding[1].trim() })
    body = body.replace(guiding[0], '').trim()
  }
  const invariant = body.match(/^INVARIANT:\s*(.+)$/m)
  if (invariant) {
    pinned.push({ kind: 'invariant', text: invariant[1].trim() })
    body = body.replace(invariant[0], '').trim()
  }
  const marks = body.match(/^MARKS:\s*([^\n]+)$/m)
  if (marks) {
    pinned.push({ kind: 'marks', text: marks[1].trim() })
    // Keep MARKS in body too — the evaluator's breakdown references it.
  }
  return { body, pinned }
}
