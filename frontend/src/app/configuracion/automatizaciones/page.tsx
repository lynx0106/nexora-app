"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { fetchAPIWithAuth } from '@/lib/api';

interface Automation {
  id: string;
  name: string;
  type: string;
  description: string | null;
  enabled: boolean;
  schedule: string | null;
  config: Record<string, unknown>;
  lastRunAt: string | null;
  nextRunAt: string | null;
  createdAt: string;
}


const automationTypes = {
  reminder: { label: 'Recordatorio de Citas', icon: '📅', color: 'bg-blue-900/40 text-blue-200' },
  bulk_message: { label: 'Mensaje Masivo', icon: '📢', color: 'bg-purple-900/40 text-purple-200' },
  individual_message: { label: 'Mensaje Individual', icon: '💬', color: 'bg-green-900/40 text-green-200' },
  cleanup: { label: 'Limpieza', icon: '🧹', color: 'bg-orange-900/40 text-orange-200' },
};

const scheduleOptions = [
  { value: '0 * * * *', label: 'Cada hora' },
  { value: '0 0 * * *', label: 'Diario a medianoche' },
  { value: '0 9 * * *', label: 'Diario a las 9:00 AM' },
  { value: '0 9 * * 1', label: 'Cada lunes a las 9:00 AM' },
  { value: '0 0 1 * *', label: 'El primer día del mes' },
];

