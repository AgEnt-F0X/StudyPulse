// SQL Pulse progress store — persisted separately from the main stores so
// campaign state survives reloads. XP awards flow into the main useXPStore
// and study time flows into the Pomodoro store's dailyFocusLog, which is
// what the Home / Analytics dashboards already read.

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { MISSIONS, WORLDS } from '../data/sqlMissions'
import { useXPStore, usePomodoroStore, useLearnerStore } from './index'

const todayKey = () => new Date().toISOString().split('T')[0]

// SQL trap → Learner Memory concept + corrective rule
const SQL_TRAP_RULES = {
  'null-eq': {
    concept: '= NULL instead of IS NULL',
    rule: 'NULL means unknown — no comparison operator ever matches it. Filter with IS NULL / IS NOT NULL.',
  },
  'agg-in-where': {
    concept: 'Aggregate in WHERE instead of HAVING',
    rule: 'WHERE filters rows BEFORE grouping; aggregates are only valid after GROUP BY, filtered with HAVING.',
  },
  'ddl-dml': {
    concept: 'DML used for a structure change',
    rule: 'INSERT/UPDATE/DELETE change DATA; ALTER TABLE and DROP TABLE change STRUCTURE.',
  },
  'dml-ddl': {
    concept: 'DDL used for a data change',
    rule: 'ALTER/DROP change the schema; to change stored rows use INSERT / UPDATE / DELETE.',
  },
  'count-star-only': {
    concept: 'COUNT(*) vs COUNT(column) confusion',
    rule: 'COUNT(*) counts every row including NULLs; COUNT(col) counts only non-NULL values.',
  },
}

/** Missions completed per world → 0-100 mastery percentage. */
export function worldMastery(completed, worldId) {
  const total = MISSIONS.filter((m) => m.world === worldId).length || 1
  const done = MISSIONS.filter((m) => m.world === worldId && completed[m.id]?.completedAt).length
  return Math.round((done / total) * 100)
}

/** Overall campaign completion percentage. */
export function campaignProgress(completed) {
  const done = MISSIONS.filter((m) => completed[m.id]?.completedAt).length
  return Math.round((done / MISSIONS.length) * 100)
}

export function worldTitle(worldId) {
  return WORLDS.find((w) => w.id === worldId)?.title || `World ${worldId}`
}

export const useSqlPulseStore = create(
  persist(
    (set, get) => ({
      completed: {},   // missionId -> { attempts, completedAt, xp }
      attempts: {},    // missionId -> attempt count (failed runs included)
      totalXp: 0,

      recordAttempt: (missionId) => {
        set((s) => ({ attempts: { ...s.attempts, [missionId]: (s.attempts[missionId] || 0) + 1 } }))
        set((s) => ({
          completed: s.completed[missionId]
            ? s.completed
            : { ...s.completed, [missionId]: { attempts: s.attempts[missionId] || 0, completedAt: null, xp: 0 } },
        }))
      },

      /** Awards XP (first completion only) and returns { already, xp } */
      completeMission: (missionId, xp) => {
        if (get().completed[missionId]?.completedAt) return { already: true, xp: 0 }
        set((s) => ({
          completed: {
            ...s.completed,
            [missionId]: { attempts: s.attempts[missionId] || 0, completedAt: Date.now(), xp },
          },
          totalXp: s.totalXp + xp,
        }))
        try { useXPStore.getState().addXP(xp) } catch { /* XP store unavailable */ }
        return { already: false, xp }
      },

      /** Logs SQL study minutes into the main telemetry (dailyFocusLog). */
      logFocusMinutes: (minutes) => {
        const m = Math.max(0, Math.floor(minutes))
        if (m <= 0) return
        try {
          const pom = usePomodoroStore.getState()
          const key = todayKey()
          usePomodoroStore.setState({
            dailyFocusLog: { ...pom.dailyFocusLog, [key]: (pom.dailyFocusLog?.[key] || 0) + m },
          })
        } catch { /* telemetry unavailable */ }
      },

      /**
       * Feed a SQL mission attempt into the Learner Memory store.
       * Grader traps become exact misconceptions in "What StudyPulse
       * noticed" so they surface on the Home refresh queue.
       */
      logSqlOutcome: ({ mission, grade, confidence }) => {
        if (!mission || !grade) return
        try {
          const learner = useLearnerStore.getState()
          const payload = {
            subject: 'Computer Science',
            chapterId: 'cs11-mysql-ddl',
            chapterTitle: 'MySQL (SQL Pulse)',
            confidence: confidence || 'fairly_sure',
          }
          const trap = grade.trap
          if (trap) {
            const rule = SQL_TRAP_RULES[trap.id] || { concept: trap.title || 'SQL trap', rule: trap.message }
            learner.recordQuizAttempt({
              ...payload,
              conceptName: rule.concept,
              correct: false,
              questionText: trap.message,
              diagnostic: { exactSlipDescription: trap.message, correctiveRule: rule.rule },
            })
            return
          }
          if (grade.passed) {
            learner.recordQuizAttempt({
              ...payload,
              conceptName: mission.concept || mission.title,
              correct: true,
              questionText: mission.title,
            })
          } else if (grade.level !== 'error') {
            learner.recordQuizAttempt({
              ...payload,
              conceptName: mission.concept || mission.title,
              correct: false,
              questionText: mission.title,
              diagnostic: {
                exactSlipDescription: grade.message,
                correctiveRule: 'Re-read the mission brief and the schema inspector, then compare your output against the target table cell by cell.',
              },
            })
          }
        } catch (e) {
          console.warn('[sqlPulse] learner log failed', e)
        }
      },

      resetProgress: () => set({ completed: {}, attempts: {}, totalXp: 0 }),
    }),
    { name: 'studypulse-sql-pulse' }
  )
)
