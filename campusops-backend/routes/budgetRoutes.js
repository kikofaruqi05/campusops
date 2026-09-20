const express = require('express');
const router = express.Router();
const { getAllEntries, getSummary, createEntry, deleteEntry } = require('../controllers/budgetController');
const { verifyToken, authorise } = require('../middleware/auth');

router.use(verifyToken);

// Only presidents and treasurers can access budget routes
router.get('/', authorise('president', 'treasurer'), getAllEntries);
router.get('/summary', authorise('president', 'treasurer'), getSummary);
router.post('/', authorise('president', 'treasurer'), createEntry);
router.delete('/:id', authorise('president', 'treasurer'), deleteEntry);

module.exports = router;