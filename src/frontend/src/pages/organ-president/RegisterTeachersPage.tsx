// src/pages/organ-president/RegisterTeachersPage.tsx
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { organPresidentService } from '../../services/organPresidentService'
import { getOrganConfig } from './organPresidentConfig'
import '../../styles/global.css'

// ============================================================
// TIPOS
// ============================================================
type Tab = 'manual' | 'import'

interface TeacherFormData {
  name: string
  email: string
  scientific_area_id?: number | null
}

interface ScientificArea {
  id: number
  name: string
  organ_id: number
}

interface ImportPreview {
  valid: { line: number; name: string; email: string }[]
  invalid: { line: number; name: string; email: string; errors: string[] }[]
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function RegisterTeachersPage() {
  const { profiles } = useAuth()
  
  // Estado do formulário
  const [activeTab, setActiveTab] = useState<Tab>('manual')
  const [formData, setFormData] = useState<TeacherFormData>({
    name: '',
    email: '',
    scientific_area_id: null,
  })
  
  // Estado de importação
  const [file, setFile] = useState<File | null>(null)
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null)
  const [importReport, setImportReport] = useState<{
    created: { line: number; id: number; name: string; email: string }[]
    failed: { line: number; row: Record<string, string>; errors: string[] }[]
  } | null>(null)
  
  // Estado geral
  const [loading, setLoading] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [scientificAreas, setScientificAreas] = useState<ScientificArea[]>([])
  
  const organType = profiles?.admin?.organ?.type || 'scientific_committee'
  const organId = (profiles?.admin as any)?.organ_id || profiles?.admin?.organ?.id
  const organScope = profiles?.admin?.organ?.name || ''
  const config = getOrganConfig(organType)

  useEffect(() => {
    if (organId) {
      loadScientificAreas()
    }
  }, [organId])

  async function loadScientificAreas() {
    try {
      // Carregar áreas científicas do órgão
      const response = await organPresidentService.listAvailableTeachers()
      const areas = new Map<number, ScientificArea>()
      response?.data?.forEach((teacher: any) => {
        if (teacher.scientific_area_id && teacher.scientific_area) {
          areas.set(teacher.scientific_area_id, {
            id: teacher.scientific_area_id,
            name: teacher.scientific_area,
            organ_id: organId,
          })
        }
      })
      setScientificAreas(Array.from(areas.values()))
    } catch (e) {
      console.error('Erro ao carregar áreas científicas:', e)
    }
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.name || !formData.email) return

    setLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      // Usar o serviço para criar docente
      const response = await organPresidentService.createTeacher({
        name: formData.name,
        email: formData.email,
      })
      
      console.log('✅ Docente criado:', response)
      
