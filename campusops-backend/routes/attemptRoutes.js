const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { getAttemptsByTask, saveAttempt, deleteAttempt } = require('../controllers/attemptController');

router.get('/:taskId', verifyToken, getAttemptsByTask);
router.post('/:taskId', verifyToken, saveAttempt);
router.delete('/:id', verifyToken, deleteAttempt);

module.exports = router;