# 🔒 Sistema de Evaluación de Madurez en Ciberseguridad para PYMEs

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg) ![Node](https://img.shields.io/badge/node->=16.x-green.svg) ![License](https://img.shields.io/badge/license-MIT-blue.svg)

Sistema integral desarrollado como **proyecto de tesis universitaria** para evaluar y mejorar la madurez en ciberseguridad de Pequeñas y Medianas Empresas (PYMEs) mediante un enfoque basado en inteligencia artificial y el marco NIST Cybersecurity Framework 2.0.

## 🎯 Objetivo del Proyecto

Proporcionar a las PYMEs una herramienta **profesional, accesible y automatizada** que les permita:
- ✅ **Evaluar** su postura actual de ciberseguridad
- 🤖 **Obtener** recomendaciones personalizadas basadas en IA (ChatGPT)
- 📄 **Generar** informes ejecutivos detallados
- 📈 **Identificar** áreas de mejora prioritarias según estándares internacionales

## 🚀 Características Principales

### ✨ **Funcionalidades Core**
- **📊 Evaluación NIST CSF 2.0**: Cuestionario de 38 preguntas estructuradas
- **🤖 IA Integrada**: Recomendaciones personalizadas con OpenAI GPT-4o-mini
- **📄 Informes Ejecutivos**: Generación automática de PDFs profesionales
- **🔄 Procesamiento Automático**: Workflows inteligentes con n8n
- **💾 Gestión Completa**: Upload, procesamiento y almacenamiento seguro
- **📈 Dashboard Interactivo**: Visualización de métricas y resultados

### 🏗️ **Arquitectura Técnica**
- **Backend**: Node.js + Express + PostgreSQL + Prisma ORM
- **Frontend**: HTML5 + Bootstrap 5 + JavaScript (SPA)
- **IA/ML**: OpenAI GPT-4o-mini para recomendaciones contextuales
- **Automatización**: n8n workflows para procesamiento de eventos
- **Base de Datos**: PostgreSQL con esquema optimizado y transaccional
- **Reportes**: PDFKit para generación de informes ejecutivos

## 🏗️ Arquitectura del Sistema

El sistema implementa un **patrón de Agente de IA** donde la aplicación Node.js actúa como el agente principal que orquesta múltiples herramientas especializadas:

```
┌─────────────────────────────────────────────────────────────┐
│                   FRONTEND (Bootstrap 5)                    │
│ 📊 Dashboard │ 📤 Upload │ 📄 Reports │ 📈 Visualization    │
└─────────────────────┬───────────────────────────────────────┘
                      │ REST API
┌─────────────────────▼───────────────────────────────────────┐
│               BACKEND - AGENTE IA PRINCIPAL                 │
│                    (Node.js + Express)                     │
│                                                             │
│ ┌─────────────────┐  ┌─────────────────┐  ┌───────────────┐ │
│ │ Security        │  │ ChatGPT Service │  │ PDF Generator │ │
│ │ Analyzer        │  │ (AI Tool)       │  │ Service       │ │
│ │ (NIST CSF 2.0)  │  └─────────────────┘  └───────────────┘ │
│ └─────────────────┘                                        │
└─────────────────────┬───────────────────────────────────────┘
                      │ Prisma ORM
┌─────────────────────▼───────────────────────────────────────┐
│                PostgreSQL Database                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 n8n Workflow Engine                         │
│              (Event Orchestration)                          │
└─────────────────────────────────────────────────────────────┘
```

### 🔄 **Flujo de Procesamiento**
1. **Usuario** sube archivo CSV con evaluación
2. **Backend** guarda archivo y dispara evento a n8n
3. **n8n** procesa evento y devuelve control al backend
4. **Security Analyzer** analiza respuestas según NIST CSF 2.0
5. **ChatGPT Service** genera recomendaciones personalizadas
6. **PDF Generator** crea informe ejecutivo
7. **Frontend** muestra resultados y permite descarga

## 📋 Instalación Rápida

### **Prerrequisitos**
- Node.js >= 16.x
- PostgreSQL >= 12.x  
- Git

### **Pasos Básicos**

```bash
# 1. Clonar repositorio
git clone https://github.com/HarvyAlbarran/Automated-Document-Processor.git
cd Automated-Document-Processor

# 2. Instalar dependencias
npm install

# 3. Configurar base de datos
createdb -U postgres tesis_archivos

# 4. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de PostgreSQL

# 5. Ejecutar migraciones
npm run db:migrate

# 6. Iniciar sistema
npm run dev
```

**🌐 Sistema disponible en:** `http://localhost:3000`

> 📚 **Para instalación detallada:** Ver [Guía Completa de Instalación](docs/INSTALLATION.md)

## 🔧 Uso del Sistema

### **Flujo Básico de Evaluación**

1. **📤 Subir Archivo**: Arrastrar CSV con respuestas de evaluación
2. **⏳ Procesamiento**: El sistema analiza automáticamente las 38 preguntas
3. **📊 Resultados**: Ver métricas de madurez por dimensión NIST
4. **📄 Informe**: Descargar PDF ejecutivo con recomendaciones

### **API Endpoints Principales**

| Endpoint | Método | Descripción |
|----------|---------|-------------|
| `/api/files/upload` | POST | Subir archivo para evaluación |
| `/api/files` | GET | Listar archivos procesados |
| `/api/files/{id}` | GET | Obtener evaluación específica |
| `/api/files/{id}/download` | GET | Descargar informe PDF |
| `/health` | GET | Estado del sistema |

> 📚 **Documentación completa:** Ver [API Documentation](docs/API.md)

### **Dimensiones Evaluadas (NIST CSF 2.0)**

| Dimensión | Descripción | Preguntas |
|-----------|-------------|-----------|
| **GOBIERNO** | Políticas y procedimientos organizacionales | 3 |
| **IDENTIFICAR** | Gestión de activos y evaluación de riesgos | 5 |
| **PROTEGER** | Controles de seguridad y acceso | 11 |
| **DETECTAR** | Monitoreo y análisis de eventos | 8 |
| **RESPONDER** | Plans de respuesta a incidentes | 5 |
| **RECUPERAR** | Continuidad del negocio | 3 |
| **IMPROVE** | Mejora continua de procesos | 3 |

### **Niveles de Madurez**
- **Nivel 1 (0-20%)**: 🔴 **Inicial** - Controles básicos esporádicos
- **Nivel 2 (21-40%)**: 🟡 **Gestionado** - Políticas documentadas
- **Nivel 3 (41-60%)**: 🟠 **Definido** - Procesos estandarizados  
- **Nivel 4 (61-80%)**: 🔵 **Cuantitativamente Gestionado** - Métricas implementadas
- **Nivel 5 (81-100%)**: 🟢 **Optimizante** - Mejora continua establecida

## 🛠️ Tecnologías y Herramientas

### **Backend & API**
- **Node.js** v16+ - Runtime de JavaScript
- **Express.js** - Framework web minimalista
- **PostgreSQL** - Base de datos relacional robusta
- **Prisma ORM** - Modern database toolkit
- **Multer** - Middleware para uploads multipart

### **Frontend & UI**
- **HTML5** - Estructura semántica moderna
- **Bootstrap 5** - Framework CSS responsivo
- **JavaScript Vanilla** - Sin dependencias externas
- **Chart.js** - Visualización de gráficos

### **Inteligencia Artificial**
- **OpenAI GPT-4o-mini** - Generación de recomendaciones
- **NIST CSF 2.0** - Marco de referencia estructurado
- **Algoritmos propios** - Cálculo de madurez y scoring

### **Automatización & DevOps**
- **n8n** - Workflow automation platform
- **Webhooks** - Comunicación event-driven
- **PDFKit** - Generación de documentos
- **JSON processing** - Manejo de datos estructurados

## 📚 Documentación Completa

| Documento | Descripción |
|-----------|-------------|
| 📋 **[Guía de Instalación](docs/INSTALLATION.md)** | Pasos detallados de setup |
| 🏗️ **[Arquitectura del Sistema](docs/ARCHITECTURE.md)** | Diseño técnico y patrones |
| 📡 **[API Documentation](docs/API.md)** | Endpoints y ejemplos |
| 🔧 **[Troubleshooting](docs/TROUBLESHOOTING.md)** | Solución de problemas |
| 📁 **[Documentación Extra](docs/extras/)** | Google Forms, scripts adicionales |

## 🧪 Testing y Verificación

```bash
# Verificar estado del sistema
curl http://localhost:3000/health

# Test de conexión base de datos
npm run db:studio

# Test ChatGPT (si está configurado)
node test-chatgpt.js

# Verificar archivos de ejemplo
ls uploads/*.csv
```

## � Información del Proyecto

### **Proyecto de Tesis Universitaria**
- **Estudiante**: Joaquín Albarrán
- **Carrera**: Ingeniería en Sistemas / Informática
- **Tema**: "Desarrollo de un Sistema de Evaluación de Madurez en Ciberseguridad para PYMEs basado en IA y el marco NIST CSF 2.0"
- **Año**: 2025

### **Objetivo Académico**
Este proyecto demuestra la integración de tecnologías modernas (Node.js, IA, frameworks web) para resolver problemas reales del sector empresarial, específicamente en el ámbito de la ciberseguridad para pequeñas y medianas empresas.

### **Contribuciones Técnicas**
- ✅ Implementación de agente de IA con herramientas especializadas
- ✅ Integración de OpenAI GPT con sistemas empresariales
- ✅ Aplicación práctica del marco NIST Cybersecurity Framework 2.0
- ✅ Arquitectura escalable y mantenible
- ✅ Documentación técnica exhaustiva

## 📄 Licencia y Uso

```
MIT License - Proyecto de Tesis Universitaria

Copyright (c) 2025 Joaquín Albarrán

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software for educational and research purposes.
```

## � Repositorio y Contacto

- **GitHub**: [HarvyAlbarran/Automated-Document-Processor](https://github.com/HarvyAlbarran/Automated-Document-Processor)
- **Rama Principal**: `feature/mvp_v2`
- **Versión**: 2.0.0
- **Estado**: ✅ Producción lista para entrega

## 📞 Soporte Técnico

### **Para Problemas**
1. 📖 Revisar [Troubleshooting Guide](docs/TROUBLESHOOTING.md)
2. 🔍 Verificar logs del sistema: `npm run dev`
3. 🧪 Ejecutar tests de diagnóstico incluidos
4. 📧 Contactar al desarrollador si persisten

### **Para Extensiones Futuras**
- Sistema modular preparado para nuevos marcos de evaluación
- APIs RESTful para integraciones adicionales  
- Arquitectura escalable para múltiples organizaciones
- Base sólida para funcionalidades empresariales avanzadas

---

**🚀 Sistema de Evaluación de Ciberseguridad - Desarrollado con ❤️ para mejorar la seguridad en PYMEs**

*Proyecto de Tesis - Universidad [Nombre] - 2025*