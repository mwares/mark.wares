import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '@/theme';

interface HourlyData {
  hour: number;
  avgSolarW: number;
  avgHomeW: number;
  avgGridW: number;
  avgBatteryW: number;
}

interface Props {
  data: HourlyData[];
  metric: 'avgHomeW' | 'avgSolarW' | 'avgGridW';
}

const HOUR_LABELS = ['12a', '', '', '3a', '', '', '6a', '', '', '9a', '', '', '12p', '', '', '3p', '', '', '6p', '', '', '9p', '', ''];

function getIntensityColor(value: number, max: number, metric: string): string {
  const ratio = max > 0 ? value / max : 0;
  if (metric === 'avgSolarW') {
    const alpha = Math.max(0.05, ratio);
    return `rgba(255, 217, 61, ${alpha})`;
  }
  if (metric === 'avgGridW') {
    const alpha = Math.max(0.05, ratio);
    return `rgba(68, 138, 255, ${alpha})`;
  }
  // Home consumption
  const alpha = Math.max(0.05, ratio);
  return `rgba(255, 255, 255, ${alpha})`;
}

export function UsageHeatmap({ data, metric }: Props) {
  const maxValue = Math.max(...data.map((d) => d[metric]), 1);

  return (
    <View style={styles.container}>
      <View style={styles.heatRow}>
        {Array.from({ length: 24 }, (_, hour) => {
          const hourData = data.find((d) => d.hour === hour);
          const value = hourData ? hourData[metric] : 0;
          return (
            <View
              key={hour}
              style={[
                styles.cell,
                { backgroundColor: getIntensityColor(value, maxValue, metric) },
              ]}
            />
          );
        })}
      </View>
      <View style={styles.labels}>
        {HOUR_LABELS.map((label, i) => (
          <Text key={i} style={styles.label}>
            {label}
          </Text>
        ))}
      </View>
      <View style={styles.legend}>
        <Text style={styles.legendLabel}>Low</Text>
        <View style={styles.legendGradient}>
          {[0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 1.0].map((alpha) => (
            <View
              key={alpha}
              style={[
                styles.legendCell,
                { backgroundColor: getIntensityColor(alpha * maxValue, maxValue, metric) },
              ]}
            />
          ))}
        </View>
        <Text style={styles.legendLabel}>High</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.sm,
  },
  heatRow: {
    flexDirection: 'row',
    gap: 2,
  },
  cell: {
    flex: 1,
    height: 32,
    borderRadius: 3,
  },
  labels: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  label: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 8,
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  legendGradient: {
    flexDirection: 'row',
    gap: 2,
  },
  legendCell: {
    width: 16,
    height: 10,
    borderRadius: 2,
  },
  legendLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
});
