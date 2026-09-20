import { useState, useEffect } from 'react';
import { getNotes, createNote, updateNote, deleteNote } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Notes = () => {
  const { user } = useAuth();

  const [notes, setNotes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    content: '',
  });

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const res = await getNotes();
      setNotes(res.data);
    } catch {
      setError('Failed to load notes.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingNote) {
        await updateNote(editingNote.id, form);
      } else {
        await createNote(form);
      }
      setForm({ title: '', content: '' });
      setShowForm(false);
      setEditingNote(null);
      fetchNotes();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save note.');
    }
  };

  const handleEdit = (note) => {
    setEditingNote(note);
    setForm({ title: note.title, content: note.content });
    setShowForm(true);
    window.scrollTo(0, 0);
  };

  const handleCancel = () => {
    setEditingNote(null);
    setForm({ title: '', content: '' });
    setShowForm(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this note?')) return;
    try {
      await deleteNote(id);
      fetchNotes();
    } catch {
      setError('Failed to delete note.');
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) return <div style={styles.loading}>Loading notes...</div>;

  return (
    <div style={styles.container}>

      <div style={styles.topBar}>
        <h2 style={styles.heading}>Notes & Handover</h2>
        <button style={styles.primaryBtn} onClick={() => showForm ? handleCancel() : setShowForm(true)}>
          {showForm ? 'Cancel' : '+ New Note'}
        </button>
      </div>

      <p style={styles.subtitle}>
        A shared knowledge base for the committee. Use this to document processes,
        contacts, and important information for future committees.
      </p>

      {error && <p style={styles.error}>{error}</p>}

      {/* Create / Edit form */}
      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <h3 style={styles.formTitle}>
            {editingNote ? 'Edit Note' : 'Create New Note'}
          </h3>

          <label style={styles.label}>Title *</label>
          <input
            style={styles.input}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Note title"
            required
          />

          <label style={styles.label}>Content *</label>
          <textarea
            style={styles.textarea}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="Write your note here..."
            rows={8}
            required
          />

          <div style={styles.formActions}>
            <button type="button" style={styles.cancelBtn} onClick={handleCancel}>
              Cancel
            </button>
            <button type="submit" style={styles.primaryBtn}>
              {editingNote ? 'Save Changes' : 'Create Note'}
            </button>
          </div>
        </form>
      )}

      {/* Notes list */}
      {notes.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyTitle}>No notes yet</p>
          <p style={styles.emptyDesc}>
            Start building your society's knowledge base by creating the first note.
          </p>
        </div>
      ) : (
        <div style={styles.noteList}>
          {notes.map((note) => (
            <div key={note.id} style={styles.noteCard}>
  <div style={styles.noteAccent} />
  {/* rest of card content */}
              <div style={styles.noteHeader}>
                <h3 style={styles.noteTitle}>{note.title}</h3>
                <div style={styles.noteActions}>
                  <button
                    style={styles.editBtn}
                    onClick={() => handleEdit(note)}
                  >
                    Edit
                  </button>
                  {(user?.id === note.created_by || user?.role === 'president') && (
                    <button
                      style={styles.deleteBtn}
                      onClick={() => handleDelete(note.id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>

              <p style={styles.noteContent}>{note.content}</p>

              <div style={styles.noteMeta}>
                <span>By <strong>{note.created_by_name}</strong></span>
                <span>Last updated: {formatDate(note.updated_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { padding: '0' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' },
  heading: { fontSize: '2rem', fontWeight: '800', color: '#111111', letterSpacing: '-0.5px' },
  subtitle: { fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem', fontWeight: '500' },
  loading: { padding: '2rem', textAlign: 'center', color: '#6b7280' },
  error: { color: '#dc2626', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.875rem' },
  form: { backgroundColor: '#ffffff', padding: '1.75rem', borderRadius: '12px', border: '1px solid #e5e5e5', marginBottom: '1.5rem' },
  formTitle: { marginBottom: '1.25rem', color: '#111111', fontWeight: '700', fontSize: '1.1rem' },
  label: { fontSize: '0.875rem', fontWeight: '600', color: '#111111', display: 'block', marginBottom: '0.4rem' },
  input: { width: '100%', padding: '0.65rem 0.9rem', marginBottom: '1rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.95rem' },
  textarea: { width: '100%', padding: '0.65rem 0.9rem', marginBottom: '1rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.95rem', resize: 'vertical', lineHeight: '1.6' },
  formActions: { display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' },
  primaryBtn: { padding: '0.6rem 1.25rem', backgroundColor: '#d97706', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer' },  cancelBtn: { padding: '0.6rem 1.25rem', backgroundColor: 'transparent', color: '#374151', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.875rem', cursor: 'pointer' },
  noteList: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  noteCard: { backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e5e5', position: 'relative', overflow: 'hidden' },
  noteAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: '#111111', borderRadius: '12px 0 0 12px' },
  noteHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' },
  noteTitle: { fontSize: '1.05rem', fontWeight: '700', color: '#111111', flex: 1, marginRight: '1rem', letterSpacing: '-0.25px' },
  noteActions: { display: 'flex', gap: '0.5rem', flexShrink: 0 },
  noteContent: { fontSize: '0.9rem', color: '#4b5563', lineHeight: '1.7', marginBottom: '1rem', whiteSpace: 'pre-wrap' },
  noteMeta: { display: 'flex', gap: '1.5rem', fontSize: '0.8rem', color: '#9ca3af', fontWeight: '500' },
  editBtn: { padding: '0.3rem 0.75rem', backgroundColor: 'transparent', color: '#111111', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '500', cursor: 'pointer' },
  deleteBtn: { padding: '0.3rem 0.75rem', backgroundColor: 'transparent', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' },
  emptyState: { textAlign: 'center', padding: '3rem', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e5e5e5' },
  emptyTitle: { fontSize: '1rem', fontWeight: '700', color: '#111111', marginBottom: '0.5rem' },
  emptyDesc: { fontSize: '0.875rem', color: '#6b7280' },
};

export default Notes;