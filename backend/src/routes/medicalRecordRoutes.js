const express = require('express');
const router = express.Router();
const { getMedicalRecords, createMedicalRecord, updateMedicalRecord, deleteMedicalRecord } = require('../controllers/medicalRecordController');
const { authenticateToken, authorizeRole } = require('../middlewares/auth');

router.get('/', authenticateToken, authorizeRole(['medecin']), getMedicalRecords);
router.post('/', authenticateToken, authorizeRole(['medecin']), createMedicalRecord);
router.put('/:id', authenticateToken, authorizeRole(['medecin']), updateMedicalRecord);
router.delete('/:id', authenticateToken, authorizeRole(['medecin']), deleteMedicalRecord);

module.exports = router;