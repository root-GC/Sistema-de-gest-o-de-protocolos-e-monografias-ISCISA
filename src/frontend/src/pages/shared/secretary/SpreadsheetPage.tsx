// src/pages/secretary/SpreadsheetPage.tsx
import { useEffect, useState } from 'react'
import { protocolService } from '../../../services/protocolService'
import { useAuth, type SecretaryProfile } from '../../../context/AuthContext'
import '../../../styles/global.css'

interface SpreadsheetRow {
  id: number
  submissionDate: string
  code: string
  studentName: string
  contact: string
  title: string
  versionNumber: string
  meetingDate: string | null
  status: string
  statusRaw: string
  approvalDate: string | null
  timeSpent: string
  course: string
  organ: string
}

const STATUS_MAP: Record<string, string> = {
  'protocol_pending_supervisor': 'Aguardando Supervisor',
  'protocol_documents_pending_cc': 'Anexos em Validação (CC)',
  'protocol_pending_nucleo': 'Aguardando Núcleo',
  'protocol_in_review_nucleo': 'Em Revisão (Núcleo)',
  'protocol_rejected_nucleo': 'Reprovado (Núcleo)',
  'protocol_pending_comite_cientifico': 'Aguardando CC',
  'protocol_in_review_comite_cientifico': 'Em Revisão (CC)',
  'protocol_rejected_cc': 'Reprovado (CC)',
  'protocol_pending_comite_bioetica': 'Aguardando Bioética',
  'protocol_in_review_comite_bioetica': 'Em Revisão (Bioética)',
  'protocol_rejected_bioetica': 'Reprovado (Bioética)',
  'protocol_approved_final': 'Aprovado Final',
  'protocol_rejected_final': 'Reprovado Final',
  'pending_nucleo': 'Aguardando Núcleo',
  'in_review_nucleo': 'Em Revisão (Núcleo)',
  'approved_nucleo': 'Aprovado (Núcleo)',
  'rejected_nucleo': 'Reprovado (Núcleo)',
  'pending_comite_cientifico': 'Aguardando CC',
  'in_review_comite_cientifico': 'Em Revisão (CC)',
  'approved_comite_cientifico': 'Aprovado (CC)',
  'rejected_cc': 'Reprovado (CC)',
  'pending_comite_bioetica': 'Aguardando Bioética',
  'in_review_comite_bioetica': 'Em Revisão (Bioética)',
  'approved_final': 'Aprovado Final',
  'rejected': 'Reprovado',
  'parecer_emitido_deliberacao': 'Parecer Emitido',
}

function getStatusConfig(status: string) {
  if (status === 'Parecer Emitido') return { dot: '#6a1b9a', bg: '#f3e5f5', text: '#4a148c' }
  if (status.includes('Aprovado')) return { dot: '#5d4037', bg: '#efebe9', text: '#3e2723' }
  if (status.includes('Reprovado')) return { dot: '#b71c1c', bg: '#fce4ec', text: '#7f0000' }
  if (status.includes('Revisão')) return { dot: 'var(--tertiary)', bg: 'var(--tertiary-container)', text: 'var(--on-tertiary-container)' }
  if (status.includes('Aguardando')) return { dot: 'var(--outline)', bg: 'var(--surface-container-high)', text: 'var(--on-surface-variant)' }
  return { dot: 'var(--outline)', bg: 'var(--surface-container)', text: 'var(--on-surface-variant)' }
}

function getOrganFromStatus(status: string): string {
  if (status.includes('nucleo')) return 'Núcleo Científico'
  if (status.includes('comite_cientifico') || status.includes('cc')) return 'Comité Científico'
  if (status.includes('bioetica')) return 'Comité de Bioética'
  return '—'
}

function getProtocolListForOrgan(organType?: string) {
  if (organType === 'scientific_committee') return protocolService.listForSecretaryCC
  if (organType === 'bioethics_committee') return protocolService.listForSecretaryBioetica
  return protocolService.listForSecretary
}

function formatDate(value: string | null | undefined): string {
  return value ? new Date(value).toLocaleDateString('pt-PT') : '—'
}

