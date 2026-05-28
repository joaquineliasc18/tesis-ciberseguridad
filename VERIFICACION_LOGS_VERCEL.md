# 🔍 CÓMO VERIFICAR LA CONFIGURACIÓN DE GPT EN VERCEL

## 📋 Pasos para Verificar en Logs de Vercel

### 1️⃣ **Ir a los Logs de Vercel**

1. Ve a: https://vercel.com/dashboard
2. Selecciona tu proyecto: **ciberseguridad-eight**
3. Clic en **"Deployments"** (menú superior)
4. Selecciona el deployment activo (el primero con ✅ verde)
5. Clic en **"Functions"** (tab inferior)
6. Selecciona **`/api/index.js`**
7. Verás los logs en tiempo real

---

### 2️⃣ **QUÉ BUSCAR EN LOS LOGS**

#### ✅ **AL INICIAR EL SERVIDOR** (verás esto al principio):

```
═══════════════════════════════════════════════════════════════
🔧 CONFIGURACIÓN DE CHATGPT RECOMMENDATIONS
═══════════════════════════════════════════════════════════════
✅ Habilitado: true
🤖 Modelo: gpt-4o
🌡️  Temperature: 0 (DETERMINÍSTICO)
📝 Max Tokens: 1500
⏱️  Timeout: 30000ms
🔑 API Key: ✅ Configurada
═══════════════════════════════════════════════════════════════
```

**SI VES:**
- ❌ `Modelo: gpt-4o-mini` → **NO actualizaste OPENAI_MODEL en Vercel**
- ❌ `Temperature: 0.7 (CREATIVO)` → **NO actualizaste OPENAI_TEMPERATURE en Vercel**
- ✅ `Modelo: gpt-4o` + `Temperature: 0 (DETERMINÍSTICO)` → **CORRECTO** ✅

---

#### ✅ **AL GENERAR CADA RECOMENDACIÓN**:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 Generando recomendación ChatGPT para GOBIERNO
📊 Score: 53% | Preguntas: 4
🔧 Usando: gpt-4o | Temp: 0 | Seed: 42
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Recomendación generada para GOBIERNO
📄 Longitud: 847 caracteres
🎯 Modelo usado: gpt-4o
🌡️  Temperature: 0
📊 Tokens usados: Input=1234 | Output=256
💰 Costo estimado: $0.005120
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**VERÁS ESTO 7 VECES** (una por cada dimensión: GOBIERNO, IDENTIFICAR, PROTEGER, DETECTAR, RESPONDER, RECUPERAR, MEJORAR)

---

### 3️⃣ **VERIFICACIÓN RÁPIDA**

#### ❌ **SI VES ESTO = PROBLEMA**:
```
🤖 Modelo: gpt-4o-mini
🌡️  Temperature: 0.7 (CREATIVO)
```

**SOLUCIÓN:**
1. Ve a Vercel → Settings → Environment Variables
2. Cambia **OPENAI_MODEL** a `gpt-4o`
3. Cambia **OPENAI_TEMPERATURE** a `0.0`
4. Redeploy SIN caché

---

#### ✅ **SI VES ESTO = CORRECTO**:
```
🤖 Modelo: gpt-4o
🌡️  Temperature: 0 (DETERMINÍSTICO)
💰 Costo estimado: $0.005120
```

**RESULTADO ESPERADO EN PDF:**
- ✅ Recomendaciones con referencias: [GV.AU-SC1], [GV.RA-SC2], etc.
- ✅ Sin lenguaje florido ("Excelente", "Felicitaciones")
- ✅ Análisis directo de gaps
- ✅ Acciones específicas y medibles

---

## 🧪 PRUEBA DE DETERMINISMO

Después de verificar que usa `gpt-4o` con `temp 0`:

1. **Sube el mismo CSV 2 veces**
2. **Descarga ambos PDFs**
3. **Compara las recomendaciones de GOBIERNO**

**Deben ser IDÉNTICAS palabra por palabra** ✅

Si varían = algo está mal configurado

---

## 📊 EJEMPLO DE RECOMENDACIÓN CORRECTA (gpt-4o, temp 0)

```
La evaluación de ANONIMOS en la dimensión de Gobierno revela un nivel 
de madurez definido, pero con una puntuación del 53%, lo que indica 
áreas críticas de mejora. Actualmente, la organización no ha 
implementado controles clave que son esenciales para mitigar riesgos 
asociados con el acceso a credenciales.

Primero, se recomienda adoptar autenticadores resistentes a la 
suplantación de verificador, como FIDO2/WebAuthn, para proteger 
accesos a datos personales o críticos. Esto no solo mejorará la 
seguridad contra phishing y robo de tokens, sino que también alineará 
a la organización con las mejores prácticas de autenticación [GV.AU-SC1].

En segundo lugar, es crucial establecer una evaluación periódica del 
riesgo de credenciales, que incluya tanto a terceros como a entidades 
no humanas. Esto permitirá a ANONIMOS identificar y mitigar 
proactivamente las vulnerabilidades en su ecosistema de credenciales 
[GV.RA-SC2].

Finalmente, se deben incorporar cláusulas anti-credenciales en los 
contratos de proveedores, exigiendo autenticación multifactor 
resistente y rotación de secretos. Esto fortalecerá la seguridad en 
la cadena de suministro y reducirá riesgos asociados con terceros 
[GV.SUP-SC3].
```

