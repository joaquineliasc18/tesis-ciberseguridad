/**
 * Servicio de Análisis de Evaluación de Ciberseguridad
 * Procesa las 38 preguntas de la evaluación y calcula puntuaciones por dimensión
 */

const ChatGptRecommendationService = require('./chatGptRecommendationService');

class SecurityEvaluationAnalyzer {
    constructor() {
        // Inicializar servicio de recomendaciones ChatGPT
        this.chatGptService = new ChatGptRecommendationService();
        
        // Mapeo completo de preguntas a categorías NIST CSF 2.0
        this.QUESTION_NIST_MAPPING = {
            // DETECTAR
            "DE_AE_02": {
                dimension: "DETECTAR",
                categoria: "Análisis de Eventos Adversos",
                subcategoria: "Los eventos potencialmente adversos se analizan para comprender mejor las actividades asociadas",
                descripcion: "Análisis de eventos de inicio de sesión para detectar intentos con credenciales robadas"
            },
            "DE_CM_SC13": {
                dimension: "DETECTAR", 
                categoria: "Monitoreo continuo",
                subcategoria: "Actividad del personal/tecnología monitoreada (replay & impersonation)",
                descripcion: "Monitoreo de señales de suplantación en sesiones y canales"
            },
            "DE_CM_SC14": {
                dimension: "DETECTAR",
                categoria: "Monitoreo continuo", 
                subcategoria: "Actividad monitoreada (honeycreds/canaries para detección proactiva)",
                descripcion: "Uso de credenciales señuelo para detectar accesos indebidos"
            },
            "DE_CM_SC15": {
                dimension: "DETECTAR",
                categoria: "Monitoreo continuo",
                subcategoria: "Actividad monitoreada (detección de MFA prompt bombing)",
                descripcion: "Detección de intentos de bombardeo de solicitudes MFA"
            },
            "DE_CM_SC16": {
                dimension: "DETECTAR",
                categoria: "Monitoreo continuo",
                subcategoria: "Actividades/servicios externos monitoreados (dark/clear-web dumps)",
                descripcion: "Vigilancia de fuentes externas para detectar credenciales expuestas"
            },
            "DE_CM_AU_SC1": {
                dimension: "DETECTAR",
                categoria: "Monitoreo continuo",
                subcategoria: "Monitoreo de redes y servicios de red",
                descripcion: "Vigilancia de eventos de seguridad en infraestructura de red"
            },
            
            // GOBIERNO
            "GV_PO_AU_SC1": {
                dimension: "GOBIERNO",
                categoria: "Políticas, procesos y procedimientos", 
                subcategoria: "Políticas de autenticación establecidas, aprobadas y comunicadas",
                descripcion: "Establecimiento y comunicación de políticas de seguridad"
            },
            "GV_RA_SC2": {
                dimension: "GOBIERNO",
                categoria: "Evaluación del riesgo",
                subcategoria: "Evaluación periódica del riesgo de exposición de credenciales", 
                descripcion: "Evaluación regular de riesgos relacionados con credenciales"
            },
            "GV_SC_SUP_SC3": {
                dimension: "GOBIERNO",
                categoria: "Riesgos de la cadena de suministro",
                subcategoria: "Requisitos de ciberseguridad para terceros definidos en contratos",
                descripcion: "Definición de requisitos de seguridad para proveedores"
            },
            
            // IDENTIFICAR  
            "ID_AM_02": {
                dimension: "IDENTIFICAR",
                categoria: "Gestión de Activos",
                subcategoria: "Inventarios de software, servicios y sistemas mantenidos",
                descripcion: "Mantenimiento de inventarios actualizados de activos tecnológicos"
            },
            
            // IMPROVE
            "IM_GV_OV_PR_SC21": {
                dimension: "IMPROVE", 
                categoria: "Supervisión y desempeño",
                subcategoria: "Desempeño medido y reportado (KPIs de eficacia)",
                descripcion: "Medición de la eficacia de controles de seguridad"
            },
            "IM_GV_IM_TS_SC22": {
                dimension: "IMPROVE",
                categoria: "Mejora continua", 
                subcategoria: "Lecciones aprendidas y endurecimiento técnico periódico",
                descripcion: "Implementación de mejoras basadas en lecciones aprendidas"
            },
            
            // PROTEGER - Gestión de Identidad y Acceso
            "PR_AA_01": {
                dimension: "PROTEGER",
                categoria: "Gestión de Identidad, Autenticación y Acceso",
                subcategoria: "Las identidades y credenciales son gestionadas", 
                descripcion: "Gestión del ciclo de vida de identidades y credenciales"
            },
            "PR_AA_02": {
                dimension: "PROTEGER", 
                categoria: "Gestión de Identidad, Autenticación y Acceso",
                subcategoria: "Las identidades son verificadas antes de asociarlas a credenciales",
                descripcion: "Verificación de identidad antes de emitir credenciales"
            },
            "PR_AA_03": {
                dimension: "PROTEGER",
                categoria: "Gestión de Identidad, Autenticación y Acceso", 
                subcategoria: "Usuarios, servicios y hardware son autenticados",
                descripcion: "Autenticación de personas, servicios y dispositivos"
            },
            "PR_AA_05": {
                dimension: "PROTEGER",
                categoria: "Gestión de Identidad, Autenticación y Acceso",
                subcategoria: "Permisos de acceso y autorizaciones (mínimo privilegio, separación de funciones)",
                descripcion: "Implementación de principios de mínimo privilegio"
            },
            
            // PROTEGER - Seguridad de Datos
            "PR_DS_01": {
                dimension: "PROTEGER",
                categoria: "Seguridad de Datos",
                subcategoria: "Proteger confidencialidad/integridad/disponibilidad de datos en reposo",
                descripcion: "Protección de datos almacenados"
            },
            "PR_DS_02": {
                dimension: "PROTEGER", 
                categoria: "Seguridad de Datos",
                subcategoria: "Proteger confidencialidad/integridad/disponibilidad de datos en tránsito",
                descripcion: "Protección de datos durante transmisión"
            },
            "PR_DS_11": {
                dimension: "PROTEGER",
                categoria: "Seguridad de Datos",
                subcategoria: "Copias de seguridad creadas, protegidas, mantenidas y probadas",
                descripcion: "Gestión integral de respaldos de información"
            },
            
            // PROTEGER - Seguridad de Plataforma
            "PR_PS_01": {
                dimension: "PROTEGER",
                categoria: "Seguridad de Plataforma", 
                subcategoria: "Prácticas de gestión de configuración establecidas y aplicadas",
                descripcion: "Gestión de configuraciones base de sistemas"
            },
            "PR_PS_02": {
                dimension: "PROTEGER",
                categoria: "Seguridad de Plataforma",
                subcategoria: "Software mantenido/reemplazado/removido según riesgo", 
                descripcion: "Gestión del ciclo de vida del software"
            },
            "PR_PS_04": {
                dimension: "PROTEGER",
                categoria: "Seguridad de Plataforma",
                subcategoria: "Registros de log generados y disponibles para monitoreo continuo",
                descripcion: "Generación y centralización de registros de eventos"
            },
            "PR_PS_05": {
                dimension: "PROTEGER", 
                categoria: "Seguridad de Plataforma",
                subcategoria: "Prevenir instalación/ejecución de software no autorizado",
                descripcion: "Control de software instalado en sistemas"
            },
            "PR_PS_06": {
                dimension: "PROTEGER",
                categoria: "Seguridad de Plataforma",
                subcategoria: "Procesos de desarrollo seguro de software integrados", 
                descripcion: "Implementación de prácticas de desarrollo seguro"
            },
            
            // PROTEGER - Controles Específicos  
            "PR_AA_AA_SC4": {
                dimension: "PROTEGER",
                categoria: "Gestión de identidades, autenticación y control de acceso",
                subcategoria: "MFA resistente a phishing para usuarios, servicios y hardware",
                descripcion: "Autenticación multifactor robusta contra phishing"
            },
            "PR_DS_DS_SC6": {
                dimension: "PROTEGER", 
                categoria: "Seguridad de datos",
                subcategoria: "Datos sensibles/credenciales protegidos con hashing robusto",
                descripcion: "Protección criptográfica de credenciales almacenadas"
            },
            "PR_AA_PS_SC10": {
                dimension: "PROTEGER",
                categoria: "Gestión de identidades, autenticación y control de acceso",
                subcategoria: "Políticas de contraseñas que bloquean débiles/expuestas", 
                descripcion: "Políticas avanzadas de complejidad de contraseñas"
            },
            "PR_AT_AT_SC7": {
                dimension: "PROTEGER",
                categoria: "Conciencia y capacitación", 
                subcategoria: "Personal capacitado contra MFA-fatigue y consent-phishing",
                descripcion: "Capacitación especializada en amenazas de autenticación"
            },
            "PR_AA_AC_SC8": {
                dimension: "PROTEGER",
                categoria: "Gestión de identidades, autenticación y control de acceso",
                subcategoria: "Accesos temporales con aprobación (JIT/TAP)", 
                descripcion: "Gestión de accesos privilegiados temporales"
            },
            "PR_AA_AC_SC9": {
                dimension: "PROTEGER",
                categoria: "Gestión de identidades, autenticación y control de acceso",
                subcategoria: "Gestión de cuentas de servicio sin login interactivo",
                descripcion: "Gestión especializada de identidades no humanas"
            },
            "PR_IR_01": {
                dimension: "PROTEGER",
                categoria: "Resiliencia de Infraestructura Tecnológica", 
                subcategoria: "Proteger redes y entornos contra acceso no autorizado",
                descripcion: "Protección perimetral y de red"
            },
            
            // RECUPERAR
            "RC_RP_RP_SC20": {
                dimension: "RECUPERAR",
                categoria: "Planificación de la recuperación",
                subcategoria: "Planes de recuperación con reinscripción MFA segura", 
                descripcion: "Planes de recuperación post-compromiso de credenciales"
            },
            
            // RESPONDER
            "RS_AN_RS_AN_07": {
                dimension: "RESPONDER", 
                categoria: "Análisis de Incidentes",
                subcategoria: "Recolección y preservación de evidencia de incidentes",
                descripcion: "Gestión forense de evidencias digitales"
            },
            "RS_MI_MI_SC18": {
                dimension: "RESPONDER",
                categoria: "Mitigación",
                subcategoria: "Contención con revocación y re-binding seguro de autenticadores",
                descripcion: "Procedimientos de contención de incidentes de credenciales"
            },
            "RS_MI_MI_SC17": {
                dimension: "RESPONDER", 
                categoria: "Mitigación", 
                subcategoria: "Playbooks SOAR por técnica de credenciales comprometidas",
                descripcion: "Respuesta automatizada a incidentes de credenciales"
            },
            "RS_CO_CO_SC19": {
                dimension: "RESPONDER",
                categoria: "Comunicaciones",
                subcategoria: "Notificación y autoservicio seguro durante incidentes",
                descripcion: "Comunicación y autoservicio durante crisis de seguridad"
            }
        };

        // Máximos oficiales por dimensión (según la tabla del usuario)
        this.DIMENSION_MAX_SCORES = {
            "GOBIERNO": 15,
            "IDENTIFICAR": 5,
            "PROTEGER": 110,
            "DETECTAR": 25,
            "RESPONDER": 20,
            "RECUPERAR": 5,
            "IMPROVE": 10
        };

        // Nombres legibles de las dimensiones
        this.DIMENSION_NAMES = {
            "GOBIERNO": "Gobierno",
            "IDENTIFICAR": "Identificar",  
            "PROTEGER": "Proteger",
            "DETECTAR": "Detectar",
            "RESPONDER": "Responder", 
            "RECUPERAR": "Recuperar",
            "IMPROVE": "Mejorar"
        };
    }

