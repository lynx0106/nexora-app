import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchAPIWithAuth } from '../lib/api';
import { showToast } from '../lib/toast';

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

interface ClientOrderSummary {
  id: string;
  createdAt: string;
  status?: string;
  total?: number;
}

interface ClientAppointmentSummary {
  id: string;
  dateTime: string;
  status?: string;
  service?: { name: string };
}

interface ClientsSectionProps {
  role: string | null;
  tenantId: string;
  selectedTenantId: string | null;
  onTenantChange: (id: string) => void;
  tenants: { id: string; name: string }[];
}

export function ClientsSection({ role, tenantId, selectedTenantId, onTenantChange, tenants }: ClientsSectionProps) {
  const { t } = useTranslation();
  const [clients, setClients] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [, setError] = useState<string | null>(null);

  // Form State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [userRole, setUserRole] = useState<string>("user");
  
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
    setUserRole("user");
    setFormError(null);
    setFormSuccess(null);
  };

  // Client Details & Orders State
  const [viewingClient, setViewingClient] = useState<User | null>(null);
  const [clientOrders, setClientOrders] = useState<ClientOrderSummary[]>([]);
  const [clientAppointments, setClientAppointments] = useState<ClientAppointmentSummary[]>([]);
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
        .then((data: ClientOrderSummary[]) => setClientOrders(data || []))
        .catch(err => console.error(err))
        .finally(() => setLoadingOrders(false));

    // Fetch Appointments
    setLoadingAppointments(true);
    setClientAppointments([]);
    fetchAPIWithAuth(`/appointments/tenant/${effectiveTenantId}?userId=${client.id}`)
        .then((data: ClientAppointmentSummary[]) => setClientAppointments(data || []))
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
      // Filter out admins and superadmins (clients are regular users: 'client' or no admin role)
      const filtered = (data || []).filter((u: User) => 
        u.role !== 'admin' && u.role !== 'superadmin'
      );
      setClients(filtered);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === 'superadmin' && !selectedTenantId) {
        fetchClients(); 
    } else if (effectiveTenantId) {
        fetchClients();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchClients captures latest state
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

      const payload: Record<string, unknown> = {
        firstName,
        lastName,
        email,
        phone,
        address,
        role: userRole,
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
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error al guardar');
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
    setUserRole(user.role || "user");
    setShowCreateForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('clients.delete_confirm'))) return;
    try {
      await fetchAPIWithAuth(`/users/${id}`, { method: 'DELETE' });
      setClients(clients.filter(c => c.id !== id));
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : t('clients.delete_error'), 'error');
    }
  };

  return (
    <div className="mb-8 rounded-lg bg-slate-900/70 border border-slate-800 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-slate-100">{t('clients.title')}</h3>
          <p className="mt-2 text-sm text-slate-400">{t('clients.subtitle')}</p>
        </div>
        <button
          onClick={() => {
            setShowCreateForm(!showCreateForm);
            if (!showCreateForm) {
              resetForm();
            }
          }}
          className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-700 transition-colors"
        >
          {showCreateForm ? t('common.cancel') : t('clients.new_client')}
        </button>
      </div>

      {role === "superadmin" && (
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-md bg-slate-800/50 p-3">
          <span className="text-xs font-medium text-slate-300">{t('common.filter_by_tenant')}</span>
          <select
            value={selectedTenantId ?? ""}
            onChange={(e) => onTenantChange(e.target.value)}
            className="h-9 rounded-md border border-slate-600 bg-slate-800 px-2 text-sm text-slate-100 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
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
          <form className="grid gap-4 rounded-md border border-slate-700 bg-slate-800/30 p-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-slate-200">{t('clients.form_name')}</label>
              <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required className="ds-input h-9 rounded-md border border-slate-600 bg-slate-800 px-2 text-sm text-slate-100" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-slate-200">{t('clients.form_lastname')}</label>
              <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} required className="ds-input h-9 rounded-md border border-slate-600 bg-slate-800 px-2 text-sm text-slate-100" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-slate-200">{t('clients.form_email')}</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="ds-input h-9 rounded-md border border-slate-600 bg-slate-800 px-2 text-sm text-slate-100" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-slate-200">{t('clients.form_phone')}</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="ds-input h-9 rounded-md border border-slate-600 bg-slate-800 px-2 text-sm text-slate-100" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-slate-200">{t('clients.form_address')}</label>
              <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="ds-input h-9 rounded-md border border-slate-600 bg-slate-800 px-2 text-sm text-slate-100" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-slate-200">{t('clients.form_password')} {editingUserId && <span className="font-normal text-xs text-slate-400">{t('clients.form_optional')}</span>}</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required={!editingUserId} className="ds-input h-9 rounded-md border border-slate-600 bg-slate-800 px-2 text-sm text-slate-100" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-slate-200">Rol del usuario</label>
              <select
                value={userRole}
                onChange={e => setUserRole(e.target.value)}
                className="ds-input h-9 rounded-md border border-slate-600 bg-slate-800 px-2 text-sm text-slate-100"
              >
                <option value="user">Cliente (Usuario del sistema)</option>
                <option value="client">Cliente Externo</option>
                <option value="employee">Empleado</option>
              </select>
            </div>

            <div className="md:col-span-2 flex items-center justify-end gap-3">
               <button type="button" onClick={resetForm} className="h-9 rounded-md border border-slate-600 px-4 text-sm font-medium text-slate-300 hover:bg-slate-700">{t('clients.clean')}</button>
               <button type="submit" disabled={submitting} className="h-9 rounded-md bg-teal-600 px-4 text-sm font-medium text-white hover:bg-teal-500 disabled:opacity-50">
                 {submitting ? t('clients.saving') : editingUserId ? t('clients.save_changes') : t('clients.create_client')}
               </button>
            </div>
          </form>
        )}

        {formError && <div className="p-3 bg-red-900/40 text-red-300 text-sm rounded-md border border-red-800">{formError}</div>}
      {formSuccess && <div className="p-3 bg-emerald-900/40 text-emerald-300 text-sm rounded-md border border-emerald-800">{formSuccess}</div>}

      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <table className="min-w-full divide-y divide-slate-700 text-sm">
          <thead className="bg-slate-800/80">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-slate-300">{t('clients.table_client')}</th>
              <th className="px-3 py-2 text-left font-medium text-slate-300">{t('clients.table_email')}</th>
              <th className="px-3 py-2 text-left font-medium text-slate-300">{t('clients.table_phone')}</th>
              <th className="px-3 py-2 text-left font-medium text-slate-300">{t('clients.table_address')}</th>
              <th className="px-3 py-2 text-left font-medium text-slate-300">{t('clients.table_status')}</th>
              <th className="px-3 py-2 text-left font-medium text-slate-300">{t('clients.table_actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {loading ? (
              <tr><td colSpan={6} className="px-3 py-3 text-center text-slate-400">{t('common.loading')}</td></tr>
            ) : clients.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-3 text-center text-slate-400">{t('clients.no_clients')}</td></tr>
            ) : (
              clients.map(client => (
                <tr key={client.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-3 py-2 text-slate-100 font-medium">{client.firstName} {client.lastName}</td>
                  <td className="px-3 py-2 text-slate-300">{client.email}</td>
                  <td className="px-3 py-2 text-slate-300">{client.phone || '-'}</td>
                  <td className="px-3 py-2 text-slate-300">{client.address || '-'}</td>
                  <td className="px-3 py-2"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${client.isActive ? "bg-emerald-900/40 text-emerald-300" : "bg-slate-700 text-slate-400"}`}>{client.isActive ? t('clients.status_active') : t('clients.status_inactive')}</span></td>
                  <td className="px-3 py-2 flex items-center gap-2">
                    <button onClick={() => handleViewDetails(client)} className="text-slate-400 hover:text-slate-100 font-medium">{t('clients.details')}</button>
                    <button onClick={() => handleEdit(client)} className="text-teal-400 hover:text-teal-300 font-medium">{t('common.edit')}</button>
                    <button onClick={() => handleDelete(client.id)} className="text-red-400 hover:text-red-300 font-medium">{t('common.delete')}</button>
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
          <div className="w-full max-w-2xl rounded-lg bg-slate-900 border border-slate-700 p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-100">
                {viewingClient.firstName} {viewingClient.lastName}
              </h3>
              <button
                onClick={() => setViewingClient(null)}
                className="text-slate-400 hover:text-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 rounded-md bg-slate-800/50 p-4 md:grid-cols-2">
              <div>
                <span className="block text-xs font-medium text-slate-500">{t('clients.table_email')}</span>
                <span className="text-sm text-slate-100">{viewingClient.email}</span>
              </div>
              <div>
                <span className="block text-xs font-medium text-slate-500">{t('clients.table_phone')}</span>
                <span className="text-sm text-slate-100">{viewingClient.phone || '-'}</span>
              </div>
              <div className="md:col-span-2">
                <span className="block text-xs font-medium text-slate-500">{t('clients.table_address')}</span>
                <span className="text-sm text-slate-100">{viewingClient.address || '-'}</span>
              </div>
            </div>

            <div>
              <div className="mb-4 flex gap-4 border-b border-slate-700">
                <button
                  className={`pb-2 text-sm font-medium ${activeTab === 'orders' ? 'border-b-2 border-teal-500 text-teal-400' : 'text-slate-500 hover:text-slate-300'}`}
                  onClick={() => setActiveTab('orders')}
                >
                  {t('clients.history_orders')}
                </button>
                <button
                  className={`pb-2 text-sm font-medium ${activeTab === 'appointments' ? 'border-b-2 border-teal-500 text-teal-400' : 'text-slate-500 hover:text-slate-300'}`}
                  onClick={() => setActiveTab('appointments')}
                >
                  {t('clients.history_appointments')}
                </button>
              </div>

              {activeTab === 'orders' && (
                <>
                  {loadingOrders ? (
                    <div className="py-4 text-center text-slate-400">{t('clients.loading_orders')}</div>
                  ) : clientOrders.length === 0 ? (
                    <div className="rounded-md border border-dashed border-slate-600 py-8 text-center text-slate-400">
                      {t('clients.no_orders_client')}
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-lg border border-slate-700">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-800/80">
                          <tr>
                            <th className="px-4 py-2 font-medium text-slate-300">{t('clients.order_id')}</th>
                            <th className="px-4 py-2 font-medium text-slate-300">{t('clients.order_date')}</th>
                            <th className="px-4 py-2 font-medium text-slate-300">{t('clients.order_status')}</th>
                            <th className="px-4 py-2 font-medium text-slate-300 text-right">{t('clients.order_total')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                          {clientOrders.map((order) => (
                            <tr key={order.id} className="hover:bg-slate-800/30">
                              <td className="px-4 py-2 font-medium text-slate-100">#{order.id.slice(0, 8)}</td>
                              <td className="px-4 py-2 text-slate-400">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-2">
                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                  order.status === 'completed' ? 'bg-emerald-900/40 text-emerald-300' :
                                  order.status === 'cancelled' ? 'bg-red-900/40 text-red-300' :
                                  'bg-amber-900/40 text-amber-300'
                                }`}>
                                  {order.status === 'completed' ? t('clients.status_completed') :
                                  order.status === 'cancelled' ? t('clients.status_cancelled') :
                                  t('clients.status_pending')}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-right font-medium text-slate-100">
                                {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(order.total ?? 0)}
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
                    <div className="py-4 text-center text-slate-400">{t('clients.loading_appointments')}</div>
                  ) : clientAppointments.length === 0 ? (
                    <div className="rounded-md border border-dashed border-slate-600 py-8 text-center text-slate-400">
                      {t('clients.no_appointments_client')}
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-lg border border-slate-700">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-800/80">
                          <tr>
                            <th className="px-4 py-2 font-medium text-slate-300">{t('clients.order_date')}</th>
                            <th className="px-4 py-2 font-medium text-slate-300">{t('agenda.service')}</th>
                            <th className="px-4 py-2 font-medium text-slate-300">{t('clients.order_status')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                          {clientAppointments.map((appt) => (
                            <tr key={appt.id} className="hover:bg-slate-800/30">
                              <td className="px-4 py-2 text-slate-400">
                                {new Date(appt.dateTime).toLocaleString()}
                              </td>
                              <td className="px-4 py-2 font-medium text-slate-100">
                                {appt.service?.name || t('agenda.general_service')}
                              </td>
                              <td className="px-4 py-2">
                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                  appt.status === 'confirmed' ? 'bg-emerald-900/40 text-emerald-300' :
                                  appt.status === 'cancelled' ? 'bg-red-900/40 text-red-300' :
                                  'bg-amber-900/40 text-amber-300'
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
