import { Link } from 'react-router-dom'
import { TeacherPageHeader, TeacherSummaryCard } from '../../../components/teacher/TeacherWorkspace'
import { useAuth } from '../../../context/AuthContext'
import '../../teacher/teacherWorkspace.css'

function profileValue(value?: string | null) {
  return value || 'Não definido'
}

export function TeacherDashboard() {
  const { profiles } = useAuth()
  const profile = profiles.teacher

  return (
    <main className="teacher-workspace" aria-labelledby="teacher-dashboard-title">
      <TeacherPageHeader
        eyebrow="Área do Docente"
        title="Perfil Docente"
        titleId="teacher-dashboard-title"
        description="Consulta os dados académicos e acede às ferramentas disponíveis neste perfil."
        actions={<Link className="btn btn-primary" to="/workload"><span className="material-symbols-outlined" aria-hidden="true">work</span>A minha carga</Link>}
      />

      <section className="teacher-summary-grid" aria-label="Dados do perfil docente">
        <TeacherSummaryCard icon="apartment" label="Departamento" value={profileValue(profile?.department)} />
        <TeacherSummaryCard icon="school" label="Grau académico" value={profileValue(profile?.academic_degree)} />
        <TeacherSummaryCard icon="science" label="Área científica" value={profileValue(profile?.scientific_area?.name)} />
        <TeacherSummaryCard icon="menu_book" label="Curso" value={profileValue(profile?.course?.name)} />
      </section>

      <section className="teacher-panel" aria-labelledby="teacher-dashboard-actions" style={{ padding: 'var(--space-2) var(--space-3)' }}>
        <h2 id="teacher-dashboard-actions" style={{ margin: 0, fontSize: 'var(--title-md)', color: 'var(--on-surface)' }}>Acesso rápido</h2>
        <p style={{ margin: '6px 0 var(--space-2)', color: 'var(--on-surface-variant)', fontSize: 'var(--body-md)' }}>A tua carga mostra apenas atividades compatíveis com o perfil ativo.</p>
        <Link className="btn btn-outline" to="/workload"><span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>Ver carga de trabalho</Link>
      </section>
    </main>
  )
}
