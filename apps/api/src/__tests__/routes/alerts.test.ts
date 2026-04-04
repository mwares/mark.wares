import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildApp } from '../../server.js';

vi.mock('../../db/client.js', () => ({
  db: {
    query: vi.fn(),
  },
}));

import { db } from '../../db/client.js';

const mockDb = vi.mocked(db);

describe('Alert Routes', () => {
  let app: ReturnType<typeof buildApp>;
  let token: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = buildApp({ logger: false });
    await app.ready();
    token = app.jwt.sign({ id: 'test-user-id', email: 'test@example.com' });
  });

  describe('GET /api/alerts/rules', () => {
    it('returns user alert rules', async () => {
      mockDb.query.mockResolvedValue({
        rows: [
          {
            id: 'rule-1',
            user_id: 'test-user-id',
            metric: 'battery_soe',
            condition: 'lt',
            threshold: 20,
            label: 'Battery low',
            enabled: true,
            created_at: '2026-04-04T10:00:00Z',
          },
        ],
      } as any);

      const res = await app.inject({
        method: 'GET',
        url: '/api/alerts/rules',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].metric).toBe('battery_soe');
    });

    it('returns 401 without auth', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/alerts/rules',
      });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('POST /api/alerts/rules', () => {
    it('creates a new alert rule', async () => {
      mockDb.query.mockResolvedValue({
        rows: [
          {
            id: 'new-rule-id',
            user_id: 'test-user-id',
            metric: 'home_w',
            condition: 'gt',
            threshold: 3000,
            label: 'High consumption',
            enabled: true,
          },
        ],
      } as any);

      const res = await app.inject({
        method: 'POST',
        url: '/api/alerts/rules',
        headers: { authorization: `Bearer ${token}` },
        payload: {
          metric: 'home_w',
          condition: 'gt',
          threshold: 3000,
          label: 'High consumption',
        },
      });

      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.body);
      expect(body.data.metric).toBe('home_w');
      expect(body.data.threshold).toBe(3000);
    });

    it('rejects invalid metric', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/alerts/rules',
        headers: { authorization: `Bearer ${token}` },
        payload: {
          metric: 'invalid_metric',
          condition: 'gt',
          threshold: 100,
        },
      });

      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.body);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects invalid condition', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/alerts/rules',
        headers: { authorization: `Bearer ${token}` },
        payload: {
          metric: 'solar_w',
          condition: 'invalid',
          threshold: 100,
        },
      });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('PATCH /api/alerts/rules/:id', () => {
    it('updates an alert rule', async () => {
      mockDb.query.mockResolvedValue({
        rows: [
          {
            id: 'rule-1',
            enabled: false,
            threshold: 25,
          },
        ],
      } as any);

      const res = await app.inject({
        method: 'PATCH',
        url: '/api/alerts/rules/rule-1',
        headers: { authorization: `Bearer ${token}` },
        payload: { enabled: false, threshold: 25 },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.enabled).toBe(false);
    });

    it('returns 400 with no update fields', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: '/api/alerts/rules/rule-1',
        headers: { authorization: `Bearer ${token}` },
        payload: {},
      });

      expect(res.statusCode).toBe(400);
    });

    it('returns 404 for nonexistent rule', async () => {
      mockDb.query.mockResolvedValue({ rows: [] } as any);

      const res = await app.inject({
        method: 'PATCH',
        url: '/api/alerts/rules/nonexistent',
        headers: { authorization: `Bearer ${token}` },
        payload: { enabled: false },
      });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/alerts/rules/:id', () => {
    it('deletes an alert rule', async () => {
      mockDb.query.mockResolvedValue({ rows: [{ id: 'rule-1' }] } as any);

      const res = await app.inject({
        method: 'DELETE',
        url: '/api/alerts/rules/rule-1',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.deleted).toBe(true);
    });

    it('returns 404 for nonexistent rule', async () => {
      mockDb.query.mockResolvedValue({ rows: [] } as any);

      const res = await app.inject({
        method: 'DELETE',
        url: '/api/alerts/rules/nonexistent',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /api/alerts/notifications', () => {
    it('returns notification history', async () => {
      mockDb.query.mockResolvedValue({
        rows: [
          {
            id: 'notif-1',
            user_id: 'test-user-id',
            title: 'Battery low',
            body: 'Battery at 15%',
            sent_at: '2026-04-04T14:00:00Z',
            read: false,
          },
        ],
      } as any);

      const res = await app.inject({
        method: 'GET',
        url: '/api/alerts/notifications',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].title).toBe('Battery low');
    });
  });

  describe('PATCH /api/alerts/notifications/:id/read', () => {
    it('marks notification as read', async () => {
      mockDb.query.mockResolvedValue({
        rows: [{ id: 'notif-1', read: true }],
      } as any);

      const res = await app.inject({
        method: 'PATCH',
        url: '/api/alerts/notifications/notif-1/read',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.read).toBe(true);
    });
  });
});
