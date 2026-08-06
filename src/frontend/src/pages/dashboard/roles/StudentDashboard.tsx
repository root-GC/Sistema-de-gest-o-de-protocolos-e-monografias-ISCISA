// src/pages/dashboard/StudentDashboard.tsx
import { useRoleDashboard } from '../../../hooks/useRoleDashboard';
import type { StudentDashboardPayload } from '../../../types/dashboard';
import { ProtocolTimeline } from '../components/ProtocolTimeline';
import { NotificationsPanel } from '../components/NotificationsPanel';
import { LoadingSpinner } from '../../../components/LoadingSpinner';

export function StudentDashboard() {
  const { data, isLoading, error } = useRoleDashboard<StudentDashboardPayload>();

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '60vh',
        fontFamily: 'var(--font-family)',
        color: 'var(--on-surface-variant)',
        fontSize: 'var(--body-lg)',
        gap: 'var(--space-2)'
      }}>
        <span style={{
          width: '24px',
          height: '24px',
          border: '3px solid var(--outline-variant)',
          borderTopColor: 'var(--primary)',
          borderRadius: 'var(--radius-full)',
          animation: 'spin 0.8s linear infinite'
        }} />
        A carregar o teu processo...
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        padding: 'var(--space-3) var(--space-4)',
        background: 'var(--error-container)',
        color: 'var(--on-error-container)',
        borderRadius: 'var(--radius-lg)',
        fontSize: 'var(--body-md)',
        fontWeight: 'var(--font-medium)'
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>error</span>
        {error}
      </div>
    );
  }

  if (!data) return null;

  const hasProtocol = data.phase === 'protocol' && data.protocol;
  const hasTopic = data.phase === 'topic' && data.topic;
  const isPhaseNone = data.phase === 'none';

  return (
    <div style={{
      width: '100%',
      fontFamily: 'var(--font-family)',
      color: 'var(--on-background)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-4)'
    }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: 'var(--space-3)',
        marginBottom: 'var(--space-2)'
      }}>
        <div>
          <h1 style={{
            fontSize: 'var(--headline-lg)',
            fontWeight: 'var(--font-semibold)',
            color: 'var(--on-surface)',
            marginBottom: 'var(--space-1)'
          }}>
            Olá, <span style={{ color: 'var(--primary)', fontWeight: 'var(--font-bold)' }}>{data.profile.name}</span>
          </h1>
          {data.profile.supervisor && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: 'var(--space-2) var(--space-3)',
              background: 'var(--surface-container)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--outline-variant)',
              fontSize: 'var(--body-md)',
              color: 'var(--on-surface-variant)'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--primary)' }} aria-hidden="true">
                person
              </span>
              <span>
                Supervisor: <strong style={{ color: 'var(--on-surface)' }}>{data.profile.supervisor}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Phase indicator */}
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 16px',
          borderRadius: 'var(--radius-full)',
          fontSize: 'var(--label-md)',
          fontWeight: 'var(--font-medium)',
          background: isPhaseNone 
            ? 'var(--surface-container)' 
            : hasTopic 
              ? 'var(--secondary-container)' 
              : 'var(--primary-container)',
          color: isPhaseNone 
            ? 'var(--on-surface-variant)' 
            : hasTopic 
              ? 'var(--on-secondary-container)' 
              : 'var(--on-primary-container)',
          whiteSpace: 'nowrap'
        }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: 'var(--radius-full)',
            background: isPhaseNone 
              ? 'var(--outline)' 
              : hasTopic 
                ? 'var(--secondary)' 
                : 'var(--primary)'
          }} />
          {isPhaseNone ? 'Sem tema' : hasTopic ? 'Em análise' : 'Protocolo ativo'}
        </span>
      </header>

      {/* Main Content */}
      <section style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)'
      }}>
        {/* Phase: None */}
        {isPhaseNone && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--space-4)',
            padding: 'var(--space-5) var(--space-4)',
            background: 'var(--surface-container-low)',
            borderRadius: 'var(--radius-xl)',
            border: '1px dashed var(--outline-variant)'
          }}>
            <span className="material-symbols-outlined" style={{
              fontSize: '48px',
              color: 'var(--outline-variant)',
              flexShrink: 0
            }} aria-hidden="true">
              edit_note
            </span>
            <div>
              <h2 style={{
                fontSize: 'var(--title-md)',
                fontWeight: 'var(--font-semibold)',
                color: 'var(--on-surface)',
                marginBottom: 'var(--space-1)'
              }}>
                Nenhum tema submetido
              </h2>
              <p style={{
                fontSize: 'var(--body-md)',
                color: 'var(--on-surface-variant)',
                lineHeight: 1.5
              }}>
                Ainda não submeteste nenhum tema. Podes fazê-lo em{' '}
                <strong style={{ color: 'var(--primary)' }}>"Novo tema"</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Phase: Topic */}
        {hasTopic && (
          <div className="card" style={{
            padding: 'var(--space-4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: 'var(--space-2)'
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={{
                  fontSize: 'var(--title-md)',
                  fontWeight: 'var(--font-semibold)',
                  color: 'var(--on-surface)',
                  marginBottom: 'var(--space-1)',
                  wordBreak: 'break-word'
                }}>
                  {data.topic!.title}
                </h2>
              </div>
              <StatusBadge 
                label={data.topic!.status_label} 
                rejected={data.topic!.rejected} 
              />
            </div>
            
            {data.topic!.rejected && (
              <div role="alert" style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--space-2)',
                padding: 'var(--space-3)',
                background: 'var(--error-container)',
                color: 'var(--on-error-container)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--error)',
                fontSize: 'var(--body-md)'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px', flexShrink: 0 }} aria-hidden="true">
                  warning
                </span>
                <p style={{ lineHeight: 1.5 }}>
                  O teu tema não foi aprovado nesta fase. Verifica os comentários e submete uma nova versão.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Phase: Protocol */}
        {hasProtocol && (
          <div className="card" style={{
            padding: 'var(--space-4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: 'var(--space-2)'
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={{
                  fontSize: 'var(--title-md)',
                  fontWeight: 'var(--font-semibold)',
                  color: 'var(--on-surface)',
                  marginBottom: 'var(--space-2)',
                  wordBreak: 'break-word',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  flexWrap: 'wrap'
                }}>
                  {data.protocol!.title}
                  {data.protocol!.code && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '2px 10px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: 'var(--label-md)',
                      fontWeight: 'var(--font-semibold)',
                      background: 'var(--secondary-container)',
                      color: 'var(--on-secondary-container)',
                      whiteSpace: 'nowrap'
                    }}>
                      {data.protocol!.code}
                    </span>
                  )}
                </h2>
              </div>
              <StatusBadge 
                label={data.protocol!.stage_label} 
                rejected={data.protocol!.is_rejected} 
              />
            </div>

            {data.protocol!.is_rejected ? (
              <div role="alert" style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--space-2)',
                padding: 'var(--space-3)',
                background: 'var(--error-container)',
                color: 'var(--on-error-container)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--error)',
                fontSize: 'var(--body-md)'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px', flexShrink: 0 }} aria-hidden="true">
                  warning
                </span>
                <p style={{ lineHeight: 1.5 }}>
                  O protocolo não foi aprovado nesta fase. Verifica os pareceres para os próximos passos.
                </p>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)'
              }}>
                {data.protocol!.next_action && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 'var(--space-2)',
                    padding: 'var(--space-3)',
                    background: 'var(--tertiary-container)',
                    color: 'var(--on-tertiary-container)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--tertiary)'
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', flexShrink: 0 }} aria-hidden="true">
                      next_plan
                    </span>
                    <p style={{ fontSize: 'var(--body-md)', fontWeight: 'var(--font-medium)', lineHeight: 1.5 }}>
                      {data.protocol!.next_action}
                    </p>
                  </div>
                )}
                
                <div style={{
                  padding: 'var(--space-3)',
                  background: 'var(--surface-container-low)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--outline-variant)'
                }}>
                  <p style={{
                    fontSize: 'var(--label-md)',
                    fontWeight: 'var(--font-semibold)',
                    color: 'var(--on-surface-variant)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: 'var(--space-2)'
                  }}>
                    Progresso
                  </p>
                  <ProtocolTimeline steps={data.protocol!.timeline} />
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Notifications */}
      <NotificationsPanel items={data.notifications} />
    </div>
  );
}

function StatusBadge({ label, rejected }: { label: string; rejected: boolean }) {
  return (
    <span 
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 12px',
        borderRadius: 'var(--radius-full)',
        fontSize: 'var(--label-md)',
        fontWeight: 'var(--font-medium)',
        background: rejected 
          ? 'var(--error-container)' 
          : 'var(--primary-container)',
        color: rejected 
          ? 'var(--on-error-container)' 
          : 'var(--on-primary-container)',
        whiteSpace: 'nowrap',
        flexShrink: 0
      }}
      role="status"
    >
      <span style={{
        width: '6px',
        height: '6px',
        borderRadius: 'var(--radius-full)',
        background: rejected ? 'var(--error)' : 'var(--primary)'
      }} />
      {label}
    </span>
  );
}