// src/hooks/useRoleDashboard.ts
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../context/AuthContext';
import { req } from '../services/apiClient';

interface RoleDashboardState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Substitui o useDashboardData genérico (que fazia N pedidos, um por widget).
 * Agora é 1 pedido, moldado ao role activo, resposta já pronta a renderizar.
 */
export function useRoleDashboard<T>(roleOverride?: Role, enabled = true): RoleDashboardState<T> {
  const { activeRole } = useAuth();
  const requestedRole = roleOverride ?? activeRole;
  const [state, setState] = useState<RoleDashboardState<T>>({
    data: null,
    isLoading: enabled,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    if (!enabled || !requestedRole) {
      const resetId = window.setTimeout(() => {
        if (!cancelled) setState({ data: null, isLoading: false, error: null });
      }, 0);

      return () => {
        cancelled = true;
        window.clearTimeout(resetId);
      };
    }

    const loadingId = window.setTimeout(() => {
      if (!cancelled) setState(s => ({ ...s, isLoading: true, error: null }));
    }, 0);

    req<T>('GET', '/api/v1/dashboard', { role: requestedRole })
      .then(json => {
        if (!cancelled) setState({ data: json, isLoading: false, error: null });
      })
      .catch((err: Error) => {
        if (!cancelled) setState({ data: null, isLoading: false, error: err.message });
      });

    return () => {
      cancelled = true;
      window.clearTimeout(loadingId);
    };
  }, [enabled, requestedRole]);

  return state;
}
