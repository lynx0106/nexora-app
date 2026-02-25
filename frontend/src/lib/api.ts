import { showToast } from './toast';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://nexora-app-production-3104.up.railway.app';

/**
 * Check if user is authenticated by looking at the auth cookie
 * This is a client-side only check using a non-httpOnly cookie
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check for the auth indicator cookie (non-httpOnly)
  const cookies = document.cookie.split(';');
  return cookies.some(cookie => 
    cookie.trim().startsWith('is_authenticated=')
  );
}

/**
 * Clear auth cookies by calling the logout endpoint
 */
export async function logout(): Promise<void> {
  try {
    await fetchAPIWithAuth('/auth/logout', { method: 'POST' });
  } catch {
    // Even if the request fails, clear local state
  }
  
  // Clear any legacy localStorage data
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('token');
    window.localStorage.removeItem('user');
  }
  
  // Reload to clear any in-memory state
  window.location.href = '/';
}

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: 'include', // Include cookies in requests
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    try {
      const error = await res.json();
      const message = error.message || 'Error en la petición';
      showToast(message, 'error');
      throw new Error(message);
    } catch {
      const message = `Error HTTP: ${res.status}`;
      showToast(message, 'error');
      throw new Error(message);
    }
  }

  return res.json();
}

export async function uploadFile(file: File, type: 'avatars' | 'products' | 'chat') {
  const formData = new FormData();
  formData.append('file', file);
  const data = await fetchAPIWithAuth(`/uploads/${type}`, {
      method: 'POST',
      body: formData
  });
  return data.url;
}

export async function fetchAPIWithAuth(endpoint: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  // Only set Content-Type to application/json if body is not FormData
  if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
  }

  // Note: We no longer read from localStorage.
  // The JWT is automatically sent via httpOnly cookie.
  // For backward compatibility during transition, we'll still send the header if it exists
  if (typeof window !== 'undefined') {
    const legacyToken = window.localStorage.getItem('token');
    if (legacyToken) {
      headers.Authorization = `Bearer ${legacyToken}`;
    }
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: 'include', // Critical: include cookies in the request
    headers,
  });

  if (!res.ok) {
    let message = 'Error en la petición';
    try {
      const error = await res.json();
      message = error.message || message;
    } catch {
      // ignoramos error de parseo y usamos mensaje genérico / por código
    }

    if (res.status === 401) {
      const authMessage = 'Tu sesión ha expirado o no tienes permisos. Vuelve a iniciar sesión.';
      showToast(authMessage, 'error');
      
      // Clear legacy storage and redirect
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('token');
        window.localStorage.removeItem('user');
        window.location.href = '/';
      }
      
      throw new Error(authMessage);
    }

    if (message === 'Error en la petición') {
      message = `Error HTTP: ${res.status}`;
    }

    showToast(message, 'error');

    throw new Error(message);
  }

  return res.json();
}
