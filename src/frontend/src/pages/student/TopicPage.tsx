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
  const { user, activeProfile } = useAuth()
  
  const [topics, setTopics] = useState<Topic[]>([])
  const [title, setTitle] = useState('')
  const [justification, setJustification] = useState('')
  const [documentFile, setDocumentFile] = useState<File | null>(null)
  const [warning, setWarning] = useState<SimilarTopicsWarning | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Dados do perfil do estudante
  const studentProfile = (activeProfile as any)?.student || (user as any)?.profiles?.student
  const studentCourse = studentProfile?.course
  const studentNumber = studentProfile?.student_number
  const studentScientificArea = studentProfile?.scientific_area

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

  const hasBlockingTopic = topics.some(t =>
    ['topic_pending_supervisor', 'topic_pending_nucleo', 'topic_approved_nucleo'].includes(t.status)
  )

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tipo de arquivo - apenas .docx
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]
      
      if (!validTypes.includes(file.type)) {
        setError('Formato de arquivo não suportado. Use apenas .docx')
        return
      }
      
      // Validar tamanho (máximo 10MB)
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
      const res = await topicService.submit({
        title,
        scientific_area_id: studentScientificArea?.id ? Number(studentScientificArea.id) : 0,
        course_id: studentCourse?.id ? Number(studentCourse.id) : 0,
        justification: justification.trim() || null
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
    const map: Record<string, { className: string; label: string; dot: string }> = {
      topic_pending_supervisor: {
        className: 'badge badge-warning',
        label: 'Pendente (Supervisor)',
        dot: 'var(--tertiary)'
      },
      topic_pending_nucleo: {
        className: 'badge badge-warning',
        label: 'Pendente (Núcleo)',
        dot: 'var(--tertiary)'
      },
      topic_approved_nucleo: {
        className: 'badge badge-success',
        label: 'Aprovado',
        dot: 'var(--primary)'
      },
      topic_rejected: {
        className: 'badge badge-error',
        label: 'Rejeitado',
        dot: 'var(--error)'
      },
    }
    return map[status] || {
      className: 'badge',
      label: status,
      dot: 'var(--outline)'
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

      {/* Card do Perfil do Estudante */}
      {studentProfile && (
        <div style={{
          background: 'linear-gradient(135deg, var(--primary-container), var(--surface-container-low))',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-3) var(--space-4)',
          border: '1px solid var(--surface-container-high)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-4)',
          flexWrap: 'wrap',
          marginBottom: 'var(--space-4)'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--on-primary)', fontSize: '24px' }}>
              school
            </span>
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <p style={{
              fontSize: 'var(--label-md)',
              color: 'var(--on-primary-container)',
              fontWeight: 'var(--font-medium)',
              marginBottom: '2px'
            }}>
              Dados do Estudante
            </p>
            <p style={{
              fontSize: 'var(--body-md)',
              color: 'var(--on-surface)',
              fontWeight: 'var(--font-semibold)',
              margin: 0
            }}>
              {user?.name}
            </p>
            <div style={{
              display: 'flex',
              gap: 'var(--space-3)',
              marginTop: '4px',
              flexWrap: 'wrap',
              fontSize: 'var(--body-md)',
              color: 'var(--on-surface-variant)'
            }}>
              {studentNumber && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>badge</span>
                  {studentNumber}
                </span>
              )}
              {studentCourse && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>book</span>
                  {studentCourse.name}
                </span>
              )}
              {studentScientificArea && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>science</span>
                  {studentScientificArea.name}
                </span>
              )}
            </div>
          </div>
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
                  border: isApproved ? '1px solid var(--primary)' : '1px solid var(--outline-variant)',
                  background: isApproved ? 'color-mix(in srgb, var(--surface) 95%, var(--primary-container))' : 'var(--surface)'
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
                      {isApproved && (
                        <span className="material-symbols-outlined" style={{ 
                          fontSize: '20px', 
                          color: 'var(--primary)',
                          flexShrink: 0
                        }} title="Tema aprovado">
                          verified
                        </span>
                      )}
                    </div>
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
                      {(t as any).document_path && (
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
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '2px 10px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: 'var(--label-md)',
                      fontWeight: 'var(--font-medium)',
                      marginTop: '8px',
                      background: isApproved 
                        ? 'var(--primary-container)' 
                        : `var(${badge.dot.includes('primary') ? 'primary-container' : badge.dot.includes('error') ? 'error-container' : badge.dot.includes('tertiary') ? 'tertiary-container' : 'surface-container'})`,
                      color: isApproved 
                        ? 'var(--on-primary-container)' 
                        : `var(${badge.dot.includes('primary') ? 'on-primary-container' : badge.dot.includes('error') ? 'on-error-container' : badge.dot.includes('tertiary') ? 'on-tertiary-container' : 'on-surface-variant'})`,
                      whiteSpace: 'nowrap'
                    }}>
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: 'var(--radius-full)',
                        background: badge.dot
                      }} />
                      {t.status_label || badge.label}
                    </span>
                  </div>
                </div>

                <TopicJustificationToggle justification={t.justification} showEmpty compact />

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
              </div>
            )
          })}
        </div>
      )}

      {/* Estado vazio */}
      {topics.length === 0 && !hasBlockingTopic && (
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

      {/* Aviso de tema bloqueante */}
      {hasBlockingTopic && !topics.some(t => t.status === 'topic_approved_nucleo') && (
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 'var(--space-2)',
          padding: 'var(--space-3) var(--space-4)',
          background: 'var(--surface-container)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--outline-variant)',
          color: 'var(--on-surface-variant)',
          fontSize: 'var(--body-md)',
          marginBottom: 'var(--space-4)'
        }}>
          <span className="material-symbols-outlined" style={{
            fontSize: '24px',
            color: 'var(--tertiary)',
            flexShrink: 0
          }}>
            info
          </span>
          <p>
            Já tens um tema em curso. Não podes submeter um novo tema neste momento.
          </p>
        </div>
      )}

      {/* Formulário de submissão */}
      {!hasBlockingTopic && (
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
            Submeter novo tema
          </h2>

          {/* Campo: Título */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <label
              htmlFor="title"
              style={{
                fontSize: 'var(--label-md)',
                fontWeight: 'var(--font-medium)',
                color: 'var(--on-surface-variant)'
              }}
            >
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
            <label
              htmlFor="justification"
              style={{
                fontSize: 'var(--label-md)',
                fontWeight: 'var(--font-medium)',
                color: 'var(--on-surface-variant)'
              }}
            >
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

          {/* Grid: Curso + Área Científica (somente leitura) */}
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

          {/* Campo: Upload de Documento */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <label style={{
              fontSize: 'var(--label-md)',
              fontWeight: 'var(--font-medium)',
              color: 'var(--on-surface-variant)'
            }}>
              Documento do tema (.docx)
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
            background: 'var(--tertiary-fixed)',
            color: 'var(--on-tertiary-fixed)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--tertiary-container)',
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
          <p style={{ color: 'var(--on-tertiary-fixed)', opacity: 0.9 }}>
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