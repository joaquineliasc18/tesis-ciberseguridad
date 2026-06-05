/**
 * Servicio de generación de informes PDF de Ciberseguridad
 * Genera informes profesionales con los resultados de evaluación
 */

const { jsPDF } = require('jspdf');
const fs = require('fs');
const path = require('path');
const ChatGptRecommendationService = require('./chatGptRecommendationService');

class PDFReportService {
    constructor() {
        // Inicializar servicio ChatGPT para resumen ejecutivo y próximos pasos
        this.chatGptService = new ChatGptRecommendationService();
        
        // Configuración de colores corporativos
        this.colors = {
            primary: [13, 110, 253],      // Azul principal
            success: [40, 167, 69],       // Verde éxito
            warning: [255, 193, 7],       // Amarillo advertencia  
            danger: [220, 53, 69],        // Rojo peligro
            info: [13, 202, 240],         // Azul información
            dark: [33, 37, 41],           // Gris oscuro
            light: [248, 249, 250]        // Gris claro
        };

        // Configuración de niveles de madurez
        this.maturityLevels = {
            1: { name: 'Inicial - Ad Hoc', color: this.colors.danger, description: 'Procesos informales y reactivos' },
            2: { name: 'Repetible - Básico', color: [253, 126, 20], description: 'Algunos procesos documentados' },
            3: { name: 'Definido - Intermedio', color: this.colors.warning, description: 'Procesos estandarizados' },
            4: { name: 'Gestionado - Avanzado', color: [32, 201, 151], description: 'Procesos medidos y controlados' },
            5: { name: 'Optimizado - Líder', color: this.colors.success, description: 'Mejora continua implementada' }
        };
    }

    /**
     * Dibujar texto justificado (alineación de ambos lados)
     */
    drawJustifiedText(doc, text, x, y, maxWidth, lineHeight = 6) {
        const lines = doc.splitTextToSize(text, maxWidth);
        
        lines.forEach((line, index) => {
            // No justificar la última línea
            if (index === lines.length - 1) {
                doc.text(line, x, y + (index * lineHeight));
                return;
            }
            
            // Justificar línea distribuyendo palabras
            const words = line.split(' ').filter(w => w.length > 0);
            if (words.length <= 1) {
                doc.text(line, x, y + (index * lineHeight));
                return;
            }

            // Evitar estiramiento excesivo cuando hay pocas palabras o línea corta.
            const lineWidth = doc.getTextWidth(line);
            const fillRatio = lineWidth / maxWidth;
            const minWordsToJustify = 6;
            const minFillRatioToJustify = 0.82;
            if (words.length < minWordsToJustify || fillRatio < minFillRatioToJustify) {
                doc.text(line, x, y + (index * lineHeight));
                return;
            }
            
            // Calcular ancho total de las palabras
            let totalWordsWidth = 0;
            words.forEach(word => {
                totalWordsWidth += doc.getTextWidth(word);
            });
            
            // Calcular espaciado entre palabras
            const totalGap = maxWidth - totalWordsWidth;
            const gapBetweenWords = totalGap / (words.length - 1);

            // Evitar separación visual extrema entre palabras.
            const baseSpaceWidth = doc.getTextWidth(' ');
            const maxGapMultiplier = 3.5;
            if (gapBetweenWords > (baseSpaceWidth * maxGapMultiplier)) {
                doc.text(line, x, y + (index * lineHeight));
                return;
            }
            
            // Dibujar cada palabra con el espaciado calculado
            let currentX = x;
            words.forEach((word, wordIndex) => {
                doc.text(word, currentX, y + (index * lineHeight));
                currentX += doc.getTextWidth(word) + gapBetweenWords;
            });
        });
        
        return y + (lines.length * lineHeight);
    }

