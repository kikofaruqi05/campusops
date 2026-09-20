const express = require('express');
const router = express.Router();
const {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} = require('../controllers/eventController');
const { verifyToken, authorise } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', getAllEvents);
router.get('/:id', getEventById);
router.post('/', authorise('president', 'treasurer'), createEvent);
router.put('/:id', authorise('president', 'treasurer'), updateEvent);
router.delete('/:id', authorise('president', 'treasurer'), deleteEvent);

module.exports = router;