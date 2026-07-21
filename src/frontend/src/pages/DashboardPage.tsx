// import { useState } from 'react'
// import { useAuth } from '../context/AuthContext'
// import '../styles/global.css'

// interface ProtocolRow {
//   id: string
//   title: string
//   responsible: string
//   deadline: string
//   status: 'review' | 'approved' | 'scheduled' | 'pending'
// }

// const MOCK_DATA: ProtocolRow[] = [
//   {
//     id: 'PR-2023-0045',
//     title: 'Estudo de Impacto Sanitário - Beira',
//     responsible: 'Dra. Helena Sitoe',
//     deadline: '12 Out, 2023',
//     status: 'review'
//   },
//   {
//     id: 'PR-2023-0089',
//     title: 'Análise de Malária Transmissional',
//     responsible: 'Msc. Arnaldo Tembe',
//     deadline: '18 Out, 2023',
//     status: 'approved'
//   },
//   {
//     id: 'DEF-001',
//     title: 'Defesa de Tese: Dr. Amilcar',
//     responsible: 'Dep. Graduação',
//     deadline: 'Amanhã, 10:00',
//     status: 'scheduled'
//   },
//   {
//     id: 'PR-2023-0102',
//     title: 'Inquérito Nutricional - Maputo',
//     responsible: 'Dr. Samuel L.',
//     deadline: '05 Out, 2023',
//     status: 'pending'
//   }
// ]

// const STATUS_STYLES = {
//   review: {
//     bg: 'var(--tertiary-fixed)',
//     color: 'var(--on-tertiary-fixed)',
//     dot: 'var(--tertiary)',
//     label: 'Em Revisão'
//   },
//   approved: {
//     bg: 'rgba(0, 105, 51, 0.1)',
//     color: 'var(--primary)',
//     dot: 'var(--primary)',
//     label: 'Aprovado'
//   },
//   scheduled: {
//     bg: 'var(--surface-container-highest)',
//     color: 'var(--on-surface-variant)',
//     dot: 'var(--outline)',
//     label: 'Agendado'
//   },
//   pending: {
//     bg: 'var(--error-container)',
//     color: 'var(--on-error-container)',
//     dot: 'var(--error)',
//     label: 'Pendente'
//   }
// }

// export function DashboardPage() {
//   const { user } = useAuth()

//   return (
//     <div style={{ paddingTop: 'var(--space-4)' }}>
//       {/* Boas-vindas */}
//       <div style={{
//         display: 'flex',
//         justifyContent: 'space-between',
//         alignItems: 'flex-end',
//         marginBottom: 'var(--space-4)',
//         flexWrap: 'wrap',
//         gap: 'var(--space-2)'
//       }}>
//         <div>
//           <h3 style={{
//             fontSize: 'var(--headline-lg)',
//             fontWeight: 'var(--font-semibold)',
//             color: 'var(--on-surface)',
//             marginBottom: 'var(--space-1)'
//           }}>
//             Bem-vindo, {user?.name || 'Utilizador'}
//           </h3>
//           <p style={{
//             fontSize: 'var(--body-lg)',
//             color: 'var(--on-surface-variant)'
//           }}>
//             Visão geral da produção científica e prazos académicos para hoje.
//           </p>
//         </div>
//         <button
//           className="btn btn-primary"
//           style={{
//             display: 'flex',
//             alignItems: 'center',
//             gap: 'var(--space-1)',
//             padding: '10px var(--space-3)',
//             fontSize: 'var(--body-md)',
//             fontWeight: 'var(--font-semibold)',
//             borderRadius: 'var(--radius-lg)',
//             boxShadow: 'var(--elevation-1)'
//           }}
//           onMouseEnter={e => {
//             e.currentTarget.style.opacity = '0.9'
//             e.currentTarget.style.transform = 'scale(0.95)'
//           }}
//           onMouseLeave={e => {
//             e.currentTarget.style.opacity = '1'
//             e.currentTarget.style.transform = 'scale(1)'
//           }}
//         >
//           <span className="material-symbols-outlined">add</span>
//           Novo Protocolo
//         </button>
//       </div>

