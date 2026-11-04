import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { IconContext, SpinnerGap } from '@phosphor-icons/react'
import { initAuthSync } from './stores'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'

const Landing = lazy(() => import('./pages/Landing'))
const Pro = lazy(() => import('./pages/Pro'))
const ProSuccess = lazy(() => import('./pages/ProSuccess'))
const AuthCallback = lazy(() => import('./pages/AuthCallback'))
const Home = lazy(() => import('./pages/Home'))
const Assignments = lazy(() => import('./pages/Assignments'))
const Calendar = lazy(() => import('./pages/Calendar'))
const Grades = lazy(() => import('./pages/Grades'))
const StudyPlans = lazy(() => import('./pages/StudyPlans'))
const Notes = lazy(() => import('./pages/Notes'))
const Flashcards = lazy(() => import('./pages/Flashcards'))
const Analytics = lazy(() => import('./pages/Analytics'))
const Settings = lazy(() => import('./pages/Settings'))
const Habits = lazy(() => import('./pages/Habits'))
const FocusMode = lazy(() => import('./pages/FocusMode'))
const Quiz = lazy(() => import('./pages/Quiz'))
const Leaderboard = lazy(() => import('./pages/Leaderboard'))
const SyllabusImport = lazy(() => import('./pages/SyllabusImport'))
const Login = lazy(() => import('./pages/Login'))
const Signup = lazy(() => import('./pages/Signup'))
const Demo = lazy(() => import('./pages/Demo'))
const Profile = lazy(() => import('./pages/Profile'))
const AIAssistant = lazy(() => import('./pages/AIAssistant'))
const SqlPulse = lazy(() => import('./pages/SqlPulse'))
const Library = lazy(() => import('./pages/Library'))
const ChapterReader = lazy(() => import('./pages/ChapterReader'))
const PYQ = lazy(() => import('./pages/PYQ'))
const NotFound = lazy(() => import('./pages/NotFound'))

// ── Route preloading — every dock tab switches in <50ms ───────
// After first paint, warm all lazy chunks during idle time so route
// switching never blocks on a network fetch.
const ROUTE_CHUNKS = [
  () => import('./pages/Home'),
  () => import('./pages/AIAssistant'),
  () => import('./pages/Library'),
  () => import('./pages/ChapterReader'),
  () => import('./pages/Notes'),
  () => import('./pages/PYQ'),
  () => import('./pages/Quiz'),
  () => import('./pages/StudyPlans'),
  () => import('./pages/SqlPulse'),
  () => import('./pages/Assignments'),
  () => import('./pages/Calendar'),
  () => import('./pages/Grades'),
  () => import('./pages/Flashcards'),
  () => import('./pages/Habits'),
  () => import('./pages/Analytics'),
  () => import('./pages/Leaderboard'),
  () => import('./pages/FocusMode'),
  () => import('./pages/Profile'),
  () => import('./pages/Settings'),
  () => import('./pages/SyllabusImport'),
]

export function preloadRoutes() {
  ROUTE_CHUNKS.forEach((load) => { load().catch(() => {}) })
}

const PageSkeleton = () => (
  <div className="flex items-center justify-center min-h-[60vh] w-full">
    <div className="flex flex-col items-center gap-3 text-emerald-500/80">
      <SpinnerGap className="w-8 h-8 animate-spin" />
      <span className="text-xs font-mono text-slate-400">Loading page...</span>
    </div>
  </div>
)

function App() {
  // Validate the persisted session against Supabase and keep auth state in sync
  // with token refreshes / cross-tab sign-out.
  useEffect(() => { initAuthSync() }, [])

  // Warm every route chunk during idle time — instant tab switching
  useEffect(() => {
    const warm = () => preloadRoutes()
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(warm, { timeout: 2500 })
      return () => window.cancelIdleCallback?.(id)
    }
    const t = setTimeout(warm, 1200)
    return () => clearTimeout(t)
  }, [])

  return (
    <ErrorBoundary>
      <IconContext.Provider value={{ weight: 'duotone', mirrored: false }}>
        <BrowserRouter>
          <Suspense fallback={<PageSkeleton />}>
            <Routes>
              {/* Redirect root to home */}
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/pro" element={<Pro />} />
              <Route path="/pro/success" element={<ProSuccess />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/demo" element={<Demo />} />

              {/* Protected app — Layout renders Outlet for all children */}
              <Route
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route path="/home" element={<Home />} />
                <Route path="/assistant" element={<AIAssistant />} />
                <Route path="/ai" element={<AIAssistant />} />
                <Route path="/assignments" element={<Assignments />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/grades" element={<Grades />} />
                <Route path="/study" element={<StudyPlans />} />
                <Route path="/study-plans" element={<StudyPlans />} />
                <Route path="/notes" element={<Notes />} />
                <Route path="/flashcards" element={<Flashcards />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/habits" element={<Habits />} />
                <Route path="/focus" element={<FocusMode />} />
                <Route path="/quiz" element={<Quiz />} />
                <Route path="/sql" element={<SqlPulse />} />
                <Route path="/library" element={<Library />} />
                <Route path="/read/:chapterId" element={<ChapterReader />} />
                <Route path="/pyq" element={<PYQ />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/import" element={<SyllabusImport />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/profile" element={<Profile />} />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </IconContext.Provider>
    </ErrorBoundary>
  )
}

export default App
