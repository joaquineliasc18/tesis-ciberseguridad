/**
 * Controlador de archivos - Sistema de gestión de documentos
 */

const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const prisma = require('../prisma/client');
const PDFController = require('./pdfController');
const SecurityEvaluationAnalyzer = require('../services/analyzeSecurityEvaluation');
const ChatGptRecommendationService = require('../services/chatGptRecommendationService');

// Inicializar servicios
const securityAnalyzer = new SecurityEvaluationAnalyzer();
const chatGptService = new ChatGptRecommendationService();

// Subir archivo (requiere autenticación)
const uploadFile = async (req, res) => {
  try {
    // Validar autenticación
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autenticación requerida'
      });
    }

    // Validar que se haya subido un archivo
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se ha proporcionado ningún archivo'
      });
    }

    const file = req.file;
    
    // Crear registro en la base de datos asociado al usuario
    // En Vercel, no guardamos filepath físico sino que procesamos desde memoria
    const fileRecord = await prisma.file.create({
      data: {
        id: uuidv4(),
        filename: file.originalname,
        filepath: `memory://${file.originalname}`, // Indicador de archivo en memoria
        status: 'PENDING',
        mimeType: file.mimetype,     // Tipo MIME del archivo
        fileSize: BigInt(file.size), // Tamaño en bytes (usar BigInt para números grandes)
        userId: req.user.id          // 🔐 Asociar archivo al usuario autenticado
      }
    });

    console.log(`✅ Archivo registrado en BD: ${fileRecord.id}`);

    // 🔥 PROCESAR CSV INMEDIATAMENTE si es evaluación de ciberseguridad
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      console.log(`📊 Procesando CSV de evaluación de ciberseguridad inmediatamente...`);
      
      try {
        // Leer CSV desde buffer (file.buffer está disponible con memoryStorage)
        const csvContent = file.buffer.toString('utf8');
        
        // Procesar evaluación con ChatGPT
        const evaluationData = await securityAnalyzer.processSecurityEvaluation(csvContent);
        console.log(`✅ Evaluación procesada - Nivel ${evaluationData.maturityLevel}/5`);
        
        // 🔥 ENVIAR DATOS PROCESADOS A N8N (si está habilitado)
        if (process.env.USE_N8N_INTEGRATION === 'true' && process.env.N8N_WEBHOOK_URL) {
          try {
            const n8nData = {
              fileId: fileRecord.id,
              filename: fileRecord.filename,
              status: 'COMPLETED',
              evaluation: {
                globalScore: evaluationData.globalScore,
                maturityLevel: evaluationData.maturityLevel,
                maturityName: evaluationData.maturityName,
                companyInfo: evaluationData.companyInfo,
                scores: evaluationData.scores,
                questionsAnalyzed: evaluationData.questionsAnalyzed,
                recommendations: evaluationData.recommendations,
                timestamp: evaluationData.timestamp
              },
              csvData: csvContent, // Enviar contenido CSV para que n8n pueda verlo
              processedAt: new Date().toISOString()
            };
            
            await axios.post(process.env.N8N_WEBHOOK_URL, n8nData, {
              timeout: 15000,
              headers: { 'Content-Type': 'application/json' }
            });
            console.log(`✅ Datos de evaluación enviados a n8n para archivo: ${fileRecord.id}`);
          } catch (webhookError) {
            console.error(`❌ Error enviando evaluación a n8n:`, webhookError.message);
          }
        }
        
        // Generar PDF
        const pdfController = new PDFController();
        const pdfResult = await pdfController.generateCyberSecurityPDF(evaluationData, fileRecord.id);
        
        // Actualizar registro con resultados y PDF en base64
        await prisma.file.update({
          where: { id: fileRecord.id },
          data: {
            status: 'COMPLETED',
            result: JSON.stringify(evaluationData),
            reportPath: pdfResult.success ? pdfResult.reportPath : null,
            pdfData: pdfResult.success ? pdfResult.base64Data : null
          }
        });
        
        console.log(`✅ Archivo ${fileRecord.id} procesado completamente`);
        
        // Responder con resultados completos
        return res.status(201).json({
          success: true,
          message: 'Archivo procesado exitosamente',
          data: {
            id: fileRecord.id,
            filename: fileRecord.filename,
            status: 'COMPLETED',
            evaluation: evaluationData,
            reportPath: pdfResult.success ? pdfResult.reportPath : null,
            createdAt: fileRecord.createdAt
          }
        });
        
      } catch (processingError) {
        console.error('❌ Error procesando CSV:', processingError);
        // Actualizar estado a ERROR
        await prisma.file.update({
          where: { id: fileRecord.id },
          data: { status: 'ERROR' }
        });
        
        return res.status(500).json({
          success: false,
          message: 'Error procesando el archivo CSV',
          error: processingError.message
        });
      }
    }

    // Responder exitosamente al cliente (para archivos no-CSV)
    res.status(201).json({
      success: true,
      message: 'Archivo subido exitosamente',
      data: {
        id: fileRecord.id,
        filename: fileRecord.filename,
        status: fileRecord.status,
        createdAt: fileRecord.createdAt
      }
    });

  } catch (error) {
    console.error('Error en uploadFile:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al procesar el archivo'
    });
  }
};

