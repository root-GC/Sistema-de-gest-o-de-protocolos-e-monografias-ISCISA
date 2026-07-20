// src/components/protocol/ProtocolPipeline.tsx
import type { Protocol } from '../../services/protocolService';
import { buildPipeline, type OrganStage, type StageState } from './protocolStatusMap';
import './ProtocolPipeline.css';

interface ProtocolPipelineProps {
  protocol:
    | Pick<Protocol, 'status' | 'version'>
    | {
        status: string;
        version?: string | null;
        nc_version?: number | null;
        cc_version?: number | null;
        cb_version?: number | null;
      };
  compact?: boolean;
  onSelectStage?: (stage: OrganStage) => void;
}

const STATE_TO_ICON: Record<StageState, { icon: string; label: string }> = {
  not_started: { icon: 'radio_button_unchecked', label: 'Não iniciado' },
  pending: { icon: 'hourglass_top', label: 'Aguardando' },
  in_review: { icon: 'rate_review', label: 'Em revisão' },
  current: { icon: 'pending', label: 'Em curso' },
  approved: { icon: 'check_circle', label: 'Aprovado' },
  rejected: { icon: 'cancel', label: 'Rejeitado' },
};

const STATE_TO_LABEL: Record<StageState, string> = {
  not_started: 'Não iniciado',
  pending: 'Aguardando',
  in_review: 'Em revisão',
  current: 'Em curso',
  approved: 'Concluído',
  rejected: 'Rejeitado',
};

type ConnectorState = 'pending' | 'in_progress' | 'done' | 'failed' | 'idle';

function getConnectorState(before: StageState, after: StageState): ConnectorState {
  if (before === 'rejected' || after === 'rejected') return 'failed';
  if (
    before === 'approved' &&
    (after === 'approved' || after === 'current' || after === 'in_review' || after === 'pending')
  ) {
    return 'done';
  }
  if (before === 'approved' && after === 'not_started') return 'pending';
  if (
    (before === 'current' || before === 'in_review' || before === 'pending') &&
    after === 'not_started'
  ) {
    return 'in_progress';
  }
  if (after === 'not_started') return 'idle';
  return 'in_progress';
}

export function ProtocolPipeline({ protocol, compact = false, onSelectStage }: ProtocolPipelineProps) {
  const stages = buildPipeline(protocol);

  return (
    <div
      className={`protocol-pipeline ${compact ? 'is-compact' : ''}`}
      role="list"
      aria-label="Pipeline de avaliação do protocolo"
    >
      {stages.map((stage, index) => {
        const next = stages[index + 1];
        const connectorState: ConnectorState | null = next
          ? getConnectorState(stage.state, next.state)
          : null;
        const stateInfo = STATE_TO_ICON[stage.state];
        const iconName = stage.state === 'not_started' ? stage.icon : stateInfo.icon;
        const iconSize = compact ? 22 : 28;

        return (
          <div className="protocol-pipeline-row" role="listitem" key={stage.key}>
            <button
              type="button"
              className={`protocol-pipeline-stage stage-${stage.state}`}
              onClick={onSelectStage ? () => onSelectStage(stage) : undefined}
              disabled={!onSelectStage}
              aria-label={`${stage.label}: ${STATE_TO_LABEL[stage.state]}`}
            >
              <div className="protocol-pipeline-icon">
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: `${iconSize}px` }}
                  aria-hidden="true"
                >
                  {iconName}
                </span>
              </div>
              <div className="protocol-pipeline-content">
                <div className="protocol-pipeline-label">
                  {compact ? stage.shortLabel : stage.label}
                </div>
                {!compact && (
                  <>
                    <div className="protocol-pipeline-state">
                      <span className={`protocol-pipeline-state-dot state-${stage.state}`} />
                      {STATE_TO_LABEL[stage.state]}
                    </div>
                    {stage.version && (
                      <div className="protocol-pipeline-version">{stage.version}</div>
                    )}
                    {stage.detail && (
                      <div className="protocol-pipeline-detail">{stage.detail}</div>
                    )}
                  </>
                )}
              </div>
            </button>
            {next && connectorState && (
              <div
                className={`protocol-pipeline-connector connector-${connectorState}`}
                aria-hidden="true"
              >
                <div className="protocol-pipeline-line" />
                <div className="protocol-pipeline-arrow">
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: '20px' }}
                    aria-hidden="true"
                  >
                    chevron_right
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default ProtocolPipeline;
