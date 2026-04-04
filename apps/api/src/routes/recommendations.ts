import type { FastifyPluginAsync } from 'fastify';
import { generateRecommendations } from '../services/recommendations.js';

export const recommendationRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('onRequest', (app as any).authenticate);

  app.get('/', async (request) => {
    const userId = (request.user as any).id;
    const recommendations = await generateRecommendations(userId);
    return { data: recommendations };
  });
};
