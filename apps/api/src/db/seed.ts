import bcrypt from 'bcrypt';
import { db } from './client.js';
import { generateDemoHistory } from '../services/demo.js';
import { DEMO_SITE_ID } from '@solar-monitor/shared';

async function seed() {
  console.log('Seeding database with demo data...');

  try {
    // Create demo user
    const passwordHash = await bcrypt.hash('demo1234', 12);
    const userResult = await db.query(
      `INSERT INTO users (email, password_hash)
       VALUES ('demo@solar-monitor.app', $1)
       ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
       RETURNING id`,
      [passwordHash],
    );
    const userId = userResult.rows[0].id;

    // Create demo Tesla connection
    await db.query(
      `INSERT INTO tesla_connections (user_id, site_id, access_token_enc, refresh_token_enc, token_expires_at, site_name, is_demo)
       VALUES ($1, $2, 'demo', 'demo', NOW() + INTERVAL '1 year', 'Demo Home', true)
       ON CONFLICT DO NOTHING`,
      [userId, DEMO_SITE_ID],
    );

    // Generate and insert 7 days of demo history
    const history = generateDemoHistory('week');
    for (const reading of history) {
      await db.query(
        `INSERT INTO energy_readings (time, user_id, solar_w, battery_w, grid_w, home_w, battery_soe)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [reading.time, userId, reading.solarW, reading.batteryW, reading.gridW, reading.homeW, reading.batterySoe],
      );
    }

    console.log(`Seeded ${history.length} energy readings for demo user.`);
    console.log('Demo credentials: demo@solar-monitor.app / demo1234');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await db.end();
  }
}

seed();
