// pages/dashboard/widgets/ProtocolWorkflowWidget.tsx
import { useState } from 'react';
import type { WidgetProps } from '../../../types/dashboard';

interface WorkflowStep {
  id: string;
  label: string;
  description: string;
  icon: string;
  status: 'completed' | 'active' | 'pending' | 'rejected';
  date?: string;
  actor?: string;
  comment?: string;
  documents?: { name: string; url: string; status: 'approved' | 'pending' | 'rejected' }[];
}

interface ProtocolWorkflow {
  id: string;
  code: string;
  title: string;
  student: string;
  course: string;
  currentStep: number;
  totalSteps: number;
  estimatedCompletion: string;
  progressPercentage: number;
  steps: WorkflowStep[];
  timeline: {
    date: string;
    event: string;
    type: 'submission' | 'review' | 'approval' | 'rejection' | 'correction' | 'defense';
    details: string;
  }[];
}

export function ProtocolWorkflowWidget({ data }: WidgetProps) {
  const [selectedProtocol, setSelectedProtocol] = useState<string | null>(null);
  
  const protocols: ProtocolWorkflow[] = data?.protocols || [];
  const activeProtocol = selectedProtocol 
    ? protocols.find(p => p.id === selectedProtocol)
    : protocols[0];

  if (!activeProtocol) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-5)',
        gap: 'var(--space-3)'
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--outline-variant)' }}>
          account_tree
        </span>
        <p style={{ color: 'var(--on-surface-variant)' }}>Nenhum protocolo em andamento</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* ========================================== */}
      {/* 🔝 RESUMO DA TIMELINE - PROGRESSO COMPACTO  */}
      {/* ========================================== */}
      <div style={{
        background: 'linear-gradient(135deg, var(--surface-container-lowest), var(--surface-container-low))',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-4)',
        border: '1px solid var(--surface-container-high)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Fundo decorativo */}
        <div style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          width: '120px',
          height: '120px',
          background: 'var(--primary)',
          opacity: 0.03,
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />

        {/* Seletor de Protocolos */}
        {protocols.length > 1 && (
          <div style={{ 
            display: 'flex', 
            gap: 'var(--space-2)', 
            marginBottom: 'var(--space-4)',
            overflow: 'auto',
            padding: '4px 0'
          }}>
            {protocols.map(protocol => (
              <button
                key={protocol.id}
                onClick={() => setSelectedProtocol(protocol.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-full)',
                  border: selectedProtocol === protocol.id 
                    ? '2px solid var(--primary)' 
                    : '1px solid var(--outline-variant)',
                  background: selectedProtocol === protocol.id 
                    ? 'var(--primary-container)' 
                    : 'transparent',
                  color: selectedProtocol === protocol.id 
                    ? 'var(--on-primary-container)' 
                    : 'var(--on-surface-variant)',
                  fontFamily: 'var(--font-family)',
                  fontSize: 'var(--body-md)',
                  fontWeight: selectedProtocol === protocol.id ? 'var(--font-semibold)' : 'var(--font-regular)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: protocol.progressPercentage === 100 
                    ? 'var(--primary)' 
                    : protocol.progressPercentage > 0 
                      ? 'var(--tertiary)' 
                      : 'var(--outline-variant)'
                }} />
                {protocol.code}
              </button>
            ))}
          </div>
        )}

        {/* Header com info do protocolo */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-4)',
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: 1, minWidth: '250px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span style={{
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                fontSize: 'var(--label-md)',
                fontWeight: 'var(--font-bold)',
                background: 'var(--primary-container)',
                color: 'var(--primary)',
                letterSpacing: '0.05em'
              }}>
                {activeProtocol.code}
              </span>
              <span style={{
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                fontSize: 'var(--label-md)',
                fontWeight: 'var(--font-medium)',
                background: 'var(--surface-container-high)',
                color: 'var(--on-surface-variant)'
              }}>
                {activeProtocol.course}
              </span>
            </div>
            <h3 style={{
              fontSize: 'var(--title-md)',
              fontWeight: 'var(--font-semibold)',
              color: 'var(--on-surface)',
              margin: '0 0 4px 0',
              lineHeight: 1.3
            }}>
              {activeProtocol.title}
            </h3>
            <p style={{ 
              fontSize: 'var(--body-md)', 
              color: 'var(--on-surface-variant)',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>person</span>
              {activeProtocol.student}
              <span style={{ margin: '0 8px', color: 'var(--outline)' }}>•</span>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>event</span>
              Previsão: {activeProtocol.estimatedCompletion}
            </p>
          </div>

          {/* Indicador de Progresso com Círculo */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            background: 'var(--surface-container-low)',
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-xl)',
            minWidth: '200px'
          }}>
            <div style={{ position: 'relative', width: '72px', height: '72px', flexShrink: 0 }}>
              <svg width="72" height="72" viewBox="0 0 72 72">
                {/* Círculo de fundo */}
                <circle cx="36" cy="36" r="30" fill="none" stroke="var(--surface-container-high)" strokeWidth="5" />
                {/* Círculo de progresso */}
                <circle
                  cx="36" cy="36" r="30"
                  fill="none"
                  stroke={activeProtocol.progressPercentage === 100 ? 'var(--primary)' : 'var(--tertiary)'}
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 30}`}
                  strokeDashoffset={`${2 * Math.PI * 30 * (1 - activeProtocol.progressPercentage / 100)}`}
                  transform="rotate(-90 36 36)"
                  style={{ transition: 'stroke-dashoffset 1.5s ease' }}
                />
              </svg>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center'
              }}>
                <span style={{
                  fontSize: '16px',
                  fontWeight: 'var(--font-bold)',
                  color: 'var(--on-surface)',
                  display: 'block',
                  lineHeight: 1
                }}>
                  {activeProtocol.progressPercentage}%
                </span>
                <span style={{
                  fontSize: '10px',
                  color: 'var(--on-surface-variant)',
                  display: 'block',
                  marginTop: '2px'
                }}>
                  {activeProtocol.currentStep}/{activeProtocol.totalSteps} etapas
                </span>
              </div>
            </div>
            <div style={{ fontSize: 'var(--label-md)', color: 'var(--on-surface-variant)' }}>
              <div style={{ marginBottom: '4px' }}>
                <span style={{ fontWeight: 'var(--font-semibold)', color: 'var(--primary)' }}>
                  Etapa atual:
                </span>
                <br />
                {activeProtocol.steps[activeProtocol.currentStep - 1]?.label || 'Concluído'}
              </div>
              <div style={{
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--tertiary-container)',
                color: 'var(--on-tertiary-container)',
                fontWeight: 'var(--font-semibold)',
                display: 'inline-block',
                fontSize: '11px'
              }}>
                {activeProtocol.progressPercentage === 100 ? '✓ Concluído' : '⟳ Em progresso'}
              </div>
            </div>
          </div>
        </div>

        {/* 🔥 TIMELINE HORIZONTAL COMPACTA - FASES */}
        <div style={{
          position: 'relative',
          padding: 'var(--space-2) 0'
        }}>
          {/* Barra de progresso horizontal */}
          <div style={{
            position: 'absolute',
            top: '35px',
            left: '30px',
            right: '30px',
            height: '4px',
            background: 'var(--surface-container-high)',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${activeProtocol.progressPercentage}%`,
              background: 'linear-gradient(90deg, var(--primary), var(--tertiary))',
              borderRadius: 'var(--radius-full)',
              transition: 'width 1.5s ease'
            }} />
          </div>

          {/* Steps horizontais */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            position: 'relative',
            zIndex: 1,
            overflow: 'auto',
            gap: 'var(--space-1)'
          }}>
            {activeProtocol.steps.map((step, index) => {
              const statusColor = 
                step.status === 'completed' ? 'var(--primary)' :
                step.status === 'active' ? 'var(--tertiary)' :
                step.status === 'rejected' ? 'var(--error)' :
                'var(--outline-variant)';

              const statusBg = 
                step.status === 'completed' ? 'var(--primary-container)' :
                step.status === 'active' ? 'var(--tertiary-container)' :
                step.status === 'rejected' ? 'var(--error-container)' :
                'var(--surface-container)';

              return (
                <div key={step.id} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  minWidth: '80px',
                  flex: 1
                }}>
                  {/* Ícone do step */}
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: statusBg,
                    border: `3px solid ${statusColor}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    boxShadow: step.status === 'active' ? `0 0 0 6px ${statusColor}15` : 'none',
                    transform: step.status === 'active' ? 'scale(1.1)' : 'scale(1)'
                  }}>
                    {step.status === 'completed' ? (
                      <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '20px' }}>check</span>
                    ) : step.status === 'rejected' ? (
                      <span className="material-symbols-outlined" style={{ color: 'var(--error)', fontSize: '20px' }}>close</span>
                    ) : step.status === 'active' ? (
                      <div style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: 'var(--tertiary)',
                        animation: 'pulse 2s infinite'
                      }} />
                    ) : (
                      <span style={{ color: 'var(--on-surface-variant)', fontSize: '14px', fontWeight: 'var(--font-semibold)' }}>
                        {index + 1}
                      </span>
                    )}
                  </div>
                  
                  {/* Label do step */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: step.status === 'active' ? 'var(--font-bold)' : 'var(--font-medium)',
                      color: step.status === 'active' ? statusColor : 'var(--on-surface-variant)',
                      lineHeight: 1.3,
                      maxWidth: '90px'
                    }}>
                      {step.label}
                    </div>
                    {step.date && (
                      <div style={{
                        fontSize: '10px',
                        color: 'var(--outline)',
                        marginTop: '2px'
                      }}>
                        {step.date}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Métricas rápidas */}
        <div style={{
          display: 'flex',
          gap: 'var(--space-2)',
          marginTop: 'var(--space-4)',
          paddingTop: 'var(--space-3)',
          borderTop: '1px solid var(--outline-variant)',
          flexWrap: 'wrap'
        }}>
          <div style={{
            flex: 1,
            minWidth: '120px',
            padding: 'var(--space-2)',
            background: 'var(--primary-container)',
            borderRadius: 'var(--radius-lg)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 'var(--title-md)', fontWeight: 'var(--font-bold)', color: 'var(--primary)' }}>
              {activeProtocol.steps.filter(s => s.status === 'completed').length}
            </div>
            <div style={{ fontSize: 'var(--label-md)', color: 'var(--on-primary-container)' }}>Concluídas</div>
          </div>
          <div style={{
            flex: 1,
            minWidth: '120px',
            padding: 'var(--space-2)',
            background: 'var(--tertiary-container)',
            borderRadius: 'var(--radius-lg)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 'var(--title-md)', fontWeight: 'var(--font-bold)', color: 'var(--tertiary)' }}>
              {activeProtocol.steps.filter(s => s.status === 'active').length}
            </div>
            <div style={{ fontSize: 'var(--label-md)', color: 'var(--on-tertiary-container)' }}>Em Andamento</div>
          </div>
          <div style={{
            flex: 1,
            minWidth: '120px',
            padding: 'var(--space-2)',
            background: 'var(--surface-container-high)',
            borderRadius: 'var(--radius-lg)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 'var(--title-md)', fontWeight: 'var(--font-bold)', color: 'var(--on-surface-variant)' }}>
              {activeProtocol.steps.filter(s => s.status === 'pending').length}
            </div>
            <div style={{ fontSize: 'var(--label-md)', color: 'var(--on-surface-variant)' }}>Pendentes</div>
          </div>
          <div style={{
            flex: 1,
            minWidth: '120px',
            padding: 'var(--space-2)',
            background: 'var(--surface-container-low)',
            borderRadius: 'var(--radius-lg)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 'var(--title-md)', fontWeight: 'var(--font-bold)', color: 'var(--primary)' }}>
              {activeProtocol.timeline.length}
            </div>
            <div style={{ fontSize: 'var(--label-md)', color: 'var(--on-surface-variant)' }}>Eventos</div>
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* 📋 STEPPER VERTICAL DETALHADO              */}
      {/* ========================================== */}
      <div style={{
        background: 'var(--surface-container-lowest)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-4)',
        border: '1px solid var(--surface-container-high)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <h4 style={{
          fontSize: 'var(--body-lg)',
          fontWeight: 'var(--font-semibold)',
          color: 'var(--on-surface)',
          marginBottom: 'var(--space-3)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>account_tree</span>
          Detalhes das Etapas
        </h4>

        <div style={{ position: 'relative', zIndex: 1 }}>
          {activeProtocol.steps.map((step, index) => {
            const isLast = index === activeProtocol.steps.length - 1;
            const statusColor = 
              step.status === 'completed' ? 'var(--primary)' :
              step.status === 'active' ? 'var(--tertiary)' :
              step.status === 'rejected' ? 'var(--error)' :
              'var(--outline-variant)';

            const statusBg = 
              step.status === 'completed' ? 'var(--primary-container)' :
              step.status === 'active' ? 'var(--tertiary-container)' :
              step.status === 'rejected' ? 'var(--error-container)' :
              'var(--surface-container)';

            return (
              <div key={step.id} style={{ position: 'relative' }}>
                <div style={{
                  display: 'flex',
                  gap: 'var(--space-3)',
                  alignItems: 'flex-start'
                }}>
                  {/* Círculo do Step */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    minWidth: '44px'
                  }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: statusBg,
                      border: `3px solid ${statusColor}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      transition: 'all 0.3s ease',
                      boxShadow: step.status === 'active' ? `0 0 0 4px ${statusColor}20` : 'none'
                    }}>
                      {step.status === 'completed' ? (
                        <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '22px', animation: 'scaleIn 0.3s ease' }}>
                          check
                        </span>
                      ) : step.status === 'rejected' ? (
                        <span className="material-symbols-outlined" style={{ color: 'var(--error)', fontSize: '22px' }}>
                          close
                        </span>
                      ) : step.status === 'active' ? (
                        <div style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: 'var(--tertiary)',
                          animation: 'pulse 2s infinite'
                        }} />
                      ) : (
                        <span style={{ color: 'var(--on-surface-variant)', fontSize: '14px', fontWeight: 'var(--font-medium)' }}>
                          {index + 1}
                        </span>
                      )}
                    </div>
                    
                    {!isLast && (
                      <div style={{
                        width: '3px',
                        height: '60px',
                        background: step.status === 'completed' 
                          ? 'linear-gradient(180deg, var(--primary), var(--outline-variant))'
                          : 'var(--outline-variant)',
                        marginTop: '8px',
                        borderRadius: 'var(--radius-full)',
                        position: 'relative',
                        overflow: 'hidden'
                      }}>
                        {step.status === 'completed' && (
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            background: 'var(--primary)',
                            animation: 'fillLine 0.5s ease'
                          }} />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Conteúdo do Step */}
                  <div style={{
                    flex: 1,
                    background: step.status === 'active' ? statusBg : 'transparent',
                    borderRadius: 'var(--radius-lg)',
                    padding: step.status === 'active' ? 'var(--space-3)' : 'var(--space-2) 0',
                    transition: 'all 0.3s ease',
                    border: step.status === 'active' ? `1px solid ${statusColor}30` : '1px solid transparent',
                    marginBottom: isLast ? 0 : 'var(--space-3)'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 'var(--space-2)',
                      flexWrap: 'wrap'
                    }}>
                      <div>
                        <h4 style={{
                          fontSize: 'var(--body-md)',
                          fontWeight: step.status === 'active' ? 'var(--font-bold)' : 'var(--font-medium)',
                          color: step.status === 'active' ? statusColor : 'var(--on-surface)',
                          margin: 0,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: statusColor }}>
                            {step.icon}
                          </span>
                          {step.label}
                        </h4>
                        <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)', margin: '4px 0 0 0' }}>
                          {step.description}
                        </p>
                      </div>

                      <span style={{
                        padding: '4px 12px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: 'var(--label-md)',
                        fontWeight: 'var(--font-semibold)',
                        background: statusBg,
                        color: statusColor,
                        border: `1px solid ${statusColor}40`,
                        whiteSpace: 'nowrap'
                      }}>
                        {step.status === 'completed' ? 'Concluído' :
                         step.status === 'active' ? 'Em Andamento' :
                         step.status === 'rejected' ? 'Não Aprovado' : 'Pendente'}
                      </span>
                    </div>

                    {step.date && (
                      <div style={{
                        display: 'flex',
                        gap: 'var(--space-3)',
                        marginTop: 'var(--space-2)',
                        flexWrap: 'wrap',
                        fontSize: 'var(--label-md)',
                        color: 'var(--on-surface-variant)'
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>calendar_today</span>
                          {step.date}
                        </span>
                        {step.actor && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>person</span>
                            {step.actor}
                          </span>
                        )}
                      </div>
                    )}

                    {step.comment && (
                      <div style={{
                        marginTop: 'var(--space-2)',
                        padding: 'var(--space-2)',
                        background: 'var(--surface-container-low)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--body-md)',
                        color: 'var(--on-surface-variant)',
                        borderLeft: `3px solid ${statusColor}`
                      }}>
                        {step.comment}
                      </div>
                    )}

                    {step.documents && step.documents.length > 0 && (
                      <div style={{
                        marginTop: 'var(--space-2)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}>
                        {step.documents.map((doc, docIndex) => (
                          <div key={docIndex} style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            background: 'var(--surface-container-low)',
                            borderRadius: 'var(--radius-md)',
                            gap: 'var(--space-2)'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                              <span className="material-symbols-outlined" style={{ 
                                fontSize: '20px', 
                                color: doc.status === 'approved' ? 'var(--primary)' : 
                                       doc.status === 'rejected' ? 'var(--error)' : 'var(--outline)'
                              }}>
                                {doc.status === 'approved' ? 'description' : 
                                 doc.status === 'rejected' ? 'cancel' : 'pending'}
                              </span>
                              <span style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface)' }}>
                                {doc.name}
                              </span>
                            </div>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-full)',
                              fontSize: 'var(--label-md)',
                              fontWeight: 'var(--font-medium)',
                              background: doc.status === 'approved' ? 'var(--primary-container)' :
                                         doc.status === 'rejected' ? 'var(--error-container)' :
                                         'var(--surface-container-high)',
                              color: doc.status === 'approved' ? 'var(--primary)' :
                                    doc.status === 'rejected' ? 'var(--error)' :
                                    'var(--on-surface-variant)'
                            }}>
                              {doc.status === 'approved' ? 'Aprovado' :
                               doc.status === 'rejected' ? 'Não Aprovado' : 'Pendente'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================== */}
      {/* 📅 TIMELINE DE EVENTOS                    */}
      {/* ========================================== */}
      <div style={{
        background: 'var(--surface-container-lowest)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-4)',
        border: '1px solid var(--surface-container-high)'
      }}>
        <h4 style={{
          fontSize: 'var(--body-lg)',
          fontWeight: 'var(--font-semibold)',
          color: 'var(--on-surface)',
          marginBottom: 'var(--space-3)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>timeline</span>
          Histórico de Eventos
        </h4>

        <div style={{ position: 'relative' }}>
          {activeProtocol.timeline.map((event, index) => {
            const eventColor = 
              event.type === 'approval' ? 'var(--primary)' :
              event.type === 'rejection' ? 'var(--error)' :
              event.type === 'submission' ? 'var(--tertiary)' :
              'var(--outline)';

            const eventIcon = 
              event.type === 'approval' ? 'check_circle' :
              event.type === 'rejection' ? 'cancel' :
              event.type === 'submission' ? 'upload_file' :
              event.type === 'review' ? 'rate_review' :
              event.type === 'correction' ? 'edit_note' :
              'event';

            return (
              <div key={index} style={{
                display: 'flex',
                gap: 'var(--space-3)',
                paddingBottom: index < activeProtocol.timeline.length - 1 ? 'var(--space-3)' : 0,
                position: 'relative'
              }}>
                {index < activeProtocol.timeline.length - 1 && (
                  <div style={{
                    position: 'absolute',
                    left: '11px',
                    top: '24px',
                    width: '2px',
                    height: 'calc(100% - 24px)',
                    background: 'var(--outline-variant)',
                    borderRadius: 'var(--radius-full)'
                  }} />
                )}

                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: `${eventColor}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px', color: eventColor }}>
                    {eventIcon}
                  </span>
                </div>

                <div>
                  <p style={{
                    fontSize: 'var(--body-md)',
                    fontWeight: 'var(--font-medium)',
                    color: 'var(--on-surface)',
                    margin: 0
                  }}>
                    {event.event}
                  </p>
                  <p style={{
                    fontSize: 'var(--body-md)',
                    color: 'var(--on-surface-variant)',
                    margin: '2px 0'
                  }}>
                    {event.details}
                  </p>
                  <span style={{
                    fontSize: 'var(--label-md)',
                    color: 'var(--outline)'
                  }}>
                    {event.date}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Animações */}
      <style>{`
        @keyframes scaleIn {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
        }
        
        @keyframes fillLine {
          from { height: 0; }
          to { height: 100%; }
        }
      `}</style>
    </div>
  );
}