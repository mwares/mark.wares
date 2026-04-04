import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing, fontSize, commonStyles, borderRadius } from '@/theme';
import { api } from '@/services/api';
import type { Recommendation } from '@solar-monitor/shared';

const CATEGORY_ICONS: Record<string, string> = {
  load_shift: 'clock',
  battery_optimization: 'battery',
  tou_optimization: 'dollar',
  general: 'lightbulb',
};

const PRIORITY_COLORS: Record<string, string> = {
  high: colors.solar,
  medium: colors.battery,
  low: colors.textSecondary,
};

export default function SavingsScreen() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, []);

  async function loadRecommendations() {
    try {
      const result = await api.get<{ data: Recommendation[] }>('/api/recommendations');
      setRecommendations(result.data);
    } catch {
      // Will show empty state
    } finally {
      setIsLoading(false);
    }
  }

  // Calculate estimated total savings
  const totalSavingsKwh = recommendations.reduce(
    (sum, r) => sum + (r.estimatedSavingsKwh || 0),
    0,
  );
  const estimatedMonthlySavings = totalSavingsKwh * 0.3 * 30; // $0.30/kWh * 30 days

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
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreText}>72</Text>
            <Text style={styles.scoreUnit}>%</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.scoreTip}>
              Good! You're using 72% of your solar energy directly. Follow the tips below to improve further.
            </Text>
          </View>
        </View>
      </View>

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
                  Save ~{rec.estimatedSavingsKwh.toFixed(1)} kWh/day
                </Text>
              </View>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    gap: spacing.md,
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
    borderColor: colors.battery,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  scoreText: {
    color: colors.battery,
    fontSize: fontSize.xxl,
    fontWeight: '800',
  },
  scoreUnit: {
    color: colors.battery,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  scoreTip: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    lineHeight: 20,
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
