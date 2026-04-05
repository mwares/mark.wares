import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, fontSize, commonStyles, borderRadius } from '@/theme';
import { TimeSeriesChart } from '@/components/TimeSeriesChart';
import { UsageHeatmap } from '@/components/UsageHeatmap';
import { AnomalyCard } from '@/components/AnomalyCard';
import { useEnergyData } from '@/hooks/useEnergyData';
import { api } from '@/services/api';

type Period = 'day' | 'week' | 'month' | 'year';

interface HourlyData {
  hour: number;
  avgSolarW: number;
  avgHomeW: number;
  avgGridW: number;
  avgBatteryW: number;
}

interface AnomalyDay {
  date: string;
  metric: string;
  value: number;
  expectedRange: { min: number; max: number };
  description: string;
}

interface PeakTime {
  hour: number;
  avgW: number;
}

type HeatmapMetric = 'avgHomeW' | 'avgSolarW' | 'avgGridW';

export default function AnalyticsScreen() {
  const [period, setPeriod] = useState<Period>('day');
  const { history, summary, isLoading } = useEnergyData(period);
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyDay[]>([]);
  const [peakTimes, setPeakTimes] = useState<PeakTime[]>([]);
  const [heatmapMetric, setHeatmapMetric] = useState<HeatmapMetric>('avgHomeW');

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    try {
      const [hourlyRes, anomalyRes, peakRes] = await Promise.all([
        api.get<{ data: HourlyData[] }>('/api/analytics/hourly'),
        api.get<{ data: AnomalyDay[] }>('/api/analytics/anomalies'),
        api.get<{ data: PeakTime[] }>('/api/analytics/peak-times'),
      ]);
      setHourlyData(hourlyRes.data);
      setAnomalies(anomalyRes.data);
      setPeakTimes(peakRes.data);
    } catch {
      // Silently fail
    }
  }

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

      {/* Usage Heatmap */}
      {hourlyData.length > 0 && (
        <View style={commonStyles.card}>
          <Text style={commonStyles.cardTitle}>24-Hour Usage Pattern</Text>
          <View style={styles.heatmapSelector}>
            {([
              { key: 'avgHomeW' as HeatmapMetric, label: 'Home', color: colors.home },
              { key: 'avgSolarW' as HeatmapMetric, label: 'Solar', color: colors.solar },
              { key: 'avgGridW' as HeatmapMetric, label: 'Grid', color: colors.grid },
            ]).map(({ key, label, color }) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.heatmapChip,
                  heatmapMetric === key && { backgroundColor: color + '22', borderColor: color },
                ]}
                onPress={() => setHeatmapMetric(key)}
              >
                <View style={[styles.chipDot, { backgroundColor: color }]} />
                <Text
                  style={[
                    styles.heatmapChipText,
                    heatmapMetric === key && { color },
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <UsageHeatmap data={hourlyData} metric={heatmapMetric} />
        </View>
      )}

      {/* Peak Usage Times */}
      {peakTimes.length > 0 && (
        <View style={commonStyles.card}>
          <Text style={commonStyles.cardTitle}>Peak Consumption Hours</Text>
          {peakTimes.map((peak, i) => {
            const label = formatHour(peak.hour);
            const watts = peak.avgW;
            const maxW = peakTimes[0].avgW;
            const barWidth = maxW > 0 ? (watts / maxW) * 100 : 0;
            return (
              <View key={peak.hour} style={styles.peakRow}>
                <Text style={styles.peakRank}>#{i + 1}</Text>
                <Text style={styles.peakHour}>{label}</Text>
                <View style={styles.peakBarContainer}>
                  <View style={[styles.peakBar, { width: `${barWidth}%` }]} />
                </View>
                <Text style={styles.peakValue}>
                  {watts >= 1000 ? `${(watts / 1000).toFixed(1)} kW` : `${Math.round(watts)} W`}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Anomaly Detection */}
      {anomalies.length > 0 && (
        <>
          <View style={styles.anomalyHeader}>
            <Text style={styles.sectionTitle}>Unusual Activity</Text>
            <View style={styles.anomalyCount}>
              <Text style={styles.anomalyCountText}>{anomalies.length}</Text>
            </View>
          </View>
          {anomalies.slice(0, 5).map((anomaly, i) => (
            <AnomalyCard key={`${anomaly.date}-${anomaly.metric}-${i}`} anomaly={anomaly} />
          ))}
        </>
      )}
    </ScrollView>
  );
}

function formatHour(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
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
    paddingBottom: spacing.xxl,
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
  heatmapSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  heatmapChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: borderRadius.full,
  },
  heatmapChipText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  peakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  peakRank: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '700',
    width: 24,
  },
  peakHour: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    width: 52,
  },
  peakBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  peakBar: {
    height: '100%',
    backgroundColor: colors.alert,
    borderRadius: borderRadius.full,
  },
  peakValue: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: '600',
    width: 60,
    textAlign: 'right',
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  anomalyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  anomalyCount: {
    backgroundColor: colors.alert + '22',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  anomalyCountText: {
    color: colors.alert,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
});
