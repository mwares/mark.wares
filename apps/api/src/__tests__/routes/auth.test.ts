import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildApp } from '../../server.js';

// Mock the database
vi.mock('../../db/client.js', () => {
  const mockRows: Record<string, unknown[]> = {};

  return {
    db: {
      query: vi.fn(async (text: string, params?: unknown[]) => {
        // SELECT for duplicate check during registration
        if (text.includes('SELECT id FROM users WHERE email')) {
          const email = params?.[0];
          if (email === 'existing@example.com') {
            return { rows: [{ id: 'existing-id' }] };
          }
          return { rows: [] };
        }

        // INSERT user
        if (text.includes('INSERT INTO users')) {
          const id = 'test-user-id-123';
          return {
            rows: [{ id, email: params?.[0], created_at: new Date().toISOString() }],
          };
        }

        // INSERT tesla_connections (demo provisioning)
        if (text.includes('INSERT INTO tesla_connections')) {
          return { rows: [] };
        }

        // SELECT user for login
        if (text.includes('SELECT id, email, password_hash')) {
          const email = params?.[0];
          if (email === 'test@example.com') {
            // bcrypt hash of 'testpass123' with 12 rounds
            const bcrypt = await import('bcrypt');
            const hash = await bcrypt.hash('testpass123', 12);
            return {
              rows: [
                {
                  id: 'test-user-id-123',
                  email: 'test@example.com',
                  password_hash: hash,
                  created_at: new Date().toISOString(),
                },
              ],
            };
          }
          return { rows: [] };
        }

        return { rows: [] };
      }),
    },
  };
});

describe('Auth Routes', () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(async () => {
    app = buildApp({ logger: false });
    await app.ready();
  });

  describe('POST /api/auth/register', () => {
    it('registers a new user and returns token', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: { email: 'new@example.com', password: 'password123' },
      });

      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.body);
      expect(body.data.user.email).toBe('new@example.com');
      expect(body.data.token).toBeDefined();
      expect(body.data.isDemo).toBe(true);
    });

    it('rejects short passwords', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: { email: 'new@example.com', password: 'short' },
      });

      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.body);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects missing email', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: { email: '', password: 'password123' },
      });

      expect(res.statusCode).toBe(400);
    });

    it('rejects duplicate email', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: { email: 'existing@example.com', password: 'password123' },
      });

      expect(res.statusCode).toBe(409);
      const body = JSON.parse(res.body);
      expect(body.error.code).toBe('USER_EXISTS');
    });
  });

  describe('POST /api/auth/login', () => {
    it('logs in with valid credentials', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { email: 'test@example.com', password: 'testpass123' },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.user.email).toBe('test@example.com');
      expect(body.data.token).toBeDefined();
    });

    it('rejects invalid email', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { email: 'nobody@example.com', password: 'password123' },
      });

      expect(res.statusCode).toBe(401);
      const body = JSON.parse(res.body);
      expect(body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('rejects wrong password', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { email: 'test@example.com', password: 'wrongpassword' },
      });

      expect(res.statusCode).toBe(401);
      const body = JSON.parse(res.body);
      expect(body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('GET /health', () => {
    it('returns ok status', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.status).toBe('ok');
      expect(body.timestamp).toBeDefined();
    });
  });
});
