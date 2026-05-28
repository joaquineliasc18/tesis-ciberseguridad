/**
 * Cliente de Prisma para interactuar con la base de datos PostgreSQL
 * Configuración centralizada y reutilizable en toda la aplicación
 * Optimizado para funciones serverless (Vercel)
 */

const { PrismaClient } = require('@prisma/client');

// Singleton global para reutilizar conexiones entre invocaciones serverless
let prisma;

if (process.env.NODE_ENV === 'production') {
  // En producción (Vercel serverless), usar instancia global con connection pooling
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: process.env.DEBUG === 'true' ? ['query', 'error', 'warn'] : ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }
  prisma = global.prisma;
  
  // Asegurar que la conexión esté lista (sin await para no bloquear)
  prisma.$connect().catch((err) => {
    console.error('❌ Error inicial conectando Prisma:', err.message);
  });
} else {
  // En desarrollo, crear nueva instancia con logs completos
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
  }
  prisma = global.prisma;

  // Manejo graceful del cierre solo en desarrollo
  process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit();
  });

  process.on('SIGTERM', async () => {
    await prisma.$disconnect();
    process.exit();
  });
}

module.exports = prisma;