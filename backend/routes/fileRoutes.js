/**
 * Rutas API - Gestión de archivos y evaluaciones de ciberseguridad
 * Sistema completo de análisis de madurez para PYMES
 * 🔐 Todas las rutas requieren autenticación JWT excepto webhook n8n
 */

const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const fileController = require('../controllers/fileController');
const { requireAuth } = require('../middleware/auth');

// ========================================
// ENDPOINTS PRINCIPALES (🔐 PROTEGIDOS)
// ========================================

// Subida de archivos CSV/JSON con respuestas de evaluación
// POST /api/files/upload
// Requiere: Authorization: Bearer <token>
router.post('/upload', requireAuth, upload.single('file'), fileController.uploadFile);

// Consulta de archivos (lista paginada filtrada por usuario/admin)
// GET /api/files
// Requiere: Authorization: Bearer <token>
router.get('/', requireAuth, fileController.getAllFiles);

// Consulta de archivo específico por ID (con verificación de propiedad)
// GET /api/files/:id
// Requiere: Authorization: Bearer <token>
router.get('/:id', requireAuth, fileController.getFileById);

// ========================================
// ENDPOINTS DE EVALUACIÓN DE CIBERSEGURIDAD (🔐 PROTEGIDOS)
// ========================================

// Obtener resultado completo de evaluación de madurez
// GET /api/files/:id/evaluation
// Requiere: Authorization: Bearer <token>
router.get('/:id/evaluation', requireAuth, fileController.getCyberSecurityEvaluation);

// Descargar informe PDF de evaluación
// GET /api/files/:id/report/download
// Requiere: Authorization: Bearer <token>
router.get('/:id/report/download', requireAuth, fileController.downloadReport);

// ========================================
// WEBHOOKS Y INTEGRACIÓN N8N (SIN AUTENTICACIÓN)
// ========================================

// Endpoint para n8n - Actualizar resultado de procesamiento
// PUT /api/files/:id/result
// NO requiere autenticación (llamado por n8n)
router.put('/:id/result', fileController.updateFileResult);

// ========================================
// DIAGNÓSTICOS Y TESTING (🔐 PROTEGIDO)
// ========================================

// Test de conexión con ChatGPT
// GET /api/files/test/chatgpt
// Requiere: Authorization: Bearer <token>
router.get('/test/chatgpt', requireAuth, fileController.testChatGPT);

module.exports = router;