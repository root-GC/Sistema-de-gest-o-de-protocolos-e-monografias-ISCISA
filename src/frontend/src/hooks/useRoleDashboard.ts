// src/hooks/useRoleDashboard.ts
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface RoleDashboardState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Substitui o useDashboardData genérico (que fazia N pedidos, um por widget).
 * Agora é 1 pedido, moldado ao role activo, resposta já pronta a renderizar.
 */
export function useRoleDashboard<T>(): RoleDashboardState<T> {
  const { activeRole } = useAuth();
  const [state, setState] = useState<RoleDashboardState<T>>({
    data: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!activeRole) return;
    let cancelled = false;

    setState(s => ({ ...s, isLoading: true, error: null }));

    fetch(`/api/v1/dashboard?role=${activeRole}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('sgpmc_token')}`,
        Accept: 'application/json',
      },
    })
      .then(res => {
        if (!res.ok) throw new Error('Não foi possível carregar o dashboard.');
        return res.json();
      })
      .then(json => {
        if (!cancelled) setState({ data: json, isLoading: false, error: null });
      })
      .catch((err: Error) => {
        if (!cancelled) setState({ data: null, isLoading: false, error: err.message });
      });

    return () => {
      cancelled = true;
    };
  }, [activeRole]);

  return state;
}