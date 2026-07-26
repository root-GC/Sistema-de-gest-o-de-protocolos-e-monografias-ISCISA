import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../context/AuthContext';

interface ProtectedRouteProps {
  permission?: string;
  roles?: Role[];
}

export function ProtectedRoute({ permission, roles: allowedRoles }: ProtectedRouteProps) {
  const { user, roles, permissions, loading } = useAuth();
  const location = useLocation();

  // 🐛 DEBUG
  console.log('🛡️ ProtectedRoute:', {
    user: user?.name,
    userRoles: roles,
    userPermissions: permissions,
    requiredPermission: permission,
    requiredRoles: allowedRoles,
    loading,
    path: location.pathname
  });

  // ✅ Mostra loading enquanto carrega
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

  // ✅ Só verifica após ter certeza que não está carregando
  if (!user) {
    console.log('🔒 Não autenticado, redirecionando para /login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verifica se tem roles (apenas se requiredRoles foi especificado)
  if (allowedRoles && allowedRoles.length > 0) {
    const hasRole = allowedRoles.some(role => roles.includes(role));
    
    if (!hasRole) {
      console.warn('⛔ Acesso negado - Role não permitido:', {
        userRoles: roles,
        requiredRoles: allowedRoles
      });
      return <Navigate to="/403" replace />;
    }
  }

  // Verifica se tem permissão (apenas se permission foi especificado)
  if (permission) {
    const hasPermission = permissions.includes(permission);
    
    if (!hasPermission) {
      console.warn('⛔ Acesso negado - Permissão não encontrada:', {
        userPermissions: permissions,
        requiredPermission: permission
      });
      return <Navigate to="/403" replace />;
    }
  }

  console.log('✅ Acesso permitido');
  return <Outlet />;
}