import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fontSize, commonStyles, borderRadius } from '@/theme';
import { wattsToKw } from '@solar-monitor/shared';

interface PowerGaugeProps {
  label: string;
  value: number;
  unit: string;
  color: string;
  glowColor?: string;
}

export function PowerGauge({ label, value, color, glowColor }: PowerGaugeProps) {
  const displayValue = Math.abs(value);
  const isKw = displayValue >= 1000;
  const formatted = isKw ? wattsToKw(displayValue).toFixed(1) : Math.round(displayValue).toString();
  const unit = isKw ? 'kW' : 'W';

  return (
    <View
      style={[
        styles.container,
        glowColor && { shadowColor: color, shadowOpacity: 0.3, shadowRadius: 8 },
      ]}
    >
      <View style={[styles.indicator, { backgroundColor: color }]} />
      <Text style={styles.label}>{label}</Text>
      <View style={commonStyles.row}>
        <Text style={[styles.value, { color }]}>{formatted}</Text>
        <Text style={styles.unit}>{unit}</Text>
      </View>
      {value < 0 && <Text style={styles.direction}>exporting</Text>}
      {value > 0 && label === 'Grid' && <Text style={styles.direction}>importing</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    width: '48%',
    flexGrow: 1,
  },
  indicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginBottom: spacing.sm,
  },
  label: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  value: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
  },
  unit: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginLeft: spacing.xs,
    marginTop: 6,
  },
  direction: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
});
