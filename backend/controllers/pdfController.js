/**
 * Controlador para generación de informes PDF
 */

const PDFReportService = require('../services/pdfReportService');
const path = require('path');
const fs = require('fs');

class PDFController {
    constructor() {
        this.pdfService = new PDFReportService();
    }

    /**
     * Generar PDF de evaluación de ciberseguridad
     */
    async generateCyberSecurityPDF(evaluationData, fileId) {
        try {
            console.log(`📄 Generando PDF para evaluación: ${fileId}`);

            // Generar nombre único para referencia
            const timestamp = Date.now();
            const safeId = fileId.substring(0, 8);
            const fileName = `informe_ciberseguridad_${safeId}_${timestamp}.pdf`;

            // Generar PDF en memoria (compatible con Vercel serverless)
            const result = await this.pdfService.generateSecurityReport(evaluationData, null);

            if (result.success && result.buffer) {
                // Convertir Buffer a Base64 para almacenamiento en BD
                const base64Data = result.buffer.toString('base64');
                
                console.log(`✅ PDF generado en memoria: ${fileName} (${Math.round(result.fileSize / 1024)}KB)`);
                return {
                    success: true,
                    buffer: result.buffer,
                    base64Data: base64Data,
                    reportFilename: fileName,
                    fileSize: result.fileSize,
                    // Usar prefijo base64:// para indicar que está en BD
                    reportPath: `base64://${fileName}`
                };
            } else {
                console.error(`❌ Error generando PDF: ${result.error}`);
                return {
                    success: false,
                    error: result.error
                };
            }

        } catch (error) {
            console.error('❌ Error en PDFController:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Validar si un archivo PDF existe
     */
    validatePDFExists(reportPath) {
        try {
            const fullPath = path.join(__dirname, '../..', reportPath);
            return fs.existsSync(fullPath);
        } catch (error) {
            return false;
        }
    }

    /**
     * Obtener información de un PDF
     */
    getPDFInfo(reportPath) {
        try {
            const fullPath = path.join(__dirname, '../..', reportPath);
            if (fs.existsSync(fullPath)) {
                const stats = fs.statSync(fullPath);
                return {
                    exists: true,
                    size: stats.size,
                    createdAt: stats.birthtime,
                    modifiedAt: stats.mtime
                };
            }
            return { exists: false };
        } catch (error) {
            return { exists: false, error: error.message };
        }
    }
}

module.exports = PDFController;