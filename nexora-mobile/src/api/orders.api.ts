import apiClient from './client';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  tenantId: string;
  userId?: string;
  customerName?: string;
  customerEmail?: string;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  paymentLink?: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderDto {
  items: { productId: string; quantity: number }[];
  customerName?: string;
  customerEmail?: string;
  shippingAddress?: any;
  paymentMethod?: string;
}

class OrdersApi {
  async getAll(tenantId?: string): Promise<Order[]> {
    const params = tenantId ? { tenantId } : {};
    return await apiClient.get<Order[]>('/orders', params);
  }

  async getById(id: string): Promise<Order> {
    return await apiClient.get<Order>(`/orders/${id}`);
  }

  async create(data: CreateOrderDto): Promise<Order> {
    return await apiClient.post<Order>('/orders', data);
  }

  async getPaymentLink(orderId: string): Promise<{ paymentLink: string }> {
    return await apiClient.get<{ paymentLink: string }>(`/orders/${orderId}/payment-link`);
  }

  async getByPublicToken(token: string): Promise<Order> {
    return await apiClient.get<Order>(`/orders/public/${token}`);
  }
}

export const ordersApi = new OrdersApi();
export default ordersApi;
