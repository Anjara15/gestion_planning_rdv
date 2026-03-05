const express = require('express');
const router = express.Router();
const { getAppointments, createAppointment, updateAppointment, deleteAppointment, getMyAppointments, getAvailableSlots, createAppointmentByPatient, getAvailableDoctors, assignDoctor, getPendingAppointments, approveAppointment, rejectAppointment } = require('../controllers/appointmentController');
const { authenticateToken, authorizeRole } = require('../middlewares/auth');

// Médecin, Admin, Staff: gérer les rendez-vous
router.get('/', authenticateToken, (req, res, next) => {
  if (!['medecin', 'admin', 'staff'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
}, getAppointments);
router.post('/', authenticateToken, authorizeRole('medecin'), createAppointment);
router.put('/:id', authenticateToken, authorizeRole('medecin'), updateAppointment);
router.delete('/:id', authenticateToken, deleteAppointment);

// Patient: mes rendez-vous et créneaux disponibles
router.get('/mine', authenticateToken, getMyAppointments);
router.get('/available-slots', authenticateToken, getAvailableSlots);
router.post('/book', authenticateToken, createAppointmentByPatient);

// Admin: disponibilité des médecins et assignation
router.get('/available-doctors', authenticateToken, authorizeRole('admin'), getAvailableDoctors);
router.post('/:id/assign-doctor', authenticateToken, authorizeRole('admin'), assignDoctor);

// Admin: pending appointments and approval/rejection
router.get('/pending', authenticateToken, authorizeRole('admin'), getPendingAppointments);
router.post('/:id/approve', authenticateToken, authorizeRole('admin'), approveAppointment);
router.post('/:id/reject', authenticateToken, authorizeRole('admin'), rejectAppointment);

module.exports = router;
