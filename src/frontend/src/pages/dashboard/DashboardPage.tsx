import { useAuth } from '../../context/AuthContext';
import { StudentDashboard } from './roles/StudentDashboard';
import { SecretaryDashboard } from './roles/SecretaryDashboard';
import { ReviewerDashboard } from './roles/ReviewerDashboard';
import { SupervisorDashboard } from './roles/SupervisorDashboard';
import { StatsDashboard } from './roles/StatsDashboard';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import '../../styles/dashboard.css';

export default function DashboardPage() {
  const { user, activeRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="dashboard-container">
        <LoadingSpinner variant="page" text="A carregar..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="session-not-found">
        <h3>Sessão não encontrada</h3>
        <p>Faça login para acessar o dashboard.</p>
      </div>
    );
  }

  switch (activeRole) {
    case 'student':
      return <StudentDashboard />;
    case 'secretary':
      return <SecretaryDashboard />;
    case 'reviewer':
      return <ReviewerDashboard />;
    case 'supervisor':
      return <SupervisorDashboard />;
    case 'coordinator':
      return <StatsDashboard title="Painel do Coordenador" loadingText="A carregar estatísticas..." />;
    case 'admin':
      return <StatsDashboard title="Painel de Administração" loadingText="A carregar estatísticas..." />;
    default:
      return (
        <div className="dashboard-container dashboard-unmigrated">
          <p>
            O dashboard para o role "{activeRole}" ainda não foi migrado para o novo formato
            (usa {'{'}GenericDashboardBuilder{'}'} no backend por agora).
          </p>
        </div>
      );
  }
}