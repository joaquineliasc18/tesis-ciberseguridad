/**
 * Prueba local de validacion RAG sin levantar Express ni llamar a n8n.
 *
 * Fases:
 * 1. Integridad del knowledge base NIST/MITRE.
 * 2. Contexto RAG que se inyecta al prompt.
 * 3. Prompt completo construido por el servicio real.
 * 4. Llamada opcional a OpenAI y analisis de anclaje.
 *
 * Uso:
 *   node testRagValidation.js
 *   node testRagValidation.js --dimension=DETECTAR
 *   node testRagValidation.js --api
 */

const fs = require('fs');
const path = require('path');
let dotenv = null;

try {
    dotenv = require('dotenv');
} catch (error) {
    dotenv = null;
}

const backendRoot = __dirname;
const projectRoot = path.join(__dirname, '..');

[
    path.join(projectRoot, '.env'),
    path.join(backendRoot, '.env')
].forEach(envPath => {
    if (fs.existsSync(envPath)) {
        if (dotenv) {
            dotenv.config({ path: envPath, override: false });
            return;
        }

        fs.readFileSync(envPath, 'utf8')
            .split(/\r?\n/)
            .filter(line => line.trim() && !line.trim().startsWith('#'))
            .forEach(line => {
                const separatorIndex = line.indexOf('=');
                if (separatorIndex === -1) return;
                const key = line.slice(0, separatorIndex).trim();
                const value = line.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, '');
                if (key && process.env[key] === undefined) {
                    process.env[key] = value;
                }
            });
    }
});

const args = process.argv.slice(2);
const dimensionArg = args.find(arg => arg.startsWith('--dimension='));
const selectedDimension = (dimensionArg ? dimensionArg.split('=')[1] : 'PROTEGER').toUpperCase();
const forceApi = args.includes('--api');
const realApiKey = process.env.OPENAI_API_KEY;
const nodeMajor = parseInt(process.versions.node.split('.')[0], 10);

// El servicio instancia OpenAI al importarse. Para fases sin API usamos una clave
// ficticia que no se envia a ningun lado.
if (!process.env.OPENAI_API_KEY) {
    process.env.OPENAI_API_KEY = 'local-rag-validation-no-api-key';
}
if (realApiKey && !process.env.USE_CHATGPT_RECOMMENDATIONS) {
    process.env.USE_CHATGPT_RECOMMENDATIONS = 'true';
}

const ragService = require('./services/ragService');
const knowledgeBase = require('./data/nistMitreKnowledgeBase.json');

let chatGptService = null;

function getChatGptService() {
    if (chatGptService) {
        return chatGptService;
    }

    if (nodeMajor < 18) {
        throw new Error(
            `Esta fase requiere Node.js 18+ para cargar chatGptRecommendationService.js y el SDK de OpenAI. Version actual: ${process.version}`
        );
    }

    const ChatGptRecommendationService = require('./services/chatGptRecommendationService');
    chatGptService = new ChatGptRecommendationService();
    return chatGptService;
}

function explainServiceLoadError(error) {
    if (error && error.code === 'MODULE_NOT_FOUND') {
        return `${error.message}. Ejecuta "npm install" dentro de backend para instalar las dependencias locales.`;
    }
    return error.message;
}

function printTitle(title) {
    console.log('\n' + '='.repeat(80));
    console.log(title);
    console.log('='.repeat(80));
}

function printCheck(ok, message) {
    console.log(`${ok ? '[OK]' : '[FALLO]'} ${message}`);
}

function unique(values) {
    return Array.from(new Set(values.filter(Boolean)));
}

function objectValues(object) {
    return Object.keys(object).map(key => object[key]);
}

function objectEntries(object) {
    return Object.keys(object).map(key => [key, object[key]]);
}

function getAllControls() {
    return objectValues(knowledgeBase.dimensions).reduce((all, dimension) => {
        return all.concat(dimension.controls || []);
    }, []);
}

function getAllQuestions() {
    return objectValues(knowledgeBase.dimensions).reduce((all, dimension) => {
        return all.concat(dimension.questions || []);
    }, []);
}

