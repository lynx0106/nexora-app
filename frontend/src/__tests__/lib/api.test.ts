/**
 * Tests básicos para el cliente API
 */
import { API_URL } from '@/lib/api';

// Mock showToast para evitar errores en tests
jest.mock('@/lib/toast', () => ({
  showToast: jest.fn(),
}));

describe('API config', () => {
  it('API_URL debe ser una URL válida', () => {
    expect(API_URL.startsWith('http://') || API_URL.startsWith('https://')).toBe(true);
  });

  it('API_URL debe tener formato correcto', () => {
    expect(API_URL.length).toBeGreaterThan(10);
    expect(API_URL).not.toContain('undefined');
  });
});
