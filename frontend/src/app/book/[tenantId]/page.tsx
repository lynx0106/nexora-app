'use client';

import { useTranslation } from 'react-i18next';
import '@/i18n/config';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { fetchAPI, API_URL } from '@/lib/api';

interface Tenant {
  id: string;
  name: string;
  logoUrl?: string;
  coverUrl?: string;
  address?: string;
  city?: string;
  currency?: string;
}

interface Service {
  id: string;
  name: string;
  description: string;
  price: string;
  duration: number;
  imageUrl?: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  stock: number;
}

interface CartItem extends Product {
  quantity: number;
}

export default function BookingPage() {
  const { t } = useTranslation();
  const { tenantId } = useParams();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'services' | 'store'>('services');

  // Booking State
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [clientInfo, setClientInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: '',
    address: '',
    city: ''
  });

  // Store State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [storeStep, setStoreStep] = useState(1); // 1: List, 2: Checkout, 3: Success
  const [completedOrder, setCompletedOrder] = useState<any>(null);

  useEffect(() => {
    if (!tenantId) return;
    loadData();
  }, [tenantId]);

  async function loadData() {
    try {
      setLoading(true);
      const [tenantData, servicesData, productsData] = await Promise.all([
        fetchAPI(`/public/tenant/${tenantId}`),
        fetchAPI(`/public/services/${tenantId}`),
        fetchAPI(`/public/products/${tenantId}`).catch(() => [])
      ]);
      setTenant(tenantData);
      setServices(servicesData.filter((s: any) => s.isActive !== false));
      setProducts(productsData.filter((p: any) => p.stock > 0));
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos del negocio');
    } finally {
      setLoading(false);
    }
  }

  async function loadAvailability(date: string) {
    if (!tenantId) return;
    try {
      const slots = await fetchAPI(`/public/availability/${tenantId}?date=${date}`);
      setAvailableSlots(slots);
    } catch (err) {
      console.error('Error loading slots', err);
    }
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    setSelectedDate(date);
    setSelectedTime('');
    loadAvailability(date);
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedDate || !selectedTime) return;
    
    try {
        setLoading(true);
        await fetchAPI(`/public/book/${tenantId}`, {
            method: 'POST',
            body: JSON.stringify({
                serviceId: selectedService.id,
                dateTime: selectedTime,
                client: clientInfo
            })
        });
        
        setStep(5);
    } catch (err: any) {
        alert('Error al reservar: ' + err.message);
    } finally {
        setLoading(false);
    }
  };

  const formatPrice = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    const currency = tenant?.currency || 'USD';
    
    // Explicitly choose locale based on currency for clear formatting
    const locale = currency === 'COP' ? 'es-CO' : 'en-US';
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: currency === 'COP' ? 0 : 2,
      minimumFractionDigits: currency === 'COP' ? 0 : 2
    }).format(num);
  };

  // Store Functions
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return item; // Don't remove, just min 1
        if (newQty > item.stock) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleStoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    try {
      setLoading(true);
      const order = await fetchAPI(`/public/order/${tenantId}`, {
        method: 'POST',
        body: JSON.stringify({
          items: cart.map(item => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.price
          })),
          client: clientInfo
        })
      });
      setCompletedOrder(order);
      setStoreStep(3);
      setCart([]);
    } catch (err: any) {
      alert('Error al crear pedido: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && step !== 5 && storeStep !== 3) return <div className="min-h-screen flex items-center justify-center text-slate-200">{t('public.loading')}</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-400">{error}</div>;
  if (!tenant) return <div className="min-h-screen flex items-center justify-center text-slate-200">{t('public.not_found')}</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Header */}
      <header className="bg-slate-950/70 shadow-sm sticky top-0 z-10 backdrop-blur">
        <div className="max-w-3xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {tenant.logoUrl ? (
               <img 
                 src={tenant.logoUrl.startsWith('http') ? tenant.logoUrl : `${API_URL}${tenant.logoUrl}`} 
                 alt={tenant.name} 
                 className="h-12 w-12 rounded-full object-cover border border-slate-700" 
               />
            ) : (
              <div className="h-12 w-12 rounded-full bg-indigo-900/50 flex items-center justify-center text-indigo-200 font-bold text-lg">
                {tenant.name.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold text-slate-100 leading-tight">{tenant.name}</h1>
              <p className="text-xs text-slate-400">{tenant.city}</p>
            </div>
          </div>
          
          {/* Cart Icon (only in store) */}
          {activeTab === 'store' && cart.length > 0 && storeStep === 1 && (
            <button 
              onClick={() => setStoreStep(2)}
              className="relative p-2 text-slate-300 hover:text-emerald-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                {cart.reduce((a, b) => a + b.quantity, 0)}
              </span>
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-t border-slate-800">
          <button
            onClick={() => { setActiveTab('services'); setStep(1); }}
            className={`flex-1 py-3 text-sm font-medium text-center ${activeTab === 'services' ? 'text-emerald-300 border-b-2 border-emerald-400' : 'text-slate-400 hover:text-slate-200'}`}
          >
            {t('public.services_tab')}
          </button>
          <button
            onClick={() => { setActiveTab('store'); setStoreStep(1); }}
            className={`flex-1 py-3 text-sm font-medium text-center ${activeTab === 'store' ? 'text-emerald-300 border-b-2 border-emerald-400' : 'text-slate-400 hover:text-slate-200'}`}
          >
            {t('public.store_tab')}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        
        {/* === SERVICES TAB === */}
        {activeTab === 'services' && (
          <>
            {step < 5 && (
            <div className="mb-8">
              <div className="flex items-center justify-between text-sm font-medium text-slate-500">
                <span className={step >= 1 ? 'text-emerald-300' : ''}>{t('public.step_1')}</span>
                <span className={step >= 2 ? 'text-emerald-300' : ''}>{t('public.step_2')}</span>
                <span className={step >= 3 ? 'text-emerald-300' : ''}>{t('public.step_3')}</span>
                <span className={step >= 4 ? 'text-emerald-300' : ''}>{t('public.step_4')}</span>
              </div>
              <div className="mt-2 h-1 w-full rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-emerald-400 transition-all duration-300" style={{ width: `${step * 25}%` }}></div>
              </div>
            </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-slate-100">{t('public.our_services')}</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {services.map((service) => (
                    <div 
                      key={service.id}
                      onClick={() => { setSelectedService(service); setStep(2); }}
                      className="cursor-pointer rounded-lg border border-slate-800 bg-slate-900/70 p-4 transition-all group hover:border-emerald-400 hover:shadow-md"
                    >
                        <h3 className="font-medium text-slate-100 group-hover:text-emerald-300">{service.name}</h3>
                        <p className="text-sm text-slate-400 mt-1 line-clamp-2">{service.description}</p>
                        <div className="mt-4 flex items-center justify-between text-sm">
                            <span className="font-semibold text-slate-100">{formatPrice(service.price)}</span>
                            <span className="text-slate-500">{service.duration} min</span>
                        </div>
                    </div>
                  ))}
                  {services.length === 0 && <p className="text-slate-400">{t('public.no_services')}</p>}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-slate-100">{t('public.choose_date_time')}</h2>
                    <button onClick={() => setStep(1)} className="text-sm text-emerald-300 hover:underline">{t('public.change')}</button>
                </div>
                
                  <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-6 shadow-sm">
                    <label className="block text-sm font-medium text-slate-300 mb-2">{t('public.date_label')}</label>
                    <input 
                        type="date" 
                      className="w-full rounded-md border border-slate-700 bg-slate-900 text-slate-100 shadow-sm focus:border-emerald-400 focus:ring-emerald-400"
                        min={new Date().toISOString().split('T')[0]}
                        value={selectedDate}
                        onChange={handleDateChange}
                    />
                </div>

                {selectedDate && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-slate-300">{t('public.available_slots')}</h3>
                        {availableSlots.length === 0 ? (
                           <p className="text-sm text-slate-400 italic">{t('public.no_slots')}</p>
                        ) : (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                {availableSlots.map((slot) => {
                                    const date = new Date(slot);
                                    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                    return (
                                        <button
                                            key={slot}
                                            onClick={() => { setSelectedTime(slot); setStep(3); }}
                                            className={`py-2 px-3 text-sm font-medium rounded-md border ${
                                                selectedTime === slot 
                                    ? 'bg-emerald-500 text-slate-900 border-emerald-400' 
                                    : 'bg-slate-900 text-slate-200 border-slate-700 hover:bg-slate-800'
                                            }`}
                                        >
                                            {timeStr}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
              </div>
            )}

            {(step === 3 || step === 4) && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-slate-100">{t('public.your_data')}</h2>
                        <button onClick={() => setStep(2)} className="text-sm text-emerald-300 hover:underline">{t('public.back')}</button>
                    </div>

                      <form className="rounded-lg border border-slate-800 bg-slate-900/70 p-6 shadow-sm space-y-4" onSubmit={step === 3 ? (e) => { e.preventDefault(); setStep(4); } : handleBookingSubmit}>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                            <label className="block text-sm font-medium text-slate-300">{t('public.first_name')}</label>
                                <input 
                                    required
                                    type="text" 
                              className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-900 text-slate-100 shadow-sm focus:border-emerald-400 focus:ring-emerald-400 sm:text-sm"
                                    value={clientInfo.firstName}
                                    onChange={e => setClientInfo({...clientInfo, firstName: e.target.value})}
                                />
                            </div>
                            <div>
                            <label className="block text-sm font-medium text-slate-300">{t('public.last_name')}</label>
                                <input 
                                    required
                                    type="text" 
                              className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-900 text-slate-100 shadow-sm focus:border-emerald-400 focus:ring-emerald-400 sm:text-sm"
                                    value={clientInfo.lastName}
                                    onChange={e => setClientInfo({...clientInfo, lastName: e.target.value})}
                                />
                            </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-300">{t('public.email')}</label>
                            <input 
                                required
                                type="email" 
                            className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-900 text-slate-100 shadow-sm focus:border-emerald-400 focus:ring-emerald-400 sm:text-sm"
                                value={clientInfo.email}
                                onChange={e => setClientInfo({...clientInfo, email: e.target.value})}
                            />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-300">{t('public.phone')}</label>
                            <input 
                                type="tel" 
                            className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-900 text-slate-100 shadow-sm focus:border-emerald-400 focus:ring-emerald-400 sm:text-sm"
                                value={clientInfo.phone}
                                onChange={e => setClientInfo({...clientInfo, phone: e.target.value})}
                            />
                        </div>

                        {step === 4 && (
                             <div className="mt-6 border-t border-slate-800 pt-4">
                               <h3 className="font-medium text-slate-100 mb-2">{t('public.summary')}</h3>
                               <div className="bg-slate-900 p-4 rounded-md text-sm text-slate-200">
                                   <p><span className="font-semibold">{t('public.service_label')}:</span> {selectedService?.name}</p>
                                   <p><span className="font-semibold">{t('public.date_label')}:</span> {selectedDate} {new Date(selectedTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                   <p><span className="font-semibold">{t('public.price_label')}:</span> {formatPrice(selectedService?.price || 0)}</p>
                               </div>
                           </div>
                        )}

                        <div className="pt-4">
                            <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-slate-900 bg-emerald-400 hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-400">
                                {step === 3 ? t('public.continue') : t('public.book_button')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {step === 5 && (
                <div className="text-center py-12">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-900/40 mb-4">
                      <svg className="h-6 w-6 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-100 mb-2">{t('public.confirmed_title')}</h2>
                    <p className="text-slate-400 mb-8">{t('public.confirmed_desc')}</p>
                    <button onClick={() => window.location.reload()} className="text-emerald-300 font-medium hover:underline">{t('public.back_home')}</button>
                </div>
            )}
          </>
        )}

        {/* === STORE TAB === */}
        {activeTab === 'store' && (
          <>
             {storeStep === 1 && (
               <div className="space-y-6">
                 <h2 className="text-xl font-semibold text-slate-100">{t('public.available_products')}</h2>
                 <div className="grid gap-6 sm:grid-cols-2">
                   {products.map(product => (
                     <div key={product.id} className="rounded-lg border border-slate-800 bg-slate-900/70 overflow-hidden flex flex-col">
                       {product.imageUrl && (
                         <img 
                           src={product.imageUrl.startsWith('http') ? product.imageUrl : `${API_URL}${product.imageUrl}`} 
                           alt={product.name} 
                           className="h-48 w-full object-cover" 
                         />
                       )}
                       <div className="p-4 flex-1 flex flex-col">
                         <h3 className="font-medium text-slate-100">{product.name}</h3>
                         <p className="text-sm text-slate-400 mt-1 line-clamp-2 flex-1">{product.description}</p>
                         <div className="mt-4 flex items-center justify-between">
                            <span className="text-lg font-bold text-slate-100">{formatPrice(product.price)}</span>
                            {cart.find(item => item.id === product.id) ? (
                               <div className="flex items-center gap-2">
                                  <button onClick={() => updateQuantity(product.id, -1)} className="p-1 rounded bg-slate-800 hover:bg-slate-700">-</button>
                                  <span className="text-sm font-medium w-4 text-center text-slate-200">{cart.find(item => item.id === product.id)?.quantity}</span>
                                  <button onClick={() => updateQuantity(product.id, 1)} className="p-1 rounded bg-slate-800 hover:bg-slate-700">+</button>
                               </div>
                            ) : (
                               <button 
                                 onClick={() => addToCart(product)}
                                 className="px-3 py-1.5 bg-emerald-400 text-slate-900 text-sm font-medium rounded hover:bg-emerald-300"
                               >
                                 {t('public.add')}
                               </button>
                            )}
                         </div>
                       </div>
                     </div>
                   ))}
                   {products.length === 0 && <p className="text-slate-400">{t('public.no_products')}</p>}
                 </div>
                 
                 {cart.length > 0 && (
                   <div className="fixed bottom-4 left-4 right-4 max-w-3xl mx-auto">
                     <button 
                       onClick={() => setStoreStep(2)}
                       className="w-full bg-slate-900 text-slate-100 p-4 rounded-lg shadow-lg flex items-center justify-between"
                     >
                       <span className="font-medium">{cart.reduce((a,b)=>a+b.quantity,0)} {t('public.items')}</span>
                       <span className="font-bold">{t('public.view_cart')} ({formatPrice(cartTotal)})</span>
                     </button>
                   </div>
                 )}
               </div>
             )}

             {storeStep === 2 && (
               <div className="space-y-6">
                 <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-slate-100">{t('public.your_order')}</h2>
                    <button onClick={() => setStoreStep(1)} className="text-sm text-emerald-300 hover:underline">{t('public.continue_shopping')}</button>
                 </div>

                 <div className="rounded-lg border border-slate-800 bg-slate-900/70 divide-y divide-slate-800">
                    {cart.map(item => (
                      <div key={item.id} className="p-4 flex items-center gap-4">
                        {item.imageUrl && <img src={item.imageUrl} className="h-12 w-12 rounded object-cover" />}
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-100">{item.name}</h4>
                          <p className="text-sm text-slate-400">{formatPrice(item.price)} x {item.quantity}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => updateQuantity(item.id, -1)} className="p-1 rounded bg-slate-800 hover:bg-slate-700">-</button>
                            <span className="text-sm w-4 text-center text-slate-200">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="p-1 rounded bg-slate-800 hover:bg-slate-700">+</button>
                        </div>
                        <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    <div className="p-4 bg-slate-900 flex justify-between items-center font-bold text-slate-100">
                      <span>{t('public.total')}</span>
                      <span>{formatPrice(cartTotal)}</span>
                    </div>
                 </div>

                   <form onSubmit={handleStoreSubmit} className="rounded-lg border border-slate-800 bg-slate-900/70 p-6 shadow-sm space-y-4">
                    <h3 className="font-medium text-slate-100">{t('public.shipping_info')}</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <input 
                            required placeholder={t('public.first_name')}
                        className="w-full rounded-md border border-slate-700 bg-slate-900 text-slate-100 shadow-sm focus:border-emerald-400 focus:ring-emerald-400"
                            value={clientInfo.firstName}
                            onChange={e => setClientInfo({...clientInfo, firstName: e.target.value})}
                        />
                        <input 
                            required placeholder={t('public.last_name')}
                        className="w-full rounded-md border border-slate-700 bg-slate-900 text-slate-100 shadow-sm focus:border-emerald-400 focus:ring-emerald-400"
                            value={clientInfo.lastName}
                            onChange={e => setClientInfo({...clientInfo, lastName: e.target.value})}
                        />
                    </div>
                    <input 
                        required type="email" placeholder={t('public.email')}
                      className="w-full rounded-md border border-slate-700 bg-slate-900 text-slate-100 shadow-sm focus:border-emerald-400 focus:ring-emerald-400"
                        value={clientInfo.email}
                        onChange={e => setClientInfo({...clientInfo, email: e.target.value})}
                    />
                    <input 
                        required placeholder={t('public.address')}
                      className="w-full rounded-md border border-slate-700 bg-slate-900 text-slate-100 shadow-sm focus:border-emerald-400 focus:ring-emerald-400"
                        value={clientInfo.address}
                        onChange={e => setClientInfo({...clientInfo, address: e.target.value})}
                    />
                     <input 
                        required placeholder={t('public.city')}
                      className="w-full rounded-md border border-slate-700 bg-slate-900 text-slate-100 shadow-sm focus:border-emerald-400 focus:ring-emerald-400"
                        value={clientInfo.city}
                        onChange={e => setClientInfo({...clientInfo, city: e.target.value})}
                    />
                    <input 
                        placeholder={t('public.phone_optional')}
                      className="w-full rounded-md border border-slate-700 bg-slate-900 text-slate-100 shadow-sm focus:border-emerald-400 focus:ring-emerald-400"
                        value={clientInfo.phone}
                        onChange={e => setClientInfo({...clientInfo, phone: e.target.value})}
                    />

                    <button type="submit" className="w-full py-3 bg-emerald-400 text-slate-900 font-bold rounded-lg hover:bg-emerald-300 shadow-lg mt-4">
                        {t('public.confirm_order')}
                    </button>
                 </form>
               </div>
             )}

             {storeStep === 3 && (
                <div className="text-center py-12">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-900/40 mb-6">
                      <svg className="h-8 w-8 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-slate-100 mb-4">{t('public.order_received')}</h2>
                    <p className="text-slate-400 mb-8 max-w-md mx-auto">
                        {t('public.order_desc')}
                    </p>
                    
                    {completedOrder?.paymentLink && (
                        <div className="mb-8">
                              <a
                                href={completedOrder.paymentLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-slate-900 bg-emerald-400 hover:bg-emerald-300 md:py-4 md:text-lg md:px-10 shadow-lg transform transition hover:scale-105"
                              >
                                {t('public.pay_now')}
                              </a>
                              <p className="mt-2 text-sm text-slate-400">
                                {t('public.redirect_payment')}
                              </p>
                        </div>
                    )}

                    <button 
                        onClick={() => { setStoreStep(1); setStep(1); setCompletedOrder(null); }}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-slate-900 bg-emerald-200 hover:bg-emerald-300"
                    >
                        {t('public.back_store')}
                    </button>
                </div>
            )}
          </>
        )}

      </main>
    </div>
  );
}