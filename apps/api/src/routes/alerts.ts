import type { FastifyPluginAsync } from 'fastify';
import { db } from '../db/client.js';

export const alertRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('onRequest', (app as any).authenticate);

  // List alert rules
  app.get('/rules', async (request) => {
    const userId = (request.user as any).id;
    const result = await db.query(
      'SELECT * FROM alert_rules WHERE user_id = $1 ORDER BY created_at DESC',
      [userId],
    );
    return { data: result.rows };
  });

  // Create alert rule
  app.post<{
    Body: { metric: string; condition: string; threshold: number; label?: string };
  }>('/rules', async (request, reply) => {
    const userId = (request.user as any).id;
    const { metric, condition, threshold, label } = request.body;

    const validMetrics = ['solar_w', 'battery_soe', 'grid_w', 'home_w'];
    const validConditions = ['gt', 'lt', 'eq'];

    if (!validMetrics.includes(metric) || !validConditions.includes(condition)) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid metric or condition' },
      });
    }

    const result = await db.query(
      `INSERT INTO alert_rules (user_id, metric, condition, threshold, label)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, metric, condition, threshold, label || null],
    );

    return reply.status(201).send({ data: result.rows[0] });
  });

  // Update alert rule
  app.patch<{
    Params: { id: string };
    Body: { enabled?: boolean; threshold?: number; label?: string };
  }>('/rules/:id', async (request, reply) => {
    const userId = (request.user as any).id;
    const { id } = request.params;
    const { enabled, threshold, label } = request.body;

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (enabled !== undefined) {
      updates.push(`enabled = $${paramIndex++}`);
      values.push(enabled);
    }
    if (threshold !== undefined) {
      updates.push(`threshold = $${paramIndex++}`);
      values.push(threshold);
    }
    if (label !== undefined) {
      updates.push(`label = $${paramIndex++}`);
      values.push(label);
    }

    if (updates.length === 0) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: 'No fields to update' },
      });
    }

    values.push(id, userId);
    const result = await db.query(
      `UPDATE alert_rules SET ${updates.join(', ')}
       WHERE id = $${paramIndex++} AND user_id = $${paramIndex}
       RETURNING *`,
      values,
    );

    if (result.rows.length === 0) {
      return reply.status(404).send({
        error: { code: 'NOT_FOUND', message: 'Alert rule not found' },
      });
    }

    return { data: result.rows[0] };
  });

  // Delete alert rule
  app.delete<{ Params: { id: string } }>('/rules/:id', async (request, reply) => {
    const userId = (request.user as any).id;
    const { id } = request.params;

    const result = await db.query(
      'DELETE FROM alert_rules WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId],
    );

    if (result.rows.length === 0) {
      return reply.status(404).send({
        error: { code: 'NOT_FOUND', message: 'Alert rule not found' },
      });
    }

    return { data: { deleted: true } };
  });

  // List notifications
  app.get('/notifications', async (request) => {
    const userId = (request.user as any).id;
    const result = await db.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY sent_at DESC LIMIT 50',
      [userId],
    );
    return { data: result.rows };
  });

  // Mark notification as read
  app.patch<{ Params: { id: string } }>('/notifications/:id/read', async (request, reply) => {
    const userId = (request.user as any).id;
    const { id } = request.params;

    const result = await db.query(
      'UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId],
    );

    if (result.rows.length === 0) {
      return reply.status(404).send({
        error: { code: 'NOT_FOUND', message: 'Notification not found' },
      });
    }

    return { data: result.rows[0] };
  });
};