/**
 * Obtener información de un archivo específico por su ID
 * Requiere autenticación y verificación de propiedad
 * @param {Request} req - Objeto de solicitud con el ID del archivo
 * @param {Response} res - Objeto de respuesta Express
 */
const getFileById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validar autenticación
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autenticación requerida'
      });
    }

    // Buscar archivo en la base de datos
    const file = await prisma.file.findUnique({
      where: { id: id }
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Archivo no encontrado'
      });
    }

    // 🔐 Verificar propiedad (solo admin o dueño)
    if (req.user.role !== 'ADMIN' && file.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para acceder a este archivo'
      });
    }

    // Responder con la información del archivo
    res.json({
      success: true,
      data: {
        id: file.id,
        filename: file.filename,
        status: file.status,
        fileSize: file.fileSize ? Number(file.fileSize) : null, // Convertir BigInt a Number
        mimeType: file.mimeType,
        result: file.result ? JSON.parse(file.result) : null,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt
      }
    });

  } catch (error) {
    console.error('Error en getFileById:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al consultar el archivo'
    });
  }
};

/**
 * Obtener lista de archivos (filtrado por usuario/admin)
 * Con paginación opcional y filtros básicos
 * @param {Request} req - Objeto de solicitud con parámetros opcionales
 * @param {Response} res - Objeto de respuesta Express
 */
const getAllFiles = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Validar autenticación
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autenticación requerida'
      });
    }

    // 🔐 Construir filtros según rol del usuario
    const where = {};
    
    // Filtrar por status si se proporciona
    if (status) {
      where.status = status.toUpperCase();
    }

    // Si es USER, solo ver sus archivos. Si es ADMIN, ver todos
    if (req.user.role === 'USER') {
      where.userId = req.user.id;
      console.log(`📁 Usuario ${req.user.email} consultando solo sus archivos`);
    } else if (req.user.role === 'ADMIN') {
      console.log(`👑 Admin ${req.user.email} consultando todos los archivos`);
    }

    // Consultar archivos con paginación
    const [files, totalCount] = await Promise.all([
      prisma.file.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }),
      prisma.file.count({ where })
    ]);

    // Responder con los archivos y metadatos de paginación
    res.json({
      success: true,
      data: files.map(file => {
        let evaluationSummary = null;
        
        // Si hay resultado, extraer información básica para la tabla
        if (file.result && file.status === 'COMPLETED') {
          try {
            const evaluationResult = JSON.parse(file.result);
            
            // Mapeo de niveles de madurez
            const maturityNames = {
              1: 'Inicial - Ad Hoc',
              2: 'Repetible - Básico',
              3: 'Definido - Intermedio',
              4: 'Gestionado - Avanzado',
              5: 'Optimizado - Líder'
            };
            
            const maturityLevel = evaluationResult.maturityLevel || 1;
            
            evaluationSummary = {
              maturityLevel: maturityLevel,
              globalScore: evaluationResult.globalScore || 0,
              maturityName: evaluationResult.maturityName || maturityNames[maturityLevel] || 'Sin evaluar'
            };
          } catch (parseError) {
            console.error('Error parseando resultado para listado:', parseError);
          }
        }

        return {
          id: file.id,
          filename: file.filename,
          status: file.status,
          hasResult: !!file.result,
          fileSize: file.fileSize ? Number(file.fileSize) : null, // Convertir BigInt a Number
          mimeType: file.mimeType,
          evaluationSummary: evaluationSummary,
          owner: file.user ? {
            id: file.user.id,
            name: file.user.name,
            email: file.user.email
          } : null,
          createdAt: file.createdAt,
          updatedAt: file.updatedAt
        };
      }),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalItems: totalCount,
        itemsPerPage: parseInt(limit)
      },
      userInfo: {
        role: req.user.role,
        filterApplied: req.user.role === 'USER' ? 'Mostrando solo tus archivos' : 'Mostrando todos los archivos'
      }
    });

  } catch (error) {
    console.error('Error en getAllFiles:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al consultar los archivos'
    });
  }
};

