import { useEffect, useState } from 'react'
import { organWorkspaceService } from '../../services/organWorkspaceService'

export default function OrganCoursesPage() {
  const [data, setData] = useState<{ organ: { name: string }; courses: Array<{ id: number; code: string; name: string; scientific_area?: { name: string } | null }> } | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { void organWorkspaceService.courses().then(setData).catch(requestError => setError(requestError instanceof Error ? requestError.message : 'Não foi possível carregar os cursos.')) }, [])
  if (error) return <main className="card" style={{ padding: 'var(--space-4)', color: 'var(--error)' }}>{error}</main>
  if (!data) return <main>A carregar cursos...</main>
  return <main style={{ display: 'grid', gap: 'var(--space-3)' }}><header><p style={{ color: 'var(--primary)' }}>{data.organ.name}</p><h1 style={{ margin: 0 }}>Cursos</h1></header><section className="card" style={{ padding: 'var(--space-3)' }}>{data.courses.map(course => <div key={course.id} style={{ padding: 'var(--space-2) 0', borderBottom: '1px solid var(--outline-variant)' }}><strong>{course.code}</strong> · {course.name}<small style={{ display: 'block', color: 'var(--on-surface-variant)' }}>{course.scientific_area?.name}</small></div>)}{data.courses.length === 0 && <p>Não há cursos associados a este Núcleo.</p>}</section></main>
}
