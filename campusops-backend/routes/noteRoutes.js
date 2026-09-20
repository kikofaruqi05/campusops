const express = require('express');
const router = express.Router();
const { getAllNotes, createNote, updateNote, deleteNote } = require('../controllers/noteController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', getAllNotes);
router.post('/', createNote);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);

module.exports = router;