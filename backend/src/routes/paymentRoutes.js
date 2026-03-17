const express = require('express');
const router = express.Router();
const {
  getPayments,
  createPayment,
  updatePayment,
  deletePayment,
} = require('../controllers/PaymentController');
const { authenticateToken, authorizeRole } = require('../middlewares/auth');

// all authenticated users can hit endpoints, controller enforces restrictions
router.get('/', authenticateToken, authorizeRole(['admin','staff','medecin','patient']), getPayments);
router.post('/', authenticateToken, authorizeRole(['admin','staff','patient']), createPayment);
router.put('/:id', authenticateToken, authorizeRole(['admin','staff','patient']), updatePayment);
router.delete('/:id', authenticateToken, authorizeRole(['admin','staff','patient']), deletePayment);

module.exports = router;