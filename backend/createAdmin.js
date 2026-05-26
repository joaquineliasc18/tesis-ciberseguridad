// Script para crear usuario administrador inicial
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const email = 'admin@sistema.com';
    const password = 'Admin123!'; // Cambiar después del primer login
    const name = 'Administrador';

    // Verificar si ya existe
    const existing = await prisma.user.findUnique({
      where: { email }
    });

    if (existing) {
      console.log('❌ El usuario admin@sistema.com ya existe');
      console.log('Email:', existing.email);
      console.log('Rol:', existing.role);
      return;
    }

    // Hash de contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear admin
    const admin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'ADMIN'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    console.log('✅ Usuario administrador creado exitosamente:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', admin.email);
    console.log('🔑 Password: Admin123!');
    console.log('👤 Nombre:', admin.name);
    console.log('🛡️  Rol:', admin.role);
    console.log('📅 Creado:', admin.createdAt.toLocaleString('es-ES'));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  IMPORTANTE: Cambia la contraseña después del primer login');

  } catch (error) {
    console.error('❌ Error creando administrador:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
