// pages/dashboard/DashboardPage.tsx
import React, { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import type { Role, Profile } from '../../context/AuthContext';
import { DASHBOARD_WIDGETS } from './widgets';
import { CATEGORY_CONFIG } from '../../types/dashboard';
import type { WidgetCategory } from '../../types/dashboard';
import { useDashboardData } from '../../hooks/useDashboardData';
import '../../styles/dashboard.css';

export default function DashboardPage() {
  const { 
    user, 
    permissions, 
    activeRole,
    activeProfile,
    canAccessWidget,
    loading: authLoading 
  } = useAuth();

  // Filtra widgets autorizados usando o método do contexto
  const authorizedWidgets = useMemo(() => {
    return DASHBOARD_WIDGETS.filter(widget => 
      canAccessWidget(widget.permissions, widget.anyPermission)
    );
  }, [permissions, canAccessWidget]);

  // Agrupa widgets por categoria
  const groupedWidgets = useMemo(() => {
    const groups: Record<WidgetCategory, typeof authorizedWidgets> = {} as any;
    
    authorizedWidgets.forEach(widget => {
      if (!groups[widget.category]) {
        groups[widget.category] = [];
      }
      groups[widget.category].push(widget);
    });
    
    return groups;
  }, [authorizedWidgets]);

  // Prepara endpoints para carregamento de dados
  const { endpoints, widgetIds } = useMemo(() => {
    const eps: Record<string, string> = {};
    const ids: string[] = [];
    
    authorizedWidgets.forEach(widget => {
      ids.push(widget.id);
      if (widget.endpoint) {
        eps[widget.id] = widget.endpoint;
      }
    });
    
    return { endpoints: eps, widgetIds: ids };
  }, [authorizedWidgets]);

  // Carrega dados dos widgets - AGORA COM isLoading
  const { dashboardData, isLoading: dataLoading } = useDashboardData(widgetIds, endpoints);

  if (authLoading) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    return (
      <div className="dashboard-error">
        <span className="material-symbols-outlined">error_outline</span>
        <h3>Sessão não encontrada</h3>
        <p>Faça login para acessar o dashboard.</p>
      </div>
    );
  }

  // Ordena categorias conforme configuração
  const sortedCategories = Object.entries(groupedWidgets)
    .sort(([catA], [catB]) => {
      const orderA = CATEGORY_CONFIG[catA as WidgetCategory]?.order || 99;
      const orderB = CATEGORY_CONFIG[catB as WidgetCategory]?.order || 99;
      return orderA - orderB;
    });

  return (
    <div className="dashboard-container">
      {/* Header do Dashboard */}
      <DashboardHeader 
        userName={user.name}
        activeRole={activeRole}
        activeProfile={activeProfile}
        permissionsCount={permissions.length}
      />

      {/* Seletor de Role (se tiver múltiplos papéis) */}
      {activeRole && (
        <RoleSwitcher />
      )}

      {/* Renderiza seções dinamicamente */}
      {sortedCategories.map(([category, widgets]) => {
        const config = CATEGORY_CONFIG[category as WidgetCategory];
        if (!config) return null;

        const sortedWidgets = widgets.sort((a, b) => a.order - b.order);

        return (
          <section key={category} className="dashboard-section">
            <div className="section-header" style={{ borderLeftColor: config.color }}>
              <span className="material-symbols-outlined section-icon" style={{ color: config.color }}>
                {config.icon}
              </span>
              <h2 className="section-title">{config.title}</h2>
              <span className="widget-count">{sortedWidgets.length} widgets</span>
            </div>

            <div className="widgets-grid">
              {sortedWidgets.map(widget => {
                const WidgetComponent = widget.component;
                const widgetState = dashboardData[widget.id];

                return (
                  <div 
                    key={widget.id} 
                    className={`widget-wrapper widget-${widget.size}`}
                  >
                    <WidgetHeader 
                      title={widget.title} 
                      description={widget.description} 
                    />
                    <div className="widget-content">
                      {widgetState?.isLoading ? (
                        <WidgetSkeleton />
                      ) : widgetState?.error ? (
                        <WidgetError 
                          message={widgetState.error} 
                          onRetry={() => window.location.reload()} 
                        />
                      ) : (
                        <WidgetComponent 
                          data={widgetState?.data}
                          isLoading={dataLoading}
                          error={widgetState?.error}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* Se não há widgets autorizados */}
      {authorizedWidgets.length === 0 && (
        <div className="empty-dashboard">
          <span className="material-symbols-outlined">dashboard_customize</span>
          <h3>Nenhum widget disponível</h3>
          <p>Você não possui permissões para visualizar widgets do dashboard.</p>
          <p className="text-small text-muted">
            Role atual: {activeRole || 'Nenhum'} • Permissões: {permissions.length}
          </p>
        </div>
      )}
    </div>
  );
}

// 🆕 Componente para trocar de role
function RoleSwitcher() {
  const { roles, activeRole, switchRole } = useAuth();

  if (roles.length <= 1) return null;

  const roleLabels: Record<Role, string> = {
    student: 'Estudante',
    teacher: 'Docente',
    supervisor: 'Supervisor',
    reviewer: 'Revisor',
    coordinator: 'Coordenador',
    secretary: 'Secretário',
    admin: 'Administrador',
  };

  return (
    <div className="role-switcher">
      {roles.map(role => (
        <button
          key={role}
          className={`role-btn ${role === activeRole ? 'active' : ''}`}
          onClick={() => switchRole(role)}
        >
          {roleLabels[role]}
        </button>
      ))}
    </div>
  );
}

// Componentes auxiliares
function DashboardHeader({ 
  userName, 
  activeRole,
  activeProfile,
  permissionsCount 
}: { 
  userName: string;
  activeRole: Role | null;
  activeProfile: Profile | null;
  permissionsCount: number;
}) {
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Bom dia' : currentHour < 18 ? 'Boa tarde' : 'Boa noite';

  const roleLabels: Record<Role, string> = {
    student: 'Estudante',
    teacher: 'Docente',
    supervisor: 'Supervisor',
    reviewer: 'Revisor',
    coordinator: 'Coordenador',
    secretary: 'Secretário',
    admin: 'Administrador',
  };

  const roleLabel = activeRole ? roleLabels[activeRole] : '';

  return (
    <div className="dashboard-header">
      <div className="header-content">
        <div className="user-info">
          <div className="user-avatar-placeholder">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="greeting">{greeting}, {userName}</h1>
            <p className="subtitle">
              {roleLabel && <span className="role-badge">{roleLabel}</span>}
              {activeProfile?.organ && <span> • {activeProfile.organ.name}</span>}
              {activeProfile?.course && <span> • {activeProfile.course.name}</span>}
              {activeProfile?.scientific_area && <span> • {activeProfile.scientific_area.name}</span>}
            </p>
            <p className="permissions-info">
              {permissionsCount} permissões ativas •{' '}
              {new Date().toLocaleDateString('pt-MZ', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary">
            <span className="material-symbols-outlined">tune</span>
            Personalizar
          </button>
          <button className="btn btn-primary">
            <span className="material-symbols-outlined">refresh</span>
            Atualizar
          </button>
        </div>
      </div>
    </div>
  );
}

function WidgetHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="widget-header">
      <div>
        <h3 className="widget-title">{title}</h3>
        {description && <p className="widget-description">{description}</p>}
      </div>
      <button className="widget-menu-btn">
        <span className="material-symbols-outlined">more_vert</span>
      </button>
    </div>
  );
}

function WidgetSkeleton() {
  return (
    <div className="widget-skeleton">
      <div className="skeleton-line skeleton-line-long"></div>
      <div className="skeleton-line skeleton-line-medium"></div>
      <div className="skeleton-line skeleton-line-short"></div>
      <div className="skeleton-line skeleton-line-medium"></div>
    </div>
  );
}

function WidgetError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="widget-error">
      <span className="material-symbols-outlined">error_outline</span>
      <p>{message}</p>
      <button onClick={onRetry} className="btn btn-small">
        Tentar novamente
      </button>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="dashboard-container">
      <div className="dashboard-header" style={{ height: '120px', padding: 'var(--space-3)' }}>
        <div className="skeleton-line skeleton-line-long" style={{ width: '300px' }}></div>
        <div className="skeleton-line skeleton-line-medium" style={{ width: '200px', marginTop: 'var(--space-2)' }}></div>
      </div>
      <div className="widgets-grid" style={{ marginTop: 'var(--space-4)' }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="widget-wrapper">
            <div className="widget-header">
              <div className="skeleton-line skeleton-line-medium" style={{ width: '150px' }}></div>
            </div>
            <div className="widget-content">
              <WidgetSkeleton />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}