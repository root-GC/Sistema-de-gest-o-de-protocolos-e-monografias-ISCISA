// src/pages/TopicPage.tsx
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { 
  topicService,
  type Topic, 
  type SimilarTopicsWarning,
} from '../../services/topicService'
import { TopicJustificationToggle } from '../../components/TopicJustification'
import '../../styles/global.css'

export default function TopicPage() {
  const { user, profiles } = useAuth()
  
  const [topics, setTopics] = useState<Topic[]>([])
  const [title, setTitle] = useState('')
  const [justification, setJustification] = useState('')
  const [documentFile, setDocumentFile] = useState<File | null>(null)
  const [warning, setWarning] = useState<SimilarTopicsWarning | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Dados do perfil do estudante
  const studentProfile = profiles?.student
  const studentCourse = studentProfile?.course
  const studentNumber = studentProfile?.student_number
  const studentScientificArea = studentProfile?.scientific_area

  // Status que bloqueiam nova submissão (não são não aprovados)
  const blockingStatuses = [
    'topic_pending_supervisor',
    'topic_pending_nucleo',
    'topic_assigned_for_review',
    'topic_in_review',
    'topic_approved_nucleo',
    'topic_pending',
    'topic_approved',
  ]

  // Status não aprovados (permitem nova submissão)
  const rejectedStatuses = [
    'topic_rejected',
    'topic_rejected_supervisor',
    'topic_rejected_nucleo',
  ]

  useEffect(() => { 
    loadTopics()
  }, [])

  async function loadTopics() {
    setLoading(true)
    try {
      const { topics } = await topicService.list()
      setTopics(topics)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const hasBlockingTopic = topics.some(t => blockingStatuses.includes(t.status))
  const rejectedTopic = topics.find(t => rejectedStatuses.includes(t.status))
  const canSubmit = !hasBlockingTopic

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]
      
      if (!validTypes.includes(file.type)) {
        setError('Formato de arquivo não suportado. Use apenas .docx')
        return
      }
      
      if (file.size > 10 * 1024 * 1024) {
        setError('O arquivo deve ter no máximo 10MB')
        return
      }
      
      setDocumentFile(file)
      setError(null)
    }
  }

  function removeFile() {
    setDocumentFile(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setWarning(null)
    
    try {
      if (!studentScientificArea?.id || !studentCourse?.id) {
        setError('Dados do perfil incompletos. Recarregue a página.')
        setSubmitting(false)
        return
      }

      if (!documentFile) {
        setError('O documento do tema é obrigatório. Selecione um ficheiro .docx.')
        setSubmitting(false)
        return
      }

      const res = await topicService.submit({
        title,
        scientific_area_id: studentScientificArea.id,
        course_id: studentCourse.id,
        justification: justification.trim() || null,
        document: documentFile || undefined
      })
      
      if (res.similar_topics_warning?.has_similar) {
        setWarning(res.similar_topics_warning)
      }
      
      setTitle('')
      setJustification('')
      setDocumentFile(null)
      
      await loadTopics()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  function getStatusBadge(status: string) {
    const map: Record<string, { label: string; dot: string; background: string; color: string; icon: string }> = {
      // ⏳ AGUARDANDO (Amarelo/Dourado)
      topic_pending_supervisor: {
        label: 'Aguardando Supervisor',
        dot: 'var(--tertiary)',
        background: 'var(--tertiary-container)',
        color: 'var(--on-tertiary-container)',
        icon: 'hourglass_top'
      },
      topic_pending_nucleo: {
        label: 'Aguardando Núcleo',
        dot: 'var(--tertiary)',
        background: 'var(--tertiary-container)',
        color: 'var(--on-tertiary-container)',
        icon: 'hourglass_top'
      },
      topic_assigned_for_review: {
        label: 'Revisores Atribuídos',
        dot: 'var(--tertiary)',
        background: 'var(--tertiary-container)',
        color: 'var(--on-tertiary-container)',
        icon: 'assignment_ind'
      },
      topic_in_review: {
        label: 'Em Revisão',
        dot: 'var(--tertiary)',
        background: 'var(--tertiary-container)',
        color: 'var(--on-tertiary-container)',
        icon: 'rate_review'
      },
      topic_pending: {
        label: 'Aguardando Supervisor',
        dot: 'var(--tertiary)',
        background: 'var(--tertiary-container)',
        color: 'var(--on-tertiary-container)',
        icon: 'hourglass_top'
      },
      topic_approved: {
        label: 'Aprovado pelo Supervisor',
        dot: 'var(--tertiary)',
        background: 'var(--tertiary-container)',
        color: 'var(--on-tertiary-container)',
        icon: 'hourglass_top'
      },

      // ✅ APROVADO (Verde)
      topic_approved_nucleo: {
        label: 'Aprovado pelo Núcleo',
        dot: 'var(--primary)',
        background: 'var(--primary-container)',
        color: 'var(--on-primary-container)',
        icon: 'verified'
      },

      // ❌ NÃO APROVADO (Vermelho)
      topic_rejected: {
        label: 'Não Aprovado',
        dot: 'var(--error)',
        background: 'var(--error-container)',
        color: 'var(--on-error-container)',
        icon: 'cancel'
      },
      topic_rejected_supervisor: {
        label: 'Não Aprovado pelo Supervisor',
        dot: 'var(--error)',
        background: 'var(--error-container)',
        color: 'var(--on-error-container)',
        icon: 'cancel'
      },
      topic_rejected_nucleo: {
        label: 'Não Aprovado pelo Núcleo',
        dot: 'var(--error)',
        background: 'var(--error-container)',
        color: 'var(--on-error-container)',
        icon: 'cancel'
      },
    }

    const found = map[status]
    if (found) return found

    return {
      label: status.replace(/_/g, ' ').replace(/topic_/g, ''),
      dot: 'var(--outline)',
      background: 'var(--surface-container)',
      color: 'var(--on-surface-variant)',
      icon: 'help'
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

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

  return (
    <div style={{
      width: '100%',
      fontFamily: 'var(--font-family)',
      color: 'var(--on-background)'
    }}>

      {/* Cabeçalho */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 'var(--space-2)',
        marginBottom: 'var(--space-4)'
      }}>
        <div>
          <h1 style={{
            fontSize: 'var(--headline-lg)',
            fontWeight: 'var(--font-semibold)',
            color: 'var(--on-surface)',
            marginBottom: 'var(--space-1)',
            fontFamily: 'var(--font-family)'
          }}>
            O meu tema
          </h1>
          <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)' }}>
            Submeta e acompanhe o seu tema de investigação científica.
          </p>
        </div>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 12px',
          borderRadius: 'var(--radius-full)',
          fontSize: 'var(--label-md)',
          fontWeight: 'var(--font-medium)',
          background: 'var(--surface-container)',
          color: 'var(--on-surface-variant)'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>lightbulb</span>
          {topics.length} tema{topics.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Informações do Estudante */}
      {studentProfile && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          padding: 'var(--space-2) var(--space-3)',
          marginBottom: 'var(--space-4)',
          background: 'var(--surface-container-low)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--outline-variant)',
          fontSize: 'var(--body-md)',
          color: 'var(--on-surface-variant)',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontWeight: 'var(--font-semibold)', color: 'var(--on-surface)' }}>
            {user?.name}
          </span>
          {studentNumber && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>badge</span>
              {studentNumber}
            </span>
          )}
        </div>
      )}

      {/* Mensagem de erro */}
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

      {/* Aviso de tema não aprovado */}
      {rejectedTopic && !hasBlockingTopic && (
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 'var(--space-2)',
          padding: 'var(--space-3) var(--space-4)',
          background: 'var(--error-container)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--error)',
          color: 'var(--on-error-container)',
          fontSize: 'var(--body-md)',
          marginBottom: 'var(--space-4)'
        }}>
          <span className="material-symbols-outlined" style={{
            fontSize: '24px',
            color: 'var(--error)',
            flexShrink: 0
          }}>
            cancel
          </span>
          <div>
            <p style={{ fontWeight: 'var(--font-semibold)', marginBottom: '4px' }}>
              {getStatusBadge(rejectedTopic.status).label}
            </p>
            <p>
              O seu tema "{rejectedTopic.title}" não foi aprovado. 
              Pode submeter um novo tema abaixo.
            </p>
          </div>
        </div>
      )}

      {/* Lista de temas */}
      {topics.length > 0 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-5)'
        }}>
          {topics.map((t: Topic) => {
            const badge = getStatusBadge(t.status)
            const isApproved = t.status === 'topic_approved_nucleo'
            const isRejected = rejectedStatuses.includes(t.status)
            const isPending = !isApproved && !isRejected
            
            return (
              <div
                key={t.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-3) var(--space-4)',
                  transition: 'box-shadow 0.2s',
                  border: isApproved 
                    ? '1px solid var(--primary)' 
                    : isRejected 
                      ? '1px solid var(--error)' 
                      : '1px solid var(--tertiary)',
                  background: isApproved 
                    ? 'color-mix(in srgb, var(--surface) 95%, var(--primary-container))' 
                    : isRejected 
                      ? 'color-mix(in srgb, var(--surface) 95%, var(--error-container))' 
                      : 'color-mix(in srgb, var(--surface) 95%, var(--tertiary-container))'
                }}
              >
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: 'var(--space-2)'
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                      marginBottom: '6px',
                      flexWrap: 'wrap'
                    }}>
                      <h3 style={{
                        fontSize: 'var(--body-lg)',
                        fontWeight: 'var(--font-bold)',
                        color: 'var(--on-surface)',
                        fontFamily: 'var(--font-family)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1
                      }}>
                        {t.title}
                      </h3>
                      <span className="material-symbols-outlined" style={{ 
                        fontSize: '20px', 
                        color: badge.dot,
                        flexShrink: 0
                      }} title={badge.label}>
                        {badge.icon}
                      </span>
                    </div>
                    
                    {/* Tags de Curso e Área Científica */}
                    <div style={{ 
                      display: 'flex', 
                      gap: '8px', 
                      flexWrap: 'wrap',
                      marginTop: '4px'
                    }}>
                      {t.scientific_area && (
                        <span style={{
                          fontSize: 'var(--label-sm)',
                          color: 'var(--on-surface-variant)',
                          background: 'var(--surface-container)',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)'
                        }}>
                          {t.scientific_area.name}
                        </span>
                      )}
                      {t.course && (
                        <span style={{
                          fontSize: 'var(--label-sm)',
                          color: 'var(--on-surface-variant)',
                          background: 'var(--surface-container)',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)'
                        }}>
                          {t.course.name}
                        </span>
                      )}
                      {t.document_path && (
                        <span style={{
                          fontSize: 'var(--label-sm)',
                          color: 'var(--primary)',
                          background: 'var(--primary-container)',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>description</span>
                          Documento anexado
                        </span>
                      )}
                    </div>

                    {/* Badge de Status */}
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: 'var(--label-md)',
                      fontWeight: 'var(--font-medium)',
                      marginTop: '8px',
                      background: badge.background,
                      color: badge.color,
                      whiteSpace: 'nowrap',
                      border: `1px solid ${badge.dot}`
                    }}>
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: 'var(--radius-full)',
                        background: badge.dot,
                        flexShrink: 0
                      }} />
                      {t.status_label || badge.label}
                    </span>

                    {/* Data de submissão */}
                    <div style={{
                      fontSize: 'var(--label-sm)',
                      color: 'var(--on-surface-variant)',
                      marginTop: '6px'
                    }}>
                      Submetido em: {new Date(t.submitted_at).toLocaleDateString('pt-PT', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>

                <TopicJustificationToggle justification={t.justification} showEmpty compact />

                {/* Mensagem para aprovado */}
                {isApproved && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    padding: 'var(--space-2) var(--space-3)',
                    background: 'var(--primary-container)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--primary)',
                    fontSize: 'var(--body-sm)',
                    color: 'var(--on-primary-container)',
                    fontFamily: 'var(--font-family)'
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--primary)' }}>
                      verified
                    </span>
                    <span>
                      Tema aprovado! Já pode submeter o protocolo de investigação.
                    </span>
                  </div>
                )}

                {/* Mensagem para não aprovado */}
                {isRejected && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    padding: 'var(--space-2) var(--space-3)',
                    background: 'var(--error-container)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--error)',
                    fontSize: 'var(--body-sm)',
                    color: 'var(--on-error-container)',
                    fontFamily: 'var(--font-family)'
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--error)' }}>
                      info
                    </span>
                    <span>
                      Este tema não foi aprovado. Pode submeter um novo tema.
                    </span>
                  </div>
                )}

                {/* Mensagem para pendente */}
                {isPending && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    padding: 'var(--space-2) var(--space-3)',
                    background: 'var(--tertiary-container)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--tertiary)',
                    fontSize: 'var(--body-sm)',
                    color: 'var(--on-tertiary-container)',
                    fontFamily: 'var(--font-family)'
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--tertiary)' }}>
                      hourglass_top
                    </span>
                    <span>
                      Aguarde a decisão.
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Estado vazio */}
      {topics.length === 0 && canSubmit && (
        <div style={{
          textAlign: 'center',
          padding: 'var(--space-5) var(--space-3)',
          color: 'var(--on-surface-variant)',
          background: 'var(--surface-container-low)',
          borderRadius: 'var(--radius-xl)',
          border: '1px dashed var(--outline-variant)',
          marginBottom: 'var(--space-4)'
        }}>
          <span className="material-symbols-outlined" style={{
            fontSize: '48px',
            marginBottom: 'var(--space-2)',
            display: 'block'
          }}>
            lightbulb
          </span>
          <p style={{ fontSize: 'var(--body-lg)', fontWeight: 'var(--font-medium)' }}>
            Nenhum tema submetido
          </p>
          <p style={{ fontSize: 'var(--body-md)', marginTop: 'var(--space-1)' }}>
            Submeta o seu primeiro tema de investigação abaixo.
          </p>
        </div>
      )}

      {/* Formulário de submissão */}
      {canSubmit && (
        <form
          onSubmit={handleSubmit}
          className="card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
            padding: 'var(--space-4)'
          }}
        >
          <h2 style={{
            fontSize: 'var(--title-md)',
            fontWeight: 'var(--font-semibold)',
            color: 'var(--on-surface)',
            marginBottom: 'var(--space-1)'
          }}>
            {rejectedTopic ? 'Submeter novo tema' : 'Submeter tema'}
          </h2>

          {/* Grid: Curso + Área Científica (SOMENTE LEITURA) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--space-3)'
          }}>
            {/* Curso */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <label style={{
                fontSize: 'var(--label-md)',
                fontWeight: 'var(--font-medium)',
                color: 'var(--on-surface-variant)'
              }}>
                Curso
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: '14px 16px',
                background: 'var(--surface-container)',
                border: '1px solid var(--outline-variant)',
                borderRadius: 'var(--radius-lg)',
                fontSize: 'var(--body-md)',
                fontFamily: 'var(--font-family)',
                color: 'var(--on-surface)'
              }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '20px' }}>
                  school
                </span>
                <span style={{ fontWeight: 'var(--font-medium)' }}>
                  {studentCourse?.name || 'Não definido'}
                </span>
              </div>
            </div>

            {/* Área Científica */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <label style={{
                fontSize: 'var(--label-md)',
                fontWeight: 'var(--font-medium)',
                color: 'var(--on-surface-variant)'
              }}>
                Área Científica
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: '14px 16px',
                background: 'var(--surface-container)',
                border: '1px solid var(--outline-variant)',
                borderRadius: 'var(--radius-lg)',
                fontSize: 'var(--body-md)',
                fontFamily: 'var(--font-family)',
                color: 'var(--on-surface)'
              }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '20px' }}>
                  science
                </span>
                <span style={{ fontWeight: 'var(--font-medium)' }}>
                  {studentScientificArea?.name || 'Não definida'}
                </span>
              </div>
            </div>
          </div>

          {/* Campo: Título */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <label htmlFor="title" style={{
              fontSize: 'var(--label-md)',
              fontWeight: 'var(--font-medium)',
              color: 'var(--on-surface-variant)'
            }}>
              Título do tema
            </label>
            <div style={{ position: 'relative' }}>
              <span className="material-symbols-outlined" style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--outline)',
                fontSize: '20px',
                pointerEvents: 'none'
              }}>
                edit
              </span>
              <input
                id="title"
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ex: Impacto da malária na saúde infantil em Maputo"
                required
                style={{
                  width: '100%',
                  padding: '14px 16px 14px 44px',
                  background: 'var(--surface-container-lowest)',
                  border: '1px solid var(--outline-variant)',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: 'var(--body-md)',
                  fontFamily: 'var(--font-family)',
                  color: 'var(--on-surface)',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={e => {
                  e.target.style.borderColor = 'var(--primary)'
                  e.target.style.boxShadow = '0 0 0 2px rgba(0,105,51,0.15)'
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'var(--outline-variant)'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>
          </div>

          {/* Campo: Justificação */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <label htmlFor="justification" style={{
              fontSize: 'var(--label-md)',
              fontWeight: 'var(--font-medium)',
              color: 'var(--on-surface-variant)'
            }}>
              Justificação do tema
            </label>
            <textarea
              id="justification"
              value={justification}
              onChange={e => setJustification(e.target.value)}
              placeholder="Explique brevemente a relevância do tema proposto, objetivos e contribuição esperada para a área científica."
              rows={5}
              maxLength={5000}
              style={{
                width: '100%',
                padding: '14px 16px',
                background: 'var(--surface-container-lowest)',
                border: '1px solid var(--outline-variant)',
                borderRadius: 'var(--radius-lg)',
                fontSize: 'var(--body-md)',
                fontFamily: 'var(--font-family)',
                color: 'var(--on-surface)',
                outline: 'none',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box',
                resize: 'vertical',
                minHeight: '120px',
                lineHeight: 1.6
              }}
              onFocus={e => {
                e.target.style.borderColor = 'var(--primary)'
                e.target.style.boxShadow = '0 0 0 2px rgba(0,105,51,0.15)'
              }}
              onBlur={e => {
                e.target.style.borderColor = 'var(--outline-variant)'
                e.target.style.boxShadow = 'none'
              }}
            />
            <span style={{
              fontSize: 'var(--label-md)',
              color: 'var(--outline)',
              textAlign: 'right'
            }}>
              {justification.length}/5000 caracteres
            </span>
          </div>

          {/* Campo: Upload de Documento */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <label style={{
              fontSize: 'var(--label-md)',
              fontWeight: 'var(--font-medium)',
              color: 'var(--on-surface-variant)'
            }}>
              Documento do tema (.docx) <span style={{color: 'var(--error)'}}>*</span>
            </label>
            <p style={{
              fontSize: 'var(--body-md)',
              color: 'var(--on-surface-variant)',
              margin: '0 0 8px 0'
            }}>
              Anexe o documento com a descrição detalhada do tema (apenas .docx, máx. 10MB)
            </p>

            <div style={{ position: 'relative' }}>
              <input
                type="file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0,
                  cursor: 'pointer',
                  width: '100%',
                  height: '100%',
                  zIndex: 1
                }}
              />
              {!documentFile ? (
                <div style={{
                  border: '2px dashed var(--outline-variant)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-4)',
                  textAlign: 'center',
                  background: 'var(--surface-container-lowest)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--primary)'
                  e.currentTarget.style.background = 'rgba(0,105,51,0.02)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--outline-variant)'
                  e.currentTarget.style.background = 'var(--surface-container-lowest)'
                }}
                >
                  <span className="material-symbols-outlined" style={{
                    fontSize: '48px',
                    color: 'var(--outline)',
                    marginBottom: 'var(--space-2)',
                    display: 'block'
                  }}>
                    cloud_upload
                  </span>
                  <p style={{
                    fontSize: 'var(--body-md)',
                    color: 'var(--on-surface-variant)',
                    fontWeight: 'var(--font-medium)'
                  }}>
                    Clique para selecionar ou arraste o arquivo
                  </p>
                  <p style={{
                    fontSize: 'var(--label-md)',
                    color: 'var(--outline)',
                    marginTop: '4px'
                  }}>
                    Formato aceite: .docx
                  </p>
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px var(--space-3)',
                  background: 'var(--surface-container-lowest)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--outline-variant)',
                  gap: 'var(--space-3)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flex: 1, minWidth: 0 }}>
                    <span className="material-symbols-outlined" style={{
                      fontSize: '24px',
                      color: 'var(--primary)',
                      flexShrink: 0
                    }}>
                      check_circle
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: 'var(--body-md)',
                        fontWeight: 'var(--font-semibold)',
                        color: 'var(--on-surface)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        margin: 0
                      }}>
                        {documentFile.name}
                      </p>
                      <p style={{
                        fontSize: 'var(--label-sm)',
                        color: 'var(--on-surface-variant)',
                        margin: '2px 0 0 0'
                      }}>
                        {formatFileSize(documentFile.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    style={{
                      background: 'var(--error-container)',
                      color: 'var(--on-error-container)',
                      border: 'none',
                      borderRadius: 'var(--radius-full)',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      flexShrink: 0,
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'var(--error)'
                      e.currentTarget.style.color = 'var(--on-error)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'var(--error-container)'
                      e.currentTarget.style.color = 'var(--on-error-container)'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Botão Submeter */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-1)',
              padding: '14px var(--space-3)',
              fontSize: 'var(--body-lg)',
              fontWeight: 'var(--font-semibold)',
              borderRadius: 'var(--radius-lg)',
              border: 'none',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1,
              transition: 'all 0.2s ease',
              boxShadow: 'var(--elevation-1)',
              marginTop: 'var(--space-1)'
            }}
          >
            {submitting ? (
              <>
                <span style={{
                  width: '18px', height: '18px',
                  border: '2px solid var(--on-primary)',
                  borderTopColor: 'transparent',
                  borderRadius: 'var(--radius-full)',
                  animation: 'spin 0.8s linear infinite'
                }} />
                A enviar...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>send</span>
                Submeter tema
              </>
            )}
          </button>
        </form>
      )}

      {/* Aviso de temas similares */}
      {warning && (
        <div
          role="alert"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
            padding: 'var(--space-3) var(--space-4)',
            background: 'var(--tertiary-container)',
            color: 'var(--on-tertiary-container)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--tertiary)',
            fontSize: 'var(--body-md)',
            fontFamily: 'var(--font-family)',
            marginTop: 'var(--space-4)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'var(--tertiary)' }}>
              warning
            </span>
            <strong style={{ fontSize: 'var(--body-lg)' }}>
              Temas similares encontrados
            </strong>
          </div>
          <p>
            Encontrámos temas parecidos já aprovados. Verifique se o seu tema não é duplicado:
          </p>
          <ul style={{
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-1)',
            padding: 0
          }}>
            {warning.items.map((it: { id: number; title: string }) => (
              <li
                key={it.id}
                style={{
                  padding: 'var(--space-1) var(--space-2)',
                  background: 'rgba(0,0,0,0.05)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--body-md)'
                }}
              >
                {it.title}
              </li>
            ))}
          </ul>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}