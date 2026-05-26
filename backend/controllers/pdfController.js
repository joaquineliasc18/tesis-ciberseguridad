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

            // Crear nombre único para el archivo
            const timestamp = Date.now();
            const safeId = fileId.substring(0, 8);
            const fileName = `informe_ciberseguridad_${safeId}_${timestamp}.pdf`;
            
            // Ruta completa del archivo
            const reportsDir = path.join(__dirname, '../../uploads/reports');
            const fullPath = path.join(reportsDir, fileName);
            const relativePath = `/uploads/reports/${fileName}`;

            // Asegurar que el directorio existe
            if (!fs.existsSync(reportsDir)) {
                fs.mkdirSync(reportsDir, { recursive: true });
                console.log(`📁 Directorio de reportes creado: ${reportsDir}`);
            }

            // Generar el PDF
            const result = await this.pdfService.generateSecurityReport(evaluationData, fullPath);

            if (result.success) {
                console.log(`✅ PDF generado exitosamente: ${fileName}`);
                return {
                    success: true,
                    reportPath: relativePath,
                    reportFilename: fileName,
                    fullPath: fullPath,
                    fileSize: result.fileSize
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