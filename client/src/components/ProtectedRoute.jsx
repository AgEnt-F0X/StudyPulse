import { useEffect } from 'react'
import {
  useAuthStore,
  useAssignmentsStore,
  useEventStore,
  useGradesStore,
  useNotesStore,
  useFlashcardsStore,
} from '../stores'
import {
  DEMO_COURSES,
  DEMO_ASSIGNMENTS,
  DEMO_EVENTS,
  DEMO_GRADES,
  DEMO_NOTES,
  DEMO_COURSE_WEIGHTS,
  DEMO_DECKS,
  DEMO_QUIZ_HISTORY,
  DEMO_LEADERBOARD,
} from '../utils/demoData'

// Auto-login as a local guest — no sign-in screen needed.
const GUEST_ID = 'local-guest'
const GUEST_NAME = 'You'
const SEED_VERSION = 'v4_cbse_clean'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, _hasHydrated, setUser, setToken } = useAuthStore()

  useEffect(() => {
    if (_hasHydrated) {
      if (!isAuthenticated && !isLoading) {
        setUser({ id: GUEST_ID, name: GUEST_NAME, email: '', provider: 'local' })
        setToken(`local-${GUEST_ID}`)
      }

      // Check if user has outdated demo data or no CBSE data
      const currentVer = localStorage.getItem('studypulse_seed_version')
      const assignments = useAssignmentsStore.getState().assignments || []
      const notes = useNotesStore.getState().notes || []
      const hasOldData =
        assignments.some(a => a.courseName === 'Calculus II' || a.courseName === 'Data Structures' || a.title?.includes('Integration by Parts')) ||
        notes.some(n => n.title?.includes('Integration') || n.title?.includes('BST'))

      if (currentVer !== SEED_VERSION || hasOldData || assignments.length === 0 || notes.length === 0) {
        useAssignmentsStore.getState().setCourses(DEMO_COURSES)
        useAssignmentsStore.getState().setAssignments(DEMO_ASSIGNMENTS)
        useEventStore.getState().setEvents(DEMO_EVENTS)
        useNotesStore.getState().replaceNotes(DEMO_NOTES)
        useFlashcardsStore.getState().replaceDecks(DEMO_DECKS)
        Object.entries(DEMO_GRADES).forEach(([id, g]) => useGradesStore.getState().setCourseGrades(id, g))
        Object.entries(DEMO_COURSE_WEIGHTS).forEach(([id, w]) => useGradesStore.getState().setCourseWeights(id, w))
        localStorage.setItem('studypulse-quiz-history', JSON.stringify(DEMO_QUIZ_HISTORY))
        localStorage.setItem('studypulse-leaderboard', JSON.stringify(DEMO_LEADERBOARD))
        localStorage.setItem('studypulse_seed_version', SEED_VERSION)
      }
    }
  }, [_hasHydrated, isAuthenticated, isLoading, setUser, setToken])

  // Show a minimal dark screen while zustand rehydrates from localStorage.
  if (!_hasHydrated || isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary, #0a120e)' }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: 'linear-gradient(135deg, #6c63ff, #c44dff)',
          animation: 'pulse 1.5s ease-in-out infinite',
        }} />
      </div>
    )
  }

  return children
}

export default ProtectedRoute

