import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native';
import { colors, spacing, fontSize, commonStyles, borderRadius } from '@/theme';
import { api } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import type { TeslaConnection } from '@solar-monitor/shared';

interface UserProfile {
  email: string;
  createdAt: string;
}

export default function SettingsScreen() {
  const { logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [connection, setConnection] = useState<TeslaConnection | null>(null);
  const [pollingEnabled, setPollingEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const [profileRes, connRes] = await Promise.all([
        api.get<{ data: UserProfile }>('/api/auth/profile'),
        api.get<{ data: TeslaConnection | null }>('/api/tesla/connection'),
      ]);
      setProfile(profileRes.data);
      setConnection(connRes.data);
    } catch {
      // Silently fail - show empty state
    }
  }

  function handleLogout() {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  }

  return (
    <ScrollView style={commonStyles.screen} contentContainerStyle={styles.container}>
      {/* Profile Section */}
      <Text style={styles.sectionTitle}>Account</Text>
      <View style={commonStyles.card}>
        <View style={styles.row}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile?.email?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.emailText}>{profile?.email || 'Loading...'}</Text>
            <Text style={styles.memberSince}>
              Member since{' '}
              {profile?.createdAt
                ? new Date(profile.createdAt).toLocaleDateString('en-AU', {
                    month: 'short',
                    year: 'numeric',
                  })
                : '...'}
            </Text>
          </View>
        </View>
      </View>

      {/* Tesla Connection */}
      <Text style={styles.sectionTitle}>Tesla Connection</Text>
      <View style={commonStyles.card}>
        {connection ? (
          <>
            <View style={styles.row}>
              <View style={[styles.statusDot, connection.isDemo ? styles.dotDemo : styles.dotLive]} />
              <Text style={styles.connectionLabel}>
                {connection.isDemo ? 'Demo Mode' : 'Connected'}
              </Text>
            </View>
            <View style={styles.connectionDetails}>
              <DetailRow label="Site ID" value={connection.siteId} />
              {connection.siteName && (
                <DetailRow label="Site Name" value={connection.siteName} />
              )}
              <DetailRow label="Mode" value={connection.isDemo ? 'Demo (simulated data)' : 'Live (Tesla API)'} />
            </View>
            {connection.isDemo && (
              <TouchableOpacity style={styles.connectButton}>
                <Text style={styles.connectButtonText}>Connect Tesla Account</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <View style={commonStyles.center}>
            <Text style={styles.noConnection}>No Tesla connection found</Text>
            <TouchableOpacity style={styles.connectButton}>
              <Text style={styles.connectButtonText}>Connect Tesla Account</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Preferences */}
      <Text style={styles.sectionTitle}>Preferences</Text>
      <View style={commonStyles.card}>
        <SettingRow
          label="Background Polling"
          description="Collect energy data every 60 seconds"
          value={pollingEnabled}
          onToggle={setPollingEnabled}
        />
        <View style={styles.divider} />
        <SettingRow
          label="Push Notifications"
          description="Receive alerts when thresholds are triggered"
          value={notificationsEnabled}
          onToggle={setNotificationsEnabled}
        />
      </View>

      {/* System Info */}
      <Text style={styles.sectionTitle}>About</Text>
      <View style={commonStyles.card}>
        <DetailRow label="App Version" value="0.1.0" />
        <DetailRow label="API Status" value="Connected" />
        <DetailRow label="Data Source" value={connection?.isDemo ? 'Demo Generator' : 'Tesla Fleet API'} />
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function SettingRow({
  label,
  description,
  value,
  onToggle,
}: {
  label: string;
  description: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.surfaceLight, true: colors.solarGlow }}
        thumbColor={value ? colors.solar : colors.textMuted}
      />
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string | undefined }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.solar,
  },
  avatarText: {
    color: colors.solar,
    fontSize: fontSize.xl,
    fontWeight: '800',
  },
  emailText: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  memberSince: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: borderRadius.full,
  },
  dotLive: {
    backgroundColor: colors.battery,
  },
  dotDemo: {
    backgroundColor: colors.solar,
  },
  connectionLabel: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  connectionDetails: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  noConnection: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    marginBottom: spacing.md,
  },
  connectButton: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.grid,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
    marginTop: spacing.md,
  },
  connectButtonText: {
    color: colors.grid,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  settingLabel: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  settingDescription: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  detailLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
  },
  detailValue: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
    borderWidth: 1,
    borderColor: colors.alert,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  logoutText: {
    color: colors.alert,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
});
