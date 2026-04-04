import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { LiveStatus } from '@solar-monitor/shared';

// Mock dependencies before importing the module
vi.mock('../../db/client.js', () => ({
  db: {
    query: vi.fn(),
  },
}));

vi.mock('../../utils/push.js', () => ({
  sendPushNotification: vi.fn(),
}));

import { evaluateAlerts } from '../../services/alert-engine.js';
import { db } from '../../db/client.js';
import { sendPushNotification } from '../../utils/push.js';

const mockDb = vi.mocked(db);
const mockPush = vi.mocked(sendPushNotification);

function makeLiveStatus(overrides: Partial<LiveStatus> = {}): LiveStatus {
  return {
    solarW: 5000,
    batteryW: 1000,
    gridW: -500,
    homeW: 3500,
    batterySoe: 75,
    gridStatus: 'Connected',
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

describe('Alert Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no push tokens
    mockDb.query.mockImplementation(async (text: string) => {
      if (text.includes('SELECT token FROM push_tokens')) {
        return { rows: [] };
      }
      if (text.includes('INSERT INTO notifications')) {
        return { rows: [] };
      }
      return { rows: [] };
    });
  });

  it('triggers alert when value exceeds gt threshold', async () => {
    mockDb.query.mockImplementation(async (text: string) => {
      if (text.includes('SELECT * FROM alert_rules')) {
        return {
          rows: [
            {
              id: 'rule-1',
              metric: 'home_w',
              condition: 'gt',
              threshold: 3000,
              label: 'High consumption',
              enabled: true,
            },
          ],
        };
      }
      if (text.includes('INSERT INTO notifications')) {
        return { rows: [] };
      }
      if (text.includes('SELECT token FROM push_tokens')) {
        return { rows: [] };
      }
      return { rows: [] };
    });

    const status = makeLiveStatus({ homeW: 3500 });
    await evaluateAlerts('user-1', status);

    // Should have inserted a notification
    const insertCalls = mockDb.query.mock.calls.filter(
      (call) => typeof call[0] === 'string' && call[0].includes('INSERT INTO notifications'),
    );
    expect(insertCalls.length).toBe(1);
    expect(insertCalls[0][1]).toContain('High consumption');
  });

  it('does not trigger when value is below gt threshold', async () => {
    mockDb.query.mockImplementation(async (text: string) => {
      if (text.includes('SELECT * FROM alert_rules')) {
        return {
          rows: [
            {
              id: 'rule-2',
              metric: 'home_w',
              condition: 'gt',
              threshold: 5000,
              label: 'Very high consumption',
              enabled: true,
            },
          ],
        };
      }
      return { rows: [] };
    });

    const status = makeLiveStatus({ homeW: 3500 });
    await evaluateAlerts('user-1', status);

    const insertCalls = mockDb.query.mock.calls.filter(
      (call) => typeof call[0] === 'string' && call[0].includes('INSERT INTO notifications'),
    );
    expect(insertCalls.length).toBe(0);
  });

  it('triggers alert when battery SOC drops below lt threshold', async () => {
    mockDb.query.mockImplementation(async (text: string) => {
      if (text.includes('SELECT * FROM alert_rules')) {
        return {
          rows: [
            {
              id: 'rule-3',
              metric: 'battery_soe',
              condition: 'lt',
              threshold: 20,
              label: 'Battery low',
              enabled: true,
            },
          ],
        };
      }
      if (text.includes('INSERT INTO notifications')) {
        return { rows: [] };
      }
      if (text.includes('SELECT token FROM push_tokens')) {
        return { rows: [] };
      }
      return { rows: [] };
    });

    const status = makeLiveStatus({ batterySoe: 15 });
    await evaluateAlerts('user-1', status);

    const insertCalls = mockDb.query.mock.calls.filter(
      (call) => typeof call[0] === 'string' && call[0].includes('INSERT INTO notifications'),
    );
    expect(insertCalls.length).toBe(1);
  });

  it('sends push notification when user has push tokens', async () => {
    mockDb.query.mockImplementation(async (text: string) => {
      if (text.includes('SELECT * FROM alert_rules')) {
        return {
          rows: [
            {
              id: 'rule-4',
              metric: 'grid_w',
              condition: 'gt',
              threshold: 2000,
              label: 'High grid import',
              enabled: true,
            },
          ],
        };
      }
      if (text.includes('INSERT INTO notifications')) {
        return { rows: [] };
      }
      if (text.includes('SELECT token FROM push_tokens')) {
        return { rows: [{ token: 'ExponentPushToken[test123]' }] };
      }
      return { rows: [] };
    });

    const status = makeLiveStatus({ gridW: 3000 });
    await evaluateAlerts('user-1', status);

    expect(mockPush).toHaveBeenCalledWith(
      'ExponentPushToken[test123]',
      'High grid import',
      expect.stringContaining('3000W'),
    );
  });

  it('skips disabled rules', async () => {
    mockDb.query.mockImplementation(async (text: string) => {
      if (text.includes('SELECT * FROM alert_rules')) {
        return { rows: [] }; // enabled = true filter means disabled rules don't show up
      }
      return { rows: [] };
    });

    const status = makeLiveStatus();
    await evaluateAlerts('user-1', status);

    const insertCalls = mockDb.query.mock.calls.filter(
      (call) => typeof call[0] === 'string' && call[0].includes('INSERT INTO notifications'),
    );
    expect(insertCalls.length).toBe(0);
  });

  it('handles multiple rules - triggers only matching ones', async () => {
    mockDb.query.mockImplementation(async (text: string) => {
      if (text.includes('SELECT * FROM alert_rules')) {
        return {
          rows: [
            { id: 'rule-a', metric: 'solar_w', condition: 'lt', threshold: 100, label: 'Solar low', enabled: true },
            { id: 'rule-b', metric: 'home_w', condition: 'gt', threshold: 10000, label: 'Extreme usage', enabled: true },
            { id: 'rule-c', metric: 'battery_soe', condition: 'lt', threshold: 50, label: 'Battery half', enabled: true },
          ],
        };
      }
      if (text.includes('INSERT INTO notifications')) {
        return { rows: [] };
      }
      if (text.includes('SELECT token FROM push_tokens')) {
        return { rows: [] };
      }
      return { rows: [] };
    });

    // solar=5000 (not <100), home=3500 (not >10000), battery=30 (<50) -> only rule-c triggers
    const status = makeLiveStatus({ solarW: 5000, homeW: 3500, batterySoe: 30 });
    await evaluateAlerts('user-1', status);

    const insertCalls = mockDb.query.mock.calls.filter(
      (call) => typeof call[0] === 'string' && call[0].includes('INSERT INTO notifications'),
    );
    expect(insertCalls.length).toBe(1);
    expect(insertCalls[0][1]).toContain('Battery half');
  });

  it('formats alert body with correct units', async () => {
    mockDb.query.mockImplementation(async (text: string) => {
      if (text.includes('SELECT * FROM alert_rules')) {
        return {
          rows: [
            { id: 'rule-pct', metric: 'battery_soe', condition: 'lt', threshold: 20, label: null, enabled: true },
          ],
        };
      }
      if (text.includes('INSERT INTO notifications')) {
        return { rows: [] };
      }
      if (text.includes('SELECT token FROM push_tokens')) {
        return { rows: [] };
      }
      return { rows: [] };
    });

    const status = makeLiveStatus({ batterySoe: 15 });
    await evaluateAlerts('user-1', status);

    const insertCalls = mockDb.query.mock.calls.filter(
      (call) => typeof call[0] === 'string' && call[0].includes('INSERT INTO notifications'),
    );
    // Body should contain percentage sign for battery_soe
    const body = insertCalls[0][1]?.[3];
    expect(body).toContain('%');
    expect(body).toContain('15%');
    expect(body).toContain('20%');
  });
});
