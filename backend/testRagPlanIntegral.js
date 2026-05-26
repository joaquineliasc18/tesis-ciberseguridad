/**
 * Prueba Integral RAG — Plan de Acción Consolidado Multi-Dominio
 *
 * Simula una evaluación PYME completa con los 7 dominios NIST y genera un
 * Plan de Acción Integral usando el contexto RAG de todos los dominios con
 * Nivel de Madurez <= 3 (brechas críticas).
 *
 * Fases:
 *   1. Mock Data (respuestasFormulario) con puntajes por pregunta del KB.
 *   2. Motor de cálculo: score y % por dominio vs. maxScore del KB.
 *   3. Cálculo de Nivel de Madurez (1-5) basado en el % obtenido.
 *   4. Filtro de Brechas: dominios con Nivel <= 3.
 *   5. Construcción del bloque RAG consolidado (multi-dominio).
 *   6. (--api) Llamada única al LLM con contexto consolidado + análisis de anclaje.
 *
 * Uso:
 *   node testRagPlanIntegral.js
 *   node testRagPlanIntegral.js --api
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ── Variables de entorno ────────────────────────────────────────────────────
let dotenv = null;
try { dotenv = require('dotenv'); } catch (_) {}

const backendRoot  = __dirname;
const projectRoot  = path.join(__dirname, '..');

[
    path.join(projectRoot, '.env'),
    path.join(backendRoot, '.env')
].forEach(envPath => {
    if (!fs.existsSync(envPath)) return;
    if (dotenv) { dotenv.config({ path: envPath, override: false }); return; }
    fs.readFileSync(envPath, 'utf8')
        .split(/\r?\n/)
        .filter(l => l.trim() && !l.trim().startsWith('#'))
        .forEach(line => {
            const sep = line.indexOf('=');
            if (sep === -1) return;
            const key = line.slice(0, sep).trim();
            const val = line.slice(sep + 1).trim().replace(/^["']|["']$/g, '');
            if (key && process.env[key] === undefined) process.env[key] = val;
        });
});

const forceApi   = process.argv.includes('--api');
const realApiKey = process.env.OPENAI_API_KEY;

if (!process.env.OPENAI_API_KEY) {
    process.env.OPENAI_API_KEY = 'local-no-api-key';
}
if (realApiKey && !process.env.USE_CHATGPT_RECOMMENDATIONS) {
    process.env.USE_CHATGPT_RECOMMENDATIONS = 'true';
}

// ── Carga de dependencias del proyecto ─────────────────────────────────────
const ragService   = require('./services/ragService');
const knowledgeBase = require('./data/nistMitreKnowledgeBase.json');

// ── Utilidades de consola ───────────────────────────────────────────────────
const LINE  = '='.repeat(80);
const DLINE = '-'.repeat(80);

function title(text) {
    console.log('\n' + LINE);
    console.log(text);
    console.log(LINE);
}

function section(text) {
    console.log('\n' + DLINE);
    console.log(text);
    console.log(DLINE);
}

function col(str, w) { return String(str).padEnd(w); }
function colR(str, w) { return String(str).padStart(w); }

// ── 0. Frameworks permitidos (para validar anclaje) ─────────────────────────
function getAllKbControls() {
    return Object.values(knowledgeBase.dimensions)
        .flatMap(d => d.controls || []);
}
function getAllKbQuestions() {
    return Object.values(knowledgeBase.dimensions)
        .flatMap(d => d.questions || []);
}

// ── 1. MOCK DATA — respuestasFormulario ─────────────────────────────────────
/*
 * Puntajes simulados de una PYME con brechas claras en:
 *   GOBIERNO, IDENTIFICAR y RECUPERAR (scores 1-2, nivel 1-2)
 * y madurez media-alta en PROTEGER, RESPONDER (nivel 4).
 * DETECTAR e IMPROVE quedan en nivel 3 (zona de brecha según umbral <= 3).
 */
const PUNTAJE_POR_DOMINIO = {
    GOBIERNO:    0.27,   // ~27 %  → Nivel 2  (brecha)
    IDENTIFICAR: 0.20,   // ~20 %  → Nivel 1  (brecha)
    PROTEGER:    0.67,   // ~67 %  → Nivel 4  (ok)
    DETECTAR:    0.44,   // ~44 %  → Nivel 3  (brecha límite)
    RESPONDER:   0.75,   // ~75 %  → Nivel 4  (ok)
    RECUPERAR:   0.20,   // ~20 %  → Nivel 1  (brecha)
    IMPROVE:     0.42,   // ~42 %  → Nivel 3  (brecha límite)
};

