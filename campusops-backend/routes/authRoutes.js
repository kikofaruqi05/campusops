const express = require('express');
const router = express.Router();
const { register, login, getMembers, updateMemberRole } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/members', verifyToken, getMembers);
router.put('/members/:id/role', verifyToken, updateMemberRole);

module.exports = router;