import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../config/api.config';

// Usar URL centralizada de api.config (3104 en producción)

// Claves de almacenamiento
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_URL;
  }

  // Gestión de token
  async saveToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  }

  async getToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  }

  async clearAuth(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  }

  private async getHeaders(customHeaders?: Record<string, string>): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    const token = await this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, headers: customHeaders } = options;

    const config: RequestInit = {
      method,
      headers: await this.getHeaders(customHeaders),
    };

    if (body && method !== 'GET') {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, config);

    if (response.status === 401) {
      await this.clearAuth();
      throw new Error('Sesión expirada');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP Error: ${response.status}`);
    }

    // Manejar respuestas vacías
    const text = await response.text();
    if (!text) {
      return {} as T;
    }

    return JSON.parse(text) as T;
  }

  // Métodos HTTP
  async get<T>(url: string, params?: Record<string, any>): Promise<T> {
    let endpoint = url;
    if (params && Object.keys(params).length > 0) {
      const queryString = Object.entries(params)
        .filter(([_, value]) => value !== undefined && value !== null)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
      endpoint = `${url}?${queryString}`;
    }
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(url: string, data?: any): Promise<T> {
    return this.request<T>(url, { method: 'POST', body: data });
  }

  async put<T>(url: string, data?: any): Promise<T> {
    return this.request<T>(url, { method: 'PUT', body: data });
  }

  async patch<T>(url: string, data?: any): Promise<T> {
    return this.request<T>(url, { method: 'PATCH', body: data });
  }

  async delete<T>(url: string): Promise<T> {
    return this.request<T>(url, { method: 'DELETE' });
  }

  // Upload de archivos
  async upload<T>(url: string, formData: FormData): Promise<T> {
    const token = await this.getToken();
    const headers: HeadersInit = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    // No establecer Content-Type para FormData, el navegador lo hace automáticamente

    const response = await fetch(`${this.baseUrl}${url}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP Error: ${response.status}`);
    }

    const text = await response.text();
    if (!text) {
      return {} as T;
    }

    return JSON.parse(text) as T;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
