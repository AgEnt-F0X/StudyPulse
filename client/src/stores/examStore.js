// Exam Mode store — exams with syllabus chapter lists, honest readiness
// computed strictly from verified learner states, and a dynamic daily
// task queue (20-minute micro-tasks) rebuilt every day from the student's
// current concept states + PYQ coverage.

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getLearnerChapter } from '../utils/cbseSubjects'
import { computeChapterReadiness, readinessBand } from '../utils/learnerEngine'
import { useLearnerStore } from './learnerStore'
import { countPYQsByChapter, getPYQsForChapter } from '../data/pyqBank'

const todayKey = () => new Date().toISOString().split('T')[0]

const PYQ_MARK_COUNTS = countPYQsByChapter()

/**
 * Build the day's micro-task queue for one exam.
 * Priority: needs-attention chapters first, then PYQ-heavy chapters.
 */
export function buildDailyQueue(exam, learnerChapters) {
  const days = Math.max(1, Math.ceil((new Date(exam.date) - new Date()) / 86400000))
  const chapters = (exam.chapterIds || [])
    .map((id) => ({ id, meta: getLearnerChapter(id) }))
    .filter((c) => c.meta)

  const readiness = (id) => {
    const ch = learnerChapters[`${exam.subject || ''}::${id}`] ||
      Object.values(learnerChapters || {}).find((c) => c.chapterId === id)
    return ch ? computeChapterReadiness(ch.concepts) : null
  }

  // Sort: lowest readiness (needs attention) first; PYQ weight as tiebreak
  const prioritized = chapters
    .map((c) => ({
      ...c,
      readiness: readiness(c.id),
      pyqMarks: PYQ_MARK_COUNTS[c.id] || 0,
      pyqCount: getPYQsForChapter(c.id).length,
    }))
    .sort((a, b) => {
      const ra = a.readiness === null ? 50 : a.readiness
      const rb = b.readiness === null ? 50 : b.readiness
      if (ra !== rb) return ra - rb
      return b.pyqMarks - a.pyqMarks
    })

  const dueConceptsFor = (id) => {
    try {
      return useLearnerStore.getState().getDueRefreshItems().filter((d) => d.chapterId === id).length
    } catch { return 0 }
  }

  const tasks = []
  let used = 0
  const budget = exam.dailyMinutes || 45

  const pushTask = (task) => {
    if (used + task.minutes > budget) return false
    tasks.push(task)
    used += task.minutes
    return true
  }

  for (const c of prioritized) {
    const whyBits = []
    if (c.readiness !== null && c.readiness < 50) whyBits.push(`${c.readiness}% ready`)
    if (c.pyqCount > 0) whyBits.push(`${c.pyqCount} official PYQ${c.pyqCount > 1 ? 's' : ''} (${c.pyqMarks} marks)`)
    const why = `On your exam syllabus.${whyBits.length ? ' ' + whyBits.join(' · ') + '.' : ''}`

    pushTask({
      type: 'READ', minutes: 20, chapterId: c.id,
      label: `Read: ${c.meta.title}`, why,
      path: `/read/${c.id}`,
    })
    const due = dueConceptsFor(c.id)
    if (due > 0) {
      pushTask({
        type: 'REFRESH', minutes: 10, chapterId: c.id,
        label: `Refresh: ${c.meta.title}`, why: `${due} concept${due > 1 ? 's are' : ' is'} due for recall right now.`,
        path: `/quiz?chapterId=${c.id}`,
      })
    }
    if (c.pyqCount > 0) {
      pushTask({
        type: 'PYQ', minutes: 20, chapterId: c.id,
        label: `PYQ drill: ${c.meta.title}`, why: `${c.pyqCount} board question${c.pyqCount > 1 ? 's' : ''} mapped to this chapter.`,
        path: `/pyq`,
      })
    }
    pushTask({
      type: 'QUIZ', minutes: 15, chapterId: c.id,
      label: `Quiz Me: ${c.meta.title}`, why,
      path: `/quiz?chapterId=${c.id}`,
    })
    if (used >= budget) break
  }

  return { tasks, daysLeft: days, usedMinutes: used }
}

export function examReadiness(exam, learnerChapters) {
  const ids = exam.chapterIds || []
  if (ids.length === 0) return { pct: 0, band: readinessBand(0) }
  let total = 0
  let counted = 0
  for (const id of ids) {
    const ch = Object.values(learnerChapters || {}).find((c) => c.chapterId === id)
    if (ch) { total += computeChapterReadiness(ch.concepts); counted += 1 }
  }
  const pct = counted ? Math.round(total / counted) : 0
  return { pct, band: readinessBand(pct) }
}

export const useExamStore = create(
  persist(
    (set, get) => ({
      exams: [],
      taskLog: {},   // `${date}::${examId}::${taskId}` -> 'done' | 'skipped'

      addExam: ({ title, type, subject, date, dailyMinutes, chapterIds }) => {
        const id = `exam-${Date.now().toString(36)}`
        set((s) => ({
          exams: [...s.exams, {
            id, title: title || `${subject} ${type === 'board' ? 'board exam' : 'unit test'}`,
            type: type === 'board' ? 'board' : 'unit',
            subject, date, dailyMinutes: dailyMinutes || 45,
            chapterIds: chapterIds || [],
            createdAt: Date.now(),
          }],
        }))
        return id
      },

      deleteExam: (id) => set((s) => ({ exams: s.exams.filter((e) => e.id !== id) })),

      setTaskState: (examId, taskId, state) => {
        const key = `${todayKey()}::${examId}::${taskId}`
        set((s) => {
          const log = { ...s.taskLog }
          if (state) log[key] = state
          else delete log[key]
          return { taskLog: log }
        })
      },

      getTaskState: (examId, taskId) => get().taskLog[`${todayKey()}::${examId}::${taskId}`] || null,
    }),
    { name: 'studypulse-exams' }
  )
)
