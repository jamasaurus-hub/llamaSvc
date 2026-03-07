/**
 * Express application: middleware and route mounting.
 */
const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { prisma } = require('./services/db');

const app = express();

// CORS: fully open for beta (any origin). Tighten via CORS_ORIGIN when needed.
app.use(cors());

app.use(express.json());

// Health check for Render (and load balancers). GET /health → 200 when app + DB are OK.
app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ ok: true, database: 'connected' });
  } catch (err) {
    console.error('[health] database check failed', err.message);
    res.status(503).json({ ok: false, database: 'error' });
  }
});

app.use('/api', routes);

module.exports = app;
