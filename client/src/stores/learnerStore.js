// Learner Memory store — per-concept CBSE mastery + misconception log.
// Persisted as 'studypulse-learner'. JSON export/import for backup.

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  computeLearnerTransition,
  newConceptState,
  selectDueItems,
  computeChapterReadiness,
  newMisconceptionId,
  fallbackDiagnosis,
  statusLabel,
  statusScore,
} from '../utils/learnerEngine'

const chapterKey = (subject, chapterId) => `${subject}::${chapterId}`

export const useLearnerStore = create(
  persist(
    (set, get) => ({
      chapters: {},            // "subject::chapterId" -> { subject, chapterId, chapterTitle, concepts: {name: state} }
      noticedMisconceptions: [],

      // Seed the four states for a chapter's concept list without
      // overwriting any existing progress.
      ensureChapter: (subject, chapterId, chapterTitle, conceptNames = []) => {
        const key = chapterKey(subject, chapterId)
        set((s) => {
          const ch = s.chapters[key] || {
            subject, chapterId, chapterTitle: chapterTitle || chapterId,
            concepts: {}, updatedAt: Date.now(),
          }
          const concepts = { ...ch.concepts }
          let changed = false
          for (const name of conceptNames) {
            if (!concepts[name]) { concepts[name] = newConceptState(); changed = true }
          }
          if (!s.chapters[key] || changed) {
            return { chapters: { ...s.chapters, [key]: { ...ch, concepts, updatedAt: Date.now() } } }
          }
          return s
        })
      },

      /**
       * Record one attempt with declared confidence. Applies the
       * confidence-weighted transition rules and logs a misconception
       * on slips. Returns { before, after } for the live state banner.
       */
      recordQuizAttempt: ({
        subject, chapterId, chapterTitle, conceptName,
        correct, confidence,
        questionText = '', chosenAnswer = '', correctAnswer = '',
        diagnostic = null,
      }) => {
        const key = chapterKey(subject, chapterId)
        const state = get()
        const ch = state.chapters[key] || {
          subject, chapterId, chapterTitle: chapterTitle || chapterId, concepts: {},
        }
        const prev = ch.concepts[conceptName] || newConceptState()
        const transition = computeLearnerTransition(prev, { correct, confidence })
        const after = {
          ...prev,
          ...transition,
          attempts: prev.attempts + 1,
          lastConfidence: confidence || null,
          slipCount: prev.slipCount + (correct ? 0 : 1),
          updatedAt: Date.now(),
        }

        set((s) => ({
          chapters: {
            ...s.chapters,
            [key]: { ...ch, chapterTitle: chapterTitle || ch.chapterTitle, concepts: { ...ch.concepts, [conceptName]: after }, updatedAt: Date.now() },
          },
          ...(after.status === 'needs_attention'
            ? {
                noticedMisconceptions: [
                  {
                    id: newMisconceptionId(),
                    subject,
                    chapterId,
                    chapterTitle: chapterTitle || ch.chapterTitle,
                    conceptName,
                    ...(diagnostic || fallbackDiagnosis({ questionText, chosenAnswer, correctAnswer, conceptName })),
                    timestamp: Date.now(),
                    resolved: false,
                    dismissed: false,
                  },
                  ...s.noticedMisconceptions,
                ].slice(0, 100),
              }
            : {}),
        }))

        return { before: prev, after }
      },

      // Log a misconception directly (SQL Pulse trap catches, etc.)
      logMisconception: ({ subject, chapterId, chapterTitle, conceptName, exactSlipDescription, correctiveRule }) => {
        set((s) => ({
          noticedMisconceptions: [
            {
              id: newMisconceptionId(),
              subject, chapterId, chapterTitle, conceptName,
              exactSlipDescription, correctiveRule,
              timestamp: Date.now(),
              resolved: false,
              dismissed: false,
            },
            ...s.noticedMisconceptions,
          ].slice(0, 100),
        }))
      },

      markMisconceptionResolved: (id) => set((s) => ({
        noticedMisconceptions: s.noticedMisconceptions.map((m) => (m.id === id ? { ...m, resolved: true, resolvedAt: Date.now() } : m)),
      })),

      // "This isn't right" — the student disagrees with the diagnosis.
      dismissMisconception: (id) => set((s) => ({
        noticedMisconceptions: s.noticedMisconceptions.map((m) => (m.id === id ? { ...m, dismissed: true, dismissedAt: Date.now() } : m)),
      })),

      getDueRefreshItems: () => selectDueItems(get().chapters),

      getNoticed: () => get().noticedMisconceptions.filter((m) => !m.resolved && !m.dismissed),

      getChapterState: (subject, chapterId) =>
        get().chapters[chapterKey(subject, chapterId)] || null,

      getChapterReadiness: (subject, chapterId) => {
        const ch = get().chapters[chapterKey(subject, chapterId)]
        return ch ? computeChapterReadiness(ch.concepts) : 0
      },

      getConceptState: (subject, chapterId, conceptName) => {
        const ch = get().chapters[chapterKey(subject, chapterId)]
        return ch?.concepts?.[conceptName] || null
      },

      resetLearnerMemory: () => set({ chapters: {}, noticedMisconceptions: [] }),

      // JSON backup / restore
      exportLearnerMemory: () => JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), chapters: get().chapters, noticedMisconceptions: get().noticedMisconceptions }),
      importLearnerMemory: (json) => {
        try {
          const parsed = typeof json === 'string' ? JSON.parse(json) : json
          if (!parsed || typeof parsed !== 'object') return false
          set((s) => ({
            chapters: parsed.chapters || s.chapters,
            noticedMisconceptions: parsed.noticedMisconceptions || s.noticedMisconceptions,
          }))
          return true
        } catch {
          return false
        }
      },
    }),
    { name: 'studypulse-learner' }
  )
)

export { statusLabel, statusScore, computeChapterReadiness }
