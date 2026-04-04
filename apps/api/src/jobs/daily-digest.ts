import cron from 'node-cron';
import { db } from '../db/client.js';
import { generateRecommendations } from '../services/recommendations.js';
import { sendPushNotification } from '../utils/push.js';

export function startDailyDigestJob(): void {
  // Run daily at 8am
  cron.schedule('0 8 * * *', async () => {
    try {
      await sendDailyDigests();
    } catch (error) {
      console.error('Daily digest error:', error);
    }
  });

  console.log('Daily digest job scheduled (8am daily)');
}

async function sendDailyDigests(): Promise<void> {
  const users = await db.query('SELECT id FROM users');

  for (const user of users.rows) {
    try {
      // Get yesterday's summary
      const summary = await db.query(
        `SELECT
           COALESCE(SUM(solar_w) / 60000.0, 0) as solar_kwh,
           COALESCE(SUM(home_w) / 60000.0, 0) as consumed_kwh,
           COALESCE(SUM(CASE WHEN grid_w < 0 THEN ABS(grid_w) END) / 60000.0, 0) as exported_kwh
         FROM energy_readings
         WHERE user_id = $1 AND time > NOW() - INTERVAL '1 day'`,
        [user.id],
      );

      const stats = summary.rows[0];
      const solarKwh = parseFloat(stats.solar_kwh).toFixed(1);
      const consumedKwh = parseFloat(stats.consumed_kwh).toFixed(1);

      // Get top recommendation
      const recommendations = await generateRecommendations(user.id);
      const topTip = recommendations.length > 0 ? recommendations[0].title : null;

      const title = `Daily Energy Summary`;
      const body = `Yesterday: ${solarKwh} kWh solar, ${consumedKwh} kWh consumed.${topTip ? ` Tip: ${topTip}` : ''}`;

      // Send to all user push tokens
      const tokens = await db.query('SELECT token FROM push_tokens WHERE user_id = $1', [user.id]);
      for (const row of tokens.rows) {
        await sendPushNotification(row.token, title, body);
      }

      // Store notification
      await db.query(
        `INSERT INTO notifications (user_id, title, body) VALUES ($1, $2, $3)`,
        [user.id, title, body],
      );
    } catch (error) {
      console.error(`Daily digest error for user ${user.id}:`, error);
    }
  }
}
