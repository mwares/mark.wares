import type { FastifyPluginAsync } from 'fastify';
import { db } from '../db/client.js';

export const teslaRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('onRequest', (app as any).authenticate);

  // Get current Tesla connection status
  app.get('/connection', async (request) => {
    const userId = (request.user as any).id;
    const result = await db.query(
      `SELECT id, user_id, site_id, site_name, is_demo, created_at
       FROM tesla_connections WHERE user_id = $1 LIMIT 1`,
      [userId],
    );

    if (result.rows.length === 0) {
      return { data: null };
    }

    const conn = result.rows[0];
    return {
      data: {
        id: conn.id,
        userId: conn.user_id,
        siteId: conn.site_id,
        siteName: conn.site_name,
        isDemo: conn.is_demo,
        createdAt: conn.created_at,
      },
    };
  });

  // Get TOU tariff schedule (demo data for now)
  app.get('/tariff', async () => {
    // Demo TOU schedule based on common Australian tariff structures
    return {
      data: {
        currency: 'AUD',
        periods: [
          { name: 'Off-Peak', startHour: 22, endHour: 7, ratePerKwh: 0.15 },
          { name: 'Shoulder', startHour: 7, endHour: 14, ratePerKwh: 0.25 },
          { name: 'Peak', startHour: 14, endHour: 20, ratePerKwh: 0.45 },
          { name: 'Shoulder', startHour: 20, endHour: 22, ratePerKwh: 0.25 },
        ],
        feedInTariff: 0.05,
      },
    };
  });
};
