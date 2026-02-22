import apiClient from './client';

export interface Product {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductsListResponse {
  items: Product[];
  total: number;
}

class ProductsApi {
  async getAll(tenantId?: string): Promise<Product[]> {
    const params = tenantId ? { tenantId } : {};
    return await apiClient.get<Product[]>('/products', params);
  }

  async getById(id: string): Promise<Product> {
    return await apiClient.get<Product>(`/products/${id}`);
  }

  async getByTenant(tenantId: string): Promise<Product[]> {
    return await apiClient.get<Product[]>(`/products/tenant/${tenantId}`);
  }

  async create(data: Partial<Product>): Promise<Product> {
    return await apiClient.post<Product>('/products', data);
  }

  async update(id: string, data: Partial<Product>): Promise<Product> {
    return await apiClient.put<Product>(`/products/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/products/${id}`);
  }
}

export const productsApi = new ProductsApi();
export default productsApi;