function buildRespuestasFormulario() {
    const respuestasFormulario = [];

    Object.entries(knowledgeBase.dimensions).forEach(([dominio, dimData]) => {
        const fraccion = PUNTAJE_POR_DOMINIO[dominio] ?? 0.5;
        (dimData.questions || []).forEach((pregunta, idx) => {
            // Variación ligera por pregunta (+/- 10 %) para simular respuestas reales
            const variacion = ((idx % 3) - 1) * 0.10;
            const fracFinal = Math.max(0, Math.min(1, fraccion + variacion));
            const puntaje_obtenido = Math.max(0, Math.round(pregunta.maxScore * fracFinal));

            respuestasFormulario.push({
                dominio,
                id_pregunta:      pregunta.subcategoryId,
                puntaje_obtenido,
                puntaje_maximo:   pregunta.maxScore,
                categoria:        pregunta.category
            });
        });
    });

    return respuestasFormulario;
}

// ── 2. MOTOR DE CÁLCULO ─────────────────────────────────────────────────────
function calcularScoresPorDominio(respuestas) {
    const resumen = {};

    respuestas.forEach(r => {
        if (!resumen[r.dominio]) {
            const kbDim = knowledgeBase.dimensions[r.dominio] || {};
            resumen[r.dominio] = {
                dominio:        r.dominio,
                funcionId:      kbDim.functionId || '?',
                puntajeObtenido: 0,
                puntajeMaximo:  kbDim.maxScore || 0,
                totalPreguntas: (kbDim.questions || []).length,
            };
        }
        resumen[r.dominio].puntajeObtenido += r.puntaje_obtenido;
    });

    Object.values(resumen).forEach(d => {
        d.porcentaje = d.puntajeMaximo === 0
            ? 0
            : Math.round((d.puntajeObtenido / d.puntajeMaximo) * 100);
    });

    return resumen;
}

// ── 3. NIVEL DE MADUREZ ─────────────────────────────────────────────────────
function calcularNivelMadurez(porcentaje) {
    if (porcentaje <= 20) return 1;
    if (porcentaje <= 40) return 2;
    if (porcentaje <= 60) return 3;
    if (porcentaje <= 80) return 4;
    return 5;
}

const NOMBRE_NIVEL = {
    1: 'Inicial',
    2: 'Repetible',
    3: 'Definido',
    4: 'Gestionado',
    5: 'Óptimo'
};

// ── 5. CONSTRUCCIÓN DEL BLOQUE RAG CONSOLIDADO ──────────────────────────────
function buildRagConsolidado(dominiosBrecha) {
    const bloques = dominiosBrecha.map(dominio => ragService.buildKnowledgeBaseContext(dominio));
    return bloques.join('\n\n' + DLINE + '\n\n');
}

// ── 6. ANÁLISIS DE ANCLAJE ──────────────────────────────────────────────────
function analizarAnclaje(respuesta) {
    const idsControles   = new Set(getAllKbControls().map(c => c.id));
    const idsPreguntas   = new Set(getAllKbQuestions().map(q => q.subcategoryId));
    const frameworksOk   = new Set([
        knowledgeBase.metadata.framework,
        ...getAllKbControls().map(c => c.framework)
    ]);

    const externalFrameworks = [
        'ISO 27001', 'ISO/IEC 27001', 'CIS Controls', 'COBIT',
        'PCI DSS', 'HIPAA', 'SOC 2', 'NIST 800-53', 'NIST SP 800-53',
        'OWASP', 'GDPR', 'Zero Trust'
    ];

    const hitsExternos = externalFrameworks.filter(fw =>
        respuesta.toLowerCase().includes(fw.toLowerCase()) &&
        ![...frameworksOk].some(a => a.toLowerCase().includes(fw.toLowerCase()))
    );

    const idsEncontrados = [...new Set(
        (respuesta.match(/\b[A-Z]{2,3}(?:\.[A-Z]{2,3})?[-_.][A-Z]{0,3}\d{1,3}\b/g) || [])
    )];
    const idsForaDeKB = idsEncontrados.filter(id => !idsControles.has(id) && !idsPreguntas.has(id));

    return { hitsExternos, idsForaDeKB, anclado: hitsExternos.length === 0 && idsForaDeKB.length === 0 };
}

