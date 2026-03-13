/**
 * Express application: middleware and route mounting.
 */
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const routes = require('./routes');
const { prisma } = require('./services/db');
const { handleLogin, handleCallback, handleLogout } = require('./routes/auth');

const app = express();

// CORS: allow credentials for extension/auth; optional CORS_ORIGIN for specific origin.
const corsOrigin = process.env.CORS_ORIGIN;
app.use(
  cors({
    origin: corsOrigin || true,
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());

// Auth routes (session cookie set on callback); must be before /api.
app.get('/login', handleLogin);
app.get('/callback', handleCallback);
app.get('/logout', handleLogout);

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
