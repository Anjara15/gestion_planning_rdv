const express = require('express');
const router = express.Router();
const { getConsultations, createConsultation, updateConsultation, deleteConsultation } = require('../controllers/consultationController');
const { authenticateToken, authorizeRole } = require('../middlewares/auth');

router.get('/', authenticateToken, authorizeRole(['medecin']), getConsultations);
router.post('/', authenticateToken, authorizeRole(['medecin']), createConsultation);
router.put('/:id', authenticateToken, authorizeRole(['medecin']), updateConsultation);
router.delete('/:id', authenticateToken, authorizeRole(['medecin']), deleteConsultation);

module.exports = router;