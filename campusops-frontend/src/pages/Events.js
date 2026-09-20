import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEvents, createEvent, updateEvent, deleteEvent } from '../services/api';
import { useAuth } from '../context/AuthContext';

const statusColours = {
  planning: { bg: '#eff6ff', text: '#1d4ed8' },
  confirmed: { bg: '#f0fdf4', text: '#15803d' },
  completed: { bg: '#f3f4f6', text: '#374151' },
  cancelled: { bg: '#fef2f2', text: '#dc2626' },
  upcoming: { bg: '#fef3c7', text: '#d97706' },
};

const MONTHS = [
  'September', 'October', 'November', 'December',
  'January', 'February', 'March', 'April',
  'May', 'June', 'July', 'August'
];

const MONTH_INDICES = [8, 9, 10, 11, 0, 1, 2, 3, 4, 5, 6, 7];

const Events = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isPrivileged = ['president', 'treasurer'].includes(user?.role);

  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('Upcoming');
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    location: '',
    event_time: '',
    event_date: '',
    status: 'upcoming',
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await getEvents();
      setEvents(res.data);
    } catch {
      setError('Failed to load events.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, form);
      } else {
        await createEvent(form);
      }
      setForm({ name: '', description: '', location: '', event_time: '', event_date: '', status: 'upcoming' });
      setShowForm(false);
      setEditingEvent(null);
      fetchEvents();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save event.');
    }
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setForm({
      name: event.name,
      description: event.description || '',
      location: event.location || '',
      event_time: event.event_time || '',
      event_date: event.event_date ? event.event_date.split('T')[0] : '',
      status: event.status,
    });
    setShowForm(true);
    window.scrollTo(0, 0);
  };

  const handleCancel = () => {
    setEditingEvent(null);
    setForm({ name: '', description: '', location: '', event_time: '', event_date: '', status: 'upcoming' });
    setShowForm(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event? Tasks linked to it will become unlinked.')) return;
    try {
      await deleteEvent(id);
      fetchEvents();
    } catch {
      setError('Failed to delete event.');
    }
  };

  const handleFilterChange = (f) => {
    setFilter(f);
    setSelectedMonth(null);
  };

  const monthHasEvents = (academicIndex) => {
    const calendarMonth = MONTH_INDICES[academicIndex];
    return events.some((e) => new Date(e.event_date).getMonth() === calendarMonth);
  };

  if (loading) return <div style={styles.loading}>Loading events...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <h2 style={styles.heading}>Events</h2>
        {isPrivileged && (
          <button style={styles.primaryBtn} onClick={() => showForm ? handleCancel() : setShowForm(true)}>
            {showForm ? 'Cancel' : '+ New Event'}
          </button>
        )}
      </div>

      {error && <p style={styles.error}>{error}</p>}

      {/* Create / Edit event form */}
      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <h3 style={styles.formTitle}>{editingEvent ? 'Edit Event' : 'Create New Event'}</h3>

          <label style={styles.label}>Event Name *</label>
          <input
            style={styles.input}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Event name"
            required
          />

          <label style={styles.label}>Description</label>
          <textarea
            style={styles.textarea}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Optional description"
            rows={3}
          />

          <label style={styles.label}>Location</label>
          <input
            style={styles.input}
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="e.g. Student Union, Room 2B"
          />

          <div style={styles.row}>
            <div style={styles.halfField}>
              <label style={styles.label}>Date *</label>
              <input
                type="date"
                style={styles.input}
                value={form.event_date}
                onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                required
              />
            </div>
            <div style={styles.halfField}>
              <label style={styles.label}>Time</label>
              <input
                type="time"
                style={styles.input}
                value={form.event_time}
                onChange={(e) => setForm({ ...form, event_time: e.target.value })}
              />
            </div>
          </div>

          <div style={styles.halfField}>
            <label style={styles.label}>Status</label>
            <select
              style={styles.input}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div style={styles.formActions}>
            <button type="button" style={styles.cancelBtn} onClick={handleCancel}>Cancel</button>
            <button type="submit" style={styles.primaryBtn}>{editingEvent ? 'Save Changes' : 'Create Event'}</button>
          </div>
        </form>
      )}

      {/* Filter buttons */}
      <div style={styles.filters}>
        <button
          style={{
            ...styles.filterBtn,
            backgroundColor: filter === 'All' && selectedMonth === null ? '#d97706' : '#ffffff',
            color: filter === 'All' && selectedMonth === null ? '#ffffff' : '#6b7280',
            fontWeight: filter === 'All' && selectedMonth === null ? '700' : '500',
            borderColor: filter === 'All' && selectedMonth === null ? '#d97706' : '#d1d5db',
          }}
          onClick={() => { setFilter('All'); setSelectedMonth(null); }}
        >
          All
        </button>
        {['Upcoming', 'Completed', 'Cancelled'].map(option => (
          <button
            key={option}
            onClick={() => handleFilterChange(option)}
            style={{
              ...styles.filterBtn,
              backgroundColor: filter === option && selectedMonth === null ? '#d97706' : '#ffffff',
              color: filter === option && selectedMonth === null ? '#ffffff' : '#6b7280',
              fontWeight: filter === option && selectedMonth === null ? '700' : '500',
              borderColor: filter === option && selectedMonth === null ? '#d97706' : '#d1d5db',
            }}
          >
            {option}
          </button>
        ))}
      </div>

      {/* Event list */}
      <div>
        {(() => {
          const statusPriority = (e) => {
            if (e.status === 'cancelled' || e.status === 'completed') return 1;
            return 0;
          };

          const today = new Date();
          today.setHours(0, 0, 0, 0);

          let filtered = filter === 'Upcoming'
            ? events.filter(e => new Date(e.event_date) >= today && e.status !== 'cancelled' && e.status !== 'completed')
            : filter === 'All'
            ? events
            : events.filter(e => e.status === filter.toLowerCase());

          filtered = filtered
            .slice()
            .sort((a, b) => {
              const priorityDiff = statusPriority(a) - statusPriority(b);
              if (priorityDiff !== 0) return priorityDiff;
              return new Date(a.event_date) - new Date(b.event_date);
            });

          return filtered.length === 0 ? (
            <p style={styles.empty}>No events found.</p>
          ) : (
            <div style={styles.eventList}>
              {filtered.map((event) => {
                const colours = statusColours[event.status] || statusColours.upcoming;
                return (
                  <div key={event.id} style={styles.eventCard}>
                    <div style={styles.eventAccent} />
                    <div style={styles.eventHeader}>
                      <h3 style={styles.eventName} onClick={() => navigate(`/events/${event.id}`)}>
                        {event.name}
                      </h3>
                      <span style={{ ...styles.statusBadge, backgroundColor: colours.bg, color: colours.text }}>
                        {event.status}
                      </span>
                    </div>
                    {event.description && <p style={styles.eventDesc}>{event.description}</p>}
                    <div style={styles.eventMeta}>
                      <span>Date: <strong>{new Date(event.event_date).toLocaleDateString('en-GB')}</strong></span>
                      {event.event_time && (
                        <span>Time: <strong>{event.event_time.slice(0, 5)}</strong></span>
                      )}
                      {event.location && (
                        <span>Location: <strong>{event.location}</strong></span>
                      )}
                      <span>Tasks: <strong>{event.task_count}</strong></span>
                      <span>Created by: <strong>{event.created_by_name}</strong></span>
                    </div>
                    <div style={styles.eventFooter}>
                      <button style={styles.viewBtn} onClick={() => navigate(`/events/${event.id}`)}>
                        View details
                      </button>
                      {isPrivileged && (
                        <div style={styles.actionBtns}>
                          <button style={styles.editBtn} onClick={() => handleEdit(event)}>Edit</button>
                          <button style={styles.deleteBtn} onClick={() => handleDelete(event.id)}>Delete</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    </div>
  );
};

const styles = {
  container: { padding: '0' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  heading: { fontSize: '2rem', fontWeight: '800', color: '#111111', letterSpacing: '-0.5px' },
  loading: { padding: '2rem', textAlign: 'center', color: '#6b7280' },
  error: { color: '#dc2626', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.875rem' },
  form: { backgroundColor: '#ffffff', padding: '1.75rem', borderRadius: '12px', border: '1px solid #e5e5e5', marginBottom: '1.5rem' },
  formTitle: { marginBottom: '1.25rem', color: '#111111', fontWeight: '700', fontSize: '1.1rem' },
  label: { fontSize: '0.875rem', fontWeight: '600', color: '#111111', display: 'block', marginBottom: '0.4rem' },
  input: { width: '100%', padding: '0.65rem 0.9rem', marginBottom: '1rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.95rem', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '0.65rem 0.9rem', marginBottom: '1rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.95rem', resize: 'vertical', boxSizing: 'border-box' },
  row: { display: 'flex', gap: '1rem' },
  halfField: { flex: 1 },
  formActions: { display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' },
  filters: { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' },
  filterBtn: { padding: '0.4rem 1.1rem', borderRadius: '20px', border: '1px solid #d1d5db', backgroundColor: '#ffffff', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280' },
  eventList: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  eventCard: { backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e5e5', position: 'relative', overflow: 'hidden' },
  eventAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: '#d97706', borderRadius: '12px 0 0 12px' },
  eventHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' },
  eventName: { fontSize: '1.05rem', fontWeight: '700', color: '#111111', cursor: 'pointer', letterSpacing: '-0.25px' },
  statusBadge: { fontSize: '0.72rem', fontWeight: '700', textTransform: 'capitalize', padding: '0.25rem 0.75rem', borderRadius: '20px', letterSpacing: '0.03em' },
  eventDesc: { fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.75rem', lineHeight: '1.6' },
  eventMeta: { display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: '#6b7280', marginBottom: '1rem', flexWrap: 'wrap' },
  eventFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  actionBtns: { display: 'flex', gap: '0.5rem' },
  viewBtn: { padding: '0.4rem 0.9rem', backgroundColor: 'transparent', color: '#111111', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer' },
  primaryBtn: { padding: '0.6rem 1.25rem', backgroundColor: '#d97706', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer' },
  cancelBtn: { padding: '0.6rem 1.25rem', backgroundColor: 'transparent', color: '#374151', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.875rem', cursor: 'pointer' },
  editBtn: { padding: '0.4rem 0.9rem', backgroundColor: 'transparent', color: '#111111', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer' },
  deleteBtn: { padding: '0.4rem 0.9rem', backgroundColor: 'transparent', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '0.875rem', cursor: 'pointer' },
  empty: { color: '#6b7280', textAlign: 'center', padding: '2rem', fontWeight: '500' },
};

export default Events;