/**
 * Actualizar el estado y resultado de un archivo (usado por n8n)
 * @param {Request} req - Objeto de solicitud con datos de actualización
 * @param {Response} res - Objeto de respuesta Express
 */
const updateFileResult = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, result, reportPath } = req.body;

    // Validar datos requeridos
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'El estado (status) es requerido'
      });
    }

    console.log(`📊 Actualizando archivo ${id} con estado: ${status}`);
    
    // Preparar datos para actualización
    const updateData = {
      status: status.toUpperCase()
    };

    let pdfGenerationResult = null;

    // Si se proporciona resultado de evaluación, procesar según el tipo
    let evaluationData = null;
    if (result) {
      // Obtener información del archivo para determinar el tipo de procesamiento
      const fileInfo = await prisma.file.findUnique({
        where: { id: id }
      });

      if (!fileInfo) {
        return res.status(404).json({
          success: false,
          message: 'Archivo no encontrado'
        });
      }

      // Si es un CSV, intentar analizarlo como evaluación de ciberseguridad
      if (fileInfo.mimetype === 'text/csv' || fileInfo.filename.endsWith('.csv')) {
        console.log(`📊 Detectado archivo CSV - Analizando como evaluación de ciberseguridad`);
        
        try {
          let csvContent = null;
          
          // Verificar si el archivo está en memoria (Vercel serverless)
          if (fileInfo.filepath.startsWith('memory://')) {
            console.log(`⚠️ Archivo en memoria - n8n debe enviar el contenido procesado`);
            // Usar el resultado proporcionado por n8n
            if (typeof result === 'string') {
              evaluationData = JSON.parse(result);
            } else if (typeof result === 'object') {
              evaluationData = result;
            }
          } else {
            // Leer el contenido del archivo CSV del disco (solo en desarrollo local)
            csvContent = fs.readFileSync(fileInfo.filepath, 'utf8');
            // Procesar con el analizador de ciberseguridad (ahora asíncrono con ChatGPT)
            evaluationData = await securityAnalyzer.processSecurityEvaluation(csvContent);
            console.log(`✅ Evaluación de ciberseguridad procesada con ${evaluationData.dimensionRecommendations ? 'ChatGPT' : 'sistema interno'} - Nivel ${evaluationData.maturityLevel}/5`);
          }
          
        } catch (analyzeError) {
          console.error(`❌ Error analizando CSV de ciberseguridad:`, analyzeError);
          // Fallback al resultado original si el análisis falla
          if (typeof result === 'string') {
            try {
              evaluationData = JSON.parse(result);
            } catch (parseError) {
              console.error(`❌ Error parseando JSON de resultado:`, parseError);
            }
          } else if (typeof result === 'object') {
            evaluationData = result;
          }
        }
      } else {
        // Para otros tipos de archivo, usar el resultado original
        if (typeof result === 'string') {
          try {
            evaluationData = JSON.parse(result);
            console.log(`📈 Datos de evaluación parseados desde JSON string`);
          } catch (parseError) {
            console.error(`❌ Error parseando JSON de resultado:`, parseError);
          }
        } else if (typeof result === 'object') {
          evaluationData = result;
        }
      }
      
      if (evaluationData) {
        console.log(`📈 Generando PDF para evaluación de ciberseguridad...`);
        console.log(`🎯 Nivel de madurez: ${evaluationData.maturityLevel}/5`);
        
        // Crear instancia del controlador PDF
        const pdfController = new PDFController();
        
        // Generar PDF con los datos de evaluación
        pdfGenerationResult = await pdfController.generateCyberSecurityPDF(evaluationData, id);
        
        if (pdfGenerationResult.success) {
          updateData.reportPath = pdfGenerationResult.reportPath;
          updateData.pdfData = pdfGenerationResult.base64Data;
          console.log(`✅ PDF generado exitosamente: ${pdfGenerationResult.reportFilename}`);
        } else {
          console.error(`❌ Error generando PDF: ${pdfGenerationResult.error}`);
          // Continuar con la actualización aunque falle el PDF
        }

        // Guardar resultado de la evaluación
        updateData.result = JSON.stringify(evaluationData);
        console.log(`📈 Resultado de evaluación incluido - Nivel de madurez: ${evaluationData.maturityLevel}`);
      }
    }

    // Si se proporciona ruta del informe (fallback)
    if (reportPath && !updateData.reportPath) {
      updateData.reportPath = reportPath;
      console.log(`📄 Ruta del informe PDF (proporcionada): ${reportPath}`);
    }

    // Actualizar archivo en la base de datos
    const updatedFile = await prisma.file.update({
      where: { id: id },
      data: updateData
    });

    console.log(`✅ Archivo ${id} actualizado exitosamente a estado ${updatedFile.status}`);

    const response = {
      success: true,
      message: 'Evaluación de ciberseguridad completada exitosamente',
      data: {
        id: updatedFile.id,
        status: updatedFile.status,
        hasReport: !!updatedFile.reportPath,
        reportPath: updatedFile.reportPath,
        updatedAt: updatedFile.updatedAt
      }
    };

    // Agregar información del PDF si se generó
    if (pdfGenerationResult) {
      response.pdfGeneration = {
        success: pdfGenerationResult.success,
        filename: pdfGenerationResult.reportFilename,
        error: pdfGenerationResult.error
      };
    }

    res.json(response);

  } catch (error) {
    console.error('Error en updateFileResult:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Archivo no encontrado'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al actualizar el archivo'
    });
  }
};

