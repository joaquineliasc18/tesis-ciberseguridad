/**
 * Vercel Serverless Function Entry Point
 * Exporta la aplicación Express para ser usada como serverless function
 */

const app = require('../backend/server');

// Exportar app directamente para Vercel
module.exports = app;
