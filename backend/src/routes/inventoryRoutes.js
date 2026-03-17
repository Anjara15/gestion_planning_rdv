const express = require('express');
const router = express.Router();
const {
  getInventoryItems,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
} = require('../controllers/inventoryController');
const { authenticateToken, authorizeRole } = require('../middlewares/auth');

router.get('/', authenticateToken, authorizeRole(['admin', 'staff']), getInventoryItems);
router.post('/', authenticateToken, authorizeRole(['admin', 'staff']), createInventoryItem);
router.put('/:id', authenticateToken, authorizeRole(['admin', 'staff']), updateInventoryItem);
router.delete('/:id', authenticateToken, authorizeRole(['admin', 'staff']), deleteInventoryItem);

module.exports = router;
