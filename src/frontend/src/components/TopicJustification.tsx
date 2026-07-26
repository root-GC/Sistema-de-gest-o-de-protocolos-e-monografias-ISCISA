import { useState, type CSSProperties } from 'react'

type TopicJustificationProps = {
  justification?: string | null
  showEmpty?: boolean
  compact?: boolean
  style?: CSSProperties
}

type TopicJustificationToggleProps = TopicJustificationProps & {
  label?: string
  contentStyle?: CSSProperties
}

export default function TopicJustification({
  justification,
  showEmpty = false,
  compact = false,
  style
}: TopicJustificationProps) {
  const text = justification?.trim()

  if (!text && !showEmpty) return null

  return (
    <div
      style={{
        display: 'flex',
        gap: 'var(--space-2)',
        padding: compact ? 'var(--space-2)' : 'var(--space-2) var(--space-3)',
        background: 'var(--surface-container-low)',
        border: '1px solid var(--outline-variant)',
        borderRadius: 'var(--radius-lg)',
        color: 'var(--on-surface)',
        ...style
      }}
    >
      <span
        className="material-symbols-outlined"
        style={{
          fontSize: compact ? '18px' : '20px',
          color: 'var(--primary)',
          marginTop: '2px',
          flexShrink: 0
        }}
      >
        notes
      </span>
      <div style={{ minWidth: 0 }}>
        <p
          style={{
            fontSize: 'var(--label-md)',
            fontWeight: 'var(--font-semibold)',
            color: 'var(--on-surface-variant)',
            marginBottom: '4px'
          }}
        >
          Justificação
        </p>
        <p
          style={{
            fontSize: compact ? 'var(--body-sm)' : 'var(--body-md)',
            color: text ? 'var(--on-surface)' : 'var(--on-surface-variant)',
            whiteSpace: 'pre-wrap',
            overflowWrap: 'anywhere',
            lineHeight: 1.5,
            fontStyle: text ? 'normal' : 'italic'
          }}
        >
          {text || 'Sem justificação registada.'}
        </p>
      </div>
    </div>
  )
}

export function TopicJustificationToggle({
  justification,
  showEmpty = true,
  compact = true,
  label = 'justificação',
  style,
  contentStyle
}: TopicJustificationToggleProps) {
  const [open, setOpen] = useState(false)
  const text = justification?.trim()

  if (!text && !showEmpty) return null

  return (
    <div style={style}>
      <button
        type="button"
        onClick={() => setOpen(current => !current)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 'var(--space-1)',
          width: 'fit-content',
          padding: compact ? '6px var(--space-2)' : '8px var(--space-3)',
          border: '1px solid var(--outline-variant)',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--surface-container-lowest)',
          color: 'var(--primary)',
          fontSize: compact ? 'var(--label-md)' : 'var(--body-md)',
          fontWeight: 'var(--font-medium)',
          fontFamily: 'var(--font-family)',
          cursor: 'pointer'
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: compact ? '18px' : '20px' }}>
          notes
        </span>
        {open ? `Ocultar ${label}` : `Ver ${label}`}
        <span className="material-symbols-outlined" style={{ fontSize: compact ? '18px' : '20px' }}>
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {open && (
        <TopicJustification
          justification={justification}
          showEmpty={showEmpty}
          compact={compact}
          style={{ marginTop: 'var(--space-2)', ...contentStyle }}
        />
      )}
    </div>
  )
}
