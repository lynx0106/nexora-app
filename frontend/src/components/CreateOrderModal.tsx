import { useState, useEffect, type FormEvent } from 'react';
import { fetchAPIWithAuth } from '../lib/api';
import { useTranslation } from 'react-i18next';

interface Product {
  id: string;
  name: string;
  price: string | number; // Backend might send string or number
  stock: number;
  imageUrl?: string;
}

interface CreateOrderModalProps {
  tenantId: string;
  currency: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  maxStock: number;
}

export function CreateOrderModal({ tenantId, currency, onClose, onSuccess }: CreateOrderModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<any | null>(null);

  // Form states
  const [selectedProductId, setSelectedProductId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    zip: '',
    country: ''
  });

  // Client Selection states
  interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  }
  const [clients, setClients] = useState<User[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [loadingClients, setLoadingClients] = useState(false);
  const [showCreateClientForm, setShowCreateClientForm] = useState(false);
  const [newClient, setNewClient] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [createClientLoading, setCreateClientLoading] = useState(false);

  // Reset form when modal opens (on mount)
  useEffect(() => {
    setSelectedProductId('');
    setPaymentMethod('cash');
    setPaymentStatus('pending');
    setShippingAddress({ street: '', city: '', zip: '', country: '' });
    setItems([]);
    setSelectedClientId('');
    setCreatedOrder(null);
    setNewClient({ firstName: "", lastName: "", email: "", phone: "" });
    setShowCreateClientForm(false);
  }, []); // Run once on mount

  // Fetch data
  useEffect(() => {
    if (tenantId) {
      setLoadingProducts(true);
      fetchAPIWithAuth(`/products/tenant/${tenantId}`)
        .then(data => setProducts(data || []))
        .catch(err => console.error("Error fetching products:", err))
        .finally(() => setLoadingProducts(false));

      setLoadingClients(true);
      fetchAPIWithAuth(`/users/tenant/${tenantId}?role=user`)
        .then(data => setClients(data || []))
        .catch(err => console.error("Error fetching clients:", err))
        .finally(() => setLoadingClients(false));
    }
  }, [tenantId]);

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
  };

  const handleCreateClient = async (e: FormEvent) => {
    e.preventDefault();
    setCreateClientLoading(true);
    try {
      const payload = {
        ...newClient,
        role: 'user',
        tenantId,
        password: 'TempPassword123!' // Default password for manually created clients
      };
      
      const created = await fetchAPIWithAuth('/users', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      setClients([...clients, created]);
      setSelectedClientId(created.id);
      setShowCreateClientForm(false);
      setNewClient({ firstName: "", lastName: "", email: "", phone: "" });
    } catch (err) {
      console.error("Error creating client:", err);
      alert("Error al crear cliente. Verifique los datos.");
    } finally {
      setCreateClientLoading(false);
    }
  };

  const handleAddItem = () => {
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    const existing = items.find(i => i.productId === selectedProductId);
    if (existing) {
      if (existing.quantity < product.stock) {
        setItems(items.map(i => i.productId === selectedProductId ? { ...i, quantity: i.quantity + 1 } : i));
      } else {
        alert("No hay suficiente stock");
      }
    } else {
      setItems([...items, {
        productId: product.id,
        productName: product.name,
        price: Number(product.price),
        quantity: 1,
        maxStock: product.stock
      }]);
    }
    setSelectedProductId('');
  };

  const updateQuantity = (productId: string, delta: number) => {
    setItems(items.map(item => {
      if (item.productId === productId) {
        const newQty = item.quantity + delta;
        if (newQty < 1) return item;
        if (newQty > item.maxStock) {
           alert("Stock máximo alcanzado");
           return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeItem = (productId: string) => {
    setItems(items.filter(i => i.productId !== productId));
  };

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleSubmit = async () => {
    if (items.length === 0) return;
    setSubmitting(true);
    setError(null);

    try {
      const client = clients.find(c => c.id === selectedClientId);
      
      const payload = {
        tenantId,
        userId: selectedClientId || undefined,
        customerName: client ? `${client.firstName} ${client.lastName}` : "Cliente Ocasional",
        customerEmail: client?.email,
        items: items.map(i => ({
          productId: i.productId,
          quantity: i.quantity,
          price: i.price
        })),
        paymentMethod,
        paymentStatus,
        shippingAddress: shippingAddress.street ? shippingAddress : undefined
      };

      console.log('Sending Order Payload:', payload);

      await fetchAPIWithAuth('/orders', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Order Creation Error:", err);
      const msg = err.message || t('orders.create_modal.create_error');
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (amount: number) => {
    try {
      const locale = currency === 'COP' ? 'es-CO' : 'en-US';
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency || 'USD',
        maximumFractionDigits: currency === 'COP' ? 0 : 2,
        minimumFractionDigits: currency === 'COP' ? 0 : 2
      }).format(amount || 0);
    } catch (e) {
      return `${amount || 0}`;
    }
  };

  if (!tenantId) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>
          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    Error de Configuración
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      No se ha detectado el ID de la sede (Tenant ID). Por favor recargue la página o contacte soporte.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button type="button" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm" onClick={onClose}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
              Nuevo Pedido Manual
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">Cliente</label>
                <button
                  type="button"
                  onClick={() => setShowCreateClientForm(true)}
                  className="text-xs text-indigo-600 font-semibold hover:text-indigo-800"
                >
                  + Nuevo Cliente
                </button>
              </div>
              <select
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                value={selectedClientId}
                onChange={(e) => handleClientChange(e.target.value)}
                disabled={loadingClients}
              >
                <option value="">Cliente Ocasional (Sin registro)</option>
                {clients && clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName} ({c.email})
                  </option>
                ))}
              </select>
              {loadingClients && <p className="text-xs text-gray-500 mt-1">Cargando clientes...</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Método de Pago</label>
                <select
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <optgroup label="Efectivo / Presencial">
                    <option value="cash">Efectivo</option>
                    <option value="cod">Contra Entrega</option>
                    <option value="card">Tarjeta (Datáfono)</option>
                  </optgroup>
                  <optgroup label="Colombia">
                    <option value="nequi">Nequi</option>
                    <option value="daviplata">Daviplata</option>
                    <option value="pse">PSE</option>
                  </optgroup>
                  <optgroup label="Estados Unidos">
                    <option value="zelle">Zelle</option>
                    <option value="venmo">Venmo</option>
                    <option value="cashapp">Cash App</option>
                  </optgroup>
                  <optgroup label="Digital / Latam / Europa">
                    <option value="transfer">Transferencia Bancaria / IBAN</option>
                    <option value="bizum">Bizum (España)</option>
                    <option value="paypal">PayPal</option>
                    <option value="mercadopago">MercadoPago</option>
                  </optgroup>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado de Pago</label>
                <select
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                >
                  <option value="pending">Pendiente</option>
                  <option value="paid">Pagado</option>
                </select>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-md">
              <label className="block text-sm font-medium text-gray-700 mb-2">Agregar Producto</label>
              <div className="flex gap-2">
                <select
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  disabled={loadingProducts}
                >
                  <option value="">Seleccione un producto...</option>
                  {products && products.map(p => (
                    <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                      {p.name} - {formatPrice(Number(p.price))} (Stock: {p.stock})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddItem}
                  disabled={!selectedProductId}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>
              </div>
              {loadingProducts && <p className="text-xs text-gray-500 mt-1">Cargando productos...</p>}
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Ítems del Pedido</h4>
              {items.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No hay ítems agregados.</p>
              ) : (
                <ul className="divide-y divide-gray-200 border rounded-md">
                  {items.map((item) => (
                    <li key={item.productId} className="px-4 py-3 flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{item.productName}</p>
                        <p className="text-xs text-gray-500">{formatPrice(item.price)} x {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center border rounded">
                          <button onClick={() => updateQuantity(item.productId, -1)} className="px-2 py-1 text-gray-600 hover:bg-gray-100">-</button>
                          <span className="px-2 text-sm">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.productId, 1)} className="px-2 py-1 text-gray-600 hover:bg-gray-100">+</button>
                        </div>
                        <span className="text-sm font-semibold w-20 text-right">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                        <button onClick={() => removeItem(item.productId)} className="text-red-500 hover:text-red-700">
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4 flex justify-end">
                <p className="text-lg font-bold">Total: {formatPrice(total)}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Dirección de Envío (Opcional)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Calle / Dirección"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border"
                  value={shippingAddress.street}
                  onChange={e => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Ciudad"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border"
                  value={shippingAddress.city}
                  onChange={e => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            onClick={handleSubmit}
            disabled={submitting || items.length === 0}
          >
            {submitting ? 'Creando...' : 'Crear Pedido'}
          </button>
          <button
            type="button"
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            onClick={onClose}
          >
            Cancelar
          </button>
        </div>
      </div>

      {showCreateClientForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-medium text-zinc-900">Nuevo Cliente</h3>
            <form onSubmit={handleCreateClient} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700">Nombre</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                  value={newClient.firstName}
                  onChange={(e) => setNewClient({ ...newClient, firstName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700">Apellido</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                  value={newClient.lastName}
                  onChange={(e) => setNewClient({ ...newClient, lastName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700">Email</label>
                <input
                  type="email"
                  required
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700">Teléfono</label>
                <input
                  type="tel"
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                  value={newClient.phone}
                  onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateClientForm(false)}
                  className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createClientLoading}
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {createClientLoading ? "Guardando..." : "Crear Cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
