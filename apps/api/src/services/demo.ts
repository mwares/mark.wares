import type { LiveStatus, EnergyReading } from '@solar-monitor/shared';
import { DEMO_SOLAR_PEAK_W, DEMO_BATTERY_CAPACITY_KWH } from '@solar-monitor/shared';

/**
 * Generates realistic demo solar data based on time of day.
 * Solar follows a sine curve peaking at noon.
 * Battery charges during solar surplus, discharges at night.
 * Grid balances the difference.
 */
export function getDemoLiveStatus(): LiveStatus {
  const now = new Date();
  const hour = now.getHours() + now.getMinutes() / 60;

  const solarW = generateSolarOutput(hour);
  const homeW = generateHomeConsumption(hour);
  const batterySoe = generateBatterySoe(hour);

  // Battery charges when solar excess, discharges when deficit
  const solarExcess = solarW - homeW;
  let batteryW = 0;
  if (solarExcess > 0 && batterySoe < 95) {
    batteryW = Math.min(solarExcess * 0.7, 5000); // Charging (positive)
  } else if (solarExcess < 0 && batterySoe > 10) {
    batteryW = Math.max(solarExcess * 0.6, -5000); // Discharging (negative)
  }

  // Grid makes up the difference
  const gridW = homeW - solarW + batteryW;

  return {
    solarW: Math.round(solarW),
    batteryW: Math.round(batteryW),
    gridW: Math.round(gridW),
    homeW: Math.round(homeW),
    batterySoe: Math.round(batterySoe),
    gridStatus: 'Connected',
    timestamp: now.toISOString(),
  };
}

export function generateDemoHistory(period: string): EnergyReading[] {
  const readings: EnergyReading[] = [];
  const now = new Date();
  let intervalMinutes: number;
  let totalPoints: number;

  switch (period) {
    case 'week':
      intervalMinutes = 60;
      totalPoints = 7 * 24;
      break;
    case 'month':
      intervalMinutes = 60;
      totalPoints = 30 * 24;
      break;
    case 'year':
      intervalMinutes = 24 * 60;
      totalPoints = 365;
      break;
    default: // day
      intervalMinutes = 5;
      totalPoints = 288;
  }

  for (let i = totalPoints - 1; i >= 0; i--) {
    const time = new Date(now.getTime() - i * intervalMinutes * 60 * 1000);
    const hour = time.getHours() + time.getMinutes() / 60;
    const dayOfYear = getDayOfYear(time);

    // Add seasonal variation for longer periods
    const seasonalFactor = 0.7 + 0.3 * Math.sin(((dayOfYear - 80) / 365) * 2 * Math.PI);

    const solarW = generateSolarOutput(hour) * seasonalFactor;
    const homeW = generateHomeConsumption(hour);
    const batterySoe = generateBatterySoe(hour);

    const solarExcess = solarW - homeW;
    let batteryW = 0;
    if (solarExcess > 0 && batterySoe < 95) {
      batteryW = Math.min(solarExcess * 0.7, 5000);
    } else if (solarExcess < 0 && batterySoe > 10) {
      batteryW = Math.max(solarExcess * 0.6, -5000);
    }

    const gridW = homeW - solarW + batteryW;

    readings.push({
      time: time.toISOString(),
      userId: 'demo',
      solarW: Math.round(solarW + (Math.random() - 0.5) * 100),
      batteryW: Math.round(batteryW + (Math.random() - 0.5) * 50),
      gridW: Math.round(gridW + (Math.random() - 0.5) * 100),
      homeW: Math.round(homeW + (Math.random() - 0.5) * 100),
      batterySoe: Math.round(batterySoe),
    });
  }

  return readings;
}

function generateSolarOutput(hour: number): number {
  // Solar curve: zero at night, sine peak at noon
  if (hour < 6 || hour > 20) return 0;
  const normalizedHour = (hour - 6) / 14; // 0 to 1 over daylight hours
  const output = DEMO_SOLAR_PEAK_W * Math.sin(normalizedHour * Math.PI);
  // Add some cloud variation
  const cloudFactor = 0.85 + Math.random() * 0.15;
  return Math.max(0, output * cloudFactor);
}

function generateHomeConsumption(hour: number): number {
  // Base load ~500W, peaks in morning (7-9) and evening (17-21)
  const baseLoad = 500;
  let peakFactor = 1;

  if (hour >= 7 && hour <= 9) {
    peakFactor = 1.5 + Math.sin(((hour - 7) / 2) * Math.PI) * 1.0;
  } else if (hour >= 17 && hour <= 21) {
    peakFactor = 1.8 + Math.sin(((hour - 17) / 4) * Math.PI) * 1.5;
  } else if (hour >= 0 && hour <= 5) {
    peakFactor = 0.6;
  }

  return baseLoad * peakFactor + Math.random() * 200;
}

function generateBatterySoe(hour: number): number {
  // Battery charges during day (solar hours), discharges at night
  if (hour >= 10 && hour <= 16) {
    return 60 + (hour - 10) * 6; // Charging: 60% to 96%
  } else if (hour >= 17 && hour <= 23) {
    return 96 - (hour - 17) * 10; // Discharging: 96% to 36%
  } else {
    return 36 - hour * 2; // Slow overnight discharge
  }
}

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
