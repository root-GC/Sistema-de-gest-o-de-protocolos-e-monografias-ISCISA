import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../components/layout/AppLayout.css'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()

  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [error, setError]         = useState<string | null>(null)
  const [loading, setLoading]     = useState(false)

  const from = location.state?.from?.pathname ?? '/dashboard'

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError(String(err))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">SGPMC</div>
        <div className="login-brand-sub">Sistema de Gestão de Protocolos e Monografias Científicas</div>

        <form onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="alert-error" role="alert">{error}</div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email institucional</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="utilizador@iscisa.ac.mz"
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Palavra-passe</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'A entrar...' : 'Entrar'}
          </button>

          <Link to="/forgot-password" className="forgot-link">
            Esqueceu a palavra-passe?
          </Link>
        </form>
      </div>
    </div>
  )
}