function formatVersionLabel(version: string): string {
  return /^([A-Z]+_)?V\d+$/i.test(version) ? version : `v${version}`
}

export default function SpreadsheetPage() {
  const { activeProfile } = useAuth()
  const secretaryProfile = activeProfile as SecretaryProfile | null
  const organType = secretaryProfile?.organ?.type

  const [rows, setRows] = useState<SpreadsheetRow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedCourse, setSelectedCourse] = useState('all')
  const [courses, setCourses] = useState<string[]>([])

  useEffect(() => { loadData() }, [organType])

  async function loadData() {
    setLoading(true)
    try {
      const data = await getProtocolListForOrgan(organType)()
      const mapped: SpreadsheetRow[] = data.protocols.map(p => {
        const submitted = p.submitted_at ? new Date(p.submitted_at) : null
        const tracking = p.organ_tracking
        const finalDate = tracking?.latest_action_at || tracking?.approved_at || tracking?.rejected_at || null
        const approvedDate = tracking?.approved_at || (p.status === 'protocol_approved_final' ? finalDate : null)
        const end = finalDate ? new Date(finalDate).getTime() : Date.now()
        const days = submitted ? Math.floor((end - submitted.getTime()) / (1000 * 60 * 60 * 24)) : 0

        return {
          id: p.id,
          submissionDate: formatDate(p.submitted_at),
          code: p.code || `PTM${String(p.id).padStart(4, '0')}E`,
          studentName: p.student?.name || '—',
          contact: p.student?.email || '—',
          title: p.topic?.title || '—',
          versionNumber: tracking?.latest_opinion?.version || p.version || '1',
          meetingDate: null,
          status: tracking?.status_label || STATUS_MAP[p.status] || p.status_label || p.status,
          statusRaw: tracking?.latest_action || p.status,
          approvalDate: approvedDate ? formatDate(approvedDate) : null,
          timeSpent: submitted ? `${days} dias` : '—',
          course: (p.topic as any)?.course?.name || '—',
          organ: tracking?.organ_name || getOrganFromStatus(p.status),
        }
      })
      const uniqueCourses = [...new Set(mapped.map(r => r.course))].filter(Boolean)
      setCourses(uniqueCourses)
      setRows(mapped)
    } catch {
      setRows(getMockData())
      setCourses(['Mestrado em Saúde e Segurança no Trabalho', 'Mestrado em Saúde Pública', 'Licenciatura em Enfermagem'])
    } finally {
      setLoading(false)
    }
  }

  const filtered = rows.filter(r => {
    if (searchTerm) {
      const t = searchTerm.toLowerCase()
      if (!r.title.toLowerCase().includes(t) && !r.studentName.toLowerCase().includes(t) && !r.code.toLowerCase().includes(t)) return false
    }
    if (filterStatus === 'approved' && !r.status.includes('Aprovado') && r.status !== 'Parecer Emitido') return false
    if (filterStatus === 'rejected' && !r.status.includes('Reprovado')) return false
    if (filterStatus === 'reviewing' && !r.status.includes('Revisão') && !r.status.includes('Aguardando')) return false
    if (selectedCourse !== 'all' && r.course !== selectedCourse) return false
    return true
  })

  const approved = rows.filter(r => r.status.includes('Aprovado') || r.status === 'Parecer Emitido').length
  const reviewing = rows.filter(r => r.status.includes('Revisão') || r.status.includes('Aguardando')).length
  const rejected = rows.filter(r => r.status.includes('Reprovado')).length

  if (loading) {
    return (
      <div className="page-loader">
        <div className="page-loader__spinner" />
        <span className="page-loader__text">A carregar planilha...</span>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto', fontFamily: 'var(--font-family)', color: 'var(--on-background)', padding: 'var(--space-4) var(--gutter)' }}>

      <div style={{ marginBottom: 'var(--space-4)' }}>
        <h1 style={{ fontSize: 'var(--headline-lg)', fontWeight: 'var(--font-semibold)', color: 'var(--on-surface)', margin: '0 0 6px', letterSpacing: '-0.5px' }}>
          <span className="material-symbols-outlined" style={{ verticalAlign: 'middle', marginRight: 'var(--space-2)', color: 'var(--primary)', fontSize: '30px' }}>table</span>
          Planilha de Protocolos
        </h1>
        <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)', margin: 0 }}>
          {rows.length} protocolos · {approved} aprovados · {reviewing} em revisão · {rejected} reprovados
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <StatCard icon="inventory_2" label="Total" value={rows.length} color="var(--primary)" bg="var(--primary-container)" />
        <StatCard icon="hourglass_top" label="Em Revisão" value={reviewing} color="var(--tertiary)" bg="var(--tertiary-container)" />
        <StatCard icon="verified" label="Aprovados" value={approved} color="#5d4037" bg="#efebe9" />
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', color: 'var(--outline)' }}>search</span>
          <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Pesquisar..."
            style={{ width: '100%', padding: '10px 14px 10px 38px', background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', fontSize: '13px', fontFamily: 'var(--font-family)', color: 'var(--on-surface)', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} style={selectStyle}>
          <option value="all">Todos os cursos</option>
          {courses.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {['all', 'reviewing', 'approved', 'rejected'].map(f => (
          <button key={f} onClick={() => setFilterStatus(f)} style={{
            padding: '9px 18px', borderRadius: 'var(--radius-lg)',
            border: filterStatus === f ? '2px solid var(--primary)' : '1px solid var(--outline-variant)',
            background: filterStatus === f ? 'var(--primary-container)' : 'var(--surface-container-lowest)',
            color: filterStatus === f ? 'var(--on-primary-container)' : 'var(--on-surface-variant)',
            fontSize: '13px', fontWeight: filterStatus === f ? 'var(--font-semibold)' : 'var(--font-regular)',
            fontFamily: 'var(--font-family)', cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
          }}>
            {f === 'all' ? 'Todos' : f === 'reviewing' ? 'Em revisão' : f === 'approved' ? 'Aprovados' : 'Reprovados'}
          </button>
        ))}
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} style={{ padding: '9px 14px', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', background: 'var(--surface-container-lowest)', cursor: 'pointer', color: 'var(--on-surface-variant)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-family)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span> Limpar
          </button>
        )}
        <button onClick={loadData} className="btn btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>refresh</span> Actualizar
        </button>
        <button onClick={() => exportToExcel(filtered)} className="btn btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span> Exportar
        </button>
      </div>

      <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--outline-variant)', overflow: 'hidden', boxShadow: 'var(--elevation-1)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1300px' }}>
            <thead>
              <tr style={{ background: 'var(--surface-container)' }}>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Data Submissão</th>
                <th style={thStyle}>Código</th>
                <th style={thStyle}>Nome do Estudante</th>
                <th style={thStyle}>Contacto/E-mail</th>
                <th style={thStyle}>Título do Trabalho</th>
                <th style={thStyle}>Nº Versão</th>
                <th style={thStyle}>Data Reunião</th>
                <th style={thStyle}>Ponto de Situação</th>
                <th style={thStyle}>Data Aprovação</th>
                <th style={thStyle}>Tempo Gasto</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ padding: 'var(--space-5)', textAlign: 'center', color: 'var(--on-surface-variant)', fontSize: 'var(--body-md)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '40px', display: 'block', marginBottom: 'var(--space-2)', opacity: 0.4 }}>search_off</span>
                    Nenhum protocolo encontrado.
                  </td>
                </tr>
              ) : (
                filtered.map((row, i) => {
                  const statusCfg = getStatusConfig(row.status)
                  const isOverdue = parseInt(row.timeSpent) > 14 && !row.status.includes('Aprovado') && !row.status.includes('Reprovado') && row.status !== 'Parecer Emitido'
                  return (
                    <tr key={row.id} style={{ borderBottom: '1px solid var(--outline-variant)', transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-container-low)'}
                      onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'var(--surface-container-lowest)' : 'transparent'}>
                      <td style={{ ...tdStyle, color: 'var(--on-surface-variant)', fontSize: '12px', fontWeight: 'var(--font-medium)' }}>{row.id}</td>
                      <td style={{ ...tdStyle, fontSize: '12px', color: 'var(--on-surface-variant)', whiteSpace: 'nowrap' }}>{row.submissionDate}</td>
                      <td style={tdStyle}><span style={{ fontFamily: 'monospace', fontWeight: 'var(--font-bold)', fontSize: '12px', color: 'var(--primary)', background: 'var(--primary-container)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>{row.code}</span></td>
                      <td style={{ ...tdStyle, fontWeight: 'var(--font-medium)', fontSize: '13px', whiteSpace: 'nowrap' }}>{row.studentName}</td>
                      <td style={{ ...tdStyle, fontSize: '12px', color: 'var(--on-surface-variant)', whiteSpace: 'nowrap' }}>{row.contact}</td>
                      <td style={{ ...tdStyle, maxWidth: '240px' }}><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', fontSize: '13px' }} title={row.title}>{row.title}</span></td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}><span style={{ fontSize: '12px', fontWeight: 'var(--font-semibold)', color: 'var(--primary)', background: 'var(--primary-container)', padding: '2px 10px', borderRadius: 'var(--radius-full)' }}>{formatVersionLabel(row.versionNumber)}</span></td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        {row.meetingDate ? (
                          <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 'var(--font-medium)', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>event</span> {row.meetingDate}
                          </span>
                        ) : (
                          <button onClick={(e) => { e.stopPropagation(); handleSetMeeting(row) }}
                            style={{ padding: '5px 12px', border: '1px dashed var(--tertiary)', borderRadius: 'var(--radius-lg)', background: 'var(--tertiary-container)', cursor: 'pointer', fontSize: '11px', color: 'var(--on-tertiary-container)', fontFamily: 'var(--font-family)', fontWeight: 'var(--font-semibold)', display: 'inline-flex', alignItems: 'center', gap: '4px', transition: 'all 0.15s' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>event</span> Marcar
                          </button>
                        )}
                      </td>
                      <td style={tdStyle}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '4px 10px', borderRadius: 'var(--radius-full)', background: statusCfg.bg, color: statusCfg.text, fontWeight: 'var(--font-medium)', whiteSpace: 'nowrap' }}>
                          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: statusCfg.dot, flexShrink: 0 }} />
                          {row.status}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, fontSize: '12px', color: 'var(--on-surface-variant)', whiteSpace: 'nowrap' }}>{row.approvalDate || '—'}</td>
                      <td style={{ ...tdStyle, fontSize: '12px', color: isOverdue ? 'var(--error)' : 'var(--on-surface-variant)', fontWeight: isOverdue ? 'var(--font-bold)' : 'var(--font-regular)', whiteSpace: 'nowrap' }}>
                        {isOverdue && <span style={{ marginRight: '4px' }}>⚠️</span>}{row.timeSpent}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-2)', padding: '0 var(--space-1)', fontSize: '11px', color: 'var(--on-surface-variant)' }}>
        <span>{filtered.length} de {rows.length} registos</span>
        <span>ISCISA — Direção Científica © {new Date().getFullYear()}</span>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color, bg }: { icon: string; label: string; value: number; color: string; bg: string }) {
  return (
    <div style={{ padding: 'var(--space-3)', background: bg, borderRadius: 'var(--radius-lg)', border: `1px solid ${color}`, display: 'flex', alignItems: 'center', gap: 'var(--space-3)', transition: 'all 0.2s ease' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--elevation-2)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--elevation-1)' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '28px', color }}>{icon}</span>
      <div>
        <div style={{ fontSize: 'var(--headline-lg)', fontWeight: 'var(--font-bold)', color, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 'var(--label-md)', color, opacity: 0.8, marginTop: '2px' }}>{label}</div>
      </div>
    </div>
  )
}

