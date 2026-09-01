import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DocumentReviewWorkspace, type ReviewCommentItem } from '../../components/teacher/DocumentReviewWorkspace'
import { protocolService, type Protocol, type ProtocolReviewComment } from '../../services/protocolService'
import { topicService, type Topic, type TopicReviewComment } from '../../services/topicService'

type ReviewKind = 'topic' | 'protocol'

interface SupervisorReview {
  kind: ReviewKind
  id: number
  title: string
  code?: string
  status: string
  statusLabel: string
  documentName?: string | null
}

export default function SubmissionReviewPage() {
  const { type, id } = useParams<{ type: ReviewKind; id: string }>()
  const navigate = useNavigate()
  const reviewId = Number(id)
  const [review, setReview] = useState<SupervisorReview | null>(null)
  const [comments, setComments] = useState<Array<TopicReviewComment | ProtocolReviewComment>>([])
  const [commentValue, setCommentValue] = useState('')
  const [decision, setDecision] = useState<'approved' | 'rejected' | ''>('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void loadReview()
  }, [type, reviewId])

  async function loadReview() {
    if (!type || !reviewId || !['topic', 'protocol'].includes(type)) {
      setError('Tipo de revisão inválido.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      if (type === 'topic') {
        const result = await topicService.listForSupervisor()
        const topic = result.topics.find(item => item.id === reviewId)
        if (!topic) throw new Error('Tema não encontrado.')
        setReview(toTopicReview(topic))
        const resultComments = await topicService.getComments(reviewId)
        setComments(resultComments.comments)
      } else {
        const result = await protocolService.listForSupervisor()
        const protocol = result.protocols.find(item => item.id === reviewId)
        if (!protocol) throw new Error('Protocolo não encontrado.')
        setReview(toProtocolReview(protocol))
        const resultComments = await protocolService.listReviewComments(reviewId)
        setComments(resultComments.comments)
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível carregar a revisão.')
    } finally {
      setLoading(false)
    }
  }

  async function addComment() {
    if (!review || !commentValue.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      if (review.kind === 'topic') await topicService.submitSupervisorComment(review.id, commentValue.trim())
      else await protocolService.addReviewComment(review.id, commentValue.trim())
      setCommentValue('')
      await loadReview()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível registar o comentário.')
    } finally {
      setSubmitting(false)
    }
  }

  async function confirmDecision() {
    if (!review || !decision) return
    if (decision === 'rejected' && comments.length === 0) {
      setError('Registe um comentário antes de não aprovar.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      if (review.kind === 'topic') {
        if (decision === 'approved') await topicService.approveBySupervisor(review.id)
        else await topicService.rejectBySupervisor(review.id, comments.at(-1)?.content || '')
      } else if (decision === 'approved') {
        await protocolService.approveBySupervisor(review.id)
      } else {
        await protocolService.rejectBySupervisor(review.id, comments.at(-1)?.content || '')
      }
      navigate('/supervision')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível registar a decisão.')
    } finally {
      setSubmitting(false)
    }
  }

  async function downloadDocument() {
    if (!review) return
    if (review.kind === 'topic') {
      await protocolService.downloadFile(topicService.downloadDocument(review.id), review.documentName || 'tema.docx')
      return
    }
    await protocolService.downloadFile(`/api/v1/protocols/${review.id}/download`, review.documentName || 'protocolo.docx')
  }

  if (loading) return <div className="page-loader"><div className="page-loader__spinner" /><span className="page-loader__text">A carregar revisão...</span></div>
  if (!review) return <div className="empty-state"><span className="material-symbols-outlined">error</span>{error || 'Revisão não encontrada.'}</div>

  const commentItems: ReviewCommentItem[] = comments.map(comment => ({
    id: comment.id,
    content: comment.content,
    createdAt: comment.created_at,
    author: 'user' in comment ? comment.user?.name || 'Supervisor' : 'Supervisor',
  }))

  return (
    <>
      {error && <div className="eval-notice eval-notice--error" role="alert"><span className="material-symbols-outlined">error</span>{error}</div>}
      <DocumentReviewWorkspace
        document={{ kind: review.kind, id: review.id, name: review.documentName }}
        title={review.title}
        code={review.code}
        statusLabel={review.statusLabel}
        statusTone={review.status.includes('rejected') ? 'rejected' : review.status.includes('approved') ? 'approved' : 'pending'}
        comments={commentItems}
        commentValue={commentValue}
        onCommentChange={setCommentValue}
        onAddComment={addComment}
        commentSubmitting={submitting}
        decision={decision}
        onDecisionChange={setDecision}
        onConfirmDecision={confirmDecision}
        decisionSubmitting={submitting}
        onDownload={downloadDocument}
        backLabel="Voltar para supervisionandos"
        onBack={() => navigate('/supervision')}
      />
    </>
  )
}

function toTopicReview(topic: Topic): SupervisorReview {
  return {
    kind: 'topic',
    id: topic.id,
    title: topic.title,
    status: topic.status,
    statusLabel: topic.status_label,
    documentName: topic.document_name,
  }
}

function toProtocolReview(protocol: Protocol): SupervisorReview {
  return {
    kind: 'protocol',
    id: protocol.id,
    title: protocol.topic?.title || protocol.code,
    code: protocol.code,
    status: protocol.status,
    statusLabel: protocol.status_label,
    documentName: protocol.latest_document?.file_name,
  }
}
