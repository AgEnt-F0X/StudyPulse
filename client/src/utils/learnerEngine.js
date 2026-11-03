// Learner Memory engine — pure, dependency-free transition rules.
// "A lucky guess never counts": state transitions are weighted by the
// student's declared confidence, and every incorrect answer demotes the
// concept immediately. Used by the learner store, Quiz Me, the SQL Pulse
// grader and the exam planner.

export const CONCEPT_STATUSES = ['not_checked', 'needs_attention', 'developing', 'mastered']

export const CONFIDENCE_LEVELS = [
  { id: 'guessed', label: 'Guessed' },
  { id: 'unsure', label: 'Unsure' },
  { id: 'fairly_sure', label: 'Fairly sure' },
  { id: 'certain', label: 'Certain' },
]

export const STATUS_META = {
  not_checked: { label: 'Not checked', dot: 'neutral', score: 0 },
  needs_attention: { label: 'Needs attention', dot: 'error', score: 0 },
  developing: { label: 'Developing', dot: 'warning', score: 50 },
  mastered: { label: 'Mastered', dot: 'success', score: 100 },
}

export const statusLabel = (s) => STATUS_META[s]?.label || s
export const statusDot = (s) => STATUS_META[s]?.dot || 'neutral'
export const statusScore = (s) => STATUS_META[s]?.score ?? 0

export function newConceptState() {
  return {
    status: 'not_checked',
    attempts: 0,
    lastConfidence: null,
    slipCount: 0,
    luckyGuess: false,
    nextReviewDue: null,
    updatedAt: null,
  }
}

const DAY = 86400000

/**
 * Confidence-weighted state transition.
 * @param {object} prev  previous concept state (or newConceptState())
 * @param {{ correct: boolean, confidence: string }} attempt
 * @returns {{ status, nextReviewDue, luckyGuess, slipped }}
 */
export function computeLearnerTransition(prev, { correct, confidence }) {
  const now = Date.now()
  const conf = confidence || 'unsure'

  // Correct + confident — real mastery signal
  if (correct && (conf === 'fairly_sure' || conf === 'certain')) {
    if (prev.status === 'developing') {
      return { status: 'mastered', nextReviewDue: new Date(now + 7 * DAY).toISOString(), luckyGuess: false, slipped: false }
    }
    if (prev.status === 'mastered') {
      return { status: 'mastered', nextReviewDue: new Date(now + 14 * DAY).toISOString(), luckyGuess: false, slipped: false }
    }
    // not_checked or needs_attention → developing, review in +2 days
    return { status: 'developing', nextReviewDue: new Date(now + 2 * DAY).toISOString(), luckyGuess: false, slipped: false }
  }

  // Correct but low confidence — NEVER counts as mastery
  if (correct) {
    return { status: 'developing', nextReviewDue: new Date(now + DAY).toISOString(), luckyGuess: true, slipped: false }
  }

  // Incorrect (any confidence, especially fairly_sure / certain) — immediate demotion
  return { status: 'needs_attention', nextReviewDue: new Date(now).toISOString(), luckyGuess: false, slipped: true }
}

/** Chapter readiness % — strictly from verified concept states. */
export function computeChapterReadiness(concepts) {
  const list = Object.values(concepts || {})
  if (list.length === 0) return 0
  const total = list.reduce((sum, c) => sum + statusScore(c.status), 0)
  return Math.round(total / list.length)
}

export function readinessBand(pct) {
  if (pct >= 75) return { label: 'On track', dot: 'success' }
  if (pct >= 40) return { label: 'Getting there', dot: 'warning' }
  return { label: 'At Risk', dot: 'error' }
}

/** Concepts due for a refresh right now (spaced recall), soonest first. */
export function selectDueItems(chapters, now = Date.now()) {
  const due = []
  for (const [key, ch] of Object.entries(chapters || {})) {
    for (const [conceptName, c] of Object.entries(ch.concepts || {})) {
      if (c.status === 'not_checked') continue
      if (c.nextReviewDue && new Date(c.nextReviewDue).getTime() <= now) {
        due.push({
          key,
          subject: ch.subject,
          chapterId: ch.chapterId,
          chapterTitle: ch.chapterTitle,
          conceptName,
          status: c.status,
          attempts: c.attempts,
          nextReviewDue: c.nextReviewDue,
        })
      }
    }
  }
  due.sort((a, b) => new Date(a.nextReviewDue) - new Date(b.nextReviewDue))
  return due
}

export function newMisconceptionId() {
  return `mis-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
}

/** Deterministic fallback diagnostic when the AI service is unavailable. */
export function fallbackDiagnosis({ questionText, chosenAnswer, correctAnswer, conceptName }) {
  const q = (questionText || '').trim()
  const excerpt = q.length > 110 ? `${q.slice(0, 110)}…` : q
  return {
    exactSlipDescription: chosenAnswer
      ? `On "${excerpt || conceptName}" you answered "${chosenAnswer}" — the correct answer is "${correctAnswer}".`
      : `Slipped on "${conceptName}".${excerpt ? ` Question: "${excerpt}"` : ''}`,
    correctiveRule: `Re-derive "${conceptName}" from the NCERT definition, then redo this exact question before moving on.`,
  }
}
