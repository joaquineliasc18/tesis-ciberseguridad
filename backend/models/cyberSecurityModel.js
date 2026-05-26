/**
 * MODELO DE EVALUACIÓN DE MADUREZ EN CIBERSEGURIDAD PARA PYMES
 * 
 * Este archivo contiene el framework completo de evaluación basado en estándares internacionales
 * como ISO 27001, NIST Cybersecurity Framework y COBIT para pequeñas y medianas empresas.
 * 
 * Estructura:
 * - 6 Dimensiones principales de ciberseguridad
 * - 30+ preguntas tipo Likert (1-5)
 * - Algoritmo de cálculo de madurez
 * - Generación automática de recomendaciones
 */

// ========================================
// DIMENSIONES DE EVALUACIÓN
// ========================================

const CYBERSECURITY_DIMENSIONS = {
  // Dimensión 1: Gestión y Gobierno de Ciberseguridad
  governance: {
    id: 'governance',
    name: 'Gestión y Gobierno',
    description: 'Políticas, procedimientos y estructura organizacional de ciberseguridad',
    weight: 0.20, // 20% del peso total
    questions: [
      'gov_1', 'gov_2', 'gov_3', 'gov_4', 'gov_5'
    ]
  },

  // Dimensión 2: Gestión de Riesgos
  riskManagement: {
    id: 'riskManagement', 
    name: 'Gestión de Riesgos',
    description: 'Identificación, evaluación y tratamiento de riesgos de ciberseguridad',
    weight: 0.18,
    questions: [
      'risk_1', 'risk_2', 'risk_3', 'risk_4', 'risk_5'
    ]
  },

  // Dimensión 3: Protección de Activos y Datos
  assetProtection: {
    id: 'assetProtection',
    name: 'Protección de Activos',
    description: 'Seguridad de la información, control de acceso y protección de datos',
    weight: 0.17,
    questions: [
      'asset_1', 'asset_2', 'asset_3', 'asset_4', 'asset_5'
    ]
  },

  // Dimensión 4: Detección y Monitoreo
  detection: {
    id: 'detection',
    name: 'Detección y Monitoreo', 
    description: 'Capacidades de detección de amenazas y monitoreo continuo',
    weight: 0.15,
    questions: [
      'detect_1', 'detect_2', 'detect_3', 'detect_4', 'detect_5'
    ]
  },

  // Dimensión 5: Respuesta a Incidentes
  incidentResponse: {
    id: 'incidentResponse',
    name: 'Respuesta a Incidentes',
    description: 'Capacidad de respuesta ante incidentes de ciberseguridad',
    weight: 0.15,
    questions: [
      'incident_1', 'incident_2', 'incident_3', 'incident_4', 'incident_5'
    ]
  },

  // Dimensión 6: Concienciación y Cultura
  awareness: {
    id: 'awareness',
    name: 'Concienciación y Cultura',
    description: 'Formación, concienciación y cultura de ciberseguridad organizacional',
    weight: 0.15,
    questions: [
      'awareness_1', 'awareness_2', 'awareness_3', 'awareness_4', 'awareness_5'
    ]
  }
};

// ========================================
// CUESTIONARIO COMPLETO DE EVALUACIÓN  
// ========================================

