import { useState, useEffect } from 'react';
import { getTasks, getUsers, createTask, updateTaskStatus, deleteTask, getEvents, updateTask } from '../services/api';
import { getAttempts, saveAttempt } from '../services/api';
import { useAuth } from '../context/AuthContext';
import TaskComments from '../components/TaskComments';

const statusLabels = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
};

const priorityColours = {
  low: '#16a34a',
  medium: '#d97706',
  high: '#dc2626',
};

const Tasks = () => {
  const { user } = useAuth();
  const isPrivileged = ['president', 'treasurer'].includes(user?.role);

  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedTask, setExpandedTask] = useState(null);
  const [editingTask, setEditingTask] = useState(null);

  // Attempt modal state
  const [attemptTask, setAttemptTask] = useState(null);
  const [attemptContent, setAttemptContent] = useState('');
  const [attemptList, setAttemptList] = useState([]);
  const [attemptLoading, setAttemptLoading] = useState(false);
  const [attemptError, setAttemptError] = useState('');
  const [attemptSuccess, setAttemptSuccess] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    deadline: '',
    assigned_to: '',
    event_id: '',
  });

  useEffect(() => {
    fetchTasks();
    fetchUsers();
    fetchEvents();
  }, []);

  const fetchTasks = async () => {
  try {
    const res = await getTasks();
    // Only show tasks assigned to the current user
    const myTasks = res.data.filter((t) => t.assigned_to_id === user.id);
    setTasks(myTasks);
  } catch {
    setError('Failed to load tasks.');
  } finally {
    setLoading(false);
  }
};

  const fetchUsers = async () => {
    try {
      const res = await getUsers();
      setUsers(res.data);
    } catch {
      console.error('Failed to load users.');
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await getEvents();
      setEvents(res.data);
    } catch {
      console.error('Failed to load events.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTask) {
        await updateTask(editingTask.id, {
          ...form,
          assigned_to: form.assigned_to || null,
          deadline: form.deadline || null,
          event_id: form.event_id || null,
          status: editingTask.status,
        });
      } else {
        await createTask({
          ...form,
          assigned_to: form.assigned_to || null,
          deadline: form.deadline || null,
          event_id: form.event_id || null,
        });
      }
      setForm({ title: '', description: '', priority: 'medium', deadline: '', assigned_to: '', event_id: '' });
      setShowForm(false);
      setEditingTask(null);
      fetchTasks();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save task.');
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      deadline: task.deadline ? task.deadline.split('T')[0] : '',
      assigned_to: task.assigned_to_id || '',
      event_id: task.event_id || '',
    });
    setShowForm(true);
    window.scrollTo(0, 0);
  };

  const handleCancel = () => {
    setEditingTask(null);
    setForm({ title: '', description: '', priority: 'medium', deadline: '', assigned_to: '', event_id: '' });
    setShowForm(false);
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateTaskStatus(id, newStatus);
      fetchTasks();
    } catch {
      setError('Failed to update status.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await deleteTask(id);
      fetchTasks();
    } catch {
      setError('Failed to delete task.');
    }
  };

  // Open attempt modal and load existing attempts
  const openAttemptModal = async (task) => {
    setAttemptTask(task);
    setAttemptContent('');
    setAttemptError('');
    setAttemptSuccess('');
    setAttemptLoading(true);
    try {
      const res = await getAttempts(task.id);
      setAttemptList(res.data);
      // Pre-fill if current user already has an attempt
      const mine = res.data.find((a) => a.user_id === user.id);
      if (mine) setAttemptContent(mine.content);
    } catch {
      setAttemptError('Failed to load attempts.');
    } finally {
      setAttemptLoading(false);
    }
  };

  const closeAttemptModal = () => {
    setAttemptTask(null);
    setAttemptContent('');
    setAttemptList([]);
    setAttemptError('');
    setAttemptSuccess('');
  };

  const handleSaveAttempt = async () => {
  if (!attemptContent.trim()) {
    setAttemptError('Please write something before submitting.');
    return;
  }
  setAttemptLoading(true);
  setAttemptError('');
  try {
    await saveAttempt(attemptTask.id, attemptContent);
    // Automatically mark task as done
    await updateTaskStatus(attemptTask.id, 'done');
    setAttemptSuccess('Your attempt has been saved and the task is marked as done!');
    const res = await getAttempts(attemptTask.id);
    setAttemptList(res.data);
    fetchTasks();
  } catch {
    setAttemptError('Failed to save attempt.');
  } finally {
    setAttemptLoading(false);
  }
};

  const filteredTasks = filter === 'all'
    ? tasks
    : tasks.filter((t) => t.status === filter);

  if (loading) return <div style={styles.loading}>Loading tasks...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <h2 style={styles.heading}>My Tasks</h2>
        {isPrivileged && (
          <button style={styles.primaryBtn} onClick={() => showForm ? handleCancel() : setShowForm(true)}>
            {showForm ? 'Cancel' : '+ New Task'}
          </button>
        )}
      </div>

      {error && <p style={styles.error}>{error}</p>}

      {/* Create / Edit task form */}
      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <h3 style={styles.formTitle}>{editingTask ? 'Edit Task' : 'Create New Task'}</h3>
          <label style={styles.label}>Title *</label>
          <input
            style={styles.input}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Task title"
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
          <div style={styles.row}>
            <div style={styles.halfField}>
              <label style={styles.label}>Priority</label>
              <select style={styles.input} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div style={styles.halfField}>
              <label style={styles.label}>Deadline</label>
              <input type="date" style={styles.input} value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </div>
          </div>
          <label style={styles.label}>Assign To</label>
          <select style={styles.input} value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}>
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>
            ))}
          </select>
          <label style={styles.label}>Link to Event</label>
          <select style={styles.input} value={form.event_id || ''} onChange={(e) => setForm({ ...form, event_id: e.target.value || null })}>
            <option value="">No event</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.name}</option>
            ))}
          </select>
          <div style={styles.formActions}>
            <button type="button" style={styles.cancelBtn} onClick={handleCancel}>Cancel</button>
            <button type="submit" style={styles.primaryBtn}>{editingTask ? 'Save Changes' : 'Create Task'}</button>
          </div>
        </form>
      )}

      {/* Filter tabs */}
      <div style={styles.filters}>
        {['all', 'todo', 'in_progress', 'done'].map((f) => (
          <button
            key={f}
            style={{ ...styles.filterBtn, ...(filter === f ? styles.filterActive : {}) }}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : statusLabels[f]}
          </button>
        ))}
      </div>

      {/* Task list */}
      {filteredTasks.length === 0 ? (
        <p style={styles.empty}>No tasks found.</p>
      ) : (
        <div style={styles.taskList}>
          {filteredTasks.map((task) => (
            <div key={task.id} style={styles.taskCard}>
              <div style={styles.taskAccent} />
              <div style={styles.taskHeader}>
                <h3 style={styles.taskTitle}>{task.title}</h3>
                <span style={{ ...styles.priorityBadge, color: priorityColours[task.priority] }}>
                  {task.priority}
                </span>
              </div>
              {task.description && (
                <p style={styles.taskDesc}>{task.description}</p>
              )}
              <div style={styles.taskMeta}>
  <span>Assigned to: <strong>{task.assigned_to_name || 'Unassigned'}</strong></span>
  {task.deadline && (
    <span>Deadline: <strong>{new Date(task.deadline).toLocaleDateString('en-GB')}</strong></span>
  )}
  {task.event_name && (
    <span>Event: <strong>{task.event_name}</strong></span>
  )}
</div>
              <div style={styles.taskFooter}>
                <select
  style={{
    ...styles.statusSelect,
    cursor: isPrivileged ? 'pointer' : 'default',
    color: isPrivileged ? '#111111' : '#9ca3af',
  }}
  value={task.status}
  onChange={(e) => isPrivileged && handleStatusChange(task.id, e.target.value)}
  disabled={!isPrivileged}
>
  <option value="todo">To Do</option>
  <option value="in_progress">In Progress</option>
  <option value="done">Done</option>
</select>
                <div style={styles.actionBtns}>
                  {/* Attempt button is visible to everyone */}
                  <button style={styles.attemptBtn} onClick={() => openAttemptModal(task)} title="Attempt task">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
</button>
                  {isPrivileged && (
                    <>
                      <button style={styles.editBtn} onClick={() => handleEdit(task)}>Edit</button>
                      <button style={styles.deleteBtn} onClick={() => handleDelete(task.id)}>Delete</button>
                    </>
                  )}
                </div>
              </div>

              {/* Toggle comments */}
              <button
                style={styles.commentsToggle}
                onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
              >
                {expandedTask === task.id ? 'Hide comments' : 'Show comments'}
              </button>
              {expandedTask === task.id && <TaskComments taskId={task.id} />}
            </div>
          ))}
        </div>
      )}

      {/* Attempt Modal */}
      {attemptTask && (
        <div style={styles.modalOverlay} onClick={closeAttemptModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>

            {/* Modal header */}
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalTitle}>Attempt Task</h3>
                <p style={styles.modalSubtitle}>{attemptTask.title}</p>
              </div>
              <button style={styles.modalClose} onClick={closeAttemptModal}>✕</button>
            </div>

            {/* Text box */}
            <label style={styles.label}>Your response</label>
            <textarea
              style={{ ...styles.textarea, minHeight: '160px' }}
              value={attemptContent}
              onChange={(e) => setAttemptContent(e.target.value)}
              placeholder="Write your attempt here..."
            />

            {attemptError && <p style={styles.error}>{attemptError}</p>}
            {attemptSuccess && <p style={styles.success}>{attemptSuccess}</p>}

            <div style={styles.formActions}>
              <button style={styles.cancelBtn} onClick={closeAttemptModal}>Cancel</button>
              <button style={styles.primaryBtn} onClick={handleSaveAttempt} disabled={attemptLoading}>
                {attemptLoading ? 'Saving...' : 'Submit Attempt'}
              </button>
            </div>

            {/* Previous attempts from all users */}
            {attemptList.length > 0 && (
              <div style={styles.attemptList}>
                <p style={styles.attemptListTitle}>ALL ATTEMPTS</p>
                {attemptList.map((a) => (
                  <div key={a.id} style={styles.attemptItem}>
                    <div style={styles.attemptMeta}>
                      <strong style={styles.attemptName}>{a.full_name}</strong>
                      <span style={styles.attemptDate}>
                        {new Date(a.updated_at).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                    <p style={styles.attemptContent}>{a.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { padding: '0' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  heading: { fontSize: '2rem', fontWeight: '800', color: '#111111', letterSpacing: '-0.5px' },
  loading: { padding: '2rem', textAlign: 'center', color: '#6b7280' },
  error: { color: '#dc2626', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.875rem' },
  success: { color: '#16a34a', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.875rem' },
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
  filterActive: { backgroundColor: '#d97706', color: '#ffffff', borderColor: '#d97706', fontWeight: '700' },
  taskList: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  taskCard: { backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e5e5', position: 'relative', overflow: 'hidden' },
  taskAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: '#d97706', borderRadius: '12px 0 0 12px' },
  taskHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' },
  taskTitle: { fontSize: '1.05rem', fontWeight: '700', color: '#111111', letterSpacing: '-0.25px' },
  priorityBadge: { fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' },
  taskDesc: { fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.75rem', lineHeight: '1.6' },
  taskMeta: { display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: '#6b7280', marginBottom: '1rem' },
  taskFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  statusSelect: { padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.875rem', cursor: 'pointer', fontWeight: '500' },
  actionBtns: { display: 'flex', gap: '0.5rem' },
  primaryBtn: { padding: '0.6rem 1.25rem', backgroundColor: '#d97706', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer' },
  cancelBtn: { padding: '0.6rem 1.25rem', backgroundColor: 'transparent', color: '#374151', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.875rem', cursor: 'pointer' },
  attemptBtn: { padding: '0.4rem 0.6rem', backgroundColor: '#d97706', color: '#ffffff', border: '1px solid #ffffff', borderRadius: '8px', fontSize: '1rem', cursor: 'pointer' },
  editBtn: { padding: '0.4rem 0.9rem', backgroundColor: 'transparent', color: '#111111', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer' },
  deleteBtn: { padding: '0.4rem 0.9rem', backgroundColor: 'transparent', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '0.875rem', cursor: 'pointer' },
  commentsToggle: { background: 'none', border: 'none', color: '#9ca3af', fontSize: '0.8rem', fontWeight: '500', cursor: 'pointer', padding: '0.5rem 0 0 0' },
  empty: { color: '#6b7280', textAlign: 'center', padding: '2rem', fontWeight: '500' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 },
  modal: { backgroundColor: '#ffffff', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '560px', maxHeight: '85vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' },
  modalTitle: { fontSize: '1.25rem', fontWeight: '700', color: '#111111', marginBottom: '0.25rem' },
  modalSubtitle: { fontSize: '0.875rem', color: '#6b7280', fontWeight: '400' },
  modalClose: { background: 'none', border: 'none', fontSize: '1rem', color: '#9ca3af', cursor: 'pointer' },
  attemptList: { marginTop: '1.5rem', borderTop: '1px solid #e5e5e5', paddingTop: '1.25rem' },
  attemptListTitle: { fontSize: '0.72rem', fontWeight: '700', color: '#9ca3af', letterSpacing: '0.1em', marginBottom: '1rem' },
  attemptItem: { backgroundColor: '#f9f9f9', borderRadius: '8px', padding: '1rem', marginBottom: '0.75rem', border: '1px solid #e5e5e5' },
  attemptMeta: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' },
  attemptName: { fontSize: '0.875rem', color: '#111111' },
  attemptDate: { fontSize: '0.775rem', color: '#9ca3af' },
  attemptContent: { fontSize: '0.875rem', color: '#374151', lineHeight: '1.6', whiteSpace: 'pre-wrap' },
};

export default Tasks;