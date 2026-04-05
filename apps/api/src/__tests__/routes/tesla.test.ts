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

describe('Tesla Routes', () => {
  let app: ReturnType<typeof buildApp>;
  let token: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = buildApp({ logger: false });
    await app.ready();
    token = app.jwt.sign({ id: 'test-user-id', email: 'test@example.com' });
  });

  describe('GET /api/tesla/connection', () => {
    it('returns Tesla connection details', async () => {
      mockDb.query.mockResolvedValue({
        rows: [
          {
            id: 'conn-1',
            user_id: 'test-user-id',
            site_id: 'demo-site-001',
            site_name: 'Demo Home',
            is_demo: true,
            created_at: '2026-04-04T00:00:00.000Z',
          },
        ],
      } as any);

      const res = await app.inject({
        method: 'GET',
        url: '/api/tesla/connection',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.siteId).toBe('demo-site-001');
      expect(body.data.isDemo).toBe(true);
      expect(body.data.siteName).toBe('Demo Home');
    });

    it('returns null when no connection exists', async () => {
      mockDb.query.mockResolvedValue({ rows: [] } as any);

      const res = await app.inject({
        method: 'GET',
        url: '/api/tesla/connection',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data).toBeNull();
    });

    it('returns 401 without auth', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/tesla/connection',
      });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/tesla/tariff', () => {
    it('returns TOU tariff schedule', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/tesla/tariff',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.currency).toBe('AUD');
      expect(body.data.periods).toHaveLength(4);
      expect(body.data.feedInTariff).toBe(0.05);

      // Verify period structure
      const offPeak = body.data.periods.find((p: any) => p.name === 'Off-Peak');
      expect(offPeak).toBeDefined();
      expect(offPeak.ratePerKwh).toBe(0.15);

      const peak = body.data.periods.find((p: any) => p.name === 'Peak');
      expect(peak).toBeDefined();
      expect(peak.ratePerKwh).toBe(0.45);
    });
  });
});
