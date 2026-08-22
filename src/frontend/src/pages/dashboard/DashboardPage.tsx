// pages/dashboard/DashboardPage.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { StudentDashboard } from './roles/StudentDashboard';
import { SecretaryDashboard } from './roles/SecretaryDashboard';
import { ReviewerDashboard } from './roles/ReviewerDashboard';
import { SupervisorDashboard } from './roles/SupervisorDashboard';
import { StatsDashboard } from './roles/StatsDashboard';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import '../../styles/dashboard.css';

// 🔑 Helper para normalizar role
function normalizeRole(role: any): string {
  if (typeof role === 'string') {
    return role;
  }
  
  if (role && typeof role === 'object') {
    // Tenta extrair o nome do role
    if (role.name && typeof role.name === 'string') {
      return role.name;
    }
    if (role.slug && typeof role.slug === 'string') {
      return role.slug;
    }
    if (role.role && typeof role.role === 'string') {
      return role.role;
    }
  }
  
  return String(role || '');
}

export default function DashboardPage() {
  const { user, activeRole, loading, isProfileIncomplete } = useAuth();
  const navigate = useNavigate();

  // 🔑 Normalizar activeRole para garantir que é string
  const normalizedActiveRole = normalizeRole(activeRole);

  // 🆕 Verificar perfil incompleto e redirecionar
  useEffect(() => {
    if (!loading && isProfileIncomplete) {
      console.log('📋 Perfil incompleto, redirecionando para /complete-profile');
      navigate('/complete-profile', { replace: true });
    }
  }, [loading, isProfileIncomplete, navigate]);

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

  // 🆕 Se o perfil estiver incompleto, não renderizar o dashboard
  if (isProfileIncomplete) {
    return (
      <div className="dashboard-container">
        <LoadingSpinner variant="page" text="A verificar perfil..." />
      </div>
    );
  }

  // 🔑 Usar normalizedActiveRole em vez de activeRole
  switch (normalizedActiveRole) {
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
            O dashboard para o role "{normalizedActiveRole}" ainda não foi migrado para o novo formato
            (usa {'{'}GenericDashboardBuilder{'}'} no backend por agora).
          </p>
        </div>
      );
  }
}