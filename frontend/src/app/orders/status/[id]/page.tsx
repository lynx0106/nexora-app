'use client';

import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { fetchAPI, API_URL } from '@/lib/api';

interface OrderItem {
  productName: string;
  quantity: number;
  price: string; // From backend comes as string sometimes if decimal
  imageUrl?: string;
}

interface OrderStatus {
  id: string;
  createdAt: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  total: number;
  currency: string;
  items: OrderItem[];
  shippingAddress: any;
  customerEmail: string;
  paymentLink?: string;
  tenant: {
    name: string;
    logoUrl?: string;
    phone?: string;
  };
}

export default function OrderStatusPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      loadOrder();
    }
  }, [id]);

  async function loadOrder() {
    try {
      setLoading(true);
      const data = await fetchAPI(`/public/orders/${id}`);
      setOrder(data);
    } catch (err: any) {
      setError(err.message || t('public.error_loading_order'));
    } finally {
      setLoading(false);
    }
  }

  const formatPrice = (amount: number | string) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: order?.currency || 'COP',
      minimumFractionDigits: 0
    }).format(Number(amount));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-emerald-900/40 text-emerald-200 border border-emerald-700';
      case 'pending': return 'bg-amber-900/40 text-amber-200 border border-amber-700';
      case 'cancelled': return 'bg-red-900/40 text-red-200 border border-red-700';
      case 'refunded': return 'bg-slate-800 text-slate-200 border border-slate-700';
      default: return 'bg-slate-800 text-slate-200 border border-slate-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
        case 'paid': return t('public.status_paid');
        case 'pending': return t('public.status_pending');
        case 'cancelled': return t('public.status_cancelled');
        case 'refunded': return t('public.status_refunded');
        default: return status;
      }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200">{t('public.loading_details')}</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-red-400">{error}</div>;
  if (!order) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200">{t('public.order_not_found')}</div>;

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4 text-slate-100 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Header with Tenant Info */}
        <div className="text-center mb-8">
            {order.tenant.logoUrl ? (
                <img 
                  src={order.tenant.logoUrl.startsWith('http') ? order.tenant.logoUrl : `${API_URL}${order.tenant.logoUrl}`} 
                  alt={order.tenant.name}
                  className="mx-auto h-16 w-16 rounded-full object-cover shadow-sm mb-4 border border-slate-700"
                />
            ) : (
                <div className="mx-auto h-16 w-16 rounded-full bg-indigo-900/50 flex items-center justify-center text-indigo-200 font-bold text-2xl mb-4">
                    {order.tenant.name.substring(0, 2).toUpperCase()}
                </div>
            )}
            <h1 className="text-3xl font-extrabold text-slate-100">{order.tenant.name}</h1>
            <p className="mt-2 text-sm text-slate-400">{t('public.order_details', { id: order.id.slice(0, 8) })}</p>
        </div>

        <div className="bg-slate-900/70 shadow overflow-hidden sm:rounded-lg border border-slate-800">
          {/* Status Banner */}
          <div className="px-4 py-5 sm:px-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
            <div>
              <h3 className="text-lg leading-6 font-medium text-slate-100">{t('public.status_title')}</h3>
              <p className="mt-1 max-w-2xl text-sm text-slate-400">
                {t('public.placed_on', { date: new Date(order.createdAt).toLocaleDateString() })}
              </p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wide ${getStatusColor(order.paymentStatus)}`}>
              {getStatusLabel(order.paymentStatus)}
            </span>
          </div>

          {/* Payment Action */}
          {order.paymentStatus === 'pending' && order.paymentLink && (
            <div className="px-4 py-5 sm:px-6 bg-amber-900/20 border-b border-amber-800">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center">
                  <svg className="h-6 w-6 text-amber-300 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                  <p className="text-sm text-amber-200">
                            {t('public.pending_payment_msg')}
                        </p>
                    </div>
                    <a
                        href={order.paymentLink}
                        target="_blank"
                        rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-slate-900 bg-emerald-400 hover:bg-emerald-300 shadow-sm transition-colors"
                    >
                        {t('public.pay_now')} {formatPrice(order.total)}
                    </a>
                </div>
            </div>
          )}

          {/* Order Items */}
          <div className="border-t border-slate-800">
            <dl>
              <div className="bg-slate-900/60 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-slate-400">{t('public.products')}</dt>
                <dd className="mt-1 text-sm text-slate-100 sm:mt-0 sm:col-span-2">
                  <ul className="divide-y divide-slate-800">
                    {order.items.map((item, index) => (
                      <li key={index} className="py-3 flex justify-between">
                        <div className="flex items-center">
                            <span className="font-medium text-slate-100">{item.quantity}x</span>
                            <span className="ml-2 text-slate-400">{item.productName}</span>
                        </div>
                        <span className="font-medium text-slate-100">
                            {formatPrice(Number(item.price) * item.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex justify-between border-t border-slate-800 pt-4 font-bold text-lg">
                      <span>{t('public.cart_total')}</span>
                      <span>{formatPrice(order.total)}</span>
                  </div>
                </dd>
              </div>

              {/* Shipping Info */}
              <div className="bg-slate-950 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-slate-400">{t('public.shipping_info')}</dt>
                <dd className="mt-1 text-sm text-slate-100 sm:mt-0 sm:col-span-2">
                  <p>{order.customerEmail}</p>
                  {order.shippingAddress && (
                      <div className="mt-1">
                          <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                          <p>{order.shippingAddress.street}</p>
                          <p>{order.shippingAddress.city}, {order.shippingAddress.zip}</p>
                          <p>{order.shippingAddress.country}</p>
                      </div>
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </div>
        
        <div className="mt-8 text-center">
            <p className="text-sm text-slate-400">
                {t('public.contact_msg', { tenant: order.tenant.name })}
                {order.tenant.phone && ` al ${order.tenant.phone}`}.
            </p>
        </div>

      </div>
    </div>
  );
}
