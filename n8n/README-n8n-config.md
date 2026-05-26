# Configuración de n8n para Automated Document Processor

## Información del Workflow
- **Nombre**: Automated Document Processing Workflow
- **ID**: automated-document-processor-workflow
- **Versión**: v1.0
- **Estado**: Activo

## Webhook Configuration
- **URL**: `http://localhost:5678/webhook/document-upload`
- **Método**: POST
- **Tipo**: Producción (Production)

## Nodos del Workflow

### 1. Document Upload Webhook
- **Tipo**: Webhook Trigger
- **Path**: `/webhook/document-upload`
- **Método**: POST
- **Descripción**: Recibe notificaciones cuando se sube un nuevo documento

### 2. Process Document Info
- **Tipo**: Code Node (JavaScript)
- **Función**: Procesa la información del documento recibido
- **Output**: Datos estructurados del documento

### 3. Check Document Type
- **Tipo**: IF Node
- **Condición**: Evalúa el tipo de archivo
- **Ramas**: PDF Analysis / General Analysis

### 4. PDF Analysis
- **Tipo**: Code Node (JavaScript)
- **Función**: Análisis específico para archivos PDF
- **Features**: Detección de páginas, imágenes, texto

### 5. General Analysis
- **Tipo**: Code Node (JavaScript)
- **Función**: Análisis para otros tipos de archivo
- **Features**: Detección de contenido y encoding

### 6. Send Results to API
- **Tipo**: HTTP Request
- **URL**: `http://localhost:3000/api/files/webhook/processed`
- **Método**: POST
- **Headers**: Content-Type, X-N8N-Webhook

### 7. Webhook Response
- **Tipo**: Respond to Webhook
- **Formato**: JSON
- **Respuesta**: Confirmación de procesamiento

### 8. Activity Logger
- **Tipo**: Code Node (JavaScript)
- **Función**: Registro de actividades del workflow
- **Output**: Logs estructurados

## Configuración de Headers
```json
{
  "Content-Type": "application/json",
  "X-N8N-Webhook": "document-processor"
}
```

## Variables de Entorno Recomendadas
```env
N8N_HOST=localhost
N8N_PORT=5678
N8N_PROTOCOL=http
WEBHOOK_URL=http://localhost:5678/webhook/document-upload
API_BASE_URL=http://localhost:3000
```

## Testing del Workflow
1. Importar el archivo `workflow-procesamiento-archivos.json` en n8n
2. Activar el workflow
3. Probar con un documento desde el frontend
4. Verificar logs en la consola de n8n

## Troubleshooting
- Verificar que n8n esté ejecutándose en puerto 5678
- Confirmar que el backend esté en puerto 3000
- Revisar logs de n8n para errores de conexión
- Validar formato JSON de los payloads