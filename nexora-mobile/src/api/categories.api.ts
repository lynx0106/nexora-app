import apiClient from './client';

export interface Category {
  id: string;
  name: string;
  description?: string;
  tenantId: string;
}

class CategoriesApi {
  async getAll(tenantId?: string): Promise<Category[]> {
    const params = tenantId ? { tenantId } : {};
    return await apiClient.get<Category[]>('/categories', params);
  }
}

export const categoriesApi = new CategoriesApi();
export default categoriesApi;