//       {/* Cards de resumo */}
//       <div style={{
//         display: 'grid',
//         gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
//         gap: 'var(--gutter)',
//         marginBottom: 'var(--space-5)'
//       }}>
//         <SummaryCard
//           icon="assignment"
//           iconBg="rgba(0, 105, 51, 0.1)"
//           iconColor="var(--primary)"
//           label="Protocolos Submetidos"
//           value="42"
//           badge="+12%"
//           badgeColor="var(--primary)"
//           footer="Último há 2 horas"
//           footerIcon="history"
//           borderHover="var(--primary)"
//         />
//         <SummaryCard
//           icon="pending_actions"
//           iconBg="rgba(183, 21, 11, 0.1)"
//           iconColor="var(--secondary)"
//           label="Revisões Pendentes"
//           value="08"
//           badge="Crítico"
//           badgeColor="var(--secondary)"
//           footer="3 vencem em 48h"
//           footerIcon="warning"
//           footerIconColor="var(--secondary)"
//           borderHover="var(--secondary)"
//         />
//         <SummaryCard
//           icon="groups"
//           iconBg="var(--surface-container)"
//           iconColor="var(--on-surface-variant)"
//           label="Meus Tutorandos"
//           value="15"
//           footer="5 em fase de tese"
//           footerIcon="trending_up"
//           borderHover="var(--primary)"
//         />
//         <SummaryCard
//           icon="event_available"
//           iconBg="rgba(115, 92, 0, 0.1)"
//           iconColor="var(--tertiary)"
//           label="Defesas Agendadas"
//           value="04"
//           badge="Ativo"
//           badgeColor="var(--tertiary)"
//           footer="Próxima: 15/10/2023"
//           footerIcon="calendar_month"
//           borderHover="var(--tertiary)"
//         />
//       </div>

//       {/* Grid principal: Tabela + Cards laterais */}
//       <div style={{
//         display: 'grid',
//         gridTemplateColumns: '2fr 1fr',
//         gap: 'var(--gutter)',
//         alignItems: 'start'
//       }}>
//         {/* Tabela de atividades */}
//         <div style={{
//           background: 'var(--surface-container-lowest)',
//           borderRadius: 'var(--radius-xl)',
//           border: '1px solid var(--outline-variant)',
//           overflow: 'hidden'
//         }}>
//           <div style={{
//             padding: 'var(--space-3)',
//             borderBottom: '1px solid var(--surface-variant)',
//             display: 'flex',
//             justifyContent: 'space-between',
//             alignItems: 'center'
//           }}>
//             <h5 style={{
//               fontSize: 'var(--title-md)',
//               fontWeight: 'var(--font-semibold)',
//               color: 'var(--on-surface)'
//             }}>
//               Cronograma & Atividades Recentes
//             </h5>
//             <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
//               <IconButton icon="filter_list" />
//               <IconButton icon="more_vert" />
//             </div>
//           </div>

