/**
 * Prueba definitiva de validacion RAG para TODOS los dominios NIST/MITRE.
 *
 * Ejecuta las 4 fases en los 7 dominios del knowledge base y genera un
 * resumen consolidado al final. No levanta Express ni conecta a n8n.
 *
 * Fases por dominio:
 *   1. Integridad del knowledge base (una sola vez, global)
 *   2. Contexto RAG inyectado al prompt
 *   3. Construccion y validacion del prompt completo
 *   4. Llamada opcional a OpenAI y analisis de anclaje
 *
 * Uso:
 *   node testRagValidationAll.js
 *   node testRagValidationAll.js --api
 *   node testRagValidationAll.js --brief        (oculta el bloque RAG completo)
 */

const fs = require('fs');
const path = require('path');
let dotenv = null;

try {
    dotenv = require('dotenv');
} catch (_) {}

const backendRoot = __dirname;
const projectRoot = path.join(__dirname, '..');

[
    path.join(projectRoot, '.env'),
    path.join(backendRoot, '.env')
].forEach(envPath => {
    if (!fs.existsSync(envPath)) return;
    if (dotenv) {
        dotenv.config({ path: envPath, override: false });
        return;
    }
    fs.readFileSync(envPath, 'utf8')
        .split(/\r?\n/)
        .filter(line => line.trim() && !line.trim().startsWith('#'))
        .forEach(line => {
            const sep = line.indexOf('=');
            if (sep === -1) return;
            const key = line.slice(0, sep).trim();
            const value = line.slice(sep + 1).trim().replace(/^["']|["']$/g, '');
            if (key && process.env[key] === undefined) process.env[key] = value;
        });
});

const args = process.argv.slice(2);
const forceApi = args.includes('--api');
const briefMode = args.includes('--brief');
const realApiKey = process.env.OPENAI_API_KEY;
const nodeMajor = parseInt(process.versions.node.split('.')[0], 10);

if (!process.env.OPENAI_API_KEY) {
    process.env.OPENAI_API_KEY = 'local-rag-validation-no-api-key';
}
if (realApiKey && !process.env.USE_CHATGPT_RECOMMENDATIONS) {
    process.env.USE_CHATGPT_RECOMMENDATIONS = 'true';
}

const ragService = require('./services/ragService');
const knowledgeBase = require('./data/nistMitreKnowledgeBase.json');

const ALL_DIMENSIONS = Object.keys(knowledgeBase.dimensions);

let chatGptService = null;

function getChatGptService() {
    if (chatGptService) return chatGptService;
    if (nodeMajor < 18) {
        throw new Error(
            `Fase 3/4 requiere Node.js 18+. Version actual: ${process.version}`
        );
    }
    const ChatGptRecommendationService = require('./services/chatGptRecommendationService');
    chatGptService = new ChatGptRecommendationService();
    return chatGptService;
}

function explainServiceLoadError(error) {
    if (error && error.code === 'MODULE_NOT_FOUND') {
        return `${error.message}. Ejecuta "npm install" dentro de backend.`;
    }
    return error.message;
}

function hr(char = '=', width = 80) {
    return char.repeat(width);
}

function printTitle(title) {
    console.log('\n' + hr());
    console.log(title);
    console.log(hr());
}

function printSubtitle(title) {
    console.log('\n' + hr('-'));
    console.log(title);
    console.log(hr('-'));
}

function printCheck(ok, message) {
    console.log(`${ok ? '[OK]   ' : '[FALLO]'} ${message}`);
}

function unique(values) {
    return Array.from(new Set(values.filter(Boolean)));
}

function objectValues(obj) {
    return Object.keys(obj).map(k => obj[k]);
}

function getAllControls() {
    return objectValues(knowledgeBase.dimensions).reduce((all, dim) => all.concat(dim.controls || []), []);
}

function getAllQuestions() {
    return objectValues(knowledgeBase.dimensions).reduce((all, dim) => all.concat(dim.questions || []), []);
}

// ──────────────────────────────────────────────
// FASE 1: Integridad global del knowledge base
// ──────────────────────────────────────────────
function validateKnowledgeBase() {
    printTitle('FASE 1 — Integridad del Knowledge Base (global)');

    const dims = Object.entries(knowledgeBase.dimensions || {});
    const maturityLevels = knowledgeBase.maturityLevels || [];
    const allQuestions = getAllQuestions();
    const allControls = getAllControls();
    const metadata = knowledgeBase.metadata || {};

    printCheck(Boolean(metadata.source), `Fuente: ${metadata.source || 'NO DEFINIDA'}`);
    printCheck(dims.length === ALL_DIMENSIONS.length, `Dominios cargados: ${dims.length} / ${ALL_DIMENSIONS.length} esperados`);
    printCheck(maturityLevels.length === 5, `Niveles de madurez: ${maturityLevels.length} / 5 esperados`);
    printCheck(allQuestions.length > 0, `Total preguntas en KB: ${allQuestions.length}`);
    printCheck(allControls.length > 0, `Total controles en KB: ${allControls.length}`);

    console.log('');
    const problems = [];
    dims.forEach(([name, data]) => {
        const questions = data.questions || [];
        const controls = data.controls || [];
        const sumFromQuestions = questions.reduce((s, q) => s + Number(q.maxScore || 0), 0);
        const scoreMatch = Number(data.maxScore) === sumFromQuestions;

        console.log(
            `  ${name.padEnd(12)} | preguntas: ${String(questions.length).padStart(2)}` +
            ` | controles: ${String(controls.length).padStart(2)}` +
            ` | maxScore: ${String(data.maxScore).padStart(3)}` +
            ` | suma preguntas: ${String(sumFromQuestions).padStart(3)}` +
            (scoreMatch ? '' : ' <-- DESCUADRE')
        );

        if (!data.functionId) problems.push(`${name}: falta functionId`);
        if (!questions.length) problems.push(`${name}: sin preguntas`);
        if (!controls.length) problems.push(`${name}: sin controles`);
        if (!scoreMatch) problems.push(`${name}: maxScore ${data.maxScore} !== suma ${sumFromQuestions}`);

        questions.forEach(q => {
            if (!q.subcategoryId || !q.category || !q.question) {
                problems.push(`${name}: pregunta incompleta → ${JSON.stringify(q)}`);
            }
        });
        controls.forEach(c => {
            if (!c.id || !c.description || !c.framework) {
                problems.push(`${name}: control incompleto → ${JSON.stringify(c)}`);
            }
        });
    });

    if (problems.length) {
        console.log('\nProblemas encontrados:');
        problems.forEach(p => console.log(`  - ${p}`));
    }

    const kbOk = problems.length === 0;
    printCheck(kbOk, kbOk ? 'Knowledge Base consistente.' : 'Hay inconsistencias — revisa antes de continuar.');
    return kbOk;
}

// ──────────────────────────────────────────────
// FASE 2: Contexto RAG por dominio
// ──────────────────────────────────────────────
function showRagBlock(dimension) {
    const ragContext = ragService.buildKnowledgeBaseContext(dimension);
    const ok = Boolean(ragContext);
    printCheck(ok, `Contexto RAG generado para ${dimension}: ${ok ? ragContext.length + ' chars' : 'VACIO'}`);

    if (ok && !briefMode) {
        const preview = ragContext.length > 1200 ? ragContext.slice(0, 1200) + '\n  [... truncado en modo normal. Usa sin --brief para ver todo]' : ragContext;
        console.log(preview);
    }
    return ok;
}

// ──────────────────────────────────────────────
// FASE 3: Construccion y validacion del prompt
// ──────────────────────────────────────────────
function buildMockEvaluation(dimension) {
    const kbData = ragService.retrieveByDimension(dimension);
    const questions = kbData ? kbData.questions || [] : [];
    const questionAnswers = questions.map((q, i) => ({
        dimension,
        question: q.subcategoryId,
        answer: i % 3 === 0 ? 0 : 1
    }));
    const maximum = questions.length;
    const obtained = questionAnswers.filter(a => a.answer === 1).length;
    const score = maximum === 0 ? 0 : Math.round((obtained / maximum) * 100);
    return {
        companyInfo: { name: 'Empresa Demo Tesis', size: 'PYME', sector: 'Servicios' },
        dimensionData: { name: dimension, score, obtained, maximum },
        questionAnswers
    };
}

function validatePrompt(dimension, mockEvaluation) {
    let service;
    try {
        service = getChatGptService();
    } catch (error) {
        printCheck(false, explainServiceLoadError(error));
        return { ok: false, nistCategories: [] };
    }

    const nistCategories = service.extractNistCategories(mockEvaluation.questionAnswers);
    const prompt = service.buildDimensionPrompt(
        mockEvaluation.companyInfo,
        dimension,
        mockEvaluation.dimensionData,
        mockEvaluation.questionAnswers,
        nistCategories
    );

    const checks = [
        ['Incluye BASE DE CONOCIMIENTO VALIDADA', prompt.includes('BASE DE CONOCIMIENTO VALIDADA')],
        ['Incluye restriccion anti-alucinacion', prompt.includes('EXCLUSIVAMENTE') && prompt.includes('No recomiendes')],
        ['Incluye categorias NIST recuperadas', nistCategories.length === 0 || nistCategories.every(c => prompt.includes(c))]
    ];

    let allOk = true;
    checks.forEach(([msg, ok]) => {
        printCheck(ok, msg);
        if (!ok) allOk = false;
    });

    console.log(`  Categorias NIST extraidas (${nistCategories.length}): ${nistCategories.join(', ') || 'ninguna'}`);
    console.log(`  Longitud del prompt: ${prompt.length} caracteres`);

    return { ok: allOk, nistCategories };
}

// ──────────────────────────────────────────────
// FASE 4: Validacion de anclaje con OpenAI
// ──────────────────────────────────────────────
function analyzeAnchoring(response) {
    const allowedControlIds = new Set(getAllControls().map(c => c.id));
    const allowedSubcategoryIds = new Set(getAllQuestions().map(q => q.subcategoryId));
    const allowedFrameworks = unique([
        knowledgeBase.metadata.framework,
        ...getAllControls().map(c => c.framework)
    ]);

    const externalFrameworks = [
        'ISO 27001', 'ISO/IEC 27001', 'CIS Controls', 'COBIT',
        'PCI DSS', 'HIPAA', 'SOC 2', 'NIST 800-53', 'NIST SP 800-53',
        'OWASP', 'GDPR', 'Zero Trust'
    ];

    const externalHits = externalFrameworks.filter(fw =>
        response.toLowerCase().includes(fw.toLowerCase()) &&
        !allowedFrameworks.some(a => a.toLowerCase().includes(fw.toLowerCase()))
    );

    const idMatches = unique(response.match(/\b[A-Z]{2,3}(?:\.[A-Z]{2,3})?[-_.][A-Z]{0,3}\d{1,3}\b/g) || []);
    const unsupportedIds = idMatches.filter(id => !allowedControlIds.has(id) && !allowedSubcategoryIds.has(id));

    return {
        externalHits,
        unsupportedIds,
        passed: externalHits.length === 0 && unsupportedIds.length === 0
    };
}

function runOpenAiValidation(dimension, mockEvaluation) {
    if (!realApiKey) {
        printCheck(true, 'OPENAI_API_KEY no definida — fase 4 omitida.');
        console.log('  Para incluirla: define OPENAI_API_KEY en .env y agrega --api');
        return Promise.resolve({ skipped: true });
    }

    if (!forceApi) {
        printCheck(true, `API key presente pero falta --api — fase 4 omitida para ${dimension}.`);
        return Promise.resolve({ skipped: true });
    }

    let service;
    try {
        service = getChatGptService();
    } catch (error) {
        printCheck(false, explainServiceLoadError(error));
        return Promise.resolve({ skipped: true, error: error.message });
    }

    const nistCategories = service.extractNistCategories(mockEvaluation.questionAnswers);
    return service.generateDimensionRecommendation(
        mockEvaluation.companyInfo,
        dimension,
        mockEvaluation.dimensionData,
        mockEvaluation.questionAnswers,
        nistCategories
    ).then(recommendation => {
        if (!briefMode) {
            console.log('\n  Respuesta de OpenAI (primeros 800 chars):');
            console.log(recommendation.slice(0, 800));
            if (recommendation.length > 800) console.log('  [... truncado]');
        }

        const anchoring = analyzeAnchoring(recommendation);
        printCheck(anchoring.externalHits.length === 0,
            `Frameworks externos: ${anchoring.externalHits.join(', ') || 'ninguno'}`);
        printCheck(anchoring.unsupportedIds.length === 0,
            `IDs fuera del KB: ${anchoring.unsupportedIds.join(', ') || 'ninguno'}`);
        printCheck(anchoring.passed,
            anchoring.passed ? 'Respuesta anclada al KB.' : 'ATENCION: posibles referencias fuera del KB.');

        return { skipped: false, passed: anchoring.passed, anchoring };
    }).catch(error => {
        printCheck(false, `Error en llamada a OpenAI: ${error.message}`);
        return { skipped: false, passed: false, error: error.message };
    });
}

// ──────────────────────────────────────────────
// PROCESAMIENTO DE UN DOMINIO COMPLETO
// ──────────────────────────────────────────────
function processDimension(dimension) {
    printTitle(`DOMINIO: ${dimension}`);

    printSubtitle(`FASE 2 — Bloque RAG (${dimension})`);
    const ragOk = showRagBlock(dimension);

    printSubtitle(`FASE 3 — Prompt completo (${dimension})`);
    const mockEvaluation = buildMockEvaluation(dimension);
    const { ok: promptOk } = validatePrompt(dimension, mockEvaluation);

    printSubtitle(`FASE 4 — Anclaje OpenAI (${dimension})`);
    return runOpenAiValidation(dimension, mockEvaluation).then(apiResult => {
        return {
            dimension,
            ragOk,
            promptOk,
            apiSkipped: apiResult.skipped,
            apiPassed: apiResult.passed
        };
    });
}

// ──────────────────────────────────────────────
// RESUMEN CONSOLIDADO
// ──────────────────────────────────────────────
function printSummary(kbOk, results) {
    printTitle('RESUMEN CONSOLIDADO — Todos los dominios');

    const col = (str, w) => String(str).padEnd(w);

    console.log(
        col('DOMINIO', 14) +
        col('RAG', 8) +
        col('PROMPT', 10) +
        col('API', 10) +
        'RESULTADO'
    );
    console.log(hr('-'));

    let totalPass = 0;
    results.forEach(r => {
        const ragStr = r.ragOk ? 'OK' : 'FALLO';
        const promptStr = r.promptOk ? 'OK' : 'FALLO';
        const apiStr = r.apiSkipped ? 'OMITIDA' : (r.apiPassed ? 'OK' : 'FALLO');
        const overallOk = r.ragOk && r.promptOk && (r.apiSkipped || r.apiPassed);
        if (overallOk) totalPass++;
        console.log(
            col(r.dimension, 14) +
            col(ragStr, 8) +
            col(promptStr, 10) +
            col(apiStr, 10) +
            (overallOk ? '[PASS]' : '[FALLO]')
        );
    });

    console.log(hr('-'));
    const globalOk = kbOk && totalPass === results.length;
    console.log(`\nKnowledge Base global: ${kbOk ? 'OK' : 'FALLO'}`);
    console.log(`Dominios superados: ${totalPass} / ${results.length}`);
    console.log(`\n${hr()}`);
    console.log(globalOk
        ? 'RESULTADO FINAL: TODOS LOS DOMINIOS VALIDADOS — RAG determinístico operativo.'
        : 'RESULTADO FINAL: HAY FALLOS — revisar los dominios marcados antes de produccion.');
    console.log(hr());

    if (!forceApi) {
        console.log('\nNota: la fase 4 (llamada real a OpenAI) fue omitida.');
        console.log('Para validacion de anclaje en vivo: node testRagValidationAll.js --api');
    }
}

// ──────────────────────────────────────────────
// MAIN
// ──────────────────────────────────────────────
async function main() {
    printTitle('Prueba definitiva RAG — TODOS los dominios NIST/MITRE');
    console.log(`Backend:    ${backendRoot}`);
    console.log(`Dominios:   ${ALL_DIMENSIONS.join(', ')}`);
    console.log(`Modo API:   ${forceApi ? 'activo (--api)' : 'omitido'}`);
    console.log(`Modo brief: ${briefMode ? 'activo (--brief)' : 'inactivo'}`);
    console.log(`Node.js:    ${process.version}`);

    const kbOk = validateKnowledgeBase();

    const results = [];
    for (const dimension of ALL_DIMENSIONS) {
        const result = await processDimension(dimension);
        results.push(result);
    }

    printSummary(kbOk, results);
}

main().catch(error => {
    console.error('\n[FALLO CRITICO] La prueba no pudo completarse:');
    console.error(error.message);
    process.exitCode = 1;
});
