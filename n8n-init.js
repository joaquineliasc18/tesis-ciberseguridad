/**
 * Script de inicialización de n8n para producción
 * Configura n8n con las variables de entorno correctas y ejecuta el servicio
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configurar variables de entorno para n8n
process.env.N8N_PORT = process.env.PORT || '10000';
process.env.N8N_HOST = '0.0.0.0';
process.env.N8N_PROTOCOL = 'https';
process.env.N8N_BASIC_AUTH_ACTIVE = 'true';
process.env.N8N_BASIC_AUTH_USER = process.env.N8N_BASIC_AUTH_USER || 'admin';
process.env.N8N_SECURE_COOKIE = 'false';

console.log('🚀 Iniciando n8n en producción...');
console.log('📋 Puerto:', process.env.N8N_PORT);
console.log('🌐 Host:', process.env.N8N_HOST);
console.log('🔒 Protocol:', process.env.N8N_PROTOCOL);

// Copiar workflow para que esté disponible al inicio
const workflowSource = path.join(__dirname, 'n8n', 'workflow-procesamiento-archivos.json');
if (fs.existsSync(workflowSource)) {
  console.log('📂 Workflow encontrado, listo para importar manualmente');
} else {
  console.log('❌ No se encontró el workflow');
}

// Iniciar n8n
const n8n = spawn('npx', ['n8n'], {
  stdio: 'inherit',
  env: process.env
});

n8n.on('close', (code) => {
  console.log(`n8n process exited with code ${code}`);
  process.exit(code);
});

n8n.on('error', (err) => {
  console.error('Error starting n8n:', err);
  process.exit(1);
});

// Manejar señales de terminación
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down n8n...');
  n8n.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('🛑 Shutting down n8n...');
  n8n.kill('SIGTERM');
});