import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock all dependencies
vi.mock('../../db/client.js', () => ({
  db: {
    query: vi.fn(),
  },
}));

vi.mock('../../services/demo.js', () => ({
  getDemoLiveStatus: vi.fn(() => ({
    solarW: 5000,
    batteryW: 1200,
    gridW: -700,
    homeW: 3000,
    batterySoe: 78,
    gridStatus: 'Connected',
    timestamp: '2026-04-04T12:00:00.000Z',
  })),
}));

vi.mock('../../services/alert-engine.js', () => ({
  evaluateAlerts: vi.fn(),
}));

vi.mock('node-cron', () => ({
  default: {
    schedule: vi.fn(),
  },
}));

import { db } from '../../db/client.js';
import { getDemoLiveStatus } from '../../services/demo.js';
import { evaluateAlerts } from '../../services/alert-engine.js';
import cron from 'node-cron';
import { startPollingJob } from '../../jobs/poll-energy.js';

const mockDb = vi.mocked(db);
const mockEvaluateAlerts = vi.mocked(evaluateAlerts);
const mockCron = vi.mocked(cron);

describe('Poll Energy Job', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers a cron schedule on start', () => {
    startPollingJob();

    expect(mockCron.schedule).toHaveBeenCalledWith('* * * * *', expect.any(Function));
  });

  it('polls all active users and stores readings', async () => {
    // Set up mock: one demo user
    mockDb.query.mockImplementation(async (text: string) => {
      if (text.includes('SELECT tc.user_id')) {
        return {
          rows: [
            { user_id: 'user-1', site_id: 'demo-site-001', is_demo: true },
          ],
        };
      }
      if (text.includes('INSERT INTO energy_readings')) {
        return { rows: [] };
      }
      return { rows: [] };
    });

    // Start polling and capture the cron callback
    startPollingJob();
    const cronCallback = mockCron.schedule.mock.calls[0][1] as () => Promise<void>;

    // Execute the poll
    await cronCallback();

    // Should have queried for connections
    expect(mockDb.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT tc.user_id'),
    );

    // Should have inserted a reading
    const insertCalls = mockDb.query.mock.calls.filter(
      (call) => typeof call[0] === 'string' && call[0].includes('INSERT INTO energy_readings'),
    );
    expect(insertCalls.length).toBe(1);
    expect(insertCalls[0][1]).toContain('user-1');
    expect(insertCalls[0][1]).toContain(5000); // solarW from mock

    // Should have evaluated alerts
    expect(mockEvaluateAlerts).toHaveBeenCalledWith('user-1', expect.objectContaining({
      solarW: 5000,
      batteryW: 1200,
    }));
  });

  it('handles multiple users', async () => {
    mockDb.query.mockImplementation(async (text: string) => {
      if (text.includes('SELECT tc.user_id')) {
        return {
          rows: [
            { user_id: 'user-1', site_id: 'demo-1', is_demo: true },
            { user_id: 'user-2', site_id: 'demo-2', is_demo: true },
            { user_id: 'user-3', site_id: 'demo-3', is_demo: true },
          ],
        };
      }
      return { rows: [] };
    });

    startPollingJob();
    const cronCallback = mockCron.schedule.mock.calls[0][1] as () => Promise<void>;
    await cronCallback();

    // Should have inserted 3 readings
    const insertCalls = mockDb.query.mock.calls.filter(
      (call) => typeof call[0] === 'string' && call[0].includes('INSERT INTO energy_readings'),
    );
    expect(insertCalls.length).toBe(3);

    // Should have evaluated alerts for all 3
    expect(mockEvaluateAlerts).toHaveBeenCalledTimes(3);
  });

  it('continues polling other users if one fails', async () => {
    let callCount = 0;
    mockDb.query.mockImplementation(async (text: string) => {
      if (text.includes('SELECT tc.user_id')) {
        return {
          rows: [
            { user_id: 'user-1', site_id: 'demo-1', is_demo: true },
            { user_id: 'user-2', site_id: 'demo-2', is_demo: true },
          ],
        };
      }
      if (text.includes('INSERT INTO energy_readings')) {
        callCount++;
        if (callCount === 1) throw new Error('DB write error');
        return { rows: [] };
      }
      return { rows: [] };
    });

    startPollingJob();
    const cronCallback = mockCron.schedule.mock.calls[0][1] as () => Promise<void>;

    // Should not throw even though user-1's insert fails
    await expect(cronCallback()).resolves.toBeUndefined();

    // user-2's alert evaluation should still happen
    expect(mockEvaluateAlerts).toHaveBeenCalledWith('user-2', expect.any(Object));
  });

  it('uses demo data for demo connections', async () => {
    mockDb.query.mockImplementation(async (text: string) => {
      if (text.includes('SELECT tc.user_id')) {
        return {
          rows: [{ user_id: 'user-1', site_id: 'demo-1', is_demo: true }],
        };
      }
      return { rows: [] };
    });

    startPollingJob();
    const cronCallback = mockCron.schedule.mock.calls[0][1] as () => Promise<void>;
    await cronCallback();

    expect(getDemoLiveStatus).toHaveBeenCalled();
  });
});
