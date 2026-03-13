const mockFetch = jest.fn();

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../config/api.config', () => ({
  API_URL: 'https://nexora-app-production-3104.up.railway.app',
}));

describe('ApiClient', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = mockFetch;
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve('{}'),
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should use API_URL from api.config for requests', async () => {
    const { apiClient } = require('../../api/client');

    await apiClient.get('/test-endpoint');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://nexora-app-production-3104.up.railway.app/test-endpoint',
      expect.any(Object)
    );
  });
});
