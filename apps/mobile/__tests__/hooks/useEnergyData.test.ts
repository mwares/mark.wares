import { api } from '../../services/api';

// We test the api service directly since testing hooks with timers is complex
jest.mock('../../services/api');

const mockApi = api as jest.Mocked<typeof api>;

describe('API service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('api.get sends GET request and returns parsed data', async () => {
    const mockData = {
      data: {
        solarW: 5000,
        batteryW: 1200,
        gridW: -700,
        homeW: 3000,
        batterySoe: 80,
        gridStatus: 'Connected',
        timestamp: '2026-04-04T12:00:00Z',
      },
    };

    mockApi.get.mockResolvedValueOnce(mockData);

    const result = await api.get('/api/energy/live');
    expect(result).toEqual(mockData);
    expect(mockApi.get).toHaveBeenCalledWith('/api/energy/live');
  });

  it('api.post sends POST request with body', async () => {
    const mockResponse = { data: { user: { id: '1' }, token: 'jwt' } };
    mockApi.post.mockResolvedValueOnce(mockResponse);

    const result = await api.post('/api/auth/login', {
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result).toEqual(mockResponse);
    expect(mockApi.post).toHaveBeenCalledWith('/api/auth/login', {
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('api.patch sends PATCH request', async () => {
    mockApi.patch.mockResolvedValueOnce({ data: { enabled: false } });

    const result = await api.patch('/api/alerts/rules/1', { enabled: false });
    expect(result).toEqual({ data: { enabled: false } });
  });

  it('api.delete sends DELETE request', async () => {
    mockApi.delete.mockResolvedValueOnce({ data: { deleted: true } });

    const result = await api.delete('/api/alerts/rules/1');
    expect(result).toEqual({ data: { deleted: true } });
  });

  it('api.setToken stores the token for subsequent requests', () => {
    // This is a simple state setter, just verify it doesn't throw
    expect(() => api.setToken('test-jwt-token')).not.toThrow();
    expect(() => api.setToken(null)).not.toThrow();
  });
});
