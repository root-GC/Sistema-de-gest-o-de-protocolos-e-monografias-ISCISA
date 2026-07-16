// src/pages/TopicPage.tsx
import { useEffect, useState } from 'react'
import { 
  topicService, 
  scientificAreaService, 
  courseService,
  type Topic, 
  type SimilarTopicsWarning,
  type ScientificArea,
  type Course
} from '../../services/topicService'
import { TopicJustificationToggle } from '../../components/TopicJustification'
import '../../styles/global.css'

export default function TopicPage() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [title, setTitle] = useState('')
  const [justification, setJustification] = useState('')
  const [scientificAreaId, setScientificAreaId] = useState('')
  const [courseId, setCourseId] = useState('')
  const [warning, setWarning] = useState<SimilarTopicsWarning | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Estados para os selects
  const [scientificAreas, setScientificAreas] = useState<ScientificArea[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loadingAreas, setLoadingAreas] = useState(false)
  const [loadingCourses, setLoadingCourses] = useState(false)

  useEffect(() => { 
    loadTopics()
    loadScientificAreas()
  }, [])

  // Carregar cursos quando a área científica mudar
  useEffect(() => {
    if (scientificAreaId) {
      loadCourses(Number(scientificAreaId))
    } else {
      setCourses([])
      setCourseId('')
    }
  }, [scientificAreaId])

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

  async function loadScientificAreas() {
    setLoadingAreas(true)
    try {
      const areas = await scientificAreaService.list()
      setScientificAreas(areas)
    } catch (e) {
      console.error('Erro ao carregar áreas científicas:', e)
      setScientificAreas([])
    } finally {
      setLoadingAreas(false)
    }
  }

  async function loadCourses(areaId: number) {
    setLoadingCourses(true)
    try {
      const coursesList = await courseService.list({ scientific_area_id: areaId })
      setCourses(coursesList)
    } catch (e) {
      console.error('Erro ao carregar cursos:', e)
      setCourses([])
    } finally {
      setLoadingCourses(false)
    }
  }

  const hasBlockingTopic = topics.some(t =>
    ['topic_pending_supervisor', 'topic_pending_nucleo', 'topic_approved_nucleo'].includes(t.status)
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setWarning(null)
    try {
      const res = await topicService.submit({
        title,
        justification: justification.trim() || null,
        scientific_area_id: Number(scientificAreaId),
        course_id: Number(courseId),
      })
      if (res.similar_topics_warning.has_similar) setWarning(res.similar_topics_warning)
      setTitle('')
      setJustification('')
      setScientificAreaId('')
      setCourseId('')
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

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        fontFamily: 'var(--font-family)',
        color: 'var(--on-background)'
      }}>
        <h1 style={{
          fontSize: 'var(--headline-lg)',
          fontWeight: 'var(--font-semibold)',
          color: 'var(--on-surface)',
          marginBottom: 'var(--space-1)'
        }}>
          O meu tema
        </h1>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-6)',
          color: 'var(--on-surface-variant)',
          fontSize: 'var(--body-lg)'
        }}>
          <span style={{
            width: '24px',
            height: '24px',
            border: '3px solid var(--outline-variant)',
            borderTopColor: 'var(--primary)',
            borderRadius: 'var(--radius-full)',
            animation: 'spin 0.8s linear infinite',
            marginRight: 'var(--space-2)'
          }} />
          A carregar...
        </div>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-4)',
      fontFamily: 'var(--font-family)',
      color: 'var(--on-background)',
      maxWidth: '100%'
    }}>
      {/* Cabeçalho */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 'var(--space-2)'
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
          <p style={{
            fontSize: 'var(--body-md)',
            color: 'var(--on-surface-variant)',
            fontFamily: 'var(--font-family)'
          }}>
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

      {/* Mensagem de erro global */}
      {error && (
        <div className="badge badge-error" role="alert" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-1)',
          padding: 'var(--space-1) var(--space-2)',
          fontSize: 'var(--body-md)',
          fontWeight: 'var(--font-medium)',
          borderRadius: 'var(--radius-md)'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>error</span>
          {error}
        </div>
      )}

      {/* Lista de temas */}
      {topics.length > 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)'
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
                  padding: 'var(--space-2) var(--space-3)',
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', marginBottom: '4px' }}>
                      <h3 style={{
                        fontSize: 'var(--body-lg)',
                        fontWeight: 'var(--font-semibold)',
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
                        : `var(${badge.dot.includes('primary') ? 'on-primary-container' : badge.dot.includes('error') ? 'on-error-container' : badge.dot.includes('tertiary') ? 'on-tertiary-container' : 'on-surface-variant'})`
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

                {/* Nota de protocolo - apenas para temas aprovados */}
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
      ) : (
        <div style={{
          textAlign: 'center',
          padding: 'var(--space-5) var(--space-3)',
          color: 'var(--on-surface-variant)',
          background: 'var(--surface-container-low)',
          borderRadius: 'var(--radius-xl)',
          border: '1px dashed var(--outline-variant)'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: 'var(--space-2)', display: 'block' }}>
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

      {/* Aviso de tema bloqueante - apenas para temas pendentes, não aprovados */}
      {hasBlockingTopic && !topics.some(t => t.status === 'topic_approved_nucleo') && (
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 'var(--space-2)',
          padding: 'var(--space-2) var(--space-3)',
          background: 'var(--surface-container)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--outline-variant)',
          color: 'var(--on-surface-variant)',
          fontSize: 'var(--body-md)'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'var(--tertiary)', flexShrink: 0 }}>
            info
          </span>
          <p>
            Já tens um tema em curso. Não podes submeter um novo tema neste momento.
          </p>
        </div>
      )}

      {/* Formulário de submissão - escondido se tiver tema bloqueante */}
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
            fontFamily: 'var(--font-family)',
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
                color: 'var(--on-surface-variant)',
                fontFamily: 'var(--font-family)'
              }}
            >
              Título do tema
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Impacto da malária na saúde infantil em Maputo"
              required
              style={{
                width: '100%',
                padding: '12px var(--space-2)',
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

          {/* Campo: Justificação */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <label
              htmlFor="justification"
              style={{
                fontSize: 'var(--label-md)',
                fontWeight: 'var(--font-medium)',
                color: 'var(--on-surface-variant)',
                fontFamily: 'var(--font-family)'
              }}
            >
              Justificação do tema
            </label>
            <textarea
              id="justification"
              value={justification}
              onChange={e => setJustification(e.target.value)}
              placeholder="Explique brevemente a relevância do tema proposto."
              rows={4}
              maxLength={5000}
              style={{
                width: '100%',
                padding: '12px var(--space-2)',
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
                minHeight: '96px'
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

          {/* Grid: Área Científica + Curso */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--space-3)'
          }}>
            {/* Campo: Área Científica (Select) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <label
                htmlFor="scientificArea"
                style={{
                  fontSize: 'var(--label-md)',
                  fontWeight: 'var(--font-medium)',
                  color: 'var(--on-surface-variant)',
                  fontFamily: 'var(--font-family)'
                }}
              >
                Área científica
              </label>
              <select
                id="scientificArea"
                value={scientificAreaId}
                onChange={e => setScientificAreaId(e.target.value)}
                required
                disabled={loadingAreas}
                style={{
                  width: '100%',
                  padding: '12px var(--space-2)',
                  background: 'var(--surface-container-lowest)',
                  border: '1px solid var(--outline-variant)',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: 'var(--body-md)',
                  fontFamily: 'var(--font-family)',
                  color: 'var(--on-surface)',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box',
                  cursor: 'pointer',
                  appearance: 'auto'
                }}
                onFocus={e => {
                  e.target.style.borderColor = 'var(--primary)'
                  e.target.style.boxShadow = '0 0 0 2px rgba(0,105,51,0.15)'
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'var(--outline-variant)'
                  e.target.style.boxShadow = 'none'
                }}
              >
                <option value="">
                  {loadingAreas ? 'A carregar...' : 'Selecione uma área'}
                </option>
                {scientificAreas.map((area: ScientificArea) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Campo: Curso (Select) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <label
                htmlFor="course"
                style={{
                  fontSize: 'var(--label-md)',
                  fontWeight: 'var(--font-medium)',
                  color: 'var(--on-surface-variant)',
                  fontFamily: 'var(--font-family)'
                }}
              >
                Curso
              </label>
              <select
                id="course"
                value={courseId}
                onChange={e => setCourseId(e.target.value)}
                required
                disabled={!scientificAreaId || loadingCourses}
                style={{
                  width: '100%',
                  padding: '12px var(--space-2)',
                  background: 'var(--surface-container-lowest)',
                  border: '1px solid var(--outline-variant)',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: 'var(--body-md)',
                  fontFamily: 'var(--font-family)',
                  color: 'var(--on-surface)',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box',
                  cursor: !scientificAreaId ? 'not-allowed' : 'pointer',
                  opacity: !scientificAreaId ? 0.6 : 1,
                  appearance: 'auto'
                }}
                onFocus={e => {
                  e.target.style.borderColor = 'var(--primary)'
                  e.target.style.boxShadow = '0 0 0 2px rgba(0,105,51,0.15)'
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'var(--outline-variant)'
                  e.target.style.boxShadow = 'none'
                }}
              >
                <option value="">
                  {!scientificAreaId 
                    ? 'Selecione uma área primeiro' 
                    : loadingCourses 
                      ? 'A carregar...' 
                      : 'Selecione um curso'
                  }
                </option>
                {courses.map((course: Course) => (
                  <option key={course.id} value={course.id}>
                    {course.name} {course.code ? `(${course.code})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Botão */}
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
              fontFamily: 'var(--font-family)',
              borderRadius: 'var(--radius-lg)',
              border: 'none',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1,
              transition: 'all 0.2s ease',
              boxShadow: 'var(--elevation-1)',
              marginTop: 'var(--space-1)'
            }}
            onMouseEnter={e => {
              if (!submitting) {
                e.currentTarget.style.boxShadow = 'var(--elevation-2)'
                e.currentTarget.style.transform = 'scale(0.98)'
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = 'var(--elevation-1)'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            {submitting ? (
              <>
                <span style={{
                  width: '18px',
                  height: '18px',
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
            padding: 'var(--space-3)',
            background: 'var(--tertiary-fixed)',
            color: 'var(--on-tertiary-fixed)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--tertiary-container)',
            fontSize: 'var(--body-md)',
            fontFamily: 'var(--font-family)'
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

      {/* Animação do spinner */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
