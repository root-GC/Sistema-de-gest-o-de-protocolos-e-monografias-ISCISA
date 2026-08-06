import { useRoleDashboard } from '../../../hooks/useRoleDashboard';
import type { SecretaryDashboardPayload } from '../../../types/dashboard';
import { NotificationsPanel } from '../components/NotificationsPanel';

export function SecretaryDashboard() {
  const { data, isLoading, error } = useRoleDashboard<SecretaryDashboardPayload>();

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
        A carregar a tua fila de trabalho...
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

  const { queue } = data;
  const committees = [
    { 
      key: 'nucleo',
      label: 'Núcleo Científico', 
      count: queue.pending_nucleo,
      icon: 'biotech',
      color: 'var(--tertiary)',
      bg: 'var(--tertiary-container)',
      textColor: 'var(--on-tertiary-container)'
    },
    { 
      key: 'comite_cientifico',
      label: 'Comité Científico', 
      count: queue.pending_comite_cientifico,
      icon: 'school',
      color: 'var(--primary)',
      bg: 'var(--primary-container)',
      textColor: 'var(--on-primary-container)'
    },
    { 
      key: 'comite_bioetica',
      label: 'Comité de Bioética', 
      count: queue.pending_comite_bioetica,
      icon: 'health_and_safety',
      color: 'var(--secondary)',
      bg: 'var(--secondary-container)',
      textColor: 'var(--on-secondary-container)'
    },
  ];

  const totalPending = queue.pending_nucleo + queue.pending_comite_cientifico + queue.pending_comite_bioetica;

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
        alignItems: 'center',
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
            Fila de atribuição
          </h1>
          <p style={{
            fontSize: 'var(--body-md)',
            color: 'var(--on-surface-variant)'
          }}>
            Gira as submissões pendentes de revisão
          </p>
        </div>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 16px',
          borderRadius: 'var(--radius-full)',
          fontSize: 'var(--label-md)',
          fontWeight: 'var(--font-medium)',
          background: totalPending > 0 ? 'var(--error-container)' : 'var(--primary-container)',
          color: totalPending > 0 ? 'var(--on-error-container)' : 'var(--on-primary-container)'
        }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: 'var(--radius-full)',
            background: totalPending > 0 ? 'var(--error)' : 'var(--primary)',
            animation: totalPending > 0 ? 'pulse 2s infinite' : 'none'
          }} />
          {totalPending} pendente{totalPending !== 1 ? 's' : ''}
        </span>
      </header>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 'var(--space-3)'
      }}>
        {committees.map(committee => (
          <div
            key={committee.key}
            style={{
              padding: 'var(--space-4)',
              background: committee.bg,
              borderRadius: 'var(--radius-xl)',
              border: `1px solid ${committee.color}20`,
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
              transition: 'all 0.2s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Background icon decoration */}
            <span className="material-symbols-outlined" style={{
              position: 'absolute',
              right: '-10px',
              top: '-10px',
              fontSize: '80px',
              color: `${committee.color}15`,
              userSelect: 'none',
              pointerEvents: 'none'
            }}>
              {committee.icon}
            </span>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)'
            }}>
              <span className="material-symbols-outlined" style={{
                fontSize: '24px',
                color: committee.color
              }}>
                {committee.icon}
              </span>
              <span style={{
                fontSize: 'var(--label-md)',
                fontWeight: 'var(--font-medium)',
                color: committee.textColor,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {committee.label}
              </span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 'var(--space-1)'
            }}>
              <span style={{
                fontSize: 'var(--display-sm)',
                fontWeight: 'var(--font-bold)',
                color: committee.textColor,
                lineHeight: 1
              }}>
                {committee.count}
              </span>
              <span style={{
                fontSize: 'var(--body-md)',
                color: committee.textColor,
                opacity: 0.8
              }}>
                {committee.count === 1 ? 'protocolo' : 'protocolos'}
              </span>
            </div>

            {/* Progress bar */}
            <div style={{
              width: '100%',
              height: '4px',
              background: `${committee.color}20`,
              borderRadius: 'var(--radius-full)',
              overflow: 'hidden'
            }}>
              <div style={{
                width: totalPending > 0 ? `${(committee.count / totalPending) * 100}%` : '0%',
                height: '100%',
                background: committee.color,
                borderRadius: 'var(--radius-full)',
                transition: 'width 0.5s ease'
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Queue Items */}
      <section style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-2)'
        }}>
          <h2 style={{
            fontSize: 'var(--title-md)',
            fontWeight: 'var(--font-semibold)',
            color: 'var(--on-surface)'
          }}>
            Pendentes de atribuição
          </h2>
          
          {totalPending > 0 && (
            <div style={{
              display: 'flex',
              gap: 'var(--space-2)'
            }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                fontSize: 'var(--label-sm)',
                fontWeight: 'var(--font-medium)',
                background: 'var(--surface-container)',
                color: 'var(--on-surface-variant)'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>sort</span>
                Mais antigos primeiro
              </span>
            </div>
          )}
        </div>

        {totalPending === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-5) var(--space-3)',
            background: 'var(--surface-container-low)',
            borderRadius: 'var(--radius-xl)',
            border: '1px dashed var(--outline-variant)',
            textAlign: 'center',
            color: 'var(--on-surface-variant)'
          }}>
            <span className="material-symbols-outlined" style={{
              fontSize: '48px',
              color: 'var(--outline-variant)'
            }}>
              task_alt
            </span>
            <p style={{
              fontSize: 'var(--body-lg)',
              fontWeight: 'var(--font-medium)'
            }}>
              Fila limpa!
            </p>
            <p style={{
              fontSize: 'var(--body-md)'
            }}>
              Todos os protocolos foram atribuídos.
            </p>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)'
          }}>
            {(queue.items as Array<{
              protocol_id: number;
              title: string | null;
              waiting_since: string | null;
              action_needed: string;
              committee?: string;
            }>).map((item, index) => {
              const committee = committees.find(c => c.key === item.committee);

              return (
                <div
                  key={item.protocol_id}
                  className="card"
                  style={{
                    padding: 'var(--space-3) var(--space-4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 'var(--space-3)',
                    flexWrap: 'wrap',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                >
                  {/* Urgency indicator for first items */}
                  {index < 3 && (
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: '4px',
                      background: index === 0 ? 'var(--error)' : index === 1 ? 'var(--warning)' : 'var(--tertiary)',
                      borderRadius: 'var(--radius-lg) 0 0 var(--radius-lg)'
                    }} />
                  )}

                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 'var(--space-3)',
                    flex: 1,
                    minWidth: 0
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: 'var(--radius-lg)',
                      background: committee?.bg || 'var(--surface-container)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <span className="material-symbols-outlined" style={{
                        fontSize: '20px',
                        color: committee?.color || 'var(--on-surface-variant)'
                      }}>
                        {committee?.icon || 'description'}
                      </span>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                        flexWrap: 'wrap',
                        marginBottom: '4px'
                      }}>
                        <h3 style={{
                          fontSize: 'var(--body-lg)',
                          fontWeight: 'var(--font-semibold)',
                          color: 'var(--on-surface)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          flex: 1
                        }}>
                          {item.title ?? `Protocolo #${item.protocol_id}`}
                        </h3>
                        
                        {index === 0 && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: 'var(--label-xs)',
                            fontWeight: 'var(--font-semibold)',
                            background: 'var(--error-container)',
                            color: 'var(--on-error-container)',
                            whiteSpace: 'nowrap'
                          }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>priority_high</span>
                            Prioritário
                          </span>
                        )}
                      </div>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-3)',
                        flexWrap: 'wrap'
                      }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: 'var(--label-sm)',
                          color: 'var(--on-surface-variant)'
                        }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>schedule</span>
                          {item.waiting_since 
                            ? `Desde ${new Date(item.waiting_since).toLocaleDateString('pt-MZ', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}`
                            : 'Data indisponível'}
                        </span>

                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: 'var(--label-xs)',
                          fontWeight: 'var(--font-medium)',
                          background: committee?.bg || 'var(--surface-container)',
                          color: committee?.textColor || 'var(--on-surface-variant)'
                        }}>
                          <span style={{
                            width: '4px',
                            height: '4px',
                            borderRadius: 'var(--radius-full)',
                            background: committee?.color || 'var(--outline)'
                          }} />
                          {committee?.label || 'Comité'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action button */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    flexShrink: 0
                  }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: 'var(--label-sm)',
                      fontWeight: 'var(--font-medium)',
                      background: 'var(--surface-container)',
                      color: 'var(--on-surface-variant)'
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>assignment_ind</span>
                      {item.action_needed}
                    </span>
                    
                    <span className="material-symbols-outlined" style={{
                      fontSize: '20px',
                      color: 'var(--on-surface-variant)',
                      opacity: 0.5
                    }}>
                      chevron_right
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Notifications */}
      <NotificationsPanel items={data.notifications} />

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}