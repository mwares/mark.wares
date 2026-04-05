import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '@/theme';

interface TariffPeriod {
  name: string;
  startHour: number;
  endHour: number;
  ratePerKwh: number;
}

interface Props {
  periods: TariffPeriod[];
  feedInTariff: number;
  currency: string;
}

const PERIOD_COLORS: Record<string, string> = {
  'Off-Peak': colors.battery,
  Shoulder: colors.solar,
  Peak: colors.alert,
};

function getCurrentPeriod(periods: TariffPeriod[]): string {
  const hour = new Date().getHours();
  for (const p of periods) {
    if (p.startHour < p.endHour) {
      if (hour >= p.startHour && hour < p.endHour) return p.name;
    } else {
      // Wraps midnight (e.g., 22-7)
      if (hour >= p.startHour || hour < p.endHour) return p.name;
    }
  }
  return '';
}

export function TariffBar({ periods, feedInTariff, currency }: Props) {
  const currentPeriod = getCurrentPeriod(periods);
  const totalHours = 24;

  return (
    <View style={styles.container}>
      {/* Timeline bar */}
      <View style={styles.barContainer}>
        {periods.map((period, i) => {
          const hours =
            period.endHour > period.startHour
              ? period.endHour - period.startHour
              : 24 - period.startHour + period.endHour;
          const widthPercent = (hours / totalHours) * 100;
          const color = PERIOD_COLORS[period.name] || colors.textMuted;
          const isCurrent = period.name === currentPeriod;

          return (
            <View
              key={`${period.name}-${i}`}
              style={[
                styles.barSegment,
                {
                  width: `${widthPercent}%`,
                  backgroundColor: color + (isCurrent ? '66' : '33'),
                  borderColor: isCurrent ? color : 'transparent',
                  borderWidth: isCurrent ? 2 : 0,
                },
              ]}
            />
          );
        })}
      </View>

      {/* Period labels */}
      <View style={styles.legend}>
        {periods
          .filter((p, i, arr) => arr.findIndex((a) => a.name === p.name) === i)
          .map((period) => {
            const color = PERIOD_COLORS[period.name] || colors.textMuted;
            const isCurrent = period.name === currentPeriod;
            return (
              <View key={period.name} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: color }]} />
                <Text style={[styles.legendLabel, isCurrent && { color: colors.textPrimary, fontWeight: '700' }]}>
                  {period.name}
                </Text>
                <Text style={[styles.legendRate, isCurrent && { color }]}>
                  ${period.ratePerKwh.toFixed(2)}/kWh
                </Text>
              </View>
            );
          })}
      </View>

      {/* Feed-in tariff */}
      <View style={styles.feedIn}>
        <Text style={styles.feedInLabel}>Feed-in tariff</Text>
        <Text style={styles.feedInValue}>
          ${feedInTariff.toFixed(2)}/kWh
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.sm,
  },
  barContainer: {
    flexDirection: 'row',
    height: 16,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    gap: 1,
  },
  barSegment: {
    height: '100%',
    borderRadius: 3,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.sm,
  },
  legendItem: {
    alignItems: 'center',
    gap: 2,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
  },
  legendLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  legendRate: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  feedIn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  feedInLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  feedInValue: {
    color: colors.battery,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
});
