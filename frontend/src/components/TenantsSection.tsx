import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchAPIWithAuth } from '../lib/api';

interface TenantSummary {
  tenantId: string;
  totalUsers: number;
  activeUsers: number;
}

interface TenantsSectionProps {
  tenants: TenantSummary[];
  loading: boolean;
  error: string | null;
  onManage: (tenantId: string) => void;
  onRefresh: () => void;
}

export function TenantsSection({ tenants, loading, error, onManage, onRefresh }: TenantsSectionProps) {
  const { t } = useTranslation();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  // Form states
  const [newTenantId, setNewTenantId] = useState("");
  const [newTenantName, setNewTenantName] = useState("");
  const [newTenantCurrency, setNewTenantCurrency] = useState("USD");
  const [newTenantSector, setNewTenantSector] = useState("");
  const [adminFirstName, setAdminFirstName] = useState("");
  const [adminLastName, setAdminLastName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(null);
    setCreating(true);

    try {
      await fetchAPIWithAuth("/tenants", {
        method: "POST",
        body: JSON.stringify({
          tenantId: newTenantId,
          name: newTenantName,
          sector: newTenantSector || undefined,
          currency: newTenantCurrency,
          // Send flat structure as expected by CreateTenantWithAdminDto in backend
          adminFirstName: adminFirstName,
          adminLastName: adminLastName,
          adminEmail: adminEmail,
          adminPassword: adminPassword,
        }),
      });

      setCreateSuccess(`Empresa ${newTenantName} creada exitosamente.`);
      setNewTenantId("");
      setNewTenantName("");
      setNewTenantSector("");
      setAdminFirstName("");
      setAdminLastName("");
      setAdminEmail("");
      setAdminPassword("");
      
      onRefresh(); // Refresh the list
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Error al crear empresa");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-200">{t('tenants.title')}</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600"
        >
          {showCreateForm ? t('tenants.cancel') : t('tenants.new_tenant')}
        </button>
      </div>

      {showCreateForm && (
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-medium text-slate-200">{t('tenants.register_title')}</h3>
          {createError && (
            <div className="mb-4 rounded-md bg-red-900/30 p-3 text-sm text-red-400">{createError}</div>
          )}
          {createSuccess && (
            <div className="mb-4 rounded-md bg-green-900/30 p-3 text-sm text-green-400">{createSuccess}</div>
          )}
          <form onSubmit={handleCreateTenant} className="space-y-4" autoComplete="off">
            {/* Fake inputs to trick browser autofill */}
            <input type="text" style={{display: 'none'}} />
            <input type="password" style={{display: 'none'}} />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Nombre de la Empresa</label>
                <input
                  type="text"
                  required
                  value={newTenantName}
                  onChange={(e) => setNewTenantName(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
                  placeholder="Mi Empresa S.A."
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Moneda</label>
                <select
                  value={newTenantCurrency}
                  onChange={(e) => setNewTenantCurrency(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
                >
                  <option value="USD">Dólar Estadounidense (USD)</option>
                  <option value="COP">Peso Colombiano (COP)</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Sector</label>
                <input
                  type="text"
                  value={newTenantSector}
                  onChange={(e) => setNewTenantSector(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
                  placeholder="Ej. Salud, Tecnología..."
                />
              </div>
            </div>
            
            <div className="border-t border-zinc-100 pt-4">
              <h4 className="mb-3 text-sm font-medium text-zinc-900">Datos del Administrador Inicial</h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                 <div>
                   <label className="mb-1 block text-sm font-medium text-zinc-700">Nombre</label>
                   <input
                     type="text"
                     required
                     value={adminFirstName}
                     onChange={(e) => setAdminFirstName(e.target.value)}
                     className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                   />
                 </div>
                 <div>
                   <label className="mb-1 block text-sm font-medium text-zinc-700">Apellido</label>
                   <input
                     type="text"
                     required
                     value={adminLastName}
                     onChange={(e) => setAdminLastName(e.target.value)}
                     className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                   />
                 </div>
                 <div>
                   <label className="mb-1 block text-sm font-medium text-zinc-700">Email</label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                  autoComplete="new-password"
                  name="random-email-field"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Contraseña</label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                  autoComplete="new-password"
                  name="random-password-field"
                />
                 </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={creating}
                className="rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600 disabled:opacity-50"
              >
                {creating ? "Creando..." : "Registrar Empresa"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-slate-500">Cargando empresas...</div>
      ) : error ? (
        <div className="text-red-400">{error}</div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-700 bg-slate-800 shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">ID Tenant</th>
                <th className="px-4 py-3 font-medium">Usuarios Totales</th>
                <th className="px-4 py-3 font-medium">Usuarios Activos</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {tenants.map((tenant) => (
                <tr key={tenant.tenantId} className="hover:bg-slate-700/50">
                  <td className="px-4 py-3 font-medium text-slate-200">{tenant.tenantId}</td>
                  <td className="px-4 py-3 text-slate-400">{tenant.totalUsers}</td>
                  <td className="px-4 py-3 text-slate-400">{tenant.activeUsers}</td>
                  <td className="px-4 py-3">
                    <button 
                      onClick={() => onManage(tenant.tenantId)}
                      className="text-slate-500 hover:text-slate-300"
                    >
                      Gestionar
                    </button>
                  </td>
                </tr>
              ))}
              {tenants.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    No hay empresas registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
