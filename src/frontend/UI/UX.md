```markdown
# 📖 Guia de Criação de Páginas - SGPMC

## 🎯 Sistema de Loading e Feedback Visual

---

## 🚀 Template Base

```typescript
import { useEffect, useState } from 'react'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { seuService } from '../../services/seuService'
import '../../styles/global.css'

export default function SuaPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const response = await seuService.list()
      setData(response.data || [])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    try {
      await seuService.submit()
      await loadData()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <LoadingSpinner variant="page" text="A carregar..." />
  }

  return (
    <div style={{ width: '100%', fontFamily: 'var(--font-family)', color: 'var(--on-background)' }}>
      
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--headline-lg)', fontWeight: 'var(--font-semibold)', color: 'var(--on-surface)', marginBottom: 'var(--space-1)' }}>
            Título da Página
          </h1>
          <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)' }}>Descrição</p>
        </div>
      </div>

      {/* Erro */}
      {error && (
        <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', padding: 'var(--space-2) var(--space-3)', background: 'var(--error-container)', color: 'var(--on-error-container)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-4)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>error</span>
          {error}
        </div>
      )}

      {/* Estado vazio */}
      {data.length === 0 && (
        <div style={{ textAlign: 'center', padding: 'var(--space-5)', color: 'var(--on-surface-variant)', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--outline-variant)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', display: 'block', marginBottom: 'var(--space-2)' }}>folder_open</span>
          <p style={{ fontSize: 'var(--body-lg)', fontWeight: 'var(--font-medium)' }}>Nenhum item encontrado</p>
        </div>
      )}

      {/* Conteúdo */}
      {data.map(item => (
        <div key={item.id} className="card" style={{ padding: 'var(--space-3) var(--space-4)' }}>
          <h3>{item.title}</h3>
        </div>
      ))}

      {/* Botão com loading */}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="btn btn-primary"
        style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', padding: '14px var(--space-3)', fontSize: 'var(--body-lg)', fontWeight: 'var(--font-semibold)', borderRadius: 'var(--radius-lg)', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}
      >
        {submitting ? (
          <>
            <span style={{ width: '18px', height: '18px', border: '2px solid var(--on-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            A processar...
          </>
        ) : (
          <>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>send</span>
            Submeter
          </>
        )}
      </button>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
```

---

## 📦 O que SEMPRE fazer ao criar uma página

### 1. Loading Inicial
```typescript
const [loading, setLoading] = useState(true)

if (loading) {
  return <LoadingSpinner variant="page" text="A carregar [dados]..." />
}
```

### 2. Loading Inline (secções)
```typescript
{loadingReviewers ? (
  <LoadingSpinner variant="inline" size="small" text="A carregar..." />
) : (
  <div>Conteúdo</div>
)}
```

### 3. Loading Overlay (bloqueia ecrã)
```typescript
{processing && (
  <LoadingSpinner variant="overlay" text="A processar..." />
)}
```

### 4. Botões com loading
```typescript
<button disabled={submitting} className="btn btn-primary">
  {submitting ? (
    <>
      <span style={{ width: '18px', height: '18px', border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      A processar...
    </>
  ) : (
    'Submeter'
  )}
</button>
```

### 5. Múltiplas ações (aprovar/rejeitar)
```typescript
const [actingId, setActingId] = useState<number | null>(null)

<button disabled={actingId === item.id}>
  {actingId === item.id ? (
    <>
      <span style={{ /* spinner */ }} />
      A processar...
    </>
  ) : (
    'Aprovar'
  )}
</button>
```

### 6. Erro
```typescript
{error && (
  <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', padding: 'var(--space-2) var(--space-3)', background: 'var(--error-container)', color: 'var(--on-error-container)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-4)' }}>
    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>error</span>
    {error}
  </div>
)}
```

### 7. Estado vazio
```typescript
{data.length === 0 && (
  <div style={{ textAlign: 'center', padding: 'var(--space-5)', color: 'var(--on-surface-variant)', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--outline-variant)' }}>
    <span className="material-symbols-outlined" style={{ fontSize: '48px', display: 'block', marginBottom: 'var(--space-2)' }}>inbox</span>
    <p style={{ fontSize: 'var(--body-lg)', fontWeight: 'var(--font-medium)' }}>Nenhum item</p>
  </div>
)}
```

### 8. Animação CSS (adicionar no final da página)
```typescript
<style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
```

---

## 🎨 Variantes do LoadingSpinner

| Variant | Quando usar |
|---------|-------------|
| `page` | Carregamento inicial da página inteira |
| `inline` | Dentro de cards, secções, listas |
| `overlay` | Processamento bloqueante (ex: submissão final) |

| Size | Quando usar |
|------|-------------|
| `small` | Listas compactas, badges |
| `medium` | Padrão |
| `large` | Secções grandes |

---

## ⚡ Barra de Progresso Global (Automática)

**NÃO precisa fazer nada!** A barra verde no topo aparece automaticamente em todas as chamadas à API.

---

## ✅ Checklist ao criar uma página

- [ ] `loading` inicial com `LoadingSpinner variant="page"`
- [ ] `submitting` / `actingId` para ações do utilizador
- [ ] Tratamento de `error` com o alerta padrão
- [ ] Estado vazio quando não há dados
- [ ] Spinner nos botões durante ações
- [ ] `<style>` com `@keyframes spin` no final
- [ ] Usar `var(--font-family)`, `var(--space-*)`, `var(--radius-*)`
```