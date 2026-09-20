import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEvents } from '../services/api';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const statusColour = {
  planning: '#d97706',
  confirmed: '#16a34a',
  completed: '#6b7280',
  cancelled: '#dc2626',
};

const Calendar = () => {
  const navigate = useNavigate();
  const today = new Date();

  const [view, setView] = useState('month'); // 'month' or 'year'
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await getEvents();
      setEvents(res.data);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get events for a specific date string (YYYY-MM-DD)
  const getEventsForDate = (year, month, day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter((e) => e.event_date && e.event_date.startsWith(dateStr));
  };

  // Get events for a specific month
  const getEventsForMonth = (year, month) => {
    return events.filter((e) => {
      if (!e.event_date) return false;
      const d = new Date(e.event_date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  };

  // Build grid days for a month (with leading/trailing nulls)
  const buildMonthGrid = (year, month) => {
    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    // Convert to Mon-first (0=Mon, 6=Sun)
    const startOffset = (firstDay + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const grid = [];
    for (let i = 0; i < startOffset; i++) grid.push(null);
    for (let i = 1; i <= daysInMonth; i++) grid.push(i);
    return grid;
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const isToday = (year, month, day) => {
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  // Month View
  const renderMonthView = () => {
    const grid = buildMonthGrid(currentYear, currentMonth);

    return (
      <div style={styles.monthWrapper}>
        {/* Day headers */}
        <div style={styles.dayHeaders}>
          {DAYS.map((d) => (
            <div key={d} style={styles.dayHeader}>{d}</div>
          ))}
        </div>

        {/* Grid */}
        <div style={styles.monthGrid}>
          {grid.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} style={styles.emptyCell} />;
            const dayEvents = getEventsForDate(currentYear, currentMonth, day);
            const todayCell = isToday(currentYear, currentMonth, day);

            return (
              <div key={day} style={{
                ...styles.dayCell,
                backgroundColor: todayCell ? '#f9f9f9' : '#ffffff',
                border: todayCell ? '1.5px solid #111111' : '1px solid #e5e5e5',
              }}>
                <span style={{
                  ...styles.dayNumber,
                  fontWeight: todayCell ? '800' : '500',
                  color: todayCell ? '#111111' : '#374151',
                }}>
                  {day}
                </span>
                <div style={styles.eventChips}>
                  {dayEvents.slice(0, 3).map((ev) => (
                    <div
                      key={ev.id}
                      style={{
                        ...styles.eventChip,
                        backgroundColor: statusColour[ev.status] || '#6b7280',
                      }}
                      onClick={() => navigate(`/events/${ev.id}`)}
                      title={ev.name}
                    >
                      {ev.name}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div style={styles.moreChip}>+{dayEvents.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Year View
  const renderYearView = () => {
    return (
      <div style={styles.yearGrid}>
        {MONTHS.map((monthName, monthIndex) => {
          const grid = buildMonthGrid(currentYear, monthIndex);
          const monthEvents = getEventsForMonth(currentYear, monthIndex);

          return (
            <div key={monthName} style={styles.miniMonth}>
              <p style={styles.miniMonthTitle}>{monthName}</p>

              {/* Mini day headers */}
              <div style={styles.miniDayHeaders}>
                {DAYS.map((d) => (
                  <div key={d} style={styles.miniDayHeader}>{d[0]}</div>
                ))}
              </div>

              {/* Mini grid */}
              <div style={styles.miniGrid}>
                {grid.map((day, i) => {
                  if (!day) return <div key={`empty-${i}`} style={styles.miniEmpty} />;
                  const dayEvents = getEventsForDate(currentYear, monthIndex, day);
                  const todayCell = isToday(currentYear, monthIndex, day);

                  return (
                    <div key={day} style={{
                      ...styles.miniDay,
                      backgroundColor: todayCell ? '#111111' : dayEvents.length > 0 ? '#f0fdf4' : 'transparent',
                      color: todayCell ? '#ffffff' : '#111111',
                      borderRadius: '4px',
                      fontWeight: todayCell ? '700' : dayEvents.length > 0 ? '600' : '400',
                      cursor: dayEvents.length > 0 ? 'pointer' : 'default',
                    }}
                      onClick={() => {
                        if (dayEvents.length > 0) {
                          setCurrentMonth(monthIndex);
                          setView('month');
                        }
                      }}
                      title={dayEvents.map(e => e.name).join(', ')}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>

              {/* Event count badge */}
              {monthEvents.length > 0 && (
                <p style={styles.miniEventCount}>
                  {monthEvents.length} event{monthEvents.length > 1 ? 's' : ''}
                </p>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) return <p style={{ color: '#9ca3af' }}>Loading calendar...</p>;

  return (
    <div>
      {/* Page header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Calendar</h2>
          <p style={styles.subtitle}>All society events at a glance</p>
        </div>

        {/* View toggle */}
        <div style={styles.viewToggle}>
          <button
            style={view === 'month' ? { ...styles.toggleBtn, ...styles.toggleActive } : styles.toggleBtn}
            onClick={() => setView('month')}
          >
            Month
          </button>
          <button
            style={view === 'year' ? { ...styles.toggleBtn, ...styles.toggleActive } : styles.toggleBtn}
            onClick={() => setView('year')}
          >
            Year
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div style={styles.nav}>
        <button style={styles.navBtn} onClick={view === 'month' ? prevMonth : () => setCurrentYear((y) => y - 1)}>
          ←
        </button>
        <h3 style={styles.navTitle}>
          {view === 'month' ? `${MONTHS[currentMonth]} ${currentYear}` : currentYear}
        </h3>
        <button style={styles.navBtn} onClick={view === 'month' ? nextMonth : () => setCurrentYear((y) => y + 1)}>
          →
        </button>
        <button style={styles.todayBtn} onClick={() => {
          setCurrentMonth(today.getMonth());
          setCurrentYear(today.getFullYear());
        }}>
          Today
        </button>
      </div>

      {/* Legend */}
      <div style={styles.legend}>
        {Object.entries(statusColour).map(([status, colour]) => (
          <div key={status} style={styles.legendItem}>
            <div style={{ ...styles.legendDot, backgroundColor: colour }} />
            <span style={styles.legendLabel}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div style={styles.calendarCard}>
        {view === 'month' ? renderMonthView() : renderYearView()}
      </div>
    </div>
  );
};

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1.5rem',
    paddingBottom: '1.5rem',
    borderBottom: '1px solid #e5e5e5',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '800',
    color: '#111111',
    letterSpacing: '-0.5px',
    marginBottom: '0.25rem',
  },
  subtitle: {
    fontSize: '0.9rem',
    color: '#9ca3af',
    fontWeight: '400',
  },
  viewToggle: {
    display: 'flex',
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  toggleBtn: {
    padding: '0.5rem 1.25rem',
    border: 'none',
    backgroundColor: '#ffffff',
    color: '#6b7280',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
  },
  toggleActive: {
    backgroundColor: '#d97706',
    color: '#ffffff',
    fontWeight: '600',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1rem',
  },
  navBtn: {
    width: '34px',
    height: '34px',
    borderRadius: '8px',
    border: '1px solid #e5e5e5',
    backgroundColor: '#ffffff',
    fontSize: '1rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#111111',
    minWidth: '180px',
    textAlign: 'center',
  },
  todayBtn: {
    padding: '0.4rem 1rem',
    borderRadius: '8px',
    border: '1px solid #e5e5e5',
    backgroundColor: '#ffffff',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151',
    cursor: 'pointer',
    marginLeft: '0.5rem',
  },
  legend: {
    display: 'flex',
    gap: '1.5rem',
    marginBottom: '1rem',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  },
  legendDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },
  legendLabel: {
    fontSize: '0.8rem',
    color: '#6b7280',
    fontWeight: '500',
  },
  calendarCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e5e5',
    borderRadius: '12px',
    padding: '1.5rem',
    overflow: 'hidden',
  },
  dayHeaders: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    marginBottom: '0.5rem',
  },
  dayHeader: {
    textAlign: 'center',
    fontSize: '0.75rem',
    fontWeight: '700',
    color: '#9ca3af',
    letterSpacing: '0.05em',
    padding: '0.5rem 0',
  },
  monthGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '4px',
  },
  emptyCell: {
    minHeight: '90px',
  },
  dayCell: {
    minHeight: '90px',
    borderRadius: '8px',
    padding: '0.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  dayNumber: {
    fontSize: '0.875rem',
    marginBottom: '0.25rem',
  },
  eventChips: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  eventChip: {
    fontSize: '0.7rem',
    fontWeight: '600',
    color: '#ffffff',
    padding: '2px 6px',
    borderRadius: '4px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  moreChip: {
    fontSize: '0.7rem',
    color: '#9ca3af',
    fontWeight: '500',
    padding: '2px 4px',
  },
  yearGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '1.5rem',
  },
  miniMonth: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  miniMonthTitle: {
    fontSize: '0.8rem',
    fontWeight: '700',
    color: '#111111',
    marginBottom: '0.4rem',
    letterSpacing: '0.02em',
  },
  miniDayHeaders: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    marginBottom: '0.2rem',
  },
  miniDayHeader: {
    textAlign: 'center',
    fontSize: '0.6rem',
    fontWeight: '700',
    color: '#d1d5db',
  },
  miniGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '1px',
  },
  miniEmpty: {
    height: '18px',
  },
  miniDay: {
    height: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.6rem',
  },
  miniEventCount: {
    fontSize: '0.7rem',
    color: '#16a34a',
    fontWeight: '600',
    marginTop: '0.35rem',
  },
  monthWrapper: {
    display: 'flex',
    flexDirection: 'column',
  },
};

export default Calendar;