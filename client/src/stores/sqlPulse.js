// SQL Pulse progress store — persisted separately from the main stores so
// campaign state survives reloads. XP awards flow into the main useXPStore
// and study time flows into the Pomodoro store's dailyFocusLog, which is
// what the Home / Analytics dashboards already read.

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { MISSIONS, WORLDS } from '../data/sqlMissions'
import { useXPStore, usePomodoroStore } from './index'

const todayKey = () => new Date().toISOString().split('T')[0]

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

      resetProgress: () => set({ completed: {}, attempts: {}, totalXp: 0 }),
    }),
    { name: 'studypulse-sql-pulse' }
  )
)