// Función para descargar PDF (requiere autenticación y propiedad)
const downloadReport = async (req, res) => {
  try {
    const { id } = req.params;

    // Validar autenticación
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Autenticación requerida' });
    }

    const file = await prisma.file.findUnique({ 
      where: { id: id },
      select: {
        id: true,
        userId: true,
        reportPath: true,
        pdfData: true
      }
    });
    
    if (!file || (!file.reportPath && !file.pdfData)) {
      return res.status(404).json({ success: false, message: 'Informe no encontrado' });
    }

    // 🔐 Verificar propiedad (solo admin o dueño)
    if (req.user.role !== 'ADMIN' && file.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para descargar este informe'
      });
    }

    // Si el PDF está en base64 (Vercel serverless), enviarlo desde memoria
    if (file.pdfData) {
      console.log(`📊 Enviando PDF desde base64 (${Math.round(file.pdfData.length / 1024)}KB)`);
      
      const pdfBuffer = Buffer.from(file.pdfData, 'base64');
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Informe_Ciberseguridad_${id.slice(0, 8)}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      return res.send(pdfBuffer);
    }

    // Fallback: Leer desde filesystem (solo en desarrollo local)
    const fs = require('fs');
    let reportFullPath;
    if (file.reportPath.startsWith('/uploads/')) {
      reportFullPath = path.join(__dirname, '../../', file.reportPath.substring(1));
    } else {
      reportFullPath = path.resolve(file.reportPath);
    }

    console.log(`🔍 Buscando PDF en filesystem: ${reportFullPath}`);

    if (!fs.existsSync(reportFullPath)) {
      return res.status(404).json({ success: false, message: 'Archivo de informe no encontrado en el servidor' });
    }

    console.log(`📄 Descargando informe desde filesystem: Informe_Ciberseguridad_${id.slice(0, 8)}.pdf`);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Informe_Ciberseguridad_${id.slice(0, 8)}.pdf"`);
    
    const fileStream = fs.createReadStream(reportFullPath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('❌ Error en downloadReport:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// Función para obtener evaluación (requiere autenticación y propiedad)
const getCyberSecurityEvaluation = async (req, res) => {
  try {
    const { id } = req.params;

    // Validar autenticación
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Autenticación requerida' });
    }

    const file = await prisma.file.findUnique({ where: { id: id } });

    if (!file) {
      return res.status(404).json({ success: false, message: 'Archivo no encontrado' });
    }

    // 🔐 Verificar propiedad (solo admin o dueño)
    if (req.user.role !== 'ADMIN' && file.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para acceder a esta evaluación'
      });
    }

    const response = { id: file.id, filename: file.filename, status: file.status, hasReport: !!file.reportPath, evaluation: null };

    if (file.result && file.status === 'COMPLETED') {
      try {
        const evaluationResult = JSON.parse(file.result);
        
        // Mapeo de niveles de madurez (para archivos antiguos sin maturityName)
        const maturityNames = {
          1: 'Inicial - Ad Hoc',
          2: 'Repetible - Básico',
          3: 'Definido - Intermedio',
          4: 'Gestionado - Avanzado',
          5: 'Optimizado - Líder'
        };
        
        const maturityLevel = evaluationResult.maturityLevel || 1;
        const maturityName = evaluationResult.maturityName || maturityNames[maturityLevel] || 'Sin evaluar';
        
        response.evaluation = {
          globalScore: evaluationResult.globalScore || 0,
          maturityLevel: maturityLevel,
          maturityName: maturityName,
          maturityDescription: evaluationResult.maturityDescription || '',
          maturityColor: evaluationResult.maturityColor || '#6c757d',
          scores: evaluationResult.scores || {},
          recommendations: evaluationResult.recommendations || [],
          questionsAnalyzed: evaluationResult.questionsAnalyzed || 0,
          confidence: evaluationResult.confidence || 85,
          timestamp: evaluationResult.timestamp || file.updatedAt,
          evaluationId: evaluationResult.evaluationId || file.id,
          companyInfo: evaluationResult.companyInfo || {
            name: 'No especificado',
            email: 'No especificado',
            size: 'PYME'
          }
        };
      } catch (parseError) {
        console.error('❌ Error parseando resultado:', parseError);
        response.evaluation = { error: 'Error al procesar los resultados de evaluación' };
      }
    }

    res.json({ success: true, data: response });
  } catch (error) {
    console.error('❌ Error en getCyberSecurityEvaluation:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// Test de ChatGPT
const testChatGPT = async (req, res) => {
  try {
    console.log('🧪 Ejecutando test de ChatGPT desde API...');
    
    const testResult = await chatGptService.testConnection();
    
    if (testResult.success) {
      console.log('✅ Test ChatGPT exitoso');
      res.json({
        success: true,
        message: 'ChatGPT está funcionando correctamente',
        data: testResult
      });
    } else {
      console.log('❌ Test ChatGPT falló:', testResult.message);
      res.status(500).json({
        success: false,
        message: 'ChatGPT no está disponible',
        error: testResult.message,
        errorCode: testResult.error
      });
    }
    
  } catch (error) {
    console.error('❌ Error ejecutando test ChatGPT:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno ejecutando test ChatGPT',
      error: error.message
    });
  }
};

module.exports = {
  uploadFile,
  getFileById,
  getAllFiles,
  updateFileResult,
  downloadReport,
  getCyberSecurityEvaluation,
  testChatGPT
};