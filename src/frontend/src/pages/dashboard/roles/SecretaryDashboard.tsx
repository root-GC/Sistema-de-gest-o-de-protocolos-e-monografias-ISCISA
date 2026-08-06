// src/pages/secretary/SecretaryDashboard.tsx
import { useRoleDashboard } from '../../../hooks/useRoleDashboard';
import type { SecretaryDashboardPayload } from '../../../types/dashboard';
import { useAuth } from '../../../context/AuthContext';
import { NotificationsPanel } from '../components/NotificationsPanel';
import { useMemo } from 'react';

export function SecretaryDashboard() {
  const { profiles } = useAuth();
  const { data, isLoading, error } = useRoleDashboard<SecretaryDashboardPayload>();

  // Obter o órgão do secretário
  const secretaryOrganId = useMemo(() => {
    const secretaryProfile = profiles?.secretary;
    return (secretaryProfile as any)?.organ_id || secretaryProfile?.organ?.id || null;
  }, [profiles]);

  const secretaryOrganType = useMemo(() => {
    const secretaryProfile = profiles?.secretary;
    return (secretaryProfile as any)?.organ?.type || null;
  }, [profiles]);

  // Mapear o tipo de órgão para a chave do comité
  const organCommitteeKey = useMemo(() => {
    switch (secretaryOrganType) {
      case 'nucleus':
        return 'nucleo';
      case 'scientific_committee':
        return 'comite_cientifico';
      case 'bioethics_committee':
        return 'comite_bioetica';
      default:
        return null;
    }
  }, [secretaryOrganType]);

  // Configuração dos comités
  const allCommittees = useMemo(() => [
    { 
      key: 'nucleo',
      label: 'Núcleo Científico', 
      icon: 'biotech',
      color: 'var(--tertiary)',
      bg: 'var(--tertiary-container)',
      textColor: 'var(--on-tertiary-container)',
      organType: 'nucleus'
    },
    { 
      key: 'comite_cientifico',
      label: 'Comité Científico', 
      icon: 'school',
      color: 'var(--primary)',
      bg: 'var(--primary-container)',
      textColor: 'var(--on-primary-container)',
      organType: 'scientific_committee'
    },
    { 
      key: 'comite_bioetica',
      label: 'Comité de Bioética', 
      icon: 'health_and_safety',
      color: 'var(--secondary)',
      bg: 'var(--secondary-container)',
      textColor: 'var(--on-secondary-container)',
      organType: 'bioethics_committee'
    },
  ], []);

  // Filtrar apenas o comité do secretário
  const myCommittee = useMemo(() => {
    return allCommittees.find(c => c.organType === secretaryOrganType) || null;
  }, [allCommittees, secretaryOrganType]);

  // Dados da fila e notificações
  const queue = data?.queue;
  
  // Total pendente apenas do órgão do secretário
  const totalPending = useMemo(() => {
    if (!queue || !organCommitteeKey) return 0;
    
    switch (organCommitteeKey) {
      case 'nucleo':
        return queue.pending_nucleo || 0;
      case 'comite_cientifico':
        return queue.pending_comite_cientifico || 0;
      case 'comite_bioetica':
        return queue.pending_comite_bioetica || 0;
      default:
        return 0;
    }
  }, [queue, organCommitteeKey]);

  // Filtrar itens da fila pelo comité do secretário
  const myQueueItems = useMemo(() => {
    if (!queue?.items || !organCommitteeKey) return [];
    
    return (queue.items as Array<{
      protocol_id: number;
      title: string | null;
      waiting_since: string | null;
      action_needed: string;
      committee?: string;
    }>).filter(item => item.committee === organCommitteeKey);
  }, [queue?.items, organCommitteeKey]);

  // Notificações
  const notifications = data?.notifications || [];

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

  if (!data || !myCommittee) {
    return (
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
        color: 'var(--on-surface-variant)',
        fontFamily: 'var(--font-family)'
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--outline-variant)' }}>
          account_balance
        </span>
        <p style={{ fontSize: 'var(--body-lg)', fontWeight: 'var(--font-medium)' }}>
          Órgão não encontrado
        </p>
        <p style={{ fontSize: 'var(--body-md)' }}>
          Não foi possível identificar o teu órgão. Contacta o administrador.
        </p>
      </div>
    );
  }

  // Destructuring depois de todas as verificações
  const organName = myCommittee.label;
  const organColor = myCommittee.color;
  const organBg = myCommittee.bg;
  const organTextColor = myCommittee.textColor;
  const organIcon = myCommittee.icon;

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
            color: 'var(--on-surface-variant)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)'
          }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              fontSize: 'var(--label-sm)',
              fontWeight: 'var(--font-medium)',
              background: organBg,
              color: organTextColor
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{organIcon}</span>
              {organName}
            </span>
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

      {/* Stats Card - Apenas do órgão do secretário */}
      <div style={{
        padding: 'var(--space-4)',
        background: organBg,
        borderRadius: 'var(--radius-xl)',
        border: `1px solid ${organColor}20`,
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-4)',
        flexWrap: 'wrap',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background icon decoration */}
        <span className="material-symbols-outlined" style={{
          position: 'absolute',
          right: '-10px',
          top: '-10px',
          fontSize: '120px',
          color: `${organColor}10`,
          userSelect: 'none',
          pointerEvents: 'none'
        }}>
          {organIcon}
        </span>

        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: 'var(--radius-lg)',
          background: `${organColor}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <span className="material-symbols-outlined" style={{
            fontSize: '28px',
            color: organColor
          }}>
            {organIcon}
          </span>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{
            fontSize: 'var(--label-md)',
            fontWeight: 'var(--font-medium)',
            color: organTextColor,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            display: 'block',
            marginBottom: 'var(--space-1)'
          }}>
            {organName}
          </span>
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 'var(--space-1)'
          }}>
            <span style={{
              fontSize: 'var(--display-sm)',
              fontWeight: 'var(--font-bold)',
              color: organTextColor,
              lineHeight: 1
            }}>
              {totalPending}
            </span>
            <span style={{
              fontSize: 'var(--body-md)',
              color: organTextColor,
              opacity: 0.8
            }}>
              {totalPending === 1 ? 'protocolo pendente' : 'protocolos pendentes'}
            </span>
          </div>
        </div>
      </div>

      {/* Queue Items - Apenas do órgão do secretário */}
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
            Pendentes de atribuição • {organName}
          </h2>
          
          {myQueueItems.length > 0 && (
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
          )}
        </div>

        {myQueueItems.length === 0 ? (
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
              Todos os protocolos do {organName} foram atribuídos.
            </p>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)'
          }}>
            {myQueueItems.map((item, index) => (
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
                    background: organBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <span className="material-symbols-outlined" style={{
                      fontSize: '20px',
                      color: organColor
                    }}>
                      {organIcon}
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
            ))}
          </div>
        )}
      </section>

      {/* Notifications */}
      <NotificationsPanel 
        items={notifications} 
      />

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