//           <table style={{
//             width: '100%',
//             borderCollapse: 'collapse',
//             fontSize: 'var(--body-md)'
//           }}>
//             <thead>
//               <tr style={{
//                 background: 'var(--surface-container-low)',
//                 color: 'var(--on-surface-variant)',
//                 fontSize: 'var(--label-md)',
//                 textTransform: 'uppercase',
//                 letterSpacing: '0.05em',
//                 fontWeight: 'var(--font-semibold)'
//               }}>
//                 <th style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'left' }}>Protocolo / Evento</th>
//                 <th style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'left' }}>Responsável</th>
//                 <th style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'left' }}>Data Limite</th>
//                 <th style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'left' }}>Estado</th>
//                 <th style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'right' }}>Ação</th>
//               </tr>
//             </thead>
//             <tbody>
//               {MOCK_DATA.map((row, i) => {
//                 const statusStyle = STATUS_STYLES[row.status]
//                 return (
//                   <tr
//                     key={row.id}
//                     style={{
//                       borderBottom: '1px solid var(--surface-variant)',
//                       background: i % 2 === 1 ? 'rgba(238, 238, 240, 0.3)' : 'transparent',
//                       transition: 'background 0.2s'
//                     }}
//                     onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
//                     onMouseLeave={e => e.currentTarget.style.background = i % 2 === 1 ? 'rgba(238, 238, 240, 0.3)' : 'transparent'}
//                   >
//                     <td style={{ padding: 'var(--space-2) var(--space-3)' }}>
//                       <p style={{ fontWeight: 'var(--font-bold)', fontSize: 'var(--body-md)' }}>{row.title}</p>
//                       <p style={{ fontSize: 'var(--label-md)', color: 'var(--on-surface-variant)' }}>#{row.id}</p>
//                     </td>
//                     <td style={{ padding: 'var(--space-2) var(--space-3)' }}>{row.responsible}</td>
//                     <td style={{
//                       padding: 'var(--space-2) var(--space-3)',
//                       color: row.status === 'scheduled' ? 'var(--secondary)' : 'inherit',
//                       fontWeight: row.status === 'scheduled' ? 'var(--font-bold)' : 'var(--font-regular)'
//                     }}>
//                       {row.deadline}
//                     </td>
//                     <td style={{ padding: 'var(--space-2) var(--space-3)' }}>
//                       <span style={{
//                         display: 'inline-flex',
//                         alignItems: 'center',
//                         gap: '6px',
//                         padding: '2px 10px',
//                         borderRadius: 'var(--radius-full)',
//                         fontSize: 'var(--label-md)',
//                         fontWeight: 'var(--font-medium)',
//                         background: statusStyle.bg,
//                         color: statusStyle.color
//                       }}>
//                         <span style={{
//                           width: '6px',
//                           height: '6px',
//                           borderRadius: 'var(--radius-full)',
//                           background: statusStyle.dot
//                         }} />
//                         {statusStyle.label}
//                       </span>
//                     </td>
//                     <td style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'right' }}>
//                       <button style={{
//                         background: 'none',
//                         border: 'none',
//                         color: 'var(--primary)',
//                         fontWeight: 'var(--font-semibold)',
//                         fontSize: 'var(--body-md)',
//                         cursor: 'pointer'
//                       }}>
//                         {row.status === 'pending' ? 'Cobrar' : row.status === 'review' ? 'Analisar' : row.status === 'scheduled' ? 'Calendário' : 'Ver'}
//                       </button>
//                     </td>
//                   </tr>
//                 )
//               })}
//             </tbody>
//           </table>

//           <div style={{
//             padding: 'var(--space-2) var(--space-3)',
//             background: 'var(--surface-container-lowest)',
//             textAlign: 'center'
//           }}>
//             <button style={{
//               background: 'none',
//               border: 'none',
//               color: 'var(--primary)',
//               fontWeight: 'var(--font-bold)',
//               fontSize: 'var(--body-md)',
//               cursor: 'pointer'
//             }}>
//               Ver Todas as Atividades
//             </button>
//           </div>
//         </div>

//         {/* Cards laterais */}
//         <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gutter)' }}>
//           {/* Banner Académico */}
//           <div style={{
//             background: 'var(--primary)',
//             borderRadius: 'var(--radius-xl)',
//             padding: 'var(--space-3)',
//             color: 'var(--on-primary)',
//             position: 'relative',
//             overflow: 'hidden',
//             height: '192px',
//             display: 'flex',
//             flexDirection: 'column',
//             justifyContent: 'flex-end'
//           }}>
//             <div style={{
//               position: 'absolute',
//               top: 0,
//               right: 0,
//               width: '128px',
//               height: '128px',
//               background: 'rgba(255,255,255,0.1)',
//               borderRadius: '50%',
//               marginRight: '-64px',
//               marginTop: '-64px',
//               filter: 'blur(24px)'
//             }} />
//             <h6 style={{ fontSize: 'var(--title-md)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-1)' }}>
//               Excelência Académica
//             </h6>
//             <p style={{ fontSize: 'var(--body-md)', opacity: 0.8, marginBottom: 'var(--space-2)' }}>
//               Aceda à biblioteca digital da ISCISA para fundamentação técnica dos seus pareceres científicos.
//             </p>
//             <button style={{
//               background: 'var(--on-primary)',
//               color: 'var(--primary)',
//               border: 'none',
//               padding: '8px var(--space-2)',
//               borderRadius: 'var(--radius-lg)',
//               fontSize: 'var(--label-md)',
//               fontWeight: 'var(--font-bold)',
//               textTransform: 'uppercase',
//               letterSpacing: '0.1em',
//               cursor: 'pointer',
//               width: 'fit-content'
//             }}>
//               Aceder Repositório
//             </button>
//           </div>

