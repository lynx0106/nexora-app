export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    try {
      const error = await res.json();
      throw new Error(error.message || 'Error en la petición');
    } catch {
      throw new Error(`Error HTTP: ${res.status}`);
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
  const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  // Only set Content-Type to application/json if body is not FormData
  if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
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
      throw new Error('Tu sesión ha expirado o no tienes permisos. Vuelve a iniciar sesión.');
    }

    if (message === 'Error en la petición') {
      message = `Error HTTP: ${res.status}`;
    }

    throw new Error(message);
  }

  return res.json();
}
