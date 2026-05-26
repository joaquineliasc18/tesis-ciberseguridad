# Configuración Manual de n8n - Workflow

## 🚨 INSTRUCCIONES IMPORTANTES

**Si el workflow no aparece automáticamente en n8n, sigue estos pasos:**

### 📋 Pasos para Importar Manualmente el Workflow:

1. **Accede a n8n:**
   - URL: https://n8n-automation-service-dorp.onrender.com
   - Usuario: `admin`
   - Contraseña: [Ver variables de entorno en Render]

2. **Importar Workflow:**
   - Haz clic en **"+ Crear Workflow"**
   - Selecciona **"Importar desde archivo"**
   - Carga el archivo: `/n8n/workflow-procesamiento-archivos.json`

3. **Activar Workflow:**
   - Una vez importado, haz clic en el **toggle "Activo"** (arriba a la derecha)
   - Verifica que el estado sea **"Activo"** (verde)

4. **Verificar Webhook:**
   - El webhook debe estar en: `/webhook/file_uploaded`
   - URL completa: `https://n8n-automation-service-dorp.onrender.com/webhook/file_uploaded`

## 🔧 Contenido del Workflow:

El archivo `workflow-procesamiento-archivos.json` contiene:

- ✅ **Webhook Trigger:** Para recibir notificaciones de archivos subidos
- ✅ **Procesamiento:** Lógica para analizar archivos CSV
- ✅ **HTTP Request:** Callback al sistema principal
- ✅ **URLs de Producción:** Configuradas para Render

## ⚠️ Problemas Comunes:

### Workflow no aparece:
1. Verificar que n8n esté corriendo
2. Importar manualmente el archivo JSON
3. Activar el workflow después de importar

### Error 404 en webhook:
1. Verificar que el workflow esté **activo**
2. Verificar la URL del webhook
3. Comprobar la autenticación básica

### Variables de entorno:
```bash
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=[PASSWORD]
```

## ✅ Verificación:

Para confirmar que funciona:
```bash
curl -X POST https://n8n-automation-service-dorp.onrender.com/webhook/file_uploaded \
  -H "Content-Type: application/json" \
  -d '{"test": "ping"}'
```

**Respuesta esperada:** Status 200 OK

---

**Archivo del Workflow:** `/n8n/workflow-procesamiento-archivos.json`  
**Estado Actual:** Listo para importación manual  
**Fecha:** Noviembre 2025