import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { fetchAPIWithAuth } from "../lib/api";

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

interface TeamSectionProps {
  role: string | null;
  tenantId: string;
  selectedTenantId: string | null;
  onTenantChange: (id: string | null) => void;
  tenants: { id: string; name: string }[];
  tenantSector?: string | null;
}

export function TeamSection({ role, tenantId, selectedTenantId, onTenantChange, tenants, tenantSector }: TeamSectionProps) {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRestaurant = (tenantSector || '').toLowerCase().includes('restaurante');

  // Form states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  
  const [newUserFirstName, setNewUserFirstName] = useState("");
  const [newUserLastName, setNewUserLastName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"admin" | "doctor" | "support" | "user">("admin");
  const [newUserPhone, setNewUserPhone] = useState("");
  const [newUserAddress, setNewUserAddress] = useState("");
  
  const [creatingUser, setCreatingUser] = useState(false);
  const [createUserError, setCreateUserError] = useState<string | null>(null);
  const [createUserSuccess, setCreateUserSuccess] = useState<string | null>(null);

  const resetForm = () => {
    setEditingUserId(null);
    setNewUserFirstName("");
    setNewUserLastName("");
    setNewUserEmail("");
    setNewUserPassword("");
    setNewUserRole("admin");
    setNewUserPhone("");
    setNewUserAddress("");
    setCreateUserError(null);
    setCreateUserSuccess(null);
  };

  useEffect(() => {
    fetchUsers();
  }, [role, selectedTenantId]);

  function fetchUsers() {
    setLoading(true);
    setError(null);
    
    const tenantIdToUse = (role === 'superadmin' && selectedTenantId) ? selectedTenantId : undefined;
    const fetchUrl = tenantIdToUse ? `/users/tenant/${tenantIdToUse}` : "/users";

    fetchAPIWithAuth(fetchUrl)
      .then((data) => {
        setUsers(data ?? []);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Error al cargar equipo");
      })
      .finally(() => {
        setLoading(false);
      });
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setCreatingUser(true);
    setCreateUserError(null);
    setCreateUserSuccess(null);

    try {
      const payload: any = {
        firstName: newUserFirstName,
        lastName: newUserLastName,
        email: newUserEmail,
        role: newUserRole,
        phone: newUserPhone,
        address: newUserAddress,
      };

      if (newUserPassword) {
        payload.password = newUserPassword;
      }

      if (role === "superadmin" && selectedTenantId) {
        payload.tenantId = selectedTenantId;
      }

      let url = "/users";
      let method = "POST";

      if (editingUserId) {
        url = `/users/${editingUserId}`;
        method = "PUT";
      }

      await fetchAPIWithAuth(url, {
        method,
        body: JSON.stringify(payload),
      });

      setCreateUserSuccess(editingUserId ? t('team.success_update') : t('team.success_invite'));
      
      // Reset form
      setNewUserFirstName("");
      setNewUserLastName("");
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserRole("user");
      setNewUserPhone("");
      setNewUserAddress("");
      setShowCreateForm(false);
      setEditingUserId(null);
      
      fetchUsers();
    } catch (error: unknown) {
      setCreateUserError(error instanceof Error ? error.message : t('team.error_save'));
    } finally {
      setCreatingUser(false);
    }
  }

  async function handleDeleteUser(userId: string) {
    if (!confirm("¿Estás seguro de eliminar este miembro del equipo?")) return;
    
    try {
      await fetchAPIWithAuth(`/users/${userId}`, { method: "DELETE" });
      setUsers(users.filter(u => u.id !== userId));
    } catch {
      alert("Error al eliminar usuario");
    }
  }

  function handleEditClick(user: User) {
    setNewUserFirstName(user.firstName);
    setNewUserLastName(user.lastName);
    setNewUserEmail(user.email);
    // Default to admin if role is unknown or user
    const role = (user.role === 'admin' || user.role === 'doctor' || user.role === 'support') 
      ? user.role 
      : 'admin';
    setNewUserRole(role as "admin" | "doctor" | "support");
    setNewUserAddress(user.address || "");
    setNewUserPhone(user.phone || "");
    setNewUserPassword("");
    setEditingUserId(user.id);
    setShowCreateForm(true);
    setCreateUserError(null);
    setCreateUserSuccess(null);
  }

  const teamMembers = users.filter(u => u.role !== 'user');

  return (
    <div className="mb-8 rounded-lg bg-white p-6 shadow">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold text-zinc-900">{t('team.title')}</h2>
          <p className="text-sm text-zinc-500">
            {isRestaurant 
              ? t('team.subtitle_restaurant')
              : t('team.subtitle_service')}
          </p>
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
          {showCreateForm ? t('team.cancel') : t('team.new_member')}
        </button>
      </div>

      {role === "superadmin" && (
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-md bg-zinc-50 p-3">
          <span className="text-xs font-medium text-zinc-700">
            {t('team.tenant_manage')}:
          </span>
          <select
            value={selectedTenantId ?? ""}
            onChange={(e) => onTenantChange(e.target.value === "" ? null : e.target.value)}
            className="h-9 rounded-md border border-zinc-300 bg-white px-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
          >
            <option value="">{t('team.my_tenant')}</option>
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="mt-6 space-y-6">
        {showCreateForm && (
          <form
            className="grid gap-4 rounded-md border border-zinc-200 p-4 md:grid-cols-2"
            onSubmit={handleCreateUser}
          >
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-zinc-900">{t('team.form_first_name')}</label>
              <input
                type="text"
                value={newUserFirstName}
                onChange={(e) => setNewUserFirstName(e.target.value)}
                required
                placeholder={t('team.placeholder_first_name')}
                className="h-9 rounded-md border border-zinc-400 px-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-zinc-900">{t('team.form_last_name')}</label>
              <input
                type="text"
                value={newUserLastName}
                onChange={(e) => setNewUserLastName(e.target.value)}
                required
                placeholder={t('team.placeholder_last_name')}
                className="h-9 rounded-md border border-zinc-400 px-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-zinc-900">{t('team.form_email')}</label>
              <input
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                required
                placeholder={t('team.placeholder_email')}
                className="h-9 rounded-md border border-zinc-400 px-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-zinc-900">{t('team.form_phone')}</label>
              <input
                type="tel"
                value={newUserPhone}
                onChange={(e) => setNewUserPhone(e.target.value)}
                placeholder="+34 600 000 000"
                className="h-9 rounded-md border border-zinc-400 px-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-zinc-900">{t('team.form_address')}</label>
              <input
                type="text"
                value={newUserAddress}
                onChange={(e) => setNewUserAddress(e.target.value)}
                placeholder={t('team.placeholder_address')}
                className="h-9 rounded-md border border-zinc-400 px-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-zinc-900">
                {t('team.form_password')} {editingUserId && <span className="text-xs font-normal text-zinc-700">{t('team.form_password_optional')}</span>}
              </label>
              <input
                type="password"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                required={!editingUserId}
                placeholder={editingUserId ? t('team.placeholder_password_edit') : t('team.placeholder_password_new')}
                className="h-9 rounded-md border border-zinc-400 px-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-zinc-900">{t('team.form_role')}</label>
              <select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value as "admin" | "doctor" | "support")}
                className="h-9 rounded-md border border-zinc-400 px-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
              >
                <option value="admin">{t('team.role_option_admin')}</option>
                <option value="doctor">{isRestaurant ? t('team.role_option_doctor_restaurant') : t('team.role_option_doctor_service')}</option>
                <option value="support">{isRestaurant ? t('team.role_option_support_restaurant') : t('team.role_option_support_service')}</option>
              </select>
            </div>
            <div className="md:col-span-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setNewUserFirstName("");
                  setNewUserLastName("");
                  setNewUserEmail("");
                  setNewUserPassword("");
                  setNewUserRole("admin");
                  setNewUserPhone("");
                  setNewUserAddress("");
                  setEditingUserId(null);
                }}
                className="h-9 rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                {t('team.clean')}
              </button>
              <button
                type="submit"
                disabled={creatingUser}
                className="h-9 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
              >
                {creatingUser
                  ? t('team.saving')
                  : editingUserId
                  ? t('team.save_changes')
                  : t('team.send_invite')}
              </button>
            </div>
          </form>
        )}

        {createUserError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {createUserError}
          </div>
        )}

        {createUserSuccess && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {createUserSuccess}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-zinc-700">{t('team.table_name')}</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-700">{t('team.table_email')}</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-700">{t('team.table_phone')}</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-700">{t('team.table_permissions')}</th>
                {role !== 'user' && (
                  <>
                <th className="px-3 py-2 text-left font-medium text-zinc-700">{t('team.table_status')}</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-700">{t('team.table_actions')}</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {loading && (
                <tr><td colSpan={role === 'user' ? 4 : 6} className="px-3 py-3 text-center text-zinc-700">{t('team.loading')}</td></tr>
              )}
              {error && !loading && (
                <tr><td colSpan={role === 'user' ? 4 : 6} className="px-3 py-3 text-center text-red-600">{error}</td></tr>
              )}
              {!loading && !error && teamMembers.length === 0 && (
                <tr><td colSpan={role === 'user' ? 4 : 6} className="px-3 py-3 text-center text-zinc-700">{t('team.no_members')}</td></tr>
              )}
              {!loading && !error && teamMembers.map((user) => (
                <tr key={user.id}>
                  <td className="px-3 py-2 text-zinc-900">{user.firstName} {user.lastName}</td>
                  <td className="px-3 py-2 text-zinc-700">{user.email}</td>
                  <td className="px-3 py-2 text-zinc-700">{user.phone || '-'}</td>
                  <td className="px-3 py-2 text-zinc-700">
                    {user.role === 'doctor' 
                      ? (isRestaurant ? t('team.role_staff') : t('team.role_professional')) 
                      : user.role === 'support' 
                        ? (isRestaurant ? t('team.role_cashier') : t('team.role_support')) 
                        : t('team.role_admin')}
                  </td>
                  {(role === 'admin' || role === 'superadmin') && (
                    <>
                  <td className="px-3 py-2">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${user.isActive ? "bg-emerald-100 text-emerald-800" : "bg-zinc-100 text-zinc-700"}`}>
                      {user.isActive ? t('team.active') : t('team.inactive')}
                    </span>
                  </td>
                  <td className="px-3 py-2 flex items-center gap-3">
                    <button onClick={() => handleEditClick(user)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">{t('common.edit')}</button>
                    <button onClick={() => handleDeleteUser(user.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">{t('common.delete')}</button>
                  </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
