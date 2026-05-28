# 🚀 Configuración de Auto-Deploy en Vercel

## Problema Actual:
Los cambios en GitHub no se despliegan automáticamente en Vercel. Debes hacer "Redeploy" manualmente cada vez.

## ✅ Solución: Configurar Auto-Deploy desde GitHub

### 1️⃣ Verificar Integración de GitHub con Vercel (2 minutos):

1. Ve a: https://vercel.com/dashboard
2. Selecciona tu proyecto **"ciberseguridad-eight"** (o como se llame)
3. Ve a **Settings** → **Git**
4. Deberías ver algo como:

```
✅ Connected to GitHub: joaquineliasc18/tesis-ciberseguridad
```

Si NO está conectado:

1. Haz clic en **"Connect Git Repository"**
2. Selecciona **GitHub**
3. Autoriza Vercel en tu cuenta de GitHub
4. Selecciona el repositorio: `joaquineliasc18/tesis-ciberseguridad`
5. Confirma la conexión

---

### 2️⃣ Configurar Branch para Auto-Deploy (1 minuto):

En la misma sección **Settings → Git**:

1. Busca **"Production Branch"**
2. Asegúrate de que esté configurado como: `master` (o `main` si usas ese nombre)
3. ✅ Verifica que **"Automatically deploy"** esté **ACTIVADO**

Debería verse así:

```
Production Branch: master ✅
✅ Automatic Deployments Enabled
```

---

### 3️⃣ Verificar Permisos de GitHub (opcional):

Si aún no funciona, verifica los permisos:

1. Ve a: https://github.com/settings/installations
2. Busca **"Vercel"** en la lista de aplicaciones instaladas
3. Haz clic en **"Configure"**
4. Verifica que el repositorio `joaquineliasc18/tesis-ciberseguridad` esté **seleccionado**
5. Si no está, marca el checkbox y guarda

---

### 4️⃣ Probar Auto-Deploy (2 minutos):

Ahora vamos a probar que funcione:

1. Haz un cambio pequeño en cualquier archivo (por ejemplo, agrega un comentario en README.md)
2. Haz commit y push:

```bash
git add .
git commit -m "Test auto-deploy"
git push origin master
```

3. Ve a: https://vercel.com/dashboard → Tu proyecto → **Deployments**
4. Deberías ver un nuevo deployment iniciándose automáticamente con el mensaje: **"master - Test auto-deploy"**
5. Espera 2-3 minutos a que termine

✅ **Si ves el nuevo deployment**, el auto-deploy está funcionando correctamente.

---

## 🌐 URLs de Vercel - ¿Cuál usar?

Vercel genera **3 tipos de URLs**:

### 1️⃣ URL Principal de Producción (USA ESTA):
```
https://ciberseguridad-eight.vercel.app
```
✅ **SIEMPRE APUNTA AL ÚLTIMO DEPLOYMENT DE PRODUCTION**
✅ Esta es la URL que debes compartir y usar en producción
✅ Se actualiza automáticamente con cada push a `master`

### 2️⃣ URL por Branch/Commit (Preview):
```
https://ciberseguridad-git-master-ciberseguridad-s-projects.vercel.app
```
⚠️ Esta URL es para **preview** de commits específicos
⚠️ Puede quedarse desactualizada si haces múltiples pushes

### 3️⃣ URL única por Deployment:
```
https://ciberseguridad-kkb5lac1o-ciberseguridad-s-projects.vercel.app
```
⚠️ Esta URL apunta a un deployment **específico y no cambia**
⚠️ Útil para debugging o rollback, pero NO para uso general

---

## 📋 Resumen de Configuración Recomendada:

### En Vercel Dashboard:

1. **Settings → Git:**
   - ✅ Connected to GitHub: `joaquineliasc18/tesis-ciberseguridad`
   - ✅ Production Branch: `master`
   - ✅ Automatic Deployments: **Enabled**

2. **Settings → Domains:**
   - ✅ Primary Domain: `ciberseguridad-eight.vercel.app`

3. **Settings → Environment Variables:**
   - ✅ Todas las variables configuradas (DATABASE_URL, JWT_SECRET, etc.)
   - ⚠️ **IMPORTANTE**: Recuerda cambiar `DATABASE_URL` a Transaction Mode (puerto 6543)

---

## 🔄 Flujo de Trabajo Recomendado:

### Desarrollo Local:
```bash
# 1. Hacer cambios en tu código
git add .
git commit -m "Descripción del cambio"

# 2. Push a GitHub (trigger auto-deploy)
git push origin master

# 3. Esperar 2-3 minutos

# 4. Verificar en: https://ciberseguridad-eight.vercel.app
```

### Monitoreo:
- Ve a: https://vercel.com/dashboard → **Deployments**
- Cada push a `master` debe crear un nuevo deployment automáticamente
- Si el deployment falla, verás los logs con el error

---

## ⚠️ Problemas Comunes:

### Problema: "Los cambios no se reflejan"
**Solución:**
1. Verifica que el deployment terminó (no esté "Building")
2. Limpia caché del navegador (Ctrl + Shift + R)
3. Usa la URL principal: `ciberseguridad-eight.vercel.app`

### Problema: "Deployment falla automáticamente"
**Solución:**
1. Ve a **Deployments** → Selecciona el deployment fallido
2. Ve a **"Build Logs"** o **"Function Logs"**
3. Lee el error y corrígelo
4. Haz push nuevamente

### Problema: "Auto-deploy no se activa"
**Solución:**
1. Verifica la integración de GitHub (Settings → Git)
2. Verifica permisos en GitHub (github.com/settings/installations)
3. Intenta hacer un **Manual Deploy** para verificar que la configuración sea correcta

---

## 🎯 Checklist Final:

Antes de considerar que todo está configurado:

- [ ] ✅ GitHub integrado con Vercel
- [ ] ✅ Auto-deploy activado para branch `master`
- [ ] ✅ URL principal configurada: `ciberseguridad-eight.vercel.app`
- [ ] ✅ Test de auto-deploy exitoso (push → deploy automático)
- [ ] ✅ Variables de entorno configuradas (especialmente DATABASE_URL)
- [ ] ⚠️ **DATABASE_URL cambiado a Transaction Mode (puerto 6543)** ← PENDIENTE
- [ ] ✅ CORS configurado para aceptar todas las URLs de Vercel
- [ ] ✅ Frontend carga correctamente
- [ ] ✅ Login funciona
- [ ] ⚠️ Listado de archivos funciona sin errores 500 ← Depende de DATABASE_URL

---

**Sigue estos pasos y tu sistema estará completamente automatizado.** 🚀

**Recuerda que el problema de "Error al consultar usuario" se resolverá cuando cambies la DATABASE_URL a Transaction Mode (ver [FIX_CONNECTION_POOL.md](FIX_CONNECTION_POOL.md)).**
