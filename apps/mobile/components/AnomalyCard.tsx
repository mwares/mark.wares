import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '@/theme';

interface AnomalyDay {
  date: string;
  metric: string;
  value: number;
  expectedRange: { min: number; max: number };
  description: string;
}

interface Props {
  anomaly: AnomalyDay;
}

const METRIC_COLORS: Record<string, string> = {
  solar_kwh: colors.solar,
  home_kwh: colors.home,
  import_kwh: colors.grid,
};

export function AnomalyCard({ anomaly }: Props) {
  const accentColor = METRIC_COLORS[anomaly.metric] || colors.alert;
  const isHigh = anomaly.value > anomaly.expectedRange.max;

  return (
    <View style={[styles.card, { borderLeftColor: accentColor }]}>
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: accentColor + '22' }]}>
          <Text style={[styles.badgeText, { color: accentColor }]}>
            {isHigh ? 'HIGH' : 'LOW'}
          </Text>
        </View>
        <Text style={styles.date}>
          {new Date(anomaly.date).toLocaleDateString('en-AU', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })}
        </Text>
      </View>
      <Text style={styles.description}>{anomaly.description}</Text>
      <View style={styles.rangeBar}>
        <View style={styles.expectedRange}>
          <Text style={styles.rangeLabel}>
            Expected: {anomaly.expectedRange.min.toFixed(1)}–{anomaly.expectedRange.max.toFixed(1)} kWh
          </Text>
        </View>
        <Text style={[styles.actualValue, { color: accentColor }]}>
          Actual: {anomaly.value.toFixed(1)} kWh
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  date: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  description: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    lineHeight: 20,
  },
  rangeBar: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  expectedRange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rangeLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  actualValue: {
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
});
