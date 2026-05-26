/**
 * Servicio de Recomendaciones Personalizadas con ChatGPT
 * Genera recomendaciones contextuales de ciberseguridad usando OpenAI GPT-4
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
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 1500,
            temperature: process.env.OPENAI_TEMPERATURE !== undefined ? parseFloat(process.env.OPENAI_TEMPERATURE) : 0.7,
            timeout: parseInt(process.env.CHATGPT_TIMEOUT) || 30000
        };
        
        this.enabled = process.env.USE_CHATGPT_RECOMMENDATIONS === 'true';
        
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
            
            console.log(`🤖 Generando recomendación ChatGPT para ${dimension}...`);
            console.log(`📊 Score: ${dimensionData.score}% | Preguntas: ${questionAnswers.length}`);
            
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
            const recommendation = Array.isArray(rawContent)
                ? rawContent.map(b => b.text || '').join('').trim()
                : (rawContent || '').trim();

            if (!recommendation) {
                throw new Error('Empty response from ChatGPT');
            }

            console.log(`✅ Recomendación ChatGPT generada para ${dimension} (${recommendation.length} caracteres)`);
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

        const recommendations = {};
        const dimensions = Object.keys(dimensionsData);
        
        console.log(`🤖 Iniciando generación ChatGPT para ${dimensions.length} dimensiones...`);

        for (const dimension of dimensions) {
            try {
                const dimensionData = dimensionsData[dimension];
                const questionAnswers = allQuestionAnswers.filter(qa => 
                    qa.dimension === dimension
                );
                const nistCategories = this.extractNistCategories(questionAnswers);
                
                const recommendation = await this.generateDimensionRecommendation(
                    companyInfo, 
                    dimension, 
                    dimensionData, 
                    questionAnswers, 
                    nistCategories
                );
                
                recommendations[dimension] = {
                    score: dimensionData.score,
                    recommendation: recommendation,
                    categories: nistCategories,
                    source: 'ChatGPT',
                    timestamp: new Date().toISOString()
                };
                
            } catch (error) {
                console.error(`❌ Error en ${dimension}, usando fallback:`, error.message);
                // En caso de error, retornamos null para que use el sistema fallback
                recommendations[dimension] = null;
            }
        }

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

            const summary = completion.choices[0]?.message?.content?.trim();
            
            if (!summary) {
                throw new Error('Empty executive summary from ChatGPT');
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
            throw new Error('ChatGPT recommendations are disabled');
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
            throw error;
        }
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

        return `CONSULTORÍA EN CIBERSEGURIDAD - ANÁLISIS PERSONALIZADO

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

INSTRUCCIONES:
Como consultor senior especializado en NIST CSF 2.0, genera una recomendación específica y personalizada para ${companyName} en la dimensión ${dimension}.

DEBE INCLUIR:
1. Análisis contextual del nivel actual (${score}% - ${maturityLevel})
2. Identificación de gaps específicos basados en las respuestas "NO implementado"
3. Plan de acción priorizado y realista, referenciando controles de la base de conocimiento validada
4. Beneficios esperados de implementar las mejoras
5. Consideraciones específicas para el tamaño/contexto de la organización

RESTRICCIONES CRÍTICAS (NO NEGOCIABLES):
1. Basa tus recomendaciones EXCLUSIVAMENTE en los controles listados en la "BASE DE CONOCIMIENTO VALIDADA" de arriba
2. NO recomiendes controles ni prácticas que no aparezcan en esa base de conocimiento
3. CADA recomendación DEBE referenciar al menos un control de la base con su [ID]
4. NO uses creatividad - usa solo lo que está validado en la base
5. DEBES ser CONSISTENTE: si ves el mismo archivo dos veces, da la MISMA respuesta
6. Si un gap no puede resolverse con controles del KB, NO lo menciones

ESTILO REQUERIDO:
- Profesional y ejecutivo (SIN asteriscos, títulos adicionales ni formatos especiales)
- Específico a las respuestas dadas
- Accionable y priorizado
- Entre 150-250 palabras
- Dirigido a liderazgo empresarial
- Usar descripciones legibles en lugar de códigos técnicos
- SOLO el contenido de la recomendación, sin subtítulos

Genera ÚNICAMENTE el contenido de la recomendación personalizada (sin títulos ni subtítulos):`;
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

        return `PLAN DE ACCION INTEGRAL - CONSULTORIA EN CIBERSEGURIDAD

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

INSTRUCCIONES:
Eres un consultor senior en ciberseguridad especializado en NIST CSF 2.0, MITRE ATT&CK, NIST SP 800-63B y NIST SP 1300.
Con base EXCLUSIVAMENTE en los controles listados en la BASE DE CONOCIMIENTO VALIDADA de arriba,
genera un Plan de Accion Integral para los dominios con brechas criticas: ${gaps.join(', ')}.

ESTRUCTURA DEL PLAN:
1. Diagnostico ejecutivo del estado global y principales riesgos de negocio.
2. Prioridades de accion por dominio en brecha, ordenadas de mayor a menor urgencia.
3. Controles inmediatos a implementar, referenciando solo IDs existentes en el KB.
4. Hoja de ruta a 90 dias con hitos concretos.
5. Indicadores de exito medibles para cada dominio en brecha.

RESTRICCIONES CRITICAS (NO NEGOCIABLES):
1. Basa tus recomendaciones EXCLUSIVAMENTE en los controles listados en la BASE DE CONOCIMIENTO VALIDADA
2. NO recomiendes controles que no aparezcan en esa base de conocimiento
3. CADA accion DEBE referenciar al menos un control del KB con su [ID]
4. NO menciones ISO 27001, CIS Controls, COBIT, PCI DSS ni otros frameworks externos
5. NO uses creatividad - usa solo lo que está validado en la base
6. DEBES ser CONSISTENTE: mismos datos = mismo plan
7. Lenguaje ejecutivo, entre 400-600 palabras, sin asteriscos ni formatos especiales

Genera UNICAMENTE el contenido del plan, sin titulo ni subtitulos adicionales:`;
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

        return `RESUMEN EJECUTIVO INTEGRADO - CONSULTORÍA ESTRATÉGICA EN CIBERSEGURIDAD

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

INSTRUCCIONES:
Como consultor ejecutivo senior, redacta un resumen integrado estratégico para ${companyName} dirigido a la alta dirección.

DEBE INCLUIR:
1. Evaluación estratégica del estado actual de ciberseguridad
2. Posición competitiva en el mercado según el nivel alcanzado
3. Impacto en el negocio y gestión de riesgos empresariales
4. Oportunidades de mejora priorizadas por valor de negocio
5. Visión estratégica para fortalecer la postura de seguridad

ESTILO REQUERIDO:
- Lenguaje ejecutivo y estratégico (NO técnico)
- Enfocado en resultados de negocio
- Profesional y conciso
- Entre 200-300 palabras
- SIN asteriscos, títulos adicionales o formatos especiales
- Dirigido a CEO/directores empresariales
- SOLO el contenido del resumen, sin subtítulos

Genera ÚNICAMENTE el contenido del resumen ejecutivo integrado (sin títulos ni subtítulos):`;
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

INSTRUCCIONES:
Como consultor estratégico, define un plan de acción ejecutivo con los próximos pasos específicos para ${companyName}.

REGLAS DE CONSISTENCIA ESTRICTAS:
1. Los pasos DEBEN priorizarse EXCLUSIVAMENTE según las dimensiones con menor puntuación (en orden ascendente)
2. Para las mismas puntuaciones, DEBES generar exactamente los mismos pasos en el mismo orden
3. Los timeframes DEBEN ser consistentes: baja madurez (4-6 meses), media madurez (3-5 meses), alta madurez (2-4 meses)
4. PROHIBIDO usar creatividad - los pasos deben ser predecibles y deterministas
5. Las 3 primeras dimensiones con menor score definen los primeros 3 pasos obligatoriamente

FORMATO REQUERIDO:
Generar exactamente 5 pasos estratégicos numerados del 1 al 5.

CADA PASO DEBE INCLUIR (formato exacto):
[Número]. [Acción específica para mejorar dimensión X]: [Descripción concreta]. Timeframe: [X meses]. Valor esperado: [Beneficio medible y específico]

CRITERIOS:
- Enfoque práctico y realista para PYMES
- Retorno de inversión claro
- Implementación gradual y sostenible
- Lenguaje empresarial (NO técnico)
- SIN asteriscos, títulos adicionales o formatos especiales
- SOLO el contenido numerado, sin subtítulos
- CONSISTENCIA ABSOLUTA: mismos datos = mismos pasos

IMPORTANTE: Los pasos 1, 2 y 3 DEBEN corresponder directamente a las 3 dimensiones con menor puntuación identificadas arriba. Los pasos 4 y 5 deben ser acciones transversales de capacitación y mejora continua.

Genera ÚNICAMENTE los 5 próximos pasos estratégicos numerados (sin títulos ni subtítulos):`;
    }

    /**
     * Prompt del sistema para ChatGPT
     */
    getSystemPrompt() {
        return `Eres un consultor senior en ciberseguridad con más de 15 años de experiencia, especializado en el framework NIST CSF 2.0 y evaluaciones de madurez empresarial en el dominio de credenciales robadas (Credential Access).

Tu expertise incluye:
- Implementación práctica de controles NIST CSF 2.0, NIST SP 800-63B y NIST SP 1300
- Mitigación de técnicas MITRE ATT&CK relacionadas con Credential Access
- Transformación digital y modernización de seguridad
- Gestión de riesgos empresariales
- Consultoría estratégica para PYMES y empresas grandes

METODOLOGÍA DE TRABAJO — RAG (Retrieval-Augmented Generation):
Cada consulta que recibes incluye una sección "BASE DE CONOCIMIENTO VALIDADA" con los controles exactos del marco NIST CSF 2.0 × MITRE ATT&CK × NIST SP 800-63B × NIST SP 1300 que aplican a esa dimensión.

REGLAS FUNDAMENTALES ABSOLUTAS:
✅ SOLO puedes recomendar controles, prácticas o acciones que estén EXPLÍCITAMENTE listados en la "BASE DE CONOCIMIENTO VALIDADA" del prompt.
✅ DEBES ser 100% CONSISTENTE: si analizas el mismo archivo dos veces, DEBES dar exactamente la misma recomendación.
✅ CADA recomendación DEBE referenciar al menos un control específico de la base de conocimiento ([ID]).
✅ PRIORIZAS controles ya validados en la base de conocimiento según el nivel de madurez y gaps identificados.

❌ PROHIBIDO ABSOLUTO:
- NO inventes controles, referencias de frameworks, técnicas MITRE o prácticas que no aparezcan en la base de conocimiento.
- NO hagas recomendaciones genéricas de ciberseguridad fuera del alcance de la base de conocimiento.
- NO des diferentes recomendaciones para el mismo análisis.
- NO uses creatividad - usa únicamente lo que está en el conocimiento validado.

CARACTERÍSTICAS DE TUS RECOMENDACIONES:
✅ Ancladas en los controles de la base de conocimiento validada
✅ Específicas al contexto y respuestas de cada empresa
✅ Priorizadas por impacto y factibilidad
✅ Enfocadas en resultados de negocio
✅ Realistas según el nivel de madurez actual
✅ Consideran limitaciones de recursos típicas de PYMES
✅ DETERMINISTAS: mismos datos = misma recomendación

Mantén un tono profesional, consultivo y orientado a la acción.

FORMATO EMPRESARIAL:
- NO uses asteriscos, títulos adicionales, códigos técnicos, o formatos especiales
- Traduce los IDs de control a descripciones de negocio legibles
- Enfócate en valor de negocio y beneficios tangibles
- Usa lenguaje ejecutivo apropiado para alta dirección
- SOLO el contenido de la recomendación, sin subtítulos como "**Recomendación para...**"`;
    }

    getIntegralActionPlanSystemPrompt() {
        return `Eres un consultor senior en ciberseguridad con 15 anos de experiencia en NIST CSF 2.0, MITRE ATT&CK, NIST SP 800-63B y NIST SP 1300.

REGLAS ABSOLUTAS:
✅ Respondes EXCLUSIVAMENTE con base en la BASE DE CONOCIMIENTO VALIDADA provista en el mensaje del usuario.
✅ CADA accion DEBE referenciar controles específicos del KB con su [ID].
✅ DEBES ser 100% CONSISTENTE: mismos datos de entrada = mismo plan de salida.
✅ Mantienes lenguaje ejecutivo, accionable y apto para una PYME.

❌ PROHIBIDO ABSOLUTO:
- NO inventes controles, IDs, tecnicas MITRE ni referencias a frameworks externos.
- NO menciones ISO 27001, CIS Controls, COBIT, PCI DSS ni otros frameworks.
- NO uses creatividad - usa únicamente lo que está en el conocimiento validado.
- Si una accion no puede anclarse a un control del KB, NO la incluyas.`;
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
        return `Eres un Director de Consultoría en Ciberseguridad de una firma internacional de prestigio, con más de 20 años de experiencia asesorando a CEOs y juntas directivas.

REGLAS ABSOLUTAS DE CONSISTENCIA:
✅ DEBES ser 100% DETERMINISTA: para los mismos datos de entrada, DEBES generar exactamente el mismo resumen.
✅ Usa la misma estructura narrativa siempre para el mismo nivel de madurez.
✅ Las comparaciones con la industria deben ser idénticas para mismas puntuaciones.
✅ NO uses creatividad - mantén consistencia absoluta en la redacción.
✅ Misma evaluación = mismo resumen ejecutivo

METODOLOGÍA DETERMINISTA:
1. Analizar puntuación global y nivel de madurez
2. Identificar dimensión más fuerte y más débil
3. Usar plantilla fija para el nivel de madurez correspondiente
4. Mantener el mismo orden de presentación de ideas

CARACTERÍSTICAS DE TUS RESÚMENES EJECUTIVOS:
✅ Lenguaje empresarial estratégico (nunca técnico)
✅ Enfoque en impacto de negocio y gestión de riesgos
✅ Comparación con benchmarks de la industria
✅ ROI y valor empresarial claro
✅ Visión estratégica a largo plazo
✅ Consideración de recursos y realidades empresariales
✅ CONSISTENCIA ABSOLUTA en estructura y contenido

NUNCA uses:
❌ Jerga técnica o códigos de sistemas
❌ Asteriscos o formateo especial
❌ Títulos adicionales o subtítulos
❌ Recomendaciones puramente técnicas
❌ Términos como "implementar controles" sin contexto de negocio

SIEMPRE incluyes:
✅ Posición competitiva y riesgos empresariales
✅ Oportunidades de mejora con impacto cuantificable
✅ Consideraciones estratégicas para el crecimiento
✅ Elementos que fortalecen la confianza de stakeholders

Tu audiencia son CEOs, CFOs, y miembros de junta directiva que necesitan entender cómo la ciberseguridad impacta los objetivos estratégicos del negocio.`;
    }

    /**
     * System prompt para próximos pasos estratégicos
     */
    getStrategicStepsSystemPrompt() {
        return `Eres un Consultor Senior en Transformación Digital y Ciberseguridad, especializado en crear roadmaps estratégicos para empresas medianas que buscan fortalecer su postura de seguridad de manera sostenible y rentable.

REGLAS ABSOLUTAS DE CONSISTENCIA:
✅ DEBES ser 100% DETERMINISTA: para los mismos datos de entrada, DEBES generar exactamente los mismos 5 pasos en el mismo orden.
✅ Los pasos DEBEN priorizarse estrictamente según el orden de las dimensiones con menor puntuación.
✅ Los timeframes DEBEN calcularse de forma determinista basados en el nivel de madurez.
✅ NO uses creatividad - los pasos deben ser predecibles y repetibles.
✅ Misma evaluación = mismos pasos estratégicos

METODOLOGÍA DETERMINISTA:
1. Identificar las 3 dimensiones con menor puntuación
2. Asignar pasos estratégicos basados en esas dimensiones específicas
3. Usar timeframes fijos basados en complejidad de implementación
4. Mantener el mismo orden de priorización siempre

ESTRUCTURA REQUERIDA:
Cada paso debe seguir este formato empresarial exacto:
"[Número]. [Título de la Iniciativa]: [Descripción específica]. Timeframe: [X meses]. Valor esperado: [beneficio concreto para el negocio]."

PROHIBICIONES ABSOLUTAS:
❌ NO uses creatividad ni variación en la redacción
❌ NO cambies el orden de los pasos entre ejecuciones
❌ NO inventes pasos nuevos - usa los gaps identificados
❌ NO incluyas asteriscos o formateo especial
❌ NO cambies timeframes para la misma dimensión

OBJETIVO: Generar un roadmap completamente predecible y consistente que se repita idénticamente para la misma evaluación.`;
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
}

module.exports = ChatGptRecommendationService;
