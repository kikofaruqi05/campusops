const db = require('../config/db');

const getAttemptsByTask = async (req, res) => {
  const { taskId } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT attempts.*, users.full_name FROM attempts JOIN users ON attempts.user_id = users.id WHERE attempts.task_id = ? ORDER BY attempts.updated_at DESC`,
      [taskId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch attempts' });
  }
};

const saveAttempt = async (req, res) => {
  const { taskId } = req.params;
  const { content } = req.body;
  const userId = req.user.id;
  if (!content || content.trim() === '') {
    return res.status(400).json({ message: 'Attempt content cannot be empty' });
  }
  try {
    const [existing] = await db.query(
      'SELECT id FROM attempts WHERE task_id = ? AND user_id = ?',
      [taskId, userId]
    );
    if (existing.length > 0) {
      await db.query(
        'UPDATE attempts SET content = ? WHERE task_id = ? AND user_id = ?',
        [content, taskId, userId]
      );
    } else {
      await db.query(
        'INSERT INTO attempts (task_id, user_id, content) VALUES (?, ?, ?)',
        [taskId, userId, content]
      );
    }
    res.json({ message: 'Attempt saved successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to save attempt' });
  }
};

const deleteAttempt = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  try {
    await db.query('DELETE FROM attempts WHERE id = ? AND user_id = ?', [id, userId]);
    res.json({ message: 'Attempt deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete attempt' });
  }
};

module.exports = { getAttemptsByTask, saveAttempt, deleteAttempt };
