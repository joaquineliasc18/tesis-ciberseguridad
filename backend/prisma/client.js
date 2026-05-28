/**
 * Cliente de Prisma para interactuar con la base de datos PostgreSQL
 * Configuración centralizada y reutilizable en toda la aplicación
 * Optimizado para funciones serverless (Vercel)
 */

const { PrismaClient } = require('@prisma/client');

// Singleton global para reutilizar conexiones entre invocaciones serverless
let prisma;

if (process.env.NODE_ENV === 'production') {
  // En producción (Vercel serverless), usar instancia global
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['error', 'warn'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      // Configuración optimizada para Supabase Pooler (pool de conexiones)
      connection: {
        connectionTimeoutMillis: 5000,
      },
    });
    
    // Conectar explícitamente y manejar errores
    global.prisma.$connect()
      .then(() => console.log('✅ Prisma conectado a Supabase'))
      .catch((err) => {
        console.error('❌ Error conectando Prisma:', err.message);
        // No lanzar error para permitir reconexión automática
      });
  }
  prisma = global.prisma;
} else {
  // En desarrollo, crear nueva instancia con logs completos
  prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

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