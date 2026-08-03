// src/pages/VerifyOtpPage.tsx
import { useState, useEffect, useRef, type FormEvent, type KeyboardEvent } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { authService, ResendCooldownError } from '../services/authService'
import { LoadingSpinner } from '../components/LoadingSpinner'
import '../styles/global.css'

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function VerifyOtpPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const email = (location.state as { email?: string } | null)?.email ?? ''
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null)

  // Estados do timer
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const [codeExpired, setCodeExpired] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  async function syncStatus() {
    if (!email) return
    try {
      const status = await authService.otpStatus(email)
      setSecondsLeft(status.seconds_remaining)
      setCodeExpired(status.seconds_remaining === null || status.seconds_remaining <= 0)
      setCooldown(status.resend_cooldown)
    } catch {
      // Silencioso
    }
  }

  useEffect(() => {
    if (!email) {
      navigate('/register', { replace: true })
      return
    }
    inputRefs.current[0]?.focus()
    syncStatus()
  }, [email, navigate])

  useEffect(() => {
    const hasCooldown = cooldown > 0
    const hasExpiry = secondsLeft !== null && secondsLeft > 0
    if (!hasCooldown && !hasExpiry) return

    const t = setInterval(() => {
      if (hasCooldown) setCooldown(c => Math.max(0, c - 1))
      if (hasExpiry) {
        setSecondsLeft(prev => {
          if (prev === null) return null
          if (prev <= 1) {
            setCodeExpired(true)
            return 0
          }
          return prev - 1
        })
      }
    }, 1000)

    return () => clearInterval(t)
  }, [cooldown > 0, secondsLeft !== null])

  function handleDigitChange(index: number, value: string) {
    // Se colou múltiplos caracteres
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6).split('')
      const newCode = [...code]
      digits.forEach((digit, i) => {
        if (i < 6) newCode[i] = digit
      })
      setCode(newCode)
      
      // Foca no próximo vazio ou no último
      const nextIndex = Math.min(digits.length, 5)
      inputRefs.current[nextIndex]?.focus()
      return
    }

    const digit = value.replace(/\D/g, '')
    if (digit === '') return

    const newCode = [...code]
    newCode[index] = digit
    setCode(newCode)

    // Avança para o próximo campo
    if (index < 5) {
      inputRefs.current[index + 1]?.focus()
    } else {
      // Último campo: mantém o foco mas o valor já está visível
      inputRefs.current[index]?.blur()
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const newCode = [...code]
      
      if (newCode[index]) {
        // Apaga o dígito atual
        newCode[index] = ''
        setCode(newCode)
      } else if (index > 0) {
        // Volta e apaga o anterior
        newCode[index - 1] = ''
        setCode(newCode)
        inputRefs.current[index - 1]?.focus()
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      if (index > 0) {
        inputRefs.current[index - 1]?.focus()
      }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      if (index < 5) {
        inputRefs.current[index + 1]?.focus()
      }
    }
  }

  function handleFocus(index: number) {
    setFocusedIndex(index)
    // Seleciona o conteúdo para sobrescrever
    setTimeout(() => {
      inputRefs.current[index]?.select()
    }, 0)
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pastedText = e.clipboardData.getData('text')
    const digits = pastedText.replace(/\D/g, '').slice(0, 6).split('')
    
    if (digits.length === 0) return
    
    const newCode = [...code]
    digits.forEach((digit, i) => {
      if (i < 6) newCode[i] = digit
    })
    setCode(newCode)
    
    // Foca no próximo vazio ou no último
    const nextIndex = Math.min(digits.length, 5)
    inputRefs.current[nextIndex]?.focus()
  }

  const fullCode = code.join('')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (fullCode.length !== 6) return

    setError(null)
    setLoading(true)
    try {
      await authService.verifyOtp(email, fullCode)
      navigate('/login', { replace: true, state: { verified: true } })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (!email || cooldown > 0 || resending) return
    
    setResending(true)
    setError(null)
    
    try {
      await authService.resendOtp(email)
      setCode(['', '', '', '', '', ''])
      setCodeExpired(false)
      inputRefs.current[0]?.focus()
      await syncStatus()
    } catch (err) {
      if (err instanceof ResendCooldownError) {
        setCooldown(err.retryAfter)
        setError(err.message)
      } else {
        setError(err instanceof Error ? err.message : String(err))
        await syncStatus()
      }
    } finally {
      setResending(false)
    }
  }

  if (!email) return null

  return (
    <div className="otp-page" onPaste={handlePaste}>
      {loading && <LoadingSpinner variant="overlay" text="A verificar código..." />}

      <main className="otp-main">
        <div className="otp-container">
          
          {/* Header */}
          <div className="otp-header">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAKW98T0QI3yiR-05Z-BoA6n6AKFK_0ZdAqs1kfapv1inuADxNU7iCp-dKMIMkUti0n9BuBbzOugqpZmuRFq8g0e6hIiwvgFJ3EMlGTBhVTYkjNfkmlUWZEDkXFSNZ59ZVenTCv8hw2KrROVZkKZort3wvb3rQ862iCLbpMPGaiHh1LsvhPKbtxDNFe4jRGObM0eeFiO0gYIZ0z1ac0X6dncZ6JWoUI0NGRm5BtnK_SSPldMEHABk8gTnp6gZnGB41fWkONkURhR3I"
              alt="ISCISA"
              className="otp-logo"
            />
            <h1>Verificação de Email</h1>
            <p>
              Enviámos um código de 6 dígitos para <strong>{email}</strong>
            </p>
          </div>

          {/* Card */}
          <div className="card otp-card">
            
            {/* Timer do código */}
            {secondsLeft !== null && !codeExpired && (
              <div className="otp-timer">
                <span className={`material-symbols-outlined ${secondsLeft < 60 ? 'otp-timer-icon--urgent' : ''}`}>
                  {secondsLeft < 60 ? 'timer_off' : 'schedule'}
                </span>
                <span className={`otp-timer-text ${secondsLeft < 60 ? 'otp-timer-text--urgent' : ''}`}>
                  Código válido por mais {formatTime(secondsLeft)}
                </span>
              </div>
            )}

            {/* Código expirado */}
            {codeExpired && (
              <div className="badge badge-error otp-expired" role="alert">
                <span className="material-symbols-outlined">schedule</span>
                O código expirou. Solicite um novo abaixo.
              </div>
            )}

            {/* Erro */}
            {error && (
              <div className="badge badge-error otp-error" role="alert">
                <span className="material-symbols-outlined">error</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="otp-form">
              {/* Quadradinhos */}
              <div className="otp-display">
                {code.map((digit, index) => (
                  <div key={index} className="otp-digit-wrapper">
                    <input
                      ref={el => {
                        inputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      value={digit}
                      onChange={e => handleDigitChange(index, e.target.value)}
                      onKeyDown={e => handleKeyDown(index, e)}
                      onFocus={() => handleFocus(index)}
                      onBlur={() => setFocusedIndex(null)}
                      disabled={loading || codeExpired}
                      maxLength={1}
                      className={`otp-digit-input ${digit ? 'otp-digit-input--filled' : ''} ${focusedIndex === index ? 'otp-digit-input--focused' : ''}`}
                    />
                    {/* Cursor piscante quando vazio e focado */}
                    {!digit && focusedIndex === index && (
                      <div className="otp-digit-cursor" />
                    )}
                  </div>
                ))}
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={loading || codeExpired || fullCode.length !== 6}
              >
                {loading ? 'A verificar...' : 'Verificar Código'}
              </button>
            </form>

            {/* Reenviar */}
            <div className="otp-resend">
              {cooldown > 0 ? (
                <span className="otp-cooldown">
                  Reenviar código em {formatTime(cooldown)}
                </span>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="btn btn-link"
                >
                  {resending ? 'A reenviar...' : 'Reenviar código'}
                </button>
              )}
            </div>

            <div className="otp-back">
              <Link to="/register">
                <span className="material-symbols-outlined">arrow_back</span>
                Voltar ao registo
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}