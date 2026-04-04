import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fontSize, commonStyles, borderRadius } from '@/theme';
import type { Notification } from '@solar-monitor/shared';

interface AlertCardProps {
  notification: Notification;
}

export function AlertCard({ notification }: AlertCardProps) {
  const timeAgo = getTimeAgo(new Date(notification.sentAt));

  return (
    <View style={[styles.container, !notification.read && styles.unread]}>
      <View style={styles.dot} />
      <View style={styles.content}>
        <Text style={styles.title}>{notification.title}</Text>
        <Text style={styles.body}>{notification.body}</Text>
        <Text style={styles.time}>{timeAgo}</Text>
      </View>
    </View>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  unread: {
    borderLeftWidth: 3,
    borderLeftColor: colors.solar,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.alert,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  body: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: 2,
    lineHeight: 18,
  },
  time: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
});
