/**
 * RAG Service - Retrieval-Augmented Generation
 * Recupera controles y preguntas validadas del marco NIST CSF 2.0 × MITRE ATT&CK
 * por dimensión para anclar las recomendaciones de IA y evitar alucinaciones.
 *
 * Fuente: MMDRVP - Modelo de madurez y controles MITRE-NIST v.1.3
 * Alcance: Credenciales robadas (Credential Access)
 */

const knowledgeBase = require('../data/nistMitreKnowledgeBase.json');

class RagService {
    constructor() {
        this.kb = knowledgeBase;
        console.log(`📚 RAG Knowledge Base cargada: ${Object.keys(this.kb.dimensions).length} dimensiones | Fuente: ${this.kb.metadata.source}`);
    }

    /**
     * Recupera los controles y preguntas validadas para una dimensión NIST.
     * @param {string} dimension - Nombre de la dimensión (GOBIERNO, IDENTIFICAR, PROTEGER, DETECTAR, RESPONDER, RECUPERAR, IMPROVE)
     * @returns {{ questions: Array, controls: Array } | null}
     */
    retrieveByDimension(dimension) {
        return this.kb.dimensions[dimension] || null;
    }

    /**
     * Formatea el contexto recuperado como bloque de texto para incluir en el prompt.
     * @param {string} dimension
     * @returns {string} Bloque de texto con los controles validados
     */
    buildKnowledgeBaseContext(dimension) {
        const data = this.retrieveByDimension(dimension);

        if (!data) {
            return '';
        }

        const lines = [
            `BASE DE CONOCIMIENTO VALIDADA — ${dimension} (NIST CSF 2.0 × MITRE ATT&CK × NIST SP 800-63B):`,
            `Fuente: ${this.kb.metadata.source} | Alcance: ${this.kb.metadata.scope}`,
            ''
        ];

        if (data.controls && data.controls.length > 0) {
            lines.push('CONTROLES DEL MARCO APLICABLES A ESTA DIMENSIÓN:');
            data.controls.forEach(ctrl => {
                let line = `• [${ctrl.id}] ${ctrl.description} (${ctrl.framework})`;
                if (ctrl.attackVectors && ctrl.attackVectors.length > 0) {
                    line += ` → Mitiga: ${ctrl.attackVectors.join(', ')}`;
                }
                lines.push(line);
            });
            lines.push('');
        }

        if (data.questions && data.questions.length > 0) {
            lines.push('SUBCATEGORÍAS NIST EVALUADAS EN ESTA DIMENSIÓN:');
            const seen = new Set();
            data.questions.forEach(q => {
                const key = q.subcategoryId;
                if (!seen.has(key)) {
                    seen.add(key);
                    lines.push(`• [${q.subcategoryId}] ${q.subcategoryDescription} (${q.category})`);
                }
            });
        }

        return lines.join('\n');
    }

    /**
     * Devuelve los niveles de madurez del marco para contexto en los prompts.
     * @returns {string}
     */
    getMaturityLevelsContext() {
        return this.kb.maturityLevels
            .map(l => `  Nivel ${l.level} - ${l.name}: ${l.description}`)
            .join('\n');
    }

    /**
     * Recupera el nombre legible de una categoría a partir del ID de subcategoría.
     * Útil para enriquecer las respuestas de evaluación con la categoría real del marco.
     * @param {string} dimension
     * @param {string} subcategoryId
     * @returns {string|null}
     */
    getCategoryForSubcategory(dimension, subcategoryId) {
        const data = this.retrieveByDimension(dimension);
        if (!data) return null;
        const question = data.questions.find(q => q.subcategoryId === subcategoryId);
        return question ? question.category : null;
    }
}

module.exports = new RagService();
