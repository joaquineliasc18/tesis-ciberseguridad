// Controlador de funciones administrativas
const userService = require('../services/userService');
const prisma = require('../prisma/client');

/**
 * GET /api/admin/users
 * Obtener lista de todos los usuarios (solo ADMIN)
 */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            files: true,
            refreshTokens: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la lista de usuarios'
    });
  }
};

/**
 * PUT /api/admin/users/:userId/role
 * Cambiar el rol de un usuario (solo ADMIN)
 */
exports.updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    // Validar role
    if (!role || !['USER', 'ADMIN'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'El rol debe ser USER o ADMIN'
      });
    }

    // No permitir que el admin se quite a sí mismo el rol de admin
    if (req.user.id === userId && role === 'USER') {
      return res.status(400).json({
        success: false,
        message: 'No puedes cambiar tu propio rol de administrador'
      });
    }

    // Verificar que el usuario existe
    const user = await userService.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Actualizar rol
    const updatedUser = await userService.updateUser(userId, { role });

    res.json({
      success: true,
      message: `Rol actualizado a ${role} exitosamente`,
      user: updatedUser
    });
  } catch (error) {
    console.error('Error actualizando rol:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el rol del usuario'
    });
  }
};

/**
 * PUT /api/admin/users/:userId/status
 * Activar/desactivar un usuario (solo ADMIN)
 */
exports.updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    // Validar isActive
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'El estado debe ser true o false'
      });
    }

    // No permitir que el admin se desactive a sí mismo
    if (req.user.id === userId && !isActive) {
      return res.status(400).json({
        success: false,
        message: 'No puedes desactivar tu propia cuenta'
      });
    }

    // Verificar que el usuario existe
    const user = await userService.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Actualizar estado
    const updatedUser = await userService.updateUser(userId, { isActive });

    res.json({
      success: true,
      message: `Usuario ${isActive ? 'activado' : 'desactivado'} exitosamente`,
      user: updatedUser
    });
  } catch (error) {
    console.error('Error actualizando estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el estado del usuario'
    });
  }
};

/**
 * GET /api/admin/stats
 * Obtener estadísticas generales del sistema (solo ADMIN)
 */
exports.getSystemStats = async (req, res) => {
  try {
    const [totalUsers, activeUsers, totalFiles, usersByRole] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.file.count(),
      prisma.user.groupBy({
        by: ['role'],
        _count: true
      })
    ]);

    const stats = {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
        byRole: usersByRole.reduce((acc, item) => {
          acc[item.role] = item._count;
          return acc;
        }, {})
      },
      files: {
        total: totalFiles
      }
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas del sistema'
    });
  }
};
