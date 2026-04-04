import { db } from '../db/client.js';

export interface HourlyAverage {
  hour: number;
  avgSolarW: number;
  avgHomeW: number;
  avgGridW: number;
  avgBatteryW: number;
}

export interface AnomalyDay {
  date: string;
  metric: string;
  value: number;
  expectedRange: { min: number; max: number };
  description: string;
}

export async function getHourlyAverages(userId: string, days: number = 30): Promise<HourlyAverage[]> {
  const result = await db.query(
    `SELECT
       EXTRACT(HOUR FROM time) as hour,
       AVG(solar_w) as avg_solar_w,
       AVG(home_w) as avg_home_w,
       AVG(grid_w) as avg_grid_w,
       AVG(battery_w) as avg_battery_w
     FROM energy_readings
     WHERE user_id = $1 AND time > NOW() - make_interval(days => $2)
     GROUP BY EXTRACT(HOUR FROM time)
     ORDER BY hour`,
    [userId, days],
  );

  return result.rows.map((r) => ({
    hour: parseInt(r.hour),
    avgSolarW: parseFloat(r.avg_solar_w) || 0,
    avgHomeW: parseFloat(r.avg_home_w) || 0,
    avgGridW: parseFloat(r.avg_grid_w) || 0,
    avgBatteryW: parseFloat(r.avg_battery_w) || 0,
  }));
}

export async function detectAnomalies(userId: string, days: number = 7): Promise<AnomalyDay[]> {
  // Get daily totals
  const result = await db.query(
    `SELECT
       DATE(time) as date,
       SUM(solar_w) / 60000.0 as solar_kwh,
       SUM(home_w) / 60000.0 as home_kwh,
       SUM(CASE WHEN grid_w > 0 THEN grid_w ELSE 0 END) / 60000.0 as import_kwh
     FROM energy_readings
     WHERE user_id = $1 AND time > NOW() - make_interval(days => $2)
     GROUP BY DATE(time)
     ORDER BY date`,
    [userId, days + 30], // Extra 30 days for baseline
  );

  if (result.rows.length < 7) return [];

  // Calculate rolling averages and std deviations for anomaly detection
  const anomalies: AnomalyDay[] = [];
  const rows = result.rows;

  for (let i = 7; i < rows.length; i++) {
    const baseline = rows.slice(i - 7, i);
    const current = rows[i];

    for (const metric of ['solar_kwh', 'home_kwh', 'import_kwh'] as const) {
      const values = baseline.map((r) => parseFloat(r[metric]));
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const std = Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length);

      const currentValue = parseFloat(current[metric]);
      const deviation = Math.abs(currentValue - mean);

      // Flag if more than 2 standard deviations from mean
      if (std > 0 && deviation > 2 * std) {
        const metricNames: Record<string, string> = {
          solar_kwh: 'Solar production',
          home_kwh: 'Home consumption',
          import_kwh: 'Grid import',
        };

        anomalies.push({
          date: current.date,
          metric,
          value: currentValue,
          expectedRange: {
            min: Math.max(0, mean - 2 * std),
            max: mean + 2 * std,
          },
          description: `${metricNames[metric]} was ${currentValue > mean ? 'unusually high' : 'unusually low'} at ${currentValue.toFixed(1)} kWh (expected ${(mean - 2 * std).toFixed(1)}-${(mean + 2 * std).toFixed(1)} kWh)`,
        });
      }
    }
  }

  return anomalies;
}

export async function getPeakUsageTimes(userId: string): Promise<{ hour: number; avgW: number }[]> {
  const hourly = await getHourlyAverages(userId, 30);
  return hourly
    .map((h) => ({ hour: h.hour, avgW: h.avgHomeW }))
    .sort((a, b) => b.avgW - a.avgW)
    .slice(0, 5);
}
