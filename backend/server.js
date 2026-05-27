/**
 * Servidor principal - Automated Document Processor
 * Node.js + Express + PostgreSQL + Prisma ORM + n8n Integration + JWT Auth
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const fileRoutes = require('./routes/fileRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const prisma = require('./prisma/client');

const app = express();
const PORT = process.env.PORT || 3000;

// ========================================
// DATABASE INITIALIZATION (for serverless)
// ========================================

// Inicializar conexión a BD en serverless
if (process.env.NODE_ENV === 'production') {
  prisma.$connect()
    .then(() => console.log('✅ Prisma conectado a la base de datos'))
    .catch((err) => console.error('❌ Error conectando Prisma:', err.message));
}

// ========================================
// MIDDLEWARES
// ========================================

// CORS configuration
const corsOptions = {
  origin: process.env.VERCEL 
    ? ['https://ciberseguridad-eight.vercel.app', 'http://localhost:3000']
    : (process.env.FRONTEND_URL || 'http://localhost:3000'),
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../frontend')));

// ========================================
// API ROUTES
// ========================================

// Authentication routes (🔐 /api/auth/*)
app.use('/api/auth', authRoutes);

// Admin routes (🔐 /api/admin/* - ADMIN only)
app.use('/api/admin', adminRoutes);

// File management routes (🔐 /api/files/*)
app.use('/api/files', fileRoutes);

// ========================================
// FRONTEND ROUTES
// ========================================

// Página principal (dashboard)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Página de login
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

// Página de registro
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/register.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    environment: {
      NODE_ENV: process.env.NODE_ENV || 'development',
      DATABASE_URL: process.env.DATABASE_URL ? '✅ Configurado' : '❌ NO configurado',
      JWT_SECRET: process.env.JWT_SECRET ? '✅ Configurado' : '❌ NO configurado',
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ? '✅ Configurado' : '❌ NO configurado',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '✅ Configurado' : '❌ NO configurado',
      N8N_WEBHOOK_URL: process.env.N8N_WEBHOOK_URL ? '✅ Configurado' : '❌ NO configurado',
    },
    features: {
      authentication: true,
      chatgpt: process.env.USE_CHATGPT_RECOMMENDATIONS === 'true',
      n8n: process.env.USE_N8N_INTEGRATION === 'true'
    }
  });
});

// Manejo de errores
app.use((error, req, res, next) => {
  console.error('Error no manejado:', error);
  
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'El archivo es demasiado grande. Máximo permitido: 10MB'
    });
  }
  
  if (error.message.includes('Tipo de archivo no permitido')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  res.status(500).json({
    success: false,
    message: 'Error interno del servidor'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint no encontrado'
  });
});

// Inicializar servidor (solo en desarrollo, no en Vercel)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const server = app.listen(PORT, () => {
    console.log('🚀 ===============================================');
    console.log('� Automated Document Processor');
    console.log('🚀 ===============================================');
    console.log(`🌐 Servidor ejecutándose en: http://localhost:${PORT}`);
    console.log(`📊 API disponible en: http://localhost:${PORT}/api/files`);
    console.log(`💻 Frontend disponible en: http://localhost:${PORT}`);
    console.log('🚀 ===============================================');
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('🛑 Cerrando servidor...');
    server.close(() => {
      console.log('✅ Servidor cerrado exitosamente');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('🛑 Cerrando servidor...');
    server.close(() => {
      console.log('✅ Servidor cerrado exitosamente');
      process.exit(0);
    });
  });
}

// Exportar app para Vercel
module.exports = app;