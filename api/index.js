/**
 * Vercel Serverless Function Entry Point
 * Exporta la aplicación Express para ser usada como serverless function
 */

const app = require('../backend/server');

// Vercel automáticamente envuelve esto en una serverless function
module.exports = app;
