/**
 * Test básico de la página de login/landing
 */
import { render } from '@testing-library/react';
import Home from '@/app/page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(() => null),
  }),
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: jest.fn(), language: 'es' },
  }),
}));

describe('Home page', () => {
  it('debe renderizar sin errores', () => {
    render(<Home />);
  });
});
