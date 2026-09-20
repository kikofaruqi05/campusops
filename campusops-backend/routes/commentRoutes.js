const express = require('express');
const router = express.Router();
const { getCommentsByTask, addComment, deleteComment } = require('../controllers/commentController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/:taskId', getCommentsByTask);
router.post('/:taskId', addComment);
router.delete('/:id', deleteComment);

module.exports = router;