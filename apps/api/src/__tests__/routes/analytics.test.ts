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

describe('Analytics Routes', () => {
  let app: ReturnType<typeof buildApp>;
  let token: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = buildApp({ logger: false });
    await app.ready();
    token = app.jwt.sign({ id: 'test-user-id', email: 'test@example.com' });
  });

  describe('GET /api/analytics/hourly', () => {
    it('returns hourly averages', async () => {
      mockDb.query.mockResolvedValue({
        rows: [
          { hour: '10', avg_solar_w: '5000', avg_home_w: '2000', avg_grid_w: '-1000', avg_battery_w: '1500' },
          { hour: '14', avg_solar_w: '7000', avg_home_w: '2500', avg_grid_w: '-2000', avg_battery_w: '2500' },
        ],
      } as any);

      const res = await app.inject({
        method: 'GET',
        url: '/api/analytics/hourly',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data).toHaveLength(2);
      expect(body.data[0].hour).toBe(10);
      expect(body.data[0].avgSolarW).toBe(5000);
      expect(body.data[1].hour).toBe(14);
    });

    it('accepts custom days parameter', async () => {
      mockDb.query.mockResolvedValue({ rows: [] } as any);

      const res = await app.inject({
        method: 'GET',
        url: '/api/analytics/hourly?days=7',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.any(String),
        ['test-user-id', 7],
      );
    });

    it('returns 401 without auth', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/analytics/hourly',
      });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/analytics/anomalies', () => {
    it('returns empty array when insufficient data', async () => {
      mockDb.query.mockResolvedValue({ rows: [] } as any);

      const res = await app.inject({
        method: 'GET',
        url: '/api/analytics/anomalies',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data).toEqual([]);
    });
  });

  describe('GET /api/analytics/peak-times', () => {
    it('returns top 5 peak consumption hours', async () => {
      mockDb.query.mockResolvedValue({
        rows: Array.from({ length: 24 }, (_, i) => ({
          hour: String(i),
          avg_solar_w: String(i < 6 || i > 20 ? 0 : 3000),
          avg_home_w: String(1000 + (i >= 17 && i <= 20 ? 2000 : 0)),
          avg_grid_w: '500',
          avg_battery_w: '0',
        })),
      } as any);

      const res = await app.inject({
        method: 'GET',
        url: '/api/analytics/peak-times',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.length).toBeLessThanOrEqual(5);
      // Peak hours should be 17-20 (evening)
      expect(body.data[0].avgW).toBeGreaterThanOrEqual(body.data[body.data.length - 1].avgW);
    });
  });
});
