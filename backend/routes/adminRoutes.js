// Rutas administrativas
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Todas las rutas requieren autenticación y rol de administrador
router.use(requireAuth, requireAdmin);

// Gestión de usuarios
router.get('/users', adminController.getAllUsers);
router.put('/users/:userId/role', adminController.updateUserRole);
router.put('/users/:userId/status', adminController.updateUserStatus);

// Estadísticas del sistema
router.get('/stats', adminController.getSystemStats);

module.exports = router;
