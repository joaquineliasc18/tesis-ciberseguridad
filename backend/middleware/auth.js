// ========================================
// AUTH MIDDLEWARE - Protección de rutas
// Verifica tokens JWT y permisos de usuario
// ========================================

const tokenService = require('../services/tokenService');
const userService = require('../services/userService');

/**
 * Middleware: Verificar autenticación (JWT válido)
 * Extrae token del header Authorization y valida
 */
async function requireAuth(req, res, next) {
  try {
    // Extraer token del header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No se proporcionó token de autenticación');
      return res.status(401).json({
        success: false,
        message: 'No se proporcionó token de autenticación'
      });
    }

    const token = authHeader.substring(7); // Remover "Bearer "

    // Verificar token
    let decoded;
    try {
      decoded = tokenService.verifyAccessToken(token);
    } catch (verifyError) {
      console.error('❌ Error verificando token:', verifyError.message);
      return res.status(401).json({
        success: false,
        message: 'Token inválido o expirado'
      });
    }

    if (!decoded) {
      console.log('❌ Token no pudo ser decodificado');
      return res.status(401).json({
        success: false,
        message: 'Token inválido o expirado'
      });
    }

    // Obtener usuario completo de la base de datos
    let user;
    try {
      user = await userService.getUserById(decoded.userId);
    } catch (dbError) {
      console.error('❌ Error consultando usuario:', dbError.message);
      return res.status(500).json({
        success: false,
        message: 'Error al consultar usuario'
      });
    }

    if (!user) {
      console.log('❌ Usuario no encontrado:', decoded.userId);
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    if (!user.isActive) {
      console.log('❌ Usuario desactivado:', user.email);
      return res.status(403).json({
        success: false,
        message: 'Usuario desactivado'
      });
    }

    // Adjuntar usuario al request para uso en controladores
    req.user = user;

    next();

  } catch (error) {
    console.error('❌ Error INESPERADO en middleware requireAuth:', error);
    console.error('Stack trace:', error.stack);
    return res.status(500).json({
      success: false,
      message: 'Error al verificar autenticación',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Middleware: Verificar rol de administrador
 * Debe ejecutarse DESPUÉS de requireAuth
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'No autenticado'
    });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado: Se requiere rol de administrador'
    });
  }

  next();
}

/**
 * Middleware: Verificar propiedad del recurso
 * Valida que el usuario sea dueño del recurso o administrador
 * @param {Function} getResourceOwnerIdFn - Función que extrae userId del recurso
 */
function requireOwnership(getResourceOwnerIdFn) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado'
        });
      }

      // Admin puede acceder a todo
      if (req.user.role === 'ADMIN') {
        return next();
      }

      // Obtener ID del dueño del recurso
      const resourceOwnerId = await getResourceOwnerIdFn(req);

      if (!resourceOwnerId) {
        return res.status(404).json({
          success: false,
          message: 'Recurso no encontrado'
        });
      }

      // Verificar propiedad
      if (resourceOwnerId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para acceder a este recurso'
        });
      }

      next();

    } catch (error) {
      console.error('❌ Error en middleware requireOwnership:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Error al verificar permisos'
      });
    }
  };
}

/**
 * Middleware: Autenticación opcional
 * Intenta autenticar pero no falla si no hay token
 * Útil para rutas que funcionan con/sin autenticación
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = tokenService.verifyAccessToken(token);

      if (decoded) {
        const user = await userService.getUserById(decoded.userId);
        if (user && user.isActive) {
          req.user = user;
        }
      }
    }

    next();

  } catch (error) {
    // No fallar en autenticación opcional
    next();
  }
}

/**
 * Middleware: Rate limiting por usuario
 * Limita cantidad de requests por tiempo
 * (Implementación básica - en producción usar redis)
 */
const rateLimits = new Map();

function rateLimit(maxRequests = 100, windowMs = 15 * 60 * 1000) {
  return (req, res, next) => {
    if (!req.user) {
      return next(); // Solo aplicar a usuarios autenticados
    }

    const userId = req.user.id;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Obtener requests del usuario
    let userRequests = rateLimits.get(userId) || [];

    // Limpiar requests antiguos
    userRequests = userRequests.filter(timestamp => timestamp > windowStart);

    // Verificar límite
    if (userRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Demasiadas solicitudes. Intenta más tarde.'
      });
    }

    // Agregar request actual
    userRequests.push(now);
    rateLimits.set(userId, userRequests);

    next();
  };
}

/**
 * Extraer metadata de request (para tokens)
 */
function extractRequestMetadata(req) {
  return {
    userAgent: req.headers['user-agent'] || 'Unknown',
    ipAddress: req.ip || req.connection.remoteAddress || 'Unknown'
  };
}

module.exports = {
  requireAuth,
  requireAdmin,
  requireOwnership,
  optionalAuth,
  rateLimit,
  extractRequestMetadata
};
