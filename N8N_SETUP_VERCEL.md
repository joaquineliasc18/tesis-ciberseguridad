# 🔧 CONFIGURACIÓN N8N PARA VERCEL

## ❌ Problema Resuelto:
El workflow de n8n estaba llamando a `render.com` en lugar de `vercel.app`, causando error 404.

---

## ✅ PASOS PARA CONFIGURAR N8N:

### 1️⃣ Reimportar Workflow Actualizado

1. Ve a tu n8n Cloud: https://ciberseguridad-tesis.app.n8n.cloud
2. Abre el workflow existente **"Automated Document Processor - Workflow"**
3. Haz clic en **"⋮"** (tres puntos) → **"Delete"** (eliminar workflow antiguo)
4. Haz clic en **"+" → "Import from File"**
5. Selecciona el archivo: `n8n/workflow-procesamiento-archivos.json` (actualizado)
6. Haz clic en **"Save"** y luego **"Active"** (activar el workflow)

### 2️⃣ Copiar URL del Webhook

Después de importar, verás el nodo **"Webhook - Archivo Subido"**:

1. Haz clic en el nodo
2. Copia la **Production URL**, algo como:
   ```
   https://ciberseguridad-tesis.app.n8n.cloud/webhook/file_uploaded
   ```

### 3️⃣ Configurar Variable en Vercel

1. Ve a: https://vercel.com/dashboard
2. Selecciona tu proyecto **"ciberseguridad-eight"**
3. Ve a **Settings → Environment Variables**
4. Busca la variable **`N8N_WEBHOOK_URL`**
5. Actualiza su valor con la URL copiada del paso 2:
   ```
   https://ciberseguridad-tesis.app.n8n.cloud/webhook/file_uploaded
   ```
6. ✅ Asegúrate de seleccionar los 3 ambientes:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
7. Haz clic en **"Save"**

### 4️⃣ Verificar que USE_N8N_INTEGRATION esté en 'true'

En la misma página de Environment Variables, verifica:

**USE_N8N_INTEGRATION**
```
true
```

Si no existe, créala con ese valor.

### 5️⃣ Hacer Redeploy (IMPORTANTE)

1. Ve a **Deployments** (menú superior)
2. Selecciona el deployment más reciente
3. Haz clic en **"⋯"** → **"Redeploy"**
4. ✅ **DESMARCA** "Use existing Build Cache"
5. Confirma y espera 3-4 minutos

---

## 🧪 PROBAR LA INTEGRACIÓN:

### Paso 1: Verificar Health Check

Abre: https://ciberseguridad-eight.vercel.app/health

Deberías ver:
```json
{
  "features": {
    "n8n": true
  },
  "environment": {
    "N8N_WEBHOOK_URL": "✅ Configurado"
  }
}
```

### Paso 2: Subir un CSV de Evaluación

1. Inicia sesión en: https://ciberseguridad-eight.vercel.app
2. Sube un archivo CSV de evaluación de ciberseguridad
3. El flujo debería ser:
   - ✅ Backend recibe CSV → guarda en BD → notifica a n8n
   - ✅ n8n recibe webhook → procesa archivo → envía resultado al backend
   - ✅ Backend actualiza el registro con el resultado
   - ✅ Frontend muestra la evaluación completa

### Paso 3: Ver Logs de n8n

1. Ve a tu workflow en n8n
2. Haz clic en **"Executions"** (historial)
3. Deberías ver ejecuciones exitosas cuando subes archivos

---

## 🔍 DEBUGGING:

### Si n8n no recibe el webhook:

1. Verifica que `N8N_WEBHOOK_URL` esté en Vercel
2. Verifica que `USE_N8N_INTEGRATION` sea `'true'`
3. Verifica que el workflow esté **ACTIVO** en n8n
4. Mira los logs de Vercel:
   - Ve a **Deployments → [último deployment] → Functions → /api/index.js**
   - Busca: `"📤 Enviando notificación a n8n"`

### Si n8n responde 404:

✅ YA SOLUCIONADO - El workflow ahora usa la URL correcta de Vercel

### Si el CSV no se procesa:

El backend ahora detecta archivos en memoria (`memory://`) y NO intenta leerlos del disco.

---

## 📊 URL CORRECTA DEL WORKFLOW:

**ANTES (❌ Error 404):**
```
https://cybersecurity-evaluation-system.onrender.com/api/files/{id}/result
```

**AHORA (✅ Correcto):**
```
https://ciberseguridad-eight.vercel.app/api/files/{id}/result
```

---

**¡Todo debería funcionar después de estos pasos!** 🚀
