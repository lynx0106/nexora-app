import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchAPIWithAuth } from '../lib/api';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
  isActive: boolean;
  phone?: string;
  address?: string;
  tenantId?: string;
}

interface ClientsSectionProps {
  role: string | null;
  tenantId: string;
  selectedTenantId: string | null;
  onTenantChange: (id: string) => void;
  tenants: any[];
}

export function ClientsSection({ role, tenantId, selectedTenantId, onTenantChange, tenants }: ClientsSectionProps) {
  const { t } = useTranslation();
  const [clients, setClients] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const resetForm = () => {
    setEditingUserId(null);
    setFirstName("");
    setLastName("");
    setEmail("");
    setPassword("");
    setPhone("");
    setAddress("");
    setFormError(null);
    setFormSuccess(null);
  };

  // Client Details & Orders State
  const [viewingClient, setViewingClient] = useState<User | null>(null);
  const [clientOrders, setClientOrders] = useState<any[]>([]);
  const [clientAppointments, setClientAppointments] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'appointments'>('orders');

  const effectiveTenantId = role === 'superadmin' ? selectedTenantId : tenantId;

  const fetchClientData = async (client: User) => {
    if (!effectiveTenantId) return;
    
    // Fetch Orders
    setLoadingOrders(true);
    setClientOrders([]);
    fetchAPIWithAuth(`/orders/tenant/${effectiveTenantId}?userId=${client.id}`)
        .then(data => setClientOrders(data || []))
        .catch(err => console.error(err))
        .finally(() => setLoadingOrders(false));

    // Fetch Appointments
    setLoadingAppointments(true);
    setClientAppointments([]);
    fetchAPIWithAuth(`/appointments/tenant/${effectiveTenantId}?userId=${client.id}`)
        .then(data => setClientAppointments(data || []))
        .catch(err => console.error(err))
        .finally(() => setLoadingAppointments(false));
  };

  const handleViewDetails = (client: User) => {
    setViewingClient(client);
    setActiveTab('orders');
    fetchClientData(client);
  };

  const fetchClients = async () => {
    // If superadmin hasn't selected a tenant, maybe show all or ask to select?
    // Consistent with other sections: if superadmin and no tenant selected, maybe show all or nothing.
    // Dashboard logic: if superadmin and selectedTenantId is set, use it. Else fetch all?
    // Actually Dashboard logic for users: if superadmin, fetch all or filtered.
    
    setLoading(true);
    setError(null);
    try {
      let url = '/users';
      if (role === 'superadmin') {
        if (selectedTenantId) {
          url = `/users/tenant/${selectedTenantId}`;
        } else {
          url = '/users/all';
        }
      }
      
      const data = await fetchAPIWithAuth(url);
      // Filter only clients (role === 'user')
      const filtered = (data || []).filter((u: User) => u.role === 'user');
      setClients(filtered);
    } catch (err: any) {
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === 'superadmin' && !selectedTenantId) {
        // Optionally fetch all or wait. Let's fetch all for now if backend supports it, 
        // but typically we want to filter by tenant to avoid huge lists.
        // For now, let's just fetch default (which might be "all" for superadmin).
        fetchClients(); 
    } else if (effectiveTenantId) {
        fetchClients();
    }
  }, [effectiveTenantId, role, selectedTenantId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const url = editingUserId ? `/users/${editingUserId}` : "/users";
      const method = editingUserId ? "PUT" : "POST";
      
      // If creating/editing as superadmin, we might need to specify tenantId in body?
      // The backend 'createUser' takes tenantId from user (req.user.tenantId).
      // If superadmin, we might need a special endpoint or param.
      // 'createUserForTenant' exists in service but controller?
      // Controller 'create' uses `req.user.tenantId`.
      // If superadmin, `req.user.tenantId` is 'system'.
      // If we want to create for a specific tenant, we might need to handle that.
      // BUT, let's assume for now we are creating in the context of the logged in user OR the selected tenant?
      // Actually, standard `create` might not support passing `tenantId`.
      // Let's check `UsersController.create`.
      
      // Checking context: UsersService has `createUserForTenant`.
      // But standard POST /users might not expose it.
      // If superadmin wants to create a user for a tenant, we might need to use `createUserForTenant` logic or passing tenantId in body if allowed.
      // Let's assume standard behavior for now (created in current user's tenant).
      // If Superadmin, they are in 'system' tenant. They probably shouldn't create 'users' in system tenant usually.
      // They should probably switch to the tenant context?
      // But the Dashboard `fetchAPIWithAuth` sends the token.
      
      // Ideally, the backend should allow Superadmin to specify tenantId.
      // Let's proceed with standard payload and see. 
      // If I am superadmin and I selected a tenant, I probably want to create the user in that tenant.
      // Does POST /users accept tenantId?
      // I'll check `UsersController` later. For now, sending what we have.

      const payload: any = {
        firstName,
        lastName,
        email,
        phone,
        address,
        role: 'user', // Always user for Clients section
      };

      if (password) payload.password = password;
      if (editingUserId) {
        // For update
      }

      // If superadmin and selectedTenantId is set, maybe we can inject it?
      // Only if backend accepts it.
      if (role === 'superadmin' && selectedTenantId) {
          payload.tenantId = selectedTenantId;
      }

      await fetchAPIWithAuth(url, {
        method,
        body: JSON.stringify(payload),
      });

      setFormSuccess(editingUserId ? "Cliente actualizado" : "Cliente creado");
      setShowCreateForm(false);
      resetForm();
      fetchClients();
    } catch (err: any) {
      setFormError(err.message || 'Error al guardar');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUserId(user.id);
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setEmail(user.email);
    setPhone(user.phone || "");
    setAddress(user.address || "");
    setShowCreateForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('clients.delete_confirm'))) return;
    try {
      await fetchAPIWithAuth(`/users/${id}`, { method: 'DELETE' });
      setClients(clients.filter(c => c.id !== id));
    } catch (err: any) {
      alert(err.message || t('clients.delete_error'));
    }
  };

  return (
    <div className="mb-8 rounded-lg bg-white p-6 shadow">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-zinc-900">{t('clients.title')}</h3>
          <p className="mt-2 text-sm text-zinc-800">{t('clients.subtitle')}</p>
        </div>
        <button
          onClick={() => {
            setShowCreateForm(!showCreateForm);
            if (!showCreateForm) {
              resetForm();
            }
          }}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          {showCreateForm ? t('common.cancel') : t('clients.new_client')}
        </button>
      </div>

      {role === "superadmin" && (
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-md bg-zinc-50 p-3">
          <span className="text-xs font-medium text-zinc-700">{t('common.filter_by_tenant')}</span>
          <select
            value={selectedTenantId ?? ""}
            onChange={(e) => onTenantChange(e.target.value)}
            className="h-9 rounded-md border border-zinc-300 bg-white px-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
          >
            <option value="">{t('common.all_tenants')}</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>{t.name || t.id}</option>
            ))}
          </select>
        </div>
      )}

      <div className="mt-6 space-y-6">
        {showCreateForm && (
          <form className="grid gap-4 rounded-md border border-zinc-200 p-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-zinc-900">{t('clients.form_name')}</label>
              <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required className="h-9 rounded-md border border-zinc-400 px-2 text-sm" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-zinc-900">{t('clients.form_lastname')}</label>
              <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} required className="h-9 rounded-md border border-zinc-400 px-2 text-sm" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-zinc-900">{t('clients.form_email')}</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="h-9 rounded-md border border-zinc-400 px-2 text-sm" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-zinc-900">{t('clients.form_phone')}</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="h-9 rounded-md border border-zinc-400 px-2 text-sm" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-zinc-900">{t('clients.form_address')}</label>
              <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="h-9 rounded-md border border-zinc-400 px-2 text-sm" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-zinc-900">{t('clients.form_password')} {editingUserId && <span className="font-normal text-xs">{t('clients.form_optional')}</span>}</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required={!editingUserId} className="h-9 rounded-md border border-zinc-400 px-2 text-sm" />
            </div>

            <div className="md:col-span-2 flex items-center justify-end gap-3">
               <button type="button" onClick={resetForm} className="h-9 rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50">{t('clients.clean')}</button>
               <button type="submit" disabled={submitting} className="h-9 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50">
                 {submitting ? t('clients.saving') : editingUserId ? t('clients.save_changes') : t('clients.create_client')}
               </button>
            </div>
          </form>
        )}

        {formError && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md">{formError}</div>}
      {formSuccess && <div className="p-3 bg-emerald-50 text-emerald-700 text-sm rounded-md">{formSuccess}</div>}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-zinc-700">{t('clients.table_client')}</th>
              <th className="px-3 py-2 text-left font-medium text-zinc-700">{t('clients.table_email')}</th>
              <th className="px-3 py-2 text-left font-medium text-zinc-700">{t('clients.table_phone')}</th>
              <th className="px-3 py-2 text-left font-medium text-zinc-700">{t('clients.table_address')}</th>
              <th className="px-3 py-2 text-left font-medium text-zinc-700">{t('clients.table_status')}</th>
              <th className="px-3 py-2 text-left font-medium text-zinc-700">{t('clients.table_actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {loading ? (
              <tr><td colSpan={6} className="px-3 py-3 text-center">{t('common.loading')}</td></tr>
            ) : clients.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-3 text-center">{t('clients.no_clients')}</td></tr>
            ) : (
              clients.map(client => (
                <tr key={client.id}>
                  <td className="px-3 py-2 text-zinc-900 font-medium">{client.firstName} {client.lastName}</td>
                  <td className="px-3 py-2 text-zinc-700">{client.email}</td>
                  <td className="px-3 py-2 text-zinc-700">{client.phone || '-'}</td>
                  <td className="px-3 py-2 text-zinc-700">{client.address || '-'}</td>
                  <td className="px-3 py-2"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${client.isActive ? "bg-emerald-100 text-emerald-800" : "bg-zinc-100 text-zinc-700"}`}>{client.isActive ? t('clients.status_active') : t('clients.status_inactive')}</span></td>
                  <td className="px-3 py-2 flex items-center gap-2">
                    <button onClick={() => handleViewDetails(client)} className="text-zinc-600 hover:text-zinc-900 font-medium">{t('clients.details')}</button>
                    <button onClick={() => handleEdit(client)} className="text-blue-600 hover:text-blue-800 font-medium">{t('common.edit')}</button>
                    <button onClick={() => handleDelete(client.id)} className="text-red-600 hover:text-red-800 font-medium">{t('common.delete')}</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      </div>

      {viewingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-zinc-900">
                {viewingClient.firstName} {viewingClient.lastName}
              </h3>
              <button
                onClick={() => setViewingClient(null)}
                className="text-zinc-500 hover:text-zinc-700"
              >
                ✕
              </button>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 rounded-md bg-zinc-50 p-4 md:grid-cols-2">
              <div>
                <span className="block text-xs font-medium text-zinc-500">{t('clients.table_email')}</span>
                <span className="text-sm text-zinc-900">{viewingClient.email}</span>
              </div>
              <div>
                <span className="block text-xs font-medium text-zinc-500">{t('clients.table_phone')}</span>
                <span className="text-sm text-zinc-900">{viewingClient.phone || '-'}</span>
              </div>
              <div className="md:col-span-2">
                <span className="block text-xs font-medium text-zinc-500">{t('clients.table_address')}</span>
                <span className="text-sm text-zinc-900">{viewingClient.address || '-'}</span>
              </div>
            </div>

            <div>
              <div className="mb-4 flex gap-4 border-b border-zinc-200">
                <button
                  className={`pb-2 text-sm font-medium ${activeTab === 'orders' ? 'border-b-2 border-zinc-900 text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}
                  onClick={() => setActiveTab('orders')}
                >
                  {t('clients.history_orders')}
                </button>
                <button
                  className={`pb-2 text-sm font-medium ${activeTab === 'appointments' ? 'border-b-2 border-zinc-900 text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}
                  onClick={() => setActiveTab('appointments')}
                >
                  {t('clients.history_appointments')}
                </button>
              </div>

              {activeTab === 'orders' && (
                <>
                  {loadingOrders ? (
                    <div className="py-4 text-center text-zinc-500">{t('clients.loading_orders')}</div>
                  ) : clientOrders.length === 0 ? (
                    <div className="rounded-md border border-dashed border-zinc-300 py-8 text-center text-zinc-500">
                      {t('clients.no_orders_client')}
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-lg border border-zinc-200">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-zinc-50">
                          <tr>
                            <th className="px-4 py-2 font-medium text-zinc-700">{t('clients.order_id')}</th>
                            <th className="px-4 py-2 font-medium text-zinc-700">{t('clients.order_date')}</th>
                            <th className="px-4 py-2 font-medium text-zinc-700">{t('clients.order_status')}</th>
                            <th className="px-4 py-2 font-medium text-zinc-700 text-right">{t('clients.order_total')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                          {clientOrders.map((order) => (
                            <tr key={order.id}>
                              <td className="px-4 py-2 font-medium text-zinc-900">#{order.id.slice(0, 8)}</td>
                              <td className="px-4 py-2 text-zinc-600">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-2">
                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                  order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {order.status === 'completed' ? t('clients.status_completed') :
                                  order.status === 'cancelled' ? t('clients.status_cancelled') :
                                  t('clients.status_pending')}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-right font-medium text-zinc-900">
                                {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(order.total)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'appointments' && (
                <>
                  {loadingAppointments ? (
                    <div className="py-4 text-center text-zinc-500">{t('clients.loading_appointments')}</div>
                  ) : clientAppointments.length === 0 ? (
                    <div className="rounded-md border border-dashed border-zinc-300 py-8 text-center text-zinc-500">
                      {t('clients.no_appointments_client')}
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-lg border border-zinc-200">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-zinc-50">
                          <tr>
                            <th className="px-4 py-2 font-medium text-zinc-700">{t('clients.order_date')}</th>
                            <th className="px-4 py-2 font-medium text-zinc-700">{t('agenda.service')}</th>
                            <th className="px-4 py-2 font-medium text-zinc-700">{t('clients.order_status')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                          {clientAppointments.map((appt) => (
                            <tr key={appt.id}>
                              <td className="px-4 py-2 text-zinc-600">
                                {new Date(appt.dateTime).toLocaleString()}
                              </td>
                              <td className="px-4 py-2 font-medium text-zinc-900">
                                {appt.service?.name || t('agenda.general_service')}
                              </td>
                              <td className="px-4 py-2">
                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                  appt.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                  appt.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {appt.status === 'confirmed' ? t('agenda.status_confirmed') :
                                   appt.status === 'cancelled' ? t('agenda.status_cancelled') :
                                   t('agenda.status_pending')}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