function validateKnowledgeBase() {
    printTitle('FASE 1 - Integridad del Knowledge Base');

    const dimensions = objectEntries(knowledgeBase.dimensions || {});
    const maturityLevels = knowledgeBase.maturityLevels || [];
    const allQuestions = getAllQuestions();
    const allControls = getAllControls();

    const metadata = knowledgeBase.metadata || {};
    printCheck(Boolean(metadata.source), `Fuente declarada: ${metadata.source || 'NO DEFINIDA'}`);
    printCheck(dimensions.length > 0, `Dimensiones cargadas: ${dimensions.length}`);
    printCheck(maturityLevels.length === 5, `Niveles de madurez: ${maturityLevels.length}`);
    printCheck(allQuestions.length > 0, `Preguntas/subcategorias cargadas: ${allQuestions.length}`);
    printCheck(allControls.length > 0, `Controles cargados: ${allControls.length}`);

    const problems = [];
    dimensions.forEach(([dimensionName, data]) => {
        const questions = data.questions || [];
        const controls = data.controls || [];
        const maxScoreFromQuestions = questions.reduce((sum, question) => sum + Number(question.maxScore || 0), 0);

        console.log(`- ${dimensionName}: ${questions.length} preguntas | ${controls.length} controles | maxScore=${data.maxScore}`);

        if (!data.functionId) problems.push(`${dimensionName}: falta functionId`);
        if (!questions.length) problems.push(`${dimensionName}: no tiene preguntas`);
        if (!controls.length) problems.push(`${dimensionName}: no tiene controles`);
        if (Number(data.maxScore) !== maxScoreFromQuestions) {
            problems.push(`${dimensionName}: maxScore ${data.maxScore} no coincide con suma de preguntas ${maxScoreFromQuestions}`);
        }

        questions.forEach(question => {
            if (!question.subcategoryId || !question.category || !question.question) {
                problems.push(`${dimensionName}: pregunta incompleta ${JSON.stringify(question)}`);
            }
        });

        controls.forEach(control => {
            if (!control.id || !control.description || !control.framework) {
                problems.push(`${dimensionName}: control incompleto ${JSON.stringify(control)}`);
            }
        });
    });

    if (problems.length) {
        console.log('\nProblemas encontrados:');
        problems.forEach(problem => console.log(`- ${problem}`));
    }
    printCheck(problems.length === 0, problems.length === 0 ? 'Knowledge Base consistente para la prueba.' : 'Hay inconsistencias que conviene corregir.');

    return problems.length === 0;
}

function buildMockEvaluation(dimension) {
    const kbData = ragService.retrieveByDimension(dimension);
    if (!kbData) {
        throw new Error(`Dimension no encontrada: ${dimension}. Disponibles: ${Object.keys(knowledgeBase.dimensions).join(', ')}`);
    }

    const questions = kbData.questions || [];
    const questionAnswers = questions.map((question, index) => ({
        dimension,
        question: question.subcategoryId,
        answer: index % 3 === 0 ? 0 : 1
    }));

    const maximum = questions.length;
    const obtained = questionAnswers.filter(answer => answer.answer === 1).length;
    const score = maximum === 0 ? 0 : Math.round((obtained / maximum) * 100);

    return {
        companyInfo: {
            name: 'Empresa Demo Tesis',
            size: 'PYME',
            sector: 'Servicios'
        },
        dimensionData: {
            name: dimension,
            score,
            obtained,
            maximum
        },
        questionAnswers
    };
}

function showRagBlock(dimension) {
    printTitle(`FASE 2 - Bloque RAG inyectado (${dimension})`);
    const ragContext = ragService.buildKnowledgeBaseContext(dimension);
    printCheck(Boolean(ragContext), 'El contexto RAG fue generado.');
    console.log('\n' + ragContext);
    return ragContext;
}

function buildAndValidatePrompt(dimension, mockEvaluation) {
    printTitle('FASE 3 - Construccion del prompt completo');

    let service;
    try {
        service = getChatGptService();
    } catch (error) {
        printCheck(false, explainServiceLoadError(error));
        console.log('Corrige ese punto y vuelve a ejecutar este script para validar el prompt real.');
        return '';
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
        ['Incluye respuestas especificas', prompt.includes('RESPUESTAS ESPECIFICAS') || prompt.includes('RESPUESTAS ESPEC')],
        ['Incluye restriccion anti-alucinacion', prompt.includes('EXCLUSIVAMENTE') && prompt.includes('No recomiendes')],
        ['Incluye categorias NIST recuperadas', nistCategories.length > 0 && nistCategories.every(category => prompt.includes(category))]
    ];

    checks.forEach(([message, ok]) => printCheck(ok, message));

    console.log('\nCategorias usadas:');
    nistCategories.forEach(category => console.log(`- ${category}`));

    console.log('\nVista previa del prompt:');
    console.log(prompt.slice(0, 2500));
    if (prompt.length > 2500) {
        console.log(`\n... prompt truncado para consola (${prompt.length} caracteres en total)`);
    }

    return prompt;
}

