const express = require('express');
const router = express.Router();
const { getMessages, createMessage } = require('../controllers/messageController');
const { authenticateToken } = require('../middlewares/auth');

// role-based restrictions can be handled by controller if needed
router.get('/', authenticateToken, getMessages);
router.post('/', authenticateToken, createMessage);

module.exports = router;