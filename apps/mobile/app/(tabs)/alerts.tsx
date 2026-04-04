import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { colors, spacing, fontSize, commonStyles, borderRadius } from '@/theme';
import { AlertCard } from '@/components/AlertCard';
import { api } from '@/services/api';
import type { AlertRule, Notification } from '@solar-monitor/shared';
import { DEFAULT_ALERT_PRESETS } from '@solar-monitor/shared';

export default function AlertsScreen() {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [rulesRes, notifRes] = await Promise.all([
        api.get<{ data: AlertRule[] }>('/api/alerts/rules'),
        api.get<{ data: Notification[] }>('/api/alerts/notifications'),
      ]);
      setRules(rulesRes.data);
      setNotifications(notifRes.data);
    } catch {
      // Will use empty state
    }
  }

  async function toggleRule(ruleId: string, enabled: boolean) {
    try {
      await api.patch(`/api/alerts/rules/${ruleId}`, { enabled });
      setRules((prev) => prev.map((r) => (r.id === ruleId ? { ...r, enabled } : r)));
    } catch {
      // Revert on error
    }
  }

  async function createFromPreset(preset: (typeof DEFAULT_ALERT_PRESETS)[number]) {
    try {
      const result = await api.post<{ data: AlertRule }>('/api/alerts/rules', preset);
      setRules((prev) => [result.data, ...prev]);
    } catch {
      // Handle error
    }
  }

  return (
    <ScrollView style={commonStyles.screen} contentContainerStyle={styles.container}>
      {/* Alert Rules */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Alert Rules</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreate(!showCreate)}
        >
          <Text style={styles.addButtonText}>{showCreate ? 'Cancel' : '+ Add'}</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Presets */}
      {showCreate && (
        <View style={commonStyles.card}>
          <Text style={commonStyles.cardTitle}>Quick Presets</Text>
          {DEFAULT_ALERT_PRESETS.map((preset, index) => (
            <TouchableOpacity
              key={index}
              style={styles.presetRow}
              onPress={() => {
                createFromPreset(preset);
                setShowCreate(false);
              }}
            >
              <Text style={styles.presetText}>{preset.label}</Text>
              <Text style={styles.presetAdd}>+ Add</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Active Rules */}
      {rules.length === 0 ? (
        <View style={[commonStyles.card, commonStyles.center, { paddingVertical: spacing.xl }]}>
          <Text style={styles.emptyText}>No alert rules configured</Text>
          <Text style={styles.emptySubtext}>
            Tap "+ Add" to create alerts for battery level, solar production, and more
          </Text>
        </View>
      ) : (
        rules.map((rule) => (
          <View key={rule.id} style={[commonStyles.card, styles.ruleCard]}>
            <View style={styles.ruleInfo}>
              <Text style={styles.ruleLabel}>{rule.label || rule.metric}</Text>
              <Text style={styles.ruleCondition}>
                {rule.metric} {rule.condition === 'gt' ? '>' : rule.condition === 'lt' ? '<' : '='}{' '}
                {rule.threshold}
                {rule.metric === 'battery_soe' ? '%' : 'W'}
              </Text>
            </View>
            <Switch
              value={rule.enabled}
              onValueChange={(val) => toggleRule(rule.id, val)}
              trackColor={{ false: colors.surfaceLight, true: colors.solarGlow }}
              thumbColor={rule.enabled ? colors.solar : colors.textMuted}
            />
          </View>
        ))
      )}

      {/* Notification History */}
      <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Recent Notifications</Text>

      {notifications.length === 0 ? (
        <View style={[commonStyles.card, commonStyles.center, { paddingVertical: spacing.lg }]}>
          <Text style={styles.emptyText}>No notifications yet</Text>
        </View>
      ) : (
        notifications.map((notif) => (
          <AlertCard key={notif.id} notification={notif} />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  addButton: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  addButtonText: {
    color: colors.solar,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  ruleCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ruleInfo: {
    flex: 1,
  },
  ruleLabel: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  ruleCondition: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  presetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  presetText: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
  },
  presetAdd: {
    color: colors.solar,
    fontSize: fontSize.md,
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
