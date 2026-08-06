// src/components/layout/ContentSkeleton.tsx
export function ContentSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div className="skeleton" style={{ height: '32px', width: '240px', borderRadius: 'var(--radius-md)' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-2)' }}>
        {[0,1,2].map(i => (
          <div key={i} className="skeleton" style={{ height: '100px', borderRadius: 'var(--radius-lg)' }} />
        ))}
      </div>
      <div className="skeleton" style={{ height: '300px', borderRadius: 'var(--radius-lg)' }} />
    </div>
  )
}