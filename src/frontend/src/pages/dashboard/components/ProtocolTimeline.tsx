// src/components/dashboard/ProtocolTimeline.tsx (versão compacta)
import type { TimelineStep } from '../../../types/dashboard';

export function ProtocolTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 0,
      padding: 'var(--space-3) var(--space-1)',
      overflowX: 'auto',
      position: 'relative'
    }}>
      {steps.map((step, i) => (
        <div 
          key={step.stage}
          style={{
            display: 'flex',
            alignItems: 'center',
            flex: i === steps.length - 1 ? '0 0 auto' : '1 1 0',
            minWidth: i === steps.length - 1 ? 'auto' : '120px'
          }}
        >
          {/* Step */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--space-2)',
            flexShrink: 0,
            position: 'relative'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-full)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: step.done 
                ? 'var(--primary)' 
                : step.current 
                  ? 'var(--primary-container)' 
                  : 'var(--surface-container)',
              border: step.current && !step.done 
                ? '3px solid var(--primary)' 
                : '2px solid var(--outline-variant)',
              transition: 'all 0.3s ease',
              boxShadow: step.current && !step.done 
                ? '0 0 0 4px rgba(var(--primary-rgb), 0.1)' 
                : 'none'
            }}>
              {step.done ? (
                <span className="material-symbols-outlined" style={{
                  fontSize: '20px',
                  color: 'var(--on-primary)',
                  fontWeight: 'bold'
                }}>
                  check
                </span>
              ) : step.current ? (
                <span style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--primary)',
                  animation: 'pulse 2s infinite'
                }} />
              ) : (
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--outline)'
                }} />
              )}
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px'
            }}>
              <span style={{
                fontSize: 'var(--label-sm)',
                fontWeight: step.current ? 'var(--font-semibold)' : 'var(--font-medium)',
                color: step.current ? 'var(--primary)' : 'var(--on-surface)',
                textAlign: 'center',
                maxWidth: '100px',
                lineHeight: 1.2
              }}>
                {step.label}
              </span>
              <span style={{
                fontSize: 'var(--label-xs)',
                color: 'var(--on-surface-variant)',
                textAlign: 'center'
              }}>
                {step.done ? 'Concluído' : step.current ? 'Em progresso' : 'Pendente'}
              </span>
            </div>
          </div>

          {/* Connector line */}
          {i < steps.length - 1 && (
            <div style={{
              flex: 1,
              height: '3px',
              background: step.done ? 'var(--primary)' : 'var(--outline-variant)',
              marginTop: '-28px',
              transition: 'background 0.3s ease',
              minWidth: '40px'
            }} />
          )}
        </div>
      ))}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}