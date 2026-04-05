import type { FastifyPluginAsync } from 'fastify';
import { getHourlyAverages, detectAnomalies, getPeakUsageTimes } from '../services/analytics.js';

export const analyticsRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('onRequest', (app as any).authenticate);

  // Get hourly usage patterns (heatmap data)
  app.get<{ Querystring: { days?: string } }>('/hourly', async (request) => {
    const userId = (request.user as any).id;
    const days = parseInt(request.query.days || '30', 10);
    const data = await getHourlyAverages(userId, days);
    return { data };
  });

  // Get anomaly detection results
  app.get<{ Querystring: { days?: string } }>('/anomalies', async (request) => {
    const userId = (request.user as any).id;
    const days = parseInt(request.query.days || '7', 10);
    const data = await detectAnomalies(userId, days);
    return { data };
  });

  // Get peak usage times
  app.get('/peak-times', async (request) => {
    const userId = (request.user as any).id;
    const data = await getPeakUsageTimes(userId);
    return { data };
  });
};