//           {/* Comunicações */}
//           <div style={{
//             background: 'var(--surface-container-lowest)',
//             borderRadius: 'var(--radius-xl)',
//             border: '1px solid var(--outline-variant)',
//             padding: 'var(--space-3)'
//           }}>
//             <h5 style={{
//               fontSize: 'var(--title-md)',
//               fontWeight: 'var(--font-semibold)',
//               color: 'var(--on-surface)',
//               marginBottom: 'var(--space-2)'
//             }}>
//               Comunicações
//             </h5>
//             <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
//               {[
//                 { initials: 'HS', name: 'Dra. Helena Sitoe', time: '10:45', msg: '"Enviei os anexos em falta para o protocolo #PR-0045..."', bg: 'var(--secondary-fixed)', color: 'var(--secondary)' },
//                 { initials: 'AT', name: 'Arnaldo Tembe', time: 'Ontem', msg: '"Gostaria de agendar uma reunião de tutoria para sexta-feira..."', bg: 'var(--primary-fixed)', color: 'var(--primary)' },
//                 { initials: 'S', name: 'Sistema', time: '2 dias', msg: '"O relatório mensal de produção científica já está disponível."', bg: 'var(--surface-container-highest)', color: 'var(--on-surface-variant)' }
//               ].map((comm, i) => (
//                 <div key={i} style={{ display: 'flex', gap: 'var(--space-2)' }}>
//                   <div style={{
//                     width: '40px',
//                     height: '40px',
//                     borderRadius: 'var(--radius-full)',
//                     background: comm.bg,
//                     color: comm.color,
//                     display: 'flex',
//                     alignItems: 'center',
//                     justifyContent: 'center',
//                     fontWeight: 'var(--font-bold)',
//                     flexShrink: 0,
//                     fontSize: 'var(--body-md)'
//                   }}>
//                     {comm.initials}
//                   </div>
//                   <div style={{ flex: 1, minWidth: 0 }}>
//                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
//                       <p style={{ fontSize: 'var(--body-md)', fontWeight: 'var(--font-bold)' }}>{comm.name}</p>
//                       <span style={{ fontSize: '10px', color: 'var(--on-surface-variant)' }}>{comm.time}</span>
//                     </div>
//                     <p style={{
//                       fontSize: 'var(--label-md)',
//                       color: 'var(--on-surface-variant)',
//                       fontStyle: 'italic',
//                       overflow: 'hidden',
//                       textOverflow: 'ellipsis',
//                       whiteSpace: 'nowrap'
//                     }}>
//                       {comm.msg}
//                     </p>
//                   </div>
//                 </div>
//               ))}
//             </div>
//             <button style={{
//               width: '100%',
//               marginTop: 'var(--space-3)',
//               padding: 'var(--space-1)',
//               border: '1px solid var(--outline-variant)',
//               borderRadius: 'var(--radius-lg)',
//               background: 'transparent',
//               fontSize: 'var(--body-md)',
//               fontWeight: 'var(--font-bold)',
//               color: 'var(--on-surface-variant)',
//               cursor: 'pointer',
//               transition: 'background 0.2s'
//             }}
//             onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-container)'}
//             onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
//             >
//               Ver Todas
//             </button>
//           </div>