const EVALUATION_QUESTIONNAIRE = {
  // GESTIÓN Y GOBIERNO (5 preguntas)
  gov_1: {
    id: 'gov_1',
    dimension: 'governance',
    question: '¿Su organización cuenta con una política de ciberseguridad formal y documentada?',
    type: 'likert',
    scale: [
      { value: 1, label: 'No existe política alguna' },
      { value: 2, label: 'Existe pero no está documentada' },
      { value: 3, label: 'Documentada pero no comunicada' },
      { value: 4, label: 'Documentada y parcialmente implementada' },
      { value: 5, label: 'Completamente implementada y actualizada' }
    ]
  },

  gov_2: {
    id: 'gov_2', 
    dimension: 'governance',
    question: '¿Existe un responsable designado para la ciberseguridad en su organización?',
    type: 'likert',
    scale: [
      { value: 1, label: 'No hay responsable designado' },
      { value: 2, label: 'Responsabilidad compartida sin designación' },
      { value: 3, label: 'Responsable designado sin formación específica' },
      { value: 4, label: 'Responsable con formación básica' },
      { value: 5, label: 'Especialista certificado dedicado' }
    ]
  },

  gov_3: {
    id: 'gov_3',
    dimension: 'governance', 
    question: '¿Con qué frecuencia se revisan y actualizan las políticas de ciberseguridad?',
    type: 'likert',
    scale: [
      { value: 1, label: 'Nunca se revisan' },
      { value: 2, label: 'Solo cuando ocurre un incidente' },
      { value: 3, label: 'Revisión irregular (>2 años)' },
      { value: 4, label: 'Revisión anual' },
      { value: 5, label: 'Revisión semestral o trimestral' }
    ]
  },

  gov_4: {
    id: 'gov_4',
    dimension: 'governance',
    question: '¿Se incluye la ciberseguridad en las decisiones estratégicas de negocio?',
    type: 'likert',
    scale: [
      { value: 1, label: 'Nunca se considera' },
      { value: 2, label: 'Raramente se considera' },
      { value: 3, label: 'Ocasionalmente se considera' },
      { value: 4, label: 'Frecuentemente se considera' },
      { value: 5, label: 'Siempre forma parte de las decisiones' }
    ]
  },

  gov_5: {
    id: 'gov_5',
    dimension: 'governance',
    question: '¿Su organización cuenta con un presupuesto específico para ciberseguridad?',
    type: 'likert', 
    scale: [
      { value: 1, label: 'No hay presupuesto asignado' },
      { value: 2, label: 'Presupuesto informal/reactivo' },
      { value: 3, label: 'Presupuesto básico anual' },
      { value: 4, label: 'Presupuesto planificado con revisiones' },
      { value: 5, label: 'Presupuesto estratégico con métricas ROI' }
    ]
  },

  // GESTIÓN DE RIESGOS (5 preguntas)
  risk_1: {
    id: 'risk_1',
    dimension: 'riskManagement',
    question: '¿Realiza su organización evaluaciones regulares de riesgos de ciberseguridad?',
    type: 'likert',
    scale: [
      { value: 1, label: 'Nunca se realizan evaluaciones' },
      { value: 2, label: 'Solo evaluaciones informales esporádicas' },
      { value: 3, label: 'Evaluaciones anuales básicas' },
      { value: 4, label: 'Evaluaciones semestrales estructuradas' },
      { value: 5, label: 'Evaluaciones continuas con metodología formal' }
    ]
  },

  risk_2: {
    id: 'risk_2',
    dimension: 'riskManagement',
    question: '¿Cuenta con un inventario actualizado de activos de información críticos?',
    type: 'likert',
    scale: [
      { value: 1, label: 'No existe inventario' },
      { value: 2, label: 'Inventario parcial desactualizado' },
      { value: 3, label: 'Inventario básico con actualizaciones esporádicas' },
      { value: 4, label: 'Inventario completo actualizado anualmente' },
      { value: 5, label: 'Inventario dinámico actualizado continuamente' }
    ]
  },

  risk_3: {
    id: 'risk_3', 
    dimension: 'riskManagement',
    question: '¿Se documentan y priorizan los riesgos identificados?',
    type: 'likert',
    scale: [
      { value: 1, label: 'No se documentan riesgos' },
      { value: 2, label: 'Documentación informal sin priorización' },
      { value: 3, label: 'Documentación básica con priorización simple' },
      { value: 4, label: 'Documentación estructurada con análisis cualitativo' },
      { value: 5, label: 'Documentación completa con análisis cuantitativo' }
    ]
  },

  risk_4: {
    id: 'risk_4',
    dimension: 'riskManagement', 
    question: '¿Se implementan medidas de tratamiento para los riesgos identificados?',
    type: 'likert',
    scale: [
      { value: 1, label: 'No se implementan medidas' },
      { value: 2, label: 'Medidas reactivas básicas' },
      { value: 3, label: 'Medidas planificadas para riesgos altos' },
      { value: 4, label: 'Plan integral de tratamiento de riesgos' },
      { value: 5, label: 'Programa continuo de gestión de riesgos' }
    ]
  },

  risk_5: {
    id: 'risk_5',
    dimension: 'riskManagement',
    question: '¿Se monitorea y revisa la efectividad de las medidas de control implementadas?',
    type: 'likert',
    scale: [
      { value: 1, label: 'No se monitorea efectividad' },
      { value: 2, label: 'Revisión solo cuando ocurren incidentes' },
      { value: 3, label: 'Revisión anual informal' },
      { value: 4, label: 'Monitoreo semestral estructurado' },
      { value: 5, label: 'Monitoreo continuo con métricas' }
    ]
  },

  // PROTECCIÓN DE ACTIVOS (5 preguntas)
  asset_1: {
    id: 'asset_1',
    dimension: 'assetProtection',
    question: '¿Cuenta con controles de acceso adecuados a sistemas y datos críticos?',
    type: 'likert',
    scale: [
      { value: 1, label: 'No hay controles de acceso' },
      { value: 2, label: 'Controles básicos de usuario/contraseña' },
      { value: 3, label: 'Controles de acceso por roles básicos' },
      { value: 4, label: 'Control de acceso granular con revisiones' },
      { value: 5, label: 'Control de acceso avanzado con autenticación multifactor' }
    ]
  },

  asset_2: {
    id: 'asset_2',
    dimension: 'assetProtection',
    question: '¿Se realizan copias de seguridad regulares y se verifica su integridad?',
    type: 'likert', 
    scale: [
      { value: 1, label: 'No se realizan copias de seguridad' },
      { value: 2, label: 'Copias irregulares sin verificación' },
      { value: 3, label: 'Copias regulares con verificación básica' },
      { value: 4, label: 'Copias automatizadas con pruebas de restauración' },
      { value: 5, label: 'Estrategia completa de backup con redundancia' }
    ]
  },

  asset_3: {
    id: 'asset_3',
    dimension: 'assetProtection',
    question: '¿Se cifra la información sensible tanto en tránsito como en reposo?',
    type: 'likert',
    scale: [
      { value: 1, label: 'No se utiliza cifrado' },
      { value: 2, label: 'Cifrado básico solo en algunas comunicaciones' },
      { value: 3, label: 'Cifrado en tránsito para datos críticos' },
      { value: 4, label: 'Cifrado en tránsito y reposo para datos sensibles' },
      { value: 5, label: 'Estrategia completa de cifrado con gestión de llaves' }
    ]
  },

  asset_4: {
    id: 'asset_4', 
    dimension: 'assetProtection',
    question: '¿Cuenta con protección antimalware actualizada en todos los sistemas?',
    type: 'likert',
    scale: [
      { value: 1, label: 'No hay protección antimalware' },
      { value: 2, label: 'Protección básica desactualizada' },
      { value: 3, label: 'Antimalware actualizado en sistemas críticos' },
      { value: 4, label: 'Protección completa con actualizaciones automáticas' },
      { value: 5, label: 'Solución avanzada con detección de amenazas' }
    ]
  },

  asset_5: {
    id: 'asset_5',
    dimension: 'assetProtection', 
    question: '¿Se mantienen actualizados los sistemas operativos y aplicaciones?',
    type: 'likert',
    scale: [
      { value: 1, label: 'No se realizan actualizaciones' },
      { value: 2, label: 'Actualizaciones irregulares reactivas' },
      { value: 3, label: 'Actualizaciones planificadas básicas' },
      { value: 4, label: 'Programa estructurado de actualización' },
      { value: 5, label: 'Gestión automatizada de parches con testing' }
    ]
  },

  // DETECCIÓN Y MONITOREO (5 preguntas)  
  detect_1: {
    id: 'detect_1',
    dimension: 'detection',
    question: '¿Cuenta con herramientas de monitoreo de seguridad en su red?',
    type: 'likert',
    scale: [
      { value: 1, label: 'No hay monitoreo de seguridad' },
      { value: 2, label: 'Monitoreo básico manual esporádico' },
      { value: 3, label: 'Herramientas básicas de monitoreo' },
      { value: 4, label: 'Monitoreo automatizado con alertas' },
      { value: 5, label: 'SIEM/SOC con monitoreo 24/7' }
    ]
  },

  detect_2: {
    id: 'detect_2',
    dimension: 'detection',
    question: '¿Se registran y analizan los logs de sistemas críticos?',
    type: 'likert',
    scale: [
      { value: 1, label: 'No se registran logs' },
      { value: 2, label: 'Logs básicos sin análisis' },
      { value: 3, label: 'Registro con análisis manual esporádico' },
      { value: 4, label: 'Análisis automatizado de logs críticos' },
      { value: 5, label: 'Correlación avanzada de eventos con IA' }
    ]
  },

  detect_3: {
    id: 'detect_3',
    dimension: 'detection', 
    question: '¿Cuenta con procedimientos para detectar actividad anómala?',
    type: 'likert',
    scale: [
      { value: 1, label: 'No hay detección de anomalías' },
      { value: 2, label: 'Detección manual reactiva' },
      { value: 3, label: 'Procedimientos básicos de detección' },
      { value: 4, label: 'Detección automatizada con reglas' },
      { value: 5, label: 'Machine Learning para detección de anomalías' }
    ]
  },

  detect_4: {
    id: 'detect_4',
    dimension: 'detection',
    question: '¿Se realizan pruebas de penetración o evaluaciones de vulnerabilidades?',
    type: 'likert',
    scale: [
      { value: 1, label: 'Nunca se realizan pruebas' },
      { value: 2, label: 'Evaluaciones muy esporádicas' },
      { value: 3, label: 'Evaluaciones anuales básicas' },
      { value: 4, label: 'Evaluaciones semestrales estructuradas' },
      { value: 5, label: 'Programa continuo de testing con expertos' }
    ]
  },

  detect_5: {
    id: 'detect_5',
    dimension: 'detection',
    question: '¿Se mantiene actualizada la inteligencia sobre amenazas?',
    type: 'likert', 
    scale: [
      { value: 1, label: 'No se consulta inteligencia de amenazas' },
      { value: 2, label: 'Información básica esporádica' },
      { value: 3, label: 'Consulta regular de fuentes públicas' },
      { value: 4, label: 'Suscripción a feeds de inteligencia' },
      { value: 5, label: 'Plataforma integrada de threat intelligence' }
    ]
  },

  // RESPUESTA A INCIDENTES (5 preguntas)
  incident_1: {
    id: 'incident_1',
    dimension: 'incidentResponse',
    question: '¿Cuenta con un plan de respuesta a incidentes de ciberseguridad?',
    type: 'likert',
    scale: [
      { value: 1, label: 'No existe plan de respuesta' },
      { value: 2, label: 'Procedimientos informales básicos' },
      { value: 3, label: 'Plan documentado pero no probado' },
      { value: 4, label: 'Plan probado y actualizado anualmente' },
      { value: 5, label: 'Plan integral con simulacros regulares' }
    ]
  },

  incident_2: {
    id: 'incident_2', 
    dimension: 'incidentResponse',
    question: '¿Está definido un equipo de respuesta a incidentes?',
    type: 'likert',
    scale: [
      { value: 1, label: 'No hay equipo definido' },
      { value: 2, label: 'Responsabilidades informales' },
      { value: 3, label: 'Equipo básico con roles definidos' },
      { value: 4, label: 'Equipo capacitado con procedimientos' },
      { value: 5, label: 'CSIRT certificado con disponibilidad 24/7' }
    ]
  },

  incident_3: {
    id: 'incident_3',
    dimension: 'incidentResponse',
    question: '¿Se documentan y analizan los incidentes de ciberseguridad?',
    type: 'likert',
    scale: [
      { value: 1, label: 'No se documentan incidentes' },
      { value: 2, label: 'Documentación informal básica' },
      { value: 3, label: 'Registro estructurado de incidentes' },
      { value: 4, label: 'Análisis post-incidente sistemático' },
      { value: 5, label: 'Base de conocimiento con lecciones aprendidas' }
    ]
  },

  incident_4: {
    id: 'incident_4',
    dimension: 'incidentResponse', 
    question: '¿Se han establecido canales de comunicación para reportar incidentes?',
    type: 'likert',
    scale: [
      { value: 1, label: 'No hay canales establecidos' },
      { value: 2, label: 'Comunicación informal ad-hoc' },
      { value: 3, label: 'Canal básico de reporte interno' },
      { value: 4, label: 'Múltiples canales internos y externos' },
      { value: 5, label: 'Sistema integrado de gestión de incidentes' }
    ]
  },

  incident_5: {
    id: 'incident_5',
    dimension: 'incidentResponse',
    question: '¿Se realizan ejercicios de simulación de incidentes?',
    type: 'likert',
    scale: [
      { value: 1, label: 'Nunca se realizan simulacros' },
      { value: 2, label: 'Simulacros muy esporádicos' },
      { value: 3, label: 'Simulacros anuales básicos' },
      { value: 4, label: 'Simulacros semestrales estructurados' },
      { value: 5, label: 'Programa regular de ejercicios complejos' }
    ]
  },

  // CONCIENCIACIÓN Y CULTURA (5 preguntas)
  awareness_1: {
    id: 'awareness_1', 
    dimension: 'awareness',
    question: '¿Se proporciona formación en ciberseguridad a los empleados?',
    type: 'likert',
    scale: [
      { value: 1, label: 'No se proporciona formación' },
      { value: 2, label: 'Formación básica esporádica' },
      { value: 3, label: 'Formación anual obligatoria' },
      { value: 4, label: 'Programa estructurado de formación' },
      { value: 5, label: 'Formación continua personalizada por rol' }
    ]
  },

  awareness_2: {
    id: 'awareness_2',
    dimension: 'awareness',
    question: '¿Se realizan campañas de concienciación sobre ciberseguridad?',
    type: 'likert',
    scale: [
      { value: 1, label: 'No se realizan campañas' },
      { value: 2, label: 'Comunicaciones ocasionales básicas' },
      { value: 3, label: 'Campañas anuales temáticas' },
      { value: 4, label: 'Campañas regulares con métricas' },
      { value: 5, label: 'Programa continuo multimedia interactivo' }
    ]
  },

  awareness_3: {
    id: 'awareness_3',
    dimension: 'awareness', 
    question: '¿Se evalúa el nivel de concienciación de los empleados?',
    type: 'likert',
    scale: [
      { value: 1, label: 'No se evalúa concienciación' },
      { value: 2, label: 'Evaluaciones informales esporádicas' },
      { value: 3, label: 'Evaluaciones anuales básicas' },
      { value: 4, label: 'Evaluaciones regulares con feedback' },
      { value: 5, label: 'Sistema continuo de evaluación y mejora' }
    ]
  },

  awareness_4: {
    id: 'awareness_4',
    dimension: 'awareness',
    question: '¿Se incluye la ciberseguridad en los procesos de contratación?',
    type: 'likert',
    scale: [
      { value: 1, label: 'No se incluye en contratación' },
      { value: 2, label: 'Mención básica en proceso' },
      { value: 3, label: 'Formación inicial obligatoria' },
      { value: 4, label: 'Evaluación de competencias en ciberseguridad' },
      { value: 5, label: 'Programa integral de onboarding en seguridad' }
    ]
  },

  awareness_5: {
    id: 'awareness_5',
    dimension: 'awareness',
    question: '¿Existe una cultura organizacional que valore la ciberseguridad?',
    type: 'likert', 
    scale: [
      { value: 1, label: 'Ciberseguridad no es prioridad cultural' },
      { value: 2, label: 'Concienciación básica reactiva' },
      { value: 3, label: 'Reconocimiento moderado de importancia' },
      { value: 4, label: 'Cultura proactiva con liderazgo visible' },
      { value: 5, label: 'Ciberseguridad integrada en valores organizacionales' }
    ]
  }
};

