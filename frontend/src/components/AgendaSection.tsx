import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { appointmentsService, Appointment } from "../services/appointments";
import { fetchAPIWithAuth } from "../lib/api";
import { showToast } from "../lib/toast";
import EmptyState from "./ui/EmptyState";
import Skeleton from "./ui/Skeleton";

interface TenantSummaryItem {
  tenantId: string;
  name?: string;
  sector?: string;
  totalUsers?: number;
}

interface ProductItem {
  id: string;
  name: string;
  price: number;
}

/** Minimal shape for client/doctor dropdown options (API returns more fields including role) */
interface UserOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
}

interface AgendaSectionProps {
  tenantId: string;
  role: string;
  currentUserId: string;
  tenantSector?: string | null;
  sectorFilter?: string;
}

export function AgendaSection({ tenantId, role, currentUserId, tenantSector: initialTenantSector, sectorFilter }: AgendaSectionProps) {
  const { t } = useTranslation();
  // Estado para el tenant seleccionado (relevante para Superadmin)
  const [selectedTenantId, setSelectedTenantId] = useState(tenantId);
  const [tenants, setTenants] = useState<TenantSummaryItem[]>([]);

  // Calculate current sector based on selected tenant from the list, or fallback to prop
  const currentTenantData = tenants.find(t => t.tenantId === selectedTenantId);
  const effectiveSector = currentTenantData ? currentTenantData.sector : initialTenantSector;
  const isRestaurant = (effectiveSector || '').toLowerCase().includes('restaurante');
  const itemLabel = isRestaurant ? t('agenda.item_label_restaurant') : t('agenda.item_label');

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [doctors, setDoctors] = useState<UserOption[]>([]);
  const [clients, setClients] = useState<UserOption[]>([]);
  const [services, setServices] = useState<ProductItem[]>([]);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  
  const [newAppointment, setNewAppointment] = useState({
    dateTime: "",
    doctorId: "",
    clientId: "",
    serviceId: "",
    notes: "",
    pax: 1,
    occasion: "",
    tenantId: "", // Added tenantId to state
  });

  // Effect to sync tenantId when selectedTenantId changes, but only for new/empty forms
  useEffect(() => {
     if (!showCreateForm) {
        setNewAppointment(prev => ({ ...prev, tenantId: selectedTenantId || "" }));
     }
  }, [selectedTenantId, showCreateForm]);

  const [showCreateClientForm, setShowCreateClientForm] = useState(false);
  const [newClient, setNewClient] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [createClientLoading, setCreateClientLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Cargar lista de tenants si es superadmin
  useEffect(() => {
    if (role === 'superadmin') {
      // Si nos pasan un tenantId explícito (diferente de system), usarlo.
      if (tenantId && tenantId !== 'system') {
        setSelectedTenantId(tenantId);
      }

      fetchAPIWithAuth('/users/tenants/summary')
        .then(data => {
           let filteredTenants = data;
           // Filter tenants dropdown based on sectorFilter if provided
           if (sectorFilter) {
               filteredTenants = (data as TenantSummaryItem[]).filter((t) => {
                   const s = (t.sector || '').toLowerCase();
                   if (sectorFilter === 'restaurante') return s.includes('restaurante');
                   return !s.includes('restaurante');
               });
           }
           setTenants(filteredTenants);
           
           const hasValidProp = tenantId && tenantId !== 'system';
           // Si el tenantId actual es "system" o vacío, seleccionar el primero disponible que no sea system si es posible
           // Solo si no tenemos un prop válido.
           // UPDATED: Allow empty selection for "All" view if desired, but default behavior:
           // If user wants to see "All" by default, we can leave selectedTenantId empty.
           // However, existing logic tried to select first real tenant.
           // Let's NOT force selection if we want to support "All".
           // But if the user expects to see something immediately, maybe "All" is better than "First"?
           // Let's stick to: If no valid prop, default to "" (All) if we want global view.
           if (!hasValidProp && (!selectedTenantId || selectedTenantId === 'system')) {
             setSelectedTenantId(""); // Default to "All"
           }
        })
        .catch(err => console.error("Error cargando tenants", err));
    } else {
      setSelectedTenantId(tenantId);
    }
  }, [role, tenantId]);

  useEffect(() => {
    // If superadmin and empty selectedTenantId, we load global data.
    // If regular user, we need tenantId.
    if (role === 'superadmin' || selectedTenantId) {
      loadData(selectedTenantId);
    }
  }, [selectedTenantId, role]);

  useEffect(() => {
    if (role === 'user' && currentUserId) {
      setNewAppointment(prev => ({ ...prev, clientId: currentUserId }));
    }
  }, [role, currentUserId]);

  if (!tenantId && role !== 'superadmin') {
      return <div className="text-slate-400 text-center py-8">{t('agenda.no_tenant_assigned')}</div>;
  }

  async function loadData(tid: string) {
    setLoading(true);
    setError(null);
    try {
      // 1. Cargar citas
      let appts: Appointment[] = [];
      if (role === 'superadmin' && !tid) {
         appts = await fetchAPIWithAuth('/appointments/all');
         
         if (sectorFilter) {
             appts = appts.filter((a) => {
                 const s = (a.tenant?.sector || '').toLowerCase();
                 if (sectorFilter === 'restaurante') return s.includes('restaurante');
                 return !s.includes('restaurante');
             });
         }
      } else {
         appts = await appointmentsService.findAllByTenant(tid, role === 'user' ? currentUserId : undefined);
      }
      setAppointments(appts);

      // 2. Cargar recursos para el formulario
      try {
        let usersData: UserOption[] = [];
        let productsData: ProductItem[] = [];

        // Only fetch resources if a tenant is selected
        if (tid) {
            if (role === 'user') {
                // Usuarios solo cargan productos (servicios), no lista de usuarios
                productsData = await fetchAPIWithAuth(`/products/tenant/${tid}`);
            } else {
                const [u, p] = await Promise.all([
                    fetchAPIWithAuth(`/users/tenant/${tid}`),
                    fetchAPIWithAuth(`/products/tenant/${tid}`)
                ]);
                usersData = u as UserOption[];
                productsData = p as ProductItem[];
            }
        }

        const loadedDoctors = usersData.filter((u) => (u.role || '').toLowerCase() === 'doctor');
        const loadedClients = usersData.filter((u) => (u.role || '').toLowerCase() === 'user');
        
        setDoctors(loadedDoctors);
        setClients(loadedClients);
        setServices(productsData);

      } catch (e: unknown) {
        console.error("Error cargando recursos auxiliares", e);
        setError(`Error cargando recursos: ${e instanceof Error ? e.message : String(e)}`);
      }

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al cargar la agenda");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateClient(e: React.FormEvent) {
    e.preventDefault();
    setCreateClientLoading(true);
    try {
      const createdUser = await fetchAPIWithAuth('/users', {
        method: 'POST',
        body: JSON.stringify({
           ...newClient,
           tenantId: selectedTenantId,
           role: 'user',
           generateTempPassword: true,
        })
      }) as { id: string; firstName: string; lastName: string; email: string; temporaryPassword?: string };
      
      setClients([...clients, { id: createdUser.id, firstName: createdUser.firstName, lastName: createdUser.lastName, email: createdUser.email }]);
      setNewAppointment({ ...newAppointment, clientId: createdUser.id });
      setShowCreateClientForm(false);
      setNewClient({ firstName: "", lastName: "", email: "", phone: "" });
      const tempPw = createdUser.temporaryPassword;
      showToast(
        tempPw
          ? `${t('agenda.alerts.client_created')}: ${createdUser.firstName} ${createdUser.lastName}. ${t('agenda.alerts.temp_password')}: ${tempPw}`
          : `${t('agenda.alerts.client_created')}: ${createdUser.firstName} ${createdUser.lastName}`,
        'success'
      );

    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : t('agenda.alerts.create_error'), 'error');
    } finally {
      setCreateClientLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCreateLoading(true);
    try {
      // Clean up empty strings for optional fields
      const payload = {
         ...newAppointment,
         tenantId: newAppointment.tenantId || selectedTenantId, // Use form tenantId or selected
         doctorId: newAppointment.doctorId || undefined, // Send undefined if empty
      };

      if (!payload.tenantId) {
        showToast(t('agenda.alerts.select_tenant'), 'error');
        setCreateLoading(false);
        return;
      }

      if (editingId) {
        await appointmentsService.update(editingId, payload);
        setEditingId(null);
      } else {
        await appointmentsService.create(payload);
      }
      setShowCreateForm(false);
      // Reset form
      setNewAppointment({ dateTime: "", doctorId: "", clientId: "", serviceId: "", notes: "", pax: 1, occasion: "", tenantId: selectedTenantId || "" });
      loadData(selectedTenantId); 
    } catch (err: unknown) {
      const actionError = editingId ? t('agenda.alerts.update_error') : t('agenda.alerts.create_error');
      showToast(err instanceof Error ? err.message : `${actionError} ${itemLabel}`, 'error');
    } finally {
      setCreateLoading(false);
    }
  }

  function handleEdit(appt: Appointment) {
    setEditingId(appt.id);
    setNewAppointment({
      dateTime: appt.dateTime.slice(0, 16), // Format for datetime-local input
      doctorId: appt.doctorId,
      clientId: appt.clientId,
      serviceId: appt.serviceId,
      notes: appt.notes || "",
      pax: appt.pax ?? 1,
      occasion: appt.occasion || "",
      tenantId: appt.tenantId,
    });
    setShowCreateForm(true);
  }

  async function handleStatusChange(id: string, newStatus: string) {
    try {
        await appointmentsService.updateStatus(id, newStatus);
        setAppointments(appointments.map(a => a.id === id ? { ...a, status: newStatus } : a));
    } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : t('agenda.alerts.status_update_error'), 'error');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t('agenda.alerts.delete_confirm'))) return;
    try {
        await appointmentsService.delete(id);
        setAppointments(appointments.filter(a => a.id !== id));
    } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : t('agenda.alerts.delete_error'), 'error');
    }
  }

  if (loading && appointments.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="ds-panel p-6">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold text-slate-100">
            {isRestaurant ? t('agenda.title_restaurant') : t('agenda.title_service')}
          </h2>
          {role === 'superadmin' && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">{t('agenda.viewing_tenant')}</span>
              <select
                className="rounded-md border border-slate-600 px-2 py-1 text-sm font-medium"
                value={selectedTenantId}
                onChange={(e) => setSelectedTenantId(e.target.value)}
              >
                <option value="">{t('agenda.all_tenants')}</option>
                {tenants.map(t => (
                  <option key={t.tenantId} value={t.tenantId}>
                    {t.name || t.tenantId} ({t.totalUsers} us.) - {t.sector || 'N/A'}
                  </option>
                ))}
              </select>
              <div className="text-xs text-slate-400">
                 {selectedTenantId ? `(ID: ${selectedTenantId} | Docs: ${doctors.length}, Servs: ${services.length}, Clis: ${clients.length})` : t('agenda.global_view')}
              </div>
            </div>
          )}
        </div>
        <button
          onClick={() => {
             setShowCreateForm(!showCreateForm);
             if (!showCreateForm) {
                // When opening, reset form
                setEditingId(null);
                setNewAppointment({ 
                    dateTime: "", 
                    doctorId: "", 
                    clientId: "", 
                    serviceId: "", 
                    notes: "", 
                    pax: 1, 
                    occasion: "", 
                    tenantId: selectedTenantId || "" 
                });
             }
          }}
          className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-500"
        >
          {showCreateForm ? t('common.cancel') : `${t('common.create')} ${itemLabel}`}
        </button>
      </div>

      {showCreateForm && (
        <form onSubmit={handleSubmit} className="rounded-lg border border-slate-700 bg-slate-800 p-6 shadow-sm space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {role !== 'user' && (
            <div>
              <label className="block text-sm font-medium text-slate-300">{t('agenda.client')}</label>
              <div className="flex gap-2">
                <select
                  required
                  className="mt-1 block w-full rounded-md border border-slate-600 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  value={newAppointment.clientId}
                  onChange={(e) => setNewAppointment({...newAppointment, clientId: e.target.value})}
                >
                  <option value="">{t('common.search')} {t('agenda.client')}...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.firstName} {c.lastName} ({c.email})</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowCreateClientForm(true)}
                  className="mt-1 rounded-md bg-slate-700 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-600 whitespace-nowrap"
                >
                  + {t('common.create')}
                </button>
              </div>
            </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300">
                {isRestaurant ? t('agenda.assign_staff_optional') : t('agenda.doctor')}
              </label>
              <select
                required={!isRestaurant}
                className="mt-1 block w-full rounded-md border border-slate-600 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                value={newAppointment.doctorId}
                onChange={(e) => setNewAppointment({...newAppointment, doctorId: e.target.value})}
              >
                <option value="">{isRestaurant ? t('agenda.unassigned') : t('common.search') + ' ' + t('agenda.doctor') + '...'}</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">
                {isRestaurant ? t('products.menu_title') : t('agenda.service')}
              </label>
              <select
                required
                className="mt-1 block w-full rounded-md border border-slate-600 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                value={newAppointment.serviceId}
                onChange={(e) => setNewAppointment({...newAppointment, serviceId: e.target.value})}
              >
                <option value="">{isRestaurant ? 'Seleccionar opción...' : t('common.search') + ' ' + t('agenda.service') + '...'}</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.name} - ${s.price}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">{t('agenda.date_time')}</label>
              <input
                type="datetime-local"
                required
                className="mt-1 block w-full rounded-md border border-slate-600 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                value={newAppointment.dateTime}
                onChange={(e) => setNewAppointment({...newAppointment, dateTime: e.target.value})}
              />
            </div>

            {isRestaurant && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-300">{t('agenda.pax')}</label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="mt-1 block w-full rounded-md border border-slate-600 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    value={newAppointment.pax}
                    onChange={(e) => setNewAppointment({...newAppointment, pax: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300">{t('agenda.occasion')}</label>
                  <select
                    className="mt-1 block w-full rounded-md border border-slate-600 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    value={newAppointment.occasion}
                    onChange={(e) => setNewAppointment({...newAppointment, occasion: e.target.value})}
                  >
                    <option value="">{t('agenda.none_casual')}</option>
                    <option value="Cumpleaños">{t('agenda.occasions.birthday')}</option>
                    <option value="Aniversario">{t('agenda.occasions.anniversary')}</option>
                    <option value="Reunión Familiar">{t('agenda.occasions.family_gathering')}</option>
                    <option value="Reunión Trabajo">{t('agenda.occasions.work_meeting')}</option>
                    <option value="Reunión Sorpresa">{t('agenda.occasions.surprise_party')}</option>
                    <option value="Otro">{t('agenda.occasions.other')}</option>
                  </select>
                </div>
              </>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300">{t('agenda.notes')}</label>
            <textarea
              className="mt-1 block w-full rounded-md border border-slate-600 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              rows={2}
              value={newAppointment.notes}
              onChange={(e) => setNewAppointment({...newAppointment, notes: e.target.value})}
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={createLoading}
              className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-500 disabled:opacity-50"
            >
              {createLoading ? t('common.loading') : `${t('common.save')} ${itemLabel}`}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-700 bg-slate-800 shadow-sm">
        <table className="min-w-full divide-y divide-slate-700">
          <thead className="bg-slate-800/80">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">{t('agenda.date_time')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">{t('agenda.client')}</th>
              {isRestaurant && (
                 <>
                   <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">{t('agenda.pax')}</th>
                   <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">{t('agenda.occasion')}</th>
                 </>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">{t('agenda.service')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">{t('agenda.doctor')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">{t('agenda.status')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700 bg-slate-800">
            {appointments.length === 0 ? (
              <tr>
                <td colSpan={isRestaurant ? 8 : 6} className="px-6 py-8 text-center text-sm text-slate-400">
                  <EmptyState
                    titulo={`No hay ${itemLabel.toLowerCase()}s programadas`}
                    descripcion={t('agenda.create_first') || t('common.create')}
                  />
                </td>
              </tr>
            ) : (
              appointments.map((appt) => (
                <tr key={appt.id} className="hover:bg-slate-800/50">
                  {role === 'superadmin' && !selectedTenantId && (
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-100">
                       {appt.tenant?.name || appt.tenantId}
                       {appt.tenant?.sector ? <span className="ml-1 text-xs text-slate-400">({appt.tenant.sector})</span> : ''}
                    </td>
                  )}
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-100">
                    {new Date(appt.dateTime).toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-100">
                    {appt.client ? `${appt.client.firstName} ${appt.client.lastName}` : 'Cliente eliminado'}
                  </td>
                  {isRestaurant && (
                    <>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-100">
                        {appt.pax ?? '-'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-100">
                        {appt.occasion ?? '-'}
                      </td>
                    </>
                  )}
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-100">
                    {appt.service ? appt.service.name : 'Servicio eliminado'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-400">
                    {appt.doctor ? `${appt.doctor.firstName} ${appt.doctor.lastName}` : 'N/A'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                      appt.status === 'confirmed' ? 'bg-emerald-900/40 text-emerald-300' :
                      appt.status === 'pending' ? 'bg-amber-900/40 text-amber-300' :
                      'bg-slate-700 text-slate-300'
                    }`}>
                      {appt.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-400">
                    <div className="flex items-center gap-2">
                        {role !== 'user' ? (
                        <>
                        <select
                            value={appt.status}
                            onChange={(e) => handleStatusChange(appt.id, e.target.value)}
                            className="rounded-md border-slate-600 py-1 pl-2 pr-6 text-xs focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                        >
                            <option value="pending">Pendiente</option>
                            <option value="confirmed">Confirmada</option>
                            <option value="completed">Completada</option>
                            <option value="cancelled">Cancelada</option>
                        </select>
                        <button
                            onClick={() => handleDelete(appt.id)}
                            className="text-red-400 hover:text-red-300 text-xs font-medium"
                        >
                            Eliminar
                        </button>
                        </>
                        ) : (
                          appt.status === 'pending' || appt.status === 'confirmed' ? (
                             <button
                                onClick={() => handleStatusChange(appt.id, 'cancelled')}
                                className="text-red-400 hover:text-red-300 text-xs font-medium"
                            >
                                Cancelar {itemLabel}
                            </button>
                          ) : null
                        )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Modal de Nuevo Cliente */}
      {showCreateClientForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-slate-800 p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-medium text-slate-100">Nuevo Cliente</h3>
            <form onSubmit={handleCreateClient} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300">Nombre</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border border-slate-600 px-3 py-2 text-sm"
                  value={newClient.firstName}
                  onChange={(e) => setNewClient({...newClient, firstName: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">Apellido</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border border-slate-600 px-3 py-2 text-sm"
                  value={newClient.lastName}
                  onChange={(e) => setNewClient({...newClient, lastName: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">Email</label>
                <input
                  type="email"
                  required
                  className="mt-1 block w-full rounded-md border border-slate-600 px-3 py-2 text-sm"
                  value={newClient.email}
                  onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">Teléfono</label>
                <input
                  type="tel"
                  className="mt-1 block w-full rounded-md border border-slate-600 px-3 py-2 text-sm"
                  value={newClient.phone}
                  onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateClientForm(false)}
                  className="rounded-md border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createClientLoading}
                  className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-500 disabled:opacity-50"
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