const selectStyle: React.CSSProperties = { padding: '10px 14px', background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', fontSize: '13px', fontFamily: 'var(--font-family)', color: 'var(--on-surface)', cursor: 'pointer', outline: 'none', minWidth: '180px' }

const thStyle: React.CSSProperties = { padding: '12px 14px', textAlign: 'left', fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--on-surface-variant)', borderBottom: '2px solid var(--primary)', whiteSpace: 'nowrap' }
const tdStyle: React.CSSProperties = { padding: '12px 14px', verticalAlign: 'middle' }

function handleSetMeeting(row: SpreadsheetRow) { const date = prompt(`Marcar reunião para ${row.code}:\nData (DD/MM/AAAA):`); if (date) alert(`✅ Reunião marcada para ${date}`) }

function exportToExcel(rows: SpreadsheetRow[]) {
  const headers = ['ID', 'Data Submissão', 'Código', 'Estudante', 'Contacto', 'Título', 'Versão', 'Data Reunião', 'Situação', 'Data Aprovação', 'Tempo']
  const csv = [headers.join(','), ...rows.map(r => [r.id, r.submissionDate, r.code, `"${r.studentName}"`, r.contact, `"${r.title}"`, r.versionNumber, r.meetingDate || '—', `"${r.status}"`, r.approvalDate || '—', r.timeSpent].join(','))].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `planilha-${new Date().getFullYear()}.csv`; a.click(); URL.revokeObjectURL(url)
}

function getMockData(): SpreadsheetRow[] {
  return [
    { id: 1, submissionDate: '15/03/2025', code: 'PTM0001E', studentName: 'Sofia Estudante', contact: 'sofia@iscisa.ac.mz', title: 'Impacto da malária na saúde infantil em zonas rurais de Moçambique', versionNumber: '1', meetingDate: null, status: 'Em Revisão (Núcleo)', statusRaw: 'in_review_nucleo', approvalDate: null, timeSpent: '12 dias', course: 'Mestrado em Saúde e Segurança no Trabalho', organ: 'Núcleo Científico' },
    { id: 2, submissionDate: '18/03/2025', code: 'PTM0002E', studentName: 'Carlos Mavie', contact: 'carlos@iscisa.ac.mz', title: 'Estudo sobre desnutrição infantil', versionNumber: '2', meetingDate: '22/03/2025', status: 'Parecer Emitido', statusRaw: 'parecer_emitido_deliberacao', approvalDate: '25/03/2025', timeSpent: '10 dias', course: 'Mestrado em Saúde e Segurança no Trabalho', organ: 'Núcleo Científico' },
    { id: 3, submissionDate: '20/03/2025', code: 'PTM0003E', studentName: 'Ana Tembe', contact: 'ana@iscisa.ac.mz', title: 'Avaliação de políticas de saúde pública', versionNumber: '1', meetingDate: null, status: 'Aguardando CC', statusRaw: 'pending_comite_cientifico', approvalDate: null, timeSpent: '7 dias', course: 'Mestrado em Saúde Pública', organ: 'Comité Científico' },
    { id: 4, submissionDate: '22/03/2025', code: 'PTM0004E', studentName: 'Pedro Nkosi', contact: 'pedro@iscisa.ac.mz', title: 'Análise de dados epidemiológicos em saúde ocupacional', versionNumber: '3', meetingDate: '28/03/2025', status: 'Aprovado Final', statusRaw: 'approved_final', approvalDate: '01/04/2025', timeSpent: '17 dias', course: 'Mestrado em Saúde Pública', organ: 'Comité de Bioética' },
    { id: 5, submissionDate: '25/03/2025', code: 'PTM0005E', studentName: 'Marta Chissano', contact: 'marta@iscisa.ac.mz', title: 'Estudo clínico sobre HIV/SIDA em adultos', versionNumber: '1', meetingDate: null, status: 'Reprovado', statusRaw: 'rejected', approvalDate: null, timeSpent: '5 dias', course: 'Licenciatura em Enfermagem', organ: 'Núcleo Científico' },
    { id: 6, submissionDate: '10/03/2025', code: 'PTM0006E', studentName: 'José Macamo', contact: 'jose@iscisa.ac.mz', title: 'Resistência antimicrobiana em hospitais centrais', versionNumber: '2', meetingDate: null, status: 'Em Revisão (CC)', statusRaw: 'in_review_comite_cientifico', approvalDate: null, timeSpent: '27 dias', course: 'Mestrado em Saúde Pública', organ: 'Comité Científico' },
  ]
}