// ========================================
// NIVELES DE MADUREZ
// ========================================

const MATURITY_LEVELS = {
  1: {
    level: 1,
    name: 'Inicial - Ad Hoc',
    description: 'Prácticas de ciberseguridad inexistentes o muy básicas, principalmente reactivas.',
    color: '#dc3545', // Rojo
    recommendations: [
      'Establecer políticas básicas de seguridad',
      'Designar un responsable de ciberseguridad',
      'Implementar antivirus y actualizaciones básicas',
      'Crear procedimientos de backup',
      'Iniciar programa de concienciación básica'
    ]
  },
  2: {
    level: 2, 
    name: 'Repetible - Básico',
    description: 'Algunas prácticas de ciberseguridad establecidas pero sin estructura formal.',
    color: '#fd7e14', // Naranja
    recommendations: [
      'Formalizar políticas y procedimientos existentes',
      'Realizar evaluación inicial de riesgos',
      'Implementar controles de acceso mejorados',
      'Establecer programa de formación regular',
      'Crear inventario de activos críticos'
    ]
  },
  3: {
    level: 3,
    name: 'Definido - Intermedio', 
    description: 'Procesos de ciberseguridad documentados y seguidos de manera consistente.',
    color: '#ffc107', // Amarillo
    recommendations: [
      'Implementar programa formal de gestión de riesgos',
      'Establecer monitoreo básico de seguridad',
      'Desarrollar plan de respuesta a incidentes',
      'Realizar evaluaciones de vulnerabilidades',
      'Mejorar controles de cifrado y backup'
    ]
  },
  4: {
    level: 4,
    name: 'Gestionado - Avanzado',
    description: 'Ciberseguridad gestionada proactivamente con métricas y mejora continua.',
    color: '#20c997', // Verde claro
    recommendations: [
      'Implementar monitoreo avanzado y SIEM',
      'Establecer programa de threat intelligence',
      'Realizar simulacros regulares de incidentes',
      'Implementar controles de seguridad automatizados',
      'Desarrollar métricas avanzadas de ciberseguridad'
    ]
  },
  5: {
    level: 5,
    name: 'Optimizado - Líder',
    description: 'Ciberseguridad integrada estratégicamente con innovación y optimización continua.',
    color: '#28a745', // Verde
    recommendations: [
      'Liderar innovación en ciberseguridad del sector',
      'Implementar inteligencia artificial para detección',
      'Establecer centro de operaciones de seguridad (SOC)',
      'Desarrollar capacidades de threat hunting',
      'Ser referente en mejores prácticas del sector'
    ]
  }
};

