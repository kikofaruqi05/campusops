const db = require('../config/db');

/* GET /api/tasks
 * Returns all tasks, joined with assignee and creator names */

const getAllTasks = async (req, res) => {
  try {
    const [tasks] = await db.query(`
      SELECT 
        t.id,
        t.title,
        t.description,
        t.status,
        t.priority,
        t.deadline,
        t.created_at,
        t.updated_at,
        t.event_id,
        assignee.full_name AS assigned_to_name,
        assignee.id AS assigned_to_id,
        creator.full_name AS created_by_name,
        e.name AS event_name
      FROM tasks t
      LEFT JOIN users assignee ON t.assigned_to = assignee.id
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN events e ON t.event_id = e.id
      ORDER BY t.created_at DESC
    `);
    res.status(200).json(tasks);
  } catch (err) {
    console.error('Get tasks error:', err);
    res.status(500).json({ message: 'Failed to retrieve tasks.' });
  }
};

/* POST /api/tasks
 * Creates a new task
 * Only presidents and treasurers can create tasks */

const createTask = async (req, res) => {
  const { title, description, priority, deadline, assigned_to, event_id } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Task title is required.' });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO tasks (title, description, priority, deadline, assigned_to, created_by, event_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description || null,
        priority || 'medium',
        deadline || null,
        assigned_to || null,
        req.user.id,
        event_id || null,
      ]
    );
    res.status(201).json({ message: 'Task created successfully.', taskId: result.insertId });
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ message: 'Failed to create task.' });
  }
};

/* PUT /api/tasks/:id/status
 * Updates the status of a task
 * Any user can update status of tasks assigned to them
 * Presidents and treasurers can update any task */

const updateTaskStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['todo', 'in_progress', 'done'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status value.' });
  }

  try {
    // Fetch the task to check ownership
    const [tasks] = await db.query('SELECT * FROM tasks WHERE id = ?', [id]);
    if (tasks.length === 0) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    const task = tasks[0];
    const isPrivileged = ['president', 'treasurer'].includes(req.user.role);
    const isAssignee = task.assigned_to === req.user.id;

    if (!isPrivileged && !isAssignee) {
      return res.status(403).json({ message: 'You can only update tasks assigned to you.' });
    }

    await db.query('UPDATE tasks SET status = ? WHERE id = ?', [status, id]);
    res.status(200).json({ message: 'Task status updated.' });
  } catch (err) {
    console.error('Update task status error:', err);
    res.status(500).json({ message: 'Failed to update task status.' });
  }
};

/* PUT /api/tasks/:id
 * Full update of a task (president/treasurer only) */

const updateTask = async (req, res) => {
  const { id } = req.params;
  const { title, description, priority, deadline, assigned_to, event_id, status } = req.body;

  try {
    const [tasks] = await db.query('SELECT * FROM tasks WHERE id = ?', [id]);
    if (tasks.length === 0) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    await db.query(
      `UPDATE tasks 
       SET title = ?, description = ?, priority = ?, deadline = ?, 
           assigned_to = ?, event_id = ?, status = ?
       WHERE id = ?`,
      [
        title,
        description || null,
        priority || 'medium',
        deadline || null,
        assigned_to || null,
        event_id || null,
        status || 'todo',
        id,
      ]
    );
    res.status(200).json({ message: 'Task updated successfully.' });
  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).json({ message: 'Failed to update task.' });
  }
};

/* DELETE /api/tasks/:id
 * Deletes a task (president/treasurer only) */

const deleteTask = async (req, res) => {
  const { id } = req.params;

  try {
    const [tasks] = await db.query('SELECT * FROM tasks WHERE id = ?', [id]);
    if (tasks.length === 0) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    await db.query('DELETE FROM tasks WHERE id = ?', [id]);
    res.status(200).json({ message: 'Task deleted successfully.' });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({ message: 'Failed to delete task.' });
  }
};

/* GET /api/tasks/users
 * Returns all users for the assignee dropdown */

const getUsers = async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, full_name, role FROM users ORDER BY full_name ASC');
    res.status(200).json(users);
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ message: 'Failed to retrieve users.' });
  }
};

module.exports = { getAllTasks, createTask, updateTaskStatus, updateTask, deleteTask, getUsers };