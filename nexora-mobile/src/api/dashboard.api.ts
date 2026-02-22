import apiClient from './client';

export interface DashboardMetrics {
  totalOrders: number;
  totalProducts: number;
  totalSales: number;
  pendingOrders: number;
  lowStockProducts: number;
  todayOrders: number;
}

export interface ActivityItem {
  type: 'order' | 'appointment';
  id: string;
  date: string;
  title: string;
  description: string;
  status: string;
  amount: number;
}

export interface SalesChartData {
  date: string;
  total: number;
}

class DashboardApi {
  async getActivity(tenantId: string): Promise<ActivityItem[]> {
    return await apiClient.get<ActivityItem[]>(`/dashboard/activity/${tenantId}`);
  }

  async getSalesChart(tenantId: string): Promise<SalesChartData[]> {
    return await apiClient.get<SalesChartData[]>(`/dashboard/charts/sales/${tenantId}`);
  }

  async getMetrics(tenantId: string): Promise<DashboardMetrics> {
    // Combine data from different endpoints
    const [activity, salesChart] = await Promise.all([
      this.getActivity(tenantId),
      this.getSalesChart(tenantId),
    ]);

    const totalSales = salesChart.reduce((sum, item) => sum + item.total, 0);
    const today = new Date().toISOString().split('T')[0];
    const todaySales = salesChart.find(item => item.date === today)?.total || 0;
    
    const orderActivities = activity.filter(a => a.type === 'order');
    const pendingOrders = orderActivities.filter(a => a.status === 'pending').length;

    return {
      totalOrders: orderActivities.length,
      totalProducts: 0, // Would need products endpoint
      totalSales,
      pendingOrders,
      lowStockProducts: 0, // Would need inventory endpoint
      todayOrders: pendingOrders,
    };
  }
}

const dashboardApi = new DashboardApi();
export default dashboardApi;
