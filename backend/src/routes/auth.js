const express = require('express');
const router = express.Router();

const { register, login, getUsers, getMe, updateMe, createUser, updateUser, deleteUser } = require('../controllers/authController');
const { authenticateToken, authorizeRole } = require('../middlewares/auth');

//routes pour login et register
router.post('/register', register);
router.post('/login', login);

// récupération des utilisateurs
// Autoriser admin, staff et medecin (pour lister les patients)
router.get('/users', authenticateToken, authorizeRole('admin', 'staff', 'medecin'), getUsers);

// Route pour récupérer l'utilisateur actuel
router.get('/me', authenticateToken, getMe);

// Route pour mettre à jour l'utilisateur actuel
router.put('/me', authenticateToken, updateMe);

// Admin routes for user management (CRUD)
router.post('/users', authenticateToken, authorizeRole('admin'), createUser);
router.put('/users/:id', authenticateToken, authorizeRole('admin'), updateUser);
router.delete('/users/:id', authenticateToken, authorizeRole('admin'), deleteUser);

module.exports = router;