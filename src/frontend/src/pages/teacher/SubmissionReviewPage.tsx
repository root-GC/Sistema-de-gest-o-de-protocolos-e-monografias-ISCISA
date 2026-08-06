// src/pages/SubmissionReviewPage.tsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { topicService, type Topic } from '../../services/topicService'
import { protocolService, type Protocol } from '../../services/protocolService'
import { monographService, type Monograph } from '../../services/monographService'
import JustificationToggle from '../../components/JustificationToggle'
import '../../styles/global.css'

// ============================================================
// TIPOS
// ============================================================
type SubmissionType = 'topic' | 'protocol' | 'monograph'

interface SubmissionData {
  type: SubmissionType
  topic?: Topic
  protocol?: Protocol
  monograph?: Monograph
  title: string
  code?: string
  studentName?: string
  studentEmail?: string
  studentNumber?: string
  courseName?: string
  status: string
  statusLabel: string
  documentPath?: string | null
  documentName?: string | null
  justification?: string | null
  submittedAt?: string | null
}

// ============================================================
// HELPERS
// ============================================================
function getStatusStyle(status: string) {
  const map: Record<string, { bg: string; color: string; dot: string; label: string }> = {
    topic_pending_supervisor: { bg: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)', dot: 'var(--tertiary)', label: 'Pendente de Revisão' },
    topic_rejected_supervisor: { bg: 'var(--error-container)', color: 'var(--on-error-container)', dot: 'var(--error)', label: 'Não Aprovado' },
    protocol_pending_supervisor: { bg: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)', dot: 'var(--tertiary)', label: 'Pendente de Revisão' },
    protocol_submitted: { bg: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)', dot: 'var(--tertiary)', label: 'Submetido' },
    protocol_rejected_supervisor: { bg: 'var(--error-container)', color: 'var(--on-error-container)', dot: 'var(--error)', label: 'Não Aprovado' },
    monograph_pending_supervisor: { bg: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)', dot: 'var(--tertiary)', label: 'Pendente de Revisão' },
    monograph_submitted: { bg: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)', dot: 'var(--tertiary)', label: 'Submetida' },
    monograph_rejected_supervisor: { bg: 'var(--error-container)', color: 'var(--on-error-container)', dot: 'var(--error)', label: 'Não Aprovada' },
  }
  return map[status] || { bg: 'var(--surface-container)', color: 'var(--on-surface-variant)', dot: 'var(--outline)', label: status }
}

