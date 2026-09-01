import type { ReactNode } from 'react'

type HeaderProps = {
  eyebrow?: string
  title: string
  titleId?: string
  description?: string
  actions?: ReactNode
}

type SummaryCardProps = {
  icon: string
  label: string
  value: ReactNode
  detail?: string
}

export function TeacherPageHeader({ eyebrow, title, titleId, description, actions }: HeaderProps) {
  return (
    <header className="teacher-page-header">
      <div>
        {eyebrow && <p className="teacher-page-header__eyebrow">{eyebrow}</p>}
        <h1 id={titleId} className="teacher-page-header__title">{title}</h1>
        {description && <p className="teacher-page-header__description">{description}</p>}
      </div>
      {actions && <div className="teacher-page-header__actions">{actions}</div>}
    </header>
  )
}

export function TeacherSummaryCard({ icon, label, value, detail }: SummaryCardProps) {
  return (
    <div className="teacher-summary-card">
      <span className="material-symbols-outlined" aria-hidden="true">{icon}</span>
      <span className="teacher-summary-card__label">{label}</span>
      <strong className="teacher-summary-card__value">{value}</strong>
      {detail && <span className="teacher-summary-card__detail">{detail}</span>}
    </div>
  )
}

export function TeacherEmptyState({ icon, title, description }: { icon: string; title: string; description?: string }) {
  return (
    <div className="teacher-empty-state">
      <span className="material-symbols-outlined" aria-hidden="true">{icon}</span>
      <strong>{title}</strong>
      {description && <span>{description}</span>}
    </div>
  )
}