export default function AutomatizacionesPage() {
  const { t } = useTranslation();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<Automation | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'reminder',
    description: '',
    enabled: true,
    schedule: '0 * * * *',
    config: {
      hoursBefore: [24, 2],
      channels: ['email'],
      target: 'all_clients',
      message: '',
      tasks: ['expired_tokens'],
    },
  });

  useEffect(() => {
    loadAutomations();
  }, []);

  const loadAutomations = async () => {
    try {
      const data = await fetchAPIWithAuth('/automations');
      setAutomations(data);
    } catch (error) {
      console.error('Error loading automations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingAutomation) {
        await fetchAPIWithAuth(`/automations/${editingAutomation.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            ...formData,
            config: formData.config,
          }),
        });
      } else {
        await fetchAPIWithAuth('/automations', {
          method: 'POST',
          body: JSON.stringify({
            ...formData,
            config: formData.config,
          }),
        });
      }
      
      setShowModal(false);
      setEditingAutomation(null);
      resetForm();
      loadAutomations();
    } catch (error) {
      console.error('Error saving automation:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'reminder',
      description: '',
      enabled: true,
      schedule: '0 * * * *',
      config: {
        hoursBefore: [24, 2],
        channels: ['email'],
        target: 'all_clients',
        message: '',
        tasks: ['expired_tokens'],
      },
    });
  };

  const handleEdit = (automation: Automation) => {
    setEditingAutomation(automation);
    const defaultConfig = {
      hoursBefore: [24, 2],
      channels: ['email'],
      target: 'all_clients',
      message: '',
      tasks: ['expired_tokens'],
    };
    setFormData({
      name: automation.name,
      type: automation.type,
      description: automation.description || '',
      enabled: automation.enabled,
      schedule: automation.schedule || '0 * * * *',
      config: { ...defaultConfig, ...(automation.config || {}) },
    });
    setShowModal(true);
  };

  const handleToggle = async (id: string) => {
    try {
      await fetchAPIWithAuth(`/automations/${id}/toggle`, { method: 'POST' });
      loadAutomations();
    } catch (error) {
      console.error('Error toggling automation:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta automatización?')) return;
    
    try {
      await fetchAPIWithAuth(`/automations/${id}`, { method: 'DELETE' });
      loadAutomations();
    } catch (error) {
      console.error('Error deleting automation:', error);
    }
  };

  const handleRunNow = async (id: string) => {
    try {
      await fetchAPIWithAuth(`/automations/${id}/run`, { method: 'POST' });
      loadAutomations();
    } catch (error) {
      console.error('Error running automation:', error);
    }
  };

  const openNewModal = () => {
    setEditingAutomation(null);
    resetForm();
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-12">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between border-b border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <Link
              href="/configuracion"
              className="group flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 shadow-sm ring-1 ring-slate-700 transition-all hover:bg-slate-800"
            >
              <span className="transition-transform group-hover:-translate-x-1">←</span>
              {t('config.back')}
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
                Automatizaciones
              </h1>
              <p className="text-sm text-slate-400">
                Configura recordatorios, mensajes automáticos y tareas de mantenimiento
              </p>
            </div>
          </div>
          <button
            onClick={openNewModal}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
          >
            <span>+</span>
            Nueva Automatización
          </button>
        </header>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
          </div>
        ) : automations.length === 0 ? (
          <div className="rounded-xl bg-slate-900/70 p-12 text-center ring-1 ring-slate-800">
            <div className="mb-4 text-4xl">🤖</div>
            <h2 className="mb-2 text-lg font-semibold text-slate-100">
              No hay automatizaciones configuradas
            </h2>
            <p className="mb-6 text-slate-400">
              Crea tu primera automatización para comenzar a automatizar tareas
            </p>
            <button
              onClick={openNewModal}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
            >
              <span>+</span>
              Crear Automatización
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {automations.map((automation) => {
              const typeInfo = automationTypes[automation.type as keyof typeof automationTypes] || automationTypes.reminder;
              return (
                <div
                  key={automation.id}
                  className="rounded-xl bg-slate-900/70 p-6 ring-1 ring-slate-800 transition-all hover:ring-slate-700"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${typeInfo.color}`}>
                        <span className="text-2xl">{typeInfo.icon}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-slate-100">
                            {automation.name}
                          </h3>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              automation.enabled
                                ? 'bg-green-900/40 text-green-200'
                                : 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            {automation.enabled ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-400">
                          {typeInfo.label}
                          {automation.description && ` • ${automation.description}`}
                        </p>
                        <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                          <span>
                            Programación: {scheduleOptions.find(s => s.value === automation.schedule)?.label || automation.schedule || 'Cada hora'}
                          </span>
                          {automation.lastRunAt && (
                            <span>Última ejecución: {new Date(automation.lastRunAt).toLocaleString('es-CO')}</span>
                          )}
                          {automation.nextRunAt && (
                            <span>Próxima: {new Date(automation.nextRunAt).toLocaleString('es-CO')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggle(automation.id)}
                        className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700"
                      >
                        {automation.enabled ? 'Desactivar' : 'Activar'}
                      </button>
                      <button
                        onClick={() => handleRunNow(automation.id)}
                        className="rounded-lg bg-blue-900/40 px-3 py-1.5 text-sm font-medium text-blue-200 transition-colors hover:bg-blue-900/60"
                      >
                        Ejecutar
                      </button>
                      <button
                        onClick={() => handleEdit(automation)}
                        className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(automation.id)}
                        className="rounded-lg bg-red-900/20 px-3 py-1.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-900/40"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-lg rounded-xl bg-slate-900 p-6 ring-1 ring-slate-800">
              <h2 className="mb-6 text-xl font-bold text-slate-100">
                {editingAutomation ? 'Editar Automatización' : 'Nueva Automatización'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">
                    Tipo
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
                  >
                    {Object.entries(automationTypes).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value.icon} {value.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">
                    Descripción
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
                    placeholder="Descripción opcional..."
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">
                    Programación
                  </label>
                  <select
                    value={formData.schedule}
                    onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
                  >
                    {scheduleOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Configuración específica por tipo */}
                {formData.type === 'reminder' && (
                  <div className="space-y-3 rounded-lg bg-slate-800/50 p-4">
                    <h4 className="text-sm font-medium text-slate-300">Configuración de Recordatorios</h4>
                    <div>
                      <label className="mb-1 block text-xs text-slate-400">
                        Horas antes de la cita
                      </label>
                      <input
                        type="text"
                        value={formData.config.hoursBefore.join(', ')}
                        onChange={(e) => setFormData({
                          ...formData,
                          config: {
                            ...formData.config,
                            hoursBefore: e.target.value.split(',').map(h => parseInt(h.trim()) || 0)
                          }
                        })}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
                        placeholder="24, 2"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {['email', 'whatsapp', 'push'].map((channel) => (
                        <label key={channel} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.config.channels.includes(channel)}
                            onChange={(e) => {
                              const channels = e.target.checked
                                ? [...formData.config.channels, channel]
                                : formData.config.channels.filter((c: string) => c !== channel);
                              setFormData({
                                ...formData,
                                config: { ...formData.config, channels }
                              });
                            }}
                            className="rounded border-slate-600 bg-slate-950 text-emerald-500"
                          />
                          <span className="text-sm text-slate-300">{channel}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {formData.type === 'bulk_message' && (
                  <div className="space-y-3 rounded-lg bg-slate-800/50 p-4">
                    <h4 className="text-sm font-medium text-slate-300">Configuración de Mensaje</h4>
                    <div>
                      <label className="mb-1 block text-xs text-slate-400">Destinatarios</label>
                      <select
                        value={formData.config.target}
                        onChange={(e) => setFormData({
                          ...formData,
                          config: { ...formData.config, target: e.target.value }
                        })}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
                      >
                        <option value="all_clients">Todos los clientes</option>
                        <option value="active_clients">Clientes activos</option>
                        <option value="vip_clients">Clientes VIP</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-400">Mensaje</label>
                      <textarea
                        value={formData.config.message}
                        onChange={(e) => setFormData({
                          ...formData,
                          config: { ...formData.config, message: e.target.value }
                        })}
                        rows={3}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
                        placeholder="Hola {clientName}, tenemos una promoción especial..."
                      />
                    </div>
                  </div>
                )}

                {formData.type === 'cleanup' && (
                  <div className="space-y-3 rounded-lg bg-slate-800/50 p-4">
                    <h4 className="text-sm font-medium text-slate-300">Tareas de Limpieza</h4>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { key: 'expired_tokens', label: 'Tokens expirados' },
                        { key: 'old_messages', label: 'Mensajes antiguos' },
                        { key: 'inactive_clients', label: 'Clientes inactivos' },
                      ].map((task) => (
                        <label key={task.key} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.config.tasks.includes(task.key)}
                            onChange={(e) => {
                              const tasks = e.target.checked
                                ? [...formData.config.tasks, task.key]
                                : formData.config.tasks.filter((t: string) => t !== task.key);
                              setFormData({
                                ...formData,
                                config: { ...formData.config, tasks }
                              });
                            }}
                            className="rounded border-slate-600 bg-slate-950 text-emerald-500"
                          />
                          <span className="text-sm text-slate-300">{task.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enabled"
                    checked={formData.enabled}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                    className="rounded border-slate-600 bg-slate-950 text-emerald-500"
                  />
                  <label htmlFor="enabled" className="text-sm text-slate-300">
                    Activar automatización inmediatamente
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingAutomation(null);
                    }}
                    className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
                  >
                    {editingAutomation ? 'Guardar Cambios' : 'Crear Automatización'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
