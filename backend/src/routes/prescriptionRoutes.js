const express = require('express');
const router = express.Router();
const { getPrescriptions, createPrescription, updatePrescription, deletePrescription } = require('../controllers/PrescriptionController');
const { authenticateToken, authorizeRole } = require('../middlewares/auth');

router.get('/', authenticateToken, authorizeRole(['medecin']), getPrescriptions);
router.post('/', authenticateToken, authorizeRole(['medecin']), createPrescription);
router.put('/:id', authenticateToken, authorizeRole(['medecin']), updatePrescription);
router.delete('/:id', authenticateToken, authorizeRole(['medecin']), deletePrescription);

module.exports = router;