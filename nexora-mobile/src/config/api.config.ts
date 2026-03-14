// Configuración centralizada de API
// Las variables se pueden sobreescribir con variables de entorno en build time

// URL por defecto (fallback)
const DEFAULT_API_URL = 'https://nexora-app-production-3104.up.railway.app';
const DEFAULT_WEB_URL = 'https://nexora-app.online';

// Intentar obtener de variables de entorno (process.env) o usar default
// En Expo, las variables deben comenzar con EXPO_PUBLIC_ para estar disponibles
export const API_URL = 
  process.env.EXPO_PUBLIC_API_URL || 
  process.env.API_URL || 
  DEFAULT_API_URL;

/** URL base del frontend web (para abrir /privacy, /terms, etc.) */
export const WEB_URL = 
  process.env.EXPO_PUBLIC_WEB_URL || 
  process.env.WEB_URL || 
  DEFAULT_WEB_URL;

// Timeout para peticiones (en milisegundos)
export const API_TIMEOUT = 30000;

// Configuración de reintentos
export const API_RETRY_CONFIG = {
  retries: 3,
  retryDelay: 1000,
};

// Validar que la URL esté configurada
if (!API_URL) {
  if (__DEV__) console.error('❌ ERROR: API_URL no está configurada');
}

if (__DEV__) console.log('🔗 API_URL configurada:', API_URL);
