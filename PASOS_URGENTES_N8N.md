# 🔴 PASOS URGENTES: Eliminar e Importar Workflow n8n

## ❌ Error Actual:
```
Node not found
URL contained a reference to an unknown node. Maybe the node was deleted?
```

**Causa:** Tienes el workflow ANTIGUO en n8n con referencias rotas. Actualizar el archivo JSON no actualiza automáticamente n8n.

---

## ✅ SOLUCIÓN RÁPIDA (5 minutos):

### Paso 1: Eliminar Workflow Actual (1 minuto)

1. Ve a: **https://ciberseguridad-tesis.app.n8n.cloud**
2. Haz clic en **"Workflows"** (menú lateral)
3. Encuentra **"Automated Document Processor"**
4. Haz clic en **"⋮"** (tres puntos) → **"Delete"**
5. **Confirma la eliminación**

⚠️ **IMPORTANTE:** Tienes que ELIMINAR el workflow, no solo editarlo.

---

### Paso 2: Descargar el Archivo Correcto (30 segundos)

**Opción A - Desde tu carpeta local:**

El archivo correcto está en:
```
c:\PROYECTOS PERSONALES\Automatizacion-Ciberseguridad\Automated-Document-Processor\n8n\workflow-procesamiento-archivos.json
```

**Opción B - Desde GitHub:**

https://raw.githubusercontent.com/joaquineliasc18/tesis-ciberseguridad/master/n8n/workflow-procesamiento-archivos.json

Guarda el archivo en tu escritorio o descárgalo.

---

### Paso 3: Importar el Workflow Nuevo (2 minutos)

1. En n8n, haz clic en **"+"** (botón grande para crear workflow)
2. Haz clic en **"⋮"** (menú superior derecha)
3. Selecciona **"Import from File..."**
4. Busca y selecciona el archivo:
   - Si descargaste: `workflow-procesamiento-archivos.json` de tu escritorio
   - Si lo tienes local: De la carpeta `n8n\workflow-procesamiento-archivos.json`
5. Haz clic en **"Import"**

---

### Paso 4: Verificar los 3 Nodos (30 segundos)

Deberías ver **EXACTAMENTE estos 3 nodos**:

```
[Webhook] -----> [Analyze Data] -----> [Display Summary]
```

- ✅ **Webhook** (nodo de entrada)
- ✅ **Analyze Data** (código JavaScript)
- ✅ **Display Summary** (código JavaScript)

**Si NO ves los 3 nodos, NO sigas. Repite el Paso 3.**

---

### Paso 5: Activar el Workflow (1 minuto)

1. Haz clic en **"Save"** (botón azul, esquina superior derecha)
2. Asigna el nombre: **"Automated Document Processor"**
3. Activa el toggle **"Active"** (debe ponerse verde ✅)
4. Verás "Active" junto al nombre del workflow

---

### Paso 6: Copiar la URL del Webhook (30 segundos)

1. Haz clic en el nodo **"Webhook"** (primer nodo)
2. En el panel derecho, verás:
   - **Test URL:** `https://...webhook-test/file_uploaded`
   - **Production URL:** `https://...webhook/file_uploaded`
3. **Copia la Production URL** (la segunda, sin "test")

Ejemplo:
```
https://ciberseguridad-tesis.app.n8n.cloud/webhook/file_uploaded
```

---

### Paso 7: Actualizar URL en Vercel (2 minutos)

1. Ve a: **https://vercel.com/dashboard**
2. Selecciona tu proyecto **"ciberseguridad-eight"**
3. **Settings → Environment Variables**
4. Busca **`N8N_WEBHOOK_URL`**
5. **Edit** y pega la Production URL que copiaste
6. ✅ Selecciona **los 3 ambientes**: Production, Preview, Development
7. **Save**
8. Ve a **Deployments → ⋮ → Redeploy** (sin caché)

---

## ✅ Verificar que Funciona:

### Probar el Webhook (1 minuto):

1. Ve a: **https://ciberseguridad-eight.vercel.app**
2. Inicia sesión
3. Sube un archivo CSV de evaluación
4. Espera 10-20 segundos

### Ver la Ejecución en n8n (30 segundos):

1. En n8n, haz clic en **"Executions"** (menú lateral)
2. Deberías ver una nueva ejecución con **status verde** ✅
3. Haz clic en la ejecución
4. Verás los 3 nodos con datos:
   - **Webhook:** Datos recibidos del backend
   - **Analyze Data:** Datos organizados
   - **Display Summary:** Resumen formateado

### ❌ Si sigue sin funcionar:

**Problema:** No aparece ninguna ejecución en n8n

**Solución:**
1. Verifica que el workflow esté **Active** (verde)
2. Revisa que la URL en Vercel sea correcta (copia/pega de nuevo)
3. Confirma que hiciste el **Redeploy** en Vercel

**Problema:** Aparece ejecución pero con error

**Solución:**
1. Haz clic en la ejecución con error
2. Lee el mensaje de error
3. Compárteme el error específico para ayudarte

---

## 🎯 ¿Por qué tenías el error "Node not found"?

El workflow que tenías en n8n tenía estos problemas:

1. ❌ Nodos con IDs que ya no existen
2. ❌ Conexiones rotas entre nodos
3. ❌ Referencias a nodos eliminados

El workflow nuevo tiene:

1. ✅ 3 nodos completos con IDs nuevos
2. ✅ Conexiones correctas: Webhook → Analyze → Display
3. ✅ Código actualizado para recibir datos completos

---

## 📝 Checklist Final:

Marca cada paso que completaste:

- [ ] ✅ Eliminé el workflow antiguo de n8n
- [ ] ✅ Descargué el archivo `workflow-procesamiento-archivos.json`
- [ ] ✅ Importé el workflow nuevo en n8n
- [ ] ✅ Veo **3 nodos** en el canvas (no 2)
- [ ] ✅ Activé el workflow (toggle verde)
- [ ] ✅ Copié la Production URL del webhook
- [ ] ✅ Actualicé `N8N_WEBHOOK_URL` en Vercel (3 ambientes)
- [ ] ✅ Hice Redeploy en Vercel sin caché
- [ ] ✅ Subí un CSV de prueba
- [ ] ✅ Veo la ejecución en n8n con status verde
- [ ] ✅ **Ya NO aparece "Node not found"** ✅

---

## 🚀 Después de Completar Estos Pasos:

1. El error "Node not found" **desaparecerá**
2. Verás los 3 nodos funcionando
3. n8n recibirá datos completos de las evaluaciones
4. Podrás ver las ejecuciones con todos los detalles

---

**Avísame cuando completes el Paso 3 (importar) para verificar que veas los 3 nodos correctamente.** 🚀