// ============================================================
// MOCK DO EDITOR (OnlyOffice Simulado)
// ============================================================
function MockEditor({ documentName, onClose }: { documentName?: string; onClose: () => void }) {
  const [content, setContent] = useState(`=== MODO DE EDIÇÃO COM TRACK CHANGES ===

Documento: ${documentName || 'documento.docx'}

Este é um simulador do editor OnlyOffice.
No futuro, aqui será integrado o editor real com:
- Controlo de alterações (track changes)
- Comentários
- Revisão colaborativa

=== CONTEÚDO DO DOCUMENTO ===

Lorem ipsum dolor sit amet, consectetur adipiscing elit.
Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

[Área para edição com track changes]

=== ALTERAÇÕES SUGERIDAS ===
+ Texto adicionado (verde)
- Texto removido (vermelho)
~ Texto modificado (azul)
`)

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-3)'
    }}>
      <div style={{
        background: 'var(--surface)',
        borderRadius: 'var(--radius-xl)',
        width: '100%',
        maxWidth: '1200px',
        height: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Barra de Ferramentas */}
        <div style={{
          padding: 'var(--space-2) var(--space-3)',
          background: 'var(--surface-container-low)',
          borderBottom: '1px solid var(--outline-variant)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>edit_note</span>
            <span style={{ fontWeight: 'var(--font-semibold)' }}>
              Editor com Track Changes (Simulação)
            </span>
            <span style={{
              fontSize: 'var(--label-sm)',
              background: 'var(--tertiary-container)',
              color: 'var(--on-tertiary-container)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)'
            }}>
              OnlyOffice API
            </span>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button
              onClick={() => alert('✅ Alterações guardadas localmente!')}
              style={{
                padding: '8px 16px',
                background: 'var(--primary)',
                color: 'var(--on-primary)',
                border: 'none',
                borderRadius: 'var(--radius-lg)',
                cursor: 'pointer',
                fontSize: 'var(--body-md)',
                fontFamily: 'var(--font-family)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>save</span>
              Guardar
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                background: 'var(--error-container)',
                color: 'var(--on-error-container)',
                border: 'none',
                borderRadius: 'var(--radius-lg)',
                cursor: 'pointer',
                fontSize: 'var(--body-md)',
                fontFamily: 'var(--font-family)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
              Fechar Editor
            </button>
          </div>
        </div>

        {/* Área de Edição */}
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          style={{
            flex: 1,
            padding: 'var(--space-3)',
            border: 'none',
            fontFamily: 'monospace',
            fontSize: '14px',
            lineHeight: 1.6,
            resize: 'none',
            outline: 'none',
            background: 'var(--surface-container-lowest)',
            color: 'var(--on-surface)'
          }}
        />

        {/* Barra de Status */}
        <div style={{
          padding: 'var(--space-1) var(--space-3)',
          background: 'var(--surface-container-low)',
          borderTop: '1px solid var(--outline-variant)',
          fontSize: 'var(--label-sm)',
          color: 'var(--on-surface-variant)',
          display: 'flex',
          gap: 'var(--space-3)'
        }}>
          <span>🟢 Track Changes: Ativo</span>
          <span>💬 Comentários: 0</span>
          <span>📝 Alterações: 3 pendentes</span>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function SubmissionReviewPage() {
  const { type, id } = useParams<{ type: string; id: string }>()
  const navigate = useNavigate()
  
  const [submission, setSubmission] = useState<SubmissionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  // Estados para o editor e upload
  const [showEditor, setShowEditor] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  useEffect(() => {
    loadSubmission()
  }, [type, id])

  async function loadSubmission() {
    setLoading(true)
    setError(null)
    try {
      if (type === 'topic') {
        const { topics } = await topicService.listForSupervisor()
        const topic = topics.find(t => t.id === Number(id))
        if (topic) {
          setSubmission({
            type: 'topic',
            topic,
            title: topic.title,
            studentName: topic.student?.name ?? undefined,
            studentEmail: topic.student?.email ?? undefined,
            courseName: topic.course?.name ?? undefined,
            status: topic.status,
            statusLabel: topic.status_label,
            documentPath: topic.document_path ?? null,
            documentName: topic.document_name ?? null,
            justification: topic.justification ?? null,
            submittedAt: topic.submitted_at ?? null,
          })
        }
      } else if (type === 'protocol') {
        const { protocols } = await protocolService.listForSupervisor()
        const protocol = protocols.find(p => p.id === Number(id))
        if (protocol) {
          setSubmission({
            type: 'protocol',
            protocol,
            title: protocol.topic?.title || protocol.code || '',
            code: protocol.code ?? undefined,
            studentName: (protocol as any).student?.name ?? undefined,
            studentEmail: (protocol as any).student?.email ?? undefined,
            status: protocol.status,
            statusLabel: (protocol as any).status_label || protocol.status,
            documentPath: (protocol as any).document_path ?? null,
            documentName: (protocol as any).document_name ?? null,
            justification: (protocol as any).justification ?? null,
            submittedAt: (protocol as any).submitted_at ?? null,
          })
        }
      } else if (type === 'monograph') {
        const { monographs } = await monographService.list()
        const monograph = monographs.find(m => m.id === Number(id))
        if (monograph) {
          setSubmission({
            type: 'monograph',
            monograph,
            title: (monograph as any).title || (monograph as any).code || '',
            code: (monograph as any).code ?? undefined,
            studentName: (monograph as any).student?.name ?? undefined,
            studentEmail: (monograph as any).student?.email ?? undefined,
            status: (monograph as any).status,
            statusLabel: (monograph as any).status_label || (monograph as any).status,
            documentPath: (monograph as any).document_path ?? null,
            documentName: (monograph as any).document_name ?? null,
            justification: (monograph as any).justification ?? null,
            submittedAt: (monograph as any).submitted_at ?? null,
          })
        }
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove() {
    if (!submission || !id) return
    
    const confirmMessage = `Tem certeza que deseja APROVAR esta submissão?\n\nApós aprovação, seguirá para a próxima etapa.`
    if (!window.confirm(confirmMessage)) return

    setActingId(id)
    setError(null)
    setSuccessMessage(null)
    
    try {
      if (submission.type === 'topic') {
        await topicService.approveBySupervisor(Number(id))
      } else if (submission.type === 'protocol') {
        await protocolService.approveBySupervisor(Number(id))
      } else if (submission.type === 'monograph') {
        // await monographService.approveBySupervisor(Number(id))
      }
      
      setSuccessMessage('✅ Submissão aprovada com sucesso! A seguir para a próxima etapa.')
      
      setTimeout(() => {
        navigate('/supervision')
      }, 2000)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setActingId(null)
    }
  }

  async function handleReject() {
    if (!submission || !id) return
    
    const justification = window.prompt('Justificação da rejeição (obrigatório):')
    if (!justification || !justification.trim()) {
      setError('A justificação é obrigatória para não aprovar.')
      return
    }

    setActingId(id)
    setError(null)
    setSuccessMessage(null)
    
    try {
      if (submission.type === 'topic') {
        await topicService.rejectBySupervisor(Number(id), justification)
      } else if (submission.type === 'protocol') {
        await protocolService.rejectBySupervisor(Number(id), justification)
      } else if (submission.type === 'monograph') {
        // await monographService.rejectBySupervisor(Number(id), justification)
      }
      
      setSuccessMessage('❌ Submissão não aprovada. O estudante foi notificado para fazer as correções.')
      
      setTimeout(() => {
        navigate('/supervision')
      }, 2000)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setActingId(null)
    }
  }

  function handleDownload() {
    if (submission?.documentPath) {
      alert(`📥 Download iniciado: ${submission.documentName || 'documento.docx'}\n\nNo futuro, fará download de: ${submission.documentPath}`)
    } else {
      alert('📄 Este item não possui documento anexado para download.')
    }
  }

  function handleOpenEditor() {
    setShowEditor(true)
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      setSuccessMessage(`📎 Ficheiro "${file.name}" carregado. Pode agora submeter a versão corrigida.`)
    }
  }

  function handleSubmitCorrectedVersion() {
    if (!uploadedFile) {
      setError('Por favor, selecione um ficheiro primeiro.')
      return
    }
    alert(`✅ Versão corrigida submetida: ${uploadedFile.name}\n\nO estudante será notificado.`)
    setUploadedFile(null)
    setSuccessMessage('✅ Versão corrigida enviada ao estudante.')
  }

  // ============================================================
  // LOADING
  // ============================================================
  if (loading) {
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
          width: '24px', height: '24px',
          border: '3px solid var(--outline-variant)',
          borderTopColor: 'var(--primary)',
          borderRadius: 'var(--radius-full)',
          animation: 'spin 0.8s linear infinite'
        }} />
        A carregar...
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!submission) {
    return (
      <div style={{
        textAlign: 'center',
        padding: 'var(--space-5)',
        color: 'var(--on-surface-variant)'
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: 'var(--space-2)' }}>error</span>
        <p>Submissão não encontrada.</p>
        <button onClick={() => navigate('/supervision')} className="btn" style={{ marginTop: 'var(--space-3)' }}>
          Voltar
        </button>
      </div>
    )
  }

  const statusStyle = getStatusStyle(submission.status)
  const typeLabel = submission.type === 'topic' ? 'Tema' : submission.type === 'protocol' ? 'Protocolo' : 'Monografia'

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div style={{
      width: '100%',
      fontFamily: 'var(--font-family)',
      color: 'var(--on-background)'
    }}>

      {/* Editor Modal */}
      {showEditor && (
        <MockEditor
          documentName={submission.documentName || `${typeLabel.toLowerCase()}.docx`}
          onClose={() => setShowEditor(false)}
        />
      )}

      {/* Cabeçalho */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: 'var(--space-2)',
        marginBottom: 'var(--space-4)'
      }}>
        <div>
          <button
            onClick={() => navigate('/supervision')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: 'transparent',
              border: 'none',
              color: 'var(--primary)',
              cursor: 'pointer',
              fontSize: 'var(--body-md)',
              fontFamily: 'var(--font-family)',
              marginBottom: 'var(--space-2)'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_back</span>
            Voltar à lista
          </button>
          <h1 style={{
            fontSize: 'var(--headline-lg)',
            fontWeight: 'var(--font-semibold)',
            color: 'var(--on-surface)',
            marginBottom: 'var(--space-1)'
          }}>
            Revisar {typeLabel}
          </h1>
          <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)' }}>
            {submission.code && `${submission.code} • `}{submission.title}
          </p>
        </div>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 14px',
          borderRadius: 'var(--radius-full)',
          fontSize: 'var(--label-md)',
          fontWeight: 'var(--font-medium)',
          background: statusStyle.bg,
          color: statusStyle.color,
          border: `1px solid ${statusStyle.dot}`
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: 'var(--radius-full)',
            background: statusStyle.dot
          }} />
          {statusStyle.label}
        </span>
      </div>

      {/* Mensagens */}
      {error && (
        <div role="alert" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-1)',
          padding: 'var(--space-2) var(--space-3)',
          background: 'var(--error-container)',
          color: 'var(--on-error-container)',
          borderRadius: 'var(--radius-lg)',
          fontSize: 'var(--body-md)',
          fontWeight: 'var(--font-medium)',
          marginBottom: 'var(--space-4)'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>error</span>
          {error}
        </div>
      )}

      {successMessage && (
        <div role="status" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-1)',
          padding: 'var(--space-2) var(--space-3)',
          background: 'var(--primary-container)',
          color: 'var(--on-primary-container)',
          borderRadius: 'var(--radius-lg)',
          fontSize: 'var(--body-md)',
          fontWeight: 'var(--font-medium)',
          marginBottom: 'var(--space-4)'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>check_circle</span>
          {successMessage}
        </div>
      )}

      {/* Grid: Info + Ações */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'var(--space-4)',
        marginBottom: 'var(--space-4)'
      }}>
        {/* Informações do Estudante */}
        <div className="card" style={{ padding: 'var(--space-4)' }}>
          <h3 style={{
            fontSize: 'var(--title-md)',
            fontWeight: 'var(--font-semibold)',
            marginBottom: 'var(--space-3)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)'
          }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>person</span>
            Dados do Estudante
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <InfoRow icon="person" label="Nome" value={submission.studentName} />
            <InfoRow icon="email" label="Email" value={submission.studentEmail} />
            <InfoRow icon="school" label="Curso" value={submission.courseName} />
            <InfoRow icon="calendar_today" label="Submetido em" value={submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString('pt-PT') : undefined} />
          </div>
        </div>

        {/* Ações do Documento */}
        <div className="card" style={{ padding: 'var(--space-4)' }}>
          <h3 style={{
            fontSize: 'var(--title-md)',
            fontWeight: 'var(--font-semibold)',
            marginBottom: 'var(--space-3)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)'
          }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>description</span>
            Documento
          </h3>
          
          {submission.documentName && (
            <p style={{
              fontSize: 'var(--body-sm)',
              color: 'var(--on-surface-variant)',
              marginBottom: 'var(--space-3)',
              padding: 'var(--space-2)',
              background: 'var(--surface-container)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)'
            }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>insert_drive_file</span>
              {submission.documentName}
            </p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <ActionButton
              icon="edit_note"
              label="Abrir no Editor (Track Changes)"
              primary
              onClick={handleOpenEditor}
            />

            <ActionButton
              icon="download"
              label="Baixar Documento"
              onClick={handleDownload}
            />

            {/* Upload de Versão Corrigida */}
            <div style={{
              marginTop: 'var(--space-2)',
              padding: 'var(--space-3)',
              border: '2px dashed var(--outline-variant)',
              borderRadius: 'var(--radius-lg)',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: 'var(--body-sm)', color: 'var(--on-surface-variant)', marginBottom: 'var(--space-2)' }}>
                Ou faça upload da versão corrigida:
              </p>
              <input
                type="file"
                accept=".docx"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                id="corrected-file-upload"
              />
              <label
                htmlFor="corrected-file-upload"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 16px',
                  background: 'var(--surface-container)',
                  color: 'var(--on-surface)',
                  border: '1px solid var(--outline-variant)',
                  borderRadius: 'var(--radius-lg)',
                  cursor: 'pointer',
                  fontSize: 'var(--body-md)',
                  fontFamily: 'var(--font-family)'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>upload</span>
                Selecionar Ficheiro
              </label>
              {uploadedFile && (
                <div style={{ marginTop: 'var(--space-2)' }}>
                  <p style={{ fontSize: 'var(--label-sm)', color: 'var(--primary)', marginBottom: 'var(--space-1)' }}>
                    📎 {uploadedFile.name}
                  </p>
                  <button
                    onClick={handleSubmitCorrectedVersion}
                    style={{
                      padding: '8px 16px',
                      background: 'var(--primary)',
                      color: 'var(--on-primary)',
                      border: 'none',
                      borderRadius: 'var(--radius-lg)',
                      cursor: 'pointer',
                      fontSize: 'var(--body-sm)',
                      fontFamily: 'var(--font-family)'
                    }}
                  >
                    Enviar Versão Corrigida
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Justificação */}
      <div className="card" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
        <JustificationToggle 
          justification={submission.justification}
          label="Justificação do Tema"
          variant="supervisor"
          showEmpty 
          compact 
        />
      </div>

      {/* Botões de Decisão Final */}
      <div style={{
        display: 'flex',
        gap: 'var(--space-3)',
        justifyContent: 'flex-end',
        padding: 'var(--space-4)',
        background: 'var(--surface-container-low)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--outline-variant)'
      }}>
        <button
          onClick={handleReject}
          disabled={actingId === id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: '16px var(--space-4)',
            background: 'var(--error)',
            color: 'var(--on-error)',
            border: 'none',
            borderRadius: 'var(--radius-lg)',
            cursor: actingId === id ? 'not-allowed' : 'pointer',
            opacity: actingId === id ? 0.6 : 1,
            fontSize: 'var(--body-lg)',
            fontWeight: 'var(--font-semibold)',
            fontFamily: 'var(--font-family)',
            transition: 'all 0.2s'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>cancel</span>
          Não Aprovar
        </button>

        <button
          onClick={handleApprove}
          disabled={actingId === id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: '16px var(--space-4)',
            background: 'var(--primary)',
            color: 'var(--on-primary)',
            border: 'none',
            borderRadius: 'var(--radius-lg)',
            cursor: actingId === id ? 'not-allowed' : 'pointer',
            opacity: actingId === id ? 0.6 : 1,
            fontSize: 'var(--body-lg)',
            fontWeight: 'var(--font-semibold)',
            fontFamily: 'var(--font-family)',
            transition: 'all 0.2s'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>check_circle</span>
           Aprovar
        </button>
      </div>

      {/* Info do Fluxo */}
      <div style={{
        marginTop: 'var(--space-4)',
        padding: 'var(--space-3)',
        background: 'var(--surface-container)',
        borderRadius: 'var(--radius-lg)',
        fontSize: 'var(--label-sm)',
        color: 'var(--on-surface-variant)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)'
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>info</span>
        <span>
          <strong>Aprovar:</strong> Segue para a secretária / próxima etapa • 
          <strong> Não Aprovar:</strong> Retorna ao estudante para correções
        </span>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ============================================================
// COMPONENTES AUXILIARES
// ============================================================
function InfoRow({ icon, label, value }: { icon: string; label: string; value?: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-2)',
      padding: 'var(--space-1) 0'
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--outline)' }}>
        {icon}
      </span>
      <span style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', minWidth: '80px' }}>
        {label}:
      </span>
      <span style={{ fontSize: 'var(--body-md)', fontWeight: 'var(--font-medium)', color: 'var(--on-surface)' }}>
        {value || '-'}
      </span>
    </div>
  )
}

function ActionButton({ icon, label, primary, onClick }: { 
  icon: string
  label: string
  primary?: boolean
  onClick: () => void 
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        padding: '14px var(--space-3)',
        background: primary ? 'var(--primary)' : 'var(--surface-container)',
        color: primary ? 'var(--on-primary)' : 'var(--on-surface)',
        border: primary ? 'none' : '1px solid var(--outline-variant)',
        borderRadius: 'var(--radius-lg)',
        cursor: 'pointer',
        fontSize: 'var(--body-md)',
        fontWeight: 'var(--font-semibold)',
        fontFamily: 'var(--font-family)',
        transition: 'all 0.2s'
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{icon}</span>
      {label}
    </button>
  )
}