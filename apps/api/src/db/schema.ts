import { pgTable, uuid, varchar, text, boolean, real, timestamp, primaryKey } from 'drizzle-orm/pg-core';

// ── Users ──

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ── Tesla Connections ──

export const teslaConnections = pgTable('tesla_connections', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  siteId: varchar('site_id', { length: 255 }).notNull(),
  accessTokenEnc: text('access_token_enc').notNull(),
  refreshTokenEnc: text('refresh_token_enc').notNull(),
  tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }).notNull(),
  siteName: varchar('site_name', { length: 255 }),
  isDemo: boolean('is_demo').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ── Energy Readings (TimescaleDB hypertable) ──

export const energyReadings = pgTable('energy_readings', {
  time: timestamp('time', { withTimezone: true }).notNull(),
  userId: uuid('user_id').notNull().references(() => users.id),
  solarW: real('solar_w'),
  batteryW: real('battery_w'),
  gridW: real('grid_w'),
  homeW: real('home_w'),
  batterySoe: real('battery_soe'),
});

// ── Alert Rules ──

export const alertRules = pgTable('alert_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  metric: varchar('metric', { length: 50 }).notNull(),
  condition: varchar('condition', { length: 10 }).notNull(),
  threshold: real('threshold').notNull(),
  label: varchar('label', { length: 255 }),
  enabled: boolean('enabled').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ── Notifications ──

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  alertRuleId: uuid('alert_rule_id').references(() => alertRules.id),
  title: varchar('title', { length: 255 }).notNull(),
  body: text('body').notNull(),
  sentAt: timestamp('sent_at', { withTimezone: true }).defaultNow(),
  read: boolean('read').default(false),
});

// ── Push Tokens ──

export const pushTokens = pgTable(
  'push_tokens',
  {
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    token: varchar('token', { length: 255 }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.token] })],
);
