import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../db/client.js', () => ({
  db: {
    query: vi.fn(),
  },
}));

import { getHourlyAverages, detectAnomalies, getPeakUsageTimes } from '../../services/analytics.js';
import { db } from '../../db/client.js';

const mockDb = vi.mocked(db);

describe('Analytics Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHourlyAverages', () => {
    it('returns hourly averages with correct structure', async () => {
      mockDb.query.mockResolvedValue({
        rows: [
          { hour: '0', avg_solar_w: '0', avg_home_w: '500', avg_grid_w: '500', avg_battery_w: '0' },
          { hour: '12', avg_solar_w: '6000', avg_home_w: '1200', avg_grid_w: '-3000', avg_battery_w: '1500' },
          { hour: '18', avg_solar_w: '500', avg_home_w: '2500', avg_grid_w: '1500', avg_battery_w: '-800' },
        ],
      } as any);

      const result = await getHourlyAverages('user-1', 30);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        hour: 0,
        avgSolarW: 0,
        avgHomeW: 500,
        avgGridW: 500,
        avgBatteryW: 0,
      });
      expect(result[1].avgSolarW).toBe(6000);
    });

    it('handles null/missing values as 0', async () => {
      mockDb.query.mockResolvedValue({
        rows: [
          { hour: '6', avg_solar_w: null, avg_home_w: '300', avg_grid_w: null, avg_battery_w: null },
        ],
      } as any);

      const result = await getHourlyAverages('user-1');

      expect(result[0].avgSolarW).toBe(0);
      expect(result[0].avgGridW).toBe(0);
      expect(result[0].avgBatteryW).toBe(0);
    });

    it('passes correct query parameters', async () => {
      mockDb.query.mockResolvedValue({ rows: [] } as any);

      await getHourlyAverages('user-42', 14);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('EXTRACT(HOUR FROM time)'),
        ['user-42', 14],
      );
    });
  });

  describe('detectAnomalies', () => {
    it('returns empty array when insufficient data', async () => {
      mockDb.query.mockResolvedValue({
        rows: [
          { date: '2026-04-01', solar_kwh: '20', home_kwh: '15', import_kwh: '5' },
          { date: '2026-04-02', solar_kwh: '22', home_kwh: '14', import_kwh: '4' },
        ],
      } as any);

      const result = await detectAnomalies('user-1', 7);

      expect(result).toEqual([]);
    });

    it('detects anomalous days when consumption spikes', async () => {
      // 7 days of baseline with slight variation + 1 day with a big spike
      const baselineValues = [14, 16, 15, 14.5, 15.5, 16, 15];
      const rows = [];
      for (let i = 0; i < 8; i++) {
        rows.push({
          date: `2026-03-${24 + i}`,
          solar_kwh: '20',
          home_kwh: i === 7 ? '50' : baselineValues[i].toString(), // Day 8 has a huge spike
          import_kwh: '5',
        });
      }

      mockDb.query.mockResolvedValue({ rows } as any);

      const result = await detectAnomalies('user-1', 7);

      // The spike day should be flagged
      const homeAnomaly = result.find((a) => a.metric === 'home_kwh');
      expect(homeAnomaly).toBeDefined();
      expect(homeAnomaly?.description).toContain('unusually high');
    });

    it('anomalies include expected range', async () => {
      const rows = [];
      for (let i = 0; i < 10; i++) {
        rows.push({
          date: `2026-03-${20 + i}`,
          solar_kwh: i >= 7 ? '2' : '20', // Last 3 days are anomalously low
          home_kwh: '15',
          import_kwh: '5',
        });
      }

      mockDb.query.mockResolvedValue({ rows } as any);

      const result = await detectAnomalies('user-1', 7);

      for (const anomaly of result) {
        expect(anomaly.expectedRange).toBeDefined();
        expect(anomaly.expectedRange.min).toBeDefined();
        expect(anomaly.expectedRange.max).toBeDefined();
        expect(anomaly.expectedRange.min).toBeLessThanOrEqual(anomaly.expectedRange.max);
      }
    });
  });

  describe('getPeakUsageTimes', () => {
    it('returns top 5 peak hours sorted by consumption', async () => {
      const rows = Array.from({ length: 24 }, (_, hour) => ({
        hour: hour.toString(),
        avg_solar_w: '0',
        avg_home_w: (hour >= 17 && hour <= 21 ? 3000 + (hour - 17) * 200 : 800).toString(),
        avg_grid_w: '0',
        avg_battery_w: '0',
      }));

      mockDb.query.mockResolvedValue({ rows } as any);

      const result = await getPeakUsageTimes('user-1');

      expect(result).toHaveLength(5);
      // Should be sorted descending by avgW
      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].avgW).toBeGreaterThanOrEqual(result[i].avgW);
      }
      // Top hour should be in the evening range
      expect(result[0].hour).toBeGreaterThanOrEqual(17);
    });
  });
});