    /**
     * Procesar CSV de evaluación de ciberseguridad
     */
    async processSecurityEvaluation(csvData) {
        try {
            console.log('🔍 Analizando evaluación de ciberseguridad...');
            
            // Inicializar contadores por dimensión
            const dimensionScores = {};
            const dimensionCounts = {};
            
            // Inicializar todas las dimensiones
            Object.keys(this.DIMENSION_MAX_SCORES).forEach(dimension => {
                dimensionScores[dimension] = 0;
                dimensionCounts[dimension] = 0;
            });

            // Variables para datos adicionales
            let companyName = 'Empresa Evaluada';
            let contactEmail = '';

            // Procesar cada línea del CSV
            const lines = csvData.split('\n');
            const evaluationQuestions = [];

            for (let i = 1; i < lines.length; i++) { // Saltar header
                const line = lines[i].trim();
                if (!line) continue;

                const parts = line.split(',');
                if (parts.length < 3) continue;

                const question = parts[0].replace(/"/g, '').trim();
                const answer = parts[1].replace(/"/g, '').trim();
                const dimension = parts[2].replace(/"/g, '').trim();

                // Capturar datos de empresa y email (están en la dimensión DATOS)
                if (question === 'EMAIL' || (dimension === 'DATOS' && question === 'EMAIL')) {
                    contactEmail = answer;
                    continue;
                } else if (question === 'EMPRESA' || (dimension === 'DATOS' && question === 'EMPRESA')) {
                    companyName = answer;
                    continue;
                }

                // Procesar preguntas de evaluación usando la dimensión del CSV
                if (dimension && this.DIMENSION_MAX_SCORES[dimension] !== undefined) {
                    // Convertir respuesta a puntuación numérica
                    const score = parseInt(answer) || 0;
                    
                    dimensionScores[dimension] += score;
                    dimensionCounts[dimension]++;
                    
                    evaluationQuestions.push({
                        question,
                        answer,
                        dimension,
                        score
                    });

                    console.log(`📝 ${question} -> ${dimension}: ${score} pts`);
                }
            }

            // Calcular puntuaciones finales por dimensión
            const finalScores = {};
            let totalScore = 0;
            let totalMaxScore = 0;

            Object.keys(this.DIMENSION_MAX_SCORES).forEach(dimension => {
                const maxScore = this.DIMENSION_MAX_SCORES[dimension];
                const obtainedScore = dimensionScores[dimension];
                const questionCount = dimensionCounts[dimension];
                
                // Calcular porcentaje: (puntos obtenidos / puntos máximos) * 100
                const percentage = maxScore > 0 ? Math.round((obtainedScore / maxScore) * 100) : 0;
                
                finalScores[dimension] = {
                    name: this.DIMENSION_NAMES[dimension],
                    score: percentage,
                    obtained: obtainedScore,
                    maximum: maxScore,
                    questions: questionCount,
                    rating: questionCount > 0 ? (obtainedScore / questionCount) : 0
                };

                totalScore += obtainedScore;
                totalMaxScore += maxScore;

                console.log(`📊 ${dimension}: ${obtainedScore}/${maxScore} = ${percentage}%`);
            });

            // Calcular nivel de madurez global
            const globalPercentage = Math.round((totalScore / totalMaxScore) * 100);
            const maturityLevel = this.calculateMaturityLevel(globalPercentage);
            const maturityInfo = this.getMaturityInfo(maturityLevel);

            // Información de la empresa para ChatGPT
            const companyInfo = {
                name: companyName,
                email: contactEmail,
                size: 'PYME'
            };

            // Generar recomendaciones con ChatGPT (asíncrono)
            const dimensionRecommendations = await this.generateDimensionRecommendations(
                finalScores, 
                evaluationQuestions, 
                companyInfo
            );

            const result = {
                companyInfo,
                globalScore: globalPercentage,
                maturityLevel,
                maturityName: maturityInfo.name,
                maturityColor: maturityInfo.color,
                maturityDescription: maturityInfo.description,
                scores: finalScores,
                questionsAnalyzed: evaluationQuestions.length,
                confidence: 95,
                timestamp: new Date().toISOString(),
                recommendations: this.generateRecommendations(finalScores, maturityLevel),
                dimensionRecommendations,
                rawData: evaluationQuestions
            };

            console.log(`✅ Análisis completado. Puntuación global: ${globalPercentage}% (Nivel ${maturityLevel})`);
            return result;

        } catch (error) {
            console.error('❌ Error analizando evaluación:', error);
            throw error;
        }
    }



    /**
     * Calcular nivel de madurez basado en puntuación global
     * Intervalos ajustados para reflejar realidad empresarial de ciberseguridad
     */
    calculateMaturityLevel(globalScore) {
        // Nivel 5 - Óptimo: Procesos maduros con mejora continua y <1% excepciones
        if (globalScore >= 90) return 5; // 90-100% - Excelencia y liderazgo en la industria
        
        // Nivel 4 - Gestionado: Procesos documentados con métricas y <5% excepciones  
        if (globalScore >= 75) return 4; // 75-89% - Madurez avanzada con optimización
        
        // Nivel 3 - Definido: Procesos formales documentados con <10% excepciones
        if (globalScore >= 50) return 3; // 50-74% - Base sólida con oportunidades de mejora
        
        // Nivel 2 - Repetible: Procesos ad hoc informales pero existentes
        if (globalScore >= 25) return 2; // 25-49% - Esfuerzos iniciales requieren formalización
        
        // Nivel 1 - Inicial: No existen procesos estándar
        return 1; // 0-24% - Necesidad crítica de establecer fundamentos
    }

    /**
     * Obtener información detallada del nivel de madurez
     * Incluye nombre, color y descripción
     */
    getMaturityInfo(maturityLevel) {
        const maturityInfoMap = {
            1: {
                name: 'Inicial - Ad Hoc',
                color: '#dc3545', // Rojo
                description: 'Nivel inicial con procesos no estandarizados. Se requiere establecer fundamentos básicos de ciberseguridad.'
            },
            2: {
                name: 'Repetible - Básico',
                color: '#fd7e14', // Naranja
                description: 'Procesos básicos existentes pero informales. Se necesita formalización y documentación de procedimientos.'
            },
            3: {
                name: 'Definido - Intermedio',
                color: '#ffc107', // Amarillo
                description: 'Base sólida con procesos formales documentados. Existen oportunidades significativas de mejora.'
            },
            4: {
                name: 'Gestionado - Avanzado',
                color: '#28a745', // Verde
                description: 'Madurez avanzada con procesos medidos y métricas establecidas. Optimización continua en marcha.'
            },
            5: {
                name: 'Optimizado - Líder',
                color: '#007bff', // Azul
                description: 'Excelencia operacional y liderazgo en la industria. Mejora continua y procesos maduros establecidos.'
            }
        };

        return maturityInfoMap[maturityLevel] || maturityInfoMap[1];
    }

    /**
     * Generar recomendaciones específicas
     */
    generateRecommendations(scores, maturityLevel) {
        const recommendations = [];

        // Identificar dimensiones más débiles
        const sortedDimensions = Object.entries(scores)
            .sort((a, b) => a[1].score - b[1].score);

        const weakestDimensions = sortedDimensions.slice(0, 3);

        weakestDimensions.forEach(([dimension, data]) => {
            const recommendations_map = {
                'GOBIERNO': 'Establecer políticas formales de ciberseguridad y designar responsables claros',
                'IDENTIFICAR': 'Crear y mantener un inventario completo de activos de TI',
                'PROTEGER': 'Implementar controles de seguridad robustos (MFA, cifrado, firewall)',
                'DETECTAR': 'Establecer monitoreo continuo y sistemas de detección de amenazas',
                'RESPONDER': 'Desarrollar y practicar planes de respuesta a incidentes',
                'RECUPERAR': 'Crear planes de continuidad del negocio y recuperación',
                'IMPROVE': 'Implementar procesos de mejora continua en ciberseguridad'
            };

            if (data.score < 60) {
                recommendations.push(recommendations_map[dimension] || `Mejorar la dimensión ${data.name}`);
            }
        });

        // Recomendaciones generales por nivel
        if (maturityLevel <= 2) {
            recommendations.push('Implementar controles básicos de seguridad como primera prioridad');
            recommendations.push('Establecer políticas de seguridad fundamentales');
        }

        return recommendations;
    }

    /**
     * Generar recomendaciones naturales por dimensión basadas en respuestas específicas
     */
    async generateDimensionRecommendations(scores, evaluationQuestions, companyInfo) {
        console.log('🤖 Iniciando generación de recomendaciones...');
        
        try {
            // Intentar generar recomendaciones con ChatGPT primero
            const chatGptRecommendations = await this.chatGptService.generateAllDimensionRecommendations(
                companyInfo, 
                scores, 
                evaluationQuestions, 
                { globalScore: this.calculateGlobalScore(scores) }
            );
            
            // Procesar resultados: usar ChatGPT cuando esté disponible, fallback cuando no
            const finalRecommendations = {};
            
            Object.keys(scores).forEach(dimension => {
                const dimensionData = scores[dimension];
                const dimensionQuestions = evaluationQuestions.filter(q => q.dimension === dimension);
                
                // Si ChatGPT generó recomendación para esta dimensión, usarla
                if (chatGptRecommendations[dimension] && chatGptRecommendations[dimension].recommendation) {
                    console.log(`✅ Usando recomendación ChatGPT para ${dimension}`);
                    const enrichedRecommendation = this.ensureDetailedDimensionRecommendation(
                        chatGptRecommendations[dimension].recommendation,
                        dimensionData,
                        dimensionQuestions
                    );
                    finalRecommendations[dimension] = {
                        ...chatGptRecommendations[dimension],
                        recommendation: enrichedRecommendation,
                        source: 'ChatGPT'
                    };
                } else {
                    // Fallback al sistema de recomendaciones interno
                    console.log(`⚡ Usando fallback para ${dimension}`);
                    const fallbackRecommendation = this.generateFallbackRecommendation(dimension, dimensionData, dimensionQuestions);
                    const enrichedRecommendation = this.ensureDetailedDimensionRecommendation(
                        fallbackRecommendation,
                        dimensionData,
                        dimensionQuestions
                    );
                    finalRecommendations[dimension] = {
                        score: dimensionData.score,
                        recommendation: enrichedRecommendation,
                        categories: this.getDimensionCategories(dimensionQuestions),
                        source: 'Internal'
                    };
                }
            });
            
            return finalRecommendations;
            
        } catch (error) {
            console.error('❌ Error con ChatGPT, usando sistema fallback completo:', error.message);
            
            // Si ChatGPT falla completamente, usar sistema interno para todas las dimensiones
            return this.generateFallbackRecommendations(scores, evaluationQuestions);
        }
    }

    /**
     * Generar recomendación fallback usando el sistema interno
     */
    generateFallbackRecommendation(dimension, dimensionData, dimensionQuestions) {
        const score = dimensionData.score;
        
        if (score === 0) {
            return this.getZeroScoreRecommendation(dimension, dimensionQuestions);
        } else if (score < 25) { // Nivel 1 - Inicial
            return this.getLowScoreRecommendation(dimension, dimensionQuestions);  
        } else if (score < 50) { // Nivel 2 - Repetible 
            return this.getMediumScoreRecommendation(dimension, dimensionQuestions);
        } else if (score < 75) { // Nivel 3 - Definido
            return this.getGoodScoreRecommendation(dimension, dimensionQuestions);
        } else if (score < 90) { // Nivel 4 - Gestionado
            return this.getExcellentScoreRecommendation(dimension, dimensionQuestions);
        } else { // Nivel 5 - Óptimo
            return this.getOptimalScoreRecommendation(dimension, dimensionQuestions);
        }
    }

    /**
     * Generar recomendaciones fallback para todas las dimensiones
     */
    generateFallbackRecommendations(scores, evaluationQuestions) {
        const dimensionRecommendations = {};

        Object.keys(scores).forEach(dimension => {
            const dimensionData = scores[dimension];
            const dimensionQuestions = evaluationQuestions.filter(q => q.dimension === dimension);
            const fallbackRecommendation = this.generateFallbackRecommendation(dimension, dimensionData, dimensionQuestions);
            const enrichedRecommendation = this.ensureDetailedDimensionRecommendation(
                fallbackRecommendation,
                dimensionData,
                dimensionQuestions
            );
            
            dimensionRecommendations[dimension] = {
                score: dimensionData.score,
                recommendation: enrichedRecommendation,
                categories: this.getDimensionCategories(dimensionQuestions),
                source: 'Internal'
            };
        });

        return dimensionRecommendations;
    }

    /**
     * Contar palabras de una recomendación.
     */
    countWords(text) {
        if (!text || typeof text !== 'string') return 0;
        return text.trim().split(/\s+/).filter(Boolean).length;
    }

    /**
     * Asegurar detalle mínimo uniforme en recomendaciones por dimensión.
     */
    ensureDetailedDimensionRecommendation(recommendation, dimensionData, dimensionQuestions) {
        const minWords = 120;
        const currentWords = this.countWords(recommendation);

        if (currentWords >= minWords) {
            return recommendation;
        }

        const score = dimensionData?.score ?? 0;
        const timeframe = score < 25 ? '4-6 meses' : score < 50 ? '3-5 meses' : '2-4 meses';
        const categoryList = this.getDimensionCategories(dimensionQuestions || []).slice(0, 3);
        const alcance = categoryList.length > 0
            ? categoryList.join(', ')
            : 'procesos críticos de la dimensión evaluada';

        const detailBlock = ` En términos de ejecución, se recomienda estructurar esta mejora en un plan por fases con horizonte de ${timeframe}, iniciando por los controles de mayor impacto en reducción de riesgo y continuidad operativa. El alcance debe cubrir ${alcance}, con responsables definidos por proceso y seguimiento quincenal de avances para asegurar resultados sostenibles. Como ejemplo práctico, puede iniciarse con un piloto controlado en el área de mayor exposición, validar resultados en 30 días y luego escalar progresivamente al resto de la organización. El valor esperado es una mejora medible en madurez, mayor trazabilidad para auditoría y reducción del riesgo residual.`;

        return `${recommendation}${detailBlock}`;
    }

    /**
     * Calcular score global (método auxiliar)
     */
    calculateGlobalScore(scores) {
        let totalScore = 0;
        let totalMaxScore = 0;
        
        Object.values(scores).forEach(dimension => {
            totalScore += dimension.obtained;
            totalMaxScore += dimension.maximum;
        });
        
        return Math.round((totalScore / totalMaxScore) * 100);
    }

    /**
     * Recomendaciones para puntuación 0
     */
    getZeroScoreRecommendation(dimension, questions) {
        const recommendations = {
            "GOBIERNO": "Su organización necesita establecer urgentemente las bases de su programa de ciberseguridad. Recomendamos comenzar por desarrollar políticas básicas de seguridad, designar un responsable y establecer procedimientos de evaluación de riesgos. Estos elementos son fundamentales para construir una cultura de seguridad sólida.",
            
            "IDENTIFICAR": "Es crucial que implementen un sistema para conocer y catalogar todos sus activos tecnológicos. Sin un inventario actualizado de equipos, software y servicios, es imposible proteger adecuadamente su organización. Sugerimos comenzar con un mapeo básico de todos los sistemas críticos.",
            
            "PROTEGER": "Su organización requiere implementar controles básicos de protección de forma inmediata. Esto incluye establecer autenticación multifactor, gestión adecuada de contraseñas, copias de seguridad y controles de acceso. Estos son los pilares fundamentales de cualquier estrategia de ciberseguridad.",
            
            "DETECTAR": "Actualmente no cuentan con capacidades de detección de amenazas, lo que los deja vulnerables a ataques sin detectar. Es importante implementar monitoreo básico de sus sistemas y establecer procedimientos para identificar actividades sospechosas antes de que se conviertan en incidentes graves.",
            
            "RESPONDER": "La falta de procedimientos de respuesta a incidentes puede amplificar significativamente el impacto de cualquier problema de seguridad. Recomendamos desarrollar un plan básico de respuesta, definir roles y responsabilidades, y establecer canales de comunicación para situaciones de crisis.",
            
            "RECUPERAR": "Sin planes de recuperación, cualquier incidente podría paralizar sus operaciones por períodos extensos. Es fundamental desarrollar procedimientos de continuidad del negocio que les permitan restaurar sus operaciones críticas de manera rápida y ordenada.",
            
            "IMPROVE": "Para evolucionar hacia una postura de seguridad más madura, necesitan establecer procesos que les permitan aprender de los incidentes y mejorar continuamente. Esto incluye documentar lecciones aprendidas y revisar periódicamente la efectividad de sus controles de seguridad."
        };
        
        return recommendations[dimension] || "Es importante desarrollar capacidades en esta área para mejorar la postura general de ciberseguridad.";
    }

    /**
     * Recomendaciones para puntuación baja (1-29%)
     */
    getLowScoreRecommendation(dimension, questions) {
        const recommendations = {
            "GOBIERNO": "Aunque han comenzado a establecer algunos elementos de gobierno, es necesario fortalecer y formalizar estos procesos. Recomendamos completar el desarrollo de políticas, establecer procedimientos de revisión regular y asegurar que todo el personal comprenda sus responsabilidades en materia de ciberseguridad.",
            
            "IDENTIFICAR": "Han dado los primeros pasos en la gestión de activos, pero necesitan ampliar y sistematizar estos esfuerzos. Sugerimos completar el inventario de todos los sistemas, establecer procedimientos de actualización regular y clasificar los activos según su criticidad para el negocio.",
            
            "PROTEGER": "Tienen algunas medidas de protección implementadas, pero existen gaps importantes que deben ser atendidos. Recomendamos priorizar la implementación de controles faltantes, especialmente aquellos relacionados con autenticación, gestión de accesos y protección de datos críticos.",
            
            "DETECTAR": "Sus capacidades de detección están en desarrollo pero requieren mayor cobertura y sistematización. Es importante expandir el monitoreo a todos los sistemas críticos y establecer procedimientos claros para el análisis y escalamiento de alertas de seguridad.",
            
            "RESPONDER": "Tienen elementos básicos de respuesta pero necesitan desarrollo adicional para ser efectivos. Recomendamos completar los procedimientos, realizar ejercicios de simulacro y asegurar que todo el equipo conozca sus roles durante un incidente.",
            
            "RECUPERAR": "Sus planes de recuperación necesitan ser desarrollados más comprehensivamente. Sugerimos completar la documentación de procedimientos, probar regularmente los planes de respaldo y asegurar que puedan restaurar operaciones críticas en tiempos aceptables.",
            
            "IMPROVE": "Han comenzado a establecer procesos de mejora, pero necesitan mayor sistematización. Recomendamos implementar métricas de seguridad más robustas y establecer ciclos regulares de revisión y actualización de sus controles de seguridad."
        };
        
        return recommendations[dimension] || "Continúen desarrollando las capacidades en esta área con un enfoque más sistemático y completo.";
    }

    /**
     * Recomendaciones para puntuación media (30-59%)
     */
    getMediumScoreRecommendation(dimension, questions) {
        const recommendations = {
            "GOBIERNO": "Su programa de gobierno muestra un desarrollo sólido. Para avanzar al siguiente nivel, enfóquense en automatizar procesos, establecer métricas de efectividad y crear programas de concientización más robustos que aseguren el cumplimiento consistente en toda la organización.",
            
            "IDENTIFICAR": "Tienen una base sólida en gestión de activos. Recomendamos implementar herramientas automatizadas para el descubrimiento de activos, establecer procesos de clasificación más granulares y desarrollar capacidades de gestión de vulnerabilidades más avanzadas.",
            
            "PROTEGER": "Sus controles de protección muestran buen progreso. Para optimizar, consideren implementar soluciones de seguridad más avanzadas, como protección contra amenazas avanzadas, y fortalecer la integración entre diferentes controles para crear una defensa más cohesiva.",
            
            "DETECTAR": "Sus capacidades de detección están bien encaminadas. Recomendamos implementar análisis de comportamiento más sofisticados, correlación automática de eventos y considerar la implementación de threat intelligence para mejorar la detección de amenazas avanzadas.",
            
            "RESPONDER": "Su capacidad de respuesta muestra buena madurez. Para el siguiente nivel, enfóquense en automatizar respuestas a incidentes comunes, implementar playbooks más detallados y establecer métricas de tiempo de respuesta para mejorar continuamente la efectividad.",
            
            "RECUPERAR": "Sus planes de recuperación funcionan adecuadamente. Consideren implementar soluciones de alta disponibilidad, automatizar procesos de recuperación donde sea posible y establecer objetivos de tiempo de recuperación más ambiciosos para operaciones críticas.",
            
            "IMPROVE": "Su proceso de mejora continua está funcionando bien. Para avanzar, implementen análisis de tendencias de seguridad, establezcan benchmarking con la industria y consideren adoptar frameworks de madurez más avanzados para guiar su evolución."
        };
        
        return recommendations[dimension] || "Continúen fortaleciendo esta área con enfoque en automatización y optimización de procesos.";
    }

    /**
     * Recomendaciones para puntuación buena (60-79%)
     */
    getGoodScoreRecommendation(dimension, questions) {
        const recommendations = {
            "GOBIERNO": "Excelente trabajo en el desarrollo de su programa de gobierno. Para alcanzar la excelencia, enfóquense en optimizar la integración con procesos de negocio, implementar análisis predictivos de riesgos y considerar certificaciones de seguridad que validen su madurez ante terceros.",
            
            "IDENTIFICAR": "Su gestión de activos demuestra alta madurez. Recomendamos implementar capacidades de gestión de riesgo de activos en tiempo real, integrar con sistemas de threat intelligence y desarrollar capacidades predictivas para anticipar necesidades futuras de seguridad.",
            
            "PROTEGER": "Sus controles de protección son robustos y bien implementados. Para la optimización final, consideren adoptar arquitecturas zero-trust, implementar protección adaptativa basada en contexto y desarrollar capacidades de respuesta automática a amenazas emergentes.",
            
            "DETECTAR": "Sus capacidades de detección son avanzadas y efectivas. Para alcanzar la excelencia, implementen machine learning para detección de anomalías, desarrollen capacidades de hunting proactivo de amenazas y establezcan colaboración con comunidades de threat intelligence.",
            
            "RESPONDER": "Su capacidad de respuesta es ejemplar. Para perfeccionar, enfóquense en respuesta automática orquestada, análisis forense automatizado y desarrollo de capacidades de respuesta colaborativa con entidades externas cuando sea apropiado.",
            
            "RECUPERAR": "Sus planes de recuperación son muy efectivos. Para optimizar completamente, implementen capacidades de recuperación automática, establezcan objetivos de disponibilidad de clase enterprise y consideren capacidades de recuperación distribuida geográficamente.",
            
            "IMPROVE": "Su proceso de mejora continua es muy maduro. Para alcanzar la excelencia, implementen capacidades de mejora predictiva, establezcan programas de innovación en seguridad y consideren compartir conocimiento con la comunidad para liderar mejores prácticas de la industria."
        };
        
        return recommendations[dimension] || "Excelente trabajo en esta área. Enfóquense en optimización avanzada y liderazgo en mejores prácticas.";
    }

    /**
     * Recomendaciones para puntuación excelente (80%+)
     */
    getExcellentScoreRecommendation(dimension, questions) {
        const recommendations = {
            "GOBIERNO": "Felicitaciones por alcanzar un nivel de excelencia en gobierno de ciberseguridad. Su organización puede ahora enfocarse en ser líder de la industria, compartir mejores prácticas y continuar innovando en enfoques de gobierno adaptativo que respondan dinámicamente a amenazas emergentes.",
            
            "IDENTIFICAR": "Su capacidad de identificación de activos es ejemplar. Mantengan este nivel de excelencia y consideren liderar iniciativas de la industria en gestión inteligente de activos, contribuyendo al desarrollo de estándares y mejores prácticas que beneficien a toda la comunidad empresarial.",
            
            "PROTEGER": "Sus controles de protección representan el estado del arte en la industria. Continúen innovando y consideran establecer centros de excelencia que puedan compartir conocimiento y liderar la evolución de las mejores prácticas de protección en su sector.",
            
            "DETECTAR": "Sus capacidades de detección son de clase mundial. Su organización está posicionada para liderar en el desarrollo de nuevas técnicas de detección y puede contribuir significativamente al avance del estado del arte en detección de amenazas cibernéticas.",
            
            "RESPONDER": "Su capacidad de respuesta es ejemplar y puede servir como modelo para otras organizaciones. Consideren participar en iniciativas de respuesta colaborativa y compartir su experiencia para elevar las capacidades de respuesta de toda la industria.",
            
            "RECUPERAR": "Sus capacidades de recuperación son excepcionales. Su organización puede liderar el desarrollo de nuevos enfoques de resiliencia y servir como referencia para otras empresas que buscan alcanzar niveles similares de preparación para la continuidad del negocio.",
            
            "IMPROVE": "Su proceso de mejora continua es verdaderamente excepcional. Su organización puede ahora enfocarse en liderar la innovación en ciberseguridad, establecer nuevos estándares de la industria y mentorear a otras organizaciones en su camino hacia la excelencia en seguridad."
        };
        
        return recommendations[dimension] || "¡Excelente trabajo! Su organización es líder en esta área y puede servir como referencia para la industria.";
    }

    /**
     * Recomendaciones para puntuación óptima (90%+) - Nivel 5
     */
    getOptimalScoreRecommendation(dimension, questions) {
        const recommendations = {
            "GOBIERNO": "¡Enhorabuena! Han alcanzado el nivel óptimo en gobierno de ciberseguridad. Su organización es un verdadero líder de la industria. Enfóquense ahora en investigación e innovación, establecimiento de nuevos estándares globales, y en ser mentores de otras organizaciones. Consideren publicar casos de estudio y contribuir al desarrollo de marcos de referencia internacionales.",
            
            "IDENTIFICAR": "¡Excepcional! Su capacidad de identificación representa el estado del arte mundial. Su organización puede liderar investigación en IA para gestión de activos, contribuir a estándares ISO/NIST futuros, y establecer centros de innovación que beneficien a toda la comunidad global de ciberseguridad.",
            
            "PROTEGER": "¡Impresionante! Han alcanzado la excelencia absoluta en protección cibernética. Su organización está posicionada para liderar el futuro de la seguridad, desarrollar tecnologías disruptivas de protección, y establecer nuevos paradigmas que definirán las próximas generaciones de controles de seguridad.",
            
            "DETECTAR": "¡Extraordinario! Sus capacidades de detección son pioneras a nivel mundial. Pueden liderar el desarrollo de la próxima generación de tecnologías de detección basadas en IA cuántica, establecer nuevos estándares de threat intelligence, y crear ecosistemas colaborativos globales de detección.",
            
            "RESPONDER": "¡Sobresaliente! Su capacidad de respuesta define nuevos estándares de la industria. Están posicionados para liderar iniciativas globales de respuesta colaborativa, desarrollar protocolos de respuesta del futuro, y establecer academias de formación que eleven las capacidades mundiales de respuesta a incidentes.",
            
            "RECUPERAR": "¡Ejemplar! Sus capacidades de recuperación son vanguardistas. Pueden liderar la revolución en resiliencia cibernética, desarrollar nuevos conceptos de recuperación autónoma, y crear frameworks de continuidad de negocio que serán adoptados globalmente como el nuevo estándar de oro.",
            
            "IMPROVE": "¡Visionario! Su proceso de mejora continua es revolucionario. Su organización puede liderar la transformación global de la ciberseguridad, establecer institutos de investigación, crear nuevos paradigmas de mejora basados en IA y machine learning, y definir el futuro de la evolución continua en seguridad cibernética."
        };
        
        return recommendations[dimension] || "¡Fenomenal! Su organización ha alcanzado la cúspide de la excelencia y puede liderar la revolución en ciberseguridad global.";
    }

    /**
     * Obtener categorías NIST evaluadas en una dimensión
     */
    getDimensionCategories(questions) {
        const categories = new Set();
        
        questions.forEach(q => {
            const nistInfo = this.QUESTION_NIST_MAPPING[q.question];
            if (nistInfo) {
                categories.add(nistInfo.categoria);
            }
        });
        
        return Array.from(categories);
    }
}

module.exports = SecurityEvaluationAnalyzer;