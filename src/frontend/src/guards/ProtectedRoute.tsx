import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// @ts-ignore
import { usePermission } from '../hooks/usePermission';
import type { Role } from '../context/AuthContext';

interface ProtectedRouteProps {
  permission?: string;
  roles?: Role[];
}

export function ProtectedRoute({ permission, roles: allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const { can, hasAnyRole } = usePermission();
  const location = useLocation();

  if (loading) return null;

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  if (permission && !can(permission)) return <Navigate to="/403" replace />;
  if (allowedRoles && !hasAnyRole(allowedRoles)) return <Navigate to="/403" replace />;

  return <Outlet />;
}