      setSuccessMessage('Docente registado com sucesso! Email de convite enviado.')
      setFormData({
        name: '',
        email: '',
        scientific_area_id: null,
      })
    } catch (e: any) {
      setError(e?.message || 'Erro ao registar docente.')
    } finally {
      setLoading(false)
    }
  }

  async function handleImportSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return

    setLoading(true)
    setError(null)
    setSuccessMessage(null)
    setImportReport(null)

    try {
      // Usar o serviço para importar docentes
      const response = await organPresidentService.importTeachers(file)
      
      console.log('📁 Importação concluída:', response)
      
      setImportReport(response)
      setSuccessMessage('Importação concluída!')
      
      if (response.failed.length === 0) {
        // Se não houver falhas, limpar o ficheiro
        setFile(null)
        setImportPreview(null)
      }
    } catch (e: any) {
      setError(e?.message || 'Erro ao importar ficheiro.')
    } finally {
      setLoading(false)
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0] || null
    setFile(selectedFile)
    setImportReport(null)
    setImportPreview(null)
    
    if (selectedFile) {
      await previewFile(selectedFile)
    }
  }

  async function previewFile(file: File) {
    setPreviewLoading(true)
    setError(null)
    
    try {
      // Para CSV
      if (file.name.endsWith('.csv')) {
        const text = await file.text()
        const lines = text.split('\n').filter(line => line.trim())
        
        if (lines.length < 2) {
          throw new Error('O ficheiro não contém dados suficientes.')
        }
        
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
        const nameIndex = headers.findIndex(h => ['name', 'nome', 'full_name'].includes(h))
        const emailIndex = headers.findIndex(h => ['email', 'e-mail', 'correio'].includes(h))
        
        if (nameIndex === -1 || emailIndex === -1) {
          throw new Error('Colunas obrigatórias não encontradas. Use "name" e "email".')
        }
        
        const valid: ImportPreview['valid'] = []
        const invalid: ImportPreview['invalid'] = []
        
        lines.slice(1).forEach((line, index) => {
          const columns = line.split(',').map(c => c.trim())
          const name = columns[nameIndex] || ''
          const email = columns[emailIndex] || ''
          const errors: string[] = []
          
          if (!name || name.length < 3) {
            errors.push('Nome é obrigatório (mínimo 3 caracteres)')
          }
          
          if (!email || !email.includes('@')) {
            errors.push('Email inválido')
          }
          
          const lineNumber = index + 2 // +2 porque linha 1 é cabeçalho
          
          if (errors.length === 0) {
            valid.push({ line: lineNumber, name, email })
          } else {
            invalid.push({ line: lineNumber, name, email, errors })
          }
        })
        
        setImportPreview({ valid, invalid })
      } 
      // Para Excel (xlsx, xls)
      else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        // Aqui você precisará de uma biblioteca como xlsx ou exceljs
        // Por enquanto, mostra uma mensagem de que o ficheiro foi carregado
        setImportPreview({
          valid: [
            { line: 2, name: 'Exemplo Docente', email: 'exemplo@iscisa.ac.mz' }
          ],
          invalid: []
        })
      }
    } catch (e: any) {
      setError(e?.message || 'Erro ao ler o ficheiro.')
    } finally {
      setPreviewLoading(false)
    }
  }

  return (
    <div style={{ width: '100%', fontFamily: 'var(--font-family)', color: 'var(--on-background)' }}>
      {/* Cabeçalho */}
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <h1 style={{ fontSize: 'var(--headline-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-1)' }}>
          Registar Docentes
        </h1>
        <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)' }}>
          Registe novos docentes para o {config.label} • {organScope}
        </p>
      </div>

      {/* Alertas */}
      {error && <Alert type="error">{error}</Alert>}
      {successMessage && <Alert type="success">{successMessage}</Alert>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-1)', marginBottom: 'var(--space-3)', borderBottom: '2px solid var(--outline-variant)', paddingBottom: 'var(--space-2)' }}>
        <TabButton 
          active={activeTab === 'manual'} 
          onClick={() => setActiveTab('manual')} 
          icon="person_add" 
          label="Registo Manual" 
        />
        <TabButton 
          active={activeTab === 'import'} 
          onClick={() => setActiveTab('import')} 
          icon="upload" 
          label="Importar Excel/CSV" 
        />
      </div>

      {/* Registo Manual */}
      {activeTab === 'manual' && (
        <form onSubmit={handleManualSubmit} style={{ maxWidth: '600px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <FormField 
              label="Nome Completo *" 
              value={formData.name} 
              onChange={v => setFormData({ ...formData, name: v })} 
              placeholder="Ex: João Carlos Silva"
              required 
            />
            
            <FormField 
              label="Email Institucional *" 
              value={formData.email} 
              onChange={v => setFormData({ ...formData, email: v })} 
              type="email"
              placeholder="Ex: joao.silva@iscisa.ac.mz"
              required 
            />
            
            {scientificAreas.length > 0 && (
              <FormSelect 
                label="Área Científica" 
                value={String(formData.scientific_area_id || '')} 
                onChange={v => setFormData({ ...formData, scientific_area_id: v ? Number(v) : null })} 
                options={[
                  { value: '', label: '— Selecione —' },
                  ...scientificAreas.map(a => ({ value: String(a.id), label: a.name }))
                ]}
              />
            )}
            
            <div style={{ 
              padding: 'var(--space-2)', 
              background: 'var(--tertiary-container)', 
              borderRadius: 'var(--radius-lg)', 
              fontSize: 'var(--label-sm)', 
              color: 'var(--on-tertiary-container)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>info</span>
              Um email será enviado ao docente com instruções para ativar a conta.
            </div>
            
            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                onClick={() => setFormData({ name: '', email: '', scientific_area_id: null })}
                className="btn"
                style={{ 
                  padding: '10px 16px', 
                  background: 'var(--surface-container)', 
                  color: 'var(--on-surface)', 
                  border: '1px solid var(--outline-variant)', 
                  borderRadius: 'var(--radius-lg)', 
                  cursor: 'pointer',
                  fontFamily: 'var(--font-family)',
                  fontSize: 'var(--body-md)'
                }}
              >
                Limpar
              </button>
              <button 
                type="submit" 
                disabled={loading}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 'var(--space-1)', 
                  padding: '10px 20px', 
                  background: 'var(--primary)', 
                  color: 'var(--on-primary)', 
                  border: 'none', 
                  borderRadius: 'var(--radius-lg)', 
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-family)',
                  fontSize: 'var(--body-md)',
                  fontWeight: 'var(--font-semibold)',
                  opacity: loading ? 0.7 : 1
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  {loading ? 'hourglass_top' : 'person_add'}
                </span>
                {loading ? 'A registar...' : 'Registar Docente'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Importação */}
      {activeTab === 'import' && (
        <div style={{ maxWidth: '800px' }}>
          <form onSubmit={handleImportSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ 
                padding: 'var(--space-3)', 
                background: 'var(--surface-container-low)', 
                borderRadius: 'var(--radius-lg)', 
                border: '2px dashed var(--outline-variant)',
                textAlign: 'center'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--outline)' }}>
                  upload_file
                </span>
                <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)', margin: 'var(--space-2) 0' }}>
                  Selecione um ficheiro Excel ou CSV
                </p>
                <input 
                  type="file" 
                  accept=".xlsx,.xls,.csv" 
                  onChange={handleFileChange}
                  style={{ 
                    display: 'block',
                    margin: '0 auto',
                    padding: 'var(--space-2)',
                    fontSize: 'var(--body-md)',
                    fontFamily: 'var(--font-family)'
                  }}
                />
                {file && (
                  <p style={{ fontSize: 'var(--label-sm)', color: 'var(--primary)', marginTop: 'var(--space-2)' }}>
                    ✓ {file.name} ({Math.round(file.size / 1024)} KB)
                  </p>
                )}
              </div>
              
              <div style={{ 
                padding: 'var(--space-2)', 
                background: 'var(--surface-container)', 
                borderRadius: 'var(--radius-lg)', 
                fontSize: 'var(--label-sm)', 
                color: 'var(--on-surface-variant)'
              }}>
                <strong>Formato esperado:</strong> Colunas <code>name</code> (ou <code>nome</code>) e <code>email</code>
              </div>

              {/* Pré-visualização dos dados */}
              {previewLoading && (
                <div style={{ 
                  padding: 'var(--space-3)', 
                  background: 'var(--surface-container-low)', 
                  borderRadius: 'var(--radius-lg)',
                  textAlign: 'center'
                }}>
                  <span style={{ 
                    width: '24px', 
                    height: '24px', 
                    border: '3px solid var(--outline-variant)', 
                    borderTopColor: 'var(--primary)', 
                    borderRadius: 'var(--radius-full)', 
                    animation: 'spin 0.8s linear infinite',
                    display: 'inline-block'
                  }} />
                  <p style={{ marginTop: 'var(--space-2)', fontSize: 'var(--body-md)' }}>
                    A ler ficheiro...
                  </p>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
              )}

              {importPreview && !previewLoading && (
                <div style={{ 
                  background: 'var(--surface-container-low)', 
                  borderRadius: 'var(--radius-lg)', 
                  padding: 'var(--space-3)' 
                }}>
                  <h3 style={{ fontSize: 'var(--title-md)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>
                    Pré-visualização dos Dados
                  </h3>
                  
                  <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                    <div style={{ 
                      padding: 'var(--space-2)', 
                      background: 'var(--primary-container)', 
                      borderRadius: 'var(--radius-lg)',
                      flex: 1,
                      textAlign: 'center'
                    }}>
                      <p style={{ fontSize: 'var(--headline-lg)', fontWeight: 'var(--font-bold)', color: 'var(--on-primary-container)', margin: 0 }}>
                        {importPreview.valid.length}
                      </p>
                      <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-primary-container)', margin: '4px 0 0' }}>
                        Válidos
                      </p>
                    </div>
                    <div style={{ 
                      padding: 'var(--space-2)', 
                      background: importPreview.invalid.length > 0 ? 'var(--error-container)' : 'var(--surface-container)', 
                      borderRadius: 'var(--radius-lg)',
                      flex: 1,
                      textAlign: 'center'
                    }}>
                      <p style={{ 
                        fontSize: 'var(--headline-lg)', 
                        fontWeight: 'var(--font-bold)', 
                        color: importPreview.invalid.length > 0 ? 'var(--on-error-container)' : 'var(--on-surface-variant)', 
                        margin: 0 
                      }}>
                        {importPreview.invalid.length}
                      </p>
                      <p style={{ 
                        fontSize: 'var(--label-sm)', 
                        color: importPreview.invalid.length > 0 ? 'var(--on-error-container)' : 'var(--on-surface-variant)', 
                        margin: '4px 0 0' 
                      }}>
                        Inválidos
                      </p>
                    </div>
                  </div>

                  {/* Tabela de pré-visualização */}
                  <div style={{ overflowX: 'auto', maxHeight: '300px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', fontSize: 'var(--label-sm)', borderCollapse: 'collapse' }}>
                      <thead style={{ 
                        position: 'sticky', 
                        top: 0, 
                        background: 'var(--surface-container-high)',
                        zIndex: 1
                      }}>
                        <tr>
                          <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid var(--outline-variant)' }}>Linha</th>
                          <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid var(--outline-variant)' }}>Nome</th>
                          <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid var(--outline-variant)' }}>Email</th>
                          <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid var(--outline-variant)' }}>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.valid.map(item => (
                          <tr key={`valid-${item.line}`}>
                            <td style={{ padding: '8px', borderBottom: '1px solid var(--outline-variant)' }}>{item.line}</td>
                            <td style={{ padding: '8px', borderBottom: '1px solid var(--outline-variant)' }}>{item.name}</td>
                            <td style={{ padding: '8px', borderBottom: '1px solid var(--outline-variant)' }}>{item.email}</td>
                            <td style={{ padding: '8px', borderBottom: '1px solid var(--outline-variant)' }}>
                              <span style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '4px',
                                color: 'var(--primary)',
                                fontWeight: 'var(--font-medium)'
                              }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
                                Válido
                              </span>
                            </td>
                          </tr>
                        ))}
                        {importPreview.invalid.map(item => (
                          <tr key={`invalid-${item.line}`} style={{ background: 'var(--error-container)' }}>
                            <td style={{ padding: '8px', borderBottom: '1px solid var(--outline-variant)' }}>{item.line}</td>
                            <td style={{ padding: '8px', borderBottom: '1px solid var(--outline-variant)' }}>{item.name || '—'}</td>
                            <td style={{ padding: '8px', borderBottom: '1px solid var(--outline-variant)' }}>{item.email || '—'}</td>
                            <td style={{ padding: '8px', borderBottom: '1px solid var(--outline-variant)' }}>
                              <span style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '4px',
                                color: 'var(--on-error-container)',
                                fontWeight: 'var(--font-medium)'
                              }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>error</span>
                                {item.errors.join(', ')}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              <button 
                type="submit" 
                disabled={!file || loading || !importPreview || importPreview.valid.length === 0}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: 'var(--space-1)', 
                  padding: '10px 20px', 
                  background: 'var(--primary)', 
                  color: 'var(--on-primary)', 
                  border: 'none', 
                  borderRadius: 'var(--radius-lg)', 
                  cursor: !file || loading || !importPreview || importPreview.valid.length === 0 ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-family)',
                  fontSize: 'var(--body-md)',
                  fontWeight: 'var(--font-semibold)',
                  opacity: !file || loading || !importPreview || importPreview.valid.length === 0 ? 0.5 : 1
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  {loading ? 'hourglass_top' : 'upload'}
                </span>
                {loading ? 'A importar...' : `Importar ${importPreview?.valid.length || 0} Docentes`}
              </button>
            </div>
          </form>

          {/* Relatório de Importação */}
          {importReport && (
            <div style={{ marginTop: 'var(--space-3)' }}>
              <h3 style={{ fontSize: 'var(--title-md)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>
                Relatório de Importação
              </h3>
              
              <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                <StatCard 
                  icon="check_circle" 
                  label="Criados" 
                  count={importReport.created.length} 
                  color="var(--primary)" 
                  bg="var(--primary-container)" 
                  onClick={() => {}} 
                />
                <StatCard 
                  icon="error" 
                  label="Falhados" 
                  count={importReport.failed.length} 
                  color="var(--error)" 
                  bg="var(--error-container)" 
                  onClick={() => {}} 
                />
              </div>

              {importReport.failed.length > 0 && (
                <div style={{ 
                  background: 'var(--surface-container-low)', 
                  borderRadius: 'var(--radius-lg)', 
                  padding: 'var(--space-3)' 
                }}>
                  <h4 style={{ fontSize: 'var(--body-md)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>
                    Erros Encontrados:
                  </h4>
                  <table style={{ width: '100%', fontSize: 'var(--label-sm)' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', paddingBottom: 'var(--space-1)' }}>Linha</th>
                        <th style={{ textAlign: 'left', paddingBottom: 'var(--space-1)' }}>Erros</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importReport.failed.map(f => (
                        <tr key={f.line}>
                          <td style={{ paddingBottom: 'var(--space-1)', fontWeight: 'var(--font-semibold)' }}>{f.line}</td>
                          <td style={{ paddingBottom: 'var(--space-1)', color: 'var(--error)' }}>
                            {f.errors.join(', ')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================
// COMPONENTES AUXILIARES
// ============================================================
function TabButton({ active, onClick, icon, label }: { 
  active: boolean; 
  onClick: () => void; 
  icon: string; 
  label: string 
}) {
  return (
    <button
      onClick={onClick}
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 'var(--space-1)', 
        padding: 'var(--space-2) var(--space-3)', 
        background: active ? 'var(--primary-container)' : 'transparent', 
        color: active ? 'var(--on-primary-container)' : 'var(--on-surface-variant)', 
        border: 'none', 
        borderRadius: 'var(--radius-lg)', 
        cursor: 'pointer', 
        fontSize: 'var(--body-md)', 
        fontWeight: active ? 'var(--font-semibold)' : 'var(--font-medium)', 
        fontFamily: 'var(--font-family)',
        transition: 'all 0.2s ease'
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{icon}</span>
      {label}
    </button>
  )
}

function StatCard({ icon, label, count, color, bg, onClick }: { 
  icon: string; 
  label: string; 
  count: number; 
  color: string; 
  bg: string; 
  onClick: () => void 
}) {
  return (
    <div 
      onClick={onClick} 
      style={{ 
        padding: 'var(--space-3)', 
        background: bg, 
        borderRadius: 'var(--radius-lg)', 
        border: `1px solid ${color}`, 
        cursor: 'pointer', 
        transition: 'all 0.2s ease', 
        display: 'flex', 
        alignItems: 'center', 
        gap: 'var(--space-3)',
        flex: 1
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '32px', color }}>{icon}</span>
      <div>
        <p style={{ fontSize: 'var(--headline-lg)', fontWeight: 'var(--font-bold)', color, margin: 0, lineHeight: 1 }}>{count}</p>
        <p style={{ fontSize: 'var(--label-sm)', color, margin: '4px 0 0', opacity: 0.8 }}>{label}</p>
      </div>
    </div>
  )
}

function Alert({ type, children }: { type: 'error' | 'success'; children: React.ReactNode }) {
  return (
    <div style={{ 
      padding: 'var(--space-2) var(--space-3)', 
      marginBottom: 'var(--space-4)', 
      borderRadius: 'var(--radius-lg)', 
      background: type === 'error' ? 'var(--error-container)' : 'var(--primary-container)', 
      color: type === 'error' ? 'var(--on-error-container)' : 'var(--on-primary-container)', 
      fontSize: 'var(--body-md)',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-1)'
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
        {type === 'error' ? 'error' : 'check_circle'}
      </span>
      {children}
    </div>
  )
}

function FormField({ label, value, onChange, type = 'text', placeholder, required }: {
  label: string; 
  value: string; 
  onChange: (v: string) => void; 
  type?: string; 
  placeholder?: string; 
  required?: boolean
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
      <label style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-medium)', color: 'var(--on-surface-variant)' }}>
        {label}
      </label>
      <input 
        type={type} 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        placeholder={placeholder} 
        required={required} 
        style={{ 
          padding: '10px 14px', 
          background: 'var(--surface-container-lowest)', 
          border: '1px solid var(--outline-variant)', 
          borderRadius: 'var(--radius-lg)', 
          fontSize: 'var(--body-md)', 
          fontFamily: 'var(--font-family)', 
          color: 'var(--on-surface)', 
          outline: 'none' 
        }} 
      />
    </div>
  )
}

function FormSelect({ label, value, onChange, options, required, disabled, placeholder }: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  required?: boolean
  disabled?: boolean
  placeholder?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
      <label style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-medium)', color: 'var(--on-surface-variant)' }}>
        {label}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        style={{
          padding: '10px 14px',
          background: 'var(--surface-container-lowest)',
          border: '1px solid var(--outline-variant)',
          borderRadius: 'var(--radius-lg)',
          fontSize: 'var(--body-md)',
          fontFamily: 'var(--font-family)',
          color: 'var(--on-surface)',
          outline: 'none',
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer'
        }}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}