// import { useState } from 'react'
// import { Link } from 'react-router-dom'
// import { authService } from '../../services/authService'

// export default function ForgotPasswordPage() {
//   const [email, setEmail]     = useState('')
//   const [sent, setSent]       = useState(false)
//   const [error, setError]     = useState(null)
//   const [loading, setLoading] = useState(false)

//   async function handleSubmit(e) {
//     e.preventDefault()
//     setError(null)
//     setLoading(true)
//     try {
//       await authService.forgotPassword(email)
//       setSent(true)
//     } catch (err) {
//       setError(err.message)
//     } finally {
//       setLoading(false)
//     }
//   }

//   if (sent) {
//     return (
//       <div className="login-page">
//         <div className="login-card">
//           <div style={{ textAlign: 'center', padding: '8px 0 20px' }}>
//             <i className="ti ti-mail-check" style={{ fontSize: 36, color: 'var(--color-text-secondary)' }} aria-hidden="true" />
//           </div>
//           <div className="login-brand" style={{ textAlign: 'center' }}>Email enviado</div>
//           <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', textAlign: 'center', margin: '12px 0 24px' }}>
//             Se o email <strong>{email}</strong> existir na nossa base de dados,
//             receberá um link para redefinir a sua palavra-passe nos próximos minutos.
//           </p>
//           <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', textAlign: 'center', marginBottom: 20 }}>
//             O link expira em 60 minutos. Verifique também a pasta de spam.
//           </p>
//           <Link to="/login" style={{ display: 'block', textAlign: 'center', fontSize: 13, color: 'var(--color-text-secondary)' }}>
//             ← Voltar ao login
//           </Link>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="login-page">
//       <div className="login-card">
//         <div className="login-brand">Recuperar acesso</div>
//         <div className="login-brand-sub">
//           Introduza o seu email para receber um link de redefinição.
//         </div>

//         <form onSubmit={handleSubmit} noValidate>
//           {error && <div className="alert-error" role="alert">{error}</div>}

//           <div className="form-group">
//             <label htmlFor="email">Email institucional</label>
//             <input
//               id="email" type="email" value={email}
//               onChange={e => setEmail(e.target.value)}
//               placeholder="utilizador@iscisa.ac.mz"
//               required autoFocus
//             />
//           </div>

//           <button type="submit" className="btn-primary" disabled={loading || !email}>
//             {loading ? 'A enviar...' : 'Enviar link'}
//           </button>

//           <Link to="/login" className="forgot-link" style={{ textAlign: 'center', display: 'block', marginTop: 14 }}>
//             ← Voltar ao login
//           </Link>
//         </form>
//       </div>
//     </div>
//   )
// }