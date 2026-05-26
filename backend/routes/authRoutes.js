// ========================================
// AUTH ROUTES - Rutas de autenticación
// Endpoints: /api/auth/*
// ========================================

const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

// ========================================
// RUTAS PÚBLICAS (sin autenticación)
// ========================================

/**
 * POST /api/auth/register
 * Registrar nuevo usuario
 * Body: { email, password, name, confirmPassword }
 */
router.post('/register', authController.register);

/**
 * POST /api/auth/login
 * Iniciar sesión
 * Body: { email, password }
 * Response: { user, tokens: { accessToken, refreshToken } }
 */
router.post('/login', authController.login);

/**
 * POST /api/auth/refresh
 * Renovar access token
 * Body: { refreshToken }
 * Response: { tokens: { accessToken } }
 */
router.post('/refresh', authController.refreshAccessToken);

/**
 * POST /api/auth/logout
 * Cerrar sesión (revocar refresh token específico)
 * Body: { refreshToken }
 */
router.post('/logout', authController.logout);

// ========================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ========================================

/**
 * GET /api/auth/me
 * Obtener información del usuario autenticado
 * Headers: Authorization: Bearer <access_token>
 * Response: { user: { id, email, name, role } }
 */
router.get('/me', requireAuth, authController.getCurrentUser);

/**
 * POST /api/auth/logout-all
 * Cerrar todas las sesiones del usuario
 * Headers: Authorization: Bearer <access_token>
 */
router.post('/logout-all', requireAuth, authController.logoutAll);

/**
 * PUT /api/auth/change-password
 * Cambiar contraseña
 * Headers: Authorization: Bearer <access_token>
 * Body: { currentPassword, newPassword, confirmPassword }
 */
router.put('/change-password', requireAuth, authController.changePassword);

module.exports = router;
