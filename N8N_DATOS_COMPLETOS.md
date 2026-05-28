# 🔄 N8N Integration - Datos Completos en Webhook

## ✅ Problema Solucionado

**Antes:** n8n recibía solo metadatos básicos del archivo (fileId, filename, size)
**Ahora:** n8n recibe **todos los datos procesados** de la evaluación de ciberseguridad

---

## 📊 Datos que Ahora Recibe n8n

### Estructura del Webhook:

```json
{
  "fileId": "uuid-del-archivo",
  "filename": "evaluacion-empresa.csv",
  "status": "COMPLETED",
  "evaluation": {
    "globalScore": 65,
    "maturityLevel": 3,
    "maturityName": "Definido - Intermedio",
    "companyInfo": {
      "name": "Empresa XYZ",
      "email": "contacto@empresa.com",
      "size": "PYME"
    },
    "scores": {
      "GOBIERNO": {
        "name": "Gobierno",
        "score": 60,
        "obtained": 9,
        "maximum": 15,
        "questions": 3,
        "rating": 3.0
      },
      "PROTEGER": {
        "name": "Proteger",
        "score": 70,
        "obtained": 77,
        "maximum": 110,
        "questions": 22,
        "rating": 3.5
      },
      // ... resto de dimensiones
    },
    "questionsAnalyzed": 38,
    "recommendations": [
      "Implementar controles básicos de seguridad...",
      "Establecer políticas de seguridad fundamentales..."
    ],
    "timestamp": "2026-05-28T01:54:26.646Z"
  },
  "csvData": "PREGUNTA,RESPUESTA,DIMENSION\nPR_AA_01,3,PROTEGER\n...",
  "processedAt": "2026-05-28T01:54:26.646Z"
}
```

---

## 🔄 Flujo Actualizado

### Paso 1: Usuario sube CSV
```
Usuario → Frontend → Backend (POST /api/files/upload)
```

### Paso 2: Backend procesa inmediatamente
```
Backend:
1. Guarda archivo en DB
2. Procesa CSV con SecurityEvaluationAnalyzer
3. Calcula scores por dimensión
4. Genera recomendaciones con ChatGPT
5. Genera PDF en memoria
6. Guarda PDF como Base64 en DB
```

### Paso 3: Backend envía datos completos a n8n
```
Backend → n8n Webhook (POST)
Payload: Evaluación completa + CSV original
```

### Paso 4: n8n recibe y puede usar los datos
```
n8n puede:
- Ver todos los datos en el workflow
- Enviarlos a otros servicios (Slack, Email, etc.)
- Guardarlos en otra base de datos
- Generar reportes adicionales
- Disparar otros workflows
```

---

## 📋 Ejemplo de Output en n8n

Ahora cuando ejecutes el workflow verás:

```json
{
  "fileId": "cm5xyz123",
  "filename": "evaluacion.csv",
  "status": "COMPLETED",
  "evaluation": {
    "globalScore": 65,
    "maturityLevel": 3,
    "maturityName": "Definido - Intermedio",
    "companyInfo": {
      "name": "Mi Empresa PYME",
      "email": "admin@empresa.com"
    },
    "scores": {
      "GOBIERNO": { "score": 60, "obtained": 9, "maximum": 15 },
      "IDENTIFICAR": { "score": 80, "obtained": 4, "maximum": 5 },
      "PROTEGER": { "score": 70, "obtained": 77, "maximum": 110 },
      "DETECTAR": { "score": 56, "obtained": 14, "maximum": 25 },
      "RESPONDER": { "score": 75, "obtained": 15, "maximum": 20 },
      "RECUPERAR": { "score": 60, "obtained": 3, "maximum": 5 },
      "IMPROVE": { "score": 70, "obtained": 7, "maximum": 10 }
    },
    "questionsAnalyzed": 38
  }
}
```

**Ya NO verás:**
```json
{
  "extracted_data": {
    "type": "Cybersecurity Evaluation CSV",
    "processing_note": "Análisis realizado por..."
  }
}
```

---

## 🔧 Configuración Requerida

### En Vercel:

Asegúrate de que estas variables estén configuradas:

```
USE_N8N_INTEGRATION=true
N8N_WEBHOOK_URL=https://ciberseguridad-tesis.app.n8n.cloud/webhook-test/file_uploaded
```

**⚠️ Importante:** Actualiza `N8N_WEBHOOK_URL` con tu URL real de n8n.

### En n8n:

Ya NO necesitas el código JavaScript que intenta procesar el archivo. El workflow puede ser mucho más simple:

