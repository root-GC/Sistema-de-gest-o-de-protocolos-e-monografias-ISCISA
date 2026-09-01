// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './guards/ProtectedRoute.tsx'
import { AppLayout } from './components/layout/AppLayout.tsx'
import { GlobalLoader } from './components/GlobalLoader'
import { lazy } from 'react'
import './pages/teacher/teacherWorkspace.css'

// Páginas públicas
import LoginPage from './pages/LoginPage.tsx'
import LoginPage2 from './pages/LoginPage2.tsx'

// 🆕 Página de completar perfil (fora do AppLayout)
const CompleteProfilePage = lazy(() => import('./pages/teacher/CompleteProfilePage'))

// Páginas protegidas — lazy load
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'))
const Page403 = lazy(() => import('./pages/shared/Page403'))

// Student
const TopicPage = lazy(() => import('./pages/student/TopicPage'))
const ProtocolPage = lazy(() => import('./pages/student/ProtocolPage'))
const DocumentsPage = lazy(() => import('./pages/student/DocumentsPage'))
const MonographPage = lazy(() => import('./pages/student/MonographPage'))

// Teacher / Supervisor
const SupervisionPage = lazy(() => import('./pages/teacher/SupervisionPage'))
const ValidationPage = lazy(() => import('./pages/teacher/ValidationPage'))
const SubmissionReviewPage = lazy(() => import('./pages/teacher/SubmissionReviewPage'))
const WorkloadPage = lazy(() => import('./pages/teacher/WorkloadPage'))
const SupervisorProtocolsPage = lazy(() => import('./pages/supervisor/SupervisorProtocolsPage'))
const SupervisorProtocolDetailPage = lazy(() => import('./pages/supervisor/SupervisorProtocolDetailPage'))

// Reviewer
const ReviewsPage = lazy(() => import('./pages/teacher/ReviewsPage'))
const EvaluationPage = lazy(() => import('./pages/teacher/EvaluationPage'))
const ReviewerMeetingsPage = lazy(() => import('./pages/teacher/ReviewerMeetingsPage'))
const ReviewerMeetingsListPage = lazy(() => import('./pages/teacher/ReviewerMeetingsListPage'))
const FinalDecisionPage = lazy(() => import('./pages/teacher/FinalDecisionPage'))
const FinalDecisionDetailPage = lazy(() => import('./pages/teacher/FinalDecisionDetailPage'))

// Coordinator
const AssignPage = lazy(() => import('./pages/coordinator/AssignPage'))
const ProtocolsOverviewPage = lazy(() => import('./pages/coordinator/ProtocolsOverviewPage'))
const DefensePage = lazy(() => import('./pages/coordinator/DefensePage'))
const ReportsPage = lazy(() => import('./pages/coordinator/ReportsPage'))

// Secretary
const SecretaryProtocolsPage = lazy(() => import('./pages/shared/SecretaryProtocolsPage'))
const AgendaPage = lazy(() => import('./pages/shared/AgendaPage'))

// 🆕 NOVAS PÁGINAS DA SECRETÁRIA
const SpreadsheetPage = lazy(() => import('./pages/shared/secretary/SpreadsheetPage'))
const HistoryPage = lazy(() => import('./pages/shared/secretary/HistoryPage'))
const MeetingPage = lazy(() => import('./pages/shared/secretary/MeetingPage'))
const SignaturePage = lazy(() => import('./pages/shared/secretary/SignaturePage'))

// Admin
const AdminUsersPage = lazy(() => import('./pages/system-admin/AdminUsersPage'))
const AdminOrgansPage = lazy(() => import('./pages/system-admin/AdminOrgansPage'))
const SystemStatusPage = lazy(() => import('./pages/system-admin/SystemStatusPage'))

// Admin general
const GeneralAdminDashboard = lazy(() => import('./pages/general-admin/GeneralAdminDashboard'))
const ManagePersonnelPage = lazy(() => import('./pages/general-admin/ManagePersonnelPage'))
const CoursesManagementPage = lazy(() => import('./pages/general-admin/CoursesManagementPage'))

