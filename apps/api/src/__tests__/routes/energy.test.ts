import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildApp } from '../../server.js';

// Mock the database
vi.mock('../../db/client.js', () => ({
  db: {
    query: vi.fn(),
  },
}));

// Mock demo service
vi.mock('../../services/demo.js', () => ({
  getDemoLiveStatus: vi.fn(() => ({
    solarW: 5200,
    batteryW: 1500,
    gridW: -700,
    homeW: 3000,
    batterySoe: 82,
    gridStatus: 'Connected',
    timestamp: '2026-04-04T12:00:00.000Z',
  })),
  generateDemoHistory: vi.fn(() => [
    {
      time: '2026-04-04T10:00:00.000Z',
      userId: 'demo',
      solarW: 4000,
      batteryW: 1000,
      gridW: -500,
      homeW: 2500,
      batterySoe: 70,
    },
    {
      time: '2026-04-04T11:00:00.000Z',
      userId: 'demo',
      solarW: 5500,
      batteryW: 2000,
      gridW: -1000,
      homeW: 2500,
      batterySoe: 80,
    },
  ]),
}));

import { db } from '../../db/client.js';

const mockDb = vi.mocked(db);

describe('Energy Routes', () => {
  let app: ReturnType<typeof buildApp>;
  let token: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = buildApp({ logger: false });
    await app.ready();

    // Generate a valid JWT
    token = app.jwt.sign({ id: 'test-user-id', email: 'test@example.com' });
  });

  describe('GET /api/energy/live', () => {
    it('returns demo live status when user has demo connection', async () => {
      mockDb.query.mockImplementation(async (text: string) => {
        if (text.includes('SELECT site_id, is_demo')) {
          return { rows: [{ site_id: 'demo-site-001', is_demo: true }] };
        }
        return { rows: [] };
      });

      const res = await app.inject({
        method: 'GET',
        url: '/api/energy/live',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.solarW).toBe(5200);
      expect(body.data.batteryW).toBe(1500);
      expect(body.data.gridW).toBe(-700);
      expect(body.data.homeW).toBe(3000);
      expect(body.data.batterySoe).toBe(82);
    });

    it('returns demo status when user has no connection', async () => {
      mockDb.query.mockResolvedValue({ rows: [] } as any);

      const res = await app.inject({
        method: 'GET',
        url: '/api/energy/live',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.solarW).toBeDefined();
    });

    it('returns 401 without auth token', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/energy/live',
      });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/energy/history', () => {
    it('returns demo history data', async () => {
      mockDb.query.mockImplementation(async (text: string) => {
        if (text.includes('SELECT site_id, is_demo')) {
          return { rows: [{ site_id: 'demo-site-001', is_demo: true }] };
        }
        return { rows: [] };
      });

      const res = await app.inject({
        method: 'GET',
        url: '/api/energy/history?period=day',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.period).toBe('day');
      expect(body.data.timeSeries).toHaveLength(2);
      expect(body.data.timeSeries[0].solarW).toBe(4000);
    });

    it('queries DB for real user data', async () => {
      mockDb.query.mockImplementation(async (text: string) => {
        if (text.includes('SELECT site_id, is_demo')) {
          return { rows: [{ site_id: 'real-site', is_demo: false }] };
        }
        if (text.includes('FROM energy_readings')) {
          return {
            rows: [
              { time: '2026-04-04T10:00:00Z', solar_w: 3000, battery_w: 500, grid_w: -200, home_w: 2300, battery_soe: 65 },
            ],
          };
        }
        return { rows: [] };
      });

      const res = await app.inject({
        method: 'GET',
        url: '/api/energy/history?period=week',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.period).toBe('week');
      expect(body.data.timeSeries[0].solarW).toBe(3000);
    });
  });

  describe('GET /api/energy/summary', () => {
    it('returns energy summary stats', async () => {
      mockDb.query.mockResolvedValue({
        rows: [
          {
            total_solar_kwh: '25.5',
            total_consumed_kwh: '18.2',
            total_exported_kwh: '8.3',
            total_imported_kwh: '1.0',
          },
        ],
      } as any);

      const res = await app.inject({
        method: 'GET',
        url: '/api/energy/summary?period=day',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.totalSolarKwh).toBeCloseTo(25.5, 1);
      expect(body.data.totalConsumedKwh).toBeCloseTo(18.2, 1);
      expect(body.data.totalExportedKwh).toBeCloseTo(8.3, 1);
      expect(body.data.totalImportedKwh).toBeCloseTo(1.0, 1);
      expect(body.data.selfConsumptionRatio).toBeGreaterThan(0);
      expect(body.data.selfConsumptionRatio).toBeLessThanOrEqual(1);
    });
  });
});
