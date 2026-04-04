import type { LiveStatus } from '@solar-monitor/shared';

const TESLA_API_BASE = 'https://fleet-api.prd.na.vn.cloud.tesla.com';

interface TeslaTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export class TeslaApiClient {
  private tokens: TeslaTokens;
  private siteId: string;

  constructor(siteId: string, tokens: TeslaTokens) {
    this.siteId = siteId;
    this.tokens = tokens;
  }

  async getLiveStatus(): Promise<LiveStatus> {
    const data = await this.request(`/api/1/energy_sites/${this.siteId}/live_status`);
    return {
      solarW: data.solar_power || 0,
      batteryW: data.battery_power || 0,
      gridW: data.grid_power || 0,
      homeW: data.load_power || 0,
      batterySoe: data.percentage_charged || 0,
      gridStatus: data.grid_status || 'Unknown',
      timestamp: data.timestamp || new Date().toISOString(),
    };
  }

  async getSiteInfo(): Promise<Record<string, unknown>> {
    return this.request(`/api/1/energy_sites/${this.siteId}/site_info`);
  }

  async getHistory(kind: 'power' | 'energy', period: string): Promise<Record<string, unknown>> {
    return this.request(
      `/api/1/energy_sites/${this.siteId}/history?kind=${kind}&period=${period}`,
    );
  }

  async getCalendarHistory(
    kind: 'power' | 'energy',
    endDate: string,
    period: string,
  ): Promise<Record<string, unknown>> {
    return this.request(
      `/api/1/energy_sites/${this.siteId}/calendar_history?kind=${kind}&end_date=${endDate}&period=${period}`,
    );
  }

  async getTariffRate(): Promise<Record<string, unknown>> {
    return this.request(`/api/1/energy_sites/${this.siteId}/tariff_rate`);
  }

  private async request(path: string): Promise<any> {
    if (this.isTokenExpired()) {
      await this.refreshAccessToken();
    }

    const response = await fetch(`${TESLA_API_BASE}${path}`, {
      headers: {
        Authorization: `Bearer ${this.tokens.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Tesla API error: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();
    return json.response;
  }

  private isTokenExpired(): boolean {
    return new Date() >= this.tokens.expiresAt;
  }

  private async refreshAccessToken(): Promise<void> {
    const response = await fetch('https://auth.tesla.com/oauth2/v3/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        client_id: process.env.TESLA_CLIENT_ID,
        refresh_token: this.tokens.refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh Tesla token');
    }

    const data = await response.json();
    this.tokens.accessToken = data.access_token;
    this.tokens.refreshToken = data.refresh_token;
    this.tokens.expiresAt = new Date(Date.now() + data.expires_in * 1000);
  }
}

// OAuth helpers for initial connection
export function getTeslaAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.TESLA_CLIENT_ID || '',
    redirect_uri: redirectUri,
    scope: 'energy_device_data',
    state,
  });
  return `https://auth.tesla.com/oauth2/v3/authorize?${params}`;
}

export async function exchangeTeslaCode(
  code: string,
  redirectUri: string,
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  const response = await fetch('https://auth.tesla.com/oauth2/v3/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: process.env.TESLA_CLIENT_ID,
      client_secret: process.env.TESLA_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to exchange Tesla auth code');
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}
