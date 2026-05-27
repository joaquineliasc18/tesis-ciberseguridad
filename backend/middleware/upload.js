/**
 * Middleware de subida de archivos usando Multer
 * Configuración para almacenamiento en MEMORIA (compatible con Vercel Serverless)
 */

const multer = require('multer');
const path = require('path');

// Configuración de almacenamiento EN MEMORIA (para Vercel)
// Los archivos se guardan como Buffer en req.file.buffer
const storage = multer.memoryStorage();

// Filtro para validar tipos de archivo permitidos
const fileFilter = (req, file, cb) => {
  console.log(`📄 Archivo recibido: ${file.originalname}`);
  console.log(`🔍 MIME Type detectado: ${file.mimetype}`);
  console.log(`📁 Extensión: ${path.extname(file.originalname)}`);
  
  // Tipos MIME permitidos para CSV, JSON, PDF, Word y Excel
  const allowedTypes = [
    'text/csv',                        // Archivos CSV estándar
    'application/csv',                 // CSV alternativo
    'text/comma-separated-values',     // CSV variante
    'application/vnd.ms-excel',        // Algunos navegadores detectan CSV como Excel
    'text/plain',                      // Algunos sistemas detectan CSV como texto plano
    'application/json',                // Archivos JSON
    'text/json',                       // JSON alternativo
    'application/pdf',                 // PDF
    'application/msword',              // Word (.doc)
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // Word (.docx)
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'       // Excel (.xlsx)
  ];
  
  // Verificar extensión como respaldo
  const extension = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = ['.csv', '.json', '.pdf', '.doc', '.docx', '.xls', '.xlsx'];
  
  if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(extension)) {
    console.log('✅ Archivo aceptado');
    cb(null, true);
  } else {
    console.log('❌ Archivo rechazado - MIME:', file.mimetype, 'Extensión:', extension);
    cb(new Error(`Tipo de archivo no permitido. Detectado: ${file.mimetype}. Solo se aceptan CSV, JSON, PDF, Word (.doc, .docx) y Excel (.xls, .xlsx)`), false);
  }
};

// Configuración del middleware Multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // Límite de 10MB por archivo
  },
  fileFilter: fileFilter
});

module.exports = upload;