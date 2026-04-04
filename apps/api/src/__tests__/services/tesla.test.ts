import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TeslaApiClient, getTeslaAuthUrl, exchangeTeslaCode } from '../../services/tesla.js';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('Tesla API Client', () => {
  let client: TeslaApiClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new TeslaApiClient('site-123', {
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
      expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
    });
  });

  describe('getLiveStatus', () => {
    it('returns mapped live status from Tesla API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: {
            solar_power: 5200,
            battery_power: -1500,
            grid_power: 300,
            load_power: 4000,
            percentage_charged: 82,
            grid_status: 'Active',
            timestamp: '2026-04-04T12:00:00Z',
          },
        }),
      });

      const status = await client.getLiveStatus();

      expect(status.solarW).toBe(5200);
      expect(status.batteryW).toBe(-1500);
      expect(status.gridW).toBe(300);
      expect(status.homeW).toBe(4000);
      expect(status.batterySoe).toBe(82);
      expect(status.gridStatus).toBe('Active');
    });

    it('handles missing fields with defaults', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: {} }),
      });

      const status = await client.getLiveStatus();

      expect(status.solarW).toBe(0);
      expect(status.batteryW).toBe(0);
      expect(status.gridW).toBe(0);
      expect(status.homeW).toBe(0);
      expect(status.batterySoe).toBe(0);
    });

    it('sends authorization header', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: {} }),
      });

      await client.getLiveStatus();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/1/energy_sites/site-123/live_status'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-access-token',
          }),
        }),
      );
    });

    it('throws on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(client.getLiveStatus()).rejects.toThrow('Tesla API error: 500');
    });
  });

  describe('token refresh', () => {
    it('refreshes token when expired', async () => {
      // Create client with expired token
      const expiredClient = new TeslaApiClient('site-123', {
        accessToken: 'expired-token',
        refreshToken: 'test-refresh-token',
        expiresAt: new Date(Date.now() - 1000), // Already expired
      });

      // First call: token refresh
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          expires_in: 3600,
        }),
      });

      // Second call: actual API call with new token
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: { solar_power: 1000 } }),
      });

      process.env.TESLA_CLIENT_ID = 'test-client-id';
      const status = await expiredClient.getLiveStatus();

      // Should have made 2 calls: refresh + API
      expect(mockFetch).toHaveBeenCalledTimes(2);
      // Refresh call
      expect(mockFetch.mock.calls[0][0]).toContain('auth.tesla.com/oauth2/v3/token');
      // API call with new token
      expect(mockFetch.mock.calls[1][1].headers.Authorization).toBe('Bearer new-access-token');
      expect(status.solarW).toBe(1000);

      delete process.env.TESLA_CLIENT_ID;
    });

    it('throws when refresh fails', async () => {
      const expiredClient = new TeslaApiClient('site-123', {
        accessToken: 'expired-token',
        refreshToken: 'bad-refresh',
        expiresAt: new Date(Date.now() - 1000),
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      await expect(expiredClient.getLiveStatus()).rejects.toThrow('Failed to refresh Tesla token');
    });
  });

  describe('other endpoints', () => {
    it('getSiteInfo calls correct endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: { site_name: 'My Home' } }),
      });

      const info = await client.getSiteInfo();
      expect(info).toEqual({ site_name: 'My Home' });
      expect(mockFetch.mock.calls[0][0]).toContain('/site_info');
    });

    it('getHistory calls correct endpoint with params', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: { time_series: [] } }),
      });

      await client.getHistory('energy', 'day');
      expect(mockFetch.mock.calls[0][0]).toContain('kind=energy&period=day');
    });

    it('getTariffRate calls correct endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: { tariff_id: 'tou-1' } }),
      });

      const tariff = await client.getTariffRate();
      expect(tariff).toEqual({ tariff_id: 'tou-1' });
      expect(mockFetch.mock.calls[0][0]).toContain('/tariff_rate');
    });
  });
});

describe('Tesla OAuth Helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates correct auth URL', () => {
    process.env.TESLA_CLIENT_ID = 'my-client-id';
    const url = getTeslaAuthUrl('https://example.com/callback', 'random-state');

    expect(url).toContain('auth.tesla.com/oauth2/v3/authorize');
    expect(url).toContain('client_id=my-client-id');
    expect(url).toContain('redirect_uri=https');
    expect(url).toContain('scope=energy_device_data');
    expect(url).toContain('state=random-state');
    expect(url).toContain('response_type=code');

    delete process.env.TESLA_CLIENT_ID;
  });

  it('exchanges auth code for tokens', async () => {
    process.env.TESLA_CLIENT_ID = 'my-client-id';
    process.env.TESLA_CLIENT_SECRET = 'my-secret';

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: 'new-access',
        refresh_token: 'new-refresh',
        expires_in: 3600,
      }),
    });

    const tokens = await exchangeTeslaCode('auth-code-123', 'https://example.com/callback');

    expect(tokens.accessToken).toBe('new-access');
    expect(tokens.refreshToken).toBe('new-refresh');
    expect(tokens.expiresIn).toBe(3600);

    // Verify the fetch call
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.grant_type).toBe('authorization_code');
    expect(body.code).toBe('auth-code-123');

    delete process.env.TESLA_CLIENT_ID;
    delete process.env.TESLA_CLIENT_SECRET;
  });

  it('throws when code exchange fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
    });

    await expect(exchangeTeslaCode('bad-code', 'https://example.com/callback')).rejects.toThrow(
      'Failed to exchange Tesla auth code',
    );
  });
});
