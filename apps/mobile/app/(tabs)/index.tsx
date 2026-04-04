import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing, fontSize, commonStyles, borderRadius } from '@/theme';
import { EnergyFlow } from '@/components/EnergyFlow';
import { PowerGauge } from '@/components/PowerGauge';
import { BatteryIndicator } from '@/components/BatteryIndicator';
import { useEnergyData } from '@/hooks/useEnergyData';
import { wattsToKw } from '@solar-monitor/shared';

export default function DashboardScreen() {
  const { liveStatus, isLoading } = useEnergyData();

  if (isLoading || !liveStatus) {
    return (
      <View style={[commonStyles.screen, commonStyles.center]}>
        <Text style={styles.loadingText}>Loading energy data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={commonStyles.screen} contentContainerStyle={styles.container}>
      {/* Energy Flow Diagram */}
      <EnergyFlow
        solarW={liveStatus.solarW}
        batteryW={liveStatus.batteryW}
        gridW={liveStatus.gridW}
        homeW={liveStatus.homeW}
      />

      {/* Power Cards */}
      <View style={styles.cardGrid}>
        <PowerGauge
          label="Solar"
          value={liveStatus.solarW}
          unit="W"
          color={colors.solar}
          glowColor={colors.solarGlow}
        />
        <PowerGauge
          label="Battery"
          value={liveStatus.batteryW}
          unit="W"
          color={colors.battery}
          glowColor={colors.batteryGlow}
        />
        <PowerGauge
          label="Grid"
          value={liveStatus.gridW}
          unit="W"
          color={colors.grid}
          glowColor={colors.gridGlow}
        />
        <PowerGauge
          label="Home"
          value={liveStatus.homeW}
          unit="W"
          color={colors.home}
        />
      </View>

      {/* Battery State */}
      <View style={commonStyles.card}>
        <Text style={commonStyles.cardTitle}>Battery</Text>
        <BatteryIndicator soe={liveStatus.batterySoe} />
        <Text style={styles.batteryText}>
          {liveStatus.batterySoe}% charged
          {liveStatus.batteryW > 0
            ? ` • Charging at ${wattsToKw(liveStatus.batteryW).toFixed(1)} kW`
            : liveStatus.batteryW < 0
              ? ` • Discharging at ${wattsToKw(Math.abs(liveStatus.batteryW)).toFixed(1)} kW`
              : ' • Idle'}
        </Text>
      </View>

      {/* Status */}
      <View style={styles.statusBar}>
        <View style={[styles.statusDot, { backgroundColor: colors.battery }]} />
        <Text style={styles.statusText}>
          Grid: {liveStatus.gridStatus} • Updated {new Date(liveStatus.timestamp).toLocaleTimeString()}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    gap: spacing.md,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: fontSize.lg,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  batteryText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    marginTop: spacing.sm,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
  },
  statusText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
});
