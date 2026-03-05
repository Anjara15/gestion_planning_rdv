const express = require('express');
const router = express.Router();
const {
  getSpecialties,
  createSpecialty,
  updateSpecialty,
  deleteSpecialty,
} = require('../controllers/specialtyController');
const { authenticateToken, authorizeRole } = require('../middlewares/auth');

router.get('/', getSpecialties);
router.post('/', authenticateToken, authorizeRole('admin', 'staff'), createSpecialty);
router.put('/:id', authenticateToken, authorizeRole('admin', 'staff'), updateSpecialty);
router.delete('/:id', authenticateToken, authorizeRole('admin', 'staff'), deleteSpecialty);

module.exports = router;
