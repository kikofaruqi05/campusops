import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEventById } from '../services/api';

const statusColours = {
  todo: { bg: '#eff6ff', text: '#1d4ed8' },
  in_progress: { bg: '#fffbeb', text: '#d97706' },
  done: { bg: '#f0fdf4', text: '#15803d' },
};

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await getEventById(id);
        setEvent(res.data);
      } catch {
        setError('Failed to load event.');
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  if (loading) return <div style={styles.loading}>Loading event...</div>;
  if (error) return <div style={styles.loading}>{error}</div>;
  if (!event) return null;

  const completedTasks = event.tasks.filter((t) => t.status === 'done').length;
  const totalTasks = event.tasks.length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div style={styles.container}>
      <button style={styles.backBtn} onClick={() => navigate('/events')}>
        ← Back to Events
      </button>

      <div style={styles.card}>
        <div style={styles.eventHeader}>
          <h2 style={styles.eventName}>{event.name}</h2>
          <span style={styles.statusBadge}>{event.status}</span>
        </div>

        {event.description && (
          <p style={styles.description}>{event.description}</p>
        )}

        <div style={styles.meta}>
          <span>Date: <strong>{new Date(event.event_date).toLocaleDateString('en-GB')}</strong></span>
          <span>Created by: <strong>{event.created_by_name}</strong></span>
        </div>
      </div>

      {/* Task progress */}
      <div style={styles.card}>
        <h3 style={styles.sectionTitle}>
          Task Progress — {completedTasks}/{totalTasks} complete
        </h3>

        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${progressPercent}%` }} />
        </div>
        <p style={styles.progressLabel}>{progressPercent}% complete</p>

        {totalTasks === 0 ? (
          <p style={styles.empty}>No tasks linked to this event yet.</p>
        ) : (
          <div style={styles.taskList}>
            {event.tasks.map((task) => {
              const colours = statusColours[task.status] || statusColours.todo;
              return (
                <div key={task.id} style={styles.taskRow}>
                  <div style={styles.taskLeft}>
                    <span style={styles.taskTitle}>{task.title}</span>
                    <span style={styles.taskAssignee}>
                      {task.assigned_to_name || 'Unassigned'}
                    </span>
                  </div>
                  <span style={{
                    ...styles.taskStatus,
                    backgroundColor: colours.bg,
                    color: colours.text,
                  }}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: { padding: '0' },
  loading: { padding: '2rem', textAlign: 'center', color: '#6b7280' },
  backBtn: { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: '1px solid #d1d5db', color: '#111111', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600', marginBottom: '1.5rem', padding: '0.5rem 1rem', borderRadius: '8px', backgroundColor: '#ffffff'},
  card: { backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '1rem' },
  eventHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' },
  eventName: { fontSize: '1.4rem', color: '#1a1a2e', margin: 0 },
  statusBadge: { fontSize: '0.75rem', fontWeight: '600', textTransform: 'capitalize', padding: '0.25rem 0.75rem', borderRadius: '20px', backgroundColor: '#eff6ff', color: '#1d4ed8' },
  description: { color: '#6b7280', fontSize: '0.95rem', marginBottom: '1rem' },
  meta: { display: 'flex', gap: '2rem', fontSize: '0.875rem', color: '#6b7280' },
  sectionTitle: { fontSize: '1rem', color: '#1a1a2e', marginBottom: '1rem' },
  progressBar: { height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.5rem' },
  progressFill: { height: '100%', backgroundColor: '#4f46e5', borderRadius: '4px', transition: 'width 0.3s ease' },
  progressLabel: { fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' },
  taskList: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  taskRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: '8px' },
  taskLeft: { display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  taskTitle: { fontSize: '0.9rem', fontWeight: '500', color: '#1a1a2e' },
  taskAssignee: { fontSize: '0.8rem', color: '#6b7280' },
  taskStatus: { fontSize: '0.75rem', fontWeight: '600', textTransform: 'capitalize', padding: '0.25rem 0.75rem', borderRadius: '20px' },
  empty: { color: '#6b7280', fontSize: '0.875rem' },
};

export default EventDetail;