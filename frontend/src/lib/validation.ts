/**
 * Utilidades de validación básica para formularios
 * Complementa la validación del backend con feedback inmediato en cliente
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim());
}

export interface PasswordValidation {
  valid: boolean;
  message?: string;
}

export function validatePassword(password: string): PasswordValidation {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'La contraseña es obligatoria' };
  }
  if (password.length < 6) {
    return { valid: false, message: 'La contraseña debe tener al menos 6 caracteres' };
  }
  return { valid: true };
}

export function validateRequired(value: string | undefined, fieldName: string): string | null {
  if (!value || typeof value !== 'string') {
    return `${fieldName} es obligatorio`;
  }
  if (!value.trim()) {
    return `${fieldName} es obligatorio`;
  }
  return null;
}
