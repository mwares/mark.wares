import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the analytics dependency
vi.mock('../../services/analytics.js', () => ({
  getHourlyAverages: vi.fn(),
  getPeakUsageTimes: vi.fn(),
}));

import { generateRecommendations } from '../../services/recommendations.js';
import { getHourlyAverages } from '../../services/analytics.js';

const mockGetHourlyAverages = vi.mocked(getHourlyAverages);

describe('Recommendations Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns default recommendations when no data available', async () => {
    mockGetHourlyAverages.mockRejectedValue(new Error('No data'));

    const recs = await generateRecommendations('user-1');

    expect(recs.length).toBeGreaterThan(0);
    expect(recs[0].category).toBeDefined();
    expect(recs[0].title).toBeDefined();
    expect(recs[0].description).toBeDefined();
  });

  it('returns default recommendations when hourly data is empty', async () => {
    mockGetHourlyAverages.mockResolvedValue([]);

    const recs = await generateRecommendations('user-1');

    expect(recs.length).toBeGreaterThan(0);
    // Should be the default set
    expect(recs.some((r) => r.id.startsWith('default-'))).toBe(true);
  });

  it('recommends shifting loads to peak solar hours', async () => {
    // Simulate data with clear solar peak 10am-2pm
    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      avgSolarW: hour >= 10 && hour <= 14 ? 6000 : hour >= 7 && hour <= 18 ? 2000 : 0,
      avgHomeW: hour >= 17 && hour <= 21 ? 3000 : 800,
      avgGridW: hour >= 17 && hour <= 21 ? 2000 : -1000,
      avgBatteryW: hour >= 10 && hour <= 14 ? 2000 : -500,
    }));

    mockGetHourlyAverages.mockResolvedValue(hourlyData);

    const recs = await generateRecommendations('user-1');

    // Should include a load shifting recommendation
    const loadShiftRec = recs.find((r) => r.category === 'load_shift');
    expect(loadShiftRec).toBeDefined();
    expect(loadShiftRec?.priority).toBe('high');
  });

  it('recommends reducing grid import during peak hours', async () => {
    // Simulate high grid import in evening
    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      avgSolarW: hour >= 8 && hour <= 16 ? 5000 : 0,
      avgHomeW: 1500,
      avgGridW: hour >= 17 && hour <= 21 ? 2500 : -500,
      avgBatteryW: 0,
    }));

    mockGetHourlyAverages.mockResolvedValue(hourlyData);

    const recs = await generateRecommendations('user-1');

    // Should include a recommendation about peak import
    const importRec = recs.find(
      (r) => r.id === 'reduce-peak-import' || r.id === 'evening-preparation',
    );
    expect(importRec).toBeDefined();
  });

  it('recommends improving self-consumption when export is high', async () => {
    // Simulate lots of solar export (low self-consumption)
    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      avgSolarW: hour >= 8 && hour <= 16 ? 7000 : 0,
      avgHomeW: 800,
      avgGridW: hour >= 8 && hour <= 16 ? -5000 : 500, // Lots of export
      avgBatteryW: 0,
    }));

    mockGetHourlyAverages.mockResolvedValue(hourlyData);

    const recs = await generateRecommendations('user-1');

    const selfConsRec = recs.find((r) => r.id === 'improve-self-consumption');
    expect(selfConsRec).toBeDefined();
    expect(selfConsRec?.category).toBe('general');
  });

  it('recommends using battery more overnight when underutilized', async () => {
    // Simulate battery barely discharging at night
    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      avgSolarW: hour >= 8 && hour <= 16 ? 5000 : 0,
      avgHomeW: 1000,
      avgGridW: 200,
      avgBatteryW: hour >= 22 || hour <= 5 ? 100 : 1000, // Low overnight battery use
    }));

    mockGetHourlyAverages.mockResolvedValue(hourlyData);

    const recs = await generateRecommendations('user-1');

    const batteryRec = recs.find((r) => r.id === 'battery-night-discharge');
    expect(batteryRec).toBeDefined();
    expect(batteryRec?.category).toBe('battery_optimization');
  });

  it('all recommendations have required fields', async () => {
    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      avgSolarW: hour >= 8 && hour <= 16 ? 5000 : 0,
      avgHomeW: 2000,
      avgGridW: 500,
      avgBatteryW: 200,
    }));

    mockGetHourlyAverages.mockResolvedValue(hourlyData);

    const recs = await generateRecommendations('user-1');

    for (const rec of recs) {
      expect(rec.id).toBeDefined();
      expect(rec.category).toBeDefined();
      expect(rec.title).toBeDefined();
      expect(rec.description).toBeDefined();
      expect(rec.priority).toMatch(/^(high|medium|low)$/);
    }
  });

  it('includes estimated savings when applicable', async () => {
    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      avgSolarW: hour >= 10 && hour <= 14 ? 6000 : 0,
      avgHomeW: hour >= 17 && hour <= 21 ? 3000 : 800,
      avgGridW: hour >= 17 && hour <= 21 ? 2000 : -1000,
      avgBatteryW: 0,
    }));

    mockGetHourlyAverages.mockResolvedValue(hourlyData);

    const recs = await generateRecommendations('user-1');

    const recsWithSavings = recs.filter((r) => r.estimatedSavingsKwh !== null);
    expect(recsWithSavings.length).toBeGreaterThan(0);
    for (const rec of recsWithSavings) {
      expect(rec.estimatedSavingsKwh).toBeGreaterThan(0);
    }
  });
});
