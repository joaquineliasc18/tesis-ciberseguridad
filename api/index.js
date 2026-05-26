/**
 * Vercel Serverless Function Entry Point
 * Exporta la aplicación Express para ser usada como serverless function
 */

const app = require('../backend/server');

// Handler para Vercel Serverless
module.exports = (req, res) => {
  // Pasar la request y response a Express
  return app(req, res);
};
