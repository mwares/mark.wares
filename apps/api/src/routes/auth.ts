import type { FastifyPluginAsync } from 'fastify';
import bcrypt from 'bcrypt';
import { db } from '../db/client.js';
import { DEMO_SITE_ID } from '@solar-monitor/shared';

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post<{ Body: { email: string; password: string } }>('/register', async (request, reply) => {
    const { email, password } = request.body;

    if (!email || !password || password.length < 8) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: 'Email and password (min 8 chars) required' },
      });
    }

    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return reply.status(409).send({
        error: { code: 'USER_EXISTS', message: 'Email already registered' },
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await db.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
      [email, passwordHash],
    );

    const user = result.rows[0];
    const token = app.jwt.sign({ id: user.id, email: user.email });

    // Auto-provision demo Tesla connection for new users
    await db.query(
      `INSERT INTO tesla_connections (user_id, site_id, access_token_enc, refresh_token_enc, token_expires_at, site_name, is_demo)
       VALUES ($1, $2, 'demo', 'demo', NOW() + INTERVAL '10 years', 'Demo Home', true)
       ON CONFLICT DO NOTHING`,
      [user.id, DEMO_SITE_ID],
    );

    return reply.status(201).send({
      data: {
        user: { id: user.id, email: user.email, createdAt: user.created_at },
        token,
        isDemo: true,
      },
    });
  });

  app.post<{ Body: { email: string; password: string } }>('/login', async (request, reply) => {
    const { email, password } = request.body;

    const result = await db.query('SELECT id, email, password_hash, created_at FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return reply.status(401).send({
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return reply.status(401).send({
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      });
    }

    const token = app.jwt.sign({ id: user.id, email: user.email });

    return reply.send({
      data: {
        user: { id: user.id, email: user.email, createdAt: user.created_at },
        token,
      },
    });
  });

  // ── Push Token Management ──

  app.post<{ Body: { token: string; platform: string } }>(
    '/push-token',
    { onRequest: [(app as any).authenticate] },
    async (request, reply) => {
      const userId = (request.user as any).id;
      const { token, platform } = request.body;

      if (!token || !platform) {
        return reply.status(400).send({
          error: { code: 'VALIDATION_ERROR', message: 'Token and platform required' },
        });
      }

      await db.query(
        `INSERT INTO push_tokens (user_id, token)
         VALUES ($1, $2)
         ON CONFLICT (user_id, token) DO NOTHING`,
        [userId, token],
      );

      return reply.status(201).send({ data: { registered: true } });
    },
  );

  app.delete<{ Params: { token: string } }>(
    '/push-token/:token',
    { onRequest: [(app as any).authenticate] },
    async (request, reply) => {
      const userId = (request.user as any).id;
      const { token } = request.params;

      await db.query('DELETE FROM push_tokens WHERE user_id = $1 AND token = $2', [userId, token]);

      return reply.send({ data: { removed: true } });
    },
  );
};
