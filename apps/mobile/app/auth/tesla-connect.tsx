import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, fontSize, commonStyles, borderRadius } from '@/theme';

export default function TeslaConnectScreen() {
  return (
    <View style={[commonStyles.screen, styles.container]}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>T</Text>
      </View>

      <Text style={styles.title}>Connect Your Tesla</Text>
      <Text style={styles.description}>
        Link your Tesla account to see real-time data from your Powerwall and solar panels.
      </Text>

      <View style={styles.features}>
        <FeatureItem text="Real-time solar production data" />
        <FeatureItem text="Battery state of charge" />
        <FeatureItem text="Grid import/export monitoring" />
        <FeatureItem text="Historical energy data" />
      </View>

      <TouchableOpacity style={styles.connectButton}>
        <Text style={styles.connectButtonText}>Connect Tesla Account</Text>
      </TouchableOpacity>

      <Text style={styles.note}>
        This will redirect you to Tesla's login page. We only request read access to your energy data.
      </Text>
    </View>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.checkmark} />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.lg,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  icon: {
    color: colors.alert,
    fontSize: 40,
    fontWeight: '800',
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.xxl,
    fontWeight: '800',
  },
  description: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  features: {
    width: '100%',
    gap: spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkmark: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.battery,
  },
  featureText: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
  },
  connectButton: {
    backgroundColor: colors.alert,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    width: '100%',
    alignItems: 'center',
  },
  connectButtonText: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  note: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textAlign: 'center',
    lineHeight: 18,
  },
});
