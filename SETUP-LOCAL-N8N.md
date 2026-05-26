# 🚀 Configuración n8n Local + Plan de Despliegue

## ✅ Estado Actual (Ya Configurado)

### 🟢 Servicios Corriendo:
- **Backend Express:** http://localhost:3000 ✅
- **n8n Local:** http://localhost:5678 ✅
- **Base de datos:** Supabase (PostgreSQL) ✅
- **GPT-4o + RAG:** Temperatura 0.1 (determinista) ✅

---

## 📋 PASO 1: Importar Workflow en n8n Local

### 1.1 Acceder a n8n
```
http://localhost:5678
```

### 1.2 Crear cuenta inicial (primera vez)
- Email: `admin@local.dev` (o el que prefieras)
- Contraseña: La que tú elijas
- ⚠️ Esta cuenta es solo local, no se sincroniza con n8n de Render

### 1.3 Importar el Workflow
1. En n8n, haz clic en **"+ Crear Workflow"** (arriba a la derecha)
2. Haz clic en **"…"** (tres puntos) → **"Importar desde archivo"**
3. Selecciona el archivo:
   ```
   n8n/workflow-local-development.json
   ```
4. El workflow se cargará con 4 nodos:
   - ✅ **Webhook - Archivo Subido** → Recibe POST del backend
   - ✅ **JS - Procesar Archivo** → Analiza el tipo de archivo
   - ✅ **HTTP - Actualizar Estado** → Envía resultado a `localhost:3000`
   - ✅ **JS - Log Final** → Registra el resultado

### 1.4 Activar el Workflow
1. En la esquina superior derecha, activa el **toggle "Activo"** (debe ponerse verde)
2. Verifica que diga **"Activo"** en verde
3. Copia la URL del webhook (aparece en el nodo Webhook):
   ```
   http://localhost:5678/webhook/file_uploaded
   ```
4. ✅ Si coincide con la URL en tu `.env`, ¡todo está listo!

---

## 🧪 PASO 2: Probar el Sistema Completo

### 2.1 Subir un Archivo de Evaluación
1. Abre: http://localhost:3000
2. Inicia sesión:
   - Email: `admin@sistema.com`
   - Password: `Admin123!`
3. Sube un archivo CSV de evaluación de ciberseguridad
4. **Flujo esperado:**
   ```
   Frontend → Backend → n8n Local → Backend (actualiza BD)
   ```

### 2.2 Ver Logs en n8n
1. Ve a n8n: http://localhost:5678
2. Haz clic en **"Executions"** (panel izquierdo)
3. Verás la ejecución del workflow con:
   - ✅ Estado: Success
   - ✅ Nodos ejecutados: 4/4
   - ✅ Tiempo de procesamiento

### 2.3 Verificar en Backend
El archivo procesado debe tener:
- Status: `COMPLETED`
- Resultado de n8n en el campo `result`
- El reporte PDF generado con recomendaciones GPT-4o

---

## 🌍 PASO 3: Plan de Despliegue (Vercel + Supabase + n8n)

### Arquitectura de Producción:

```
┌─────────────────────────────────────────────────────────────┐
│                         USUARIO                             │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│              VERCEL (Frontend + Backend API)                │
│  - Frontend: Static Site                                    │
│  - Backend: Serverless Functions                            │
│  - Webhook Endpoint: /api/files → POST                      │
└───────────┬───────────────────────────┬─────────────────────┘
            │                           │
            ▼                           ▼
┌───────────────────────┐   ┌────────────────────────────────┐
│   SUPABASE (BD)       │   │    n8n (Render o n8n Cloud)    │
│  - PostgreSQL         │   │  - Recibe webhook de Vercel    │
│  - Prisma ORM         │   │  - Procesa archivo             │
│  - Session Pooler     │   │  - Devuelve a Vercel API       │
└───────────────────────┘   └────────────────────────────────┘
```

### 3.1 Configuración de Vercel

**A. Preparar el Código:**
```bash
# 1. Crear archivo vercel.json en la raíz
{
  "version": 2,
  "builds": [
    {
      "src": "backend/server.js",
      "use": "@vercel/node"
    },
    {
      "src": "frontend/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "backend/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "frontend/$1"
    }
  ]
}

# 2. Subir a GitHub
git add .
git commit -m "Preparar para despliegue en Vercel"
git push origin main
```