//           {/* Desempenho */}
//           <div style={{
//             background: 'var(--surface-container-lowest)',
//             borderRadius: 'var(--radius-xl)',
//             border: '1px solid var(--outline-variant)',
//             padding: 'var(--space-3)'
//           }}>
//             <h5 style={{
//               fontSize: 'var(--title-md)',
//               fontWeight: 'var(--font-semibold)',
//               color: 'var(--on-surface)',
//               marginBottom: 'var(--space-1)'
//             }}>
//               Desempenho da Unidade
//             </h5>
//             <p style={{
//               fontSize: 'var(--label-md)',
//               color: 'var(--on-surface-variant)',
//               marginBottom: 'var(--space-2)'
//             }}>
//               Taxa de aprovação vs. Submissões mensais
//             </p>
//             <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '96px', gap: 'var(--space-1)', padding: '0 var(--space-1)' }}>
//               {[65, 80, 40, 90, 55].map((h, i) => (
//                 <div key={i} style={{ flex: 1, background: 'var(--surface-container)', borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0', position: 'relative', height: '100%' }}>
//                   <div style={{
//                     position: 'absolute',
//                     bottom: 0,
//                     width: '100%',
//                     background: 'var(--primary)',
//                     borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
//                     height: `${h}%`,
//                     opacity: 0.4
//                   }} />
//                   <div style={{
//                     position: 'absolute',
//                     bottom: 0,
//                     width: '100%',
//                     background: 'var(--primary)',
//                     borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
//                     height: `${h * 0.75}%`
//                   }} />
//                 </div>
//               ))}
//             </div>
//             <div style={{
//               display: 'flex',
//               justifyContent: 'space-between',
//               marginTop: 'var(--space-1)',
//               padding: '0 var(--space-1)'
//             }}>
//               {['MAI', 'JUN', 'JUL', 'AGO', 'SET'].map(m => (
//                 <span key={m} style={{ fontSize: '10px', color: 'var(--on-surface-variant)', fontWeight: 'var(--font-medium)' }}>
//                   {m}
//                 </span>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

// // Componentes auxiliares
// function SummaryCard({ icon, iconBg, iconColor, label, value, badge, badgeColor, footer, footerIcon, footerIconColor, borderHover }: any) {
//   const [hover, setHover] = useState(false)
  
//   return (
//     <div
//       style={{
//         background: 'var(--surface-container-lowest)',
//         padding: 'var(--space-3)',
//         borderRadius: 'var(--radius-xl)',
//         border: `1px solid ${hover ? borderHover : 'var(--outline-variant)'}`,
//         display: 'flex',
//         flexDirection: 'column',
//         justifyContent: 'space-between',
//         transition: 'border-color 0.2s',
//         cursor: 'pointer'
//       }}
//       onMouseEnter={() => setHover(true)}
//       onMouseLeave={() => setHover(false)}
//     >
//       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
//         <div style={{
//           padding: 'var(--space-1)',
//           background: iconBg,
//           borderRadius: 'var(--radius-lg)',
//           color: iconColor,
//           display: 'flex'
//         }}>
//           <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>{icon}</span>
//         </div>
//         {badge && (
//           <span style={{
//             fontSize: 'var(--label-md)',
//             fontWeight: 'var(--font-bold)',
//             color: badgeColor,
//             padding: '2px 8px',
//             background: `${badgeColor}0D`,
//             borderRadius: 'var(--radius-sm)'
//           }}>
//             {badge}
//           </span>
//         )}
//       </div>
//       <div>
//         <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)', fontWeight: 'var(--font-medium)' }}>
//           {label}
//         </p>
//         <h4 style={{ fontSize: '30px', fontWeight: 'var(--font-bold)', color: 'var(--on-surface)', marginTop: '4px' }}>
//           {value}
//         </h4>
//       </div>
//       <div style={{
//         marginTop: 'var(--space-2)',
//         paddingTop: 'var(--space-2)',
//         borderTop: '1px solid var(--surface-container)',
//         display: 'flex',
//         alignItems: 'center',
//         fontSize: 'var(--label-md)',
//         color: 'var(--on-surface-variant)'
//       }}>
//         <span className="material-symbols-outlined" style={{ fontSize: '14px', marginRight: '4px', color: footerIconColor }}>
//           {footerIcon}
//         </span>
//         {footer}
//       </div>
//     </div>
//   )
// }

// function IconButton({ icon }: { icon: string }) {
//   return (
//     <button style={{
//       padding: 'var(--space-1)',
//       borderRadius: 'var(--radius-md)',
//       border: 'none',
//       background: 'transparent',
//       color: 'var(--on-surface-variant)',
//       cursor: 'pointer',
//       display: 'flex',
//       transition: 'background 0.2s'
//     }}
//     onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-container)'}
//     onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
//     >
//       <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{icon}</span>
//     </button>
//   )
// }