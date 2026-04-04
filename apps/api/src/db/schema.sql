-- Solar Monitor Database Schema
-- Requires PostgreSQL with TimescaleDB extension

CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tesla API credentials (encrypted)
CREATE TABLE IF NOT EXISTS tesla_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  site_id VARCHAR(255) NOT NULL,
  access_token_enc TEXT NOT NULL,
  refresh_token_enc TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  site_name VARCHAR(255),
  is_demo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Time-series energy readings (hypertable)
CREATE TABLE IF NOT EXISTS energy_readings (
  time TIMESTAMPTZ NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  solar_w REAL,
  battery_w REAL,
  grid_w REAL,
  home_w REAL,
  battery_soe REAL
);

SELECT create_hypertable('energy_readings', 'time', if_not_exists => TRUE);

CREATE INDEX IF NOT EXISTS idx_readings_user ON energy_readings (user_id, time DESC);

-- Alert rules
CREATE TABLE IF NOT EXISTS alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  metric VARCHAR(50) NOT NULL,
  condition VARCHAR(10) NOT NULL,
  threshold REAL NOT NULL,
  label VARCHAR(255),
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification history
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  alert_rule_id UUID REFERENCES alert_rules(id),
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE
);

-- Expo push tokens
CREATE TABLE IF NOT EXISTS push_tokens (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL,
  PRIMARY KEY (user_id, token)
);
