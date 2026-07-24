// src/pages/dashboard/DashboardPage.tsx
import { useMemo, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import type { Role, Profile } from '../../context/AuthContext';
import { DASHBOARD_WIDGETS } from './widgets';
import { CATEGORY_CONFIG } from '../../types/dashboard';
import type { WidgetCategory } from '../../types/dashboard';
import { useDashboardData } from '../../hooks/useDashboardData';
import { LoadingSpinner } from '../../components/LoadingSpinner';
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

  const [refreshing, setRefreshing] = useState(false);

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

  // Carrega dados dos widgets
  const { dashboardData, isLoading: dataLoading } = useDashboardData(widgetIds, endpoints);

  // Função para recarregar o dashboard
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    window.location.reload();
  }, []);

  // Loading inicial (auth)
  if (authLoading) {
    return (
      <div className="dashboard-container">
        <DashboardSkeleton />
      </div>
    );
  }

  // Sem usuário
  if (!user) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '60vh', gap: 'var(--space-3)',
        fontFamily: 'var(--font-family)', color: 'var(--on-surface-variant)'
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: '56px', color: 'var(--error)' }}>
          error_outline
        </span>
        <h3 style={{ fontSize: 'var(--title-md)', color: 'var(--on-surface)' }}>
          Sessão não encontrada
        </h3>
        <p>Faça login para acessar o dashboard.</p>
      </div>
    );
  }

  // Loading dos widgets
  if (dataLoading) {
    return (
      <div className="dashboard-container">
        <DashboardHeaderSkeleton />
        <div style={{ padding: 'var(--space-4)' }}>
          <LoadingSpinner variant="page" text="A carregar dashboard..." />
        </div>
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
      {/* Overlay de refresh */}
      {refreshing && <LoadingSpinner variant="overlay" text="A actualizar dashboard..." />}

      {/* Header do Dashboard */}
      <DashboardHeader 
        userName={user.name}
        activeRole={activeRole}
        activeProfile={activeProfile}
        permissionsCount={permissions.length}
        onRefresh={handleRefresh}
        refreshing={refreshing}
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
                          onRetry={handleRefresh} 
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
        <div style={{
          textAlign: 'center', padding: 'var(--space-6) var(--space-3)',
          color: 'var(--on-surface-variant)', fontFamily: 'var(--font-family)'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '56px', marginBottom: 'var(--space-3)', display: 'block' }}>
            dashboard_customize
          </span>
          <h3 style={{ fontSize: 'var(--title-md)', color: 'var(--on-surface)', marginBottom: 'var(--space-1)' }}>
            Nenhum widget disponível
          </h3>
          <p>Você não possui permissões para visualizar widgets do dashboard.</p>
          <p style={{ fontSize: 'var(--label-md)', color: 'var(--outline)', marginTop: 'var(--space-1)' }}>
            Role atual: {activeRole || 'Nenhum'} • Permissões: {permissions.length}
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================
// COMPONENTES AUXILIARES
// ============================================================

function RoleSwitcher() {
  const { roles, activeRole, switchRole } = useAuth();
  const [switching, setSwitching] = useState<string | null>(null);

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

  async function handleSwitch(role: Role) {
    setSwitching(role);
    // Pequeno delay para feedback visual
    await new Promise(resolve => setTimeout(resolve, 200));
    switchRole(role);
    setSwitching(null);
  }

  return (
    <div className="role-switcher" style={{ marginBottom: 'var(--space-3)' }}>
      {roles.map(role => (
        <button
          key={role}
          className={`role-btn ${role === activeRole ? 'active' : ''}`}
          onClick={() => handleSwitch(role)}
          disabled={switching !== null}
          style={{
            cursor: switching ? 'wait' : 'pointer',
            opacity: switching === role ? 0.7 : 1
          }}
        >
          {switching === role ? (
            <>
              <span style={{
                width: '14px', height: '14px',
                border: '2px solid currentColor',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 0.6s linear infinite',
                display: 'inline-block',
                marginRight: '6px',
                verticalAlign: 'middle'
              }} />
              A mudar...
            </>
          ) : (
            roleLabels[role]
          )}
        </button>
      ))}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function DashboardHeader({ 
  userName, 
  activeRole,
  activeProfile,
  permissionsCount,
  onRefresh,
  refreshing
}: { 
  userName: string;
  activeRole: Role | null;
  activeProfile: Profile | null;
  permissionsCount: number;
  onRefresh: () => void;
  refreshing: boolean;
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
    <div className="dashboard-header" style={{ marginBottom: 'var(--space-4)' }}>
      <div className="header-content">
        <div className="user-info">
          <div className="user-avatar-placeholder">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="greeting" style={{ margin: 0 }}>{greeting}, {userName}</h1>
            <p className="subtitle" style={{ margin: '4px 0' }}>
              {roleLabel && <span className="role-badge">{roleLabel}</span>}
              {activeProfile && 'organ' in activeProfile && activeProfile.organ && <span> • {activeProfile.organ.name}</span>}
              {activeProfile && 'course' in activeProfile && activeProfile.course && (
                <span> • {activeProfile.course.name}</span>
              )}
              {activeProfile && 'scientific_area' in activeProfile && activeProfile.scientific_area && (
                <span> • {activeProfile.scientific_area.name}</span>
              )}
            </p>
            <p className="permissions-info" style={{ margin: 0, fontSize: 'var(--label-md)', color: 'var(--on-surface-variant)' }}>
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
        <div className="header-actions" style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="btn btn-secondary" disabled={refreshing} style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-1)',
            cursor: refreshing ? 'not-allowed' : 'pointer', opacity: refreshing ? 0.7 : 1
          }}>
            <span className="material-symbols-outlined">tune</span>
            Personalizar
          </button>
          <button 
            className="btn btn-primary" 
            onClick={onRefresh} 
            disabled={refreshing}
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-1)',
              cursor: refreshing ? 'not-allowed' : 'pointer', opacity: refreshing ? 0.7 : 1
            }}
          >
            {refreshing ? (
              <>
                <span style={{
                  width: '16px', height: '16px',
                  border: '2px solid var(--on-primary)',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.7s linear infinite'
                }} />
                A actualizar...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">refresh</span>
                Atualizar
              </>
            )}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function DashboardHeaderSkeleton() {
  return (
    <div className="dashboard-header" style={{ padding: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <div className="skeleton" style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-full)' }} />
        <div>
          <div className="skeleton" style={{ width: '250px', height: '22px', marginBottom: '8px', borderRadius: 'var(--radius-md)' }} />
          <div className="skeleton" style={{ width: '180px', height: '14px', borderRadius: 'var(--radius-md)' }} />
        </div>
      </div>
    </div>
  )
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
    <div style={{ padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <div className="skeleton skeleton--text-long" />
      <div className="skeleton skeleton--text-medium" />
      <div className="skeleton skeleton--text-short" />
      <div className="skeleton skeleton--text-medium" />
    </div>
  );
}

function WidgetError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: 'var(--space-4)', gap: 'var(--space-2)',
      textAlign: 'center', fontFamily: 'var(--font-family)'
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--error)' }}>
        error_outline
      </span>
      <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)' }}>{message}</p>
      <button onClick={onRetry} className="btn btn-small" style={{
        padding: '8px 16px', cursor: 'pointer'
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '4px', verticalAlign: 'middle' }}>refresh</span>
        Tentar novamente
      </button>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="dashboard-container" style={{ fontFamily: 'var(--font-family)' }}>
      <DashboardHeaderSkeleton />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
        {[1, 2].map(section => (
          <div key={section}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
              marginBottom: 'var(--space-3)', padding: '0 var(--space-1)'
            }}>
              <div className="skeleton" style={{ width: '24px', height: '24px', borderRadius: 'var(--radius-md)' }} />
              <div className="skeleton" style={{ width: '180px', height: '20px', borderRadius: 'var(--radius-md)' }} />
            </div>
            <div className="widgets-grid">
              {[1, 2, 3].map(i => (
                <div key={i} className="widget-wrapper">
                  <div className="widget-header">
                    <div className="skeleton" style={{ width: '150px', height: '16px', borderRadius: 'var(--radius-md)' }} />
                  </div>
                  <WidgetSkeleton />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}