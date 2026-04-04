// ── Energy Data ──

export interface EnergyReading {
  time: string;
  userId: string;
  solarW: number;
  batteryW: number;
  gridW: number;
  homeW: number;
  batterySoe: number;
}

export interface LiveStatus {
  solarW: number;
  batteryW: number;
  gridW: number;
  homeW: number;
  batterySoe: number;
  gridStatus: string;
  timestamp: string;
}

export interface EnergyHistory {
  period: 'day' | 'week' | 'month' | 'year';
  timeSeries: EnergyReading[];
}

export interface EnergySummary {
  totalSolarKwh: number;
  totalConsumedKwh: number;
  totalExportedKwh: number;
  totalImportedKwh: number;
  selfConsumptionRatio: number;
  peakSolarHour: number;
  peakConsumptionHour: number;
}

// ── Users & Auth ──

export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface TeslaConnection {
  id: string;
  userId: string;
  siteId: string;
  siteName: string | null;
  isDemo: boolean;
  createdAt: string;
}

// ── Alerts ──

export type AlertMetric = 'solar_w' | 'battery_soe' | 'grid_w' | 'home_w';
export type AlertCondition = 'gt' | 'lt' | 'eq';

export interface AlertRule {
  id: string;
  userId: string;
  metric: AlertMetric;
  condition: AlertCondition;
  threshold: number;
  label: string | null;
  enabled: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  alertRuleId: string | null;
  title: string;
  body: string;
  sentAt: string;
  read: boolean;
}

// ── Recommendations ──

export interface Recommendation {
  id: string;
  category: 'load_shift' | 'battery_optimization' | 'tou_optimization' | 'general';
  title: string;
  description: string;
  estimatedSavingsKwh: number | null;
  priority: 'high' | 'medium' | 'low';
}

// ── API Responses ──

export interface ApiResponse<T> {
  data: T;
  error?: never;
}

export interface ApiError {
  data?: never;
  error: {
    code: string;
    message: string;
  };
}

export type ApiResult<T> = ApiResponse<T> | ApiError;