// ── PROMPT PARA PLAN INTEGRAL ────────────────────────────────────────────────
function buildPromptPlanIntegral(resumenDominios, dominiosBrecha, ragConsolidado) {
    const global = Object.values(resumenDominios);
    const totalObtenido = global.reduce((s, d) => s + d.puntajeObtenido, 0);
    const totalMaximo   = global.reduce((s, d) => s + d.puntajeMaximo, 0);
    const pctGlobal     = Math.round((totalObtenido / totalMaximo) * 100);
    const nivelGlobal   = calcularNivelMadurez(pctGlobal);

    const tablaResumen = global.map(d =>
        `• ${d.dominio} [${d.funcionId}]: ${d.puntajeObtenido}/${d.puntajeMaximo} pts ` +
        `(${d.porcentaje}%) — Nivel ${d.nivel} ${NOMBRE_NIVEL[d.nivel]}`
    ).join('\n');

    const brecha = dominiosBrecha.join(', ');

    return `PLAN DE ACCIÓN INTEGRAL — CONSULTORÍA EN CIBERSEGURIDAD

INFORMACIÓN DE LA ORGANIZACIÓN:
- Empresa: Empresa Demo PYME S.A.
- Sector: Servicios Tecnológicos / PYME
- Puntuación global: ${totalObtenido}/${totalMaximo} puntos (${pctGlobal}%)
- Nivel de Madurez Global: ${nivelGlobal} — ${NOMBRE_NIVEL[nivelGlobal]}

EVALUACIÓN POR DOMINIO NIST CSF 2.0:
${tablaResumen}

DOMINIOS CON BRECHAS CRÍTICAS (Nivel <= 3): ${brecha}

${ragConsolidado}

INSTRUCCIONES:
Eres un consultor senior en ciberseguridad especializado en NIST CSF 2.0 × MITRE ATT&CK.
Con base EXCLUSIVAMENTE en los controles listados en la BASE DE CONOCIMIENTO VALIDADA de arriba,
genera un Plan de Acción Integral para los dominios con brechas críticas: ${brecha}.

ESTRUCTURA DEL PLAN:
1. Diagnóstico ejecutivo (estado global y principales riesgos de negocio).
2. Prioridades de acción por dominio en brecha (ordenado de mayor a menor urgencia).
3. Controles inmediatos a implementar (referenciar IDs del KB: ej. GV.AU-SC1).
4. Hoja de ruta a 90 días con hitos concretos.
5. Indicadores de éxito medibles (KPIs) para cada dominio en brecha.

RESTRICCIONES:
- Basa tus recomendaciones EXCLUSIVAMENTE en los controles listados en la BASE DE CONOCIMIENTO VALIDADA.
- No recomiendes controles que no aparezcan en esa base de conocimiento.
- No menciones ISO 27001, CIS Controls, COBIT, PCI DSS ni otros frameworks externos.
- Lenguaje ejecutivo, entre 400-600 palabras, sin asteriscos ni formatos especiales.

Genera ÚNICAMENTE el contenido del plan (sin título ni subtítulos adicionales):`;
}

// ── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
    title('PRUEBA INTEGRAL RAG — Plan de Acción Consolidado Multi-Dominio');
    console.log(`Backend:  ${backendRoot}`);
    console.log(`Modo API: ${forceApi ? 'activo (--api)' : 'solo análisis local'}`);
    console.log(`Modelo:   ${process.env.OPENAI_MODEL || 'gpt-4o-mini'}`);
    console.log(`Node.js:  ${process.version}`);

    // ── FASE 1: Mock Data ───────────────────────────────────────────────────
    title('FASE 1 — Mock Data: respuestasFormulario (PYME simulada)');

    const respuestasFormulario = buildRespuestasFormulario();

    console.log(`Total de respuestas generadas: ${respuestasFormulario.length}\n`);
    console.log('Muestra (primeras 10 entradas):');
    console.log(col('DOMINIO', 14) + col('ID_PREGUNTA', 16) + colR('OBTENIDO', 10) + colR('MÁXIMO', 8) + '  CATEGORÍA');
    console.log(DLINE);
    respuestasFormulario.slice(0, 10).forEach(r => {
        console.log(
            col(r.dominio, 14) +
            col(r.id_pregunta, 16) +
            colR(r.puntaje_obtenido, 10) +
            colR(r.puntaje_maximo, 8) +
            '  ' + r.categoria
        );
    });
    if (respuestasFormulario.length > 10) {
        console.log(`  ... y ${respuestasFormulario.length - 10} entradas más.`);
    }

    // ── FASE 2: Motor de Cálculo ────────────────────────────────────────────
    title('FASE 2 — Motor de Cálculo: Score por dominio');

    const resumenDominios = calcularScoresPorDominio(respuestasFormulario);

    console.log(
        col('DOMINIO', 14) + col('FN', 5) +
        colR('OBTENIDO', 10) + colR('MÁXIMO', 8) +
        colR('%', 6) + '  PREGUNTAS'
    );
    console.log(DLINE);
    Object.values(resumenDominios).forEach(d => {
        console.log(
            col(d.dominio, 14) + col(d.funcionId, 5) +
            colR(d.puntajeObtenido, 10) + colR(d.puntajeMaximo, 8) +
            colR(d.porcentaje + '%', 6) + '  ' + d.totalPreguntas
        );
    });

    const totalObtenido = Object.values(resumenDominios).reduce((s, d) => s + d.puntajeObtenido, 0);
    const totalMaximo   = Object.values(resumenDominios).reduce((s, d) => s + d.puntajeMaximo, 0);
    const pctGlobal     = Math.round((totalObtenido / totalMaximo) * 100);
    console.log(DLINE);
    console.log(col('GLOBAL', 14) + col('', 5) + colR(totalObtenido, 10) + colR(totalMaximo, 8) + colR(pctGlobal + '%', 6));

    // ── FASE 3: Nivel de Madurez ────────────────────────────────────────────
    title('FASE 3 — Cálculo de Nivel de Madurez (escala 1-5)');

    console.log('Escala: 0-20% = Nivel 1 | 21-40% = Nivel 2 | 41-60% = Nivel 3 | 61-80% = Nivel 4 | 81-100% = Nivel 5\n');
    console.log(col('DOMINIO', 14) + colR('%', 6) + colR('NIVEL', 7) + '  NOMBRE');
    console.log(DLINE);

    Object.values(resumenDominios).forEach(d => {
        d.nivel = calcularNivelMadurez(d.porcentaje);
        console.log(
            col(d.dominio, 14) +
            colR(d.porcentaje + '%', 6) +
            colR(d.nivel, 7) +
            '  ' + NOMBRE_NIVEL[d.nivel]
        );
    });

    const nivelGlobal = calcularNivelMadurez(pctGlobal);
    console.log(DLINE);
    console.log(col('GLOBAL', 14) + colR(pctGlobal + '%', 6) + colR(nivelGlobal, 7) + '  ' + NOMBRE_NIVEL[nivelGlobal]);

    // ── FASE 4: Filtro de Brechas ───────────────────────────────────────────
    title('FASE 4 — Filtro de Brechas (Nivel de Madurez <= 3)');

    const dominiosBrecha = Object.values(resumenDominios)
        .filter(d => d.nivel <= 3)
        .sort((a, b) => a.nivel - b.nivel)
        .map(d => d.dominio);

    const dominiosOk = Object.values(resumenDominios)
        .filter(d => d.nivel > 3)
        .map(d => d.dominio);

    console.log(`Dominios con brecha crítica (${dominiosBrecha.length}): ${dominiosBrecha.join(', ')}`);
    console.log(`Dominios sin brecha        (${dominiosOk.length}): ${dominiosOk.join(', ')}`);

    // ── FASE 5: RAG Consolidado ─────────────────────────────────────────────
    title('FASE 5 — Construcción del Bloque RAG Consolidado');

    const ragConsolidado = buildRagConsolidado(dominiosBrecha);
    const lineasRag = ragConsolidado.split('\n').length;

    console.log(`Dominios inyectados al RAG: ${dominiosBrecha.join(', ')}`);
    console.log(`Tamaño del contexto RAG consolidado: ${ragConsolidado.length} chars | ${lineasRag} líneas`);
    console.log('\nVista previa del RAG consolidado (primeros 600 chars):');
    console.log(ragConsolidado.slice(0, 600));
    if (ragConsolidado.length > 600) console.log('  ... [RAG truncado en vista previa]');

    // ── FASE 6: LLM — Plan de Acción Integral ──────────────────────────────
    title('FASE 6 — Plan de Acción Integral (LLM con contexto consolidado)');

    if (!forceApi) {
        console.log('Fase 6 omitida: agrega --api para llamar al LLM.');
        console.log('Comando: node testRagPlanIntegral.js --api');
        title('Resultado');
        console.log('Análisis local completado (fases 1-5). RAG consolidado listo para producción.');
        return;
    }

    if (!realApiKey) {
        console.log('OPENAI_API_KEY no definida — fase 6 omitida.');
        return;
    }

    let planAccion;
    try {
        const ChatGptRecommendationService = require('./services/chatGptRecommendationService');
        const chatGptService = new ChatGptRecommendationService();
        const companyInfo = {
            name: 'Empresa Demo PYME S.A.',
            sector: 'Servicios Tecnologicos',
            size: 'PYME'
        };
        const globalData = {
            totalObtenido,
            totalMaximo,
            porcentajeGlobal: pctGlobal,
            nivelGlobal
        };

        console.log('Llamando al chatGptRecommendationService.generateIntegralActionPlan...');
        planAccion = await chatGptService.generateIntegralActionPlan(
            companyInfo,
            globalData,
            Object.values(resumenDominios),
            dominiosBrecha,
            ragConsolidado
        );
/*
        const completion = await Promise.race([
            openai.chat.completions.create({
                model,
                messages: [
                    {
                        role: 'system',
                        content:
                            'Eres un consultor senior en ciberseguridad con 15 años de experiencia ' +
                            'en NIST CSF 2.0, MITRE ATT&CK y NIST SP 800-63B. ' +
                            'Respondes EXCLUSIVAMENTE con base en la BASE DE CONOCIMIENTO VALIDADA ' +
                            'provista en el mensaje del usuario. ' +
                            'No inventas controles ni referencias frameworks externos al alcance definido.'
                    },
                    { role: 'user', content: promptIntegral }
                ],
                max_completion_tokens: maxTok
            }),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout de llamada al LLM')), timeout)
            )
        ]);

        const rawContent = completion.choices[0]?.message?.content;
        planAccion = Array.isArray(rawContent)
            ? rawContent.map(b => b.text || '').join('').trim()
            : (rawContent || '').trim();

        if (!planAccion) throw new Error('El LLM devolvió contenido vacío');
*/

    } catch (err) {
        console.error(`\n[FALLO] Error en llamada al LLM: ${err.message}`);
        process.exitCode = 1;
        return;
    }

    section('PLAN DE ACCIÓN INTEGRAL — Respuesta del LLM');
    console.log(planAccion);

    // ── Análisis de anclaje ─────────────────────────────────────────────────
    section('Análisis de Anclaje (validación anti-alucinación)');

    const anclaje = analizarAnclaje(planAccion);
    const check = (ok, msg) => console.log(`${ok ? '[OK]   ' : '[FALLO]'} ${msg}`);

    check(anclaje.hitsExternos.length === 0,
        `Frameworks externos detectados: ${anclaje.hitsExternos.join(', ') || 'ninguno'}`);
    check(anclaje.idsForaDeKB === undefined || anclaje.idsForaDeKB.length === 0,
        `IDs fuera del KB detectados: ${(anclaje.idsForaDeKB || []).join(', ') || 'ninguno'}`);
    check(anclaje.anclado,
        anclaje.anclado
            ? 'Respuesta anclada al KB — validación RAG superada en múltiples dominios simultáneos.'
            : 'ATENCIÓN: posibles referencias fuera del KB. Revisar respuesta.');

    console.log(`\nDominios evaluados en una sola llamada: ${dominiosBrecha.join(', ')}`);
    console.log(`Longitud de la respuesta: ${planAccion.length} caracteres`);

    title('Resultado Final');
    console.log(`Score global: ${pctGlobal}% | Nivel de madurez global: ${nivelGlobal} (${NOMBRE_NIVEL[nivelGlobal]})`);
    console.log(`Dominios con brecha: ${dominiosBrecha.length} → RAG consolidado operativo.`);
    console.log(anclaje.anclado
        ? 'VALIDACIÓN SUPERADA — Plan de Acción Integral generado sin alucinaciones detectadas.'
        : 'HAY OBSERVACIONES — Revisar las referencias detectadas fuera del KB.'
    );
}

main().catch(err => {
    console.error('\n[FALLO CRÍTICO]', err.message);
    process.exitCode = 1;
});
