import cron from 'node-cron';
import { db } from '../db/client.js';
import { getDemoLiveStatus } from '../services/demo.js';
import { evaluateAlerts } from '../services/alert-engine.js';
import { POLL_INTERVAL_MS } from '@solar-monitor/shared';

export function startPollingJob(): void {
  // Poll every minute
  cron.schedule('* * * * *', async () => {
    try {
      await pollAllUsers();
    } catch (error) {
      console.error('Polling job error:', error);
    }
  });

  console.log('Energy polling job started (every 60s)');
}

async function pollAllUsers(): Promise<void> {
  const connections = await db.query(
    'SELECT tc.user_id, tc.site_id, tc.is_demo FROM tesla_connections tc',
  );

  for (const conn of connections.rows) {
    try {
      // Get live status (demo or real)
      const status = conn.is_demo
        ? getDemoLiveStatus()
        : getDemoLiveStatus(); // TODO: Replace with TeslaApiClient when OAuth is implemented

      // Store reading
      await db.query(
        `INSERT INTO energy_readings (time, user_id, solar_w, battery_w, grid_w, home_w, battery_soe)
         VALUES (NOW(), $1, $2, $3, $4, $5, $6)`,
        [conn.user_id, status.solarW, status.batteryW, status.gridW, status.homeW, status.batterySoe],
      );

      // Evaluate alerts
      await evaluateAlerts(conn.user_id, status);
    } catch (error) {
      console.error(`Polling error for user ${conn.user_id}:`, error);
    }
  }
}
