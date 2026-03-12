import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchAPIWithAuth } from '../lib/api';

interface AuditLog {
  id: string;
  tenantId: string;
  userId?: string;
  userEmail?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}

export function AuditSection() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await fetchAPIWithAuth('/audit?limit=100');
      setLogs(data || []);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-100">{t('audit.title')}</h2>
        <button
          onClick={fetchLogs}
          className="inline-flex items-center px-4 py-2 border border-slate-600 text-sm font-medium rounded-md text-slate-300 bg-slate-800 hover:bg-slate-700"
        >
          {t('audit.refresh')}
        </button>
      </div>

      <div className="bg-slate-900/70 border border-slate-800 shadow-sm overflow-hidden sm:rounded-lg">
        {loading ? (
          <div className="p-6 text-center text-slate-400">{t('audit.loading')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">{t('audit.date')}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">{t('audit.user')}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">{t('audit.action')}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">{t('audit.entity')}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">{t('audit.details')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-slate-400">
                      {t('audit.no_logs')}
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-100">
                        {log.userEmail || t('audit.system')}
                        {log.ipAddress && <div className="text-xs text-slate-400">{log.ipAddress}</div>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          log.action === 'DELETE' ? 'bg-red-900/40 text-red-300' :
                          log.action === 'POST' ? 'bg-emerald-900/40 text-emerald-300' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                        {log.entityType} <span className="text-xs text-slate-400">#{log.entityId}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400 max-w-xs truncate" title={log.details}>
                        {log.details}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
