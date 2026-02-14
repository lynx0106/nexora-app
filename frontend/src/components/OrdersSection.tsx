import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchAPIWithAuth, API_URL } from '../lib/api';

interface Order {
  id: string;
  tenantId: string;
  userId?: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  total: number;
  status: string;
  createdAt: string;
  items: {
    id: string;
    product: { name: string; price: number; imageUrl?: string };
    quantity: number;
    price: number;
  }[];
  paymentStatus?: string;
  paymentMethod?: string;
  paymentLink?: string;
  shippingAddress?: {
    street?: string;
    city?: string;
    zip?: string;
    country?: string;
  };
}

interface TopProduct {
  id: string;
  name: string;
  price: number;
  total_quantity: string;
  imageUrl?: string;
}

interface OrdersSectionProps {
  role: string | null;
  tenantId: string;
  selectedTenantId: string | null;
  onTenantChange: (id: string) => void;
  tenants: any[]; // List of tenants for selector
  currency: string;
  currentUserId?: string | null;
}

import { CreateOrderModal } from './CreateOrderModal';

export function OrdersSection({ role, tenantId, selectedTenantId, onTenantChange, tenants, currency, currentUserId }: OrdersSectionProps) {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const effectiveTenantId = role === 'superadmin' ? selectedTenantId : tenantId;

  const formatPrice = (amount: number) => {
    const locale = currency === 'COP' ? 'es-CO' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: currency === 'COP' ? 0 : 2,
      minimumFractionDigits: currency === 'COP' ? 0 : 2
    }).format(amount);
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let data;
      if (role === 'superadmin' && !selectedTenantId) {
        data = await fetchAPIWithAuth('/orders/all');
      } else if (effectiveTenantId) {
        data = await fetchAPIWithAuth(`/orders/tenant/${effectiveTenantId}`);
      }
      
      if (data) {
        setOrders(data);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error(err);
      setError(t('orders.load_error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchTopProducts = async () => {
    // If global view (no specific tenant selected), maybe skip top products or fetch global top?
    // For now, only fetch if tenant is selected
    if (!effectiveTenantId) {
        setTopProducts([]);
        return;
    }
    try {
      // For now, fetching top products generally. 
      // If we had a specific user selected, we would pass userId.
      // But let's show general top products for the tenant as "Bestsellers" 
      // which is useful for "Buy Again" logic if we assume the user buys popular stuff.
      // However, the requirement is "que al usuario se le vaya armando...".
      // Since this is the Dashboard (Admin view usually), we see Aggregate.
      // But let's assume we want to see the "Most Sold" items here.
      const data = await fetchAPIWithAuth(`/orders/top-products/${effectiveTenantId}`);
      setTopProducts(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (role === 'superadmin' || effectiveTenantId) {
      fetchOrders();
    }
    if (effectiveTenantId) {
      fetchTopProducts();
    }
  }, [effectiveTenantId, role, selectedTenantId]);

  const handleDelete = async (id: string) => {
    if (!confirm(t('orders.delete_confirm'))) return;
    try {
      await fetchAPIWithAuth(`/orders/${id}`, { method: 'DELETE' });
      setOrders(orders.filter(o => o.id !== id));
      if (selectedOrder?.id === id) setSelectedOrder(null);
    } catch (err) {
      console.error(err);
      alert(t('orders.delete_error'));
    }
  };

  const handlePrintOrder = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.product?.name || t('orders.unknown_product')}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatPrice(item.price)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatPrice(item.price * item.quantity)}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${t('orders.receipt_title')} #${order.id.slice(0, 8)}</title>
        <style>
          body { font-family: sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 30px; }
          .order-info { margin-bottom: 20px; }
          .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .total { text-align: right; font-size: 1.2em; font-weight: bold; }
          @media print {
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${t('orders.receipt_header')}</h1>
          <p>${t('orders.order')} #${order.id}</p>
        </div>
        
        <div class="order-info">
          <p><strong>${t('orders.date')}:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
          <p><strong>${t('orders.client')}:</strong> ${order.user ? `${order.user.firstName} ${order.user.lastName}` : (order.userId || t('orders.guest'))}</p>
          <p><strong>${t('orders.status')}:</strong> ${order.status}</p>
          ${order.shippingAddress ? `
            <p><strong>${t('orders.shipping_address')}:</strong><br>
            ${order.shippingAddress.street || ''}<br>
            ${order.shippingAddress.city || ''} ${order.shippingAddress.zip || ''}<br>
            ${order.shippingAddress.country || ''}
            </p>
          ` : ''}
        </div>

        <table class="table">
          <thead>
            <tr>
              <th style="text-align: left; padding: 8px; border-bottom: 2px solid #ddd;">${t('orders.product')}</th>
              <th style="text-align: right; padding: 8px; border-bottom: 2px solid #ddd;">${t('orders.quantity')}</th>
              <th style="text-align: right; padding: 8px; border-bottom: 2px solid #ddd;">${t('orders.price')}</th>
              <th style="text-align: right; padding: 8px; border-bottom: 2px solid #ddd;">${t('orders.total')}</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="total">
          ${t('orders.total')}: ${formatPrice(order.total)}
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await fetchAPIWithAuth(`/orders/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
    } catch (err) {
      alert(t('orders.update_status_error'));
    }
  };

  const handleUpdatePaymentStatus = async (id: string, newStatus: string) => {
    try {
      await fetchAPIWithAuth(`/orders/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ paymentStatus: newStatus }),
      });
      setOrders(orders.map(o => o.id === id ? { ...o, paymentStatus: newStatus } : o));
    } catch (err) {
      alert(t('orders.update_payment_error'));
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
        'cash': t('orders.payment_cash'),
        'cod': t('orders.payment_cod'),
        'card': t('orders.payment_card'),
        'transfer': t('orders.payment_transfer'),
        'nequi': t('orders.payment_nequi'),
        'daviplata': t('orders.payment_daviplata'),
        'pse': t('orders.payment_pse'),
        'bold': t('orders.payment_bold'),
        'zelle': t('orders.payment_zelle'),
        'venmo': t('orders.payment_venmo'),
        'cashapp': t('orders.payment_cashapp'),
        'mercadopago': t('orders.payment_mercadopago'),
        'paypal': t('orders.payment_paypal'),
        'bizum': t('orders.payment_bizum')
    };
    return labels[method] || method || t('orders.unknown');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">{t('orders.title')}</h2>
        <div className="flex items-center gap-4">
          {role !== 'user' && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            {t('orders.new_order')}
          </button>
          )}
          {role === 'superadmin' && (
            <select
              className="block w-64 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              value={selectedTenantId || ''}
              onChange={(e) => onTenantChange(e.target.value)}
            >
              <option value="">{t('orders.all_tenants')}</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({t.id})</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {isCreateModalOpen && (
        <CreateOrderModal
          tenantId={effectiveTenantId || ''}
          currency={currency}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            fetchOrders();
            fetchTopProducts();
          }}
        />
      )}

      {/* Top Products / Recommendations */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{t('orders.top_products_title')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          {topProducts.map((p) => (
            <div key={p.id} className="border rounded-lg p-4 flex flex-col items-center text-center">
              <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center mb-2 overflow-hidden">
                {p.imageUrl ? (
                   <img src={p.imageUrl.startsWith('http') ? p.imageUrl : `${API_URL}${p.imageUrl}`} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                   <span className="text-indigo-600 font-bold">★</span>
                )}
              </div>
              <h4 className="font-semibold text-sm">{p.name}</h4>
              <p className="text-xs text-gray-500">{formatPrice(p.price)}</p>
              <p className="text-xs text-green-600 mt-1">{p.total_quantity} {t('orders.top_products_sold')}</p>
            </div>
          ))}
          {topProducts.length === 0 && <p className="text-gray-500 text-sm col-span-5">{t('orders.no_data')}</p>}
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">{t('orders.history_title')}</h3>
        </div>
        <div className="border-t border-gray-200">
            {loading ? (
                <p className="p-4 text-gray-500">{t('common.loading')}</p>
            ) : orders.length === 0 ? (
                <p className="p-4 text-gray-500">{t('orders.no_orders')}</p>
            ) : (
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {role === 'superadmin' && !selectedTenantId && (
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('orders.table_company')}</th>
                            )}
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('orders.table_id_date')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('orders.table_user')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('orders.table_items')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('orders.table_total')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('orders.table_payment')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('orders.table_status')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('orders.table_actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {orders.map((order) => (
                            <tr key={order.id}>
                                {role === 'superadmin' && !selectedTenantId && (
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                        {order.tenantId}
                                    </td>
                                )}
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    <div className="font-bold">{order.id.slice(0, 8)}...</div>
                                    <div className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {order.user ? (
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-900">{order.user.firstName} {order.user.lastName}</span>
                                            <span className="text-xs text-gray-500">{order.user.email}</span>
                                        </div>
                                    ) : order.userId ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {t('orders.user_prefix')} {order.userId.slice(0, 5)}
                                        </span>
                                    ) : '-'}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    <ul className="list-disc pl-4">
                                        {order.items.map(item => (
                                            <li key={item.id}>
                                                {item.product?.name || 'Producto desconocido'} x{item.quantity}
                                            </li>
                                        ))}
                                    </ul>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                    {formatPrice(order.total)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {order.paymentStatus === 'paid' ? 'Pagado' : 'Pendiente'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        ${order.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                          order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {order.status === 'completed' ? t('orders.status_completed') : 
                                         order.status === 'pending' ? t('orders.status_pending') : 
                                         order.status === 'cancelled' ? t('orders.status_cancelled') : order.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <div className="flex space-x-2 items-center">
                                        <button
                                            onClick={() => setSelectedOrder(order)}
                                            className="text-indigo-600 hover:text-indigo-900 text-xs font-bold"
                                        >
                                            {t('orders.view_detail')}
                                        </button>
                                        {role !== 'user' && (
                                        <>
                                        <select 
                                            value={order.status} 
                                            onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                                            className="text-xs border-gray-300 rounded shadow-sm"
                                        >
                                            <option value="pending">{t('orders.status_pending')}</option>
                                            <option value="completed">{t('orders.status_completed')}</option>
                                            <option value="cancelled">{t('orders.status_cancelled')}</option>
                                        </select>
                                        <button 
                                            onClick={() => handleDelete(order.id)}
                                            className="text-red-600 hover:text-red-900 text-xs font-bold"
                                        >
                                            {t('common.delete')}
                                        </button>
                                        </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50" aria-labelledby="modal-title" role="dialog" aria-modal="true" onClick={() => setSelectedOrder(null)}>
          <div 
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-xl transform transition-all" 
            onClick={(e) => e.stopPropagation()}
          >
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                        {t('orders.detail_title')} #{selectedOrder.id.slice(0, 8)}
                        </h3>
                        <button
                            type="button"
                            className="text-gray-400 hover:text-gray-500"
                            onClick={() => setSelectedOrder(null)}
                        >
                            <span className="sr-only">{t('common.close')}</span>
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <h4 className="text-sm font-medium text-gray-500">Información del Cliente</h4>
                            <p className="mt-1 text-sm text-gray-900">
                                {selectedOrder.user 
                                  ? `${selectedOrder.user.firstName} ${selectedOrder.user.lastName} (${selectedOrder.user.email})`
                                  : selectedOrder.userId 
                                      ? `ID Usuario: ${selectedOrder.userId}` 
                                      : 'Usuario Invitado'
                                }
                            </p>
                            <p className="text-sm text-gray-900 mt-1">
                                Fecha: {new Date(selectedOrder.createdAt).toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-500 mb-2">
                                <strong>Estado de Pago:</strong>
                                <select
                                    value={selectedOrder.paymentStatus || 'pending'}
                                    onChange={(e) => {
                                        handleUpdatePaymentStatus(selectedOrder.id, e.target.value);
                                        setSelectedOrder({...selectedOrder, paymentStatus: e.target.value});
                                    }}
                                    className={`ml-2 text-xs font-semibold rounded-full border-0 py-1 pl-2 pr-8 shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6
                                        ${selectedOrder.paymentStatus === 'paid' ? 'bg-green-50 text-green-700 ring-green-600/20' : 
                                          'bg-yellow-50 text-yellow-800 ring-yellow-600/20'}`}
                                >
                                    <option value="pending">Pendiente</option>
                                    <option value="paid">Pagado</option>
                                </select>
                            </p>
                            <p className="text-sm text-gray-500 mb-2">
                                 <strong>Método:</strong> {getPaymentMethodLabel(selectedOrder.paymentMethod || 'cash')}
                             </p>
                             {/* @ts-ignore - paymentLink might be missing in strict types but exists in backend */}
                             {selectedOrder.paymentLink && (
                                <p className="text-sm text-gray-500 mb-2 break-all">
                                    <strong>Link de Pago:</strong> <a href={selectedOrder.paymentLink} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">{selectedOrder.paymentLink}</a>
                                </p>
                             )}
                            <p className="text-sm text-gray-500 mb-2">
                                <strong>Estado del Pedido:</strong>
                                <select
                                    value={selectedOrder.status}
                                    onChange={(e) => {
                                        handleUpdateStatus(selectedOrder.id, e.target.value);
                                        setSelectedOrder({...selectedOrder, status: e.target.value});
                                    }}
                                    className={`ml-2 text-xs font-semibold rounded-full border-0 py-1 pl-2 pr-8 shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6
                                        ${selectedOrder.status === 'completed' ? 'bg-green-50 text-green-700 ring-green-600/20' : 
                                          selectedOrder.status === 'pending' ? 'bg-yellow-50 text-yellow-800 ring-yellow-600/20' : 
                                          selectedOrder.status === 'cancelled' ? 'bg-red-50 text-red-700 ring-red-600/20' : 'bg-gray-50 text-gray-600 ring-gray-500/10'}`}
                                >
                                    <option value="pending">Pendiente</option>
                                    <option value="completed">Completado</option>
                                    <option value="cancelled">Cancelado</option>
                                </select>
                            </p>
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-gray-500">Dirección de Envío</h4>
                            {selectedOrder.shippingAddress ? (
                                <div className="mt-1 text-sm text-gray-900">
                                    <p>{selectedOrder.shippingAddress.street || 'Calle no especificada'}</p>
                                    <p>
                                        {selectedOrder.shippingAddress.city || ''} 
                                        {selectedOrder.shippingAddress.zip ? `, ${selectedOrder.shippingAddress.zip}` : ''}
                                    </p>
                                    <p>{selectedOrder.shippingAddress.country || ''}</p>
                                </div>
                            ) : (
                                <p className="mt-1 text-sm text-gray-500 italic">No proporcionada</p>
                            )}
                        </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">{t('orders.order_items_title')}</h4>
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('orders.table_product')}</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">{t('orders.table_quantity_short')}</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">{t('orders.table_unit_price')}</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">{t('orders.table_total_short')}</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {selectedOrder.items.map((item) => (
                                    <tr key={item.id}>
                                        <td className="px-3 py-2 text-sm text-gray-900">
                                            <div className="flex items-center">
                                                {item.product?.imageUrl ? (
                                                      <img 
                                                        src={item.product.imageUrl.startsWith('http') ? item.product.imageUrl : `${API_URL}${item.product.imageUrl}`} 
                                                        alt={item.product.name} 
                                                        className="h-8 w-8 rounded object-cover mr-2 bg-gray-100" 
                                                      />
                                                 ) : (
                                                     <div className="h-8 w-8 rounded mr-2 bg-gray-200 flex items-center justify-center text-xs text-gray-500 font-bold">
                                                        {item.product?.name?.charAt(0).toUpperCase() || '?'}
                                                     </div>
                                                )}
                                                <span>{item.product?.name || t('orders.unknown')}</span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 text-sm text-gray-900 text-right">{item.quantity}</td>
                                        <td className="px-3 py-2 text-sm text-gray-900 text-right">
                                            {formatPrice(item.price)}
                                        </td>
                                        <td className="px-3 py-2 text-sm text-gray-900 text-right font-medium">
                                            {formatPrice(item.price * item.quantity)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan={3} className="px-3 py-2 text-sm font-bold text-gray-900 text-right">{t('orders.total_label')}</td>
                                    <td className="px-3 py-2 text-sm font-bold text-indigo-600 text-right">
                                        {formatPrice(selectedOrder.total)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setSelectedOrder(null)}
                >
                  {t('orders.close')}
                </button>
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => handlePrintOrder(selectedOrder)}
                >
                  {t('orders.print_receipt')}
                </button>
              </div>
            </div>
          </div>
      )}
    </div>
  );
}
