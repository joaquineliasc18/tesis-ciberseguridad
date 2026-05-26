# ===============================================
# 🚀 DEPLOYMENT EN RENDER - GUÍA COMPLETA
# ===============================================

## 🎯 Deployment con Render

**Render** es una plataforma confiable que ofrece:
- ✅ Deploy automático desde GitHub
- ✅ PostgreSQL con 90 días gratuitos
- ✅ Web Service gratuito (con hibernación)
- ✅ Configuración sencilla con render.yaml
- ✅ Escalabilidad automática

---

## 📋 CONFIGURACIÓN PARA RENDER

### **Paso 1: Preparar el Proyecto**

#### 1.1 Verificar Archivos de Configuración
```bash
# Verificar que tienes estos archivos:
✅ package.json (optimizado para Render)
✅ render.yaml (configuración específica)
✅ backend/prisma/schema.prisma
✅ backend/server.js (con ruta /health)
```

#### 1.2 Archivos Creados Automáticamente
- ✅ `render.yaml` - Configuración de servicios y base de datos
- ✅ `package.json` actualizado con scripts de build y prisma en dependencies

### **Paso 2: Crear Cuenta en Render**

#### 2.1 Registrarse
1. Ir a https://render.com
2. Clic en "Get Started"
3. Registrarse con GitHub
4. Autorizar acceso a tu repositorio

#### 2.2 Conectar Repositorio
1. En Render dashboard, clic "New +"
2. Seleccionar "Blueprint"
3. Conectar tu repositorio: `Automated-Document-Processor`
4. Render detectará automáticamente el `render.yaml`

### **Paso 3: Configurar Variables de Entorno**

Render tomará la mayoría de la configuración del `render.yaml`, pero necesitas configurar:

#### 3.1 Variables Requeridas:
```env
# OpenAI API Key (OBLIGATORIO)
OPENAI_API_KEY=sk-tu_api_key_aqui

# JWT Secret (se genera automáticamente)
JWT_SECRET=auto_generated

# Otras variables ya están configuradas en render.yaml
```

#### 3.2 En Render Dashboard:
1. Ir a tu servicio web → "Environment"
2. Agregar `OPENAI_API_KEY` con tu clave real
3. Las demás variables ya están configuradas automáticamente

### **Paso 4: Deploy Automático**

#### 4.1 Commit y Push:
```bash
git add .
git commit -m "Configure Render deployment"
git push origin main
```

#### 4.2 Deploy Proceso:
1. **Render detecta el push** y inicia build automático
2. **Crea PostgreSQL database** (90 días gratis)
3. **Builds el proyecto** con `npm install && npm run build`
4. **Ejecuta migraciones** de Prisma automáticamente
5. **Inicia el servicio** con `npm start`

#### 4.3 Verificar Deploy:
- Ver logs en Render dashboard
- Acceder a la URL proporcionada: `https://tu-app.onrender.com`
- Verificar health check: `https://tu-app.onrender.com/health`

### **Paso 5: Configurar Dominio (Opcional)**

#### Dominio Render Gratuito:
```
https://cybersecurity-evaluation-system.onrender.com
```

#### Dominio Personalizado ($7/mes):
1. En Render: Settings → Custom Domain
2. Agregar tu dominio: `evaluacion-ciberseguridad.com`
3. Configurar DNS records según instrucciones
4. Render provee SSL automáticamente

---

## 🎯 **PASOS PARA DEPLOYMENT EN RENDER**

### **📋 Checklist Pre-Deploy**
- ✅ Cuenta en Render creada
- ✅ Repositorio en GitHub actualizado
- ✅ API Key de OpenAI lista
- ✅ Archivos de configuración creados

### **🚀 Proceso de Deploy Completo**

#### **1. Obtener API Key de OpenAI (Si no la tienes)**
```bash
1. Ir a https://platform.openai.com/api-keys
2. Crear cuenta o login
3. Clic "Create new secret key"
4. Copiar clave: sk-xxxxxxxxxxxxxxxxxx
5. Guardar en lugar seguro
```

#### **2. Deploy en Render**
```bash
# 1. Commit archivos de configuración
git add .
git commit -m "Add Render configuration"
git push origin main

# 2. En render.com:
- Clic "New +" → "Blueprint"
- Conectar repositorio GitHub
- Seleccionar "Automated-Document-Processor"
- Render detecta render.yaml automáticamente
- Clic "Apply"
```

#### **3. Configurar Variables de Entorno**
```bash
# En Render Dashboard → Tu servicio → Environment:
1. Agregar OPENAI_API_KEY = sk-tu_clave_aqui
2. Verificar que otras variables están configuradas
3. Guardar cambios
```

#### **4. Monitorear Deploy**
```bash
# En Render Dashboard → Logs:
- Ver proceso de build en tiempo real
- Verificar instalación de dependencias
- Confirmar ejecución de migraciones Prisma
- Verificar inicio del servidor
```

#### **5. Verificar Funcionamiento**
```bash
# URLs a verificar:
✅ https://tu-app.onrender.com/health
✅ https://tu-app.onrender.com/ (frontend)
✅ https://tu-app.onrender.com/api/files (API)
```

---

## 💰 **COSTOS DE RENDER**

### **Plan Gratuito**
- ✅ **Web Service**: Gratis (hiberna tras 15min inactividad)
- ✅ **PostgreSQL**: 90 días gratis, luego $7/mes
- ✅ **SSL**: Incluido
- ✅ **Dominio**: `.onrender.com` gratuito

### **Plan Pagado ($7/mes)**
- ✅ **Servicio siempre activo** (sin hibernación)
- ✅ **Más recursos** (RAM, CPU)
- ✅ **Dominio personalizado**
- ✅ **Soporte prioritario**

---

## 🔧 **TROUBLESHOOTING RENDER**

### **Error: Build Failed**
```bash
# Verificar en logs:
1. npm install completó exitosamente
2. Prisma generate ejecutó sin errores
3. No hay dependencias faltantes
```

### **Error: Database Connection**
```bash
# Verificar:
1. PostgreSQL service está running
2. DATABASE_URL está configurada correctamente
3. Migraciones se ejecutaron exitosamente
```

### **Error: OpenAI API**
```bash
# Verificar:
1. OPENAI_API_KEY está configurada
2. Clave es válida y tiene créditos
3. No hay caracteres extra en la clave
```

### **Error: Service Hibernating**
```bash
# En plan gratuito:
1. Servicio hiberna tras 15min inactividad
2. Primera request toma 30-60 segundos en despertar
3. Para evitarlo: upgrade a plan pagado ($7/mes)
```

---

## 🎉 **RESULTADO FINAL**

Una vez completado el deployment tendrás:

### **🌐 URLs Disponibles:**
- **Frontend**: `https://cybersecurity-evaluation-system.onrender.com`
- **API**: `https://cybersecurity-evaluation-system.onrender.com/api/files`
- **Health Check**: `https://cybersecurity-evaluation-system.onrender.com/health`

### **💾 Base de Datos:**
- **PostgreSQL** configurada automáticamente
- **Migraciones** aplicadas
- **Prisma Client** funcionando

### **🤖 Funcionalidades:**
- ✅ Subida de archivos CSV
- ✅ Análisis de ciberseguridad con NIST CSF 2.0
- ✅ Recomendaciones IA con ChatGPT
- ✅ Generación de reportes PDF
- ✅ Interface web responsiva

**¡Tu sistema está listo para producción!** 🚀