// ========================================
// FUNCIONES DE CÁLCULO Y ANÁLISIS
// ========================================

/**
 * Calcular puntuación por dimensión basada en las respuestas
 * @param {Object} responses - Respuestas del cuestionario {question_id: value}
 * @param {Object} dimension - Objeto dimensión a calcular
 * @returns {Object} Resultado de la dimensión con puntuación y nivel
 */
function calculateDimensionScore(responses, dimension) {
  const dimensionQuestions = dimension.questions;
  let totalScore = 0;
  let answeredQuestions = 0;

  // Sumar puntuaciones de las preguntas de la dimensión
  for (const questionId of dimensionQuestions) {
    if (responses[questionId] !== undefined) {
      totalScore += parseInt(responses[questionId]);
      answeredQuestions++;
    }
  }

  // Calcular puntuación promedio (1-5)
  const averageScore = answeredQuestions > 0 ? totalScore / answeredQuestions : 0;
  
  // Convertir a escala 0-100
  const normalizedScore = ((averageScore - 1) / 4) * 100;

  return {
    dimensionId: dimension.id,
    name: dimension.name,
    score: Math.round(normalizedScore),
    averageRating: Math.round(averageScore * 10) / 10,
    questionsAnswered: answeredQuestions,
    totalQuestions: dimensionQuestions.length,
    weight: dimension.weight
  };
}

