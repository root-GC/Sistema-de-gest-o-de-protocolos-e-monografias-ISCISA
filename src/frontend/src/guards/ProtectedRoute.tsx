// src/guards/ProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../context/AuthContext';
import { canAccess } from '../access/accessControl';
import type { OrganType } from '../access/accessControl';

interface ProtectedRouteProps {
  permission?: string;
  roles?: Role[];
  adminScope?: 'global' | 'organ';
  organTypes?: OrganType[];
}

export function ProtectedRoute({ permission, roles: allowedRoles, adminScope, organTypes }: ProtectedRouteProps) {
  const { user, permissions, profiles, activeRole, loading, isProfileIncomplete } = useAuth();
  const location = useLocation();

  // Mostra loading enquanto carrega
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: 'var(--font-family)',
        color: 'var(--on-surface-variant)',
        fontSize: 'var(--body-lg)',
        gap: 'var(--space-2)'
      }}>
        <span style={{
          width: '24px', height: '24px',
          border: '3px solid var(--outline-variant)',
          borderTopColor: 'var(--primary)',
          borderRadius: 'var(--radius-full)',
          animation: 'spin 0.8s linear infinite'
        }} />
        A carregar...
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Só verifica após ter certeza que não está carregando
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar perfil incompleto
  // Permitir acesso apenas à rota de completar perfil
  if (isProfileIncomplete && location.pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace />;
  }

  // Se o perfil estiver completo, não permitir voltar à página de completar
  if (!isProfileIncomplete && location.pathname === '/complete-profile') {
    return <Navigate to="/dashboard" replace />;
  }

  const hasAccessRule = Boolean(permission || allowedRoles?.length || adminScope || organTypes?.length);
  if (hasAccessRule && !canAccess(
    { activeRole, permissions, profiles },
    { permission, roles: allowedRoles, adminScope, organTypes }
  )) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}