    /**
     * Generar informe PDF completo de evaluación de ciberseguridad
     */
    async generateSecurityReport(evaluationData, reportPath) {
        try {
            console.log(`📄 Iniciando generación de PDF: ${reportPath}`);
            
            // Crear nuevo documento PDF
            const doc = new jsPDF();
            
            // Configurar fuente
            doc.setFont('helvetica');
            
            let yPosition = 20;

            // === PÁGINA 1: PORTADA ===
            yPosition = this.generateCoverPage(doc, evaluationData, yPosition);

            // Nueva página para contenido
            doc.addPage();
            yPosition = 20;

            // === PÁGINA 2: RESUMEN EJECUTIVO ===
            yPosition = this.generateExecutiveSummary(doc, evaluationData, yPosition);

            // === PÁGINAS 3+: ANÁLISIS POR DIMENSIONES ===
            doc.addPage();
            yPosition = 20;
            yPosition = this.generateDimensionAnalysis(doc, evaluationData, yPosition);

            // === PÁGINA FINAL: RESUMEN INTEGRADO ===
            doc.addPage();
            yPosition = 20;
            yPosition = await this.generateIntegratedSummary(doc, evaluationData, yPosition);

            // Generar PDF en memoria (Buffer) - compatible con Vercel serverless
            const pdfBuffer = doc.output('arraybuffer');
            const buffer = Buffer.from(pdfBuffer);

            console.log(`✅ PDF generado en memoria (${Math.round(buffer.length / 1024)}KB)`);
            return {
                success: true,
                buffer: buffer,
                fileSize: buffer.length,
                reportPath: null // No se guarda en filesystem
            };

        } catch (error) {
            console.error('❌ Error generando PDF:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Generar página de portada con diseño ejecutivo mejorado
     */
    generateCoverPage(doc, data, yPos) {
        // Fondo elegante para header
        doc.setFillColor(13, 110, 253); // Azul primario
        doc.rect(0, 0, 220, 80, 'F');
        
        // Agregar patrón decorativo sutil
        doc.setFillColor(30, 64, 175); // Azul oscuro
        doc.rect(0, 75, 220, 5, 'F');
        
        // Título principal
        yPos = 95;
        doc.setFontSize(32);
        doc.setTextColor(13, 110, 253);
        doc.setFont('helvetica', 'bold');
        doc.text('INFORME EJECUTIVO', 105, yPos, { align: 'center' });
        
        yPos += 12;
        doc.setFontSize(28);
        doc.text('EVALUACIÓN DE MADUREZ', 105, yPos, { align: 'center' });
        
        yPos += 12;
        doc.text('EN CIBERSEGURIDAD', 105, yPos, { align: 'center' });

        // Línea decorativa
        yPos += 10;
        doc.setDrawColor(13, 110, 253);
        doc.setLineWidth(1);
        doc.line(50, yPos, 160, yPos);

        // Subtítulo elegante
        yPos += 12;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('Análisis Integral basado en NIST Cybersecurity Framework 2.0', 105, yPos, { align: 'center' });

        // Cuadro de información de la empresa con diseño moderno
        yPos += 20;
        doc.setFillColor(248, 249, 250); // Gris muy claro
        doc.roundedRect(30, yPos, 150, 55, 5, 5, 'F');
        
        // Borde sutil
        doc.setDrawColor(13, 110, 253);
        doc.setLineWidth(0.5);
        doc.roundedRect(30, yPos, 150, 55, 5, 5, 'S');
        
        yPos += 12;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(13, 110, 253);
        doc.text('INFORMACIÓN DE LA ORGANIZACIÓN', 105, yPos, { align: 'center' });
        
        yPos += 10;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(50, 50, 50);
        
        // Información con iconos simulados
        const companyName = data.companyInfo?.name || 'Empresa Evaluada';
        const companyEmail = data.companyInfo?.email || 'No especificado';
        const companySize = data.companyInfo?.size || 'PYME';
        const evalDate = new Date(data.timestamp).toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        doc.text(`Organización: ${companyName}`, 40, yPos);
        yPos += 7;
        doc.text(`Contacto: ${companyEmail}`, 40, yPos);
        yPos += 7;
        doc.text(`Tamaño: ${companySize}`, 40, yPos);
        yPos += 7;
        doc.text(`Fecha de Evaluación: ${evalDate}`, 40, yPos);

        // Resultado principal - Nivel de madurez con diseño ejecutivo
        yPos += 20;
        const maturityLevel = data.maturityLevel || 1;
        const maturityInfo = this.maturityLevels[maturityLevel];
        const globalScore = data.globalScore || 0;
        
        // Cuadro compacto de resultado
        const boxHeight = 45;
        doc.setFillColor(...maturityInfo.color);
        doc.roundedRect(40, yPos, 130, boxHeight, 8, 8, 'F');
        
        // Sombra sutil del cuadro
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0);
        
        // Contenido del cuadro de resultado
        yPos += 12;
        doc.setFontSize(12);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text('NIVEL DE MADUREZ ALCANZADO', 105, yPos, { align: 'center' });
        
        yPos += 10;
        doc.setFontSize(24);
        doc.text(`NIVEL ${maturityLevel}`, 105, yPos, { align: 'center' });
        
        yPos += 9;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(maturityInfo.name, 105, yPos, { align: 'center' });

        // Puntuación global destacada
        yPos += 15;
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(50, yPos, 110, 25, 5, 5, 'F');

        // Pie de página de portada
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.setFont('helvetica', 'normal');
        doc.text('Este informe es confidencial y está destinado exclusivamente para uso interno de la organización evaluada.', 105, 280, { align: 'center' });
        doc.text('Sistema de Evaluación de Ciberseguridad | Powered by NIST CSF 2.0', 105, 286, { align: 'center' });

        return yPos;
    }

    /**
     * Generar resumen ejecutivo con diseño ejecutivo mejorado
     */
    generateExecutiveSummary(doc, data, yPos) {
        // Header de sección con fondo
        doc.setFillColor(248, 249, 250);
        doc.rect(0, yPos - 5, 220, 15, 'F');
        
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(13, 110, 253);
        doc.text('RESUMEN EJECUTIVO', 20, yPos + 5);
        
        // Línea decorativa
        doc.setDrawColor(13, 110, 253);
        doc.setLineWidth(0.8);
        doc.line(20, yPos + 8, 60, yPos + 8);

        yPos += 20;

        // Panel de métricas clave (KPIs)
        const maturityLevel = data.maturityLevel || 1;
        const globalScore = data.globalScore || 0;
        const questionsAnalyzed = data.questionsAnalyzed || 38;

        // Fondo del panel de KPIs
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(20, yPos, 170, 35, 5, 5, 'F');
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.5);
        doc.roundedRect(20, yPos, 170, 35, 5, 5, 'S');

        // KPI 1: Puntuación Global
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('Puntuación Global', 30, yPos + 10);
        
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        const maturityInfo = this.maturityLevels[maturityLevel];
        doc.setTextColor(...maturityInfo.color);
        doc.text(`${globalScore}`, 30, yPos + 22);
        
        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        doc.text('/100', 42, yPos + 22);

        // Separador vertical
        doc.setDrawColor(220, 220, 220);
        doc.line(73, yPos + 5, 73, yPos + 30);

        // KPI 2: Nivel de Madurez
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('Nivel de Madurez', 80, yPos + 10);
        
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...maturityInfo.color);
        doc.text(`${maturityLevel}`, 80, yPos + 22);
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        const maturityShortName = maturityInfo.name.split('-')[1].trim();
        doc.text(maturityShortName, 88, yPos + 22);

        // Separador vertical
        doc.line(118, yPos + 5, 118, yPos + 30);

        // KPI 3: Preguntas
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('Preguntas Analizadas', 125, yPos + 10);
        
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(59, 130, 246);
        doc.text(`${questionsAnalyzed}`, 125, yPos + 22);

        yPos += 45;

        // Descripción del nivel con mejor formato
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        const description = this.getMaturityDescription(maturityLevel, globalScore);
        yPos = this.drawJustifiedText(doc, description, 20, yPos, 170, 6);
        yPos += 15;

        // Sección de gráfico de barras mejorado
        doc.setFillColor(248, 249, 250);
        doc.rect(0, yPos - 5, 220, 15, 'F');
        
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(13, 110, 253);
        doc.text('PUNTUACIÓN POR DIMENSIONES NIST CSF 2.0', 20, yPos + 5);
        
        doc.setDrawColor(13, 110, 253);
        doc.setLineWidth(0.8);
        doc.line(20, yPos + 8, 115, yPos + 8);

        yPos += 20;
        const dimensions = data.scores || {};
        
        // Ordenar dimensiones por puntuación (mejores arriba)
        const sortedDimensions = Object.entries(dimensions).sort((a, b) => b[1].score - a[1].score);
        
        sortedDimensions.forEach(([key, dim], index) => {
            // Fondo alternado para mejor lectura
            if (index % 2 === 0) {
                doc.setFillColor(252, 252, 252);
                doc.rect(20, yPos - 4, 170, 16, 'F');
            }
            
            // Nombre de la dimensión
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(50, 50, 50);
            doc.text(dim.name, 22, yPos + 3);
            
            // Barra de progreso visual mejorada
            const barWidth = 80;
            const barHeight = 8;
            const barX = 105;
            const fillWidth = (dim.score / 100) * barWidth;
            
            // Fondo de la barra con borde
            doc.setFillColor(240, 240, 240);
            doc.roundedRect(barX, yPos - 2, barWidth, barHeight, 2, 2, 'F');
            
            // Relleno de la barra según puntuación con gradiente simulado
            const color = this.getScoreColor(dim.score);
            doc.setFillColor(...color);
            doc.roundedRect(barX, yPos - 2, fillWidth, barHeight, 2, 2, 'F');
            
            // Borde de la barra
            doc.setDrawColor(220, 220, 220);
            doc.setLineWidth(0.3);
            doc.roundedRect(barX, yPos - 2, barWidth, barHeight, 2, 2, 'S');
            
            // Puntuación numérica destacada
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...color);
            doc.text(`${dim.score}%`, barX + barWidth + 3, yPos + 4);
            
            yPos += 16;
        });

