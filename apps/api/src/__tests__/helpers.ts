import { buildApp } from '../server.js';
import type { FastifyInstance } from 'fastify';

/**
 * Builds a test Fastify instance. Call app.close() in afterAll.
 * Injects mock DB by default so tests don't need a real database.
 */
export async function buildTestApp(): Promise<FastifyInstance> {
  const app = buildApp({ logger: false });
  await app.ready();
  return app;
}

/**
 * Register a test user and return the JWT token.
 */
export async function registerAndLogin(
  app: FastifyInstance,
  email = 'test@example.com',
  password = 'testpass123',
): Promise<{ token: string; userId: string }> {
  const res = await app.inject({
    method: 'POST',
    url: '/api/auth/register',
    payload: { email, password },
  });

  const body = JSON.parse(res.body);
  return {
    token: body.data.token,
    userId: body.data.user.id,
  };
}
