// ========================================
// USER SERVICE - Gestión de usuarios
// Maneja creación, validación y búsqueda de usuarios
// ========================================

const bcrypt = require('bcryptjs');
const prisma = require('../prisma/client');

/**
 * Crear un nuevo usuario con contraseña hasheada
 * @param {Object} userData - { email, password, name, role }
 * @returns {Promise<Object>} Usuario creado (sin password)
 */
async function createUser({ email, password, name, role = 'USER' }) {
  try {
    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      throw new Error('El email ya está registrado');
    }

    // Hashear contraseña con bcrypt (10 salt rounds)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario en base de datos
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        role,
        isActive: true
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
        // NO incluir password en respuesta
      }
    });

    console.log(`✅ Usuario creado exitosamente: ${user.email} (${user.role})`);
    return user;

  } catch (error) {
    console.error('❌ Error al crear usuario:', error.message);
    throw error;
  }
}

/**
 * Validar credenciales de usuario (email + password)
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña en texto plano
 * @returns {Promise<Object|null>} Usuario si credenciales válidas, null si no
 */
async function validateUser(email, password) {
  try {
    // Buscar usuario por email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      console.log(`⚠️ Usuario no encontrado: ${email}`);
      return null;
    }

    // Verificar si usuario está activo
    if (!user.isActive) {
      console.log(`⚠️ Usuario inactivo: ${email}`);
      return null;
    }

    // Comparar password con hash almacenado
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log(`⚠️ Contraseña incorrecta para: ${email}`);
      return null;
    }

    console.log(`✅ Credenciales válidas para: ${email}`);

    // Retornar usuario sin password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;

  } catch (error) {
    console.error('❌ Error al validar usuario:', error.message);
    throw error;
  }
}

/**
 * Obtener usuario por ID
 * @param {string} userId - UUID del usuario
 * @returns {Promise<Object|null>} Usuario encontrado o null
 */
async function getUserById(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      console.log(`⚠️ Usuario no encontrado con ID: ${userId}`);
      return null;
    }

    return user;

  } catch (error) {
    console.error('❌ Error al obtener usuario:', error.message);
    throw error;
  }
}

/**
 * Obtener usuario por email
 * @param {string} email - Email del usuario
 * @returns {Promise<Object|null>} Usuario encontrado o null
 */
async function getUserByEmail(email) {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return user;

  } catch (error) {
    console.error('❌ Error al obtener usuario por email:', error.message);
    throw error;
  }
}

/**
 * Actualizar usuario (nombre, rol, estado)
 * @param {string} userId - UUID del usuario
 * @param {Object} updateData - Datos a actualizar
 * @returns {Promise<Object>} Usuario actualizado
 */
async function updateUser(userId, updateData) {
  try {
    const allowedFields = ['name', 'role', 'isActive'];
    const dataToUpdate = {};

    // Filtrar solo campos permitidos
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        dataToUpdate[key] = updateData[key];
      }
    });

    const user = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    });

    console.log(`✅ Usuario actualizado: ${user.email}`);
    return user;

  } catch (error) {
    console.error('❌ Error al actualizar usuario:', error.message);
    throw error;
  }
}

/**
 * Desactivar usuario (soft delete)
 * @param {string} userId - UUID del usuario
 * @returns {Promise<boolean>} True si exitoso
 */
async function deactivateUser(userId) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false }
    });

    console.log(`✅ Usuario desactivado: ${userId}`);
    return true;

  } catch (error) {
    console.error('❌ Error al desactivar usuario:', error.message);
    throw error;
  }
}

module.exports = {
  createUser,
  validateUser,
  getUserById,
  getUserByEmail,
  updateUser,
  deactivateUser
};
