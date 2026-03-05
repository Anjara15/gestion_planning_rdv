const express = require('express');
const router = express.Router();
const { getTimeSlots, createTimeSlot, updateTimeSlot, deleteTimeSlot, adminListTimeSlots, approveTimeSlot, rejectTimeSlot } = require('../controllers/timeSlotController');
const { authenticateToken, authorizeRole } = require('../middlewares/auth');

// Admin: list all shared time slots with extended filters/pagination (must be declared before /:id)
router.get('/admin', authenticateToken, authorizeRole('admin', 'staff'), adminListTimeSlots);

// Routes protégées pour médecins
router.get('/', authenticateToken, authorizeRole('medecin', 'admin'), getTimeSlots);
router.post('/', authenticateToken, authorizeRole('medecin', 'admin'), createTimeSlot);
router.put('/:id', authenticateToken, authorizeRole('medecin', 'admin'), updateTimeSlot);
router.delete('/:id', authenticateToken, authorizeRole('medecin', 'admin'), deleteTimeSlot);

// Admin: approve/reject a time slot
router.post('/:id/approve', authenticateToken, authorizeRole('admin', 'staff'), approveTimeSlot);
router.post('/:id/reject', authenticateToken, authorizeRole('admin', 'staff'), rejectTimeSlot);

module.exports = router;