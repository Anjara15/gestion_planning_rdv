const express = require('express');
const router = express.Router();
const { getMedicalRecords, createMedicalRecord, updateMedicalRecord, deleteMedicalRecord } = require('../controllers/medicalRecordController');
const { authenticateToken, authorizeRole } = require('../middlewares/auth');

// both doctors and patients should be able to call these endpoints; logic in controller
router.get('/', authenticateToken, authorizeRole(['medecin', 'patient', 'admin', 'staff']), getMedicalRecords);
router.post('/', authenticateToken, authorizeRole(['medecin', 'patient', 'admin', 'staff']), createMedicalRecord);
router.put('/:id', authenticateToken, authorizeRole(['medecin', 'patient', 'admin', 'staff']), updateMedicalRecord);
router.delete('/:id', authenticateToken, authorizeRole(['medecin', 'patient', 'admin', 'staff']), deleteMedicalRecord);

module.exports = router;
