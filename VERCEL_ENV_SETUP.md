# ========================================
# CONFIGURACIÓN DE VARIABLES DE ENTORNO EN VERCEL
# ========================================
# 
# INSTRUCCIONES:
# 1. Ve a https://vercel.com/dashboard
# 2. Selecciona tu proyecto "ciberseguridad-eight"
# 3. Ve a Settings > Environment Variables
# 4. Agrega las siguientes variables una por una:
#
# ========================================

# 🔵 DATABASE_URL (CRÍTICO - Sin esto el sistema NO funcionará)
# Nombre: DATABASE_URL
# Valor: postgresql://postgres.scswxvfghgschhlumvmu:fwXB7J4%23G%26%2BBcnx@aws-1-sa-east-1.pooler.supabase.com:5432/postgres
# Importante: Usa el URL con el password CODIFICADO (%23 = #, %26 = &, %2B = +)
DATABASE_URL=postgresql://postgres.scswxvfghgschhlumvmu:fwXB7J4%23G%26%2BBcnx@aws-1-sa-east-1.pooler.supabase.com:5432/postgres

# 🔵 JWT_SECRET (CRÍTICO - Para autenticación)
# Nombre: JWT_SECRET
# Valor: cambiar-este-secreto-en-produccion-usar-string-seguro-largo
JWT_SECRET=cambiar-este-secreto-en-produccion-usar-string-seguro-largo

# 🔵 JWT_REFRESH_SECRET (CRÍTICO - Para tokens de refresh)
# Nombre: JWT_REFRESH_SECRET  
# Valor: otro-secreto-diferente-para-refresh-tokens-debe-ser-unico
JWT_REFRESH_SECRET=otro-secreto-diferente-para-refresh-tokens-debe-ser-unico

# 🔵 OPENAI_API_KEY (CRÍTICO - Para las recomendaciones AI)
# Nombre: OPENAI_API_KEY
# Valor: Tu API key de OpenAI (empieza con sk-proj-)
OPENAI_API_KEY=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

# 🟢 OPENAI_MODEL (Opcional - ya tiene default)
# Nombre: OPENAI_MODEL
# Valor: gpt-4o
OPENAI_MODEL=gpt-4o

# 🟢 OPENAI_TEMPERATURE (Opcional - ya tiene default)
# Nombre: OPENAI_TEMPERATURE
# Valor: 0.0
OPENAI_TEMPERATURE=0.0

# 🟢 USE_N8N_INTEGRATION (Opcional - para webhooks)
# Nombre: USE_N8N_INTEGRATION
# Valor: false (en producción desactivado)
USE_N8N_INTEGRATION=false

# ========================================
# NOTAS IMPORTANTES:
# ========================================
#
# 1. Las variables marcadas con 🔵 son CRÍTICAS y OBLIGATORIAS
# 2. Las variables marcadas con 🟢 son opcionales (tienen defaults)
# 3. NO OLVIDES el DATABASE_URL con el password codificado
# 4. Después de agregar todas las variables, haz un REDEPLOY del proyecto
# 5. Ve a Deployments > Latest > "Redeploy"
# 6. Espera a que termine el deployment (1-2 minutos)
# 7. Prueba el sistema en https://ciberseguridad-eight.vercel.app
#
# ========================================
# VERIFICACIÓN:
# ========================================
# 
# Después de configurar las variables:
# 1. Ve a tu proyecto en Vercel
# 2. Ve a Settings > Environment Variables
# 3. Deberías ver al menos estas 4 variables:
#    ✓ DATABASE_URL
#    ✓ JWT_SECRET
#    ✓ JWT_REFRESH_SECRET
#    ✓ OPENAI_API_KEY
#
# Si falta alguna, agrégala y haz REDEPLOY
# ========================================
