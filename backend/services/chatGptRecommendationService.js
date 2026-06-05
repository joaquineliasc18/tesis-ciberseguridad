/**
 * Servicio de Recomendaciones Personalizadas con ChatGPT
 * Genera recomendaciones contextuales de ciberseguridad usando OpenAI GPT-5
 */

const OpenAI = require('openai');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const ragService = require('./ragService');

class ChatGptRecommendationService {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        
        this.config = {
            model: process.env.OPENAI_MODEL || 'gpt-5',
            maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 1500,
            temperature: process.env.OPENAI_TEMPERATURE !== undefined ? parseFloat(process.env.OPENAI_TEMPERATURE) : 0.0,
            timeout: parseInt(process.env.CHATGPT_TIMEOUT) || 30000
        };
        
        this.enabled = process.env.USE_CHATGPT_RECOMMENDATIONS === 'true';
        
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('🔧 CONFIGURACIÓN DE CHATGPT RECOMMENDATIONS');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log(`✅ Habilitado: ${this.enabled}`);
        console.log(`🤖 Modelo: ${this.config.model}`);
        console.log(`🌡️  Temperature: ${this.config.temperature} ${this.config.temperature === 0 ? '(DETERMINÍSTICO)' : '(CREATIVO)'}`);
        console.log(`📝 Max Tokens: ${this.config.maxTokens}`);
        console.log(`⏱️  Timeout: ${this.config.timeout}ms`);
        console.log(`🔑 API Key: ${process.env.OPENAI_API_KEY ? '✅ Configurada' : '❌ NO configurada'}`);
        console.log('═══════════════════════════════════════════════════════════════');
        
        // Mapeo de códigos técnicos a descripciones empresariales legibles
        this.QUESTION_DESCRIPTIONS = {
            // GOBIERNO
            "GV_PO_01": "Políticas formales de ciberseguridad documentadas",
            "GV_RA_02": "Evaluaciones regulares de riesgos de seguridad",
            "GV_SC_03": "Gestión de riesgos en la cadena de suministro",
            "GV_PO_SC4": "Planes de respuesta ante incidentes de seguridad",
            
            // IDENTIFICAR  
            "ID_AM_01": "Inventario completo de activos tecnológicos",
            "ID_BE_02": "Comprensión del entorno empresarial de seguridad",
            "ID_GV_03": "Políticas de gobierno de ciberseguridad establecidas",
            "ID_RA_04": "Procesos de evaluación de riesgos implementados",
            "ID_RM_05": "Estrategias de gestión de riesgos definidas",
            "ID_SC_06": "Gestión de riesgos de proveedores externos",
            
            // PROTEGER
            "PR_AC_01": "Control de acceso y gestión de identidades",
            "PR_AT_02": "Programas de capacitación en ciberseguridad",
            "PR_DS_03": "Protección y clasificación de datos sensibles",
            "PR_IP_04": "Protección de infraestructura tecnológica",
            "PR_MA_05": "Procedimientos de mantenimiento seguro",
            "PR_PT_06": "Tecnologías de protección implementadas",
            "PR_AA_PS_SC10": "Políticas avanzadas de gestión de contraseñas",
            "PR_AT_AT_SC7": "Capacitación especializada contra ataques de autenticación",
            "PR_AA_AC_SC8": "Gestión de accesos privilegiados temporales",
            "PR_AA_AC_SC9": "Gestión segura de cuentas de servicio",
            "PR_IR_01": "Protección de redes contra accesos no autorizados",
            
            // DETECTAR
            "DE_AE_02": "Análisis de eventos de seguridad sospechosos",
            "DE_CM_SC13": "Monitoreo de actividades de suplantación",
            "DE_CM_SC14": "Sistemas de detección proactiva con señuelos",
            "DE_CM_SC15": "Monitoreo de comportamientos anómalos de usuarios",
            "DE_CM_01": "Monitoreo continuo de la seguridad",
            "DE_AE_03": "Correlación y análisis de eventos de seguridad",
            "DE_CM_SC16": "Detección de ataques de credential stuffing",
            "DE_CM_SC17": "Monitoreo de actividades privilegiadas",
            "DE_CM_SC18": "Análisis de patrones de autenticación",
            "DE_DP_04": "Procesos de detección y respuesta",
            
            // RESPONDER
            "RS_RP_01": "Planes de respuesta a incidentes establecidos",
            "RS_CO_02": "Comunicaciones durante incidentes de seguridad",
            "RS_AN_03": "Capacidades de análisis forense",
            "RS_MI_04": "Estrategias de mitigación de incidentes",
            "RS_IM_05": "Procesos de mejora post-incidente",
            "RS_RP_SC19": "Procedimientos de recuperación de identidades comprometidas",
            
            // RECUPERAR
            "RC_RP_RP_SC20": "Planes de recuperación con reinscripción segura de MFA",
            "RC_IM_01": "Procesos de mejora en recuperación",
            "RC_CO_02": "Comunicaciones durante la recuperación",
            
            // IMPROVE (MEJORAR)
            "IM_GV_OV_PR_SC21": "Supervisión de la eficacia de los procesos de ciberseguridad",
            "IM_GV_IM_TS_SC22": "Marco formal para implementación de mejoras tecnológicas"
        };
        