// Organ President
const OrganPresidentDashboard = lazy(() => import('./pages/organ-president/OrganPresidentDashboard'))
const ManageOrganMembersPage = lazy(() => import('./pages/organ-president/ManageOrganMembersPage'))
const InviteReviewersPage = lazy(() => import('./pages/organ-president/InviteReviewersPage'))
const RegisterTeachersPage = lazy(() => import('./pages/organ-president/RegisterTeachersPage'))

// Páginas públicas
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const VerifyOtpPage = lazy(() => import('./pages/VerifyOtpPage'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'))

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <GlobalLoader />

        <Routes>
          {/* ── Públicas ─────────────────────────────────────── */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/login2" element={<LoginPage2 />} />
          <Route path="/403" element={<Page403 />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-otp" element={<VerifyOtpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* 🆕 Complete Profile - FORA do AppLayout */}
          {/* Acessível para qualquer utilizador autenticado com perfil incompleto */}
          <Route element={<ProtectedRoute />}>
            <Route path="/complete-profile" element={<CompleteProfilePage />} />
          </Route>

          {/* ── Protegidas — com AppLayout ──────────────────── */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>

              {/* Dashboard */}
              <Route path="/dashboard" element={<DashboardPage />} />

              {/* ── Student ─────────────────────────────────── */}
              <Route element={<ProtectedRoute permission="topic.create" roles={['student']} />}>
                <Route path="/topic" element={<TopicPage />} />
              </Route>
              <Route element={<ProtectedRoute permission="protocol.create" roles={['student']} />}>
                <Route path="/protocol/mine" element={<ProtocolPage />} />
                <Route path="/protocol/submit" element={<ProtocolPage />} />
                <Route path="/protocol/documents" element={<DocumentsPage />} />
              </Route>
              <Route element={<ProtectedRoute permission="monograph.submit" roles={['student']} />}>
                <Route path="/monograph" element={<MonographPage />} />
              </Route>

              {/* ── Supervisor ──────────────────────────────── */}
              <Route element={<ProtectedRoute permission="supervision.view" roles={['teacher', 'supervisor', 'reviewer']} />}>
                <Route path="/supervision" element={<SupervisionPage />} />
                <Route path="/supervision/list" element={<SupervisionPage />} />
                <Route path="/supervision/pending" element={<ValidationPage />} />
                <Route path="/supervision/review/:type/:id" element={<SubmissionReviewPage />} />
              </Route>

              {/* Rotas do Supervisor (protocolos) */}
              <Route element={<ProtectedRoute roles={['teacher', 'supervisor', 'reviewer']} permission="supervision.view" />}>
                <Route path="/supervisor" element={<SupervisorProtocolsPage />} />
                <Route path="/supervisor/protocols/:protocolId" element={<SupervisorProtocolDetailPage />} />
              </Route>

              {/* ── Teacher / Reviewer ──────────────────────── */}
              <Route element={<ProtectedRoute permission="workload.view" roles={['teacher', 'supervisor', 'reviewer']} />}>
                <Route path="/workload" element={<WorkloadPage />} />
              </Route>
              <Route element={<ProtectedRoute permission="protocol.evaluate" roles={['teacher', 'supervisor', 'reviewer']} />}>
                {/* Reuniões - específicas primeiro */}
                <Route path="/reviewer/meetings/:protocolId" element={<ReviewerMeetingsPage />} />
                <Route path="/reviewer/meetings" element={<ReviewerMeetingsListPage />} />

                {/* Decisões Pendentes */}
                <Route path="/reviewer/final-decisions/:formId" element={<FinalDecisionDetailPage />} />
                <Route path="/reviewer/final-decisions" element={<FinalDecisionPage />} />

                {/* Reviews - específicas primeiro */}
                <Route path="/reviews/protocols/:protocolId" element={<EvaluationPage />} />
                <Route path="/reviews/topics/:topicId" element={<EvaluationPage />} />
                <Route path="/reviews/assigned" element={<Navigate to="/reviews" replace />} />
                <Route path="/reviews/done" element={<Navigate to="/reviews/history" replace />} />
                <Route path="/reviews/history" element={<ReviewsPage />} />
                <Route path="/reviews/:topicId" element={<EvaluationPage />} />
                <Route path="/reviews" element={<ReviewsPage />} />
              </Route>

              {/* ── Coordinator ─────────────────────────────── */}
              <Route element={<ProtectedRoute permission="protocol.assign" roles={['coordinator', 'secretary']} />}>
                <Route path="/protocols" element={<ProtocolsOverviewPage />} />
                <Route path="/protocols/assign" element={<AssignPage />} />
              </Route>
              <Route element={<ProtectedRoute permission="defense.schedule" roles={['coordinator', 'secretary']} />}>
                <Route path="/defense" element={<DefensePage />} />
                <Route path="/defense/schedule" element={<DefensePage />} />
              </Route>
              <Route element={<ProtectedRoute permission="reports.view" roles={['coordinator']} />}>
                <Route path="/reports" element={<ReportsPage />} />
              </Route>

              {/* ── Agenda (shared) ──────────────────────────── */}
              <Route element={<ProtectedRoute roles={['teacher', 'supervisor', 'reviewer', 'secretary', 'coordinator', 'admin']} />}>
                <Route path="/agenda" element={<AgendaPage />} />
              </Route>

              {/* ── Secretary ───────────────────────────────── */}
              <Route element={<ProtectedRoute permission="protocol.triage" roles={['secretary']} />}>
                <Route path="/secretary/protocols" element={<SecretaryProtocolsPage />} />
              </Route>
              <Route element={<ProtectedRoute permission="protocol.triage" roles={['secretary']} organTypes={['nucleus', 'scientific_committee', 'bioethics_committee']} />}>
                <Route path="/secretary/spreadsheet" element={<SpreadsheetPage />} />
                <Route path="/secretary/history" element={<HistoryPage />} />
              </Route>
              <Route element={<ProtectedRoute permission="protocol.assign" roles={['secretary']} organTypes={['scientific_committee', 'bioethics_committee']} />}>
                <Route path="/secretary/meeting" element={<MeetingPage />} />
                <Route path="/secretary/signatures" element={<SignaturePage />} />
              </Route>

              {/* ── Admin ───────────────────────────────────── */}
              <Route element={<ProtectedRoute permission="admin.users" roles={['admin']} adminScope="global" />}>
                <Route path="/admin/users" element={<AdminUsersPage />} />
              </Route>
              <Route element={<ProtectedRoute permission="admin.organs" roles={['admin']} adminScope="global" />}>
                <Route path="/admin/organs" element={<AdminOrgansPage />} />
              </Route>
              <Route element={<ProtectedRoute permission="admin.settings" roles={['admin']} adminScope="global" />}>
                <Route path="/admin/system-status" element={<SystemStatusPage />} />
              </Route>

              {/* ── General Admin / Direção Científica ──────── */}
              <Route element={<ProtectedRoute permission="admin.organs" roles={['admin']} adminScope="organ" organTypes={['scientific_direction']} />}>
                <Route path="/general-admin" element={<GeneralAdminDashboard />} />
                <Route path="/general-admin/personnel" element={<ManagePersonnelPage />} />
                <Route path="/general-admin/courses" element={<CoursesManagementPage />} />
              </Route>

              {/* ── Organ President ─────────────────────────── */}
              <Route element={<ProtectedRoute roles={['admin']} adminScope="organ" organTypes={['nucleus', 'scientific_committee', 'bioethics_committee']} />}>
                <Route path="/organ-president" element={<OrganPresidentDashboard />} />
                <Route path="/organ-president/members" element={<ManageOrganMembersPage />} />
                <Route path="/organ-president/reviewers" element={<InviteReviewersPage />} />
                <Route path="/organ-president/teachers" element={<RegisterTeachersPage />} />
              </Route>

            </Route>
          </Route>

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />

        </Routes>

      </AuthProvider>
    </BrowserRouter>
  )
}
