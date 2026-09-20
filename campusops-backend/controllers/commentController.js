const db = require('../config/db');

/* GET /api/comments/:taskId
 * Returns all comments for a specific task */

const getCommentsByTask = async (req, res) => {
  const { taskId } = req.params;

  try {
    const [comments] = await db.query(`
      SELECT 
        c.id,
        c.content,
        c.created_at,
        u.full_name AS author_name
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.task_id = ?
      ORDER BY c.created_at ASC
    `, [taskId]);

    res.status(200).json(comments);
  } catch (err) {
    console.error('Get comments error:', err);
    res.status(500).json({ message: 'Failed to retrieve comments.' });
  }
};

/* POST /api/comments/:taskId
 * Adds a comment to a task
 * Any logged in user can comment */

const addComment = async (req, res) => {
  const { taskId } = req.params;
  const { content } = req.body;

  if (!content || content.trim() === '') {
    return res.status(400).json({ message: 'Comment content cannot be empty.' });
  }

  try {
    // Check the task exists
    const [tasks] = await db.query('SELECT id FROM tasks WHERE id = ?', [taskId]);
    if (tasks.length === 0) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    await db.query(
      'INSERT INTO comments (task_id, user_id, content) VALUES (?, ?, ?)',
      [taskId, req.user.id, content.trim()]
    );

    res.status(201).json({ message: 'Comment added successfully.' });
  } catch (err) {
    console.error('Add comment error:', err);
    res.status(500).json({ message: 'Failed to add comment.' });
  }
};

/* DELETE /api/comments/:id
 * Deletes a comment
 * Only the author or a president can delete */

const deleteComment = async (req, res) => {
  const { id } = req.params;

  try {
    const [comments] = await db.query('SELECT * FROM comments WHERE id = ?', [id]);
    if (comments.length === 0) {
      return res.status(404).json({ message: 'Comment not found.' });
    }

    const comment = comments[0];
    const isAuthor = comment.user_id === req.user.id;
    const isPresident = req.user.role === 'president';

    if (!isAuthor && !isPresident) {
      return res.status(403).json({ message: 'You can only delete your own comments.' });
    }

    await db.query('DELETE FROM comments WHERE id = ?', [id]);
    res.status(200).json({ message: 'Comment deleted.' });
  } catch (err) {
    console.error('Delete comment error:', err);
    res.status(500).json({ message: 'Failed to delete comment.' });
  }
};

module.exports = { getCommentsByTask, addComment, deleteComment };