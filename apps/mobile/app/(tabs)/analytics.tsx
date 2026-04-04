import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, fontSize, commonStyles, borderRadius } from '@/theme';
import { TimeSeriesChart } from '@/components/TimeSeriesChart';
import { useEnergyData } from '@/hooks/useEnergyData';

type Period = 'day' | 'week' | 'month' | 'year';

export default function AnalyticsScreen() {
  const [period, setPeriod] = useState<Period>('day');
  const { history, summary, isLoading } = useEnergyData(period);

  return (
    <ScrollView style={commonStyles.screen} contentContainerStyle={styles.container}>
      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {(['day', 'week', 'month', 'year'] as Period[]).map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.periodButton, period === p && styles.periodButtonActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Chart */}
      {history && history.length > 0 ? (
        <View style={commonStyles.card}>
          <Text style={commonStyles.cardTitle}>Energy Over Time</Text>
          <TimeSeriesChart data={history} period={period} />
        </View>
      ) : (
        <View style={[commonStyles.card, commonStyles.center, { height: 200 }]}>
          <Text style={styles.emptyText}>
            {isLoading ? 'Loading...' : 'No data available for this period'}
          </Text>
        </View>
      )}

      {/* Stats Cards */}
      {summary && (
        <View style={styles.statsGrid}>
          <StatCard
            label="Solar Produced"
            value={`${summary.totalSolarKwh.toFixed(1)}`}
            unit="kWh"
            color={colors.solar}
          />
          <StatCard
            label="Consumed"
            value={`${summary.totalConsumedKwh.toFixed(1)}`}
            unit="kWh"
            color={colors.home}
          />
          <StatCard
            label="Exported"
            value={`${summary.totalExportedKwh.toFixed(1)}`}
            unit="kWh"
            color={colors.grid}
          />
          <StatCard
            label="Imported"
            value={`${summary.totalImportedKwh.toFixed(1)}`}
            unit="kWh"
            color={colors.alert}
          />
        </View>
      )}

      {/* Self-Consumption Ratio */}
      {summary && (
        <View style={commonStyles.card}>
          <Text style={commonStyles.cardTitle}>Self-Consumption</Text>
          <View style={commonStyles.row}>
            <Text style={[commonStyles.valueText, { color: colors.battery }]}>
              {Math.round(summary.selfConsumptionRatio * 100)}%
            </Text>
            <Text style={[commonStyles.unitText, { marginLeft: spacing.sm }]}>
              of solar energy used directly
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(100, summary.selfConsumptionRatio * 100)}%` },
              ]}
            />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

function StatCard({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: string;
  unit: string;
  color: string;
}) {
  return (
    <View style={[commonStyles.card, styles.statCard]}>
      <View style={[styles.statDot, { backgroundColor: color }]} />
      <Text style={commonStyles.cardTitle}>{label}</Text>
      <View style={commonStyles.row}>
        <Text style={commonStyles.valueText}>{value}</Text>
        <Text style={[commonStyles.unitText, { marginLeft: spacing.xs }]}>{unit}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    gap: spacing.md,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.xs,
  },
  periodButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  periodButtonActive: {
    backgroundColor: colors.surfaceLight,
  },
  periodText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  periodTextActive: {
    color: colors.solar,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    width: '48%',
    flexGrow: 1,
  },
  statDot: {
    width: 6,
    height: 6,
    borderRadius: borderRadius.full,
    marginBottom: spacing.xs,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.battery,
    borderRadius: borderRadius.full,
  },
});