/**
 * Calcular puntuación global de madurez
 * @param {Array} dimensionScores - Array con puntuaciones de dimensiones
 * @returns {Object} Resultado global con nivel de madurez
 */
function calculateOverallMaturity(dimensionScores) {
  let weightedSum = 0;
  let totalWeight = 0;

  // Calcular suma ponderada
  for (const dimension of dimensionScores) {
    weightedSum += dimension.score * dimension.weight;
    totalWeight += dimension.weight;
  }

  // Puntuación global (0-100)
  const globalScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
  
  // Determinar nivel de madurez (1-5)
  let maturityLevel = 1;
  if (globalScore >= 80) maturityLevel = 5;
  else if (globalScore >= 65) maturityLevel = 4;  
  else if (globalScore >= 50) maturityLevel = 3;
  else if (globalScore >= 35) maturityLevel = 2;
  else maturityLevel = 1;

  return {
    globalScore: Math.round(globalScore),
    maturityLevel: maturityLevel,
    maturityInfo: MATURITY_LEVELS[maturityLevel],
    dimensionScores: dimensionScores
  };
}

/**
 * Generar recomendaciones personalizadas basadas en puntuaciones
 * @param {Object} evaluation - Resultado completo de evaluación
 * @returns {Array} Lista de recomendaciones priorizadas
 */
