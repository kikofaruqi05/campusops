import { useState, useEffect } from 'react';
import { getComments, addComment, deleteComment } from '../services/api';
import { useAuth } from '../context/AuthContext';

const TaskComments = ({ taskId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchComments();
  }, [taskId]);

  const fetchComments = async () => {
    try {
      const res = await getComments(taskId);
      setComments(res.data);
    } catch {
      setError('Failed to load comments.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await addComment(taskId, newComment);
      setNewComment('');
      fetchComments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add comment.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteComment(id);
      fetchComments();
    } catch {
      setError('Failed to delete comment.');
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB') + ' at ' + date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return <p style={styles.loading}>Loading comments...</p>;

  return (
    <div style={styles.container}>
      <h4 style={styles.heading}>Comments</h4>

      {error && <p style={styles.error}>{error}</p>}

      {/* Comment list */}
      {comments.length === 0 ? (
        <p style={styles.empty}>No comments yet.</p>
      ) : (
        <div style={styles.commentList}>
          {comments.map((comment) => (
            <div key={comment.id} style={styles.commentCard}>
              <div style={styles.commentHeader}>
                <span style={styles.author}>{comment.author_name}</span>
                <span style={styles.timestamp}>{formatDate(comment.created_at)}</span>
              </div>
              <p style={styles.content}>{comment.content}</p>
              {(user?.id === comment.user_id || user?.role === 'president') && (
                <button
                  style={styles.deleteBtn}
                  onClick={() => handleDelete(comment.id)}
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add comment form */}
      <form onSubmit={handleAddComment} style={styles.form}>
        <textarea
          style={styles.textarea}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          rows={2}
        />
        <button type="submit" style={styles.submitBtn} disabled={!newComment.trim()}>
          Post comment
        </button>
      </form>
    </div>
  );
};

const styles = {
  container: { marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f3f4f6' },
  heading: { fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.75rem' },
  loading: { fontSize: '0.875rem', color: '#6b7280' },
  error: { color: '#dc2626', fontSize: '0.875rem', marginBottom: '0.5rem' },
  empty: { fontSize: '0.875rem', color: '#9ca3af', marginBottom: '0.75rem' },
  commentList: { display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' },
  commentCard: { backgroundColor: '#f9fafb', padding: '0.75rem', borderRadius: '8px' },
  commentHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' },
  author: { fontSize: '0.8rem', fontWeight: '600', color: '#374151' },
  timestamp: { fontSize: '0.75rem', color: '#9ca3af' },
  content: { fontSize: '0.875rem', color: '#4b5563', marginBottom: '0.35rem' },
  deleteBtn: { background: 'none', border: 'none', color: '#9ca3af', fontSize: '0.75rem', cursor: 'pointer', padding: 0 },
  form: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  textarea: { width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.875rem', resize: 'vertical' },
  submitBtn: { alignSelf: 'flex-end', padding: '0.4rem 1rem', backgroundColor: '#4f46e5', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '0.875rem', cursor: 'pointer' },
};

export default TaskComments;