        yPos += 5;

        // Nota interpretativa profesional
        doc.setFillColor(255, 250, 240);
        doc.roundedRect(20, yPos, 170, 20, 5, 5, 'F');
        doc.setDrawColor(251, 191, 36);
        doc.setLineWidth(0.5);
        doc.roundedRect(20, yPos, 170, 20, 5, 5, 'S');
        
        yPos += 8;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(146, 64, 14);
        doc.text('INTERPRETACIÓN:', 25, yPos);
        
        yPos += 5;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(120, 53, 15);
        const interpretation = this.getInterpretation(globalScore);
        yPos = this.drawJustifiedText(doc, interpretation, 25, yPos, 165, 4);
        yPos += 8;

        return yPos;
    }

    /**
     * Obtener interpretación según puntuación
     */
    getInterpretation(score) {
        if (score >= 80) {
            return 'La organización demuestra una excelente madurez en ciberseguridad. Se recomienda mantener este nivel y buscar la optimización continua.';
        } else if (score >= 65) {
            return 'La organización presenta una madurez sólida con oportunidades específicas de mejora. El foco debe estar en las dimensiones con menor puntuación.';
        } else if (score >= 50) {
            return 'La organización tiene bases establecidas pero requiere inversión estratégica para fortalecer controles y procesos de seguridad.';
        } else if (score >= 35) {
            return 'Se recomienda priorizar la implementación de controles fundamentales y políticas básicas de seguridad de la información.';
        } else {
            return 'Es crítico establecer un programa formal de ciberseguridad, comenzando por controles básicos y políticas fundamentales.';
        }
    }

    /**
     * Generar análisis detallado
     */
    generateDetailedAnalysis(doc, data, yPos) {
        doc.setFontSize(18);
        doc.setTextColor(...this.colors.primary);
        doc.text('ANÁLISIS DETALLADO', 20, yPos);

        yPos += 15;
        doc.setFontSize(12);
        doc.setTextColor(...this.colors.dark);

        // Estadísticas generales
        doc.text(`Total de preguntas analizadas: ${data.questionsAnalyzed || 38}`, 20, yPos);
        yPos += 8;
        doc.text(`Dimensiones evaluadas: 7 (NIST Cybersecurity Framework)`, 20, yPos);
        yPos += 8;
        doc.text(`Fecha de procesamiento: ${new Date(data.timestamp).toLocaleString('es-ES')}`, 20, yPos);

        yPos += 20;

        // Detalles por dimensión
        const dimensions = data.scores || {};
        Object.entries(dimensions).forEach(([key, dim]) => {
            if (yPos > 250) {
                doc.addPage();
                yPos = 20;
            }

            // Nombre de dimensión
            doc.setFontSize(14);
            doc.setTextColor(...this.colors.primary);
            doc.text(dim.name, 20, yPos);
            
            yPos += 10;
            doc.setFontSize(11);
            doc.setTextColor(...this.colors.dark);
            
            // Detalles de la dimensión
            doc.text(`Puntuación: ${dim.score}/100 (${dim.obtained}/${dim.maximum} puntos)`, 25, yPos);
            yPos += 6;
            doc.text(`Preguntas evaluadas: ${dim.questions}`, 25, yPos);
            yPos += 6;
            doc.text(`Rating promedio: ${dim.rating.toFixed(1)}/5`, 25, yPos);
            
            yPos += 6;
            const analysis = this.getDimensionAnalysis(dim.score);
            doc.text(`Estado: ${analysis}`, 25, yPos);
            
            yPos += 15;
        });

        return yPos;
    }

    /**
     * Verificar y manejar salto de página automático
     */
    checkPageBreak(doc, yPos, requiredSpace = 30) {
        if (yPos + requiredSpace > 270) { // Dejar margen inferior
            doc.addPage();
            return 20; // Nueva posición Y en la nueva página
        }
        return yPos;
    }

    /**
     * Agregar texto justificado con manejo automático de páginas
     */
    addTextWithPageBreak(doc, text, x, yPos, fontSize = 10, maxWidth = 170) {
        doc.setFontSize(fontSize);
        const lines = doc.splitTextToSize(text, maxWidth);
        
        lines.forEach((line, index) => {
            yPos = this.checkPageBreak(doc, yPos, 10);
            
            // No justificar la última línea
            if (index === lines.length - 1) {
                doc.text(line, x, yPos);
                yPos += 6;
                return;
            }
            
            // Justificar línea distribuyendo palabras
            const words = line.split(' ').filter(w => w.length > 0);
            if (words.length <= 1) {
                doc.text(line, x, yPos);
                yPos += 6;
                return;
            }

            // Evitar justificación exagerada en líneas cortas o con pocas palabras.
            const lineWidth = doc.getTextWidth(line);
            const fillRatio = lineWidth / maxWidth;
            const minWordsToJustify = 6;
            const minFillRatioToJustify = 0.82;
            if (words.length < minWordsToJustify || fillRatio < minFillRatioToJustify) {
                doc.text(line, x, yPos);
                yPos += 6;
                return;
            }
            
            // Calcular ancho total de las palabras
            let totalWordsWidth = 0;
            words.forEach(word => {
                totalWordsWidth += doc.getTextWidth(word);
            });
            
            // Calcular espaciado entre palabras
            const totalGap = maxWidth - totalWordsWidth;
            const gapBetweenWords = totalGap / (words.length - 1);

            // Si la separación es excesiva, usar alineación normal para mantener legibilidad.
            const baseSpaceWidth = doc.getTextWidth(' ');
            const maxGapMultiplier = 3.5;
            if (gapBetweenWords > (baseSpaceWidth * maxGapMultiplier)) {
                doc.text(line, x, yPos);
                yPos += 6;
                return;
            }
            
            // Dibujar cada palabra con el espaciado calculado
            let currentX = x;
            words.forEach((word, wordIndex) => {
                doc.text(word, currentX, yPos);
                currentX += doc.getTextWidth(word) + gapBetweenWords;
            });
            
            yPos += 6;
        });
        
        return yPos;
    }

    /**
     * Generar análisis detallado por dimensiones
     */
    generateDimensionAnalysis(doc, data, yPos) {
        doc.setFontSize(18);
        doc.setTextColor(...this.colors.primary);
        doc.text('ANÁLISIS POR DIMENSIONES DE CIBERSEGURIDAD', 20, yPos);
        
        yPos += 15;
        
        const dimensions = data.scores || {};
        const dimensionRecommendations = data.dimensionRecommendations || {};
        
        Object.entries(dimensions).forEach(([key, dimension]) => {
            // Verificar si necesitamos nueva página para la dimensión completa
            yPos = this.checkPageBreak(doc, yPos, 60);
            
            // Título de la dimensión con cuadrado de color
            doc.setFontSize(16);
            doc.setTextColor(...this.colors.primary);
            
            // Dibujar cuadrado de color antes del título
            const scoreColor = this.getScoreColor(dimension.score);
            doc.setFillColor(...scoreColor);
            doc.rect(20, yPos - 8, 8, 8, 'F');
            
            // Título de la dimensión
            doc.text(dimension.name.toUpperCase(), 32, yPos);
            yPos += 12;
            
            // Puntuación de la dimensión
            doc.setFontSize(12);
            doc.setTextColor(...this.colors.dark);
            doc.text(`Puntuación obtenida: ${dimension.obtained}/${dimension.maximum} puntos (${dimension.score}%)`, 25, yPos);
            yPos += 8;
            
            // Barra visual de progreso
            const barWidth = 150;
            const fillWidth = (dimension.score / 100) * barWidth;
            const barColor = this.getScoreColor(dimension.score);
            
            // Fondo de la barra
            doc.setFillColor(240, 240, 240);
            doc.rect(25, yPos, barWidth, 6, 'F');
            
            // Relleno de la barra
            doc.setFillColor(...barColor);
            doc.rect(25, yPos, fillWidth, 6, 'F');
            yPos += 15;
            
            // Categorías NIST evaluadas
            const dimRecommendation = dimensionRecommendations[key];
            if (dimRecommendation && dimRecommendation.categories && dimRecommendation.categories.length > 0) {
                yPos = this.checkPageBreak(doc, yPos, 20);
                
                doc.setFontSize(10);
                doc.setTextColor(100, 100, 100);
                doc.text('Categorías NIST CSF 2.0 evaluadas:', 25, yPos);
                yPos += 6;
                
                dimRecommendation.categories.forEach(category => {
                    yPos = this.checkPageBreak(doc, yPos, 10);
                    doc.text(`• ${category}`, 30, yPos);
                    yPos += 5;
                });
                yPos += 5;
            }
            
            // Recomendación específica para esta dimensión con manejo de páginas
            if (dimRecommendation && dimRecommendation.recommendation) {
                yPos = this.checkPageBreak(doc, yPos, 20);
                
                doc.setFontSize(11);
                doc.setTextColor(...this.colors.dark);
                doc.text('Recomendaciones:', 25, yPos);
                yPos += 8;
                
                // Usar función con manejo automático de páginas
                doc.setTextColor(...this.colors.dark);
                yPos = this.addTextWithPageBreak(doc, dimRecommendation.recommendation, 25, yPos, 10, 165);
                yPos += 10;
            }
            
            // Línea separadora
            yPos = this.checkPageBreak(doc, yPos, 10);
            doc.setDrawColor(200, 200, 200);
            doc.line(20, yPos, 190, yPos);
            yPos += 15;
        });
        
        return yPos;
    }

    /**
     * Generar resumen integrado final con ChatGPT
     */
    async generateIntegratedSummary(doc, data, yPos) {
        doc.setFontSize(18);
        doc.setTextColor(...this.colors.primary);
        doc.text('RESUMEN EJECUTIVO INTEGRADO', 20, yPos);
        
        yPos += 15;
        
        try {
            // Intentar generar con ChatGPT
            console.log('🤖 Generando resumen ejecutivo con ChatGPT...');
            
            const globalData = {
                globalScore: data.globalScore,
                maturityLevel: data.maturityLevel
            };
            
            const chatGptSummary = await this.chatGptService.generateExecutiveSummary(
                data.companyInfo,
                globalData,
                data.scores
            );
            
            // Usar resumen de ChatGPT con manejo automático de páginas
            doc.setTextColor(...this.colors.dark);
            yPos = this.addTextWithPageBreak(doc, chatGptSummary, 20, yPos, 11, 170);
            yPos += 15;
            
            console.log('✅ Resumen ejecutivo generado con ChatGPT');
            
        } catch (error) {
            console.log('⚡ Error con ChatGPT, usando resumen fallback:', error.message);
            
            // Fallback al resumen interno con manejo automático de páginas
            const fallbackSummary = this.generateIntegratedSummaryText(data);
            doc.setTextColor(...this.colors.dark);
            yPos = this.addTextWithPageBreak(doc, fallbackSummary, 20, yPos, 11, 170);
            yPos += 15;
        }
        
        // Próximos pasos estratégicos con ChatGPT
        yPos = this.checkPageBreak(doc, yPos, 25);
        doc.setFontSize(14);
        doc.setTextColor(...this.colors.primary);
        doc.text('PRÓXIMOS PASOS ESTRATÉGICOS', 20, yPos);
        yPos += 12;
        
        try {
            // Intentar generar próximos pasos con ChatGPT
            console.log('🤖 Generando próximos pasos con ChatGPT...');
            
            const globalData = {
                globalScore: data.globalScore,
                maturityLevel: data.maturityLevel
            };
            
            const chatGptSteps = await this.chatGptService.generateStrategicNextSteps(
                data.companyInfo,
                globalData,
                data.scores
            );
            
            // Usar próximos pasos de ChatGPT con manejo automático de páginas
            doc.setTextColor(...this.colors.dark);
            yPos = this.addTextWithPageBreak(doc, chatGptSteps, 20, yPos, 10, 170);
            
            console.log('✅ Próximos pasos generados con ChatGPT');
            
        } catch (error) {
            console.log('⚡ Error con ChatGPT para próximos pasos, omitiendo sección fallback:', error.message);
            
            // Si ChatGPT falla, mostrar mensaje profesional
            const errorMessage = 'Los próximos pasos estratégicos personalizados estarán disponibles en la próxima versión del reporte.';
            doc.setTextColor(...this.colors.dark);
            yPos = this.addTextWithPageBreak(doc, errorMessage, 20, yPos, 10, 170);
        }
        
        return yPos;
    }

    /**
     * Obtener color según puntuación y niveles de madurez
     */
    getScoreColor(score) {
        if (score >= 90) return [27, 94, 32];   // Verde oscuro - Nivel 5 Óptimo 
        if (score >= 75) return [46, 160, 67];  // Verde excelente - Nivel 4 Gestionado
        if (score >= 50) return [102, 187, 106]; // Verde claro - Nivel 3 Definido  
        if (score >= 25) return [255, 193, 7];   // Amarillo - Nivel 2 Repetible
        return [244, 67, 54]; // Rojo crítico - Nivel 1 Inicial
    }

    /**
     * Generar texto de resumen integrado
     */
    generateIntegratedSummaryText(data) {
        const company = data.companyInfo?.name || 'La organización';
        const level = data.maturityLevel || 1;
        const globalScore = data.globalScore || 0;
        const dimensions = data.scores || {};
        
        // Identificar fortalezas y oportunidades
        const sortedDimensions = Object.entries(dimensions)
            .sort((a, b) => b[1].score - a[1].score);
        
        const strongestDimension = sortedDimensions[0] ? sortedDimensions[0][1].name : '';
        const weakestDimension = sortedDimensions[sortedDimensions.length - 1] ? sortedDimensions[sortedDimensions.length - 1][1].name : '';
        
        let summary = `${company} presenta un nivel ${level} de madurez en ciberseguridad con una puntuación global de ${globalScore}%. `;
        
        if (globalScore < 30) {
            summary += `La evaluación revela oportunidades significativas de mejora en todas las dimensiones de seguridad. Es fundamental establecer bases sólidas comenzando por ${weakestDimension.toLowerCase()} y construyendo gradualmente capacidades en las demás áreas. `;
        } else if (globalScore < 60) {
            summary += `La organización muestra un desarrollo sólido en varias áreas, destacando particularmente en ${strongestDimension.toLowerCase()}. Las principales oportunidades de mejora se concentran en ${weakestDimension.toLowerCase()}, donde inversiones focalizadas pueden generar mejoras significativas en la postura general de seguridad. `;
        } else if (globalScore < 80) {
            summary += `La organización demuestra una madurez considerable en ciberseguridad, con fortalezas notables en ${strongestDimension.toLowerCase()}. Para avanzar hacia la excelencia, se recomienda optimizar procesos en ${weakestDimension.toLowerCase()} y considerar la automatización de controles existentes. `;
        } else {
            summary += `La organización ha alcanzado un nivel excepcional de madurez en ciberseguridad, demostrando excelencia en ${strongestDimension.toLowerCase()}. Su postura de seguridad puede servir como referencia para la industria, y está posicionada para liderar innovaciones en el campo de la ciberseguridad. `;
        }
        
        summary += `La implementación sistemática de las recomendaciones específicas por dimensión permitirá fortalecer continuamente la resiliencia cibernética de la organización y proteger efectivamente sus activos críticos de negocio.`;
        
        return summary;
    }

    /**
     * Obtener próximos pasos estratégicos según madurez
     */
    getStrategicNextSteps(level, dimensions) {
        const baseSteps = {
            1: [
                'Establecer un comité de ciberseguridad con sponsorship ejecutivo',
                'Desarrollar políticas fundamentales de seguridad de la información', 
                'Implementar controles básicos de protección (MFA, antivirus, firewall)',
                'Crear un inventario inicial de activos críticos de negocio',
                'Establecer procedimientos básicos de backup y recuperación'
            ],
            2: [
                'Formalizar el programa de gobierno de ciberseguridad',
                'Implementar evaluaciones regulares de riesgos de seguridad',
                'Desarrollar capacidades básicas de monitoreo y detección',
                'Establecer procedimientos de respuesta a incidentes',
                'Crear programa de concientización para empleados'
            ],
            3: [
                'Implementar herramientas avanzadas de detección y respuesta',
                'Desarrollar métricas y KPIs de efectividad de controles',
                'Establecer procesos de gestión de vulnerabilidades',
                'Implementar controles de seguridad en desarrollo de software',
                'Crear capacidades de análisis de amenazas'
            ],
            4: [
                'Automatizar respuestas a incidentes comunes',
                'Implementar análisis predictivo de riesgos',
                'Desarrollar capacidades avanzadas de threat hunting',
                'Establecer colaboraciones con entidades de threat intelligence',
                'Optimizar procesos mediante orquestación de seguridad'
            ],
            5: [
                'Liderar iniciativas de innovación en ciberseguridad de la industria',
                'Desarrollar capacidades de investigación en amenazas emergentes',
                'Establecer centros de excelencia en seguridad',
                'Contribuir al desarrollo de estándares de la industria',
                'Mentorear a otras organizaciones en su camino hacia la madurez'
            ]
        };
        
        return baseSteps[level] || baseSteps[3];
    }

    /**
     * Generar página de recomendaciones (método legacy mantenido)
     */
    generateRecommendations(doc, data, yPos) {
        doc.setFontSize(18);
        doc.setTextColor(...this.colors.primary);
        doc.text('RECOMENDACIONES ESTRATÉGICAS', 20, yPos);

        yPos += 15;
        doc.setFontSize(12);
        doc.setTextColor(...this.colors.dark);

        // Recomendaciones principales
        const recommendations = data.recommendations || [];
        recommendations.forEach((rec, index) => {
            doc.setFontSize(12);
            doc.text(`${index + 1}.`, 25, yPos);
            
            yPos = this.drawJustifiedText(doc, rec, 35, yPos, 160, 6);
            yPos += 8;
        });

        // Próximos pasos
        yPos += 15;
        doc.setFontSize(14);
        doc.setTextColor(...this.colors.primary);
        doc.text('PRÓXIMOS PASOS RECOMENDADOS', 20, yPos);

        yPos += 15;
        doc.setFontSize(11);
        doc.setTextColor(...this.colors.dark);
        
        const nextSteps = this.getNextSteps(data.maturityLevel);
        nextSteps.forEach((step, index) => {
            yPos = this.drawJustifiedText(doc, `${index + 1}. ${step}`, 20, yPos, 170, 6);
            yPos += 5;
        });

        return yPos;
    }

    /**
     * Obtener color según puntuación
     */
    getScoreColor(score) {
        if (score >= 80) return this.colors.success;
        if (score >= 65) return [32, 201, 151];
        if (score >= 50) return this.colors.warning;
        if (score >= 35) return [253, 126, 20];
        return this.colors.danger;
    }

    /**
     * Obtener descripción del nivel de madurez
     */
    getMaturityDescription(level, score) {
        const descriptions = {
            1: `Su organización se encuentra en el nivel inicial de madurez en ciberseguridad (Puntuación: ${score}/100). 
                Los procesos son principalmente informales y reactivos. Es fundamental establecer políticas básicas 
                y procedimientos de seguridad para proteger los activos críticos de la organización.`,
            
            2: `Su organización ha alcanzado el nivel básico de madurez (Puntuación: ${score}/100). 
                Existen algunos procesos documentados, pero la implementación es inconsistente. 
                Se recomienda formalizar y estandarizar las prácticas de seguridad existentes.`,
            
            3: `Su organización se encuentra en un nivel intermedio de madurez (Puntuación: ${score}/100). 
                Los procesos están definidos y documentados, pero requieren mayor consistencia en su implementación. 
                Es momento de enfocarse en el monitoreo y la mejora continua.`,
            
            4: `Su organización ha logrado un nivel avanzado de madurez (Puntuación: ${score}/100). 
                Los procesos son medidos, controlados y gestionados efectivamente. 
                Se recomienda implementar tecnologías avanzadas y optimizar los procesos existentes.`,
            
            5: `Su organización es líder en madurez de ciberseguridad (Puntuación: ${score}/100). 
                Implementa mejora continua y optimización constante. 
                Puede servir como referencia para otras organizaciones del sector.`
        };
        return descriptions[level] || descriptions[3];
    }

    /**
     * Análisis específico por dimensión
     */
    getDimensionAnalysis(score) {
        if (score >= 80) return 'Excelente - Procesos optimizados';
        if (score >= 65) return 'Bueno - Requiere mejoras menores';
        if (score >= 50) return 'Aceptable - Necesita fortalecimiento';
        if (score >= 35) return 'Deficiente - Requiere atención inmediata';
        return 'Crítico - Acción urgente requerida';
    }

    /**
     * Próximos pasos según nivel
     */
    getNextSteps(level) {
        const steps = {
            1: [
                'Establecer una política básica de ciberseguridad',
                'Designar un responsable de seguridad',
                'Implementar controles básicos (antivirus, firewall)',
                'Realizar backup básico de datos críticos',
                'Capacitación básica en seguridad para empleados'
            ],
            2: [
                'Formalizar políticas y procedimientos existentes',
                'Realizar evaluación de riesgos inicial',
                'Implementar programa de formación estructurado',
                'Establecer proceso de gestión de incidentes',
                'Mejorar controles de acceso'
            ],
            3: [
                'Implementar monitoreo proactivo de seguridad',
                'Desarrollar plan formal de respuesta a incidentes',
                'Realizar evaluaciones periódicas de vulnerabilidades',
                'Establecer métricas de seguridad',
                'Integrar seguridad en procesos de negocio'
            ],
            4: [
                'Implementar SIEM y SOC avanzado',
                'Desarrollar capacidades de threat intelligence',
                'Realizar simulacros y ejercicios regulares',
                'Automatizar respuesta a incidentes',
                'Establecer programa de mejora continua'
            ],
            5: [
                'Liderar innovación en ciberseguridad del sector',
                'Implementar IA y ML para detección avanzada',
                'Establecer SOC centralizado',
                'Compartir conocimiento con la comunidad',
                'Investigar y desarrollar nuevas tecnologías'
            ]
        };
        return steps[level] || steps[3];
    }
}

module.exports = PDFReportService;