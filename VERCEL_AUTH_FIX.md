# 🔧 SOLUCIÓN ERROR DE AUTENTICACIÓN EN VERCEL

## ❌ Problema:
```
Error loading files: Error: Error al verificar autenticación
```

## ✅ Causa:
Las variables de entorno **NO están siendo leídas** correctamente en Vercel.

---

## 📋 PASOS PARA SOLUCIONAR:

### 1️⃣ Verificar Health Check

Abre en tu navegador:
```
https://ciberseguridad-eight.vercel.app/health
```

Deberías ver algo como:
```json
{
  "status": "OK",
  "environment": {
    "DATABASE_URL": "✅ Configurado",
    "JWT_SECRET": "✅ Configurado",
    "JWT_REFRESH_SECRET": "✅ Configurado",
    "OPENAI_API_KEY": "✅ Configurado"
  }
}
```

**Si alguna variable muestra "❌ NO configurado"**, continúa con el paso 2.

---

### 2️⃣ Verificar Variables en Vercel

1. Ve a: https://vercel.com/dashboard
2. Selecciona tu proyecto **"ciberseguridad-eight"**
3. Ve a **Settings** → **Environment Variables**
4. Verifica que tengas estas 4 variables con valores:

#### ✅ Variables REQUERIDAS:

**DATABASE_URL**
```
postgresql://postgres.scswxvfghgschhlumvmu:fwXB7J4%23G%26%2BBcnx@aws-1-sa-east-1.pooler.supabase.com:5432/postgres
```

**JWT_SECRET**
```
oVzQbyY3DaShpe1nNUDMEzEVpfKVtJp6jzv7HCxsc55f4K1Zj3WW6VsT3Vtp9vXHhgEZW6LeNKCwZ5uoOsfFEg==
```

**JWT_REFRESH_SECRET**
```
+/HvdimeIGDWCXLh0cu+x+6bQiQ/QnOhgUc/mcUibTT4qiJuGUfvuji80mW9afSJp8xYm7iNvG2LlktF1TTt6w==
```

**OPENAI_API_KEY**
```
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
```

⚠️ **IMPORTANTE**: Cada variable debe tener seleccionados los 3 ambientes:
- ✅ Production
- ✅ Preview  
- ✅ Development

---

### 3️⃣ Hacer Redeploy COMPLETO

**Si faltaban variables o no tenían los 3 ambientes:**

1. Guarda las variables correctamente
2. Ve a **Deployments** (en el menú superior)
3. Selecciona el deployment más reciente (primero de la lista)
4. Haz click en **"⋯"** (tres puntos) → **"Redeploy"**
5. ✅ **MARCA LA OPCIÓN**: **"Use existing Build Cache"** → **DESMARCALA** (queremos un rebuild completo)
6. Confirma el redeploy
7. Espera **3-4 minutos**

---

### 4️⃣ Verificar que funcionó

1. Abre: https://ciberseguridad-eight.vercel.app/health
2. Verifica que TODAS las variables muestren "✅ Configurado"
3. Inicia sesión en: https://ciberseguridad-eight.vercel.app
4. Deberías poder ver y subir archivos sin error 500

---

## 🚨 Si SIGUE sin funcionar:

Puede ser que Vercel tenga cacheado el deployment antiguo. **Elimina y reconecta el repositorio**:

1. Ve a tu proyecto en Vercel → **Settings** → **Git**
2. Haz click en **"Disconnect"**
3. Haz click en **"Connect Git Repository"**
4. Selecciona de nuevo: `joaquineliasc18/tesis-ciberseguridad`
5. Vercel hará un deployment completamente nuevo con las variables correctas

---

## 📊 Logs de Debug

Si quieres ver los logs del error:

1. Ve a Vercel → Tu proyecto → **Deployments**
2. Click en el deployment activo
3. Click en **"Functions"**
4. Click en `/api/index.js`
5. Mira los logs para ver el error exacto

---

**Avísame después de:**
1. Abrir `/health` y ver qué variables están configuradas
2. Hacer el redeploy

Y te ayudo con lo que siga. 🚀
