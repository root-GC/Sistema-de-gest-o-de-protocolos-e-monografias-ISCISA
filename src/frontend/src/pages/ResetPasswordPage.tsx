// import { useState } from 'react'
// import { useSearchParams, useNavigate, Link } from 'react-router-dom'
// import { authService } from '../../services/authService'

// export default function ResetPasswordPage() {
//   const [searchParams]  = useSearchParams()
//   const navigate        = useNavigate()

//   const token = searchParams.get('token') ?? ''
//   const email = searchParams.get('email') ?? ''

//   const [form, setForm]       = useState({ password: '', password_confirmation: '' })
//   const [error, setError]     = useState(null)
//   const [fieldErrors, setFieldErrors] = useState({})
//   const [loading, setLoading] = useState(false)
//   const [done, setDone]       = useState(false)

//   // Se chegou sem token ou email na URL — link inválido
//   if (!token || !email) {
//     return (
//       <div className="login-page">
//         <div className="login-card" style={{ textAlign: 'center' }}>
//           <i className="ti ti-link-off" style={{ fontSize: 32, color: 'var(--color-text-tertiary)', display: 'block', marginBottom: 12 }} aria-hidden="true" />
//           <div className="login-brand">Link inválido</div>
//           <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '12px 0 20px' }}>
//             Este link é inválido ou já foi utilizado. Solicite um novo.
//           </p>
//           <Link to="/forgot-password" className="btn-primary" style={{ display: 'block', textAlign: 'center', padding: '10px', borderRadius: 8, background: 'var(--color-text-primary)', color: 'var(--color-background-primary)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
//             Solicitar novo link
//           </Link>
//         </div>
//       </div>
//     )
//   }

//   if (done) {
//     return (
//       <div className="login-page">
//         <div className="login-card" style={{ textAlign: 'center' }}>
//           <i className="ti ti-circle-check" style={{ fontSize: 36, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 12 }} aria-hidden="true" />
//           <div className="login-brand">Palavra-passe actualizada</div>
//           <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '12px 0 24px' }}>
//             A sua palavra-passe foi redefinida com sucesso.
//           </p>
//           <button className="btn-primary" onClick={() => navigate('/login')}>
//             Ir para o login
//           </button>
//         </div>
//       </div>
//     )
//   }

//   function set(field, value) {
//     setForm(prev => ({ ...prev, [field]: value }))
//     setFieldErrors(prev => ({ ...prev, [field]: null }))
//   }

//   async function handleSubmit(e) {
//     e.preventDefault()
//     setError(null)
//     setFieldErrors({})

//     if (form.password !== form.password_confirmation) {
//       setFieldErrors({ password_confirmation: 'As palavras-passe não coincidem.' })
//       return
//     }

//     setLoading(true)
//     try {
//       await authService.resetPassword(token, email, form.password, form.password_confirmation)
//       setDone(true)
//     } catch (err) {
//       if (err.fieldErrors) {
//         setFieldErrors(err.fieldErrors)
//       } else {
//         setError(err.message)
//       }
//     } finally {
//       setLoading(false)
//     }
//   }

//   return (
//     <div className="login-page">
//       <div className="login-card">
//         <div className="login-brand">Nova palavra-passe</div>
//         <div className="login-brand-sub">
//           A definir nova palavra-passe para <strong>{decodeURIComponent(email)}</strong>
//         </div>

//         <form onSubmit={handleSubmit} noValidate>
//           {error && <div className="alert-error" role="alert">{error}</div>}

//           <div className="form-group">
//             <label htmlFor="password">Nova palavra-passe</label>
//             <input
//               id="password" type="password" value={form.password}
//               onChange={e => set('password', e.target.value)}
//               placeholder="Mínimo 8 caracteres"
//               required autoFocus minLength={8}
//             />
//             {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
//           </div>

//           <div className="form-group">
//             <label htmlFor="password_confirmation">Confirmar palavra-passe</label>
//             <input
//               id="password_confirmation" type="password" value={form.password_confirmation}
//               onChange={e => set('password_confirmation', e.target.value)}
//               required
//             />
//             {fieldErrors.password_confirmation && (
//               <span className="field-error">{fieldErrors.password_confirmation}</span>
//             )}
//           </div>

//           <button type="submit" className="btn-primary" disabled={loading}>
//             {loading ? 'A actualizar...' : 'Definir palavra-passe'}
//           </button>
//         </form>
//       </div>
//     </div>
//   )
// }