        console.log(`🤖 ChatGPT Recommendations: ${this.enabled ? 'HABILITADO' : 'DESHABILITADO'}`);
        if (this.enabled) {
            console.log(`📋 Modelo: ${this.config.model} | Tokens: ${this.config.maxTokens} | Temp: ${this.config.temperature}`);
        }
    }

    countWords(text) {
        if (!text || typeof text !== 'string') return 0;
        return text.trim().split(/\s+/).filter(Boolean).length;
    }

    /**
     * Generar recomendación personalizada para una dimensión específica
     */
    async generateDimensionRecommendation(companyInfo, dimension, dimensionData, questionAnswers, nistCategories) {
        if (!this.enabled) {
            throw new Error('ChatGPT recommendations are disabled');
        }

        try {
            // Verificar que tenemos API Key
            if (!process.env.OPENAI_API_KEY) {
                throw new Error('OPENAI_API_KEY not found in environment variables');
            }

            const prompt = this.buildDimensionPrompt(companyInfo, dimension, dimensionData, questionAnswers, nistCategories);
            
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`🤖 Generando recomendación ChatGPT para ${dimension}`);
            console.log(`📊 Score: ${dimensionData.score}% | Preguntas: ${questionAnswers.length}`);
            console.log(`🔧 Usando: ${this.config.model} | Temp: ${this.config.temperature} | Seed: 42`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            
            const completion = await Promise.race([
                this.openai.chat.completions.create({
                    model: this.config.model,
                    messages: [
                        {
                            role: "system",
                            content: this.getSystemPrompt()
                        },
                        {
                            role: "user", 
                            content: prompt
                        }
                    ],
                    temperature: this.config.temperature,
                    seed: 42,
                    max_completion_tokens: this.config.maxTokens
                }),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('ChatGPT request timeout')), this.config.timeout)
                )
            ]);

            const rawContent = completion.choices[0]?.message?.content;
            let recommendation = Array.isArray(rawContent)
                ? rawContent.map(b => b.text || '').join('').trim()
                : (rawContent || '').trim();

            if (!recommendation) {
                throw new Error('Empty response from ChatGPT');
            }

            // Uniformar tamaño entre dimensiones: si queda corto, pedir expansión controlada.
            const minWords = 180;
            const currentWords = this.countWords(recommendation);
            if (currentWords < minWords) {
                console.log(`⚠️ Recomendación corta en ${dimension} (${currentWords} palabras). Reintentando expansión...`);
                try {
                    const expandCompletion = await Promise.race([
                        this.openai.chat.completions.create({
                            model: this.config.model,
                            messages: [
                                {
                                    role: "system",
                                    content: this.getSystemPrompt()
                                },
                                {
                                    role: "user",
                                    content: `${prompt}\n\nLa respuesta generada fue demasiado breve para el estándar del informe. Reescribe la recomendación para ${dimension} con longitud uniforme entre 190 y 250 palabras, manteniendo claridad ejecutiva, acción concreta y referencias [ID] del KB.\n\nRespuesta corta anterior:\n${recommendation}`
                                }
                            ],
                            temperature: this.config.temperature,
                            seed: 42,
                            max_completion_tokens: this.config.maxTokens
                        }),
                        new Promise((_, reject) =>
                            setTimeout(() => reject(new Error('ChatGPT expansion timeout')), this.config.timeout)
                        )
                    ]);

                    const expandedRaw = expandCompletion.choices[0]?.message?.content;
                    const expandedRecommendation = Array.isArray(expandedRaw)
                        ? expandedRaw.map(b => b.text || '').join('').trim()
                        : (expandedRaw || '').trim();

                    if (expandedRecommendation && this.countWords(expandedRecommendation) >= minWords) {
                        recommendation = expandedRecommendation;
                        console.log(`✅ Recomendación expandida en ${dimension} (${this.countWords(recommendation)} palabras)`);
                    }
                } catch (expandError) {
                    console.log(`⚠️ No se pudo expandir ${dimension}, se usa versión original (${currentWords} palabras)`);
                }
            }

            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`✅ Recomendación generada para ${dimension}`);
            console.log(`📏 Longitud: ${recommendation.length} caracteres`);
            console.log(`🎯 Modelo usado: ${this.config.model}`);
            console.log(`🌡️  Temperature: ${this.config.temperature}`);
            console.log(`📊 Tokens usados: Input=${completion.usage?.prompt_tokens || 'N/A'} | Output=${completion.usage?.completion_tokens || 'N/A'}`);
            console.log(`💰 Costo estimado: $${this.estimateCost(completion.usage)}`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            return recommendation;

        } catch (error) {
            // Logging detallado del error
            if (error.code === 'insufficient_quota') {
                console.error(`💰 Error de cuota ChatGPT para ${dimension}: Sin créditos disponibles`);
            } else if (error.code === 'invalid_api_key') {
                console.error(`🔑 Error API Key ChatGPT para ${dimension}: API Key inválida`);
            } else if (error.message.includes('timeout')) {
                console.error(`⏱️ Timeout ChatGPT para ${dimension}: ${this.config.timeout}ms excedido`);
            } else {
                console.error(`❌ Error ChatGPT para ${dimension}:`, error.message);
            }
            
            throw error;
        }
    }

    /**
     * Generar múltiples recomendaciones para todas las dimensiones
     */
    async generateAllDimensionRecommendations(companyInfo, dimensionsData, allQuestionAnswers, globalContext) {
        if (!this.enabled) {
            throw new Error('ChatGPT recommendations are disabled');
        }

        const dimensions = Object.keys(dimensionsData);
        console.log(`🤖 Iniciando generación ChatGPT para ${dimensions.length} dimensiones (paralelo)...`);

        // Ejecutar todas las dimensiones en paralelo
        const results = await Promise.all(dimensions.map(async (dimension) => {
            try {
                const dimensionData = dimensionsData[dimension];
                const questionAnswers = allQuestionAnswers.filter(qa => qa.dimension === dimension);
                const nistCategories = this.extractNistCategories(questionAnswers);

                const recommendation = await this.generateDimensionRecommendation(
                    companyInfo,
                    dimension,
                    dimensionData,
                    questionAnswers,
                    nistCategories
                );

                return [dimension, {
                    score: dimensionData.score,
                    recommendation: recommendation,
                    categories: nistCategories,
                    source: 'ChatGPT',
                    timestamp: new Date().toISOString()
                }];
            } catch (error) {
                console.error(`❌ Error en ${dimension}, usando fallback:`, error.message);
                // En caso de error, retornamos null para que use el sistema fallback
                return [dimension, null];
            }
        }));

        // Convertir array de pares [dimension, data] a objeto
        const recommendations = Object.fromEntries(results);
        return recommendations;
    }

    /**
     * Generar Plan de Accion Integral con un unico contexto RAG multi-dominio.
     */
    async generateIntegralActionPlan(companyInfo, globalData, dimensionsSummary, gapDomains, ragContext) {
        if (!this.enabled) {
            throw new Error('ChatGPT recommendations are disabled');
        }

        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY not found in environment variables');
        }

        try {
            const prompt = this.buildIntegralActionPlanPrompt(
                companyInfo,
                globalData,
                dimensionsSummary,
                gapDomains,
                ragContext
            );

            console.log(`Generando Plan de Accion Integral con ChatGPT...`);
            console.log(`Modelo: ${this.config.model} | max_completion_tokens: ${this.config.maxTokens}`);
            console.log(`Dominios en brecha: ${gapDomains.join(', ')}`);
            console.log(`Longitud del prompt enviado: ${prompt.length} chars`);

            const completion = await Promise.race([
                this.openai.chat.completions.create({
                    model: this.config.model,
                    messages: [
                        {
                            role: "system",
                            content: this.getIntegralActionPlanSystemPrompt()
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    temperature: this.config.temperature,
                    seed: 42,
                    max_completion_tokens: this.config.maxTokens
                }),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('ChatGPT request timeout')), this.config.timeout)
                )
            ]);

            const rawContent = completion.choices[0]?.message?.content;
            const plan = Array.isArray(rawContent)
                ? rawContent.map(b => b.text || '').join('').trim()
                : (rawContent || '').trim();

            if (!plan) {
                throw new Error('Empty integral action plan from ChatGPT');
            }

            console.log(`Plan de Accion Integral generado (${plan.length} caracteres)`);
            return plan;

        } catch (error) {
            console.error(`Error generando Plan de Accion Integral:`, error.message);
            throw error;
        }
    }

    /**
     * Generar resumen ejecutivo integrado personalizado con ChatGPT
     */
    async generateExecutiveSummary(companyInfo, globalData, dimensionsData) {
        if (!this.enabled) {
            throw new Error('ChatGPT recommendations are disabled');
        }

        try {
            const prompt = this.buildExecutiveSummaryPrompt(companyInfo, globalData, dimensionsData);
            
            console.log(`🤖 Generando resumen ejecutivo integrado con ChatGPT...`);
            
            const completion = await Promise.race([
                this.openai.chat.completions.create({
                    model: this.config.model,
                    messages: [
                        {
                            role: "system",
                            content: this.getExecutiveSummarySystemPrompt()
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    temperature: this.config.temperature,
                    seed: 42,
                    max_completion_tokens: this.config.maxTokens
                }),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('ChatGPT request timeout')), this.config.timeout)
                )
            ]);

            let summary = completion.choices[0]?.message?.content?.trim();
            
            if (!summary) {
                throw new Error('Empty executive summary from ChatGPT');
            }

            // Reforzar detalle y calidad narrativa si el resumen queda corto.
            const minWords = 340;
            const words = this.countWords(summary);
            if (words < minWords) {
                console.log(`⚠️ Resumen ejecutivo corto (${words} palabras). Reintentando expansión experta...`);

                try {
                    const expandCompletion = await Promise.race([
                        this.openai.chat.completions.create({
                            model: this.config.model,
                            messages: [
                                {
                                    role: "system",
                                    content: this.getExecutiveSummarySystemPrompt()
                                },
                                {
                                    role: "user",
                                    content: `${prompt}\n\nLa versión previa fue demasiado breve. Reescribe el resumen con redacción experta, profundidad ejecutiva y coherencia narrativa, manteniendo claridad para audiencia mixta.\n\nRequisitos obligatorios:\n- Longitud entre 360 y 520 palabras\n- Mayor desarrollo de contexto, implicaciones y decisiones\n- Mantener enfoque en negocio y riesgos\n- Evitar relleno y repeticiones\n\nTexto previo:\n${summary}`
                                }
                            ],
                            temperature: this.config.temperature,
                            seed: 42,
                            max_completion_tokens: this.config.maxTokens
                        }),
                        new Promise((_, reject) =>
                            setTimeout(() => reject(new Error('ChatGPT summary expansion timeout')), this.config.timeout)
                        )
                    ]);

                    const expandedSummary = expandCompletion.choices[0]?.message?.content?.trim();
                    if (expandedSummary && this.countWords(expandedSummary) >= minWords) {
                        summary = expandedSummary;
                        console.log(`✅ Resumen ejecutivo expandido (${this.countWords(summary)} palabras)`);
                    }
                } catch (expandError) {
                    console.log(`⚠️ No se pudo expandir el resumen ejecutivo, se usa versión original (${words} palabras)`);
                }
            }

            console.log(`✅ Resumen ejecutivo ChatGPT generado (${summary.length} caracteres)`);
            return summary;

        } catch (error) {
            console.error(`❌ Error generando resumen ejecutivo ChatGPT:`, error.message);
            throw error;
        }
    }

    /**
     * Generar próximos pasos estratégicos personalizados con ChatGPT
     */
    async generateStrategicNextSteps(companyInfo, globalData, dimensionsData) {
        if (!this.enabled) {
            return this.generateStrategicNextStepsFallback(companyInfo, globalData, dimensionsData);
        }

        try {
            const prompt = this.buildStrategicStepsPrompt(companyInfo, globalData, dimensionsData);
            
            console.log(`🤖 Generando próximos pasos estratégicos con ChatGPT...`);
            
            const completion = await Promise.race([
                this.openai.chat.completions.create({
                    model: this.config.model,
                    messages: [
                        {
                            role: "system",
                            content: this.getStrategicStepsSystemPrompt()
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    temperature: this.config.temperature,
                    seed: 42,
                    max_completion_tokens: this.config.maxTokens
                }),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('ChatGPT request timeout')), this.config.timeout)
                )
            ]);

            const steps = completion.choices[0]?.message?.content?.trim();
            
            if (!steps) {
                throw new Error('Empty strategic steps from ChatGPT');
            }

            console.log(`✅ Próximos pasos estratégicos ChatGPT generados (${steps.length} caracteres)`);
            return steps;

        } catch (error) {
            console.error(`❌ Error generando próximos pasos ChatGPT:`, error.message);
            console.log('⚡ Usando fallback detallado para próximos pasos estratégicos');
            return this.generateStrategicNextStepsFallback(companyInfo, globalData, dimensionsData);
        }
    }

    /**
     * Fallback detallado para próximos pasos estratégicos.
     */
    generateStrategicNextStepsFallback(companyInfo, globalData, dimensionsData) {
        const maturityLevel = globalData?.maturityLevel || 3;

        const sortedDimensions = Object.values(dimensionsData || {})
            .map(d => ({
                name: d.name || 'Dimensión',
                score: typeof d.score === 'number' ? d.score : 0
            }))
            .sort((a, b) => a.score - b.score);

        const top3 = sortedDimensions.slice(0, 3);
        const monthsByMaturity = maturityLevel <= 2 ? '4-6' : maturityLevel === 3 ? '3-5' : '2-4';

        const stepForDimension = (index, dim) => {
            const action = `Fortalecer la dimensión ${dim.name}`;
            const detail = `Definir e implementar un plan operativo por fases para cerrar brechas en ${dim.name}, priorizando controles con mayor impacto en reducción de riesgo.`;
            const scope = `Procesos clave de ${dim.name}, equipos operativos involucrados y responsables de control.`;
            const example = `Por ejemplo, iniciar con un piloto en el proceso con mayor exposición y luego escalar al resto del área.`;
            const value = `Disminución de exposición en ${dim.name} y mejora de trazabilidad para auditoría y comité ejecutivo.`;
            return `${index}. ${action}: ${detail} Timeframe: ${monthsByMaturity} meses. Alcance: ${scope} Ejemplo: ${example} Valor esperado: ${value}`;
        };

        const lines = [
            stepForDimension(1, top3[0] || { name: 'prioritaria 1', score: 0 }),
            stepForDimension(2, top3[1] || { name: 'prioritaria 2', score: 0 }),
            stepForDimension(3, top3[2] || { name: 'prioritaria 3', score: 0 }),
            `4. Ejecutar capacitación aplicada y simulaciones dirigidas: Implementar entrenamiento práctico orientado a los riesgos actuales detectados, con énfasis en decisiones operativas y respuesta coordinada. Timeframe: ${monthsByMaturity} meses. Alcance: Equipos técnicos, dueños de proceso y líderes de área. Ejemplo: Simulacros trimestrales con escenarios reales de incidente y lecciones aprendidas. Valor esperado: Reducción del error operativo y mayor velocidad de respuesta.`,
            `5. Institucionalizar seguimiento ejecutivo y mejora continua: Establecer una rutina mensual de revisión con indicadores, desvíos y acciones correctivas para sostener avances. Timeframe: ${monthsByMaturity} meses. Alcance: Comité de riesgo, seguridad y gerencias clave. Ejemplo: Tablero con KPIs (cobertura de controles, tiempo de remediación y brechas críticas abiertas). Valor esperado: Gobierno continuo de ciberseguridad y avance estable del nivel de madurez.`
        ];

        return lines.join('\n');
    }

    /**
     * Construir prompt personalizado para una dimensión
     */
    buildDimensionPrompt(companyInfo, dimension, dimensionData, questionAnswers, nistCategories) {
        const companyName = companyInfo?.name || 'La organización';
        const score = dimensionData.score;
        const obtainedPoints = dimensionData.obtained;
        const maxPoints = dimensionData.maximum;
        
        // Determinar nivel de madurez según nueva escala
        let maturityLevel;
        if (score >= 90) maturityLevel = "5 - Óptimo";
        else if (score >= 75) maturityLevel = "4 - Gestionado";
        else if (score >= 50) maturityLevel = "3 - Definido";
        else if (score >= 25) maturityLevel = "2 - Repetible";
        else maturityLevel = "1 - Inicial";

        // Construir resumen de respuestas con descripciones legibles
        const answersContext = questionAnswers.map(qa => {
            const description = this.QUESTION_DESCRIPTIONS[qa.question] || qa.question;
            const answer = qa.answer === 1 ? "SÍ implementado" : "NO implementado";
            return `• ${description}: ${answer}`;
        }).join('\n');

        // RAG: recuperar controles validados del marco NIST/MITRE para esta dimensión
        const ragContext = ragService.buildKnowledgeBaseContext(dimension);

        return `ANALISIS EJECUTIVO DE CIBERSEGURIDAD POR DIMENSION

INFORMACIÓN DE LA EMPRESA:
- Organización: ${companyName}
- Dimensión analizada: ${dimension}
- Puntuación obtenida: ${obtainedPoints}/${maxPoints} puntos (${score}%)
- Nivel de madurez: ${maturityLevel}

${ragContext}

CATEGORÍAS NIST CSF 2.0 EVALUADAS:
${nistCategories.map(cat => `• ${cat}`).join('\n')}

RESPUESTAS ESPECÍFICAS DE LA EVALUACIÓN:
${answersContext}

ROL Y OBJETIVO:
Actúa como Director de Riesgos Cibernéticos y redacta una recomendación ejecutiva para ${companyName} sobre la dimensión ${dimension}, combinando rigor técnico y claridad de negocio.

INSTRUCCIONES DE CONTENIDO (OBLIGATORIAS):
1. Diagnóstico actual en 1-2 oraciones con interpretación ejecutiva del ${score}%.
2. Top 2-3 brechas más relevantes según respuestas "NO implementado".
3. Para cada brecha, incluir SIEMPRE:
    - Qué significa.
    - Por qué es importante.
    - Impacto para la organización (operativo/financiero/reputacional cuando aplique).
    - Consecuencia probable si no se corrige.
4. Recomendaciones accionables priorizadas con control(es) del KB en formato [ID].
5. Cierre con beneficio esperado de negocio y mejora de madurez.

RESTRICCIONES CRÍTICAS (NO NEGOCIABLES):
1. Basa tus recomendaciones EXCLUSIVAMENTE en los controles listados en la "BASE DE CONOCIMIENTO VALIDADA" de arriba
2. NO recomiendes controles ni prácticas que no aparezcan en esa base de conocimiento
3. CADA recomendación debe citar al menos un control [ID] verificable del KB
4. Permite creatividad controlada solo para insights estratégicos y priorización; nunca para inventar controles o evidencias
5. Mantén consistencia de estructura y prioridad para entradas equivalentes
6. Si un gap no puede resolverse con controles del KB, NO lo menciones

ESTILO REQUERIDO:
- Lenguaje ejecutivo claro, profesional y natural
- Menos jerga técnica; cada término técnico debe explicarse en lenguaje simple
- Accionable y priorizado
- Longitud uniforme entre 190-250 palabras para TODAS las dimensiones
- Sin asteriscos ni encabezados extras

SALIDA:
Genera únicamente el texto final de la recomendación (sin títulos ni subtítulos):`;
    }

    /**
     * Construir prompt para Plan de Accion Integral multi-dominio.
     */
    buildIntegralActionPlanPrompt(companyInfo, globalData, dimensionsSummary, gapDomains, ragContext) {
        const companyName = companyInfo?.name || 'La organizacion';
        const sector = companyInfo?.sector || 'Sector no especificado';
        const size = companyInfo?.size || 'PYME';
        const dimensions = Array.isArray(dimensionsSummary)
            ? dimensionsSummary
            : Object.values(dimensionsSummary || {});
        const gaps = gapDomains || [];

        const summaryTable = dimensions.map(d =>
            `- ${d.dominio || d.name} [${d.funcionId || '?'}]: ${d.puntajeObtenido}/${d.puntajeMaximo} pts ` +
            `(${d.porcentaje}%) - Nivel ${d.nivel} ${this.getMaturityLevelName(d.nivel)}`
        ).join('\n');

        return `PLAN DE ACCION INTEGRAL DE CIBERSEGURIDAD Y RIESGO

INFORMACION DE LA ORGANIZACION:
- Empresa: ${companyName}
- Sector: ${sector}
- Tamano: ${size}
- Puntuacion global: ${globalData.totalObtenido}/${globalData.totalMaximo} puntos (${globalData.porcentajeGlobal}%)
- Nivel de Madurez Global: ${globalData.nivelGlobal} - ${this.getMaturityLevelName(globalData.nivelGlobal)}

EVALUACION POR DOMINIO NIST CSF 2.0:
${summaryTable}

DOMINIOS CON BRECHAS CRITICAS (Nivel <= 3): ${gaps.join(', ')}

${ragContext}

ROL Y OBJETIVO:
Actúa como asesor ejecutivo de ciberseguridad y genera un plan integral claro, priorizado y orientado a decisión para los dominios con brecha crítica: ${gaps.join(', ')}.

ESTRUCTURA OBLIGATORIA DEL PLAN:
1. Resumen ejecutivo del riesgo actual (estado, urgencia y exposición de negocio).
2. Top prioridades por dominio en brecha (ordenadas por impacto y urgencia).
3. Acciones 30-60-90 días con responsables sugeridos, esfuerzo (Bajo/Medio/Alto) e impacto esperado.
4. Explicación dual por acción: componente técnico + explicación simple para dirección.
5. KPIs/KRIs de seguimiento para medir avance y reducción de riesgo.

RESTRICCIONES CRITICAS (NO NEGOCIABLES):
1. Basa tus recomendaciones EXCLUSIVAMENTE en los controles listados en la BASE DE CONOCIMIENTO VALIDADA
2. NO recomiendes controles que no aparezcan en esa base de conocimiento
3. CADA accion DEBE referenciar al menos un control del KB con su [ID]
4. NO menciones ISO 27001, CIS Controls, COBIT, PCI DSS ni otros frameworks externos
5. Permite creatividad controlada solo en propuestas de mejora de alto valor, sin inventar controles
6. Mantén consistencia en estructura y priorización para datos equivalentes
7. Lenguaje ejecutivo claro, entre 420-620 palabras, sin asteriscos ni formatos especiales

SALIDA:
Genera únicamente el contenido del plan, sin título ni subtítulos adicionales:`;
    }

    /**
     * Construir prompt para resumen ejecutivo integrado
     */
    buildExecutiveSummaryPrompt(companyInfo, globalData, dimensionsData) {
        const companyName = companyInfo?.name || 'La organización';
        const globalScore = globalData.globalScore;
        const maturityLevel = globalData.maturityLevel;
        
        // Determinar nivel de madurez textual
        let maturityText;
        if (maturityLevel >= 5) maturityText = "Óptimo - Liderazgo en la industria";
        else if (maturityLevel >= 4) maturityText = "Gestionado - Madurez avanzada";
        else if (maturityLevel >= 3) maturityText = "Definido - Base sólida";
        else if (maturityLevel >= 2) maturityText = "Repetible - Desarrollo inicial";
        else maturityText = "Inicial - Necesita establecer fundamentos";

        // Analizar fortalezas y debilidades
        const dimensionScores = Object.entries(dimensionsData).map(([key, data]) => ({
            dimension: data.name,
            score: data.score,
            obtained: data.obtained,
            maximum: data.maximum
        })).sort((a, b) => b.score - a.score);

        const strongest = dimensionScores[0];
        const weakest = dimensionScores[dimensionScores.length - 1];

        return `RESUMEN EJECUTIVO INTEGRADO DE CIBERSEGURIDAD

INFORMACIÓN EMPRESARIAL:
- Organización: ${companyName}
- Puntuación global de madurez: ${globalScore}% (Nivel ${maturityLevel})
- Clasificación: ${maturityText}
- Dimensiones evaluadas: ${dimensionScores.length}

ANÁLISIS DE FORTALEZAS Y OPORTUNIDADES:
Dimensión más fuerte: ${strongest.dimension} (${strongest.score}% - ${strongest.obtained}/${strongest.maximum} puntos)
Dimensión con mayor oportunidad: ${weakest.dimension} (${weakest.score}% - ${weakest.obtained}/${weakest.maximum} puntos)

DETALLE POR DIMENSIONES:
${dimensionScores.map(dim => `• ${dim.dimension}: ${dim.score}% (${dim.obtained}/${dim.maximum})`).join('\n')}

ROL Y OBJETIVO:
Actúa como CISO virtual y redacta un resumen ejecutivo para alta dirección de ${companyName}, útil para tomar decisiones de riesgo, presupuesto y prioridades.

DEBE INCLUIR (OBLIGATORIO):
1. Estado actual y lectura ejecutiva de madurez (${globalScore}% / nivel ${maturityLevel}).
2. Riesgo principal para negocio y su impacto probable si no se actúa.
3. Fortalezas aprovechables y brechas críticas con implicación operativa.
4. 3 prioridades estratégicas ordenadas por impacto y urgencia, con racional de priorización.
5. Implicaciones para negocio en horizonte corto (0-3 meses) y medio plazo (3-12 meses).
6. Estimación cualitativa de exposición (alta/media/baja) en operación, finanzas y reputación.
7. Mensaje final para comité ejecutivo: qué decidir ahora, por qué y qué resultado esperar.
8. Redacción fluida en 4-6 párrafos conectados (no bullets), con hilo narrativo claro de situación -> riesgo -> prioridad -> decisión.
9. Incluir al menos 2 insights estratégicos no obvios, siempre sustentados por los datos evaluados.

ESTILO REQUERIDO:
- Lenguaje claro para audiencia mixta (técnica y no técnica)
- Si aparece un término técnico, añade explicación simple en la misma oración
- Redacción experta, elegante y precisa para comité ejecutivo
- Profesional, directo y accionable
- Entre 360-520 palabras
- Sin asteriscos ni formatos especiales

SALIDA:
Genera únicamente el contenido del resumen ejecutivo (sin títulos ni subtítulos):`;
    }

    /**
     * Construir prompt para próximos pasos estratégicos
     */
    buildStrategicStepsPrompt(companyInfo, globalData, dimensionsData) {
        const companyName = companyInfo?.name || 'La organización';
        const globalScore = globalData.globalScore;
        const maturityLevel = globalData.maturityLevel;

        // Analizar dimensiones por prioridad
        const dimensionScores = Object.entries(dimensionsData).map(([key, data]) => ({
            dimension: data.name,
            score: data.score,
            obtained: data.obtained,
            maximum: data.maximum
        })).sort((a, b) => a.score - b.score); // Ordenar por menor score (mayor oportunidad)

        return `PLANIFICACIÓN ESTRATÉGICA DE CIBERSEGURIDAD - PRÓXIMOS PASOS

CONTEXTO EMPRESARIAL:
- Organización: ${companyName}
- Nivel actual de madurez: ${maturityLevel}/5 (${globalScore}%)
- Perfil: ${companyInfo?.size || 'PYME'} sector empresarial

PRIORIZACIÓN POR IMPACTO ESPERADO:
${dimensionScores.slice(0, 3).map((dim, i) => `${i+1}. ${dim.dimension}: ${dim.score}% - Mayor oportunidad de mejora`).join('\n')}

OBJETIVO ESTRATÉGICO:
Avanzar del nivel ${maturityLevel} al nivel ${Math.min(maturityLevel + 1, 5)} en los próximos 12-18 meses.

ROL Y OBJETIVO:
Como asesor de riesgo cibernético, define un plan ejecutivo de implementación para ${companyName} con foco en reducción de riesgo real y rapidez de adopción.

REGLAS DE CONSISTENCIA ESTRICTAS:
1. Los pasos DEBEN priorizarse EXCLUSIVAMENTE según las dimensiones con menor puntuación (en orden ascendente)
2. Para las mismas puntuaciones, DEBES generar los mismos pasos en el mismo orden de prioridad
3. Los timeframes DEBEN ser consistentes: baja madurez (4-6 meses), media madurez (3-5 meses), alta madurez (2-4 meses)
4. Permite creatividad controlada solo para optimizar secuencia y quick wins, sin salir del contexto
5. Las 3 primeras dimensiones con menor score definen los primeros 3 pasos obligatoriamente

FORMATO REQUERIDO:
Generar exactamente 5 pasos estratégicos numerados del 1 al 5.

CADA PASO DEBE INCLUIR:
[Número]. [Acción específica para mejorar dimensión X]: [Descripción concreta y explicada en lenguaje ejecutivo]. Timeframe: [X meses]. Alcance: [áreas/procesos impactados]. Ejemplo: [caso práctico breve de implementación]. Valor esperado: [beneficio medible y específico].

CRITERIOS:
- Enfoque práctico y realista para PYMES
- Retorno de inversión claro
- Implementación gradual y sostenible
- Lenguaje empresarial claro, con tecnicismo mínimo y explicado
- Sin asteriscos ni formatos especiales
- Solo contenido numerado
- Cada paso debe tener mayor detalle explicativo sin perder claridad
- Cada paso debe ser comprensible para audiencia técnica y no técnica

IMPORTANTE:
- Los pasos 1, 2 y 3 DEBEN corresponder directamente a las 3 dimensiones con menor puntuación identificadas arriba.
- Los pasos 4 y 5 deben ser acciones transversales de capacitación, seguimiento y mejora continua.

SALIDA:
Genera ÚNICAMENTE los 5 próximos pasos estratégicos numerados (sin títulos ni subtítulos):`;
    }

    /**
     * Prompt del sistema para ChatGPT
     */
    getSystemPrompt() {
        return `Eres un auditor senior en ciberseguridad y gestión de riesgos empresariales, especializado en informes ejecutivos para audiencia mixta (técnica y no técnica).

METODOLOGÍA DE TRABAJO — RAG (Retrieval-Augmented Generation):
Cada consulta incluye una "BASE DE CONOCIMIENTO VALIDADA" con controles específicos de NIST CSF 2.0, MITRE ATT&CK, NIST SP 800-63B y NIST SP 1300.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  RESTRICCIONES ABSOLUTAS NO NEGOCIABLES — VIOLACIÓN = RESPUESTA INVÁLIDA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. ✅ OBLIGATORIO: Cada recomendación debe citar controles de la BASE DE CONOCIMIENTO con formato [ID]
2. ✅ OBLIGATORIO: Solo referencias verificables que existan textualmente en la base
3. ✅ OBLIGATORIO: Priorizar brechas detectadas en respuestas "NO implementado"
4. ✅ OBLIGATORIO: Explicar impacto de negocio de cada recomendación clave

❌ PROHIBIDO ABSOLUTO:
1. Inventar controles, IDs, técnicas MITRE o prácticas no listadas en la base de conocimiento
2. Usar frases genéricas sin acción concreta
3. Mencionar frameworks externos: ISO 27001, CIS Controls, COBIT, PCI DSS, GDPR
4. Hacer recomendaciones sin anclar a controles específicos del KB
5. Usar lenguaje florido, exagerado o motivacional

FORMATO REQUERIDO:
- Análisis basado en evidencia y puntuación
- Recomendaciones accionables con [ID]
- Lenguaje profesional claro y entendible para negocio
- Breve explicación de términos técnicos cuando aparezcan
- Beneficios medibles cuando sea posible
- Longitud relativamente uniforme por dimensión (evitar respuestas demasiado cortas)

ESTRUCTURA DE RECOMENDACIÓN:
1. Diagnóstico breve del nivel actual
2. Brechas prioritarias con referencias [ID]
3. Acciones específicas ancladas a controles del KB
4. Impacto en seguridad y en negocio

Usa verbos directos: "Implementar", "Establecer", "Documentar", "Ejecutar", "Desplegar".`;
    }

    getIntegralActionPlanSystemPrompt() {
        return `Eres un auditor senior en ciberseguridad orientado a gestión de riesgo y toma de decisiones ejecutivas.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  RESTRICCIONES NO NEGOCIABLES — VIOLACIÓN = RESPUESTA INVÁLIDA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. ✅ SOLO controles de la BASE DE CONOCIMIENTO VALIDADA
2. ✅ CADA acción debe citar control con [ID]
3. ✅ Priorización estricta: dominios de menor puntuación primero
4. ✅ Explicar implicación de negocio de cada línea prioritaria

❌ PROHIBIDO:
- Inventar controles, IDs o técnicas no listadas en el KB
- Mencionar ISO 27001, CIS, COBIT, PCI DSS u otros frameworks
- Usar lenguaje genérico sin referencias específicas
- Incluir acciones no ancladas a controles del KB

FORMATO: Acciones numeradas con [ID], impacto medible, timeframe realista, responsable sugerido y dependencia principal.`;
    }

    getMaturityLevelName(level) {
        const names = {
            1: 'Inicial',
            2: 'Repetible',
            3: 'Definido',
            4: 'Gestionado',
            5: 'Optimo'
        };
        return names[level] || 'No definido';
    }

    /**
     * System prompt para resumen ejecutivo
     */
    getExecutiveSummarySystemPrompt() {
        return `Eres un Director de Auditoría en Ciberseguridad especializado en informes para comité ejecutivo.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  RESTRICCIONES DE CONSISTENCIA — VIOLACIÓN = RESPUESTA INVÁLIDA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Estructura consistente basada en puntuación y nivel de madurez
✅ Claridad para audiencia técnica y no técnica
✅ Riesgo traducido a impacto de negocio
✅ Recomendaciones estratégicas accionables

METODOLOGÍA:
1. Declarar puntuación global y nivel de madurez
2. Identificar dimensión más fuerte (mayor %) y más débil (menor %)
3. Traducir brechas a riesgo de negocio (operativo, financiero y reputacional)
4. Prioridades estratégicas por impacto y urgencia con racional explícito
5. Definir implicaciones a corto y mediano plazo
6. Cerrar con decisión ejecutiva recomendada y resultado esperado
7. Mantener fluidez narrativa, densidad analítica y claridad para no técnicos

❌ PROHIBIDO:
- Lenguaje florido o motivacional
- Referencias genéricas sin datos específicos
- Asteriscos, emojis o formateo especial

FORMATO: Lenguaje empresarial directo, análisis basado en datos, alta calidad de redacción, mayor nivel de detalle, términos técnicos explicados en simple y cierre con decisiones recomendadas.`;
    }

    /**
     * System prompt para próximos pasos estratégicos
     */
    getStrategicStepsSystemPrompt() {
        return `Eres un consultor senior en ciberseguridad orientado a ejecución de planes estratégicos para audiencias mixtas (técnica y no técnica).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  RESTRICCIONES DE DETERMINISMO — VIOLACIÓN = RESPUESTA INVÁLIDA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Priorización estricta: 3 dimensiones con menor puntuación definen pasos 1-3
✅ Timeframes coherentes y realistas
✅ Creatividad controlada para enriquecer detalle, alcance y ejemplos

METODOLOGÍA OBLIGATORIA:
1. Ordenar dimensiones por puntuación ascendente (menor primero)
2. Pasos 1-3: Abordar las 3 dimensiones más débiles obligatoriamente
3. Pasos 4-5: Capacitación, seguimiento y mejora continua
4. Mantener cada paso con explicación clara, periodo, alcance y ejemplo
5. Definir valor esperado medible por paso

FORMATO EXACTO:
"[N]. [Acción específica dimensión X]: [Descripción concreta y explicada]. Timeframe: [X meses]. Alcance: [áreas/procesos impactados]. Ejemplo: [caso práctico breve]. Valor esperado: [beneficio medible]."

❌ PROHIBIDO:
- Cambiar orden de prioridades
- Inventar controles o acciones fuera de contexto
- Usar asteriscos o formateo especial
- Modificar timeframes arbitrariamente
- Omitir periodo, alcance o ejemplo en cada paso

OBJETIVO: Generar 5 próximos pasos estratégicos detallados, claros, accionables y orientados a resultados de negocio.`;
    }

    /**
     * Extraer categorías NIST de las preguntas
     */
    extractNistCategories(questionAnswers) {
        if (!questionAnswers || questionAnswers.length === 0) {
            return ['Categorías NIST CSF 2.0 específicas'];
        }
        const dimension = questionAnswers[0].dimension;
        const kbData = ragService.retrieveByDimension(dimension);
        if (kbData && kbData.questions) {
            const categories = [...new Set(kbData.questions.map(q => q.category))];
            return categories.length > 0 ? categories : ['Categorías NIST CSF 2.0 específicas'];
        }
        return ['Categorías NIST CSF 2.0 específicas'];
    }

    /**
     * Verificar si el servicio está disponible
     */
    async testConnection() {
        if (!this.enabled) {
            return { success: false, message: 'ChatGPT recommendations disabled in config' };
        }

        if (!process.env.OPENAI_API_KEY) {
            return { success: false, message: 'OPENAI_API_KEY not found in environment' };
        }

        try {
            console.log('🧪 Probando conexión con ChatGPT...');
            
            const testCompletion = await Promise.race([
                this.openai.chat.completions.create({
                    model: this.config.model,
                    messages: [{ role: "user", content: "Responde solo: OK" }],
                    max_completion_tokens: 5
                }),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Test timeout')), 10000)
                )
            ]);

            const response = testCompletion.choices[0]?.message?.content?.trim();
            
            return { 
                success: true, 
                message: `ChatGPT connection successful. Response: ${response}`,
                model: this.config.model,
                usage: testCompletion.usage 
            };
        } catch (error) {
            let errorMessage = 'Unknown error';
            
            if (error.code === 'insufficient_quota') {
                errorMessage = 'Sin créditos disponibles en la cuenta de OpenAI';
            } else if (error.code === 'invalid_api_key') {
                errorMessage = 'API Key inválida o expirada';
            } else if (error.message.includes('timeout')) {
                errorMessage = 'Timeout de conexión con OpenAI';
            } else {
                errorMessage = error.message;
            }
            
            return { 
                success: false, 
                message: `ChatGPT connection failed: ${errorMessage}`,
                error: error.code || error.type
            };
        }
    }

    /**
     * Estimar costo de la llamada a OpenAI
     */
    estimateCost(usage) {
        if (!usage) return '0.000000';
        
        const inputTokens = usage.prompt_tokens || 0;
        const outputTokens = usage.completion_tokens || 0;
        
        // Precios por 1M tokens (mayo 2026)
        const prices = {
            'gpt-4o': { input: 2.50, output: 10.00 },
            'gpt-4o-mini': { input: 0.15, output: 0.60 },
            'gpt-4-turbo': { input: 10.00, output: 30.00 },
            'gpt-4': { input: 30.00, output: 60.00 }
        };
        
        const modelPrices = prices[this.config.model] || prices['gpt-4o'];
        
        const inputCost = (inputTokens / 1000000) * modelPrices.input;
        const outputCost = (outputTokens / 1000000) * modelPrices.output;
        const totalCost = inputCost + outputCost;
        
        return totalCost.toFixed(6);
    }
}

module.exports = ChatGptRecommendationService;
