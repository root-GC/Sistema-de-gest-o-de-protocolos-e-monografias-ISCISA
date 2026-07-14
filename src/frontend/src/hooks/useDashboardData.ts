// hooks/useDashboardData.ts
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface WidgetState {
  data: any;
  isLoading: boolean;
  error: string | null;
}

interface DashboardData {
  [widgetId: string]: WidgetState;
}

export function useDashboardData(widgetIds: string[], endpoints: Record<string, string>) {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || widgetIds.length === 0) {
      setIsLoading(false);
      return;
    }

    const fetchAllWidgetData = async () => {
      setIsLoading(true);
      setError(null);
      
      // Inicializa todos os widgets como loading
      const initialData: DashboardData = {};
      widgetIds.forEach(id => {
        initialData[id] = {
          data: null,
          isLoading: true,
          error: null
        };
      });
      setDashboardData(initialData);

      try {
        const token = localStorage.getItem('sgpmc_token');
        
        const response = await fetch('/api/dashboard', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            widgets: widgetIds.filter(id => endpoints[id])
          })
        });

        if (!response.ok) {
          throw new Error('Falha ao carregar dados do dashboard');
        }

        const data = await response.json();
        
        // Organiza dados por widget
        const widgetData: DashboardData = {};
        widgetIds.forEach(id => {
          widgetData[id] = {
            data: data.widgets?.[id] || null,
            isLoading: false,
            error: null
          };
        });

        setDashboardData(widgetData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar dados';
        setError(errorMessage);
        
        // Em caso de erro, marca todos os widgets como erro
        const errorData: DashboardData = {};
        widgetIds.forEach(id => {
          errorData[id] = {
            data: null,
            isLoading: false,
            error: errorMessage
          };
        });
        setDashboardData(errorData);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllWidgetData();
  }, [user, widgetIds.join(',')]);

  return { 
    dashboardData, 
    isLoading,
    error 
  };
}