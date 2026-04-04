import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '@/theme';
import type { EnergyReading } from '@solar-monitor/shared';
import { wattsToKw } from '@solar-monitor/shared';

interface TimeSeriesChartProps {
  data: EnergyReading[];
  period: string;
}

export function TimeSeriesChart({ data, period }: TimeSeriesChartProps) {
  if (data.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No data available</Text>
      </View>
    );
  }

  // Simple bar chart representation
  // For a production app, use victory-native for proper charts
  const maxVal = Math.max(...data.map((d) => Math.max(d.solarW, d.homeW)));
  const step = Math.max(1, Math.floor(data.length / 24));
  const sampled = data.filter((_, i) => i % step === 0).slice(0, 24);

  return (
    <View style={styles.container}>
      <View style={styles.chartArea}>
        {sampled.map((reading, index) => {
          const solarHeight = maxVal > 0 ? (reading.solarW / maxVal) * 120 : 0;
          const homeHeight = maxVal > 0 ? (reading.homeW / maxVal) * 120 : 0;

          return (
            <View key={index} style={styles.barGroup}>
              <View style={styles.bars}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max(1, solarHeight),
                      backgroundColor: colors.solar,
                      opacity: 0.8,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max(1, homeHeight),
                      backgroundColor: colors.home,
                      opacity: 0.4,
                    },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.solar }]} />
          <Text style={styles.legendText}>Solar</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.home, opacity: 0.5 }]} />
          <Text style={styles.legendText}>Consumption</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.sm,
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 140,
    gap: 2,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  barGroup: {
    flex: 1,
    alignItems: 'center',
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 1,
  },
  bar: {
    width: 4,
    borderRadius: 2,
    minHeight: 1,
  },
  legend: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  empty: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
  },
});
