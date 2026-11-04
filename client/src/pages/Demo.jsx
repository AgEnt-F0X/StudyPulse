import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap } from 'lucide-react'
import { useAuthStore, useAssignmentsStore, useEventStore, useGradesStore, useNotesStore, useFlashcardsStore, useXPStore } from '../stores'
import { DEMO_COURSES, DEMO_ASSIGNMENTS, DEMO_EVENTS, DEMO_GRADES, DEMO_NOTES, DEMO_COURSE_WEIGHTS, DEMO_DECKS, DEMO_QUIZ_HISTORY, DEMO_LEADERBOARD } from '../utils/demoData'
import { C, fonts } from '../utils/theme'

export default function Demo() {
  const navigate = useNavigate()
  const { enterDemoMode, isAuthenticated, isDemo } = useAuthStore()
  const { setXP } = useXPStore()
  const { setAssignments, setCourses } = useAssignmentsStore()
  const { setEvents } = useEventStore()
  const { setCourseGrades, setCourseWeights } = useGradesStore()

  useEffect(() => {
    if (isAuthenticated && !isDemo) {
      navigate('/home', { replace: true })
      return
    }
    enterDemoMode()
    setCourses(DEMO_COURSES)
    setAssignments(DEMO_ASSIGNMENTS)
    setEvents(DEMO_EVENTS)
    Object.entries(DEMO_GRADES).forEach(([id, g]) => setCourseGrades(id, g))
    Object.entries(DEMO_COURSE_WEIGHTS).forEach(([id, w]) => setCourseWeights(id, w))
    useNotesStore.getState().replaceNotes(DEMO_NOTES)
    useFlashcardsStore.getState().replaceDecks(DEMO_DECKS)
    localStorage.setItem('studypulse-quiz-history', JSON.stringify(DEMO_QUIZ_HISTORY))
    localStorage.setItem('studypulse-leaderboard', JSON.stringify(DEMO_LEADERBOARD))
    setXP(620)
    navigate('/home', { replace: true })
  }, [])

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: C.bg, color: C.text, fontFamily: fonts.body, fontSize: 15,
    }}>
      <div style={{ textAlign: 'center' }}>
        <div className="pulse" style={{
          width: 56, height: 56, borderRadius: 14, margin: '0 auto 18px',
          background: 'var(--grad-logo)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(59, 130, 246, 0.4)',
        }}>
          <Zap size={28} color="#ffffff" strokeWidth={2.5} />
        </div>
        <div style={{ color: C.textMuted, fontFamily: fonts.heading, fontSize: 14 }}>Setting up your study demo…</div>
      </div>
    </div>
  )
}
