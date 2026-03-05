const express = require('express');
const router = express.Router();
const {
  getUserHistory,
  createHistoryEntry,
  updateHistoryEntry,
  deleteHistoryEntry,
} = require('../controllers/historyController');
const { authenticateToken, authorizeRole } = require('../middlewares/auth');

router.get('/', authenticateToken, authorizeRole('medecin', 'admin', 'staff'), getUserHistory);
router.post('/', authenticateToken, createHistoryEntry);
router.put('/:id', authenticateToken, authorizeRole('admin', 'staff'), updateHistoryEntry);
router.delete('/:id', authenticateToken, authorizeRole('admin', 'staff'), deleteHistoryEntry);

module.exports = router;
