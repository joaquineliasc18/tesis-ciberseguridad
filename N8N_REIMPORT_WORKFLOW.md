# 🔧 Cómo Reimportar el Workflow n8n Correctamente

## ❌ Problema que Tenías:

```
Node not found
URL contained a reference to an unknown node. Maybe the node was deleted?
```

**Causa:** El workflow anterior tenía referencias a nodos que no existían o estaban mal configurados.

---

## ✅ Solución: Reimportar Workflow Completo

### Paso 1: Eliminar el Workflow Antiguo (2 minutos)

1. Ve a: https://ciberseguridad-tesis.app.n8n.cloud
2. Haz clic en **"Workflows"** en el menú lateral
3. Encuentra el workflow **"Automated Document Processor"**
4. Haz clic en el ícono de **"⋮"** (3 puntos) → **"Delete"**
5. Confirma la eliminación

---

### Paso 2: Importar el Nuevo Workflow (3 minutos)

#### Opción A: Importar desde Archivo

1. Descarga el archivo actualizado: [workflow-procesamiento-archivos.json](https://github.com/joaquineliasc18/tesis-ciberseguridad/blob/master/n8n/workflow-procesamiento-archivos.json)
2. En n8n, haz clic en **"+"** (Nuevo Workflow)
3. Haz clic en el menú **"⋮"** (esquina superior derecha) → **"Import from File"**
4. Selecciona el archivo `workflow-procesamiento-archivos.json`
5. Haz clic en **"Import"**

#### Opción B: Copiar y Pegar JSON

1. Copia todo el contenido del archivo desde GitHub o desde tu carpeta local:
   ```
   c:\PROYECTOS PERSONALES\Automatizacion-Ciberseguridad\Automated-Document-Processor\n8n\workflow-procesamiento-archivos.json
   ```

2. En n8n, crea un nuevo workflow vacío
3. Haz clic en **"⋮"** → **"Import from URL/JSON"**
4. Pega el contenido JSON completo
5. Haz clic en **"Import"**

---

### Paso 3: Verificar los 3 Nodos (1 minuto)

Deberías ver **3 nodos** en el workflow:

```
[Webhook] → [Analyze Data] → [Display Summary]
```

#### 1️⃣ Webhook (Nodo de Entrada)
- **Tipo:** Webhook
- **Path:** `file_uploaded`
- **Método:** POST
- **Función:** Recibe los datos del backend

#### 2️⃣ Analyze Data (Procesamiento)
- **Tipo:** Code (JavaScript)
- **Función:** 
  - Organiza los datos de evaluación
  - Identifica áreas débiles (score < 50%)
  - Identifica áreas fuertes (score ≥ 75%)
  - Calcula status general

#### 3️⃣ Display Summary (Resumen)
- **Tipo:** Code (JavaScript)
- **Función:**
  - Muestra resumen legible en los logs
  - Formatea la información para debugging
  - Retorna datos para nodos adicionales (opcional)

---

### Paso 4: Activar el Workflow (1 minuto)

1. Haz clic en **"Save"** (esquina superior derecha)
2. Asigna un nombre: **"Automated Document Processor"**
3. Haz clic en el toggle **"Active"** para activar el workflow
4. Verás que el estado cambia a **"Active"** ✅

---

### Paso 5: Copiar la URL del Webhook (1 minuto)

1. Haz clic en el nodo **"Webhook"** (primer nodo)
2. En el panel de parámetros, verás la URL del webhook
3. Debería verse algo así:
   ```
   Test URL: https://ciberseguridad-tesis.app.n8n.cloud/webhook-test/file_uploaded
   Production URL: https://ciberseguridad-tesis.app.n8n.cloud/webhook/file_uploaded
   ```

4. **Copia la Production URL** (la segunda)

---

### Paso 6: Actualizar Variable en Vercel (2 minutos)

1. Ve a: https://vercel.com/dashboard
2. Selecciona tu proyecto **"ciberseguridad-eight"**
3. Ve a **Settings → Environment Variables**
4. Busca **`N8N_WEBHOOK_URL`**
5. Edita y pega la **Production URL** del webhook
6. ✅ Selecciona los 3 ambientes (Production, Preview, Development)
7. **Save**

---

### Paso 7: Redeploy en Vercel (2 minutos)

**IMPORTANTE:** Necesitas redeploy para que tome la nueva URL.

1. Ve a **Deployments**
2. Selecciona el último deployment
3. **"⋮"** → **"Redeploy"**
4. **DESMARCA** "Use existing Build Cache"
5. Confirma
6. Espera 3-5 minutos

---

## 🧪 Probar el Workflow

### Paso 1: Subir un CSV de Prueba

1. Ve a: https://ciberseguridad-eight.vercel.app
2. Inicia sesión
3. Sube un archivo CSV de evaluación
4. Espera 10-30 segundos al procesamiento

### Paso 2: Verificar en n8n

1. Ve a tu workflow en n8n
2. Haz clic en **"Executions"** (panel lateral izquierdo)
3. Deberías ver una nueva ejecución con **status verde** ✅

### Paso 3: Ver los Datos

1. Haz clic en la ejecución más reciente
2. Verás el flujo completo:
   - **Webhook:** Datos recibidos del backend
   - **Analyze Data:** Datos organizados con análisis
   - **Display Summary:** Resumen formateado

3. Haz clic en cada nodo para ver sus datos:

#### En "Webhook" verás:
```json
{
  "fileId": "cm5xyz123",
  "filename": "evaluacion.csv",
  "status": "COMPLETED",
  "evaluation": {
    "globalScore": 65,
    "maturityLevel": 3,
    // ... todos los datos
  }
}
```

#### En "Analyze Data" verás:
```json
{
  "company": { "name": "Mi Empresa", "email": "..." },
  "summary": { "globalScore": 65, "maturityLevel": 3 },
  "dimensions": { "GOBIERNO": {...}, "PROTEGER": {...} },
  "analysis": {
    "weakAreas": [...],
    "strongAreas": [...],
    "overallStatus": "Good"
  }
}
```

#### En "Display Summary" verás (en los logs):
```
==================================================
📊 RESUMEN DE EVALUACIÓN DE CIBERSEGURIDAD
==================================================

🏢 EMPRESA: Mi Empresa
📧 Email: admin@empresa.com

📈 PUNTUACIÓN GLOBAL: 65%
🎯 Nivel de Madurez: 3/5 (Definido - Intermedio)
📋 Preguntas Analizadas: 38

✅ STATUS: Good

⚠️ ÁREAS QUE NECESITAN MEJORA (score < 50%):
   - Detectar: 48% (12/25 pts)

✨ FORTALEZAS (score >= 75%):
   - Identificar: 80% (4/5 pts)
   - Responder: 75% (15/20 pts)

==================================================
```

---

## ✅ Checklist de Verificación

Después de seguir estos pasos:

- [ ] ✅ Workflow antiguo eliminado
- [ ] ✅ Nuevo workflow importado
- [ ] ✅ 3 nodos visibles (Webhook → Analyze Data → Display Summary)
- [ ] ✅ Workflow activado (toggle "Active" en verde)
- [ ] ✅ URL del webhook copiada
- [ ] ✅ Variable `N8N_WEBHOOK_URL` actualizada en Vercel
- [ ] ✅ Redeploy realizado en Vercel
- [ ] ✅ Archivo CSV de prueba subido
- [ ] ✅ Ejecución aparece en n8n con status verde
- [ ] ✅ Datos completos visibles en cada nodo
- [ ] ✅ Ya NO aparece error "Node not found"

---

## 🎯 Datos que Verás en el Workflow

### Nodo 1: Webhook (Input)
Recibe del backend:
- ✅ Información del archivo (fileId, filename)
- ✅ Status (COMPLETED)
- ✅ Evaluación completa (globalScore, maturityLevel, etc.)
- ✅ Scores por dimensión (GOBIERNO, PROTEGER, etc.)
- ✅ Información de la empresa
- ✅ Recomendaciones
- ✅ Contenido del CSV original

### Nodo 2: Analyze Data (Procesamiento)
Transforma en:
- ✅ Resumen ejecutivo organizado
- ✅ Lista de áreas débiles (score < 50%)
- ✅ Lista de áreas fuertes (score ≥ 75%)
- ✅ Status general (Excellent/Good/Needs Improvement/Critical)
- ✅ Datos estructurados para uso en otros nodos

### Nodo 3: Display Summary (Output)
Muestra:
- ✅ Resumen formateado en los logs
- ✅ Información clave de la empresa
- ✅ Puntuación global y nivel de madurez
- ✅ Análisis de fortalezas y debilidades
- ✅ Retorna datos para nodos adicionales

---

## 🔧 Agregar Más Nodos (Opcional)

Después del nodo "Display Summary", puedes agregar:

### Notificación por Email
```
Nodo: Send Email (n8n-nodes-base.emailSend)
Para: {{ $json.company.email }}
Asunto: Evaluación de Ciberseguridad Completada
Contenido: 
  Empresa: {{ $json.company.name }}
  Score: {{ $json.summary.globalScore }}%
  Nivel: {{ $json.summary.maturityLevel }}/5
```

### Notificación a Slack
```
Nodo: Slack (n8n-nodes-base.slack)
Canal: #seguridad
Mensaje: 
  Nueva evaluación completada para {{ $json.company.name }}
  📊 Score: {{ $json.summary.globalScore }}%
  🎯 Nivel: {{ $json.summary.maturityName }}
  Status: {{ $json.analysis.overallStatus }}
```

### Guardar en Google Sheets
```
Nodo: Google Sheets (n8n-nodes-base.googleSheets)
Operación: Append
Hoja: Evaluaciones
Datos:
  - Fecha: {{ $json.timestamp }}
  - Empresa: {{ $json.company.name }}
  - Score: {{ $json.summary.globalScore }}
  - Nivel: {{ $json.summary.maturityLevel }}
```

---

## ⚠️ Troubleshooting

### Problema: "Node not found" persiste

**Solución:** 
1. Cierra completamente n8n
2. Abre en ventana de incógnito o borra caché
3. Reimporta el workflow desde cero

### Problema: No aparecen los 3 nodos

**Solución:**
1. Verifica que copiaste el JSON completo
2. Asegúrate de importar, no crear workflow vacío
3. Revisa que el archivo no esté corrupto

### Problema: Webhook no recibe datos

**Solución:**
1. Verifica que la URL en Vercel sea correcta
2. Confirma que el workflow esté **Active**
3. Revisa logs de Vercel para ver si envía el webhook

### Problema: Datos vacíos en los nodos

**Solución:**
1. Sube un nuevo archivo CSV después del redeploy
2. Verifica que el archivo sea un CSV válido de evaluación
3. Revisa logs del backend en Vercel

---

**Con estos pasos, el workflow debería funcionar perfectamente con los 3 nodos y sin errores.** 🚀

Si sigues teniendo problemas, comparte un screenshot de:
1. Los 3 nodos en n8n
2. La ejecución más reciente
3. Los datos de un nodo específico
