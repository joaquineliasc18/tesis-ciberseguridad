// ========================================
// TOKEN SERVICE - Gestión de JWT
// Maneja access tokens, refresh tokens y autenticación
// ========================================

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../prisma/client');

// Configuración desde variables de entorno
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';
const JWT_ACCESS_EXPIRATION = process.env.JWT_ACCESS_EXPIRATION || '15m';
const JWT_REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || '7d';

/**
 * Generar Access Token (JWT de corta duración)
 * @param {Object} user - Usuario { id, email, role }
 * @returns {string} JWT token
 */
function generateAccessToken(user) {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    type: 'access'
  };

  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRATION
  });

  console.log(`✅ Access token generado para: ${user.email}`);
  return token;
}

/**
 * Generar Refresh Token (UUID único hasheado)
 * @param {string} userId - UUID del usuario
 * @param {Object} metadata - { userAgent, ipAddress }
 * @returns {Promise<Object>} { token, tokenId }
 */
async function generateRefreshToken(userId, metadata = {}) {
  try {
    // Generar token aleatorio
    const rawToken = crypto.randomBytes(40).toString('hex');
    
    // Hashear token para almacenamiento seguro
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    // Calcular fecha de expiración
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 días

    // Guardar en base de datos
    const refreshToken = await prisma.refreshToken.create({
      data: {
        token: hashedToken,
        userId,
        userAgent: metadata.userAgent || null,
        ipAddress: metadata.ipAddress || null,
        expiresAt,
        isRevoked: false
      }
    });

    console.log(`✅ Refresh token creado para usuario: ${userId}`);

    // Retornar token sin hashear (solo esta vez)
    return {
      token: rawToken,
      tokenId: refreshToken.id
    };

  } catch (error) {
    console.error('❌ Error al generar refresh token:', error.message);
    throw error;
  }
}

/**
 * Verificar Access Token
 * @param {string} token - JWT token
 * @returns {Object|null} Payload decodificado o null si inválido
 */
function verifyAccessToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.type !== 'access') {
      console.log('⚠️ Token no es access token');
      return null;
    }

    return decoded;

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      console.log('⚠️ Token expirado');
    } else if (error.name === 'JsonWebTokenError') {
      console.log('⚠️ Token inválido');
    } else {
      console.error('❌ Error al verificar token:', error.message);
    }
    return null;
  }
}

/**
 * Verificar y validar Refresh Token
 * @param {string} rawToken - Token sin hashear
 * @returns {Promise<Object|null>} RefreshToken de DB o null
 */
async function verifyRefreshToken(rawToken) {
  try {
    // Hashear token para buscar en DB
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    // Buscar token en base de datos
    const refreshToken = await prisma.refreshToken.findUnique({
      where: { token: hashedToken },
      include: { user: true }
    });

    if (!refreshToken) {
      console.log('⚠️ Refresh token no encontrado');
      return null;
    }

    // Verificar si está revocado
    if (refreshToken.isRevoked) {
      console.log('⚠️ Refresh token revocado');
      return null;
    }

    // Verificar expiración
    if (new Date() > refreshToken.expiresAt) {
      console.log('⚠️ Refresh token expirado');
      
      // Limpiar token expirado
      await prisma.refreshToken.delete({
        where: { id: refreshToken.id }
      });
      
      return null;
    }

    // Verificar usuario activo
    if (!refreshToken.user.isActive) {
      console.log('⚠️ Usuario inactivo');
      return null;
    }

    console.log(`✅ Refresh token válido para: ${refreshToken.user.email}`);
    return refreshToken;

  } catch (error) {
    console.error('❌ Error al verificar refresh token:', error.message);
    throw error;
  }
}

/**
 * Revocar Refresh Token (logout)
 * @param {string} rawToken - Token sin hashear
 * @returns {Promise<boolean>} True si exitoso
 */
async function revokeRefreshToken(rawToken) {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    await prisma.refreshToken.updateMany({
      where: { token: hashedToken },
      data: { isRevoked: true }
    });

    console.log('✅ Refresh token revocado exitosamente');
    return true;

  } catch (error) {
    console.error('❌ Error al revocar refresh token:', error.message);
    throw error;
  }
}

/**
 * Revocar todos los refresh tokens de un usuario
 * @param {string} userId - UUID del usuario
 * @returns {Promise<number>} Cantidad de tokens revocados
 */
async function revokeAllUserTokens(userId) {
  try {
    const result = await prisma.refreshToken.updateMany({
      where: { 
        userId,
        isRevoked: false
      },
      data: { isRevoked: true }
    });

    console.log(`✅ ${result.count} tokens revocados para usuario: ${userId}`);
    return result.count;

  } catch (error) {
    console.error('❌ Error al revocar tokens:', error.message);
    throw error;
  }
}

/**
 * Limpiar refresh tokens expirados (tarea de mantenimiento)
 * @returns {Promise<number>} Cantidad de tokens eliminados
 */
async function cleanExpiredTokens() {
  try {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });

    console.log(`✅ ${result.count} tokens expirados eliminados`);
    return result.count;

  } catch (error) {
    console.error('❌ Error al limpiar tokens expirados:', error.message);
    throw error;
  }
}

/**
 * Generar par de tokens (access + refresh)
 * @param {Object} user - Usuario completo
 * @param {Object} metadata - { userAgent, ipAddress }
 * @returns {Promise<Object>} { accessToken, refreshToken }
 */
async function generateTokenPair(user, metadata = {}) {
  const accessToken = generateAccessToken(user);
  const { token: refreshToken } = await generateRefreshToken(user.id, metadata);

  return {
    accessToken,
    refreshToken
  };
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  cleanExpiredTokens,
  generateTokenPair
};
