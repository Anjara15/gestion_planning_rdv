const express = require('express');
const router = express.Router();
const { getStats } = require('../controllers/statsController');
const { authenticateToken, authorizeRole } = require('../middlewares/auth');

router.get('/', authenticateToken, authorizeRole(['medecin', 'admin', 'staff']), getStats);

module.exports = router;
