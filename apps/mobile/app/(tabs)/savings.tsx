import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing, fontSize, commonStyles, borderRadius } from '@/theme';
import { TariffBar } from '@/components/TariffBar';
import { api } from '@/services/api';
import type { Recommendation, EnergySummary } from '@solar-monitor/shared';

interface TariffPeriod {
  name: string;
  startHour: number;
  endHour: number;
  ratePerKwh: number;
}

interface TariffData {
  currency: string;
  periods: TariffPeriod[];
  feedInTariff: number;
}

const PRIORITY_COLORS: Record<string, string> = {
  high: colors.solar,
  medium: colors.battery,
  low: colors.textSecondary,
};

export default function SavingsScreen() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [summary, setSummary] = useState<EnergySummary | null>(null);
  const [tariff, setTariff] = useState<TariffData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [recRes, summaryRes, tariffRes] = await Promise.all([
        api.get<{ data: Recommendation[] }>('/api/recommendations'),
        api.get<{ data: EnergySummary }>('/api/energy/summary?period=month'),
        api.get<{ data: TariffData }>('/api/tesla/tariff'),
      ]);
      setRecommendations(recRes.data);
      setSummary(summaryRes.data);
      setTariff(tariffRes.data);
    } catch {
      // Will show empty state
    } finally {
      setIsLoading(false);
    }
  }

  // Calculate estimated total savings using tariff data
  const totalSavingsKwh = recommendations.reduce(
    (sum, r) => sum + (r.estimatedSavingsKwh || 0),
    0,
  );
  const avgRate = tariff
    ? tariff.periods.reduce((sum, p) => sum + p.ratePerKwh, 0) / tariff.periods.length
    : 0.3;
  const estimatedMonthlySavings = totalSavingsKwh * avgRate * 30;

  const selfConsumptionPercent = summary
    ? Math.round(summary.selfConsumptionRatio * 100)
    : 0;

  const scoreColor =
    selfConsumptionPercent >= 70
      ? colors.battery
      : selfConsumptionPercent >= 40
        ? colors.solar
        : colors.alert;

  return (
    <ScrollView style={commonStyles.screen} contentContainerStyle={styles.container}>
      {/* Savings Overview */}
      <View style={[commonStyles.card, styles.overviewCard]}>
        <Text style={commonStyles.cardTitle}>Estimated Monthly Savings</Text>
        <View style={commonStyles.row}>
          <Text style={styles.savingsValue}>
            ${estimatedMonthlySavings.toFixed(0)}
          </Text>
          <Text style={[commonStyles.unitText, { marginLeft: spacing.sm }]}>/month</Text>
        </View>
        <Text style={styles.savingsSubtext}>
          Based on {totalSavingsKwh.toFixed(1)} kWh daily savings potential
        </Text>
      </View>

      {/* Self-Consumption Score */}
      <View style={commonStyles.card}>
        <Text style={commonStyles.cardTitle}>Self-Consumption Score</Text>
        <View style={[commonStyles.row, { gap: spacing.md }]}>
          <View style={[styles.scoreCircle, { borderColor: scoreColor }]}>
            <Text style={[styles.scoreText, { color: scoreColor }]}>
              {selfConsumptionPercent}
            </Text>
            <Text style={[styles.scoreUnit, { color: scoreColor }]}>%</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.scoreTip}>
              {selfConsumptionPercent >= 70
                ? `Great! You're using ${selfConsumptionPercent}% of your solar energy directly.`
                : selfConsumptionPercent >= 40
                  ? `You're using ${selfConsumptionPercent}% of your solar energy. Follow the tips below to improve.`
                  : `Only ${selfConsumptionPercent}% self-consumption. Shifting loads to solar hours will save significantly.`}
            </Text>
          </View>
        </View>
      </View>

      {/* TOU Tariff Display */}
      {tariff && (
        <View style={commonStyles.card}>
          <Text style={commonStyles.cardTitle}>Time-of-Use Tariff</Text>
          <TariffBar
            periods={tariff.periods}
            feedInTariff={tariff.feedInTariff}
            currency={tariff.currency}
          />
        </View>
      )}

      {/* Monthly Cost Breakdown */}
      {summary && tariff && (
        <View style={commonStyles.card}>
          <Text style={commonStyles.cardTitle}>Monthly Estimate</Text>
          <CostRow
            label="Grid import cost"
            value={`-$${(summary.totalImportedKwh * avgRate).toFixed(2)}`}
            color={colors.alert}
          />
          <CostRow
            label="Solar export credit"
            value={`+$${(summary.totalExportedKwh * tariff.feedInTariff).toFixed(2)}`}
            color={colors.battery}
          />
          <View style={styles.costDivider} />
          <CostRow
            label="Net cost"
            value={`$${(summary.totalImportedKwh * avgRate - summary.totalExportedKwh * tariff.feedInTariff).toFixed(2)}`}
            color={colors.textPrimary}
            bold
          />
        </View>
      )}

      {/* Recommendations */}
      <Text style={styles.sectionTitle}>Recommendations</Text>

      {isLoading ? (
        <View style={[commonStyles.card, commonStyles.center, { paddingVertical: spacing.xl }]}>
          <Text style={styles.emptyText}>Analyzing your usage patterns...</Text>
        </View>
      ) : recommendations.length === 0 ? (
        <View style={[commonStyles.card, commonStyles.center, { paddingVertical: spacing.xl }]}>
          <Text style={styles.emptyText}>No recommendations yet</Text>
          <Text style={styles.emptySubtext}>
            We need more usage data to provide personalized tips
          </Text>
        </View>
      ) : (
        recommendations.map((rec) => (
          <View key={rec.id} style={commonStyles.card}>
            <View style={styles.recHeader}>
              <View
                style={[
                  styles.priorityBadge,
                  { backgroundColor: PRIORITY_COLORS[rec.priority] + '22' },
                ]}
              >
                <Text
                  style={[styles.priorityText, { color: PRIORITY_COLORS[rec.priority] }]}
                >
                  {rec.priority}
                </Text>
              </View>
              <Text style={styles.categoryText}>{rec.category.replace('_', ' ')}</Text>
            </View>
            <Text style={styles.recTitle}>{rec.title}</Text>
            <Text style={styles.recDescription}>{rec.description}</Text>
            {rec.estimatedSavingsKwh && (
              <View style={styles.savingsBadge}>
                <Text style={styles.savingsBadgeText}>
                  Save ~{rec.estimatedSavingsKwh.toFixed(1)} kWh/day (~$
                  {(rec.estimatedSavingsKwh * avgRate).toFixed(2)}/day)
                </Text>
              </View>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

function CostRow({
  label,
  value,
  color,
  bold,
}: {
  label: string;
  value: string;
  color: string;
  bold?: boolean;
}) {
  return (
    <View style={styles.costRow}>
      <Text style={[styles.costLabel, bold && { color: colors.textPrimary, fontWeight: '700' }]}>
        {label}
      </Text>
      <Text style={[styles.costValue, { color }, bold && { fontSize: fontSize.xl }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  overviewCard: {
    borderColor: colors.savings,
    borderWidth: 1,
  },
  savingsValue: {
    color: colors.savings,
    fontSize: fontSize.hero,
    fontWeight: '800',
  },
  savingsSubtext: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  scoreText: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
  },
  scoreUnit: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  scoreTip: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    lineHeight: 20,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  costLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
  },
  costValue: {
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  costDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  recHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  priorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  priorityText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  categoryText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
  },
  recTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  recDescription: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    lineHeight: 22,
  },
  savingsBadge: {
    backgroundColor: colors.batteryGlow,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  savingsBadgeText: {
    color: colors.battery,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: fontSize.lg,
    textAlign: 'center',
  },
  emptySubtext: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
