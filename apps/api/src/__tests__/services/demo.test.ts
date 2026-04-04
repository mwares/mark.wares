import { describe, it, expect } from 'vitest';
import { getDemoLiveStatus, generateDemoHistory } from '../../services/demo.js';

describe('Demo Service', () => {
  describe('getDemoLiveStatus', () => {
    it('returns all required fields', () => {
      const status = getDemoLiveStatus();

      expect(status).toHaveProperty('solarW');
      expect(status).toHaveProperty('batteryW');
      expect(status).toHaveProperty('gridW');
      expect(status).toHaveProperty('homeW');
      expect(status).toHaveProperty('batterySoe');
      expect(status).toHaveProperty('gridStatus');
      expect(status).toHaveProperty('timestamp');
    });

    it('returns numeric values', () => {
      const status = getDemoLiveStatus();

      expect(typeof status.solarW).toBe('number');
      expect(typeof status.batteryW).toBe('number');
      expect(typeof status.gridW).toBe('number');
      expect(typeof status.homeW).toBe('number');
      expect(typeof status.batterySoe).toBe('number');
    });

    it('returns non-negative solar output', () => {
      const status = getDemoLiveStatus();
      expect(status.solarW).toBeGreaterThanOrEqual(0);
    });

    it('returns positive home consumption', () => {
      const status = getDemoLiveStatus();
      expect(status.homeW).toBeGreaterThan(0);
    });

    it('returns valid battery state of charge', () => {
      const status = getDemoLiveStatus();
      expect(status.batterySoe).toBeGreaterThanOrEqual(0);
      expect(status.batterySoe).toBeLessThanOrEqual(100);
    });

    it('returns ISO timestamp', () => {
      const status = getDemoLiveStatus();
      expect(() => new Date(status.timestamp)).not.toThrow();
      expect(new Date(status.timestamp).toISOString()).toBe(status.timestamp);
    });
  });

  describe('generateDemoHistory', () => {
    it('generates day history with ~288 points (5-min intervals)', () => {
      const history = generateDemoHistory('day');
      expect(history.length).toBe(288);
    });

    it('generates week history with 168 points (hourly)', () => {
      const history = generateDemoHistory('week');
      expect(history.length).toBe(7 * 24);
    });

    it('generates month history with 720 points (hourly)', () => {
      const history = generateDemoHistory('month');
      expect(history.length).toBe(30 * 24);
    });

    it('generates year history with 365 points (daily)', () => {
      const history = generateDemoHistory('year');
      expect(history.length).toBe(365);
    });

    it('returns readings with all required fields', () => {
      const history = generateDemoHistory('day');
      const reading = history[0];

      expect(reading).toHaveProperty('time');
      expect(reading).toHaveProperty('solarW');
      expect(reading).toHaveProperty('batteryW');
      expect(reading).toHaveProperty('gridW');
      expect(reading).toHaveProperty('homeW');
      expect(reading).toHaveProperty('batterySoe');
    });

    it('returns readings in chronological order', () => {
      const history = generateDemoHistory('day');
      for (let i = 1; i < history.length; i++) {
        expect(new Date(history[i].time).getTime()).toBeGreaterThan(
          new Date(history[i - 1].time).getTime(),
        );
      }
    });
  });
});
