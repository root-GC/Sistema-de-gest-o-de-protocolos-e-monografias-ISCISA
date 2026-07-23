// App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './guards/ProtectedRoute.tsx'
import { AppLayout } from './components/layout/AppLayout.tsx'
import { lazy, Suspense } from 'react'

// Páginas públicas
import LoginPage from './pages/LoginPage.tsx'

// Páginas protegidas — lazy load
const DashboardPage          = lazy(() => import('./pages/dashboard/DashboardPage'))
const Page403                = lazy(() => import('./pages/shared/Page403'))

// Student
const TopicPage              = lazy(() => import('./pages/student/TopicPage'))
const ProtocolPage           = lazy(() => import('./pages/student/ProtocolPage'))
const DocumentsPage          = lazy(() => import('./pages/student/DocumentsPage'))
const MonographPage          = lazy(() => import('./pages/student/MonographPage'))

// Teacher / Supervisor
const SupervisionPage        = lazy(() => import('./pages/teacher/SupervisionPage'))
const ValidationPage         = lazy(() => import('./pages/teacher/ValidationPage'))
const SubmissionReviewPage   = lazy(() => import('./pages/teacher/SubmissionReviewPage'))
const WorkloadPage           = lazy(() => import('./pages/teacher/WorkloadPage'))
const SupervisorProtocolsPage = lazy(() => import('./pages/supervisor/SupervisorProtocolsPage'))
const SupervisorProtocolDetailPage = lazy(() => import('./pages/supervisor/SupervisorProtocolDetailPage'))

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
const HarmonizationPage = lazy(() => import('./pages/shared/secretary/HarmonizationPage'))
const CompletedReviewsPage = lazy(() => import('./pages/shared/secretary/CompletedReviewsPage'))

// Admin
const AdminUsersPage         = lazy(() => import('./pages/system-admin/AdminUsersPage'))
const AdminOrgansPage        = lazy(() => import('./pages/system-admin/AdminOrgansPage'))
const SystemStatusPage       = lazy(() => import('./pages/system-admin/SystemStatusPage')) // 🆕

//Admin general
const GeneralAdminDashboard = lazy(() => import('./pages/general-admin/GeneralAdminDashboard'))
const ManagePersonnelPage  = lazy(() => import('./pages/general-admin/ManagePersonnelPage'))
const CoursesManagementPage = lazy(() => import('./pages/general-admin/CoursesManagementPage'))

// Organ President
const OrganPresidentDashboard = lazy(() => import('./pages/organ-president/OrganPresidentDashboard'))
const ManageOrganMembersPage = lazy(() => import('./pages/organ-president/ManageOrganMembersPage'))


// Páginas públicas
const RegisterPage       = lazy(() => import('./pages/RegisterPage'))
const VerifyOtpPage      = lazy(() => import('./pages/VerifyOtpPage'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))
const ResetPasswordPage  = lazy(() => import('./pages/ResetPasswordPage'))

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
            {/* ── Públicas ─────────────────────────────────────── */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/403"   element={<Page403 />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-otp" element={<VerifyOtpPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* ── Protegidas — qualquer utilizador autenticado ── */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                



                {/* Dashboard */}
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
                  <Route path="/supervision/pending" element={<ValidationPage />} />
                  <Route path="/supervision/review/:type/:id" element={<SubmissionReviewPage />} />
                </Route>

                {/* Rotas do Supervisor (protocolos) */}
                <Route element={<ProtectedRoute roles={['supervisor']} />}>
                  <Route path="/supervisor" element={<SupervisorProtocolsPage />} />
                  <Route path="/supervisor/protocols/:protocolId" element={<SupervisorProtocolDetailPage />} />
                </Route>

                {/* ── Teacher / Reviewer ──────────────────────── */}
                <Route element={<ProtectedRoute permission="workload.view" />}>
                  <Route path="/workload" element={<WorkloadPage />} />
                </Route>
                <Route element={<ProtectedRoute permission="protocol.evaluate" />}>
                  <Route path="/reviews"                     element={<ReviewsPage />} />
                  <Route path="/reviews/assigned"            element={<ReviewsPage />} />
                  <Route path="/reviews/done"                element={<ReviewsPage />} />
                  <Route path="/reviews/protocols/:protocolId" element={<EvaluationPage />} />
                  <Route path="/reviews/topics/:topicId"     element={<EvaluationPage />} />
                  <Route path="/reviews/:topicId"            element={<EvaluationPage />} />
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
                   <Route path="/secretary/harmonization" element={<HarmonizationPage />} />
                   <Route path="/secretary/completed" element={<CompletedReviewsPage />} />
                </Route>

                {/* ── Admin ───────────────────────────────────── */}
                <Route element={<ProtectedRoute permission="admin.users" />}>
                  <Route path="/admin/users" element={<AdminUsersPage />} />
                </Route>
                <Route element={<ProtectedRoute permission="admin.organs" />}>
                  <Route path="/admin/organs" element={<AdminOrgansPage />} />
                </Route>
                {/* 🆕 Estado do Sistema */}
                <Route element={<ProtectedRoute permission="admin.settings" />}>
                  <Route path="/admin/system-status" element={<SystemStatusPage />} />
                </Route>

                {/* ── General Admin / Direção Científica ────────────── */}
                <Route element={<ProtectedRoute permission="admin.organs" />}>
                  <Route path="/general-admin" element={<GeneralAdminDashboard />} />
                  <Route path="/general-admin/personnel" element={<ManagePersonnelPage />} />
                   <Route path="/general-admin/courses" element={<CoursesManagementPage />} />
                </Route>

                {/* ── Organ President ─────────────────────────────── */}
                <Route element={<ProtectedRoute permission="admin.organs" />}>
                  <Route path="/organ-president" element={<OrganPresidentDashboard />} />
                  <Route path="/organ-president/members" element={<ManageOrganMembersPage />} />
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