**B. Conectar con Vercel:**
1. Ve a [vercel.com](https://vercel.com)
2. Importa tu repositorio de GitHub
3. Configura las variables de entorno:
   ```env
   DATABASE_URL=postgresql://postgres.xxx:password@aws-1-sa-east-1.pooler.supabase.com:5432/postgres
   JWT_SECRET=tu-secreto-jwt-seguro
   JWT_ACCESS_EXPIRATION=15m
   JWT_REFRESH_EXPIRATION=7d
   OPENAI_API_KEY=sk-proj-...
   OPENAI_MODEL=gpt-4o
   OPENAI_TEMPERATURE=0.1
   USE_CHATGPT_RECOMMENDATIONS=true
   USE_N8N_INTEGRATION=true
   N8N_WEBHOOK_URL=https://n8n-automation-service-dorp.onrender.com/webhook/file_uploaded
   ```
4. Despliega con **Deploy**

**C. URL de Producción:**
```
https://tu-proyecto.vercel.app
```

### 3.2 Actualizar n8n de Render

**A. Editar el Workflow en n8n de Render:**
1. Accede a: https://n8n-automation-service-dorp.onrender.com
2. Abre el workflow existente
3. En el nodo **"HTTP - Actualizar Estado"**, cambia la URL:
   ```javascript
   // De:
   url: "https://cybersecurity-evaluation-system.onrender.com/api/files/{{fileId}}/result"
   
   // A:
   url: "https://tu-proyecto.vercel.app/api/files/{{fileId}}/result"
   ```
4. Guarda y activa el workflow

**B. Verificar Variables de Entorno en Render (n8n):**
```env
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=tu-password
N8N_WEBHOOK_URL=/webhook/file_uploaded
```

### 3.3 Supabase (Ya Configurado)
✅ No necesitas cambios, tu Supabase ya está accesible públicamente:
```
postgresql://postgres.xxx:password@aws-1-sa-east-1.pooler.supabase.com:5432/postgres
```

---

## 🔄 Alternativa: n8n Cloud (en vez de Render)

Si prefieres usar **n8n Cloud** (más fácil de administrar):

1. **Crear cuenta en n8n Cloud:**
   - Ve a: https://n8n.cloud
   - Crea cuenta gratuita (5 workflows gratis)

2. **Importar el Workflow:**
   - Usa `workflow-procesamiento-archivos.json`
   - Cambia la URL del HTTP Request a tu Vercel URL

3. **Actualizar .env de Vercel:**
   ```env
   N8N_WEBHOOK_URL=https://tu-instancia.app.n8n.cloud/webhook/file_uploaded
   ```

**Ventajas de n8n Cloud:**
- ✅ No necesitas administrar servidor
- ✅ Escalable automáticamente
- ✅ Backups automáticos
- ✅ SSL incluido
- ✅ Más fácil de configurar

---

## 📊 Resumen de URLs

### Desarrollo Local:
- Backend: `http://localhost:3000`
- n8n: `http://localhost:5678`
- Webhook: `http://localhost:5678/webhook/file_uploaded`

### Producción (Después del Despliegue):
- Frontend/API: `https://tu-proyecto.vercel.app`
- Base de datos: Supabase (misma URL)
- n8n: `https://n8n-automation-service-dorp.onrender.com` o `https://tu-instancia.app.n8n.cloud`
- Webhook: `https://[tu-n8n]/webhook/file_uploaded`

---

## 🛠️ Comandos Útiles

### Iniciar todo localmente:
```powershell
# Terminal 1: n8n
n8n start

# Terminal 2: Backend
node backend/server.js
```

### Verificar que n8n recibe webhooks:
```powershell
# Prueba manual del webhook
curl -X POST http://localhost:5678/webhook/file_uploaded `
  -H "Content-Type: application/json" `
  -d '{
    "fileId": "test-123",
    "filename": "test.csv",
    "filepath": "/uploads/test.csv",
    "mimetype": "text/csv",
    "size": 1024
  }'
```

---

## ✅ Checklist de Despliegue

### Pre-Despliegue:
- [ ] Código subido a GitHub
- [ ] `.gitignore` incluye `.env` y `node_modules`
- [ ] `vercel.json` configurado correctamente
- [ ] Variables de entorno documentadas

### Despliegue:
- [ ] Proyecto importado en Vercel
- [ ] Variables de entorno configuradas
- [ ] Build exitoso
- [ ] Funciona en producción

### Post-Despliegue:
- [ ] n8n workflow actualizado con URL de Vercel
- [ ] Webhook funcionando correctamente
- [ ] Análisis RAG + GPT-4o operativo
- [ ] PDFs generándose correctamente

---

## 🆘 Soporte

**Si tienes problemas:**
1. Verifica los logs en Vercel Dashboard
2. Revisa las ejecuciones en n8n
3. Verifica las queries en Supabase Dashboard
4. Comprueba que todas las variables de entorno estén configuradas

**Contacto:**
- n8n Docs: https://docs.n8n.io
- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs

---

**Estado:** ✅ Sistema funcionando localmente | 🟡 Listo para despliegue en Vercel
