/**
 * Tests para utilidades de validación
 */
import { isValidEmail, validatePassword, validateRequired } from '@/lib/validation';

describe('isValidEmail', () => {
  it('debe retornar true para emails válidos', () => {
    expect(isValidEmail('a@b.co')).toBe(true);
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('nombre.apellido@empresa.com.co')).toBe(true);
  });

  it('debe retornar false para emails inválidos', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('sin-arroba')).toBe(false);
    expect(isValidEmail('@dominio.com')).toBe(false);
    expect(isValidEmail('user@')).toBe(false);
    expect(isValidEmail('user@.com')).toBe(false);
  });

  it('debe manejar strings con espacios', () => {
    expect(isValidEmail('  user@test.com  ')).toBe(true);
  });
});

describe('validatePassword', () => {
  it('debe retornar valid para contraseña >= 6 caracteres', () => {
    expect(validatePassword('123456').valid).toBe(true);
    expect(validatePassword('password123').valid).toBe(true);
  });

  it('debe retornar invalid para contraseña < 6 caracteres', () => {
    const r = validatePassword('12345');
    expect(r.valid).toBe(false);
    expect(r.message).toContain('6');
  });

  it('debe retornar invalid para vacío', () => {
    const r = validatePassword('');
    expect(r.valid).toBe(false);
  });
});

describe('validateRequired', () => {
  it('debe retornar null para valor válido', () => {
    expect(validateRequired('texto', 'Campo')).toBeNull();
  });

  it('debe retornar mensaje para valor vacío', () => {
    expect(validateRequired('', 'Nombre')).toContain('Nombre');
    expect(validateRequired('   ', 'Email')).toContain('Email');
  });
});
