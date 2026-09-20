const express = require('express');
const router = express.Router();
const {
  getAllTasks,
  createTask,
  updateTaskStatus,
  updateTask,
  deleteTask,
  getUsers,
} = require('../controllers/taskController');
const { verifyToken, authorise } = require('../middleware/auth');

// All task routes require a valid token
router.use(verifyToken);

// Get all users (for assignee dropdown)
router.get('/users', getUsers);

// Get all tasks
router.get('/', getAllTasks);

// Create a task (president and treasurer only)
router.post('/', authorise('president', 'treasurer'), createTask);

// Update task status (any logged in user, controller checks ownership)
router.put('/:id/status', updateTaskStatus);

// Full task update (president and treasurer only)
router.put('/:id', authorise('president', 'treasurer'), updateTask);

// Delete a task (president and treasurer only)
router.delete('/:id', authorise('president', 'treasurer'), deleteTask);

module.exports = router;