function generateRecommendations(evaluation) {
  const recommendations = [];
  
  // Recomendaciones por nivel de madurez global
  recommendations.push(...evaluation.maturityInfo.recommendations);

  // Recomendaciones específicas por dimensión con menor puntuación
  const sortedDimensions = [...evaluation.dimensionScores].sort((a, b) => a.score - b.score);
  
  for (const dimension of sortedDimensions.slice(0, 3)) { // Top 3 dimensiones más débiles
    if (dimension.score < 60) {
      recommendations.push(`Priorizar mejoras en ${dimension.name}: puntuación actual ${dimension.score}/100`);
    }
  }

  // Recomendaciones específicas basadas en puntuaciones críticas
  if (evaluation.globalScore < 40) {
    recommendations.push('URGENTE: Implementar controles básicos de seguridad inmediatamente');
    recommendations.push('Considerar consultoría externa especializada en ciberseguridad');
  }

  return recommendations.slice(0, 8); // Máximo 8 recomendaciones
}

// ========================================
// FUNCIÓN PRINCIPAL DE EVALUACIÓN
// ========================================

/**
 * Procesar respuestas completas y generar evaluación de madurez
 * @param {Object} responses - Respuestas del cuestionario
 * @returns {Object} Evaluación completa con puntuaciones y recomendaciones
 */