**Nodo 1: Webhook** (recibe datos)
```
URL: /webhook-test/file_uploaded
Method: POST
```

**Nodo 2: Código JavaScript** (opcional - transformar o filtrar datos)
```javascript
const data = $input.first().json;
const evaluation = data.evaluation;

// Ejemplo: Obtener solo dimensiones con score bajo
const lowScores = Object.entries(evaluation.scores)
  .filter(([key, value]) => value.score < 50)
  .map(([key, value]) => ({
    dimension: value.name,
    score: value.score,
    obtained: value.obtained,
    maximum: value.maximum
  }));

return {
  fileId: data.fileId,
  company: evaluation.companyInfo.name,
  globalScore: evaluation.globalScore,
  maturityLevel: evaluation.maturityLevel,
  weakAreas: lowScores
};
```

**Nodo 3: Slack/Email/etc.** (opcional - notificar)
```
Ejemplo: Enviar a Slack
Mensaje: "Nueva evaluación completada para {{ $json.company }}
Score Global: {{ $json.globalScore }}%
Nivel de Madurez: {{ $json.maturityLevel }}/5"
```

---

## 🧪 Probar la Integración

### Paso 1: Verifica el webhook en n8n

1. Ve a tu workflow en n8n
2. Copia la URL del webhook
3. Verifica que esté en formato: `https://tu-n8n.app.n8n.cloud/webhook-test/file_uploaded`

### Paso 2: Actualiza la variable en Vercel

1. Ve a: https://vercel.com/dashboard → Tu proyecto → Settings → Environment Variables
2. Busca `N8N_WEBHOOK_URL`
3. Actualiza con la URL correcta de n8n
4. Guarda y haz un redeploy

### Paso 3: Sube un archivo CSV de prueba

1. Ve a: https://ciberseguridad-eight.vercel.app
2. Sube un CSV de evaluación
3. Espera 10-30 segundos

### Paso 4: Verifica en n8n

1. Ve a tu workflow en n8n
2. Revisa las **Executions**
3. Deberías ver una nueva ejecución con todos los datos

---

## 📊 Datos Disponibles en n8n

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| `fileId` | ID único del archivo | "cm5xyz123" |
| `filename` | Nombre original | "evaluacion.csv" |
| `status` | Estado | "COMPLETED" |
| `evaluation.globalScore` | Puntuación global (0-100) | 65 |
| `evaluation.maturityLevel` | Nivel de madurez (1-5) | 3 |
| `evaluation.maturityName` | Nombre del nivel | "Definido - Intermedio" |
| `evaluation.companyInfo` | Info de la empresa | { name, email, size } |
| `evaluation.scores` | Scores por dimensión | { GOBIERNO: {...}, ... } |
| `evaluation.questionsAnalyzed` | Cantidad de preguntas | 38 |
| `evaluation.recommendations` | Recomendaciones generales | Array de strings |
| `csvData` | Contenido CSV original | String completo del CSV |

---

## 🎯 Usos Prácticos de n8n

Con estos datos, puedes:

### 1️⃣ Notificaciones Automáticas
```
Si maturityLevel < 2:
  → Enviar email urgente a directivos
  → Notificar a Slack canal #seguridad-critica
```

### 2️⃣ Análisis Agregado
```
→ Guardar datos en Google Sheets
→ Crear dashboard con Grafana
→ Comparar evolución entre evaluaciones
```

### 3️⃣ Integraciones Externas
```
→ Enviar a Jira para crear tareas de mejora
→ Actualizar CRM con estado de ciberseguridad del cliente
→ Guardar en Data Lake para análisis BI
```

### 4️⃣ Workflows Condicionales
```
Si globalScore < 50:
  → Enviar PDF por email automáticamente
  → Agendar reunión con consultor
  → Crear ticket de soporte prioritario
```

---

## ✅ Verificación Final

Después del próximo deploy, el output de n8n debería mostrar:

✅ Todos los scores por dimensión
✅ Información de la empresa
✅ Nivel de madurez calculado
✅ Recomendaciones generadas
✅ Contenido completo del CSV

❌ Ya NO mostrará:
- Solo información genérica tipo "CSV detectado"
- Metadatos sin datos reales

---

## 🚀 Próximos Pasos

1. **Commit y push** de los cambios (ya hecho en este fix)
2. **Esperar el auto-deploy** de Vercel (3-5 minutos)
3. **Subir un archivo CSV** de prueba
4. **Revisar executions en n8n** para ver los datos completos

---

**Con este cambio, n8n tendrá acceso completo a todos los datos de la evaluación procesada.** 🎉
