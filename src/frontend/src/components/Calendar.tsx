import { useMemo } from 'react';

const WEEK_PT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

function buildMonthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const jsDow = first.getDay();
  const shift = (jsDow + 6) % 7;
  const start = new Date(year, month, 1 - shift);
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    cells.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }
  return cells;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export interface CalendarProps {
  year: number;
  month: number;
  selected?: Date;
  onSelect?: (date: Date) => void;
  eventDates?: string[];
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  onToday?: () => void;
}

export function Calendar({
  year,
  month,
  selected,
  onSelect,
  eventDates,
}: CalendarProps) {
  const cells = useMemo(() => buildMonthGrid(year, month), [year, month]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div style={{
      background: 'var(--surface)',
      borderRadius: 'var(--radius-xl)',
      border: '1px solid var(--surface-variant)',
      overflow: 'hidden',
      fontFamily: 'var(--font-family)',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        borderBottom: '1px solid var(--surface-variant)',
        background: 'var(--surface-container-low)',
      }}>
        {WEEK_PT.map(d => (
          <div key={d} style={{
            padding: '8px 4px',
            textAlign: 'center',
            fontSize: 'var(--label-md)',
            fontWeight: 'var(--font-semibold)',
            color: 'var(--on-surface-variant)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            {d}
          </div>
        ))}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
      }}>
        {cells.map((d, i) => {
          const inMonth = d.getMonth() === month;
          const isToday = sameDay(d, today);
          const isSelected = selected ? sameDay(d, selected) : false;
          const hasEvents = eventDates?.some(ed => {
            const [y, m, day] = ed.split('-').map(Number);
            return y === d.getFullYear() && m === d.getMonth() + 1 && day === d.getDate();
          });

          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelect?.(d)}
              disabled={!inMonth}
              style={{
                aspectRatio: '1',
                border: 'none',
                borderRight: (i + 1) % 7 === 0 ? 'none' : '1px solid var(--surface-variant)',
                borderBottom: i >= 35 ? 'none' : '1px solid var(--surface-variant)',
                background: isSelected
                  ? 'var(--primary-container)'
                  : isToday && !isSelected
                    ? 'var(--surface-container-high)'
                    : !inMonth
                      ? 'var(--surface-container-low)'
                      : 'transparent',
                cursor: inMonth ? 'pointer' : 'default',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                transition: 'background 0.15s',
                position: 'relative',
                opacity: inMonth ? 1 : 0.35,
              }}
              onMouseEnter={e => {
                if (inMonth && !isSelected) e.currentTarget.style.background = 'var(--surface-container-high)';
              }}
              onMouseLeave={e => {
                if (inMonth && !isSelected) {
                  e.currentTarget.style.background = isToday ? 'var(--surface-container-high)' : 'transparent';
                }
              }}
            >
              <span style={{
                fontSize: 'var(--body-md)',
                fontWeight: isToday || isSelected ? 'var(--font-bold)' : 'var(--font-regular)',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 'var(--radius-full)',
                background: isToday && !isSelected ? 'var(--primary)' : 'transparent',
                color: isToday && !isSelected
                  ? 'var(--on-primary)'
                  : isSelected
                    ? 'var(--on-primary-container)'
                    : isToday
                      ? 'var(--primary)'
                      : 'var(--on-surface)',
              }}>
                {d.getDate()}
              </span>
              {hasEvents && (
                <span style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  background: 'var(--secondary)',
                  display: 'block',
                }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
