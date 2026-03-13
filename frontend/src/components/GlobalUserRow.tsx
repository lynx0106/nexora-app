import { useState } from 'react';
import { fetchAPIWithAuth } from '../lib/api';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
  isActive: boolean;
  tenantId?: string;
}

interface GlobalUserRowProps {
  user: User;
  onUpdate: (user: User) => void;
}

const ROLES = [
  { value: 'superadmin', label: 'Superadmin', description: 'Acceso total al sistema' },
  { value: 'admin', label: 'Admin', description: 'Gestión del negocio' },
  { value: 'employee', label: 'Employee', description: 'Empleado con acceso limitado' },
  { value: 'client', label: 'Cliente', description: 'Cliente del negocio' },
  { value: 'client', label: 'Cliente Externo', description: 'Cliente que compra productos' },
];

export function GlobalUserRow({ user, onUpdate }: GlobalUserRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedRole, setSelectedRole] = useState(user.role || 'client');
  const [isActive, setIsActive] = useState(user.isActive);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await fetchAPIWithAuth(`/users/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          role: selectedRole,
          isActive,
        }),
      });
      onUpdate({ ...user, role: selectedRole, isActive });
      setIsEditing(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setSelectedRole(user.role || 'client');
    setIsActive(user.isActive);
    setIsEditing(false);
    setError(null);
  };

  if (isEditing) {
    return (
      <tr className="border-b border-zinc-100 bg-indigo-50">
        <td className="py-2 pr-4 font-mono text-xs">{user.tenantId || '-'}</td>
        <td className="py-2 pr-4">{user.firstName} {user.lastName}</td>
        <td className="py-2 pr-4 text-sm">{user.email}</td>
        <td className="py-2 pr-4">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="rounded border border-zinc-300 px-2 py-1 text-sm"
            disabled={isSaving}
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </td>
        <td className="py-2 pr-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              disabled={isSaving}
              className="rounded"
            />
            <span className="text-sm">{isActive ? 'Activo' : 'Inactivo'}</span>
          </label>
        </td>
        <td className="py-2 pr-4">
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="rounded bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700 disabled:opacity-50"
            >
              {isSaving ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="rounded bg-gray-400 px-3 py-1 text-xs text-white hover:bg-gray-500 disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
      <td className="py-2 pr-4 font-mono text-xs">{user.tenantId || '-'}</td>
      <td className="py-2 pr-4">{user.firstName} {user.lastName}</td>
      <td className="py-2 pr-4 text-sm">{user.email}</td>
      <td className="py-2 pr-4">
        <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
          user.role === 'superadmin' ? 'bg-purple-100 text-purple-700' :
          user.role === 'admin' ? 'bg-blue-100 text-blue-700' :
          user.role === 'employee' ? 'bg-green-100 text-green-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {(user.role || 'client').toUpperCase()}
        </span>
      </td>
      <td className="py-2 pr-4">
        <span className={`text-sm ${user.isActive ? 'text-green-600' : 'text-red-600'}`}>
          {user.isActive ? 'Activo' : 'Inactivo'}
        </span>
      </td>
      <td className="py-2 pr-4">
        <button
          onClick={() => setIsEditing(true)}
          className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
        >
          Editar
        </button>
      </td>
    </tr>
  );
}
