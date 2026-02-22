import axios from 'axios';

// Mock axios
const mockCreate = jest.fn(() => ({
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

jest.mock('axios', () => ({
  create: mockCreate,
}));

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

describe('ApiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create axios instance with correct base URL', () => {
    // Re-import to trigger axios.create
    jest.isolateModules(() => {
      require('../../api/client');
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: 'https://nexora-app-production-3199.up.railway.app',
        timeout: 30000,
      })
    );
  });
});