function processMaturityEvaluation(responses) {
  console.log('📊 Iniciando evaluación de madurez en ciberseguridad...');
  
  // Calcular puntuaciones por dimensión
  const dimensionScores = [];
  for (const dimension of Object.values(CYBERSECURITY_DIMENSIONS)) {
    const dimensionResult = calculateDimensionScore(responses, dimension);
    dimensionScores.push(dimensionResult);
    console.log(`📈 ${dimension.name}: ${dimensionResult.score}/100`);
  }

  // Calcular madurez global
  const overallEvaluation = calculateOverallMaturity(dimensionScores);
  
  // Generar recomendaciones
  const recommendations = generateRecommendations(overallEvaluation);

  // Resultado completo
  const result = {
    evaluationId: require('crypto').randomUUID(),
    timestamp: new Date().toISOString(),
    globalScore: overallEvaluation.globalScore,
    maturityLevel: overallEvaluation.maturityLevel,
    maturityName: overallEvaluation.maturityInfo.name,
    maturityDescription: overallEvaluation.maturityInfo.description,
    maturityColor: overallEvaluation.maturityInfo.color,
    scores: {},
    recommendations: recommendations,
    questionsAnalyzed: Object.keys(responses).length,
    totalQuestions: Object.keys(EVALUATION_QUESTIONNAIRE).length,
    confidence: Math.min(95, 60 + (Object.keys(responses).length / Object.keys(EVALUATION_QUESTIONNAIRE).length) * 35)
  };

  // Agregar puntuaciones por dimensión al resultado
  for (const dimension of dimensionScores) {
    result.scores[dimension.dimensionId] = {
      name: dimension.name,
      score: dimension.score,
      rating: dimension.averageRating,
      weight: dimension.weight
    };
  }

  console.log(`✅ Evaluación completada - Nivel ${result.maturityLevel}: ${result.maturityName}`);
  console.log(`📊 Puntuación global: ${result.globalScore}/100`);
  
  return result;
}

// ========================================
// EXPORTAR MÓDULO
// ========================================

module.exports = {
  CYBERSECURITY_DIMENSIONS,
  EVALUATION_QUESTIONNAIRE, 
  MATURITY_LEVELS,
  processMaturityEvaluation,
  calculateDimensionScore,
  calculateOverallMaturity,
  generateRecommendations
};