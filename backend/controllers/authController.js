// ========================================
// AUTH CONTROLLER - Endpoints de autenticación
// Maneja registro, login, logout, refresh, etc.
// ========================================

const userService = require('../services/userService');
const tokenService = require('../services/tokenService');
const { extractRequestMetadata } = require('../middleware/auth');

/**
 * POST /api/auth/register
 * Registrar nuevo usuario
 */
async function register(req, res) {
  try {
    const { email, password, name, confirmPassword } = req.body;

    // Validaciones básicas
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email, contraseña y nombre son requeridos'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 8 caracteres'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Las contraseñas no coinciden'
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email inválido'
      });
    }

    // Crear usuario (por defecto rol USER)
    const user = await userService.createUser({
      email,
      password,
      name,
      role: 'USER' // Siempre USER en registro público
    });

    console.log(`✅ Usuario registrado exitosamente: ${user.email}`);

    return res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('❌ Error en register:', error.message);

    if (error.message === 'El email ya está registrado') {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error al registrar usuario'
    });
  }
}

/**
 * POST /api/auth/login
 * Iniciar sesión y obtener tokens
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Validaciones básicas
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos'
      });
    }

    // Validar credenciales
    const user = await userService.validateUser(email, password);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email o contraseña incorrectos'
      });
    }

    // Generar tokens
    const metadata = extractRequestMetadata(req);
    const { accessToken, refreshToken } = await tokenService.generateTokenPair(user, metadata);

    console.log(`✅ Login exitoso: ${user.email}`);

    return res.status(200).json({
      success: true,
      message: 'Login exitoso',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: process.env.JWT_ACCESS_EXPIRATION || '15m'
      }
    });

  } catch (error) {
    console.error('❌ Error en login:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión'
    });
  }
}

/**
 * POST /api/auth/refresh
 * Renovar access token usando refresh token
 */
async function refreshAccessToken(req, res) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token requerido'
      });
    }

    // Verificar refresh token
    const tokenData = await tokenService.verifyRefreshToken(refreshToken);

    if (!tokenData) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token inválido o expirado'
      });
    }

    // Generar nuevo access token
    const newAccessToken = tokenService.generateAccessToken(tokenData.user);

    console.log(`✅ Access token renovado para: ${tokenData.user.email}`);

    return res.status(200).json({
      success: true,
      message: 'Token renovado exitosamente',
      tokens: {
        accessToken: newAccessToken,
        expiresIn: process.env.JWT_ACCESS_EXPIRATION || '15m'
      }
    });

  } catch (error) {
    console.error('❌ Error en refresh:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error al renovar token'
    });
  }
}

/**
 * POST /api/auth/logout
 * Cerrar sesión (revocar refresh token)
 */
async function logout(req, res) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token requerido'
      });
    }

    // Revocar refresh token
    await tokenService.revokeRefreshToken(refreshToken);

    console.log('✅ Logout exitoso');

    return res.status(200).json({
      success: true,
      message: 'Logout exitoso'
    });

  } catch (error) {
    console.error('❌ Error en logout:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error al cerrar sesión'
    });
  }
}

/**
 * POST /api/auth/logout-all
 * Cerrar todas las sesiones del usuario
 * Requiere autenticación (req.user)
 */
async function logoutAll(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    // Revocar todos los tokens del usuario
    const revokedCount = await tokenService.revokeAllUserTokens(req.user.id);

    console.log(`✅ ${revokedCount} sesiones cerradas para: ${req.user.email}`);

    return res.status(200).json({
      success: true,
      message: `${revokedCount} sesiones cerradas exitosamente`
    });

  } catch (error) {
    console.error('❌ Error en logout-all:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error al cerrar sesiones'
    });
  }
}

/**
 * GET /api/auth/me
 * Obtener información del usuario autenticado
 * Requiere autenticación (req.user)
 */
async function getCurrentUser(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        isActive: req.user.isActive,
        createdAt: req.user.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Error en getCurrentUser:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener usuario'
    });
  }
}

/**
 * PUT /api/auth/change-password
 * Cambiar contraseña del usuario autenticado
 * Requiere autenticación (req.user)
 */
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    // Validaciones
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe tener al menos 8 caracteres'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Las contraseñas no coinciden'
      });
    }

    // Validar contraseña actual
    const validUser = await userService.validateUser(req.user.email, currentPassword);

    if (!validUser) {
      return res.status(401).json({
        success: false,
        message: 'Contraseña actual incorrecta'
      });
    }

    // Cambiar contraseña (reutilizar createUser lógica)
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const prisma = require('../prisma/client');
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword }
    });

    // Revocar todos los tokens para forzar re-login
    await tokenService.revokeAllUserTokens(req.user.id);

    console.log(`✅ Contraseña cambiada para: ${req.user.email}`);

    return res.status(200).json({
      success: true,
      message: 'Contraseña cambiada exitosamente. Por favor inicia sesión nuevamente.'
    });

  } catch (error) {
    console.error('❌ Error en changePassword:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error al cambiar contraseña'
    });
  }
}

module.exports = {
  register,
  login,
  refreshAccessToken,
  logout,
  logoutAll,
  getCurrentUser,
  changePassword
};
