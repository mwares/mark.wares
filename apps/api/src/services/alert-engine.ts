import type { LiveStatus, AlertRule } from '@solar-monitor/shared';
import { ALERT_COOLDOWN_MS } from '@solar-monitor/shared';
import { db } from '../db/client.js';
import { sendPushNotification } from '../utils/push.js';

// Track last alert time per rule to enforce cooldown
const lastAlertTimes = new Map<string, number>();

export async function evaluateAlerts(userId: string, status: LiveStatus): Promise<void> {
  const result = await db.query(
    'SELECT * FROM alert_rules WHERE user_id = $1 AND enabled = true',
    [userId],
  );

  for (const rule of result.rows as AlertRule[]) {
    const value = getMetricValue(status, rule.metric);
    if (value === null) continue;

    const triggered = evaluateCondition(value, rule.condition, rule.threshold);
    if (!triggered) continue;

    // Check cooldown
    const lastAlert = lastAlertTimes.get(rule.id);
    if (lastAlert && Date.now() - lastAlert < ALERT_COOLDOWN_MS) continue;

    // Send notification
    const title = rule.label || `${rule.metric} alert`;
    const body = formatAlertBody(rule.metric, rule.condition, rule.threshold, value);

    await db.query(
      `INSERT INTO notifications (user_id, alert_rule_id, title, body)
       VALUES ($1, $2, $3, $4)`,
      [userId, rule.id, title, body],
    );

    // Send push notification
    await sendPushNotificationToUser(userId, title, body);

    lastAlertTimes.set(rule.id, Date.now());
  }
}

function getMetricValue(status: LiveStatus, metric: string): number | null {
  switch (metric) {
    case 'solar_w':
      return status.solarW;
    case 'battery_soe':
      return status.batterySoe;
    case 'grid_w':
      return status.gridW;
    case 'home_w':
      return status.homeW;
    default:
      return null;
  }
}

function evaluateCondition(value: number, condition: string, threshold: number): boolean {
  switch (condition) {
    case 'gt':
      return value > threshold;
    case 'lt':
      return value < threshold;
    case 'eq':
      return Math.abs(value - threshold) < 1;
    default:
      return false;
  }
}

function formatAlertBody(
  metric: string,
  condition: string,
  threshold: number,
  value: number,
): string {
  const metricNames: Record<string, string> = {
    solar_w: 'Solar production',
    battery_soe: 'Battery level',
    grid_w: 'Grid power',
    home_w: 'Home consumption',
  };
  const conditionNames: Record<string, string> = {
    gt: 'above',
    lt: 'below',
    eq: 'at',
  };
  const unit = metric === 'battery_soe' ? '%' : 'W';

  return `${metricNames[metric] || metric} is ${conditionNames[condition] || condition} ${threshold}${unit} (current: ${Math.round(value)}${unit})`;
}

async function sendPushNotificationToUser(
  userId: string,
  title: string,
  body: string,
): Promise<void> {
  const result = await db.query('SELECT token FROM push_tokens WHERE user_id = $1', [userId]);
  for (const row of result.rows) {
    await sendPushNotification(row.token, title, body);
  }
}
