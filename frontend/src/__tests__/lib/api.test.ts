/**
 * Tests para el cliente API
 */
import { API_URL, isAuthenticated } from '@/lib/api';

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

describe('isAuthenticated', () => {
  const originalCookie = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');

  afterEach(() => {
    if (originalCookie) {
      Object.defineProperty(document, 'cookie', originalCookie);
    }
  });

  it('debe retornar false cuando no hay cookie is_authenticated', () => {
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get: () => '',
    });
    expect(isAuthenticated()).toBe(false);
  });

  it('debe retornar true cuando existe cookie is_authenticated', () => {
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get: () => 'is_authenticated=true',
    });
    expect(isAuthenticated()).toBe(true);
  });

  it('debe retornar true cuando is_authenticated está entre otras cookies', () => {
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get: () => 'other=value; is_authenticated=true; foo=bar',
    });
    expect(isAuthenticated()).toBe(true);
  });
});
