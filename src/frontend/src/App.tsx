import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './guards/ProtectedRoute.tsx'
import { AppLayout } from './components/layout/AppLayout.tsx'
import { lazy, Suspense } from 'react'
import TestOnlyOfficePage from './pages/TestOnlyOfficePage'
import SupervisorProtocolsPage from './pages/supervisor/SupervisorProtocolsPage'

// Páginas públicas
import LoginPage from './pages/LoginPage.tsx'
import SupervisorProtocolDetailPage from './pages/supervisor/SupervisorProtocolDetailPage.tsx'

//Páginas protegidas — lazy load
const DashboardPage          = lazy(() => import('./pages/dashboard/DashboardPage'))
const Page403                = lazy(() => import('./pages/shared/Page403'))

// Student
const TopicPage              = lazy(() => import('./pages/student/TopicPage'))
const ProtocolPage           = lazy(() => import('./pages/student/ProtocolPage'))
const DocumentsPage          = lazy(() => import('./pages/student/DocumentsPage'))
const MonographPage          = lazy(() => import('./pages/student/MonographPage'))

// Teacher / Supervisor
const SupervisionPage        = lazy(() => import('./pages/teacher/SupervisionPage'))
const WorkloadPage           = lazy(() => import('./pages/teacher/WorkloadPage'))

// Reviewer
const ReviewsPage            = lazy(() => import('./pages/teacher/ReviewsPage'))
const EvaluationPage         = lazy(() => import('./pages/teacher/EvaluationPage'))

// Coordinator
const AssignPage             = lazy(() => import('./pages/coordinator/AssignPage'))
const ProtocolsOverviewPage  = lazy(() => import('./pages/coordinator/ProtocolsOverviewPage'))
const DefensePage            = lazy(() => import('./pages/coordinator/DefensePage'))
const ReportsPage            = lazy(() => import('./pages/coordinator/ReportsPage'))

// Secretary
const SecretaryProtocolsPage = lazy(() => import('./pages/shared/SecretaryProtocolsPage'))

// Admin
const AdminUsersPage         = lazy(() => import('./pages/admin/AdminUsersPage'))
const AdminOrgansPage        = lazy(() => import('./pages/admin/AdminOrgansPage'))

const Loader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
    <span style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>A carregar...</span>
  </div>
)

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<Loader />}>
          <Routes>


          // Dentro das rotas:
          <Route path="/supervisor" element={<SupervisorProtocolsPage />} />
          <Route path="/supervisor/protocols/:protocolId" element={<SupervisorProtocolDetailPage />} />

            {/* Teste ONLYOFFICE */}
            <Route
              path="/teste-office"
              element={<TestOnlyOfficePage />}
            />

            {/* ── Públicas ─────────────────────────────────────── */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/403"   element={<Page403 />} />

            {/* ── Protegidas — qualquer utilizador autenticado ── */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>

                {/* Dashboard (toda a gente) */}
                <Route path="/dashboard" element={<DashboardPage />} />

                {/* ── Student ─────────────────────────────────── */}
                <Route element={<ProtectedRoute permission="topic.create" />}>
                  <Route path="/topic" element={<TopicPage />} />
                </Route>
                <Route element={<ProtectedRoute permission="protocol.create" />}>
                  <Route path="/protocol/mine"      element={<ProtocolPage />} />
                  <Route path="/protocol/submit"    element={<ProtocolPage />} />
                  <Route path="/protocol/documents" element={<DocumentsPage />} />
                </Route>
                <Route element={<ProtectedRoute permission="monograph.submit" />}>
                  <Route path="/monograph" element={<MonographPage />} />
                </Route>

                {/* ── Supervisor ──────────────────────────────── */}
                <Route element={<ProtectedRoute permission="supervision.view" />}>
                  <Route path="/supervision"         element={<SupervisionPage />} />
                  <Route path="/supervision/list"    element={<SupervisionPage />} />
                  <Route path="/supervision/pending" element={<SupervisionPage />} />
                </Route>

                {/* ── Teacher / Reviewer ──────────────────────── */}

           

{/* <Route path="/reviews/protocols/:protocolId" element={<EvaluationPage />} /> */}

                <Route element={<ProtectedRoute permission="workload.view" />}>
                  <Route path="/workload" element={<WorkloadPage />} />
                </Route>
                <Route element={<ProtectedRoute permission="protocol.evaluate" />}>
                  <Route path="/reviews"          element={<ReviewsPage />} />
                  <Route path="/reviews/assigned" element={<ReviewsPage />} />
                  <Route path="/reviews/done"     element={<ReviewsPage />} />
                  {/* <Route path="/evaluation/:id"   element={<EvaluationPage />} /> */}
                  <Route path="/reviews/topics/:topicId" element={<EvaluationPage />} />
                  <Route path="/reviews/:topicId" element={<EvaluationPage />} />
                </Route>

                {/* ── Coordinator ─────────────────────────────── */}
                <Route element={<ProtectedRoute permission="protocol.assign" />}>
                  <Route path="/protocols"        element={<ProtocolsOverviewPage />} />
                  <Route path="/protocols/assign" element={<AssignPage />} />
                </Route>
                <Route element={<ProtectedRoute permission="defense.schedule" />}>
                  <Route path="/defense"          element={<DefensePage />} />
                  <Route path="/defense/schedule" element={<DefensePage />} />
                </Route>
                <Route element={<ProtectedRoute permission="reports.view" />}>
                  <Route path="/reports" element={<ReportsPage />} />
                </Route>

                {/* ── Secretary ───────────────────────────────── */}
                <Route element={<ProtectedRoute permission="protocol.triage" />}>
                  <Route path="/secretary/protocols" element={<SecretaryProtocolsPage />} />
                </Route>

                {/* ── Admin ───────────────────────────────────── */}
                <Route element={<ProtectedRoute permission="admin.users" />}>
                  <Route path="/admin/users" element={<AdminUsersPage />} />
                </Route>
                <Route element={<ProtectedRoute permission="admin.organs" />}>
                  <Route path="/admin/organs" element={<AdminOrgansPage />} />
                </Route>

              </Route>
            </Route>

            {/* Redirects */}
            <Route path="/"  element={<Navigate to="/dashboard" replace />} />
            <Route path="*"  element={<Navigate to="/dashboard" replace />} />

          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}
