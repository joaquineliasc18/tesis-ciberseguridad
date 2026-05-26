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

const app = express();
const PORT = process.env.PORT || 3000;

// ========================================
// MIDDLEWARES
// ========================================

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
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

module.exports = app;