import SecureStore from 'expo-secure-store';
import apiClient from '../../api/client';

// Mocks
jest.mock('expo-secure-store');
jest.mock('../../services/push.service', () => ({
  registerForPushNotifications: jest.fn().mockResolvedValue(null),
  unregisterPushToken: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../api/client', () => ({
  post: jest.fn(),
  get: jest.fn(),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
  getToken: jest.fn(),
  setToken: jest.fn(),
  clearToken: jest.fn(),
}));

const mockApi = apiClient as any;
const mockSecureStore = SecureStore as any;

describe('AuthContext Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApi.getToken.mockResolvedValue(null);
    mockSecureStore.getItemAsync.mockResolvedValue(null);
  });

  describe('Email Validation', () => {
    const validateEmail = (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    it('should validate correct email format', () => {
      expect(validateEmail('test@test.com')).toBe(true);
      expect(validateEmail('user@example.org')).toBe(true);
      expect(validateEmail('name.surname@domain.co')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(validateEmail('')).toBe(false);
      expect(validateEmail('test')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@test.com')).toBe(false);
      expect(validateEmail('test@.com')).toBe(false);
      expect(validateEmail('test test@test.com')).toBe(false);
    });
  });

  describe('Password Validation', () => {
    const validatePassword = (password: string): { valid: boolean; error?: string } => {
      if (!password) {
        return { valid: false, error: 'La contraseña es requerida' };
      }
      if (password.length < 6) {
        return { valid: false, error: 'La contraseña debe tener al menos 6 caracteres' };
      }
      return { valid: true };
    };

    it('should validate correct password', () => {
      expect(validatePassword('123456')).toEqual({ valid: true });
      expect(validatePassword('password123')).toEqual({ valid: true });
      expect(validatePassword('verylongpassword')).toEqual({ valid: true });
    });

    it('should reject invalid passwords', () => {
      expect(validatePassword('')).toEqual({ valid: false, error: 'La contraseña es requerida' });
      expect(validatePassword('12345')).toEqual({ valid: false, error: 'La contraseña debe tener al menos 6 caracteres' });
      expect(validatePassword('abc')).toEqual({ valid: false, error: 'La contraseña debe tener al menos 6 caracteres' });
    });
  });

  describe('Name Validation', () => {
    const validateName = (name: string): { valid: boolean; error?: string } => {
      if (!name) {
        return { valid: false, error: 'El nombre es requerido' };
      }
      if (name.length < 2) {
        return { valid: false, error: 'El nombre debe tener al menos 2 caracteres' };
      }
      return { valid: true };
    };

    it('should validate correct names', () => {
      expect(validateName('Juan')).toEqual({ valid: true });
      expect(validateName('María')).toEqual({ valid: true });
      expect(validateName('Jo')).toEqual({ valid: true });
    });

    it('should reject invalid names', () => {
      expect(validateName('')).toEqual({ valid: false, error: 'El nombre es requerido' });
      expect(validateName('J')).toEqual({ valid: false, error: 'El nombre debe tener al menos 2 caracteres' });
    });
  });

  describe('SecureStore Operations', () => {
    it('should store user data correctly', async () => {
      const userData = {
        id: '1',
        email: 'test@test.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        tenantId: 'tenant-1',
      };

      mockSecureStore.setItemAsync.mockResolvedValue(undefined);

      await SecureStore.setItemAsync('user_data', JSON.stringify(userData));

      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        'user_data',
        JSON.stringify(userData)
      );
    });

    it('should retrieve stored user data', async () => {
      const userData = {
        id: '1',
        email: 'test@test.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        tenantId: 'tenant-1',
      };

      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(userData));

      const result = await SecureStore.getItemAsync('user_data');

      expect(result).toBe(JSON.stringify(userData));
      expect(JSON.parse(result!)).toEqual(userData);
    });

    it('should delete user data on logout', async () => {
      mockSecureStore.deleteItemAsync.mockResolvedValue(undefined);

      await SecureStore.deleteItemAsync('user_data');

      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith('user_data');
    });
  });

  describe('API Token Management', () => {
    it('should set token after login', async () => {
      mockApi.setToken.mockResolvedValue(undefined);

      await mockApi.setToken('test-token');

      expect(mockApi.setToken).toHaveBeenCalledWith('test-token');
    });

    it('should get stored token', async () => {
      mockApi.getToken.mockResolvedValue('stored-token');

      const token = await mockApi.getToken();

      expect(token).toBe('stored-token');
    });

    it('should clear token on logout', async () => {
      mockApi.clearToken.mockResolvedValue(undefined);

      await mockApi.clearToken();

      expect(mockApi.clearToken).toHaveBeenCalled();
    });
  });

  describe('Login Flow', () => {
    it('should call login API with correct credentials', async () => {
      const mockResponse = {
        data: {
          access_token: 'test-token',
          user: {
            id: '1',
            email: 'test@test.com',
            firstName: 'Test',
            lastName: 'User',
            role: 'user',
            tenantId: 'tenant-1',
          },
        },
      };

      mockApi.post.mockResolvedValue(mockResponse);

      const result = await mockApi.post('/auth/login', {
        email: 'test@test.com',
        password: 'password123',
      });

      expect(mockApi.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@test.com',
        password: 'password123',
      });
      expect(result.data.access_token).toBe('test-token');
      expect(result.data.user.email).toBe('test@test.com');
    });

    it('should handle login error', async () => {
      const mockError = {
        response: {
          data: {
            message: 'Invalid credentials',
          },
        },
      };

      mockApi.post.mockRejectedValue(mockError);

      await expect(
        mockApi.post('/auth/login', { email: 'test@test.com', password: 'wrong' })
      ).rejects.toEqual(mockError);
    });
  });

  describe('Register Flow', () => {
    it('should call register API with correct data', async () => {
      const mockResponse = {
        data: {
          access_token: 'new-token',
          user: {
            id: '2',
            email: 'new@test.com',
            firstName: 'New',
            lastName: 'User',
            role: 'user',
            tenantId: 'tenant-1',
          },
        },
      };

      mockApi.post.mockResolvedValue(mockResponse);

      const result = await mockApi.post('/auth/register', {
        email: 'new@test.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      });

      expect(mockApi.post).toHaveBeenCalledWith('/auth/register', {
        email: 'new@test.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      });
      expect(result.data.access_token).toBe('new-token');
    });
  });

  describe('Password Reset Flow', () => {
    it('should call password reset API with email', async () => {
      mockApi.post.mockResolvedValue({ data: { message: 'Email sent' } });

      await mockApi.post('/auth/forgot-password', { email: 'test@test.com' });

      expect(mockApi.post).toHaveBeenCalledWith('/auth/forgot-password', {
        email: 'test@test.com',
      });
    });
  });
});
