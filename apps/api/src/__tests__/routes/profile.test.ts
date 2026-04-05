import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildApp } from '../../server.js';

// Mock the database
vi.mock('../../db/client.js', () => ({
  db: {
    query: vi.fn(),
  },
}));

import { db } from '../../db/client.js';

const mockDb = vi.mocked(db);

describe('Profile Route', () => {
  let app: ReturnType<typeof buildApp>;
  let token: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = buildApp({ logger: false });
    await app.ready();
    token = app.jwt.sign({ id: 'test-user-id', email: 'test@example.com' });
  });

  describe('GET /api/auth/profile', () => {
    it('returns user profile', async () => {
      mockDb.query.mockResolvedValue({
        rows: [
          {
            id: 'test-user-id',
            email: 'test@example.com',
            created_at: '2026-01-15T00:00:00.000Z',
          },
        ],
      } as any);

      const res = await app.inject({
        method: 'GET',
        url: '/api/auth/profile',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.email).toBe('test@example.com');
      expect(body.data.createdAt).toBe('2026-01-15T00:00:00.000Z');
    });

    it('returns 401 without auth', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/auth/profile',
      });
      expect(res.statusCode).toBe(401);
    });
  });
});
