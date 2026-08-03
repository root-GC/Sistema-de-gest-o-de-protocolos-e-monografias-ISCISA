import { useEffect, useMemo, useState } from 'react';
import { agendaService } from '../../services/agendaService';
import type { AgendaEvent } from '../../types/agenda';
import { getTypeMeta } from '../../types/agenda';
import '../../styles/global.css';

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const WEEK_PT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

type ViewMode = 'mes' | 'semana' | 'agenda';

function isoOf(d: Date) {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function buildMonthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const shift = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - shift);
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    cells.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }
  return cells;
}

export default function AgendaPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [view, setView] = useState<ViewMode>('mes');
  const [selected, setSelected] = useState<Date>(today);
  const [filter, setFilter] = useState<string>('todos');

  const filtered = useMemo(
    () => (filter === 'todos' ? events : events.filter(e => e.type === filter)),
    [events, filter],
  );

  const byDay = useMemo(() => {
    const map = new Map<string, AgendaEvent[]>();
    for (const e of filtered) {
      const arr = map.get(e.date) ?? [];
      arr.push(e);
      map.set(e.date, arr);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => (a.start ?? '').localeCompare(b.start ?? ''));
    }
    return map;
  }, [filtered]);

  const selectedEvents = byDay.get(isoOf(selected)) ?? [];

  const proximos = useMemo(() => {
    return filtered
      .filter(e => e.date >= isoOf(today))
      .sort((a, b) =>
        a.date.localeCompare(b.date) || (a.start ?? '').localeCompare(b.start ?? ''),
      )
      .slice(0, 6);
  }, [filtered]);

  const kpis = useMemo(() => {
    const inMonth = filtered.filter(e => {
      const [y, m] = e.date.split('-').map(Number);
      return y === cursor.getFullYear() && m - 1 === cursor.getMonth();
    });
    return {
      total: inMonth.length,
      deliberations: inMonth.filter(e => e.type === 'deliberation').length,
      defenses: inMonth.filter(e => e.type === 'defense').length,
      meetings: inMonth.filter(e => e.type === 'meeting' || e.type === 'review').length,
    };
  }, [filtered, cursor]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const data = await agendaService.loadEvents();
      setEvents(data);
    } catch (err) {
      setError('Erro ao carregar eventos');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '60vh', flexDirection: 'column', gap: 'var(--space-3)',
        color: 'var(--on-surface-variant)', fontFamily: 'var(--font-family)',
      }}>
        <span style={{
          width: '32px', height: '32px',
          border: '3px solid var(--outline-variant)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          display: 'inline-block',
        }} />
        <span style={{ fontSize: 'var(--body-md)' }}>A carregar agenda...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      fontFamily: 'var(--font-family)',
      color: 'var(--on-background)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-end', flexWrap: 'wrap', gap: 'var(--space-2)',
        marginBottom: 'var(--space-4)',
      }}>
        <div>
          <h1 style={{
            fontSize: 'var(--headline-lg)', fontWeight: 'var(--font-semibold)',
            color: 'var(--on-surface)', margin: 0,
          }}>
            Agenda
          </h1>
          <p style={{
            fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)',
            margin: 'var(--space-1) 0 0 0',
          }}>
            Vista global de reuniões, deliberações e defesas.
          </p>
        </div>
      </div>

      {error && (
        <div role="alert" style={{
          padding: 'var(--space-2) var(--space-3)',
          background: 'var(--error-container)',
          color: 'var(--on-error-container)',
          borderRadius: 'var(--radius-md)',
          display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
          marginBottom: 'var(--space-3)',
          fontSize: 'var(--body-md)',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>error</span>
          {error}
        </div>
      )}

      {/* KPIs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 'var(--space-3)',
        marginBottom: 'var(--space-4)',
      }}>
        {[
          { label: 'Total no mês', value: kpis.total, hint: MONTHS_PT[cursor.getMonth()], color: 'var(--on-surface)' },
          { label: 'Deliberações', value: kpis.deliberations, hint: 'Reuniões agendadas', color: 'var(--secondary)' },
          { label: 'Defesas', value: kpis.defenses, hint: 'Defesas de monografia', color: '#7C4DFF' },
          { label: 'Reuniões', value: kpis.meetings, hint: 'Sessões e revisões', color: 'var(--primary)' },
        ].map(kpi => (
          <div key={kpi.label} className="card" style={{
            padding: 'var(--space-3)',
            borderLeft: `4px solid ${kpi.color}`,
          }}>
            <div style={{
              fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)',
              marginBottom: 'var(--space-1)',
            }}>
              {kpi.label}
            </div>
            <div style={{
              fontSize: 'var(--headline-xl)', fontWeight: 'var(--font-bold)',
              color: kpi.color, fontVariantNumeric: 'tabular-nums',
              lineHeight: 1,
            }}>
              {kpi.value}
            </div>
            <div style={{
              fontSize: 'var(--label-md)', color: 'var(--on-surface-variant)',
              marginTop: 'var(--space-1)',
            }}>
              {kpi.hint}
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)',
        alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 'var(--space-4)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
        }}>
          <div className="btn-group" style={{ display: 'flex', gap: '1px' }}>
            <button
              className="btn btn-sm"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
              aria-label="Mês anterior"
              style={{ borderRight: 'none', borderRadius: 'var(--radius-md) 0 0 var(--radius-md)' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_left</span>
            </button>
            <button
              className="btn btn-sm"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
              aria-label="Próximo mês"
              style={{ borderRadius: '0 var(--radius-md) var(--radius-md) 0' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_right</span>
            </button>
          </div>

          <button
            className="btn btn-sm"
            onClick={() => {
              setCursor(new Date(today.getFullYear(), today.getMonth(), 1));
              setSelected(today);
            }}
          >
            Hoje
          </button>

          <span style={{
            fontSize: 'var(--title-md)', fontWeight: 'var(--font-semibold)',
            color: 'var(--on-surface)', marginLeft: 'var(--space-1)',
          }}>
            {MONTHS_PT[cursor.getMonth()]} {cursor.getFullYear()}
          </span>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
        }}>
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="btn btn-sm"
            style={{
              border: '1px solid var(--outline-variant)',
              background: 'var(--surface)',
              color: 'var(--on-surface)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--body-md)',
              fontFamily: 'var(--font-family)',
            }}
          >
            <option value="todos">Todos os tipos</option>
            <option value="deliberation">Deliberações</option>
            <option value="defense">Defesas</option>
            <option value="meeting">Reuniões</option>
            <option value="review">Revisões</option>
            <option value="deadline">Prazos</option>
          </select>

          <div className="btn-group" style={{ display: 'flex', gap: '1px' }}>
            {(['mes', 'semana', 'agenda'] as ViewMode[]).map(m => (
              <button
                key={m}
                className={`btn btn-sm${view === m ? ' btn-primary' : ''}`}
                onClick={() => setView(m)}
                style={{
                  borderRadius: m === 'mes' ? 'var(--radius-md) 0 0 var(--radius-md)' :
                    m === 'agenda' ? '0 var(--radius-md) var(--radius-md) 0' : '0',
                  borderRight: m !== 'agenda' ? 'none' : undefined,
                }}
              >
                {m === 'mes' ? 'Mês' : m === 'semana' ? 'Semana' : 'Agenda'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div style={{
        display: 'grid',
        gap: 'var(--space-4)',
        gridTemplateColumns: view === 'agenda' ? '1fr' : 'minmax(0, 1fr) 360px',
        alignItems: 'start',
      }}>
        <div>
          {view === 'mes' && (
            <MonthView
              cursor={cursor}
              byDay={byDay}
              selected={selected}
              onSelect={setSelected}
            />
          )}
          {view === 'semana' && (
            <WeekView selected={selected} byDay={byDay} onSelect={setSelected} />
          )}
          {view === 'agenda' && (
            <AgendaView events={filtered} today={today} />
          )}
        </div>

        {view !== 'agenda' && (
          <aside style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {/* Selected day details */}
            <div className="card" style={{ padding: 'var(--space-3)' }}>
              <div style={{
                fontSize: 'var(--title-md)', fontWeight: 'var(--font-semibold)',
                color: 'var(--on-surface)', marginBottom: 'var(--space-1)',
              }}>
                {selected.getDate()} de {MONTHS_PT[selected.getMonth()]}
              </div>
              <div style={{
                fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)',
                marginBottom: 'var(--space-3)',
              }}>
                {selectedEvents.length === 0
                  ? 'Sem eventos neste dia'
                  : `${selectedEvents.length} evento${selectedEvents.length > 1 ? 's' : ''}`}
              </div>

              {selectedEvents.length === 0 ? (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: 'var(--space-2)', padding: 'var(--space-4) 0',
                  textAlign: 'center', color: 'var(--on-surface-variant)',
                  fontSize: 'var(--body-md)',
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '40px', opacity: 0.4 }}>
                    calendar_month
                  </span>
                  <span>Selecciona outro dia.</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {selectedEvents.map(e => (
                    <EventRow key={e.id} event={e} />
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming */}
            <div className="card" style={{ padding: 'var(--space-3)' }}>
              <div style={{
                fontSize: 'var(--title-md)', fontWeight: 'var(--font-semibold)',
                color: 'var(--on-surface)', marginBottom: 'var(--space-1)',
              }}>
                Próximos eventos
              </div>
              <div style={{
                fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)',
                marginBottom: 'var(--space-3)',
              }}>
                Nos próximos dias
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {proximos.length === 0 ? (
                  <div style={{
                    textAlign: 'center', padding: 'var(--space-3)',
                    color: 'var(--on-surface-variant)', fontSize: 'var(--body-md)',
                  }}>
                    Sem próximos eventos
                  </div>
                ) : (
                  proximos.map(e => (
                    <UpcomingRow key={e.id} event={e} />
                  ))
                )}
              </div>
            </div>

            {/* Legend */}
            <div className="card" style={{ padding: 'var(--space-3)' }}>
              <div style={{
                fontSize: 'var(--title-md)', fontWeight: 'var(--font-semibold)',
                color: 'var(--on-surface)', marginBottom: 'var(--space-2)',
              }}>
                Legenda
              </div>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)',
                fontSize: 'var(--body-md)',
              }}>
                {(['deliberation', 'defense', 'meeting', 'review', 'deadline'] as const).map(t => {
                  const meta = getTypeMeta(t);
                  return (
                    <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                      <span style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: meta.color, display: 'inline-block',
                      }} />
                      <span style={{ color: 'var(--on-surface-variant)' }}>{meta.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

function MonthView({
  cursor,
  byDay,
  selected,
  onSelect,
}: {
  cursor: Date;
  byDay: Map<string, AgendaEvent[]>;
  selected: Date;
  onSelect: (d: Date) => void;
}) {
  const cells = buildMonthGrid(cursor.getFullYear(), cursor.getMonth());
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
        borderBottom: '1px solid var(--surface-variant)',
        background: 'var(--surface-container-low)',
      }}>
        {WEEK_PT.map(d => (
          <div key={d} style={{
            padding: '8px', textAlign: 'center',
            fontSize: 'var(--label-md)', fontWeight: 'var(--font-semibold)',
            color: 'var(--on-surface-variant)',
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            {d}
          </div>
        ))}
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
      }}>
        {cells.map((d, i) => {
          const inMonth = d.getMonth() === cursor.getMonth();
          const isToday = sameDay(d, today);
          const isSel = sameDay(d, selected);
          const events = byDay.get(isoOf(d)) ?? [];

          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(d)}
              style={{
                minHeight: '90px',
                border: 'none',
                borderRight: (i + 1) % 7 === 0 ? 'none' : '1px solid var(--surface-variant)',
                borderBottom: i >= 35 ? 'none' : '1px solid var(--surface-variant)',
                background: isSel
                  ? 'var(--primary-container)'
                  : isToday && !isSel
                    ? 'var(--surface-container-high)'
                    : !inMonth
                      ? 'var(--surface-container-low)'
                      : 'transparent',
                cursor: inMonth ? 'pointer' : 'default',
                textAlign: 'left',
                padding: '6px',
                opacity: inMonth ? 1 : 0.35,
                transition: 'background 0.15s',
                fontFamily: 'var(--font-family)',
              }}
              onMouseEnter={e => {
                if (inMonth && !isSel) e.currentTarget.style.background = 'var(--surface-container-high)';
              }}
              onMouseLeave={e => {
                if (inMonth && !isSel) {
                  e.currentTarget.style.background = isToday ? 'var(--surface-container-high)' : 'transparent';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{
                  display: 'inline-flex', width: '24px', height: '24px',
                  alignItems: 'center', justifyContent: 'center',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--label-md)',
                  background: isToday ? 'var(--primary)' : 'transparent',
                  color: isToday ? 'var(--on-primary)' : isSel ? 'var(--on-primary-container)' : 'var(--on-surface)',
                  fontWeight: isToday || isSel ? 'var(--font-bold)' : 'var(--font-regular)',
                }}>
                  {d.getDate()}
                </span>
                {events.length > 0 && (
                  <span style={{
                    fontSize: '10px', color: 'var(--on-surface-variant)',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {events.length}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                {events.slice(0, 3).map(e => {
                  const meta = getTypeMeta(e.type);
                  return (
                    <div key={e.id} style={{
                      display: 'flex', alignItems: 'center', gap: '3px',
                      fontSize: '10px', lineHeight: 1.2,
                      color: meta.color, overflow: 'hidden',
                      whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                    }}>
                      <span style={{
                        width: '4px', height: '4px', borderRadius: '50%',
                        background: meta.color, flexShrink: 0,
                      }} />
                      {e.start && (
                        <span style={{ fontVariantNumeric: 'tabular-nums', opacity: 0.7 }}>
                          {e.start}
                        </span>
                      )}
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.title}</span>
                    </div>
                  );
                })}
                {events.length > 3 && (
                  <span style={{ fontSize: '9px', color: 'var(--on-surface-variant)' }}>
                    +{events.length - 3} mais
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({
  selected,
  byDay,
  onSelect,
}: {
  selected: Date;
  byDay: Map<string, AgendaEvent[]>;
  onSelect: (d: Date) => void;
}) {
  const dow = (selected.getDay() + 6) % 7;
  const monday = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate() - dow);
  const days = Array.from(
    { length: 7 },
    (_, i) => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i),
  );
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
        borderBottom: '1px solid var(--surface-variant)',
        background: 'var(--surface-container-low)',
      }}>
        {days.map(d => {
          const isToday = sameDay(d, today);
          const isSel = sameDay(d, selected);
          return (
            <button
              key={d.toISOString()}
              type="button"
              onClick={() => onSelect(d)}
              style={{
                border: 'none', borderRight: '1px solid var(--surface-variant)',
                background: isSel ? 'var(--primary-container)' : 'transparent',
                cursor: 'pointer', padding: '12px 8px',
                textAlign: 'center', fontFamily: 'var(--font-family)',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'var(--surface-container-high)'; }}
              onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{
                fontSize: '10px', textTransform: 'uppercase',
                color: 'var(--on-surface-variant)', letterSpacing: '0.05em',
                marginBottom: '4px',
              }}>
                {WEEK_PT[(d.getDay() + 6) % 7]}
              </div>
              <span style={{
                display: 'inline-flex', width: '32px', height: '32px',
                alignItems: 'center', justifyContent: 'center',
                borderRadius: 'var(--radius-full)',
                fontSize: 'var(--body-md)', fontWeight: isToday ? 'var(--font-bold)' : 'var(--font-regular)',
                background: isToday ? 'var(--primary)' : 'transparent',
                color: isToday ? 'var(--on-primary)' : isSel ? 'var(--on-primary-container)' : 'var(--on-surface)',
              }}>
                {d.getDate()}
              </span>
            </button>
          );
        })}
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
        minHeight: '400px',
      }}>
        {days.map(d => {
          const events = byDay.get(isoOf(d)) ?? [];
          return (
            <div key={d.toISOString()} style={{
              borderRight: '1px solid var(--surface-variant)',
              padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px',
            }}>
              {events.length === 0 ? (
                <span style={{
                  textAlign: 'center', paddingTop: 'var(--space-4)',
                  fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)',
                  opacity: 0.5,
                }}>
                  —
                </span>
              ) : (
                events.map(e => {
                  const meta = getTypeMeta(e.type);
                  return (
                    <div key={e.id} style={{
                      padding: '8px', borderRadius: 'var(--radius-md)',
                      border: '1px solid', borderColor: meta.color + '30',
                      background: meta.bg + '40',
                      fontSize: 'var(--body-md)',
                    }}>
                      {e.start && (
                        <div style={{
                          fontSize: '11px', fontVariantNumeric: 'tabular-nums',
                          color: 'var(--on-surface-variant)', marginBottom: '2px',
                        }}>
                          {e.start}{e.end ? ` — ${e.end}` : ''}
                        </div>
                      )}
                      <div style={{ fontWeight: 'var(--font-medium)', lineHeight: 1.3 }}>
                        {e.title}
                      </div>
                      {e.location && (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '4px',
                          fontSize: '11px', color: 'var(--on-surface-variant)',
                          marginTop: '4px',
                        }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>location_on</span>
                          {e.location}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AgendaView({ events, today }: { events: AgendaEvent[]; today: Date }) {
  const upcoming = [...events]
    .filter(e => e.date >= isoOf(today))
    .sort((a, b) =>
      a.date.localeCompare(b.date) || (a.start ?? '').localeCompare(b.start ?? ''),
    );

  const groups = new Map<string, AgendaEvent[]>();
  for (const e of upcoming) {
    const arr = groups.get(e.date) ?? [];
    arr.push(e);
    groups.set(e.date, arr);
  }

  if (groups.size === 0) {
    return (
      <div className="card" style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 'var(--space-3)', padding: 'var(--space-6) var(--space-3)',
        textAlign: 'center', color: 'var(--on-surface-variant)',
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: '56px', opacity: 0.4 }}>
          calendar_month
        </span>
        <p style={{ fontSize: 'var(--body-md)' }}>
          Sem eventos futuros para os filtros seleccionados.
        </p>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {[...groups.entries()].map(([date, list]) => {
        const [y, m, d] = date.split('-').map(Number);
        const dt = new Date(y, m - 1, d);
        return (
          <div key={date} style={{
            display: 'grid', gap: 'var(--space-3)',
            gridTemplateColumns: '140px 1fr',
            padding: 'var(--space-4)',
            borderBottom: '1px solid var(--surface-variant)',
          }}>
            <div>
              <div style={{
                fontSize: 'var(--headline-lg)', fontWeight: 'var(--font-bold)',
                fontVariantNumeric: 'tabular-nums', lineHeight: 1,
                color: 'var(--on-surface)',
              }}>
                {String(dt.getDate()).padStart(2, '0')}
              </div>
              <div style={{
                fontSize: 'var(--label-md)', textTransform: 'uppercase',
                color: 'var(--on-surface-variant)', letterSpacing: '0.05em',
                marginTop: '4px',
              }}>
                {WEEK_PT[(dt.getDay() + 6) % 7]} · {MONTHS_PT[dt.getMonth()]}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {list.map(e => (
                <EventRow key={e.id} event={e} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EventRow({ event }: { event: AgendaEvent }) {
  const meta = getTypeMeta(event.type);
  return (
    <div style={{
      display: 'flex', gap: 'var(--space-2)',
      padding: 'var(--space-2) var(--space-3)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--surface-variant)',
      background: 'var(--surface)',
    }}>
      <span style={{
        marginTop: '4px', width: '8px', height: '8px',
        borderRadius: '50%', background: meta.color, flexShrink: 0,
        display: 'inline-block',
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          gap: 'var(--space-2)',
        }}>
          <span style={{
            fontSize: 'var(--body-md)', fontWeight: 'var(--font-medium)',
            color: 'var(--on-surface)', overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {event.title}
          </span>
          <span className="badge" style={{
            fontSize: '10px', flexShrink: 0,
            background: meta.bg + '60',
            color: meta.color,
            border: '1px solid ' + meta.color + '40',
          }}>
            <span className="material-symbols-outlined" style={{
              fontSize: '12px', verticalAlign: 'middle', marginRight: '2px',
            }}>
              {meta.icon}
            </span>
            {meta.label}
          </span>
        </div>
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)',
          fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)',
          marginTop: '4px',
        }}>
          {event.start && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontVariantNumeric: 'tabular-nums' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>schedule</span>
              {event.start}{event.end ? ` — ${event.end}` : ''}
            </span>
          )}
          {event.location && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>location_on</span>
              {event.location}
            </span>
          )}
          {event.protocolCode && (
            <span className="protocol-code" style={{ fontSize: '11px' }}>
              {event.protocolCode}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function UpcomingRow({ event }: { event: AgendaEvent }) {
  const [y, m, d] = event.date.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const meta = getTypeMeta(event.type);
  return (
    <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-start' }}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        width: '40px', padding: '4px', borderRadius: 'var(--radius-md)',
        border: '1px solid var(--surface-variant)',
        background: 'var(--surface-container-low)', flexShrink: 0,
      }}>
        <span style={{
          fontSize: '9px', textTransform: 'uppercase',
          color: 'var(--on-surface-variant)', lineHeight: 1,
        }}>
          {MONTHS_PT[dt.getMonth()].slice(0, 3)}
        </span>
        <span style={{
          fontSize: 'var(--body-md)', fontWeight: 'var(--font-bold)',
          fontVariantNumeric: 'tabular-nums',
          color: 'var(--on-surface)',
        }}>
          {String(dt.getDate()).padStart(2, '0')}
        </span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 'var(--body-md)', fontWeight: 'var(--font-medium)',
          color: 'var(--on-surface)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {event.title}
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-1)',
          fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)',
          marginTop: '2px',
        }}>
          <span style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: meta.color, display: 'inline-block',
          }} />
          <span>{meta.label}</span>
          {event.start && (
            <>
              <span style={{ color: 'var(--outline-variant)' }}>·</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{event.start}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
