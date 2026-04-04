import type { FastifyPluginAsync } from 'fastify';
import { db } from '../db/client.js';
import { getDemoLiveStatus, generateDemoHistory } from '../services/demo.js';

export const energyRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('onRequest', (app as any).authenticate);

  // Get real-time energy status
  app.get('/live', async (request) => {
    const userId = (request.user as any).id;

    // Check if user has a Tesla connection or is in demo mode
    const conn = await db.query(
      'SELECT site_id, is_demo FROM tesla_connections WHERE user_id = $1 LIMIT 1',
      [userId],
    );

    if (conn.rows.length === 0 || conn.rows[0].is_demo) {
      return { data: getDemoLiveStatus() };
    }

    // Real Tesla API integration will go here
    // For now, return latest reading from DB
    const reading = await db.query(
      'SELECT * FROM energy_readings WHERE user_id = $1 ORDER BY time DESC LIMIT 1',
      [userId],
    );

    if (reading.rows.length === 0) {
      return { data: getDemoLiveStatus() };
    }

    const r = reading.rows[0];
    return {
      data: {
        solarW: r.solar_w,
        batteryW: r.battery_w,
        gridW: r.grid_w,
        homeW: r.home_w,
        batterySoe: r.battery_soe,
        gridStatus: 'Connected',
        timestamp: r.time,
      },
    };
  });

  // Get historical energy data
  app.get<{ Querystring: { period: string } }>('/history', async (request) => {
    const userId = (request.user as any).id;
    const period = request.query.period || 'day';

    // Check demo mode
    const conn = await db.query(
      'SELECT site_id, is_demo FROM tesla_connections WHERE user_id = $1 LIMIT 1',
      [userId],
    );

    if (conn.rows.length === 0 || conn.rows[0].is_demo) {
      return { data: { period, timeSeries: generateDemoHistory(period) } };
    }

    // Query real data from DB
    let interval: string;
    switch (period) {
      case 'week':
        interval = '7 days';
        break;
      case 'month':
        interval = '30 days';
        break;
      case 'year':
        interval = '365 days';
        break;
      default:
        interval = '1 day';
    }

    const readings = await db.query(
      `SELECT time, solar_w, battery_w, grid_w, home_w, battery_soe
       FROM energy_readings
       WHERE user_id = $1 AND time > NOW() - $2::interval
       ORDER BY time ASC`,
      [userId, interval],
    );

    return {
      data: {
        period,
        timeSeries: readings.rows.map((r) => ({
          time: r.time,
          solarW: r.solar_w,
          batteryW: r.battery_w,
          gridW: r.grid_w,
          homeW: r.home_w,
          batterySoe: r.battery_soe,
        })),
      },
    };
  });

  // Get energy summary/stats
  app.get<{ Querystring: { period: string } }>('/summary', async (request) => {
    const userId = (request.user as any).id;
    const period = request.query.period || 'day';

    let interval: string;
    switch (period) {
      case 'week':
        interval = '7 days';
        break;
      case 'month':
        interval = '30 days';
        break;
      case 'year':
        interval = '365 days';
        break;
      default:
        interval = '1 day';
    }

    const result = await db.query(
      `SELECT
         COALESCE(SUM(CASE WHEN solar_w > 0 THEN solar_w END) / 60000.0, 0) as total_solar_kwh,
         COALESCE(SUM(home_w) / 60000.0, 0) as total_consumed_kwh,
         COALESCE(SUM(CASE WHEN grid_w < 0 THEN ABS(grid_w) END) / 60000.0, 0) as total_exported_kwh,
         COALESCE(SUM(CASE WHEN grid_w > 0 THEN grid_w END) / 60000.0, 0) as total_imported_kwh
       FROM energy_readings
       WHERE user_id = $1 AND time > NOW() - $2::interval`,
      [userId, interval],
    );

    const stats = result.rows[0];
    const totalSolarKwh = parseFloat(stats.total_solar_kwh);
    const totalConsumedKwh = parseFloat(stats.total_consumed_kwh);
    const totalExportedKwh = parseFloat(stats.total_exported_kwh);
    const selfConsumed = totalSolarKwh - totalExportedKwh;

    return {
      data: {
        totalSolarKwh,
        totalConsumedKwh,
        totalExportedKwh,
        totalImportedKwh: parseFloat(stats.total_imported_kwh),
        selfConsumptionRatio: totalSolarKwh > 0 ? selfConsumed / totalSolarKwh : 0,
      },
    };
  });
};
