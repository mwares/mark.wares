// ── Unit Conversions ──

export const W_TO_KW = 1 / 1000;
export const KW_TO_W = 1000;

export function wattsToKw(watts: number): number {
  return watts * W_TO_KW;
}

export function kwToWatts(kw: number): number {
  return kw * KW_TO_W;
}

export function wattsToKwh(watts: number, hours: number): number {
  return (watts * hours) / 1000;
}

// ── Polling Intervals ──

export const POLL_INTERVAL_MS = 60_000; // 1 minute
export const DASHBOARD_REFRESH_MS = 5_000; // 5 seconds

// ── Alert Defaults ──

export const ALERT_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes

export const DEFAULT_ALERT_PRESETS = [
  {
    metric: 'battery_soe' as const,
    condition: 'lt' as const,
    threshold: 20,
    label: 'Battery low (<20%)',
  },
  {
    metric: 'grid_w' as const,
    condition: 'gt' as const,
    threshold: 3000,
    label: 'High grid import (>3kW)',
  },
  {
    metric: 'solar_w' as const,
    condition: 'lt' as const,
    threshold: 100,
    label: 'Solar underperforming',
  },
];

// ── Demo Mode ──

export const DEMO_SITE_ID = 'demo-site-001';
export const DEMO_BATTERY_CAPACITY_KWH = 13.5; // Tesla Powerwall capacity
export const DEMO_SOLAR_PEAK_W = 8000; // 8kW system peak