function analyzeAnchoring(response) {
    const allowedControlIds = new Set(getAllControls().map(control => control.id));
    const allowedSubcategoryIds = new Set(getAllQuestions().map(question => question.subcategoryId));
    const allowedFrameworks = unique([
        knowledgeBase.metadata.framework,
        ...getAllControls().map(control => control.framework)
    ]);

    const knownExternalFrameworks = [
        'ISO 27001',
        'ISO/IEC 27001',
        'CIS Controls',
        'COBIT',
        'PCI DSS',
        'HIPAA',
        'SOC 2',
        'NIST 800-53',
        'NIST SP 800-53',
        'OWASP',
        'GDPR',
        'Zero Trust'
    ];

    const externalFrameworkHits = knownExternalFrameworks.filter(framework =>
        response.toLowerCase().includes(framework.toLowerCase()) &&
        !allowedFrameworks.some(allowed => allowed.toLowerCase().includes(framework.toLowerCase()))
    );

    const idMatches = unique(response.match(/\b[A-Z]{2,3}(?:\.[A-Z]{2,3})?[-_.][A-Z]{0,3}\d{1,3}\b/g) || []);
    const unsupportedIds = idMatches.filter(id => !allowedControlIds.has(id) && !allowedSubcategoryIds.has(id));

    return {
        externalFrameworkHits,
        unsupportedIds,
        passed: externalFrameworkHits.length === 0 && unsupportedIds.length === 0
    };
}

function runOpenAiValidation(dimension, mockEvaluation) {
    printTitle('FASE 4 - Validacion de anclaje IA con OpenAI');

    let service;
    try {
        service = getChatGptService();
    } catch (error) {
        printCheck(false, explainServiceLoadError(error));
        console.log('Se omite la llamada real a OpenAI en este entorno.');
        return Promise.resolve();
    }

    if (!realApiKey) {
        printCheck(true, 'OPENAI_API_KEY no encontrada. Se omite la llamada real a OpenAI.');
        console.log('Para ejecutar esta fase: define OPENAI_API_KEY en Automated-Document-Processor/.env o en el entorno y corre:');
        console.log(`node testRagValidation.js --dimension=${dimension} --api`);
        return Promise.resolve();
    }

    if (!forceApi) {
        printCheck(true, 'OPENAI_API_KEY existe, pero no se llamo a la API porque falta --api.');
        console.log(`Ejecuta: node testRagValidation.js --dimension=${dimension} --api`);
        return Promise.resolve();
    }

    const nistCategories = service.extractNistCategories(mockEvaluation.questionAnswers);
    return service.generateDimensionRecommendation(
        mockEvaluation.companyInfo,
        dimension,
        mockEvaluation.dimensionData,
        mockEvaluation.questionAnswers,
        nistCategories
    ).then(recommendation => {
        console.log('\nRespuesta de OpenAI:');
        console.log(recommendation);

        const anchoring = analyzeAnchoring(recommendation);
        printCheck(anchoring.externalFrameworkHits.length === 0, `Frameworks externos detectados: ${anchoring.externalFrameworkHits.join(', ') || 'ninguno'}`);
        printCheck(anchoring.unsupportedIds.length === 0, `IDs fuera del KB detectados: ${anchoring.unsupportedIds.join(', ') || 'ninguno'}`);
        printCheck(anchoring.passed, anchoring.passed ? 'La respuesta queda anclada al KB segun las reglas automaticas.' : 'Revisar respuesta: hay posibles referencias fuera del KB.');
    });
}

function main() {
    printTitle('Prueba local RAG NIST/MITRE sin n8n');
    console.log(`Backend: ${backendRoot}`);
    console.log(`Dimension seleccionada: ${selectedDimension}`);
    console.log(`Modo API: ${forceApi ? 'solicitado' : 'omitido por defecto'}`);
    console.log(`Node.js: ${process.version}`);

    validateKnowledgeBase();
    const mockEvaluation = buildMockEvaluation(selectedDimension);
    showRagBlock(selectedDimension);
    buildAndValidatePrompt(selectedDimension, mockEvaluation);
    return runOpenAiValidation(selectedDimension, mockEvaluation).then(() => {
        printTitle('Resultado');
        console.log('Prueba local finalizada. No usa Express, Prisma ni n8n.');
    });
}

main().catch(error => {
    console.error('\n[FALLO] La prueba no pudo completarse:');
    console.error(error.message);
    process.exitCode = 1;
});
