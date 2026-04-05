import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { authRoutes } from './routes/auth.js';
import { energyRoutes } from './routes/energy.js';
import { alertRoutes } from './routes/alerts.js';
import { recommendationRoutes } from './routes/recommendations.js';
import { analyticsRoutes } from './routes/analytics.js';
import { teslaRoutes } from './routes/tesla.js';
import { startPollingJob } from './jobs/poll-energy.js';
import { startDailyDigestJob } from './jobs/daily-digest.js';

export function buildApp(opts = {}) {
  const app = Fastify({
    logger: true,
    ...opts,
  });

  app.register(cors, {
    origin: true,
  });

  app.register(jwt, {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  });

  app.decorate('authenticate', async function (request: any, reply: any) {
    try {
      await request.jwtVerify();
    } catch {
      reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } });
    }
  });

  // Health check
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // Routes
  app.register(authRoutes, { prefix: '/api/auth' });
  app.register(energyRoutes, { prefix: '/api/energy' });
  app.register(alertRoutes, { prefix: '/api/alerts' });
  app.register(recommendationRoutes, { prefix: '/api/recommendations' });
  app.register(analyticsRoutes, { prefix: '/api/analytics' });
  app.register(teslaRoutes, { prefix: '/api/tesla' });

  return app;
}

async function start() {
  const app = buildApp();
  const port = parseInt(process.env.PORT || '3000', 10);
  const host = process.env.HOST || '0.0.0.0';

  try {
    await app.listen({ port, host });
    app.log.info(`Server running at http://${host}:${port}`);

    // Start background jobs
    startPollingJob();
    startDailyDigestJob();
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

// Only start when run directly (not when imported for testing)
const isMainModule =
  typeof process.argv[1] === 'string' &&
  (process.argv[1].endsWith('/server.ts') || process.argv[1].endsWith('/server.js'));

if (isMainModule) {
  start();
}