**Características:**
- ✅ Referencias específicas: [GV.AU-SC1], [GV.RA-SC2], [GV.SUP-SC3]
- ✅ Análisis del gap (53% con áreas críticas)
- ✅ Acciones concretas (FIDO2/WebAuthn, evaluación periódica, cláusulas)
- ✅ Sin elogios ni lenguaje florido
- ✅ Profesional y técnico

---

## ❌ EJEMPLO DE RECOMENDACIÓN INCORRECTA (gpt-4o-mini, temp 0.7)

```
Excelente trabajo en el desarrollo de su programa de gobierno. Para 
alcanzar la excelencia, enfóquense en optimizar la integración con 
procesos de negocio, implementar análisis predictivos de riesgos y 
considerar certificaciones de seguridad que validen su madurez ante 
terceros.
```

**Problemas:**
- ❌ "Excelente trabajo", "alcanzar la excelencia" (florido)
- ❌ Sin referencias específicas [ID]
- ❌ Genérico y vago
- ❌ No analiza gaps específicos
- ❌ Menciona cosas NO del RAG (certificaciones genéricas)

---

## 🔄 CHECKLIST DE VERIFICACIÓN

### Antes de Subir CSV:

- [ ] ✅ Variables actualizadas en Vercel:
  - [ ] OPENAI_MODEL = `gpt-4o`
  - [ ] OPENAI_TEMPERATURE = `0.0`
- [ ] ✅ Redeploy realizado SIN caché
- [ ] ✅ Deployment activo (verde) en Vercel

### Al Ver Logs:

- [ ] ✅ Aparece: "Modelo: gpt-4o"
- [ ] ✅ Aparece: "Temperature: 0 (DETERMINÍSTICO)"
- [ ] ✅ Aparece: "Costo estimado: $0.00XXXX"
- [ ] ✅ NO aparece: "gpt-4o-mini"
- [ ] ✅ NO aparece: "Temperature: 0.7"

### Al Revisar PDF:

- [ ] ✅ Recomendaciones con [IDs] de controles
- [ ] ✅ Sin lenguaje florido
- [ ] ✅ Análisis directo de gaps
- [ ] ✅ Acciones específicas
- [ ] ✅ Mismo CSV = mismas recomendaciones

---

## 🆘 TROUBLESHOOTING

### Problema 1: No veo los logs de configuración

**Causa:** El servidor no se ha reiniciado desde el último deploy

**Solución:**
1. Ve a Vercel → Deployments
2. Haz un nuevo deploy (puede ser del mismo commit)
3. Espera a que termine
4. Sube un nuevo CSV

---

### Problema 2: Los logs muestran gpt-4o-mini

**Causa:** Las variables de entorno NO se actualizaron en Vercel

**Solución:**
1. Vercel → Settings → Environment Variables
2. Edita OPENAI_MODEL → Valor: `gpt-4o`
3. ✅ Marca los 3 ambientes
4. Save
5. Redeploy SIN caché

---

### Problema 3: Las recomendaciones siguen siendo genéricas

**Causa:** Puede ser que:
- No se hizo redeploy después de cambiar variables
- Se está usando un deployment viejo

**Solución:**
1. Verificar que el deployment activo sea el más reciente
2. Hacer redeploy SIN caché
3. Esperar 3-5 minutos
4. Subir CSV NUEVO (no uno previamente procesado)

---

### Problema 4: Error "OPENAI_API_KEY not found"

**Causa:** La API Key no está configurada

**Solución:**
1. Vercel → Settings → Environment Variables
2. Busca OPENAI_API_KEY
3. Si no existe, créala con tu API Key de OpenAI
4. Si existe, verifica que el valor sea correcto
5. Redeploy

---

## 📞 CONTACTO Y SOPORTE

Si después de seguir todos estos pasos sigues viendo recomendaciones genéricas:

1. **Copia los logs completos** de Vercel
2. **Toma screenshot** de las variables de entorno
3. **Comparte** el PDF generado

Esto permitirá diagnosticar el problema con precisión.

---

**Recuerda:** Los cambios en las variables de entorno NO se aplican automáticamente. Siempre debes hacer **Redeploy SIN caché** para que surtan efecto. 🚀
