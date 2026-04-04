import type { Recommendation } from '@solar-monitor/shared';
import { getHourlyAverages, getPeakUsageTimes } from './analytics.js';

export async function generateRecommendations(userId: string): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];
  let hourlyData;

  try {
    hourlyData = await getHourlyAverages(userId, 30);
  } catch {
    // Return static recommendations if no data available
    return getDefaultRecommendations();
  }

  if (hourlyData.length === 0) {
    return getDefaultRecommendations();
  }

  // 1. Find peak solar window
  const peakSolarHours = hourlyData
    .filter((h) => h.avgSolarW > 0)
    .sort((a, b) => b.avgSolarW - a.avgSolarW);

  if (peakSolarHours.length > 0) {
    const peakStart = Math.min(...peakSolarHours.slice(0, 4).map((h) => h.hour));
    const peakEnd = Math.max(...peakSolarHours.slice(0, 4).map((h) => h.hour));

    recommendations.push({
      id: 'peak-solar-usage',
      category: 'load_shift',
      title: `Run heavy appliances between ${formatHour(peakStart)}-${formatHour(peakEnd)}`,
      description: `Your solar production peaks between ${formatHour(peakStart)} and ${formatHour(peakEnd)}. Running dishwashers, washing machines, and other heavy loads during this window uses free solar energy instead of grid power.`,
      estimatedSavingsKwh: estimateSavingsFromShift(hourlyData),
      priority: 'high',
    });
  }

  // 2. Grid import analysis
  const gridImportHours = hourlyData
    .filter((h) => h.avgGridW > 500)
    .sort((a, b) => b.avgGridW - a.avgGridW);

  if (gridImportHours.length > 0) {
    const peakImportHour = gridImportHours[0].hour;
    recommendations.push({
      id: 'reduce-peak-import',
      category: 'load_shift',
      title: `Reduce usage around ${formatHour(peakImportHour)}`,
      description: `Your grid imports peak at ${formatHour(peakImportHour)} averaging ${Math.round(gridImportHours[0].avgGridW)}W. Consider pre-cooling your house or pre-heating water during solar hours.`,
      estimatedSavingsKwh: (gridImportHours[0].avgGridW * 0.3) / 1000,
      priority: 'high',
    });
  }

  // 3. Self-consumption analysis
  const totalSolar = hourlyData.reduce((sum, h) => sum + h.avgSolarW, 0);
  const totalExported = hourlyData.reduce((sum, h) => sum + Math.max(0, -h.avgGridW), 0);
  const selfConsumption = totalSolar > 0 ? (totalSolar - totalExported) / totalSolar : 0;

  if (selfConsumption < 0.7) {
    recommendations.push({
      id: 'improve-self-consumption',
      category: 'general',
      title: 'Increase self-consumption ratio',
      description: `Only ${Math.round(selfConsumption * 100)}% of your solar energy is used directly. Shift more consumption to daylight hours or check your battery scheduling to capture more solar energy.`,
      estimatedSavingsKwh: (totalExported * 0.3) / 1000,
      priority: 'medium',
    });
  }

  // 4. Battery utilization
  const nightHours = hourlyData.filter((h) => h.hour >= 22 || h.hour <= 5);
  const avgNightBattery = nightHours.length > 0
    ? nightHours.reduce((sum, h) => sum + Math.abs(h.avgBatteryW), 0) / nightHours.length
    : 0;

  if (avgNightBattery < 500) {
    recommendations.push({
      id: 'battery-night-discharge',
      category: 'battery_optimization',
      title: 'Use battery more overnight',
      description:
        'Your battery is barely discharging overnight. Consider lowering the backup reserve percentage to use more stored solar energy during peak evening rates.',
      estimatedSavingsKwh: 3,
      priority: 'medium',
    });
  }

  // 5. Evening pre-charge
  const eveningHours = hourlyData.filter((h) => h.hour >= 17 && h.hour <= 21);
  const avgEveningGrid = eveningHours.reduce((sum, h) => sum + Math.max(0, h.avgGridW), 0) / (eveningHours.length || 1);

  if (avgEveningGrid > 1000) {
    recommendations.push({
      id: 'evening-preparation',
      category: 'tou_optimization',
      title: 'Pre-charge battery before evening peak',
      description: `You import an average of ${Math.round(avgEveningGrid)}W from the grid during evening hours (5-9pm). Ensure your battery is fully charged by 5pm to avoid expensive peak rates.`,
      estimatedSavingsKwh: (avgEveningGrid * 4) / 1000,
      priority: 'high',
    });
  }

  return recommendations.length > 0 ? recommendations : getDefaultRecommendations();
}

function getDefaultRecommendations(): Recommendation[] {
  return [
    {
      id: 'default-solar-timing',
      category: 'load_shift',
      title: 'Run heavy appliances during peak solar hours (10am-2pm)',
      description:
        'Schedule dishwashers, washing machines, and pool pumps during peak solar production to maximize self-consumption.',
      estimatedSavingsKwh: 5,
      priority: 'high',
    },
    {
      id: 'default-battery-reserve',
      category: 'battery_optimization',
      title: 'Set battery backup reserve to 20%',
      description:
        'A 20% reserve gives you emergency backup while allowing 80% of your battery to offset grid usage.',
      estimatedSavingsKwh: 3,
      priority: 'medium',
    },
    {
      id: 'default-monitor',
      category: 'general',
      title: 'Monitor for 2 weeks to build your usage profile',
      description:
        'We need at least 2 weeks of data to provide personalized recommendations based on your actual usage patterns.',
      estimatedSavingsKwh: null,
      priority: 'low',
    },
  ];
}

function formatHour(hour: number): string {
  const period = hour >= 12 ? 'pm' : 'am';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}${period}`;
}

function estimateSavingsFromShift(hourlyData: { avgSolarW: number; avgGridW: number }[]): number {
  // Estimate kWh saved by shifting 30% of grid imports to solar hours
  const totalGridImport = hourlyData.reduce((sum, h) => sum + Math.max(0, h.avgGridW), 0);
  return (totalGridImport * 0.3) / 1000;
}
