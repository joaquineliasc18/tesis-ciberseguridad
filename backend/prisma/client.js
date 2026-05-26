/**
 * Cliente de Prisma para interactuar con la base de datos PostgreSQL
 * Configuración centralizada y reutilizable en toda la aplicación
 */

const { PrismaClient } = require('@prisma/client');

// Instancia singleton del cliente Prisma
// Evita múltiples conexiones innecesarias a la base de datos
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'], // Logs para debugging
});

// Manejo graceful del cierre de la aplicación
// Asegura que las conexiones se cierren correctamente
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit();
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit();
});

module.exports = prisma;