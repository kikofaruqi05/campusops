import { useState, useEffect } from 'react';
import { getBudgetEntries, getBudgetSummary, createBudgetEntry, deleteBudgetEntry, getEvents } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Budget = () => {
  const { user } = useAuth();
  const isPrivileged = ['president', 'treasurer'].includes(user?.role);

  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState({ total_income: 0, total_expenses: 0, net_balance: 0 });
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    type: 'income',
    amount: '',
    category: '',
    description: '',
    event_id: '',
  });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [entriesRes, summaryRes, eventsRes] = await Promise.all([
        getBudgetEntries(),
        getBudgetSummary(),
        getEvents(),
      ]);
      setEntries(entriesRes.data);
      setSummary(summaryRes.data);
      setEvents(eventsRes.data);
    } catch {
      setError('Failed to load budget data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEntry) {
        await deleteBudgetEntry(editingEntry.id);
        await createBudgetEntry({ ...form, event_id: form.event_id || null });
      } else {
        await createBudgetEntry({ ...form, event_id: form.event_id || null });
      }
      setForm({ type: 'income', amount: '', category: '', description: '', event_id: '' });
      setShowForm(false);
      setEditingEntry(null);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save entry.');
    }
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setForm({
      type: entry.type,
      amount: entry.amount,
      category: entry.category,
      description: entry.description || '',
      event_id: entry.event_id || '',
    });
    setShowForm(true);
    window.scrollTo(0, 0);
  };

  const handleCancel = () => {
    setEditingEntry(null);
    setForm({ type: 'income', amount: '', category: '', description: '', event_id: '' });
    setShowForm(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this budget entry?')) return;
    try {
      await deleteBudgetEntry(id);
      fetchAll();
    } catch {
      setError('Failed to delete entry.');
    }
  };

  const incomeEntries = entries.filter((e) => e.type === 'income');
  const expenseEntries = entries.filter((e) => e.type === 'expense');

  if (loading) return <div style={styles.loading}>Loading budget...</div>;

  // Reusable entry card renderer
  const renderEntry = (entry) => (
    <div key={entry.id} style={styles.entryCard}>
      <div style={{
        ...styles.entryAccent,
        backgroundColor: entry.type === 'income' ? '#16a34a' : '#dc2626',
      }} />
      <div style={styles.entryTop}>
        <span style={styles.entryCategory}>{entry.category}</span>
        <span style={{
          ...styles.entryAmount,
          color: entry.type === 'income' ? '#16a34a' : '#dc2626',
        }}>
          {entry.type === 'income' ? '+' : '-'}£{parseFloat(entry.amount).toFixed(2)}
        </span>
      </div>
      {entry.description && (
        <p style={styles.entryDesc}>{entry.description}</p>
      )}
      <div style={styles.entryMeta}>
        {entry.event_name && <span>Event: <strong>{entry.event_name}</strong></span>}
        <span>By: <strong>{entry.logged_by_name}</strong></span>
        <span>{new Date(entry.logged_at).toLocaleDateString('en-GB')}</span>
      </div>
      {isPrivileged && (
        <div style={styles.actionBtns}>
          <button style={styles.editBtn} onClick={() => handleEdit(entry)}>Edit</button>
          <button style={styles.deleteBtn} onClick={() => handleDelete(entry.id)}>Delete</button>
        </div>
      )}
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <h2 style={styles.heading}>Budget</h2>
        {isPrivileged && (
          <button style={styles.primaryBtn} onClick={() => showForm ? handleCancel() : setShowForm(true)}>
            {showForm ? 'Cancel' : '+ Log Entry'}
          </button>
        )}
      </div>

      {error && <p style={styles.error}>{error}</p>}

      {/* Summary cards */}
      <div style={styles.summaryGrid}>
        <div style={{ ...styles.summaryCard, borderTop: '3px solid #16a34a' }}>
          <p style={styles.summaryLabel}>Total Income</p>
          <p style={{ ...styles.summaryAmount, color: '#16a34a' }}>
            £{parseFloat(summary.total_income).toFixed(2)}
          </p>
        </div>
        <div style={{ ...styles.summaryCard, borderTop: '3px solid #dc2626' }}>
          <p style={styles.summaryLabel}>Total Expenses</p>
          <p style={{ ...styles.summaryAmount, color: '#dc2626' }}>
            £{parseFloat(summary.total_expenses).toFixed(2)}
          </p>
        </div>
        <div style={{ ...styles.summaryCard, borderTop: '3px solid #111111' }}>
          <p style={styles.summaryLabel}>Net Balance</p>
          <p style={{ ...styles.summaryAmount, color: summary.net_balance >= 0 ? '#16a34a' : '#dc2626' }}>
            £{parseFloat(summary.net_balance).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Create / Edit form */}
      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <h3 style={styles.formTitle}>
            {editingEntry ? 'Edit Budget Entry' : 'Log Budget Entry'}
          </h3>
          <div style={styles.row}>
            <div style={styles.halfField}>
              <label style={styles.label}>Type *</label>
              <select
                style={styles.input}
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div style={styles.halfField}>
              <label style={styles.label}>Amount (£) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                style={styles.input}
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
          </div>
          <label style={styles.label}>Category *</label>
          <input
            style={styles.input}
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder="e.g. Venue, Ticket Sales, Equipment"
            required
          />
          <label style={styles.label}>Description</label>
          <textarea
            style={styles.textarea}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Optional details"
            rows={2}
          />
          <label style={styles.label}>Link to Event</label>
          <select
            style={styles.input}
            value={form.event_id}
            onChange={(e) => setForm({ ...form, event_id: e.target.value })}
          >
            <option value="">No event</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.name}</option>
            ))}
          </select>
          <div style={styles.formActions}>
            <button type="button" style={styles.cancelBtn} onClick={handleCancel}>Cancel</button>
            <button type="submit" style={styles.primaryBtn}>
              {editingEntry ? 'Save Changes' : 'Save Entry'}
            </button>
          </div>
        </form>
      )}

      {/* Two column layout */}
      <div style={styles.twoCol}>

        {/* Income column */}
        <div style={styles.column}>
          <div style={styles.columnHeader}>
            <span style={styles.columnTitle}>Income</span>
            <span style={{ ...styles.columnCount, backgroundColor: '#f0fdf4', color: '#16a34a' }}>
              {incomeEntries.length} {incomeEntries.length === 1 ? 'entry' : 'entries'}
            </span>
          </div>
          {incomeEntries.length === 0 ? (
            <p style={styles.empty}>No income logged yet.</p>
          ) : (
            <div style={styles.entryList}>
              {incomeEntries.map(renderEntry)}
            </div>
          )}
        </div>

        {/* Expenses column */}
        <div style={styles.column}>
          <div style={styles.columnHeader}>
            <span style={styles.columnTitle}>Expenses</span>
            <span style={{ ...styles.columnCount, backgroundColor: '#fef2f2', color: '#dc2626' }}>
              {expenseEntries.length} {expenseEntries.length === 1 ? 'entry' : 'entries'}
            </span>
          </div>
          {expenseEntries.length === 0 ? (
            <p style={styles.empty}>No expenses logged yet.</p>
          ) : (
            <div style={styles.entryList}>
              {expenseEntries.map(renderEntry)}
            </div>
          )}
        </div>

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
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' },
  summaryCard: { backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e5e5' },
  summaryLabel: { fontSize: '0.8rem', fontWeight: '600', color: '#9ca3af', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' },
  summaryAmount: { fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.5px' },
  form: { backgroundColor: '#ffffff', padding: '1.75rem', borderRadius: '12px', border: '1px solid #e5e5e5', marginBottom: '1.5rem' },
  formTitle: { marginBottom: '1.25rem', color: '#111111', fontWeight: '700', fontSize: '1.1rem' },
  label: { fontSize: '0.875rem', fontWeight: '600', color: '#111111', display: 'block', marginBottom: '0.4rem' },
  input: { width: '100%', padding: '0.65rem 0.9rem', marginBottom: '1rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.95rem', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '0.65rem 0.9rem', marginBottom: '1rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.95rem', resize: 'vertical', boxSizing: 'border-box' },
  row: { display: 'flex', gap: '1rem' },
  halfField: { flex: 1 },
  formActions: { display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' },
  column: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  columnHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' },
  columnTitle: { fontSize: '1rem', fontWeight: '700', color: '#111111', letterSpacing: '-0.25px' },
  columnCount: { fontSize: '0.75rem', fontWeight: '600', padding: '0.2rem 0.6rem', borderRadius: '20px' },
  entryList: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  entryCard: { backgroundColor: '#ffffff', padding: '1.25rem 1.25rem 1.25rem 1.5rem', borderRadius: '12px', border: '1px solid #e5e5e5', position: 'relative', overflow: 'hidden' },
  entryAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', borderRadius: '12px 0 0 12px' },
  entryTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' },
  entryCategory: { fontSize: '0.95rem', fontWeight: '700', color: '#111111', letterSpacing: '-0.25px' },
  entryAmount: { fontSize: '1.1rem', fontWeight: '800', letterSpacing: '-0.25px' },
  entryDesc: { fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem', lineHeight: '1.6' },
  entryMeta: { display: 'flex', gap: '1rem', fontSize: '0.78rem', color: '#9ca3af', fontWeight: '500', flexWrap: 'wrap' },
  actionBtns: { display: 'flex', gap: '0.5rem', marginTop: '0.75rem' },
  primaryBtn: { padding: '0.6rem 1.25rem', backgroundColor: '#d97706', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer' },
  cancelBtn: { padding: '0.6rem 1.25rem', backgroundColor: 'transparent', color: '#374151', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.875rem', cursor: 'pointer' },
  editBtn: { padding: '0.4rem 0.9rem', backgroundColor: 'transparent', color: '#111111', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer' },
  deleteBtn: { padding: '0.4rem 0.9rem', backgroundColor: 'transparent', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '0.875rem', cursor: 'pointer' },
  empty: { color: '#6b7280', textAlign: 'center', padding: '2rem', fontWeight: '500', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e5e5e5' },
};

export default Budget;