// import { useState, useEffect } from 'react'
// import { Link, useNavigate } from 'react-router-dom'
// import { useAuth } from '../../context/AuthContext'
// import { authService } from '../../services/authService'

// export default function RegisterPage() {
//   const { login } = useAuth()
//   const navigate  = useNavigate()

//   const [courses, setCourses]     = useState([])
//   const [form, setForm]           = useState({
//     name: '', email: '', student_number: '',
//     course_id: '', password: '', password_confirmation: '',
//   })
//   const [error, setError]         = useState(null)
//   const [fieldErrors, setFieldErrors] = useState({})
//   const [loading, setLoading]     = useState(false)

//   // Carregar lista de cursos disponíveis
//   useEffect(() => {
//     authService.getCourses()
//       .then(data => setCourses(data))
//       .catch(() => {}) // falha silenciosa — campo fica editável
//   }, [])

//   function set(field, value) {
//     setForm(prev => ({ ...prev, [field]: value }))
//     setFieldErrors(prev => ({ ...prev, [field]: null }))
//   }

//   async function handleSubmit(e) {
//     e.preventDefault()
//     setError(null)
//     setFieldErrors({})
//     setLoading(true)

//     try {
//       // RegisterController devolve token + user directamente
//       const { token, user } = await authService.register(form)

//       // Guardar token e hidratar contexto
//       localStorage.setItem('sgpmc_token', token)
//       localStorage.setItem('sgpmc_user', JSON.stringify(user))
//       window.location.href = '/dashboard'  // reload limpo para hidratar AuthContext
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
//       <div className="login-card" style={{ maxWidth: 440 }}>
//         <div className="login-brand">SGPMC</div>
//         <div className="login-brand-sub">Criar conta de estudante</div>

//         <form onSubmit={handleSubmit} noValidate>
//           {error && <div className="alert-error" role="alert">{error}</div>}

//           <div className="form-group">
//             <label htmlFor="name">Nome completo</label>
//             <input
//               id="name" type="text" value={form.name}
//               onChange={e => set('name', e.target.value)}
//               placeholder="Ana Maria Silva" required autoFocus
//             />
//             {fieldErrors.name && <span className="field-error">{fieldErrors.name}</span>}
//           </div>

//           <div className="form-group">
//             <label htmlFor="email">Email institucional</label>
//             <input
//               id="email" type="email" value={form.email}
//               onChange={e => set('email', e.target.value)}
//               placeholder="estudante@iscisa.ac.mz" required
//             />
//             {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
//           </div>

//           <div className="form-group">
//             <label htmlFor="student_number">Número de estudante</label>
//             <input
//               id="student_number" type="text" value={form.student_number}
//               onChange={e => set('student_number', e.target.value)}
//               placeholder="2024001" required
//             />
//             {fieldErrors.student_number && <span className="field-error">{fieldErrors.student_number}</span>}
//           </div>

//           <div className="form-group">
//             <label htmlFor="course_id">Curso</label>
//             <select
//               id="course_id" value={form.course_id}
//               onChange={e => set('course_id', e.target.value)}
//               required
//               style={{
//                 width: '100%', padding: '9px 12px',
//                 border: '1px solid var(--color-border-secondary)',
//                 borderRadius: 8, fontSize: 14,
//                 color: 'var(--color-text-primary)',
//                 background: 'var(--color-background-primary)',
//               }}
//             >
//               <option value="">Seleccionar curso...</option>
//               {courses.map(c => (
//                 <option key={c.id} value={c.id}>{c.name}</option>
//               ))}
//             </select>
//             {fieldErrors.course_id && <span className="field-error">{fieldErrors.course_id}</span>}
//           </div>

//           <div className="form-group">
//             <label htmlFor="password">Palavra-passe</label>
//             <input
//               id="password" type="password" value={form.password}
//               onChange={e => set('password', e.target.value)}
//               placeholder="Mínimo 8 caracteres" required
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
//           </div>

//           <button type="submit" className="btn-primary" disabled={loading}>
//             {loading ? 'A criar conta...' : 'Criar conta'}
//           </button>

//           <p style={{ textAlign: 'center', fontSize: 13, marginTop: 16, color: 'var(--color-text-secondary)' }}>
//             Já tem conta?{' '}
//             <Link to="/login" style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>
//               Entrar
//             </Link>
//           </p>
//         </form>
//       </div>
//     </div>
//   )
// }