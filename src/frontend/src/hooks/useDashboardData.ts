// hooks/useDashboardData.ts
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { mockDashboardData } from '../mocks/dashboardData';

interface WidgetState {
  data: any;
  isLoading: boolean;
  error: string | null;
}

interface DashboardData {
  [widgetId: string]: WidgetState;
}

// Flag para alternar entre mock e API real
const USE_MOCK_DATA = true; // Mude para false quando tiver backend

export function useDashboardData(
  widgetIds: string[],
  endpoints: Record<string, string>
) {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error] = useState<string | null>(null);

  useEffect(() => {
    // Mantém o parâmetro disponível para a implementação da API real.
    void endpoints;

    if (!user || widgetIds.length === 0) {
      setIsLoading(false);
      return;
    }

    // Simula carregamento com delay para parecer realista
    const timer = setTimeout(() => {
      const widgetData: DashboardData = {};

      widgetIds.forEach(id => {
        if (USE_MOCK_DATA) {
          // Usa dados mock
          widgetData[id] = {
            data: (mockDashboardData as any)[id] || null,
            isLoading: false,
            error: null
          };
        } else {
          // Aqui vai a chamada real à API (seu código original)
          widgetData[id] = {
            data: null,
            isLoading: true,
            error: null
          };
        }
      });

      setDashboardData(widgetData);
      setIsLoading(false);
    }, 1500); // 1.5 segundos de loading simulado

    return () => clearTimeout(timer);
  }, [user, widgetIds]);

  return {
    dashboardData,
    isLoading,
    error
  };
}